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
});
