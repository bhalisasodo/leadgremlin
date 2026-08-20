import { Business, FunnelStage } from '../types/business.js';

export interface StageConversionMetric {
  stage: FunnelStage;
  label: string;
  count: number;
  percentageOfTotal: number;
  conversionFromPrevious: number;
}

export interface SuburbPerformance {
  suburb: string;
  count: number;
  avgScore: number;
  totalEstValue: number;
}

export interface AnalyticsSummary {
  totalLeads: number;
  totalPipelineValueZAR: number;
  weightedPipelineValueZAR: number;
  wonRevenueZAR: number;
  avgDealValueZAR: number;
  highOpportunityCount: number; // Score >= 70
  medOpportunityCount: number;  // Score 40 - 69
  lowOpportunityCount: number;  // Score < 40
  winRatePercent: number;
  stageMetrics: StageConversionMetric[];
  channelCoverage: {
    websitePercent: number;
    emailPercent: number;
    phonePercent: number;
    socialPercent: number;
  };
  topSuburbs: SuburbPerformance[];
  categoryBreakdown: Record<string, number>;
}

const STAGE_LABELS: Record<FunnelStage, string> = {
  new: '🆕 New Prospect',
  enriched: '✨ Enriched / Qualified',
  outreach: '📧 Outreach Sent',
  meeting: '📅 Meeting Booked',
  proposal: '📝 Proposal Sent',
  won: '🎉 Closed Won',
  lost: '❌ Closed Lost',
};

const STAGE_PROBABILITIES: Record<FunnelStage, number> = {
  new: 0.10,
  enriched: 0.20,
  outreach: 0.35,
  meeting: 0.60,
  proposal: 0.80,
  won: 1.00,
  lost: 0.00,
};

const STAGE_ORDER: FunnelStage[] = ['new', 'enriched', 'outreach', 'meeting', 'proposal', 'won'];

export class AnalyticsEngine {
  /**
   * Calculates comprehensive sales pipeline analytics and conversion metrics
   */
  public static calculate(leads: Business[]): AnalyticsSummary {
    const total = leads.length;

    let totalPipelineValueZAR = 0;
    let weightedPipelineValueZAR = 0;
    let wonRevenueZAR = 0;
    let highOpp = 0;
    let medOpp = 0;
    let lowOpp = 0;
    let wonCount = 0;

    let webCount = 0;
    let emailCount = 0;
    let phoneCount = 0;
    let socialCount = 0;

    const stageCounts: Record<FunnelStage, number> = {
      new: 0,
      enriched: 0,
      outreach: 0,
      meeting: 0,
      proposal: 0,
      won: 0,
      lost: 0,
    };

    const categoryCounts: Record<string, number> = {};
    const suburbMap = new Map<string, { count: number; totalScore: number; totalValue: number }>();

    leads.forEach((l) => {
      // Funnel stage tracking
      if (stageCounts[l.funnelStage] !== undefined) {
        stageCounts[l.funnelStage]++;
      }
      if (l.funnelStage === 'won') wonCount++;

      // Category breakdown
      categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;

      // Deal Valuation & Opportunity Score Tiers
      const score = l.opportunityScore || 75;
      const dealVal = l.estimatedDealValue || 18500;
      totalPipelineValueZAR += dealVal;

      const prob = STAGE_PROBABILITIES[l.funnelStage] ?? 0.10;
      weightedPipelineValueZAR += Math.round(dealVal * prob);

      if (l.funnelStage === 'won') {
        wonRevenueZAR += dealVal;
      }

      if (score >= 70) highOpp++;
      else if (score >= 40) medOpp++;
      else lowOpp++;

      // Contact Channels Coverage
      if (l.website) webCount++;
      if (l.email) emailCount++;
      if (l.phone) phoneCount++;
      if (l.socials && Object.keys(l.socials).length > 0) socialCount++;

      // Regional Suburb Distribution
      const areaKey = l.area || 'Umhlanga';
      const existingSub = suburbMap.get(areaKey) || { count: 0, totalScore: 0, totalValue: 0 };
      existingSub.count++;
      existingSub.totalScore += score;
      existingSub.totalValue += dealVal;
      suburbMap.set(areaKey, existingSub);
    });

    // Stage Conversion Funnel Flow
    let previousCount = total || 1;
    const stageMetrics: StageConversionMetric[] = STAGE_ORDER.map((stage) => {
      const count = stageCounts[stage] || 0;
      const percentageOfTotal = total ? Math.round((count / total) * 100) : 0;
      const conversionFromPrevious = Math.round((count / previousCount) * 100);
      if (count > 0) previousCount = count;

      return {
        stage,
        label: STAGE_LABELS[stage] || stage,
        count,
        percentageOfTotal,
        conversionFromPrevious: isNaN(conversionFromPrevious) ? 0 : conversionFromPrevious,
      };
    });

    // Top Suburbs Leaderboard
    const topSuburbs: SuburbPerformance[] = Array.from(suburbMap.entries())
      .map(([suburb, data]) => ({
        suburb,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
        totalEstValue: data.totalValue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const winRatePercent = total ? Math.round((wonCount / total) * 100) : 0;
    const avgDealValueZAR = total ? Math.round(totalPipelineValueZAR / total) : 18500;

    return {
      totalLeads: total,
      totalPipelineValueZAR,
      weightedPipelineValueZAR,
      wonRevenueZAR,
      avgDealValueZAR,
      highOpportunityCount: highOpp,
      medOpportunityCount: medOpp,
      lowOpportunityCount: lowOpp,
      winRatePercent,
      stageMetrics,
      channelCoverage: {
        websitePercent: total ? Math.round((webCount / total) * 100) : 0,
        emailPercent: total ? Math.round((emailCount / total) * 100) : 0,
        phonePercent: total ? Math.round((phoneCount / total) * 100) : 0,
        socialPercent: total ? Math.round((socialCount / total) * 100) : 0,
      },
      topSuburbs,
      categoryBreakdown: categoryCounts,
    };
  }
}
