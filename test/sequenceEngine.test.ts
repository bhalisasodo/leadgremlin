import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SequenceEngine } from '../src/outreach/sequenceEngine.js';
import { Business } from '../src/types/business.js';
import { SequenceArchetype } from '../src/types/outreach.js';

describe('SequenceEngine', () => {
  const mockLead: Business = {
    id: 'lead-test-1',
    name: 'Coastline Aesthetic Dental',
    category: 'Healthcare & Wellness',
    area: 'Umhlanga',
    phone: '0315559876',
    email: 'info@coastlinedental.co.za',
    website: 'https://coastlinedental.co.za',
    socials: { instagram: 'https://instagram.com/coastlinedental' },
    funnelStage: 'new',
    opportunityScore: 88,
    estimatedDealValue: 24000,
    scrapedAt: new Date().toISOString(),
    source: 'google_maps',
  };

  const archetypes: SequenceArchetype[] = [
    'omni_channel_blitz',
    'audit_breakdown',
    'roi_calculator',
    'niche_case_study',
    're_engagement',
  ];

  it('generates valid touchpoint sequence for all 5 archetypes', () => {
    for (const arch of archetypes) {
      const sequence = SequenceEngine.generateSequence(mockLead, arch);
      assert.equal(sequence.archetype, arch);
      assert.ok(sequence.touchpoints.length >= 3, `Expected at least 3 touchpoints for ${arch}`);
      assert.ok(sequence.archetypeName.length > 0);
      assert.ok(sequence.touchpoints[0].body.includes('Coastline Aesthetic Dental') || sequence.touchpoints[0].body.includes('Umhlanga'));

      // Ensure day delays are sequentially non-decreasing
      for (let i = 1; i < sequence.touchpoints.length; i++) {
        assert.ok(
          sequence.touchpoints[i].dayDelay >= sequence.touchpoints[i - 1].dayDelay,
          `Touchpoint day delays must be ordered in ${arch}`
        );
      }
    }
  });

  it('includes channel-specific metadata and action guidance', () => {
    const sequence = SequenceEngine.generateSequence(mockLead, 'omni_channel_blitz');
    const channels = sequence.touchpoints.map((t) => t.channel);
    assert.ok(channels.includes('email'));
    assert.ok(channels.includes('whatsapp') || channels.includes('cold_call') || channels.includes('social_dm'));

    sequence.touchpoints.forEach((tp) => {
      assert.ok(tp.actionGuidance.length > 0);
      assert.ok(tp.title.length > 0);
    });
  });

  it('generates tailor-made outbound scripts for distinct prospects based on their unique business cases', () => {
    const fitnessLead: Business = {
      id: 'lead-fc',
      name: 'Fitness Cartel',
      category: 'Fitness',
      area: 'Umhlanga',
      phone: '0315619900',
      funnelStage: 'outreach',
      scrapedAt: new Date().toISOString(),
      source: 'pipeline',
      funnelTechStack: {
        linkInBioTool: 'Linktree',
        bookingEngine: 'Octiv (BoxChamp)',
        leadCaptureChannels: ['WhatsApp Direct', 'Instagram DM'],
        currentArchitecture: 'fragmented_external_stack',
      },
      businessCase: {
        headline: 'Centralized Touchpoint & Workflow Blueprint for Fitness Cartel',
        currentWorkflowSummary: 'Instagram Bio ➔ Linktree ➔ Octiv & WhatsApp',
        identifiedGaps: ['Linktree 40% bounce rate', 'Octiv external disconnect'],
        commercialFrictionPoints: ['Loss of Meta Pixel retargeting'],
        proposedCentralizedSolution: 'A single Branded Digital Hub unifying Octiv trial booking and WhatsApp intake.',
        projectedMonthlyRecoveredLeads: '+18 to +32 monthly trial signups',
        estimatedMonthlyRevenueImpactZAR: 33600,
        paybackPeriodDays: 14,
        strategicPitchHook: 'We noticed on Instagram that Fitness Cartel routes members through Linktree to Octiv...',
      },
    };

    const dentalLead: Business = {
      id: 'lead-dental',
      name: 'Dr Naidoo Dental Care',
      category: 'Healthcare & Dental',
      area: 'Durban North',
      phone: '0315632211',
      funnelStage: 'new',
      scrapedAt: new Date().toISOString(),
      source: 'google_maps',
      technicalAudit: {
        hasHttps: true,
        hasBookingSystem: false,
        hasWhatsappLink: false,
        hasResponsiveViewport: true,
      },
    };

    const solarLead: Business = {
      id: 'lead-solar',
      name: 'Apex Solar Energy Solutions',
      category: 'Solar & Trades',
      area: 'Sandton',
      phone: '0112345678',
      funnelStage: 'new',
      scrapedAt: new Date().toISOString(),
      source: 'google_maps',
      technicalAudit: {
        hasHttps: false,
        hasBookingSystem: false,
        hasWhatsappLink: true,
        hasResponsiveViewport: true,
      },
    };

    const seqFitness = SequenceEngine.generateSequence(fitnessLead, 'omni_channel_blitz');
    const seqDental = SequenceEngine.generateSequence(dentalLead, 'omni_channel_blitz');
    const seqSolar = SequenceEngine.generateSequence(solarLead, 'omni_channel_blitz');

    // Fitness Cartel assertions
    assert.ok(seqFitness.touchpoints[0].body.includes('Fitness Cartel'));
    assert.ok(seqFitness.touchpoints[0].body.includes('Linktree') || seqFitness.touchpoints[0].body.includes('Octiv'));

    // Dental assertions
    assert.ok(seqDental.touchpoints[0].body.includes('Dr Naidoo Dental Care'));
    assert.ok(!seqDental.touchpoints[0].body.includes('Fitness Cartel'));
    assert.ok(!seqDental.touchpoints[0].body.includes('Octiv'));
    assert.ok(!seqDental.touchpoints[0].body.includes('Linktree'));
    assert.ok(seqDental.touchpoints[0].body.includes('Patient') || seqDental.touchpoints[0].body.includes('consultation') || seqDental.touchpoints[0].body.includes('Dental'));

    // Solar assertions
    assert.ok(seqSolar.touchpoints[0].body.includes('Apex Solar Energy Solutions'));
    assert.ok(!seqSolar.touchpoints[0].body.includes('Fitness Cartel'));
    assert.ok(!seqSolar.touchpoints[0].body.includes('Dental'));
    assert.ok(seqSolar.touchpoints[0].body.includes('SSL') || seqSolar.touchpoints[0].body.includes('Quote') || seqSolar.touchpoints[0].body.includes('Solar'));
  });
});
