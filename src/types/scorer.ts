export interface FunnelTechStack {
  linkInBioTool?: string; // 'Linktree' | 'Beacons' | 'Bento' | 'Taplink' | 'Carrd' | 'Direct Website' | 'None'
  bookingEngine?: string; // 'Octiv' | 'Fresha' | 'Dineplan' | 'Mindbody' | 'Calendly' | 'Acuity' | 'RecoMed' | 'Booksy' | 'Custom' | 'None'
  leadCaptureChannels: string[]; // ['WhatsApp Direct', 'Instagram DM', 'Contact Form', 'Phone Call', 'Email']
  paymentGateway?: string; // 'Yoco' | 'PayFast' | 'Ozow' | 'Paystack' | 'SnapScan' | 'Direct EFT'
  analyticsRetargeting: string[]; // ['Meta Pixel', 'GA4', 'Google Tag Manager', 'TikTok Pixel']
  currentArchitecture:
    | 'fragmented_external_stack'
    | 'manual_friction_heavy'
    | 'isolated_website_silo'
    | 'unified_optimized_hub';
}

export interface TailoredBusinessCase {
  headline: string;
  currentWorkflowSummary: string;
  identifiedGaps: string[];
  commercialFrictionPoints: string[];
  proposedCentralizedSolution: string;
  projectedMonthlyRecoveredLeads: string;
  estimatedMonthlyRevenueImpactZAR?: number;
  qualitativeImpactTier?: string; // e.g. "High Commercial Upside", "Substantial Inbound Expansion", "Moderate Conversion Opportunity", "Foundational Lead Intake Gap"
  paybackPeriodDays?: number;
  qualitativePaybackHorizon?: string; // e.g. "Immediate (< 30 Days)", "Rapid Turnaround (1–2 Months)", "Short-Term Horizon"
  dealScopeClassification?: string; // e.g. "Centralized Multi-Tool Hub Transformation", "Automated 24/7 Intake & Scheduling System", "Mobile Lead Capture & Security Upgrade"
  commercialValuationRange?: string; // e.g. "R15,000 – R25,000 (Focused Mobile Funnel)", "R25,000 – R45,000 (Centralized Booking Hub)", "R45,000+ (Full Omnichannel Transformation)"
  strategicPitchHook: string;
}

export interface BusinessAuditFundamentals {
  coreOffer: string; // What does the company actually sell?
  targetCustomer: string; // Who is the likely customer?
  geographicScope: 'local' | 'regional' | 'national' | 'online';
  marketModel: 'B2B' | 'B2C' | 'B2B2C';
  revenueModel: 'transactional' | 'recurring' | 'hybrid';
  qualitativeLtv:
    | 'Low (Transactional)'
    | 'Moderate (Repeat Local)'
    | 'High (Specialized Treatment / High-Ticket)'
    | 'Recurring Retainer / Membership';
  ticketSize: 'low_ticket' | 'medium_ticket' | 'high_ticket';
  fulfillmentModel: 'appointment_driven' | 'ecommerce' | 'enquiry_driven' | 'walk_in';
  organizationStructure: 'founder_led' | 'corporate_franchise' | 'independent_partnership';
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
  hasActiveWebsite: boolean;
  isTechnicallyAccessible: boolean;
  isCurrentAndMaintained: boolean;
  isMobileFriendly: boolean;
  offerClarityRating: 'poor' | 'fair' | 'clear' | 'compelling';
  conversionSupport: 'none' | 'weak_forms' | 'functional_cta' | 'high_converting_hub';
  localSeoStatus: 'absent' | 'basic_nap' | 'optimized_gmb' | 'dominant';
  hasContactInformation: boolean;
  hasSocialProof: boolean;
  hasEcommerce: boolean;
  hasBooking: boolean;
  hasWhatsapp: boolean;
  usefulnessVerdict:
    | 'non_existent'
    | 'merely_informational'
    | 'functional_resource'
    | 'active_conversion_engine';
  summaryEvaluation: string;
}

export interface SocialCommercialAudit {
  platform: string;
  accountUrl?: string;
  activityStatus: 'active' | 'infrequent' | 'dormant' | 'unlinked';
  postingFrequency?: string;
  contentThemes: string[];
  hasPromotionalOffers: boolean;
  hasProductServiceShowcase: boolean;
  hasSocialProofOrCaseStudies: boolean;
  hasEducationalContent: boolean;
  hasFounderLedContent: boolean;
  linkInBioStrategy: 'none' | 'generic_multi_link' | 'direct_website' | 'booking_portal' | 'branded_hub';
  destinationQuality: 'dm_dead_end' | 'friction_heavy_redirect' | 'seamless_owned_destination';
  commercialInsight: string;
}

export interface CustomerJourneyStageEvaluation {
  stageName: string;
  channel: string;
  assessment: string;
  frictionLevel: 'low' | 'medium' | 'high';
  frictionPoints: string[];
}

export interface FunnelCustomerJourneyAudit {
  stages: {
    discovery: CustomerJourneyStageEvaluation;
    socialOrSearch: CustomerJourneyStageEvaluation;
    landingExperience: CustomerJourneyStageEvaluation;
    offerUnderstanding: CustomerJourneyStageEvaluation;
    trustAndSocialProof: CustomerJourneyStageEvaluation;
    conversionAction: CustomerJourneyStageEvaluation;
    bookingOrPurchase: CustomerJourneyStageEvaluation;
    fulfilmentAndRetention: CustomerJourneyStageEvaluation;
  };
  primaryBottlenecks: string[];
  journeySummary: string;
}

export interface CompetitorComparisonItem {
  competitorName: string;
  category: string;
  area: string;
  websiteStatus: string;
  bookingCapability: string;
  socialPresence: string;
  reviewsProfile: string;
  pathOfLeastResistanceAdvantage: string;
}

export interface CompetitiveContextAudit {
  localCompetitors: CompetitorComparisonItem[];
  commercialDifferentiation: string;
  strategicTakeaway: string;
}

export interface AuditEvidenceItem {
  source: 'html_meta' | 'http_headers' | 'dom_element' | 'social_graph' | 'google_maps_api' | 'dns_ssl';
  claim: string;
  rawEvidence: string;
  extractedFromUrl?: string;
  verifiedAt: string;
  verified: boolean;
}

export interface ComprehensiveAuditOutput {
  fundamentals: BusinessAuditFundamentals;
  digitalPresence: DigitalPresenceAudit;
  socialAudit: SocialCommercialAudit;
  funnelAudit: FunnelCustomerJourneyAudit;
  competitiveContext: CompetitiveContextAudit;
  evidenceTrail: AuditEvidenceItem[];
  opportunityDiagnosis: string;
}

/**
 * Phase 2 & 5: Website and Sales Funnel Analysis Interfaces
 */
export interface TechnicalAudit {
  hasHttps: boolean;
  loadSpeedSeconds?: number;
  hasContactForm: boolean;
  hasBookingSystem: boolean;
  hasWhatsappLink: boolean;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  analyticsDetected: string[];
  cms?: string;
  frameworks?: string[];
  chatTools?: string[];
  openGraph?: {
    hasOgImage: boolean;
    hasOgTitle: boolean;
    hasOgDescription: boolean;
  };
  seoScore?: number;
  metaTitle?: string;
  metaDescription?: string;
  hasFavicon: boolean;
  hasResponsiveViewport: boolean;
  funnelTechStack?: FunnelTechStack;
  businessCase?: TailoredBusinessCase;
  comprehensiveAudit?: ComprehensiveAuditOutput;
}

export interface WebsiteScoreResult {
  url: string;
  score: number; // 0 to 100
  audit: TechnicalAudit;
  scrapedAt: string;
}

export type OutreachChannel = 'email' | 'whatsapp' | 'social_dm' | 'cold_call';
export type OutreachTone = 'consultative' | 'direct' | 'casual' | 'urgent' | 'roi_focused';

export interface EmailStepScript {
  stepNumber: number;
  dayDelay: number;
  title: string;
  subject: string;
  body: string;
}

export interface MultiChannelScripts {
  email: { subject: string; body: string };
  whatsapp: string;
  socialDm: string;
  coldCall: { opener: string; discovery: string; objectionHandling: string; close: string };
  dripSequence?: EmailStepScript[];
  primaryAuditCallout?: string;
  nicheAngle?: string;
}

export interface AIAuditInput {
  businessName: string;
  websiteUrl: string;
  category?: string;
  area?: string;
  rating?: number;
  reviewCount?: number;
  htmlContent?: string;
  screenshotPaths?: string[];
  technicalAudit?: TechnicalAudit;
  tone?: OutreachTone;
  customPrompt?: string;
  llmApiKey?: string;
}

export interface AIAuditOutput {
  issues: string[];
  recommendations: string[];
  estimatedProjectValueZAR: number;
  personalizedOutreachScript: string;
  multiChannelScripts?: MultiChannelScripts;
  funnelTechStack?: FunnelTechStack;
  businessCase?: TailoredBusinessCase;
  salesIntelligence?: import('./intelligence.js').SalesIntelligenceReport;
  auditTimestamp: string;
  generatedBy?: 'llm' | 'deterministic_engine';
}
