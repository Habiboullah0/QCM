'use client';
import { useEffect, useState, useRef } from 'react';
import { useQuizStore } from '@/lib/store';
import { BookOpen, Search, Upload, X } from 'lucide-react';

export default function QuizSelector() {
  const [quizzes, setQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  
  const { 
    loadQuiz, 
    loadLocalQuiz,
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          loadLocalQuiz(data, file.name.replace('.json', ''));
        } else {
          alert("Format invalide. Le fichier doit être un tableau d'objets JSON.");
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = null;
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

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
          <BookOpen size={20} color="var(--primary)" />
          Sélection du QCM
        </h2>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex-center"
          title="Charger un fichier JSON local"
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
        >
          <Upload size={18} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".json" 
          style={{ display: 'none' }} 
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={16} />
          </div>
          <input 
            type="text"
            placeholder="Rechercher un module..."
            className="input-field"
            style={{ paddingLeft: '2.25rem', paddingRight: searchTerm ? '2.25rem' : '0.75rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Module</label>
          <select 
            className="select-field"
            onChange={handleSelect}
            disabled={status === 'loading'}
            value={currentQuizKey || ""} 
          >
            <option value="" disabled>
              {filteredQuizzes.length === 0 ? "Aucun résultat" : "Choisir un module..."}
            </option>
            {filteredQuizzes.map(q => (
              <option key={q.value} value={q.value}>{q.title}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Questions</label>
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nombre</label>
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
