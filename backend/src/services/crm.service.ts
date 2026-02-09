// CRM Pipeline Management Service — LegendaryLeads Fusion
import { query, transaction } from '../config/database.js';

const DEFAULT_STAGES = [
  { key: 'prospect', label: 'Prospect', color: '#6b7280', order: 1 },
  { key: 'contacted', label: 'Contacted', color: '#3b82f6', order: 2 },
  { key: 'qualified', label: 'Qualified', color: '#8b5cf6', order: 3 },
  { key: 'proposal_sent', label: 'Proposal Sent', color: '#f59e0b', order: 4 },
  { key: 'negotiation', label: 'Negotiation', color: '#ef4444', order: 5 },
  { key: 'closed_won', label: 'Closed Won', color: '#22c55e', order: 6 },
  { key: 'closed_lost', label: 'Closed Lost', color: '#64748b', order: 7 },
];

export const crmService = {
  // -- Pipelines --
  async createPipeline(input: { tenantId?: string; name: string; description?: string; createdBy: string }) {
    const result = await query(
      `INSERT INTO crm_pipelines (tenant_id, name, description, stages, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.tenantId || null, input.name, input.description || null, JSON.stringify(DEFAULT_STAGES), input.createdBy]
    );
    return result.rows[0];
  },

  async getDefaultPipeline(tenantId?: string) {
    const result = await query(
      `SELECT * FROM crm_pipelines WHERE is_default = true ${tenantId ? 'AND tenant_id = $1' : ''} LIMIT 1`,
      tenantId ? [tenantId] : []
    );

    if (result.rows.length === 0) {
      // Create default pipeline
      const created = await query(
        `INSERT INTO crm_pipelines (tenant_id, name, description, stages, is_default)
         VALUES ($1, 'Default Pipeline', 'Main sales pipeline', $2, true) RETURNING *`,
        [tenantId || null, JSON.stringify(DEFAULT_STAGES)]
      );
      return created.rows[0];
    }

    return result.rows[0];
  },

  async getPipelines(tenantId?: string) {
    const result = await query(
      `SELECT * FROM crm_pipelines ${tenantId ? 'WHERE tenant_id = $1' : ''} ORDER BY created_at`,
      tenantId ? [tenantId] : []
    );
    return result.rows;
  },

  // -- Deals --
  async createDeal(input: {
    pipelineId: string;
    leadId?: string;
    caseId?: string;
    tenantId?: string;
    title: string;
    value?: number;
    assignedTo?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
    expectedCloseDate?: string;
    tags?: string[];
  }) {
    const result = await query(
      `INSERT INTO crm_deals (
        pipeline_id, lead_id, case_id, tenant_id, title, value,
        assigned_to, contact_name, contact_email, contact_phone,
        notes, expected_close_date, tags, stage
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'prospect')
      RETURNING *`,
      [
        input.pipelineId, input.leadId || null, input.caseId || null,
        input.tenantId || null, input.title, input.value || 0,
        input.assignedTo || null, input.contactName || null,
        input.contactEmail || null, input.contactPhone || null,
        input.notes || null, input.expectedCloseDate || null,
        input.tags || [],
      ]
    );
    return result.rows[0];
  },

  async moveDeal(dealId: string, stage: string) {
    const result = await query(
      `UPDATE crm_deals SET stage = $1,
       actual_close_date = CASE WHEN $1 IN ('closed_won','closed_lost') THEN CURRENT_DATE ELSE actual_close_date END
       WHERE id = $2 RETURNING *`,
      [stage, dealId]
    );
    return result.rows[0];
  },

  async getDealsByPipeline(pipelineId: string) {
    const result = await query(
      `SELECT d.*, u.full_name as assigned_name
       FROM crm_deals d
       LEFT JOIN users u ON u.id = d.assigned_to
       WHERE d.pipeline_id = $1
       ORDER BY d.stage, d.created_at`,
      [pipelineId]
    );
    return result.rows;
  },

  async getDealsByStage(pipelineId: string) {
    const result = await query(
      `SELECT stage, COUNT(*) as count, SUM(value) as total_value
       FROM crm_deals WHERE pipeline_id = $1
       GROUP BY stage ORDER BY stage`,
      [pipelineId]
    );
    return result.rows;
  },

  // -- Activities --
  async createActivity(input: {
    dealId?: string;
    leadId?: string;
    userId: string;
    type: string;
    subject?: string;
    body?: string;
    scheduledAt?: string;
    aiGenerated?: boolean;
  }) {
    const result = await query(
      `INSERT INTO crm_activities (deal_id, lead_id, user_id, type, subject, body, scheduled_at, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.dealId || null, input.leadId || null, input.userId,
        input.type, input.subject || null, input.body || null,
        input.scheduledAt || null, input.aiGenerated || false,
      ]
    );
    return result.rows[0];
  },

  async completeActivity(activityId: string, outcome?: string) {
    const result = await query(
      `UPDATE crm_activities SET status = 'completed', completed_at = NOW(), outcome = $1
       WHERE id = $2 RETURNING *`,
      [outcome || null, activityId]
    );
    return result.rows[0];
  },

  async getActivities(filters: { dealId?: string; leadId?: string; userId?: string; status?: string }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.dealId) { conditions.push(`deal_id = $${idx++}`); params.push(filters.dealId); }
    if (filters.leadId) { conditions.push(`lead_id = $${idx++}`); params.push(filters.leadId); }
    if (filters.userId) { conditions.push(`user_id = $${idx++}`); params.push(filters.userId); }
    if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT a.*, u.full_name as user_name
       FROM crm_activities a
       LEFT JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY COALESCE(a.scheduled_at, a.created_at) DESC`,
      params
    );
    return result.rows;
  },

  async getPipelineSummary(pipelineId: string) {
    const [deals, activities, revenue] = await Promise.all([
      query(
        `SELECT stage, COUNT(*) as count, SUM(value) as total_value, AVG(probability) as avg_probability
         FROM crm_deals WHERE pipeline_id = $1 GROUP BY stage`,
        [pipelineId]
      ),
      query(
        `SELECT type, COUNT(*) as count
         FROM crm_activities WHERE deal_id IN (SELECT id FROM crm_deals WHERE pipeline_id = $1)
         AND created_at > NOW() - INTERVAL '7 days'
         GROUP BY type`,
        [pipelineId]
      ),
      query(
        `SELECT SUM(value) as total FROM crm_deals WHERE pipeline_id = $1 AND stage = 'closed_won'`,
        [pipelineId]
      ),
    ]);

    return {
      dealsByStage: deals.rows,
      recentActivities: activities.rows,
      totalRevenue: (revenue.rows[0] as { total: string })?.total || '0',
    };
  },
};
