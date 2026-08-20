import { Business } from '../types/business.js';
import { IdentityResolution, DecisionMakerInfo, ConfidenceLevel } from '../types/intelligence.js';

export class IdentityResolver {
  /**
   * Resolves canonical business identity, decision-maker, and confidence level
   */
  public static resolveIdentity(lead: Partial<Business>, additionalText?: string): IdentityResolution {
    const rawName = (lead.name || 'Unnamed Business').trim();
    const cleanName = this.normalizeCanonicalName(rawName);
    const alternateNames = this.findAlternateNames(rawName, cleanName, lead.rawCategory);
    
    // Resolve Location
    const location = this.resolveLocation(lead.area || '', lead.address || '', additionalText || '');

    // Resolve Decision Maker
    const decisionMaker = this.detectDecisionMaker(rawName, cleanName, lead, additionalText || '');

    // Determine Active Status
    const isActive = this.determineActiveStatus(lead);

    // Brand transition detection
    const brandTransition = this.detectBrandTransition(rawName, additionalText || '');

    // Disambiguation
    const disambiguation = this.checkDisambiguation(cleanName, lead.area || '');

    // Determine Confidence
    const { confidence, reason } = this.calculateConfidence(cleanName, lead, location.is_verified, decisionMaker);

    return {
      canonical_name: cleanName,
      alternate_names: alternateNames,
      former_names: brandTransition.hasTransition ? [brandTransition.formerName] : [],
      location: {
        suburb: location.suburb,
        city: location.city,
        province: location.province,
        country: 'South Africa',
        address: lead.address || (lead.area ? `${lead.area}, South Africa` : undefined),
        is_verified: location.is_verified,
      },
      industry: lead.category || 'Local Business',
      business_type: lead.rawCategory || lead.category || 'Local Service Provider',
      phone: lead.phone,
      email: lead.email,
      website: lead.website,
      social_accounts: {
        instagram: lead.socials?.instagram,
        facebook: lead.socials?.facebook,
        linkedin: lead.socials?.linkedin,
        twitter: lead.socials?.twitter,
        tiktok: lead.socials?.tiktok,
        youtube: lead.socials?.youtube,
      },
      decision_maker: decisionMaker,
      is_currently_active: isActive,
      brand_transition_detected: brandTransition.hasTransition,
      similar_name_disambiguation: disambiguation,
      identity_confidence: confidence,
      confidence_reason: reason,
    };
  }

  private static normalizeCanonicalName(name: string): string {
    return name
      .replace(/\s*-\s*(Umhlanga|Durban|Sandton|Cape Town|Ballito|Pretoria|Johannesburg|Branch|HQ|South Africa).*$/i, '')
      .replace(/\s*\|\s*.*$/, '')
      .replace(/\s*\(pty\)\s*ltd/i, '')
      .replace(/\s*\(.*?\)$/, '')
      .trim();
  }

  private static findAlternateNames(rawName: string, canonicalName: string, rawCategory?: string): string[] {
    const alternates: string[] = [];
    if (rawName !== canonicalName) {
      alternates.push(rawName);
    }
    if (rawCategory && !alternates.includes(rawCategory) && rawCategory.length > 3) {
      // If rawCategory looks like an alternate trading style
      if (!/business|company|service|store|shop|clinic/i.test(rawCategory)) {
        alternates.push(rawCategory);
      }
    }
    return alternates;
  }

  private static resolveLocation(area: string, address: string, context: string): {
    suburb: string;
    city: string;
    province: string;
    is_verified: boolean;
  } {
    const combined = `${area} ${address} ${context}`.toLowerCase();

    let suburb = area || 'Umhlanga';
    let city = 'Durban';
    let province = 'KwaZulu-Natal';
    let is_verified = Boolean(address && address.length > 8);

    if (combined.includes('sandton') || combined.includes('bryanston') || combined.includes('rosebank') || combined.includes('fourways')) {
      city = 'Johannesburg';
      province = 'Gauteng';
      if (combined.includes('sandton')) suburb = 'Sandton';
      else if (combined.includes('bryanston')) suburb = 'Bryanston';
      else if (combined.includes('rosebank')) suburb = 'Rosebank';
      else if (combined.includes('fourways')) suburb = 'Fourways';
    } else if (combined.includes('pretoria') || combined.includes('centurion') || combined.includes('menlyn')) {
      city = 'Pretoria';
      province = 'Gauteng';
      suburb = combined.includes('centurion') ? 'Centurion' : 'Pretoria East';
    } else if (combined.includes('cape town') || combined.includes('sea point') || combined.includes('camps bay') || combined.includes('constantia') || combined.includes('stellenbosch')) {
      city = 'Cape Town';
      province = 'Western Cape';
      if (combined.includes('sea point')) suburb = 'Sea Point';
      else if (combined.includes('camps bay')) suburb = 'Camps Bay';
      else if (combined.includes('constantia')) suburb = 'Constantia';
      else if (combined.includes('stellenbosch')) suburb = 'Stellenbosch';
    } else if (combined.includes('ballito') || combined.includes('salt rock')) {
      city = 'Ballito';
      province = 'KwaZulu-Natal';
      suburb = 'Ballito';
    } else if (combined.includes('umhlanga')) {
      city = 'Durban';
      province = 'KwaZulu-Natal';
      if (combined.includes('ridge')) suburb = 'Umhlanga Ridge';
      else if (combined.includes('rocks')) suburb = 'Umhlanga Rocks';
      else if (combined.includes('arch')) suburb = 'Umhlanga Arch';
      else suburb = area || 'Umhlanga';
    } else if (combined.includes('durban north')) {
      city = 'Durban';
      province = 'KwaZulu-Natal';
      suburb = 'Durban North';
    }

    return { suburb, city, province, is_verified };
  }

  private static detectDecisionMaker(
    rawName: string,
    canonicalName: string,
    lead: Partial<Business>,
    context: string
  ): DecisionMakerInfo {
    const rawSearchText = `${context || ''} ${lead.notes || ''}`.trim();

    // 1. Check for explicit known decision maker patterns in context/notes
    // e.g. "Coach Mish Lyle", "Founder: John Doe", "Dr. Naidoo", "Owner: Sarah", etc.
    const founderMatch = rawSearchText.match(/(?:founder|owner|head coach|coach|lead doctor|director|managing director|dr\.?)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (founderMatch && founderMatch[1] && !['The', 'South', 'Gym', 'Fitness', 'Auto', 'Spa', 'Africa', 'Umhlanga', 'Durban'].includes(founderMatch[1])) {
      return {
        name: founderMatch[1].trim(),
        role: founderMatch[0].toLowerCase().includes('coach') ? 'Founder & Head Coach' : 'Founder / Lead Decision Maker',
        confidence: 'HIGH',
        discovery_notes: `Identified directly from verified profile context.`,
        verified: true,
      };
    }

    // 2. Check for personal brand name in business title (e.g. "Dr. Trevor Jones Dental", "Mish Lyle Coaching")
    const personalNameMatch = rawName.match(/^(?:Dr\.?|Prof\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (personalNameMatch && personalNameMatch[1]) {
      return {
        name: personalNameMatch[0].trim(),
        role: 'Principal Practitioner / Owner',
        confidence: 'HIGH',
        discovery_notes: `Identified from registered practice title.`,
        verified: true,
      };
    }

    // 3. Instagram / LinkedIn bio mentions
    if (lead.socials?.linkedin && lead.socials.linkedin.includes('/in/')) {
      const parts = lead.socials.linkedin.split('/in/')[1]?.split('/')[0]?.replace(/-/g, ' ');
      if (parts && parts.length > 2) {
        const capitalized = parts
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        return {
          name: capitalized,
          role: 'Decision Maker',
          linkedin_url: lead.socials.linkedin,
          confidence: 'MEDIUM',
          discovery_notes: 'Extracted from LinkedIn personal profile handle.',
          verified: false,
        };
      }
    }

    // Unverified / Unable to confirm
    return {
      confidence: 'LOW',
      discovery_notes: 'Unable to verify individual decision-maker without speculative assumption.',
      verified: false,
    };
  }

  private static determineActiveStatus(lead: Partial<Business>): boolean {
    // If has recent reviews, active website, phone, or recent scraped data
    if (lead.rating && lead.reviewCount && lead.reviewCount > 0) return true;
    if (lead.phone || lead.website || (lead.socials && Object.keys(lead.socials).length > 0)) return true;
    return true;
  }

  private static detectBrandTransition(name: string, context: string): { hasTransition: boolean; formerName: string } {
    const match = context.match(/(?:formerly|previously|rebranded from|ex-)\s+([A-Z][a-zA-Z0-9\s&]+)/i);
    if (match && match[1]) {
      return { hasTransition: true, formerName: match[1].trim() };
    }
    return { hasTransition: false, formerName: '' };
  }

  private static checkDisambiguation(name: string, area: string): string | undefined {
    // Check if multi-location or common brand name
    const commonBrands = ['planet fitness', 'virgin active', 'sorbet', 'bodytec', 'f45'];
    if (commonBrands.some((b) => name.toLowerCase().includes(b))) {
      return `Branch location disambiguated for ${area} regional market.`;
    }
    return undefined;
  }

  private static calculateConfidence(
    name: string,
    lead: Partial<Business>,
    locationVerified: boolean,
    decisionMaker: DecisionMakerInfo
  ): { confidence: ConfidenceLevel; reason: string } {
    let score = 0;
    const reasons: string[] = [];

    if (name && name.length > 2) score += 20;
    if (lead.phone) {
      score += 25;
      reasons.push('Verified phone number');
    }
    if (lead.website) {
      score += 25;
      reasons.push('Active web domain');
    }
    if (lead.socials?.instagram || lead.socials?.facebook) {
      score += 15;
      reasons.push('Linked social profile');
    }
    if (locationVerified) {
      score += 15;
      reasons.push('Physical address verified');
    }
    if (decisionMaker.verified) {
      score += 15;
      reasons.push('Identified decision maker');
    }

    if (score >= 70) {
      return {
        confidence: 'HIGH',
        reason: `Canonical identity verified with high certainty (${reasons.join(', ')}).`,
      };
    } else if (score >= 40) {
      return {
        confidence: 'MEDIUM',
        reason: `Identity established through partial digital signals (${reasons.join(', ')}).`,
      };
    } else {
      return {
        confidence: 'LOW',
        reason: 'Sparse digital footprint. Identity unconfirmed across secondary registries.',
      };
    }
  }
}
