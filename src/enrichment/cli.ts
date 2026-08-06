import fs from 'fs';
import path from 'path';
import { getConfig } from '../config/config.js';
import { Business } from '../types/business.js';
import { ContactEnricher } from './contactEnricher.js';
import { Exporter } from '../utils/exporter.js';
import { logger } from '../utils/logger.js';
import { syncLeadsToNotion } from '../notion/sync.js';

async function main() {
  const startTime = Date.now();
  const config = getConfig();
  const targetFile = path.join(config.outputDir, 'leads_latest.json');

  console.log(`
┌──────────────────────────────────────────────────────────┐
│          LeadGremlin - Contact Channels Enricher          │
└──────────────────────────────────────────────────────────┘
`);

  if (!fs.existsSync(targetFile)) {
    console.error(`Error: File ${targetFile} not found. Run "pnpm scrape" first.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(targetFile, 'utf-8');
  const leads: Business[] = JSON.parse(rawData);

  console.log(`Loaded ${leads.length} leads from leads_latest.json`);
  console.log(`Starting contact channel extraction (Website, Instagram, Email, Phone)...\n`);

  const enricher = new ContactEnricher();
  const exporter = new Exporter(config.outputDir);

  const { enriched, summary } = await enricher.enrichBatch(leads);

  // Save enriched results
  exporter.save(enriched);

  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`
============================================================
CONTACT ENRICHMENT SUMMARY (${durationSeconds}s)
============================================================
Leads Processed: ${summary.processed}
Websites Found:  ${summary.websitesFound}
Emails Found:    ${summary.emailsFound}
Socials Found:   ${summary.socialsFound}
Phones Found:    ${summary.phonesFound}
============================================================
`);

  // Synchronize enriched leads to Notion
  console.log('Synchronizing enriched contact channels to Notion...\n');
  try {
    await syncLeadsToNotion();
  } catch (err) {
    logger.error('Failed to auto-sync enriched leads to Notion', err);
  }
}

main();
