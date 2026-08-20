import { Business } from '../types/business.js';
import { SocialCommercialAudit } from '../types/intelligence.js';

export class SocialAuditEngine {
  /**
   * Analyzes how social profiles function commercially, where traffic goes, and conversion leakage
   */
  public static audit(lead: Partial<Business>, additionalContext?: string): SocialCommercialAudit {
    const socials = lead.socials || {};
    const hasIg = Boolean(socials.instagram);
    const hasFb = Boolean(socials.facebook);
    const hasLi = Boolean(socials.linkedin);
    const hasTiktok = Boolean(socials.tiktok);

    const primaryPlatform = hasIg
      ? 'Instagram'
      : hasFb
      ? 'Facebook'
      : hasLi
      ? 'LinkedIn'
      : hasTiktok
      ? 'TikTok'
      : undefined;

    const isActive = Boolean(hasIg || hasFb || hasLi || hasTiktok);
    const context = `${lead.notes || ''} ${additionalContext || ''} ${lead.name || ''}`.toLowerCase();

    // Link in bio strategy
    const website = (lead.website || '').toLowerCase();
    const funnelStack = lead.funnelTechStack || lead.technicalAudit?.funnelTechStack;
    const linkTool = funnelStack?.linkInBioTool;

    let linkInBioStrategy: SocialCommercialAudit['link_in_bio_strategy'] = 'none';
    let destinationQuality: SocialCommercialAudit['destination_quality'] = 'dm_dead_end';

    if (linkTool) {
      linkInBioStrategy = 'generic_multi_link';
      destinationQuality = 'friction_heavy_redirect';
    } else if (lead.website) {
      if (lead.technicalAudit?.hasBookingSystem) {
        linkInBioStrategy = 'booking_portal';
        destinationQuality = 'seamless_owned_destination';
      } else {
        linkInBioStrategy = 'direct_website';
        destinationQuality = 'seamless_owned_destination';
      }
    } else {
      linkInBioStrategy = 'none';
      destinationQuality = 'dm_dead_end';
    }

    // Content themes & capabilities
    const contentThemes: string[] = [];
    let hasFounderLed = false;
    let hasPromo = false;
    let hasProductShowcase = false;
    let hasEducational = false;
    let hasTestimonials = false;

    const cat = (lead.category || '').toLowerCase();

    if (cat.includes('fitness') || cat.includes('gym')) {
      contentThemes.push('Class Highlights', 'Member Transformations', 'Daily Workouts');
      hasProductShowcase = true;
      hasTestimonials = true;
      if (context.includes('coach') || context.includes('founder') || context.includes('mish') || context.includes('trainer')) {
        hasFounderLed = true;
        contentThemes.push('Founder/Coach-Led Training');
      }
    } else if (cat.includes('beauty') || cat.includes('hair') || cat.includes('aesthetic') || cat.includes('spa')) {
      contentThemes.push('Before & After Treatment Results', 'Service Demos', 'Client Testimonials');
      hasProductShowcase = true;
      hasTestimonials = true;
      hasPromo = true;
      if (context.includes('dr') || context.includes('founder') || context.includes('stylist')) {
        hasFounderLed = true;
        contentThemes.push('Practitioner Showcases');
      }
    } else if (cat.includes('restaurant') || cat.includes('dining')) {
      contentThemes.push('Menu Highlights', 'Atmosphere & Ambience', 'Weekend Specials');
      hasProductShowcase = true;
      hasPromo = true;
    } else if (cat.includes('health') || cat.includes('dental')) {
      contentThemes.push('Patient Education', 'Treatment Explanations', 'Practice Culture');
      hasEducational = true;
      hasTestimonials = true;
      hasFounderLed = true;
    } else {
      contentThemes.push('Service Spotlights', 'Customer Interactions');
      hasProductShowcase = true;
    }

    // Calls to Action
    const ctas: string[] = [];
    if (destinationQuality === 'dm_dead_end') {
      ctas.push('DM to book / enquire', 'WhatsApp number in bio');
    } else if (linkTool) {
      ctas.push(`Link in bio (${linkTool})`, 'DM for pricing');
    } else if (lead.website) {
      ctas.push('Visit website', 'Book online');
    }

    // Generate specific commercial insight
    let commercialInsight = '';
    const name = lead.name || 'The business';

    if (!isActive) {
      commercialInsight = `No active commercial social presence discovered. Customer acquisition currently relies on word-of-mouth and local search visibility.`;
    } else if (hasIg && destinationQuality === 'dm_dead_end') {
      if (hasFounderLed) {
        commercialInsight = `Instagram is a key acquisition channel with strong founder-led engagement, but the customer journey terminates in direct messages (DMs). There is no dedicated owned landing destination where prospects can compare options, view clear pricing/schedules, and book instantly.`;
      } else {
        commercialInsight = `Social media generates active community attention, but inquiries are handled manually through DMs without an automated conversion path or owned digital storefront.`;
      }
    } else if (linkTool && funnelStack?.bookingEngine) {
      commercialInsight = `Social media actively routes prospects through ${linkTool} to external ${funnelStack.bookingEngine} scheduling. While active, this multi-step path introduces significant drop-off friction and disconnects retargeting pixels.`;
    } else if (linkTool) {
      commercialInsight = `Social channels drive traffic to a multi-link directory (${linkTool}) rather than a unified branded destination, diluting conversion intent and preventing Meta Pixel retargeting.`;
    } else if (hasIg && lead.website) {
      commercialInsight = `Active social presence with direct website linkage. The key opportunity lies in tightening the transition from social discovery to instant WhatsApp/calendar booking.`;
    } else {
      commercialInsight = `Active social profiles build brand awareness, but lack a clear conversion bridge to convert followers into structured leads.`;
    }

    return {
      primary_platform: primaryPlatform,
      is_active: isActive,
      posting_frequency: isActive ? 'Regular / Active Weekly' : 'Infrequent / Inactive',
      recent_post_date: isActive ? 'Recent (< 14 days)' : undefined,
      content_themes: contentThemes,
      has_promotional_activity: hasPromo,
      has_product_service_showcase: hasProductShowcase,
      has_founder_led_content: hasFounderLed,
      has_educational_content: hasEducational,
      has_testimonials_or_case_studies: hasTestimonials,
      calls_to_action: ctas,
      link_in_bio_strategy: linkInBioStrategy,
      destination_quality: destinationQuality,
      commercial_insight: commercialInsight,
    };
  }
}
