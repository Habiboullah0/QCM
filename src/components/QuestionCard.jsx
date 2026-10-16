'use client';
import { useQuizStore } from '@/lib/store';
import { CheckCircle, XCircle, AlertCircle, HelpCircle, Check, Bookmark, BookmarkCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function QuestionCard() {
  const {
    currentQuestions,
    currentQuestionIndex,
    userAnswers,
    selectAnswer,
    status,
    settings,
    bookmarks,
    currentQuizKey,
    toggleBookmark
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

  const quizBookmarks = bookmarks[currentQuizKey] || [];
  const isBookmarked = quizBookmarks.includes(currentQuestionIndex);

  const cleanOptionText = (text) => {
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
    <div className="card animate-fade-in" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div className="question-header" style={{ marginBottom: 0, flex: 1 }}>
          <div className="question-number">
            {currentQuestionIndex + 1}
          </div>
          <div>
            <h3 className="question-text" style={{ paddingRight: '1rem' }}>{question.question}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Points: {question.point || 1}
            </span>
          </div>
        </div>

        <button
          onClick={() => toggleBookmark(currentQuestionIndex)}
          className="btn btn-outline hover-scale"
          style={{
            padding: '0.5rem 0.8rem',
            borderColor: isBookmarked ? 'var(--warning)' : 'var(--card-border)',
            color: isBookmarked ? 'var(--warning)' : 'var(--text-muted)',
            backgroundColor: isBookmarked ? 'var(--warning-bg)' : 'transparent',
            flexShrink: 0
          }}
          title="Marquer pour révision"
        >
          {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          <span style={{ display: 'none', '@media (minWidth: 640px)': { display: 'inline' } }}>
            {isBookmarked ? 'Marquée' : 'Marquer'}
          </span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {question.options.map((option, idx) => {
          const isSelected = selectedOptions.includes(idx);
          const isCorrect = question.correct.includes(idx);
          const cleanedText = cleanOptionText(option);

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
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                cursor: isReview ? 'default' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div className={`option-checkbox ${isSelected ? 'checked' : ''}`} style={{
                width: '22px',
                height: '22px',
                borderRadius: '6px',
                border: '2px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                transition: 'all 0.2s'
              }}>
                {isSelected && <Check size={14} color="white" strokeWidth={3} />}
              </div>
              <span style={{ fontWeight: 700, color: 'var(--primary)', width: '25px', flexShrink: 0, fontSize: '1.1rem' }}>
                {optionLetters[idx]}
              </span>
              <span style={{ flexGrow: 1, fontSize: '1rem', fontWeight: 500 }}>{cleanedText}</span>
              {icon}
            </div>
          );
        })}
      </div>

      {(question.hint || (isReview && settings.showExplanations && question.explanation)) && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {question.hint && !isReview && (
            <div>
              <button
                onClick={() => setShowHint(!showHint)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}
              >
                <HelpCircle size={18} />
                {showHint ? "Masquer l'indice" : "Afficher l'indice"}
              </button>
              {showHint && (
                <div style={{ marginTop: '0.75rem', padding: '1rem', backgroundColor: 'rgba(var(--primary-rgb), 0.08)', borderLeft: '4px solid var(--primary)', borderRadius: '4px', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                  {question.hint}
                </div>
              )}
            </div>
          )}

          {isReview && settings.showExplanations && question.explanation && (
            <div style={{ padding: '1.25rem', backgroundColor: 'rgba(var(--success-rgb), 0.05)', borderLeft: '4px solid var(--success)', borderRadius: '0 12px 12px 0' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '1rem' }}>
                <AlertCircle size={18} /> Explication
              </h4>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-color)', opacity: 0.9 }}>{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
