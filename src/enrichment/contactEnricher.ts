import { chromium, Browser, Page } from 'playwright';
import { Business, SocialLinks } from '../types/business.js';
import { logger } from '../utils/logger.js';
import { googleMapsParser } from '../parser/googleMapsParser.js';
import { websiteAnalyzer } from '../scoring/websiteAnalyzer.js';

export interface EnrichmentSummary {
  processed: number;
  emailsFound: number;
  socialsFound: number;
  websitesFound: number;
  phonesFound: number;
}

export class ContactEnricher {
  private browser: Browser | null = null;

  /**
   * Initialize browser for web page scraping
   */
  public async init(headless: boolean = true): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--lang=en-US',
        ],
      });
    }
  }

  /**
   * Close browser instance
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Extracts contact channels (Emails, Social Media links, Phones) from HTML content
   */
  public extractContactsFromHtml(html: string): {
    email?: string;
    phone?: string;
    socials: SocialLinks;
  } {
    let email: string | undefined;
    let phone: string | undefined;
    const socials: SocialLinks = {};

    // 1. Extract Email via mailto: or regex
    const mailtoMatch = html.match(/href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/i);
    if (mailtoMatch && mailtoMatch[1]) {
      email = mailtoMatch[1].toLowerCase().trim();
    } else {
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const matches = html.match(emailRegex);
      if (matches) {
        for (const candidate of matches) {
          const lower = candidate.toLowerCase();
          if (
            !lower.endsWith('.png') &&
            !lower.endsWith('.jpg') &&
            !lower.endsWith('.jpeg') &&
            !lower.endsWith('.gif') &&
            !lower.endsWith('.webp') &&
            !lower.endsWith('.svg') &&
            !lower.includes('sentry') &&
            !lower.includes('example.com') &&
            !lower.includes('wixpress.com') &&
            !lower.includes('schema.org') &&
            !lower.includes('domain.com') &&
            !lower.includes('googleapis') &&
            !lower.includes('reactjs') &&
            !lower.includes('duckduckgo')
          ) {
            email = lower;
            break;
          }
        }
      }
    }

    // 2. Extract Social Media Links & Handles

    // Instagram
    const instaMatch = html.match(/(https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9._-]+)\/?)/i);
    if (instaMatch && instaMatch[3]) {
      const handle = instaMatch[3].toLowerCase();
      if (!['p', 'reels', 'explore', 'stories', 'accounts', 'directory', 'tv'].includes(handle)) {
        socials.instagram = `https://www.instagram.com/${handle}/`;
      }
    }

    // Facebook
    const fbMatch = html.match(/(https?:\/\/(www\.)?facebook\.com\/(pages\/[a-zA-Z0-9.-]+\/\d+|[a-zA-Z0-9._-]+)\/?)/i);
    if (fbMatch && fbMatch[1]) {
      const href = fbMatch[1].toLowerCase();
      if (!href.includes('sharer') && !href.includes('dialog') && !href.includes('policies')) {
        socials.facebook = fbMatch[1];
      }
    }

    // LinkedIn
    const liMatch = html.match(/(https?:\/\/(www\.)?linkedin\.com\/(company\/[a-zA-Z0-9._-]+|in\/[a-zA-Z0-9._-]+)\/?)/i);
    if (liMatch && liMatch[1]) {
      socials.linkedin = liMatch[1];
    }

    // Twitter / X
    const twMatch = html.match(/(https?:\/\/(www\.)?(twitter|x)\.com\/([a-zA-Z0-9._-]+)\/?)/i);
    if (twMatch && twMatch[4]) {
      const handle = twMatch[4].toLowerCase();
      if (!['intent', 'share', 'home', 'privacy', 'tos'].includes(handle)) {
        socials.twitter = `https://x.com/${handle}`;
      }
    }

    // TikTok
    const ttMatch = html.match(/(https?:\/\/(www\.)?tiktok\.com\/@([a-zA-Z0-9._-]+)\/?)/i);
    if (ttMatch && ttMatch[3]) {
      socials.tiktok = `https://www.tiktok.com/@${ttMatch[3].toLowerCase()}`;
    }

    // YouTube
    const ytMatch = html.match(/(https?:\/\/(www\.)?youtube\.com\/(c\/[a-zA-Z0-9._-]+|user\/[a-zA-Z0-9._-]+|@([a-zA-Z0-9._-]+)|channel\/[a-zA-Z0-9._-]+)\/?)/i);
    if (ytMatch && ytMatch[1]) {
      socials.youtube = ytMatch[1];
    }

    // 3. Extract Phone
    const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
    if (telMatch && telMatch[1]) {
      phone = googleMapsParser.parsePhone(telMatch[1]);
    } else {
      const phoneRegex = /(?:\+27|0)\s*\d{2}\s*\d{3}\s*\d{4}/;
      const phoneMatch = html.match(phoneRegex);
      if (phoneMatch) {
        phone = googleMapsParser.parsePhone(phoneMatch[0]);
      }
    }

    return { email, phone, socials };
  }

  /**
   * Discovers official website and contacts via DuckDuckGo HTML search
   */
  public async findWebsiteAndSocials(
    page: Page,
    businessName: string,
    area?: string
  ): Promise<{ website?: string; socials: SocialLinks; phone?: string; email?: string }> {
    try {
      const searchQuery = `${businessName} ${area || 'Umhlanga'} South Africa contact website`;
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

      await page.goto(searchUrl, { waitUntil: 'commit', timeout: 15000 });
      await page.waitForLoadState('domcontentloaded').catch(() => null);

      const pageContent = await page.content();
      const extracted = this.extractContactsFromHtml(pageContent);

      let website: string | undefined;
      const socials: SocialLinks = { ...extracted.socials };
      let phone: string | undefined = extracted.phone;
      let email: string | undefined = extracted.email;

      // Extract result links
      const resultLinks = page.locator('a.result__url, a.result__snippet');
      const count = await resultLinks.count();

      for (let i = 0; i < Math.min(count, 12); i++) {
        const href = await resultLinks.nth(i).getAttribute('href');
        if (!href) continue;

        let cleanUrl = href;
        if (href.includes('uddg=')) {
          const match = href.match(/uddg=([^&]+)/);
          if (match && match[1]) {
            cleanUrl = decodeURIComponent(match[1]);
          }
        }

        const lowerHref = cleanUrl.toLowerCase();

        // Check for official website
        if (
          !website &&
          cleanUrl.startsWith('http') &&
          !lowerHref.includes('duckduckgo.com') &&
          !lowerHref.includes('google.com') &&
          !lowerHref.includes('facebook.com') &&
          !lowerHref.includes('instagram.com') &&
          !lowerHref.includes('youtube.com') &&
          !lowerHref.includes('tiktok.com') &&
          !lowerHref.includes('linkedin.com') &&
          !lowerHref.includes('yellowpages') &&
          !lowerHref.includes('tripadvisor')
        ) {
          website = cleanUrl;
        }

        // Check for social links in results
        if (!socials.instagram && lowerHref.includes('instagram.com/')) {
          const match = cleanUrl.match(/https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9._-]+)/i);
          if (match && match[2] && !['p', 'reels', 'explore'].includes(match[2].toLowerCase())) {
            socials.instagram = `https://www.instagram.com/${match[2].toLowerCase()}/`;
          }
        }

        if (!socials.facebook && lowerHref.includes('facebook.com/')) {
          socials.facebook = cleanUrl;
        }

        if (!socials.linkedin && lowerHref.includes('linkedin.com/')) {
          socials.linkedin = cleanUrl;
        }
      }

      return { website, socials, phone, email };
    } catch {
      return { socials: {} };
    }
  }

  /**
   * Enriches a single business with website, email, phone, and all social channels
   */
  public async enrichBusiness(page: Page, business: Business): Promise<Business> {
    try {
      logger.info(`Enriching contacts for: ${business.name}`);
      business.socials = business.socials || {};

      // 1. If website or contact fields are missing, discover via web search
      if (!business.website || !business.email || !business.phone || !business.socials.instagram) {
        const searchResults = await this.findWebsiteAndSocials(page, business.name, business.area);
        if (searchResults.website && !business.website) business.website = searchResults.website;
        if (searchResults.phone && !business.phone) business.phone = searchResults.phone;
        if (searchResults.email && !business.email) business.email = searchResults.email;

        // Merge socials
        business.socials = {
          ...searchResults.socials,
          ...business.socials,
        };
      }

      // 2. Crawl website homepage + contact page for deeper extraction
      if (business.website) {
        const targetUrl = business.website.startsWith('http') ? business.website : `https://${business.website}`;

        await page.goto(targetUrl, { waitUntil: 'commit', timeout: 15000 }).catch(() => null);
        await page.waitForLoadState('domcontentloaded').catch(() => null);

        const content = await page.content().catch(() => '');
        if (content) {
          const contacts = this.extractContactsFromHtml(content);

          if (contacts.email && !business.email) business.email = contacts.email;
          if (contacts.phone && !business.phone) business.phone = contacts.phone;

          // Merge socials from website
          business.socials = {
            ...contacts.socials,
            ...business.socials,
          };

          // Try contact page if email or social link is missing
          if (!business.email || !business.socials.instagram || !business.socials.facebook) {
            const contactBtn = page.locator('a[href*="contact"], a[href*="about"]').first();
            if (await contactBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
              const contactHref = await contactBtn.getAttribute('href');
              if (contactHref) {
                const fullContactUrl = contactHref.startsWith('http')
                  ? contactHref
                  : new URL(contactHref, targetUrl).toString();

                await page.goto(fullContactUrl, { waitUntil: 'commit', timeout: 10000 }).catch(() => null);
                await page.waitForLoadState('domcontentloaded').catch(() => null);
                const contactContent = await page.content().catch(() => '');
                if (contactContent) {
                  const contactSub = this.extractContactsFromHtml(contactContent);
                  if (contactSub.email && !business.email) business.email = contactSub.email;
                  if (contactSub.phone && !business.phone) business.phone = contactSub.phone;
                  business.socials = {
                    ...contactSub.socials,
                    ...business.socials,
                  };
                }
              }
            }
          }
        }
      }

      // Update funnel stage if enriched
      if ((business.website || business.phone || business.email) && business.funnelStage === 'new') {
        business.funnelStage = 'enriched';
      }

      // Technical website audit & scoring
      if (business.website) {
        try {
          const auditRes = await websiteAnalyzer.analyzeWebsite(business.website);
          business.technicalAudit = auditRes.audit;
          business.opportunityScore = auditRes.score;
          business.websiteScore = Math.max(10, 100 - auditRes.score);
        } catch {
          // Fallback scoring if website fetch fails
          business.opportunityScore = 80;
          business.websiteScore = 20;
        }
      } else {
        // High opportunity lead if missing a website entirely
        business.opportunityScore = 95;
        business.websiteScore = 0;
      }

      // Adjust opportunity score based on missing contact channels & ratings
      if (!business.email) business.opportunityScore = Math.min(99, business.opportunityScore + 5);
      if (!business.socials?.instagram) business.opportunityScore = Math.min(99, business.opportunityScore + 5);
      if (business.rating && business.rating < 4.2) business.opportunityScore = Math.min(99, business.opportunityScore + 5);

      logger.info(
        `✓ Enriched ${business.name} | Web: ${business.website || 'N/A'} | Email: ${business.email || 'N/A'} | Phone: ${business.phone || 'N/A'} | Insta: ${business.socials.instagram || 'N/A'}`
      );
    } catch (err) {
      logger.warn(`Failed to enrich contact info for ${business.name}: ${err instanceof Error ? err.message : String(err)}`);
    }

    return business;
  }

  /**
   * Enriches a batch of businesses concurrently using a Playwright worker page pool
   */
  public async enrichBatch(
    businesses: Business[],
    concurrency: number = 3
  ): Promise<{ enriched: Business[]; summary: EnrichmentSummary }> {
    if (businesses.length === 0) {
      return {
        enriched: [],
        summary: { processed: 0, emailsFound: 0, socialsFound: 0, websitesFound: 0, phonesFound: 0 },
      };
    }

    const workerCount = Math.max(1, Math.min(concurrency, businesses.length));
    logger.info(`🚀 Launching Contact Enrichment Pool with ${workerCount} parallel worker page(s) for ${businesses.length} lead(s)...`);

    await this.init(true);
    const context = await this.browser!.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });

    const pages: Page[] = await Promise.all(
      Array.from({ length: workerCount }, () => context.newPage())
    );

    const enrichedList: Business[] = new Array(businesses.length);
    let queueIndex = 0;

    const runWorker = async (page: Page) => {
      while (queueIndex < businesses.length) {
        const currentIndex = queueIndex++;
        const b = businesses[currentIndex];
        if (b) {
          const enriched = await this.enrichBusiness(page, b);
          enrichedList[currentIndex] = enriched;
        }
      }
    };

    await Promise.all(pages.map((p) => runWorker(p)));
    await context.close();
    await this.close();

    let emailsFound = 0;
    let socialsFound = 0;
    let websitesFound = 0;
    let phonesFound = 0;

    for (const enriched of enrichedList) {
      if (!enriched) continue;
      if (enriched.website) websitesFound++;
      if (enriched.email) emailsFound++;
      if (Object.keys(enriched.socials || {}).length > 0) socialsFound++;
      if (enriched.phone) phonesFound++;
    }

    return {
      enriched: enrichedList.filter(Boolean),
      summary: {
        processed: businesses.length,
        emailsFound,
        socialsFound,
        websitesFound,
        phonesFound,
      },
    };
  }
}

export const contactEnricher = new ContactEnricher();
