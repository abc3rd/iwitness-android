// Affiliate Offer Marketplace Page
import { useState, useEffect } from 'react';
import type { AffiliateOffer } from '../types';

const SOURCE_COLORS: Record<string, string> = {
  amazon: '#ff9900', ebay: '#e53238', cj: '#0070ba',
  impact: '#6366f1', shareasale: '#22c55e', custom: '#94a3b8',
};

export default function OffersPage() {
  const [offers, setOffers] = useState<AffiliateOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    // Mock offers for demo
    setTimeout(() => {
      setOffers([
        { id: 'off-1', source: 'amazon', name: 'Dash Cam Pro 4K', description: 'Best-selling vehicle dash camera with accident detection', category: 'automotive', advertiser: 'DashTech', commissionType: 'cps', commissionValue: 8.5, commissionCurrency: 'USD', epc: 1.25, conversionRate: 0.085, deepLink: '#', imageUrl: '', landingUrl: '#', geoTargets: ['US'], relevanceScore: 92, isActive: true, createdAt: new Date().toISOString() },
        { id: 'off-2', source: 'cj', name: 'Legal Shield Protection Plan', description: 'Affordable legal protection for accident victims', category: 'legal', advertiser: 'LegalShield', commissionType: 'cpa', commissionValue: 35, commissionCurrency: 'USD', epc: 4.20, conversionRate: 0.12, deepLink: '#', imageUrl: '', landingUrl: '#', geoTargets: ['US'], relevanceScore: 95, isActive: true, createdAt: new Date().toISOString() },
        { id: 'off-3', source: 'impact', name: 'Auto Insurance Comparison', description: 'Compare rates from 50+ insurance providers', category: 'insurance', advertiser: 'InsureCompare', commissionType: 'cpl', commissionValue: 15, commissionCurrency: 'USD', epc: 3.10, conversionRate: 0.095, deepLink: '#', imageUrl: '', landingUrl: '#', geoTargets: ['US'], relevanceScore: 88, isActive: true, createdAt: new Date().toISOString() },
        { id: 'off-4', source: 'shareasale', name: 'Medical Records App', description: 'Digitize and organize medical records securely', category: 'medical', advertiser: 'HealthVault', commissionType: 'cpa', commissionValue: 20, commissionCurrency: 'USD', epc: 2.80, conversionRate: 0.07, deepLink: '#', imageUrl: '', landingUrl: '#', geoTargets: ['US'], relevanceScore: 82, isActive: true, createdAt: new Date().toISOString() },
        { id: 'off-5', source: 'amazon', name: 'First Aid Emergency Kit', description: 'Complete roadside emergency and first aid kit', category: 'automotive', advertiser: 'SafetyFirst', commissionType: 'cps', commissionValue: 4.5, commissionCurrency: 'USD', epc: 0.85, conversionRate: 0.06, deepLink: '#', imageUrl: '', landingUrl: '#', geoTargets: ['US'], relevanceScore: 75, isActive: true, createdAt: new Date().toISOString() },
        { id: 'off-6', source: 'custom', name: 'Accident Attorney Network', description: 'Connect accident victims with top-rated attorneys', category: 'legal', advertiser: 'AttorneyNet', commissionType: 'cpa', commissionValue: 75, commissionCurrency: 'USD', epc: 8.50, conversionRate: 0.11, deepLink: '#', imageUrl: '', landingUrl: '#', geoTargets: ['US'], relevanceScore: 98, isActive: true, createdAt: new Date().toISOString() },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  const categories = [...new Set(offers.map(o => o.category || 'other'))];
  const sources = [...new Set(offers.map(o => o.source))];

  const filtered = offers.filter(o => {
    if (filter !== 'all' && o.source !== filter) return false;
    if (categoryFilter !== 'all' && o.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Affiliate Offers</h1>
      <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        Smart offer matching engine — {offers.length} active offers ranked by relevance, EPC, and conversion probability.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 11, opacity: 0.5, lineHeight: '24px' }}>Network:</span>
          {['all', ...sources].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 999, cursor: 'pointer',
              border: filter === s ? `1px solid ${SOURCE_COLORS[s] || '#4bce2a'}` : '1px solid #334155',
              background: filter === s ? `${SOURCE_COLORS[s] || '#4bce2a'}20` : 'transparent',
              color: filter === s ? SOURCE_COLORS[s] || '#4bce2a' : '#94a3b8',
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 11, opacity: 0.5, lineHeight: '24px' }}>Category:</span>
          {['all', ...categories].map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 999, cursor: 'pointer',
              border: categoryFilter === c ? '1px solid #2699fe' : '1px solid #334155',
              background: categoryFilter === c ? '#2699fe20' : 'transparent',
              color: categoryFilter === c ? '#2699fe' : '#94a3b8',
            }}>{c}</button>
          ))}
        </div>
      </div>

      {loading && <div style={{ fontSize: 13, opacity: 0.7 }}>Loading offers...</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtered.map(offer => (
          <div key={offer.id} style={{
            borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{offer.name}</div>
                <div style={{ fontSize: 11, opacity: 0.5 }}>{offer.advertiser}</div>
              </div>
              <div style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 999,
                border: `1px solid ${SOURCE_COLORS[offer.source] || '#94a3b8'}`,
                color: SOURCE_COLORS[offer.source] || '#94a3b8',
              }}>{offer.source}</div>
            </div>

            <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.4 }}>{offer.description}</div>

            <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #1e293b' }}>
              <div>
                <div style={{ fontSize: 9, opacity: 0.5 }}>Commission</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4bce2a' }}>
                  ${offer.commissionValue} <span style={{ fontSize: 9, opacity: 0.5 }}>{offer.commissionType.toUpperCase()}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, opacity: 0.5 }}>EPC</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2699fe' }}>${offer.epc.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, opacity: 0.5 }}>Conv. Rate</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{(offer.conversionRate * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 9, opacity: 0.5 }}>Score</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: offer.relevanceScore >= 90 ? '#22c55e' : offer.relevanceScore >= 70 ? '#f59e0b' : '#94a3b8' }}>
                  {offer.relevanceScore}
                </div>
              </div>
            </div>

            <button style={{
              borderRadius: 8, border: 'none', padding: '0.4rem',
              background: 'linear-gradient(90deg, #ea00ea, #2699fe)',
              color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4,
            }}>Promote This Offer</button>
          </div>
        ))}
      </div>
    </div>
  );
}
