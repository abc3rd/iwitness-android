// src/lib/apiClient.ts
import { API_BASE_URL, SUPABASE_ANON_KEY } from '../config';

export type Session = {
  id: string; // Supabase uuid or mock id
  external_id?: string | null; // optional human-readable ID (plate, claim ID, etc.)
  title: string;
  status: 'Active' | 'Review' | 'Closed' | string;
  created_at: string;
};

export type Evidence = {
  id: string;
  session_id: string;
  type: string; // e.g. 'license_plate', 'scene_photo'
  url?: string | null;
  created_at: string;
};

export type AffiliateProfile = {
  affiliate_id: string;
  referral_url: string;
  created_at?: string;
};

let authToken: string | null = null;

// ---------------------------
// Mock helpers
// ---------------------------

async function getMockSessions(): Promise<Session[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return [
    {
      id: 'mock-1',
      external_id: 'FL-123-ABC',
      title: 'Accident – Cape Coral Bridge',
      status: 'Active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      external_id: 'Claim-2025-002',
      title: 'Workplace Injury – Warehouse',
      status: 'Review',
      created_at: new Date().toISOString(),
    },
  ];
}

// ---------------------------
// API client
// ---------------------------

export const apiClient = {
  setToken(token: string | null) {
    authToken = token;
  },

  async getSessions(): Promise<Session[]> {
    // If we don't have Supabase config yet, use mocks
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      return getMockSessions();
    }

    const url = `${API_BASE_URL}/sessions?select=*`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...(authToken ? { 'x-iwitness-token': authToken } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch sessions: ${res.status}`);
    }

    const data = (await res.json()) as Session[];
    return data;
  },

  async getSessionById(id: string): Promise<Session | null> {
    // Fallback to mock if no backend configured
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      const sessions = await getMockSessions();
      return sessions.find((s) => s.id === id || s.external_id === id) ?? null;
    }

    const url = `${API_BASE_URL}/sessions?select=*&id=eq.${encodeURIComponent(id)}`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...(authToken ? { 'x-iwitness-token': authToken } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch session ${id}: ${res.status}`);
    }

    const data = (await res.json()) as Session[];
    return data[0] ?? null;
  },

  async createSession(input: {
    title: string;
    external_id?: string;
    status?: string;
  }): Promise<Session> {
    // If no backend configured, return a fake session
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      return {
        id: `mock-${Date.now()}`,
        external_id: input.external_id ?? 'LOCAL',
        title: input.title,
        status: input.status ?? 'Active',
        created_at: new Date().toISOString(),
      };
    }

    const body = {
      title: input.title,
      external_id: input.external_id ?? null,
      status: input.status ?? 'Active',
    };

    const url = `${API_BASE_URL}/sessions`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(authToken ? { 'x-iwitness-token': authToken } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Failed to create session: ${res.status}`);
    }

    const data = (await res.json()) as Session[];
    return data[0];
  },

  async getOrCreateAffiliate(params: { email: string }): Promise<AffiliateProfile> {
    const { email } = params;
    const handle = email.split('@')[0];
    const cleaned = handle.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'REFERRAL';

    // Our safe fallback affiliate profile
    const fallback: AffiliateProfile = {
      affiliate_id: `UCRASH-${cleaned}`,
      referral_url:
        'https://links.abcdashboard.com/widget/form/Kz0XoGSPFIzyav3t7aGM?am_id=' +
        encodeURIComponent(handle),
      created_at: new Date().toISOString(),
    };

    // If no backend configured, just use fallback
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      return fallback;
    }

    // Try backend; if it fails, log and fall back to mock
    try {
      const url = `${API_BASE_URL}/rpc/get_or_create_affiliate`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          ...(authToken ? { 'x-iwitness-token': authToken } : {}),
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(`Bad affiliate response: ${res.status}`);
      }

      const data = (await res.json()) as AffiliateProfile;
      return data;
    } catch (err) {
      console.error('getOrCreateAffiliate failed, using fallback affiliate profile', err);
      return fallback;
    }
  },

  async uploadEvidence(params: {
    sessionId: string;
    file: File;
    type: string; // 'license_plate', 'scene_photo', etc.
    notes?: string;
  }): Promise<Evidence> {
    // TEMP: mock implementation so UI works even without a backend
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      id: `mock-evidence-${Date.now()}`,
      session_id: params.sessionId,
      type: params.type,
      url: 'mock://local-upload',
      created_at: new Date().toISOString(),
    };
  },
};
