// QR Campaign & Viral Distribution Service
import QRCode from 'qrcode';
import { query } from '../config/database.js';

export interface CreateQRCampaignInput {
  affiliateId: string;
  tenantId?: string;
  name: string;
  description?: string;
  targetUrl: string;
  qrConfig?: {
    width?: number;
    margin?: number;
    color?: { dark: string; light: string };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  };
  geoFence?: {
    type: 'circle' | 'polygon';
    center?: { lat: number; lng: number };
    radiusMeters?: number;
  };
  tags?: string[];
  branding?: Record<string, unknown>;
  startsAt?: string;
  expiresAt?: string;
}

export interface RecordScanInput {
  campaignId: string;
  affiliateId: string;
  scannedBy?: string;
  lat?: number;
  lng?: number;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, unknown>;
}

export const qrService = {
  async createCampaign(input: CreateQRCampaignInput) {
    const qrData = {
      width: input.qrConfig?.width || 300,
      margin: input.qrConfig?.margin || 1,
      color: input.qrConfig?.color || { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: input.qrConfig?.errorCorrectionLevel || 'M',
    };

    const result = await query(
      `INSERT INTO qr_campaigns (
        affiliate_id, tenant_id, name, description, target_url,
        qr_data, geo_fence, tags, branding, starts_at, expires_at, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active')
      RETURNING *`,
      [
        input.affiliateId, input.tenantId || null,
        input.name, input.description || null, input.targetUrl,
        JSON.stringify(qrData),
        input.geoFence ? JSON.stringify(input.geoFence) : null,
        input.tags || [],
        JSON.stringify(input.branding || {}),
        input.startsAt || null, input.expiresAt || null,
      ]
    );

    return result.rows[0];
  },

  async generateQRCode(campaignId: string): Promise<string> {
    const campaign = await query('SELECT * FROM qr_campaigns WHERE id = $1', [campaignId]);
    if (campaign.rows.length === 0) throw new Error('Campaign not found');

    const row = campaign.rows[0] as Record<string, unknown>;
    const qrData = row.qr_data as Record<string, unknown>;
    const targetUrl = row.target_url as string;

    // Build tracked URL with campaign + affiliate attribution
    const trackedUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}qr_campaign=${campaignId}&aff=${row.affiliate_id}`;

    const dataUrl = await QRCode.toDataURL(trackedUrl, {
      width: (qrData.width as number) || 300,
      margin: (qrData.margin as number) || 1,
      color: qrData.color as { dark: string; light: string } | undefined,
      errorCorrectionLevel: (qrData.errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H') || 'M',
    });

    return dataUrl;
  },

  async recordScan(input: RecordScanInput) {
    const locationPoint = input.lat && input.lng
      ? `SRID=4326;POINT(${input.lng} ${input.lat})`
      : null;

    const result = await query(
      `INSERT INTO qr_scans (campaign_id, affiliate_id, scanned_by, scan_location, ip_address, user_agent, device_info)
       VALUES ($1, $2, $3, ST_GeomFromEWKT($4), $5, $6, $7)
       RETURNING *`,
      [
        input.campaignId, input.affiliateId, input.scannedBy || null,
        locationPoint, input.ipAddress || null, input.userAgent || null,
        JSON.stringify(input.deviceInfo || {}),
      ]
    );

    // Update campaign scan counts
    await query(
      `UPDATE qr_campaigns SET total_scans = total_scans + 1 WHERE id = $1`,
      [input.campaignId]
    );

    return result.rows[0];
  },

  async getCampaignsByAffiliate(affiliateId: string) {
    const result = await query(
      `SELECT * FROM qr_campaigns WHERE affiliate_id = $1 ORDER BY created_at DESC`,
      [affiliateId]
    );
    return result.rows;
  },

  async getCampaignStats(campaignId: string) {
    const [campaign, scansByDay, scansByLocation] = await Promise.all([
      query('SELECT * FROM qr_campaigns WHERE id = $1', [campaignId]),
      query(
        `SELECT DATE(created_at) as date, COUNT(*) as scans
         FROM qr_scans WHERE campaign_id = $1
         GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`,
        [campaignId]
      ),
      query(
        `SELECT ST_AsGeoJSON(scan_location) as location, COUNT(*) as count
         FROM qr_scans WHERE campaign_id = $1 AND scan_location IS NOT NULL
         GROUP BY scan_location LIMIT 100`,
        [campaignId]
      ),
    ]);

    return {
      campaign: campaign.rows[0],
      scansByDay: scansByDay.rows,
      scansByLocation: scansByLocation.rows,
    };
  },

  async checkGeoFence(campaignId: string, lat: number, lng: number): Promise<boolean> {
    const campaign = await query('SELECT geo_fence FROM qr_campaigns WHERE id = $1', [campaignId]);
    if (campaign.rows.length === 0) return false;

    const geoFence = (campaign.rows[0] as Record<string, unknown>).geo_fence as Record<string, unknown> | null;
    if (!geoFence) return true; // No geofence = always active

    if (geoFence.type === 'circle') {
      const center = geoFence.center as { lat: number; lng: number };
      const radius = geoFence.radiusMeters as number;
      const result = await query(
        `SELECT ST_DWithin(
          ST_GeomFromText($1, 4326)::geography,
          ST_GeomFromText($2, 4326)::geography,
          $3
        ) as within`,
        [`POINT(${lng} ${lat})`, `POINT(${center.lng} ${center.lat})`, radius]
      );
      return (result.rows[0] as { within: boolean }).within;
    }

    return true;
  },
};
