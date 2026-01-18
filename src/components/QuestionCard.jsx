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
  const optionLetters = ["A", "B", "C", "D", "E"];

  const cleanOptionText = (text, index) => {
    const letter = optionLetters[index];
    const regex = new RegExp(`^${letter}[.)\\s-]+\\s*`, 'i');
    return text.replace(regex, '');
  };

  return (
    <div className="card animate-fade-in">
      <div className="question-header">
        <div className="question-number">
          {currentQuestionIndex + 1}
        </div>
        <h3 className="question-text">{question.question}</h3>
      </div>

      <div>
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
              style={{ pointerEvents: isReview ? 'none' : 'auto' }}
            >
              <div className="option-checkbox">
                {isSelected && <Check size={14} />}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', width: '20px', flexShrink: 0 }}>
                {optionLetters[idx]}.
              </span>
              <span style={{ flexGrow: 1 }}>{cleanedText}</span>
              {icon}
            </div>
          );
        })}
      </div>

      {question.hint && !isReview && (
        <div style={{ marginTop: '1.5rem' }}>
          <button 
            onClick={() => setShowHint(!showHint)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <HelpCircle size={16} />
            {showHint ? "Masquer l'indice" : "Afficher l'indice"}
          </button>
          {showHint && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {question.hint}
            </div>
          )}
        </div>
      )}

      {isReview && settings.showExplanations && question.explanation && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--primary-light)', borderLeft: '4px solid var(--primary)', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> Explication
          </h4>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}