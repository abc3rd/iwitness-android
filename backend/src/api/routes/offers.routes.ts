// Affiliate Offer Feed API Routes
import { Router } from 'express';
import { offerService } from '../../services/offer.service.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

export const offersRoutes = Router();

// GET /api/v1/offers — Get top offers (personalized)
offersRoutes.get('/', optionalAuth, async (req, res) => {
  try {
    const offers = await offerService.getTopOffers({
      category: req.query.category as string,
      source: req.query.source as string,
      geoTarget: req.query.geoTarget as string,
      incidentType: req.query.incidentType as string,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    });
    res.json({ success: true, data: offers });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list offers' } });
  }
});

// POST /api/v1/offers/click — Record offer click
offersRoutes.post('/click', optionalAuth, async (req, res) => {
  try {
    const click = await offerService.recordClick({
      offerId: req.body.offerId,
      userId: req.auth?.userId,
      affiliateId: req.body.affiliateId,
      clickUrl: req.body.clickUrl,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      lat: req.body.lat,
      lng: req.body.lng,
    });
    res.status(201).json({ success: true, data: click });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'CLICK_FAILED', message: 'Failed to record click' } });
  }
});

// POST /api/v1/offers/conversion — Record conversion callback
offersRoutes.post('/conversion', async (req, res) => {
  try {
    const { clickId, conversionValue } = req.body;
    await offerService.recordConversion(clickId, conversionValue);
    res.json({ success: true, data: { message: 'Conversion recorded' } });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'CONVERSION_FAILED', message: 'Failed to record conversion' } });
  }
});

// GET /api/v1/offers/:id/performance — Offer performance stats
offersRoutes.get('/:id/performance', authenticate, async (req, res) => {
  try {
    const performance = await offerService.getOfferPerformance(req.params.id);
    res.json({ success: true, data: performance });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'PERFORMANCE_FAILED', message: 'Failed to fetch performance' } });
  }
});

// POST /api/v1/offers/ingest — Bulk ingest offers (admin)
offersRoutes.post('/ingest', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await offerService.ingestOffers(req.body.offers);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'INGEST_FAILED', message: 'Failed to ingest offers' } });
  }
});

// POST /api/v1/offers/sync — Sync all affiliate networks (admin)
offersRoutes.post('/sync', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const result = await offerService.syncAllNetworks();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SYNC_FAILED', message: 'Failed to sync networks' } });
  }
});
