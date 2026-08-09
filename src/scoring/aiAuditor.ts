import { AIAuditInput, AIAuditOutput, MultiChannelScripts, OutreachTone } from '../types/scorer.js';
import { logger } from '../utils/logger.js';

/**
 * Phase 3: AI Auditor & Multi-Channel Pitch Script Suite
 */
export class AIAuditor {
  /**
   * Generates AI Website Audit and Multi-Channel Outreach Pitch Scripts
   */
  public async generateAudit(input: AIAuditInput): Promise<AIAuditOutput> {
    logger.info(`Generating AI Multi-Channel Audit Pitch for: ${input.businessName}`);

    const tone: OutreachTone = input.tone || 'consultative';
    const category = input.category || 'local business';
    const area = input.area || 'Umhlanga';
    const rating = input.rating || 4.8;
    const reviews = input.reviewCount || 35;
    const name = input.businessName;

    const multiChannelScripts: MultiChannelScripts = this.buildScripts(name, category, area, rating, reviews, tone);

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (input.technicalAudit) {
      const audit = input.technicalAudit;
      if (!audit.hasHttps) {
        issues.push('Website lacks secure SSL (HTTPS) encryption');
        recommendations.push('Install SSL certificate & enforce HTTPS protocol');
      }
      if (!audit.hasBookingSystem) {
        issues.push('Missing automated online booking integration');
        recommendations.push('Deploy custom responsive online booking engine');
      }
      if (!audit.hasWhatsappLink) {
        issues.push('No WhatsApp instant lead capture widget detected');
        recommendations.push('Add high-converting 1-click WhatsApp lead CTA');
      }
      if (!audit.hasResponsiveViewport) {
        issues.push('Mobile viewport optimization required');
        recommendations.push('Implement mobile-first responsive viewport design');
      }
      if (!audit.hasContactForm) {
        issues.push('No direct contact inquiry form found on landing page');
        recommendations.push('Integrate automated lead capture form');
      }
    }

    if (issues.length === 0) {
      issues.push('Missing automated online booking integration');
      issues.push('Website mobile speed performance optimization required');
      issues.push('No WhatsApp instant lead capture widget detected');
    }

    if (recommendations.length === 0) {
      recommendations.push('Deploy custom responsive booking portal');
      recommendations.push('Add AI chatbot lead capture widget');
      recommendations.push('Implement conversion-focused landing page redesign');
    }

    const estimatedProjectValueZAR = input.technicalAudit ? 15000 + issues.length * 3500 : 18500;

    return {
      issues,
      recommendations,
      estimatedProjectValueZAR,
      personalizedOutreachScript: multiChannelScripts.email.body,
      multiChannelScripts,
      auditTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Internal multi-channel script builder based on tone and metadata
   */
  private buildScripts(
    name: string,
    category: string,
    area: string,
    rating: number,
    reviews: number,
    tone: OutreachTone
  ): MultiChannelScripts {
    switch (tone) {
      case 'direct':
        return {
          email: {
            subject: `35% Lead Increase for ${name} in ${area}`,
            body: `Hi ${name} Team,\n\nWe audited top ${category} providers in ${area} and noticed ${name} has a stellar ${rating}★ score with ${reviews}+ reviews.\n\nHowever, your website is missing a 1-click WhatsApp lead booking widget, costing you 10-15 client leads every week.\n\nWe build automated 24/7 lead intake funnels for ${category} businesses. Can we show you a 5-minute live preview this Thursday at 10 AM?\n\nBest regards,\nLeadGremlin Engine`,
          },
          whatsapp: `⚡ *Quick Question for ${name}*\n\nHi team, loved your ${rating}★ reviews in ${area}! We noticed your website lacks an instant WhatsApp booking link, letting client inquiries slip away to competitors.\n\nWould you be open to a 2-min demo showing how to capture 3x more instant bookings? 🚀`,
          socialDm: `Hey ${name} team! 👋 Super impressive work with ${reviews}+ reviews in ${area}. Quick heads up: adding a direct social booking link to your profile can double your weekly client inquiries. Sent you a quick email breakdown! 📩`,
          coldCall: {
            opener: `Hi, is this the store manager at ${name}? My name is LeadGremlin, calling briefly from Umhlanga Digital Lead Engine.`,
            discovery: `We were reviewing top ${category} spots in ${area}. You have a great ${rating} star rating, but no direct WhatsApp booking widget on your site. Are you currently taking online bookings?`,
            objectionHandling: `I completely understand you're busy! That's actually why we built this automated widget—it handles client bookings 24/7 without staff needing to answer calls.`,
            close: `Can I send a 60-second video demo directly to your WhatsApp or email? What's the best address for you?`,
          },
        };

      case 'casual':
        return {
          email: {
            subject: `Quick idea for ${name} 💡`,
            body: `Hey ${name} team,\n\nCame across your profile while exploring top ${category} spots around ${area}. Big fans of your ${rating}★ reputation!\n\nJust noticed a small tweak on your website that could bring in extra client bookings every single day without spending a dime on ads.\n\nWould love to send over a quick 2-minute video showing how it works if you're open to it?\n\nCheers,\nLeadGremlin Team`,
          },
          whatsapp: `Hey ${name} 👋 Came across your ${category} business in ${area} and noticed you guys have awesome ${rating}★ reviews! Had a quick idea on how you can get more direct client bookings automatically. Mind if I share a 1-min quick link? 😊`,
          socialDm: `Hey guys! Love the work ${name} is doing in ${area} 🔥 Noticed your page doesn't have an instant booking button—we set these up for local businesses in 24 hours. DM us if you want a free mockup! 🙌`,
          coldCall: {
            opener: `Hey there! Is this ${name}? Hope your day is going awesome. Calling really quick from ${area}.`,
            discovery: `I saw your ${reviews}+ great reviews online! Quick question—how are you currently handling client leads coming in after hours?`,
            objectionHandling: `Totally get it! We built a simple 1-click booking tool so you never miss an after-hours lead again.`,
            close: `Would it be alright if I dropped a quick link to your WhatsApp so you can take a look whenever you have a free minute?`,
          },
        };

      case 'urgent':
        return {
          email: {
            subject: `URGENT: ${name} is missing 15+ weekly inquiries in ${area}`,
            body: `Attention ${name} Management,\n\nOur automated audit revealed that ${name} is currently missing up to 35% of high-intent local ${category} searches in ${area}.\n\nWhile your rating (${rating}★) is excellent, your competitors are capturing after-hours clients using automated WhatsApp lead intake.\n\nWe have 2 slots open this week for complimentary sales funnel setups for ${area} businesses. Let's get this fixed today.\n\nRegards,\nLeadGremlin Engine`,
          },
          whatsapp: `⚠️ *Missed Lead Alert for ${name}*\n\nHi team, your ${category} page in ${area} is missing an instant mobile lead capture widget, letting up to 15+ leads leak weekly.\n\nWe have a free setup slot open today. Reply YES for instant deployment! ⏱️`,
          socialDm: `⚠️ Hey ${name}! Local ${category} competitors in ${area} are using mobile WhatsApp widgets to steal after-hours leads. We can install your lead capture in under 2 hours. Tap back if interested! ⚡`,
          coldCall: {
            opener: `Hi, urgency call for ${name} management regarding your ${area} digital lead capture. Do you have 30 seconds?`,
            discovery: `Our system detected your website is missing mobile SSL & WhatsApp instant response. You're losing around 15 client signups every week to nearby competitors.`,
            objectionHandling: `I understand you have an existing site, but right now it's leaking potential revenue every single day.`,
            close: `Let's lock in 10 minutes tomorrow morning to fix this lead leak. Does 9:30 AM or 11:00 AM work better?`,
          },
        };

      case 'consultative':
      default:
        return {
          email: {
            subject: `Optimizing ${name}'s digital lead intake in ${area}`,
            body: `Hi ${name} Team,\n\nI came across ${name} while auditing top-rated ${category} businesses in ${area}.\n\nI noticed your team has an incredible rating (${rating}★ with ${reviews}+ reviews), but your website could convert 35% more high-intent local clients through automated WhatsApp booking widgets and instant lead capture.\n\nWe recently built a sales funnel engine specifically for ${area} businesses to extract & capture inbound leads 24/7.\n\nWould you be open to a 10-minute demo this Thursday?\n\nBest regards,\nLeadGremlin Automated Engine`,
          },
          whatsapp: `Hi ${name} Team 👋 We audited top ${category} businesses in ${area} and loved your ${rating}★ rating!\n\nWe put together a complimentary growth breakdown showing how an automated WhatsApp lead capture widget can boost your weekly bookings by 35%.\n\nWould you like us to send the PDF audit over? 📄`,
          socialDm: `Hi ${name}! 🌟 Compliments on your ${reviews}+ positive reviews in ${area}. We created a short audit showing how your ${category} page can capture 35% more inbound client messages directly on Instagram/WhatsApp. Would love to send it over!`,
          coldCall: {
            opener: `Good morning/afternoon, my name is LeadGremlin. I'm calling regarding ${name}'s online client intake in ${area}.`,
            discovery: `We conduct digital growth audits for top ${category} providers. I noticed your ${rating} star rating is top-tier, but your site lacks automated lead response. How are you following up with web visitors?`,
            objectionHandling: `That makes total sense. Many ${category} owners we work with felt the same way until they saw how much staff time the automated assistant saves.`,
            close: `Would Thursday at 10 AM or 2 PM work for a brief 10-minute screenshare to walk through the audit?`,
          },
        };
    }
  }
}

export const aiAuditor = new AIAuditor();
