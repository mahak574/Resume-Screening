import React, { useState } from 'react';
import { Upload, Plus, Trash2, FileText, CheckCircle, Sparkles, Award } from 'lucide-react';
import { api } from '../services/api';

export default function MultiJdTab() {
  const [file, setFile] = useState(null);
  const [jds, setJds] = useState([
    { role: 'Backend Developer', jd_text: 'Looking for a Python developer proficient in FastAPI, PostgreSQL, Docker, and AWS.' },
    { role: 'Full Stack Engineer', jd_text: 'Require experience in React, JavaScript, Node.js, REST APIs, and MongoDB.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAddJd = () => {
    if (jds.length < 5) {
      setJds([...jds, { role: `Role ${jds.length + 1}`, jd_text: '' }]);
    }
  };

  const handleRemoveJd = (index) => {
    setJds(jds.filter((_, idx) => idx !== index));
  };

  const handleUpdateJd = (index, field, value) => {
    const updated = [...jds];
    updated[index][field] = value;
    setJds(updated);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please upload a resume first.');
      return;
    }
    const validJds = jds.filter((j) => j.role.trim() && j.jd_text.trim());
    if (validJds.length === 0) {
      alert('Please provide at least one valid Job Description.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jds_json', JSON.stringify(validJds));

      const res = await api.screenMultiJd(formData);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert('Error running multi-role analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Multi-Role Candidate Fit Matcher</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Evaluate a single candidate against 2 to 5 different job descriptions simultaneously to identify their optimal role fit.
        </p>
      </div>

      <form onSubmit={handleAnalyze}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          {/* Left: Upload Candidate Resume */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <Upload size={18} color="#4f46e5" /> 1. Upload Candidate Resume
            </h3>

            <div style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer'
            }}>
              <input 
                type="file" 
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="multi-resume-input"
              />
              <label htmlFor="multi-resume-input" style={{ cursor: 'pointer', display: 'block' }}>
                <FileText size={32} color="#4f46e5" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {file ? file.name : 'Click to select candidate resume'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  Supports PDF, DOCX, TXT
                </div>
              </label>
            </div>
          </div>

          {/* Right: Job Descriptions */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>2. Job Descriptions to Compare</h3>
              {jds.length < 5 && (
                <button type="button" className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={handleAddJd}>
                  <Plus size={14} /> Add Role ({jds.length}/5)
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '380px', overflowY: 'auto' }}>
              {jds.map((jd, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <input 
                      placeholder="Role Title (e.g. DevOps Engineer)" 
                      value={jd.role}
                      onChange={(e) => handleUpdateJd(idx, 'role', e.target.value)}
                      style={{ fontWeight: 600, maxWidth: '280px', background: '#fff' }}
                    />
                    {jds.length > 1 && (
                      <button type="button" className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleRemoveJd(idx)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <textarea 
                    rows={3} 
                    placeholder="Paste job description requirements and skills..." 
                    value={jd.jd_text}
                    onChange={(e) => handleUpdateJd(idx, 'jd_text', e.target.value)}
                    style={{ background: '#fff' }}
                  />
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '16px' }} 
              disabled={loading || !file}
            >
              {loading ? 'Evaluating Role Fit...' : '🚀 Run Multi-Role Analysis'}
            </button>
          </div>

        </div>
      </form>

      {/* Results or Loading Section */}
      {loading && (
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid #e0e7ff',
            borderTopColor: '#4f46e5',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            Evaluating Multi-Role Fit...
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
            Cross-matching resume competencies and computing comparative fit across all {jds.length} job roles.
          </p>
        </div>
      )}

      {/* Results Section */}
      {!loading && result && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '6px' }}>Analysis Completed</span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Role Fit Breakdown for {result.candidate.name}</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                {result.candidate.email} • {result.candidate.years_experience && result.candidate.years_experience > 0 
                  ? (result.candidate.years_experience < 1 ? `${Math.round(result.candidate.years_experience * 12)} months experience` : `${result.candidate.years_experience} years experience`) 
                  : 'Entry Level / Fresher'}
              </p>
            </div>
            {result.best_role && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 20px', borderRadius: '10px', textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>Best Matched Role</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{result.best_role.role}</div>
                <div style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 700 }}>{result.best_role.match_score}% Match</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {result.roles.map((r, idx) => (
              <div key={idx} style={{ 
                background: idx === 0 ? '#eef2ff' : '#f8fafc', 
                border: idx === 0 ? '1px solid #a5b4fc' : '1px solid #e2e8f0', 
                padding: '16px', 
                borderRadius: '10px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{r.role}</span>
                    {idx === 0 && <span className="badge badge-primary">#1 Best Fit</span>}
                  </div>
                  <span className={`score-pill ${r.match_score >= 70 ? 'score-high' : 'score-med'}`}>
                    {r.match_score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ 
                    width: `${r.match_score}%`, 
                    height: '100%', 
                    background: idx === 0 ? 'linear-gradient(90deg, #4f46e5, #10b981)' : '#94a3b8',
                    transition: 'width 0.5s ease'
                  }} />
                </div>

                <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: '#475569' }}>
                  <div>
                    <strong style={{ color: '#059669' }}>Matched:</strong> {r.matched_skills.join(', ') || 'None'}
                  </div>
                  <div>
                    <strong style={{ color: '#dc2626' }}>Missing:</strong> {r.missing_skills.join(', ') || 'None'}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
