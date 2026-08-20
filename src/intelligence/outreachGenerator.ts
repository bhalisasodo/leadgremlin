import { Business } from '../types/business.js';
import {
  BusinessAuditFundamentals,
  BusinessCase,
  ChannelOutreachMessages,
  DigitalPresenceAudit,
  FollowUpTouchpoint,
  IdentityResolution,
  OpportunityDiagnosis,
  ScoredOutreachAngle,
  SocialCommercialAudit,
} from '../types/intelligence.js';

export class OutreachGenerator {
  /**
   * Generates channel-specific outreach messages and value-driven follow-ups
   */
  public static generateMessages(
    lead: Partial<Business>,
    identity: IdentityResolution,
    fundamentals: BusinessAuditFundamentals,
    digitalAudit: DigitalPresenceAudit,
    socialAudit: SocialCommercialAudit,
    diagnosis: OpportunityDiagnosis,
    businessCase: BusinessCase,
    selectedAngle: ScoredOutreachAngle
  ): {
    messages: ChannelOutreachMessages;
    follow_up_sequence: FollowUpTouchpoint[];
  } {
    const name = identity.canonical_name || lead.name || 'Your team';
    const area = identity.location.suburb || lead.area || 'Umhlanga';
    const category = lead.category || 'Local Business';
    const dmName = identity.decision_maker.name;
    const dmRole = identity.decision_maker.role;
    const funnelStack = lead.funnelTechStack || lead.technicalAudit?.funnelTechStack;
    const linkTool = funnelStack?.linkInBioTool;
    const bookingEngine = funnelStack?.bookingEngine;

    // 1. Determine Contextual Observations
    let specificObservation = '';
    let commercialInsight = '';
    let proposedOpportunity = '';

    if (linkTool && bookingEngine) {
      specificObservation = `I noticed on Instagram that you route interested prospects through ${linkTool} to ${bookingEngine}.`;
      commercialInsight = `While active, routing traffic across multiple external links introduces a 40%+ drop-off barrier before clients complete their bookings, and prevents retargeting on dropped visitors.`;
      proposedOpportunity = `We put together a centralized touchpoint blueprint for ${name} that unifies trial booking, WhatsApp intake, and membership signups on a single domain.`;
    } else if (socialAudit.is_active && !digitalAudit.has_website) {
      if (dmName) {
        specificObservation = `I noticed ${dmName} is actively building an engaged audience on Instagram with regular updates.`;
        commercialInsight = `Right now, most of the conversion journey terminates in manual DMs without an owned destination where prospects can compare packages, view schedules, and book directly.`;
        proposedOpportunity = `There's an opportunity to connect that audience to an owned conversion hub to turn daily attention into structured bookings.`;
      } else {
        specificObservation = `I noticed ${name} is actively generating attention through social media in ${area}.`;
        commercialInsight = `However, client inquiries currently depend on manual direct messaging, which creates response delays for prospects browsing after hours.`;
        proposedOpportunity = `We designed an automated mobile intake funnel tailored for ${name} to capture and qualify those leads 24/7.`;
      }
    } else if (digitalAudit.has_website && !digitalAudit.has_booking) {
      specificObservation = `I came across ${name} while reviewing top ${category} providers around ${area} and loved your ${lead.rating || 4.8}★ reputation.`;
      commercialInsight = `I noticed your site operates primarily as an informational brochure, meaning visitors browsing in the evening cannot book or receive instant automated confirmation.`;
      proposedOpportunity = `We designed a 24/7 intake blueprint for ${name} to capture after-hours inquiries automatically.`;
    } else {
      specificObservation = `I came across ${name} while researching top ${category} businesses in ${area}.`;
      commercialInsight = `While your local reputation is strong, there is no direct digital capture hub capturing local search volume.`;
      proposedOpportunity = `We mapped out a high-converting local storefront and intake engine for ${name}.`;
    }

    // Determine Soft CTA phrasing
    let softCta = `Mind if I share a 60-second video walkthrough showing how this would look for ${name}?`;
    let emailCta = `Would you be open to seeing a 2-minute visual preview of this blueprint tailored for ${name} this Thursday?`;

    if (diagnosis.appropriate_cta === 'Start free trial' || diagnosis.appropriate_cta === 'Book a class') {
      softCta = `Would it be helpful to see a quick 60-second preview of how this streamlines trial bookings for ${name}?`;
      emailCta = `Would you be open to taking a look at a 2-minute mockup showing how this captures more trial bookings for ${name}?`;
    } else if (diagnosis.appropriate_cta === 'Request quote') {
      softCta = `Mind if I send over a quick 60-second preview showing how this speeds up quote intake for ${name}?`;
      emailCta = `Can I share a 2-minute visual breakdown showing how this captures more high-intent quote requests for ${name}?`;
    }

    // Salutation
    const greetingEmail = dmName ? `Hi ${dmName},` : `Hi ${name} Team,`;
    const greetingWa = dmName ? `Hi ${dmName} 👋` : `Hi ${name} Team 👋`;

    // 2. Build WhatsApp Message
    let waMessage = '';
    if (selectedAngle.angle_type === 'brand_opportunity' && dmName) {
      waMessage = `${greetingWa} Came across ${name} while researching top fitness and wellness brands in ${area}.\n\nNoticed you're actively building an engaged audience on Instagram, but inquiries still rely heavily on manual DMs.\n\nWe put together a quick mockup showing how an owned digital hub connecting your personal brand to ${name} could turn that attention into structured bookings.\n\n${softCta}`;
    } else if (linkTool && bookingEngine) {
      waMessage = `${greetingWa} Came across ${name} in ${area} and loved what you've built!\n\nQuick observation: noticed on social that you route members through ${linkTool} to ${bookingEngine}, which typically causes a 40%+ drop-off on mobile.\n\nWe designed a centralized touchpoint that unifies trial booking and WhatsApp intake in one spot.\n\n${softCta}`;
    } else {
      waMessage = `${greetingWa} Came across ${name} while reviewing top ${category} spots in ${area}.\n\n${specificObservation}\n\n${commercialInsight}\n\n${softCta}`;
    }

    // 3. Build Email Message
    const emailSubject = dmName
      ? `Quick idea for ${name} (${area})`
      : `${name}'s client intake & sales workflow in ${area}`;

    const emailBody = `${greetingEmail}\n\nI came across ${name} while researching established ${category} businesses around ${area}.\n\n${specificObservation}\n\n${commercialInsight}\n\n${proposedOpportunity}\n\n${emailCta}\n\nBest regards,\nLeadGremlin Commercial Intelligence`;

    // 4. Build LinkedIn Message
    let linkedinMessage = '';
    if (dmName) {
      linkedinMessage = `Hi ${dmName}, came across your work leading ${name} in ${area}. ${specificObservation} ${commercialInsight} We put together a brief 2-minute blueprint showing how to capture that demand. Would you be open to reviewing the preview?`;
    } else {
      linkedinMessage = `Hi team, came across ${name} in ${area}. ${specificObservation} ${commercialInsight} We mapped out a streamlined intake model for ${name}. Would love to share the 60s preview if you're open to it.`;
    }

    // 5. Build Instagram DM Message
    let igDmMessage = '';
    if (dmName) {
      igDmMessage = `Hey ${dmName}! 👋 Love what you're doing with ${name} in ${area}. Noticed you're driving great attention here on IG, but inquiries mostly run through DMs. We put together a quick mockup showing an owned landing hub for ${name}. Mind if I send the preview link over? 🚀`;
    } else {
      igDmMessage = `Hey ${name} team! 👋 Loved your recent posts. Quick observation: noticed your page could easily capture 30%+ more direct bookings with a centralized mobile hub. Mind if I share a 60s preview link? 🚀`;
    }

    // 6. Build Value-Driven Follow-Up Sequence
    const followUps: FollowUpTouchpoint[] = [
      {
        step_number: 1,
        day_delay: 3,
        type: 'value_observation',
        title: 'Follow-Up 1: Specific Commercial Observation & Insight',
        channel: 'email',
        subject: `Re: ${emailSubject}`,
        message: `${greetingEmail}\n\nFollowing up on my previous note regarding ${name}'s client intake in ${area}.\n\nOne specific observation: over 65% of local ${category} searches happen between 6 PM and 10 PM. When prospects encounter friction or delayed responses, they typically bounce to the next provider.\n\nOur system bridges that gap automatically.\n\nWould you like me to send over the 60-second video breakdown showing how this applies to ${name}?\n\nBest regards,\nLeadGremlin Commercial Intelligence`,
        action_guidance: 'Send as threaded reply to initial email. Keeps tone consultative and low-friction.',
      },
      {
        step_number: 2,
        day_delay: 7,
        type: 'mockup_specific_idea',
        title: 'Follow-Up 2: Interactive Mockup / Visual Demonstration',
        channel: 'whatsapp',
        message: `${greetingWa} Following up briefly on the ${name} intake mockup!\n\nWe prepared a visual schematic showing how ${name} can eliminate the drop-off barrier and confirm bookings in under 30 seconds.\n\nWould you like me to drop the 1-minute preview link right here on WhatsApp? 📄`,
        action_guidance: 'Send directly to business WhatsApp or decision-maker. Attach 1-page visual schematic or video link.',
      },
      {
        step_number: 3,
        day_delay: 12,
        type: 'low_pressure_close',
        title: 'Follow-Up 3: Low-Pressure Clean Slate Close',
        channel: 'email',
        subject: `Complimentary ${category} Intake & Diagnostic Blueprint for ${name}`,
        message: `${greetingEmail}\n\nI know you're focused on running ${name}, so I won't keep following up.\n\nWe compiled our full diagnostic findings and recommended touchpoint structure into a complimentary PDF report for ${name}.\n\nIf you'd like the document, just reply "REPORT" and I'll send it right over with zero obligation.\n\nWishing ${name} continued success in ${area}!\n\nBest regards,\nLeadGremlin Commercial Intelligence`,
        action_guidance: 'Final low-pressure breakup email. Leaves door open with valuable PDF asset.',
      },
    ];

    return {
      messages: {
        whatsapp: {
          message: waMessage,
          style: 'conversational_human',
          length_chars: waMessage.length,
        },
        email: {
          subject: emailSubject,
          body: emailBody,
          style: 'context_rich',
        },
        linkedin: {
          message: linkedinMessage,
          style: 'concise_professional',
        },
        instagram_dm: {
          message: igDmMessage,
          style: 'short_conversational',
        },
      },
      follow_up_sequence: followUps,
    };
  }
}
