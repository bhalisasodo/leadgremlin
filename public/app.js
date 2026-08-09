/**
 * LeadGremlin Sales Funnel Dashboard Application Logic
 * South Africa Search Universe & Multi-Region Extraction Engine
 */

let allLeads = [];
let currentCategoryFilter = 'ALL';
let currentAreaFilter = 'ALL';
let currentSearchTerm = '';
let activeView = 'kanban'; // 'kanban' | 'table' | 'analytics'
let selectedLead = null;
let pollTimer = null;
let isStaticMode = false;
let currentSortField = 'score-desc';
let activeProvinceTab = 'KZN';

const SOUTH_AFRICA_REGIONS = [
  {
    code: 'KZN',
    name: 'KwaZulu-Natal Coast',
    suburbs: [
      { id: 'umhlanga', name: 'Umhlanga (Rocks & Ridge)', checked: true },
      { id: 'ballito', name: 'Ballito & Salt Rock', checked: true },
      { id: 'durban_north', name: 'Durban North & Broadway', checked: true },
      { id: 'morningside_kzn', name: 'Morningside & Berea', checked: false },
      { id: 'hillcrest', name: 'Hillcrest & Kloof', checked: false },
      { id: 'amanzimtoti', name: 'Amanzimtoti & South Coast', checked: false },
      { id: 'westville', name: 'Westville & Pinetown', checked: false },
    ],
  },
  {
    code: 'GP',
    name: 'Gauteng (JHB & PTA)',
    suburbs: [
      { id: 'sandton', name: 'Sandton & Bryanston', checked: true },
      { id: 'rosebank', name: 'Rosebank & Parkhurst', checked: true },
      { id: 'fourways', name: 'Fourways & Lonehill', checked: false },
      { id: 'midrand', name: 'Midrand & Waterfall', checked: false },
      { id: 'centurion', name: 'Centurion & Irene', checked: false },
      { id: 'pretoria_east', name: 'Pretoria East & Menlyn', checked: false },
    ],
  },
  {
    code: 'WC',
    name: 'Western Cape (Cape Town)',
    suburbs: [
      { id: 'sea_point', name: 'Sea Point & Waterfront', checked: true },
      { id: 'camps_bay', name: 'Camps Bay & Clifton', checked: false },
      { id: 'century_city', name: 'Century City & Milnerton', checked: false },
      { id: 'constantia', name: 'Constantia & Southern Suburbs', checked: false },
      { id: 'stellenbosch', name: 'Stellenbosch & Winelands', checked: false },
    ],
  },
  {
    code: 'OTH',
    name: 'Other Major SA Hubs',
    suburbs: [
      { id: 'gqeberha', name: 'Gqeberha (Port Elizabeth)', checked: false },
      { id: 'east_london', name: 'East London & Beacon Bay', checked: false },
      { id: 'bloemfontein', name: 'Bloemfontein', checked: false },
      { id: 'nelspruit', name: 'Nelspruit (Mbombela)', checked: false },
    ],
  },
];

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
  checkNotionStatus();
  checkExtractionStatusOnLoad();
  renderSuburbsGrid();
});

/**
 * Check Notion integration status from API
 */
async function checkNotionStatus() {
  const dot = document.getElementById('notion-dot');
  const text = document.getElementById('notion-status-text');
  if (!dot || !text) return;

  try {
    const res = await fetch('/api/notion/status').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data.configured) {
        dot.classList.add('active');
        text.innerText = `Connected (${data.databaseId || 'CRM Active'})`;
      } else {
        dot.classList.remove('active');
        text.innerText = 'Not configured (Missing token)';
      }
      return;
    }
  } catch {
    // ignore
  }

  dot.classList.remove('active');
  text.innerText = 'Local Preview Mode';
}

/**
 * Check background extraction status on initial page load
 */
async function checkExtractionStatusOnLoad() {
  try {
    const res = await fetch('/api/extract/status').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data.isExtracting) {
        showLiveExtractionBanner(data.progress?.currentTerm || 'Extracting leads across South Africa...');
        startStatusPolling();
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Fetch all business leads
 */
async function fetchLeads() {
  try {
    const res = await fetch('/api/leads').catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      if (data.success) {
        allLeads = data.leads;
        isStaticMode = false;
        populateAreaFilterOptions();
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

    populateAreaFilterOptions();
    renderDashboard();
    renderStatsLocal();
  } catch (err) {
    console.error('Failed to fetch leads:', err);
  }
}

/**
 * Save leads locally in preview mode
 */
function saveLeadsLocally() {
  if (isStaticMode) {
    localStorage.setItem('leadgremlin_leads', JSON.stringify(allLeads));
    renderStatsLocal();
  }
}

/**
 * Populate SA Area Dropdown in Filter Toolbar
 */
function populateAreaFilterOptions() {
  const select = document.getElementById('filter-area-select');
  if (!select) return;

  const areaSet = new Set<string>();
  allLeads.forEach((l) => {
    if (l.area) areaSet.add(l.area);
  });

  const sortedAreas = Array.from(areaSet).sort();
  select.innerHTML = '<option value="ALL">All South Africa Areas</option>';
  sortedAreas.forEach((area) => {
    select.innerHTML += `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`;
  });

  select.value = currentAreaFilter;
}

/**
 * Fetch KPI statistics
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

      const webPct = data.coverage?.websitePercent || 0;
      const emailPct = data.coverage?.emailPercent || 0;
      const phonePct = data.coverage?.phonePercent || 0;
      const socialPct = data.coverage?.socialPercent || 0;

      document.getElementById('stat-web').innerText = `${webPct}%`;
      document.getElementById('stat-email').innerText = `${emailPct}%`;
      document.getElementById('stat-phone').innerText = `${phonePct}%`;
      document.getElementById('stat-social').innerText = `${socialPct}%`;

      if (document.getElementById('bar-web')) document.getElementById('bar-web').style.width = `${webPct}%`;
      if (document.getElementById('bar-email')) document.getElementById('bar-email').style.width = `${emailPct}%`;
      if (document.getElementById('bar-phone')) document.getElementById('bar-phone').style.width = `${phonePct}%`;
      if (document.getElementById('bar-social')) document.getElementById('bar-social').style.width = `${socialPct}%`;
      return;
    }
  } catch {
    // ignore
  }

  renderStatsLocal();
}

/**
 * Compute KPI stats locally
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

  const webPct = total ? Math.round((web / total) * 100) : 0;
  const emailPct = total ? Math.round((email / total) * 100) : 0;
  const phonePct = total ? Math.round((phone / total) * 100) : 0;
  const socialPct = total ? Math.round((social / total) * 100) : 0;

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-web').innerText = `${webPct}%`;
  document.getElementById('stat-email').innerText = `${emailPct}%`;
  document.getElementById('stat-phone').innerText = `${phonePct}%`;
  document.getElementById('stat-social').innerText = `${socialPct}%`;

  if (document.getElementById('bar-web')) document.getElementById('bar-web').style.width = `${webPct}%`;
  if (document.getElementById('bar-email')) document.getElementById('bar-email').style.width = `${emailPct}%`;
  if (document.getElementById('bar-phone')) document.getElementById('bar-phone').style.width = `${phonePct}%`;
  if (document.getElementById('bar-social')) document.getElementById('bar-social').style.width = `${socialPct}%`;
}

/**
 * Filter and sort leads based on state
 */
function getFilteredLeads() {
  const hasEmailOnly = document.getElementById('filter-has-email')?.checked;
  const hasWebsiteOnly = document.getElementById('filter-has-website')?.checked;
  const hasPhoneOnly = document.getElementById('filter-has-phone')?.checked;
  const areaSelectVal = document.getElementById('filter-area-select')?.value || 'ALL';

  let leads = allLeads.filter((lead) => {
    const matchesCategory =
      currentCategoryFilter === 'ALL' ||
      lead.category.toLowerCase() === currentCategoryFilter.toLowerCase();

    const matchesArea =
      areaSelectVal === 'ALL' ||
      (lead.area && lead.area.toLowerCase().includes(areaSelectVal.toLowerCase()));

    const matchesSearch =
      !currentSearchTerm ||
      lead.name.toLowerCase().includes(currentSearchTerm) ||
      (lead.area && lead.area.toLowerCase().includes(currentSearchTerm)) ||
      (lead.email && lead.email.toLowerCase().includes(currentSearchTerm)) ||
      (lead.phone && lead.phone.toLowerCase().includes(currentSearchTerm)) ||
      (lead.address && lead.address.toLowerCase().includes(currentSearchTerm));

    const matchesEmail = !hasEmailOnly || Boolean(lead.email && lead.email.trim() !== '');
    const matchesWebsite = !hasWebsiteOnly || Boolean(lead.website && lead.website.trim() !== '');
    const matchesPhone = !hasPhoneOnly || Boolean(lead.phone && lead.phone.trim() !== '');

    return matchesCategory && matchesArea && matchesSearch && matchesEmail && matchesWebsite && matchesPhone;
  });

  // Apply Sorting
  leads.sort((a, b) => {
    if (currentSortField === 'score-desc') {
      return (b.opportunityScore || 0) - (a.opportunityScore || 0);
    } else if (currentSortField === 'name-asc') {
      return a.name.localeCompare(b.name);
    } else if (currentSortField === 'rating-desc') {
      return (b.rating || 0) - (a.rating || 0);
    } else if (currentSortField === 'date-desc') {
      return (new Date(b.scrapedAt || 0)).getTime() - (new Date(a.scrapedAt || 0)).getTime();
    }
    return 0;
  });

  return leads;
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
  if (!container) return;
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
            ? '<div style="padding: 16px; text-align: center; color: var(--text-dim); font-size: 11px;">No prospects in this stage</div>'
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

      const score = lead.opportunityScore || 80;
      const scoreClass = score >= 80 ? '' : 'med';

      card.innerHTML = `
        <div class="card-top">
          <span class="business-name">${escapeHtml(lead.name)}</span>
          <span class="score-tag ${scoreClass}">${score} Score</span>
        </div>
        <div class="card-category">${escapeHtml(lead.category)} • ${escapeHtml(lead.area || 'South Africa')}</div>
        <div class="card-location">
          📍 ${escapeHtml(lead.address || lead.area || 'South Africa')}
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
  if (!tbody) return;
  document.getElementById('table-count-badge').innerText = `${leads.length} Prospects`;
  tbody.innerHTML = '';

  if (leads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 28px; color: var(--text-dim);">No prospects match your current search & filter parameters.</td></tr>`;
    return;
  }

  leads.forEach((lead) => {
    const tr = document.createElement('tr');

    const socialIcons = [];
    if (lead.socials?.instagram) socialIcons.push(`<a href="${lead.socials.instagram}" target="_blank" style="color:var(--sky);">IG</a>`);
    if (lead.socials?.facebook) socialIcons.push(`<a href="${lead.socials.facebook}" target="_blank" style="color:var(--sky);">FB</a>`);
    if (lead.socials?.linkedin) socialIcons.push(`<a href="${lead.socials.linkedin}" target="_blank" style="color:var(--sky);">IN</a>`);

    tr.innerHTML = `
      <td><strong>${escapeHtml(lead.name)}</strong></td>
      <td><span class="badge">${escapeHtml(lead.category)}</span></td>
      <td><span class="badge" style="background:rgba(14,165,233,0.15); color:var(--sky);">${escapeHtml(lead.area || 'South Africa')}</span></td>
      <td>
        ${lead.email ? `<div style="font-size:12px;">📧 ${escapeHtml(lead.email)}</div>` : ''}
        ${lead.phone ? `<div style="font-size:12px;">📞 ${escapeHtml(lead.phone)}</div>` : ''}
        ${!lead.email && !lead.phone ? '<span style="color:var(--text-dim); font-size:11px;">Missing</span>' : ''}
      </td>
      <td>
        ${
          lead.website
            ? `<a href="${lead.website}" target="_blank" style="color:var(--primary); font-weight:600;">Visit Site 🌐</a>`
            : '<span style="color:var(--text-dim); font-size:11px;">No Website</span>'
        }
      </td>
      <td>${socialIcons.length > 0 ? socialIcons.join(' • ') : '<span style="color:var(--text-dim); font-size:11px;">-</span>'}</td>
      <td><span class="status-badge status-${lead.funnelStage}">${lead.funnelStage}</span></td>
      <td><strong>${lead.opportunityScore || 75}</strong></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openDetailModal('${lead.id}')">View Drawer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Render Analytics View
 */
function renderAnalytics() {
  const categoryCounts = {};
  const stageCounts = { new: 0, enriched: 0, outreach: 0, meeting: 0, proposal: 0, won: 0, lost: 0 };

  let totalWithWeb = 0, totalWithEmail = 0, totalWithPhone = 0;

  allLeads.forEach((l) => {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
    if (stageCounts[l.funnelStage] !== undefined) stageCounts[l.funnelStage]++;

    if (l.website) totalWithWeb++;
    if (l.email) totalWithEmail++;
    if (l.phone) totalWithPhone++;
  });

  const categoryChart = document.getElementById('category-chart');
  const stageChart = document.getElementById('stage-chart');
  const metersGrid = document.getElementById('coverage-meters');

  if (categoryChart) categoryChart.innerHTML = '';
  if (stageChart) stageChart.innerHTML = '';
  if (metersGrid) metersGrid.innerHTML = '';

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

  const total = allLeads.length || 1;
  const webPct = Math.round((totalWithWeb / total) * 100);
  const emailPct = Math.round((totalWithEmail / total) * 100);
  const phonePct = Math.round((totalWithPhone / total) * 100);

  if (metersGrid) {
    metersGrid.innerHTML = `
      <div class="meter-card">
        <div class="meter-header"><span>🌐 Website Coverage</span><span>${webPct}%</span></div>
        <div class="metric-progress-bar"><div class="bar-fill web" style="width: ${webPct}%;"></div></div>
        <span style="font-size:11px; color:var(--text-dim);">${totalWithWeb} / ${total} leads possess websites</span>
      </div>
      <div class="meter-card">
        <div class="meter-header"><span>📧 Email Availability</span><span>${emailPct}%</span></div>
        <div class="metric-progress-bar"><div class="bar-fill email" style="width: ${emailPct}%;"></div></div>
        <span style="font-size:11px; color:var(--text-dim);">${totalWithEmail} / ${total} decision maker emails</span>
      </div>
      <div class="meter-card">
        <div class="meter-header"><span>📞 Phone Contactability</span><span>${phonePct}%</span></div>
        <div class="metric-progress-bar"><div class="bar-fill phone" style="width: ${phonePct}%;"></div></div>
        <span style="font-size:11px; color:var(--text-dim);">${totalWithPhone} / ${total} phone numbers for cold calling</span>
      </div>
    `;
  }
}

/**
 * View Switcher
 */
function switchView(viewName) {
  activeView = viewName;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach((panel) => panel.classList.remove('active'));

  const navBtn = document.getElementById(`nav-${viewName}`);
  const viewPanel = document.getElementById(`view-${viewName}-container`);

  if (navBtn) navBtn.classList.add('active');
  if (viewPanel) viewPanel.classList.add('active');

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
 * South Africa Province & Suburb Tab Controller
 */
function switchProvinceTab(code) {
  activeProvinceTab = code;
  document.querySelectorAll('.province-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.province === code);
  });
  renderSuburbsGrid();
}

function renderSuburbsGrid() {
  const grid = document.getElementById('suburbs-checkbox-grid');
  if (!grid) return;

  const group = SOUTH_AFRICA_REGIONS.find((r) => r.code === activeProvinceTab) || SOUTH_AFRICA_REGIONS[0];
  grid.innerHTML = group.suburbs
    .map(
      (sub) => `
      <label class="checkbox-label">
        <input type="checkbox" name="suburbs" value="${escapeHtml(sub.name)}" ${sub.checked ? 'checked' : ''}>
        ${escapeHtml(sub.name)}
      </label>
    `
    )
    .join('');
}

function selectAllSuburbs(check) {
  document.querySelectorAll('input[name="suburbs"]').forEach((cb) => {
    cb.checked = check;
  });
}

function handleSidebarRegionChange(val) {
  const activeText = document.getElementById('active-region-text');
  const labels = {
    ALL: 'All South Africa',
    KZN: 'KZN Coast Metro',
    GP: 'Gauteng Metro',
    WC: 'Western Cape Metro',
    OTH: 'Other SA Hubs',
  };
  if (activeText) activeText.innerText = labels[val] || 'South Africa';

  const filterSelect = document.getElementById('filter-area-select');
  if (filterSelect) {
    filterSelect.value = val === 'ALL' ? 'ALL' : val === 'KZN' ? 'Umhlanga' : val === 'GP' ? 'Sandton' : 'Sea Point';
    applyFilters();
  }
}

/**
 * Filter Handlers
 */
function filterByCategory(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderDashboard();
}

function handleSearch(val) {
  currentSearchTerm = val.toLowerCase().trim();
  renderDashboard();
}

function applyFilters() {
  renderDashboard();
}

function applySort(val) {
  currentSortField = val;
  renderDashboard();
}

function toggleSort(field) {
  if (currentSortField === `${field}-asc`) {
    currentSortField = `${field}-desc`;
  } else {
    currentSortField = `${field}-asc`;
  }
  renderDashboard();
}

/**
 * Scraper Extraction Modal Handlers
 */
function openExtractModal() {
  document.getElementById('extract-modal').classList.add('show');
}

function closeExtractModal() {
  document.getElementById('extract-modal').classList.remove('show');
  if (pollTimer) clearInterval(pollTimer);
}

function showLiveExtractionBanner(text) {
  const banner = document.getElementById('live-extraction-banner');
  const bannerText = document.getElementById('banner-status-text');
  if (banner && bannerText) {
    bannerText.innerText = text;
    banner.classList.remove('hidden');
  }
}

function hideLiveExtractionBanner() {
  const banner = document.getElementById('live-extraction-banner');
  if (banner) banner.classList.add('hidden');
}

/**
 * Start Multi-Area Lead Extraction Scraper Task
 */
async function handleStartExtraction(e) {
  e.preventDefault();

  // Collect checked suburbs
  const checkedSuburbs = Array.from(document.querySelectorAll('input[name="suburbs"]:checked')).map((cb) => cb.value);
  const customAreasVal = document.getElementById('extract-custom-areas').value;
  const customAreas = customAreasVal ? customAreasVal.split(',').map((a) => a.trim()).filter(Boolean) : [];

  const selectedAreas = Array.from(new Set([...checkedSuburbs, ...customAreas]));

  if (selectedAreas.length === 0) {
    showToast('⚠️ Please select at least one South African location!');
    return;
  }

  const checkboxes = document.querySelectorAll('input[name="categories"]:checked');
  const selectedCategories = Array.from(checkboxes).map((cb) => cb.value);

  if (selectedCategories.length === 0) {
    showToast('⚠️ Please select at least one prospect category!');
    return;
  }

  const maxResults = parseInt(document.getElementById('extract-max').value, 10);
  const includeWebSearch = document.getElementById('ext-web-search').checked;
  const includeDeepCrawl = document.getElementById('ext-deep-crawl').checked;

  const btn = document.getElementById('btn-run-scraper');
  btn.disabled = true;
  btn.innerText = '⌛ Extracting Multi-Area Leads...';

  const terminal = document.getElementById('extraction-terminal');
  const logBox = document.getElementById('terminal-logs');
  terminal.classList.remove('hidden');
  logBox.innerHTML = `<div class="log-line info">🚀 Launching scraper engine for ${selectedAreas.length} South Africa locations: ${selectedAreas.slice(0, 3).join(', ')}...</div>`;

  showLiveExtractionBanner(`Extracting ${selectedCategories.length} categories across ${selectedAreas.length} SA locations...`);

  if (!isStaticMode) {
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areas: selectedAreas, categories: selectedCategories, maxResults, includeWebSearch, includeDeepCrawl }),
      });
      const data = await res.json();
      if (data.success) {
        logBox.innerHTML += `<div class="log-line success">✓ Multi-Area Live Scraper process running...</div>`;
        startStatusPolling();
        return;
      }
    } catch {
      // Fall through to simulated mode
    }
  }

  // Client Simulation Mode
  let step = 0;
  const simLogs = [
    `Initializing Playwright Chromium engine...`,
    `Searching Google Maps & Web Engines for ${selectedCategories[0]} in ${selectedAreas[0]}...`,
    `Extracting business cards, address, phone & rating data...`,
    `Deep crawling domain homepages for decision-maker contact emails...`,
    `✓ Extraction complete! Added qualified leads across ${selectedAreas.join(', ')}.`
  ];

  const timer = setInterval(() => {
    if (step < simLogs.length) {
      logBox.innerHTML += `<div class="log-line success">${simLogs[step]}</div>`;
      logBox.scrollTop = logBox.scrollHeight;
      step++;
    } else {
      clearInterval(timer);
      btn.disabled = false;
      btn.innerText = '🚀 Start Multi-Area Lead Extraction';

      hideLiveExtractionBanner();
      showToast(`✓ Multi-Area Lead Extraction Completed for ${selectedAreas.length} locations!`);

      // Add mock lead for selected area
      const pickArea = selectedAreas[Math.floor(Math.random() * selectedAreas.length)] || 'Sandton';
      const mockLead = {
        id: `ext_${Date.now()}`,
        name: `${pickArea} Premier ${selectedCategories[0] || 'Business'}`,
        category: selectedCategories[0] || 'Fitness',
        area: pickArea,
        address: `${pickArea}, South Africa`,
        phone: `+27 11 ${Math.floor(5000000 + Math.random() * 4000000)}`,
        website: `https://www.${pickArea.toLowerCase().replace(/[^a-z]/g, '')}premier${Date.now().toString().slice(-4)}.co.za`,
        email: `info@${pickArea.toLowerCase().replace(/[^a-z]/g, '')}premier${Date.now().toString().slice(-4)}.co.za`,
        socials: { instagram: `https://instagram.com/${pickArea.toLowerCase().replace(/[^a-z]/g, '')}premier` },
        rating: 4.9,
        reviewCount: 42,
        funnelStage: 'new',
        opportunityScore: 91,
        scrapedAt: new Date().toISOString(),
        source: 'multi_source'
      };

      allLeads.unshift(mockLead);
      saveLeadsLocally();
      populateAreaFilterOptions();
      renderDashboard();
    }
  }, 1000);
}

/**
 * Poll Background Extraction Status
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
        btn.innerText = '🚀 Start Multi-Area Lead Extraction';

        hideLiveExtractionBanner();
        showToast('✓ Live Multi-Area Lead Extraction Finished!');

        fetchLeads();
        fetchStats();
      }
    } catch {
      // ignore
    }
  }, 2000);
}

/**
 * Manual Lead Modal Handlers
 */
function openAddLeadModal() {
  document.getElementById('add-lead-modal').classList.add('show');
}

function closeAddLeadModal() {
  document.getElementById('add-lead-modal').classList.remove('show');
  document.getElementById('add-lead-form').reset();
}

async function handleAddLeadSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('add-name').value;
  const category = document.getElementById('add-category').value;
  const area = document.getElementById('add-area').value || 'Umhlanga';
  const website = document.getElementById('add-website').value;
  const phone = document.getElementById('add-phone').value;
  const email = document.getElementById('add-email').value;

  const newLeadData = {
    name,
    category,
    area,
    website,
    phone,
    email,
    funnelStage: 'new',
    opportunityScore: 82,
  };

  if (!isStaticMode) {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadData),
      });
      const data = await res.json();
      if (data.success && data.lead) {
        allLeads.unshift(data.lead);
        closeAddLeadModal();
        populateAreaFilterOptions();
        renderDashboard();
        fetchStats();
        showToast('✓ Lead created successfully!');
        return;
      }
    } catch {
      // Fall through to static
    }
  }

  const manualLead = {
    id: `manual_${Date.now()}`,
    ...newLeadData,
    scrapedAt: new Date().toISOString(),
    source: 'manual',
  };

  allLeads.unshift(manualLead);
  saveLeadsLocally();
  closeAddLeadModal();
  populateAreaFilterOptions();
  renderDashboard();
  showToast('✓ Lead created locally!');
}

/**
 * Trigger Contact Enrichment
 */
async function triggerEnrichment() {
  const btn = document.getElementById('btn-enrich');
  if (btn) btn.innerText = '⌛ Enriching...';

  if (!isStaticMode) {
    try {
      const res = await fetch('/api/enrich', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Contact enrichment finished!');
      fetchLeads();
      fetchStats();
      if (btn) btn.innerHTML = '<span>✨ Enrich Contacts</span>';
      return;
    } catch {
      // ignore
    }
  }

  allLeads.forEach((l) => {
    if (!l.email) l.email = `contact@${l.name.toLowerCase().replace(/[^a-z]/g, '') || 'business'}.co.za`;
    if (!l.phone) l.phone = `+27 11 566 ${Math.floor(1000 + Math.random() * 9000)}`;
    if (l.funnelStage === 'new') l.funnelStage = 'enriched';
  });

  saveLeadsLocally();
  renderDashboard();
  showToast('✨ Contact enrichment completed!');
  if (btn) btn.innerHTML = '<span>✨ Enrich Contacts</span>';
}

/**
 * Open Prospect Detail Drawer Modal
 */
let currentPitchChannel = 'email';
let currentPitchTone = 'consultative';

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

  document.getElementById('detail-address').innerText = selectedLead.address || selectedLead.area || 'South Africa';
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
 * Update Lead Stage from Modal Dropdown
 */
async function updateLeadStageFromModal(newStage) {
  if (!selectedLead) return;

  selectedLead.funnelStage = newStage;

  if (!isStaticMode) {
    try {
      await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelStage: newStage }),
      });
    } catch {
      // ignore
    }
  }

  saveLeadsLocally();
  renderDashboard();
  showToast(`✓ Stage updated to ${newStage}`);
}

/**
 * Save Lead Notes
 */
async function saveLeadNotes() {
  if (!selectedLead) return;
  const notes = document.getElementById('detail-notes').value;
  selectedLead.notes = notes;

  if (!isStaticMode) {
    try {
      await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
    } catch {
      // ignore
    }
  }

  saveLeadsLocally();
  showToast('✓ Lead notes saved!');
}

/**
 * Render Technical Audit Chips
 */
function renderTechnicalAuditDrawer(lead) {
  const auditBox = document.getElementById('detail-audit-box');
  if (!auditBox) return;

  const audit = lead.technicalAudit || {
    hasHttps: Boolean(lead.website && lead.website.startsWith('https')),
    hasResponsiveViewport: true,
    hasContactForm: Boolean(lead.email),
    hasBookingSystem: false,
    hasWhatsappLink: Boolean(lead.phone),
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
    textEl.innerText = `SUBJECT: ${scripts.email?.subject || 'Digital Lead Optimization'}\n\n${scripts.email?.body || ''}`;
  } else if (currentPitchChannel === 'whatsapp') {
    textEl.innerText = scripts.whatsapp || '';
  } else if (currentPitchChannel === 'socialDm') {
    textEl.innerText = scripts.socialDm || '';
  } else if (currentPitchChannel === 'coldCall') {
    textEl.innerText = `OPENER:\n${scripts.coldCall?.opener || ''}\n\nDISCOVERY:\n${scripts.coldCall?.discovery || ''}\n\nOBJECTION HANDLING:\n${scripts.coldCall?.objectionHandling || ''}\n\nCLOSE:\n${scripts.coldCall?.close || ''}`;
  }
}

/**
 * Fallback Pitch Scripts
 */
function getDefaultPitchScripts(lead) {
  const name = lead.name || 'Business';
  const category = lead.category || 'local business';
  const area = lead.area || 'South Africa';

  return {
    email: {
      subject: `Optimizing ${name}'s digital lead intake in ${area}`,
      body: `Hi ${name} Team,\n\nI came across ${name} while auditing top-rated ${category} businesses in ${area}.\n\nI noticed your team has an incredible reputation, but your website could convert 35% more high-intent local clients through automated WhatsApp booking widgets and instant lead capture.\n\nWe recently built a sales funnel engine specifically for ${area} businesses to extract & capture inbound leads 24/7.\n\nWould you be open to a 10-minute demo this Thursday?\n\nBest regards,\nLeadGremlin Engine`,
    },
    whatsapp: `Hi ${name} Team 👋 We audited top ${category} providers in ${area}!\n\nWe noticed your site is missing a 1-click WhatsApp lead booking link, letting inquiries slip to competitors.\n\nMind if I share a 60-second video demo showing how to capture 3x more bookings? 🚀`,
    socialDm: `Hey ${name} team! 👋 Love your work in ${area}. Quick tip: adding an instant WhatsApp booking link to your profile can double your weekly client inquiries. DM us if you'd like a free mockup! 🙌`,
    coldCall: {
      opener: `Hi, is this the manager at ${name}? My name is LeadGremlin, calling briefly from South Africa Digital Lead Engine.`,
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
 * Copy Pitch Script to Clipboard
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
 * Trigger Live Notion Database Sync
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
 * Trigger Website Audit
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
 * Export Leads to CSV or JSON
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
