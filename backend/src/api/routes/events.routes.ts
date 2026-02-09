// Event Detection & Sensor API Routes
import { Router } from 'express';
import { eventService } from '../../services/event.service.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

export const eventsRoutes = Router();

// POST /api/v1/events/sensor — Submit sensor event (from mobile app)
eventsRoutes.post('/sensor', optionalAuth, async (req, res) => {
  try {
    const result = await eventService.processSensorEvent({
      userId: req.auth?.userId || req.body.userId,
      deviceId: req.body.deviceId,
      eventType: req.body.eventType,
      severity: req.body.severity || 0,
      lat: req.body.lat,
      lng: req.body.lng,
      altitude: req.body.altitude,
      speed: req.body.speed,
      accelerometerData: req.body.accelerometerData,
      gyroscopeData: req.body.gyroscopeData,
      rawSensorData: req.body.rawSensorData,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process sensor event';
    res.status(400).json({ success: false, error: { code: 'EVENT_FAILED', message } });
  }
});

// POST /api/v1/events/geofence-check — Check geofences for location
eventsRoutes.post('/geofence-check', authenticate, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'lat and lng required' } });
      return;
    }

    const events = await eventService.checkGeofences(req.auth!.userId, lat, lng);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'GEOFENCE_FAILED', message: 'Geofence check failed' } });
  }
});

// GET /api/v1/events/recent — Get recent events for user
eventsRoutes.get('/recent', authenticate, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const events = await eventService.getRecentEvents(req.auth!.userId, limit);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list events' } });
  }
});

// GET /api/v1/events/hotspots — Get accident hotspots near location
eventsRoutes.get('/hotspots', authenticate, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 10;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'lat and lng required' } });
      return;
    }

    const hotspots = await eventService.getEventHotspots(lat, lng, radiusKm);
    res.json({ success: true, data: hotspots });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'HOTSPOTS_FAILED', message: 'Failed to fetch hotspots' } });
  }
});

// POST /api/v1/events/geofences — Create a geofence
eventsRoutes.post('/geofences', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const geofence = await eventService.createGeofence({
      tenantId: req.auth!.tenantId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: geofence });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message: 'Failed to create geofence' } });
  }
});
