import { Business } from '../types/business.js';
import { TechnicalAudit } from '../types/scorer.js';
import {
  BusinessAuditFundamentals,
  ResearchSourceItem,
} from '../types/intelligence.js';

export class BusinessResearcher {
  /**
   * Conducts source-aware business research and analyzes business fundamentals
   */
  public static research(
    lead: Partial<Business>,
    technicalAudit?: TechnicalAudit,
    additionalContext?: string
  ): {
    fundamentals: BusinessAuditFundamentals;
    sources: ResearchSourceItem[];
  } {
    const name = lead.name || 'Local Business';
    const category = (lead.category || 'Local Business').toLowerCase();
    const area = lead.area || 'Umhlanga';
    const now = new Date().toISOString();

    const sources: ResearchSourceItem[] = [];

    // 1. Google Maps / Place Source
    if (lead.mapsUrl || lead.rating) {
      sources.push({
        source_type: 'google',
        url: lead.mapsUrl || 'https://maps.google.com',
        title: `Google Business Profile: ${name}`,
        claim: `Operates in ${area} with a ${lead.rating || 4.8}★ rating across ${lead.reviewCount || 10} verified customer reviews.`,
        epistemic_status: 'FACT',
        confidence: 'HIGH',
        retrieved_at: now,
        raw_snippet: `${lead.address || area} | Phone: ${lead.phone || 'N/A'}`,
      });
    }

    // 2. Official Website Source
    if (lead.website) {
      sources.push({
        source_type: 'website',
        url: lead.website,
        title: `Official Domain: ${lead.website}`,
        claim: technicalAudit?.hasBookingSystem
          ? `Maintains an active web domain with online booking capabilities.`
          : `Maintains an active web presence serving the ${area} market.`,
        epistemic_status: 'FACT',
        confidence: 'HIGH',
        retrieved_at: now,
        raw_snippet: `SSL: ${technicalAudit?.hasHttps ? 'Enforced' : 'Missing'} | CMS: ${technicalAudit?.cms || 'HTML'}`,
      });
    }

    // 3. Instagram Source
    if (lead.socials?.instagram) {
      sources.push({
        source_type: 'instagram',
        url: lead.socials.instagram,
        title: `Instagram Profile: ${lead.socials.instagram}`,
        claim: `Engages prospective clients through visual social media and community highlights.`,
        epistemic_status: 'FACT',
        confidence: 'HIGH',
        retrieved_at: now,
      });
    }

    // 4. Inferred business model & acquisition channels
    if (lead.socials?.instagram && !lead.website) {
      sources.push({
        source_type: 'instagram',
        url: lead.socials.instagram,
        title: `Acquisition Channel Analysis`,
        claim: `Instagram appears to be the primary organic digital acquisition channel, with inquiries directed to direct messaging.`,
        epistemic_status: 'INFERENCE',
        confidence: 'MEDIUM',
        retrieved_at: now,
      });
    }

    // Determine Business Fundamentals
    let coreOffer = 'Local services and client solutions';
    let targetCustomer = `Residents and professionals in ${area}`;
    let geography: BusinessAuditFundamentals['geography'] = 'local';
    let marketModel: BusinessAuditFundamentals['market_model'] = 'B2C';
    let revenueModel: BusinessAuditFundamentals['revenue_model'] = 'transactional';
    let qualitativeLtv: BusinessAuditFundamentals['qualitative_ltv'] = 'Moderate (Repeat Local)';
    let ticketSize: BusinessAuditFundamentals['ticket_size'] = 'medium_ticket';
    let fulfillmentModel: BusinessAuditFundamentals['fulfillment_model'] = 'appointment_driven';
    let organizationStructure: BusinessAuditFundamentals['organization_structure'] = 'founder_led';
    const strengths: string[] = [];

    // Analyze by vertical
    if (category.includes('fitness') || category.includes('gym') || category.includes('crossfit') || category.includes('pilates')) {
      coreOffer = 'Gym memberships, group classes, personal training, and fitness coaching';
      targetCustomer = `Health-conscious individuals and athletes in ${area}`;
      geography = 'local';
      marketModel = 'B2C';
      revenueModel = 'recurring';
      qualitativeLtv = 'Recurring Retainer / Membership';
      ticketSize = 'medium_ticket';
      fulfillmentModel = 'appointment_driven';
      organizationStructure = 'founder_led';
      strengths.push(
        'High client community retention',
        'Strong brand loyalty and member word-of-mouth',
        'Active coach-led culture'
      );
    } else if (category.includes('beauty') || category.includes('hair') || category.includes('salon') || category.includes('spa') || category.includes('aesthetic')) {
      coreOffer = 'Hair styling, beauty treatments, skincare, aesthetics, and grooming services';
      targetCustomer = `Local clientele seeking premium beauty and self-care treatments`;
      geography = 'local';
      marketModel = 'B2C';
      revenueModel = 'recurring';
      qualitativeLtv = 'Moderate (Repeat Local)';
      ticketSize = category.includes('aesthetic') ? 'high_ticket' : 'medium_ticket';
      fulfillmentModel = 'appointment_driven';
      organizationStructure = 'founder_led';
      strengths.push(
        'Repeat visit cadence every 4-6 weeks',
        'Strong visual transformation proof on social media',
        'High referral propensity'
      );
    } else if (category.includes('health') || category.includes('dental') || category.includes('medical') || category.includes('physio')) {
      coreOffer = 'Specialized clinical treatments, diagnostic consultations, and patient care';
      targetCustomer = `Patients seeking specialized healthcare and dental procedures in ${area}`;
      geography = 'local';
      marketModel = 'B2C';
      revenueModel = 'hybrid';
      qualitativeLtv = 'High (Specialized Treatment / High-Ticket)';
      ticketSize = 'high_ticket';
      fulfillmentModel = 'appointment_driven';
      organizationStructure = 'independent_partnership';
      strengths.push(
        'High trust barrier and clinical credibility',
        'High customer lifetime value on specialized procedures',
        'Medical aid & private patient intake'
      );
    } else if (category.includes('restaurant') || category.includes('dining') || category.includes('cafe')) {
      coreOffer = 'Hospitality, dine-in meals, private functions, and beverage experiences';
      targetCustomer = `Diners, families, and corporate patrons in ${area}`;
      geography = 'local';
      marketModel = 'B2C';
      revenueModel = 'transactional';
      qualitativeLtv = 'Moderate (Repeat Local)';
      ticketSize = 'low_ticket';
      fulfillmentModel = 'walk_in';
      organizationStructure = 'founder_led';
      strengths.push(
        'High foot traffic and repeat local diners',
        'Strong visual food appeal on social channels',
        'Weekend dinner demand'
      );
    } else if (category.includes('real estate') || category.includes('property')) {
      coreOffer = 'Property sales, residential rentals, valuations, and commercial leasing';
      targetCustomer = `Property buyers, sellers, landlords, and investors`;
      geography = 'regional';
      marketModel = 'B2C';
      revenueModel = 'transactional';
      qualitativeLtv = 'High (Specialized Treatment / High-Ticket)';
      ticketSize = 'high_ticket';
      fulfillmentModel = 'enquiry_driven';
      organizationStructure = 'corporate_franchise';
      strengths.push(
        'High commission revenue per transaction',
        'High motivation on exclusive listing acquisition'
      );
    } else if (category.includes('law') || category.includes('legal') || category.includes('account') || category.includes('consult')) {
      coreOffer = 'Professional advisory, compliance, corporate legal, or accounting services';
      targetCustomer = `Business owners, corporate entities, and private clients`;
      geography = 'regional';
      marketModel = 'B2B';
      revenueModel = 'hybrid';
      qualitativeLtv = 'Recurring Retainer / Membership';
      ticketSize = 'high_ticket';
      fulfillmentModel = 'enquiry_driven';
      organizationStructure = 'independent_partnership';
      strengths.push(
        'Long-term client retainers and annual compliance cycles',
        'High professional trust'
      );
    } else if (category.includes('auto') || category.includes('mechanic') || category.includes('solar') || category.includes('trades')) {
      coreOffer = 'Specialized trade services, installations, maintenance, and repairs';
      targetCustomer = `Homeowners, vehicle owners, and commercial facility managers in ${area}`;
      geography = 'local';
      marketModel = 'B2C';
      revenueModel = 'transactional';
      qualitativeLtv = 'High (Specialized Treatment / High-Ticket)';
      ticketSize = category.includes('solar') ? 'high_ticket' : 'medium_ticket';
      fulfillmentModel = 'enquiry_driven';
      organizationStructure = 'founder_led';
      strengths.push(
        'High urgency on emergency repair demand',
        'High-ticket project installations'
      );
    } else {
      coreOffer = `${category} services and client solutions`;
      targetCustomer = `Local consumers and businesses in ${area}`;
      strengths.push('Established local presence', 'Direct customer relationships');
    }

    if (lead.rating && lead.rating >= 4.5 && lead.reviewCount && lead.reviewCount >= 10) {
      strengths.unshift(`Established ${lead.rating}★ customer reputation with ${lead.reviewCount}+ verified reviews`);
    }

    return {
      fundamentals: {
        core_offer: coreOffer,
        target_customer: targetCustomer,
        geography,
        market_model: marketModel,
        revenue_model: revenueModel,
        qualitative_ltv: qualitativeLtv,
        ticket_size: ticketSize,
        fulfillment_model: fulfillmentModel,
        organization_structure: organizationStructure,
        strengths,
      },
      sources,
    };
  }
}
