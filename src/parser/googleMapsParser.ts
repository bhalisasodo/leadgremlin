import { Business } from '../types/business.js';
import { CategoryClassifier } from '../utils/categoryClassifier.js';
import crypto from 'crypto';

export class GoogleMapsParser {
  /**
   * Cleans text content (removes extra spaces, newlines)
   */
  public cleanText(text?: string | null): string | undefined {
    if (!text) return undefined;
    const cleaned = text.replace(/\s+/g, ' ').trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }

  /**
   * Parses rating and review count from text strings
   */
  public parseRatingAndReviews(ratingText?: string | null): { rating?: number; reviewCount?: number } {
    if (!ratingText) return {};

    const ratingMatch = ratingText.match(/(\d[.,]\d)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : undefined;

    const reviewMatch = ratingText.match(/(\d[\d\s,.]*)\s*(reviews|ratings|\()/i);
    let reviewCount: number | undefined;
    if (reviewMatch) {
      const cleanedNum = reviewMatch[1].replace(/[\s,.]/g, '');
      reviewCount = parseInt(cleanedNum, 10);
      if (isNaN(reviewCount)) reviewCount = undefined;
    }

    return { rating, reviewCount };
  }

  /**
   * Extracts clean phone number string from raw text
   */
  public parsePhone(phoneText?: string | null): string | undefined {
    if (!phoneText) return undefined;
    const cleaned = this.cleanText(phoneText);
    if (!cleaned) return undefined;

    const phoneMatch = cleaned.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/);
    return phoneMatch ? phoneMatch[0].trim() : cleaned;
  }

  /**
   * Cleans raw Google Maps place URL to a standard canonical URL
   */
  public cleanMapsUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url;
    }
  }

  /**
   * Validates and cleans raw business object
   */
  public finalizeBusiness(raw: Partial<Business>, searchTerm?: string): Business | null {
    const name = this.cleanText(raw.name);
    if (!name) return null;

    const rawCat = this.cleanText(raw.rawCategory || raw.category) || 'Local Business';
    const category = CategoryClassifier.classify(name, rawCat, searchTerm || '');
    const id = raw.id || `lead_${crypto.randomBytes(6).toString('hex')}`;

    return {
      id,
      name,
      category,
      rawCategory: rawCat,
      area: raw.area || 'Umhlanga',
      address: this.cleanText(raw.address),
      phone: this.parsePhone(raw.phone),
      website: this.cleanText(raw.website),
      email: raw.email,
      socials: raw.socials || {},
      rating: typeof raw.rating === 'number' ? raw.rating : undefined,
      reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : undefined,
      mapsUrl: this.cleanMapsUrl(raw.mapsUrl),
      plusCode: this.cleanText(raw.plusCode),
      funnelStage: raw.funnelStage || 'new',
      opportunityScore: raw.opportunityScore || 75,
      notes: raw.notes,
      scrapedAt: new Date().toISOString(),
      searchTerm,
      source: raw.source || 'google_maps',
    };
  }
}

export const googleMapsParser = new GoogleMapsParser();
