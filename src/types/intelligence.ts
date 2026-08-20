/**
 * Sales Intelligence Pipeline Types & Interfaces
 */

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type EpistemicStatus = 'FACT' | 'INFERENCE' | 'HYPOTHESIS';

export type SourceType =
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'google'
  | 'directory'
  | 'review_platform'
  | 'press'
  | 'other';

export interface ResearchSourceItem {
  source_type: SourceType;
  url: string;
  title: string;
  claim: string;
  epistemic_status: EpistemicStatus;
  confidence: ConfidenceLevel;
  retrieved_at: string;
  raw_snippet?: string;
}

export interface DecisionMakerInfo {
  name?: string;
  role?: string;
  linkedin_url?: string;
  instagram_handle?: string;
  confidence: ConfidenceLevel;
  discovery_notes?: string;
  verified: boolean;
}

export interface IdentityResolution {
  canonical_name: string;
  alternate_names: string[];
  former_names?: string[];
  location: {
    suburb: string;
    city: string;
    province: string;
    country: string;
    address?: string;
    is_verified: boolean;
  };
  industry: string;
  business_type: string;
  phone?: string;
  email?: string;
  website?: string;
  social_accounts: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  decision_maker: DecisionMakerInfo;
  is_currently_active: boolean;
  brand_transition_detected: boolean;
  similar_name_disambiguation?: string;
  identity_confidence: ConfidenceLevel;
  confidence_reason: string;
}

export interface BusinessAuditFundamentals {
  core_offer: string;
  target_customer: string;
  geography: 'local' | 'regional' | 'national' | 'online';
  market_model: 'B2B' | 'B2C' | 'B2B2C';
  revenue_model: 'transactional' | 'recurring' | 'hybrid';
  qualitative_ltv:
    | 'Low (Transactional)'
    | 'Moderate (Repeat Local)'
    | 'High (Specialized Treatment / High-Ticket)'
    | 'Recurring Retainer / Membership';
  ticket_size: 'low_ticket' | 'medium_ticket' | 'high_ticket';
  fulfillment_model: 'appointment_driven' | 'ecommerce' | 'enquiry_driven' | 'walk_in';
  organization_structure: 'founder_led' | 'corporate_franchise' | 'independent_partnership';
  strengths: string[];
}

export type DigitalPresenceClassification =
  | 'NO_PRESENCE'
  | 'DORMANT'
  | 'BASIC'
  | 'FUNCTIONAL'
  | 'STRONG'
  | 'HIGH_CONVERTING';

export interface DigitalPresenceAudit {
  classification: DigitalPresenceClassification;
  has_website: boolean;
  is_active: boolean;
  is_technically_accessible: boolean;
  is_current: boolean;
  is_mobile_friendly: boolean;
  offer_clarity: 'poor' | 'fair' | 'clear' | 'compelling';
  conversion_support: 'none' | 'weak_forms' | 'functional_cta' | 'high_converting_hub';
  local_seo_status: 'absent' | 'basic_nap' | 'optimized_gmb' | 'dominant';
  has_contact_info: boolean;
  has_social_proof: boolean;
  has_ecommerce: boolean;
  has_booking: boolean;
  has_whatsapp: boolean;
  usefulness_verdict:
    | 'non_existent'
    | 'merely_informational'
    | 'functional_resource'
    | 'active_conversion_engine';
  summary: string;
}

export interface SocialCommercialAudit {
  primary_platform?: string;
  is_active: boolean;
  posting_frequency?: string;
  recent_post_date?: string;
  content_themes: string[];
  has_promotional_activity: boolean;
  has_product_service_showcase: boolean;
  has_founder_led_content: boolean;
  has_educational_content: boolean;
  has_testimonials_or_case_studies: boolean;
  calls_to_action: string[];
  link_in_bio_strategy: 'none' | 'generic_multi_link' | 'direct_website' | 'booking_portal' | 'branded_hub';
  destination_quality: 'dm_dead_end' | 'friction_heavy_redirect' | 'seamless_owned_destination';
  commercial_insight: string;
}

export interface CustomerJourneyStage {
  stage_name:
    | 'Discovery'
    | 'Understanding'
    | 'Trust'
    | 'Conversion'
    | 'Fulfilment'
    | 'Retention';
  current_channel: string;
  assessment: string;
  friction_level: 'low' | 'medium' | 'high';
  friction_points: string[];
}

export interface FunnelAudit {
  stages: Record<string, CustomerJourneyStage>;
  primary_bottleneck: string;
  secondary_friction_points: string[];
  summary: string;
}

export interface CompetitorComparison {
  competitor_name: string;
  category: string;
  area: string;
  website_status: string;
  booking_or_conversion_capability: string;
  social_presence: string;
  reviews_profile: string;
  path_of_least_resistance_advantage: string;
}

export interface CompetitiveContext {
  local_competitors: CompetitorComparison[];
  commercial_differentiation: string;
  strategic_takeaway: string;
}

export type RecommendedInterventionType =
  | 'conversion_focused_website'
  | 'local_seo_site'
  | 'ecommerce_storefront'
  | 'booking_funnel'
  | 'landing_page'
  | 'digital_flagship'
  | 'link_in_bio_replacement'
  | 'website_and_booking_integration'
  | 'lead_generation_funnel'
  | 'brand_consolidation'
  | 'reputation_review_funnel'
  | 'content_strategy'
  | 'crm_lead_capture'
  | 'website_rebuild';

export interface OpportunityDiagnosis {
  primary_bottleneck: string;
  secondary_opportunities: string[];
  recommended_intervention: RecommendedInterventionType;
  intervention_label: string;
  intervention_rationale: string;
  appropriate_cta:
    | 'Book consultation'
    | 'Shop now'
    | 'Find a stockist'
    | 'Request quote'
    | 'Start free trial'
    | 'Book a class'
    | 'Call'
    | 'Visit store'
    | 'Schedule appointment'
    | 'Apply'
    | 'Get directions'
    | 'Permission to share preview';
  confidence: ConfidenceLevel;
  confidence_reason: string;
}

export interface BusinessCase {
  headline: string;
  current_state: string;
  problem_and_friction: string;
  opportunity: string;
  commercial_mechanism: string;
  why_now: string;
  why_this_intervention: string;
  projected_monthly_recovered_volume: string;
  qualitative_impact_tier: string;
  qualitative_payback_horizon: string;
  commercial_valuation_range: string;
  estimated_deal_value_zar: number;
}

export type OutreachAngleType =
  | 'growth_opportunity'
  | 'brand_opportunity'
  | 'conversion_opportunity';

export interface ScoredOutreachAngle {
  angle_type: OutreachAngleType;
  title: string;
  core_premise: string;
  sample_hook: string;
  scores: {
    specificity: number; // 0-100
    commercial_relevance: number; // 0-100
    evidence_strength: number; // 0-100
    prospect_fit: number; // 0-100
    personalisation_potential: number; // 0-100
    overall_score: number; // 0-100
  };
  selection_reasoning: string;
}

export interface ChannelOutreachMessages {
  whatsapp: {
    message: string;
    style: 'conversational_human';
    length_chars: number;
  };
  email: {
    subject: string;
    body: string;
    style: 'context_rich';
  };
  linkedin: {
    message: string;
    style: 'concise_professional';
  };
  instagram_dm: {
    message: string;
    style: 'short_conversational';
  };
}

export interface FollowUpTouchpoint {
  step_number: number;
  day_delay: number;
  type: 'value_observation' | 'mockup_specific_idea' | 'low_pressure_close';
  title: string;
  channel: 'email' | 'whatsapp' | 'social_dm' | 'linkedin';
  subject?: string;
  message: string;
  action_guidance: string;
}

export interface OutreachStrategy {
  prospect_temperature: 'COLD' | 'WARM' | 'VERY_WARM';
  warm_signals: string[];
  decision_maker_context?: {
    name?: string;
    role?: string;
    angle_of_approach: string;
  };
  selected_angle: ScoredOutreachAngle;
  alternative_angles: ScoredOutreachAngle[];
  messages: ChannelOutreachMessages;
  follow_up_sequence: FollowUpTouchpoint[];
}

export interface QualityValidationScores {
  genericity_score: number; // 0-100 (Goal: LOW, < 25)
  research_specificity_score: number; // 0-100 (Goal: HIGH, >= 75)
  evidence_score: number; // 0-100 (Goal: HIGH, >= 70)
  commercial_relevance_score: number; // 0-100 (Goal: HIGH, >= 80)
  personalisation_score: number; // 0-100 (Goal: HIGH, >= 75)
  is_ready_to_send: boolean;
  rejection_reasons: string[];
  warnings: string[];
}

export interface SalesIntelligenceReport {
  id: string;
  business_id: string;
  created_at: string;
  updated_at: string;
  identity: IdentityResolution;
  business_fundamentals: BusinessAuditFundamentals;
  digital_presence: DigitalPresenceAudit;
  social_audit: SocialCommercialAudit;
  funnel_audit: FunnelAudit;
  competitive_context: CompetitiveContext;
  opportunity: OpportunityDiagnosis;
  business_case: BusinessCase;
  outreach_strategy: OutreachStrategy;
  quality_scores: QualityValidationScores;
  sources: ResearchSourceItem[];
  generated_by: 'ai_researcher_llm' | 'deterministic_sales_engine';
}
