import { Business } from '../types/business.js';

export interface ReportOptions {
  agencyName?: string;
  agencyEmail?: string;
  agencyPhone?: string;
}

export class PdfReportGenerator {
  /**
   * Generates a stand-alone, print-optimized HTML technical audit report
   */
  public static generateHtmlReport(lead: Business, options: ReportOptions = {}): string {
    const agencyName = options.agencyName || 'LeadGremlin Growth Engine';
    const agencyEmail = options.agencyEmail || 'outreach@leadgremlin.co.za';
    const agencyPhone = options.agencyPhone || '+27 31 561 1000';

    const audit = lead.technicalAudit;
    const score = lead.opportunityScore || 75;
    const seoScore = audit?.seoScore ?? 50;
    const estValue = lead.estimatedDealValue ? lead.estimatedDealValue.toLocaleString('en-US') : '18,500';
    const scripts = lead.aiPitchScripts;

    const issues = lead.notes?.includes('Audit:')
      ? lead.notes.replace('Audit:', '').split('|').map((s) => s.trim())
      : [
          !audit?.hasWhatsappLink ? 'Missing WhatsApp 1-click lead capture widget' : null,
          !audit?.hasBookingSystem ? 'No automated online booking engine installed' : null,
          !audit?.analyticsDetected || audit.analyticsDetected.length === 0 ? 'Missing conversion analytics (GA4 / Meta Pixel)' : null,
          !audit?.hasResponsiveViewport ? 'Mobile layout viewport optimization required' : null,
          !audit?.hasHttps ? 'Insecure HTTP protocol connection' : null,
        ].filter(Boolean) as string[];

    const dateStr = new Date().toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const recommendations = [
      !audit?.hasWhatsappLink ? 'Deploy automated 24/7 WhatsApp lead capture widget with instant response' : null,
      !audit?.hasBookingSystem ? 'Install custom responsive online booking engine for after-hours scheduling' : null,
      !audit?.analyticsDetected || audit.analyticsDetected.length === 0 ? 'Implement Google Analytics 4 & Meta Pixel conversion tracking' : null,
      !audit?.hasResponsiveViewport ? 'Implement mobile-first responsive viewport design' : null,
      !audit?.hasHttps ? 'Install SSL certificate and enforce HTTPS security' : null,
      audit?.seoScore !== undefined && audit.seoScore < 60 ? 'Optimize on-page meta tags, schema markup & search visibility' : null,
    ].filter(Boolean) as string[];

    if (recommendations.length === 0) {
      recommendations.push('Deploy automated 24/7 WhatsApp lead capture widget');
      recommendations.push('Install custom responsive online booking engine');
      recommendations.push('Set up GA4 & Meta Pixel conversion tracking');
      recommendations.push('Implement mobile-first landing page redesign');
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Technical Audit Report - ${lead.name}</title>
  <style>
    :root {
      --primary: #2563eb;
      --dark: #0f172a;
      --card-bg: #f8fafc;
      --border: #e2e8f0;
      --danger: #dc2626;
      --warning: #d97706;
      --success: #16a34a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: var(--dark);
      background: #ffffff;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand-title { font-size: 24px; font-weight: 800; color: var(--primary); }
    .business-title { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
    .meta-text { color: #64748b; font-size: 14px; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    
    .score-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
    }
    .score-val { font-size: 48px; font-weight: 900; line-height: 1; margin: 10px 0; }
    .score-high { color: var(--danger); }
    .score-med { color: var(--warning); }
    .score-good { color: var(--success); }

    .section { margin-bottom: 32px; }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 8px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tech-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .tech-table th, .tech-table td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14px; }
    .tech-table th { background: #f1f5f9; font-weight: 600; }

    .issue-list, .rec-list { list-style: none; }
    .issue-list li {
      background: #fef2f2;
      border-left: 4px solid var(--danger);
      padding: 10px 14px;
      margin-bottom: 8px;
      border-radius: 0 6px 6px 0;
      font-size: 14px;
    }
    .rec-list li {
      background: #f0fdf4;
      border-left: 4px solid var(--success);
      padding: 10px 14px;
      margin-bottom: 8px;
      border-radius: 0 6px 6px 0;
      font-size: 14px;
    }

    .val-banner {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      color: #ffffff;
      padding: 24px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }
    .val-amount { font-size: 32px; font-weight: 800; color: #38bdf8; }

    .script-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
    }

    .footer {
      border-top: 1px solid var(--border);
      padding-top: 20px;
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      body { padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Print Button Bar -->
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <!-- Header -->
  <header class="header">
    <div>
      <h1 class="business-title">${lead.name}</h1>
      <p class="meta-text">Target Area: <strong>${lead.area}</strong> | Category: <strong>${lead.category}</strong></p>
      <p class="meta-text">Website: ${lead.website ? `<a href="${lead.website}">${lead.website}</a>` : 'None / Not Provided'}</p>
    </div>
    <div style="text-align: right;">
      <div class="brand-title">${agencyName}</div>
      <p class="meta-text">Date: ${dateStr}</p>
      <p class="meta-text">${agencyEmail} | ${agencyPhone}</p>
    </div>
  </header>

  <!-- Score Cards -->
  <div class="grid-2">
    <div class="score-card">
      <div class="meta-text">LEAD OPPORTUNITY SCORE</div>
      <div class="score-val ${score >= 70 ? 'score-high' : score >= 40 ? 'score-med' : 'score-good'}">${score}/100</div>
      <div class="meta-text">${score >= 70 ? '🔥 High Opportunity (Website Overhaul & Lead Intake Fix Required)' : '⚡ Medium Opportunity'}</div>
    </div>
    <div class="score-card">
      <div class="meta-text">TECHNICAL SEO DIAGNOSTIC SCORE</div>
      <div class="score-val score-good">${seoScore}/100</div>
      <div class="meta-text">Based on Meta Tags, Mobile Viewport & Security</div>
    </div>
  </div>

  <!-- Technical Audit Table -->
  <div class="section">
    <h2 class="section-title">Technical Infrastructure Diagnostic</h2>
    <table class="tech-table">
      <thead>
        <tr>
          <th>Technical Metric</th>
          <th>Status</th>
          <th>Impact</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>SSL Security (HTTPS)</td>
          <td>${audit?.hasHttps ? '✓ Secure' : '❌ Insecure (HTTP)'}</td>
          <td>${audit?.hasHttps ? 'Low Risk' : 'High - Google Ranks Insecure Sites Lower'}</td>
        </tr>
        <tr>
          <td>CMS Platform</td>
          <td>${audit?.cms || 'Custom / Standard HTML'}</td>
          <td>Platform Infrastructure</td>
        </tr>
        <tr>
          <td>Analytics & Conversion Pixels</td>
          <td>${audit?.analyticsDetected && audit.analyticsDetected.length > 0 ? audit.analyticsDetected.join(', ') : '❌ None Detected'}</td>
          <td>${audit?.analyticsDetected && audit.analyticsDetected.length > 0 ? 'Tracked' : 'Critical - Ad Budget & Visitor Leak'}</td>
        </tr>
        <tr>
          <td>WhatsApp Instant Lead CTA</td>
          <td>${audit?.hasWhatsappLink ? '✓ Installed' : '❌ Missing Widget'}</td>
          <td>${audit?.hasWhatsappLink ? 'Captured' : 'High - Missing Weekly Bookings'}</td>
        </tr>
        <tr>
          <td>Online Booking Portal</td>
          <td>${audit?.hasBookingSystem ? '✓ Installed' : '❌ Missing Engine'}</td>
          <td>${audit?.hasBookingSystem ? 'Automated' : 'High - After-Hours Lead Loss'}</td>
        </tr>
        <tr>
          <td>Mobile Responsive Viewport</td>
          <td>${audit?.hasResponsiveViewport ? '✓ Responsive' : '❌ Non-Responsive'}</td>
          <td>Mobile UX Conversion</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Project Valuation Banner -->
  <div class="val-banner">
    <div>
      <div style="font-size: 14px; opacity: 0.9;">ESTIMATED POTENTIAL PROJECT VALUE</div>
      <div style="font-size: 13px; opacity: 0.7;">Based on required sales funnel consolidation & automated booking installation</div>
    </div>
    <div class="val-amount">R${estValue}</div>
  </div>

  <!-- Sales Funnel & Workflow Diagnostic -->
  ${
    audit?.funnelTechStack
      ? `
  <div class="section">
    <h2 class="section-title">Sales Funnel & Multi-Channel Workflow Diagnostic</h2>
    <table class="tech-table">
      <thead>
        <tr>
          <th>Funnel Component</th>
          <th>Detected Technology</th>
          <th>Commercial Analysis</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Social Media Link-in-Bio</td>
          <td>${audit.funnelTechStack.linkInBioTool ? `⚠️ ${audit.funnelTechStack.linkInBioTool}` : '✓ Direct Website / Custom Hub'}</td>
          <td>${audit.funnelTechStack.linkInBioTool ? 'High Friction: 40-50% of social visitors drop off on multi-link lists' : 'Optimized Direct Capture'}</td>
        </tr>
        <tr>
          <td>Niche Booking Engine</td>
          <td>${audit.funnelTechStack.bookingEngine ? `⚡ ${audit.funnelTechStack.bookingEngine}` : '❌ No Automated Booking Engine'}</td>
          <td>${audit.funnelTechStack.bookingEngine ? 'External Redirect: Disconnects Meta Pixel & loses brand immersion' : 'High Lead Loss: After-hours inquiries bounce'}</td>
        </tr>
        <tr>
          <td>Lead Capture Channels</td>
          <td>${audit.funnelTechStack.leadCaptureChannels.join(', ')}</td>
          <td>Multi-Channel Inbound Flow</td>
        </tr>
        <tr>
          <td>Payment & Checkout Gateway</td>
          <td>${audit.funnelTechStack.paymentGateway ? `💳 ${audit.funnelTechStack.paymentGateway}` : 'Manual EFT / In-Person'}</td>
          <td>Transaction Intake Rails</td>
        </tr>
        <tr>
          <td>Funnel Architecture</td>
          <td><strong style="text-transform:uppercase; color:var(--primary);">${audit.funnelTechStack.currentArchitecture.replace(/_/g, ' ')}</strong></td>
          <td>Funnel Maturity Grade</td>
        </tr>
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  <!-- Tailored Commercial Business Case -->
  ${
    audit?.businessCase || lead.businessCase
      ? `
  <div class="section">
    <h2 class="section-title">Tailored Commercial Business Case</h2>
    <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 10px; color: var(--primary);">${(audit?.businessCase || lead.businessCase)?.headline}</h3>
      <p style="font-size: 14px; margin-bottom: 12px;"><strong>Current Customer Journey:</strong> ${(audit?.businessCase || lead.businessCase)?.currentWorkflowSummary}</p>
      
      <div style="margin-bottom: 14px;">
        <strong style="font-size: 13px; text-transform: uppercase; color: var(--danger);">Identified Funnel Friction & Gaps:</strong>
        <ul style="margin: 6px 0 0 18px; font-size: 13px; color: #475569;">
          ${(audit?.businessCase || lead.businessCase)?.identifiedGaps.map(g => `<li style="margin-bottom:4px;">${g}</li>`).join('')}
        </ul>
      </div>

      <div style="background: #f0fdf4; border-left: 4px solid var(--success); padding: 12px 14px; border-radius: 0 6px 6px 0; margin-bottom: 12px;">
        <strong style="font-size: 13px; color: #166534; text-transform: uppercase;">Proposed Centralized Touchpoint Solution:</strong>
        <p style="font-size: 13px; color: #14532d; margin-top: 4px;">${(audit?.businessCase || lead.businessCase)?.proposedCentralizedSolution}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; font-size: 13px;">
        <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
          <div style="color: #64748b; font-size: 11px; text-transform: uppercase;">Projected Recovered Inquiries</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--primary); margin-top: 2px;">${(audit?.businessCase || lead.businessCase)?.projectedMonthlyRecoveredLeads}</div>
        </div>
        <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
          <div style="color: #64748b; font-size: 11px; text-transform: uppercase;">Est. Monthly Revenue Impact</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--success); margin-top: 2px;">+R${((audit?.businessCase || lead.businessCase)?.estimatedMonthlyRevenueImpactZAR || 25000).toLocaleString('en-US')} / mo</div>
        </div>
      </div>
    </div>
  </div>
  `
      : ''
  }

  <!-- Identified Gaps & Recommendations -->
  <div class="grid-2">
    <div>
      <h2 class="section-title">Identified Gaps</h2>
      <ul class="issue-list">
        ${issues.map((issue) => `<li>⚠️ ${issue}</li>`).join('\n')}
      </ul>
    </div>
    <div>
      <h2 class="section-title">Recommended Upgrades</h2>
      <ul class="rec-list">
        ${recommendations.map((rec) => `<li>✓ ${rec}</li>`).join('\n')}
      </ul>
    </div>
  </div>

  ${
    scripts?.email
      ? `
  <!-- Outreach Pitch Blueprint -->
  <div class="section">
    <h2 class="section-title">Proposed Sales Outreach Script (${scripts.nicheAngle || 'Personalized'})</h2>
    <div class="script-box"><strong>Subject: ${scripts.email.subject}</strong>\n\n${scripts.email.body}</div>
  </div>
  `
      : ''
  }

  <!-- Footer -->
  <footer class="footer">
    <div>LeadGremlin Sales Funnel Audit & Technical Engine Report</div>
    <div>Page 1 of 1</div>
  </footer>

</body>
</html>`;
  }
}
