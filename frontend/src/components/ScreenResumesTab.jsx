import React, { useState } from 'react';
import { 
  Upload, FileText, X, Sparkles, Filter, Download, 
  Award, Mail, Eye, ChevronRight, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';

export default function ScreenResumesTab({ 
  onOpenDetails, 
  onOpenEmail, 
  onOpenGaps, 
  weights, 
  onRefreshAnalytics 
}) {
  const [role, setRole] = useState('Senior Full Stack Developer');
  const [jdText, setJdText] = useState(
    'We are seeking an experienced Full Stack Developer proficient in Python, React, FastAPI, Docker, and PostgreSQL. Experience with AWS cloud infrastructure, Git, and CI/CD pipelines is highly desirable.'
  );
  const [reqSkills, setReqSkills] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [threshold, setThreshold] = useState(60);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!jdText.trim()) {
      alert('Please provide a Job Description.');
      return;
    }
    if (files.length === 0) {
      alert('Please upload at least one resume.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      formData.append('jd_text', jdText);
      formData.append('role', role);
      formData.append('req_skills', reqSkills);
      formData.append('weights', JSON.stringify(weights));
      formData.append('threshold', threshold.toString());

      const data = await api.screenResumes(formData);
      setResults(data);
      if (onRefreshAnalytics) onRefreshAnalytics();
    } catch (err) {
      console.error(err);
      alert('Failed to analyze resumes. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!results || !results.candidates) return;
    const headers = ['Candidate Name', 'Role', 'Match Score (%)', 'Experience (Years)', 'Email', 'Phone', 'Matched Skills', 'Missing Skills'];
    const rows = results.candidates.map((c) => [
      `"${c.name}"`,
      `"${c.role || role}"`,
      c.match_score,
      c.years_experience || 0,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${(c.matched_skills || []).join(', ')}"`,
      `"${(c.missing_skills || []).join(', ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `screened_candidates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCandidates = results?.candidates?.filter((c) => c.match_score >= threshold) || [];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 40px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 440px) 1fr', gap: '24px' }}>
        
        {/* Left Column: Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#6366f1" /> 1. Job Description
            </h2>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Target Role</label>
              <input 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                placeholder="e.g. Senior Backend Engineer"
                style={{ marginTop: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Job Description Text</label>
              <textarea 
                rows={5} 
                value={jdText} 
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job requirements..."
                style={{ marginTop: '4px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>
                Target Skills (Optional Override, Comma-Separated)
              </label>
              <input 
                value={reqSkills} 
                onChange={(e) => setReqSkills(e.target.value)}
                placeholder="e.g. python, react, aws, docker"
                style={{ marginTop: '4px' }}
              />
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={20} color="#818cf8" /> 2. Upload Resumes
            </h2>

            <div style={{
              border: '2px dashed #374151',
              borderRadius: '12px',
              padding: '24px 16px',
              textAlign: 'center',
              background: '#0b0f19',
              cursor: 'pointer'
            }}>
              <input 
                type="file" 
                multiple 
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="batch-resume-input"
              />
              <label htmlFor="batch-resume-input" style={{ cursor: 'pointer', display: 'block' }}>
                <Upload size={28} color="#6366f1" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, color: '#e5e7eb', fontSize: '0.9rem' }}>
                  Click to browse resumes
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                  Accepts PDF, DOCX, TXT (Multiple files supported)
                </div>
              </label>
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1f2937', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileText size={15} color="#818cf8" />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{f.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '20px' }} 
              disabled={loading || files.length === 0}
              onClick={handleAnalyze}
            >
              {loading ? 'Evaluating Resumes & Embeddings...' : `🚀 Analyze & Rank Candidates (${files.length})`}
            </button>
          </div>

        </div>

        {/* Right Column: Results Dashboard */}
        <div>
          {!results ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
              <div style={{ 
                background: '#1f2937', 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px' 
              }}>
                <Sparkles size={28} color="#6366f1" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                Candidate Intelligence Center
              </h3>
              <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '0.88rem' }}>
                Upload candidate resumes and a job description on the left to extract skills, calculate semantic similarity, and rank applicants contextually.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Shortlist Filter & Export Bar */}
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
                    <Filter size={18} color="#818cf8" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span>Shortlist Threshold</span>
                        <strong style={{ color: '#818cf8' }}>{threshold}%</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={threshold} 
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#6366f1' }}
                      />
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                      {filteredCandidates.length} of {results.candidates.length} Qualified
                    </span>
                  </div>

                  <button className="btn btn-secondary" onClick={handleExportCSV}>
                    <Download size={16} /> Export CSV
                  </button>

                </div>
              </div>

              {/* #1 Top Candidate Spotlight */}
              {filteredCandidates.length > 0 && (
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15))', 
                  border: '1px solid rgba(99, 102, 241, 0.4)', 
                  borderRadius: '14px', 
                  padding: '20px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="badge badge-success">🏆 Top Ranked Applicant</span>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{filteredCandidates[0].years_experience || 0} yrs experience</span>
                      </div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{filteredCandidates[0].name}</h2>
                      <p style={{ fontSize: '0.85rem', color: '#e5e7eb', marginTop: '4px', maxWidth: '550px' }}>
                        {filteredCandidates[0].explanation}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="score-pill score-high" style={{ fontSize: '1.5rem', padding: '6px 16px' }}>
                        {filteredCandidates[0].match_score}%
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => onOpenEmail(filteredCandidates[0])}>
                          <Mail size={14} /> Invite
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => onOpenDetails(filteredCandidates[0])}>
                          <Eye size={14} /> Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredCandidates.map((c, idx) => {
                  const scoreClass = c.match_score >= 75 ? 'score-high' : c.match_score >= 50 ? 'score-med' : 'score-low';
                  return (
                    <div 
                      key={c.id || idx} 
                      className="card"
                      style={{ 
                        padding: '16px 20px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        flexWrap: 'wrap', 
                        gap: '14px' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '10px', 
                          background: '#1f2937', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 800,
                          color: '#818cf8'
                        }}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{c.name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>• {c.years_experience || 0} yrs exp</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {c.matched_skills && c.matched_skills.slice(0, 4).map((s) => (
                              <span key={s} className="badge badge-success" style={{ fontSize: '0.7rem' }}>{s}</span>
                            ))}
                            {c.matched_skills && c.matched_skills.length > 4 && (
                              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                                +{c.matched_skills.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div className={`score-pill ${scoreClass}`}>
                          {c.match_score}%
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '7px' }} 
                            title="Skills Gap Analysis"
                            onClick={() => onOpenGaps(c)}
                          >
                            <Award size={16} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '7px' }} 
                            title="Generate Outreach Email"
                            onClick={() => onOpenEmail(c)}
                          >
                            <Mail size={16} />
                          </button>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                            onClick={() => onOpenDetails(c)}
                          >
                            Details <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
