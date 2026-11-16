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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Skills Gap & Learning Roadmap
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Candidate: <strong style={{ color: '#0f172a' }}>{candidate.name}</strong> • Role: {candidate.role || 'General'}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Matched Skills by Category */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <CheckCircle size={18} /> Matched Skills ({candidate.matched_skills?.length || 0})
          </h3>
          
          {candidate.categorized_skills && Object.keys(candidate.categorized_skills).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(candidate.categorized_skills).map(([cat, skills]) => (
                <div key={cat} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.04em' }}>
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
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No exact skills matched.</span>
              )}
            </div>
          )}
        </div>

        {/* Missing Skills with Learning Links */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
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
                      background: '#fef2f2', 
                      border: '1px solid #fecaca', 
                      padding: '10px 14px', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.9rem' }}>
                        {skill}
                      </span>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Curated learning guide</div>
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
            <div style={{ padding: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#047857', textAlign: 'center', fontWeight: 600 }}>
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
