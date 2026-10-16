"use client";

import { useEffect, useState } from "react";
import { useQuizStore } from "@/lib/store";
import QuizSelector from "@/components/QuizSelector";
import QuestionCard from "@/components/QuestionCard";
import QuizControls from "@/components/QuizControls";
import QuizResults from "@/components/QuizResults";
import ThemeToggle from "@/components/ThemeToggle";
import ProgressBar from "@/components/ProgressBar";
import SettingsPanel from "@/components/SettingsPanel";
import Dashboard from "@/components/Dashboard";
import { Loader2, Layout } from "lucide-react";

export default function Home() {
  const {
    status,
    nextQuestion,
    prevQuestion,
    selectAnswer,
    currentQuestionIndex,
  } = useQuizStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "SELECT" ||
        e.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (status === "active" || status === "review") {
        if (e.key === "ArrowLeft") {
          prevQuestion();
        } else if (e.key === "ArrowRight") {
          nextQuestion();
        }

        if (status === "active") {
          const key = e.key.toLowerCase();
          const optionMap = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };

          if (optionMap.hasOwnProperty(key)) {
            selectAnswer(currentQuestionIndex, optionMap[key]);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, nextQuestion, prevQuestion, selectAnswer, currentQuestionIndex]);

  if (!mounted) return null;

  return (
    <main
      className="container"
      style={{ padding: "2rem 1rem", minHeight: "100vh" }}
    >
      <header className="app-header">
        <div className="logo-area">
          <img
            src="icon.png"
            alt="Logo"
            className="animate-pulse"
            style={{ width: 40, height: 40 }}
          />
          <h1 className="logo-text">QCM</h1>
        </div>
        <div className="flex-center" style={{ gap: "1rem" }}>
          <ThemeToggle />
        </div>
      </header>

      <div className="grid-layout">
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <QuizSelector />
          <SettingsPanel />
        </div>

        <div style={{ minWidth: 0 }}>
          {status === "loading" && (
            <div
              className="card flex-center"
              style={{
                height: "400px",
                flexDirection: "column",
                color: "var(--primary)",
              }}
            >
              <Loader2
                className="spin"
                size={48}
                style={{ marginBottom: "1rem" }}
              />
              <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                Préparation de votre session...
              </p>
            </div>
          )}

          {status === "idle" && (
            <div
              className="card flex-center"
              style={{
                height: "500px",
                flexDirection: "column",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "2rem",
                }}
              >
                <img
                  src="icon.png"
                  alt="Icon"
                  style={{ width: 60, height: 60, opacity: 0.8 }}
                />
              </div>
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  marginBottom: "1rem",
                }}
              >
                Prêt à tester vos connaissances ?
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  maxWidth: "450px",
                  fontSize: "1.1rem",
                  lineHeight: "1.6",
                }}
              >
                Sélectionnez un module dans le menu de gauche ou accédez à votre
                tableau de bord pour voir vos progrès.
              </p>
            </div>
          )}

          {status === "dashboard" && <Dashboard />}

          {(status === "active" || status === "review") && (
            <div className="animate-fade-in">
              <ProgressBar />
              {status === "review" ? (
                <>
                  <QuizResults />
                  <div style={{ marginTop: "3rem" }}>
                    <div
                      className="flex-between"
                      style={{ marginBottom: "1.5rem" }}
                    >
                      <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                        Revue Détaillée
                      </h3>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-muted)",
                          fontWeight: 500,
                        }}
                      >
                        Utilisez les flèches pour naviguer
                      </div>
                    </div>
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

      <footer
        style={{
          marginTop: "4rem",
          padding: "2rem 0",
          borderTop: "1px solid var(--card-border)",
          textAlign: "center",
        }}
      >
        <p>
          Developed By <a href="https://www.facebook.com/Habiboullah0" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Habiboullah</a>
        </p>
      </footer>
    </main>
  );
}
