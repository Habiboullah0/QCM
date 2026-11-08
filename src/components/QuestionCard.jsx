"use client";

import { motion } from "motion/react";
import { AlertCircle, Bookmark, BookmarkCheck, Check, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useQuizStore } from "@/lib/store";
import { isArabicText, scoreQuestion } from "@/lib/utils";

export default function QuestionCard() {
  const {
    currentQuestions,
    currentQuestionIndex,
    userAnswers,
    selectAnswer,
    status,
    settings,
    bookmarks,
    currentQuizKey,
    toggleBookmark,
  } = useQuizStore();

  const [hint, setHint] = useState(false);
  const q = currentQuestions[currentQuestionIndex];
  if (!q) return null;

  const selected = userAnswers[currentQuestionIndex] || [];
  const review = status === "review";
  const flagged = (bookmarks[currentQuizKey] || []).includes(currentQuestionIndex);
  const options = q.options || [];
  const correctIndices = q.correct || [];
  const multiple = correctIndices.length > 1;

  // Clean prefix like "A.", "B)", etc. Supports any letter A-Z for > 4 options
  const clean = (text) => String(text).replace(/^[A-Z][.)]\s*/i, "");

  // Option Letter Badge generator (A, B, C, D, E, F, G...)
  const getBadgeLetter = (index) => {
    return index < 26 ? String.fromCharCode(65 + index) : `O${index + 1}`;
  };

  // --- Scoring calculations ---
  const totalPoints = Number(q.point) || 1;
  const numTotal = options.length;
  const numCorrect = correctIndices.length || 1;
  const numIncorrect = Math.max(1, numTotal - correctIndices.length);

  // Sum of correct = +totalPoints, Sum of incorrect = -totalPoints
  const correctOptionValue = totalPoints / numCorrect;
  const incorrectOptionPenalty = totalPoints / numIncorrect;

  const formatPts = (val) => {
    const rounded = Math.round(val * 100) / 100;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, "");
  };

  const questionResult = scoreQuestion ? scoreQuestion(q, selected) : { score: 0, correct: false, partial: false };

  return (
    <motion.section
      className="card"
      key={currentQuestionIndex}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      aria-labelledby="question-title"
    >
      {/* Header */}
      <div className="question-head">
        <div className="question-index">{currentQuestionIndex + 1}</div>
        <div style={{ flex: 1 }}>
          <h2
            id="question-title"
            className={`question-title question-copy ${isArabicText(q.question) ? "arabic-copy" : ""}`}
            dir="auto"
          >
            {q.question}
          </h2>
          <div className="question-meta">
            <span className="pill">
              {formatPts(totalPoints)} point{totalPoints > 1 ? "s" : ""}
            </span>
            <span className="pill">
              {options.length} options ({numCorrect} juste{numCorrect > 1 ? "s" : ""}, {numIncorrect} fausse{numIncorrect > 1 ? "s" : ""})
            </span>
            {multiple && <span className="pill pill-accent">Sélection multiple</span>}

            {/* Score earned in review */}
            {review && (
              <span
                className="pill"
                style={{
                  fontWeight: 800,
                  color: questionResult.correct
                    ? "var(--success)"
                    : questionResult.partial
                    ? "var(--warning)"
                    : "var(--danger)",
                  background: questionResult.correct
                    ? "color-mix(in srgb,var(--success) 14%,var(--panel))"
                    : questionResult.partial
                    ? "color-mix(in srgb,var(--warning) 14%,var(--panel))"
                    : "color-mix(in srgb,var(--danger) 14%,var(--panel))",
                }}
              >
                Score obtenu : {formatPts(questionResult.score)} / {formatPts(totalPoints)} pt{totalPoints > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <button
          className="btn btn-outline"
          onClick={() => toggleBookmark(currentQuestionIndex)}
          aria-pressed={flagged}
          aria-label={flagged ? "Retirer le marque-page" : "Marquer pour révision"}
        >
          {flagged ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      {/* Options List */}
      <div className="options" role={multiple ? "group" : "radiogroup"} aria-label={multiple ? "Choix multiples" : "Choix unique"}>
        {options.map((option, index) => {
          const chosen = selected.includes(index);
          const correct = correctIndices.includes(index);

          let state = chosen ? "selected " : "";
          if (review) {
            state = correct ? "correct " : chosen ? "incorrect " : (!chosen && correct ? "missed " : "");
          } else if (settings.instantFeedback && chosen) {
            state = correct ? "correct " : "incorrect ";
          }

          return (
            <button
              key={index}
              className={`option-item ${state}`}
              onClick={() => !review && selectAnswer(currentQuestionIndex, index)}
              disabled={review}
              role={multiple ? "checkbox" : "radio"}
              aria-checked={chosen}
              style={
                review
                  ? {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: ".65rem",
                      cursor: "default",
                      transform: "none",
                    }
                  : undefined
              }
            >
              {/* Option copy & icon */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: ".75rem", width: "100%" }}>
                <span className="option-badge">{getBadgeLetter(index)}</span>
                <span
                  className={`option-copy ${isArabicText(option) ? "arabic-copy" : ""}`}
                  dir="auto"
                  style={{ flex: 1, paddingTop: ".2rem" }}
                >
                  {clean(option)}
                </span>

                {/* Status icon in review */}
                {review && (
                  <span style={{ flexShrink: 0, marginTop: ".2rem" }}>
                    {chosen && correct && <CheckCircle2 color="var(--success)" size={20} />}
                    {chosen && !correct && <XCircle color="var(--danger)" size={20} />}
                    {!chosen && correct && <AlertCircle color="var(--warning)" size={20} />}
                    {!chosen && !correct && <Check color="var(--muted)" size={18} style={{ opacity: 0.4 }} />}
                  </span>
                )}

                {/* Status check during test */}
                {!review && chosen && <Check color="var(--brand)" size={19} />}
              </div>

              {/* Review details banner */}
              {review && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: ".5rem",
                    paddingTop: ".6rem",
                    borderTop: "1px solid color-mix(in srgb, var(--line) 80%, transparent)",
                    fontSize: ".78rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: ".45rem", flexWrap: "wrap" }}>
                    {/* User's Choice */}
                    <span
                      className="pill"
                      style={{
                        color: chosen ? (correct ? "var(--success)" : "var(--danger)") : "var(--muted)",
                        background: chosen
                          ? correct
                            ? "color-mix(in srgb, var(--success) 14%, var(--panel))"
                            : "color-mix(in srgb, var(--danger) 14%, var(--panel))"
                          : "var(--canvas)",
                        border: "1px solid color-mix(in srgb, currentColor 30%, transparent)",
                      }}
                    >
                      Votre choix : <strong>{chosen ? "Sélectionné" : "Non sélectionné"}</strong>
                    </span>

                    {/* Expected Answer */}
                    <span
                      className="pill"
                      style={{
                        color: correct ? "var(--success)" : "var(--muted)",
                        background: correct
                          ? "color-mix(in srgb, var(--success) 12%, var(--panel))"
                          : "var(--canvas)",
                      }}
                    >
                      Attendu : <strong>{correct ? "Bonne réponse" : "Fausse"}</strong>
                    </span>

                    {/* Option Theoretical Value */}
                    <span className="pill" style={{ color: "var(--muted)" }}>
                      Valeur : {correct ? `+${formatPts(correctOptionValue)} pt` : `-${formatPts(incorrectOptionPenalty)} pt`}
                    </span>
                  </div>

                  {/* Impact on score */}
                  <span
                    className="pill"
                    style={{
                      fontWeight: 800,
                      color:
                        chosen && correct
                          ? "var(--success)"
                          : chosen && !correct
                          ? "var(--danger)"
                          : !chosen && correct
                          ? "var(--warning)"
                          : "var(--muted)",
                      background:
                        chosen && correct
                          ? "color-mix(in srgb, var(--success) 14%, var(--panel))"
                          : chosen && !correct
                          ? "color-mix(in srgb, var(--danger) 14%, var(--panel))"
                          : !chosen && correct
                          ? "color-mix(in srgb, var(--warning) 14%, var(--panel))"
                          : "var(--canvas)",
                    }}
                  >
                    {chosen && correct && `+${formatPts(correctOptionValue)} pt obtenu`}
                    {chosen && !correct && `-${formatPts(incorrectOptionPenalty)} pt pénalité`}
                    {!chosen && correct && `0 pt (+${formatPts(correctOptionValue)} manqué)`}
                    {!chosen && !correct && `0 pt (pénalité de -${formatPts(incorrectOptionPenalty)} évitée)`}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hint during test */}
      {q.hint && !review && (
        <div style={{ marginTop: "1rem" }}>
          <button className="btn btn-ghost" onClick={() => setHint(!hint)}>
            <HelpCircle size={17} />
            {hint ? "Masquer l’indice" : "Afficher l’indice"}
          </button>
          {hint && (
            <p className="card question-copy" dir="auto" style={{ margin: ".5rem 0 0", padding: ".8rem", boxShadow: "none" }}>
              {q.hint}
            </p>
          )}
        </div>
      )}

      {/* Explanation in review */}
      {review && settings.showExplanations && q.explanation && (
        <div
          className="card question-copy"
          dir="auto"
          style={{
            marginTop: "1rem",
            boxShadow: "none",
            borderColor: "color-mix(in srgb,var(--success) 35%,var(--line))",
          }}
        >
          <strong style={{ display: "flex", gap: ".4rem", alignItems: "center", color: "var(--success)" }}>
            <AlertCircle size={17} /> Explication
          </strong>
          <p style={{ margin: ".4rem 0 0" }}>{q.explanation}</p>
        </div>
      )}
    </motion.section>
  );
}
