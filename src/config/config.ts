import dotenv from 'dotenv';
import path from 'path';

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
}

export const getConfig = (): AppConfig => {
  const rawTerms = process.env.SEARCH_TERMS || process.env.SEARCH_TERM || 'gym Durban, gym Umhlanga, gym Ballito, gym Durban North, gym Morningside Durban, gym Berea Durban, gym Glenwood Durban, gym Westville, gym Pinetown, gym Hillcrest Durban, gym Kloof, gym Amanzimtoti, gym Bluff Durban, gym Phoenix Durban, crossfit Durban, fitness center Durban';
  const searchTerms = rawTerms
    .split(',')
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

  const maxResults = parseInt(process.env.MAX_RESULTS || '100', 10);
  const headless = process.env.HEADLESS !== 'false';
  const outputDir = path.resolve(process.cwd(), process.env.OUTPUT_DIR || './data');
  const logDir = path.resolve(process.cwd(), process.env.LOG_DIR || './logs');
  const notionToken = process.env.NOTION_TOKEN || '';
  const notionDatabaseId = process.env.NOTION_DATABASE_ID || '';

  return {
    searchTerms,
    maxResults: isNaN(maxResults) || maxResults <= 0 ? 100 : maxResults,
    headless,
    outputDir,
    logDir,
    notionToken,
    notionDatabaseId,
  };
};
