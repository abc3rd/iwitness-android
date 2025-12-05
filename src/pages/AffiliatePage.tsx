// src/pages/AffiliatePage.tsx
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../auth/AuthContext';

export default function AffiliatePage() {
  const { user } = useAuth();
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Pull affiliate data from auth (every user is an affiliate)
  const affiliateCode = user?.affiliateId ?? 'UCRASH-REFERRAL';

  const referralUrl = useMemo(() => {
    if (user?.referralUrl) return user.referralUrl;
    // Fallback if somehow missing
    return 'https://links.abcdashboard.com/widget/form/Kz0XoGSPFIzyav3t7aGM';
  }, [user?.referralUrl]);

  // Generate QR code locally as a data URL
  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      try {
        const url = await QRCode.toDataURL(referralUrl, {
          width: 300,
          margin: 1,
        });
        if (!cancelled) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('QR generation failed', err);
        if (!cancelled) {
          setQrDataUrl(null);
        }
      }
    };

    void generate();

    return () => {
      cancelled = true;
    };
  }, [referralUrl]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralUrl);
        setCopyStatus('Link copied to clipboard.');
      } else {
        setCopyStatus('Copy not supported on this device. Long-press the link to share.');
      }
      setTimeout(() => setCopyStatus(null), 2500);
    } catch (err) {
      console.error(err);
      setCopyStatus('Unable to copy. Long-press the link to share.');
      setTimeout(() => setCopyStatus(null), 2500);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Affiliate & Referrals</h1>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Every uCRASH iWitness user is automatically an affiliate. Share your link or QR so friends,
        clients, and bystanders can submit accident details directly into the Accident Sharing
        Portal, tracked under your code.
      </p>

      {/* Affiliate code */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid #1e293b',
          padding: 16,
          background: '#020617',
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Your Affiliate Code</div>
        <div style={{ fontSize: 14 }}>
          <code
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: 999,
              background: '#020617',
              border: '1px solid #334155',
              fontSize: 12,
            }}
          >
            {affiliateCode}
          </code>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
          This code is unique to your account and is stored in the uCRASH database along with your
          referral link.
        </div>
      </div>

      {/* Referral link */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid #1e293b',
          padding: 16,
          background: '#020617',
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Your Referral Link</div>
        <div
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: 12,
            border: '1px solid #334155',
            background: 'black',
            fontSize: 12,
            wordBreak: 'break-all',
            marginBottom: 8,
          }}
        >
          {referralUrl}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            borderRadius: 999,
            border: 'none',
            padding: '0.4rem 0.9rem',
            background: 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Copy link
        </button>
        {copyStatus && (
          <div style={{ marginTop: 6, fontSize: 11, opacity: 0.8 }}>{copyStatus}</div>
        )}
      </div>

      {/* QR code */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid #1e293b',
          padding: 16,
          background: '#020617',
          fontSize: 13,
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 600 }}>QR Code</div>
        <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
          Have someone scan this QR code with their camera. It will open your referral link so they
          can submit an accident through uCRASH iWitness tied to your affiliate code.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div
            style={{
              padding: 10,
              borderRadius: 20,
              background:
                'radial-gradient(circle at top, rgba(234,0,234,0.4), transparent 55%), radial-gradient(circle at bottom, rgba(38,153,254,0.4), transparent 55%)',
              border: '1px solid #1e293b',
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Referral QR"
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 12,
                  background: 'white',
                }}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  opacity: 0.7,
                  border: '1px dashed #334155',
                }}
              >
                Generating QR…
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 11, opacity: 0.7 }}>
          On printed cards, flyers, or posters, you can use this QR code next to your name so all
          traffic is tracked back to your affiliate profile.
        </div>
      </div>
    </div>
  );
}

