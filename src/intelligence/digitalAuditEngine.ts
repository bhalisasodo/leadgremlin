import { Business } from '../types/business.js';
import { TechnicalAudit } from '../types/scorer.js';
import {
  DigitalPresenceAudit,
  DigitalPresenceClassification,
} from '../types/intelligence.js';

export class DigitalAuditEngine {
  /**
   * Evaluates digital presence across web, search, mobile, and conversion capabilities
   */
  public static audit(lead: Partial<Business>, audit?: TechnicalAudit): DigitalPresenceAudit {
    const hasWebsite = Boolean(lead.website && lead.website.trim() !== '');
    const isAccessible = hasWebsite && (audit?.hasHttps !== undefined ? true : true);
    const isCurrent = Boolean(audit?.metaTitle || audit?.cms || lead.reviewCount);
    const isMobileFriendly = audit?.hasResponsiveViewport ?? hasWebsite;
    const hasContactInfo = Boolean(lead.phone || lead.email || audit?.hasContactForm);
    const hasSocialProof = Boolean((lead.rating && lead.rating >= 4.0) || (lead.reviewCount && lead.reviewCount >= 5));
    const hasEcommerce = Boolean(
      audit?.funnelTechStack?.paymentGateway ||
      /shopify|woocommerce|payfast|yoco|cart|checkout/i.test(audit?.cms || '')
    );
    const hasBooking = Boolean(audit?.hasBookingSystem || audit?.funnelTechStack?.bookingEngine);
    const hasWhatsapp = Boolean(audit?.hasWhatsappLink || lead.phone);

    // Offer Clarity
    let offerClarity: 'poor' | 'fair' | 'clear' | 'compelling' = 'fair';
    if (!hasWebsite) {
      offerClarity = 'poor';
    } else if (audit?.openGraph?.hasOgTitle && audit?.metaDescription) {
      offerClarity = 'compelling';
    } else if (audit?.metaTitle) {
      offerClarity = 'clear';
    }

    // Conversion Support
    let conversionSupport: 'none' | 'weak_forms' | 'functional_cta' | 'high_converting_hub' = 'none';
    if (!hasWebsite) {
      conversionSupport = hasWhatsapp ? 'functional_cta' : 'none';
    } else if (hasBooking && hasWhatsapp && audit?.analyticsDetected && audit.analyticsDetected.length > 0) {
      conversionSupport = 'high_converting_hub';
    } else if (hasBooking || hasWhatsapp) {
      conversionSupport = 'functional_cta';
    } else if (audit?.hasContactForm) {
      conversionSupport = 'weak_forms';
    }

    // Local SEO Status
    let localSeoStatus: 'absent' | 'basic_nap' | 'optimized_gmb' | 'dominant' = 'basic_nap';
    if (lead.reviewCount && lead.reviewCount >= 50 && lead.rating && lead.rating >= 4.7) {
      localSeoStatus = 'dominant';
    } else if (lead.rating && lead.reviewCount && lead.reviewCount >= 15) {
      localSeoStatus = 'optimized_gmb';
    } else if (lead.address || lead.phone) {
      localSeoStatus = 'basic_nap';
    } else {
      localSeoStatus = 'absent';
    }

    // Classification
    let classification: DigitalPresenceClassification = 'BASIC';
    if (!hasWebsite) {
      classification = (lead.socials?.instagram || lead.socials?.facebook) ? 'BASIC' : 'NO_PRESENCE';
    } else if (conversionSupport === 'high_converting_hub' && localSeoStatus === 'dominant') {
      classification = 'HIGH_CONVERTING';
    } else if (hasBooking && isMobileFriendly && hasSocialProof) {
      classification = 'STRONG';
    } else if (hasWebsite && hasContactInfo) {
      classification = 'FUNCTIONAL';
    } else if (hasWebsite && !isMobileFriendly) {
      classification = 'DORMANT';
    }

    // Usefulness Verdict
    let usefulnessVerdict: 'non_existent' | 'merely_informational' | 'functional_resource' | 'active_conversion_engine' = 'merely_informational';
    if (!hasWebsite) {
      usefulnessVerdict = 'non_existent';
    } else if (conversionSupport === 'high_converting_hub') {
      usefulnessVerdict = 'active_conversion_engine';
    } else if (hasBooking || hasWhatsapp) {
      usefulnessVerdict = 'functional_resource';
    } else {
      usefulnessVerdict = 'merely_informational';
    }

    // Summary evaluation
    let summary = '';
    if (!hasWebsite) {
      summary = `No official website detected. Digital presence relies entirely on directory listings and social channels.`;
    } else if (usefulnessVerdict === 'merely_informational') {
      summary = `Website is active but functions primarily as a static brochure without direct booking or instant lead capture workflows.`;
    } else if (usefulnessVerdict === 'functional_resource') {
      summary = `Website provides functional contact points (${hasWhatsapp ? 'WhatsApp' : 'Forms'}), but lacks end-to-end automated conversion tracking and booking integration.`;
    } else {
      summary = `Well-structured digital hub with automated booking, direct communication rails, and conversion analytics.`;
    }

    return {
      classification,
      has_website: hasWebsite,
      is_active: isAccessible,
      is_technically_accessible: isAccessible,
      is_current: isCurrent,
      is_mobile_friendly: isMobileFriendly,
      offer_clarity: offerClarity,
      conversion_support: conversionSupport,
      local_seo_status: localSeoStatus,
      has_contact_info: hasContactInfo,
      has_social_proof: hasSocialProof,
      has_ecommerce: hasEcommerce,
      has_booking: hasBooking,
      has_whatsapp: hasWhatsapp,
      usefulness_verdict: usefulnessVerdict,
      summary,
    };
  }
}
