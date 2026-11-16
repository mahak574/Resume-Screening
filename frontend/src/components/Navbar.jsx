import React from 'react';
import { Bot, Sliders, Database, FileSpreadsheet, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings, analytics }) {
  return (
    <header className="glass-panel" style={{ margin: '16px auto', maxWidth: '1280px', padding: '14px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
            padding: '10px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
          }}>
            <Bot size={26} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                ScreenAI <span style={{ color: '#818cf8', fontWeight: 600 }}>ATS</span>
              </h1>
              <span className="badge badge-info">v2.0 React</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              Enterprise AI Resume Screener & Candidate Ranking
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', gap: '8px', background: '#111827', padding: '6px', borderRadius: '10px', border: '1px solid #374151' }}>
          <button 
            className={`btn ${activeTab === 'screen' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '7px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('screen')}
          >
            <Sparkles size={16} /> Screen Resumes
          </button>
          <button 
            className={`btn ${activeTab === 'multijd' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '7px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('multijd')}
          >
            <FileSpreadsheet size={16} /> Multi-Role Match
          </button>
          <button 
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '7px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('history')}
          >
            <Database size={16} /> Candidates ({analytics?.total_candidates_screened || 0})
          </button>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={onOpenSettings}
            title="Adjust Scoring Weights"
          >
            <Sliders size={16} /> Weights
          </button>
        </div>

      </div>
    </header>
  );
}
