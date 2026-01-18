'use client';
import { useQuizStore } from '@/lib/store';
import { ChevronLeft, ChevronRight, CheckSquare, RotateCcw } from 'lucide-react';

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
  const allAnswered = currentQuestions.every((_, idx) => userAnswers[idx] && userAnswers[idx].length > 0);
  const isReview = status === 'review';

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card flex-between" style={{ padding: '1rem' }}>
        <button
          onClick={prevQuestion}
          disabled={isFirst}
          className="btn btn-secondary"
        >
          <ChevronLeft size={16} /> Précédent
        </button>

        <span style={{ fontWeight: 600, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.25rem 1rem', borderRadius: '99px', fontSize: '0.9rem' }}>
          Question {currentQuestionIndex + 1} / {currentQuestions.length}
        </span>

        <button
          onClick={nextQuestion}
          disabled={isLast}
          className="btn btn-secondary"
        >
          Suivant <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {!isReview ? (
          <button
            onClick={() => {
              if (allAnswered || confirm("Vous n'avez pas répondu à toutes les questions. Continuer ?")) {
                submitQuiz();
              }
            }}
            className={`btn ${allAnswered ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '1rem 2rem', fontSize: '1rem' }}
          >
            <CheckSquare size={20} />
            Vérifier les réponses
          </button>
        ) : (
          <button
            onClick={() => {
              if (confirm("Voulez-vous vraiment réinitialiser le quiz ?")) {
                resetQuiz();
              }
            }}
            className="btn btn-secondary"
            style={{ padding: '1rem 2rem', fontSize: '1rem' }}
          >
            <RotateCcw size={20} />
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}