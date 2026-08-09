import { getConfig } from './config/config.js';
import { MultiSourceScraper } from './scraper/multiSourceScraper.js';
import { Exporter } from './utils/exporter.js';
import { NotionSyncer } from './notion/sync.js';
import { logger } from './utils/logger.js';
import { Business } from './types/business.js';
import fs from 'fs';
import path from 'path';

async function runPipeline() {
  const startTime = Date.now();
  const config = getConfig();

  console.log(`
┌──────────────────────────────────────────────────────────┐
│      LeadGremlin - End-to-End Sales Lead Engine          │
└──────────────────────────────────────────────────────────┘
`);

  logger.info('Loaded pipeline configuration:');
  logger.info(`- Search Terms (${config.searchTerms.length}): ${config.searchTerms.join(', ')}`);
  logger.info(`- Max Results per term: ${config.maxResults}`);
  logger.info(`- Headless Mode: ${config.headless}`);
  logger.info(`- Output Directory: ${config.outputDir}`);

  const scraper = new MultiSourceScraper();
  const exporter = new Exporter(config.outputDir);

  try {
    // 1. Execute Multi-Source Scraping, Enrichment, & AI Pitch Generation
    logger.info('\n============================================================');
    logger.info('PHASE 1 & 2 & 3: Scraping, Contact Enrichment, & AI Pitch Engine');
    logger.info('============================================================');

    const { leads, summary } = await scraper.extractLeads(config.searchTerms, config.maxResults, {
      headless: config.headless,
      includeWebSearch: true,
      includeDeepCrawl: true,
    });

    // 2. Load and merge into master dashboard database
    const dashboardFile = path.join(config.outputDir, 'leads_dashboard.json');
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

    for (const lead of leads) {
      if (!existingNames.has(lead.name.toLowerCase())) {
        existingNames.add(lead.name.toLowerCase());
        existingLeads.unshift(lead);
        addedCount++;
      }
    }

    // 3. Save JSON and CSV Exports
    const exportResult = exporter.save(existingLeads);

    // 4. Trigger Notion Database Synchronization
    logger.info('\n============================================================');
    logger.info('PHASE 4: Notion Database Sync');
    logger.info('============================================================');

    let notionSyncSummary = null;
    if (config.notionDatabaseId && process.env.NOTION_API_KEY) {
      try {
        const syncer = new NotionSyncer();
        notionSyncSummary = await syncer.sync(path.join(config.outputDir, 'leads_latest.json'));
      } catch (notionErr) {
        logger.warn(`Notion sync skipped or encountered an error: ${String(notionErr)}`);
      }
    } else {
      logger.info('ℹ NOTION_DATABASE_ID or NOTION_API_KEY not provided in .env. Skipping Notion sync.');
    }

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`
============================================================
PIPELINE EXECUTION COMPLETE (${durationSeconds}s)
============================================================
Extracted Raw Leads: ${summary.totalFound}
Saved New Leads: ${addedCount} (Total Lead Database: ${existingLeads.length})
Skipped Duplicates: ${summary.duplicates}
Encountered Errors: ${summary.errors}
JSON Export: ${exportResult.jsonPath}
CSV Export: ${exportResult.csvPath}
Notion Uploaded: ${notionSyncSummary ? notionSyncSummary.uploaded : 'N/A'}
============================================================
`);
  } catch (err) {
    logger.error('Fatal error in LeadGremlin unified pipeline', err);
    process.exit(1);
  }
}

runPipeline();
