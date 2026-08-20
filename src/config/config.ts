import dotenv from 'dotenv';
import path from 'path';
import { buildExpandedQueryMatrix, getNicheKeywords } from './regions.js';

// Load environment variables from .env file
dotenv.config();

export interface AppConfig {
  searchTerms: string[];
  maxResults: number;
  headless: boolean;
  outputDir: string;
  logDir: string;
  notionToken: string;
  notionDatabaseId: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
}

export const getConfig = (): AppConfig => {
  let searchTerms: string[] = [];

  const rawTerms = process.env.SEARCH_TERMS || process.env.SEARCH_TERM;
  if (rawTerms && rawTerms.trim()) {
    searchTerms = rawTerms
      .split(',')
      .map((term) => term.trim())
      .filter((term) => term.length > 0);
  } else if (process.env.NICHES || process.env.PROVINCES) {
    const niches = (process.env.NICHES || 'all_high_yield').split(',').map((n) => n.trim());
    const provinces = (process.env.PROVINCES || 'KZN,GP,WC').split(',').map((p) => p.trim());
    searchTerms = buildExpandedQueryMatrix({ niches, provinces, useModifiers: true });
  } else {
    // Broad, high-converting national default search population
    searchTerms = [
      'dentist Umhlanga',
      'dentist Sandton',
      'dentist Sea Point',
      'solar installer Durban',
      'solar company Johannesburg',
      'solar installer Cape Town',
      'beauty salon Umhlanga',
      'hair salon Sandton',
      'aesthetic clinic Cape Town',
      'gym Umhlanga',
      'crossfit Sandton',
      'pilates studio Sea Point',
      'law firm Durban North',
      'attorney Sandton',
      'physiotherapist Umhlanga',
      'physiotherapy Rosebank',
      'real estate agent Umhlanga Rocks',
      'estate agency Sandton',
      'car detailing Umhlanga',
      'auto repair mechanic Sandton',
      'electrician Durban',
      'plumber Cape Town',
      'fine dining restaurant Umhlanga',
    ];
  }

  const maxResults = parseInt(process.env.MAX_RESULTS || '50', 10);
  const headless = process.env.HEADLESS !== 'false';
  const outputDir = path.resolve(process.cwd(), process.env.OUTPUT_DIR || './data');
  const logDir = path.resolve(process.cwd(), process.env.LOG_DIR || './logs');
  const notionToken = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY || '';
  const notionDatabaseId = process.env.NOTION_DATABASE_ID || '';
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  return {
    searchTerms,
    maxResults: isNaN(maxResults) || maxResults <= 0 ? 50 : maxResults,
    headless,
    outputDir,
    logDir,
    notionToken,
    notionDatabaseId,
    geminiApiKey,
    openaiApiKey,
  };
};
