'use client';

import { useEffect, useState } from 'react';
import { useQuizStore } from '@/lib/store';
import QuizSelector from '@/components/QuizSelector';
import QuestionCard from '@/components/QuestionCard';
import QuizControls from '@/components/QuizControls';
import QuizResults from '@/components/QuizResults';
import ThemeToggle from '@/components/ThemeToggle';
import ProgressBar from '@/components/ProgressBar';
import SettingsPanel from '@/components/SettingsPanel';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { 
    status, 
    nextQuestion, 
    prevQuestion, 
    selectAnswer, 
    currentQuestionIndex 
  } = useQuizStore();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (status === 'active' || status === 'review') {
        if (e.key === 'ArrowLeft') {
          prevQuestion();
        } else if (e.key === 'ArrowRight') {
          nextQuestion();
        }

        if (status === 'active') {
          const key = e.key.toLowerCase();
          const optionMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4 };
          
          if (optionMap.hasOwnProperty(key)) {
            selectAnswer(currentQuestionIndex, optionMap[key]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, nextQuestion, prevQuestion, selectAnswer, currentQuestionIndex]);

  if (!mounted) return null;

  return (
    <main className="container" style={{ padding: '2rem 1rem', minHeight: '100vh' }}>
      <header className="app-header">
        <div className="logo-area">
          <img src="icon.png" alt="Logo" className="animate-pulse" style={{ width: 40, height: 40 }} />
          <h1 className="logo-text">QCM</h1>
        </div>
        <div className="flex-center" style={{ gap: '1rem' }}>
          <ThemeToggle />
        </div>
      </header>

      <div className="grid-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <QuizSelector />
          <SettingsPanel />
        </div>

        <div>
          {status === 'loading' && (
            <div className="card flex-center" style={{ height: '300px', flexDirection: 'column', color: 'var(--primary)' }}>
              <Loader2 className="spin" size={48} style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: 500 }}>Chargement du QCM...</p>
            </div>
          )}

          {status === 'idle' && (
            <div className="card flex-center" style={{ height: '400px', flexDirection: 'column', textAlign: 'center' }}>
              <img src="icon.png" alt="Icon" style={{ width: 80, height: 80, marginBottom: '1.5rem', opacity: 0.2, filter: 'grayscale(100%)' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bienvenue</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
                Sélectionnez un module dans le menu de gauche pour commencer à tester vos connaissances.
              </p>
            </div>
          )}

          {(status === 'active' || status === 'review') && (
            <div className="animate-fade-in">
              <ProgressBar />
              {status === 'review' ? (
                <>
                  <QuizResults />
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Revue des réponses</h3>
                    <QuestionCard />
                    <QuizControls />
                  </div>
                </>
              ) : (
                <>
                  <QuestionCard />
                  <QuizControls />
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <footer style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p>
          Developed By <a href="https://www.facebook.com/habiboullah.balegh.1" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Habiboullah</a>
        </p>
      </footer>
    </main>
  );
}