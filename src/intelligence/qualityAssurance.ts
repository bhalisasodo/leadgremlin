import { Business } from '../types/business.js';
import {
  ChannelOutreachMessages,
  IdentityResolution,
  OpportunityDiagnosis,
  QualityValidationScores,
  ResearchSourceItem,
} from '../types/intelligence.js';

export class QualityAssurance {
  /**
   * Evaluates generated sales intelligence and outreach messages against strict quality and anti-genericity rules
   */
  public static validate(
    lead: Partial<Business>,
    identity: IdentityResolution,
    diagnosis: OpportunityDiagnosis,
    messages: ChannelOutreachMessages,
    sources: ResearchSourceItem[]
  ): QualityValidationScores {
    const rejectionReasons: string[] = [];
    const warnings: string[] = [];

    const emailBody = messages.email.body.toLowerCase();
    const waText = messages.whatsapp.message.toLowerCase();
    const allText = `${emailBody} ${waText}`;

    // 1. Generic Filler / Agency Template Detection
    const genericPhrases = [
      'one-click whatsapp integration that help businesses get more customers',
      'we build modern websites with one-click whatsapp',
      'help your business get more customers',
      'take your business to the next level',
      'skyrocket your sales',
      'world-class digital agency',
      'i build websites',
      'at launchgremlin we build',
      'we are a leading agency',
    ];

    let genericityHits = 0;
    for (const phrase of genericPhrases) {
      if (allText.includes(phrase)) {
        genericityHits++;
        rejectionReasons.push(`Contains generic agency filler: "${phrase}"`);
      }
    }

    // 2. Unsupported Claims / Hallucination Checks
    if (!identity.decision_maker.verified && identity.decision_maker.name) {
      // If decision maker is unverified, check if message uses it assertively
      if (allText.includes(identity.decision_maker.name.toLowerCase())) {
        warnings.push(`Mentions decision maker (${identity.decision_maker.name}) who has MEDIUM/LOW verification.`);
      }
    }

    if (!lead.website && (emailBody.includes('your current website') || emailBody.includes('on your website'))) {
      rejectionReasons.push('References an existing website when none was verified.');
    }

    if (!lead.phone && !lead.technicalAudit?.hasWhatsappLink && waText.includes('on whatsapp')) {
      warnings.push('Mentions WhatsApp without direct verified phone number.');
    }

    // 3. Length Checks
    if (messages.whatsapp.message.length > 750) {
      warnings.push(`WhatsApp message length (${messages.whatsapp.message.length} chars) is slightly long for mobile.`);
    }

    // 4. Specificity & Evidence Checks
    const name = (identity.canonical_name || lead.name || '').toLowerCase();
    const area = (identity.location.suburb || lead.area || '').toLowerCase();

    let hasSpecificReference = false;
    if (name && (emailBody.includes(name) || waText.includes(name))) {
      hasSpecificReference = true;
    }
    if (area && (emailBody.includes(area) || waText.includes(area))) {
      hasSpecificReference = true;
    }

    if (!hasSpecificReference) {
      rejectionReasons.push('Message does not reference the business name or geographic area.');
    }

    // 5. Calculate Scores (0-100)
    // Genericity Score (0 = completely bespoke, 100 = boilerplate template)
    let genericityScore = 10;
    genericityScore += genericityHits * 35;
    if (!identity.decision_maker.name) genericityScore += 5;
    if (allText.includes('dear ')) genericityScore += 15;
    if (allText.includes('hope this finds you well')) genericityScore += 15;
    genericityScore = Math.min(100, Math.max(0, genericityScore));

    // Research Specificity Score
    let researchSpecificity = 60;
    if (sources.length >= 2) researchSpecificity += 15;
    if (sources.length >= 4) researchSpecificity += 10;
    if (identity.identity_confidence === 'HIGH') researchSpecificity += 10;
    if (identity.decision_maker.verified) researchSpecificity += 10;
    if (lead.technicalAudit) researchSpecificity += 10;
    researchSpecificity = Math.min(100, Math.max(0, researchSpecificity));

    // Evidence Score
    let evidenceScore = 55;
    const factSources = sources.filter((s) => s.epistemic_status === 'FACT');
    evidenceScore += factSources.length * 12;
    if (lead.rating && lead.reviewCount) evidenceScore += 10;
    if (lead.website) evidenceScore += 10;
    evidenceScore = Math.min(100, Math.max(0, evidenceScore));

    // Commercial Relevance Score
    let commercialRelevance = 80;
    if (diagnosis.primary_bottleneck) commercialRelevance += 10;
    if (diagnosis.appropriate_cta !== 'Permission to share preview') commercialRelevance += 5;
    commercialRelevance = Math.min(100, Math.max(0, commercialRelevance));

    // Personalisation Score
    let personalisation = 65;
    if (identity.decision_maker.name) personalisation += 20;
    if (identity.location.suburb) personalisation += 10;
    if (lead.socials?.instagram) personalisation += 10;
    personalisation = Math.min(100, Math.max(0, personalisation));

    const isReadyToSend = rejectionReasons.length === 0 && genericityScore <= 35 && researchSpecificity >= 60;

    return {
      genericity_score: genericityScore,
      research_specificity_score: researchSpecificity,
      evidence_score: evidenceScore,
      commercial_relevance_score: commercialRelevance,
      personalisation_score: personalisation,
      is_ready_to_send: isReadyToSend,
      rejection_reasons: rejectionReasons,
      warnings,
    };
  }
}
