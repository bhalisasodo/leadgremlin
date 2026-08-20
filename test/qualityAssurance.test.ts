import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { QualityAssurance } from '../src/intelligence/qualityAssurance.js';
import { IdentityResolver } from '../src/intelligence/identityResolver.js';
import { OutreachStrategist } from '../src/intelligence/outreachStrategist.js';
import { IntelligenceCache } from '../src/intelligence/intelligenceCache.js';
import { Business } from '../src/types/business.js';
import { ChannelOutreachMessages, IdentityResolution, OpportunityDiagnosis, ResearchSourceItem } from '../src/types/intelligence.js';

describe('Quality Assurance & Anti-Genericity Engine', () => {
  it('detects and flags generic agency template filler', () => {
    const lead: Partial<Business> = {
      name: 'Test Business',
      area: 'Umhlanga',
      website: 'https://testbusiness.co.za',
    };

    const identity: IdentityResolution = {
      canonical_name: 'Test Business',
      location: { suburb: 'Umhlanga', city: 'Durban' },
      decision_maker: { name: 'John Doe', role: 'Owner', verified: true, source: 'website' },
      is_active: true,
      identity_confidence: 'HIGH',
    };

    const diagnosis: OpportunityDiagnosis = {
      primary_bottleneck: 'No mobile booking',
      secondary_opportunities: [],
      recommended_intervention: 'booking_funnel',
      intervention_label: 'Online Booking Funnel',
      intervention_rationale: 'Capture after-hours appointments',
      appropriate_cta: 'Book consultation',
      confidence: 'HIGH',
      confidence_reason: 'Audit verified',
    };

    // Generic spam message with agency filler
    const genericMessages: ChannelOutreachMessages = {
      whatsapp: {
        message: 'Hi! At LaunchGremlin we build modern websites with one-click WhatsApp integration that help businesses get more customers. Skyrocket your sales with our world-class digital agency!',
        style: 'conversational_human',
        length_chars: 180,
      },
      email: {
        subject: 'We build modern websites',
        body: 'Dear Sir/Madam, hope this finds you well. We build modern websites with one-click WhatsApp to help your business get more customers. At LaunchGremlin we build world-class digital solutions.',
        style: 'context_rich',
      },
      linkedin: { message: 'We build websites.', style: 'concise_professional' },
      instagram_dm: { message: 'Hey! We build websites.', style: 'short_conversational' },
    };

    const sources: ResearchSourceItem[] = [];

    const result = QualityAssurance.validate(lead, identity, diagnosis, genericMessages, sources);

    assert.equal(result.is_ready_to_send, false);
    assert.ok(result.genericity_score >= 50, `Expected high genericity score, got ${result.genericity_score}`);
    assert.ok(result.rejection_reasons.length >= 1);
  });

  it('approves bespoke, evidence-grounded outreach messages', () => {
    const lead: Partial<Business> = {
      name: 'GymBean Fitness',
      area: 'Umhlanga',
      socials: { instagram: 'https://instagram.com/gymbean' },
    };

    const identity: IdentityResolution = {
      canonical_name: 'GymBean Fitness',
      location: { suburb: 'Umhlanga', city: 'Durban' },
      decision_maker: { name: 'Mish Lyle', role: 'Founder & Head Coach', verified: true, source: 'instagram' },
      is_active: true,
      identity_confidence: 'HIGH',
    };

    const diagnosis: OpportunityDiagnosis = {
      primary_bottleneck: 'Inquiries terminate in manual DMs without an owned conversion destination',
      secondary_opportunities: [],
      recommended_intervention: 'landing_page',
      intervention_label: 'Founder-Led Landing Hub',
      intervention_rationale: 'Convert social attention to class trials',
      appropriate_cta: 'Book a class',
      confidence: 'HIGH',
      confidence_reason: 'Audit verified',
    };

    const bespokeMessages: ChannelOutreachMessages = {
      whatsapp: {
        message: 'Hi Mish 👋 Came across GymBean while researching top fitness brands in Umhlanga. Noticed you are actively building an engaged audience on Instagram, but inquiries still rely heavily on manual DMs. We put together a quick mockup showing how an owned digital hub connecting your personal brand to GymBean could turn that attention into structured class bookings. Would it be helpful to see a quick 60-second preview of how this streamlines trial bookings for GymBean?',
        style: 'conversational_human',
        length_chars: 460,
      },
      email: {
        subject: 'Quick idea for GymBean (Umhlanga)',
        body: 'Hi Mish,\n\nI came across GymBean while researching established fitness businesses around Umhlanga.\n\nI noticed Mish is actively building an engaged audience on Instagram with regular updates.\n\nRight now, most of the conversion journey terminates in manual DMs without an owned destination where prospects can compare packages, view schedules, and book directly.\n\nThere is an opportunity to connect that audience to an owned conversion hub to turn daily attention into structured bookings.\n\nWould you be open to taking a look at a 2-minute mockup showing how this captures more trial bookings for GymBean this Thursday?\n\nBest regards,\nLeadGremlin Commercial Intelligence',
        style: 'context_rich',
      },
      linkedin: { message: 'Hi Mish, came across your work leading GymBean in Umhlanga...', style: 'concise_professional' },
      instagram_dm: { message: 'Hey Mish! 👋 Love what you are doing with GymBean in Umhlanga...', style: 'short_conversational' },
    };

    const sources: ResearchSourceItem[] = [
      {
        source_type: 'instagram',
        url: 'https://instagram.com/gymbean',
        title: 'GymBean Instagram',
        claim: 'Active coach-led community',
        epistemic_status: 'FACT',
        confidence: 'HIGH',
        retrieved_at: new Date().toISOString(),
      },
      {
        source_type: 'google',
        url: 'https://maps.google.com',
        title: 'Google Listing',
        claim: '4.9★ rating across 48 reviews in Umhlanga',
        epistemic_status: 'FACT',
        confidence: 'HIGH',
        retrieved_at: new Date().toISOString(),
      },
    ];

    const result = QualityAssurance.validate(lead, identity, diagnosis, bespokeMessages, sources);

    assert.equal(result.is_ready_to_send, true);
    assert.ok(result.genericity_score <= 25, `Expected low genericity score, got ${result.genericity_score}`);
    assert.ok(result.research_specificity_score >= 70);
    assert.ok(result.evidence_score >= 70);
    assert.ok(result.personalisation_score >= 80);
    assert.equal(result.rejection_reasons.length, 0);
  });

  it('correctly operates the intelligence cache', () => {
    const cache = new IntelligenceCache('./data', 7);
    const mockReport: any = {
      id: 'test_intel_123',
      business_id: 'test_lead_abc',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identity: { canonical_name: 'Test Business' },
    };

    cache.set(mockReport);
    const retrieved = cache.get('test_lead_abc');
    assert.ok(retrieved);
    assert.equal(retrieved?.business_id, 'test_lead_abc');
    assert.equal(retrieved?.identity.canonical_name, 'Test Business');

    const forceFresh = cache.get('test_lead_abc', true);
    assert.equal(forceFresh, null);
  });
});
