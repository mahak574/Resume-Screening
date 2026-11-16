import React from 'react';
import { Bot, Sliders, Database, FileSpreadsheet, Sparkles, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings, analytics }) {
  return (
    <header style={{ 
      background: '#ffffff', 
      borderBottom: '1px solid #e2e8f0', 
      position: 'sticky', 
      top: 0, 
      zIndex: 40,
      boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.03)'
    }}>
      <div style={{ 
        maxWidth: '1360px', 
        margin: '0 auto', 
        padding: '12px 24px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '16px' 
      }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)', 
            padding: '9px', 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
          }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                ScreenAI <span style={{ color: '#4f46e5' }}>ATS</span>
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Intelligent Resume Screening & Candidate Ranking
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{ 
          display: 'flex', 
          gap: '2px', 
          background: '#f1f5f9', 
          padding: '3px', 
          borderRadius: '9px', 
          border: '1px solid #e2e8f0' 
        }}>
          <button 
            type="button"
            className="btn"
            style={{ 
              padding: '6px 14px', 
              fontSize: '0.84rem',
              borderRadius: '7px',
              border: 'none',
              background: activeTab === 'screen' ? '#ffffff' : 'transparent',
              boxShadow: activeTab === 'screen' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
              color: activeTab === 'screen' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'screen' ? 700 : 500
            }}
            onClick={() => setActiveTab('screen')}
          >
            <Sparkles size={15} color={activeTab === 'screen' ? '#4f46e5' : '#64748b'} /> Screen Resumes
          </button>
          <button 
            type="button"
            className="btn"
            style={{ 
              padding: '6px 14px', 
              fontSize: '0.84rem',
              borderRadius: '7px',
              border: 'none',
              background: activeTab === 'multijd' ? '#ffffff' : 'transparent',
              boxShadow: activeTab === 'multijd' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
              color: activeTab === 'multijd' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'multijd' ? 700 : 500
            }}
            onClick={() => setActiveTab('multijd')}
          >
            <FileSpreadsheet size={15} color={activeTab === 'multijd' ? '#4f46e5' : '#64748b'} /> Multi-Role Match
          </button>
          <button 
            type="button"
            className="btn"
            style={{ 
              padding: '6px 14px', 
              fontSize: '0.84rem',
              borderRadius: '7px',
              border: 'none',
              background: activeTab === 'history' ? '#ffffff' : 'transparent',
              boxShadow: activeTab === 'history' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
              color: activeTab === 'history' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'history' ? 700 : 500
            }}
            onClick={() => setActiveTab('history')}
          >
            <Database size={15} color={activeTab === 'history' ? '#4f46e5' : '#64748b'} /> Repository ({analytics?.total_candidates_screened || 0})
          </button>
        </nav>

        {/* Actions & Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {analytics && analytics.average_match_score > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#ecfdf5', 
              padding: '5px 12px', 
              borderRadius: '8px', 
              border: '1px solid #a7f3d0',
              fontSize: '0.8rem'
            }}>
              <Activity size={14} color="#059669" />
              <span style={{ color: '#065f46' }}>Avg Match:</span>
              <strong style={{ color: '#047857' }}>{analytics.average_match_score}%</strong>
            </div>
          )}

          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ padding: '7px 13px', fontSize: '0.82rem', borderRadius: '8px' }}
            onClick={onOpenSettings}
            title="Adjust SBERT, Skill & Experience Weights"
          >
            <Sliders size={14} /> Scoring Weights
          </button>
        </div>

      </div>
    </header>
  );
}
