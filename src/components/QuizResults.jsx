'use client';
import { useQuizStore } from '@/lib/store';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { formatTime } from '@/lib/utils';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function QuizResults() {
  const { currentQuestions, userAnswers, settings, timeLeft } = useQuizStore();
  const { width, height } = useWindowSize();

  let score = 0;
  let correctCount = 0;
  let partialCount = 0;
  let incorrectCount = 0;

  currentQuestions.forEach((q, idx) => {
    const selected = userAnswers[idx] || [];
    const correct = new Set(q.correct);
    let correctSelections = 0;
    let incorrectSelections = 0;

    selected.forEach(s => {
      if (correct.has(s)) correctSelections++;
      else incorrectSelections++;
    });

    if (correctSelections === correct.size && incorrectSelections === 0) {
      score++;
      correctCount++;
    } else if (correctSelections > 0 && incorrectSelections === 0) {
      partialCount++;
    } else {
      incorrectCount++;
    }
  });

  const percentage = Math.round((score / currentQuestions.length) * 100);
  const timeTaken = (settings.timerDuration * 60) - timeLeft;

  const data = {
    labels: ['Correct', 'Partiel', 'Incorrect'],
    datasets: [{
      data: [correctCount, partialCount, incorrectCount],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(234, 179, 8, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['rgba(34, 197, 94, 1)', 'rgba(234, 179, 8, 1)', 'rgba(239, 68, 68, 1)'],
      borderWidth: 1,
    }],
  };

  let message = "Peut mieux faire 😢";
  let resultClass = "error";
  
  if (percentage >= 80) {
    message = "Excellent travail ! 🏆";
    resultClass = "success";
  } else if (percentage >= 50) {
    message = "Pas mal ! 👍";
    resultClass = "warning";
  }

  return (
    <div className="animate-fade-in">
      {percentage >= 80 && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
      
      <div className={`result-card ${resultClass}`}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{message}</h2>
        <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>Score: {score} / {currentQuestions.length}</p>
        <div style={{ fontSize: '3rem', fontWeight: 800, marginTop: '1rem' }}>{percentage}%</div>
      </div>

      <div className="results-layout">
        <div className="stat-grid">
          <StatBox label="Correctes" value={correctCount} style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-border)' }} />
          <StatBox label="Partielles" value={partialCount} style={{ color: 'var(--warning)', backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }} />
          <StatBox label="Incorrectes" value={incorrectCount} style={{ color: 'var(--error)', backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-border)' }} />
          <StatBox label="Temps" value={formatTime(timeTaken)} style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)' }} />
        </div>

        <div className="card flex-center" style={{ height: '300px' }}>
          <Doughnut data={data} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, style }) {
  return (
    <div className="stat-box" style={style}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{label}</div>
    </div>
  );
}