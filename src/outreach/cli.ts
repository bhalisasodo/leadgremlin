import { WebhookNotifier } from './webhookNotifier.js';
import { EmailSequenceManager } from './emailSequence.js';
import { Business } from '../types/business.js';

interface CliArgs {
  testWebhook?: boolean;
  webhookUrl?: string;
  previewSequence?: boolean;
  businessName?: string;
}

function parseCliArgs(): CliArgs {
  const args: CliArgs = {};
  const raw = process.argv.slice(2);

  for (const arg of raw) {
    if (arg === '--test-webhook') {
      args.testWebhook = true;
    } else if (arg.startsWith('--webhook-url=')) {
      args.webhookUrl = arg.replace('--webhook-url=', '').trim();
    } else if (arg === '--preview-sequence') {
      args.previewSequence = true;
    } else if (arg.startsWith('--name=')) {
      args.businessName = arg.replace('--name=', '').trim();
    }
  }

  return args;
}

async function runOutreachCli() {
  const args = parseCliArgs();

  console.log(`
┌──────────────────────────────────────────────────────────┐
│      LeadGremlin - Outreach & Webhook Engine CLI Tool     │
└──────────────────────────────────────────────────────────┘
`);

  if (args.testWebhook) {
    const targetUrl = args.webhookUrl || process.env.WEBHOOK_URL || 'https://httpbin.org/post';
    console.log(`📡 Testing Webhook Delivery to: ${targetUrl}`);
    const success = await WebhookNotifier.sendTestPing(targetUrl);

    if (success) {
      console.log('✅ Webhook Test Ping Delivered Successfully!');
    } else {
      console.log('❌ Webhook Test Ping Failed.');
    }
    return;
  }

  // Default / preview mode
  const mockLead: Business = {
    id: 'outreach_demo',
    name: args.businessName || 'Durban Beach Fitness',
    category: 'Gym' as any,
    area: 'Umhlanga',
    website: 'https://durbanbeachfitness.co.za',
    phone: '+27 31 561 2233',
    email: 'info@durbanbeachfitness.co.za',
    socials: { instagram: 'https://instagram.com/durbanbeachfitness' },
    rating: 4.9,
    reviewCount: 68,
    funnelStage: 'new',
    opportunityScore: 85,
    estimatedDealValue: 22500,
    scrapedAt: new Date().toISOString(),
    source: 'manual',
  };

  console.log('🤖 Generating 3-Part Automated Outreach Email Sequence...');
  const sequence = EmailSequenceManager.generateSequence(mockLead);

  console.log(`
============================================================
MULTI-STEP DRIP SEQUENCE: ${sequence.businessName} (${sequence.area})
============================================================
`);

  for (const step of sequence.steps) {
    console.log(`📌 ${step.title}`);
    console.log(`Subject: ${step.subject}`);
    console.log(`------------------------------------------------------------`);
    console.log(step.body);
    console.log(`============================================================\n`);
  }

  if (process.env.WEBHOOK_URL) {
    console.log(`📡 Dispatching test lead webhook payload...`);
    await WebhookNotifier.notifyLeadCreated(mockLead);
  } else {
    console.log(`ℹ Webhook dispatch skipped. Set WEBHOOK_URL in .env or run with --test-webhook.`);
  }
}

runOutreachCli();
