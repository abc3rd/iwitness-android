// Affiliate Management API Routes
import { Router } from 'express';
import { affiliateService } from '../../services/affiliate.service.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

export const affiliatesRoutes = Router();

// GET /api/v1/affiliates/me — Get current user's affiliate profile
affiliatesRoutes.get('/me', authenticate, async (req, res) => {
  try {
    const affiliate = await affiliateService.getByUserId(req.auth!.userId);
    if (!affiliate) {
      // Auto-create
      const result = await affiliateService.getOrCreate(req.auth!.email);
      res.json({ success: true, data: result });
      return;
    }
    res.json({ success: true, data: affiliate });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch affiliate profile' } });
  }
});

// GET /api/v1/affiliates — List affiliates (admin)
affiliatesRoutes.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await affiliateService.listAffiliates({
      tenantId: req.auth!.tenantId,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 25,
      sortBy: req.query.sortBy as string,
    });
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list affiliates' } });
  }
});

// GET /api/v1/affiliates/:code — Look up affiliate by code
affiliatesRoutes.get('/code/:code', optionalAuth, async (req, res) => {
  try {
    const affiliate = await affiliateService.getByCode(req.params.code);
    if (!affiliate) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Affiliate not found' } });
      return;
    }
    res.json({ success: true, data: affiliate });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch affiliate' } });
  }
});

// GET /api/v1/affiliates/:id/tree — Get referral tree
affiliatesRoutes.get('/:id/tree', authenticate, async (req, res) => {
  try {
    const tree = await affiliateService.getReferralTree(req.params.id);
    res.json({ success: true, data: tree });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'TREE_FAILED', message: 'Failed to fetch referral tree' } });
  }
});

// POST /api/v1/affiliates/referral — Record a referral
affiliatesRoutes.post('/referral', optionalAuth, async (req, res) => {
  try {
    const { referrerId, referredUserId, source, campaignId, lat, lng } = req.body;
    const result = await affiliateService.recordReferral({
      referrerId, referredUserId, source, campaignId, lat, lng,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'REFERRAL_FAILED', message: 'Failed to record referral' } });
  }
});

// GET /api/v1/affiliates/:id/earnings — Get earnings summary
affiliatesRoutes.get('/:id/earnings', authenticate, async (req, res) => {
  try {
    const earnings = await affiliateService.getEarnings(req.params.id);
    res.json({ success: true, data: earnings });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'EARNINGS_FAILED', message: 'Failed to fetch earnings' } });
  }
});

// GET /api/v1/affiliates/:id/performance — Get performance metrics
affiliatesRoutes.get('/:id/performance', authenticate, async (req, res) => {
  try {
    const metrics = await affiliateService.getPerformanceMetrics(req.params.id);
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'METRICS_FAILED', message: 'Failed to fetch performance metrics' } });
  }
});
