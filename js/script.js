document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const config = {
        storageKeys: {
            highScores: "quizHighScores_v3_fr",
            theme: "quizTheme",
            quizState: "currentQuizState_v3_fr",
        },
        cssClasses: {
            loadingHidden: "hidden",
            correctOption: "correct",
            incorrectOption: "incorrect",
            missedCorrect: "missed-correct",
            selected: "selected",
            darkTheme: "dark",
            timerPulse: "animate-pulse-slow",
            fadeIn: "animate-fade-in",
            slideIn: "animate-slide-in",
            borderSuccess: "border-success",
            bgSuccess5: "bg-success/5",
            bgSuccess10: "bg-success/10",
            borderWarning: "border-warning",
            bgWarning5: "bg-warning/5",
            bgWarning10: "bg-warning/10",
            borderError: "border-error",
            bgError5: "bg-error/5",
            bgError10: "bg-error/10",
            borderPrimary: "border-primary",
            bgPrimary10: "bg-primary/10",
        },
        defaults: {
            timerDuration: 10,
            questionCount: "all",
            customQuestionCount: 10,
            showExplanations: true,
            instantFeedback: false,
            theme: "light",
        },
        optionLetters: ["A", "B", "C", "D", "E"],
        confirmReset: true,
        lowTimeThreshold: 60,
        questionFadeDuration: 150,
        confettiCount: 100,
        confettiColors: ["#4F46E5", "#16A34A", "#EA580C", "#DC2626"],
        confettiAnimationDuration: 6000,
        adaptiveDifficultyThreshold: 0.7,
        adaptiveDifficultySplit: 0.7,
        minQuestionsForAdaptive: 10,
        performanceMidRange: [0.4, 0.6],
    };

    const dom = {
        quizSelector: document.getElementById("quizSelector"),
        quizDescription: document.getElementById("quizDescription"),
        highScoreDisplay: document.getElementById("highScoreDisplay"),
        quizArea: document.getElementById("quizArea"),
        questionDisplayArea: document.getElementById("questionDisplayArea"),
        quizForm: document.getElementById("quizForm"),
        resultDiv: document.getElementById("result"),
        checkButton: document.getElementById("checkBtn"),
        resetButton: document.getElementById("resetBtn"),
        timerButton: document.getElementById("timerBtn"),
        timerBtnText: document.getElementById("timerBtnText"),
        timerContainer: document.getElementById("timerContainer"),
        timerDisplay: document.getElementById("timer"),
        timerDurationInput: document.getElementById("timerDurationInput"),
        progressBar: document.getElementById("progressBar"),
        loadingIndicator: document.getElementById("loadingIndicator"),
        showExplanationsToggle: document.getElementById("showExplanationsToggle"),
        instantFeedbackToggle: document.getElementById("instantFeedbackToggle"),
        themeToggleButton: document.getElementById("themeToggleBtn"),
        body: document.body,
        navigationContainer: document.getElementById("navigationContainer"),
        prevButton: document.getElementById("prevBtn"),
        nextButton: document.getElementById("nextBtn"),
        questionCounter: document.getElementById("questionCounter"),
        questionCountSelector: document.getElementById("questionCountSelector"),
        customQuestionCountContainer: document.getElementById("customQuestionCountContainer"),
        customQuestionCount: document.getElementById("customQuestionCount"),
        applyCustomCountButton: document.getElementById("applyCustomCount"),
        progressChartContainer: document.getElementById("progressChartContainer"),
        progressChartCanvas: document.getElementById("progressChart"),
        exportResultsButton: document.getElementById("exportResultsBtn"),
        showAnswerButton: document.getElementById("showAnswerBtn"),
        get allInteractiveElements() {
            return [
                this.quizSelector,
                this.checkButton,
                this.resetButton,
                this.timerButton,
                this.timerDurationInput,
                this.showExplanationsToggle,
                this.instantFeedbackToggle,
                this.themeToggleButton,
                this.prevButton,
                this.nextButton,
                this.questionCountSelector,
                this.customQuestionCount,
                this.applyCustomCountButton,
                this.exportResultsButton,
                this.showAnswerButton,
            ].filter((el) => el);
        },
    };

    const state = {
        currentQuestions: [],
        allQuestions: [],
        currentQuizKey: "",
        timerInterval: null,
        timeLeft: 0,
        timerActive: false,
        reviewMode: false,
        quizStartTime: null,
        currentQuestionIndex: 0,
        userAnswers: {},
        selectedQuestionCount: config.defaults.questionCount,
        quizResults: null,
        progressChart: null,

        resetQuizProgress() {
            this.userAnswers = {};
            this.currentQuestionIndex = 0;
            this.reviewMode = false;
            this.quizResults = null;
            this.quizStartTime = Date.now();
        },

        resetTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            this.timerActive = false;
            this.timeLeft = 0;
        },

        save() {
            if (!this.currentQuizKey || this.currentQuestions.length === 0) return;
            const quizState = {
                quizKey: this.currentQuizKey,
                questionIndex: this.currentQuestionIndex,
                answers: this.userAnswers,
                timeLeft: this.timerActive ? this.timeLeft : null,
                timerDuration: parseInt(dom.timerDurationInput.value, 10) || config.defaults.timerDuration,
                explanationsVisible: dom.showExplanationsToggle.checked,
                instantFeedback: dom.instantFeedbackToggle.checked,
                startTime: this.quizStartTime,
                selectedQuestionCount: this.selectedQuestionCount,
                customQuestionCount: dom.customQuestionCount.value,
            };
            try {
                sessionStorage.setItem(config.storageKeys.quizState, JSON.stringify(quizState));
            } catch (e) {
                console.error("Error saving quiz state to sessionStorage:", e);
            }
        },

        load() {
            try {
                const savedState = sessionStorage.getItem(config.storageKeys.quizState);
                return savedState ? JSON.parse(savedState) : null;
            } catch (e) {
                console.error("Error loading quiz state from sessionStorage:", e);
                sessionStorage.removeItem(config.storageKeys.quizState);
                return null;
            }
        },

        clearSaved() {
            sessionStorage.removeItem(config.storageKeys.quizState);
        },

        updateAnswer(qIndex, optIndex, isChecked) {
            if (this.reviewMode) return;

            if (!this.userAnswers[qIndex]) {
                this.userAnswers[qIndex] = [];
            }

            if (isChecked) {
                if (!this.userAnswers[qIndex].includes(optIndex)) {
                    this.userAnswers[qIndex].push(optIndex);
                }
            } else {
                this.userAnswers[qIndex] = this.userAnswers[qIndex].filter((idx) => idx !== optIndex);
            }

            if (this.userAnswers[qIndex].length === 0) {
                delete this.userAnswers[qIndex];
            }
        },

        areAllQuestionsAttempted() {
            if (this.currentQuestions.length === 0) return false;
            for (let i = 0; i < this.currentQuestions.length; i++) {
                if (!this.userAnswers[i] || this.userAnswers[i].length === 0) {
                    return false;
                }
            }
            return true;
        },

        getFirstUnansweredIndex() {
            for (let i = 0; i < this.currentQuestions.length; i++) {
                if (!this.userAnswers[i] || this.userAnswers[i].length === 0) {
                    return i;
                }
            }
            return -1;
        },
    };

    const utils = {
        shuffleArray(array) {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        },

        formatTime(seconds) {
            if (isNaN(seconds) || seconds < 0) return "N/A";
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
        },

        showErrorAlert(title, text) {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: title,
                    text: text,
                });
            } else {
                alert(`${title}\n${text}`);
                console.error(title, text);
            }
        },

        showInfoAlert(title, text) {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "info",
                    title: title,
                    text: text,
                });
            } else {
                alert(`${title}\n${text}`);
                console.info(title, text);
            }
        },

        confirmAction(message) {
            return confirm(message);
        },

        createAndDispatchEvent(element, eventName) {
            const event = new Event(eventName, { bubbles: true, cancelable: true });
            element.dispatchEvent(event);
        },
    };

    const themeManager = {
        init() {
            const savedTheme = this.getSavedTheme();
            const preferredTheme = this.getSystemPreference();
            this.apply(savedTheme || preferredTheme);
        },

        apply(theme) {
            document.documentElement.classList.toggle(config.cssClasses.darkTheme, theme === "dark");
            this.saveTheme(theme);
            chartManager.update();
        },

        toggle() {
            const currentTheme = document.documentElement.classList.contains(config.cssClasses.darkTheme) ? "dark" : "light";
            this.apply(currentTheme === "dark" ? "light" : "dark");
        },

        saveTheme(theme) {
            try {
                localStorage.setItem(config.storageKeys.theme, theme);
            } catch (e) {
                console.error("Error saving theme to localStorage:", e);
            }
        },

        getSavedTheme() {
            try {
                return localStorage.getItem(config.storageKeys.theme);
            } catch (e) {
                console.error("Error reading theme from localStorage:", e);
                return null;
            }
        },

        getSystemPreference() {
            if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
                return "dark";
            }
            return "light";
        },
    };

    const highScoreManager = {
        getScores() {
            try {
                const scores = localStorage.getItem(config.storageKeys.highScores);
                return scores ? JSON.parse(scores) : {};
            } catch (e) {
                console.error("Error reading high scores from localStorage:", e);
                return {};
            }
        },

        saveScore(quizKey, score, totalQuestions) {
            if (!quizKey || totalQuestions <= 0) return;
            const scores = this.getScores();
            const percentage = Math.round((score / totalQuestions) * 100);
            const currentHighScore = scores[quizKey]?.percentage ?? 0;

            if (percentage >= currentHighScore) {
                scores[quizKey] = {
                    percentage: percentage,
                    date: new Date().toISOString(),
                    score: score,
                    total: totalQuestions,
                };
                try {
                    localStorage.setItem(config.storageKeys.highScores, JSON.stringify(scores));
                    console.log(`New high score for ${quizKey}: ${percentage}%`);
                    this.display(quizKey);
                } catch (e) {
                    console.error("Error saving high score to localStorage:", e);
                }
            }
        },

        display(quizKey) {
            if (!quizKey) {
                dom.highScoreDisplay.textContent = "Meilleur score: Non disponible";
                dom.highScoreDisplay.style.display = "none";
                return;
            }
            const scores = this.getScores();
            const highScoreData = scores[quizKey];
            if (highScoreData?.percentage !== undefined) {
                dom.highScoreDisplay.textContent = `Meilleur score: ${highScoreData.percentage}%`;
            } else {
                dom.highScoreDisplay.textContent = "Meilleur score: Pas encore joué";
            }
            dom.highScoreDisplay.style.display = "inline-block";
        },
    };

    const timerManager = {
        tick() {
            state.timeLeft--;
            this.updateDisplay();
            if (state.timeLeft <= 0) {
                this.stop(true);
            }
            state.save();
        },

        start() {
            if (state.timerActive) return;

            if (state.timeLeft <= 0) {
                const minutes = parseInt(dom.timerDurationInput.value, 10);
                if (isNaN(minutes) || minutes <= 0) {
                    utils.showErrorAlert("Durée invalide", "Veuillez entrer une durée valide pour le minuteur.");
                    return;
                }
                state.timeLeft = minutes * 60;
            }

            state.timerActive = true;
            uiManager.showTimer(true);
            uiManager.setTimerControlsState(true);
            this.updateDisplay();
            uiManager.updateTimerButton(true);

            if (state.timerInterval) clearInterval(state.timerInterval);
            state.timerInterval = setInterval(() => this.tick(), 1000);
            state.save();
        },

        pause() {
            if (!state.timerActive) return;

            clearInterval(state.timerInterval);
            state.timerInterval = null;
            state.timerActive = false;
            uiManager.setTimerControlsState(false);
            uiManager.updateTimerButton(false);
            state.save();
        },

        stop(autoSubmit = false) {
            if (state.timerInterval) {
                clearInterval(state.timerInterval);
                state.timerInterval = null;
            }
            state.timerActive = false;
            uiManager.setTimerControlsState(true);
            uiManager.updateTimerButton(false);

            if (autoSubmit && !state.reviewMode) {
                console.log("Timer expired, submitting quiz.");
                quizLogic.submitAndReview();
            }
        },

        updateDisplay() {
            dom.timerDisplay.textContent = utils.formatTime(state.timeLeft);
            const isLowTime = state.timeLeft <= config.lowTimeThreshold && state.timeLeft > 0;
            dom.timerDisplay.classList.toggle(config.cssClasses.timerPulse, isLowTime);
            dom.timerDisplay.style.backgroundColor = isLowTime ? "rgb(var(--color-error))" : "rgb(var(--color-primary))";
        },

        restore(savedTimeLeft) {
            if (savedTimeLeft !== null && savedTimeLeft > 0) {
                state.timeLeft = savedTimeLeft;
                state.timerActive = false;
                uiManager.showTimer(true);
                this.updateDisplay();
                uiManager.setTimerControlsState(false);
                uiManager.updateTimerButton(false);
            } else {
                state.timeLeft = 0;
                state.timerActive = false;
                uiManager.showTimer(false);
                this.updateDisplay();
                uiManager.setTimerControlsState(false);
                uiManager.updateTimerButton(false);
            }
        },
    };

    const chartManager = {
        init() {
            if (!dom.progressChartCanvas || state.currentQuestions.length === 0) {
                uiManager.showProgressChart(false);
                return;
            }
            uiManager.showProgressChart(true);
            this.destroy();
            this.create();
        },

        update() {
            if (!dom.progressChartCanvas || state.currentQuestions.length === 0) return;

            let answeredCount = 0;
            for (let i = 0; i < state.currentQuestions.length; i++) {
                if (state.userAnswers[i] && state.userAnswers[i].length > 0) {
                    answeredCount++;
                }
            }
            const unansweredCount = state.currentQuestions.length - answeredCount;

            if (state.progressChart) {
                state.progressChart.data.datasets[0].data = [answeredCount, unansweredCount];
                state.progressChart.options.plugins.legend.labels.color = this.getTextColor();
                state.progressChart.data.datasets[0].backgroundColor[1] = this.getUnansweredColor();
                state.progressChart.data.datasets[0].borderColor = this.getBorderColor();
                state.progressChart.update();
            } else {
                this.create(answeredCount, unansweredCount);
            }
        },

        create(answered = 0, unanswered = state.currentQuestions.length) {
            if (!dom.progressChartCanvas) return;
            this.destroy();

            const isDark = document.documentElement.classList.contains(config.cssClasses.darkTheme);

            state.progressChart = new Chart(dom.progressChartCanvas, {
                type: "doughnut",
                data: {
                    labels: ["Répondues", "Non répondues"],
                    datasets: [
                        {
                            data: [answered, unanswered],
                            backgroundColor: ["rgb(79, 70, 229)", this.getUnansweredColor()],
                            borderColor: this.getBorderColor(),
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                color: this.getTextColor(),
                                font: {
                                    size: 14,
                                    family: "'Poppins', 'Roboto', sans-serif",
                                },
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || "";
                                    const value = context.raw || 0;
                                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                },
                            },
                        },
                    },
                    cutout: "70%",
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                    },
                },
            });
        },

        destroy() {
            if (state.progressChart) {
                state.progressChart.destroy();
                state.progressChart = null;
            }
        },

        getTextColor() {
            return document.documentElement.classList.contains(config.cssClasses.darkTheme) ? "rgb(249, 250, 251)" : "rgb(31, 41, 55)";
        },
        getUnansweredColor() {
            return document.documentElement.classList.contains(config.cssClasses.darkTheme) ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)";
        },
        getBorderColor() {
            return document.documentElement.classList.contains(config.cssClasses.darkTheme) ? "rgb(31, 41, 55)" : "rgb(255, 255, 255)";
        },
    };

    const uiManager = {
        setLoading(isLoading) {
            dom.loadingIndicator.classList.toggle(config.cssClasses.loadingHidden, !isLoading);
            dom.quizArea.setAttribute("aria-busy", isLoading ? "true" : "false");
            dom.allInteractiveElements.forEach((el) => {
                el.disabled = isLoading;
            });

            if (dom.questionCountSelector.value === "custom") {
                dom.customQuestionCount.disabled = isLoading;
                dom.applyCustomCountButton.disabled = isLoading;
            }
        },

        displayLoadError(filename, error) {
            dom.questionDisplayArea.innerHTML = "";
            dom.quizForm.innerHTML = "";
            dom.resultDiv.innerHTML = `
                <div class="p-6 ${config.cssClasses.bgError10} border ${config.cssClasses.borderError} rounded-xl">
                    <p class="text-xl font-bold mb-2">Erreur de chargement</p>
                    <p class="mb-2">Impossible de charger le quiz depuis '${filename}'.</p>
                    <p class="text-sm text-text-secondary">${error.message}</p>
                </div>`;
            dom.resultDiv.className = `block ${config.cssClasses.fadeIn}`;
            dom.navigationContainer.style.display = "none";
            this.showProgressChart(false);
            this.showExportButton(false);
        },

        resetButtonStatesOnError() {
            dom.checkButton.disabled = true;
            dom.resetButton.disabled = true;
            dom.timerButton.disabled = true;
            dom.timerDurationInput.disabled = false;
            this.showTimer(false);
        },

        setupQuizInterface() {
            dom.quizForm.style.display = "none";
            dom.resultDiv.style.display = "none";
            this.showTimer(false);
            dom.timerButton.disabled = false;
            dom.timerDurationInput.disabled = false;
            dom.checkButton.disabled = !state.areAllQuestionsAttempted();
            dom.resetButton.disabled = false;
            dom.showAnswerButton.disabled = false;
            this.showExportButton(false);

            const selectedOption = dom.quizSelector.options[dom.quizSelector.selectedIndex];
            const quizTitle = selectedOption.getAttribute("data-title") || "Inconnu";
            dom.quizDescription.textContent = `Quiz ${quizTitle} - ${state.currentQuestions.length} questions`;
        },

        showTimer(show) {
            dom.timerContainer.style.display = show ? "flex" : "none";
        },

        setTimerControlsState(timerIsRunningOrStopped) {
            dom.timerDurationInput.disabled = timerIsRunningOrStopped;
            dom.timerButton.disabled = state.timeLeft <= 0 && !state.timerActive && state.reviewMode;
        },

        updateTimerButton(isActive) {
            dom.timerBtnText.textContent = isActive ? "Pause" : "Démarrer";
            dom.timerButton.classList.toggle("bg-error", isActive);
            dom.timerButton.classList.toggle("bg-warning", !isActive);
        },

        showQuestion(index) {
            if (index < 0 || index >= state.currentQuestions.length) {
                console.warn(`Attempted to show invalid question index: ${index}`);
                return;
            }
            state.reviewMode = false;
            state.currentQuestionIndex = index;

            dom.questionDisplayArea.classList.add("opacity-0");

            setTimeout(() => {
                const questionData = state.currentQuestions[index];
                const questionElement = this.buildQuestionElement(questionData, index, false);
                dom.questionDisplayArea.innerHTML = "";
                dom.questionDisplayArea.appendChild(questionElement);

                dom.questionCounter.textContent = `Question ${index + 1} / ${state.currentQuestions.length}`;
                dom.prevButton.disabled = index === 0;
                dom.nextButton.disabled = index === state.currentQuestions.length - 1;

                dom.questionDisplayArea.style.display = "block";
                dom.quizForm.style.display = "none";
                dom.navigationContainer.style.display = "flex";
                dom.resultDiv.style.display = "none";

                dom.questionDisplayArea.classList.remove("opacity-0");
                dom.quizArea.scrollIntoView({ behavior: "smooth", block: "center" });

                dom.checkButton.disabled = !state.areAllQuestionsAttempted();

                state.save();
                chartManager.update();
            }, config.questionFadeDuration);
        },

        buildQuestionElement(questionData, questionIndex, isInReviewMode) {
            const questionDiv = document.createElement("div");
            questionDiv.className = `card mb-6 ${config.cssClasses.slideIn}`;
            questionDiv.id = `question-${questionIndex}`;

            const badge = document.createElement("div");
            badge.className = "w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm";
            badge.textContent = questionIndex + 1;
            questionDiv.appendChild(badge);

            const title = document.createElement("h3");
            title.className = "text-lg font-semibold mb-4 pl-6";
            title.textContent = questionData.question;
            questionDiv.appendChild(title);

            const optionsContainer = document.createElement("div");
            optionsContainer.className = "options-container mt-4";
            questionData.options.forEach((optionText, optionIndex) => {
                const label = document.createElement("label");
                label.className = "quiz-option";
                label.htmlFor = `question-${questionIndex}-option-${optionIndex}`;

                const input = document.createElement("input");
                input.type = "checkbox";
                input.className = "checkbox hidden";
                input.id = `question-${questionIndex}-option-${optionIndex}`;
                input.name = `question-${questionIndex}`;
                input.value = optionIndex;

                if (state.userAnswers[questionIndex]?.includes(optionIndex)) {
                    input.checked = true;
                    label.classList.add(config.cssClasses.selected);
                }

                input.disabled = isInReviewMode;
                if (!isInReviewMode) {
                    input.addEventListener("change", (e) => {
                        quizLogic.handleAnswerChange(questionIndex, optionIndex, e.target.checked);
                        label.classList.toggle(config.cssClasses.selected, e.target.checked);
                    });
                }

                const textSpan = document.createElement("span");
                textSpan.innerHTML = `<strong>${config.optionLetters[optionIndex] || ""}.</strong> ${optionText}`;

                label.appendChild(input);
                label.appendChild(textSpan);
                optionsContainer.appendChild(label);
            });
            questionDiv.appendChild(optionsContainer);

            if (questionData.hint) {
                this.addHintSection(questionDiv, questionData.hint);
            }

            if (isInReviewMode) {
                const correctionDiv = document.createElement("div");
                correctionDiv.className = "p-4 mt-4 rounded-lg";
                correctionDiv.id = `correction-${questionIndex}`;
                correctionDiv.setAttribute("aria-live", "polite");
                correctionDiv.style.display = "none";
                questionDiv.appendChild(correctionDiv);
            }

            return questionDiv;
        },

        addHintSection(parentDiv, hintText) {
            const hintButton = document.createElement("button");
            hintButton.className = "text-primary hover:text-primary/80 mt-4 flex items-center gap-1 text-sm";
            const hintContent = document.createElement("div");
            hintContent.className = `p-3 mt-2 ${config.cssClasses.bgPrimary10} rounded-lg text-sm hidden`;
            hintContent.textContent = hintText;

            const iconShow = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Afficher l'indice`;
            const iconHide = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg> Masquer l'indice`;

            hintButton.innerHTML = iconShow;
            hintButton.addEventListener("click", () => {
                const isHidden = hintContent.classList.toggle("hidden");
                hintButton.innerHTML = isHidden ? iconShow : iconHide;
            });

            parentDiv.appendChild(hintButton);
            parentDiv.appendChild(hintContent);
        },

        updateProgress() {
            if (state.currentQuestions.length === 0) {
                dom.progressBar.style.width = "0%";
                dom.progressBar.setAttribute("aria-valuenow", 0);
                return;
            }

            let answeredCount = 0;
            for (let i = 0; i < state.currentQuestions.length; i++) {
                if (state.userAnswers[i] && state.userAnswers[i].length > 0) {
                    answeredCount++;
                }
            }

            const progressPercentage = Math.round((answeredCount / state.currentQuestions.length) * 100);
            dom.progressBar.style.width = `${progressPercentage}%`;
            dom.progressBar.setAttribute("aria-valuenow", progressPercentage);
        },

        showProgressChart(show) {
            dom.progressChartContainer.style.display = show ? "block" : "none";
        },

        displayReview(results) {
            state.reviewMode = true;
            state.clearSaved();
            timerManager.stop();

            dom.questionDisplayArea.style.display = "none";
            dom.navigationContainer.style.display = "none";
            this.showProgressChart(false);

            dom.quizForm.innerHTML = "";
            dom.quizForm.style.display = "block";

            const reviewFragment = document.createDocumentFragment();
            state.currentQuestions.forEach((q, index) => {
                const questionDiv = this.buildQuestionElement(q, index, true);
                const resultDetails = results.detailedResults[index];
                this.applyReviewStyling(questionDiv, resultDetails);
                reviewFragment.appendChild(questionDiv);
            });
            dom.quizForm.appendChild(reviewFragment);

            this.displayFinalScore(results);
            this.showExportButton(true);

            setTimeout(() => {
                dom.resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);

            if (results.percentage >= 80) {
                this.createConfetti();
            }
        },

        applyReviewStyling(questionDiv, resultDetails) {
            const correctionDiv = questionDiv.querySelector(`#correction-${resultDetails.index}`);
            const optionsContainer = questionDiv.querySelector(".options-container");
            const labels = optionsContainer.querySelectorAll("label");
            const questionData = state.currentQuestions[resultDetails.index];

            const selectedIndices = state.userAnswers[resultDetails.index] || [];
            const correctIndices = new Set(questionData.correct);

            selectedIndices.forEach((idx) => {
                if (labels[idx]) {
                    const isCorrect = correctIndices.has(idx);
                    labels[idx].classList.add(isCorrect ? config.cssClasses.correctOption : config.cssClasses.incorrectOption);
                    if (!isCorrect) labels[idx].setAttribute("aria-invalid", "true");
                }
            });

            correctIndices.forEach((idx) => {
                if (!selectedIndices.includes(idx) && labels[idx]) {
                    labels[idx].classList.add(config.cssClasses.missedCorrect);
                }
            });

            let borderClass = config.cssClasses.borderError;
            let bgClass = config.cssClasses.bgError5;
            if (resultDetails.status === "correct") {
                borderClass = config.cssClasses.borderSuccess;
                bgClass = config.cssClasses.bgSuccess5;
            } else if (resultDetails.status === "partial") {
                borderClass = config.cssClasses.borderWarning;
                bgClass = config.cssClasses.bgWarning5;
            }
            questionDiv.classList.add(borderClass, bgClass);

            if (correctionDiv) {
                this.populateCorrectionFeedback(correctionDiv, resultDetails, questionData);
            }
        },

        populateCorrectionFeedback(correctionDiv, resultDetails, questionData) {
            let feedback = "";
            let correctionClass = "";
            const correctOptionsText = questionData.correct
                .map((index) => {
                    const letter = config.optionLetters[index] || "";
                    const optionText = questionData.options[index];

                    return optionText ? `<span class="text-success font-medium">${letter}. ${optionText}</span>` : "";
                })
                .filter(Boolean)
                .join(", ");

            const correctAnswersString = `<strong>Réponses correctes:</strong> ${correctOptionsText || "Aucune"}`;

            switch (resultDetails.status) {
                case "correct":
                    feedback = `<p class="font-bold text-success mb-2">✓ Réponse correcte !</p>`;
                    correctionClass = `${config.cssClasses.bgSuccess10} border border-success/30`;
                    break;
                case "partial":
                    feedback = `<p class="font-bold text-warning mb-2">~ Réponse partiellement correcte.</p><p class="mb-2">Vous avez choisi certaines bonnes réponses, mais pas toutes.</p>`;
                    feedback += `<p>${correctAnswersString}</p>`;
                    correctionClass = `${config.cssClasses.bgWarning10} border border-warning/30`;
                    break;
                default:
                    feedback = `<p class="font-bold text-error mb-2">✗ Réponse incorrecte.</p>`;
                    if (resultDetails.incorrectSelections > 0) {
                        feedback += `<p class="mb-2">Vous avez choisi une ou plusieurs réponses incorrectes.</p>`;
                    } else {
                        feedback += `<p class="mb-2">Vous n'avez pas sélectionné toutes les bonnes réponses requises.</p>`;
                    }
                    feedback += `<p>${correctAnswersString}</p>`;
                    correctionClass = `${config.cssClasses.bgError10} border border-error/30`;
                    break;
            }

            if (questionData.explanation && dom.showExplanationsToggle.checked) {
                feedback += `<div class="mt-4 pt-3 border-t border-border"><strong>Explication:</strong> ${questionData.explanation}</div>`;
            }

            correctionDiv.innerHTML = feedback;
            correctionDiv.className = `p-4 mt-4 rounded-lg ${correctionClass}`;
            correctionDiv.style.display = "block";
        },

        displayFinalScore(results) {
            let resultClass = config.cssClasses.bgError10 + " border " + config.cssClasses.borderError;
            let resultEmoji = "😢";

            if (results.percentage >= 80) {
                resultClass = config.cssClasses.bgSuccess10 + " border " + config.cssClasses.borderSuccess;
                resultEmoji = "🏆";
            } else if (results.percentage >= 60) {
                resultClass = config.cssClasses.bgPrimary10 + " border " + config.cssClasses.borderPrimary;
                resultEmoji = "👍";
            } else if (results.percentage >= 40) {
                resultClass = config.cssClasses.bgWarning10 + " border " + config.cssClasses.borderWarning;
                resultEmoji = "🤔";
            }

            dom.resultDiv.innerHTML = `
                <div class="p-6 rounded-xl ${resultClass}">
                    <h2 class="text-2xl font-bold mb-4">${resultEmoji} Résultat final</h2>
                    <p class="text-xl mb-4">Vous avez répondu correctement à <strong>${results.score}</strong> question(s) sur <strong>${results.totalQuestions}</strong>.</p>
                    <div class="text-3xl font-bold mb-6">${results.percentage}%</div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        ${this.createResultStatBox("Réponses correctes", results.correctQuestions, "success")}
                        ${this.createResultStatBox("Réponses partielles", results.partiallyCorrectQuestions, "warning")}
                        ${this.createResultStatBox("Réponses incorrectes", results.incorrectQuestions, "error")}
                        ${this.createResultStatBox("Temps écoulé", utils.formatTime(results.timeTaken), "primary")}
                    </div>
                    <p class="mb-4">Consultez vos réponses ci-dessous pour apprendre de vos erreurs.</p>
                    <p class="text-sm text-text-secondary">Vous pouvez exporter les résultats ou réinitialiser le quiz pour réessayer.</p>
                </div>
            `;
            dom.resultDiv.className = `block ${config.cssClasses.fadeIn}`;
        },

        createResultStatBox(label, value, type) {
            return `
                <div class="p-4 rounded-lg bg-${type}/10 border border-${type}/30 text-center">
                    <div class="text-2xl font-bold">${value}</div>
                    <div class="text-sm">${label}</div>
                </div>`;
        },

        displayUnansweredWarning(firstUnansweredIndex) {
            dom.resultDiv.innerHTML = `
                <div class="p-6 ${config.cssClasses.bgWarning10} border ${config.cssClasses.borderWarning} rounded-xl">
                    <p class="text-xl font-bold mb-2">Attention !</p>
                    <p class="mb-2">Veuillez répondre à toutes les questions avant de vérifier.</p>
                    <p class="text-sm text-text-secondary">Allez à la question ${firstUnansweredIndex + 1} pour continuer.</p>
                </div>`;
            dom.resultDiv.className = `block ${config.cssClasses.fadeIn}`;
            dom.resultDiv.setAttribute("role", "alert");
        },

        createConfetti() {
            for (let i = 0; i < config.confettiCount; i++) {
                const confetti = document.createElement("div");
                confetti.className = "absolute w-2 h-2 rounded-full opacity-0";
                confetti.style.backgroundColor = config.confettiColors[Math.floor(Math.random() * config.confettiColors.length)];
                confetti.style.left = Math.random() * 100 + "vw";
                confetti.style.animationDelay = Math.random() * 3 + "s";
                confetti.style.animation = `confetti-fall ${Math.random() * 3 + 3}s ease-in-out forwards`;
                dom.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), config.confettiAnimationDuration);
            }
        },

        showExportButton(show) {
            dom.exportResultsButton.style.display = show ? "inline-flex" : "none";
        },

        updateCustomCountVisibility() {
            const show = dom.questionCountSelector.value === "custom";
            dom.customQuestionCountContainer.style.display = show ? "flex" : "none";
        },

        applyInstantFeedback(qIndex) {
            const questionElement = document.querySelector(`#question-${qIndex}`);
            if (!questionElement) return;

            questionElement.classList.add(config.cssClasses.timerPulse);
            setTimeout(() => {
                questionElement.classList.remove(config.cssClasses.timerPulse);
            }, 500);

            const correctAnswers = new Set(state.currentQuestions[qIndex].correct);
            const selectedAnswers = state.userAnswers[qIndex] || [];

            if (selectedAnswers.length > 0) {
                const allCorrect = selectedAnswers.every((ans) => correctAnswers.has(ans)) && selectedAnswers.length === correctAnswers.size;
                questionElement.style.borderLeft = `4px solid rgb(var(--color-${allCorrect ? "success" : "warning"}))`;
            } else {
                questionElement.style.borderLeft = "none";
            }
        },
    };

    const quizLogic = {
        async loadQuiz(filename, quizKey, savedStateData = null) {
            uiManager.setLoading(true);
            if (!savedStateData) {
                this.resetQuiz(false);
                state.clearSaved();
            }
            state.currentQuizKey = quizKey;
            highScoreManager.display(quizKey);

            try {
                const response = await fetch(filename);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} - ${response.statusText}. Impossible de charger '${filename}'`);
                }
                const data = await response.json();
                this.validateQuestionData(data, filename);

                state.allQuestions = data;
                this.restoreOrInitializeState(savedStateData, quizKey);
                state.currentQuestions = this.filterQuestions(state.allQuestions);
                this.validateCurrentQuestionIndex();

                uiManager.setupQuizInterface();
                uiManager.showQuestion(state.currentQuestionIndex);
                uiManager.updateProgress();
                chartManager.init();

                return true;
            } catch (error) {
                console.error("Error loading questions:", error);
                uiManager.displayLoadError(filename, error);
                state.allQuestions = [];
                state.currentQuestions = [];
                state.currentQuizKey = "";
                highScoreManager.display(null);
                uiManager.updateProgress();
                chartManager.destroy();
                uiManager.resetButtonStatesOnError();
                return false;
            } finally {
                uiManager.setLoading(false);
                dom.quizSelector.disabled = false;
                dom.themeToggleButton.disabled = false;
                dom.showExplanationsToggle.disabled = false;
                dom.instantFeedbackToggle.disabled = false;
                dom.questionCountSelector.disabled = false;
                uiManager.updateCustomCountVisibility();
                if (dom.questionCountSelector.value === "custom") {
                    dom.customQuestionCount.disabled = false;
                    dom.applyCustomCountButton.disabled = false;
                }
            }
        },

        validateQuestionData(data, filename) {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(`Invalid format or empty quiz in '${filename}'.`);
            }
            if (typeof data[0]?.question !== "string" || !Array.isArray(data[0]?.options) || !Array.isArray(data[0]?.correct)) {
                console.warn(`Potential incorrect question structure in ${filename}.`);
            }
        },

        restoreOrInitializeState(savedStateData, quizKey) {
            if (savedStateData && savedStateData.quizKey === quizKey) {
                state.selectedQuestionCount = savedStateData.selectedQuestionCount || config.defaults.questionCount;
                dom.questionCountSelector.value = state.selectedQuestionCount;
                if (state.selectedQuestionCount === "custom") {
                    dom.customQuestionCount.value = savedStateData.customQuestionCount || config.defaults.customQuestionCount;
                }
                uiManager.updateCustomCountVisibility();

                state.userAnswers = savedStateData.answers || {};
                state.currentQuestionIndex = savedStateData.questionIndex >= 0 ? savedStateData.questionIndex : 0;
                dom.timerDurationInput.value = savedStateData.timerDuration || config.defaults.timerDuration;
                dom.showExplanationsToggle.checked = savedStateData.explanationsVisible ?? config.defaults.showExplanations;
                dom.instantFeedbackToggle.checked = savedStateData.instantFeedback ?? config.defaults.instantFeedback;
                state.quizStartTime = savedStateData.startTime ? new Date(savedStateData.startTime) : Date.now();

                timerManager.restore(savedStateData.timeLeft);
                console.log(`Quiz state '${quizKey}' restored.`);
            } else {
                state.resetQuizProgress();
                state.selectedQuestionCount = config.defaults.questionCount;
                dom.questionCountSelector.value = state.selectedQuestionCount;
                dom.customQuestionCount.value = config.defaults.customQuestionCount;
                uiManager.updateCustomCountVisibility();
                dom.timerDurationInput.value = config.defaults.timerDuration;
                dom.showExplanationsToggle.checked = config.defaults.showExplanations;
                dom.instantFeedbackToggle.checked = config.defaults.instantFeedback;
                state.quizStartTime = Date.now();
            }
        },

        filterQuestions(questions) {
            let count;
            if (state.selectedQuestionCount === "all") {
                return questions;
            } else if (state.selectedQuestionCount === "custom") {
                count = parseInt(dom.customQuestionCount.value, 10);
            } else {
                count = parseInt(state.selectedQuestionCount, 10);
            }

            if (isNaN(count) || count < 1) {
                count = questions.length;
            }
            count = Math.min(count, questions.length);

            return utils.shuffleArray(questions).slice(0, count);
        },

        validateCurrentQuestionIndex() {
            if (state.currentQuestionIndex >= state.currentQuestions.length) {
                state.currentQuestionIndex = 0;
            }
        },

        handleAnswerChange(qIndex, optIndex, isChecked) {
            state.updateAnswer(qIndex, optIndex, isChecked);
            uiManager.updateProgress();
            chartManager.update();
            dom.checkButton.disabled = !state.areAllQuestionsAttempted();
            state.save();

            if (dom.instantFeedbackToggle.checked) {
                uiManager.applyInstantFeedback(qIndex);
            }
        },

        resetQuiz(confirm = true) {
            if (confirm && !utils.confirmAction("Êtes-vous sûr de vouloir réinitialiser le quiz ? Toutes vos réponses seront effacées.")) {
                return;
            }

            state.resetQuizProgress();
            state.resetTimer();
            chartManager.destroy();

            if (state.currentQuestions.length > 0) {
                uiManager.showQuestion(0);
                uiManager.updateProgress();
                chartManager.init();
                dom.checkButton.disabled = true;
                dom.resetButton.disabled = false;
                dom.showAnswerButton.disabled = false;
                uiManager.setTimerControlsState(false);
                uiManager.updateTimerButton(false);
                uiManager.showTimer(false);
            }
            uiManager.showExportButton(false);
            state.clearSaved();
        },

        submitAndReview() {
            if (state.currentQuestions.length === 0) return;

            const firstUnanswered = state.getFirstUnansweredIndex();
            if (firstUnanswered !== -1) {
                uiManager.displayUnansweredWarning(firstUnanswered);
                uiManager.showQuestion(firstUnanswered);
                dom.checkButton.disabled = !state.areAllQuestionsAttempted();
                dom.resetButton.disabled = false;
                return;
            }

            const results = this.calculateResults();
            state.quizResults = results;
            highScoreManager.saveScore(state.currentQuizKey, results.score, results.totalQuestions);
            uiManager.displayReview(results);
        },

        calculateResults() {
            let score = 0;
            let correctQuestions = 0;
            let partiallyCorrectQuestions = 0;
            let incorrectQuestionsCount = 0;
            const detailedResults = [];

            const quizEndTime = Date.now();
            let timeTakenSeconds = state.quizStartTime ? (quizEndTime - state.quizStartTime) / 1000 : null;
            if (dom.timerContainer.style.display === "flex" && state.timeLeft >= 0) {
                const initialDuration = parseInt(dom.timerDurationInput.value, 10) * 60;
                if (!isNaN(initialDuration)) {
                    timeTakenSeconds = initialDuration - state.timeLeft;
                }
            }

            state.currentQuestions.forEach((q, index) => {
                const selected = state.userAnswers[index] || [];
                const correct = new Set(q.correct);
                let isPerfect = true;
                let correctSelections = 0;
                let incorrectSelections = 0;

                selected.forEach((selIdx) => {
                    if (correct.has(selIdx)) {
                        correctSelections++;
                    } else {
                        incorrectSelections++;
                        isPerfect = false;
                    }
                });

                if (correctSelections !== correct.size) {
                    isPerfect = false;
                }

                let status = "incorrect";
                if (isPerfect && incorrectSelections === 0) {
                    status = "correct";
                    correctQuestions++;
                    score++;
                } else if (correctSelections > 0 && incorrectSelections === 0) {
                    status = "partial";
                    partiallyCorrectQuestions++;
                } else {
                    incorrectQuestionsCount++;
                }

                detailedResults.push({
                    index: index,
                    question: q.question,
                    status: status,
                    userAnswers: selected.map((idx) => q.options[idx]),
                    correctAnswers: q.correct.map((idx) => q.options[idx]),
                    explanation: q.explanation || "",
                    incorrectSelections: incorrectSelections,
                });
            });

            const totalQuestions = state.currentQuestions.length;
            const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

            return {
                quizKey: state.currentQuizKey,
                quizTitle: dom.quizSelector.options[dom.quizSelector.selectedIndex]?.getAttribute("data-title") || "Inconnu",
                score,
                totalQuestions,
                percentage,
                correctQuestions,
                partiallyCorrectQuestions,
                incorrectQuestions: incorrectQuestionsCount,
                timeTaken: timeTakenSeconds,
                date: new Date().toISOString(),
                detailedResults,
            };
        },

        reloadQuizWithNewCount() {
            if (state.currentQuizKey && state.allQuestions.length > 0) {
                state.currentQuestions = this.filterQuestions(state.allQuestions);
                this.resetQuiz(false);
                uiManager.setupQuizInterface();
                uiManager.showQuestion(0);
                uiManager.updateProgress();
                chartManager.init();
            }
        },
    };

    const exportManager = {
        exportResults() {
            if (!state.quizResults) return;
            this.exportToCSV();
        },

        exportToCSV() {
            if (!state.quizResults) return;

            let csvContent = "data:text/csv;charset=utf-8,";
            const header = ["Question", "Votre réponse", "Réponse correcte", "Résultat", "Explication"];
            csvContent += header.join(",") + "\n";

            state.quizResults.detailedResults.forEach((result) => {
                const row = [
                    result.question,
                    result.userAnswers.join("; "),
                    result.correctAnswers.join("; "),
                    result.status === "correct" ? "Correcte" : result.status === "partial" ? "Partielle" : "Incorrecte",
                    result.explanation || "",
                ].map((field) => `"${String(field).replace(/"/g, '""')}"`);

                csvContent += row.join(",") + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `resultats_quiz_${state.quizResults.quizTitle}_${timestamp}.csv`;

            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
    };

    const eventListeners = {
        setup() {
            dom.themeToggleButton.addEventListener("click", () => themeManager.toggle());

            dom.quizSelector.addEventListener("change", () => {
                const selectedOption = dom.quizSelector.options[dom.quizSelector.selectedIndex];
                const dataFile = selectedOption.getAttribute("data-file");
                const quizKey = dom.quizSelector.value;
                if (dataFile && quizKey) {
                    quizLogic.loadQuiz(dataFile, quizKey);
                }
            });

            dom.questionCountSelector.addEventListener("change", () => {
                state.selectedQuestionCount = dom.questionCountSelector.value;
                uiManager.updateCustomCountVisibility();
                if (state.selectedQuestionCount !== "custom") {
                    quizLogic.reloadQuizWithNewCount();
                }
            });

            dom.applyCustomCountButton.addEventListener("click", () => {
                const count = parseInt(dom.customQuestionCount.value, 10);
                if (isNaN(count) || count < 1) {
                    utils.showErrorAlert("Nombre invalide", "Veuillez entrer un nombre valide de questions.");
                    return;
                }
                if (count > state.allQuestions.length) {
                    utils.showErrorAlert("Sélection impossible", `Impossible de sélectionner plus de ${state.allQuestions.length} questions (nombre total disponible).`);
                    dom.customQuestionCount.value = state.allQuestions.length;
                    return;
                }
                quizLogic.reloadQuizWithNewCount();
            });

            dom.timerButton.addEventListener("click", () => {
                if (state.timerActive) {
                    timerManager.pause();
                } else {
                    timerManager.start();
                }
            });

            dom.timerDurationInput.addEventListener("change", () => {
                if (!state.timerActive) {
                    state.timeLeft = 0;
                    timerManager.updateDisplay();
                    state.save();
                }
            });

            dom.prevButton.addEventListener("click", () => {
                if (state.currentQuestionIndex > 0) {
                    uiManager.showQuestion(state.currentQuestionIndex - 1);
                }
            });
            dom.nextButton.addEventListener("click", () => {
                if (state.currentQuestionIndex < state.currentQuestions.length - 1) {
                    uiManager.showQuestion(state.currentQuestionIndex + 1);
                }
            });

            dom.checkButton.addEventListener("click", () => quizLogic.submitAndReview());

            dom.resetButton.addEventListener("click", () => quizLogic.resetQuiz(config.confirmReset));

            dom.showAnswerButton.addEventListener("click", () => {
                showCorrectAnswerForCurrentQuestion();
            });

            dom.exportResultsButton.addEventListener("click", () => exportManager.exportResults());

            dom.showExplanationsToggle.addEventListener("change", () => state.save());
            dom.instantFeedbackToggle.addEventListener("change", () => state.save());

            document.addEventListener("keydown", (e) => {
                if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
                    return;
                }
                if (!state.reviewMode) {
                    if (e.key === "ArrowLeft" && !dom.prevButton.disabled) {
                        dom.prevButton.click();
                    } else if (e.key === "ArrowRight" && !dom.nextButton.disabled) {
                        dom.nextButton.click();
                    }
                }
            });
        },
    };

    function showCorrectAnswerForCurrentQuestion() {
        if (state.reviewMode || state.currentQuestions.length === 0) return;

        const currentQuestionIndex = state.currentQuestionIndex;
        const questionData = state.currentQuestions[currentQuestionIndex];
        const correctIndices = questionData.correct;

        const questionOptions = document.querySelectorAll(`#question-${currentQuestionIndex} input[type="checkbox"]`);

        questionOptions.forEach((input) => {
            if (input.checked) {
                input.checked = false;
                utils.createAndDispatchEvent(input, "change");
            }
        });

        correctIndices.forEach((correctIndex) => {
            const correctInput = Array.from(questionOptions).find((input) => parseInt(input.value, 10) === correctIndex);
            if (correctInput && !correctInput.checked) {
                correctInput.checked = true;

                utils.createAndDispatchEvent(correctInput, "change");
            }
        });

        dom.checkButton.disabled = !state.areAllQuestionsAttempted();
    }

    function init() {
        themeManager.init();
        eventListeners.setup();

        const savedStateData = state.load();
        let quizToLoad = null;

        if (savedStateData && savedStateData.quizKey) {
            const matchingOption = Array.from(dom.quizSelector.options).find((opt) => opt.value === savedStateData.quizKey);
            if (matchingOption) {
                dom.quizSelector.value = savedStateData.quizKey;
                quizToLoad = {
                    file: matchingOption.getAttribute("data-file"),
                    key: savedStateData.quizKey,
                    stateData: savedStateData,
                };
            }
        }

        if (!quizToLoad) {
            const selectedOption = dom.quizSelector.options[dom.quizSelector.selectedIndex];
            if (selectedOption) {
                quizToLoad = {
                    file: selectedOption.getAttribute("data-file"),
                    key: selectedOption.value,
                    stateData: null,
                };
            }
        }

        if (quizToLoad && quizToLoad.file && quizToLoad.key) {
            quizLogic.loadQuiz(quizToLoad.file, quizToLoad.key, quizToLoad.stateData);
        } else {
            console.error("No quiz selected or default quiz data-file/value missing.");
            uiManager.displayLoadError("N/A", new Error("Aucun quiz sélectionné ou configuration invalide."));
            uiManager.setLoading(false);
        }
    }

    init();
});
