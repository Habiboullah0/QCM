"use client";

import { Award, Clock, Flame, History, Medal, Trash2, TrendingUp } from "lucide-react";
import { useQuizStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";

function studyStreak(history) {
  const days = new Set(history.map((item) => new Date(item.date).toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export default function Dashboard() {
  const { history, clearHistory, setStatus } = useQuizStore();
  if (!history.length) return <div className="card hero"><span className="eyebrow">Votre progression</span><h2>Chaque session compte.</h2><p>Terminez votre premier QCM pour voir apparaître vos scores, votre temps d’étude et vos progrès ici.</p></div>;

  const average = (history.reduce((sum, item) => sum + (item.scoreOn20 ?? item.percentage / 5), 0) / history.length).toFixed(1);
  const best = Math.max(...history.map((item) => item.scoreOn20 ?? item.percentage / 5)).toFixed(1);
  const totalTime = history.reduce((sum, item) => sum + item.timeTaken, 0);
  const streak = studyStreak(history);
  const latest = history[0];

  return <div style={{ display: "grid", gap: "1rem" }}>
    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", background: "linear-gradient(135deg, var(--brand-soft), var(--panel))" }}>
      <div><span className="eyebrow">Votre rythme</span><h2 style={{ margin: ".3rem 0", font: "800 1.55rem var(--font-display)" }}>{streak ? `${streak} jour${streak > 1 ? "s" : ""} de suite` : "Reprenez votre rythme"}</h2><p className="muted" style={{ margin: 0 }}>Une courte session régulière vaut mieux qu’une longue session isolée.</p></div><Flame size={42} color="var(--warning)" strokeWidth={1.6}/>
    </div>
    <div className="stats-grid">
      <div className="stat-box"><Award color="var(--brand)"/><div className="muted">Moyenne /20</div><div className="stat-value">{average}</div></div>
      <div className="stat-box"><Medal color="var(--warning)"/><div className="muted">Meilleur score</div><div className="stat-value">{best}</div></div>
      <div className="stat-box"><Clock color="var(--brand)"/><div className="muted">Temps total</div><div className="stat-value">{formatTime(totalTime)}</div></div>
      <div className="stat-box"><TrendingUp color="var(--success)"/><div className="muted">Sessions</div><div className="stat-value">{history.length}</div></div>
    </div>
    <div className="card"><div className="card-title"><span style={{ display: "flex", alignItems: "center", gap: ".45rem" }}><History size={18}/> Historique récent</span><button className="btn btn-danger" onClick={clearHistory}><Trash2 size={16}/> Effacer</button></div>
      <div className="card" style={{ marginBottom: "1rem", boxShadow: "none", background: "var(--canvas)" }}><div className="muted" style={{ fontSize: ".76rem", fontWeight: 800, textTransform: "uppercase" }}>Dernière session</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginTop: ".3rem" }}><strong>{latest.title}</strong><strong style={{ color: latest.percentage >= 80 ? "var(--success)" : latest.percentage >= 50 ? "var(--warning)" : "var(--danger)" }}>{latest.scoreOn20.toFixed(1)} / 20</strong></div><button className="btn btn-outline" style={{ marginTop: ".7rem" }} onClick={() => setStatus("idle")}>Choisir un nouveau module</button></div>
      {history.slice(0, 8).map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: ".8rem 0", borderBottom: "1px solid var(--line)" }}><div><strong>{item.title}</strong><div className="muted" style={{ fontSize: ".78rem" }}>{new Date(item.date).toLocaleDateString("fr-FR")} · {formatTime(item.timeTaken)}</div></div><strong style={{ color: item.percentage >= 80 ? "var(--success)" : item.percentage >= 50 ? "var(--warning)" : "var(--danger)" }}>{item.scoreOn20.toFixed(1)} / 20</strong></div>)}
    </div>
  </div>;
}
