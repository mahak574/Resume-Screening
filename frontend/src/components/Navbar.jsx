import React from 'react';
import { Bot, Sliders, Database, FileSpreadsheet, Sparkles, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings, analytics }) {
  return (
    <header className="glass-panel" style={{ margin: '16px auto', maxWidth: '1280px', padding: '14px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
            padding: '10px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}>
            <Bot size={26} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                ScreenAI <span style={{ color: '#4f46e5', fontWeight: 600 }}>ATS</span>
              </h1>
              <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>v2.0 Enterprise</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              AI Resume Screening & Contextual Candidate Ranking
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{ 
          display: 'flex', 
          gap: '4px', 
          background: '#f1f5f9', 
          padding: '4px', 
          borderRadius: '11px', 
          border: '1px solid #e2e8f0' 
        }}>
          <button 
            type="button"
            className={`btn ${activeTab === 'screen' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '7px 15px', 
              fontSize: '0.84rem',
              border: activeTab === 'screen' ? 'none' : 'none',
              background: activeTab === 'screen' ? undefined : 'transparent',
              boxShadow: activeTab === 'screen' ? undefined : 'none',
              color: activeTab === 'screen' ? '#fff' : '#475569'
            }}
            onClick={() => setActiveTab('screen')}
          >
            <Sparkles size={15} /> Screen Resumes
          </button>
          <button 
            type="button"
            className={`btn ${activeTab === 'multijd' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '7px 15px', 
              fontSize: '0.84rem',
              border: activeTab === 'multijd' ? 'none' : 'none',
              background: activeTab === 'multijd' ? undefined : 'transparent',
              boxShadow: activeTab === 'multijd' ? undefined : 'none',
              color: activeTab === 'multijd' ? '#fff' : '#475569'
            }}
            onClick={() => setActiveTab('multijd')}
          >
            <FileSpreadsheet size={15} /> Multi-Role Match
          </button>
          <button 
            type="button"
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '7px 15px', 
              fontSize: '0.84rem',
              border: activeTab === 'history' ? 'none' : 'none',
              background: activeTab === 'history' ? undefined : 'transparent',
              boxShadow: activeTab === 'history' ? undefined : 'none',
              color: activeTab === 'history' ? '#fff' : '#475569'
            }}
            onClick={() => setActiveTab('history')}
          >
            <Database size={15} /> Repository ({analytics?.total_candidates_screened || 0})
          </button>
        </nav>

        {/* Actions & Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {analytics && analytics.average_match_score > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#f8fafc', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem'
            }}>
              <Activity size={15} color="#059669" />
              <span style={{ color: '#64748b' }}>Avg Match:</span>
              <strong style={{ color: '#059669' }}>{analytics.average_match_score}%</strong>
            </div>
          )}

          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
            onClick={onOpenSettings}
            title="Adjust SBERT, Skill & Experience Weights"
          >
            <Sliders size={15} /> Weights
          </button>
        </div>

      </div>
    </header>
  );
}
