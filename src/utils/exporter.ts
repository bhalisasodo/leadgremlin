import fs from 'fs';
import path from 'path';
import { Business } from '../types/business.js';
import { logger } from './logger.js';

export class Exporter {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Escape fields for CSV formatting
   */
  private escapeCsv(field?: string | number): string {
    if (field === undefined || field === null) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Converts array of Business objects to CSV string
   */
  public toCsv(businesses: Business[]): string {
    const headers = [
      'ID',
      'Name',
      'Category',
      'Area',
      'Address',
      'Phone',
      'Email',
      'Website',
      'Instagram',
      'Facebook',
      'LinkedIn',
      'Twitter/X',
      'TikTok',
      'YouTube',
      'Rating',
      'ReviewCount',
      'FunnelStage',
      'OpportunityScore',
      'WebsiteScore',
      'EstimatedDealValue',
      'EmailPitchSubject',
      'Notes',
      'MapsUrl',
      'ScrapedAt',
      'SearchTerm',
      'Source',
    ];

    const rows = businesses.map((b) => [
      this.escapeCsv(b.id),
      this.escapeCsv(b.name),
      this.escapeCsv(b.category),
      this.escapeCsv(b.area),
      this.escapeCsv(b.address),
      this.escapeCsv(b.phone),
      this.escapeCsv(b.email),
      this.escapeCsv(b.website),
      this.escapeCsv(b.socials?.instagram),
      this.escapeCsv(b.socials?.facebook),
      this.escapeCsv(b.socials?.linkedin),
      this.escapeCsv(b.socials?.twitter),
      this.escapeCsv(b.socials?.tiktok),
      this.escapeCsv(b.socials?.youtube),
      this.escapeCsv(b.rating),
      this.escapeCsv(b.reviewCount),
      this.escapeCsv(b.funnelStage),
      this.escapeCsv(b.opportunityScore),
      this.escapeCsv(b.websiteScore),
      this.escapeCsv(b.estimatedDealValue),
      this.escapeCsv(b.aiPitchScripts?.email?.subject),
      this.escapeCsv(b.notes),
      this.escapeCsv(b.mapsUrl),
      this.escapeCsv(b.scrapedAt),
      this.escapeCsv(b.searchTerm),
      this.escapeCsv(b.source),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Saves businesses to both JSON and CSV format
   */
  public save(businesses: Business[]): { jsonPath: string; csvPath: string } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const timestampedJson = path.join(this.outputDir, `leads_${timestamp}.json`);
    const timestampedCsv = path.join(this.outputDir, `leads_${timestamp}.csv`);
    const latestJson = path.join(this.outputDir, 'leads_latest.json');
    const latestCsv = path.join(this.outputDir, 'leads_latest.csv');
    const dashboardJson = path.join(this.outputDir, 'leads_dashboard.json');

    const jsonContent = JSON.stringify(businesses, null, 2);
    const csvContent = this.toCsv(businesses);

    fs.writeFileSync(timestampedJson, jsonContent, 'utf-8');
    fs.writeFileSync(latestJson, jsonContent, 'utf-8');
    fs.writeFileSync(dashboardJson, jsonContent, 'utf-8');

    fs.writeFileSync(timestampedCsv, csvContent, 'utf-8');
    fs.writeFileSync(latestCsv, csvContent, 'utf-8');

    // Keep public & docs dashboard json files synchronized for static preview & gh-pages
    try {
      const publicJson = path.resolve(process.cwd(), './public/leads_dashboard.json');
      const docsJson = path.resolve(process.cwd(), './docs/leads_dashboard.json');
      if (fs.existsSync(path.dirname(publicJson))) {
        fs.writeFileSync(publicJson, jsonContent, 'utf-8');
      }
      if (fs.existsSync(path.dirname(docsJson))) {
        fs.writeFileSync(docsJson, jsonContent, 'utf-8');
      }
    } catch {
      // Non-fatal if folder permissions or structure differs
    }

    logger.info(`Exported ${businesses.length} leads to ${timestampedJson} and ${timestampedCsv}`);

    return {
      jsonPath: timestampedJson,
      csvPath: timestampedCsv,
    };
  }
}
