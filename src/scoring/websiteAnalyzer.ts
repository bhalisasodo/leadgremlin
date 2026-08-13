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

      // Online Booking Engine Detection
      const hasBookingSystem =
        /calendly\.com|fresha\.com|booksy\.com|mindbodyonline\.com|simplybook\.me|setmore\.com|book-now|schedule-appointment|online-booking/i.test(
          html
        );

      // WhatsApp CTA Detection
      const hasWhatsappLink =
        /wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(html) || /send\?phone=/i.test(html);

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
      },
      scrapedAt: new Date().toISOString(),
    };
  }
}

export const websiteAnalyzer = new WebsiteAnalyzer();
