import { Client } from '@notionhq/client';
import { getConfig } from '../config/config.js';

let notionClientInstance: Client | null = null;

/**
 * Returns an initialized Notion Client instance using environment credentials.
 */
export const getNotionClient = (): Client => {
  if (!notionClientInstance) {
    const config = getConfig();
    if (!config.notionToken) {
      throw new Error('NOTION_TOKEN environment variable is not defined.');
    }
    notionClientInstance = new Client({ auth: config.notionToken });
  }
  return notionClientInstance;
};

/**
 * Exponential backoff retry wrapper for Notion API calls
 */
export async function withNotionRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isRateLimit = err?.status === 429 || err?.code === 'rate_limited';
      const isNetworkErr = err?.message?.includes('fetch failed') || err?.code === 'ECONNRESET';

      if (attempt >= maxRetries || (!isRateLimit && !isNetworkErr)) {
        throw err;
      }
      const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.warn(`[Notion Retry] Rate limit / connection issue. Attempt ${attempt}/${maxRetries} in ${Math.round(delayMs)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
