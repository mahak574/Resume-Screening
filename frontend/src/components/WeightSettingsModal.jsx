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
            <Sliders size={20} color="#6366f1" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Scoring Weights</h2>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
          Customize how candidates are evaluated. Weights are automatically normalized to 100%.
        </p>

        {/* Skill Match Slider */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
            <span>🛠️ Skill Match Weight</span>
            <strong style={{ color: '#34d399' }}>{skills}%</strong>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={skills} 
            onChange={(e) => setSkills(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#34d399' }}
          />
        </div>

        {/* Semantic Similarity Slider */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
            <span>🧠 Semantic Similarity (SBERT)</span>
            <strong style={{ color: '#818cf8' }}>{semantic}%</strong>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={semantic} 
            onChange={(e) => setSemantic(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#818cf8' }}
          />
        </div>

        {/* Experience Slider */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
            <span>⏳ Experience Factor (YOE)</span>
            <strong style={{ color: '#fbbf24' }}>{experience}%</strong>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={experience} 
            onChange={(e) => setExperience(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#fbbf24' }}
          />
        </div>

        {/* Summary */}
        <div style={{ background: '#1f2937', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#9ca3af' }}>Current Balance:</span>
          <span>
            {Math.round((skills / totalSum) * 100)}% Skills • {Math.round((semantic / totalSum) * 100)}% Semantic • {Math.round((experience / totalSum) * 100)}% Exp
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={handleReset}>
            <RotateCcw size={15} /> Reset Defaults
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
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

