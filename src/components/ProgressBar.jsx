'use client';
import { useQuizStore } from '@/lib/store';

export default function ProgressBar() {
  const { currentQuestions, userAnswers } = useQuizStore();
  
  if (!currentQuestions.length) return null;

  const total = currentQuestions.length;
  const answered = Object.keys(userAnswers).length;
  const percentage = Math.round((answered / total) * 100);

  return (
    <div className="progress-container">
      <div 
        className="progress-fill"
        style={{ width: `${percentage}%` }}
      >
        <div className="progress-stripes" />
      </div>
    </div>
  );
}