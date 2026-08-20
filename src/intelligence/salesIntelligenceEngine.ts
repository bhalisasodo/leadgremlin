import { Business } from '../types/business.js';
import {
  SalesIntelligenceReport,
  IdentityResolution,
  BusinessAuditFundamentals,
  OpportunityDiagnosis,
  BusinessCase,
} from '../types/intelligence.js';
import { IdentityResolver } from './identityResolver.js';
import { BusinessResearcher } from './businessResearcher.js';
import { DigitalAuditEngine } from './digitalAuditEngine.js';
import { SocialAuditEngine } from './socialAuditEngine.js';
import { FunnelAnalyzer } from './funnelAnalyzer.js';
import { CompetitorAnalyzer } from './competitorAnalyzer.js';
import { OpportunityDiagnoser } from './opportunityDiagnoser.js';
import { BusinessCaseGenerator } from './businessCaseGenerator.js';
import { OutreachStrategist } from './outreachStrategist.js';
import { OutreachGenerator } from './outreachGenerator.js';
import { QualityAssurance } from './qualityAssurance.js';
import { intelligenceCache } from './intelligenceCache.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export interface SalesIntelligenceOptions {
  forceFresh?: boolean;
  llmApiKey?: string;
  additionalContext?: string;
  preferredAngle?: 'growth_opportunity' | 'brand_opportunity' | 'conversion_opportunity';
}

export class SalesIntelligenceEngine {
  /**
   * Runs the complete 10-stage AI Sales Intelligence Pipeline for a prospect
   */
  public async analyzeLead(
    lead: Partial<Business>,
    options: SalesIntelligenceOptions = {}
  ): Promise<SalesIntelligenceReport> {
    const businessId = lead.id || `lead_${crypto.randomBytes(6).toString('hex')}`;

    // 1. Check Cache
    if (!options.forceFresh) {
      const cached = intelligenceCache.get(businessId);
      if (cached) {
        logger.info(`[SalesIntelligence] Cache hit for ${lead.name || businessId}`);
        return cached;
      }
    }

    logger.info(`[SalesIntelligence] Running Full 10-Stage Sales Intelligence Pipeline for: ${lead.name}`);

    // STAGE 1: IDENTITY RESOLUTION
    const identity = IdentityResolver.resolveIdentity(lead, options.additionalContext);

    // STAGE 2: SOURCE-AWARE BUSINESS RESEARCH & FUNDAMENTALS
    const { fundamentals, sources } = BusinessResearcher.research(
      lead,
      lead.technicalAudit,
      options.additionalContext
    );

    // STAGE 3: DIGITAL PRESENCE AUDIT
    const digitalPresence = DigitalAuditEngine.audit(lead, lead.technicalAudit);

    // STAGE 4: SOCIAL / CONTENT COMMERCIAL AUDIT
    const socialAudit = SocialAuditEngine.audit(lead, options.additionalContext);

    // STAGE 5: CUSTOMER JOURNEY & FUNNEL AUDIT
    const funnelAudit = FunnelAnalyzer.analyze(lead, digitalPresence, socialAudit, lead.technicalAudit);

    // STAGE 6: COMPETITIVE CONTEXT & DIFFERENTIATION
    const competitiveContext = CompetitorAnalyzer.analyze(lead);

    // STAGE 7: BUSINESS OPPORTUNITY DIAGNOSIS
    const opportunity = OpportunityDiagnoser.diagnose(
      lead,
      fundamentals,
      digitalPresence,
      socialAudit,
      funnelAudit
    );

    // STAGE 8: BUSINESS CASE & UNIT ECONOMICS
    const businessCase = BusinessCaseGenerator.generate(
      lead,
      fundamentals,
      digitalPresence,
      socialAudit,
      funnelAudit,
      opportunity
    );

    // STAGE 9: 3-ANGLE OUTREACH STRATEGY & ANGLE SCORING
    const strategyPlan = OutreachStrategist.planStrategy(
      lead,
      identity,
      fundamentals,
      digitalPresence,
      socialAudit,
      opportunity,
      businessCase
    );

    // If preferred angle specified, prioritize it
    let selectedAngle = strategyPlan.selected_angle;
    let alternativeAngles = strategyPlan.alternative_angles;
    if (options.preferredAngle) {
      const allAngles = [strategyPlan.selected_angle, ...strategyPlan.alternative_angles];
      const match = allAngles.find((a) => a.angle_type === options.preferredAngle);
      if (match) {
        selectedAngle = match;
        alternativeAngles = allAngles.filter((a) => a.angle_type !== options.preferredAngle);
      }
    }

    // STAGE 10: PERSONALISED OUTREACH & VALUE FOLLOW-UPS
    let { messages, follow_up_sequence } = OutreachGenerator.generateMessages(
      lead,
      identity,
      fundamentals,
      digitalPresence,
      socialAudit,
      opportunity,
      businessCase,
      selectedAngle
    );

    let generatedBy: 'ai_researcher_llm' | 'deterministic_sales_engine' = 'deterministic_sales_engine';

    // Optional LLM Refinement if API key is provided
    const apiKey = options.llmApiKey || (process.env.NODE_ENV !== 'test' && (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY));
    if (apiKey) {
      try {
        const llmMessages = await this.refineWithLlm(
          lead,
          identity,
          fundamentals,
          opportunity,
          businessCase,
          selectedAngle,
          apiKey
        );
        if (llmMessages) {
          messages = llmMessages;
          generatedBy = 'ai_researcher_llm';
        }
      } catch (llmErr) {
        logger.warn(`[SalesIntelligence] LLM refinement skipped, using deterministic sales engine: ${String(llmErr)}`);
      }
    }

    // STAGE 11: QUALITY ASSURANCE & GENERICITY VALIDATION
    const qualityScores = QualityAssurance.validate(
      lead,
      identity,
      opportunity,
      messages,
      sources
    );

    const report: SalesIntelligenceReport = {
      id: `intel_${crypto.randomBytes(6).toString('hex')}`,
      business_id: businessId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identity,
      business_fundamentals: fundamentals,
      digital_presence: digitalPresence,
      social_audit: socialAudit,
      funnel_audit: funnelAudit,
      competitive_context: competitiveContext,
      opportunity,
      business_case: businessCase,
      outreach_strategy: {
        prospect_temperature: strategyPlan.temperature,
        warm_signals: strategyPlan.warm_signals,
        decision_maker_context: strategyPlan.decision_maker_context,
        selected_angle: selectedAngle,
        alternative_angles: alternativeAngles,
        messages,
        follow_up_sequence,
      },
      quality_scores: qualityScores,
      sources,
      generated_by: generatedBy,
    };

    // Cache result
    intelligenceCache.set(report);

    return report;
  }

  /**
   * Refines outreach messages via LLM (Gemini or OpenAI) with strict anti-genericity rules
   */
  private async refineWithLlm(
    lead: Partial<Business>,
    identity: IdentityResolution,
    fundamentals: BusinessAuditFundamentals,
    opportunity: OpportunityDiagnosis,
    businessCase: BusinessCase,
    selectedAngle: import('../types/intelligence.js').ScoredOutreachAngle,
    apiKey: string
  ): Promise<import('../types/intelligence.js').ChannelOutreachMessages | null> {
    const dm = identity.decision_maker.name ? `Decision Maker: ${identity.decision_maker.name} (${identity.decision_maker.role || 'Leader'})` : 'Decision Maker: General Leadership';

    const prompt = `
You are an elite Sales Researcher and B2B Copywriter for LeadGremlin.
Your task is to write highly personalized, human, concise sales outreach messages for a specific business prospect.

CRITICAL RULES:
- NO generic agency templates.
- NO "At LaunchGremlin we build modern websites with one-click WhatsApp".
- NEVER make "one-click WhatsApp" the default solution unless it fits the business model.
- CTA must be soft (ask permission to share a 60s video preview/mockup).
- Structure:
  1. Relevant opening (Why contact THIS business?)
  2. Specific observation (What did we notice from real research?)
  3. Commercial insight (Why does that matter?)
  4. Opportunity (What could be improved?)
  5. Soft CTA (Ask permission to share preview)
- Tone: Founder-to-founder, peer-to-peer, consultative.

PROSPECT DOSSIER:
- Canonical Name: ${identity.canonical_name}
- Location: ${identity.location.suburb}, ${identity.location.city}, South Africa
- Industry: ${lead.category || 'Local Business'}
- ${dm}
- Core Offer: ${fundamentals.core_offer}
- Primary Bottleneck: ${opportunity.primary_bottleneck}
- Recommended Intervention: ${opportunity.intervention_label}
- Selected Strategy Angle: ${selectedAngle.title} (${selectedAngle.core_premise})
- Commercial Mechanism: ${businessCase.commercial_mechanism}

Return ONLY a valid JSON object matching this structure:
{
  "whatsapp": {
    "message": "string (conversational, human, South African business etiquette, under 600 chars)",
    "style": "conversational_human",
    "length_chars": 0
  },
  "email": {
    "subject": "string",
    "body": "string",
    "style": "context_rich"
  },
  "linkedin": {
    "message": "string (concise, professional)",
    "style": "concise_professional"
  },
  "instagram_dm": {
    "message": "string (short, conversational)",
    "style": "short_conversational"
  }
}
`;

    // Try Gemini API
    if (apiKey.startsWith('AIza') || (process.env.GEMINI_API_KEY && apiKey === process.env.GEMINI_API_KEY)) {
      const geminiKey = process.env.GEMINI_API_KEY || apiKey;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.whatsapp && parsed.email) {
            parsed.whatsapp.length_chars = parsed.whatsapp.message?.length || 0;
            return parsed;
          }
        }
      }
    }

    // Try OpenAI API
    if (apiKey.startsWith('sk-') || (process.env.OPENAI_API_KEY && apiKey === process.env.OPENAI_API_KEY)) {
      const openAiKey = process.env.OPENAI_API_KEY || apiKey;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.whatsapp && parsed.email) {
            parsed.whatsapp.length_chars = parsed.whatsapp.message?.length || 0;
            return parsed;
          }
        }
      }
    }

    return null;
  }
}

export const salesIntelligenceEngine = new SalesIntelligenceEngine();
