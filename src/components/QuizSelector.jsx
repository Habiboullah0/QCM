'use client';
import { useEffect, useState } from 'react';
import { useQuizStore } from '@/lib/store';
import { BookOpen } from 'lucide-react';

export default function QuizSelector() {
  const [quizzes, setQuizzes] = useState([]);
  const { 
    loadQuiz, 
    status, 
    settings, 
    setSettings, 
    resetQuiz, 
    currentQuizKey, 
    allQuestions 
  } = useQuizStore();

  useEffect(() => {
    fetch('https://habiboullah0.github.io/QCMsFile/qcmsList.json')
      .then(res => res.json())
      .then(data => setQuizzes(data))
      .catch(err => console.error("Failed to load quiz list", err));
  }, []);

  const handleSelect = (e) => {
    const selected = quizzes.find(q => q.value === e.target.value);
    if (selected) {
      loadQuiz(selected.file, selected.value, selected.title);
    }
  };

  const handleCountChange = (e) => {
    setSettings({ questionCount: e.target.value });
    if (status !== 'idle') {
      resetQuiz();
    }
  };

  const handleCustomCountChange = (e) => {
    let val = parseInt(e.target.value);
    const maxQuestions = allQuestions.length > 0 ? allQuestions.length : 999;

    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > maxQuestions) val = maxQuestions;

    setSettings({ customCount: val });
    
    if (status !== 'idle') {
      resetQuiz();
    }
  };

  return (
    <div className="card animate-fade-in">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
        <BookOpen size={20} color="var(--primary)" />
        Sélection du QCM
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Module</label>
          <select 
            className="select-field"
            onChange={handleSelect}
            disabled={status === 'loading'}
            value={currentQuizKey || ""} 
          >
            <option value="" disabled>Choisir un module...</option>
            {quizzes.map(q => (
              <option key={q.value} value={q.value}>{q.title}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Questions</label>
            <select 
              className="select-field"
              value={settings.questionCount}
              onChange={handleCountChange}
              disabled={status === 'idle' && !currentQuizKey}
            >
              <option value="all">Toutes ({allQuestions.length || 0})</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>
          
          {settings.questionCount === 'custom' && (
            <div style={{ width: '100px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nombre</label>
              <input 
                type="number" 
                min="1"
                max={allQuestions.length || 999}
                className="input-field"
                value={settings.customCount}
                onChange={handleCustomCountChange}
                disabled={status === 'idle' && !currentQuizKey}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}