// QR Campaign Management Page
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../auth/AuthContext';

interface Campaign {
  id: string;
  name: string;
  status: string;
  targetUrl: string;
  totalScans: number;
  uniqueScans: number;
  conversions: number;
  createdAt: string;
}

export default function QRCampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  useEffect(() => {
    // Mock campaigns
    setCampaigns([
      { id: 'qr-1', name: 'Street Flyer Campaign', status: 'active', targetUrl: `https://ucrash.claims/r/${user?.affiliateId}`, totalScans: 145, uniqueScans: 98, conversions: 12, createdAt: new Date(Date.now() - 604800000).toISOString() },
      { id: 'qr-2', name: 'Business Card QR', status: 'active', targetUrl: `https://ucrash.claims/r/${user?.affiliateId}`, totalScans: 67, uniqueScans: 45, conversions: 5, createdAt: new Date(Date.now() - 1209600000).toISOString() },
      { id: 'qr-3', name: 'Event Booth Banner', status: 'paused', targetUrl: `https://ucrash.claims/r/${user?.affiliateId}`, totalScans: 312, uniqueScans: 201, conversions: 28, createdAt: new Date(Date.now() - 2592000000).toISOString() },
    ]);
  }, [user]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const campaign: Campaign = {
      id: `qr-${Date.now()}`, name: newName, status: 'active',
      targetUrl: newUrl || `https://ucrash.claims/r/${user?.affiliateId}`,
      totalScans: 0, uniqueScans: 0, conversions: 0, createdAt: new Date().toISOString(),
    };
    setCampaigns(prev => [campaign, ...prev]);
    setNewName(''); setNewUrl(''); setShowCreate(false);
  };

  const generateQR = async (campaign: Campaign) => {
    try {
      const tracked = `${campaign.targetUrl}?qr_campaign=${campaign.id}`;
      const dataUrl = await QRCode.toDataURL(tracked, { width: 400, margin: 1, errorCorrectionLevel: 'H' });
      setSelectedQR(campaign.id);
      setQrImage(dataUrl);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  };

  const totalScans = campaigns.reduce((s, c) => s + c.totalScans, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>QR Campaigns</h1>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
            {campaigns.length} campaigns | {totalScans} total scans | {totalConversions} conversions
          </p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          borderRadius: 999, border: 'none', padding: '0.4rem 1rem',
          background: 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)',
          color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>+ New Campaign</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{
          display: 'flex', gap: 8, marginBottom: 16, padding: 12,
          borderRadius: 12, border: '1px solid #1e293b', background: '#0f172a',
        }}>
          <input placeholder="Campaign name" value={newName} onChange={e => setNewName(e.target.value)}
            style={{ flex: 2, borderRadius: 8, border: '1px solid #334155', padding: '0.4rem 0.6rem', background: 'black', color: 'white', fontSize: 13 }} />
          <input placeholder="Target URL (optional)" value={newUrl} onChange={e => setNewUrl(e.target.value)}
            style={{ flex: 2, borderRadius: 8, border: '1px solid #334155', padding: '0.4rem 0.6rem', background: 'black', color: 'white', fontSize: 13 }} />
          <button type="submit" style={{
            borderRadius: 8, border: 'none', padding: '0.4rem 0.8rem',
            background: '#22c55e', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Create</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {campaigns.map(c => (
          <div key={c.id} style={{
            borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Created: {new Date(c.createdAt).toLocaleDateString()}</div>
              <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{c.targetUrl}</div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#2699fe' }}>{c.totalScans}</div>
                <div style={{ fontSize: 9, opacity: 0.5 }}>Scans</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#ea00ea' }}>{c.uniqueScans}</div>
                <div style={{ fontSize: 9, opacity: 0.5 }}>Unique</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#4bce2a' }}>{c.conversions}</div>
                <div style={{ fontSize: 9, opacity: 0.5 }}>Converts</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 999,
                border: `1px solid ${c.status === 'active' ? '#22c55e' : '#f59e0b'}`,
                color: c.status === 'active' ? '#22c55e' : '#f59e0b',
              }}>{c.status}</span>
              <button onClick={() => generateQR(c)} style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 999,
                border: '1px solid #2699fe', background: 'transparent',
                color: '#2699fe', cursor: 'pointer',
              }}>QR Code</button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {selectedQR && qrImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => { setSelectedQR(null); setQrImage(null); }}>
          <div style={{
            borderRadius: 20, padding: 24, background: '#0f172a', border: '1px solid #1e293b',
            textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              {campaigns.find(c => c.id === selectedQR)?.name}
            </div>
            <div style={{
              padding: 12, borderRadius: 16,
              background: 'radial-gradient(circle at top, rgba(234,0,234,0.3), transparent 55%), radial-gradient(circle at bottom, rgba(38,153,254,0.3), transparent 55%)',
              border: '1px solid #1e293b', display: 'inline-block',
            }}>
              <img src={qrImage} alt="QR Code" style={{ width: 280, height: 280, borderRadius: 12 }} />
            </div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
              Scan to open referral link with campaign tracking
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
