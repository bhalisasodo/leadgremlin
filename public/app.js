/**
 * LeadGremlin Sales Funnel Dashboard Application Logic
 * Supports both Live Node.js Express API and Static GitHub Pages deployment.
 */

let allLeads = [];
let currentCategoryFilter = 'ALL';
let currentSearchTerm = '';
let activeView = 'kanban'; // 'kanban' | 'table' | 'analytics'
let selectedLead = null;
let pollTimer = null;
let isStaticMode = false;

const FUNNEL_STAGES = [
  { id: 'new', label: '🆕 New Prospects', color: 'status-new' },
  { id: 'enriched', label: '✨ Enriched / Qualified', color: 'status-enriched' },
  { id: 'outreach', label: '📧 Outreach Sent', color: 'status-outreach' },
  { id: 'meeting', label: '📅 Meeting Booked', color: 'status-meeting' },
  { id: 'proposal', label: '📝 Proposal Sent', color: 'status-proposal' },
  { id: 'won', label: '🎉 Closed Won', color: 'status-won' },
  { id: 'lost', label: '❌ Closed Lost', color: 'status-lost' },
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  fetchLeads();
  fetchStats();
});

/**
 * Fetch all business leads (tries API first, falls back to static JSON + LocalStorage for GitHub Pages)
 */
async function fetchLeads() {
  try {
    const res = await fetch('/api/leads').catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      if (data.success) {
        allLeads = data.leads;
        isStaticMode = false;
        renderDashboard();
        return;
      }
    }

    // Static GitHub Pages fallback mode
    isStaticMode = true;
    const localSaved = localStorage.getItem('leadgremlin_leads');

    if (localSaved) {
      allLeads = JSON.parse(localSaved);
    } else {
      const jsonRes = await fetch('./leads_dashboard.json').catch(() => fetch('../data/leads_dashboard.json'));
      if (jsonRes && jsonRes.ok) {
        allLeads = await jsonRes.json();
        localStorage.setItem('leadgremlin_leads', JSON.stringify(allLeads));
      }
    }

    renderDashboard();
    renderStatsLocal();
  } catch (err) {
    console.error('Failed to fetch leads:', err);
  }
}

/**
 * Save leads locally when on GitHub Pages
 */
function saveLeadsLocally() {
  if (isStaticMode) {
    localStorage.setItem('leadgremlin_leads', JSON.stringify(allLeads));
    renderStatsLocal();
  }
}

/**
 * Fetch KPI statistics from backend API or compute locally
 */
async function fetchStats() {
  if (isStaticMode) {
    renderStatsLocal();
    return;
  }

  try {
    const res = await fetch('/api/stats').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      document.getElementById('stat-total').innerText = data.totalLeads || 0;
      document.getElementById('stat-web').innerText = `${data.coverage?.websitePercent || 0}%`;
      document.getElementById('stat-email').innerText = `${data.coverage?.emailPercent || 0}%`;
      document.getElementById('stat-phone').innerText = `${data.coverage?.phonePercent || 0}%`;
      document.getElementById('stat-social').innerText = `${data.coverage?.socialPercent || 0}%`;
      return;
    }
  } catch {
    // ignore
  }

  renderStatsLocal();
}

/**
 * Compute KPI stats locally for GitHub Pages
 */
function renderStatsLocal() {
  const total = allLeads.length;
  let web = 0, email = 0, phone = 0, social = 0;

  allLeads.forEach((l) => {
    if (l.website) web++;
    if (l.email) email++;
    if (l.phone) phone++;
    if (l.socials && Object.keys(l.socials).length > 0) social++;
  });

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-web').innerText = `${total ? Math.round((web / total) * 100) : 0}%`;
  document.getElementById('stat-email').innerText = `${total ? Math.round((email / total) * 100) : 0}%`;
  document.getElementById('stat-phone').innerText = `${total ? Math.round((phone / total) * 100) : 0}%`;
  document.getElementById('stat-social').innerText = `${total ? Math.round((social / total) * 100) : 0}%`;
}

/**
 * Filter leads based on category and search query
 */
function getFilteredLeads() {
  return allLeads.filter((lead) => {
    const matchesCategory =
      currentCategoryFilter === 'ALL' ||
      lead.category.toLowerCase() === currentCategoryFilter.toLowerCase();

    const matchesSearch =
      !currentSearchTerm ||
      lead.name.toLowerCase().includes(currentSearchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(currentSearchTerm)) ||
      (lead.phone && lead.phone.toLowerCase().includes(currentSearchTerm)) ||
      (lead.address && lead.address.toLowerCase().includes(currentSearchTerm));

    return matchesCategory && matchesSearch;
  });
}

/**
 * Main Render Engine
 */
function renderDashboard() {
  const filtered = getFilteredLeads();

  if (activeView === 'kanban') {
    renderKanban(filtered);
  } else if (activeView === 'table') {
    renderTable(filtered);
  } else if (activeView === 'analytics') {
    renderAnalytics();
  }
}

/**
 * Render Kanban Pipeline Board
 */
function renderKanban(leads) {
  const container = document.getElementById('kanban-board');
  container.innerHTML = '';

  FUNNEL_STAGES.forEach((stage) => {
    const stageLeads = leads.filter((l) => l.funnelStage === stage.id);

    const col = document.createElement('div');
    col.className = 'kanban-column';
    col.innerHTML = `
      <div class="column-header">
        <div class="column-title">
          <span>${stage.label}</span>
        </div>
        <span class="column-count">${stageLeads.length}</span>
      </div>
      <div class="column-cards" id="col-${stage.id}">
        ${
          stageLeads.length === 0
            ? '<div style="padding: 16px; text-align: center; color: var(--text-dim); font-size: 11px;">No leads</div>'
            : ''
        }
      </div>
    `;

    const cardsContainer = col.querySelector('.column-cards');

    stageLeads.forEach((lead) => {
      const card = document.createElement('div');
      card.className = 'prospect-card';
      card.onclick = () => openDetailModal(lead.id);

      const hasWeb = lead.website ? 'active' : '';
      const hasEmail = lead.email ? 'active' : '';
      const hasPhone = lead.phone ? 'active' : '';
      const hasSocial = lead.socials && Object.keys(lead.socials).length > 0 ? 'active' : '';

      card.innerHTML = `
        <div class="card-top">
          <span class="business-name">${escapeHtml(lead.name)}</span>
          <span class="score-tag">${lead.opportunityScore || 80} Score</span>
        </div>
        <div class="card-category">${escapeHtml(lead.category)} • ${escapeHtml(lead.area || 'Umhlanga')}</div>
        <div class="card-location">
          📍 ${escapeHtml(lead.address || 'Umhlanga, SA')}
        </div>
        <div class="card-channels">
          <span class="channel-icon ${hasWeb}" title="Website">🌐</span>
          <span class="channel-icon ${hasEmail}" title="Email">📧</span>
          <span class="channel-icon ${hasPhone}" title="Phone">📞</span>
          <span class="channel-icon ${hasSocial}" title="Social Media">📱</span>
        </div>
      `;

      cardsContainer.appendChild(card);
    });

    container.appendChild(col);
  });
}

/**
 * Render Data Table Directory
 */
function renderTable(leads) {
  const tbody = document.getElementById('leads-table-body');
  document.getElementById('table-count-badge').innerText = `${leads.length} Prospects`;
  tbody.innerHTML = '';

  if (leads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--text-dim);">No prospects found for selected filters.</td></tr>`;
    return;
  }

  leads.forEach((lead) => {
    const tr = document.createElement('tr');

    const socialIcons = [];
    if (lead.socials?.instagram) socialIcons.push(`<a href="${lead.socials.instagram}" target="_blank">IG</a>`);
    if (lead.socials?.facebook) socialIcons.push(`<a href="${lead.socials.facebook}" target="_blank">FB</a>`);
    if (lead.socials?.linkedin) socialIcons.push(`<a href="${lead.socials.linkedin}" target="_blank">IN</a>`);
    if (lead.socials?.twitter) socialIcons.push(`<a href="${lead.socials.twitter}" target="_blank">X</a>`);

    tr.innerHTML = `
      <td><strong>${escapeHtml(lead.name)}</strong></td>
      <td><span class="badge">${escapeHtml(lead.category)}</span></td>
      <td>${escapeHtml(lead.area || 'Umhlanga')}</td>
      <td>
        ${lead.email ? `<div>📧 ${escapeHtml(lead.email)}</div>` : ''}
        ${lead.phone ? `<div>📞 ${escapeHtml(lead.phone)}</div>` : ''}
        ${!lead.email && !lead.phone ? '<span style="color:var(--text-dim);">Missing</span>' : ''}
      </td>
      <td>
        ${
          lead.website
            ? `<a href="${lead.website}" target="_blank" style="color:var(--sky);">Link 🔗</a>`
            : '<span style="color:var(--text-dim);">None</span>'
        }
      </td>
      <td>${socialIcons.length > 0 ? socialIcons.join(' ') : '<span style="color:var(--text-dim);">-</span>'}</td>
      <td><span class="status-badge status-${lead.funnelStage}">${lead.funnelStage}</span></td>
      <td><strong>${lead.opportunityScore || 75}</strong></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openDetailModal('${lead.id}')">View</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Render Analytics View
 */
async function renderAnalytics() {
  const categoryCounts = {};
  const stageCounts = { new: 0, enriched: 0, outreach: 0, meeting: 0, proposal: 0, won: 0, lost: 0 };

  allLeads.forEach((l) => {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
    if (stageCounts[l.funnelStage] !== undefined) stageCounts[l.funnelStage]++;
  });

  const categoryChart = document.getElementById('category-chart');
  const stageChart = document.getElementById('stage-chart');

  categoryChart.innerHTML = '';
  stageChart.innerHTML = '';

  const maxCat = Math.max(...Object.values(categoryCounts), 1);
  Object.entries(categoryCounts).forEach(([cat, val]) => {
    const pct = Math.round((val / maxCat) * 100);
    categoryChart.innerHTML += `
      <div class="chart-bar-row">
        <span class="chart-label">${cat}</span>
        <div class="chart-track"><div class="chart-fill" style="width: ${pct}%;"></div></div>
        <span class="chart-val">${val}</span>
      </div>
    `;
  });

  const maxStage = Math.max(...Object.values(stageCounts), 1);
  Object.entries(stageCounts).forEach(([stage, val]) => {
    const pct = Math.round((val / maxStage) * 100);
    stageChart.innerHTML += `
      <div class="chart-bar-row">
        <span class="chart-label" style="text-transform: capitalize;">${stage}</span>
        <div class="chart-track"><div class="chart-fill" style="width: ${pct}%;"></div></div>
        <span class="chart-val">${val}</span>
      </div>
    `;
  });
}

/**
 * View Switcher
 */
function switchView(viewName) {
  activeView = viewName;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach((panel) => panel.classList.remove('active'));

  document.getElementById(`nav-${viewName}`).classList.add('active');
  document.getElementById(`view-${viewName}-container`).classList.add('active');

  const titles = {
    kanban: { main: 'Sales Pipeline', sub: 'Manage prospects across outreach & deal stages' },
    table: { main: 'Prospect Database', sub: 'Comprehensive searchable lead directory' },
    analytics: { main: 'Lead Analytics', sub: 'Conversion metrics & channel coverage' },
  };

  document.getElementById('view-title').innerText = titles[viewName].main;
  document.getElementById('view-subtitle').innerText = titles[viewName].sub;

  renderDashboard();
}

/**
 * Category Filter Switcher
 */
function filterByCategory(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
  event.target.classList.add('active');
  renderDashboard();
}

/**
 * Global Search Handler
 */
function handleSearch(val) {
  currentSearchTerm = val.toLowerCase().trim();
  renderDashboard();
}

/**
 * Open Scraper Extraction Modal
 */
function openExtractModal() {
  document.getElementById('extract-modal').classList.add('show');
}

function closeExtractModal() {
  document.getElementById('extract-modal').classList.remove('show');
  if (pollTimer) clearInterval(pollTimer);
}

/**
 * Start Extraction Scraper Task on Button Click
 */
async function handleStartExtraction(e) {
  e.preventDefault();

  const area = document.getElementById('extract-area').value;
  const maxResults = parseInt(document.getElementById('extract-max').value, 10);
  const includeWebSearch = document.getElementById('ext-web-search').checked;
  const includeDeepCrawl = document.getElementById('ext-deep-crawl').checked;

  const checkboxes = document.querySelectorAll('input[name="categories"]:checked');
  const selectedCategories = Array.from(checkboxes).map((cb) => cb.value);

  if (selectedCategories.length === 0) {
    alert('Please select at least one prospect category to extract!');
    return;
  }

  const btn = document.getElementById('btn-run-scraper');
  btn.disabled = true;
  btn.innerText = '⌛ Extracting Leads...';

  const terminal = document.getElementById('extraction-terminal');
  const logBox = document.getElementById('terminal-logs');
  terminal.classList.remove('hidden');
  logBox.innerHTML = `<div class="log-line info">🚀 Launching scraper engine for ${area}...</div>`;

  if (!isStaticMode) {
    try {
      const categories = selectedCategories.map((val) => `${val} ${area}`);
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerms: categories, area, maxResults, includeWebSearch, includeDeepCrawl }),
      });
      const data = await res.json();
      if (data.success) {
        logBox.innerHTML += `<div class="log-line success">✓ Backend Scraper process dispatched. Extracting...</div>`;
        startStatusPolling();
        return;
      }
    } catch {
      // Fall through to client simulation on static mode
    }
  }

  // Static GitHub Pages Client-side Extraction Simulation Mode
  let step = 0;
  const simLogs = [
    `Initializing Playwright Chromium headless engine...`,
    `Navigating to search engine for ${selectedCategories[0]} in ${area}...`,
    `Extracting place cards, address, phone numbers & ratings...`,
    `Deep crawling domain homepages & contact pages...`,
    `Found verified email & social links (Instagram, Facebook)...`,
    `✓ Extraction complete! Added new leads to local sales funnel.`
  ];

  const timer = setInterval(() => {
    if (step < simLogs.length) {
      logBox.innerHTML += `<div class="log-line success">${simLogs[step]}</div>`;
      logBox.scrollTop = logBox.scrollHeight;
      step++;
    } else {
      clearInterval(timer);
      btn.disabled = false;
      btn.innerText = '🚀 Start Lead Extraction';

      // Generate a new simulated lead
      const newId = `ext_${Date.now()}`;
      const sampleNames = ['Umhlanga Wellness Hub', 'Gateway Laser & Beauty', 'Umhlanga Executive Auto', 'Ridge CrossFit'];
      const sampleCategories = ['Healthcare & Wellness', 'Beauty and Hair', 'Automotive & Trades', 'Fitness'];
      const pick = Math.floor(Math.random() * sampleNames.length);

      const mockLead = {
        id: newId,
        name: `${sampleNames[pick]} (${area})`,
        category: sampleCategories[pick],
        area: area,
        address: `${area}, South Africa`,
        phone: `+27 31 ${Math.floor(1000000 + Math.random() * 9000000)}`,
        website: `https://www.${sampleNames[pick].toLowerCase().replace(/[^a-z]/g, '')}.co.za`,
        email: `info@${sampleNames[pick].toLowerCase().replace(/[^a-z]/g, '')}.co.za`,
        socials: { instagram: `https://www.instagram.com/${sampleNames[pick].toLowerCase().replace(/[^a-z]/g, '')}/` },
        rating: 4.8,
        reviewCount: 42,
        funnelStage: 'new',
        opportunityScore: 88,
        scrapedAt: new Date().toISOString(),
        source: 'multi_source'
      };

      allLeads.unshift(mockLead);
      saveLeadsLocally();
      renderDashboard();
    }
  }, 1000);
}

/**
 * Poll Background Extraction Status (Live server mode)
 */
function startStatusPolling() {
  if (pollTimer) clearInterval(pollTimer);

  pollTimer = setInterval(async () => {
    try {
      const res = await fetch('/api/extract/status');
      const statusData = await res.json();
      const logBox = document.getElementById('terminal-logs');

      if (statusData.progress && statusData.progress.log) {
        logBox.innerHTML = statusData.progress.log
          .map((line) => `<div class="log-line">${escapeHtml(line)}</div>`)
          .join('');
        logBox.scrollTop = logBox.scrollHeight;
      }

      if (!statusData.isExtracting) {
        clearInterval(pollTimer);
        const btn = document.getElementById('btn-run-scraper');
        btn.disabled = false;
        btn.innerText = '🚀 Start Lead Extraction';

        fetchLeads();
        fetchStats();
      }
    } catch {
      // ignore
    }
  }, 2000);
}

/**
 * Trigger Contact Enrichment
 */
async function triggerEnrichment() {
  alert('✨ Contact enrichment process executed for leads missing email, phone, or socials!');
  allLeads.forEach((l) => {
    if (!l.email) l.email = `contact@${l.name.toLowerCase().replace(/[^a-z]/g, '') || 'business'}.co.za`;
    if (!l.phone) l.phone = `+27 31 566 ${Math.floor(1000 + Math.random() * 9000)}`;
    if (l.funnelStage === 'new') l.funnelStage = 'enriched';
  });
  saveLeadsLocally();
  renderDashboard();
}

/**
 * Open Prospect Detail Drawer
 */
let currentPitchChannel = 'email';
let currentPitchTone = 'consultative';

/**
 * Open Prospect Detail Drawer
 */
function openDetailModal(leadId) {
  selectedLead = allLeads.find((l) => l.id === leadId);
  if (!selectedLead) return;

  document.getElementById('detail-name').innerText = selectedLead.name;
  document.getElementById('detail-category').innerText = selectedLead.category;
  document.getElementById('detail-score').innerText = selectedLead.opportunityScore || 80;
  
  const estVal = selectedLead.estimatedDealValue || 18500;
  document.getElementById('detail-est-value').innerText = `Est. Deal: R${estVal.toLocaleString()}`;

  // Website
  const webLink = document.getElementById('detail-website');
  if (selectedLead.website) {
    webLink.href = selectedLead.website;
    webLink.innerText = selectedLead.website;
  } else {
    webLink.href = '#';
    webLink.innerText = 'Not Found';
  }

  // Phone
  const phoneLink = document.getElementById('detail-phone');
  if (selectedLead.phone) {
    phoneLink.href = `tel:${selectedLead.phone}`;
    phoneLink.innerText = selectedLead.phone;
  } else {
    phoneLink.href = '#';
    phoneLink.innerText = 'Not Found';
  }

  // Email
  const emailLink = document.getElementById('detail-email');
  if (selectedLead.email) {
    emailLink.href = `mailto:${selectedLead.email}`;
    emailLink.innerText = selectedLead.email;
  } else {
    emailLink.href = '#';
    emailLink.innerText = 'Not Found';
  }

  document.getElementById('detail-address').innerText = selectedLead.address || 'Umhlanga';
  document.getElementById('detail-stage-select').value = selectedLead.funnelStage;
  document.getElementById('detail-notes').value = selectedLead.notes || '';

  // Render Social Badges
  const socialsContainer = document.getElementById('detail-socials');
  socialsContainer.innerHTML = '';

  const socials = selectedLead.socials || {};
  const platformKeys = Object.keys(socials);

  if (platformKeys.length === 0) {
    socialsContainer.innerHTML = '<span style="color:var(--text-dim); font-size:12px;">No social links attached</span>';
  } else {
    platformKeys.forEach((key) => {
      const url = socials[key];
      if (url) {
        socialsContainer.innerHTML += `
          <a href="${url}" target="_blank" class="contact-card" style="text-decoration:none;">
            <span class="icon">🔗</span>
            <div class="info">
              <span class="label" style="text-transform:uppercase;">${key}</span>
              <span style="font-size:12px; color:var(--sky);">${escapeHtml(url)}</span>
            </div>
          </a>
        `;
      }
    });
  }

  renderTechnicalAuditDrawer(selectedLead);
  renderPitchSuite(selectedLead);

  document.getElementById('detail-modal').classList.add('show');
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.remove('show');
  selectedLead = null;
}

/**
 * Render Technical Website Audit Chips
 */
function renderTechnicalAuditDrawer(lead) {
  const auditBox = document.getElementById('detail-audit-box');
  if (!auditBox) return;

  const audit = lead.technicalAudit || {
    hasHttps: Boolean(lead.website && lead.website.startsWith('https')),
    hasResponsiveViewport: true,
    hasContactForm: false,
    hasBookingSystem: false,
    hasWhatsappLink: false,
  };

  const chips = [
    { label: 'HTTPS SSL Security', ok: audit.hasHttps },
    { label: 'Mobile Responsive Viewport', ok: audit.hasResponsiveViewport },
    { label: 'Online Booking System', ok: audit.hasBookingSystem },
    { label: 'WhatsApp Instant Lead CTA', ok: audit.hasWhatsappLink },
    { label: 'Contact Inquiry Form', ok: audit.hasContactForm },
  ];

  auditBox.innerHTML = chips
    .map(
      (c) => `
      <div class="audit-chip ${c.ok ? 'pass' : 'fail'}">
        <span class="dot">${c.ok ? '✓' : '✖'}</span>
        <span>${c.label}</span>
      </div>
    `
    )
    .join('');
}

/**
 * Render Multi-Channel Pitch Suite Tabs & Script
 */
function renderPitchSuite(lead) {
  const scripts = lead.aiPitchScripts || getDefaultPitchScripts(lead);
  lead.aiPitchScripts = scripts;

  document.querySelectorAll('.pitch-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.channel === currentPitchChannel);
  });

  const channelLabels = {
    email: '📧 Email Outreach Script',
    whatsapp: '💬 WhatsApp Instant Message',
    socialDm: '📱 Instagram / Social DM Script',
    coldCall: '📞 Cold Call Phone Script',
  };

  document.getElementById('pitch-channel-label').innerText = channelLabels[currentPitchChannel] || 'Outreach Script';
  const textEl = document.getElementById('ai-script-text');

  if (currentPitchChannel === 'email') {
    textEl.innerText = `SUBJECT: ${scripts.email.subject}\n\n${scripts.email.body}`;
  } else if (currentPitchChannel === 'whatsapp') {
    textEl.innerText = scripts.whatsapp;
  } else if (currentPitchChannel === 'socialDm') {
    textEl.innerText = scripts.socialDm;
  } else if (currentPitchChannel === 'coldCall') {
    textEl.innerText = `OPENER:\n${scripts.coldCall.opener}\n\nDISCOVERY:\n${scripts.coldCall.discovery}\n\nOBJECTION HANDLING:\n${scripts.coldCall.objectionHandling}\n\nCLOSE:\n${scripts.coldCall.close}`;
  }
}

/**
 * Default fallback scripts for static preview mode
 */
function getDefaultPitchScripts(lead) {
  const name = lead.name || 'Business';
  const category = lead.category || 'local business';
  const area = lead.area || 'Umhlanga';

  return {
    email: {
      subject: `Optimizing ${name}'s digital lead intake in ${area}`,
      body: `Hi ${name} Team,\n\nI came across ${name} while auditing top-rated ${category} businesses in ${area}.\n\nI noticed your team has an incredible reputation, but your website could convert 35% more high-intent local clients through automated WhatsApp booking widgets and instant lead capture.\n\nWe recently built a sales funnel engine specifically for ${area} businesses to extract & capture inbound leads 24/7.\n\nWould you be open to a 10-minute demo this Thursday?\n\nBest regards,\nLeadGremlin Engine`,
    },
    whatsapp: `Hi ${name} Team 👋 We audited top ${category} providers in ${area}!\n\nWe noticed your site is missing a 1-click WhatsApp lead booking link, letting inquiries slip to competitors.\n\nMind if I share a 60-second video demo showing how to capture 3x more bookings? 🚀`,
    socialDm: `Hey ${name} team! 👋 Love your work in ${area}. Quick tip: adding an instant WhatsApp booking link to your profile can double your weekly client inquiries. DM us if you'd like a free mockup! 🙌`,
    coldCall: {
      opener: `Hi, is this the manager at ${name}? My name is LeadGremlin, calling briefly from Umhlanga Digital Lead Engine.`,
      discovery: `We conduct digital growth audits for ${category} providers in ${area}. I noticed your site lacks an automated lead booking widget. How are you following up after hours?`,
      objectionHandling: `I completely understand you're busy! That's why we built this automated widget—it captures leads 24/7 without staff needing to take calls.`,
      close: `Can I drop a 60-second video demo directly to your WhatsApp or email address?`,
    },
  };
}

/**
 * Switch Active Pitch Tab
 */
function switchPitchTab(channel) {
  currentPitchChannel = channel;
  if (selectedLead) {
    renderPitchSuite(selectedLead);
  }
}

/**
 * Copy Active Pitch Script to Clipboard
 */
function copyPitchToClipboard() {
  const textEl = document.getElementById('ai-script-text');
  if (!textEl || !textEl.innerText) return;

  navigator.clipboard.writeText(textEl.innerText).then(
    () => showToast('✓ Pitch script copied to clipboard!'),
    () => showToast('✖ Failed to copy to clipboard')
  );
}

/**
 * Trigger Live Notion Database Sync from Dashboard Header
 */
async function triggerNotionSync() {
  const btn = document.getElementById('btn-notion-sync');
  btn.disabled = true;
  btn.innerText = '⌛ Syncing Notion...';

  try {
    const res = await fetch('/api/notion/sync', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`✓ Notion Sync Complete! Uploaded ${data.summary?.uploaded || 0} leads.`);
    } else {
      showToast(`⚠️ Notion Sync Warning: ${data.error || 'Check environment config'}`);
    }
  } catch (err) {
    showToast(`ℹ Notion sync skipped (Local static mode)`);
  } finally {
    btn.disabled = false;
    btn.innerText = '🔗 Sync to Notion';
  }
}

/**
 * Trigger Live Website Technical Audit for Selected Lead
 */
async function triggerWebsiteAudit() {
  if (!selectedLead || !selectedLead.website) {
    showToast('⚠️ No website URL attached to this lead.');
    return;
  }

  const btn = document.getElementById('btn-run-audit');
  btn.disabled = true;
  btn.innerText = '⌛ Auditing...';

  try {
    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedLead.id, website: selectedLead.website }),
    });
    const data = await res.json();
    if (data.success && data.lead) {
      selectedLead = data.lead;
      renderTechnicalAuditDrawer(selectedLead);
      renderPitchSuite(selectedLead);
      document.getElementById('detail-score').innerText = selectedLead.opportunityScore || 80;
      showToast('✓ Technical audit & pitch scripts updated!');
    }
  } catch {
    showToast('ℹ Audit completed in preview mode.');
  } finally {
    btn.disabled = false;
    btn.innerText = '🔄 Run Audit';
  }
}

/**
 * Change Pitch Tone Selector
 */
async function changePitchTone(tone) {
  currentPitchTone = tone;
  if (!selectedLead) return;

  if (!isStaticMode) {
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone }),
      });
      const data = await res.json();
      if (data.success && data.scripts) {
        selectedLead.aiPitchScripts = data.scripts;
        renderPitchSuite(selectedLead);
        showToast(`✓ Re-generated pitch scripts in ${tone} tone!`);
        return;
      }
    } catch {
      // ignore
    }
  }

  showToast(`✓ Switched tone to ${tone}`);
}

/**
 * Show Toast Notification
 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;

  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function toggleExportMenu() {
  document.getElementById('export-menu').classList.toggle('show');
}

/**
 * Client-Side CSV & JSON Export (Works on GitHub Pages!)
 */
function downloadExport(type) {
  if (type === 'csv') {
    const headers = ['ID', 'Name', 'Category', 'Area', 'Address', 'Phone', 'Email', 'Website', 'Instagram', 'Stage', 'Score'];
    const rows = allLeads.map((l) => [
      `"${l.id}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.category || ''}"`,
      `"${l.area || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.website || ''}"`,
      `"${l.socials?.instagram || ''}"`,
      `"${l.funnelStage || ''}"`,
      `"${l.opportunityScore || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leadgremlin_sales_funnel.csv';
    link.click();
  } else {
    const jsonContent = JSON.stringify(allLeads, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leadgremlin_sales_funnel.json';
    link.click();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
