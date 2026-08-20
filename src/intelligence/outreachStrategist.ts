import { Business } from '../types/business.js';
import {
  BusinessAuditFundamentals,
  BusinessCase,
  DigitalPresenceAudit,
  IdentityResolution,
  OpportunityDiagnosis,
  OutreachAngleType,
  OutreachStrategy,
  ScoredOutreachAngle,
  SocialCommercialAudit,
} from '../types/intelligence.js';

export class OutreachStrategist {
  /**
   * Evaluates prospect temperature, decision-maker context, and generates 3 scored outreach angles
   */
  public static planStrategy(
    lead: Partial<Business>,
    identity: IdentityResolution,
    fundamentals: BusinessAuditFundamentals,
    digitalAudit: DigitalPresenceAudit,
    socialAudit: SocialCommercialAudit,
    diagnosis: OpportunityDiagnosis,
    businessCase: BusinessCase
  ): {
    temperature: 'COLD' | 'WARM' | 'VERY_WARM';
    warm_signals: string[];
    decision_maker_context?: OutreachStrategy['decision_maker_context'];
    selected_angle: ScoredOutreachAngle;
    alternative_angles: ScoredOutreachAngle[];
  } {
    const name = identity.canonical_name || lead.name || 'The business';
    const area = identity.location.suburb || lead.area || 'Umhlanga';
    const category = lead.category || 'Local Business';
    const dm = identity.decision_maker;

    // 1. Determine Prospect Temperature & Warm Signals
    const warmSignals: string[] = [];
    if (socialAudit.is_active) warmSignals.push('Actively publishing content on social media');
    if (socialAudit.has_founder_led_content) warmSignals.push('Founder/Practitioner visibly active in marketing');
    if (socialAudit.has_promotional_activity) warmSignals.push('Actively running promotional offers and campaigns');
    if (lead.reviewCount && lead.reviewCount >= 20) warmSignals.push(`Established high-volume review base (${lead.reviewCount}+ reviews)`);
    if (dm.verified && dm.name) warmSignals.push(`Identified key decision maker (${dm.name})`);
    if (digitalAudit.has_website) warmSignals.push('Existing web infrastructure present');

    let temperature: 'COLD' | 'WARM' | 'VERY_WARM' = 'COLD';
    if (warmSignals.length >= 4) {
      temperature = 'VERY_WARM';
    } else if (warmSignals.length >= 2) {
      temperature = 'WARM';
    }

    // 2. Decision Maker Context
    let dmContext: OutreachStrategy['decision_maker_context'] = undefined;
    if (dm.name) {
      dmContext = {
        name: dm.name,
        role: dm.role,
        angle_of_approach: dm.role?.includes('Founder') || dm.role?.includes('Owner')
          ? 'Founder-to-founder strategic observation (focusing on enterprise brand ownership & growth)'
          : 'Operational efficiency and client intake acceleration',
      };
    }

    // 3. Generate 3 Angles
    const angles: ScoredOutreachAngle[] = [
      this.buildGrowthAngle(name, area, category, identity, socialAudit, digitalAudit, diagnosis),
      this.buildBrandAngle(name, area, category, identity, socialAudit, digitalAudit, diagnosis),
      this.buildConversionAngle(name, area, category, identity, socialAudit, digitalAudit, diagnosis),
    ];

    // Sort by overall score descending
    angles.sort((a, b) => b.scores.overall_score - a.scores.overall_score);

    const selectedAngle = angles[0];
    const alternativeAngles = angles.slice(1);

    return {
      temperature,
      warm_signals: warmSignals,
      decision_maker_context: dmContext,
      selected_angle: selectedAngle,
      alternative_angles: alternativeAngles,
    };
  }

  private static buildGrowthAngle(
    name: string,
    area: string,
    category: string,
    identity: IdentityResolution,
    social: SocialCommercialAudit,
    digital: DigitalPresenceAudit,
    diagnosis: OpportunityDiagnosis
  ): ScoredOutreachAngle {
    const dmName = identity.decision_maker.name;
    const title = 'Angle A — Growth & Missed Demand Focus';
    const premise = `Focus on captured vs uncaptured local demand in ${area}, specifically high-intent prospects searching after hours who bounce when instant booking is unavailable.`;
    const hook = `I noticed ${name} has built strong local demand in ${area}, but after-hours client inquiries currently have no direct automated booking path.`;

    const specificity = social.is_active ? 88 : 78;
    const commercialRelevance = 92;
    const evidenceStrength = digital.has_website || social.is_active ? 85 : 70;
    const prospectFit = 86;
    const personalisationPotential = dmName ? 90 : 80;
    const overallScore = Math.round(
      (specificity * 0.2 + commercialRelevance * 0.3 + evidenceStrength * 0.2 + prospectFit * 0.15 + personalisationPotential * 0.15)
    );

    return {
      angle_type: 'growth_opportunity',
      title,
      core_premise: premise,
      sample_hook: hook,
      scores: {
        specificity,
        commercial_relevance: commercialRelevance,
        evidence_strength: evidenceStrength,
        prospect_fit: prospectFit,
        personalisation_potential: personalisationPotential,
        overall_score: overallScore,
      },
      selection_reasoning: `Strongest when the business already has established awareness but lacks capture rails for after-hours traffic.`,
    };
  }

  private static buildBrandAngle(
    name: string,
    area: string,
    category: string,
    identity: IdentityResolution,
    social: SocialCommercialAudit,
    digital: DigitalPresenceAudit,
    diagnosis: OpportunityDiagnosis
  ): ScoredOutreachAngle {
    const dmName = identity.decision_maker.name;
    const title = 'Angle B — Brand Positioning & Digital Ownership';
    const premise = dmName
      ? `Focus on unifying ${dmName}'s personal brand and ${name}'s community into an owned digital flagship independent of third-party platforms.`
      : `Focus on establishing an owned digital flagship that reflects ${name}'s premium reputation in ${area}.`;
    const hook = dmName
      ? `I noticed ${dmName} is actively building an audience on Instagram, but there is no owned digital home connecting that personal brand to ${name}'s membership funnel.`
      : `I came across ${name} while researching top ${category} brands in ${area} and noticed your strong reputation isn't yet mirrored in a dedicated digital storefront.`;

    const specificity = dmName ? 94 : 80;
    const commercialRelevance = 84;
    const evidenceStrength = social.has_founder_led_content ? 92 : 75;
    const prospectFit = dmName || social.is_active ? 90 : 72;
    const personalisationPotential = dmName ? 95 : 78;
    const overallScore = Math.round(
      (specificity * 0.2 + commercialRelevance * 0.25 + evidenceStrength * 0.2 + prospectFit * 0.15 + personalisationPotential * 0.2)
    );

    return {
      angle_type: 'brand_opportunity',
      title,
      core_premise: premise,
      sample_hook: hook,
      scores: {
        specificity,
        commercial_relevance: commercialRelevance,
        evidence_strength: evidenceStrength,
        prospect_fit: prospectFit,
        personalisation_potential: personalisationPotential,
        overall_score: overallScore,
      },
      selection_reasoning: `Exceptional for founder-led businesses, personal brands, and high-reputation providers transitioning into structured growth.`,
    };
  }

  private static buildConversionAngle(
    name: string,
    area: string,
    category: string,
    identity: IdentityResolution,
    social: SocialCommercialAudit,
    digital: DigitalPresenceAudit,
    diagnosis: OpportunityDiagnosis
  ): ScoredOutreachAngle {
    const title = 'Angle C — Funnel Friction & Conversion Optimization';
    const premise = `Focus on eliminating specific drop-off barriers (e.g. multi-link directories, external portal redirects, manual DM qualification) to increase conversion rates from existing traffic.`;
    const hook = `I noticed on social media that ${name} routes interested prospects through external multi-step redirects, introducing unnecessary drop-off before booking.`;

    const specificity = social.link_in_bio_strategy === 'generic_multi_link' ? 95 : 82;
    const commercialRelevance = 90;
    const evidenceStrength = 88;
    const prospectFit = social.link_in_bio_strategy === 'generic_multi_link' || digital.has_website ? 92 : 75;
    const personalisationPotential = 82;
    const overallScore = Math.round(
      (specificity * 0.25 + commercialRelevance * 0.25 + evidenceStrength * 0.2 + prospectFit * 0.2 + personalisationPotential * 0.1)
    );

    return {
      angle_type: 'conversion_opportunity',
      title,
      core_premise: premise,
      sample_hook: hook,
      scores: {
        specificity,
        commercial_relevance: commercialRelevance,
        evidence_strength: evidenceStrength,
        prospect_fit: prospectFit,
        personalisation_potential: personalisationPotential,
        overall_score: overallScore,
      },
      selection_reasoning: `Ideal for businesses using Linktree, Beacons, or external booking portals where friction is visually obvious.`,
    };
  }
}
