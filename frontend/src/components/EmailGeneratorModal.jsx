import React, { useState } from 'react';
import { X, Copy, Check, Mail, Send } from 'lucide-react';
import { api } from '../services/api';

export default function EmailGeneratorModal({ candidate, onClose }) {
  if (!candidate) return null;

  const [emailType, setEmailType] = useState('interview');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    fetchEmail(emailType);
  }, [emailType]);

  const fetchEmail = async (type) => {
    setLoading(true);
    try {
      const res = await api.generateEmail({
        candidate_name: candidate.name,
        role: candidate.role || 'Software Engineer',
        type: type,
        matched_skills: candidate.matched_skills || [],
        missing_skills: candidate.missing_skills || []
      });
      setSubject(res.subject);
      setBody(res.body);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#6366f1', padding: '8px', borderRadius: '8px' }}>
              <Mail size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Outreach Email Generator</h2>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>To: {candidate.name} ({candidate.email || 'No email detected'})</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Email Type Selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button 
            className={`btn ${emailType === 'interview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px' }}
            onClick={() => setEmailType('interview')}
          >
            🎉 Interview Invitation
          </button>
          <button 
            className={`btn ${emailType === 'rejection' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px' }}
            onClick={() => setEmailType('rejection')}
          >
            Constructive Feedback
          </button>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Subject</label>
          <input 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            style={{ marginTop: '4px' }}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Email Body</label>
          <textarea 
            rows={10} 
            value={body} 
            onChange={(e) => setBody(e.target.value)}
            style={{ marginTop: '4px', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            {candidate.email ? `Recipient: ${candidate.email}` : 'No email detected in resume'}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCopy} disabled={loading}>
              {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy to Clipboard</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
