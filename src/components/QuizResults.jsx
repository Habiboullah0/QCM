'use client';
import { useQuizStore } from '@/lib/store';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { formatTime } from '@/lib/utils';
import { Trophy, Target, Clock, AlertCircle } from 'lucide-react';

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
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      hoverOffset: 4,
      borderWidth: 0,
    }],
  };

  let message = "Peut mieux faire 😢";
  let resultClass = "error";
  let Icon = AlertCircle;
  
  if (percentage >= 80) {
    message = "Excellent travail ! 🏆";
    resultClass = "success";
    Icon = Trophy;
  } else if (percentage >= 50) {
    message = "Pas mal ! 👍";
    resultClass = "warning";
    Icon = Target;
  }

  return (
    <div className="animate-fade-in">
      {percentage >= 80 && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
      
      <div className={`result-card ${resultClass}`} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '1rem',
        padding: '2.5rem',
        borderRadius: '20px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <Icon size={64} style={{ marginBottom: '0.5rem' }} />
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0 }}>{message}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{score} / {currentQuestions.length}</div>
          </div>
          <div style={{ width: '1px', height: '30px', backgroundColor: 'currentColor', opacity: 0.3 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Précision</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{percentage}%</div>
          </div>
        </div>
      </div>

      <div className="results-layout">
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <StatBox label="Correctes" value={correctCount} color="#10b981" bg="rgba(16, 185, 129, 0.1)" />
          <StatBox label="Partielles" value={partialCount} color="#f59e0b" bg="rgba(245, 158, 11, 0.1)" />
          <StatBox label="Incorrectes" value={incorrectCount} color="#ef4444" bg="rgba(239, 68, 68, 0.1)" />
          <StatBox label="Temps" value={formatTime(timeTaken)} color="var(--primary)" bg="var(--primary-light)" icon={Clock} />
        </div>

        <div className="card flex-center" style={{ height: '300px', padding: '2rem' }}>
          <Doughnut 
            data={data} 
            options={{ 
              maintainAspectRatio: false, 
              plugins: { 
                legend: { 
                  position: 'bottom',
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { family: 'Poppins', size: 12 }
                  }
                } 
              },
              cutout: '70%'
            }} 
          />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, bg, icon: Icon }) {
  return (
    <div className="stat-box" style={{ 
      padding: '1.25rem', 
      borderRadius: '12px', 
      backgroundColor: bg, 
      border: `1px solid ${color}20`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.25rem'
    }}>
      {Icon && <Icon size={16} color={color} style={{ marginBottom: '0.25rem' }} />}
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: color }}>{value}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: color, opacity: 0.8, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}
