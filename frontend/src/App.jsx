import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScreenResumesTab from './components/ScreenResumesTab';
import MultiJdTab from './components/MultiJdTab';
import CandidateHistoryTab from './components/CandidateHistoryTab';
import CandidateDetailModal from './components/CandidateDetailModal';
import SkillsGapModal from './components/SkillsGapModal';
import WeightSettingsModal from './components/WeightSettingsModal';
import EmailGeneratorModal from './components/EmailGeneratorModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('screen');
  const [analytics, setAnalytics] = useState(null);
  const [learningResources, setLearningResources] = useState({});
  const [weights, setWeights] = useState({
    semantic_similarity: 0.25,
    skill_match: 0.60,
    experience_factor: 0.15
  });

  // Modal states
  const [detailCandidate, setDetailCandidate] = useState(null);
  const [gapsCandidate, setGapsCandidate] = useState(null);
  const [emailCandidate, setEmailCandidate] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSkillsTaxonomy = async () => {
    try {
      const res = await api.getSkills();
      if (res.learning_resources) {
        setLearningResources(res.learning_resources);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchSkillsTaxonomy();
  }, []);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSettings={() => setSettingsOpen(true)}
        analytics={analytics}
      />

      <main style={{ maxWidth: '1360px', margin: '24px auto 0', padding: '0 24px' }}>
        {activeTab === 'screen' && (
          <ScreenResumesTab 
            onOpenDetails={(c) => setDetailCandidate(c)}
            onOpenEmail={(c) => setEmailCandidate(c)}
            onOpenGaps={(c) => setGapsCandidate(c)}
            weights={weights}
            onRefreshAnalytics={fetchAnalytics}
          />
        )}

        {activeTab === 'multijd' && (
          <MultiJdTab />
        )}

        {activeTab === 'history' && (
          <CandidateHistoryTab 
            onOpenDetails={(c) => setDetailCandidate(c)}
            onOpenEmail={(c) => setEmailCandidate(c)}
            onOpenGaps={(c) => setGapsCandidate(c)}
          />
        )}
      </main>

      {/* Modals */}
      {detailCandidate && (
        <CandidateDetailModal 
          candidate={detailCandidate}
          onClose={() => setDetailCandidate(null)}
          onOpenEmail={(c) => { setDetailCandidate(null); setEmailCandidate(c); }}
          onOpenGaps={(c) => { setDetailCandidate(null); setGapsCandidate(c); }}
        />
      )}

      {gapsCandidate && (
        <SkillsGapModal 
          candidate={gapsCandidate}
          learningResources={learningResources}
          onClose={() => setGapsCandidate(null)}
        />
      )}

      {emailCandidate && (
        <EmailGeneratorModal 
          candidate={emailCandidate}
          onClose={() => setEmailCandidate(null)}
        />
      )}

      {settingsOpen && (
        <WeightSettingsModal 
          weights={weights}
          onSave={(newW) => setWeights(newW)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
