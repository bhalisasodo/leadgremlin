import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebsiteAnalyzer } from '../src/scoring/websiteAnalyzer.js';
import { AIAuditor } from '../src/scoring/aiAuditor.js';
import { PdfReportGenerator } from '../src/utils/pdfGenerator.js';
import { Business } from '../src/types/business.js';

describe('Sales Funnel & Workflow Audit and Business Case Builder', () => {
  const analyzer = new WebsiteAnalyzer();
  const auditor = new AIAuditor();

  it('detects Link-in-Bio tools (Linktree, Beacons, Taplink)', () => {
    assert.equal(analyzer.detectLinkInBio('<a href="https://linktr.ee/fitnesscartel">Links</a>', 'https://instagram.com'), 'Linktree');
    assert.equal(analyzer.detectLinkInBio('', 'https://linktr.ee/mybrand'), 'Linktree');
    assert.equal(analyzer.detectLinkInBio('<a href="https://beacons.ai/glowsalon">Bio</a>', 'https://glowsalon.co.za'), 'Beacons');
    assert.equal(analyzer.detectLinkInBio('<a href="https://taplink.cc/drsmith">Bio</a>', 'https://drsmith.co.za'), 'Taplink');
    assert.equal(analyzer.detectLinkInBio('<a href="https://mycustomsite.co.za">Home</a>', 'https://mycustomsite.co.za'), undefined);
  });

  it('detects niche booking and ERP portals across industries (Fitness, Beauty, Dining, Healthcare)', () => {
    // Fitness: Octiv / BoxChamp & Mindbody
    const octivHtml = '<iframe src="https://octivfitness.com/widget/schedule"></iframe>';
    assert.equal(analyzer.detectBookingEngine(octivHtml), 'Octiv (BoxChamp)');

    const mindbodyHtml = '<a href="https://clients.mindbodyonline.com/classic/ws">Book Class</a>';
    assert.equal(analyzer.detectBookingEngine(mindbodyHtml), 'Mindbody');

    // Beauty: Fresha & Booksy
    const freshaHtml = '<a href="https://www.fresha.com/a/the-hair-room-durban-north">Book Appointment</a>';
    assert.equal(analyzer.detectBookingEngine(freshaHtml), 'Fresha');

    // Dining: Dineplan
    const dineplanHtml = '<div id="dineplan-widget" data-restaurant-id="12345"></div>';
    assert.equal(analyzer.detectBookingEngine(dineplanHtml), 'Dineplan');

    // Healthcare: RecoMed
    const recomedHtml = '<a href="https://www.recomed.co.za/dentist/dr-naidoo/">Book Online</a>';
    assert.equal(analyzer.detectBookingEngine(recomedHtml), 'RecoMed');
  });

  it('detects South African payment gateways', () => {
    assert.equal(analyzer.detectPaymentGateway('<script src="https://www.payfast.co.za/onsite/engine.js"></script>'), 'PayFast');
    assert.equal(analyzer.detectPaymentGateway('<script src="https://js.yoco.com/sdk/v1/yoco-sdk.js"></script>'), 'Yoco');
    assert.equal(analyzer.detectPaymentGateway('<a href="https://pay.ozow.com">Pay via EFT</a>'), 'Ozow');
    assert.equal(analyzer.detectPaymentGateway('<script src="https://js.paystack.co/v1/inline.js"></script>'), 'Paystack');
  });

  it('accurately classifies sales funnel architecture (Fragmented, Manual, Unified)', () => {
    // Fragmented: Linktree + Octiv
    const arch1 = analyzer.determineFunnelArchitecture('Linktree', 'Octiv (BoxChamp)', true, true, ['Meta Pixel'], true);
    assert.equal(arch1, 'fragmented_external_stack');

    // Manual friction: No booking, no whatsapp, no form
    const arch2 = analyzer.determineFunnelArchitecture(undefined, undefined, false, false, [], true);
    assert.equal(arch2, 'manual_friction_heavy');

    // Unified: Custom domain, booking engine, whatsapp, Meta pixel
    const arch3 = analyzer.determineFunnelArchitecture(undefined, 'Octiv (BoxChamp)', true, true, ['Meta Pixel', 'Google Analytics 4'], true);
    assert.equal(arch3, 'unified_optimized_hub');
  });

  it('generates a tailored commercial business case for prospects using Linktree & Octiv (e.g. Fitness Cartel)', async () => {
    const auditOutput = await auditor.generateAudit({
      businessName: 'Fitness Cartel',
      category: 'Fitness',
      area: 'Umhlanga',
      websiteUrl: 'https://fitnesscartel.co.za',
      rating: 4.9,
      reviewCount: 42,
      technicalAudit: {
        hasHttps: true,
        hasResponsiveViewport: true,
        hasContactForm: true,
        hasBookingSystem: true,
        hasWhatsappLink: true,
        socialLinks: { instagram: 'https://instagram.com/fitnesscartel' },
        analyticsDetected: [],
        hasFavicon: true,
        funnelTechStack: {
          linkInBioTool: 'Linktree',
          bookingEngine: 'Octiv (BoxChamp)',
          leadCaptureChannels: ['WhatsApp Direct', 'Instagram DM'],
          paymentGateway: 'PayFast',
          analyticsRetargeting: [],
          currentArchitecture: 'fragmented_external_stack',
        },
      },
    });

    assert.ok(auditOutput.businessCase, 'Business case must be generated');
    const bc = auditOutput.businessCase!;
    assert.ok(bc.currentWorkflowSummary.includes('Linktree'), 'Workflow summary must mention Linktree');
    assert.ok(bc.currentWorkflowSummary.includes('Octiv'), 'Workflow summary must mention Octiv');
    assert.ok(bc.identifiedGaps.some((g) => g.includes('Linktree')), 'Must identify Linktree drop-off gap');
    assert.ok(bc.identifiedGaps.some((g) => g.includes('Octiv')), 'Must identify Octiv portal disconnect gap');
    assert.ok(bc.proposedCentralizedSolution.includes('Branded Digital Hub'), 'Must propose unified hub');
    assert.ok(bc.estimatedMonthlyRevenueImpactZAR > 0, 'Must calculate estimated monthly revenue impact');

    // Verify scripts reference the specific tech stack
    assert.ok(
      auditOutput.multiChannelScripts?.email.body.includes('Linktree') ||
      auditOutput.multiChannelScripts?.email.subject.includes('Linktree') ||
      auditOutput.multiChannelScripts?.primaryAuditCallout?.includes('Linktree'),
      'Outreach scripts must reference the prospect stack'
    );
  });

  it('renders sales funnel diagnostic and business case in printable proposal PDF report', () => {
    const lead: Business = {
      id: 'lead_fc_test',
      name: 'Fitness Cartel',
      category: 'Fitness',
      area: 'Umhlanga',
      phone: '+27 31 561 9900',
      email: 'info@fitnesscartel.co.za',
      website: 'https://fitnesscartel.co.za',
      socials: { instagram: 'https://instagram.com/fitnesscartel' },
      funnelStage: 'outreach',
      opportunityScore: 88,
      estimatedDealValue: 24000,
      scrapedAt: new Date().toISOString(),
      source: 'pipeline',
      technicalAudit: {
        hasHttps: true,
        hasResponsiveViewport: true,
        hasContactForm: true,
        hasBookingSystem: true,
        hasWhatsappLink: true,
        socialLinks: { instagram: 'https://instagram.com/fitnesscartel' },
        analyticsDetected: ['Meta Pixel'],
        hasFavicon: true,
        funnelTechStack: {
          linkInBioTool: 'Linktree',
          bookingEngine: 'Octiv (BoxChamp)',
          leadCaptureChannels: ['WhatsApp Direct', 'Instagram DM'],
          paymentGateway: 'PayFast',
          analyticsRetargeting: ['Meta Pixel'],
          currentArchitecture: 'fragmented_external_stack',
        },
        businessCase: {
          headline: 'Centralized Touchpoint & Workflow Blueprint for Fitness Cartel',
          currentWorkflowSummary: 'Instagram Bio (@fitnesscartel) ➔ Linktree Landing ➔ External Octiv Portal & Manual WhatsApp',
          identifiedGaps: [
            'Linktree Drop-off friction: 40-50% lost social visitors',
            'Octiv portal disconnect: Loses Meta Pixel retargeting',
          ],
          commercialFrictionPoints: ['40%+ mobile drop-off rate on external redirects'],
          proposedCentralizedSolution: 'A single high-converting Branded Digital Hub unifying Octiv trial booking and WhatsApp intake.',
          projectedMonthlyRecoveredLeads: '+18 to +32 monthly trial signups',
          estimatedMonthlyRevenueImpactZAR: 33600,
          paybackPeriodDays: 14,
          strategicPitchHook: 'We noticed on Instagram that Fitness Cartel routes members through Linktree to Octiv...',
        },
      },
    };

    const htmlReport = PdfReportGenerator.generateHtmlReport(lead);
    assert.ok(htmlReport.includes('Sales Funnel & Multi-Channel Workflow Diagnostic'), 'Report must include Funnel Diagnostic table');
    assert.ok(htmlReport.includes('Linktree'), 'Report must display Linktree');
    assert.ok(
      htmlReport.includes('33,600') || htmlReport.includes('33 600') || htmlReport.includes('33600'),
      'Report must display revenue impact'
    );
  });
});
