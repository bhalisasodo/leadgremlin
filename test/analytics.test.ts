import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AnalyticsEngine } from '../src/utils/analytics.js';
import { Business } from '../src/types/business.js';

describe('AnalyticsEngine', () => {
  const sampleLeads: Business[] = [
    {
      id: 'lead_1',
      name: 'Umhlanga Dental Studio',
      category: 'Healthcare & Wellness',
      area: 'Umhlanga',
      phone: '+27 31 561 2233',
      email: 'info@umhlangadental.co.za',
      website: 'https://umhlangadental.co.za',
      funnelStage: 'won',
      opportunityScore: 85,
      estimatedDealValue: 25000,
    },
    {
      id: 'lead_2',
      name: 'Durban North Crossfit',
      category: 'Fitness',
      area: 'Durban North',
      phone: '+27 31 564 1122',
      email: 'join@dbncrossfit.co.za',
      website: 'http://dbncrossfit.co.za',
      funnelStage: 'proposal',
      opportunityScore: 90,
      estimatedDealValue: 20000,
    },
    {
      id: 'lead_3',
      name: 'Sandton Corporate Law',
      category: 'Professional Services',
      area: 'Sandton',
      phone: '+27 11 883 0000',
      email: '',
      website: '',
      funnelStage: 'new',
      opportunityScore: 60,
      estimatedDealValue: 15000,
    },
  ];

  it('calculates total and weighted pipeline values correctly', () => {
    const summary = AnalyticsEngine.calculate(sampleLeads);

    assert.equal(summary.totalLeads, 3);
    assert.equal(summary.totalPipelineValueZAR, 60000);
    assert.equal(summary.weightedPipelineValueZAR, 42500);
    assert.equal(summary.wonRevenueZAR, 25000);
    assert.equal(summary.avgDealValueZAR, 20000);
    assert.equal(summary.winRatePercent, 33);
  });

  it('calculates channel coverage and stage conversion metrics', () => {
    const summary = AnalyticsEngine.calculate(sampleLeads);

    assert.equal(summary.channelCoverage.phonePercent, 100);
    assert.equal(summary.channelCoverage.emailPercent, 67);
    assert.equal(summary.channelCoverage.websitePercent, 67);
    assert.ok(summary.stageMetrics.length > 0);
    assert.ok(summary.topSuburbs.length > 0);
  });
});
