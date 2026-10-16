'use client';
import { useQuizStore } from '@/lib/store';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { formatTime } from '@/lib/utils';
import { Trophy, Target, Clock, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function QuizResults() {
  const { currentQuestions, userAnswers, settings, timeLeft, history, currentQuizKey } = useQuizStore();
  const { width, height } = useWindowSize();

  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctCount = 0;
  let partialCount = 0;
  let incorrectCount = 0;

  currentQuestions.forEach((q, idx) => {
    const P = q.point || 1;
    maxPossibleScore += P;

    const selected = userAnswers[idx] || [];
    const correct = new Set(q.correct);
    const C = correct.size;
    const I = q.options.length - C;

    let correctSelections = 0;
    let incorrectSelections = 0;

    selected.forEach(s => {
      if (correct.has(s)) correctSelections++;
      else incorrectSelections++;
    });

    let qScore = 0;
    if (C > 0) {
      const pointPerCorrect = P / C;
      const pointPerIncorrect = I > 0 ? P / I : 0;
      qScore = (correctSelections * pointPerCorrect) - (incorrectSelections * pointPerIncorrect);
      qScore = Math.max(0, qScore);
    }

    totalScore += qScore;

    // For stats breakdown
    if (qScore === P) correctCount++;
    else if (qScore > 0) partialCount++;
    else incorrectCount++;
  });

  const scoreOn20 = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 20 : 0;
  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  const timeTaken = (settings.timerDuration * 60) - timeLeft;

  // Comparison with previous attempt of the same quiz
  const previousAttempts = history.filter(h => h.quizKey === currentQuizKey && h.id !== history[0]?.id);
  const lastAttempt = previousAttempts[0];

  let trend = null;
  if (lastAttempt) {
    const diff = (scoreOn20 - (lastAttempt.scoreOn20 || (lastAttempt.percentage / 100 * 20))).toFixed(2);
    if (diff > 0) trend = { icon: TrendingUp, color: 'var(--success)', text: `+${diff} pts par rapport à la dernière fois` };
    else if (diff < 0) trend = { icon: TrendingDown, color: 'var(--error)', text: `${diff} pts par rapport à la dernière fois` };
    else trend = { icon: Minus, color: 'var(--text-muted)', text: "Même score que la dernière fois" };
  }

  const doughnutData = {
    labels: ['Parfait', 'Partiel', 'Zéro/Incorrect'],
    datasets: [{
      data: [correctCount, partialCount, incorrectCount],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      hoverOffset: 4,
      borderWidth: 0,
    }],
  };

  // Progress chart data
  const quizHistory = history
    .filter(h => h.quizKey === currentQuizKey)
    .reverse()
    .slice(-10);

  const lineData = {
    labels: quizHistory.map((_, i) => `Tentative ${i + 1}`),
    datasets: [{
      label: 'Score / 20',
      data: quizHistory.map(h => h.scoreOn20 || (h.percentage / 100 * 20)),
      borderColor: 'var(--primary)',
      backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  let message = "Peut mieux faire 😢";
  let resultClass = "error";
  let Icon = AlertCircle;

  if (scoreOn20 >= 16) {
    message = "Excellent travail ! 🏆";
    resultClass = "success";
    Icon = Trophy;
  } else if (scoreOn20 >= 10) {
    message = "Pas mal ! 👍";
    resultClass = "warning";
    Icon = Target;
  }

  return (
    <div className="animate-fade-in">
      {scoreOn20 >= 16 && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      <div className={`result-card ${resultClass}`} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '3rem 2rem',
        borderRadius: '24px',
        marginBottom: '2rem',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="hover-scale" style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem'
        }}>
          <Icon size={56} />
        </div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{message}</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Note Finale</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{scoreOn20.toFixed(2)} <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>/ 20</span></div>
          </div>
          <div style={{ width: '2px', height: '40px', backgroundColor: 'currentColor', opacity: 0.2 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Points Bruts</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalScore.toFixed(1)} / {maxPossibleScore}</div>
          </div>
        </div>

        {trend && (
          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '99px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <trend.icon size={18} />
            {trend.text}
          </div>
        )}
      </div>

      <div className="results-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <StatBox label="Parfaites" value={correctCount} color="#10b981" bg="rgba(16, 185, 129, 0.1)" />
            <StatBox label="Partielles" value={partialCount} color="#f59e0b" bg="rgba(245, 158, 11, 0.1)" />
            <StatBox label="Zéro/Faux" value={incorrectCount} color="#ef4444" bg="rgba(239, 68, 68, 0.1)" />
            <StatBox label="Temps" value={formatTime(timeTaken)} color="var(--primary)" bg="var(--primary-light)" icon={Clock} />
          </div>

          {quizHistory.length > 1 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--primary)" /> Progression (sur 20)
              </h4>
              <div style={{ height: '180px' }}>
                <Line
                  data={lineData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { min: 0, max: 20, ticks: { stepSize: 5 } } }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="card flex-center" style={{ height: '100%', padding: '2rem', minHeight: '350px' }}>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Doughnut
              data={doughnutData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 25, font: { family: 'Poppins', size: 13, weight: 600 } }
                  }
                },
                cutout: '75%'
              }}
            />
            <div style={{
              position: 'absolute',
              top: '42%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{percentage}%</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Précision</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, bg, icon: Icon }) {
  return (
    <div className="stat-box hover-scale" style={{
      padding: '1.5rem 1rem',
      borderRadius: '16px',
      backgroundColor: bg,
      border: `1px solid ${color}20`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.25rem'
    }}>
      {Icon && <Icon size={18} color={color} style={{ marginBottom: '0.25rem' }} />}
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color }}>{value}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}
