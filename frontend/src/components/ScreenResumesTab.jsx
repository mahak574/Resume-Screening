import React, { useState } from 'react';
import { 
  Upload, FileText, X, Sparkles, Filter, Download, 
  Award, Mail, Eye, ChevronRight, CheckCircle2, AlertTriangle,
  Sliders, UserCheck, Users, Briefcase, Play, RefreshCw, Zap, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

const THRESHOLD_PRESETS = [
  { label: 'Lenient', value: 45 },
  { label: 'Standard', value: 60 },
  { label: 'Strict', value: 75 },
  { label: 'Top Tier', value: 85 },
];

const ROLE_TEMPLATES = [
  {
    role: 'Senior Full Stack Developer',
    jd: 'We are seeking an experienced Full Stack Developer proficient in Python, React, FastAPI, Docker, and PostgreSQL. Experience with AWS cloud infrastructure, Git, and CI/CD pipelines is highly desirable.',
    skills: 'python, react, fastapi, docker, postgresql, aws, git'
  },
  {
    role: 'Machine Learning Engineer',
    jd: 'Looking for an ML Engineer with hands-on expertise in PyTorch, scikit-learn, NLP, Transformers, FastAPI, and model deployment. Experience with XGBoost, Pandas, and MLOps pipelines preferred.',
    skills: 'python, pytorch, scikit-learn, nlp, fastapi, xgboost, pandas'
  },
  {
    role: 'DevOps & Cloud Engineer',
    jd: 'Seeking a DevOps Engineer proficient in Kubernetes, Docker, Terraform, CI/CD with GitHub Actions, AWS, and Linux sysadmin. Monitoring experience with Prometheus or Grafana is a plus.',
    skills: 'kubernetes, docker, terraform, aws, ci/cd, git, linux'
  }
];

export default function ScreenResumesTab({ 
  onOpenDetails, 
  onOpenEmail, 
  onOpenGaps, 
  weights, 
  onRefreshAnalytics 
}) {
  const [role, setRole] = useState(ROLE_TEMPLATES[0].role);
  const [jdText, setJdText] = useState(ROLE_TEMPLATES[0].jd);
  const [reqSkills, setReqSkills] = useState(ROLE_TEMPLATES[0].skills);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [threshold, setThreshold] = useState(60);
  const [filterView, setFilterView] = useState('shortlisted'); // 'shortlisted' | 'all'
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvancedSkills, setShowAdvancedSkills] = useState(false);

  const formatExp = (years) => {
    if (!years || years <= 0) return 'Entry Level';
    if (years < 1) {
      const months = Math.round(years * 12);
      return `${months} mos exp`;
    }
    return `${years} yrs exp`;
  };

  const handleRoleTemplateSelect = (template) => {
    setRole(template.role);
    setJdText(template.jd);
    setReqSkills(template.skills);
  };

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
    if (e) e.preventDefault();
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
    <div style={{ paddingBottom: '40px' }}>
      
      {/* 2-Column Responsive Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Unified Setup Panel */}
        <div className="card" style={{ padding: '22px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={17} color="#4f46e5" /> Screening Setup
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Configure requirements & upload applicant resumes
            </p>
          </div>

          {/* Quick Preset Roles */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              Select Role Template
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ROLE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.role}
                  type="button"
                  onClick={() => handleRoleTemplateSelect(tpl)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    borderRadius: '6px',
                    border: role === tpl.role ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                    background: role === tpl.role ? '#eef2ff' : '#ffffff',
                    color: role === tpl.role ? '#4f46e5' : '#475569',
                    fontWeight: role === tpl.role ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tpl.role.split(' ')[1] || tpl.role}
                </button>
              ))}
            </div>
          </div>

          {/* Target Role Title */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
              Target Role Title
            </label>
            <input 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>

          {/* Job Description Text */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
              Job Description (JD)
            </label>
            <textarea 
              rows={4} 
              value={jdText} 
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste requirements, tech stack, and responsibilities..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Optional Skills Override Toggle */}
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => setShowAdvancedSkills(!showAdvancedSkills)}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {showAdvancedSkills ? '− Hide Custom Required Skills' : '+ Custom Skills Override (Optional)'}
            </button>
            {showAdvancedSkills && (
              <div style={{ marginTop: '8px' }}>
                <input 
                  value={reqSkills} 
                  onChange={(e) => setReqSkills(e.target.value)}
                  placeholder="e.g. python, react, aws, docker"
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  If empty, AI extracts all technical skills directly from the JD text.
                </span>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 16px' }} />

          {/* Upload Resumes Dropzone */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                Upload Resumes ({files.length})
              </label>
              {files.length > 0 && (
                <button 
                  type="button" 
                  onClick={clearAllFiles} 
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear All
                </button>
              )}
            </div>

            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed #4f46e5' : '1px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '16px 12px',
                textAlign: 'center',
                background: isDragging ? '#eef2ff' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
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
                <Upload size={22} color={isDragging ? '#4f46e5' : '#6366f1'} style={{ margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.84rem' }}>
                  Click to browse or drop resumes here
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  Supports PDF, DOCX, TXT • Batch analysis
                </div>
              </label>
            </div>

            {/* Uploaded File Chips */}
            {files.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: '#f1f5f9', 
                    border: '1px solid #e2e8f0', 
                    padding: '6px 10px', 
                    borderRadius: '6px', 
                    fontSize: '0.78rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileText size={14} color="#4f46e5" />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 600, color: '#1e293b' }}>
                        {f.name}
                      </span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Qualification Threshold */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                Qualification Cutoff
              </label>
              <strong style={{ fontSize: '0.92rem', color: '#4f46e5' }}>
                {threshold}% Match
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {THRESHOLD_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setThreshold(p.value)}
                  style={{
                    padding: '5px 2px',
                    fontSize: '0.72rem',
                    borderRadius: '6px',
                    border: threshold === p.value ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                    background: threshold === p.value ? '#4f46e5' : '#ffffff',
                    color: threshold === p.value ? '#ffffff' : '#475569',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {p.value}%
                </button>
              ))}
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

          {/* Main Action Button */}
          <button 
            type="button"
            className="btn btn-primary" 
            style={{ width: '100%', padding: '11px', fontSize: '0.92rem', borderRadius: '8px' }}
            disabled={loading || files.length === 0}
            onClick={handleAnalyze}
          >
            {loading ? (
              <>
                <div className="spinner" /> Analyzing Resumes...
              </>
            ) : (
              <>
                <Zap size={16} /> Screen & Rank Candidates ({files.length})
              </>
            )}
          </button>

        </div>

        {/* Right Column: Dashboard & Screening Results */}
        <div>
          {loading ? (
            <div className="card" style={{ padding: '56px 32px', textAlign: 'center' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: '3px solid #e0e7ff',
                borderTopColor: '#4f46e5',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 20px'
              }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Analyzing Candidate Resumes...
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 24px', lineHeight: '1.5' }}>
                Extracting structured competencies, verifying experience tenure, and computing semantic vector alignment.
              </p>
              <div style={{ 
                display: 'inline-flex', 
                flexWrap: 'wrap',
                justifyContent: 'center', 
                gap: '16px', 
                fontSize: '0.78rem', 
                color: '#475569',
                background: '#f8fafc',
                padding: '10px 18px',
                borderRadius: '9999px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>⚡ Text Extraction</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🎯 Competency Matching</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📊 Contextual Fit Scoring</span>
              </div>
            </div>
          ) : !results ? (
            /* Modern Empty State Showcase */
            <div className="card" style={{ padding: '36px 32px' }}>
              <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 32px' }}>
                <div style={{ 
                  background: '#eef2ff', 
                  width: '54px', 
                  height: '54px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 14px',
                  border: '1px solid #c7d2fe'
                }}>
                  <Sparkles size={26} color="#4f46e5" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  AI Screening Dashboard
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: '1.5' }}>
                  Upload candidate resumes to evaluate job description alignment, match technical skills, and review automated rankings.
                </p>
              </div>

              {/* Engine Features Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ background: '#e0e7ff', padding: '6px', borderRadius: '6px' }}>
                      <Sparkles size={16} color="#4f46e5" />
                    </div>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Semantic Matching</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                    Sentence-BERT embeddings evaluate contextual alignment between candidate profiles and job descriptions.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ background: '#dcfce7', padding: '6px', borderRadius: '6px' }}>
                      <ShieldCheck size={16} color="#16a34a" />
                    </div>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Skill Matching</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                    Detects programming languages, frameworks, databases, and tools with synonym matching.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ background: '#fef3c7', padding: '6px', borderRadius: '6px' }}>
                      <Briefcase size={16} color="#d97706" />
                    </div>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Experience Analysis</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                    Accurately calculates professional work tenure directly from the experience section.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* Results Dashboard View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Metrics Summary Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div className="card" style={{ padding: '14px 18px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Screened</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {results.total_analyzed}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600, textTransform: 'uppercase' }}>Shortlisted (≥{threshold}%)</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
                    {filteredCandidates.length}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 18px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>JD Skills Extracted</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4f46e5', marginTop: '2px' }}>
                    {results.target_jd_skills ? results.target_jd_skills.length : 0}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 18px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Top Candidate Score</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {results.candidates[0] ? `${results.candidates[0].match_score}%` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Interactive Toolbar & Real-time Cutoff Adjuster */}
              <div className="card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  
                  {/* View Switcher */}
                  <div style={{ display: 'flex', gap: '3px', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <button 
                      type="button"
                      className="btn"
                      style={{ 
                        padding: '5px 12px', 
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: filterView === 'shortlisted' ? '#ffffff' : 'transparent',
                        boxShadow: filterView === 'shortlisted' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                        color: filterView === 'shortlisted' ? '#0f172a' : '#64748b',
                        fontWeight: filterView === 'shortlisted' ? 700 : 500
                      }}
                      onClick={() => setFilterView('shortlisted')}
                    >
                      <UserCheck size={14} /> Shortlisted ({filteredCandidates.length})
                    </button>
                    <button 
                      type="button"
                      className="btn"
                      style={{ 
                        padding: '5px 12px', 
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: filterView === 'all' ? '#ffffff' : 'transparent',
                        boxShadow: filterView === 'all' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                        color: filterView === 'all' ? '#0f172a' : '#64748b',
                        fontWeight: filterView === 'all' ? 700 : 500
                      }}
                      onClick={() => setFilterView('all')}
                    >
                      <Users size={14} /> All Screened ({results.candidates.length})
                    </button>
                  </div>

                  {/* Cutoff Slider Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                      Cutoff: <strong style={{ color: '#4f46e5' }}>{threshold}%</strong>
                    </span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={threshold} 
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      style={{ width: '110px' }}
                    />
                  </div>

                  {/* Export CSV */}
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={handleExportCSV}
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              {/* #1 Top Ranked Candidate Spotlight */}
              {filteredCandidates.length > 0 && (
                <div className="card" style={{ 
                  padding: '18px 22px', 
                  border: '1px solid #c7d2fe', 
                  background: 'linear-gradient(180deg, #fbfcfe 0%, #ffffff 100%)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          🏆 #1 Top Ranked Candidate
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          • {formatExp(filteredCandidates[0].years_experience)}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                        {filteredCandidates[0].name}
                      </h2>
                      <p style={{ fontSize: '0.84rem', color: '#475569', marginTop: '4px', maxWidth: '580px', lineHeight: '1.4' }}>
                        {filteredCandidates[0].explanation}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="score-pill score-high" style={{ fontSize: '1.5rem', padding: '5px 16px' }}>
                        {filteredCandidates[0].match_score}%
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }} 
                          onClick={() => onOpenEmail(filteredCandidates[0])}
                        >
                          <Mail size={13} /> Invite
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }} 
                          onClick={() => onOpenDetails(filteredCandidates[0])}
                        >
                          <Eye size={13} /> Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidates List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {displayCandidates.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <AlertTriangle size={28} color="#d97706" style={{ margin: '0 auto 8px' }} />
                    <h3 style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>
                      No Candidates Met the {threshold}% Threshold
                    </h3>
                    <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                      Lower the cutoff slider above or switch to <strong>"All Screened"</strong> to inspect every applicant.
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
                          padding: '16px 20px', 
                          border: isShortlisted ? '1px solid #e2e8f0' : '1px dashed #fca5a5',
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          flexWrap: 'wrap', 
                          gap: '14px' 
                        }}
                      >
                        {/* Candidate Identity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '10px', 
                            background: isShortlisted ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#cbd5e1', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 800,
                            color: '#fff',
                            fontSize: '0.88rem'
                          }}>
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>{c.name}</span>
                              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>• {formatExp(c.years_experience)}</span>
                              {isShortlisted ? (
                                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Qualified</span>
                              ) : (
                                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Below {threshold}%</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                              {c.email || 'Email not detected'}
                            </div>
                          </div>
                        </div>

                        {/* Matched Skills Chips */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {c.matched_skills && c.matched_skills.slice(0, 4).map((s) => (
                              <span key={s} className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                {s}
                              </span>
                            ))}
                            {c.matched_skills && c.matched_skills.length > 4 && (
                              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                                +{c.matched_skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className={`score-pill ${getScoreBadge(c.match_score)}`} style={{ fontSize: '1rem', minWidth: '60px', textAlign: 'center' }}>
                            {c.match_score}%
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '0.76rem' }} 
                              onClick={() => onOpenGaps(c)}
                              title="Inspect missing skills & resources"
                            >
                              Gaps
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '0.76rem' }} 
                              onClick={() => onOpenEmail(c)}
                              title="Generate interview invitation email"
                            >
                              <Mail size={13} />
                            </button>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '0.76rem' }} 
                              onClick={() => onOpenDetails(c)}
                            >
                              Details <ChevronRight size={13} />
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
