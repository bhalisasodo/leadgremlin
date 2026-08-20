import {
  AIAuditInput,
  AIAuditOutput,
  MultiChannelScripts,
  OutreachTone,
  TechnicalAudit,
  EmailStepScript,
  FunnelTechStack,
  TailoredBusinessCase,
} from '../types/scorer.js';
import { logger } from '../utils/logger.js';
import { salesIntelligenceEngine } from '../intelligence/salesIntelligenceEngine.js';

interface NicheStrategy {
  headline: string;
  painPoint: string;
  solution: string;
  caseMetric: string;
  callDiscovery: string;
  callObjection: string;
}

/**
 * Phase 3 & 5: AI Auditor & Hyper-Personalized Multi-Channel Pitch Script Suite & Business Case Builder
 */
export class AIAuditor {
  /**
   * Generates AI Website Audit, Sales Funnel Diagnostic, Business Case, Multi-Channel Outreach Pitch Scripts, and Full Sales Intelligence
   */
  public async generateAudit(input: AIAuditInput): Promise<AIAuditOutput> {
    logger.info(`Generating AI Multi-Channel Audit & Business Case Pitch for: ${input.businessName}`);

    const tone: OutreachTone = input.tone || 'consultative';
    const category = input.category || 'Local Business';
    const area = input.area || 'Umhlanga';
    const rating = input.rating || 4.8;
    const reviews = input.reviewCount || 35;
    const name = input.businessName;
    const website = input.websiteUrl || '';

    // 1. Analyze Technical Audit Findings
    const { issues, recommendations, auditGaps, primaryGap, estimatedProjectValueZAR } = this.analyzeTechnicalGaps(
      input.technicalAudit,
      website
    );

    // 2. Extract / Derive Funnel Tech Stack
    const funnelTechStack: FunnelTechStack = input.technicalAudit?.funnelTechStack || {
      linkInBioTool: undefined,
      bookingEngine: input.technicalAudit?.hasBookingSystem ? 'Custom' : undefined,
      leadCaptureChannels: input.technicalAudit?.hasWhatsappLink
        ? ['WhatsApp Direct', 'Contact Form']
        : ['Contact Form'],
      paymentGateway: undefined,
      analyticsRetargeting: input.technicalAudit?.analyticsDetected || [],
      currentArchitecture:
        input.technicalAudit?.hasBookingSystem && input.technicalAudit?.hasWhatsappLink
          ? 'unified_optimized_hub'
          : 'manual_friction_heavy',
    };

    // 3. Build Tailored Commercial Business Case
    const businessCase: TailoredBusinessCase = this.generateBusinessCase(
      name,
      category,
      area,
      website,
      input.technicalAudit?.socialLinks,
      funnelTechStack,
      input.technicalAudit,
      estimatedProjectValueZAR
    );

    // 4. Run Full Sales Intelligence Pipeline
    let salesIntelligence;
    try {
      salesIntelligence = await salesIntelligenceEngine.analyzeLead(
        {
          name,
          category: category as any,
          area,
          rating,
          reviewCount: reviews,
          website,
          technicalAudit: input.technicalAudit,
          funnelTechStack,
          businessCase,
        },
        {
          llmApiKey: input.llmApiKey,
          additionalContext: input.customPrompt,
        }
      );
    } catch (intelErr) {
      logger.warn(`Sales intelligence pipeline encountered warning: ${String(intelErr)}`);
    }

    // 5. Determine Niche Strategy & Value Proposition
    const niche = this.getNicheStrategy(category, area, primaryGap);

    // 6. Attempt LLM API if key is available, else use intelligent deterministic engine
    let multiChannelScripts: MultiChannelScripts;
    let generatedBy: 'llm' | 'deterministic_engine' = 'deterministic_engine';

    const apiKey = input.llmApiKey || (process.env.NODE_ENV !== 'test' && (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY));
    if (apiKey) {
      try {
        const llmResult = await this.generateViaLlm(input, niche, issues, recommendations, apiKey);
        if (llmResult) {
          multiChannelScripts = llmResult;
          generatedBy = 'llm';
        } else {
          multiChannelScripts = this.buildDeterministicScripts(
            name,
            category,
            area,
            rating,
            reviews,
            tone,
            niche,
            auditGaps,
            primaryGap,
            website,
            funnelTechStack,
            businessCase,
            salesIntelligence
          );
        }
      } catch (err) {
        logger.warn(`LLM generation failed, falling back to deterministic engine: ${String(err)}`);
        multiChannelScripts = this.buildDeterministicScripts(
          name,
          category,
          area,
          rating,
          reviews,
          tone,
          niche,
          auditGaps,
          primaryGap,
          website,
          funnelTechStack,
          businessCase,
          salesIntelligence
        );
      }
    } else {
      multiChannelScripts = this.buildDeterministicScripts(
        name,
        category,
        area,
        rating,
        reviews,
        tone,
        niche,
        auditGaps,
        primaryGap,
        website,
        funnelTechStack,
        businessCase,
        salesIntelligence
      );
    }

    return {
      issues,
      recommendations,
      estimatedProjectValueZAR,
      personalizedOutreachScript: multiChannelScripts.email.body,
      multiChannelScripts,
      funnelTechStack,
      businessCase,
      salesIntelligence,
      auditTimestamp: new Date().toISOString(),
      generatedBy,
    };
  }

  /**
   * Evaluates technical audit details and returns categorized issues, recommendations, and primary gap
   */
  private analyzeTechnicalGaps(audit: TechnicalAudit | undefined, website: string) {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const auditGaps: string[] = [];

    if (!website || website.trim() === '') {
      issues.push('No Official Website: Digital presence is limited to directory listings');
      recommendations.push('Deploy modern, high-converting responsive business website with instant lead booking');
      auditGaps.push('missing_website');
    } else if (audit) {
      if (!audit.hasHttps) {
        issues.push('Security Alert: Website lacks SSL encryption (browsers flag site as "Not Secure")');
        recommendations.push('Install SSL certificate and enforce HTTPS protocol');
        auditGaps.push('insecure_ssl');
      }

      if (audit.loadSpeedSeconds && audit.loadSpeedSeconds > 3.0) {
        issues.push(`Slow Load Speed: Page takes ${audit.loadSpeedSeconds}s to load (over 50% of mobile visitors bounce after 3s)`);
        recommendations.push('Compress assets, leverage CDN caching, and optimize mobile performance');
        auditGaps.push('slow_speed');
      }

      if (!audit.hasResponsiveViewport) {
        issues.push('Mobile Viewport Missing: Layout is not optimized for smartphones and tablets');
        recommendations.push('Implement mobile-first responsive viewport design');
        auditGaps.push('unresponsive_mobile');
      }

      if (!audit.analyticsDetected || audit.analyticsDetected.length === 0) {
        issues.push('Zero Conversion Tracking: Missing Google Analytics 4 (GA4) or Meta Pixel for visitor retargeting');
        recommendations.push('Install GA4 and Meta Pixel conversion event tracking');
        auditGaps.push('no_analytics');
      }

      if (!audit.hasBookingSystem) {
        issues.push('Missing Automated Booking: No 24/7 online scheduling calendar for after-hours client appointments');
        recommendations.push('Deploy custom 24/7 online appointment booking portal');
        auditGaps.push('no_booking');
      }

      if (!audit.hasWhatsappLink) {
        issues.push('No WhatsApp CTA: Missing 1-click WhatsApp lead capture widget (South Africa\'s #1 conversion channel)');
        recommendations.push('Add prominent 1-click WhatsApp lead capture widget with automated welcome trigger');
        auditGaps.push('no_whatsapp');
      }

      if (audit.seoScore !== undefined && audit.seoScore < 60) {
        issues.push(`Sub-optimal Local SEO (${audit.seoScore}/100): Missing optimized meta titles, descriptions, and structured data`);
        recommendations.push('Optimize on-page meta tags, schema markup, and Google local pack search visibility');
        auditGaps.push('poor_seo');
      }

      if (audit.openGraph && !audit.openGraph.hasOgImage) {
        issues.push('Social Card Missing: OpenGraph preview image missing when sharing link on WhatsApp/socials');
        recommendations.push('Configure branded OpenGraph image preview card for social sharing');
        auditGaps.push('no_og_image');
      }

      if (audit.cms) {
        issues.push(`CMS Framework: Running ${audit.cms} (legacy theme may bottleneck conversion rate)`);
        recommendations.push(`Modernize ${audit.cms} conversion funnel and checkout/booking speed`);
      }
    }

    // Default fallbacks if no specific issues detected
    if (issues.length === 0) {
      issues.push('Lead Intake Friction: Website lacks automated instant lead response and after-hours intake');
      issues.push('Conversion Rate Optimization: Mobile visitor drop-off before reaching contact form');
      issues.push('Retargeting Gap: Missing automated follow-up sequences for warm website visitors');
      auditGaps.push('intake_friction');
    }

    if (recommendations.length === 0) {
      recommendations.push('Deploy automated 24/7 WhatsApp & calendar lead intake funnel');
      recommendations.push('Implement conversion-focused mobile landing page overhaul');
      recommendations.push('Install GA4 & Meta Pixel conversion tracking with retargeting setup');
    }

    // Determine primary diagnostic gap for the pitch
    let primaryGap = 'conversion_funnel';
    if (auditGaps.includes('missing_website')) primaryGap = 'missing_website';
    else if (auditGaps.includes('insecure_ssl')) primaryGap = 'insecure_ssl';
    else if (auditGaps.includes('slow_speed')) primaryGap = 'slow_speed';
    else if (auditGaps.includes('unresponsive_mobile')) primaryGap = 'unresponsive_mobile';
    else if (auditGaps.includes('no_booking')) primaryGap = 'no_booking';
    else if (auditGaps.includes('no_whatsapp')) primaryGap = 'no_whatsapp';
    else if (auditGaps.includes('no_analytics')) primaryGap = 'no_analytics';
    else if (auditGaps.includes('poor_seo')) primaryGap = 'poor_seo';

    const baseValuation = 14500;
    const estimatedProjectValueZAR = baseValuation + issues.length * 3500;

    return { issues, recommendations, auditGaps, primaryGap, estimatedProjectValueZAR };
  }

  /**
   * Selects industry-specific angles, pain points, and proof metrics
   */
  private getNicheStrategy(category: string, area: string, primaryGap: string): NicheStrategy {
    const cat = category.toLowerCase();

    // 1. Fitness & Gyms
    if (/fitness|gym|crossfit|pilates|yoga|training|boxing|martial/i.test(cat)) {
      return {
        headline: `Capturing After-Hours Membership Inquiries & Free Trial Bookings`,
        painPoint: `70% of gym membership searches happen after 6 PM when reception is closed, letting potential members slip away to competitors`,
        solution: `an automated 24/7 WhatsApp trial pass & class schedule booking funnel`,
        caseMetric: `helped a nearby fitness studio capture 28 new monthly trial signups in their first 3 weeks`,
        callDiscovery: `How are you currently handling membership inquiries and class booking requests that come in after hours?`,
        callObjection: `I completely understand your desk staff is busy running sessions! That's exactly why this automated system qualifies leads and confirms trial passes without staff needing to touch a phone.`,
      };
    }

    // 2. Beauty, Hair & Aesthetics
    if (/beauty|hair|salon|spa|barber|aesthetic|nail|skin|massage|laser/i.test(cat)) {
      return {
        headline: `Eliminating No-Shows & Automating 24/7 Salon Bookings`,
        painPoint: `clients want to book appointments instantly via WhatsApp/Instagram at night without phone tag or DM delays`,
        solution: `a 1-click WhatsApp & calendar booking portal with automated deposit collection and SMS reminders`,
        caseMetric: `reduced appointment no-shows by 85% and added 34 new client bookings in month one for a boutique clinic`,
        callDiscovery: `Are you currently losing time going back and forth on WhatsApp to schedule clients, or having issues with last-minute no-shows?`,
        callObjection: `Totally get it! Our automated assistant handles the calendar, takes deposits, and sends reminders automatically so your stylists can focus 100% on clients.`,
      };
    }

    // 3. Healthcare, Dental & Wellness
    if (/health|dental|dentist|physio|chiro|medical|doctor|clinic|optom|wellness|orthodont/i.test(cat)) {
      return {
        headline: `High-Value Patient Intake & Automated Consultation Booking`,
        painPoint: `high-intent patients searching for specialized treatments (e.g. Invisalign, implants, physiotherapy) bounce when they encounter friction or no instant booking`,
        solution: `a POPIA-compliant patient intake portal with 1-click emergency WhatsApp routing and consultation scheduling`,
        caseMetric: `helped a private practice secure 19 high-ticket treatment consultations in their first 30 days`,
        callDiscovery: `When new patients find your practice online after hours, can they instantly schedule a consultation or is reception manual?`,
        callObjection: `Understood! Medical practices love this because it integrates seamlessly with your front desk without disrupting existing PMS software or patient workflows.`,
      };
    }

    // 4. Restaurant & Hospitality
    if (/restaurant|cafe|coffee|bistro|bar|grill|dining|food|bakery|pub|hotel|lounge/i.test(cat)) {
      return {
        headline: `Direct Table Reservations & Private Function Inquiries`,
        painPoint: `relying on third-party portals costs hefty commissions, while slow mobile menus cost walk-in and dinner reservations`,
        solution: `a lightning-fast mobile reservation widget and direct WhatsApp VIP booking system`,
        caseMetric: `generated 140+ direct table reservations in 30 days while saving R12,000 in third-party booking commissions`,
        callDiscovery: `How are you currently capturing private dining inquiries and table reservations directly from your website visitors?`,
        callObjection: `We don't replace your POS or floor managers—we simply make sure high-intent diners on Google Maps land directly on your confirmed table booking link.`,
      };
    }

    // 5. Real Estate & Property
    if (/real estate|property|realty|estate agent|interior design|architect|homes|constructions/i.test(cat)) {
      return {
        headline: `Instant Property Valuation Funnels & Buyer Qualification`,
        painPoint: `serious property sellers and luxury buyers expect instant WhatsApp responses and virtual tour booking rather than static forms`,
        solution: `an instant property valuation calculator and WhatsApp automated buyer qualification funnel`,
        caseMetric: `delivered 15 exclusive listing valuation requests and 42 qualified buyer inquiries in 60 days`,
        callDiscovery: `How quickly is your team able to follow up when a prospective seller requests a property valuation online?`,
        callObjection: `That makes complete sense! This tool pre-qualifies buyers by budget and location before passing them directly to your designated agent.`,
      };
    }

    // 6. Professional Services (Legal, Accounting, Tax, Consulting)
    if (/law|attorney|legal|accountant|accounting|audit|tax|marketing|consultant|consulting|financial|recruitment/i.test(cat)) {
      return {
        headline: `High-Ticket Client Intake & Automated Consultation Scheduling`,
        painPoint: `corporate clients and business owners look for trust signals, SSL security, and frictionless consultation booking before retaining a firm`,
        solution: `a secure client qualification intake portal with automated calendar scheduling and proposal dispatch`,
        caseMetric: `helped an advisory firm secure 11 new corporate retainer clients worth R280k in annual billings`,
        callDiscovery: `How are you currently qualifying high-intent corporate inquiries coming through your website?`,
        callObjection: `We understand confidentiality is paramount. Our intake funnels are built with enterprise-grade SSL and direct calendar routing.`,
      };
    }

    // 7. Automotive & Trades (Solar, Electrical, Plumbing, Auto Repair)
    if (/auto|car|mechanic|detailing|workshop|panelbeater|tyres|electrician|plumber|contractor|solar|roofing/i.test(cat)) {
      return {
        headline: `1-Tap Emergency Callouts & Instant Quote Requests`,
        painPoint: `homeowners and drivers in need of urgent quotes call the first competitor with a 1-tap WhatsApp quote button and fast mobile response`,
        solution: `an emergency 1-tap quote capture funnel with instant WhatsApp dispatch and photo upload`,
        caseMetric: `increased weekly inbound service quote requests by 65% for a local trade contractor`,
        callDiscovery: `When someone has an urgent repair or quote request in ${area}, how easily can they send photos and get a quote via WhatsApp from your site?`,
        callObjection: `I know you're on the tools or in the workshop all day! That's why the system collects the job details and photos automatically before you call back.`,
      };
    }

    // 8. Retail & Shopping
    if (/boutique|store|shop|fashion|jewel|apparel|clothing|gift/i.test(cat)) {
      return {
        headline: `Mobile Speed Optimization & WhatsApp VIP Personal Shopping`,
        painPoint: `mobile shoppers abandon carts if load time exceeds 2.5s or if product questions can't be answered instantly on WhatsApp`,
        solution: `a fast mobile catalog with direct WhatsApp personal shopper assistance and abandoned visitor recovery`,
        caseMetric: `boosted mobile checkout conversions by 42% and added R38,000 in monthly direct WhatsApp sales`,
        callDiscovery: `Are you currently able to capture shoppers who browse your catalog but leave before completing a purchase?`,
        callObjection: `It takes less than 2 hours to connect to your existing store without changing your inventory setup.`,
      };
    }

    // Default / Other Business
    return {
      headline: `Automated Lead Intake & 24/7 Client Conversion Engine`,
      painPoint: `local prospects comparing providers in ${area} choose the competitor who responds fastest to web and WhatsApp inquiries`,
      solution: `an automated 24/7 lead intake and instant response system`,
      caseMetric: `helped a local ${category} business increase high-intent inbound inquiries by 45% in 30 days`,
      callDiscovery: `How are you currently following up with visitors who browse your website after business hours?`,
      callObjection: `That's exactly why we built this automated engine—it handles client inquiries 24/7 without needing extra staff.`,
    };
  }

  /**
   * Generates a tailored, personalized commercial business case and centralized touchpoint blueprint
   */
  public generateBusinessCase(
    name: string,
    category: string,
    area: string,
    website: string,
    socials: TechnicalAudit['socialLinks'] | undefined,
    funnelStack: FunnelTechStack | undefined,
    audit: TechnicalAudit | undefined,
    estimatedProjectValueZAR: number
  ): TailoredBusinessCase {
    const linkTool = funnelStack?.linkInBioTool;
    const booking = funnelStack?.bookingEngine;
    const payment = funnelStack?.paymentGateway;
    const igHandle = socials?.instagram
      ? socials.instagram.split('/').filter(Boolean).pop()
      : `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    let currentWorkflowSummary = '';
    const identifiedGaps: string[] = [];
    const commercialFrictionPoints: string[] = [];
    let proposedCentralizedSolution = '';
    let strategicPitchHook = '';

    if (linkTool && booking) {
      currentWorkflowSummary = `Instagram Bio (${igHandle}) ➔ ${linkTool} Landing ➔ External ${booking} Portal & Manual WhatsApp`;
      identifiedGaps.push(
        `${linkTool} Drop-Off Friction: Directing high-intent social followers to a multi-link directory introduces an unnecessary 40-50% click barrier before prospects see your class schedule or offers.`
      );
      identifiedGaps.push(
        `External ${booking} Portal Disconnect: Rerouting traffic to an external 3rd-party domain strips away brand immersion and prevents Meta Pixel & GA4 event retargeting on non-converting visitors.`
      );
      identifiedGaps.push(
        `Disjointed Multi-Channel Intake: Inquiries across Instagram DMs, WhatsApp, and phone calls are not synchronized with ${booking}, leading to manual response lag.`
      );
      commercialFrictionPoints.push(
        `Over 40% of mobile users abandon external portal redirects before completing booking/signup`
      );
      commercialFrictionPoints.push(
        `Zero visitor retargeting on dropped prospects who click ${linkTool} but do not register`
      );
      commercialFrictionPoints.push(
        `Manual back-and-forth communication required to confirm bookings and send payment links`
      );

      proposedCentralizedSolution = `A single, high-converting Branded Digital Hub that replaces ${linkTool} and centralizes your ${booking} schedule, 1-click WhatsApp trial pass claims, instant ${payment || 'online'} payments, and unified Meta Pixel retargeting into one seamless branded touchpoint.`;
      strategicPitchHook = `We noticed on Instagram that ${name} routes members through ${linkTool} to ${booking}. We developed a centralized touchpoint blueprint for ${name} that eliminates the 40% drop-off barrier by unifying trial booking, WhatsApp intake, and member signups in one high-converting hub.`;
    } else if (linkTool) {
      currentWorkflowSummary = `Instagram Bio (${igHandle}) ➔ ${linkTool} Link-in-Bio ➔ Disconnected External Links & Manual Phone/DM`;
      identifiedGaps.push(
        `Multi-Link Directory Fatigue: Visitors clicking ${linkTool} are overwhelmed by choices without a clear, high-converting primary booking CTA.`
      );
      identifiedGaps.push(
        `Loss of Retargeting Pixel Data: Third-party bio links do not allow ${name} to build custom audiences for Meta or Google ad retargeting.`
      );
      commercialFrictionPoints.push(
        `Prospects browsing on mobile drop off before reaching contact details`
      );
      commercialFrictionPoints.push(
        `No automated booking engine to confirm appointments 24/7`
      );

      proposedCentralizedSolution = `A custom branded mobile landing page that replaces ${linkTool}, featuring instant 1-click WhatsApp chat, interactive service menu, direct booking calendar, and built-in Meta Pixel retargeting.`;
      strategicPitchHook = `We noticed ${name} uses ${linkTool} on social media. We designed a branded, high-converting touchpoint that replaces ${linkTool} and captures 35%+ more direct client inquiries.`;
    } else if (booking) {
      currentWorkflowSummary = `Social / Google Maps ➔ External ${booking} Portal ➔ Manual Confirmation`;
      identifiedGaps.push(
        `External Portal Leakage: Sending prospects directly to ${booking} skips pre-framing, social proof, and WhatsApp capture.`
      );
      commercialFrictionPoints.push(
        `Clients who abandon ${booking} are lost forever with no automated WhatsApp recovery`
      );

      proposedCentralizedSolution = `A high-converting branded portal integrating ${booking} seamlessly with automated 1-click WhatsApp follow-ups and local search SEO.`;
      strategicPitchHook = `We saw ${name} uses ${booking} for bookings. We built an automated touchpoint that captures abandoned visitors and converts 30% more inquiries via WhatsApp.`;
    } else {
      currentWorkflowSummary = `Social Profiles / Google Listing ➔ Manual DM / Phone Calls / In-Person Walk-ins`;
      identifiedGaps.push(
        `Zero Automated Intake: Inquiries arriving after business hours (6 PM - 8 AM) go unanswered until staff manually replies.`
      );
      identifiedGaps.push(
        `High Response Latency: Manual DM / phone qualification creates friction, allowing competitors with 1-click booking to win clients.`
      );
      commercialFrictionPoints.push(
        `70% of potential clients browse services after hours and bounce if instant booking is unavailable`
      );
      commercialFrictionPoints.push(
        `Staff spends 10+ hours/week answering repetitive pricing and availability inquiries`
      );

      proposedCentralizedSolution = `A 24/7 Automated Client Acquisition Engine featuring 1-click WhatsApp lead capture, instant scheduling calendar, automated FAQ qualification, and online payment intake.`;
      strategicPitchHook = `We noticed ${name} currently relies on manual inquiries. We built an automated 24/7 client acquisition engine for ${category} businesses in ${area} that captures after-hours leads automatically.`;
    }

    const estimatedMonthlyRevenueImpactZAR = Math.round((estimatedProjectValueZAR || 18500) * 1.4);

    // Qualitative Economic Classifications (used when exact economics are unavailable or for tiering)
    let qualitativeImpactTier = 'Moderate Conversion Opportunity';
    let qualitativePaybackHorizon = 'Rapid Turnaround (1–2 Months)';
    let dealScopeClassification = '24/7 Lead Intake & WhatsApp Engine';
    let commercialValuationRange = 'R15,000 – R25,000 (Focused Intake Engine)';

    if (linkTool && booking) {
      qualitativeImpactTier = 'High Commercial Upside (Top-Tier Friction Recovery)';
      qualitativePaybackHorizon = 'Immediate (< 30 Days)';
      dealScopeClassification = 'Centralized Multi-Tool Hub Transformation';
      commercialValuationRange = 'R28,000 – R45,000 (Omnichannel Hub)';
    } else if (linkTool) {
      qualitativeImpactTier = 'Substantial Inbound Expansion (Bio-Link Friction Elimination)';
      qualitativePaybackHorizon = 'Immediate (< 30 Days)';
      dealScopeClassification = 'Branded Mobile Touchpoint & Booking Hub';
      commercialValuationRange = 'R20,000 – R35,000 (Mobile Funnel)';
    } else if (booking) {
      qualitativeImpactTier = 'Substantial Conversion Recovery (External Leakage Prevention)';
      qualitativePaybackHorizon = 'Rapid Turnaround (< 45 Days)';
      dealScopeClassification = 'Integrated Booking & Retargeting Portal';
      commercialValuationRange = 'R18,000 – R30,000 (Portal Integration)';
    } else if (!website || website.trim() === '') {
      qualitativeImpactTier = 'Foundational Digital Intake Opportunity (Zero Existing Web Funnel)';
      qualitativePaybackHorizon = 'Rapid Turnaround (1–2 Months)';
      dealScopeClassification = 'Complete Mobile-First Web & Booking Storefront';
      commercialValuationRange = 'R22,000 – R38,000 (Full Storefront)';
    }

    return {
      headline: `Centralized Touchpoint & Workflow Optimization for ${name}`,
      currentWorkflowSummary,
      identifiedGaps,
      commercialFrictionPoints,
      proposedCentralizedSolution,
      projectedMonthlyRecoveredLeads: `+12 to +25 qualified monthly inquiries`,
      estimatedMonthlyRevenueImpactZAR,
      qualitativeImpactTier,
      paybackPeriodDays: 18,
      qualitativePaybackHorizon,
      dealScopeClassification,
      commercialValuationRange,
      strategicPitchHook,
    };
  }

  /**
   * Deterministic multi-channel script generator based on tone, niche, and real audit & funnel data
   */
  private buildDeterministicScripts(
    name: string,
    category: string,
    area: string,
    rating: number,
    reviews: number,
    tone: OutreachTone,
    niche: NicheStrategy,
    auditGaps: string[],
    primaryGap: string,
    website: string,
    funnelStack?: FunnelTechStack,
    businessCase?: TailoredBusinessCase,
    salesIntelligence?: import('../types/intelligence.js').SalesIntelligenceReport
  ): MultiChannelScripts {
    // Generate audit callout snippet for the pitch
    let auditCalloutText = '';
    let auditSubjectHook = '';

    if (funnelStack?.linkInBioTool && funnelStack?.bookingEngine) {
      auditCalloutText = `we noticed on Instagram that you route prospects through ${funnelStack.linkInBioTool} to ${funnelStack.bookingEngine}, which creates a 40%+ drop-off barrier and prevents Meta Pixel retargeting.`;
      auditSubjectHook = `Centralized touchpoint idea for ${name} (${funnelStack.linkInBioTool} + ${funnelStack.bookingEngine})`;
    } else if (funnelStack?.linkInBioTool) {
      auditCalloutText = `we noticed ${name} uses ${funnelStack.linkInBioTool} on social media, which introduces multi-link friction and lacks direct 1-click WhatsApp booking.`;
      auditSubjectHook = `High-converting social funnel for ${name}`;
    } else if (funnelStack?.bookingEngine) {
      auditCalloutText = `we saw ${name} uses ${funnelStack.bookingEngine}, but lacks a branded centralized touchpoint and 1-click WhatsApp intake.`;
      auditSubjectHook = `Optimizing ${name}'s ${funnelStack.bookingEngine} intake`;
    } else if (primaryGap === 'insecure_ssl') {
      auditCalloutText = `we noticed ${name}'s website is currently missing an SSL certificate (showing an insecure "Not Secure" warning in browsers), which deters over 60% of potential clients.`;
      auditSubjectHook = `Fixing ${name}'s website security warning`;
    } else if (primaryGap === 'slow_speed') {
      auditCalloutText = `we ran a mobile performance audit on ${name}'s site and detected slow load times exceeding 3.5s, which typically causes 50%+ of mobile visitors to bounce before seeing your services.`;
      auditSubjectHook = `Mobile speed fix for ${name}`;
    } else if (primaryGap === 'unresponsive_mobile') {
      auditCalloutText = `our technical audit found that ${name}'s site layout is not fully responsive on mobile devices, making navigation difficult for smartphone users.`;
      auditSubjectHook = `Mobile viewport optimization for ${name}`;
    } else if (primaryGap === 'no_booking') {
      auditCalloutText = `we noticed ${name} is missing an automated online scheduling portal, meaning clients browsing your site after hours cannot book instantly.`;
      auditSubjectHook = `24/7 Online Booking idea for ${name}`;
    } else if (primaryGap === 'no_whatsapp') {
      auditCalloutText = `we noticed ${name}'s site lacks a 1-click WhatsApp lead capture widget, letting high-intent local inquiries slip away to nearby competitors.`;
      auditSubjectHook = `WhatsApp lead capture idea for ${name}`;
    } else if (primaryGap === 'no_analytics') {
      auditCalloutText = `we found that ${name}'s site has no GA4 or Meta conversion tracking installed, meaning you have zero visibility into visitor drop-offs or retargeting.`;
      auditSubjectHook = `Conversion tracking gap on ${name}`;
    } else if (primaryGap === 'missing_website') {
      auditCalloutText = `we noticed ${name} currently lacks a dedicated high-converting website, relying solely on directory listings while competitors capture Google search traffic.`;
      auditSubjectHook = `High-converting digital storefront for ${name}`;
    } else {
      auditCalloutText = `our diagnostic audit identified 3 conversion bottlenecks on ${name}'s sales funnel that are restricting your monthly inbound client flow.`;
      auditSubjectHook = `Growth & lead intake optimization for ${name}`;
    }

    // Build Tone-Specific Scripts
    let emailSubject = '';
    let emailBody = '';
    let whatsappText = '';
    let socialDmText = '';
    let coldCallBattlecard = { opener: '', discovery: '', objectionHandling: '', close: '' };

    switch (tone) {
      case 'direct':
        emailSubject = `${auditSubjectHook} in ${area}`;
        emailBody = `Hi ${name} Team,\n\nWe audited top ${category} providers in ${area} and noticed ${name} has an impressive ${rating}★ reputation with ${reviews}+ reviews.\n\nHowever, ${auditCalloutText}\n\nSince ${niche.painPoint}, we built ${niche.solution}.\n\nWe recently ${niche.caseMetric}.\n\nCan I send you a 2-minute video preview showing what this centralized hub would look like for ${name} this Thursday?\n\nBest regards,\nLeadGremlin Growth Engine`;
        whatsappText = `⚡ *Quick Growth Idea for ${name} (${area})*\n\nHi team, loved your ${rating}★ reviews! While reviewing top ${category} spots in ${area}, ${auditCalloutText}\n\nWe build centralized conversion funnels tailored for ${category} businesses. Would you be open to a 60-second video demo showing how to capture more direct inquiries? 🚀`;
        socialDmText = `Hey ${name} team! 👋 Super impressive work in ${area} with ${reviews}+ reviews. Quick heads up: ${auditCalloutText} We build 1-click centralized touchpoints for ${category} businesses. DM us if you'd like a free mockup! 📩`;
        coldCallBattlecard = {
          opener: `Hi, is this the manager or owner at ${name}? My name is LeadGremlin, calling briefly regarding your ${area} digital lead intake and sales workflow.`,
          discovery: niche.callDiscovery,
          objectionHandling: niche.callObjection,
          close: `Can I drop a 60-second video breakdown directly to your WhatsApp or email so you can take a look whenever you have 2 minutes?`,
        };
        break;

      case 'casual':
        emailSubject = `Quick idea for ${name} 💡 (${area})`;
        emailBody = `Hey ${name} team,\n\nCame across your profile while exploring top ${category} spots around ${area}. Big fans of your ${rating}★ rating and ${reviews}+ reviews!\n\nJust noticed a quick sales funnel fix: ${auditCalloutText}\n\nWe recently ${niche.caseMetric} by setting up ${niche.solution}.\n\nWould love to send over a quick 2-minute video showing how it works if you're open to it?\n\nCheers,\nLeadGremlin Growth Engine`;
        whatsappText = `Hey ${name} team 👋 Came across your ${category} business in ${area} and loved your ${rating}★ reviews! Noticed a quick tweak: ${auditCalloutText}\n\nMind if I share a 1-min quick link showing how to capture more bookings automatically? 😊`;
        socialDmText = `Hey guys! Love what ${name} is doing in ${area} 🔥 Noticed your page could easily capture 30% more clients with a centralized booking hub. We set these up in 24 hours. DM us if you want a free preview! 🙌`;
        coldCallBattlecard = {
          opener: `Hey there! Is this ${name}? Hope you're having an awesome week. Calling really quick from ${area}.`,
          discovery: niche.callDiscovery,
          objectionHandling: niche.callObjection,
          close: `Would it be alright if I dropped a quick 60-second link to your WhatsApp so you can check it out whenever you're free?`,
        };
        break;

      case 'urgent':
        emailSubject = `URGENT: ${name} is losing ${category} leads in ${area}`;
        emailBody = `Attention ${name} Management,\n\nOur automated diagnostic audit revealed that ${name} is currently leaking potential clients in ${area}.\n\nSpecifically, ${auditCalloutText}\n\nWhile your rating (${rating}★) is excellent, nearby ${category} competitors are capturing after-hours clients because ${niche.painPoint}.\n\nWe have 2 slots open this week for complimentary sales funnel implementations in ${area}. Let's get this resolved before more inquiries slip away.\n\nRegards,\nLeadGremlin Growth Engine`;
        whatsappText = `⚠️ *Missed Inquiries Alert for ${name}*\n\nHi team, your ${category} sales workflow in ${area} is currently missing critical lead intake: ${auditCalloutText}\n\nWe have a free implementation slot open this week for ${area}. Reply YES for an instant preview! ⏱️`;
        socialDmText = `⚠️ Hey ${name}! Local ${category} competitors in ${area} are using centralized lead intake to capture after-hours clients. We can fix your lead funnel in under 24 hours. Tap back if interested! ⚡`;
        coldCallBattlecard = {
          opener: `Hi, urgency call for ${name} management regarding your ${area} sales funnel and lead capture. Do you have 30 seconds?`,
          discovery: `Our diagnostic audit found that ${auditCalloutText} You're losing high-intent client inquiries every week to nearby competitors.`,
          objectionHandling: `I understand you have an existing setup, but right now it's leaking potential revenue every single evening.`,
          close: `Let's lock in 10 minutes tomorrow morning to fix this lead leak. Does 9:30 AM or 11:00 AM work better?`,
        };
        break;

      case 'roi_focused':
        emailSubject = `ROI Breakdown: R25k+ Monthly Revenue Opportunity for ${name}`;
        emailBody = `Hi ${name} Leadership,\n\nI conducted a commercial revenue audit of ${category} businesses in ${area}.\n\nBased on your ${rating}★ reputation and local search volume, ${name} is well positioned to capture an additional 15-25 high-value client bookings each month.\n\nHowever, ${auditCalloutText} which creates friction in your conversion pipeline.\n\nBy implementing ${niche.solution}, we recently ${niche.caseMetric}.\n\nCan I share our 3-minute financial model and centralized blueprint this Wednesday?\n\nBest regards,\nLeadGremlin Growth Engine`;
        whatsappText = `📊 *Revenue Growth Model for ${name}*\n\nHi team, our commercial audit shows ${name} could generate R20k-R35k in additional monthly bookings in ${area}.\n\nKey finding: ${auditCalloutText}\n\nWould you like to review our 2-page ROI breakdown and live mockup? 📈`;
        socialDmText = `Hi ${name}! 📈 We put together a growth breakdown showing how top ${category} businesses in ${area} add R25k+ monthly via centralized booking funnels. Would love to send the PDF model over!`;
        coldCallBattlecard = {
          opener: `Good day, my name is LeadGremlin. I'm calling for ${name} management regarding your digital revenue intake in ${area}.`,
          discovery: `We analyze conversion ROI for top ${category} providers. I noticed your brand has great reviews, but ${auditCalloutText} What is your target for new client acquisition this quarter?`,
          objectionHandling: `Understood! Our system typically pays for itself within the first 14 days by converting existing traffic that is currently bouncing.`,
          close: `Would you be open to a 10-minute screenshare this Thursday to see the exact numbers and live preview?`,
        };
        break;

      case 'consultative':
      default:
        emailSubject = `Optimizing ${name}'s digital lead intake in ${area}`;
        emailBody = `Hi ${name} Team,\n\nI came across ${name} while auditing top-rated ${category} businesses in ${area}.\n\nI noticed your team has built an incredible reputation (${rating}★ with ${reviews}+ reviews). However, during our sales funnel review, ${auditCalloutText}\n\nBecause ${niche.painPoint}, we developed ${niche.solution}.\n\nFor instance, we recently ${niche.caseMetric}.\n\nCan we show you a 5-minute live preview tailored to ${name} this Thursday at 10 AM?\n\nBest regards,\nLeadGremlin Automated Growth Engine`;
        whatsappText = `Hi ${name} Team 👋 We audited top ${category} businesses in ${area} and loved your ${rating}★ rating!\n\nWe noticed a small gap: ${auditCalloutText}\n\nWe put together a complimentary growth breakdown showing how ${niche.solution} can boost your weekly inquiries. Would you like us to send the PDF audit over? 📄`;
        socialDmText = `Hi ${name}! 🌟 Compliments on your ${reviews}+ positive reviews in ${area}. We created a short audit showing how your ${category} page can capture 35% more inbound clients with a centralized WhatsApp booking hub. Would love to send it over!`;
        coldCallBattlecard = {
          opener: `Good morning/afternoon, my name is LeadGremlin. I'm calling regarding ${name}'s online client intake and sales workflow in ${area}.`,
          discovery: niche.callDiscovery,
          objectionHandling: niche.callObjection,
          close: `Would Thursday at 10 AM or 2 PM work for a brief 10-minute screenshare to walk through the audit findings?`,
        };
        break;
    }

    // Generate 3-step automated drip sequence
    const dripSequence: EmailStepScript[] = [
      {
        stepNumber: 1,
        dayDelay: 0,
        title: `Day 1: Technical & Funnel Audit: ${niche.headline}`,
        subject: emailSubject,
        body: emailBody,
      },
      {
        stepNumber: 2,
        dayDelay: 3,
        title: `Day 3: Case Study & Niche Proof Follow-Up`,
        subject: `Re: ${emailSubject}`,
        body: `Hi ${name} Team,\n\nFollowing up briefly on my note regarding ${name}'s sales workflow and lead intake in ${area}.\n\nTo give you a quick example, we recently ${niche.caseMetric} by implementing ${niche.solution}.\n\nWould you be open to taking a look at a 60-second video breakdown showing how this applies to ${name}?\n\nBest regards,\nLeadGremlin Growth Engine`,
      },
      {
        stepNumber: 3,
        dayDelay: 7,
        title: `Day 7: Final Breakup & Complimentary PDF Audit Report`,
        subject: `Complimentary Sales Funnel & Technical Audit Report for ${name}`,
        body: `Hi ${name} Management,\n\nI know you're busy serving clients in ${area}, so I won't keep following up.\n\nWe put together a complete Sales Funnel & Technical Audit Report for ${name} detailing the exact steps to capture more monthly ${category} clients.\n\nIf you'd like the complimentary PDF report, just reply "AUDIT" and I'll send it right over.\n\nWishing ${name} continued success!\n\nBest regards,\nLeadGremlin Growth Engine`,
      },
    ];

    return {
      email: { subject: emailSubject, body: emailBody },
      whatsapp: whatsappText,
      socialDm: socialDmText,
      coldCall: coldCallBattlecard,
      dripSequence,
      primaryAuditCallout: auditCalloutText,
      nicheAngle: niche.headline,
    };
  }

  /**
   * Generates hyper-personalized scripts using LLM API (Gemini / OpenAI)
   */
  private async generateViaLlm(
    input: AIAuditInput,
    niche: NicheStrategy,
    issues: string[],
    recommendations: string[],
    apiKey: string
  ): Promise<MultiChannelScripts | null> {
    const prompt = `
You are an elite B2B sales copywriter for LeadGremlin, a South African digital lead engine and agency.
Generate a high-converting, personalized 4-channel outreach pitch suite for this local business lead:

BUSINESS DETAILS:
- Name: ${input.businessName}
- Category: ${input.category || 'Local Business'}
- Area/Suburb: ${input.area || 'Umhlanga'}, South Africa
- Rating: ${input.rating || 4.8} stars (${input.reviewCount || 35} reviews)
- Website: ${input.websiteUrl || 'None'}
- Tone: ${input.tone || 'consultative'}

AUDIT DIAGNOSTICS:
${issues.map((i) => `- ${i}`).join('\n')}

RECOMMENDED UPGRADES:
${recommendations.map((r) => `- ${r}`).join('\n')}

NICHE CONTEXT:
- Pain Point: ${niche.painPoint}
- Proposed Solution: ${niche.solution}
- Social Proof Metric: ${niche.caseMetric}

Return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "email": {
    "subject": "string",
    "body": "string"
  },
  "whatsapp": "string (concise, emojis, South African business etiquette)",
  "socialDm": "string (short Instagram/LinkedIn DM)",
  "coldCall": {
    "opener": "string",
    "discovery": "string",
    "objectionHandling": "string",
    "close": "string"
  }
}
`;

    // Try Gemini API if key starts with AIza... or default
    if (apiKey.startsWith('AIza') || process.env.GEMINI_API_KEY) {
      const geminiKey = process.env.GEMINI_API_KEY || apiKey;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return parsed as MultiChannelScripts;
        }
      }
    }

    // Try OpenAI API
    if (apiKey.startsWith('sk-') || process.env.OPENAI_API_KEY) {
      const openAiKey = process.env.OPENAI_API_KEY || apiKey;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return parsed as MultiChannelScripts;
        }
      }
    }

    return null;
  }
}

export const aiAuditor = new AIAuditor();
