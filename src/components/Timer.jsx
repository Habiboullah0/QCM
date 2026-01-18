'use client';
import { useEffect } from 'react';
import { useQuizStore } from '@/lib/store';
import { formatTime } from '@/lib/utils';
import { Play, Pause } from 'lucide-react';

export default function Timer() {
  const { timeLeft, isTimerActive, toggleTimer, tickTimer, status } = useQuizStore();

  useEffect(() => {
    let interval = null;
    if (isTimerActive && status === 'active') {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, status, tickTimer]);

  if (status !== 'active') return null;

  const isLowTime = timeLeft < 60 && timeLeft > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
      <button
        onClick={toggleTimer}
        className={`btn ${isTimerActive ? 'btn-warning' : 'btn-primary'}`}
        style={{ width: '100%' }}
      >
        {isTimerActive ? <Pause size={16} /> : <Play size={16} />}
        {isTimerActive ? "Pause" : "Démarrer"}
      </button>
      
      {(isTimerActive || timeLeft > 0) && (
        <div 
          style={{ 
            textAlign: 'center', 
            fontFamily: 'monospace', 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            padding: '0.5rem',
            borderRadius: '8px',
            backgroundColor: isLowTime ? 'var(--error-bg)' : 'var(--secondary)',
            color: isLowTime ? 'var(--error)' : 'var(--primary)',
            border: `1px solid ${isLowTime ? 'var(--error)' : 'var(--card-border)'}`
          }}
        >
          {formatTime(timeLeft)}
        </div>
      )}
    </div>
  );
}