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
