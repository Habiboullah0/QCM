'use client';
import { useQuizStore } from '@/lib/store';
import { ChevronLeft, ChevronRight, CheckSquare, RotateCcw, Send } from 'lucide-react';

export default function QuizControls() {
  const { 
    currentQuestionIndex, 
    currentQuestions, 
    nextQuestion, 
    prevQuestion, 
    submitQuiz, 
    resetQuiz,
    userAnswers,
    status
  } = useQuizStore();

  if (!currentQuestions.length) return null;

  const isLast = currentQuestionIndex === currentQuestions.length - 1;
  const isFirst = currentQuestionIndex === 0;
  const answeredCount = Object.keys(userAnswers).length;
  const allAnswered = answeredCount === currentQuestions.length;
  const isReview = status === 'review';

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card flex-between" style={{ padding: '0.75rem 1rem' }}>
        <button
          onClick={prevQuestion}
          disabled={isFirst}
          className="btn btn-outline"
          style={{ padding: '0.5rem 1rem' }}
        >
          <ChevronLeft size={18} /> 
          <span style={{ display: 'none', '@media (minWidth: 640px)': { display: 'inline' } }}>Précédent</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>
            {currentQuestionIndex + 1} / {currentQuestions.length}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
            {answeredCount} répondue{answeredCount > 1 ? 's' : ''}
          </span>
        </div>

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
            Terminer le quiz
          </button>
        ) : (
          <button
            onClick={() => {
              if (confirm("Voulez-vous recommencer ce quiz ?")) {
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
