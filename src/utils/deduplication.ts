import { Business } from '../types/business.js';

export class Deduplicator {
  private seenWebsites = new Set<string>();
  private seenPhones = new Set<string>();
  private seenMapsUrls = new Set<string>();
  private seenNormalizedNames = new Set<string>();

  private genericNames = new Set(['results', 'resultsfor', 'search', 'googlemaps', 'maps']);

  /**
   * Normalizes a business name for fuzzy comparison.
   * e.g., "Better Bodies Gym (Pty) Ltd" -> "betterbodiesgym"
   */
  public normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/pty\s+ltd|inc|llc|cc|gym|fitness|center|centre/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Normalizes phone number (strips spaces, dashes, brackets, country codes)
   * e.g. "+27 (031) 555-1234" -> "0315551234"
   */
  public normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('27') && digits.length === 11) {
      return '0' + digits.slice(2);
    }
    return digits;
  }

  /**
   * Normalizes website URL (strips protocol, www, trailing slashes, query params)
   * e.g. "https://www.betterbodies.co.za/?ref=123" -> "betterbodies.co.za"
   */
  public normalizeWebsite(url: string): string {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  }

  /**
   * Checks if a business is a duplicate of a previously indexed business.
   */
  public isDuplicate(business: Business): { isDup: boolean; reason?: string } {
    if (business.website) {
      const normWeb = this.normalizeWebsite(business.website);
      if (normWeb && this.seenWebsites.has(normWeb)) {
        return { isDup: true, reason: `Duplicate website: ${normWeb}` };
      }
    }

    if (business.phone) {
      const normPhone = this.normalizePhone(business.phone);
      if (normPhone && normPhone.length >= 7 && this.seenPhones.has(normPhone)) {
        return { isDup: true, reason: `Duplicate phone: ${normPhone}` };
      }
    }

    if (business.mapsUrl) {
      const cleanMaps = business.mapsUrl.split('?')[0];
      if (cleanMaps && this.seenMapsUrls.has(cleanMaps)) {
        return { isDup: true, reason: `Duplicate Maps URL: ${cleanMaps}` };
      }
    }

    if (business.name) {
      const normName = this.normalizeName(business.name);
      if (normName && normName.length > 2 && !this.genericNames.has(normName) && this.seenNormalizedNames.has(normName)) {
        return { isDup: true, reason: `Duplicate normalized name: ${normName}` };
      }
    }

    return { isDup: false };
  }

  /**
   * Registers a business into memory to prevent future duplicates.
   */
  public register(business: Business): void {
    if (business.website) {
      const normWeb = this.normalizeWebsite(business.website);
      if (normWeb) this.seenWebsites.add(normWeb);
    }

    if (business.phone) {
      const normPhone = this.normalizePhone(business.phone);
      if (normPhone && normPhone.length >= 7) this.seenPhones.add(normPhone);
    }

    if (business.mapsUrl) {
      const cleanMaps = business.mapsUrl.split('?')[0];
      if (cleanMaps) this.seenMapsUrls.add(cleanMaps);
    }

    if (business.name) {
      const normName = this.normalizeName(business.name);
      if (normName && normName.length > 2 && !this.genericNames.has(normName)) {
        this.seenNormalizedNames.add(normName);
      }
    }
  }

  /**
   * Resets internal index
   */
  public clear(): void {
    this.seenWebsites.clear();
    this.seenPhones.clear();
    this.seenMapsUrls.clear();
    this.seenNormalizedNames.clear();
  }
}
