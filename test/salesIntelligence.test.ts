import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { salesIntelligenceEngine } from '../src/intelligence/salesIntelligenceEngine.js';
import { IdentityResolver } from '../src/intelligence/identityResolver.js';
import { DigitalAuditEngine } from '../src/intelligence/digitalAuditEngine.js';
import { SocialAuditEngine } from '../src/intelligence/socialAuditEngine.js';
import { FunnelAnalyzer } from '../src/intelligence/funnelAnalyzer.js';
import { CompetitorAnalyzer } from '../src/intelligence/competitorAnalyzer.js';
import { OpportunityDiagnoser } from '../src/intelligence/opportunityDiagnoser.js';
import { BusinessCaseGenerator } from '../src/intelligence/businessCaseGenerator.js';
import { OutreachStrategist } from '../src/intelligence/outreachStrategist.js';
import { OutreachGenerator } from '../src/intelligence/outreachGenerator.js';
import { QualityAssurance } from '../src/intelligence/qualityAssurance.js';
import { intelligenceCache } from '../src/intelligence/intelligenceCache.js';
import { Business } from '../src/types/business.js';

describe('AI Sales Intelligence Engine - Core Pipeline & Benchmark Cases', () => {
  // BENCHMARK 1: GymBean Fitness (Mish Lyle, Umhlanga)
  it('analyzes GymBean Fitness correctly (Founder-led, active IG, no website, Angle B Brand / Angle A Growth)', async () => {
    const gymBeanLead: Partial<Business> = {
      id: 'gymbean_test_1',
      name: 'GymBean Fitness',
      category: 'Fitness & Health',
      area: 'Umhlanga',
      rating: 4.9,
      reviewCount: 48,
      socials: {
        instagram: 'https://instagram.com/gymbean_fitness',
      },
      notes: 'Coach Mish Lyle leading daily workouts and personal training in Umhlanga.',
    };

    const report = await salesIntelligenceEngine.analyzeLead(gymBeanLead, { forceFresh: true });

    // Identity Resolution
    assert.equal(report.identity.canonical_name, 'GymBean Fitness');
    assert.equal(report.identity.decision_maker.name, 'Mish Lyle');
    assert.equal(report.identity.decision_maker.verified, true);
    assert.equal(report.identity.location.suburb, 'Umhlanga');

    // Digital & Social Audit
    assert.equal(report.digital_presence.has_website, false);
    assert.equal(report.social_audit.is_active, true);
    assert.equal(report.social_audit.destination_quality, 'dm_dead_end');
    assert.equal(report.social_audit.has_founder_led_content, true);

    // Funnel & Opportunity Diagnosis
    assert.ok(report.opportunity.primary_bottleneck.length > 20);
    assert.equal(report.opportunity.appropriate_cta, 'Book a class');

    // 3 Angles Generated & Scored
    assert.ok(report.outreach_strategy.selected_angle);
    assert.equal(report.outreach_strategy.alternative_angles.length, 2);
    assert.ok(report.outreach_strategy.selected_angle.scores.overall_score >= 80);

    // Anti-genericity & Quality Validation
    assert.ok(report.quality_scores.genericity_score <= 25, `Genericity score was ${report.quality_scores.genericity_score}, expected <= 25`);
    assert.ok(report.quality_scores.research_specificity_score >= 70);
    assert.ok(report.quality_scores.personalisation_score >= 80);
    assert.equal(report.quality_scores.is_ready_to_send, true);

    // Multi-channel messages & 3-step value follow-ups
    const msgs = report.outreach_strategy.messages;
    assert.ok(msgs.whatsapp.message.includes('Mish') || msgs.whatsapp.message.includes('GymBean'));
    assert.ok(msgs.whatsapp.message.length < 600);
    assert.ok(!msgs.whatsapp.message.toLowerCase().includes('we build modern websites with one-click whatsapp'));
    assert.equal(report.outreach_strategy.follow_up_sequence.length, 3);
  });

  // BENCHMARK 2: Fitness Cartel Umhlanga (Linktree + Octiv)
  it('analyzes Fitness Cartel correctly (Linktree + Octiv friction, Angle C Conversion)', async () => {
    const fitnessCartelLead: Partial<Business> = {
      id: 'cartel_test_1',
      name: 'Fitness Cartel Umhlanga',
      category: 'CrossFit & Gym',
      area: 'Umhlanga Rocks',
      rating: 4.8,
      reviewCount: 92,
      website: 'https://linktr.ee/fitnesscartel',
      funnelTechStack: {
        linkInBioTool: 'Linktree',
        bookingEngine: 'Octiv (BoxChamp)',
        leadCaptureChannels: ['Instagram DM', 'WhatsApp Direct'],
        analyticsRetargeting: [],
        currentArchitecture: 'fragmented_external_stack',
      },
      socials: {
        instagram: 'https://instagram.com/fitnesscartelumhlanga',
      },
    };

    const report = await salesIntelligenceEngine.analyzeLead(fitnessCartelLead, { forceFresh: true });

    // Social Audit & Friction
    assert.equal(report.social_audit.link_in_bio_strategy, 'generic_multi_link');
    assert.equal(report.social_audit.destination_quality, 'friction_heavy_redirect');

    // Diagnosis & Recommendation
    assert.equal(report.opportunity.recommended_intervention, 'link_in_bio_replacement');
    assert.ok(report.opportunity.primary_bottleneck.includes('Linktree') || report.opportunity.primary_bottleneck.includes('Octiv'));

    // Outreach Strategy
    assert.ok(report.outreach_strategy.messages.whatsapp.message.includes('Linktree') || report.outreach_strategy.messages.whatsapp.message.includes('Octiv'));
    assert.ok(report.quality_scores.genericity_score <= 25);
  });

  // BENCHMARK 3: Auto Paradise Umhlanga (Trade / Panel Beater)
  it('analyzes Auto Paradise correctly (Quote intake, local search demand, Request quote CTA)', async () => {
    const autoLead: Partial<Business> = {
      id: 'auto_test_1',
      name: 'Auto Paradise Panel & Paint',
      category: 'Auto Repair & Service',
      area: 'Umhlanga Ridge',
      rating: 4.7,
      reviewCount: 38,
      phone: '+27 31 566 2200',
    };

    const report = await salesIntelligenceEngine.analyzeLead(autoLead, { forceFresh: true });

    assert.equal(report.business_fundamentals.ticket_size, 'medium_ticket');
    assert.equal(report.opportunity.appropriate_cta, 'Request quote');
    assert.equal(report.digital_presence.has_website, false);
    assert.ok(report.outreach_strategy.messages.email.body.includes('Auto Paradise'));
  });

  // BENCHMARK 4: VICHY Spa / Aesthetic Clinic
  it('analyzes Aesthetic Clinic correctly (High-ticket consultations, after-hours booking)', async () => {
    const spaLead: Partial<Business> = {
      id: 'spa_test_1',
      name: 'VICHY Medi-Spa & Aesthetics',
      category: 'Aesthetic Clinic & Medical Spa',
      area: 'Umhlanga',
      rating: 4.9,
      reviewCount: 64,
      website: 'https://vichymedispa.co.za',
      socials: {
        instagram: 'https://instagram.com/vichymedispa',
      },
    };

    const report = await salesIntelligenceEngine.analyzeLead(spaLead, { forceFresh: true });

    assert.equal(report.business_fundamentals.ticket_size, 'high_ticket');
    assert.equal(report.business_fundamentals.fulfillment_model, 'appointment_driven');
    assert.ok(report.opportunity.appropriate_cta === 'Schedule appointment' || report.opportunity.appropriate_cta === 'Book consultation');
  });

  // BENCHMARK 5: P. Crouch & Co. (B2B Legal & Accounting)
  it('analyzes Professional Services correctly (B2B model, consultation booking)', async () => {
    const legalLead: Partial<Business> = {
      id: 'crouch_test_1',
      name: 'P. Crouch & Co. Attorneys',
      category: 'Legal Services & Corporate Advisory',
      area: 'Durban North',
      rating: 4.9,
      reviewCount: 22,
      website: 'https://crouchattorneys.co.za',
    };

    const report = await salesIntelligenceEngine.analyzeLead(legalLead, { forceFresh: true });

    assert.equal(report.business_fundamentals.market_model, 'B2B');
    assert.equal(report.business_fundamentals.revenue_model, 'hybrid');
    assert.ok(report.opportunity.appropriate_cta === 'Book consultation' || report.opportunity.appropriate_cta === 'Request quote' || report.opportunity.appropriate_cta === 'Permission to share preview');
  });

  // BENCHMARK 6: The Body Sculpting Studio
  it('analyzes Body Sculpting Studio correctly (Visual proof, appointment scheduling)', async () => {
    const bodyLead: Partial<Business> = {
      id: 'bodysculpt_test_1',
      name: 'The Body Sculpting Studio',
      category: 'Aesthetics & Body Contouring',
      area: 'Umhlanga Arch',
      rating: 4.8,
      reviewCount: 52,
      socials: {
        instagram: 'https://instagram.com/bodysculpting_umhlanga',
      },
    };

    const report = await salesIntelligenceEngine.analyzeLead(bodyLead, { forceFresh: true });

    assert.ok(report.business_fundamentals.strengths.length >= 2);
    assert.ok(report.sources.length >= 2);
    assert.equal(report.quality_scores.is_ready_to_send, true);
  });
});
