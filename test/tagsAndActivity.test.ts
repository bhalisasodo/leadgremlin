import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Business, ActivityLogItem } from '../src/types/business.js';

describe('Custom Tags & Activity Timeline', () => {
  const createSampleLead = (): Business => ({
    id: 'lead_test_tags',
    name: 'Umhlanga Med Spa',
    category: 'Beauty and Hair',
    area: 'Umhlanga',
    phone: '+27 31 561 8899',
    email: 'info@umhlangamedspa.co.za',
    socials: { instagram: 'https://instagram.com/umhlangamedspa' },
    funnelStage: 'new',
    opportunityScore: 82,
    scrapedAt: new Date().toISOString(),
    source: 'pipeline',
    tags: ['VIP'],
    activityLog: [
      {
        id: 'act_1',
        timestamp: new Date().toISOString(),
        type: 'created',
        description: 'Lead discovered & imported into pipeline',
      },
    ],
  });

  it('manages custom tags (adds and removes tags while preventing duplicates)', () => {
    const lead = createSampleLead();

    // Add new tag
    const tagToAdd = 'High Intent';
    if (!lead.tags?.includes(tagToAdd)) {
      lead.tags = lead.tags || [];
      lead.tags.push(tagToAdd);
    }
    assert.deepEqual(lead.tags, ['VIP', 'High Intent']);

    // Prevent duplicate
    if (!lead.tags.includes('VIP')) {
      lead.tags.push('VIP');
    }
    assert.equal(lead.tags.length, 2, 'Should not duplicate existing tag');

    // Remove tag
    lead.tags = lead.tags.filter((t) => t !== 'VIP');
    assert.deepEqual(lead.tags, ['High Intent']);
  });

  it('records chronological activity log events with correct metadata', () => {
    const lead = createSampleLead();

    const stageEvent: ActivityLogItem = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'stage_change',
      description: 'Moved pipeline stage from NEW to OUTREACH',
    };
    lead.activityLog = lead.activityLog || [];
    lead.activityLog.unshift(stageEvent);

    assert.equal(lead.activityLog.length, 2);
    assert.equal(lead.activityLog[0].type, 'stage_change');
    assert.ok(lead.activityLog[0].description.includes('OUTREACH'));
  });

  it('filters leads accurately by assigned custom tag', () => {
    const leads: Business[] = [
      { ...createSampleLead(), id: 'l1', tags: ['VIP', 'Needs SSL'] },
      { ...createSampleLead(), id: 'l2', tags: ['High Intent'] },
      { ...createSampleLead(), id: 'l3', tags: ['Needs SSL'] },
    ];

    const filterByTag = (tag: string) =>
      leads.filter((l) => l.tags && l.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));

    const vipLeads = filterByTag('VIP');
    assert.equal(vipLeads.length, 1);
    assert.equal(vipLeads[0].id, 'l1');

    const sslLeads = filterByTag('Needs SSL');
    assert.equal(sslLeads.length, 2);

    const nonExistent = filterByTag('NonExistent');
    assert.equal(nonExistent.length, 0);
  });
});
