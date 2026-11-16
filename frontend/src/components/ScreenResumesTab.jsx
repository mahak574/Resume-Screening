import React, { useState } from 'react';
import { 
  Upload, FileText, X, Sparkles, Filter, Download, 
  Award, Mail, Eye, ChevronRight, CheckCircle2, AlertTriangle,
  Sliders, UserCheck, Users, Briefcase
} from 'lucide-react';
import { api } from '../services/api';

const THRESHOLD_PRESETS = [
  { label: 'Lenient', value: 45, desc: 'Broad candidate pool' },
  { label: 'Standard', value: 60, desc: 'Balanced requirements' },
  { label: 'High Priority', value: 75, desc: 'Strict core criteria' },
  { label: 'Top Tier', value: 85, desc: 'Elite match only' },
];

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
  const [filterView, setFilterView] = useState('shortlisted'); // 'shortlisted' | 'all'
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
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
    const candidatesToExport = filterView === 'shortlisted' ? filteredCandidates : results.candidates;
    const headers = ['Rank', 'Candidate Name', 'Role', 'Match Score (%)', 'Status', 'Experience (Years)', 'Email', 'Phone', 'Matched Skills', 'Missing Skills'];
    const rows = candidatesToExport.map((c, i) => [
      i + 1,
      `"${c.name}"`,
      `"${c.role || role}"`,
      c.match_score,
      c.match_score >= threshold ? 'Shortlisted' : 'Below Cutoff',
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
  const displayCandidates = results?.candidates ? (filterView === 'shortlisted' ? filteredCandidates : results.candidates) : [];

  const getScoreBadge = (score) => {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-med';
    return 'score-low';
  };

  const getInitials = (name) => {
    if (!name) return 'CD';
    return name.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 40px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 460px) 1fr', gap: '28px' }}>
        
        {/* Left Column: Form & Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Step 1: Job Description */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '9px', color: '#0f172a' }}>
              <div style={{ background: '#eef2ff', padding: '6px', borderRadius: '8px' }}>
                <Sparkles size={18} color="#4f46e5" />
              </div>
              1. Job Description & Role
            </h2>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Target Role Title</label>
              <input 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                placeholder="e.g. Senior Backend Engineer"
                style={{ marginTop: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Job Description Text</label>
              <textarea 
                rows={5} 
                value={jdText} 
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job requirements and responsibilities..."
                style={{ marginTop: '5px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                Required Skills Override (Optional)
              </label>
              <input 
                value={reqSkills} 
                onChange={(e) => setReqSkills(e.target.value)}
                placeholder="e.g. python, react, aws, docker"
                style={{ marginTop: '5px' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Leave empty to let the AI automatically extract all skills from the JD.
              </span>
            </div>
          </div>

          {/* Step 2: Upload Resumes */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '9px', color: '#0f172a' }}>
                <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '8px' }}>
                  <Upload size={18} color="#059669" />
                </div>
                2. Upload Candidate Resumes
              </h2>
              {files.length > 0 && (
                <button 
                  type="button" 
                  onClick={clearAllFiles} 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  Clear All ({files.length})
                </button>
              )}
            </div>

            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed #4f46e5' : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                background: isDragging ? '#eef2ff' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input 
                type="file" 
                multiple 
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="batch-resume-input"
              />
              <label htmlFor="batch-resume-input" style={{ cursor: 'pointer', display: 'block' }}>
                <Upload size={32} color={isDragging ? '#4f46e5' : '#6366f1'} style={{ margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                  Click to browse or drag & drop resumes here
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '5px' }}>
                  Supports PDF, DOCX, TXT • Bulk resume ranking
                </div>
              </label>
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden' }}>
                      <FileText size={16} color="#4f46e5" />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 600, color: '#1e293b' }}>{f.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}>
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Upfront Qualification Threshold Selection */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '9px', color: '#0f172a' }}>
              <div style={{ background: '#fffbeb', padding: '6px', borderRadius: '8px' }}>
                <Sliders size={18} color="#d97706" />
              </div>
              3. Set Cutoff Threshold
            </h2>

            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px' }}>
              Candidates meeting or exceeding this match score will be marked as <strong>Shortlisted</strong>.
            </p>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {THRESHOLD_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`preset-chip ${threshold === p.value ? 'active' : ''}`}
                  onClick={() => setThreshold(p.value)}
                  style={{ textAlign: 'center', padding: '8px 4px' }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{p.value}%</div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.85, marginTop: '2px' }}>{p.label}</div>
                </button>
              ))}
            </div>

            {/* Interactive Slider & Number Input */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Custom Cutoff:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={threshold}
                    onChange={(e) => setThreshold(Math.max(0, Math.min(100, Number(e.target.value))))}
                    style={{ width: '64px', textAlign: 'center', padding: '4px 6px', fontWeight: 700, fontSize: '0.95rem' }}
                  />
                  <span style={{ fontWeight: 700, color: '#4f46e5' }}>%</span>
                </div>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={threshold} 
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Submit Action */}
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '20px', padding: '12px', fontSize: '0.92rem' }} 
              disabled={loading || files.length === 0}
              onClick={handleAnalyze}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Analyzing Resumes with SBERT...
                </>
              ) : (
                `🚀 Screen & Rank Candidates (${files.length})`
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Results & Interactive Filtering Dashboard */}
        <div>
          {!results ? (
            <div className="card" style={{ textAlign: 'center', padding: '80px 24px', color: '#64748b' }}>
              <div style={{ 
                background: '#eef2ff', 
                width: '68px', 
                height: '68px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 18px',
                border: '1px solid #c7d2fe'
              }}>
                <Sparkles size={32} color="#4f46e5" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                AI Screening Dashboard
              </h3>
              <p style={{ maxWidth: '440px', margin: '0 auto', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Fill in the job requirements, set your qualification threshold cutoff, and upload candidate resumes to view automated ranking, skill matches, and gaps.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Interactive Cutoff Controller & Filters Bar */}
              <div className="card" style={{ padding: '18px 22px', border: '1px solid #c7d2fe', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
                  
                  {/* Left: View Toggle */}
                  <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <button 
                      type="button"
                      className={`btn ${filterView === 'shortlisted' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        padding: '6px 14px', 
                        fontSize: '0.82rem',
                        border: filterView === 'shortlisted' ? 'none' : 'none',
                        background: filterView === 'shortlisted' ? undefined : 'transparent',
                        boxShadow: filterView === 'shortlisted' ? undefined : 'none'
                      }}
                      onClick={() => setFilterView('shortlisted')}
                    >
                      <UserCheck size={15} /> Shortlisted ({filteredCandidates.length})
                    </button>
                    <button 
                      type="button"
                      className={`btn ${filterView === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        padding: '6px 14px', 
                        fontSize: '0.82rem',
                        border: filterView === 'all' ? 'none' : 'none',
                        background: filterView === 'all' ? undefined : 'transparent',
                        boxShadow: filterView === 'all' ? undefined : 'none'
                      }}
                      onClick={() => setFilterView('all')}
                    >
                      <Users size={15} /> All Screened ({results.candidates.length})
                    </button>
                  </div>

                  {/* Right: Export Button */}
                  <button className="btn btn-secondary" onClick={handleExportCSV}>
                    <Download size={15} /> Export CSV
                  </button>
                </div>

                {/* Real-time Threshold Slider Bar */}
                <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Filter size={16} color="#4f46e5" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Adjust Threshold in Real-Time:</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.82rem' }}>
                        {filteredCandidates.length} of {results.candidates.length} Qualified
                      </span>
                      <strong style={{ fontSize: '1.1rem', color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>
                        {threshold}%
                      </strong>
                    </div>
                  </div>

                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={threshold} 
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />

                  {/* Preset Pills */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {THRESHOLD_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setThreshold(p.value)}
                        className={`preset-chip ${threshold === p.value ? 'active' : ''}`}
                        style={{ padding: '3px 9px', fontSize: '0.72rem' }}
                      >
                        {p.value}% ({p.label})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Candidate Spotlight (if any meets threshold) */}
              {filteredCandidates.length > 0 && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #eef2ff 0%, #ecfdf5 100%)', 
                  border: '1px solid #c7d2fe', 
                  borderRadius: '16px', 
                  padding: '22px',
                  boxShadow: '0 4px 16px rgba(79, 70, 229, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="badge badge-success">🏆 #1 Top Ranked Match</span>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          • {filteredCandidates[0].years_experience || 0} yrs experience
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>{filteredCandidates[0].name}</h2>
                      <p style={{ fontSize: '0.88rem', color: '#334155', marginTop: '6px', maxWidth: '580px', lineHeight: '1.5' }}>
                        {filteredCandidates[0].explanation}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="score-pill score-high" style={{ fontSize: '1.6rem', padding: '6px 18px' }}>
                        {filteredCandidates[0].match_score}%
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '0.82rem' }} onClick={() => onOpenEmail(filteredCandidates[0])}>
                          <Mail size={14} /> Invite Candidate
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '0.82rem' }} onClick={() => onOpenDetails(filteredCandidates[0])}>
                          <Eye size={14} /> Full Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidates List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displayCandidates.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <AlertTriangle size={32} color="#d97706" style={{ margin: '0 auto 10px' }} />
                    <h3 style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 700 }}>No Candidates Met the {threshold}% Threshold</h3>
                    <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                      Try lowering the cutoff slider above or switch to <strong>"All Screened"</strong> to inspect every applicant.
                    </p>
                  </div>
                ) : (
                  displayCandidates.map((c, idx) => {
                    const isShortlisted = c.match_score >= threshold;
                    return (
                      <div 
                        key={c.id || idx} 
                        className="card"
                        style={{ 
                          padding: '18px 22px', 
                          border: isShortlisted ? '1px solid #e2e8f0' : '1px dashed #fca5a5',
                          background: isShortlisted ? '#ffffff' : '#fffbfa',
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          flexWrap: 'wrap', 
                          gap: '16px' 
                        }}
                      >
                        {/* Candidate Identity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
                          <div style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '12px', 
                            background: isShortlisted ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#cbd5e1', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 800,
                            color: '#fff',
                            fontSize: '0.95rem'
                          }}>
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{c.name}</span>
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>• {c.years_experience || 0} yrs exp</span>
                              {isShortlisted ? (
                                <span className="badge badge-success">Qualified</span>
                              ) : (
                                <span className="badge badge-warning">Below {threshold}%</span>
                              )}
                            </div>
                            
                            {/* Skills badges */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '7px' }}>
                              {c.matched_skills && c.matched_skills.slice(0, 4).map((s) => (
                                <span key={s} className="badge badge-success" style={{ fontSize: '0.72rem' }}>{s}</span>
                              ))}
                              {c.matched_skills && c.matched_skills.length > 4 && (
                                <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                                  +{c.matched_skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Score & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div className={`score-pill ${getScoreBadge(c.match_score)}`}>
                            {c.match_score}%
                          </div>

                          <div style={{ display: 'flex', gap: '7px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '8px' }} 
                              title="Skills Gap Breakdown"
                              onClick={() => onOpenGaps(c)}
                            >
                              <Award size={16} />
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '8px' }} 
                              title="Send Email"
                              onClick={() => onOpenEmail(c)}
                            >
                              <Mail size={16} />
                            </button>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                              onClick={() => onOpenDetails(c)}
                            >
                              Details <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
