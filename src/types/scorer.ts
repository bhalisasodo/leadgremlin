/**
 * Phase 2: Website Analysis Interfaces
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
}

export interface WebsiteScoreResult {
  url: string;
  score: number; // 0 to 100
  audit: TechnicalAudit;
  scrapedAt: string;
}

export type OutreachChannel = 'email' | 'whatsapp' | 'social_dm' | 'cold_call';
export type OutreachTone = 'consultative' | 'direct' | 'casual' | 'urgent';

export interface MultiChannelScripts {
  email: { subject: string; body: string };
  whatsapp: string;
  socialDm: string;
  coldCall: { opener: string; discovery: string; objectionHandling: string; close: string };
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
}

export interface AIAuditOutput {
  issues: string[];
  recommendations: string[];
  estimatedProjectValueZAR: number;
  personalizedOutreachScript: string;
  multiChannelScripts?: MultiChannelScripts;
  auditTimestamp: string;
}
