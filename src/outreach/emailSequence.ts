import { Business } from '../types/business.js';
import { logger } from '../utils/logger.js';
import { aiAuditor } from '../scoring/aiAuditor.js';

export interface EmailStep {
  stepNumber: number;
  dayDelay: number;
  title: string;
  subject: string;
  body: string;
}

export interface OutreachSequence {
  businessName: string;
  category: string;
  area: string;
  steps: EmailStep[];
  createdAt: string;
}

export class EmailSequenceManager {
  /**
   * Generates a 3-part automated email outreach sequence tailored to the business lead
   */
  public static generateSequence(lead: Business): OutreachSequence {
    const name = lead.name;
    const category = lead.category || 'Local Business';
    const area = lead.area || 'Umhlanga';

    // If drip sequence is already pre-generated in aiPitchScripts, use it
    if (lead.aiPitchScripts?.dripSequence && lead.aiPitchScripts.dripSequence.length >= 3) {
      return {
        businessName: name,
        category,
        area,
        steps: lead.aiPitchScripts.dripSequence.map((step) => ({
          stepNumber: step.stepNumber,
          dayDelay: step.dayDelay,
          title: step.title,
          subject: step.subject,
          body: step.body,
        })),
        createdAt: new Date().toISOString(),
      };
    }

    // Step 1: Initial Technical Audit Pitch (Day 1)
    const step1Subject = lead.aiPitchScripts?.email?.subject || `Optimizing ${name}'s digital lead intake in ${area}`;
    const step1Body =
      lead.aiPitchScripts?.email?.body ||
      `Hi ${name} Team,\n\nI noticed ${name} has built a strong reputation in ${area}.\n\nDuring our local digital growth audit, we identified key conversion bottlenecks on your website that are causing high-intent local clients to bounce to competitors.\n\nCan I show you a 5-minute live preview tailored for ${name} this Thursday?\n\nBest regards,\nLeadGremlin Growth Engine`;

    // Step 2: Quick Follow-Up & Niche Case Study (Day 3)
    const step2Subject = `Re: ${step1Subject}`;
    const step2Body = `Hi ${name} Team,\n\nFollowing up briefly on my note regarding ${name}'s client intake in ${area}.\n\nWe recently helped a nearby ${category} business install an automated 24/7 lead capture and booking funnel, resulting in a 45% increase in high-intent client bookings within 30 days.\n\nWould you be open to taking a look at a 60-second video breakdown showing how this applies to ${name}?\n\nBest regards,\nLeadGremlin Growth Engine`;

    // Step 3: Final Breakup / Complimentary PDF Audit Offer (Day 7)
    const step3Subject = `Complimentary Technical Audit Report for ${name}`;
    const step3Body = `Hi ${name} Management,\n\nI know you're busy serving clients in ${area}, so I won't keep following up.\n\nWe put together a full complimentary Technical Website & Mobile Audit Report for ${name} identifying 4 quick fixes to boost your monthly bookings.\n\nIf you'd like the PDF report, just reply "AUDIT" and I'll send it right over.\n\nWishing ${name} continued success!\n\nBest regards,\nLeadGremlin Growth Engine`;

    return {
      businessName: name,
      category,
      area,
      steps: [
        {
          stepNumber: 1,
          dayDelay: 0,
          title: `Day 1: Technical Audit & Opportunity Pitch`,
          subject: step1Subject,
          body: step1Body,
        },
        {
          stepNumber: 2,
          dayDelay: 3,
          title: `Day 3: Case Study & Niche Proof Follow-Up`,
          subject: step2Subject,
          body: step2Body,
        },
        {
          stepNumber: 3,
          dayDelay: 7,
          title: `Day 7: Final Breakup & Free PDF Audit Offer`,
          subject: step3Subject,
          body: step3Body,
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }
}
