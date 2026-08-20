import { WebhookNotifier } from './webhookNotifier.js';
import { SequenceEngine } from './sequenceEngine.js';
import { SequenceExporter } from './sequenceExporter.js';
import { Business } from '../types/business.js';
import { SequenceArchetype } from '../types/outreach.js';
import { OutreachTone } from '../types/scorer.js';
import fs from 'fs';
import path from 'path';

interface CliArgs {
  testWebhook?: boolean;
  webhookUrl?: string;
  previewSequence?: boolean;
  listArchetypes?: boolean;
  archetype?: SequenceArchetype;
  tone?: OutreachTone;
  businessName?: string;
  category?: string;
  area?: string;
  website?: string;
  exportCsv?: string;
  exportJson?: string;
  exportMd?: string;
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
    } else if (arg === '--list-archetypes' || arg === '--archetypes') {
      args.listArchetypes = true;
    } else if (arg.startsWith('--archetype=')) {
      args.archetype = arg.replace('--archetype=', '').trim() as SequenceArchetype;
    } else if (arg.startsWith('--tone=')) {
      args.tone = arg.replace('--tone=', '').trim().toLowerCase() as OutreachTone;
    } else if (arg.startsWith('--name=')) {
      args.businessName = arg.replace('--name=', '').trim();
    } else if (arg.startsWith('--category=')) {
      args.category = arg.replace('--category=', '').trim();
    } else if (arg.startsWith('--area=')) {
      args.area = arg.replace('--area=', '').trim();
    } else if (arg.startsWith('--website=')) {
      args.website = arg.replace('--website=', '').trim();
    } else if (arg.startsWith('--export-csv=')) {
      args.exportCsv = arg.replace('--export-csv=', '').trim();
    } else if (arg.startsWith('--export-json=')) {
      args.exportJson = arg.replace('--export-json=', '').trim();
    } else if (arg.startsWith('--export-md=')) {
      args.exportMd = arg.replace('--export-md=', '').trim();
    }
  }

  return args;
}

async function runOutreachCli() {
  const args = parseCliArgs();

  console.log(`
┌──────────────────────────────────────────────────────────┐
│      LeadGremlin - Multi-Channel Outreach Engine CLI     │
└──────────────────────────────────────────────────────────┘
`);

  if (args.listArchetypes) {
    console.log('📋 AVAILABLE OUTREACH PLAYBOOK ARCHETYPES:\n');
    for (const arch of SequenceEngine.getArchetypes()) {
      console.log(`${arch.emoji}  ${arch.name.toUpperCase()} (ID: ${arch.id})`);
      console.log(`   Description:   ${arch.description}`);
      console.log(`   Recommended:   ${arch.recommendedFor}`);
      console.log(`   Touchpoints:   ${arch.touchpointCount} steps over ${arch.durationDays} days`);
      console.log(`   Cadence Flow:  ${arch.cadenceSummary}`);
      console.log(`   Channels:      ${arch.channels.map((c) => c.toUpperCase()).join(', ')}`);
      console.log('   ------------------------------------------------------------');
    }
    return;
  }

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
  const archetype: SequenceArchetype = args.archetype || 'omni_channel_blitz';
  const tone: OutreachTone = args.tone || 'consultative';

  const mockLead: Business = {
    id: 'outreach_demo',
    name: args.businessName || 'Sandton Aesthetic Dental Studio',
    category: (args.category || 'Healthcare & Wellness') as any,
    area: args.area || 'Sandton',
    website: args.website || 'https://sandtondentalstudio.co.za',
    phone: '+27 11 883 4500',
    email: 'info@sandtondentalstudio.co.za',
    socials: { instagram: 'https://instagram.com/sandtondentalstudio' },
    rating: 4.9,
    reviewCount: 74,
    funnelStage: 'new',
    opportunityScore: 88,
    estimatedDealValue: 28500,
    technicalAudit: {
      hasHttps: true,
      hasWhatsappLink: false,
      hasBookingSystem: false,
      hasResponsiveViewport: true,
      hasContactForm: true,
      hasFavicon: true,
      socialLinks: { instagram: 'https://instagram.com/sandtondentalstudio' },
      analyticsDetected: [],
      loadSpeedSeconds: 2.1,
    },
    scrapedAt: new Date().toISOString(),
    source: 'manual',
  };

  console.log(`🤖 Generating "${archetype}" Sequence for: ${mockLead.name} (${mockLead.area})`);
  console.log(`   Tone: ${tone.toUpperCase()} | Estimated Value: R${mockLead.estimatedDealValue?.toLocaleString()}\n`);

  const sequence = SequenceEngine.generateSequence(mockLead, archetype, tone);

  console.log(`============================================================`);
  console.log(`${sequence.archetypeEmoji} ${sequence.archetypeName.toUpperCase()}`);
  console.log(`Cadence: ${sequence.totalDurationDays} Days | ${sequence.touchpoints.length} Touchpoints`);
  console.log(`============================================================\n`);

  for (const tp of sequence.touchpoints) {
    console.log(`📌 [STEP ${tp.stepNumber}] ${tp.channelEmoji} ${tp.title} (Delay: Day ${tp.dayDelay})`);
    console.log(`Channel:   ${tp.channel.toUpperCase()}`);
    if (tp.condition) console.log(`Condition: ${tp.condition}`);
    if (tp.subject) console.log(`Subject:   ${tp.subject}`);
    console.log(`------------------------------------------------------------`);
    console.log(tp.body);
    if (tp.actionGuidance) {
      console.log(`\n💡 Rep Action: ${tp.actionGuidance}`);
    }
    if (tp.callBattlecard) {
      console.log(`\n📞 Call Battlecard:`);
      console.log(`   • Opener:    ${tp.callBattlecard.opener}`);
      console.log(`   • Discovery: ${tp.callBattlecard.discovery}`);
      console.log(`   • Objection: ${tp.callBattlecard.objectionHandling}`);
      console.log(`   • Close:     ${tp.callBattlecard.close}`);
    }
    console.log(`============================================================\n`);
  }

  // Handle Export Flags
  if (args.exportCsv) {
    const csvContent = SequenceExporter.toInstantlyCsv([{ lead: mockLead, sequence }]);
    const outPath = path.resolve(process.cwd(), args.exportCsv);
    fs.writeFileSync(outPath, csvContent, 'utf-8');
    console.log(`✓ Exported Instantly/Smartlead CSV to: ${outPath}`);
  }

  if (args.exportJson) {
    const jsonContent = SequenceExporter.toJson(sequence);
    const outPath = path.resolve(process.cwd(), args.exportJson);
    fs.writeFileSync(outPath, jsonContent, 'utf-8');
    console.log(`✓ Exported Automation JSON to: ${outPath}`);
  }

  if (args.exportMd) {
    const mdContent = SequenceExporter.toMarkdown(sequence);
    const outPath = path.resolve(process.cwd(), args.exportMd);
    fs.writeFileSync(outPath, mdContent, 'utf-8');
    console.log(`✓ Exported Markdown Cadence Report to: ${outPath}`);
  }

  if (process.env.WEBHOOK_URL && !args.exportCsv && !args.exportJson) {
    console.log(`📡 Dispatching test lead webhook payload...`);
    await WebhookNotifier.notifyLeadCreated(mockLead);
  }
}

runOutreachCli();
