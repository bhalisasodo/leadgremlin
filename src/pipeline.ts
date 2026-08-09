import { getConfig } from './config/config.js';
import { MultiSourceScraper } from './scraper/multiSourceScraper.js';
import { websiteAnalyzer } from './scoring/websiteAnalyzer.js';
import { aiAuditor } from './scoring/aiAuditor.js';
import { Exporter } from './utils/exporter.js';
import { syncLeadsToNotion } from './notion/sync.js';
import { logger } from './utils/logger.js';
import { Business } from './types/business.js';
import { buildMultiRegionQueries } from './config/regions.js';
import fs from 'fs';
import path from 'path';

interface ParsedArgs {
  terms?: string[];
  area?: string;
  limit?: number;
  headless?: boolean;
  syncNotion?: boolean;
  runAudit?: boolean;
  pitchTone?: 'consultative' | 'direct' | 'casual' | 'urgent';
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
    } else if (arg.startsWith('--area=')) {
      args.area = arg.replace('--area=', '').trim();
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
      if (['consultative', 'direct', 'casual', 'urgent'].includes(val)) {
        args.pitchTone = val as ParsedArgs['pitchTone'];
      }
    }
  }

  return args;
}

async function runPipeline() {
  const startTime = Date.now();
  const baseConfig = getConfig();
  const cliArgs = parseArgs();

  // Combine CLI flags with environment config
  const area = cliArgs.area || 'Umhlanga';
  const areasList = area.split(',').map((a) => a.trim()).filter(Boolean);
  let searchTerms = cliArgs.terms;
  if (!searchTerms || searchTerms.length === 0) {
    searchTerms = buildMultiRegionQueries(['gym', 'beauty salon', 'restaurant', 'dentist'], areasList);
  }

  const maxResults = cliArgs.limit || Math.min(baseConfig.maxResults, 10);
  const headless = cliArgs.headless !== undefined ? cliArgs.headless : baseConfig.headless;
  const pitchTone = cliArgs.pitchTone || 'consultative';
  const forceNotionSync = cliArgs.syncNotion || false;

  console.log(`
┌──────────────────────────────────────────────────────────┐
│      LeadGremlin - End-to-End Sales Lead Engine          │
└──────────────────────────────────────────────────────────┘
`);

  logger.info('Pipeline Execution Target Parameters:');
  logger.info(`- Target Area: ${area}`);
  logger.info(`- Search Terms (${searchTerms.length}): ${searchTerms.join(', ')}`);
  logger.info(`- Max Results per term: ${maxResults}`);
  logger.info(`- Headless Browser: ${headless}`);
  logger.info(`- Pitch Tone: ${pitchTone}`);

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
