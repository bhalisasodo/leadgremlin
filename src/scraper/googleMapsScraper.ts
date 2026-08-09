import { chromium, Browser, Page } from 'playwright';
import { Business, ScraperOptions } from '../types/business.js';
import { googleMapsParser } from '../parser/googleMapsParser.js';
import { logger } from '../utils/logger.js';
import { Deduplicator } from '../utils/deduplication.js';
import { CategoryClassifier } from '../utils/categoryClassifier.js';
import crypto from 'crypto';

export class GoogleMapsScraper {
  private browser: Browser | null = null;
  private deduplicator: Deduplicator;

  constructor(deduplicator?: Deduplicator) {
    this.deduplicator = deduplicator || new Deduplicator();
  }

  /**
   * Initializes Playwright Browser instance
   */
  public async init(headless: boolean = true): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-notifications',
          '--disable-gpu',
          '--lang=en-US',
        ],
      });
      logger.info(`Playwright Chromium browser launched (Headless: ${headless})`);
    }
  }

  /**
   * Closes browser instance safely
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Playwright Chromium browser closed.');
    }
  }

  /**
   * Handles Google cookie/consent dialog if present
   */
  private async handleConsent(page: Page): Promise<void> {
    try {
      const consentButtons = [
        'button[aria-label*="Accept"]',
        'button:has-text("Accept all")',
        'button:has-text("I agree")',
        'form[action*="consent"] button',
      ];

      for (const selector of consentButtons) {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1500 }).catch(() => false)) {
          await button.click();
          logger.info('Accepted Google consent dialog.');
          await page.waitForTimeout(1000);
          break;
        }
      }
    } catch {
      // Ignore if no consent modal appeared
    }
  }

  /**
   * Extracts name from place URL or text if selectors fall short
   */
  private parseNameFromUrl(href: string): string | undefined {
    try {
      const match = href.match(/\/maps\/place\/([^/]+)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1].replace(/\+/g, ' '));
        if (decoded && !/results|search|maps/i.test(decoded)) {
          return decoded;
        }
      }
    } catch {
      // ignore
    }
    return undefined;
  }

  /**
   * Extracts detailed business information from open Maps detail pane
   */
  private async extractDetailPane(
    page: Page,
    mapsUrl: string,
    fallbackName?: string,
    cardWebsite?: string,
    cardPhone?: string,
    searchTerm?: string
  ): Promise<Business | null> {
    try {
      // Extract Business Name
      let name: string | undefined;

      const nameSelectors = [
        'div[role="main"] h1',
        'h1.DUwif',
        'h1.fontHeadlineLarge',
        'div.role-result-title h1',
      ];

      for (const sel of nameSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          const text = await el.innerText();
          if (text && text.trim().length > 0 && !/^results/i.test(text.trim())) {
            name = text.trim();
            break;
          }
        }
      }

      if (!name) {
        name = fallbackName || this.parseNameFromUrl(mapsUrl);
      }

      if (!name || /^results/i.test(name.trim())) return null;

      // Extract Raw Category
      let rawCategory = 'Local Business';
      const categorySelectors = [
        'button[jsaction*="category"]',
        'button.DkCrMe',
        'span.fontBodyMedium button',
      ];
      for (const sel of categorySelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
          const text = await el.innerText();
          if (text && text.trim().length > 0) {
            rawCategory = text.trim();
            break;
          }
        }
      }

      // Classify into prospect category
      const category = CategoryClassifier.classify(name, rawCategory, searchTerm || '');

      // Extract Address
      let address: string | undefined;
      const addressBtn = page
        .locator('button[data-item-id="address"], button[aria-label*="Address:"], button[aria-label*="address:"]')
        .first();
      if (await addressBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        const aria = await addressBtn.getAttribute('aria-label');
        if (aria) {
          address = aria.replace(/^Address:\s*/i, '').trim();
        } else {
          address = await addressBtn.innerText();
        }
      }

      // Determine area dynamically from search term or address
      let area = 'Umhlanga';
      if (searchTerm) {
        const areaFromTerm = searchTerm.replace(/gym|beauty salon|restaurant|dentist|real estate agent|law firm|car detailing|fitness|salon/gi, '').trim();
        if (areaFromTerm.length > 0) area = areaFromTerm;
      }
      if (address) {
        if (/umhlanga rocks/i.test(address)) area = 'Umhlanga Rocks';
        else if (/umhlanga ridge/i.test(address)) area = 'Umhlanga Ridge';
        else if (/gateway/i.test(address)) area = 'Gateway, Umhlanga';
        else if (/la lucia/i.test(address)) area = 'La Lucia';
        else if (/durban north/i.test(address)) area = 'Durban North';
        else if (/cornubia/i.test(address)) area = 'Cornubia';
        else if (/sandton/i.test(address)) area = 'Sandton';
        else if (/rosebank/i.test(address)) area = 'Rosebank';
        else if (/sea point/i.test(address)) area = 'Sea Point';
        else if (/camps bay/i.test(address)) area = 'Camps Bay';
        else if (/ballito/i.test(address)) area = 'Ballito';
        else if (/centurion/i.test(address)) area = 'Centurion';
        else if (/pretoria/i.test(address)) area = 'Pretoria';
        else {
          const addrParts = address.split(',').map((p) => p.trim()).filter(Boolean);
          if (addrParts.length >= 2) {
            const candidate = addrParts[addrParts.length - 2];
            if (candidate && !/south africa|\d{4}/i.test(candidate)) {
              area = candidate;
            }
          }
        }
      }

      // Extract Phone
      let phone: string | undefined = cardPhone;
      if (!phone) {
        const phoneSelectors = [
          'button[data-item-id*="phone"]',
          'button[aria-label*="Phone:"]',
          'button[aria-label*="phone:"]',
          'button[data-tooltip*="phone"]',
          'button[jsaction*="phone"]',
        ];
        for (const sel of phoneSelectors) {
          const btn = page.locator(sel).first();
          if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
            const aria = await btn.getAttribute('aria-label');
            const text = aria || (await btn.innerText());
            if (text) {
              phone = googleMapsParser.parsePhone(text.replace(/^Phone:\s*/i, '').trim());
              break;
            }
          }
        }
      }

      // Extract Website
      let website: string | undefined = cardWebsite;
      if (!website) {
        const webSelectors = [
          'a[data-item-id="authority"]',
          'a[aria-label*="Website:"]',
          'a[aria-label*="website:"]',
          'a[aria-label*="Website"]',
          'a[data-tooltip*="website"]',
          'a[jsaction*="authority"]',
          'a.lI9ife',
        ];
        for (const sel of webSelectors) {
          const btn = page.locator(sel).first();
          if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
            const href = await btn.getAttribute('href');
            if (href && !href.includes('google.com/maps')) {
              website = href;
              break;
            }
          }
        }
      }

      // Extract Rating & Reviews
      let rating: number | undefined;
      let reviewCount: number | undefined;
      const ratingSpan = page.locator('div.F7v22 span[aria-hidden="true"], span.ceNzKf').first();
      if (await ratingSpan.isVisible({ timeout: 500 }).catch(() => false)) {
        const rawRating = await ratingSpan.innerText();
        const parsed = parseFloat(rawRating.replace(',', '.'));
        if (!isNaN(parsed)) rating = parsed;
      }

      const reviewsBtn = page
        .locator('button[jsaction*="pane.reviewChart.moreReviews"], span[aria-label*="reviews"]')
        .first();
      if (await reviewsBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        const aria = await reviewsBtn.getAttribute('aria-label');
        const text = aria || (await reviewsBtn.innerText());
        const match = text.match(/(\d[\d\s,.]*)\s*(reviews|ratings)/i);
        if (match) {
          reviewCount = parseInt(match[1].replace(/[\s,.]/g, ''), 10);
        }
      }

      const id = `lead_${crypto.randomBytes(6).toString('hex')}`;
      const opportunityScore = Math.floor(Math.random() * 30) + (website ? 40 : 70);

      const rawBusiness: Partial<Business> = {
        id,
        name,
        category,
        rawCategory,
        area,
        address,
        phone,
        website,
        socials: {},
        rating,
        reviewCount,
        mapsUrl,
        funnelStage: 'new',
        opportunityScore,
        source: 'google_maps',
      };

      return googleMapsParser.finalizeBusiness(rawBusiness, searchTerm) as Business;
    } catch (err) {
      logger.warn(`Failed to parse detail pane for ${mapsUrl}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  /**
   * Scrapes businesses for a given search query (e.g. "gym Umhlanga")
   */
  public async scrapeQuery(
    searchTerm: string,
    maxResults: number,
    options: ScraperOptions
  ): Promise<{ businesses: Business[]; duplicates: number; errors: number }> {
    const businesses: Business[] = [];
    let duplicatesCount = 0;
    let errorsCount = 0;

    await this.init(options.headless);

    const context = await this.browser!.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    try {
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}?hl=en`;
      logger.info(`Navigating to Google Maps for query: "${searchTerm}"`);
      await page.goto(searchUrl, { waitUntil: 'commit', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded').catch(() => null);

      await this.handleConsent(page);

      const feedSelector = 'div[role="feed"]';
      try {
        await page.waitForSelector(feedSelector, { timeout: 15000 });
      } catch {
        logger.warn(`Feed container not immediately found for "${searchTerm}". Retrying page load...`);
        await page.reload({ waitUntil: 'commit' });
        await page.waitForSelector(feedSelector, { timeout: 15000 }).catch(() => null);
      }

      const feed = page.locator(feedSelector).first();
      const visitedUrls = new Set<string>();

      logger.info(`Beginning result scrolling and listing extraction for "${searchTerm}"...`);

      let prevHeight = 0;
      let noNewItemsCount = 0;

      while (businesses.length < maxResults && noNewItemsCount < 4) {
        const listingCards = page.locator('div[role="feed"] a[href*="/maps/place"]');
        const count = await listingCards.count();

        if (count === 0) {
          logger.warn(`No listing cards detected in feed. Waiting...`);
          await page.waitForTimeout(2000);
        }

        let addedInCurrentBatch = 0;

        for (let i = 0; i < count; i++) {
          if (businesses.length >= maxResults) break;

          try {
            const card = listingCards.nth(i);
            const href = await card.getAttribute('href');

            if (!href || visitedUrls.has(href)) continue;
            visitedUrls.add(href);

            const cardAria = await card.getAttribute('aria-label');
            const fallbackName = cardAria || this.parseNameFromUrl(href);

            let cardWeb: string | undefined;
            const parentContainer = card.locator('xpath=ancestor::div[contains(@class, "Nv2pk")]').first();
            if (await parentContainer.isVisible({ timeout: 300 }).catch(() => false)) {
              const cardWebLink = parentContainer.locator('a[data-value="Website"], a[aria-label*="Website"]').first();
              if (await cardWebLink.isVisible({ timeout: 300 }).catch(() => false)) {
                cardWeb = (await cardWebLink.getAttribute('href')) || undefined;
              }
            }

            await card.scrollIntoViewIfNeeded().catch(() => null);
            await card.click({ force: true }).catch(() => null);
            await page.waitForTimeout(1200);

            const canonicalUrl = googleMapsParser.cleanMapsUrl(href) || href;
            const business = await this.extractDetailPane(
              page,
              canonicalUrl,
              fallbackName,
              cardWeb,
              undefined,
              searchTerm
            );

            if (business) {
              const dupCheck = this.deduplicator.isDuplicate(business);
              if (dupCheck.isDup) {
                duplicatesCount++;
                logger.warn(`Skipping duplicate (${dupCheck.reason}): ${business.name}`);
              } else {
                this.deduplicator.register(business);
                businesses.push(business);
                addedInCurrentBatch++;
                logger.logBusiness(business);
              }
            }
          } catch (itemErr) {
            errorsCount++;
            logger.warn(`Error processing item index ${i}: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`);
          }
        }

        try {
          if (await feed.isVisible()) {
            await feed.evaluate((el) => {
              el.scrollTop += 1200;
            });
            await page.waitForTimeout(1800);

            const currentHeight = await feed.evaluate((el) => el.scrollHeight);
            if (currentHeight === prevHeight && addedInCurrentBatch === 0) {
              noNewItemsCount++;
            } else {
              noNewItemsCount = 0;
            }
            prevHeight = currentHeight;
          } else {
            break;
          }
        } catch {
          break;
        }
      }

      logger.success(`Finished scraping "${searchTerm}". Extracted ${businesses.length} leads.`);
    } catch (err) {
      errorsCount++;
      logger.error(`Critical error during search for "${searchTerm}"`, err);
    } finally {
      await context.close();
    }

    return { businesses, duplicates: duplicatesCount, errors: errorsCount };
  }
}
