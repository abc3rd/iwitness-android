// Case Management API Routes
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { auditMiddleware } from '../../middleware/audit.js';
import { query } from '../../config/database.js';

export const casesRoutes = Router();

// POST /api/v1/cases — Create a new case
casesRoutes.post('/', authenticate, requireRole('admin', 'attorney'), async (req, res) => {
  try {
    const {
      leadId, externalId, title, caseType, attorneyId,
      medicalProviderId, clientId, affiliateId, incidentDate,
      description, notes,
    } = req.body;

    const result = await query(
      `INSERT INTO cases (
        tenant_id, lead_id, external_id, title, case_type, attorney_id,
        medical_provider_id, client_id, affiliate_id, incident_date,
        description, notes, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'intake')
      RETURNING *`,
      [
        req.auth!.tenantId || null, leadId || null, externalId || null,
        title, caseType || null, attorneyId || null,
        medicalProviderId || null, clientId || null, affiliateId || null,
        incidentDate || null, description || null, notes || null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create case';
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message } });
  }
});

// GET /api/v1/cases — List cases
casesRoutes.get('/', authenticate, async (req, res) => {
  try {
    const { status, attorneyId, clientId, page = '1', pageSize = '25' } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Tenant isolation
    if (req.auth!.tenantId) {
      conditions.push(`tenant_id = $${idx++}`);
      params.push(req.auth!.tenantId);
    }

    if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
    if (attorneyId) { conditions.push(`attorney_id = $${idx++}`); params.push(attorneyId); }
    if (clientId) { conditions.push(`client_id = $${idx++}`); params.push(clientId); }

    // Role-based filtering
    if (req.auth!.role === 'attorney') {
      conditions.push(`attorney_id = $${idx++}`);
      params.push(req.auth!.userId);
    } else if (req.auth!.role === 'client') {
      conditions.push(`client_id = $${idx++}`);
      params.push(req.auth!.userId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10);

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT c.*, u_atty.full_name as attorney_name, u_client.full_name as client_name
         FROM cases c
         LEFT JOIN users u_atty ON u_atty.id = c.attorney_id
         LEFT JOIN users u_client ON u_client.id = c.client_id
         ${where}
         ORDER BY c.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, parseInt(pageSize as string, 10), offset]
      ),
      query(`SELECT COUNT(*) as total FROM cases ${where}`, params),
    ]);

    res.json({
      success: true,
      data: dataResult.rows,
      meta: {
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
        total: parseInt((countResult.rows[0] as { total: string }).total, 10),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list cases' } });
  }
});

// GET /api/v1/cases/:id
casesRoutes.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u_atty.full_name as attorney_name, u_client.full_name as client_name,
              u_med.full_name as medical_provider_name
       FROM cases c
       LEFT JOIN users u_atty ON u_atty.id = c.attorney_id
       LEFT JOIN users u_client ON u_client.id = c.client_id
       LEFT JOIN users u_med ON u_med.id = c.medical_provider_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' } });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch case' } });
  }
});

// PATCH /api/v1/cases/:id — Update case
casesRoutes.patch('/:id', authenticate, requireRole('admin', 'attorney'), auditMiddleware('cases'), async (req, res) => {
  try {
    const allowedFields = ['status', 'title', 'description', 'notes', 'attorney_id', 'medical_provider_id', 'settlement_amount'];
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: { code: 'NO_UPDATES', message: 'No fields to update' } });
      return;
    }

    params.push(req.params.id);
    const result = await query(
      `UPDATE cases SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update case' } });
  }
});
