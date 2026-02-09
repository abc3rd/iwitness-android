// QR Campaign & Viral Distribution API Routes
import { Router } from 'express';
import { qrService } from '../../services/qr.service.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';

export const qrRoutes = Router();

// POST /api/v1/qr/campaigns — Create QR campaign
qrRoutes.post('/campaigns', authenticate, async (req, res) => {
  try {
    const campaign = await qrService.createCampaign({
      ...req.body,
      tenantId: req.auth!.tenantId || req.tenant?.id,
    });
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create QR campaign';
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message } });
  }
});

// GET /api/v1/qr/campaigns — List campaigns for affiliate
qrRoutes.get('/campaigns', authenticate, async (req, res) => {
  try {
    const affiliateId = req.query.affiliateId as string;
    if (!affiliateId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'affiliateId is required' } });
      return;
    }
    const campaigns = await qrService.getCampaignsByAffiliate(affiliateId);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list campaigns' } });
  }
});

// GET /api/v1/qr/campaigns/:id/generate — Generate QR code image
qrRoutes.get('/campaigns/:id/generate', authenticate, async (req, res) => {
  try {
    const dataUrl = await qrService.generateQRCode(req.params.id);
    res.json({ success: true, data: { qrDataUrl: dataUrl } });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'GENERATE_FAILED', message: 'Failed to generate QR code' } });
  }
});

// GET /api/v1/qr/campaigns/:id/stats — Campaign statistics
qrRoutes.get('/campaigns/:id/stats', authenticate, async (req, res) => {
  try {
    const stats = await qrService.getCampaignStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'STATS_FAILED', message: 'Failed to fetch campaign stats' } });
  }
});

// POST /api/v1/qr/scan — Record a QR scan (public endpoint)
qrRoutes.post('/scan', optionalAuth, async (req, res) => {
  try {
    const { campaignId, affiliateId, lat, lng } = req.body;
    if (!campaignId || !affiliateId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'campaignId and affiliateId required' } });
      return;
    }

    // Check geofence if applicable
    if (lat && lng) {
      const inFence = await qrService.checkGeoFence(campaignId, lat, lng);
      if (!inFence) {
        res.status(403).json({ success: false, error: { code: 'GEOFENCE', message: 'QR campaign not active in this location' } });
        return;
      }
    }

    const scan = await qrService.recordScan({
      campaignId,
      affiliateId,
      scannedBy: req.auth?.userId,
      lat,
      lng,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      deviceInfo: req.body.deviceInfo,
    });

    res.status(201).json({ success: true, data: scan });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'SCAN_FAILED', message: 'Failed to record QR scan' } });
  }
});
