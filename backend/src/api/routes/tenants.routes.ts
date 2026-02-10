// Tenant / White-Label Management API Routes
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { auditMiddleware } from '../../middleware/audit.js';
import { query } from '../../config/database.js';

export const tenantsRoutes = Router();

// POST /api/v1/tenants — Create new tenant
tenantsRoutes.post('/', authenticate, requireRole('super_admin'), auditMiddleware('tenants'), async (req, res) => {
  try {
    const { name, slug, domain, customDomain, branding, subscriptionTier } = req.body;

    const result = await query(
      `INSERT INTO tenants (name, slug, domain, custom_domain, branding, subscription_tier)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, slug, domain || null, customDomain || null, JSON.stringify(branding || {}), subscriptionTier || 'free']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create tenant';
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message } });
  }
});

// GET /api/v1/tenants — List tenants (super admin)
tenantsRoutes.get('/', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list tenants' } });
  }
});

// GET /api/v1/tenants/:id
tenantsRoutes.get('/:id', authenticate, requireRole('admin', 'tenant_owner'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM tenants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch tenant' } });
  }
});

// PATCH /api/v1/tenants/:id — Update tenant settings/branding
tenantsRoutes.patch('/:id', authenticate, requireRole('admin', 'tenant_owner'), auditMiddleware('tenants'), async (req, res) => {
  try {
    const allowedFields = ['name', 'domain', 'custom_domain', 'branding', 'settings', 'subscription_tier'];
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const value = typeof req.body[field] === 'object' ? JSON.stringify(req.body[field]) : req.body[field];
        updates.push(`${field} = $${idx++}`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: { code: 'NO_UPDATES', message: 'No fields to update' } });
      return;
    }

    params.push(req.params.id);
    const result = await query(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update tenant' } });
  }
});
