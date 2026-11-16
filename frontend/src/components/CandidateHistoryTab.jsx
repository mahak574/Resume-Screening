import React, { useState, useEffect } from 'react';
import { Search, Trash2, Mail, Award, Eye, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function CandidateHistoryTab({ onOpenDetails, onOpenEmail, onOpenGaps }) {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCandidates = async (query = '') => {
    setLoading(true);
    try {
      const data = await api.getCandidates(query);
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(search);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCandidates(search);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this candidate record?')) return;
    try {
      await api.deleteCandidate(id);
      setCandidates((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Failed to delete candidate.');
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-med';
    return 'score-low';
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 40px' }}>
      
      {/* Header & Search */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Candidate Screening Repository</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Persistent records saved via SQLite / MongoDB
            </p>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', minWidth: '320px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                placeholder="Search candidate name, email, or role..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '12px' }} />
            </div>
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => { setSearch(''); fetchCandidates(''); }}
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            Loading candidates repository...
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            <AlertCircle size={32} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
            <p>No candidates found in past screenings.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#111827', borderBottom: '1px solid #374151', color: '#9ca3af', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 18px' }}>Candidate Name</th>
                  <th style={{ padding: '14px 18px' }}>Applied Role</th>
                  <th style={{ padding: '14px 18px' }}>Match Score</th>
                  <th style={{ padding: '14px 18px' }}>Experience</th>
                  <th style={{ padding: '14px 18px' }}>Matched Skills</th>
                  <th style={{ padding: '14px 18px' }}>Screened At</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1f2937', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                      <div style={{ color: '#fff' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{c.email || 'No email'}</div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#e5e7eb' }}>
                      <span className="badge badge-neutral">{c.role || 'General'}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`score-pill ${getScoreBadge(c.match_score)}`} style={{ fontSize: '0.9rem', padding: '2px 8px' }}>
                        {c.match_score}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#9ca3af' }}>
                      {c.years_experience ? `${c.years_experience} yrs` : '0 yrs'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
                        {c.matched_skills && c.matched_skills.slice(0, 3).map((s) => (
                          <span key={s} className="badge badge-success" style={{ fontSize: '0.7rem' }}>{s}</span>
                        ))}
                        {c.matched_skills && c.matched_skills.length > 3 && (
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            +{c.matched_skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#9ca3af', fontSize: '0.8rem' }}>
                      {c.timestamp ? c.timestamp.split(' ')[0] : 'N/A'}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px' }}
                          title="View Details"
                          onClick={() => onOpenDetails(c)}
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px' }}
                          title="Skills Gap"
                          onClick={() => onOpenGaps(c)}
                        >
                          <Award size={15} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px' }}
                          title="Send Email"
                          onClick={() => onOpenEmail(c)}
                        >
                          <Mail size={15} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px' }}
                          title="Delete Candidate"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

