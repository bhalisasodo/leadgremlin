import { Business } from '../types/business.js';
import {
  BusinessAuditFundamentals,
  BusinessCase,
  DigitalPresenceAudit,
  FunnelAudit,
  OpportunityDiagnosis,
  SocialCommercialAudit,
} from '../types/intelligence.js';

export class BusinessCaseGenerator {
  /**
   * Generates a rigorous, commercially-grounded business case explaining the unit economics and mechanism of action
   */
  public static generate(
    lead: Partial<Business>,
    fundamentals: BusinessAuditFundamentals,
    digitalAudit: DigitalPresenceAudit,
    socialAudit: SocialCommercialAudit,
    funnelAudit: FunnelAudit,
    diagnosis: OpportunityDiagnosis
  ): BusinessCase {
    const name = lead.name || 'The business';
    const category = lead.category || 'Local Business';
    const area = lead.area || 'Umhlanga';
    const funnelStack = lead.funnelTechStack || lead.technicalAudit?.funnelTechStack;
    const linkTool = funnelStack?.linkInBioTool;
    const bookingEngine = funnelStack?.bookingEngine;

    // Current State
    let currentState = '';
    if (linkTool && bookingEngine) {
      currentState = `${name} actively generates brand awareness on social media, routing interested followers through a ${linkTool} multi-link directory to an external ${bookingEngine} booking schedule.`;
    } else if (socialAudit.is_active && !digitalAudit.has_website) {
      currentState = `${name} engages prospective clients on social media, but operates without an owned digital website. Client qualification and appointment confirmations occur manually inside DMs and phone calls.`;
    } else if (digitalAudit.has_website) {
      currentState = `${name} maintains an official website in ${area}, functioning primarily as a digital brochure with contact details.`;
    } else {
      currentState = `${name} relies on local word-of-mouth and standard directory listings in ${area} without an active digital conversion asset.`;
    }

    // Problem & Friction
    const problemAndFriction = funnelAudit.primary_bottleneck;

    // Opportunity
    const opportunity = `Transition from fragmented or passive touchpoints into a high-converting ${diagnosis.intervention_label} designed to systematically turn warm visitor attention into confirmed client action.`;

    // Commercial Mechanism
    let commercialMechanism = '';
    if (linkTool && bookingEngine) {
      commercialMechanism = `By replacing the multi-link directory with an integrated branded hub, we remove the 40-50% click barrier and unify trial bookings, WhatsApp intake, and Meta Pixel retargeting on a single domain. This allows ${name} to recover warm prospects who would otherwise bounce on external redirects.`;
    } else if (socialAudit.is_active && !digitalAudit.has_website) {
      commercialMechanism = `By providing an owned landing destination with structured service packages and direct WhatsApp/calendar booking, prospects who browse after business hours can immediately take action rather than waiting for manual DM replies.`;
    } else if (category.toLowerCase().includes('fitness')) {
      commercialMechanism = `Automated 24/7 trial pass booking and WhatsApp confirmation captures prospects during evening peak browsing hours (6 PM - 10 PM), directly increasing weekly trial attendance and recurring memberships.`;
    } else if (category.toLowerCase().includes('beauty') || category.toLowerCase().includes('aesthetic') || category.toLowerCase().includes('salon')) {
      commercialMechanism = `Instant calendar scheduling with automated WhatsApp deposit reminders eliminates no-shows and fills empty appointment slots without requiring reception staff to engage in back-and-forth phone tag.`;
    } else if (category.toLowerCase().includes('dental') || category.toLowerCase().includes('health')) {
      commercialMechanism = `A POPIA-compliant patient intake portal highlights clinical expertise, transparent procedure overviews, and direct consultation scheduling, converting high-ticket treatment searches into booked consultations.`;
    } else {
      commercialMechanism = `Streamlined mobile lead capture with 1-click WhatsApp routing ensures ${name} responds to inbound quote requests in seconds rather than hours, capturing high-intent local demand before competitors.`;
    }

    // Why Now?
    let whyNow = '';
    if (socialAudit.is_active) {
      whyNow = `${name} is already investing effort into content creation and brand building. Capitalizing on existing attention is the highest-leverage growth lever.`;
    } else if (lead.rating && lead.rating >= 4.5 && lead.reviewCount && lead.reviewCount >= 15) {
      whyNow = `${name} has built a strong ${lead.rating}★ reputation (${lead.reviewCount}+ reviews). Translating this reputation into a modern conversion funnel will accelerate local market capture.`;
    } else {
      whyNow = `Nearby ${category} providers in ${area} are modernizing their online booking and WhatsApp funnels. Securing local search presence now prevents client leakage.`;
    }

    // Why This Intervention?
    const whyThisIntervention = diagnosis.intervention_rationale;

    // Projections & Unit Economics
    const baseScore = lead.opportunityScore || 75;
    const estRecovered = `+${Math.max(10, Math.round(baseScore * 0.2))} to +${Math.max(20, Math.round(baseScore * 0.35))} qualified monthly inquiries`;

    let qualitativeImpactTier = 'Moderate Conversion Opportunity';
    let qualitativePaybackHorizon = 'Rapid Turnaround (1–2 Months)';
    let commercialValuationRange = 'R18,000 – R28,000 (Focused Lead Intake Funnel)';
    let estimatedDealValue = 22500;

    if (linkTool && bookingEngine) {
      qualitativeImpactTier = 'High Commercial Upside (Top-Tier Multi-Tool Friction Recovery)';
      qualitativePaybackHorizon = 'Immediate (< 30 Days)';
      commercialValuationRange = 'R28,000 – R45,000 (Omnichannel Hub Transformation)';
      estimatedDealValue = 32000;
    } else if (socialAudit.is_active && !digitalAudit.has_website) {
      qualitativeImpactTier = 'Substantial Inbound Expansion (Owned Funnel Creation)';
      qualitativePaybackHorizon = 'Immediate (< 30 Days)';
      commercialValuationRange = 'R22,000 – R36,000 (Founder Landing & Booking Hub)';
      estimatedDealValue = 26000;
    } else if (digitalAudit.has_website && !digitalAudit.has_booking) {
      qualitativeImpactTier = 'Substantial Inbound Expansion (24/7 Intake Automation)';
      qualitativePaybackHorizon = 'Rapid Turnaround (1–2 Months)';
      commercialValuationRange = 'R18,000 – R30,000 (Automated Booking & WhatsApp Portal)';
      estimatedDealValue = 24000;
    }

    return {
      headline: `Commercial Business Case: ${diagnosis.intervention_label} for ${name}`,
      current_state: currentState,
      problem_and_friction: problemAndFriction,
      opportunity,
      commercial_mechanism: commercialMechanism,
      why_now: whyNow,
      why_this_intervention: whyThisIntervention,
      projected_monthly_recovered_volume: estRecovered,
      qualitative_impact_tier: qualitativeImpactTier,
      qualitative_payback_horizon: qualitativePaybackHorizon,
      commercial_valuation_range: commercialValuationRange,
      estimated_deal_value_zar: estimatedDealValue,
    };
  }
}
