import crypto from 'crypto';
import { Business } from '../types/business.js';
import { logger } from '../utils/logger.js';

export interface WebhookPayload {
  event: 'lead.created' | 'lead.enriched' | 'lead.status_updated' | 'test.ping';
  timestamp: string;
  source: string;
  lead?: Partial<Business>;
  message?: string;
}

export class WebhookNotifier {
  /**
   * Generates HMAC-SHA256 signature header if secret is configured
   */
  private static generateSignature(payloadString: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  /**
   * Dispatches JSON webhook payload to process.env.WEBHOOK_URL
   */
  public static async sendWebhook(payload: WebhookPayload, customUrl?: string): Promise<boolean> {
    const webhookUrl = customUrl || process.env.WEBHOOK_URL;
    const secret = process.env.WEBHOOK_SECRET;

    if (!webhookUrl) {
      logger.info('ℹ WEBHOOK_URL not configured. Skipping webhook dispatch.');
      return false;
    }

    const payloadString = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'LeadGremlin-SalesEngine/2.5',
    };

    if (secret) {
      headers['X-LeadGremlin-Signature'] = this.generateSignature(payloadString, secret);
    }

    try {
      logger.info(`📡 Dispatching webhook [${payload.event}] to: ${webhookUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        logger.info(`✓ Webhook delivered successfully! (Status: ${response.status})`);
        return true;
      } else {
        logger.warn(`⚠️ Webhook delivery failed with status: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (err: any) {
      logger.warn(`❌ Webhook dispatch error: ${err.message || String(err)}`);
      return false;
    }
  }

  /**
   * Dispatches notification for a newly created or enriched lead
   */
  public static async notifyLeadCreated(lead: Business): Promise<boolean> {
    return this.sendWebhook({
      event: 'lead.created',
      timestamp: new Date().toISOString(),
      source: 'LeadGremlin Engine',
      lead: {
        id: lead.id,
        name: lead.name,
        category: lead.category,
        area: lead.area,
        website: lead.website,
        email: lead.email,
        phone: lead.phone,
        opportunityScore: lead.opportunityScore,
        estimatedDealValue: lead.estimatedDealValue,
        aiPitchScripts: lead.aiPitchScripts,
        funnelStage: lead.funnelStage,
      },
    });
  }

  /**
   * Dispatches a test ping payload to verify webhook connection
   */
  public static async sendTestPing(customUrl?: string): Promise<boolean> {
    return this.sendWebhook(
      {
        event: 'test.ping',
        timestamp: new Date().toISOString(),
        source: 'LeadGremlin Engine CLI Test',
        message: 'LeadGremlin Webhook Engine Test Connection Successful!',
      },
      customUrl
    );
  }
}
