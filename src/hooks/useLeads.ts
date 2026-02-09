// Lead Management Hook
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import type { Lead, LeadStatus, PaginationParams } from '../types';

export function useLeads(initialFilters?: PaginationParams) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaginationParams>(initialFilters || { page: 1, pageSize: 25 });

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getLeads(filters);
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      setLeads([
        { id: 'mock-lead-1', source: 'qr_scan', status: 'new', score: 75, fullName: 'John Smith', email: 'john@example.com', phone: '555-0101', incidentType: 'auto_accident', probability: 0.72, estimatedValue: 5000, tags: ['priority'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), scoreFactors: {}, intakeData: {} },
        { id: 'mock-lead-2', source: 'referral', status: 'contacted', score: 60, fullName: 'Jane Doe', email: 'jane@example.com', incidentType: 'workplace', probability: 0.55, estimatedValue: 3500, tags: [], createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), scoreFactors: {}, intakeData: {} },
        { id: 'mock-lead-3', source: 'web_form', status: 'qualified', score: 85, fullName: 'Bob Wilson', email: 'bob@example.com', phone: '555-0303', incidentType: 'auto_accident', probability: 0.88, estimatedValue: 12000, tags: ['high-value'], createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString(), scoreFactors: {}, intakeData: {} },
      ]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void loadLeads(); }, [loadLeads]);

  const updateStatus = useCallback(async (id: string, status: LeadStatus) => {
    try {
      await apiClient.updateLeadStatus(id, status);
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  }, []);

  return { leads, loading, error, filters, setFilters, refresh: loadLeads, updateStatus };
}
