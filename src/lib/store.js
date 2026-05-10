import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { shuffleArray } from './utils'; 

export const useQuizStore = create(
  persist(
    (set, get) => ({
      currentQuizKey: null,
      quizTitle: "",
      allQuestions: [],
      currentQuestions: [],
      currentQuestionIndex: 0,
      userAnswers: {},
      status: 'idle',
      quizStartTime: null,
      timeLeft: 0,
      isTimerActive: false,
      settings: {
        timerDuration: 10,
        questionCount: 'all',
        customCount: 10,
        showExplanations: true,
        instantFeedback: false,
        shuffleQuestions: false,
        shuffleOptions: false,
      },
      
      setSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),

      setTimerDuration: (minutes) => set((state) => {
        const newMinutes = parseInt(minutes) || 1;
        return {
          timeLeft: newMinutes * 60,
          settings: { ...state.settings, timerDuration: newMinutes }
        };
      }),

      processQuestions: (questions) => {
        const { settings } = get();
        let processed = [...questions];
        
        if (settings.shuffleQuestions) {
          processed = shuffleArray(processed);
        }

        let limit = processed.length;
        if (settings.questionCount !== 'all') {
          limit = settings.questionCount === 'custom' ? settings.customCount : parseInt(settings.questionCount);
        }
        processed = processed.slice(0, limit);

        if (settings.shuffleOptions) {
          processed = processed.map(q => {
            // Create an array of indices [0, 1, 2, ...]
            const indices = q.options.map((_, i) => i);
            const shuffledIndices = shuffleArray([...indices]);
            
            // Map options to new positions
            const newOptions = shuffledIndices.map(i => q.options[i]);
            
            // Map correct indices to new positions
            const newCorrect = q.correct
              .map(oldIdx => shuffledIndices.indexOf(oldIdx))
              .filter(newIdx => newIdx !== -1)
              .sort((a, b) => a - b);

            return { ...q, options: newOptions, correct: newCorrect, originalIndices: shuffledIndices };
          });
        }

        return processed;
      },

      loadQuiz: async (url, key, title) => {
        set({ status: 'loading' });
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Failed to fetch");
          const data = await res.json();
          
          const questionsToUse = get().processQuestions(data);
          
          set({
            currentQuizKey: key,
            quizTitle: title,
            allQuestions: data,
            currentQuestions: questionsToUse,
            status: 'active',
            currentQuestionIndex: 0,
            userAnswers: {},
            quizStartTime: Date.now(),
            timeLeft: get().settings.timerDuration * 60,
            isTimerActive: false
          });
        } catch (error) {
          console.error("Error loading quiz:", error);
          set({ status: 'idle' });
          alert("Erreur lors du chargement du QCM.");
        }
      },

      loadLocalQuiz: (data, title) => {
        const questionsToUse = get().processQuestions(data);
        set({
          currentQuizKey: 'local-' + Date.now(),
          quizTitle: title || "Quiz Local",
          allQuestions: data,
          currentQuestions: questionsToUse,
          status: 'active',
          currentQuestionIndex: 0,
          userAnswers: {},
          quizStartTime: Date.now(),
          timeLeft: get().settings.timerDuration * 60,
          isTimerActive: false
        });
      },

      selectAnswer: (qIndex, optIndex) => {
        const { userAnswers, status } = get();
        if (status === 'review') return;
        const currentAnswers = userAnswers[qIndex] || [];
        const isSelected = currentAnswers.includes(optIndex);
        let newAnswers;
        if (isSelected) {
          newAnswers = currentAnswers.filter(i => i !== optIndex);
        } else {
          newAnswers = [...currentAnswers, optIndex];
        }
        const updatedUserAnswers = { ...userAnswers };
        if (newAnswers.length === 0) {
          delete updatedUserAnswers[qIndex];
        } else {
          updatedUserAnswers[qIndex] = newAnswers;
        }
        set({ userAnswers: updatedUserAnswers });
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

      submitQuiz: () => {
        set({ status: 'review', isTimerActive: false });
      },

      resetQuiz: () => {
        const { allQuestions, settings } = get();
        if (allQuestions.length === 0) { set({ status: 'idle' }); return; }
        
        const questionsToUse = get().processQuestions(allQuestions);
        
        set({
          currentQuestions: questionsToUse,
          currentQuestionIndex: 0,
          userAnswers: {},
          status: 'active',
          quizStartTime: Date.now(),
          timeLeft: settings.timerDuration * 60,
          isTimerActive: false
        });
      },

      toggleTimer: () => set((state) => ({ isTimerActive: !state.isTimerActive })),
      
      tickTimer: () => {
        const { timeLeft, status } = get();
        if (status !== 'active') return;
        
        if (timeLeft <= 0) { 
          set({ isTimerActive: false });
          get().submitQuiz();
        } else { 
          set({ timeLeft: timeLeft - 1 }); 
        }
      },
    }),
    {
      name: 'quiz-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentQuizKey: state.currentQuizKey,
        quizTitle: state.quizTitle,
        allQuestions: state.allQuestions, 
        currentQuestions: state.currentQuestions,
        userAnswers: state.userAnswers,
        currentQuestionIndex: state.currentQuestionIndex,
        status: state.status,
        settings: state.settings,
        timeLeft: state.timeLeft,
      }),
    }
  )
);
