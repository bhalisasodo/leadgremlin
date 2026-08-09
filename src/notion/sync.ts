import fs from 'fs';
import path from 'path';
import { getNotionClient } from './client.js';
import { getConfig } from '../config/config.js';
import { Business } from '../types/business.js';
import { Deduplicator } from '../utils/deduplication.js';
import { logger } from '../utils/logger.js';

export interface NotionSyncSummary {
  totalFound: number;
  uploaded: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Validates if string is a valid HTTP/HTTPS URL
 */
function isValidUrl(urlStr?: string): boolean {
  if (!urlStr) return false;
  try {
    const u = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Clean & format URL for Notion URL property
 */
function formatUrl(urlStr?: string): string | null {
  if (!urlStr) return null;
  const trimmed = urlStr.trim();
  if (!trimmed) return null;
  const formatted = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  return isValidUrl(formatted) ? formatted : null;
}

/**
 * Normalizes title or area text for display
 */
function extractArea(business: Business): string {
  if (business.searchTerm) {
    const parts = business.searchTerm.replace(/gym|fitness/gi, '').trim();
    if (parts.length > 0) return parts;
  }
  if (business.address) {
    const addrParts = business.address.split(',');
    if (addrParts.length > 1) return addrParts[addrParts.length - 2].trim();
    return business.address;
  }
  return 'Durban';
}

export class NotionSyncer {
  private deduplicator = new Deduplicator();

  /**
   * Fetches all existing pages in the Notion database to populate duplicate detection index.
   */
  private async fetchExistingRecords(databaseId: string): Promise<{
    titles: Set<string>;
    websites: Set<string>;
    pageMap: Map<string, string>;
  }> {
    const notion = getNotionClient();
    const titles = new Set<string>();
    const websites = new Set<string>();
    const pageMap = new Map<string, string>();

    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
        page_size: 100,
      });

      for (const page of response.results) {
        if ('properties' in page) {
          const props = page.properties;
          const pageId = page.id;

          // Extract Business Title
          if (props.Business && props.Business.type === 'title' && props.Business.title.length > 0) {
            const rawTitle = props.Business.title.map((t) => t.plain_text).join('');
            const normTitle = this.deduplicator.normalizeName(rawTitle);
            if (normTitle) {
              titles.add(normTitle);
              pageMap.set(`title:${normTitle}`, pageId);
            }
          }

          // Extract Website URL
          if (props.Website && props.Website.type === 'url' && typeof props.Website.url === 'string') {
            const normWeb = this.deduplicator.normalizeWebsite(props.Website.url);
            if (normWeb) {
              websites.add(normWeb);
              pageMap.set(`web:${normWeb}`, pageId);
            }
          }
        }
      }

      hasMore = response.has_more;
      const nextCur = (response as { next_cursor?: string | null }).next_cursor;
      startCursor = typeof nextCur === 'string' ? nextCur : undefined;
    }

    return { titles, websites, pageMap };
  }

  /**
   * Synchronizes leads from a JSON file into the Notion database
   */
  public async sync(jsonFilePath?: string): Promise<NotionSyncSummary> {
    const config = getConfig();
    const targetFile = jsonFilePath || path.join(config.outputDir, 'leads_latest.json');

    console.log(`Reading ${path.basename(targetFile)}...`);

    if (!fs.existsSync(targetFile)) {
      throw new Error(`Leads JSON file not found at path: ${targetFile}`);
    }

    const rawData = fs.readFileSync(targetFile, 'utf-8');
    const leads: Business[] = JSON.parse(rawData);

    console.log(`\nFound ${leads.length} businesses.`);
    console.log('Checking duplicates & updating contact channels...\n');

    const databaseId = config.notionDatabaseId;
    if (!databaseId) {
      throw new Error('NOTION_DATABASE_ID environment variable is missing.');
    }

    const notion = getNotionClient();
    const { titles: existingTitles, websites: existingWebsites, pageMap } = await this.fetchExistingRecords(databaseId);

    let uploadedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorsCount = 0;

    for (const lead of leads) {
      const normName = this.deduplicator.normalizeName(lead.name);
      const normWeb = lead.website ? this.deduplicator.normalizeWebsite(lead.website) : undefined;

      const pageId = pageMap.get(`title:${normName}`) || (normWeb ? pageMap.get(`web:${normWeb}`) : undefined);
      const isTitleDup = normName && existingTitles.has(normName);
      const isWebDup = normWeb && existingWebsites.has(normWeb);

      const validWeb = formatUrl(lead.website);
      const validInsta = formatUrl(lead.socials?.instagram);

      if (isTitleDup || isWebDup) {
        if (pageId && (validWeb || lead.email || lead.phone || validInsta)) {
          try {
            console.log(`Updating contact channels for ${lead.name}...`);
            await notion.pages.update({
              page_id: pageId,
              properties: {
                Website: { url: validWeb },
                Email: { email: lead.email || null },
                Phone: { phone_number: lead.phone || null },
                Instagram: { url: validInsta },
              },
            });
            console.log('✓ Updated contact channels');
            updatedCount++;
          } catch {
            console.log(`Skipping ${lead.name} (duplicate)`);
            skippedCount++;
          }
        } else {
          console.log(`Skipping ${lead.name} (duplicate)`);
          skippedCount++;
        }
        continue;
      }

      console.log(`Uploading ${lead.name}...`);

      try {
        const areaText = extractArea(lead);

        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            Business: {
              title: [
                {
                  text: {
                    content: lead.name,
                  },
                },
              ],
            },
            Area: {
              rich_text: [
                {
                  text: {
                    content: areaText,
                  },
                },
              ],
            },
            Website: {
              url: validWeb,
            },
            Email: {
              email: lead.email || null,
            },
            Phone: {
              phone_number: lead.phone || null,
            },
            Instagram: {
              url: validInsta,
            },
            'Website Score': {
              number: typeof lead.websiteScore === 'number' ? lead.websiteScore : 0,
            },
            Opportunity: {
              select: {
                name: lead.opportunityScore >= 70 ? 'High' : lead.opportunityScore >= 40 ? 'Medium' : 'Low',
              },
            },
            'Estimated Deal Value': {
              number: typeof lead.estimatedDealValue === 'number' ? lead.estimatedDealValue : 18500,
            },
            Status: {
              status: {
                name: 'Not Started',
              },
            },
            Notes: {
              rich_text: [
                {
                  text: {
                    content: lead.notes || (lead.aiPitchScripts?.email?.body ? `Pitch: ${lead.aiPitchScripts.email.subject}` : 'Imported by LeadGremlin'),
                  },
                },
              ],
            },
          },
        });

        console.log('✓ Uploaded');
        uploadedCount++;

        // Add to in-memory set to avoid duplicates within the same batch
        if (normName) existingTitles.add(normName);
        if (normWeb) existingWebsites.add(normWeb);
      } catch (err) {
        errorsCount++;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`✖ Failed to upload ${lead.name}: ${msg}`);
        logger.error(`Failed to upload ${lead.name} to Notion`, err);
      }
    }

    console.log('\nSync Complete\n');
    console.log(`Uploaded: ${uploadedCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorsCount}\n`);

    return {
      totalFound: leads.length,
      uploaded: uploadedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorsCount,
    };
  }
}

export const syncLeadsToNotion = async (jsonFilePath?: string): Promise<NotionSyncSummary> => {
  const syncer = new NotionSyncer();
  return syncer.sync(jsonFilePath);
};

// Execute if run directly from CLI
const entryFile = process.argv[1] || '';
if (entryFile.endsWith('sync.ts') || entryFile.endsWith('sync.js')) {
  syncLeadsToNotion().catch((err) => {
    console.error('Fatal error during Notion sync:', err);
    process.exit(1);
  });
}
