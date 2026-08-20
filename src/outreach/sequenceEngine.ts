import { Business } from '../types/business.js';
import { OutreachTone } from '../types/scorer.js';
import {
  SequenceArchetype,
  ComprehensiveSequence,
  SequenceTouchpoint,
  ArchetypeMetadata,
} from '../types/outreach.js';

export const ARCHETYPES_CATALOG: ArchetypeMetadata[] = [
  {
    id: 'omni_channel_blitz',
    name: 'Omni-Channel Cadence (14-Day Blitz)',
    emoji: '🚀',
    description: 'Coordinated multi-touch cadence across Email, WhatsApp, Phone Call, and Social DM for maximum response rate.',
    recommendedFor: 'High-value local businesses, cosmetic clinics, solar companies & law firms.',
    cadenceSummary: 'Day 0 (Email) → Day 1 (WhatsApp) → Day 4 (Cold Call) → Day 8 (Social DM) → Day 14 (Breakup & PDF)',
    touchpointCount: 5,
    durationDays: 14,
    channels: ['email', 'whatsapp', 'cold_call', 'social_dm'],
  },
  {
    id: 'audit_breakdown',
    name: 'Technical Audit & Video Walkthrough',
    emoji: '🔍',
    description: 'Diagnosis-led outreach highlighting website speed, SSL security, mobile viewport, and 1-click booking gaps.',
    recommendedFor: 'Businesses with slow websites, missing SSL certificates, or outdated landing pages.',
    cadenceSummary: 'Day 0 (Diagnostic Email) → Day 3 (Loom Video Offer) → Day 6 (Competitor Gap) → Day 10 (Free PDF Audit)',
    touchpointCount: 4,
    durationDays: 10,
    channels: ['email', 'whatsapp'],
  },
  {
    id: 'roi_calculator',
    name: 'Commercial Valuation & Revenue Leakage',
    emoji: '💰',
    description: 'Financial unit-economics approach calculating estimated monthly revenue lost to missed after-hours inquiries.',
    recommendedFor: 'High-ticket service providers (Dentists, Lawyers, Solar, Real Estate, Auto Specialists).',
    cadenceSummary: 'Day 0 (Revenue Loss Email) → Day 3 (After-Hours Intake) → Day 7 (Payback Model) → Day 11 (Executive Close)',
    touchpointCount: 4,
    durationDays: 11,
    channels: ['email', 'whatsapp'],
  },
  {
    id: 'niche_case_study',
    name: 'Niche Transformation & Social Proof',
    emoji: '📈',
    description: 'Proof-heavy sequence demonstrating real client acquisition and booking metrics from comparable businesses.',
    recommendedFor: 'Salons, Gyms, Restaurants, and competitive local verticals.',
    cadenceSummary: 'Day 0 (Local Case Story) → Day 3 (Before/After Funnel) → Day 7 (Bottleneck Fix) → Day 12 (Strategy Session)',
    touchpointCount: 4,
    durationDays: 12,
    channels: ['email', 'whatsapp', 'social_dm'],
  },
  {
    id: 're_engagement',
    name: 'Stalled Lead Revival (7-Day Re-engagement)',
    emoji: '🔄',
    description: 'Short, low-pressure revival sequence with new local market benchmark data for previously unresponsive leads.',
    recommendedFor: 'Leads in "outreach" or "stalled" stage with no prior response.',
    cadenceSummary: 'Day 0 (Market Benchmark) → Day 3 (1-Question WhatsApp) → Day 7 (Closing the Loop)',
    touchpointCount: 3,
    durationDays: 7,
    channels: ['email', 'whatsapp'],
  },
];

export class SequenceEngine {
  /**
   * Return all available sequence archetypes
   */
  public static getArchetypes(): ArchetypeMetadata[] {
    return ARCHETYPES_CATALOG;
  }

  /**
   * Get metadata for a specific archetype ID
   */
  public static getArchetype(id: SequenceArchetype): ArchetypeMetadata {
    const found = ARCHETYPES_CATALOG.find((a) => a.id === id);
    return found || ARCHETYPES_CATALOG[0];
  }

  /**
   * Helper to replace {{variables}} in template strings
   */
  public static interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => vars[key] || '');
  }

  /**
   * Generate a comprehensive, customized multi-channel sequence
   */
  public static generateSequence(
    lead: Business,
    archetype: SequenceArchetype = 'omni_channel_blitz',
    tone: OutreachTone = 'consultative'
  ): ComprehensiveSequence {
    const meta = this.getArchetype(archetype);
    const name = lead.name;
    const category = lead.category || 'Local Business';
    const area = lead.area || 'South Africa';
    const rating = lead.rating || 4.8;
    const reviews = lead.reviewCount || 35;
    const audit = lead.technicalAudit;
    const estVal = lead.estimatedDealValue ? `R${lead.estimatedDealValue.toLocaleString()}` : 'R22,500';

    const funnelStack = lead.funnelTechStack || lead.technicalAudit?.funnelTechStack;
    const businessCase = lead.businessCase || lead.technicalAudit?.businessCase;

    // 1. Determine Technical Diagnostic Callout
    let auditCallout = 'our automated diagnostic identified conversion bottlenecks on your website.';
    let auditHeadline = 'Website Conversion Optimization';
    let primaryIssue = 'Missing automated lead capture funnel';

    if (funnelStack?.linkInBioTool && funnelStack?.bookingEngine) {
      auditCallout = `we noticed on Instagram that you route prospects through ${funnelStack.linkInBioTool} to ${funnelStack.bookingEngine}, creating a 40%+ drop-off barrier and losing Meta Pixel retargeting on non-converting visitors.`;
      auditHeadline = `Centralized Touchpoint & Booking Funnel for ${name}`;
      primaryIssue = `Fragmented Stack (${funnelStack.linkInBioTool} + ${funnelStack.bookingEngine})`;
    } else if (funnelStack?.linkInBioTool) {
      auditCallout = `we noticed ${name} routes social media traffic to ${funnelStack.linkInBioTool}, which causes 40%+ visitor drop-off on multi-link lists and lacks direct 1-click WhatsApp booking.`;
      auditHeadline = `High-Converting Mobile Touchpoint for ${name}`;
      primaryIssue = `Link-in-Bio Click Friction (${funnelStack.linkInBioTool})`;
    } else if (funnelStack?.bookingEngine) {
      auditCallout = `we saw ${name} uses ${funnelStack.bookingEngine}, but external redirects cause mobile visitor leakage and lack 1-click WhatsApp intake.`;
      auditHeadline = `Optimizing ${funnelStack.bookingEngine} Lead Intake for ${name}`;
      primaryIssue = `External ${funnelStack.bookingEngine} Portal Redirect`;
    } else if (!lead.website || lead.website.trim() === '') {
      auditCallout = `we noticed ${name} currently lacks a dedicated high-converting website, relying solely on directory listings while competitors capture Google search traffic in ${area}.`;
      auditHeadline = `High-Converting Digital Storefront for ${name}`;
      primaryIssue = `Missing Dedicated Website & Online Storefront`;
    } else if (audit && !audit.hasHttps) {
      auditCallout = `we noticed your website lacks an SSL security certificate (displaying a "Not Secure" warning in browsers), which deters over 60% of potential clients.`;
      auditHeadline = 'SSL Security & Trust Warning';
      primaryIssue = 'Insecure HTTP protocol connection';
    } else if (audit && audit.loadSpeedSeconds && audit.loadSpeedSeconds > 3.0) {
      auditCallout = `we ran a mobile diagnostic and detected slow page load speeds (${audit.loadSpeedSeconds}s), causing mobile visitors to bounce to competitors.`;
      auditHeadline = 'Mobile Load Speed Bottleneck';
      primaryIssue = `Slow mobile load speed (${audit.loadSpeedSeconds}s)`;
    } else if (audit && !audit.hasBookingSystem) {
      auditCallout = 'we noticed your website is missing a 24/7 automated online booking portal for after-hours scheduling.';
      auditHeadline = '24/7 Online Booking Opportunity';
      primaryIssue = 'No after-hours online booking portal';
    } else if (audit && !audit.hasWhatsappLink) {
      auditCallout = 'we noticed your site lacks a 1-click WhatsApp lead capture widget, letting high-intent local inquiries slip to competitors.';
      auditHeadline = '1-Click WhatsApp Lead Capture';
      primaryIssue = 'Missing 1-click WhatsApp intake widget';
    } else if (audit && (!audit.analyticsDetected || audit.analyticsDetected.length === 0)) {
      auditCallout = 'we noticed zero conversion tracking pixels (missing GA4 / Meta Pixel), meaning visitor traffic and marketing ROI are unmeasured.';
      auditHeadline = 'Conversion Pixel Tracking';
      primaryIssue = 'Zero conversion tracking (GA4 / Meta Pixel)';
    }

    // 2. Determine Niche-Specific Value Props
    let nicheAngle = businessCase?.headline || 'Automated Lead Intake & 24/7 Client Conversion';
    let painPoint = 'local clients searching for providers choose whoever responds fastest to web & WhatsApp inquiries';
    let solution = businessCase?.proposedCentralizedSolution || 'an automated 24/7 WhatsApp & calendar lead intake funnel';
    let caseProof = businessCase?.projectedMonthlyRecoveredLeads
      ? `projected to recover ${businessCase.projectedMonthlyRecoveredLeads}`
      : 'helped a nearby local business increase client bookings by 45% in 30 days';
    let revenueLeak = businessCase?.estimatedMonthlyRevenueImpactZAR
      ? `+R${businessCase.estimatedMonthlyRevenueImpactZAR.toLocaleString()} in uncaptured monthly client revenue`
      : 'R15,000 - R35,000 in missed monthly client retainers';
    let callDiscovery = `When potential clients find ${name} online after business hours, how quickly are you able to follow up?`;
    let callObjection = `I know you and your team are busy with existing clients! That's why this system qualifies inquiries and books appointments automatically 24/7.`;

    const catLower = category.toLowerCase();
    if (/health|dental|dentist|physio|chiro|medical|aesthetic/i.test(catLower)) {
      if (!businessCase) {
        nicheAngle = 'High-Value Patient Intake & Consultation Booking';
        solution = 'a POPIA-compliant patient intake portal with 1-click emergency WhatsApp routing and consultation booking';
        caseProof = 'helped a private practice secure 19 high-ticket treatment consultations in their first 30 days';
        revenueLeak = 'R30,000 - R75,000 in uncaptured specialized treatment bookings every month';
      }
      painPoint = 'patients searching for specialized treatments bounce when they cannot book consultations or get instant WhatsApp answers';
      callDiscovery = `When new patients search for specialized treatments online in ${area}, can they instantly schedule a consultation on your site?`;
      callObjection = `Medical practices love this because it integrates seamlessly with your front desk without disrupting existing PMS software.`;
    } else if (/solar|electrician|plumber|trades|contractor|hvac|roofing/i.test(catLower)) {
      if (!businessCase) {
        nicheAngle = '1-Tap Emergency Callouts & Instant Quote Requests';
        solution = 'an emergency 1-tap quote capture funnel with instant WhatsApp dispatch';
        caseProof = 'increased weekly inbound service quote requests by 65% for a local contractor';
        revenueLeak = 'R25,000 - R60,000 in unquoted installation and maintenance jobs each month';
      }
      painPoint = 'homeowners and commercial property managers needing quotes choose the competitor with instant 1-tap WhatsApp quote dispatch';
      callDiscovery = `When someone has an urgent repair or solar installation inquiry in ${area}, how easily can they send photos and get a quote via WhatsApp?`;
      callObjection = `I know you're on the tools all day! That's why the system collects job specs and photos automatically before you call.`;
    } else if (/beauty|hair|salon|spa|barber|laser/i.test(catLower)) {
      if (!businessCase) {
        nicheAngle = 'Eliminating No-Shows & Automating Salon Bookings';
        solution = 'a 1-click WhatsApp & calendar booking portal with automated deposit collection';
        caseProof = 'reduced appointment no-shows by 85% and added 34 new client bookings in month one';
        revenueLeak = 'R12,000 - R28,000 lost monthly to empty appointment slots and no-shows';
      }
      painPoint = 'clients want to book appointments instantly via WhatsApp late at night without waiting for manual DM replies';
      callDiscovery = `How much time does your team spend going back and forth on WhatsApp each day just to confirm calendar slots?`;
      callObjection = `Our automated assistant handles the calendar, takes deposits, and sends reminders automatically without staff intervention.`;
    } else if (/fitness|gym|crossfit|pilates|yoga/i.test(catLower)) {
      if (!businessCase) {
        nicheAngle = 'After-Hours Membership Inquiries & Free Trial Funnel';
        solution = 'an automated 24/7 WhatsApp trial pass & class booking funnel';
        caseProof = 'helped a fitness studio capture 28 new monthly trial signups in 3 weeks';
        revenueLeak = 'R18,000 - R40,000 in lost recurring monthly membership revenue';
      }
      painPoint = 'over 70% of gym membership searches happen after 6 PM when front desk staff is off';
      callDiscovery = `How are you currently capturing membership inquiries that come in through your website after hours?`;
      callObjection = `Desk staff love this because it qualifies leads and confirms trial passes without staff needing to touch a phone.`;
    } else if (/real estate|property|estate agent/i.test(catLower)) {
      if (!businessCase) {
        nicheAngle = 'Instant Property Valuation Funnels & Buyer Pre-Qualification';
        solution = 'an instant property valuation calculator and WhatsApp automated buyer qualification funnel';
        caseProof = 'delivered 15 exclusive listing valuation requests and 42 qualified buyer inquiries in 60 days';
        revenueLeak = 'R50,000+ in missed seller listing commissions';
      }
      painPoint = 'property sellers and buyers expect instant WhatsApp responses and virtual tour booking';
      callDiscovery = `How quickly is your team able to follow up when a prospective seller requests a property valuation online?`;
      callObjection = `This pre-qualifies buyers by budget and location before passing them directly to your designated agent.`;
    }

    const vars: Record<string, string> = {
      business_name: name,
      category,
      area,
      rating: rating.toString(),
      reviews: reviews.toString(),
      est_value: estVal,
      audit_issues: primaryIssue,
      audit_callout: auditCallout,
      audit_headline: auditHeadline,
      niche_angle: nicheAngle,
      pain_point: painPoint,
      solution,
      case_proof: caseProof,
      revenue_leak: revenueLeak,
    };

    let touchpoints: SequenceTouchpoint[] = [];

    switch (archetype) {
      case 'omni_channel_blitz':
        touchpoints = this.buildOmniChannelBlitz(vars, tone, callDiscovery, callObjection);
        break;
      case 'audit_breakdown':
        touchpoints = this.buildAuditBreakdown(vars, tone);
        break;
      case 'roi_calculator':
        touchpoints = this.buildRoiCalculator(vars, tone);
        break;
      case 'niche_case_study':
        touchpoints = this.buildNicheCaseStudy(vars, tone);
        break;
      case 're_engagement':
        touchpoints = this.buildReEngagement(vars, tone);
        break;
      default:
        touchpoints = this.buildOmniChannelBlitz(vars, tone, callDiscovery, callObjection);
    }

    return {
      archetype,
      archetypeName: meta.name,
      archetypeEmoji: meta.emoji,
      description: meta.description,
      businessName: name,
      category,
      area,
      tone,
      totalDurationDays: meta.durationDays,
      touchpoints,
      variables: vars,
      createdAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // PLAYBOOK BUILDERS
  // ==========================================

  private static buildOmniChannelBlitz(
    v: Record<string, string>,
    tone: OutreachTone,
    discoveryQ: string,
    objectionAns: string
  ): SequenceTouchpoint[] {
    return [
      {
        stepNumber: 1,
        dayDelay: 0,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 0: Technical Audit & Opportunity Pitch',
        subject: `Optimizing ${v.business_name}'s digital lead intake in ${v.area}`,
        body: `Hi ${v.business_name} Team,\n\nI came across ${v.business_name} while auditing top-rated ${v.category} providers in ${v.area}.\n\nI noticed your team has built a strong reputation (${v.rating}★ with ${v.reviews}+ reviews). However, during our review, ${v.audit_callout}\n\nBecause ${v.pain_point}, we developed ${v.solution}.\n\nFor instance, we recently ${v.case_proof}.\n\nCan I show you a 5-minute live preview tailored for ${v.business_name} this Thursday at 10 AM?\n\nBest regards,\nLeadGremlin Growth Engine`,
        actionGuidance: 'Send from primary sales email. Personalize first line if you found recent social post.',
      },
      {
        stepNumber: 2,
        dayDelay: 1,
        channel: 'whatsapp',
        channelEmoji: '💬',
        title: 'Day 1: WhatsApp Voice Note / 60s Video Hook',
        body: `Hi ${v.business_name} Team 👋 Sent you a quick email yesterday regarding ${v.business_name}'s web lead intake in ${v.area}!\n\nWe put together a 60-second video demo showing how ${v.solution} captures 3x more direct client inquiries.\n\nMind if I drop the 1-minute video link right here on WhatsApp? 🚀`,
        actionGuidance: 'Send directly to business WhatsApp number. Attach custom 60-second video walkthrough or voice note.',
        condition: 'If no reply to Day 0 email after 24 hours.',
      },
      {
        stepNumber: 3,
        dayDelay: 4,
        channel: 'cold_call',
        channelEmoji: '📞',
        title: 'Day 4: Diagnostic Discovery Call & Battlecard',
        body: `Call decision-maker at ${v.business_name}. Use the attached battlecard for discovery and objection handling.`,
        actionGuidance: 'Call between 09:30 - 11:30 or 14:00 - 16:00. If receptionist answers, ask for the owner/practice manager.',
        callBattlecard: {
          opener: `Hi, is this the owner or manager at ${v.business_name}? My name is LeadGremlin, calling briefly regarding your ${v.area} client lead intake.`,
          discovery: discoveryQ,
          objectionHandling: objectionAns,
          voicemailScript: `Hi ${v.business_name} management, this is LeadGremlin calling regarding the complimentary digital audit we prepared for your ${v.area} location. Dropped you a WhatsApp with the details—talk soon!`,
          close: `Can I send a 60-second video breakdown directly to your WhatsApp so you can review it whenever you have a free minute?`,
        },
      },
      {
        stepNumber: 4,
        dayDelay: 8,
        channel: 'social_dm',
        channelEmoji: '📱',
        title: 'Day 8: Social DM / Instagram Nudge',
        body: `Hey ${v.business_name} team! 👋 Loved your recent work in ${v.area}. Quick question: did you see the digital audit report we sent to your team? We built a 1-click lead capture mockup tailored for ${v.business_name}. DM us if you'd like the preview link! 📩`,
        actionGuidance: 'Send via Instagram DM or LinkedIn message to founder/manager profile.',
      },
      {
        stepNumber: 5,
        dayDelay: 14,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 14: Final Breakup & Complimentary PDF Report Offer',
        subject: `Complimentary Technical Audit Report for ${v.business_name}`,
        body: `Hi ${v.business_name} Management,\n\nI know you're extremely busy serving clients in ${v.area}, so I won't keep following up.\n\nWe put together a full complimentary Technical Website & Mobile Audit Report for ${v.business_name} (${v.est_value} estimated project scope) identifying 4 quick fixes to boost your monthly bookings.\n\nIf you'd like the PDF report, just reply "AUDIT" and I'll send it right over.\n\nWishing ${v.business_name} continued success!\n\nBest regards,\nLeadGremlin Growth Engine`,
        actionGuidance: 'Attach generated PDF report if lead expressed interest, or send clean plain-text breakup.',
      },
    ];
  }

  private static buildAuditBreakdown(v: Record<string, string>, tone: OutreachTone): SequenceTouchpoint[] {
    return [
      {
        stepNumber: 1,
        dayDelay: 0,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 0: Technical Website Diagnostic Findings',
        subject: `Technical Audit for ${v.business_name}: ${v.audit_headline}`,
        body: `Hi ${v.business_name} Team,\n\nOur automated crawler recently completed a technical digital diagnostic on ${v.business_name}'s website.\n\nWhile your local reputation in ${v.area} is top-tier, we identified key technical issues:\n\n• ${v.audit_issues}\n• ${v.audit_callout}\n\nThese bottlenecks are causing high-intent mobile visitors in ${v.area} to bounce to competitors.\n\nWould you like me to send a 2-minute video walkthrough showing how to resolve this?\n\nBest regards,\nLeadGremlin Diagnostic Team`,
        actionGuidance: 'Highlight the specific technical gap found during scraper audit.',
      },
      {
        stepNumber: 2,
        dayDelay: 3,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 3: Live Visual Preview & Video Walkthrough',
        subject: `Re: Technical Audit for ${v.business_name}`,
        body: `Hi ${v.business_name} Team,\n\nFollowing up on the technical diagnostic for ${v.business_name}.\n\nWe mocked up a 1-click lead capture and booking funnel tailored to your exact branding, demonstrating how to capture 35% more monthly inquiries.\n\nWould you be open to a 5-minute live preview this Thursday at 11 AM?\n\nBest regards,\nLeadGremlin Diagnostic Team`,
      },
      {
        stepNumber: 3,
        dayDelay: 6,
        channel: 'whatsapp',
        channelEmoji: '💬',
        title: 'Day 6: WhatsApp Competitor Gap Breakdown',
        body: `Hi ${v.business_name} Team 👋 Quick heads up: 3 nearby ${v.category} competitors in ${v.area} have already installed automated WhatsApp booking widgets.\n\nWe put together a comparison sheet for ${v.business_name}. Reply "YES" if you'd like us to send the PDF comparison! 📄`,
      },
      {
        stepNumber: 4,
        dayDelay: 10,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 10: Free PDF Audit Report & Implementation Checklist',
        subject: `PDF Technical Report & Checklist for ${v.business_name}`,
        body: `Hi ${v.business_name} Management,\n\nClosing the loop on ${v.business_name}'s technical audit in ${v.area}.\n\nWe compiled our full recommendations into a ready-to-use PDF checklist.\n\nReply "AUDIT" and I will send the document over with zero obligation.\n\nBest regards,\nLeadGremlin Diagnostic Team`,
      },
    ];
  }

  private static buildRoiCalculator(v: Record<string, string>, tone: OutreachTone): SequenceTouchpoint[] {
    return [
      {
        stepNumber: 1,
        dayDelay: 0,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 0: Estimated Monthly Revenue Leakage Analysis',
        subject: `Revenue Opportunity Analysis for ${v.business_name} in ${v.area}`,
        body: `Hi ${v.business_name} Executive Team,\n\nBased on local search volume for ${v.category} providers in ${v.area}, we calculated that ${v.business_name} is losing an estimated ${v.revenue_leak} due to friction in your online lead intake.\n\nSpecifically: ${v.audit_callout}\n\nBy deploying ${v.solution}, businesses in your vertical typically recover this lost volume within 30 days.\n\nCan I show you the unit economics model for ${v.business_name} this Wednesday?\n\nBest regards,\nLeadGremlin Commercial Intelligence`,
      },
      {
        stepNumber: 2,
        dayDelay: 3,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 3: Cost of Missed After-Hours Inquiries',
        subject: `Re: Revenue Opportunity Analysis for ${v.business_name}`,
        body: `Hi ${v.business_name} Team,\n\nDid you know that over 65% of local ${v.category} inquiries occur between 6 PM and 9 AM when offices are closed?\n\nWithout an automated intake funnel, these high-intent clients click to the next provider who offers instant WhatsApp booking.\n\nOur system captures and pre-qualifies these clients automatically 24/7.\n\nCan I send you a 1-page financial breakdown showing the projected ROI for ${v.business_name}?\n\nBest regards,\nLeadGremlin Commercial Intelligence`,
      },
      {
        stepNumber: 3,
        dayDelay: 7,
        channel: 'whatsapp',
        channelEmoji: '💬',
        title: 'Day 7: WhatsApp Unit Economics Summary',
        body: `Hi ${v.business_name} Leadership 👋 Based on our audit, capturing just 2 extra clients per month via automated WhatsApp booking yields a 400%+ ROI on our setup.\n\nWould you be open to a 5-minute live preview this Thursday? 📈`,
      },
      {
        stepNumber: 4,
        dayDelay: 11,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 11: Final Commercial Proposal & Q&A Invitation',
        subject: `Final Commercial Summary for ${v.business_name}`,
        body: `Hi ${v.business_name} Executive Team,\n\nI will conclude our outreach regarding ${v.business_name}'s revenue optimization in ${v.area}.\n\nIf capturing an additional ${v.revenue_leak} is a priority this quarter, reply "ROI" and I'll send our complete financial breakdown.\n\nWishing you continued profitable growth!\n\nBest regards,\nLeadGremlin Commercial Intelligence`,
      },
    ];
  }

  private static buildNicheCaseStudy(v: Record<string, string>, tone: OutreachTone): SequenceTouchpoint[] {
    return [
      {
        stepNumber: 1,
        dayDelay: 0,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 0: Local Category Success Story',
        subject: `How a nearby ${v.category} increased bookings by 45% (Idea for ${v.business_name})`,
        body: `Hi ${v.business_name} Team,\n\nWe recently partnered with a top ${v.category} provider in ${v.area} experiencing the exact same lead intake challenge as ${v.business_name}.\n\nBy replacing manual inquiry forms with ${v.solution}, they achieved:\n\n• 45% increase in confirmed client bookings in 30 days\n• 85% reduction in appointment no-shows\n• 24/7 automated lead qualification\n\nCould I share a 2-minute video breakdown of how we did it?\n\nBest regards,\nLeadGremlin Growth Engine`,
      },
      {
        stepNumber: 2,
        dayDelay: 3,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 3: Before vs After Funnel Breakdown',
        subject: `Re: How a nearby ${v.category} increased bookings by 45%`,
        body: `Hi ${v.business_name} Team,\n\nFollowing up on my previous note regarding ${v.business_name}.\n\nThe reason this funnel works so well in ${v.area} is that ${v.pain_point}.\n\nWe prepared a custom Before vs After schematic tailored for ${v.business_name}.\n\nDo you have 5 minutes this Thursday for a quick walkthrough?\n\nBest regards,\nLeadGremlin Growth Engine`,
      },
      {
        stepNumber: 3,
        dayDelay: 7,
        channel: 'social_dm',
        channelEmoji: '📱',
        title: 'Day 7: Social DM Case Proof Link',
        body: `Hey ${v.business_name} team! 👋 We just published our case study on how local ${v.category} businesses in ${v.area} are doubling their monthly intake. Thought your team would find it valuable. DM us if you'd like the link! 🚀`,
      },
      {
        stepNumber: 4,
        dayDelay: 12,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 12: Invitation to 1-on-1 Strategic Review',
        subject: `1-on-1 Strategy Session for ${v.business_name}`,
        body: `Hi ${v.business_name} Management,\n\nI won't keep following up regarding ${v.business_name}'s client intake.\n\nIf you'd ever like to review how ${v.solution} can systematically grow your appointments in ${v.area}, feel free to reply anytime.\n\nWishing you all the best!\n\nBest regards,\nLeadGremlin Growth Engine`,
      },
    ];
  }

  private static buildReEngagement(v: Record<string, string>, tone: OutreachTone): SequenceTouchpoint[] {
    return [
      {
        stepNumber: 1,
        dayDelay: 0,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 0: New South Africa Market Benchmark Data',
        subject: `Updated 2026 ${v.category} Benchmark Data for ${v.business_name}`,
        body: `Hi ${v.business_name} Team,\n\nWe recently updated our South Africa digital lead intake benchmark for ${v.area}.\n\nOver the past quarter, ${v.category} businesses utilizing 1-click WhatsApp and automated booking engines captured 3.2x more mobile inquiries than traditional websites.\n\nWe refreshed ${v.business_name}'s audit with the latest data. Would you like us to send the 1-page summary?\n\nBest regards,\nLeadGremlin Engine`,
      },
      {
        stepNumber: 2,
        dayDelay: 3,
        channel: 'whatsapp',
        channelEmoji: '💬',
        title: 'Day 3: 1-Question WhatsApp Check-In',
        body: `Hi ${v.business_name} Team 👋 Quick 1-question check: is optimizing your online client intake and booking engine still a priority for ${v.business_name} this quarter? Let me know! 🚀`,
      },
      {
        stepNumber: 3,
        dayDelay: 7,
        channel: 'email',
        channelEmoji: '📧',
        title: 'Day 7: Closing the File & Clean Slate',
        subject: `Closing the file for ${v.business_name}`,
        body: `Hi ${v.business_name} Management,\n\nI assume this isn't a priority for ${v.business_name} right now, so I will close out your file and stop reaching out.\n\nIf anything changes in the future, please feel free to reach back out.\n\nWishing you and the team continued success in ${v.area}!\n\nBest regards,\nLeadGremlin Engine`,
      },
    ];
  }
}
