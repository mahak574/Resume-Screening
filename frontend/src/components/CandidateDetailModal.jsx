import React from 'react';
import { X, Mail, Phone, ExternalLink, Briefcase, Calendar, Award, Sparkles, Globe } from 'lucide-react';

export default function CandidateDetailModal({ candidate, onClose, onOpenEmail, onOpenGaps }) {
  if (!candidate) return null;

  const scoreClass = candidate.match_score >= 75 ? 'score-high' : candidate.match_score >= 50 ? 'score-med' : 'score-low';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{candidate.name}</h2>
              <span className={`score-pill ${scoreClass}`}>
                {candidate.match_score}%
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '4px' }}>
              Evaluated for: <strong style={{ color: '#fff' }}>{candidate.role || 'General Role'}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Contact Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: '#1f2937', padding: '14px', borderRadius: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Mail size={16} color="#818cf8" />
            <span>{candidate.email || 'Not detected'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Phone size={16} color="#34d399" />
            <span>{candidate.phone || 'Not detected'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Briefcase size={16} color="#fbbf24" />
            <span>{candidate.years_experience || 0} years experience</span>
          </div>
          {candidate.linkedin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <Globe size={16} color="#38bdf8" />
              <a href={candidate.linkedin.startsWith('http') ? candidate.linkedin : `https://${candidate.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                LinkedIn Profile
              </a>
            </div>
          )}
          {candidate.github && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <ExternalLink size={16} color="#e5e7eb" />
              <a href={candidate.github.startsWith('http') ? candidate.github : `https://${candidate.github}`} target="_blank" rel="noopener noreferrer" style={{ color: '#e5e7eb', textDecoration: 'none' }}>
                GitHub Profile
              </a>
            </div>
          )}
        </div>

        {/* Breakdown */}
        {candidate.breakdown && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Score Composition
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: '#111827', border: '1px solid #374151', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                  {candidate.breakdown.skill_score}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Skills Match</div>
              </div>
              <div style={{ background: '#111827', border: '1px solid #374151', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#818cf8' }}>
                  {candidate.breakdown.semantic_score}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Semantic Fit</div>
              </div>
              <div style={{ background: '#111827', border: '1px solid #374151', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>
                  {candidate.breakdown.experience_score}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Experience Factor</div>
              </div>
            </div>
          </div>
        )}

        {/* Explainable AI summary */}
        <div style={{ marginBottom: '20px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '14px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
            <Sparkles size={16} /> Explainable Evaluation
          </div>
          <p style={{ fontSize: '0.85rem', color: '#e5e7eb' }}>
            {candidate.explanation || 'Semantic and skill match completed.'}
          </p>
        </div>

        {/* Matched & Missing Chips */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399', marginBottom: '6px' }}>
            Matched Skills ({candidate.matched_skills?.length || 0})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {candidate.matched_skills && candidate.matched_skills.length > 0 ? (
              candidate.matched_skills.map((s) => (
                <span key={s} className="badge badge-success">{s}</span>
              ))
            ) : (
              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>None</span>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f87171', marginBottom: '6px' }}>
            Missing Skills ({candidate.missing_skills?.length || 0})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {candidate.missing_skills && candidate.missing_skills.length > 0 ? (
              candidate.missing_skills.map((s) => (
                <span key={s} className="badge badge-danger">{s}</span>
              ))
            ) : (
              <span style={{ color: '#34d399', fontSize: '0.85rem' }}>None missing!</span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #374151' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => onOpenEmail(candidate)}>
              <Mail size={16} /> Send Email
            </button>
            <button className="btn btn-secondary" onClick={() => onOpenGaps(candidate)}>
              <Award size={16} /> View Skills Gap & Roadmap
            </button>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
