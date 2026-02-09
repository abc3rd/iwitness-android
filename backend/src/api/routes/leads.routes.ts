// Lead Management API Routes
import { Router } from 'express';
import { leadService } from '../../services/lead.service.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { auditMiddleware } from '../../middleware/audit.js';

export const leadsRoutes = Router();

// POST /api/v1/leads — Create a new lead (public for QR/form intake)
leadsRoutes.post('/', optionalAuth, async (req, res) => {
  try {
    const lead = await leadService.create({
      ...req.body,
      tenantId: req.auth?.tenantId || req.tenant?.id,
    });
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create lead';
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message } });
  }
});

// GET /api/v1/leads — List leads with filters
leadsRoutes.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      tenantId: req.auth!.tenantId || req.tenant?.id,
      status: req.query.status as string,
      assignedTo: req.query.assignedTo as string,
      affiliateId: req.query.affiliateId as string,
      source: req.query.source as string,
      minScore: req.query.minScore ? parseInt(req.query.minScore as string, 10) : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 25,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    // Non-admin affiliates only see their own leads
    if (req.auth!.role === 'affiliate') {
      const { query: dbQuery } = await import('../../config/database.js');
      const aff = await dbQuery('SELECT id FROM affiliates WHERE user_id = $1', [req.auth!.userId]);
      if (aff.rows.length > 0) {
        filters.affiliateId = (aff.rows[0] as { id: string }).id;
      }
    }

    const result = await leadService.list(filters);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list leads' } });
  }
});

// GET /api/v1/leads/:id
leadsRoutes.get('/:id', authenticate, async (req, res) => {
  try {
    const lead = await leadService.getById(req.params.id);
    if (!lead) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } });
      return;
    }
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch lead' } });
  }
});

// PATCH /api/v1/leads/:id/status
leadsRoutes.patch('/:id/status', authenticate, auditMiddleware('leads'), async (req, res) => {
  try {
    const { status } = req.body;
    const lead = await leadService.updateStatus(req.params.id, status);
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update lead status' } });
  }
});

// PATCH /api/v1/leads/:id/assign
leadsRoutes.patch('/:id/assign', authenticate, requireRole('admin', 'attorney'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const lead = await leadService.assignLead(req.params.id, assignedTo);
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'ASSIGN_FAILED', message: 'Failed to assign lead' } });
  }
});

// POST /api/v1/leads/bulk-score — Re-score all leads
leadsRoutes.post('/bulk-score', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const result = await leadService.bulkScore();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SCORE_FAILED', message: 'Bulk scoring failed' } });
  }
});
