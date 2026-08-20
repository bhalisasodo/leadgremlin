import { Business } from '../types/business.js';
import { TechnicalAudit } from '../types/scorer.js';
import {
  CustomerJourneyStage,
  DigitalPresenceAudit,
  FunnelAudit,
  SocialCommercialAudit,
} from '../types/intelligence.js';

export class FunnelAnalyzer {
  /**
   * Evaluates the complete customer journey from discovery to retention and pinpoints primary friction
   */
  public static analyze(
    lead: Partial<Business>,
    digitalAudit: DigitalPresenceAudit,
    socialAudit: SocialCommercialAudit,
    technicalAudit?: TechnicalAudit
  ): FunnelAudit {
    const name = lead.name || 'The business';
    const category = lead.category || 'Local Business';
    const area = lead.area || 'Umhlanga';
    const hasWebsite = digitalAudit.has_website;
    const hasSocials = socialAudit.is_active;
    const funnelStack = lead.funnelTechStack || technicalAudit?.funnelTechStack;
    const linkTool = funnelStack?.linkInBioTool;
    const bookingEngine = funnelStack?.bookingEngine;

    const stages: Record<string, CustomerJourneyStage> = {};
    const frictionPoints: string[] = [];

    // 1. DISCOVERY
    let discoveryChannel = 'Google Maps / Local Search';
    let discoveryAssessment = `Prospects discover ${name} through Google search and local Google Maps listings.`;
    let discoveryFriction: 'low' | 'medium' | 'high' = 'low';
    const discoveryFrictionList: string[] = [];

    if (hasSocials && socialAudit.primary_platform === 'Instagram') {
      discoveryChannel = 'Instagram & Google Maps';
      discoveryAssessment = `Primary awareness is driven by active social content on Instagram and local Google listings in ${area}.`;
    } else if (!hasWebsite && (!lead.rating || lead.rating < 4.0)) {
      discoveryChannel = 'Word of Mouth / Unoptimized Maps';
      discoveryAssessment = `Discoverability is constrained by lack of dedicated web search presence and sparse directory listings.`;
      discoveryFriction = 'high';
      discoveryFrictionList.push('Weak organic search visibility for high-intent category queries');
    }

    if (digitalAudit.local_seo_status === 'absent' || digitalAudit.local_seo_status === 'basic_nap') {
      discoveryFrictionList.push('Unoptimized Google Maps profile missing keyword-rich service categories');
    }

    stages['Discovery'] = {
      stage_name: 'Discovery',
      current_channel: discoveryChannel,
      assessment: discoveryAssessment,
      friction_level: discoveryFriction,
      friction_points: discoveryFrictionList,
    };

    // 2. UNDERSTANDING
    let understandingChannel = hasWebsite ? 'Official Website' : hasSocials ? 'Social Bio / Posts' : 'Google Listing';
    let understandingAssessment = '';
    let understandingFriction: 'low' | 'medium' | 'high' = 'low';
    const understandingFrictionList: string[] = [];

    if (hasWebsite && digitalAudit.offer_clarity === 'compelling') {
      understandingAssessment = `Services, pricing structure, and value propositions are clearly articulated on the website.`;
    } else if (hasWebsite && digitalAudit.offer_clarity === 'clear') {
      understandingAssessment = `Basic service catalog is accessible, though specialized package distinctions could be sharper.`;
      understandingFriction = 'medium';
    } else if (hasSocials && !hasWebsite) {
      understandingAssessment = `Prospects must piece together service offerings and pricing by browsing disparate social posts and reels.`;
      understandingFriction = 'high';
      understandingFrictionList.push('No centralized pricing or service comparison menu');
    } else {
      understandingAssessment = `Offer details are fragmented across directory listings without clear service tier explanations.`;
      understandingFriction = 'high';
      understandingFrictionList.push('Lack of structured offer breakdown');
    }

    stages['Understanding'] = {
      stage_name: 'Understanding',
      current_channel: understandingChannel,
      assessment: understandingAssessment,
      friction_level: understandingFriction,
      friction_points: understandingFrictionList,
    };

    // 3. TRUST
    let trustChannel = 'Customer Reviews & Social Proof';
    let trustAssessment = '';
    let trustFriction: 'low' | 'medium' | 'high' = 'low';
    const trustFrictionList: string[] = [];

    if (lead.rating && lead.reviewCount && lead.reviewCount >= 30 && lead.rating >= 4.7) {
      trustAssessment = `Strong social proof with ${lead.reviewCount}+ verified reviews (${lead.rating}★) establishing high initial trust.`;
    } else if (lead.rating && lead.reviewCount && lead.reviewCount >= 5) {
      trustAssessment = `Moderate review profile (${lead.rating}★ across ${lead.reviewCount} reviews). Trust signals exist but could be expanded.`;
      trustFriction = 'medium';
      trustFrictionList.push('Limited recent client testimonials and case study highlights');
    } else {
      trustAssessment = `Minimal public social proof or review validation, forcing prospects to take a leap of faith.`;
      trustFriction = 'high';
      trustFrictionList.push('Under-leveraged customer reviews and proof assets');
    }

    if (hasWebsite && technicalAudit && !technicalAudit.hasHttps) {
      trustFriction = 'high';
      trustFrictionList.push('Browser "Not Secure" warning undermines client confidence');
    }

    stages['Trust'] = {
      stage_name: 'Trust',
      current_channel: trustChannel,
      assessment: trustAssessment,
      friction_level: trustFriction,
      friction_points: trustFrictionList,
    };

    // 4. CONVERSION
    let conversionChannel = 'Direct Message / Phone / Website Form';
    let conversionAssessment = '';
    let conversionFriction: 'low' | 'medium' | 'high' = 'low';
    const conversionFrictionList: string[] = [];

    if (linkTool && bookingEngine) {
      conversionChannel = `${linkTool} ➔ ${bookingEngine}`;
      conversionAssessment = `Conversion path routes through a third-party link tree to an external booking engine, causing high drop-off on mobile.`;
      conversionFriction = 'high';
      conversionFrictionList.push(`Multi-link directory friction (${linkTool})`);
      conversionFrictionList.push(`External booking redirect disconnects Meta Pixel retargeting`);
    } else if (socialAudit.destination_quality === 'dm_dead_end') {
      conversionChannel = 'Instagram DM / Manual WhatsApp';
      conversionAssessment = `Conversion relies on manual back-and-forth messaging in DMs, creating response lag during after-hours browsing.`;
      conversionFriction = 'high';
      conversionFrictionList.push('Manual DM qualification creates high response latency');
      conversionFrictionList.push('No direct self-service booking or inquiry scheduling');
    } else if (hasWebsite && !digitalAudit.has_booking && !digitalAudit.has_whatsapp) {
      conversionChannel = 'Static Contact Form';
      conversionAssessment = `Visitors encounter passive contact forms without instant WhatsApp routing or automated calendar confirmation.`;
      conversionFriction = 'high';
      conversionFrictionList.push('Passive web form without instant engagement rails');
    } else if (hasWebsite && digitalAudit.has_booking) {
      conversionAssessment = `Seamless conversion path with direct booking and automated confirmation.`;
    } else {
      conversionAssessment = `Functional contact points available via phone and WhatsApp.`;
      conversionFriction = 'medium';
    }

    stages['Conversion'] = {
      stage_name: 'Conversion',
      current_channel: conversionChannel,
      assessment: conversionAssessment,
      friction_level: conversionFriction,
      friction_points: conversionFrictionList,
    };

    // 5. FULFILMENT & RETENTION
    let retentionAssessment = '';
    let retentionFriction: 'low' | 'medium' | 'high' = 'medium';
    const retentionFrictionList: string[] = [];

    if (technicalAudit?.analyticsDetected && technicalAudit.analyticsDetected.length > 0) {
      retentionAssessment = `Analytics installed, allowing audience retargeting and repeat engagement tracking.`;
      retentionFriction = 'low';
    } else {
      retentionAssessment = `No automated visitor retargeting or structured CRM follow-up detected for dropped inquiries.`;
      retentionFriction = 'medium';
      retentionFrictionList.push('Zero conversion tracking pixels (GA4 / Meta Pixel)');
      retentionFrictionList.push('No automated follow-up sequences for warm prospects');
    }

    stages['Fulfilment'] = {
      stage_name: 'Fulfilment',
      current_channel: 'Service Delivery / Booking Confirmation',
      assessment: 'In-person / direct service execution.',
      friction_level: 'low',
      friction_points: [],
    };

    stages['Retention'] = {
      stage_name: 'Retention',
      current_channel: 'CRM / Follow-up Channels',
      assessment: retentionAssessment,
      friction_level: retentionFriction,
      friction_points: retentionFrictionList,
    };

    // Collect all friction points
    Object.values(stages).forEach((s) => frictionPoints.push(...s.friction_points));

    // Determine primary bottleneck
    let primaryBottleneck = '';
    if (linkTool && bookingEngine) {
      primaryBottleneck = `Social followers are routed through a generic multi-link tool (${linkTool}) to an external ${bookingEngine} portal, creating a 40%+ drop-off barrier and losing retargeting data.`;
    } else if (socialAudit.destination_quality === 'dm_dead_end') {
      primaryBottleneck = `The business generates active attention on ${socialAudit.primary_platform || 'social media'}, but prospects have no strong owned destination where they can understand the offer and move directly into a confirmed booking.`;
    } else if (!hasWebsite) {
      primaryBottleneck = `The business lacks an owned digital home, forcing interested prospects into manual phone calls or unindexed directory listings while local competitors capture search demand.`;
    } else if (technicalAudit && !technicalAudit.hasHttps) {
      primaryBottleneck = `The website displays an active browser security warning (Insecure HTTP), causing over 60% of prospective clients to bounce before submitting inquiries.`;
    } else if (hasWebsite && !digitalAudit.has_booking && !digitalAudit.has_whatsapp) {
      primaryBottleneck = `The website is merely informational with passive contact forms, failing to capture high-intent visitors who browse after business hours.`;
    } else {
      primaryBottleneck = `Lead intake is fragmented across manual communication channels without centralized booking or retargeting infrastructure.`;
    }

    const summary = `Customer journey audit identified key friction at the ${
      conversionFriction === 'high' ? 'Conversion' : understandingFriction === 'high' ? 'Understanding' : 'Discovery'
    } stage: ${primaryBottleneck}`;

    return {
      stages,
      primary_bottleneck: primaryBottleneck,
      secondary_friction_points: frictionPoints.filter((f) => f !== primaryBottleneck).slice(0, 3),
      summary,
    };
  }
}
