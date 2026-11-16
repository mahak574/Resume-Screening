import React from 'react';
import { X, ExternalLink, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';

export default function SkillsGapModal({ candidate, learningResources, onClose }) {
  if (!candidate) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Skills Gap & Learning Roadmap
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              Candidate: <strong style={{ color: '#fff' }}>{candidate.name}</strong> • Role: {candidate.role || 'General'}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Matched Skills by Category */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <CheckCircle size={18} /> Matched Skills ({candidate.matched_skills?.length || 0})
          </h3>
          
          {candidate.categorized_skills && Object.keys(candidate.categorized_skills).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(candidate.categorized_skills).map(([cat, skills]) => (
                <div key={cat} style={{ background: '#1f2937', padding: '10px 14px', borderRadius: '8px', border: '1px solid #374151' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '6px' }}>
                    {cat.replace('_', ' ')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {skills.map((s) => (
                      <span key={s} className="badge badge-success">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {candidate.matched_skills && candidate.matched_skills.length > 0 ? (
                candidate.matched_skills.map((s) => (
                  <span key={s} className="badge badge-success">{s}</span>
                ))
              ) : (
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No exact skills matched.</span>
              )}
            </div>
          )}
        </div>

        {/* Missing Skills with Learning Links */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <AlertCircle size={18} /> Missing Target Skills ({candidate.missing_skills?.length || 0})
          </h3>

          {candidate.missing_skills && candidate.missing_skills.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {candidate.missing_skills.map((skill) => {
                const sLower = skill.toLowerCase().trim();
                const url = learningResources?.[sLower] || `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}`;
                return (
                  <div 
                    key={skill} 
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.08)', 
                      border: '1px solid rgba(239, 68, 68, 0.25)', 
                      padding: '10px 14px', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#fca5a5', fontSize: '0.9rem' }}>
                        {skill}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Recommended course</div>
                    </div>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                    >
                      <BookOpen size={13} /> Learn <ExternalLink size={12} />
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#34d399', textAlign: 'center' }}>
              🎉 Candidate satisfies all target skills for this job description!
            </div>
          )}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

