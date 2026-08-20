import { Business } from '../types/business.js';
import { logger } from '../utils/logger.js';
import { SequenceEngine } from './sequenceEngine.js';
import { SequenceExporter } from './sequenceExporter.js';
import { SequenceArchetype, ComprehensiveSequence } from '../types/outreach.js';

export { SequenceEngine, SequenceExporter };

export interface EmailStep {
  stepNumber: number;
  dayDelay: number;
  title: string;
  subject: string;
  body: string;
}

export interface OutreachSequence {
  businessName: string;
  category: string;
  area: string;
  steps: EmailStep[];
  createdAt: string;
}

export class EmailSequenceManager {
  /**
   * Generates a multi-step automated email outreach sequence tailored to the business lead
   */
  public static generateSequence(
    lead: Business,
    archetype: SequenceArchetype = 'omni_channel_blitz'
  ): OutreachSequence {
    const compSeq = SequenceEngine.generateSequence(lead, archetype);

    // Map email touchpoints
    const emailSteps: EmailStep[] = compSeq.touchpoints
      .filter((t) => t.channel === 'email' || t.subject)
      .map((t, idx) => ({
        stepNumber: idx + 1,
        dayDelay: t.dayDelay,
        title: t.title,
        subject: t.subject || `Follow-up for ${lead.name}`,
        body: t.body,
      }));

    return {
      businessName: lead.name,
      category: lead.category || 'Local Business',
      area: lead.area || 'South Africa',
      steps: emailSteps,
      createdAt: compSeq.createdAt,
    };
  }

  /**
   * Generates full comprehensive multi-channel sequence (Email + WhatsApp + Call + Social DM)
   */
  public static generateFullSequence(
    lead: Business,
    archetype: SequenceArchetype = 'omni_channel_blitz'
  ): ComprehensiveSequence {
    return SequenceEngine.generateSequence(lead, archetype);
  }
}
