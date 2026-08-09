import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { Business, FunnelStage } from './types/business.js';
import { MultiSourceScraper } from './scraper/multiSourceScraper.js';
import { contactEnricher } from './enrichment/contactEnricher.js';
import { Exporter } from './utils/exporter.js';
import { logger } from './utils/logger.js';
import { CategoryClassifier } from './utils/categoryClassifier.js';
import { syncLeadsToNotion } from './notion/sync.js';
import { getConfig } from './config/config.js';
import { websiteAnalyzer } from './scoring/websiteAnalyzer.js';
import { aiAuditor } from './scoring/aiAuditor.js';
import crypto from 'crypto';

const INITIAL_PORT = parseInt(process.env.PORT || '3005', 10);
const DATA_DIR = path.resolve(process.cwd(), './data');
const DASHBOARD_FILE = path.join(DATA_DIR, 'leads_dashboard.json');
const PUBLIC_DIR = path.resolve(process.cwd(), './public');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

const exporter = new Exporter(DATA_DIR);

/**
 * Load leads from file system
 */
function loadLeads(): Business[] {
  try {
    if (fs.existsSync(DASHBOARD_FILE)) {
      const raw = fs.readFileSync(DASHBOARD_FILE, 'utf-8');
      return JSON.parse(raw);
    }
    const latestFile = path.join(DATA_DIR, 'leads_latest.json');
    if (fs.existsSync(latestFile)) {
      const raw = fs.readFileSync(latestFile, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    logger.error('Error loading leads JSON:', err);
  }
  return [];
}

/**
 * Save leads to file system
 */
function saveLeads(leads: Business[]) {
  try {
    exporter.save(leads);
  } catch (err) {
    logger.error('Error saving leads JSON:', err);
  }
}

// State for active background extraction tasks
let isExtracting = false;
let extractionProgress: { status: string; log: string[]; totalFound: number; currentTerm: string } = {
  status: 'idle',
  log: [],
  totalFound: 0,
  currentTerm: '',
};

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

/**
 * GET /api/leads - Get all leads with optional category, funnelStage, or search filtering
 */
app.get('/api/leads', (req: Request, res: Response) => {
  let leads = loadLeads();
  const { category, stage, q, area } = req.query;

  if (category) {
    leads = leads.filter((l) => l.category.toLowerCase() === String(category).toLowerCase());
  }

  if (stage) {
    leads = leads.filter((l) => l.funnelStage.toLowerCase() === String(stage).toLowerCase());
  }

  if (area) {
    leads = leads.filter((l) => l.area.toLowerCase().includes(String(area).toLowerCase()));
  }

  if (q) {
    const term = String(q).toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        (l.address && l.address.toLowerCase().includes(term)) ||
        (l.email && l.email.toLowerCase().includes(term)) ||
        (l.phone && l.phone.toLowerCase().includes(term)) ||
        (l.website && l.website.toLowerCase().includes(term))
    );
  }

  res.json({
    success: true,
    total: leads.length,
    leads,
  });
});

/**
 * POST /api/leads - Create a new lead manually
 */
app.post('/api/leads', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name) {
    return res.status(400).json({ error: 'Business name is required' });
  }

  const category = CategoryClassifier.classify(body.name, body.rawCategory || '', body.category || '');
  const id = `manual_${crypto.randomBytes(6).toString('hex')}`;

  const newLead: Business = {
    id,
    name: body.name,
    category,
    rawCategory: body.rawCategory || 'Manual Lead',
    area: body.area || 'Umhlanga',
    address: body.address,
    phone: body.phone,
    website: body.website,
    email: body.email,
    socials: body.socials || {},
    rating: body.rating ? parseFloat(body.rating) : 5.0,
    reviewCount: body.reviewCount ? parseInt(body.reviewCount) : 1,
    mapsUrl: body.mapsUrl,
    funnelStage: body.funnelStage || 'new',
    opportunityScore: body.opportunityScore || 80,
    notes: body.notes,
    scrapedAt: new Date().toISOString(),
    searchTerm: 'Manual Entry',
    source: 'manual',
  };

  const leads = loadLeads();
  leads.unshift(newLead);
  saveLeads(leads);

  res.status(201).json({ success: true, lead: newLead });
});

/**
 * PUT /api/leads/:id - Update lead details or funnel stage
 */
app.put('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const leads = loadLeads();
  const index = leads.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const updatedLead = {
    ...leads[index],
    ...updates,
  };

  if (updates.funnelStage && updates.funnelStage !== leads[index].funnelStage) {
    updatedLead.lastContactedAt = new Date().toISOString();
  }

  leads[index] = updatedLead;
  saveLeads(leads);

  res.json({ success: true, lead: updatedLead });
});

/**
 * DELETE /api/leads/:id - Delete a lead
 */
app.delete('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let leads = loadLeads();

  const initialCount = leads.length;
  leads = leads.filter((l) => l.id !== id);

  if (leads.length === initialCount) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  saveLeads(leads);
  res.json({ success: true, message: 'Lead deleted successfully' });
});

/**
 * POST /api/extract - Trigger live extraction & web scraping button action
 */
app.post('/api/extract', async (req: Request, res: Response) => {
  if (isExtracting) {
    return res.status(409).json({ error: 'An extraction process is already running.' });
  }

  const { searchTerms, area, maxResults, includeWebSearch, includeDeepCrawl } = req.body;

  let termsToScrape = searchTerms;
  if (!termsToScrape || !Array.isArray(termsToScrape) || termsToScrape.length === 0) {
    const loc = area || 'Umhlanga';
    termsToScrape = [
      `gym ${loc}`,
      `beauty salon ${loc}`,
      `restaurant ${loc}`,
      `dentist ${loc}`,
      `real estate agent ${loc}`,
    ];
  }

  isExtracting = true;
  extractionProgress = {
    status: 'running',
    log: [`Starting extraction pipeline for ${termsToScrape.length} search queries in ${area || 'Umhlanga'}...`],
    totalFound: 0,
    currentTerm: termsToScrape[0],
  };

  // Immediate response while extraction runs
  res.json({
    success: true,
    message: 'Extraction triggered successfully.',
    terms: termsToScrape,
  });

  // Execute extraction in background
  try {
    const multiScraper = new MultiSourceScraper();
    const result = await multiScraper.extractLeads(termsToScrape, maxResults || 5, {
      includeWebSearch: includeWebSearch !== false,
      includeDeepCrawl: includeDeepCrawl !== false,
      headless: true,
    });

    const currentLeads = loadLeads();
    const existingNames = new Set(currentLeads.map((l) => l.name.toLowerCase()));

    let addedCount = 0;
    for (const newLead of result.leads) {
      if (!existingNames.has(newLead.name.toLowerCase())) {
        existingNames.add(newLead.name.toLowerCase());
        currentLeads.unshift(newLead);
        addedCount++;
      }
    }

    saveLeads(currentLeads);

    extractionProgress.status = 'completed';
    extractionProgress.totalFound = addedCount;
    extractionProgress.log.push(`✓ Extraction complete! Added ${addedCount} new leads to sales funnel.`);
  } catch (err) {
    logger.error('Extraction error:', err);
    extractionProgress.status = 'error';
    extractionProgress.log.push(`❌ Extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    isExtracting = false;
  }
});

/**
 * GET /api/extract/status - Check background extraction status & live logs
 */
app.get('/api/extract/status', (req: Request, res: Response) => {
  res.json({
    isExtracting,
    progress: extractionProgress,
  });
});

/**
 * POST /api/enrich - Trigger enrichment on selected or all leads missing contacts
 */
app.post('/api/enrich', async (req: Request, res: Response) => {
  const leads = loadLeads();
  const targetLeads = leads.filter((l) => !l.email || !l.phone || !l.website || !l.socials?.instagram);

  if (targetLeads.length === 0) {
    return res.json({ success: true, message: 'All leads are already fully enriched!' });
  }

  res.json({ success: true, message: `Enrichment started for ${targetLeads.length} leads.` });

  try {
    const result = await contactEnricher.enrichBatch(targetLeads.slice(0, 10));
    const enrichedMap = new Map(result.enriched.map((e) => [e.id, e]));

    const updatedAll = leads.map((l) => enrichedMap.get(l.id) || l);
  } catch (err) {
    logger.error('Enrichment batch error:', err);
  }
});

/**
 * GET /api/notion/status - Check Notion integration status
 */
app.get('/api/notion/status', (req: Request, res: Response) => {
  const config = getConfig();
  const configured = Boolean(config.notionToken && config.notionDatabaseId);
  res.json({
    configured,
    databaseId: config.notionDatabaseId ? `${config.notionDatabaseId.slice(0, 6)}...` : null,
  });
});

/**
 * POST /api/notion/sync - Sync local dashboard leads to Notion CRM
 */
app.post('/api/notion/sync', async (req: Request, res: Response) => {
  try {
    const config = getConfig();
    if (!config.notionToken || !config.notionDatabaseId) {
      return res.status(400).json({
        success: false,
        error: 'NOTION_TOKEN or NOTION_DATABASE_ID missing in environment config.',
      });
    }

    logger.info('Starting Notion Live Sync via Dashboard API...');
    const summary = await syncLeadsToNotion(DASHBOARD_FILE);
    res.json({
      success: true,
      message: `Notion Sync Complete! Uploaded ${summary.uploaded}, Updated ${summary.updated}, Skipped ${summary.skipped}.`,
      summary,
    });
  } catch (err: any) {
    logger.error('Notion Sync API Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to sync with Notion.' });
  }
});

/**
 * POST /api/audit - Run technical website audit & calculate opportunity score for a lead
 */
app.post('/api/audit', async (req: Request, res: Response) => {
  const { id, website } = req.body;
  if (!website) {
    return res.status(400).json({ success: false, error: 'Target website URL is required.' });
  }

  try {
    const auditResult = await websiteAnalyzer.analyzeWebsite(website);
    const leads = loadLeads();

    let updatedLead: Business | null = null;
    const updatedLeads = leads.map((l) => {
      if (l.id === id || l.website === website) {
        l.opportunityScore = auditResult.score;
        l.websiteScore = Math.max(10, 100 - auditResult.score);
        l.technicalAudit = auditResult.audit;
        updatedLead = l;
      }
      return l;
    });

    if (updatedLead) {
      // Also generate AI pitch scripts
      try {
        const pitchOutput = await aiAuditor.generateAudit({
          businessName: (updatedLead as Business).name,
          websiteUrl: (updatedLead as Business).website || '',
          category: (updatedLead as Business).category,
          area: (updatedLead as Business).area,
          rating: (updatedLead as Business).rating,
          reviewCount: (updatedLead as Business).reviewCount,
          technicalAudit: (updatedLead as Business).technicalAudit,
          tone: 'consultative',
        });

        (updatedLead as Business).aiPitchScripts = pitchOutput.multiChannelScripts;
        (updatedLead as Business).estimatedDealValue = pitchOutput.estimatedProjectValueZAR;
      } catch (err) {
        logger.warn(`AI Pitch generation skipped during audit: ${String(err)}`);
      }

      saveLeads(updatedLeads);
    }

    res.json({
      success: true,
      result: auditResult,
      lead: updatedLead,
    });
  } catch (err: any) {
    logger.error('Website audit error:', err);
    res.status(500).json({ success: false, error: err.message || 'Audit failed.' });
  }
});

/**
 * POST /api/leads/:id/pitch - Generate or customize AI pitch scripts for a lead with requested tone
 */
app.post('/api/leads/:id/pitch', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tone } = req.body;

  const leads = loadLeads();
  const lead = leads.find((l) => l.id === id);

  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found.' });
  }

  try {
    const pitchOutput = await aiAuditor.generateAudit({
      businessName: lead.name,
      websiteUrl: lead.website || '',
      category: lead.category,
      area: lead.area,
      rating: lead.rating,
      reviewCount: lead.reviewCount,
      technicalAudit: lead.technicalAudit,
      tone: tone || 'consultative',
    });

    lead.aiPitchScripts = pitchOutput.multiChannelScripts;
    lead.estimatedDealValue = pitchOutput.estimatedProjectValueZAR;

    saveLeads(leads);

    res.json({
      success: true,
      scripts: pitchOutput.multiChannelScripts,
      issues: pitchOutput.issues,
      recommendations: pitchOutput.recommendations,
      estimatedValue: pitchOutput.estimatedProjectValueZAR,
      lead,
    });
  } catch (err: any) {
    logger.error('AI Pitch API error:', err);
    res.status(500).json({ success: false, error: err.message || 'Pitch generation failed.' });
  }
});

/**
 * GET /api/stats - Sales Funnel & Lead Analytics
 */
app.get('/api/stats', (req: Request, res: Response) => {
  const leads = loadLeads();
  const total = leads.length;

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
  let websiteCount = 0;
  let emailCount = 0;
  let phoneCount = 0;
  let socialCount = 0;

  leads.forEach((l) => {
    if (stageCounts[l.funnelStage] !== undefined) {
      stageCounts[l.funnelStage]++;
    }
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;

    if (l.website) websiteCount++;
    if (l.email) emailCount++;
    if (l.phone) phoneCount++;
    if (l.socials && Object.keys(l.socials).length > 0) socialCount++;
  });

  res.json({
    totalLeads: total,
    stageCounts,
    categoryCounts,
    coverage: {
      websitePercent: total ? Math.round((websiteCount / total) * 100) : 0,
      emailPercent: total ? Math.round((emailCount / total) * 100) : 0,
      phonePercent: total ? Math.round((phoneCount / total) * 100) : 0,
      socialPercent: total ? Math.round((socialCount / total) * 100) : 0,
    },
  });
});

/**
 * GET /api/export/csv - Download CSV
 */
app.get('/api/export/csv', (req: Request, res: Response) => {
  const leads = loadLeads();
  const csv = exporter.toCsv(leads);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leadgremlin_sales_funnel.csv"');
  res.send(csv);
});

/**
 * GET /api/export/json - Download JSON
 */
app.get('/api/export/json', (req: Request, res: Response) => {
  const leads = loadLeads();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="leadgremlin_sales_funnel.json"');
  res.json(leads);
});

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`
┌──────────────────────────────────────────────────────────┐
│   🚀 LeadGremlin Sales Funnel Dashboard Server Active    │
│   Dashboard: http://localhost:${port}                       │
└──────────────────────────────────────────────────────────┘
    `);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(INITIAL_PORT);
