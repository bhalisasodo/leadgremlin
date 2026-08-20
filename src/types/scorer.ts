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
  estimatedMonthlyRevenueImpactZAR: number;
  paybackPeriodDays: number;
  strategicPitchHook: string;
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
  auditTimestamp: string;
  generatedBy?: 'llm' | 'deterministic_engine';
}
