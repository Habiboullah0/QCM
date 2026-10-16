"use client";
import { useQuizStore } from "@/lib/store";
import {
  History,
  TrendingUp,
  Award,
  Clock,
  Trash2,
  Play,
} from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function Dashboard() {
  const { history, clearHistory, setStatus } = useQuizStore();

  if (history.length === 0) {
    return (
      <div
        className="card animate-fade-in flex-center"
        style={{
          height: "400px",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <TrendingUp
          size={64}
          color="var(--text-muted)"
          style={{ marginBottom: "1.5rem", opacity: 0.2 }}
        />
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Votre Tableau de Bord
        </h2>
        <p style={{ color: "var(--text-muted)", maxWidth: "400px" }}>
          Vous n'avez pas encore de statistiques. Commencez un qcm pour voir vos
          progrès ici !
        </p>
      </div>
    );
  }

  const avgScoreOn20 = (
    history.reduce((acc, curr) => acc + (curr.scoreOn20 || (curr.percentage / 100 * 20)), 0) / history.length
  ).toFixed(2);

  const totalTime = history.reduce((acc, curr) => acc + curr.timeTaken, 0);

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          icon={Award}
          label="Moyenne (sur 20)"
          value={`${avgScoreOn20}`}
          color="#8b5cf6"
        />
        <StatCard
          icon={TrendingUp}
          label="Quiz Terminés"
          value={history.length}
          color="#10b981"
        />
        <StatCard
          icon={Clock}
          label="Temps Total"
          value={formatTime(totalTime)}
          color="#3b82f6"
        />
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: "1.5rem" }}>
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "1.25rem",
              fontWeight: 700,
            }}
          >
            <History size={20} color="var(--primary)" />
            Historique Récent
          </h3>
          <button
            onClick={() =>
              confirm("Effacer tout l'historique ?") && clearHistory()
            }
            className="btn btn-outline"
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.8rem",
              color: "var(--error)",
            }}
          >
            <Trash2 size={14} /> Effacer
          </button>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {history.map((item) => {
            const score20 = item.scoreOn20 || (item.percentage / 100 * 20);
            return (
              <div
                key={item.id}
                className="history-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "1px solid var(--card-border)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      gap: "1rem",
                    }}
                  >
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span>{formatTime(item.timeTaken)}</span>
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}
                >
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "1.1rem",
                        color:
                          score20 >= 16
                            ? "var(--success)"
                            : score20 >= 10
                              ? "var(--warning)"
                              : "var(--error)",
                      }}
                    >
                      {score20.toFixed(2)} / 20
                    </div>
                    <div
                      style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                    >
                      {item.percentage}% de précision
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "0.5rem", borderRadius: "50%" }}
                    onClick={() => setStatus("idle")}
                  >
                    <Play size={16} fill="white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          padding: "0.75rem",
          borderRadius: "12px",
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        <Icon size={24} />
      </div>
      <div>
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
}
