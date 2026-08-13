import { ProspectCategory } from '../utils/categoryClassifier.js';
import { TechnicalAudit, MultiChannelScripts } from './scorer.js';

export type FunnelStage =
  | 'new'
  | 'enriched'
  | 'outreach'
  | 'meeting'
  | 'proposal'
  | 'won'
  | 'lost';

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

/**
 * Enhanced Business Lead Interface for Sales Funnel
 */
export interface Business {
  id: string;
  name: string;
  category: ProspectCategory;
  rawCategory?: string;
  area: string;
  address?: string;
  phone?: string;
  secondaryPhone?: string;
  website?: string;
  email?: string;
  secondaryEmail?: string;
  socials: SocialLinks;
  rating?: number;
  reviewCount?: number;
  mapsUrl?: string;
  plusCode?: string;
  funnelStage: FunnelStage;
  opportunityScore: number; // 1 - 100
  websiteScore?: number;
  estimatedDealValue?: number;
  technicalAudit?: TechnicalAudit;
  aiPitchScripts?: MultiChannelScripts;
  notes?: string;
  lastContactedAt?: string;
  scrapedAt: string;
  searchTerm?: string;
  source: 'google_maps' | 'web_search' | 'directory' | 'manual' | 'multi_source' | 'pipeline';
}

/**
 * Scraper Configuration Options
 */
export interface ScraperOptions {
  searchTerms: string[];
  maxResultsPerTerm: number;
  headless: boolean;
  timeoutMs?: number;
  includeWebSearch?: boolean;
  includeDeepCrawl?: boolean;
  concurrency?: number;
}

/**
 * Lead Scraping Pipeline Summary
 */
export interface ScrapeSummary {
  foundTotal: number;
  savedTotal: number;
  duplicatesTotal: number;
  errorsTotal: number;
  durationMs: number;
  termsProcessed: string[];
}
