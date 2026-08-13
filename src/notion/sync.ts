import fs from 'fs';
import path from 'path';
import { getNotionClient, withNotionRetry } from './client.js';
import { getConfig } from '../config/config.js';
import { Business, FunnelStage } from '../types/business.js';
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
   * Flexible Notion Property Name Resolver
   */
  private resolvePropName(schemaProps: Record<string, any>, candidates: string[], expectedType?: string): string | null {
    for (const cand of candidates) {
      const matchKey = Object.keys(schemaProps).find((k) => k.toLowerCase() === cand.toLowerCase());
      if (matchKey) {
        if (!expectedType || schemaProps[matchKey].type === expectedType) {
          return matchKey;
        }
      }
    }
    if (expectedType) {
      const typeMatch = Object.keys(schemaProps).find((k) => schemaProps[k].type === expectedType);
      if (typeMatch) return typeMatch;
    }
    return null;
  }

  /**
   * Fetches all existing pages in the Notion database to populate duplicate detection index.
   */
  private async fetchExistingRecords(databaseId: string): Promise<{
    titles: Set<string>;
    websites: Set<string>;
    pageMap: Map<string, string>;
    schemaProps: Record<string, any>;
  }> {
    const notion = getNotionClient();
    const titles = new Set<string>();
    const websites = new Set<string>();
    const pageMap = new Map<string, string>();

    const dbInfo = await withNotionRetry(() => notion.databases.retrieve({ database_id: databaseId }));
    const schemaProps = (dbInfo as any).properties || {};

    const titlePropName = this.resolvePropName(schemaProps, ['Business', 'Name', 'Title', 'Company'], 'title') || 'Business';
    const webPropName = this.resolvePropName(schemaProps, ['Website', 'URL', 'Link', 'Site'], 'url') || 'Website';

    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await withNotionRetry(() =>
        notion.databases.query({
          database_id: databaseId,
          start_cursor: startCursor,
          page_size: 100,
        })
      );

      for (const page of response.results) {
        if ('properties' in page) {
          const props = page.properties;
          const pageId = page.id;

          // Extract Business Title
          const titleProp = props[titlePropName];
          if (titleProp && titleProp.type === 'title' && titleProp.title.length > 0) {
            const rawTitle = titleProp.title.map((t: any) => t.plain_text).join('');
            const normTitle = this.deduplicator.normalizeName(rawTitle);
            if (normTitle) {
              titles.add(normTitle);
              pageMap.set(`title:${normTitle}`, pageId);
            }
          }

          // Extract Website URL
          const webProp = props[webPropName];
          if (webProp && webProp.type === 'url' && typeof webProp.url === 'string') {
            const normWeb = this.deduplicator.normalizeWebsite(webProp.url);
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

    return { titles, websites, pageMap, schemaProps };
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
            await withNotionRetry(() =>
              notion.pages.update({
                page_id: pageId,
                properties: {
                  Website: { url: validWeb },
                  Email: { email: lead.email || null },
                  Phone: { phone_number: lead.phone || null },
                  Instagram: { url: validInsta },
                },
              })
            );
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

        await withNotionRetry(() =>
          notion.pages.create({
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
          })
        );

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

  /**
   * Pulls status changes from Notion CRM back into local leads storage
   */
  public async pullStatusUpdatesFromNotion(jsonFilePath?: string): Promise<{ updatedCount: number }> {
    const config = getConfig();
    if (!config.notionToken || !config.notionDatabaseId) return { updatedCount: 0 };

    const targetFile = jsonFilePath || path.join(config.outputDir, 'leads_dashboard.json');
    if (!fs.existsSync(targetFile)) return { updatedCount: 0 };

    const rawData = fs.readFileSync(targetFile, 'utf-8');
    const localLeads: Business[] = JSON.parse(rawData);
    if (localLeads.length === 0) return { updatedCount: 0 };

    try {
      const notion = getNotionClient();
      const { schemaProps } = await this.fetchExistingRecords(config.notionDatabaseId);
      const titlePropName = this.resolvePropName(schemaProps, ['Business', 'Name', 'Title', 'Company'], 'title') || 'Business';
      const statusPropName = this.resolvePropName(schemaProps, ['Status', 'Stage', 'State'], 'status') ||
                             this.resolvePropName(schemaProps, ['Status', 'Stage', 'State'], 'select') || 'Status';

      let hasMore = true;
      let startCursor: string | undefined = undefined;
      let updatedCount = 0;

      const statusMap = new Map<string, FunnelStage>();

      while (hasMore) {
        const response = await withNotionRetry(() =>
          notion.databases.query({
            database_id: config.notionDatabaseId!,
            start_cursor: startCursor,
            page_size: 100,
          })
        );

        for (const page of response.results) {
          if ('properties' in page) {
            const props = page.properties;
            const titleProp = props[titlePropName];
            const statusProp = props[statusPropName];

            if (titleProp && titleProp.type === 'title' && titleProp.title.length > 0) {
              const rawTitle = titleProp.title.map((t: any) => t.plain_text).join('');
              const normTitle = this.deduplicator.normalizeName(rawTitle);

              let statusStr = '';
              const st = (statusProp as any);
              if (st?.type === 'status' && st.status?.name) {
                statusStr = String(st.status.name).toLowerCase();
              } else if (st?.type === 'select' && st.select?.name) {
                statusStr = String(st.select.name).toLowerCase();
              }

              if (normTitle && statusStr) {
                let stage: FunnelStage = 'new';
                if (statusStr.includes('in progress') || statusStr.includes('outreach')) stage = 'outreach';
                else if (statusStr.includes('meeting')) stage = 'meeting';
                else if (statusStr.includes('proposal')) stage = 'proposal';
                else if (statusStr.includes('done') || statusStr.includes('won')) stage = 'won';
                else if (statusStr.includes('lost')) stage = 'lost';
                else if (statusStr.includes('enriched')) stage = 'enriched';

                statusMap.set(normTitle, stage);
              }
            }
          }
        }

        hasMore = response.has_more;
        const nextCur = (response as { next_cursor?: string | null }).next_cursor;
        startCursor = typeof nextCur === 'string' ? nextCur : undefined;
      }

      for (const lead of localLeads) {
        const normName = this.deduplicator.normalizeName(lead.name);
        if (normName && statusMap.has(normName)) {
          const newStage = statusMap.get(normName)!;
          if (lead.funnelStage !== newStage) {
            lead.funnelStage = newStage;
            lead.lastContactedAt = new Date().toISOString();
            updatedCount++;
          }
        }
      }

      if (updatedCount > 0) {
        fs.writeFileSync(targetFile, JSON.stringify(localLeads, null, 2), 'utf-8');
        logger.info(`✓ Pulled ${updatedCount} status update(s) from Notion CRM back into local dashboard storage.`);
      }

      return { updatedCount };
    } catch (err) {
      logger.warn(`Bi-directional status pull skipped: ${String(err)}`);
      return { updatedCount: 0 };
    }
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
