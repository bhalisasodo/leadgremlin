import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Deduplicator } from '../src/utils/deduplication.js';
import { Business } from '../src/types/business.js';

describe('Deduplicator', () => {
  it('normalizes business names correctly', () => {
    const dedup = new Deduplicator();
    assert.equal(dedup.normalizeName('Better Bodies Gym (Pty) Ltd'), 'betterbodies');
    assert.equal(dedup.normalizeName('CrossFit Umhlanga & Fitness Centre'), 'crossfitumhlanga');
    assert.equal(dedup.normalizeName('Prime Dental Studio LLC'), 'primedentalstudio');
  });

  it('normalizes South African and international phone numbers', () => {
    const dedup = new Deduplicator();
    assert.equal(dedup.normalizePhone('+27 (031) 555-1234'), '0315551234');
    assert.equal(dedup.normalizePhone('082 123 4567'), '0821234567');
    assert.equal(dedup.normalizePhone('+27821234567'), '0821234567');
  });

  it('normalizes website URLs', () => {
    const dedup = new Deduplicator();
    assert.equal(dedup.normalizeWebsite('https://www.betterbodies.co.za/'), 'betterbodies.co.za');
    assert.equal(dedup.normalizeWebsite('http://prime-gym.com?ref=123'), 'prime-gym.com');
    assert.equal(dedup.normalizeWebsite('www.dentist-umhlanga.co.za/services'), 'dentist-umhlanga.co.za');
  });

  it('identifies duplicate leads by phone, website, and name', () => {
    const dedup = new Deduplicator();

    const lead1: Business = {
      id: 'lead-1',
      name: 'Umhlanga Fitness Club',
      category: 'Fitness',
      area: 'Umhlanga',
      phone: '031 555 1234',
      website: 'https://umhlangafitness.co.za',
      socials: {},
      funnelStage: 'new',
      opportunityScore: 80,
      scrapedAt: new Date().toISOString(),
      source: 'google_maps',
    };

    const firstCheck = dedup.isDuplicate(lead1);
    assert.equal(firstCheck.isDup, false);

    dedup.register(lead1);

    // Duplicate website
    const lead2: Business = {
      ...lead1,
      id: 'lead-2',
      name: 'Different Name',
      phone: '031 999 9999',
      website: 'http://www.umhlangafitness.co.za/contact',
    };
    const dupCheckWeb = dedup.isDuplicate(lead2);
    assert.equal(dupCheckWeb.isDup, true);
    assert.match(dupCheckWeb.reason || '', /website/i);

    // Duplicate phone
    const lead3: Business = {
      ...lead1,
      id: 'lead-3',
      name: 'Another Name',
      website: 'https://other-site.co.za',
      phone: '+27 31 555 1234',
    };
    const dupCheckPhone = dedup.isDuplicate(lead3);
    assert.equal(dupCheckPhone.isDup, true);
    assert.match(dupCheckPhone.reason || '', /phone/i);
  });
});
