import { Business } from './business.js';
import { WebsiteScoreResult, AIAuditOutput } from './scorer.js';

export interface NotionLeadRecord {
  business: Business;
  websiteAnalysis?: WebsiteScoreResult;
  aiAudit?: AIAuditOutput;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | 'SKIPPED_DUPLICATE';
  notionPageId?: string;
}

export interface NotionSyncOptions {
  token: string;
  databaseId: string;
}

export interface NotionSyncResult {
  syncedCount: number;
  skippedCount: number;
  failedCount: number;
}
