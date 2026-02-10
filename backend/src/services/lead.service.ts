// Lead Management & Scoring Service
import { query, transaction } from '../config/database.js';

export interface CreateLeadInput {
  tenantId?: string;
  affiliateId?: string;
  assignedTo?: string;
  source: string;
  sourceCampaignId?: string;
  fullName: string;
  email: string;
  phone?: string;
  lat?: number;
  lng?: number;
  incidentType?: string;
  incidentDate?: string;
  incidentDescription?: string;
  intakeData?: Record<string, unknown>;
  tags?: string[];
}

export interface LeadFilters {
  tenantId?: string;
  status?: string;
  assignedTo?: string;
  affiliateId?: string;
  source?: string;
  minScore?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Lead scoring weights
const SCORE_WEIGHTS = {
  hasEmail: 10,
  hasPhone: 15,
  hasIncidentType: 10,
  hasIncidentDate: 10,
  hasDescription: 10,
  hasLocation: 15,
  fromQRScan: 5,
  fromReferral: 10,
  recentIncident: 15,
};

function computeLeadScore(lead: CreateLeadInput): { score: number; factors: Record<string, number> } {
  const factors: Record<string, number> = {};
  let score = 0;

  if (lead.email) { factors.hasEmail = SCORE_WEIGHTS.hasEmail; score += SCORE_WEIGHTS.hasEmail; }
  if (lead.phone) { factors.hasPhone = SCORE_WEIGHTS.hasPhone; score += SCORE_WEIGHTS.hasPhone; }
  if (lead.incidentType) { factors.hasIncidentType = SCORE_WEIGHTS.hasIncidentType; score += SCORE_WEIGHTS.hasIncidentType; }
  if (lead.incidentDate) { factors.hasIncidentDate = SCORE_WEIGHTS.hasIncidentDate; score += SCORE_WEIGHTS.hasIncidentDate; }
  if (lead.incidentDescription) { factors.hasDescription = SCORE_WEIGHTS.hasDescription; score += SCORE_WEIGHTS.hasDescription; }
  if (lead.lat && lead.lng) { factors.hasLocation = SCORE_WEIGHTS.hasLocation; score += SCORE_WEIGHTS.hasLocation; }
  if (lead.source === 'qr_scan') { factors.fromQRScan = SCORE_WEIGHTS.fromQRScan; score += SCORE_WEIGHTS.fromQRScan; }
  if (lead.source === 'referral') { factors.fromReferral = SCORE_WEIGHTS.fromReferral; score += SCORE_WEIGHTS.fromReferral; }

  // Recent incident bonus
  if (lead.incidentDate) {
    const daysSince = (Date.now() - new Date(lead.incidentDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) { factors.recentIncident = SCORE_WEIGHTS.recentIncident; score += SCORE_WEIGHTS.recentIncident; }
  }

  return { score: Math.min(score, 100), factors };
}

export const leadService = {
  async create(input: CreateLeadInput) {
    const { score, factors } = computeLeadScore(input);

    const locationPoint = input.lat && input.lng
      ? `SRID=4326;POINT(${input.lng} ${input.lat})`
      : null;

    const result = await query(
      `INSERT INTO leads (
        tenant_id, affiliate_id, assigned_to, source, source_campaign_id,
        full_name, email, phone, location, incident_type, incident_date,
        incident_description, intake_data, score, score_factors, tags
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,ST_GeomFromEWKT($9),$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        input.tenantId || null, input.affiliateId || null, input.assignedTo || null,
        input.source, input.sourceCampaignId || null,
        input.fullName, input.email, input.phone || null,
        locationPoint, input.incidentType || null,
        input.incidentDate || null, input.incidentDescription || null,
        JSON.stringify(input.intakeData || {}),
        score, JSON.stringify(factors),
        input.tags || [],
      ]
    );

    const lead = result.rows[0];

    // Update affiliate referral count
    if (input.affiliateId) {
      await query(
        'UPDATE affiliates SET total_referrals = total_referrals + 1 WHERE id = $1',
        [input.affiliateId]
      );
    }

    return lead;
  },

  async getById(id: string) {
    const result = await query('SELECT * FROM leads WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async list(filters: LeadFilters) {
    const {
      page = 1, pageSize = 25,
      sortBy = 'created_at', sortOrder = 'desc',
    } = filters;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters.tenantId) { conditions.push(`tenant_id = $${paramIdx++}`); params.push(filters.tenantId); }
    if (filters.status) { conditions.push(`status = $${paramIdx++}`); params.push(filters.status); }
    if (filters.assignedTo) { conditions.push(`assigned_to = $${paramIdx++}`); params.push(filters.assignedTo); }
    if (filters.affiliateId) { conditions.push(`affiliate_id = $${paramIdx++}`); params.push(filters.affiliateId); }
    if (filters.source) { conditions.push(`source = $${paramIdx++}`); params.push(filters.source); }
    if (filters.minScore) { conditions.push(`score >= $${paramIdx++}`); params.push(filters.minScore); }
    if (filters.search) {
      conditions.push(`(full_name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR phone ILIKE $${paramIdx})`);
      params.push(`%${filters.search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowedSortColumns = ['created_at', 'score', 'status', 'full_name', 'updated_at'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT * FROM leads ${where} ORDER BY ${safeSort} ${safeOrder} LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        [...params, pageSize, offset]
      ),
      query(`SELECT COUNT(*) as total FROM leads ${where}`, params),
    ]);

    return {
      data: dataResult.rows,
      meta: {
        page,
        pageSize,
        total: parseInt((countResult.rows[0] as { total: string }).total, 10),
        totalPages: Math.ceil(parseInt((countResult.rows[0] as { total: string }).total, 10) / pageSize),
      },
    };
  },

  async updateStatus(id: string, status: string) {
    const result = await query(
      `UPDATE leads SET status = $1, converted_at = CASE WHEN $1 = 'won' THEN NOW() ELSE converted_at END
       WHERE id = $2 RETURNING *`,
      [status, id]
    );

    // If lead was won, update affiliate conversion count
    if (status === 'won') {
      const lead = result.rows[0] as Record<string, string>;
      if (lead.affiliate_id) {
        await query(
          'UPDATE affiliates SET total_conversions = total_conversions + 1 WHERE id = $1',
          [lead.affiliate_id]
        );
      }
    }

    return result.rows[0];
  },

  async assignLead(id: string, assignedTo: string) {
    const result = await query(
      'UPDATE leads SET assigned_to = $1 WHERE id = $2 RETURNING *',
      [assignedTo, id]
    );
    return result.rows[0];
  },

  async bulkScore() {
    // Re-score all leads that haven't been scored recently
    const leads = await query(
      `SELECT id, email, phone, incident_type, incident_date, incident_description, source
       FROM leads WHERE score = 0 OR updated_at < NOW() - INTERVAL '24 hours'`
    );

    let updated = 0;
    for (const lead of leads.rows) {
      const row = lead as Record<string, string>;
      const { score, factors } = computeLeadScore({
        source: row.source,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        incidentType: row.incident_type,
        incidentDate: row.incident_date,
        incidentDescription: row.incident_description,
      });

      await query(
        'UPDATE leads SET score = $1, score_factors = $2 WHERE id = $3',
        [score, JSON.stringify(factors), row.id]
      );
      updated++;
    }

    return { updated };
  },
};
