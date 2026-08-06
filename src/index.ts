import { getConfig } from './config/config.js';
import { MultiSourceScraper } from './scraper/multiSourceScraper.js';
import { Exporter } from './utils/exporter.js';
import { logger } from './utils/logger.js';
import { Business } from './types/business.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const startTime = Date.now();
  const config = getConfig();

  console.log(`
┌──────────────────────────────────────────────────────────┐
│      LeadGremlin - Sales Funnel Lead Engine (Umhlanga)    │
└──────────────────────────────────────────────────────────┘
`);

  logger.info(`Loaded configuration:`);
  logger.info(`- Search terms: ${config.searchTerms.join(', ')}`);
  logger.info(`- Max results per term: ${config.maxResults}`);
  logger.info(`- Headless: ${config.headless}`);
  logger.info(`- Output directory: ${config.outputDir}`);

  const scraper = new MultiSourceScraper();
  const exporter = new Exporter(config.outputDir);

  try {
    const { leads, summary } = await scraper.extractLeads(config.searchTerms, config.maxResults, {
      headless: config.headless,
      includeWebSearch: true,
      includeDeepCrawl: true,
    });

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

    exporter.save(existingLeads);

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`
============================================================
EXTRACTION SUMMARY (${durationSeconds}s)
============================================================
Found: ${summary.totalFound} businesses
Saved to Sales Funnel: ${addedCount} new leads (Total: ${existingLeads.length})
Duplicates Skipped: ${summary.duplicates}
Errors: ${summary.errors}
============================================================
`);
  } catch (err) {
    logger.error('Fatal error in LeadGremlin execution pipeline', err);
    process.exit(1);
  }
}

main();
