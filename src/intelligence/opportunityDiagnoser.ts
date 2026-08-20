import { Business } from '../types/business.js';
import {
  BusinessAuditFundamentals,
  DigitalPresenceAudit,
  FunnelAudit,
  OpportunityDiagnosis,
  RecommendedInterventionType,
  SocialCommercialAudit,
} from '../types/intelligence.js';

export class OpportunityDiagnoser {
  /**
   * Diagnoses the core commercial bottleneck and derives the exact tailored intervention
   */
  public static diagnose(
    lead: Partial<Business>,
    fundamentals: BusinessAuditFundamentals,
    digitalAudit: DigitalPresenceAudit,
    socialAudit: SocialCommercialAudit,
    funnelAudit: FunnelAudit
  ): OpportunityDiagnosis {
    const name = lead.name || 'The business';
    const category = (lead.category || 'Local Business').toLowerCase();
    const area = lead.area || 'Umhlanga';
    const funnelStack = lead.funnelTechStack || lead.technicalAudit?.funnelTechStack;
    const linkTool = funnelStack?.linkInBioTool;
    const bookingEngine = funnelStack?.bookingEngine;

    let primaryBottleneck = funnelAudit.primary_bottleneck;
    const secondaryOpportunities: string[] = [];
    let intervention: RecommendedInterventionType = 'conversion_focused_website';
    let interventionLabel = 'Founder-Led Conversion Website & Booking Funnel';
    let rationale = '';
    let cta: OpportunityDiagnosis['appropriate_cta'] = 'Permission to share preview';

    // 1. Diagnose according to digital presence & customer journey
    if (linkTool && bookingEngine) {
      intervention = 'link_in_bio_replacement';
      interventionLabel = `Centralized Branded Touchpoint Hub (Unifying ${linkTool} & ${bookingEngine})`;
      rationale = `Replace the high-friction ${linkTool} directory with a unified branded touchpoint that directly embeds ${bookingEngine} schedules, 1-click WhatsApp trial intake, and Meta Pixel retargeting on the same domain.`;
      cta = category.includes('fitness') ? 'Start free trial' : 'Book consultation';
      secondaryOpportunities.push(
        'Eliminate 40-50% bounce rate on multi-link lists',
        'Enable Meta Pixel and GA4 retargeting on warm social visitors',
        'Sync WhatsApp lead intake directly with booking confirmation'
      );
    } else if (socialAudit.is_active && !digitalAudit.has_website) {
      if (socialAudit.has_founder_led_content) {
        intervention = 'landing_page';
        interventionLabel = 'Founder-Led Conversion Landing Hub & Social Bridge';
        rationale = `Build a high-converting digital home connecting the founder's personal brand to the customer acquisition journey, turning social attention into structured inquiries and bookings.`;
        cta = category.includes('fitness') ? 'Book a class' : category.includes('beauty') ? 'Schedule appointment' : 'Start free trial';
        secondaryOpportunities.push(
          'Capture after-hours inquiries when DMs go unmonitored',
          'Present structured service packages and customer transformation proof',
          'Establish an owned digital asset independent of social algorithm shifts'
        );
      } else {
        intervention = 'conversion_focused_website';
        interventionLabel = 'Mobile-First Digital Storefront & Lead Funnel';
        rationale = `Establish an owned digital destination that captures local search intent in ${area} and provides prospects with an instant self-service booking and inquiry experience.`;
        cta = category.includes('restaurant') ? 'Visit store' : 'Request quote';
        secondaryOpportunities.push(
          'Capture high-intent Google search traffic in local area',
          'Automate 24/7 client qualification and appointment scheduling',
          'Build local search SEO dominance'
        );
      }
    } else if (digitalAudit.has_website && !digitalAudit.has_booking && !digitalAudit.has_whatsapp) {
      intervention = 'lead_generation_funnel';
      interventionLabel = '24/7 Automated Lead Intake & WhatsApp Engine';
      rationale = `Upgrade static web pages into an interactive client intake engine with 1-click WhatsApp triage, automated scheduling, and instant lead capture.`;
      cta = category.includes('dental') || category.includes('health') || category.includes('aesthetic') || category.includes('spa')
        ? 'Book consultation'
        : category.includes('beauty')
        ? 'Schedule appointment'
        : 'Request quote';
      secondaryOpportunities.push(
        'Prevent after-hours visitor bounce with instant response triggers',
        'Add WhatsApp lead capture for mobile prospects',
        'Install conversion analytics to track marketing ROI'
      );
    } else if (digitalAudit.has_website && lead.technicalAudit && !lead.technicalAudit.hasHttps) {
      intervention = 'website_rebuild';
      interventionLabel = 'SSL Security Hardening & High-Speed Mobile Overhaul';
      rationale = `Resolve browser security warnings and overhaul mobile load speeds to restore visitor trust and search ranking.`;
      cta = 'Request quote';
      secondaryOpportunities.push(
        'Enforce HTTPS protocol and SSL encryption',
        'Improve mobile page load performance under 2.0s',
        'Deploy modern responsive contact and booking widgets'
      );
    } else if (category.includes('restaurant') || category.includes('dining')) {
      intervention = 'booking_funnel';
      interventionLabel = 'Direct Table Reservation & WhatsApp VIP Funnel';
      rationale = `Integrate direct table reservations and private function inquiries to reduce third-party booking commissions and capture repeat diners.`;
      cta = 'Visit store';
      secondaryOpportunities.push(
        'Eliminate third-party portal commission fees',
        'Capture direct customer contacts for VIP promotions',
        'Mobile menu speed optimization'
      );
    } else {
      intervention = 'conversion_focused_website';
      interventionLabel = 'High-Converting Sales Funnel & Local SEO Hub';
      rationale = `Streamline client intake across ${area} by unifying local search visibility, proof assets, and instant WhatsApp booking.`;
      cta = category.includes('aesthetic') || category.includes('spa') || category.includes('beauty')
        ? 'Schedule appointment'
        : category.includes('health') || category.includes('dental')
        ? 'Book consultation'
        : category.includes('auto') || category.includes('trade') || category.includes('mechanic') || category.includes('repair') || category.includes('solar')
        ? 'Request quote'
        : 'Permission to share preview';
      secondaryOpportunities.push(
        'Rank in Google Local 3-Pack for high-intent search queries',
        'Automate client intake and quote dispatch',
        'Track visitor conversion analytics'
      );
    }

    const confidence = digitalAudit.has_website || socialAudit.is_active ? 'HIGH' : 'MEDIUM';
    const confidenceReason = `Diagnosis derived from verified technical audit signals, social destination quality, and customer journey friction.`;

    return {
      primary_bottleneck: primaryBottleneck,
      secondary_opportunities: secondaryOpportunities.slice(0, 3),
      recommended_intervention: intervention,
      intervention_label: interventionLabel,
      intervention_rationale: rationale,
      appropriate_cta: cta,
      confidence,
      confidence_reason: confidenceReason,
    };
  }
}
