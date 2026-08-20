import { websiteAnalyzer } from './websiteAnalyzer.js';
import { aiAuditor } from './aiAuditor.js';
import { OutreachTone } from '../types/scorer.js';
import { PdfReportGenerator } from '../utils/pdfGenerator.js';
import { Business } from '../types/business.js';
import fs from 'fs';
import path from 'path';

interface CliArgs {
  url?: string;
  category?: string;
  area?: string;
  tone?: OutreachTone;
  report?: boolean;
}

function parseCliArgs(): CliArgs {
  const args: CliArgs = {};
  const raw = process.argv.slice(2);

  for (const arg of raw) {
    if (arg.startsWith('--url=')) {
      args.url = arg.replace('--url=', '').trim();
    } else if (arg.startsWith('--category=')) {
      args.category = arg.replace('--category=', '').trim();
    } else if (arg.startsWith('--area=')) {
      args.area = arg.replace('--area=', '').trim();
    } else if (arg.startsWith('--tone=')) {
      const val = arg.replace('--tone=', '').trim().toLowerCase();
      if (['consultative', 'direct', 'casual', 'urgent'].includes(val)) {
        args.tone = val as OutreachTone;
      }
    } else if (arg === '--report') {
      args.report = true;
    }
  }

  return args;
}

async function runAuditCli() {
  const cliArgs = parseCliArgs();
  const url = cliArgs.url || 'https://example.com';
  const category = cliArgs.category || 'Local Business';
  const area = cliArgs.area || 'Umhlanga';
  const tone = cliArgs.tone || 'consultative';
  const saveReport = cliArgs.report || false;

  console.log(`
┌──────────────────────────────────────────────────────────┐
│      LeadGremlin - Website Technical Audit & AI Pitch     │
└──────────────────────────────────────────────────────────┘
Target Website : ${url}
Category       : ${category}
Area           : ${area}
Outreach Tone  : ${tone}
`);

  try {
    console.log('🔍 Executing technical website audit...');
    const result = await websiteAnalyzer.analyzeWebsite(url);
    const audit = result.audit;

    console.log(`
============================================================
TECHNICAL AUDIT RESULTS
============================================================
Target URL:        ${result.url}
Opportunity Score: ${result.score}/100 (Higher = Bigger Opportunity)
SEO Score:         ${audit.seoScore ?? 'N/A'}/100
Load Speed:        ${audit.loadSpeedSeconds ?? 'N/A'}s
HTTPS SSL:         ${audit.hasHttps ? '✓ Yes' : '❌ Insecure'}
CMS Platform:      ${audit.cms || 'Custom / Unspecified'}
Analytics/Pixels:  ${audit.analyticsDetected.length > 0 ? audit.analyticsDetected.join(', ') : '❌ None Detected'}
Frameworks:        ${audit.frameworks && audit.frameworks.length > 0 ? audit.frameworks.join(', ') : 'Standard HTML'}
Chat Tools:        ${audit.chatTools && audit.chatTools.length > 0 ? audit.chatTools.join(', ') : '❌ None'}
WhatsApp Widget:   ${audit.hasWhatsappLink ? '✓ Present' : '❌ Missing'}
Booking Portal:    ${audit.hasBookingSystem ? '✓ Present' : '❌ Missing'}
Mobile Viewport:   ${audit.hasResponsiveViewport ? '✓ Responsive' : '❌ Non-Responsive'}
OpenGraph Image:   ${audit.openGraph?.hasOgImage ? '✓ Yes' : '❌ Missing'}
`);

    console.log('🤖 Generating category-tailored AI multi-channel outreach pitch...');
    const bName = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const aiOutput = await aiAuditor.generateAudit({
      businessName: bName,
      websiteUrl: result.url,
      category,
      area,
      rating: 4.8,
      reviewCount: 42,
      technicalAudit: audit,
      tone,
    });

    console.log(`
============================================================
AI OUTREACH & VALUE BREAKDOWN
============================================================
Est. Project Deal Value: R${aiOutput.estimatedProjectValueZAR.toLocaleString()}

IDENTIFIED GAPS (${aiOutput.issues.length}):
${aiOutput.issues.map((issue) => ` • ${issue}`).join('\n')}

RECOMMENDED UPGRADES (${aiOutput.recommendations.length}):
${aiOutput.recommendations.map((rec) => ` • ${rec}`).join('\n')}

------------------------------------------------------------
EMAIL OUTREACH SCRIPT (${tone.toUpperCase()} TONE)
------------------------------------------------------------
Subject: ${aiOutput.multiChannelScripts?.email.subject}

${aiOutput.multiChannelScripts?.email.body}

------------------------------------------------------------
WHATSAPP INSTANT PITCH
------------------------------------------------------------
${aiOutput.multiChannelScripts?.whatsapp}

============================================================
`);

    if (saveReport) {
      const mockLead: Business = {
        id: 'cli_audit',
        name: bName,
        category: category as any,
        area,
        website: result.url,
        socials: {},
        funnelStage: 'new',
        opportunityScore: result.score,
        estimatedDealValue: aiOutput.estimatedProjectValueZAR,
        technicalAudit: audit,
        aiPitchScripts: aiOutput.multiChannelScripts,
        notes: `Audit: ${aiOutput.issues.join(' | ')}`,
        scrapedAt: new Date().toISOString(),
        source: 'manual',
      };

      const htmlReport = PdfReportGenerator.generateHtmlReport(mockLead);
      const reportsDir = path.resolve(process.cwd(), './data/reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const reportPath = path.join(reportsDir, `audit_${bName.replace(/[^a-zA-Z0-9]/g, '_')}.html`);
      fs.writeFileSync(reportPath, htmlReport, 'utf-8');
      console.log(`📄 Saved Standalone Printable HTML/PDF Audit Report: ${reportPath}`);
    }
  } catch (err) {
    console.error('Audit execution error:', err);
    process.exit(1);
  }
}

runAuditCli();
