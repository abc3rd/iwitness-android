// Affiliate Management Service
import { query, transaction } from '../config/database.js';

export interface CreateAffiliateInput {
  userId: string;
  tenantId?: string;
  parentAffiliateId?: string;
  commissionRate?: number;
  payoutMethod?: string;
}

export const affiliateService = {
  async getOrCreate(email: string) {
    const result = await query('SELECT * FROM get_or_create_affiliate($1)', [email]);
    return result.rows[0];
  },

  async getById(id: string) {
    const result = await query(
      `SELECT a.*, u.email, u.full_name, u.avatar_url
       FROM affiliates a
       JOIN users u ON u.id = a.user_id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async getByCode(code: string) {
    const result = await query(
      `SELECT a.*, u.email, u.full_name
       FROM affiliates a
       JOIN users u ON u.id = a.user_id
       WHERE a.affiliate_code = $1`,
      [code]
    );
    return result.rows[0] || null;
  },

  async getByUserId(userId: string) {
    const result = await query(
      `SELECT a.*, u.email, u.full_name
       FROM affiliates a
       JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  async listAffiliates(filters: {
    tenantId?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: string;
  }) {
    const { page = 1, pageSize = 25, sortBy = 'lifetime_earnings' } = filters;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.tenantId) { conditions.push(`a.tenant_id = $${idx++}`); params.push(filters.tenantId); }
    if (filters.isActive !== undefined) { conditions.push(`a.is_active = $${idx++}`); params.push(filters.isActive); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const allowedSort = ['lifetime_earnings', 'total_referrals', 'total_conversions', 'created_at'];
    const safeSort = allowedSort.includes(sortBy) ? sortBy : 'lifetime_earnings';

    const result = await query(
      `SELECT a.*, u.email, u.full_name, u.avatar_url
       FROM affiliates a
       JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY a.${safeSort} DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, pageSize, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM affiliates a ${where}`,
      params
    );

    return {
      data: result.rows,
      meta: {
        page,
        pageSize,
        total: parseInt((countResult.rows[0] as { total: string }).total, 10),
      },
    };
  },

  async getReferralTree(affiliateId: string) {
    // Get multi-level referral tree
    const result = await query(
      `WITH RECURSIVE tree AS (
        SELECT id, affiliate_code, parent_affiliate_id, tier, user_id, 1 as depth
        FROM affiliates WHERE id = $1
        UNION ALL
        SELECT a.id, a.affiliate_code, a.parent_affiliate_id, a.tier, a.user_id, t.depth + 1
        FROM affiliates a
        INNER JOIN tree t ON a.parent_affiliate_id = t.id
        WHERE t.depth < 5
      )
      SELECT t.*, u.email, u.full_name
      FROM tree t
      JOIN users u ON u.id = t.user_id
      ORDER BY t.depth, t.affiliate_code`,
      [affiliateId]
    );

    return result.rows;
  },

  async recordReferral(input: {
    referrerId: string;
    referredUserId: string;
    source: string;
    campaignId?: string;
    lat?: number;
    lng?: number;
  }) {
    const locationPoint = input.lat && input.lng
      ? `SRID=4326;POINT(${input.lng} ${input.lat})`
      : null;

    // Get the attribution path
    const pathResult = await query(
      `WITH RECURSIVE path AS (
        SELECT id, parent_affiliate_id, ARRAY[id] as chain
        FROM affiliates WHERE id = $1
        UNION ALL
        SELECT a.id, a.parent_affiliate_id, p.chain || a.id
        FROM affiliates a
        INNER JOIN path p ON a.id = p.parent_affiliate_id
      )
      SELECT chain FROM path WHERE parent_affiliate_id IS NULL LIMIT 1`,
      [input.referrerId]
    );

    const attributionPath = pathResult.rows.length > 0
      ? (pathResult.rows[0] as { chain: string[] }).chain
      : [input.referrerId];

    const result = await query(
      `INSERT INTO referral_tree (referrer_id, referred_user_id, depth, attribution_path, source, campaign_id, scan_location)
       VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromEWKT($7))
       RETURNING *`,
      [
        input.referrerId, input.referredUserId,
        attributionPath.length, attributionPath,
        input.source, input.campaignId || null, locationPoint,
      ]
    );

    // Update referral count
    await query(
      'UPDATE affiliates SET total_referrals = total_referrals + 1 WHERE id = $1',
      [input.referrerId]
    );

    return result.rows[0];
  },

  async getEarnings(affiliateId: string) {
    const result = await query(
      `SELECT
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' AND created_at > NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as last_30_days,
        COUNT(*) as total_transactions
       FROM transactions
       WHERE affiliate_id = $1 AND type = 'commission'`,
      [affiliateId]
    );

    return result.rows[0];
  },

  async getPerformanceMetrics(affiliateId: string) {
    const [referrals, conversions, earnings] = await Promise.all([
      query(
        `SELECT COUNT(*) as count, DATE(created_at) as date
         FROM referral_tree WHERE referrer_id = $1
         AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at) ORDER BY date`,
        [affiliateId]
      ),
      query(
        `SELECT COUNT(*) as count FROM referral_tree
         WHERE referrer_id = $1 AND converted = true`,
        [affiliateId]
      ),
      this.getEarnings(affiliateId),
    ]);

    return {
      referralsByDay: referrals.rows,
      totalConversions: (conversions.rows[0] as { count: string })?.count || 0,
      earnings,
    };
  },
};
