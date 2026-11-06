"use client";

import { motion } from "motion/react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { CheckCircle2, Clock, Filter, Flag, RotateCcw, Target, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuizStore } from "@/lib/store";
import { formatTime, scoreQuestion } from "@/lib/utils";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const palette = { brand: "#4f63d8", success: "#188a68", warning: "#b97708", danger: "#c44955", muted: "#718096" };

export default function QuizResults() {
  const { currentQuestions, userAnswers, settings, timeLeft, history, currentQuizKey, bookmarks, retryMistakes } = useQuizStore();
  const [filter, setFilter] = useState("all");
  const flagged = new Set(bookmarks[currentQuizKey] || []);
  const rows = currentQuestions.map((question, index) => ({
    index,
    question,
    result: scoreQuestion(question, userAnswers[index] || []),
    isFlagged: flagged.has(index),
  }));
  const max = rows.reduce((sum, row) => sum + row.result.point, 0);
  const total = rows.reduce((sum, row) => sum + row.result.score, 0);
  const percentage = max ? Math.round((total / max) * 100) : 0;
  const score20 = max ? (total / max) * 20 : 0;
  const perfect = rows.filter((row) => row.result.correct).length;
  const partial = rows.filter((row) => row.result.partial).length;
  const wrong = rows.filter((row) => row.result.missed).length;
  const mistakes = partial + wrong;
  const filteredRows = rows.filter((row) => {
    if (filter === "wrong") return row.result.partial || row.result.missed;
    if (filter === "flagged") return row.isFlagged;
    return true;
  });
  const attempts = history.filter((item) => item.quizKey === currentQuizKey).slice().reverse().slice(-8);
  const data = { labels: ["Parfaites", "Partielles", "À revoir"], datasets: [{ data: [perfect, partial, wrong], backgroundColor: [palette.success, palette.warning, palette.danger], borderWidth: 0 }] };
  const line = { labels: attempts.map((_, index) => `#${index + 1}`), datasets: [{ label: "Score /20", data: attempts.map((item) => item.scoreOn20), borderColor: palette.brand, backgroundColor: "rgba(79,99,216,.12)", fill: true, tension: .35 }] };

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "grid", gap: "1rem" }}>
    <div className="result-hero">
      <div><span className="eyebrow" style={{ color: "#fff" }}>Session terminée</span><h2 style={{ margin: ".35rem 0", font: "800 2rem var(--font-display)" }}>Votre score : {score20.toFixed(1)} / 20</h2><p style={{ margin: 0, opacity: .88 }}>{percentage >= 80 ? "Excellent travail." : percentage >= 50 ? "Bonne base, continuez vos révisions." : "Chaque erreur est une piste de progrès."}</p></div>
      <div className="score-ring" style={{ "--score": `${percentage}%` }}><strong>{percentage}%</strong></div>
    </div>
    <div className="stats-grid">
      <div className="stat-box"><CheckCircle2 color="var(--success)"/><div className="muted">Parfaites</div><div className="stat-value">{perfect}</div></div>
      <div className="stat-box"><Target color="var(--warning)"/><div className="muted">Partielles</div><div className="stat-value">{partial}</div></div>
      <div className="stat-box"><XCircle color="var(--danger)"/><div className="muted">À revoir</div><div className="stat-value">{wrong}</div></div>
      <div className="stat-box"><Clock color="var(--brand)"/><div className="muted">Temps</div><div className="stat-value">{formatTime(settings.timerDuration * 60 - timeLeft)}</div></div>
    </div>
    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
      <div><strong>Réviser efficacement</strong><div className="muted" style={{ fontSize: ".82rem" }}>{mistakes ? `${mistakes} question${mistakes > 1 ? "s" : ""} à retravailler${flagged.size ? ` · ${flagged.size} marquée${flagged.size > 1 ? "s" : ""}` : ""}.` : "Toutes vos réponses sont correctes."}</div></div>
      <button className="btn btn-primary" onClick={retryMistakes} disabled={!mistakes && !flagged.size}><RotateCcw size={17}/> Refaire les erreurs</button>
    </div>
    <div className="results-grid">
      <div className="card" style={{ minHeight: 300 }}><h3 className="card-title">Répartition</h3><div style={{ height: 220 }}><Doughnut data={data} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, color: palette.muted } } }, cutout: "72%" }}/></div></div>
      <div className="card" style={{ minHeight: 300 }}><h3 className="card-title">Progression</h3>{attempts.length > 1 ? <div style={{ height: 220 }}><Line data={line} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 20, ticks: { color: palette.muted } }, x: { ticks: { color: palette.muted } } } }}/></div> : <p className="muted">Votre prochaine tentative apparaîtra ici.</p>}</div>
    </div>
    <div className="card">
      <div className="card-title"><span style={{ display: "flex", alignItems: "center", gap: ".45rem" }}><Filter size={17}/> Détail par question</span><span className="muted" style={{ fontSize: ".78rem" }}>Crédit partiel activé</span></div>
      <div className="action-group" style={{ marginBottom: "1rem", flexWrap: "wrap" }}><button className={`btn ${filter === "all" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("all")}>Toutes ({rows.length})</button><button className={`btn ${filter === "wrong" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("wrong")}>À revoir ({mistakes})</button><button className={`btn ${filter === "flagged" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("flagged")}><Flag size={15}/> Marquées ({flagged.size})</button></div>
      {filteredRows.length ? filteredRows.map((row) => <div key={row.index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".7rem", padding: ".7rem 0", borderBottom: "1px solid var(--line)" }}><span><strong>Question {row.index + 1}</strong><span className="muted"> · {row.result.correct ? "Correcte" : row.result.partial ? "Partielle" : "À revoir"}{row.isFlagged ? " · marquée" : ""}</span></span><strong style={{ color: row.result.correct ? "var(--success)" : row.result.partial ? "var(--warning)" : "var(--danger)" }}>{row.result.score.toFixed(1)} / {row.result.point}</strong></div>) : <p className="muted">Aucune question dans ce filtre.</p>}
    </div>
  </motion.div>;
}
