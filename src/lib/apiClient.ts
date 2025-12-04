// src/lib/apiClient.ts
import { API_BASE_URL } from '../config';

export type Session = {
  id: string;
  title: string;
  status: 'Active' | 'Review' | 'Closed';
  createdAt: string;
};

// simple module-level token storage
let authToken: string | null = null;

// mock data generator – used when no API_BASE_URL is configured
async function getMockSessions(): Promise<Session[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return [
    {
      id: 'S-2025-001',
      title: 'Accident – Cape Coral Bridge',
      status: 'Active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'S-2025-002',
      title: 'Workplace Injury – Warehouse',
      status: 'Review',
      createdAt: new Date().toISOString(),
    },
  ];
}

export const apiClient = {
  setToken(token: string | null) {
    authToken = token;
  },

  async getSessions(): Promise<Session[]> {
    // If no backend URL is configured, use mock data
    if (!API_BASE_URL) {
      return getMockSessions();
    }

    const res = await fetch(`${API_BASE_URL}/sessions`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch sessions: ${res.status}`);
    }

    const data = (await res.json()) as Session[];
    return data;
  },

  async getSessionById(id: string): Promise<Session | null> {
    if (!API_BASE_URL) {
      const sessions = await getMockSessions();
      return sessions.find((s) => s.id === id) ?? null;
    }

    const res = await fetch(`${API_BASE_URL}/sessions/${encodeURIComponent(id)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch session ${id}: ${res.status}`);
    }

    const data = (await res.json()) as Session;
    return data;
  },
};
