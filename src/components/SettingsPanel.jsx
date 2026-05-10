'use client';
import { useQuizStore } from '@/lib/store';
import { Settings, Eye, Zap, Shuffle, ListOrdered, Clock } from 'lucide-react';
import Timer from './Timer';

export default function SettingsPanel() {
  const { settings, setSettings, setTimerDuration, status } = useQuizStore();
  const disabled = status === 'loading';
  const timerDisabled = status === 'active' && useQuizStore.getState().isTimerActive;

  const toggleSetting = (key) => {
    setSettings({ [key]: !settings[key] });
  };

  const SettingToggle = ({ icon: Icon, label, settingKey }) => (
    <div 
      className="flex-between" 
      style={{ 
        padding: '0.75rem', 
        border: '1px solid var(--card-border)', 
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease'
      }}
      onClick={() => !disabled && toggleSetting(settingKey)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Icon size={18} color="var(--text-muted)" />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
      </div>
      <div 
        style={{ 
          width: '36px', 
          height: '20px', 
          backgroundColor: settings[settingKey] ? 'var(--primary)' : '#ccc', 
          borderRadius: '10px',
          position: 'relative',
          transition: 'background-color 0.2s'
        }}
      >
        <div 
          style={{ 
            width: '14px', 
            height: '14px', 
            backgroundColor: 'white', 
            borderRadius: '50%', 
            position: 'absolute', 
            top: '3px', 
            left: settings[settingKey] ? '19px' : '3px',
            transition: 'left 0.2s'
          }} 
        />
      </div>
    </div>
  );

  return (
    <div className="card animate-fade-in">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 600 }}>
        <Settings size={20} color="var(--primary)" />
        Paramètres
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <SettingToggle icon={Eye} label="Explications" settingKey="showExplanations" />
        <SettingToggle icon={Zap} label="Feedback instantané" settingKey="instantFeedback" />
        <SettingToggle icon={Shuffle} label="Mélanger questions" settingKey="shuffleQuestions" />
        <SettingToggle icon={ListOrdered} label="Mélanger options" settingKey="shuffleOptions" />

        <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Clock size={18} color="var(--text-muted)" />
            <span style={{ flexGrow: 1, fontSize: '0.9rem', fontWeight: 500 }}>Minuteur (min)</span>
            <input 
              type="number" 
              min="1" 
              max="120"
              value={settings.timerDuration}
              onChange={(e) => setTimerDuration(e.target.value)}
              className="input-field"
              style={{ width: '65px', textAlign: 'center', padding: '0.25rem' }}
              disabled={disabled || timerDisabled}
            />
          </div>
          <Timer />
        </div>
      </div>
    </div>
  );
}
