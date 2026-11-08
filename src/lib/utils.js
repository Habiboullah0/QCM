export function scoreQuestion(question, selected = []) {
  const totalPoints = Number(question.point) || 1;
  const options = question.options || [];
  const correctIndices = question.correct || [];

  const numTotal = options.length;
  const numCorrect = correctIndices.length || 1;
  const numIncorrect = Math.max(1, numTotal - correctIndices.length);

  // sum of correct = +totalPoints, sum of incorrect = -totalPoints
  const correctOptionValue = totalPoints / numCorrect;
  const incorrectOptionPenalty = totalPoints / numIncorrect;

  let earned = 0;
  let correctSelected = 0;
  let incorrectSelected = 0;

  selected.forEach((index) => {
    if (correctIndices.includes(index)) {
      earned += correctOptionValue;
      correctSelected += 1;
    } else {
      earned -= incorrectOptionPenalty;
      incorrectSelected += 1;
    }
  });

  // Score floored at 0, capped at totalPoints
  const finalScore = Math.max(0, Math.min(totalPoints, Math.round(earned * 1000) / 1000));
  const isPerfect = correctSelected === correctIndices.length && incorrectSelected === 0;
  const isMissed = finalScore === 0;
  const isPartial = !isPerfect && !isMissed;

  return {
    point: totalPoints,
    score: finalScore,
    correct: isPerfect,
    partial: isPartial,
    missed: isMissed,
  };
}

export function formatTime(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
}

export function isArabicText(text = "") {
  return /[\u0600-\u06FF]/.test(text);
}
