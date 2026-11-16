import React, { useState } from 'react';
import { X, Sliders, RotateCcw } from 'lucide-react';

export default function WeightSettingsModal({ weights, onSave, onClose }) {
  const [semantic, setSemantic] = useState(Math.round(weights.semantic_similarity * 100));
  const [skills, setSkills] = useState(Math.round(weights.skill_match * 100));
  const [experience, setExperience] = useState(Math.round(weights.experience_factor * 100));

  const handleReset = () => {
    setSemantic(25);
    setSkills(60);
    setExperience(15);
  };

  const handleApply = () => {
    const total = semantic + skills + experience || 100;
    onSave({
      semantic_similarity: semantic / total,
      skill_match: skills / total,
      experience_factor: experience / total
    });
    onClose();
  };

  const totalSum = semantic + skills + experience;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#eef2ff', padding: '6px', borderRadius: '8px' }}>
              <Sliders size={18} color="#4f46e5" />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Scoring Weights</h2>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
          Customize how candidates are evaluated. Weights are automatically normalized to 100%.
        </p>

        {/* Skill Match Slider */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>🛠️ Skill Match Weight</span>
            <strong style={{ color: '#059669' }}>{skills}%</strong>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={skills} 
            onChange={(e) => setSkills(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Semantic Similarity Slider */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>🧠 Semantic Similarity (SBERT)</span>
            <strong style={{ color: '#4f46e5' }}>{semantic}%</strong>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={semantic} 
            onChange={(e) => setSemantic(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Experience Slider */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>⏳ Experience Factor (YOE)</span>
            <strong style={{ color: '#d97706' }}>{experience}%</strong>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={experience} 
            onChange={(e) => setExperience(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Summary */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.84rem', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Current Ratio:</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {Math.round((skills / totalSum) * 100)}% Skills • {Math.round((semantic / totalSum) * 100)}% Semantic • {Math.round((experience / totalSum) * 100)}% Exp
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={handleReset}>
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleApply}>
              Save Weights
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
