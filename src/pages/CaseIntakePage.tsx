// Case Intake Form Page — Public form for accident reporting
import { useState } from 'react';

export default function CaseIntakePage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '',
    incidentType: '', incidentDate: '', incidentLocation: '',
    description: '', injuries: '', vehicleInfo: '',
    hasAttorney: '', hasInsurance: '', insuranceCompany: '',
    witnessInfo: '', additionalNotes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', borderRadius: 8, border: '1px solid #334155',
    padding: '0.5rem 0.75rem', background: 'black', color: 'white', fontSize: 13,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Would call apiClient.createLead() here
    console.log('Intake submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
        <h2 style={{ fontSize: 20, marginBottom: 8, color: '#22c55e' }}>Intake Submitted Successfully</h2>
        <p style={{ fontSize: 13, opacity: 0.7, maxWidth: 400, margin: '0 auto' }}>
          Your case information has been received. An attorney will review your submission and contact you shortly.
        </p>
        <button onClick={() => { setSubmitted(false); setStep(1); setFormData({ fullName: '', email: '', phone: '', incidentType: '', incidentDate: '', incidentLocation: '', description: '', injuries: '', vehicleInfo: '', hasAttorney: '', hasInsurance: '', insuranceCompany: '', witnessInfo: '', additionalNotes: '' }); }}
          style={{
            marginTop: 20, borderRadius: 999, border: 'none', padding: '0.5rem 1.5rem',
            background: 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Submit Another Report</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Accident / Case Intake</h1>
      <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        Step {step} of 3 — Please provide accurate information about the incident.
      </p>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: s <= step ? 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)' : '#1e293b',
          }} />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Contact Information</div>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input required value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} style={inputStyle} placeholder="John Smith" />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input required type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} style={inputStyle} placeholder="john@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={formData.phone} onChange={e => updateField('phone', e.target.value)} style={inputStyle} placeholder="(555) 123-4567" />
            </div>
            <button type="button" onClick={() => setStep(2)} style={{
              alignSelf: 'flex-end', borderRadius: 999, border: 'none', padding: '0.4rem 1.2rem',
              background: 'linear-gradient(90deg, #ea00ea, #2699fe)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Next</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Incident Details</div>
            <div>
              <label style={labelStyle}>Type of Incident *</label>
              <select required value={formData.incidentType} onChange={e => updateField('incidentType', e.target.value)} style={inputStyle}>
                <option value="">Select...</option>
                <option value="auto_accident">Auto Accident</option>
                <option value="workplace">Workplace Injury</option>
                <option value="slip_fall">Slip & Fall</option>
                <option value="medical">Medical Malpractice</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date of Incident</label>
              <input type="date" value={formData.incidentDate} onChange={e => updateField('incidentDate', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input value={formData.incidentLocation} onChange={e => updateField('incidentLocation', e.target.value)} style={inputStyle} placeholder="Address or intersection" />
            </div>
            <div>
              <label style={labelStyle}>Description *</label>
              <textarea required value={formData.description} onChange={e => updateField('description', e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Describe what happened..." />
            </div>
            <div>
              <label style={labelStyle}>Injuries</label>
              <textarea value={formData.injuries} onChange={e => updateField('injuries', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Describe any injuries..." />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setStep(1)} style={{
                borderRadius: 999, border: '1px solid #334155', padding: '0.4rem 1.2rem',
                background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
              }}>Back</button>
              <button type="button" onClick={() => setStep(3)} style={{
                borderRadius: 999, border: 'none', padding: '0.4rem 1.2rem',
                background: 'linear-gradient(90deg, #ea00ea, #2699fe)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Additional Information</div>
            <div>
              <label style={labelStyle}>Do you have an attorney?</label>
              <select value={formData.hasAttorney} onChange={e => updateField('hasAttorney', e.target.value)} style={inputStyle}>
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="seeking">Seeking representation</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Do you have insurance?</label>
              <select value={formData.hasInsurance} onChange={e => updateField('hasInsurance', e.target.value)} style={inputStyle}>
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unsure">Unsure</option>
              </select>
            </div>
            {formData.hasInsurance === 'yes' && (
              <div>
                <label style={labelStyle}>Insurance Company</label>
                <input value={formData.insuranceCompany} onChange={e => updateField('insuranceCompany', e.target.value)} style={inputStyle} placeholder="Company name" />
              </div>
            )}
            <div>
              <label style={labelStyle}>Vehicle Information (if applicable)</label>
              <input value={formData.vehicleInfo} onChange={e => updateField('vehicleInfo', e.target.value)} style={inputStyle} placeholder="Year, make, model, plate" />
            </div>
            <div>
              <label style={labelStyle}>Additional Notes</label>
              <textarea value={formData.additionalNotes} onChange={e => updateField('additionalNotes', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Any other relevant information..." />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setStep(2)} style={{
                borderRadius: 999, border: '1px solid #334155', padding: '0.4rem 1.2rem',
                background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
              }}>Back</button>
              <button type="submit" style={{
                borderRadius: 999, border: 'none', padding: '0.5rem 2rem',
                background: 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)',
                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Submit Intake</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
