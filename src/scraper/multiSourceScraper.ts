import { GoogleMapsScraper } from './googleMapsScraper.js';
import { contactEnricher } from '../enrichment/contactEnricher.js';
import { aiAuditor } from '../scoring/aiAuditor.js';
import { Business, ScraperOptions } from '../types/business.js';
import { Deduplicator } from '../utils/deduplication.js';
import { logger } from '../utils/logger.js';
import { CategoryClassifier } from '../utils/categoryClassifier.js';
import { chromium } from 'playwright';
import crypto from 'crypto';

export class MultiSourceScraper {
  private googleMapsScraper: GoogleMapsScraper;
  private deduplicator: Deduplicator;

  constructor() {
    this.deduplicator = new Deduplicator();
    this.googleMapsScraper = new GoogleMapsScraper(this.deduplicator);
  }

  /**
   * Searches DuckDuckGo & Web directories for business leads beyond Google Maps
   */
  private async scrapeWebSearch(
    searchTerm: string,
    area: string = 'Umhlanga',
    maxResults: number = 10
  ): Promise<Business[]> {
    const webBusinesses: Business[] = [];
    logger.info(`🔍 Extended Search: Searching web directories for "${searchTerm} ${area}"...`);

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--lang=en-US',
        ],
      });
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      const query = `${searchTerm} ${area} South Africa website contact email phone`;
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

      await page.goto(url, { waitUntil: 'commit', timeout: 15000 });
      await page.waitForLoadState('domcontentloaded').catch(() => null);

      const snippets = page.locator('div.result__body');
      const count = await snippets.count();

      for (let i = 0; i < Math.min(count, maxResults * 2); i++) {
        try {
          const item = snippets.nth(i);
          const titleEl = item.locator('a.result__a').first();
          const snippetEl = item.locator('a.result__snippet, div.result__snippet').first();
          const urlEl = item.locator('a.result__url').first();

          if (!(await titleEl.isVisible().catch(() => false))) continue;

          const title = (await titleEl.innerText()).trim();
          const snippet = (await snippetEl.innerText().catch(() => '')).trim();
          const rawUrl = (await urlEl.getAttribute('href').catch(() => '')) || '';

          if (!title || title.length < 3) continue;

          let cleanUrl = rawUrl;
          if (rawUrl.includes('uddg=')) {
            const match = rawUrl.match(/uddg=([^&]+)/);
            if (match && match[1]) cleanUrl = decodeURIComponent(match[1]);
          }

          const lowerUrl = cleanUrl.toLowerCase();
          if (
            lowerUrl.includes('google.com') ||
            lowerUrl.includes('duckduckgo.com') ||
            lowerUrl.includes('wikipedia') ||
            lowerUrl.includes('tripadvisor')
          ) {
            continue;
          }

          // Extract contacts from snippet
          const extracted = contactEnricher.extractContactsFromHtml(`${title} ${snippet}`);

          const category = CategoryClassifier.classify(title, '', searchTerm);
          const id = `web_${crypto.randomBytes(6).toString('hex')}`;

          const business: Business = {
            id,
            name: title.replace(/ - .*$/, '').replace(/ \| .*$/, '').trim(),
            category,
            rawCategory: category,
            area,
            address: `${area}, South Africa`,
            phone: extracted.phone,
            website: cleanUrl.startsWith('http') ? cleanUrl : undefined,
            email: extracted.email,
            socials: extracted.socials || {},
            rating: 4.5,
            reviewCount: 12,
            funnelStage: 'new',
            opportunityScore: 75,
            scrapedAt: new Date().toISOString(),
            searchTerm,
            source: 'web_search',
          };

          const dupCheck = this.deduplicator.isDuplicate(business);
          if (!dupCheck.isDup) {
            this.deduplicator.register(business);
            webBusinesses.push(business);
            if (webBusinesses.length >= maxResults) break;
          }
        } catch {
          // ignore single item error
        }
      }
    } catch (err) {
      logger.warn(`Web search extraction error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (browser) await browser.close();
    }

    return webBusinesses;
  }

  /**
   * Runs complete extraction & enrichment workflow across Google Maps & Web
   */
  public async extractLeads(
    searchTerms: string[],
    maxResultsPerTerm: number = 10,
    options: Partial<ScraperOptions> = {}
  ): Promise<{ leads: Business[]; summary: { totalFound: number; duplicates: number; errors: number } }> {
    const allLeads: Business[] = [];
    let totalFound = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;

    const scraperOpts: ScraperOptions = {
      searchTerms,
      maxResultsPerTerm,
      headless: options.headless !== false,
      includeWebSearch: options.includeWebSearch !== false,
      includeDeepCrawl: options.includeDeepCrawl !== false,
    };

    for (const term of searchTerms) {
      logger.info(`\n🚀 Starting Multi-Source Extraction for: "${term}"`);

      // 1. Google Maps Extraction
      const mapRes = await this.googleMapsScraper.scrapeQuery(term, maxResultsPerTerm, scraperOpts);
      totalFound += mapRes.businesses.length + mapRes.duplicates;
      totalDuplicates += mapRes.duplicates;
      totalErrors += mapRes.errors;

      let combinedForTerm = [...mapRes.businesses];

      // 2. Web Search Engine Extraction (Extended beyond Google Maps)
      if (scraperOpts.includeWebSearch) {
        const areaFromTerm =
          term.replace(/gym|beauty salon|restaurant|dentist|real estate agent|law firm|car detailing|fitness|salon/gi, '').trim() ||
          'Umhlanga';
        const webLeads = await this.scrapeWebSearch(term, areaFromTerm, Math.max(3, Math.floor(maxResultsPerTerm / 2)));
        totalFound += webLeads.length;
        combinedForTerm.push(...webLeads);
      }

      // 3. Deep Contact Enrichment (Emails, Phone numbers, Websites, Social Links)
      if (scraperOpts.includeDeepCrawl && combinedForTerm.length > 0) {
        logger.info(`🔎 Deep Crawling & Enriching ${combinedForTerm.length} leads for "${term}" (Concurrency: ${options.concurrency || 3})...`);
        const enriched = await contactEnricher.enrichBatch(combinedForTerm, options.concurrency || 3);
        combinedForTerm = enriched.enriched;
      }

      // 4. AI Audit & Pitch Script Generation
      if (combinedForTerm.length > 0) {
        logger.info(`🤖 Generating AI Multi-Channel Pitch Scripts for ${combinedForTerm.length} leads...`);
        for (const lead of combinedForTerm) {
          try {
            const auditOutput = await aiAuditor.generateAudit({
              businessName: lead.name,
              websiteUrl: lead.website || '',
              category: lead.category,
              area: lead.area,
              rating: lead.rating,
              reviewCount: lead.reviewCount,
              technicalAudit: lead.technicalAudit,
              tone: 'consultative',
            });

            lead.aiPitchScripts = auditOutput.multiChannelScripts;
            lead.estimatedDealValue = auditOutput.estimatedProjectValueZAR;
            if (auditOutput.issues && auditOutput.issues.length > 0) {
              lead.notes = `Audit: ${auditOutput.issues.join(' | ')}`;
            }
          } catch (auditErr) {
            logger.warn(`AI Pitch generation skipped for ${lead.name}: ${String(auditErr)}`);
          }
        }
      }

      allLeads.push(...combinedForTerm);
    }

    await this.googleMapsScraper.close();

    return {
      leads: allLeads,
      summary: {
        totalFound,
        duplicates: totalDuplicates,
        errors: totalErrors,
      },
    };
  }
}
