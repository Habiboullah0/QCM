'use client';
import { useQuizStore } from '@/lib/store';
import { Settings, Eye, Zap, Shuffle, ListOrdered, Clock, MousePointer2, LayoutDashboard } from 'lucide-react';
import Timer from './Timer';

export default function SettingsPanel() {
  const { settings, setSettings, setTimerDuration, status, setStatus } = useQuizStore();
  const disabled = status === 'loading';
  const timerDisabled = status === 'active' && useQuizStore.getState().isTimerActive;

  const toggleSetting = (key) => {
    setSettings({ [key]: !settings[key] });
  };

  const SettingToggle = ({ icon: Icon, label, settingKey, description }) => (
    <div 
      className="setting-item"
      style={{ 
        padding: '0.75rem', 
        border: '1px solid var(--card-border)', 
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        backgroundColor: settings[settingKey] ? 'rgba(var(--primary-rgb), 0.03)' : 'transparent'
      }}
      onClick={() => !disabled && toggleSetting(settingKey)}
    >
      <div className="flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: settings[settingKey] ? 'var(--primary)' : 'var(--text-muted)' }}>
            <Icon size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</div>
            {description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{description}</div>}
          </div>
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
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <button 
        onClick={() => setStatus(status === 'dashboard' ? 'idle' : 'dashboard')}
        className={`btn ${status === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', justifyContent: 'flex-start' }}
      >
        <LayoutDashboard size={18} />
        {status === 'dashboard' ? 'Retour à la sélection' : 'Tableau de Bord'}
      </button>

      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>
          <Settings size={20} color="var(--primary)" />
          Paramètres
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <SettingToggle icon={Eye} label="Explications" settingKey="showExplanations" />
          <SettingToggle icon={Zap} label="Feedback instantané" settingKey="instantFeedback" />
          <SettingToggle icon={MousePointer2} label="Suivant automatique" settingKey="autoNext" description="Pour choix unique" />
          <SettingToggle icon={Shuffle} label="Mélanger questions" settingKey="shuffleQuestions" />
          <SettingToggle icon={ListOrdered} label="Mélanger options" settingKey="shuffleOptions" />

          <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Clock size={18} color="var(--text-muted)" />
              <span style={{ flexGrow: 1, fontSize: '0.9rem', fontWeight: 600 }}>Minuteur (min)</span>
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
    </div>
  );
}
