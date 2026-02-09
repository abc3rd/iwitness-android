// Analytics & Reporting API Routes
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { query } from '../../config/database.js';

export const analyticsRoutes = Router();

// GET /api/v1/analytics/dashboard — Dashboard metrics
analyticsRoutes.get('/dashboard', authenticate, async (req, res) => {
  try {
    const tenantFilter = req.auth!.tenantId ? 'AND tenant_id = $1' : '';
    const params = req.auth!.tenantId ? [req.auth!.tenantId] : [];

    const [leads, cases, affiliates, revenue] = await Promise.all([
      query(
        `SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_today,
          COUNT(CASE WHEN status = 'won' THEN 1 END) as converted,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as this_week,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '14 days' AND created_at <= NOW() - INTERVAL '7 days' THEN 1 END) as last_week
         FROM leads WHERE 1=1 ${tenantFilter}`,
        params
      ),
      query(
        `SELECT
          COUNT(CASE WHEN status NOT IN ('closed','archived') THEN 1 END) as open_cases,
          COUNT(CASE WHEN status IN ('closed','archived') THEN 1 END) as closed_cases,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_duration_days
         FROM cases WHERE 1=1 ${tenantFilter}`,
        params
      ),
      query(
        `SELECT
          COUNT(CASE WHEN is_active THEN 1 END) as active,
          SUM(lifetime_earnings) as total_earnings,
          SUM(pending_balance) as total_pending
         FROM affiliates WHERE 1=1 ${req.auth!.tenantId ? 'AND tenant_id = $1' : ''}`,
        params
      ),
      query(
        `SELECT
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
         FROM transactions WHERE 1=1 ${req.auth!.tenantId ? 'AND tenant_id = $1' : ''}`,
        params
      ),
    ]);

    const leadsRow = leads.rows[0] as Record<string, string>;
    const thisWeek = parseInt(leadsRow.this_week, 10);
    const lastWeek = parseInt(leadsRow.last_week, 10);
    const leadsTrend = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    res.json({
      success: true,
      data: {
        leads: {
          total: parseInt(leadsRow.total, 10),
          newToday: parseInt(leadsRow.new_today, 10),
          converted: parseInt(leadsRow.converted, 10),
          trend: Math.round(leadsTrend),
        },
        cases: cases.rows[0],
        affiliates: affiliates.rows[0],
        revenue: revenue.rows[0],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DASHBOARD_FAILED', message: 'Failed to fetch dashboard metrics' } });
  }
});

// GET /api/v1/analytics/leads/funnel — Lead conversion funnel
analyticsRoutes.get('/leads/funnel', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT status, COUNT(*) as count
       FROM leads
       ${req.auth!.tenantId ? 'WHERE tenant_id = $1' : ''}
       GROUP BY status
       ORDER BY CASE status
         WHEN 'new' THEN 1 WHEN 'contacted' THEN 2 WHEN 'qualified' THEN 3
         WHEN 'proposal' THEN 4 WHEN 'negotiation' THEN 5 WHEN 'won' THEN 6
         WHEN 'lost' THEN 7 ELSE 8 END`,
      req.auth!.tenantId ? [req.auth!.tenantId] : []
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FUNNEL_FAILED', message: 'Failed to fetch funnel data' } });
  }
});

// GET /api/v1/analytics/leads/by-source — Leads by source
analyticsRoutes.get('/leads/by-source', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT source, COUNT(*) as count, AVG(score) as avg_score
       FROM leads
       ${req.auth!.tenantId ? 'WHERE tenant_id = $1' : ''}
       GROUP BY source ORDER BY count DESC`,
      req.auth!.tenantId ? [req.auth!.tenantId] : []
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SOURCE_FAILED', message: 'Failed to fetch source data' } });
  }
});

// GET /api/v1/analytics/revenue/by-day — Revenue over time
analyticsRoutes.get('/revenue/by-day', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 30;
    const result = await query(
      `SELECT DATE(created_at) as date, SUM(amount) as amount, COUNT(*) as transactions
       FROM transactions
       WHERE status = 'completed'
       AND created_at > NOW() - INTERVAL '${days} days'
       ${req.auth!.tenantId ? 'AND tenant_id = $1' : ''}
       GROUP BY DATE(created_at)
       ORDER BY date`,
      req.auth!.tenantId ? [req.auth!.tenantId] : []
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'REVENUE_FAILED', message: 'Failed to fetch revenue data' } });
  }
});

// GET /api/v1/analytics/affiliates/top — Top performing affiliates
analyticsRoutes.get('/affiliates/top', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const result = await query(
      `SELECT a.id, a.affiliate_code, u.full_name, u.email,
              a.total_referrals, a.total_conversions, a.lifetime_earnings, a.conversion_rate
       FROM affiliates a
       JOIN users u ON u.id = a.user_id
       WHERE a.is_active = true
       ORDER BY a.lifetime_earnings DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'TOP_AFFILIATES_FAILED', message: 'Failed to fetch top affiliates' } });
  }
});

// POST /api/v1/analytics/events — Track analytics event
analyticsRoutes.post('/events', async (req, res) => {
  try {
    const { eventName, eventCategory, eventData, pageUrl, utmSource, utmMedium, utmCampaign } = req.body;
    await query(
      `INSERT INTO analytics_events (tenant_id, user_id, event_name, event_category, event_data, page_url, utm_source, utm_medium, utm_campaign)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        null, null, eventName, eventCategory || null,
        JSON.stringify(eventData || {}), pageUrl || null,
        utmSource || null, utmMedium || null, utmCampaign || null,
      ]
    );
    res.status(201).json({ success: true, data: { message: 'Event tracked' } });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'TRACK_FAILED', message: 'Failed to track event' } });
  }
});
