'use client';
import { useQuizStore } from '@/lib/store';
import { CheckCircle, XCircle, AlertCircle, HelpCircle, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function QuestionCard() {
  const { 
    currentQuestions, 
    currentQuestionIndex, 
    userAnswers, 
    selectAnswer, 
    status,
    settings 
  } = useQuizStore();
  
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [currentQuestionIndex]);

  if (!currentQuestions || !currentQuestions.length) return null;

  const question = currentQuestions[currentQuestionIndex];
  if (!question) return null;

  const selectedOptions = userAnswers[currentQuestionIndex] || [];
  const isReview = status === 'review';
  const optionLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  const cleanOptionText = (text, index) => {
    // If options are shuffled, we shouldn't rely on the letter in the text
    // But we can try to clean common prefixes if they exist
    const prefixes = ["A.", "B.", "C.", "D.", "E.", "A)", "B)", "C)", "D)", "E)"];
    let cleaned = text;
    prefixes.forEach(p => {
      if (cleaned.startsWith(p)) {
        cleaned = cleaned.substring(p.length).trim();
      }
    });
    return cleaned;
  };

  return (
    <div className="card animate-fade-in">
      <div className="question-header">
        <div className="question-number">
          {currentQuestionIndex + 1}
        </div>
        <h3 className="question-text">{question.question}</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {question.options.map((option, idx) => {
          const isSelected = selectedOptions.includes(idx);
          const isCorrect = question.correct.includes(idx);
          const cleanedText = cleanOptionText(option, idx);
          
          let className = "option-item";
          let icon = null;

          if (isReview) {
            if (isCorrect) {
              className += " review-correct";
              icon = <CheckCircle size={20} color="var(--success)" />;
            } else if (isSelected && !isCorrect) {
              className += " review-incorrect";
              icon = <XCircle size={20} color="var(--error)" />;
            } else if (!isSelected && isCorrect) {
               className += " review-missed";
            }
          } else {
            if (isSelected) {
              className += " selected";
            }
            
            if (settings.instantFeedback && selectedOptions.length > 0) {
               if (isSelected && isCorrect) {
                 className += " review-correct";
               } else if (isSelected && !isCorrect) {
                 className += " review-incorrect";
               }
            }
          }

          return (
            <div
              key={idx}
              onClick={() => !isReview && selectAnswer(currentQuestionIndex, idx)}
              className={className}
              style={{ 
                pointerEvents: isReview ? 'none' : 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--card-border)',
                cursor: isReview ? 'default' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div className={`option-checkbox ${isSelected ? 'checked' : ''}`} style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: '2px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: isSelected ? 'var(--primary)' : 'transparent'
              }}>
                {isSelected && <Check size={14} color="white" />}
              </div>
              <span style={{ fontWeight: 700, color: 'var(--primary)', width: '25px', flexShrink: 0 }}>
                {optionLetters[idx]}.
              </span>
              <span style={{ flexGrow: 1, fontSize: '1rem' }}>{cleanedText}</span>
              {icon}
            </div>
          );
        })}
      </div>

      {question.hint && !isReview && (
        <div style={{ marginTop: '1.5rem' }}>
          <button 
            onClick={() => setShowHint(!showHint)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <HelpCircle size={18} />
            {showHint ? "Masquer l'indice" : "Afficher l'indice"}
          </button>
          {showHint && (
            <div style={{ marginTop: '0.75rem', padding: '1rem', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderLeft: '4px solid var(--primary)', borderRadius: '4px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              {question.hint}
            </div>
          )}
        </div>
      )}

      {isReview && settings.showExplanations && question.explanation && (
        <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: 'rgba(var(--success-rgb), 0.05)', borderLeft: '4px solid var(--success)', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
            <AlertCircle size={18} /> Explication
          </h4>
          <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
