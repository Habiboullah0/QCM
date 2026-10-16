import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useQuizStore = create(
  persist(
    (set, get) => ({
      status: 'idle', // 'idle', 'loading', 'active', 'review', 'dashboard'
      currentQuizKey: null,
      currentQuizTitle: '',
      allQuestions: [],
      currentQuestions: [],
      currentQuestionIndex: 0,
      userAnswers: {}, // { questionIndex: [selectedOptionIndices] }
      bookmarks: {}, // { quizKey: [questionIndices] }
      settings: {
        showExplanations: true,
        instantFeedback: false,
        autoNext: false,
        shuffleQuestions: false,
        shuffleOptions: false,
        timerDuration: 30,
        questionCount: 'all',
        customCount: 10,
      },
      timeLeft: 0,
      isTimerActive: false,
      history: [],

      setSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      setStatus: (status) => set({ status }),
      setTimerDuration: (duration) => set((state) => ({ settings: { ...state.settings, timerDuration: duration } })),

      loadQuiz: async (file, key, title) => {
        set({ status: 'loading' });
        try {
          const res = await fetch(`https://habiboullah0.github.io/QCMsFile/${file}`);
          const data = await res.json();
          get().initQuiz(data, key, title);
        } catch (err) {
          console.error(err);
          set({ status: 'idle' });
        }
      },

      loadLocalQuiz: (data, title) => {
        get().initQuiz(data, 'local_' + Date.now(), title);
      },

      initQuiz: (data, key, title) => {
        const { settings } = get();
        let questions = [...data];
        if (settings.shuffleQuestions) {
          questions.sort(() => Math.random() - 0.5);
        }
        let count = questions.length;
        if (settings.questionCount !== 'all') {
          count = settings.questionCount === 'custom' ? settings.customCount : parseInt(settings.questionCount);
        }
        questions = questions.slice(0, count);

        if (settings.shuffleOptions) {
          questions = questions.map(q => {
            const optionsWithIndex = q.options.map((opt, i) => ({ text: opt, isCorrect: q.correct.includes(i) }));
            optionsWithIndex.sort(() => Math.random() - 0.5);
            return {
              ...q,
              options: optionsWithIndex.map(o => o.text),
              correct: optionsWithIndex.map((o, i) => o.isCorrect ? i : -1).filter(i => i !== -1)
            };
          });
        }

        set({
          allQuestions: data,
          currentQuestions: questions,
          currentQuizKey: key,
          currentQuizTitle: title,
          currentQuestionIndex: 0,
          userAnswers: {},
          status: 'active',
          timeLeft: settings.timerDuration * 60,
          isTimerActive: true,
        });
      },

      selectAnswer: (qIndex, optIndex) => {
        const { currentQuestions, userAnswers, settings } = get();
        const q = currentQuestions[qIndex];
        const currentSelected = userAnswers[qIndex] || [];
        let newSelected;

        if (currentSelected.includes(optIndex)) {
          newSelected = currentSelected.filter(i => i !== optIndex);
        } else {
          newSelected = [...currentSelected, optIndex];
        }

        set({ userAnswers: { ...userAnswers, [qIndex]: newSelected } });

        if (settings.autoNext && q.correct.length === 1 && newSelected.length === 1) {
          setTimeout(() => {
            get().nextQuestion();
          }, 300);
        }
      },

      clearAnswer: (qIndex) => {
        const { userAnswers } = get();
        const newAnswers = { ...userAnswers };
        delete newAnswers[qIndex];
        set({ userAnswers: newAnswers });
      },

      nextQuestion: () => {
        const { currentQuestionIndex, currentQuestions } = get();
        if (currentQuestionIndex < currentQuestions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      prevQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      goToQuestion: (index) => {
        set({ currentQuestionIndex: index });
      },

      toggleBookmark: (qIndex) => {
        const { bookmarks, currentQuizKey } = get();
        const quizBookmarks = bookmarks[currentQuizKey] || [];
        let newBookmarks;
        if (quizBookmarks.includes(qIndex)) {
          newBookmarks = quizBookmarks.filter(i => i !== qIndex);
        } else {
          newBookmarks = [...quizBookmarks, qIndex];
        }
        set({ bookmarks: { ...bookmarks, [currentQuizKey]: newBookmarks } });
      },

      toggleTimer: () => set((state) => ({ isTimerActive: !state.isTimerActive })),

      tickTimer: () => {
        const { timeLeft, submitQuiz } = get();
        if (timeLeft <= 1) {
          submitQuiz();
        } else {
          set({ timeLeft: timeLeft - 1 });
        }
      },

      submitQuiz: () => {
        const { currentQuestions, userAnswers, settings, timeLeft, currentQuizKey, currentQuizTitle, history } = get();

        let totalScore = 0;
        let maxPossibleScore = 0;

        currentQuestions.forEach((q, idx) => {
          const P = q.point || 1; // Default to 1 point if not specified
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

          if (C > 0) {
            const pointPerCorrect = P / C;
            const pointPerIncorrect = I > 0 ? P / I : 0;

            // Calculate score: positive for correct, negative for incorrect
            let qScore = (correctSelections * pointPerCorrect) - (incorrectSelections * pointPerIncorrect);

            // Reset to 0 if negative
            totalScore += Math.max(0, qScore);
          }
        });

        // Scale to 20
        const scoreOn20 = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 20 : 0;
        const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

        const newHistoryItem = {
          id: Date.now(),
          quizKey: currentQuizKey,
          title: currentQuizTitle,
          date: new Date().toISOString(),
          score: totalScore,
          maxScore: maxPossibleScore,
          scoreOn20: scoreOn20,
          percentage,
          total: currentQuestions.length,
          timeTaken: (settings.timerDuration * 60) - timeLeft
        };

        set({
          status: 'review',
          isTimerActive: false,
          history: [newHistoryItem, ...history]
        });
      },

      resetQuiz: () => {
        const { allQuestions, currentQuizKey, currentQuizTitle } = get();
        get().initQuiz(allQuestions, currentQuizKey, currentQuizTitle);
      },

      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'qcm-storage',
      partialize: (state) => ({
        history: state.history,
        settings: state.settings,
        bookmarks: state.bookmarks
      })
    }
  )
);
