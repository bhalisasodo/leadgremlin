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

/**
 * Phase 3: AI Website Auditing Interfaces
 */
export interface AIAuditInput {
  businessName: string;
  websiteUrl: string;
  htmlContent?: string;
  screenshotPaths?: string[];
  technicalAudit?: TechnicalAudit;
}

export interface AIAuditOutput {
  issues: string[];
  recommendations: string[];
  estimatedProjectValueZAR: number;
  personalizedOutreachScript: string;
  auditTimestamp: string;
}
