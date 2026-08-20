import { TechnicalAudit, WebsiteScoreResult } from '../types/scorer.js';
import { logger } from '../utils/logger.js';

/**
 * Technical Website Analyzer & Opportunity Scorer Engine
 */
export class WebsiteAnalyzer {
  /**
   * Analyzes target website technical features and computes 0-100 Lead Opportunity Score
   */
  public async analyzeWebsite(url: string, existingHtml?: string): Promise<WebsiteScoreResult> {
    logger.info(`Analyzing website technical features for: ${url}`);

    if (!url || typeof url !== 'string') {
      return this.createFallbackResult(url || '', 50);
    }

    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      let html = existingHtml || '';
      let loadSpeedSeconds = 1.0;

      if (!html) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const startTime = Date.now();
        const response = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }).catch(() => null);

        clearTimeout(timeoutId);
        loadSpeedSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

        if (!response || !response.ok) {
          // Site unreachable or failed - high opportunity score (needs web revamp/fix)
          return this.createFallbackResult(targetUrl, 85);
        }

        html = await response.text();
      }
      const hasHttps = targetUrl.startsWith('https://');

      // Contact Form Detection
      const hasContactForm = /<form/i.test(html) || /contact|inquiry|message|submit/i.test(html);

      // Online Booking Engine & Niche Portal Detection
      const bookingEngine = this.detectBookingEngine(html);
      const hasBookingSystem = Boolean(bookingEngine) ||
        /calendly\.com|fresha\.com|booksy\.com|mindbodyonline\.com|simplybook\.me|setmore\.com|book-now|schedule-appointment|online-booking/i.test(
          html
        );

      // Link-in-Bio & Social Landing Detection
      const linkInBioTool = this.detectLinkInBio(html, targetUrl);

      // WhatsApp CTA Detection
      const hasWhatsappLink =
        /wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(html) || /send\?phone=/i.test(html);

      // Payment Gateway Detection
      const paymentGateway = this.detectPaymentGateway(html);

      // Mobile Viewport Meta Tag
      const hasResponsiveViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

      // Favicon Detection
      const hasFavicon = /rel=["'](?:shortcut )?icon["']/i.test(html);

      // Social Links Extractions
      const socialLinks: TechnicalAudit['socialLinks'] = {};
      const fbMatch = html.match(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"']+)["']/i);
      if (fbMatch) socialLinks.facebook = fbMatch[1];

      const instaMatch = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/i);
      if (instaMatch) socialLinks.instagram = instaMatch[1];

      const liMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"']+)["']/i);
      if (liMatch) socialLinks.linkedin = liMatch[1];

      const ttMatch = html.match(/href=["'](https?:\/\/(?:www\.)?tiktok\.com\/@[^"']+)["']/i);
      if (ttMatch) socialLinks.tiktok = ttMatch[1];

      // Extract Meta Title & Meta Description
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const metaTitle = titleMatch ? titleMatch[1].trim() : undefined;

      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const metaDescription = descMatch ? descMatch[1].trim() : undefined;

      // OpenGraph Card Detection
      const hasOgImage = /<meta[^>]*property=["']og:image["']/i.test(html);
      const hasOgTitle = /<meta[^>]*property=["']og:title["']/i.test(html);
      const hasOgDescription = /<meta[^>]*property=["']og:description["']/i.test(html);
      const openGraph = { hasOgImage, hasOgTitle, hasOgDescription };

      // Detect CMS, Analytics, Frameworks & Chat Widgets
      const cms = this.detectCms(html);
      const analyticsDetected = this.detectAnalytics(html);
      const frameworks = this.detectFrameworks(html);
      const chatTools = this.detectChatTools(html);

      // Detect Lead Capture Channels
      const leadCaptureChannels = this.detectLeadCaptureChannels(html, hasWhatsappLink, hasContactForm, socialLinks);

      // Determine Sales Funnel Architecture
      const currentArchitecture = this.determineFunnelArchitecture(linkInBioTool, bookingEngine, hasWhatsappLink, hasContactForm, analyticsDetected, true);

      const funnelTechStack: TechnicalAudit['funnelTechStack'] = {
        linkInBioTool,
        bookingEngine,
        leadCaptureChannels,
        paymentGateway,
        analyticsRetargeting: analyticsDetected,
        currentArchitecture,
      };

      // Compute 0-100 SEO Score
      let seoScore = 0;
      if (hasHttps) seoScore += 20;
      if (metaTitle && metaTitle.length >= 10 && metaTitle.length <= 70) seoScore += 20;
      else if (metaTitle) seoScore += 10;
      if (metaDescription && metaDescription.length >= 30 && metaDescription.length <= 160) seoScore += 20;
      else if (metaDescription) seoScore += 10;
      if (hasResponsiveViewport) seoScore += 15;
      if (hasFavicon) seoScore += 15;
      if (hasOgImage) seoScore += 10;
      seoScore = Math.min(100, Math.max(0, seoScore));

      const audit: TechnicalAudit = {
        hasHttps,
        loadSpeedSeconds,
        hasContactForm,
        hasBookingSystem,
        hasWhatsappLink,
        socialLinks,
        analyticsDetected,
        cms,
        frameworks,
        chatTools,
        openGraph,
        seoScore,
        metaTitle,
        metaDescription,
        hasFavicon,
        hasResponsiveViewport,
        funnelTechStack,
      };

      // Calculate Lead Opportunity Score (0 to 100)
      // Base score = 35. Missing features increases opportunity score!
      let opportunityScore = 35;

      if (!hasWhatsappLink) opportunityScore += 20; // +20 if missing WhatsApp widget
      if (!hasBookingSystem) opportunityScore += 15; // +15 if missing booking portal
      if (!hasResponsiveViewport) opportunityScore += 15; // +15 if missing mobile layout
      if (analyticsDetected.length === 0) opportunityScore += 10; // +10 if missing conversion tracking
      if (!hasHttps) opportunityScore += 10; // +10 if insecure HTTP
      if (!hasContactForm) opportunityScore += 10; // +10 if missing contact form
      if (linkInBioTool && linkInBioTool !== 'Direct Website') opportunityScore += 10; // +10 if using 3rd-party Linktree

      // Cap score between 0 and 100
      opportunityScore = Math.min(100, Math.max(10, opportunityScore));

      return {
        url: targetUrl,
        score: opportunityScore,
        audit,
        scrapedAt: new Date().toISOString(),
      };
    } catch (err) {
      logger.warn(`Site audit fetch failed for ${targetUrl}: ${String(err)}`);
      return this.createFallbackResult(targetUrl, 75);
    }
  }

  public detectLinkInBio(html: string, url: string): string | undefined {
    if (/linktr\.ee/i.test(url) || /linktr\.ee/i.test(html)) return 'Linktree';
    if (/beacons\.ai/i.test(url) || /beacons\.ai/i.test(html)) return 'Beacons';
    if (/bento\.me/i.test(url) || /bento\.me/i.test(html)) return 'Bento';
    if (/taplink\.cc|taplink\.at/i.test(url) || /taplink\.cc/i.test(html)) return 'Taplink';
    if (/carrd\.co/i.test(url) || /carrd\.co/i.test(html)) return 'Carrd';
    if (/lnk\.bio/i.test(url) || /lnk\.bio/i.test(html)) return 'Lnk.Bio';
    if (/shorby\.com/i.test(url) || /shorby\.com/i.test(html)) return 'Shorby';
    return undefined;
  }

  public detectBookingEngine(html: string): string | undefined {
    // Fitness
    if (/octivfitness\.com|octiv|boxchamp\.co\.za/i.test(html)) return 'Octiv (BoxChamp)';
    if (/mindbodyonline\.com|mindbody/i.test(html)) return 'Mindbody';
    if (/glofox\.com/i.test(html)) return 'Glofox';
    if (/wodify\.com/i.test(html)) return 'Wodify';
    if (/zenplanner\.com/i.test(html)) return 'Zen Planner';
    if (/gymmasteronline\.com|gymmaster/i.test(html)) return 'GymMaster';

    // Beauty & Hair
    if (/fresha\.com/i.test(html)) return 'Fresha';
    if (/booksy\.com/i.test(html)) return 'Booksy';
    if (/treatwell\.co\.za|treatwell\.com/i.test(html)) return 'Treatwell';
    if (/gettimely\.com/i.test(html)) return 'Timely';
    if (/vagaro\.com/i.test(html)) return 'Vagaro';
    if (/phorest\.com/i.test(html)) return 'Phorest';

    // Dining & Food
    if (/dineplan\.com|dineplan/i.test(html)) return 'Dineplan';
    if (/opentable\.com|opentable/i.test(html)) return 'OpenTable';
    if (/eatout\.co\.za|eatout/i.test(html)) return 'EatOut';
    if (/resy\.com|resy/i.test(html)) return 'Resy';
    if (/mrdfood\.com|mrdfood|mr d food/i.test(html)) return 'Mr D Food';
    if (/ubereats\.com|ubereats|uber eats/i.test(html)) return 'Uber Eats';

    // Medical & Healthcare
    if (/recomed\.co\.za|recomed/i.test(html)) return 'RecoMed';
    if (/cliniko\.com|cliniko/i.test(html)) return 'Cliniko';
    if (/practo\.com|practo/i.test(html)) return 'Practo';

    // General Scheduling
    if (/calendly\.com/i.test(html)) return 'Calendly';
    if (/acuityscheduling\.com/i.test(html)) return 'Acuity Scheduling';
    if (/typeform\.com/i.test(html)) return 'Typeform';
    if (/jotform\.com/i.test(html)) return 'Jotform';
    if (/meetings\.hubspot\.com/i.test(html)) return 'HubSpot Meetings';
    if (/zoho\.com\/bookings/i.test(html)) return 'Zoho Bookings';

    return undefined;
  }

  public detectPaymentGateway(html: string): string | undefined {
    if (/yoco\.com|yoco\.co\.za|yoco/i.test(html)) return 'Yoco';
    if (/payfast\.co\.za|payfast/i.test(html)) return 'PayFast';
    if (/ozow\.com|ozow/i.test(html)) return 'Ozow';
    if (/paystack\.com|paystack/i.test(html)) return 'Paystack';
    if (/snapscan\.co\.za|snapscan/i.test(html)) return 'SnapScan';
    if (/zapper\.com|zapper/i.test(html)) return 'Zapper';
    if (/netcash\.co\.za|netcash/i.test(html)) return 'Netcash';
    return undefined;
  }

  public detectLeadCaptureChannels(
    html: string,
    hasWhatsapp: boolean,
    hasContactForm: boolean,
    socialLinks: TechnicalAudit['socialLinks']
  ): string[] {
    const channels: string[] = [];
    if (hasWhatsapp) channels.push('WhatsApp Direct');
    if (socialLinks?.instagram) channels.push('Instagram DM');
    if (hasContactForm) channels.push('Contact Form');
    if (/tel:|call|phone/i.test(html)) channels.push('Phone Call');
    if (/mailto:|@/i.test(html)) channels.push('Direct Email');
    return channels.length > 0 ? channels : ['Manual Phone / In-Person'];
  }

  public determineFunnelArchitecture(
    linkInBio: string | undefined,
    bookingEngine: string | undefined,
    hasWhatsapp: boolean,
    hasContactForm: boolean,
    analytics: string[],
    hasWebsite: boolean
  ): 'fragmented_external_stack' | 'manual_friction_heavy' | 'isolated_website_silo' | 'unified_optimized_hub' {
    if (linkInBio && linkInBio !== 'Direct Website') {
      return 'fragmented_external_stack';
    }
    if (bookingEngine && !hasWhatsapp && analytics.length === 0) {
      return 'fragmented_external_stack';
    }
    if (!bookingEngine && !hasWhatsapp && !hasContactForm) {
      return 'manual_friction_heavy';
    }
    if (hasWebsite && (!hasWhatsapp || analytics.length === 0)) {
      return 'isolated_website_silo';
    }
    return 'unified_optimized_hub';
  }

  private detectCms(html: string): string | undefined {
    if (/wp-content|wp-includes|wordpress/i.test(html)) return 'WordPress';
    if (/wixpress\.com|wix\.com|_wix/i.test(html)) return 'Wix';
    if (/cdn\.shopify\.com|shopify/i.test(html)) return 'Shopify';
    if (/squarespace\.com/i.test(html)) return 'Squarespace';
    if (/webflow\.com|website-files\.com/i.test(html)) return 'Webflow';
    if (/components\/com_/i.test(html)) return 'Joomla';
    if (/Drupal/i.test(html)) return 'Drupal';
    return undefined;
  }

  private detectAnalytics(html: string): string[] {
    const tools: string[] = [];
    if (/googletagmanager\.com\/gtag\/js|G-[A-Z0-9]+|UA-\d+/i.test(html)) tools.push('Google Analytics 4');
    if (/googletagmanager\.com\/gtm\.js/i.test(html)) tools.push('Google Tag Manager');
    if (/connect\.facebook\.net|fbevents\.js|fbq\(/i.test(html)) tools.push('Meta Pixel');
    if (/analytics\.tiktok\.com|ttq\.load/i.test(html)) tools.push('TikTok Pixel');
    if (/static\.hotjar\.com/i.test(html)) tools.push('Hotjar');
    return tools;
  }

  private detectFrameworks(html: string): string[] {
    const fw: string[] = [];
    if (/_next\/static|react/i.test(html)) fw.push('React / Next.js');
    if (/vue\.js|data-v-/i.test(html)) fw.push('Vue.js');
    if (/bootstrap/i.test(html)) fw.push('Bootstrap');
    if (/tailwind/i.test(html)) fw.push('TailwindCSS');
    if (/jquery/i.test(html)) fw.push('jQuery');
    return fw;
  }

  private detectChatTools(html: string): string[] {
    const chat: string[] = [];
    if (/tawk\.to/i.test(html)) chat.push('Tawk.to');
    if (/crisp\.chat/i.test(html)) chat.push('Crisp');
    if (/intercom/i.test(html)) chat.push('Intercom');
    if (/hubspot/i.test(html)) chat.push('HubSpot Chat');
    if (/zdassets\.com/i.test(html)) chat.push('Zendesk');
    return chat;
  }

  private createFallbackResult(url: string, defaultScore: number): WebsiteScoreResult {
    return {
      url,
      score: defaultScore,
      audit: {
        hasHttps: url.startsWith('https://'),
        loadSpeedSeconds: 2.5,
        hasContactForm: false,
        hasBookingSystem: false,
        hasWhatsappLink: false,
        socialLinks: {},
        analyticsDetected: [],
        seoScore: 40,
        hasFavicon: false,
        hasResponsiveViewport: false,
        funnelTechStack: {
          linkInBioTool: undefined,
          bookingEngine: undefined,
          leadCaptureChannels: ['Manual Phone / In-Person'],
          paymentGateway: undefined,
          analyticsRetargeting: [],
          currentArchitecture: 'manual_friction_heavy',
        },
      },
      scrapedAt: new Date().toISOString(),
    };
  }
}

export const websiteAnalyzer = new WebsiteAnalyzer();
