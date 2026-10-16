'use client';
import { useQuizStore } from '@/lib/store';
import { ChevronLeft, ChevronRight, RotateCcw, Send, Eraser, FastForward } from 'lucide-react';

export default function QuizControls() {
  const {
    currentQuestionIndex,
    currentQuestions,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    resetQuiz,
    userAnswers,
    status,
    bookmarks,
    currentQuizKey,
    goToQuestion,
    clearAnswer
  } = useQuizStore();

  if (!currentQuestions.length) return null;

  const isLast = currentQuestionIndex === currentQuestions.length - 1;
  const isFirst = currentQuestionIndex === 0;
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k]?.length > 0).length;
  const allAnswered = answeredCount === currentQuestions.length;
  const isReview = status === 'review';
  const quizBookmarks = bookmarks[currentQuizKey] || [];

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {!isReview && (
        <div className="card" style={{ padding: '1rem' }}>
          <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Navigation des questions</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {answeredCount} / {currentQuestions.length} répondues
            </span>
          </div>
          <div className="nav-grid">
            {currentQuestions.map((_, idx) => {
              const isAnswered = userAnswers[idx] && userAnswers[idx].length > 0;
              const isFlagged = quizBookmarks.includes(idx);
              const isCurrent = currentQuestionIndex === idx;

              let className = "nav-btn";
              if (isAnswered) className += " answered";
              if (isFlagged) className += " flagged";
              if (isCurrent) className += " current";

              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={className}
                  title={isFlagged ? "Marquée pour révision" : `Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="card flex-between" style={{ padding: '0.75rem 1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={prevQuestion}
          disabled={isFirst}
          className="btn btn-outline"
          style={{ padding: '0.5rem 1rem' }}
        >
          <ChevronLeft size={18} />
          <span style={{ display: 'none', '@media (minWidth: 640px)': { display: 'inline' } }}>Précédent</span>
        </button>

        {!isReview && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => clearAnswer(currentQuestionIndex)}
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', color: 'var(--warning)', borderColor: 'var(--card-border)' }}
              title="Effacer la réponse"
            >
              <Eraser size={18} />
            </button>
            <button
              onClick={nextQuestion}
              disabled={isLast}
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem' }}
              title="Passer la question"
            >
              <FastForward size={18} />
            </button>
          </div>
        )}

        <button
          onClick={nextQuestion}
          disabled={isLast}
          className="btn btn-outline"
          style={{ padding: '0.5rem 1rem' }}
        >
          <span style={{ display: 'none', '@media (minWidth: 640px)': { display: 'inline' } }}>Suivant</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {!isReview ? (
          <button
            onClick={() => {
              if (allAnswered || confirm(`Vous avez répondu à ${answeredCount}/${currentQuestions.length} questions. Soumettre quand même ?`)) {
                submitQuiz();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="btn btn-primary"
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              borderRadius: '14px',
              boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)',
              width: '100%',
              maxWidth: '400px'
            }}
          >
            <Send size={20} />
            Terminer le QCM
          </button>
        ) : (
          <button
            onClick={() => {
              if (confirm("Voulez-vous recommencer ce qcm ?")) {
                resetQuiz();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="btn btn-outline"
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '400px'
            }}
          >
            <RotateCcw size={20} />
            Recommencer
          </button>
        )}
      </div>
    </div>
  );
}
