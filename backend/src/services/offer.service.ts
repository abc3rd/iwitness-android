// Affiliate Offer Feed & Monetization Engine
import { query } from '../config/database.js';
import { config } from '../config/index.js';

export interface OfferIngestionInput {
  source: string;
  externalId: string;
  name: string;
  description?: string;
  category?: string;
  advertiser?: string;
  commissionType: string;
  commissionValue: number;
  epc?: number;
  conversionRate?: number;
  deepLink?: string;
  imageUrl?: string;
  landingUrl?: string;
  geoTargets?: string[];
  expiresAt?: string;
  rawData?: Record<string, unknown>;
}

function scoreOffer(offer: OfferIngestionInput, userContext?: {
  location?: string;
  interests?: string[];
  incidentType?: string;
}): number {
  let score = 0;

  // Base score from EPC
  if (offer.epc) score += Math.min(offer.epc * 10, 30);

  // Commission value score
  if (offer.commissionValue > 0) {
    if (offer.commissionType === 'cpa') score += Math.min(offer.commissionValue / 5, 25);
    if (offer.commissionType === 'cps') score += Math.min(offer.commissionValue * 2, 20);
  }

  // Conversion rate bonus
  if (offer.conversionRate && offer.conversionRate > 0.05) score += 15;
  if (offer.conversionRate && offer.conversionRate > 0.10) score += 10;

  // Category relevance for accident/legal
  const legalCategories = ['legal', 'insurance', 'medical', 'automotive', 'health'];
  if (offer.category && legalCategories.includes(offer.category.toLowerCase())) {
    score += 20;
  }

  // User context matching
  if (userContext?.incidentType && offer.category) {
    const relevantMap: Record<string, string[]> = {
      auto_accident: ['automotive', 'insurance', 'legal', 'medical'],
      workplace: ['legal', 'medical', 'health', 'insurance'],
      medical: ['medical', 'health', 'insurance', 'pharmacy'],
      slip_fall: ['legal', 'medical', 'insurance'],
    };
    const relevant = relevantMap[userContext.incidentType] || [];
    if (relevant.includes(offer.category.toLowerCase())) score += 15;
  }

  return Math.min(score, 100);
}

export const offerService = {
  async ingestOffers(offers: OfferIngestionInput[]) {
    let ingested = 0;

    for (const offer of offers) {
      const relevanceScore = scoreOffer(offer);

      await query(
        `INSERT INTO offer_feeds (
          source, external_id, name, description, category, advertiser,
          commission_type, commission_value, epc, conversion_rate,
          deep_link, image_url, landing_url, geo_targets, relevance_score,
          expires_at, raw_data
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT DO NOTHING`,
        [
          offer.source, offer.externalId, offer.name, offer.description || null,
          offer.category || null, offer.advertiser || null,
          offer.commissionType, offer.commissionValue,
          offer.epc || 0, offer.conversionRate || 0,
          offer.deepLink || null, offer.imageUrl || null, offer.landingUrl || null,
          offer.geoTargets || [], relevanceScore,
          offer.expiresAt || null, JSON.stringify(offer.rawData || {}),
        ]
      );
      ingested++;
    }

    return { ingested };
  },

  async getTopOffers(filters: {
    category?: string;
    source?: string;
    geoTarget?: string;
    incidentType?: string;
    limit?: number;
  }) {
    const conditions: string[] = ['is_active = true'];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.category) {
      conditions.push(`category = $${idx++}`);
      params.push(filters.category);
    }
    if (filters.source) {
      conditions.push(`source = $${idx++}`);
      params.push(filters.source);
    }
    if (filters.geoTarget) {
      conditions.push(`$${idx++} = ANY(geo_targets)`);
      params.push(filters.geoTarget);
    }

    const limit = filters.limit || 20;
    params.push(limit);

    const result = await query(
      `SELECT * FROM offer_feeds
       WHERE ${conditions.join(' AND ')}
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY relevance_score DESC, epc DESC
       LIMIT $${idx}`,
      params
    );

    return result.rows;
  },

  async recordClick(input: {
    offerId: string;
    userId?: string;
    affiliateId?: string;
    clickUrl: string;
    ipAddress?: string;
    userAgent?: string;
    lat?: number;
    lng?: number;
  }) {
    const locationPoint = input.lat && input.lng
      ? `SRID=4326;POINT(${input.lng} ${input.lat})`
      : null;

    const result = await query(
      `INSERT INTO offer_clicks (offer_id, user_id, affiliate_id, click_url, ip_address, user_agent, location)
       VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromEWKT($7))
       RETURNING *`,
      [
        input.offerId, input.userId || null, input.affiliateId || null,
        input.clickUrl, input.ipAddress || null, input.userAgent || null,
        locationPoint,
      ]
    );
    return result.rows[0];
  },

  async recordConversion(clickId: string, conversionValue: number) {
    await query(
      'UPDATE offer_clicks SET converted = true, conversion_value = $1 WHERE id = $2',
      [conversionValue, clickId]
    );

    // Get the click to find the affiliate
    const click = await query('SELECT affiliate_id FROM offer_clicks WHERE id = $1', [clickId]);
    if (click.rows.length > 0) {
      const affiliateId = (click.rows[0] as { affiliate_id: string }).affiliate_id;
      if (affiliateId) {
        // Create commission transaction
        await query(
          `INSERT INTO transactions (affiliate_id, type, status, amount, description, reference_type, reference_id)
           VALUES ($1, 'commission', 'pending', $2, 'Offer conversion commission', 'offer_click', $3)`,
          [affiliateId, conversionValue * 0.1, clickId] // 10% commission
        );

        // Update affiliate earnings
        await query(
          'UPDATE affiliates SET pending_balance = pending_balance + $1, total_conversions = total_conversions + 1 WHERE id = $2',
          [conversionValue * 0.1, affiliateId]
        );
      }
    }
  },

  async getOfferPerformance(offerId: string) {
    const result = await query(
      `SELECT
        COUNT(*) as total_clicks,
        COUNT(CASE WHEN converted THEN 1 END) as conversions,
        SUM(conversion_value) as total_revenue,
        COUNT(CASE WHEN converted THEN 1 END)::float / NULLIF(COUNT(*), 0) as conversion_rate
       FROM offer_clicks WHERE offer_id = $1`,
      [offerId]
    );
    return result.rows[0];
  },

  // Fetch offers from external APIs (stubs for each network)
  async syncAmazonOffers() {
    // Amazon Product Advertising API integration
    if (!config.affiliateNetworks.amazon.accessKey) return { synced: 0 };
    // Implementation would call Amazon PA-API here
    return { synced: 0, source: 'amazon' };
  },

  async syncCJOffers() {
    if (!config.affiliateNetworks.cj.apiKey) return { synced: 0 };
    // CJ Affiliate API integration
    return { synced: 0, source: 'cj' };
  },

  async syncImpactOffers() {
    if (!config.affiliateNetworks.impact.accountSid) return { synced: 0 };
    // Impact API integration
    return { synced: 0, source: 'impact' };
  },

  async syncShareASaleOffers() {
    if (!config.affiliateNetworks.shareasale.apiToken) return { synced: 0 };
    // ShareASale API integration
    return { synced: 0, source: 'shareasale' };
  },

  async syncAllNetworks() {
    const results = await Promise.all([
      this.syncAmazonOffers(),
      this.syncCJOffers(),
      this.syncImpactOffers(),
      this.syncShareASaleOffers(),
    ]);

    return { networks: results, totalSynced: results.reduce((sum, r) => sum + r.synced, 0) };
  },
};
