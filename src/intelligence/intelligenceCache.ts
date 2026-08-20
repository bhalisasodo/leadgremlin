import fs from 'fs';
import path from 'path';
import { SalesIntelligenceReport } from '../types/intelligence.js';
import { logger } from '../utils/logger.js';

export class IntelligenceCache {
  private cacheFilePath: string;
  private memoryCache: Map<string, SalesIntelligenceReport> = new Map();
  private maxAgeMs: number;

  constructor(dataDir: string = './data', maxAgeDays: number = 7) {
    this.cacheFilePath = path.resolve(process.cwd(), dataDir, 'intelligence_cache.json');
    this.maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const raw = fs.readFileSync(this.cacheFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: SalesIntelligenceReport) => {
            if (item.business_id) {
              this.memoryCache.set(item.business_id, item);
            }
          });
        }
      }
    } catch (err) {
      logger.warn(`Failed to read intelligence cache: ${String(err)}`);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const arrayData = Array.from(this.memoryCache.values());
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(arrayData, null, 2));
    } catch (err) {
      logger.warn(`Failed to write intelligence cache: ${String(err)}`);
    }
  }

  public get(businessId: string, forceFresh: boolean = false): SalesIntelligenceReport | null {
    if (forceFresh) return null;
    const cached = this.memoryCache.get(businessId);
    if (!cached) return null;

    const createdAt = new Date(cached.updated_at || cached.created_at).getTime();
    if (Date.now() - createdAt > this.maxAgeMs) {
      this.memoryCache.delete(businessId);
      return null;
    }

    return cached;
  }

  public set(report: SalesIntelligenceReport): void {
    this.memoryCache.set(report.business_id, report);
    this.saveToDisk();
  }

  public clear(): void {
    this.memoryCache.clear();
    if (fs.existsSync(this.cacheFilePath)) {
      try {
        fs.unlinkSync(this.cacheFilePath);
      } catch {}
    }
  }
}

export const intelligenceCache = new IntelligenceCache();
