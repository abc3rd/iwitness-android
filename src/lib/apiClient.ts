// src/lib/apiClient.ts — Enhanced API Client
// UCrash + LegendaryLeads + UCP Fusion System
import { API_BASE_URL, SUPABASE_ANON_KEY } from '../config';
import type {
  Lead, Case, Affiliate, QRCampaign, CRMDeal, CRMPipeline,
  CRMActivity, AffiliateOffer, SensorEvent, DashboardMetrics,
  Transaction, Notification, PaginationParams,
} from '../types';

// -- Legacy types for backward compat --
export type Session = {
  id: string;
  external_id?: string | null;
  title: string;
  status: 'Active' | 'Review' | 'Closed' | string;
  created_at: string;
};

export type Evidence = {
  id: string;
  session_id: string;
  type: string;
  url?: string | null;
  created_at: string;
};

export type AffiliateProfile = {
  affiliate_id: string;
  referral_url: string;
  created_at?: string;
};

let authToken: string | null = null;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// ---------------------------
// Mock helpers
// ---------------------------

async function getMockSessions(): Promise<Session[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [
    { id: 'mock-1', external_id: 'FL-123-ABC', title: 'Accident – Cape Coral Bridge', status: 'Active', created_at: new Date().toISOString() },
    { id: 'mock-2', external_id: 'Claim-2025-002', title: 'Workplace Injury – Warehouse', status: 'Review', created_at: new Date().toISOString() },
  ];
}

// ---------------------------
// HTTP helpers
// ---------------------------

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BACKEND_URL}/api/v1${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(error.error?.message || `API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

function supabaseFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(authToken ? { 'x-iwitness-token': authToken } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  return fetch(url, { ...options, headers });
}

// ---------------------------
// API client
// ---------------------------

export const apiClient = {
  setToken(token: string | null) { authToken = token; },
  getToken() { return authToken; },

  // ====== LEGACY SESSIONS ======

  async getSessions(): Promise<Session[]> {
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) return getMockSessions();
    const res = await supabaseFetch('/sessions?select=*');
    if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
    return (await res.json()) as Session[];
  },

  async getSessionById(id: string): Promise<Session | null> {
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      const sessions = await getMockSessions();
      return sessions.find((s) => s.id === id || s.external_id === id) ?? null;
    }
    const res = await supabaseFetch(`/sessions?select=*&id=eq.${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Failed to fetch session ${id}: ${res.status}`);
    const data = (await res.json()) as Session[];
    return data[0] ?? null;
  },

  async createSession(input: { title: string; external_id?: string; status?: string }): Promise<Session> {
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      return { id: `mock-${Date.now()}`, external_id: input.external_id ?? 'LOCAL', title: input.title, status: input.status ?? 'Active', created_at: new Date().toISOString() };
    }
    const res = await supabaseFetch('/sessions', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ title: input.title, external_id: input.external_id ?? null, status: input.status ?? 'Active' }),
    });
    if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
    const data = (await res.json()) as Session[];
    return data[0];
  },

  async getOrCreateAffiliate(params: { email: string }): Promise<AffiliateProfile> {
    const { email } = params;
    const handle = email.split('@')[0];
    const cleaned = handle.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'REFERRAL';
    const fallback: AffiliateProfile = {
      affiliate_id: `UCRASH-${cleaned}`,
      referral_url: `https://ucrash.claims/r/UCRASH-${cleaned}`,
      created_at: new Date().toISOString(),
    };
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) return fallback;
    try {
      const res = await supabaseFetch('/rpc/get_or_create_affiliate', { method: 'POST', body: JSON.stringify({ email }) });
      if (!res.ok) throw new Error(`Bad affiliate response: ${res.status}`);
      return (await res.json()) as AffiliateProfile;
    } catch (err) {
      console.error('getOrCreateAffiliate failed, using fallback', err);
      return fallback;
    }
  },

  async uploadEvidence(params: { sessionId: string; file: File; type: string; notes?: string }): Promise<Evidence> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { id: `mock-evidence-${Date.now()}`, session_id: params.sessionId, type: params.type, url: 'mock://local-upload', created_at: new Date().toISOString() };
  },

  // ====== LEADS ======
  async getLeads(params?: PaginationParams) {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
    if (params?.search) sp.set('search', params.search);
    if (params?.sortBy) sp.set('sortBy', params.sortBy);
    if (params?.sortOrder) sp.set('sortOrder', params.sortOrder);
    if (params?.filters) { for (const [k, v] of Object.entries(params.filters)) sp.set(k, String(v)); }
    return apiFetch<Lead[]>(`/leads?${sp.toString()}`);
  },
  async createLead(data: Partial<Lead>) { return apiFetch<Lead>('/leads', { method: 'POST', body: JSON.stringify(data) }); },
  async updateLeadStatus(id: string, status: string) { return apiFetch<Lead>(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); },

  // ====== CASES ======
  async getCases(params?: PaginationParams) {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
    return apiFetch<Case[]>(`/cases?${sp.toString()}`);
  },
  async createCase(data: Partial<Case>) { return apiFetch<Case>('/cases', { method: 'POST', body: JSON.stringify(data) }); },
  async getCaseById(id: string) { return apiFetch<Case>(`/cases/${id}`); },

  // ====== CRM ======
  async getCRMPipelines() { return apiFetch<CRMPipeline[]>('/crm/pipelines'); },
  async getDefaultPipeline() { return apiFetch<CRMPipeline>('/crm/pipelines/default'); },
  async getCRMDeals(pipelineId: string) { return apiFetch<CRMDeal[]>(`/crm/deals?pipelineId=${pipelineId}`); },
  async createCRMDeal(data: Partial<CRMDeal>) { return apiFetch<CRMDeal>('/crm/deals', { method: 'POST', body: JSON.stringify(data) }); },
  async moveCRMDeal(dealId: string, stage: string) { return apiFetch<CRMDeal>(`/crm/deals/${dealId}/move`, { method: 'PATCH', body: JSON.stringify({ stage }) }); },
  async getCRMActivities(filters: Record<string, string> = {}) { return apiFetch<CRMActivity[]>(`/crm/activities?${new URLSearchParams(filters).toString()}`); },
  async createCRMActivity(data: Partial<CRMActivity>) { return apiFetch<CRMActivity>('/crm/activities', { method: 'POST', body: JSON.stringify(data) }); },

  // ====== QR CAMPAIGNS ======
  async getQRCampaigns(affiliateId: string) { return apiFetch<QRCampaign[]>(`/qr/campaigns?affiliateId=${affiliateId}`); },
  async createQRCampaign(data: Partial<QRCampaign>) { return apiFetch<QRCampaign>('/qr/campaigns', { method: 'POST', body: JSON.stringify(data) }); },
  async generateQRCode(campaignId: string) { return apiFetch<{ qrDataUrl: string }>(`/qr/campaigns/${campaignId}/generate`); },
  async getQRCampaignStats(campaignId: string) { return apiFetch<Record<string, unknown>>(`/qr/campaigns/${campaignId}/stats`); },

  // ====== OFFERS ======
  async getOffers(filters: Record<string, string> = {}) { return apiFetch<AffiliateOffer[]>(`/offers?${new URLSearchParams(filters).toString()}`); },
  async recordOfferClick(offerId: string, affiliateId?: string) {
    return apiFetch('/offers/click', { method: 'POST', body: JSON.stringify({ offerId, affiliateId, clickUrl: window.location.href }) });
  },

  // ====== EVENTS ======
  async submitSensorEvent(data: Partial<SensorEvent>) { return apiFetch('/events/sensor', { method: 'POST', body: JSON.stringify(data) }); },
  async checkGeofences(lat: number, lng: number) { return apiFetch('/events/geofence-check', { method: 'POST', body: JSON.stringify({ lat, lng }) }); },
  async getRecentEvents(limit: number = 50) { return apiFetch<SensorEvent[]>(`/events/recent?limit=${limit}`); },
  async getEventHotspots(lat: number, lng: number, radiusKm: number = 10) { return apiFetch(`/events/hotspots?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`); },

  // ====== ANALYTICS ======
  async getDashboardMetrics() { return apiFetch<DashboardMetrics>('/analytics/dashboard'); },
  async getLeadFunnel() { return apiFetch('/analytics/leads/funnel'); },
  async getLeadsBySource() { return apiFetch('/analytics/leads/by-source'); },
  async getRevenueByDay(days: number = 30) { return apiFetch(`/analytics/revenue/by-day?days=${days}`); },
  async getTopAffiliates(limit: number = 10) { return apiFetch(`/analytics/affiliates/top?limit=${limit}`); },

  // ====== PAYMENTS ======
  async getTransactions(filters: Record<string, string> = {}) { return apiFetch<Transaction[]>(`/payments/transactions?${new URLSearchParams(filters).toString()}`); },
  async requestPayout(affiliateId: string, amount: number) { return apiFetch('/payments/payout-request', { method: 'POST', body: JSON.stringify({ affiliateId, amount }) }); },

  // ====== NOTIFICATIONS ======
  async getNotifications() { return apiFetch<Notification[]>('/notifications'); },

  // ====== TRACKING ======
  async trackEvent(eventName: string, eventData: Record<string, unknown> = {}) {
    try {
      await apiFetch('/analytics/events', {
        method: 'POST',
        body: JSON.stringify({ eventName, eventData, pageUrl: window.location.href }),
      });
    } catch { /* Analytics should not block UX */ }
  },
};
