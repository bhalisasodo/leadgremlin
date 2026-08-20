import { getConfig } from './config/config.js';
import { MultiSourceScraper } from './scraper/multiSourceScraper.js';
import { websiteAnalyzer } from './scoring/websiteAnalyzer.js';
import { aiAuditor } from './scoring/aiAuditor.js';
import { Exporter } from './utils/exporter.js';
import { syncLeadsToNotion } from './notion/sync.js';
import { logger } from './utils/logger.js';
import { Business } from './types/business.js';
import { buildMultiRegionQueries, buildExpandedQueryMatrix } from './config/regions.js';
import { OutreachTone } from './types/scorer.js';
import fs from 'fs';
import path from 'path';

interface ParsedArgs {
  terms?: string[];
  area?: string;
  niches?: string[];
  provinces?: string[];
  useModifiers?: boolean;
  limit?: number;
  headless?: boolean;
  syncNotion?: boolean;
  runAudit?: boolean;
  pitchTone?: OutreachTone;
  concurrency?: number;
  minScore?: number;
  requireContact?: boolean;
}

/**
 * Parse CLI arguments from process.argv
 */
function parseArgs(): ParsedArgs {
  const args: ParsedArgs = {};
  const rawArgs = process.argv.slice(2);

  for (const arg of rawArgs) {
    if (arg.startsWith('--terms=')) {
      const val = arg.replace('--terms=', '').trim();
      args.terms = val.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    } else if (arg.startsWith('--area=') || arg.startsWith('--areas=')) {
      args.area = arg.split('=')[1].trim();
    } else if (arg.startsWith('--niches=') || arg.startsWith('--niche=')) {
      const val = arg.split('=')[1].trim();
      args.niches = val.split(',').map((n) => n.trim()).filter(Boolean);
    } else if (arg.startsWith('--provinces=') || arg.startsWith('--province=')) {
      const val = arg.split('=')[1].trim();
      args.provinces = val.split(',').map((p) => p.trim()).filter(Boolean);
    } else if (arg === '--modifiers' || arg === '--use-modifiers=true') {
      args.useModifiers = true;
    } else if (arg.startsWith('--limit=') || arg.startsWith('-n=')) {
      const num = parseInt(arg.split('=')[1], 10);
      if (!isNaN(num) && num > 0) args.limit = num;
    } else if (arg.startsWith('--headless=')) {
      args.headless = arg.split('=')[1] !== 'false';
    } else if (arg === '--sync-notion') {
      args.syncNotion = true;
    } else if (arg === '--audit') {
      args.runAudit = true;
    } else if (arg.startsWith('--tone=')) {
      const val = arg.replace('--tone=', '').trim().toLowerCase();
      if (['consultative', 'direct', 'casual', 'urgent', 'roi_focused'].includes(val)) {
        args.pitchTone = val as OutreachTone;
      }
    } else if (arg.startsWith('--concurrency=')) {
      const num = parseInt(arg.split('=')[1], 10);
      if (!isNaN(num) && num > 0) args.concurrency = num;
    } else if (arg.startsWith('--min-score=')) {
      const num = parseInt(arg.split('=')[1], 10);
      if (!isNaN(num)) args.minScore = num;
    } else if (arg === '--require-contact') {
      args.requireContact = true;
    }
  }

  return args;
}

async function runPipeline() {
  const startTime = Date.now();
  const baseConfig = getConfig();
  const cliArgs = parseArgs();

  // Combine CLI flags with environment config
  let searchTerms = cliArgs.terms;
  const area = cliArgs.area || 'Umhlanga';
  const areasList = area.split(',').map((a) => a.trim()).filter(Boolean);

  if (!searchTerms || searchTerms.length === 0) {
    if (cliArgs.niches || cliArgs.provinces) {
      searchTerms = buildExpandedQueryMatrix({
        niches: cliArgs.niches,
        provinces: cliArgs.provinces,
        suburbs: areasList.length > 0 && areasList[0] !== 'Umhlanga' ? areasList : undefined,
        useModifiers: cliArgs.useModifiers,
      });
    } else {
      searchTerms = buildExpandedQueryMatrix({
        niches: ['all_high_yield'],
        suburbs: areasList,
      });
    }
  }

  const maxResults = cliArgs.limit || Math.min(baseConfig.maxResults, 10);
  const headless = cliArgs.headless !== undefined ? cliArgs.headless : baseConfig.headless;
  const pitchTone = cliArgs.pitchTone || 'consultative';
  const forceNotionSync = cliArgs.syncNotion || false;
  const concurrency = cliArgs.concurrency || 3;
  const minScore = cliArgs.minScore;
  const requireContact = cliArgs.requireContact || false;

  console.log(`
┌──────────────────────────────────────────────────────────┐
│      LeadGremlin - End-to-End Sales Lead Engine          │
└──────────────────────────────────────────────────────────┘
`);

  logger.info('Pipeline Execution Target Parameters:');
  logger.info(`- Target Area(s): ${areasList.join(', ')}`);
  logger.info(`- Search Terms (${searchTerms.length}): ${searchTerms.slice(0, 5).join(', ')}${searchTerms.length > 5 ? ` ... (+${searchTerms.length - 5} more)` : ''}`);
  logger.info(`- Max Results per term: ${maxResults}`);
  logger.info(`- Headless Browser: ${headless}`);
  logger.info(`- Pitch Tone: ${pitchTone}`);
  logger.info(`- Enrichment Concurrency: ${concurrency}`);
  if (minScore !== undefined) logger.info(`- Min Opportunity Score Filter: ${minScore}`);
  if (requireContact) logger.info(`- Filter: Require Contact (Phone/Email mandatory)`);

  const scraper = new MultiSourceScraper();
  const exporter = new Exporter(baseConfig.outputDir);

  try {
    // PHASE 1: Multi-Source Scraping & Contact Extraction
    logger.info('\n============================================================');
    logger.info('PHASE 1: Multi-Source Lead Scraping & Contact Extraction');
    logger.info('============================================================');

    const { leads: extractedLeads, summary } = await scraper.extractLeads(searchTerms, maxResults, {
      headless,
      includeWebSearch: true,
      includeDeepCrawl: true,
      concurrency,
    });

    // PHASE 2 & 3: Technical Website Auditing & AI Pitch Generation
    logger.info('\n============================================================');
    logger.info('PHASE 2 & 3: Technical Website Auditing & AI Outreach Engine');
    logger.info('============================================================');

    let totalEstimatedValue = 0;
    let highOppCount = 0;
    let medOppCount = 0;
    let lowOppCount = 0;

    for (const lead of extractedLeads) {
      // Perform Technical Website Audit if site exists
      if (lead.website) {
        try {
          const auditResult = await websiteAnalyzer.analyzeWebsite(lead.website);
          lead.opportunityScore = auditResult.score;
          lead.websiteScore = Math.max(10, 100 - auditResult.score);
          lead.technicalAudit = auditResult.audit;
        } catch (auditErr) {
          logger.warn(`Website audit skipped for ${lead.name}: ${String(auditErr)}`);
        }
      }

      // Generate AI Outreach Scripts & Project Value
      try {
        const pitchOutput = await aiAuditor.generateAudit({
          businessName: lead.name,
          websiteUrl: lead.website || '',
          category: lead.category,
          area: lead.area || area,
          rating: lead.rating,
          reviewCount: lead.reviewCount,
          technicalAudit: lead.technicalAudit,
          tone: pitchTone,
        });

        lead.aiPitchScripts = pitchOutput.multiChannelScripts;
        lead.estimatedDealValue = pitchOutput.estimatedProjectValueZAR;
        totalEstimatedValue += pitchOutput.estimatedProjectValueZAR;
      } catch (aiErr) {
        logger.warn(`AI Pitch generation skipped for ${lead.name}: ${String(aiErr)}`);
      }

      const score = lead.opportunityScore || 75;
      if (score >= 70) highOppCount++;
      else if (score >= 40) medOppCount++;
      else lowOppCount++;
    }

    // Load existing dashboard dataset & deduplicate
    const dashboardFile = path.join(baseConfig.outputDir, 'leads_dashboard.json');
    let existingLeads: Business[] = [];
    if (fs.existsSync(dashboardFile)) {
      try {
        existingLeads = JSON.parse(fs.readFileSync(dashboardFile, 'utf-8'));
      } catch {
        existingLeads = [];
      }
    }

    const existingNames = new Set(existingLeads.map((l) => l.name.toLowerCase()));
    let addedCount = 0;

    for (const lead of extractedLeads) {
      // Apply filters if configured
      if (minScore !== undefined && lead.opportunityScore < minScore) {
        logger.info(`Filter skipped lead ${lead.name} (Score ${lead.opportunityScore} < ${minScore})`);
        continue;
      }
      if (requireContact && !lead.phone && !lead.email) {
        logger.info(`Filter skipped lead ${lead.name} (No phone or email)`);
        continue;
      }

      if (!existingNames.has(lead.name.toLowerCase())) {
        existingNames.add(lead.name.toLowerCase());
        existingLeads.unshift(lead);
        addedCount++;
      }
    }

    // Export Updated Datasets
    const exportResult = exporter.save(existingLeads);

    // PHASE 4: Notion CRM Synchronization
    logger.info('\n============================================================');
    logger.info('PHASE 4: Notion CRM Database Sync');
    logger.info('============================================================');

    let notionSyncSummary = null;
    if (baseConfig.notionToken && baseConfig.notionDatabaseId) {
      try {
        logger.info('Connecting to Notion CRM Database...');
        notionSyncSummary = await syncLeadsToNotion(dashboardFile);
      } catch (notionErr) {
        logger.warn(`Notion sync skipped or failed: ${String(notionErr)}`);
      }
    } else if (forceNotionSync) {
      logger.error('⚠️ Notion sync requested via --sync-notion, but NOTION_TOKEN or NOTION_DATABASE_ID is missing in .env');
    } else {
      logger.info('ℹ Notion environment credentials missing. Skipping Notion sync.');
    }

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`
============================================================
   🚀 PIPELINE EXECUTION COMPLETE (${durationSeconds}s)
============================================================
Extracted Raw Leads: ${summary.totalFound}
Saved New Leads: ${addedCount} (Total Leads Database: ${existingLeads.length})
Skipped Duplicates: ${summary.duplicates}
Encountered Errors: ${summary.errors}

OPPORTUNITY SCORE BREAKDOWN:
🔥 High Opportunity (70-100): ${highOppCount}
⚡ Medium Opportunity (40-69): ${medOppCount}
✨ Low Opportunity (0-39):   ${lowOppCount}
💰 Total Est. Pipeline Deal Value: R${totalEstimatedValue.toLocaleString()}

EXPORTS GENERATED:
📄 JSON: ${exportResult.jsonPath}
📊 CSV:  ${exportResult.csvPath}

NOTION CRM SYNC STATUS:
${
  notionSyncSummary
    ? `✓ Uploaded: ${notionSyncSummary.uploaded} | Updated: ${notionSyncSummary.updated} | Skipped: ${notionSyncSummary.skipped}`
    : 'ℹ Skipped (Config missing or static mode)'
}
============================================================
`);
  } catch (err) {
    logger.error('Fatal error in LeadGremlin unified pipeline', err);
    process.exit(1);
  }
}

runPipeline();
