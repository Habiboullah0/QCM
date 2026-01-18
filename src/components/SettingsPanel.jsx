'use client';
import { useQuizStore } from '@/lib/store';
import { Settings, HelpCircle, Zap } from 'lucide-react';
import Timer from './Timer';

export default function SettingsPanel() {
  const { settings, setSettings, setTimerDuration, status } = useQuizStore();
  const disabled = status === 'loading';
  const timerDisabled = status === 'active' && useQuizStore.getState().isTimerActive;

  return (
    <div className="card animate-fade-in">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
        <Settings size={20} color="var(--primary)" />
        Paramètres
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="flex-between" style={{ padding: '0.75rem', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Explications</span>
          </div>
          <input 
            type="checkbox" 
            checked={settings.showExplanations}
            onChange={(e) => setSettings({ showExplanations: e.target.checked })}
            disabled={disabled}
            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
          />
        </div>

        <div className="flex-between" style={{ padding: '0.75rem', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Feedback instantané</span>
          </div>
          <input 
            type="checkbox" 
            checked={settings.instantFeedback}
            onChange={(e) => setSettings({ instantFeedback: e.target.checked })}
            disabled={disabled}
            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
          />
        </div>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="number" 
              min="1" 
              max="120"
              value={settings.timerDuration}
              onChange={(e) => setTimerDuration(e.target.value)}
              className="input-field"
              style={{ width: '80px', textAlign: 'center' }}
              disabled={timerDisabled}
            />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>minutes</span>
          </div>
          <Timer />
        </div>
      </div>
    </div>
  );
}