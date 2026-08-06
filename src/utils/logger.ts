import fs from 'fs';
import path from 'path';
import { getConfig } from '../config/config.js';
import { Business } from '../types/business.js';

export class Logger {
  private logFilePath: string;

  constructor() {
    const config = getConfig();
    if (!fs.existsSync(config.logDir)) {
      fs.mkdirSync(config.logDir, { recursive: true });
    }
    this.logFilePath = path.join(config.logDir, `leadgremlin_${new Date().toISOString().split('T')[0]}.log`);
  }

  private writeToFile(message: string) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(this.logFilePath, `[${timestamp}] ${message}\n`, 'utf-8');
  }

  public info(message: string) {
    console.log(`ℹ ${message}`);
    this.writeToFile(`INFO: ${message}`);
  }

  public success(message: string) {
    console.log(`✓ ${message}`);
    this.writeToFile(`SUCCESS: ${message}`);
  }

  public warn(message: string) {
    console.warn(`⚠️ ${message}`);
    this.writeToFile(`WARN: ${message}`);
  }

  public error(message: string, error?: unknown) {
    const errorDetails = error instanceof Error ? error.stack || error.message : String(error || '');
    console.error(`✖ ${message} ${errorDetails ? `- ${errorDetails}` : ''}`);
    this.writeToFile(`ERROR: ${message} - ${errorDetails}`);
  }

  public logBusiness(business: Business) {
    const formatted = `
✓ ${business.name}
  Category: ${business.category || 'N/A'}
  Website: ${business.website || 'N/A'}
  Rating: ${business.rating ?? 'N/A'} (${business.reviewCount ?? 0} reviews)
  Phone: ${business.phone || 'N/A'}
  Address: ${business.address || 'N/A'}
  Maps: ${business.mapsUrl || 'N/A'}
  Saved.
`.trim();

    console.log(`\n${formatted}\n`);
    this.writeToFile(`BUSINESS SAVED: ${business.name} | Phone: ${business.phone || 'N/A'} | Web: ${business.website || 'N/A'}`);
  }
}

export const logger = new Logger();
