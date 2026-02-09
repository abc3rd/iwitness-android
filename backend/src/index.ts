// ============================================================
// UCrash + LegendaryLeads Backend Server
// Smart Viral Affiliate Scan & Share Super-App
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { healthCheck } from './config/database.js';
import { resolveTenant } from './middleware/tenant.js';

// Route imports
import { authRoutes } from './api/routes/auth.routes.js';
import { leadsRoutes } from './api/routes/leads.routes.js';
import { casesRoutes } from './api/routes/cases.routes.js';
import { affiliatesRoutes } from './api/routes/affiliates.routes.js';
import { qrRoutes } from './api/routes/qr.routes.js';
import { crmRoutes } from './api/routes/crm.routes.js';
import { eventsRoutes } from './api/routes/events.routes.js';
import { offersRoutes } from './api/routes/offers.routes.js';
import { analyticsRoutes } from './api/routes/analytics.routes.js';
import { tenantsRoutes } from './api/routes/tenants.routes.js';
import { paymentsRoutes } from './api/routes/payments.routes.js';

const app = express();

// -- Global Middleware --
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Tenant resolution
app.use(resolveTenant);

// Request ID
app.use((req, _res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
  next();
});

// -- Health Check --
app.get('/health', async (_req, res) => {
  const dbOk = await healthCheck();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: { database: dbOk ? 'up' : 'down' },
  });
});

// -- API Routes --
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leads', leadsRoutes);
app.use('/api/v1/cases', casesRoutes);
app.use('/api/v1/affiliates', affiliatesRoutes);
app.use('/api/v1/qr', qrRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/offers', offersRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/tenants', tenantsRoutes);
app.use('/api/v1/payments', paymentsRoutes);

// -- RPC compat (Supabase-style) --
app.post('/rpc/get_or_create_affiliate', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'email required' });
      return;
    }
    const { query: dbQuery } = await import('./config/database.js');
    const result = await dbQuery(
      'SELECT * FROM get_or_create_affiliate($1)',
      [email]
    );
    res.json(result.rows[0] || { affiliate_id: `UCRASH-FALLBACK`, referral_url: `https://ucrash.claims/r/fallback` });
  } catch (err) {
    console.error('[RPC] get_or_create_affiliate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -- 404 Handler --
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// -- Error Handler --
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.env === 'production' ? 'Internal server error' : err.message,
    },
  });
});

// -- Start Server --
app.listen(config.port, config.host, () => {
  console.log(`[UCrash API] Server running on http://${config.host}:${config.port}`);
  console.log(`[UCrash API] Environment: ${config.env}`);
});

export default app;
