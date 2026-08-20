import { OutreachTone } from './scorer.js';

export type SequenceArchetype =
  | 'omni_channel_blitz'
  | 'audit_breakdown'
  | 'roi_calculator'
  | 'niche_case_study'
  | 're_engagement';

export type OutreachChannel = 'email' | 'whatsapp' | 'social_dm' | 'cold_call' | 'sms';

export interface SequenceTouchpoint {
  stepNumber: number;
  dayDelay: number;
  channel: OutreachChannel;
  channelEmoji: string;
  title: string;
  subject?: string;
  body: string;
  actionGuidance?: string;
  condition?: string;
  callBattlecard?: {
    opener: string;
    discovery: string;
    objectionHandling: string;
    voicemailScript?: string;
    close: string;
  };
}

export interface ComprehensiveSequence {
  archetype: SequenceArchetype;
  archetypeName: string;
  archetypeEmoji: string;
  description: string;
  businessName: string;
  category: string;
  area: string;
  tone: OutreachTone;
  totalDurationDays: number;
  touchpoints: SequenceTouchpoint[];
  variables: Record<string, string>;
  createdAt: string;
}

export interface ArchetypeMetadata {
  id: SequenceArchetype;
  name: string;
  emoji: string;
  description: string;
  recommendedFor: string;
  cadenceSummary: string;
  touchpointCount: number;
  durationDays: number;
  channels: OutreachChannel[];
}

export type SequenceExportFormat = 'instantly_csv' | 'smartlead_csv' | 'json' | 'markdown';
