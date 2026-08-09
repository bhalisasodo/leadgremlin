import { TechnicalAudit, WebsiteScoreResult } from '../types/scorer.js';
import { logger } from '../utils/logger.js';

/**
 * Technical Website Analyzer & Opportunity Scorer Engine
 */
export class WebsiteAnalyzer {
  /**
   * Analyzes target website technical features and computes 0-100 Lead Opportunity Score
   */
  public async analyzeWebsite(url: string, existingHtml?: string): Promise<WebsiteScoreResult> {
    logger.info(`Analyzing website technical features for: ${url}`);

    if (!url || typeof url !== 'string') {
      return this.createFallbackResult(url || '', 50);
    }

    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      let html = existingHtml || '';
      let loadSpeedSeconds = 1.0;

      if (!html) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const startTime = Date.now();
        const response = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }).catch(() => null);

        clearTimeout(timeoutId);
        loadSpeedSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

        if (!response || !response.ok) {
          // Site unreachable or failed - high opportunity score (needs web revamp/fix)
          return this.createFallbackResult(targetUrl, 85);
        }

        html = await response.text();
      }
      const hasHttps = targetUrl.startsWith('https://');

      // Contact Form Detection
      const hasContactForm = /<form/i.test(html) || /contact|inquiry|message|submit/i.test(html);

      // Online Booking Engine Detection
      const hasBookingSystem =
        /calendly\.com|fresha\.com|booksy\.com|mindbodyonline\.com|simplybook\.me|setmore\.com|book-now|schedule-appointment|online-booking/i.test(
          html
        );

      // WhatsApp CTA Detection
      const hasWhatsappLink =
        /wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(html) || /send\?phone=/i.test(html);

      // Mobile Viewport Meta Tag
      const hasResponsiveViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

      // Favicon Detection
      const hasFavicon = /rel=["'](?:shortcut )?icon["']/i.test(html);

      // Social Links Extractions
      const socialLinks: TechnicalAudit['socialLinks'] = {};
      const fbMatch = html.match(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"']+)["']/i);
      if (fbMatch) socialLinks.facebook = fbMatch[1];

      const instaMatch = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/i);
      if (instaMatch) socialLinks.instagram = instaMatch[1];

      const liMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"']+)["']/i);
      if (liMatch) socialLinks.linkedin = liMatch[1];

      // Extract Meta Title & Meta Description
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const metaTitle = titleMatch ? titleMatch[1].trim() : undefined;

      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const metaDescription = descMatch ? descMatch[1].trim() : undefined;

      const audit: TechnicalAudit = {
        hasHttps,
        loadSpeedSeconds,
        hasContactForm,
        hasBookingSystem,
        hasWhatsappLink,
        socialLinks,
        analyticsDetected: [],
        metaTitle,
        metaDescription,
        hasFavicon,
        hasResponsiveViewport,
      };

      // Calculate Lead Opportunity Score (0 to 100)
      // Base score = 40. Missing high-converting features increases opportunity score!
      let opportunityScore = 40;

      if (!hasWhatsappLink) opportunityScore += 20; // +20 if missing WhatsApp widget
      if (!hasBookingSystem) opportunityScore += 15; // +15 if missing booking portal
      if (!hasResponsiveViewport) opportunityScore += 15; // +15 if missing mobile layout
      if (!hasHttps) opportunityScore += 10; // +10 if insecure HTTP
      if (!hasContactForm) opportunityScore += 10; // +10 if missing contact form

      // Cap score between 0 and 100
      opportunityScore = Math.min(100, Math.max(10, opportunityScore));

      return {
        url: targetUrl,
        score: opportunityScore,
        audit,
        scrapedAt: new Date().toISOString(),
      };
    } catch (err) {
      logger.warn(`Site audit fetch failed for ${targetUrl}: ${String(err)}`);
      return this.createFallbackResult(targetUrl, 75);
    }
  }

  private createFallbackResult(url: string, defaultScore: number): WebsiteScoreResult {
    return {
      url,
      score: defaultScore,
      audit: {
        hasHttps: url.startsWith('https://'),
        loadSpeedSeconds: 2.5,
        hasContactForm: false,
        hasBookingSystem: false,
        hasWhatsappLink: false,
        socialLinks: {},
        analyticsDetected: [],
        hasFavicon: false,
        hasResponsiveViewport: false,
      },
      scrapedAt: new Date().toISOString(),
    };
  }
}

export const websiteAnalyzer = new WebsiteAnalyzer();
