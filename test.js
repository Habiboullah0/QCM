document.addEventListener("DOMContentLoaded", () => {
    // Constants
    const HIGH_SCORES_KEY = "quizHighScores_v3_fr";
    const THEME_KEY = "quizTheme";
    const QUIZ_STATE_KEY = "currentQuizState_v3_fr";
    const CLASS_LOADING_HIDDEN = "hidden";
    const CLASS_CORRECT_OPTION = "correct";
    const CLASS_INCORRECT_OPTION = "incorrect";
    const CLASS_MISSED_CORRECT = "missed-correct";
    const CLASS_SELECTED = "selected";
    const CONFIRM_RESET = true;

    // DOM Elements
    const quizSelector = document.getElementById("quizSelector");
    const quizDescription = document.getElementById("quizDescription");
    const highScoreDisplay = document.getElementById("highScoreDisplay");
    const quizArea = document.getElementById("quizArea");
    const questionDisplayArea = document.getElementById("questionDisplayArea");
    const quizForm = document.getElementById("quizForm");
    const resultDiv = document.getElementById("result");
    const checkButton = document.getElementById("checkBtn");
    const resetButton = document.getElementById("resetBtn");
    const timerButton = document.getElementById("timerBtn");
    const timerBtnText = document.getElementById("timerBtnText");
    const timerContainer = document.getElementById("timerContainer");
    const timerDisplay = document.getElementById("timer");
    const timerDurationInput = document.getElementById("timerDurationInput");
    const progressBar = document.getElementById("progressBar");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const showExplanationsToggle = document.getElementById("showExplanationsToggle");
    const instantFeedbackToggle = document.getElementById("instantFeedbackToggle");
    const themeToggleButton = document.getElementById("themeToggleBtn");
    const body = document.body;
    const navigationContainer = document.getElementById("navigationContainer");
    const prevButton = document.getElementById("prevBtn");
    const nextButton = document.getElementById("nextBtn");
    const questionCounter = document.getElementById("questionCounter");
    
    // Question count selector elements
    const questionCountSelector = document.getElementById("questionCountSelector");
    const customQuestionCountContainer = document.getElementById("customQuestionCountContainer");
    const customQuestionCount = document.getElementById("customQuestionCount");
    const applyCustomCountButton = document.getElementById("applyCustomCount");
    
    // Progress chart elements
    const progressChartContainer = document.getElementById("progressChartContainer");
    const progressChartCanvas = document.getElementById("progressChart");
    let progressChart = null;
    
    // Export results button
    const exportResultsButton = document.getElementById("exportResultsBtn");

    // State variables
    let currentQuestions = [];
    let allQuestions = []; // Store all questions before filtering
    let currentQuizKey = "";
    let timerInterval;
    let timeLeft = 0;
    let timerActive = false;
    let reviewMode = false;
    let quizStartTime = null;
    let currentQuestionIndex = 0;
    let userAnswers = {};
    let selectedQuestionCount = "all"; // Default: all questions
    let quizResults = null; // To store quiz results

    // Helper Functions
    function shuffleArray(array) {
        const newArray = [...array]; // Create a copy to avoid modifying the original
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "N/A";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    // State Management Functions
    function saveQuizState() {
        if (!currentQuizKey || currentQuestions.length === 0) return;
        const state = {
            quizKey: currentQuizKey,
            questionIndex: currentQuestionIndex,
            answers: userAnswers,
            timeLeft: timerActive ? timeLeft : null,
            timerDuration: parseInt(timerDurationInput.value, 10),
            explanationsVisible: showExplanationsToggle.checked,
            instantFeedback: instantFeedbackToggle.checked,
            startTime: quizStartTime,
            selectedQuestionCount: selectedQuestionCount,
            customQuestionCount: customQuestionCount.value
        };
        try {
            sessionStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde de l'état du quiz dans sessionStorage:", e);
        }
    }

    function loadQuizState() {
        try {
            const savedState = sessionStorage.getItem(QUIZ_STATE_KEY);
            if (savedState) {
                return JSON.parse(savedState);
            }
        } catch (e) {
            console.error("Erreur lors du chargement de l'état du quiz depuis sessionStorage:", e);
            sessionStorage.removeItem(QUIZ_STATE_KEY);
        }
        return null;
    }

    function clearQuizState() {
        sessionStorage.removeItem(QUIZ_STATE_KEY);
    }

    // High Score Management
    function getHighScores() {
        try {
            const scores = localStorage.getItem(HIGH_SCORES_KEY);
            return scores ? JSON.parse(scores) : {};
        } catch (e) {
            console.error("Erreur lors de la lecture des meilleurs scores depuis localStorage:", e);
            return {};
        }
    }

    function saveHighScore(quizKey, score, totalQuestions) {
        if (!quizKey || totalQuestions <= 0) return;
        const scores = getHighScores();
        const percentage = Math.round((score / totalQuestions) * 100);
        const currentHighScore = scores[quizKey]?.percentage ?? 0;

        if (percentage >= currentHighScore) {
            scores[quizKey] = { 
                percentage: percentage, 
                date: new Date().toISOString(),
                score: score,
                total: totalQuestions
            };
            try {
                localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
                console.log(`Nouveau meilleur score pour ${quizKey}: ${percentage}%`);
                displayHighScore(quizKey);
            } catch (e) {
                console.error("Erreur lors de la sauvegarde du meilleur score dans localStorage:", e);
            }
        }
    }

    function displayHighScore(quizKey) {
        if (!quizKey) {
            highScoreDisplay.textContent = "Meilleur score: Non disponible";
            highScoreDisplay.style.display = "none";
            return;
        }
        const scores = getHighScores();
        const highScoreData = scores[quizKey];
        if (highScoreData?.percentage !== undefined) {
            highScoreDisplay.textContent = `Meilleur score: ${highScoreData.percentage}%`;
        } else {
            highScoreDisplay.textContent = "Meilleur score: Pas encore joué";
        }
        highScoreDisplay.style.display = "inline-block";
    }

    // Theme Management
    function applyTheme(theme) {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.error("Erreur lors de la sauvegarde du thème dans localStorage:", e);
        }
        
        // Update chart if it exists
        if (progressChart) {
            updateProgressChart();
        }
    }

    function toggleTheme() {
        const isDarkTheme = document.documentElement.classList.contains("dark");
        applyTheme(isDarkTheme ? "light" : "dark");
    }

    // UI Management
    function showLoading(show) {
        loadingIndicator.classList.toggle(CLASS_LOADING_HIDDEN, !show);
        quizArea.setAttribute("aria-busy", show ? "true" : "false");

        const elementsToDisable = [
            quizSelector, 
            checkButton, 
            resetButton, 
            timerButton, 
            timerDurationInput, 
            showExplanationsToggle,
            instantFeedbackToggle,
            themeToggleButton, 
            prevButton, 
            nextButton,
            questionCountSelector,
            customQuestionCount,
            applyCustomCountButton,
            exportResultsButton
        ];
        
        elementsToDisable.forEach((el) => {
            if (el) el.disabled = show;
        });
    }

    // Question Filtering
    function filterQuestionsByCount(questions) {
        if (selectedQuestionCount === "all") {
            return questions;
        }
        
        let count = parseInt(selectedQuestionCount, 10);
        
        if (selectedQuestionCount === "custom") {
            count = parseInt(customQuestionCount.value, 10);
        }
        
        // Validate count
        if (isNaN(count) || count < 1) {
            count = questions.length;
        }
        
        // Limit to available questions
        count = Math.min(count, questions.length);
        
        // Return random subset
        return shuffleArray(questions).slice(0, count);
    }

    // Intelligent question filtering based on difficulty
    function filterQuestionsByDifficulty(questions, userPerformance = 0.5) {
        // If not enough questions or average performance, return all questions
        if (questions.length <= 10 || (userPerformance > 0.4 && userPerformance < 0.6)) {
            return shuffleArray(questions);
        }
        
        // Sort questions by difficulty (if available)
        const sortedQuestions = [...questions].sort((a, b) => {
            const diffA = a.difficulty || 0.5;
            const diffB = b.difficulty || 0.5;
            
            // If high performance, prioritize difficult questions
            if (userPerformance > 0.6) {
                return diffB - diffA;
            } 
            // If low performance, prioritize easier questions
            else {
                return diffA - diffB;
            }
        });
        
        // Take 70% adapted questions and 30% random
        const adaptedCount = Math.floor(questions.length * 0.7);
        const randomCount = questions.length - adaptedCount;
        
        const adaptedQuestions = sortedQuestions.slice(0, adaptedCount);
        const remainingQuestions = shuffleArray(sortedQuestions.slice(adaptedCount));
        const randomQuestions = remainingQuestions.slice(0, randomCount);
        
        return shuffleArray([...adaptedQuestions, ...randomQuestions]);
    }

    // Quiz Loading
    async function loadQuestions(filename, quizKey, savedState = null) {
        showLoading(true);
        if (!savedState) {
            resetQuizState(false);
            clearQuizState();
        }
        currentQuizKey = quizKey;
        displayHighScore(quizKey);

        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - ${response.statusText}. Impossible de charger '${filename}'`);
            }
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(`Format invalide ou quiz vide dans '${filename}'.`);
            }
            if (typeof data[0].question !== "string" || !Array.isArray(data[0].options) || !Array.isArray(data[0].correct)) {
                console.warn(`Structure de question potentiellement incorrecte dans ${filename}.`);
            }

            allQuestions = data; // Store all questions
            
            // Restore saved state or use defaults
            if (savedState && savedState.quizKey === quizKey) {
                selectedQuestionCount = savedState.selectedQuestionCount || "all";
                questionCountSelector.value = selectedQuestionCount;
                
                if (selectedQuestionCount === "custom") {
                    customQuestionCount.value = savedState.customQuestionCount || 10;
                    customQuestionCountContainer.style.display = "flex";
                } else {
                    customQuestionCountContainer.style.display = "none";
                }
                
                userAnswers = savedState.answers || {};
                currentQuestionIndex = savedState.questionIndex >= 0 ? savedState.questionIndex : 0;
                timerDurationInput.value = savedState.timerDuration || 10;
                showExplanationsToggle.checked = savedState.explanationsVisible ?? true;
                instantFeedbackToggle.checked = savedState.instantFeedback ?? false;
                quizStartTime = savedState.startTime ? new Date(savedState.startTime) : Date.now();

                if (savedState.timeLeft !== null && savedState.timeLeft > 0) {
                    timeLeft = savedState.timeLeft;
                    timerActive = false;
                    timerContainer.style.display = "flex";
                    updateTimerDisplay();
                    timerButton.disabled = false;
                    timerDurationInput.disabled = false;
                    updateTimerButtonText();
                } else {
                    quizStartTime = Date.now();
                }

                console.log(`État du quiz '${quizKey}' restauré.`);
            } else {
                userAnswers = {};
                currentQuestionIndex = 0;
                quizStartTime = Date.now();
                
                // Use defaults for new quiz
                selectedQuestionCount = "all";
                questionCountSelector.value = selectedQuestionCount;
                customQuestionCountContainer.style.display = "none";
            }
            
            // Filter questions by selected count
            currentQuestions = filterQuestionsByCount(allQuestions);

            // Validate current index
            if (currentQuestionIndex >= currentQuestions.length) {
                currentQuestionIndex = 0;
            }

            setupQuizUI();
            showQuestion(currentQuestionIndex);
            updateProgress();
            initProgressChart();

            return true;
        } catch (error) {
            console.error("Erreur lors du chargement des questions:", error);
            displayLoadError(filename, error);
            currentQuestions = [];
            allQuestions = [];
            currentQuizKey = "";
            displayHighScore(null);
            updateProgress();
            resetButtonStatesOnError();
            return false;
        } finally {
            showLoading(false);
            quizSelector.disabled = false;
            themeToggleButton.disabled = false;
            showExplanationsToggle.disabled = false;
            instantFeedbackToggle.disabled = false;
            questionCountSelector.disabled = false;
            
            if (selectedQuestionCount === "custom") {
                customQuestionCount.disabled = false;
                applyCustomCountButton.disabled = false;
            }
        }
    }

    function displayLoadError(filename, error) {
        questionDisplayArea.innerHTML = "";
        quizForm.innerHTML = "";
        resultDiv.innerHTML = `
            <div class="p-6 bg-error/10 border border-error rounded-xl">
                <p class="text-xl font-bold mb-2">Erreur de chargement</p>
                <p class="mb-2">Impossible de charger le quiz depuis '${filename}'.</p>
                <p class="text-sm text-text-secondary">${error.message}</p>
            </div>`;
        resultDiv.className = "block animate-fade-in";
        navigationContainer.style.display = "none";
        progressChartContainer.style.display = "none";
        
        if (exportResultsButton) {
            exportResultsButton.style.display = "none";
        }
    }

    function resetButtonStatesOnError() {
        checkButton.disabled = true;
        resetButton.disabled = true;
        timerButton.disabled = true;
        timerDurationInput.disabled = false;
        timerContainer.style.display = "none";
    }

    function setupQuizUI() {
        quizForm.style.display = "none";
        resultDiv.style.display = "none";
        timerContainer.style.display = "none";
        timerButton.disabled = false;
        timerDurationInput.disabled = false;
        checkButton.disabled = !areAllQuestionsAttempted();
        resetButton.disabled = false;
        exportResultsButton.style.display = "none";
        
        // Set quiz description
        const selectedOption = quizSelector.options[quizSelector.selectedIndex];
        const quizTitle = selectedOption.getAttribute("data-title");
        quizDescription.textContent = `Quiz ${quizTitle} - ${currentQuestions.length} questions`;
    }

    // Timer Functions
    function startTimer() {
        if (timerActive) return;
        
        const minutes = parseInt(timerDurationInput.value, 10);
        if (isNaN(minutes) || minutes <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Durée invalide',
                text: 'Veuillez entrer une durée valide pour le minuteur.',
            });
            return;
        }
        
        timeLeft = minutes * 60;
        timerActive = true;
        timerContainer.style.display = "flex";
        timerButton.disabled = false;
        timerDurationInput.disabled = true;
        updateTimerDisplay();
        updateTimerButtonText();
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerActive = false;
                timerButton.disabled = true;
                timerDurationInput.disabled = true;
                updateTimerButtonText();
                
                // Auto-check answers when time expires
                if (!reviewMode) {
                    checkAnswers();
                }
            }
            
            saveQuizState();
        }, 1000);
    }

    function pauseTimer() {
        if (!timerActive) return;
        
        clearInterval(timerInterval);
        timerActive = false;
        timerButton.disabled = false;
        updateTimerButtonText();
        saveQuizState();
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(timeLeft);
        
        // Visual indication when time is running low
        if (timeLeft <= 60) {
            timerDisplay.classList.add("animate-pulse-slow");
            timerDisplay.style.backgroundColor = "rgb(var(--color-error))";
        } else {
            timerDisplay.classList.remove("animate-pulse-slow");
            timerDisplay.style.backgroundColor = "rgb(var(--color-primary))";
        }
    }

    function updateTimerButtonText() {
        if (timerActive) {
            timerBtnText.textContent = "Pause";
            timerButton.classList.add("bg-error");
            timerButton.classList.remove("bg-warning");
        } else {
            timerBtnText.textContent = "Démarrer";
            timerButton.classList.add("bg-warning");
            timerButton.classList.remove("bg-error");
        }
    }

    // Question Display
    function buildQuestionElement(questionData, questionIndex, isInReviewMode) {
        const questionDiv = document.createElement("div");
        questionDiv.className = "card mb-6 animate-slide-in";
        questionDiv.id = `question-${questionIndex}`;

        const questionNumberBadge = document.createElement("div");
        questionNumberBadge.className = "w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm";
        questionNumberBadge.textContent = questionIndex + 1;
        questionDiv.appendChild(questionNumberBadge);

        const questionTitle = document.createElement("h3");
        questionTitle.className = "text-lg font-semibold mb-4 pl-6";
        questionTitle.textContent = questionData.question;
        questionDiv.appendChild(questionTitle);

        // Options container
        const optionsContainer = document.createElement("div");
        optionsContainer.className = "options-container mt-4";
        
        // Create options
        const optionLetters = ["A", "B", "C", "D", "E"];
    questionData.options.forEach((optionText, optionIndex) => {
        const optionLabel = document.createElement("label");
        optionLabel.className = "quiz-option";
        optionLabel.htmlFor = `question-${questionIndex}-option-${optionIndex}`;

        const optionInput = document.createElement("input");
        optionInput.type = "checkbox";
        optionInput.className = "checkbox";
        optionInput.id = `question-${questionIndex}-option-${optionIndex}`;
        optionInput.name = `question-${questionIndex}`;
        optionInput.value = optionIndex;

        if (userAnswers[questionIndex] && userAnswers[questionIndex].includes(optionIndex)) {
            optionInput.checked = true;
            optionLabel.classList.add(CLASS_SELECTED);
        }

        if (isInReviewMode) {
            optionInput.disabled = true;
        } else {
            optionInput.addEventListener("change", (e) => {
                handleAnswerChange(questionIndex, optionIndex, e.target.checked);
                optionLabel.classList.toggle(CLASS_SELECTED, e.target.checked);
            });
        }

        const optionTextSpan = document.createElement("span");
        optionTextSpan.innerHTML = `<strong>${optionLetters[optionIndex] || ""}.</strong> ${optionText}`;

        optionLabel.appendChild(optionInput);
        optionLabel.appendChild(optionTextSpan);
        optionsContainer.appendChild(optionLabel);
    });
        
        questionDiv.appendChild(optionsContainer);

        // Add hint if available
        if (questionData.hint) {
            const hintButton = document.createElement("button");
            hintButton.className = "text-primary hover:text-primary/80 mt-4 flex items-center gap-1 text-sm";
            hintButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Afficher l'indice
            `;
            
            const hintContent = document.createElement("div");
            hintContent.className = "p-3 mt-2 bg-primary/10 rounded-lg text-sm hidden";
            hintContent.textContent = questionData.hint;
            
            hintButton.addEventListener("click", () => {
                if (hintContent.classList.contains("hidden")) {
                    hintContent.classList.remove("hidden");
                    hintButton.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        Masquer l'indice
                    `;
                } else {
                    hintContent.classList.add("hidden");
                    hintButton.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        Afficher l'indice
                    `;
                }
            });
            
            questionDiv.appendChild(hintButton);
            questionDiv.appendChild(hintContent);
        }

        // Add correction details container in review mode
        if (isInReviewMode) {
            const correctionDiv = document.createElement("div");
            correctionDiv.className = "p-4 mt-4 rounded-lg";
            correctionDiv.id = `correction-${questionIndex}`;
            correctionDiv.setAttribute("aria-live", "polite");
            correctionDiv.style.display = "none";
            questionDiv.appendChild(correctionDiv);
        }

        return questionDiv;
    }

    function showQuestion(index) {
        if (index < 0 || index >= currentQuestions.length) {
            console.warn(`Tentative d'affichage d'une question invalide: index ${index}`);
            return;
        }
        reviewMode = false;
        currentQuestionIndex = index;

        // Fade out effect
        questionDisplayArea.classList.add("opacity-0");

        setTimeout(() => {
            const questionData = currentQuestions[index];
            const questionElement = buildQuestionElement(questionData, index, false);
            questionDisplayArea.innerHTML = "";
            questionDisplayArea.appendChild(questionElement);

            questionCounter.textContent = `Question ${index + 1} / ${currentQuestions.length}`;

            prevButton.disabled = index === 0;
            nextButton.disabled = index === currentQuestions.length - 1;

            questionDisplayArea.style.display = "block";
            quizForm.style.display = "none";
            navigationContainer.style.display = "flex";
            resultDiv.style.display = "none";

            // Fade in effect
            questionDisplayArea.classList.remove("opacity-0");

            // Scroll into view
            quizArea.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            checkButton.disabled = !areAllQuestionsAttempted();

            saveQuizState();
            updateProgressChart();
        }, 150);
    }

    function handleAnswerChange(qIndex, optIndex, isChecked) {
        if (reviewMode) return;

        if (!userAnswers[qIndex]) {
            userAnswers[qIndex] = [];
        }
        if (isChecked) {
            if (!userAnswers[qIndex].includes(optIndex)) {
                userAnswers[qIndex].push(optIndex);
            }
        } else {
            userAnswers[qIndex] = userAnswers[qIndex].filter((idx) => idx !== optIndex);
        }
        if (userAnswers[qIndex].length === 0) {
            delete userAnswers[qIndex];
        }

        updateProgress();
        updateProgressChart();
        checkButton.disabled = !areAllQuestionsAttempted();
        saveQuizState();
        
        // Instant feedback if enabled
        if (instantFeedbackToggle.checked) {
            const questionElement = document.querySelector(`#question-${qIndex}`);
            if (questionElement) {
                questionElement.classList.add("animate-pulse-slow");
                setTimeout(() => {
                    questionElement.classList.remove("animate-pulse-slow");
                }, 500);
                
                // Check if answer is correct
                const correctAnswers = new Set(currentQuestions[qIndex].correct);
                const selectedAnswers = userAnswers[qIndex] || [];
                
                // Only show feedback when user has selected at least one option
                if (selectedAnswers.length > 0) {
                    const allCorrect = selectedAnswers.every(ans => correctAnswers.has(ans)) && 
                                      selectedAnswers.length === correctAnswers.size;
                    
                    // Visual feedback (subtle)
                    if (allCorrect) {
                        questionElement.style.borderLeft = "4px solid rgb(var(--color-success))";
                    } else {
                        questionElement.style.borderLeft = "4px solid rgb(var(--color-warning))";
                    }
                }
            }
        }
    }

    function areAllQuestionsAttempted() {
        if (currentQuestions.length === 0) return false;
        for (let i = 0; i < currentQuestions.length; i++) {
            if (!userAnswers[i] || userAnswers[i].length === 0) {
                return false;
            }
        }
        return true;
    }

    function updateProgress() {
        if (currentQuestions.length === 0) {
            progressBar.style.width = "0%";
            progressBar.setAttribute("aria-valuenow", 0);
            return;
        }

        let answeredCount = 0;
        for (let i = 0; i < currentQuestions.length; i++) {
            if (userAnswers[i] && userAnswers[i].length > 0) {
                answeredCount++;
            }
        }

        const progressPercentage = Math.round((answeredCount / currentQuestions.length) * 100);
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute("aria-valuenow", progressPercentage);
    }

    function initProgressChart() {
        if (!progressChartCanvas || currentQuestions.length === 0) {
            progressChartContainer.style.display = "none";
            return;
        }
        
        progressChartContainer.style.display = "block";
        
        // Destroy existing chart if any
        if (progressChart) {
            progressChart.destroy();
        }
        
        // Create new chart
        updateProgressChart();
    }
    
    function updateProgressChart() {
        if (!progressChartCanvas || currentQuestions.length === 0) return;
        
        // Count answered and unanswered questions
        let answeredCount = 0;
        let unansweredCount = 0;
        
        for (let i = 0; i < currentQuestions.length; i++) {
            if (userAnswers[i] && userAnswers[i].length > 0) {
                answeredCount++;
            } else {
                unansweredCount++;
            }
        }
        
        // Colors adapted to theme
        const isDarkTheme = document.documentElement.classList.contains("dark");
        const textColor = isDarkTheme ? "rgb(249, 250, 251)" : "rgb(31, 41, 55)";
        
        // Destroy existing chart if any
        if (progressChart) {
            progressChart.destroy();
        }
        
        // Create new chart
        progressChart = new Chart(progressChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Répondues', 'Non répondues'],
                datasets: [{
                    data: [answeredCount, unansweredCount],
                    backgroundColor: [
                        'rgb(79, 70, 229)',
                        isDarkTheme ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)'
                    ],
                    borderColor: isDarkTheme ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: {
                                size: 14,
                                family: "'Poppins', 'Roboto', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = Math.round((value / currentQuestions.length) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%',
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }

    function resetQuizState(confirmReset = true) {
        if (confirmReset && !confirm("Êtes-vous sûr de vouloir réinitialiser le quiz ? Toutes vos réponses seront effacées.")) {
            return;
        }

        userAnswers = {};
        currentQuestionIndex = 0;
        reviewMode = false;
        quizResults = null;

        if (timerActive) {
            clearInterval(timerInterval);
            timerActive = false;
            timerContainer.style.display = "none";
            timerButton.disabled = false;
            timerDurationInput.disabled = false;
            updateTimerButtonText();
        }

        if (currentQuestions.length > 0) {
            showQuestion(0);
            updateProgress();
            updateProgressChart();
            checkButton.disabled = true;
            resetButton.disabled = false;
        }
        
        // Hide export results button
        if (exportResultsButton) {
            exportResultsButton.style.display = "none";
        }
    }

    function checkAnswers() {
        if (currentQuestions.length === 0) return;

        // Check if all questions are answered
        let firstUnansweredIndex = -1;
        for (let i = 0; i < currentQuestions.length; i++) {
            if (!userAnswers[i] || userAnswers[i].length === 0) {
                firstUnansweredIndex = i;
                break;
            }
        }

        if (firstUnansweredIndex !== -1) {
            resultDiv.innerHTML = `
                <div class="p-6 bg-warning/10 border border-warning rounded-xl">
                    <p class="text-xl font-bold mb-2">Attention !</p>
                    <p class="mb-2">Veuillez répondre à toutes les questions avant de vérifier.</p>
                    <p class="text-sm text-text-secondary">Allez à la question ${firstUnansweredIndex + 1} pour continuer.</p>
                </div>`;
            resultDiv.className = "block animate-fade-in";
            resultDiv.setAttribute("role", "alert");

            showQuestion(firstUnansweredIndex);

            checkButton.disabled = !areAllQuestionsAttempted();
            resetButton.disabled = false;

            return;
        }

        reviewMode = true;
        clearQuizState();

        // Calculate time taken
        let timeTakenSeconds = null;
        if (timerActive) {
            clearInterval(timerInterval);
            timerActive = false;
            timeTakenSeconds = parseInt(timerDurationInput.value, 10) * 60 - timeLeft;
            timerButton.disabled = true;
            timerDurationInput.disabled = true;
            updateTimerButtonText();
        } else if (quizStartTime) {
            timeTakenSeconds = (Date.now() - quizStartTime) / 1000;
        }

        // Hide question display and navigation
        questionDisplayArea.style.display = "none";
        navigationContainer.style.display = "none";
        progressChartContainer.style.display = "none";
        
        // Prepare review form
        quizForm.innerHTML = "";
        quizForm.style.display = "block";

        const reviewFragment = document.createDocumentFragment();

        // Calculate score
        let score = 0;
        const totalQuestions = currentQuestions.length;
        let correctQuestions = 0;
        let partiallyCorrectQuestions = 0;
        let incorrectQuestionsCount = 0;
        
        // Store detailed results
        const detailedResults = [];

        // Process each question
        currentQuestions.forEach((q, questionIndex) => {
            const questionDiv = buildQuestionElement(q, questionIndex, true);
            const correctionDiv = questionDiv.querySelector(`#correction-${questionIndex}`);
            const optionsContainer = questionDiv.querySelector(".options-container");
            const labels = optionsContainer.querySelectorAll("label");

            const selectedAnswerIndices = userAnswers[questionIndex] || [];
            const correctAnswersSet = new Set(q.correct);

            let isQuestionPerfectlyCorrect = true;
            let correctSelectionsCount = 0;
            let incorrectSelectionsCount = 0;

            // Check selected answers
            selectedAnswerIndices.forEach((selectedIndex) => {
                const label = labels[selectedIndex];
                if (!label) return;

                if (correctAnswersSet.has(selectedIndex)) {
                    label.classList.add(CLASS_CORRECT_OPTION);
                    correctSelectionsCount++;
                } else {
                    label.classList.add(CLASS_INCORRECT_OPTION);
                    label.setAttribute("aria-invalid", "true");
                    isQuestionPerfectlyCorrect = false;
                    incorrectSelectionsCount++;
                }
            });

            // Highlight missed correct answers
            q.correct.forEach((correctIndex) => {
                if (!selectedAnswerIndices.includes(correctIndex)) {
                    const label = labels[correctIndex];
                    if (label) {
                        label.classList.add(CLASS_MISSED_CORRECT);
                    }
                    isQuestionPerfectlyCorrect = false;
                }
            });

            // Determine question status
            let questionStatus = "incorrect";
            if (isQuestionPerfectlyCorrect && correctSelectionsCount === correctAnswersSet.size && incorrectSelectionsCount === 0) {
                questionStatus = "correct";
                correctQuestions++;
                score++;
            } else if (correctSelectionsCount > 0 && incorrectSelectionsCount === 0) {
                questionStatus = "partial";
                partiallyCorrectQuestions++;
            } else {
                questionStatus = "incorrect";
                incorrectQuestionsCount++;
            }

            // Apply visual status to question
            if (questionStatus === "correct") {
                questionDiv.classList.add("border-success", "bg-success/5");
            } else if (questionStatus === "partial") {
                questionDiv.classList.add("border-warning", "bg-warning/5");
            } else {
                questionDiv.classList.add("border-error", "bg-error/5");
            }
            
            // Store result details
            detailedResults.push({
                question: q.question,
                status: questionStatus,
                userAnswers: selectedAnswerIndices.map(idx => q.options[idx]),
                correctAnswers: q.correct.map(idx => q.options[idx]),
                explanation: q.explanation || ""
            });

            // Show correction details
            if (correctionDiv) {
                let feedback = "";
                let correctionClass = "";

                const correctOptionsText = q.correct
                    .map((index) => (q.options[index] ? `<span class="text-success font-medium">${q.options[index]}</span>` : ""))
                    .filter(Boolean)
                    .join(", ");
                const correctAnswersString = `<strong>Réponses correctes:</strong> ${correctOptionsText || "Aucune"}`;

                if (questionStatus === "correct") {
                    feedback = `<p class="font-bold text-success mb-2">✓ Réponse correcte !</p>`;
                    correctionClass = "bg-success/10 border border-success/30";
                } else if (questionStatus === "partial") {
                    feedback = `<p class="font-bold text-warning mb-2">~ Réponse partiellement correcte.</p><p class="mb-2">Vous avez choisi certaines bonnes réponses, mais pas toutes.</p>`;
                    feedback += `<p>${correctAnswersString}</p>`;
                    correctionClass = "bg-warning/10 border border-warning/30";
                } else {
                    feedback = `<p class="font-bold text-error mb-2">✗ Réponse incorrecte.</p>`;
                    if (incorrectSelectionsCount > 0) {
                        feedback += `<p class="mb-2">Vous avez choisi une ou plusieurs réponses incorrectes.</p>`;
                    } else if (correctSelectionsCount === 0 && selectedAnswerIndices.length > 0) {
                        feedback += `<p class="mb-2">Vos choix ne contiennent aucune des bonnes réponses.</p>`;
                    } else {
                        feedback += `<p class="mb-2">Vous n'avez pas sélectionné toutes les bonnes réponses requises.</p>`;
                    }
                    feedback += `<p>${correctAnswersString}</p>`;
                    correctionClass = "bg-error/10 border border-error/30";
                }

                // Add explanation if available and enabled
                if (q.explanation && showExplanationsToggle.checked) {
                    feedback += `<div class="mt-4 pt-3 border-t border-border"><strong>Explication:</strong> ${q.explanation}</div>`;
                }

                correctionDiv.innerHTML = feedback;
                correctionDiv.className = `p-4 mt-4 rounded-lg ${correctionClass}`;
                correctionDiv.style.display = "block";
            }

            reviewFragment.appendChild(questionDiv);
        });

        quizForm.appendChild(reviewFragment);

        // Save high score
        saveHighScore(currentQuizKey, score, totalQuestions);

        // Calculate percentage
        const percentage = Math.round((score / totalQuestions) * 100);
        
        // Store quiz results
        quizResults = {
            quizKey: currentQuizKey,
            quizTitle: quizSelector.options[quizSelector.selectedIndex].getAttribute("data-title"),
            score: score,
            totalQuestions: totalQuestions,
            percentage: percentage,
            correctQuestions: correctQuestions,
            partiallyCorrectQuestions: partiallyCorrectQuestions,
            incorrectQuestions: incorrectQuestionsCount,
            timeTaken: timeTakenSeconds,
            date: new Date().toISOString(),
            detailedResults: detailedResults
        };

        // Determine result class based on score
        let resultClass = "";
        let resultEmoji = "";
        
        if (percentage >= 80) {
            resultClass = "bg-success/10 border border-success";
            resultEmoji = "🏆";
        } else if (percentage >= 60) {
            resultClass = "bg-primary/10 border border-primary";
            resultEmoji = "👍";
        } else if (percentage >= 40) {
            resultClass = "bg-warning/10 border border-warning";
            resultEmoji = "🤔";
        } else {
            resultClass = "bg-error/10 border border-error";
            resultEmoji = "😢";
        }

        // Display results
        resultDiv.innerHTML = `
            <div class="p-6 rounded-xl ${resultClass}">
                <h2 class="text-2xl font-bold mb-4">${resultEmoji} Résultat final</h2>
                <p class="text-xl mb-4">Vous avez répondu correctement à <strong>${score}</strong> question(s) sur <strong>${totalQuestions}</strong>.</p>
                <div class="text-3xl font-bold mb-6">${percentage}%</div>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
                        <div class="text-2xl font-bold">${correctQuestions}</div>
                        <div class="text-sm">Réponses correctes</div>
                    </div>
                    <div class="p-4 rounded-lg bg-warning/10 border border-warning/30 text-center">
                        <div class="text-2xl font-bold">${partiallyCorrectQuestions}</div>
                        <div class="text-sm">Réponses partielles</div>
                    </div>
                    <div class="p-4 rounded-lg bg-error/10 border border-error/30 text-center">
                        <div class="text-2xl font-bold">${incorrectQuestionsCount}</div>
                        <div class="text-sm">Réponses incorrectes</div>
                    </div>
                    <div class="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
                        <div class="text-2xl font-bold">${formatTime(timeTakenSeconds)}</div>
                        <div class="text-sm">Temps écoulé</div>
                    </div>
                </div>
                
                <p class="mb-4">Consultez vos réponses ci-dessous pour apprendre de vos erreurs.</p>
                <p class="text-sm text-text-secondary">Vous pouvez exporter les résultats ou réinitialiser le quiz pour réessayer.</p>
            </div>
        `;
        resultDiv.className = "block animate-fade-in";
        
        // Show export results button
        exportResultsButton.style.display = "inline-flex";
        
        // Scroll to results
        setTimeout(() => {
            resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        
        // Confetti effect for high scores
        if (percentage >= 80) {
            createConfetti();
        }
    }

    // Confetti animation for high scores
    function createConfetti() {
        const colors = ["#4F46E5", "#16A34A", "#EA580C", "#DC2626"];
        const confettiCount = 100;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement("div");
            confetti.className = "absolute w-2 h-2 rounded-full opacity-0";
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + "vw";
            confetti.style.animationDelay = Math.random() * 3 + "s";
            confetti.style.animation = "confetti-fall " + (Math.random() * 3 + 3) + "s ease-in-out forwards";
            
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 6000);
        }
    }

    // Export results to PDF or CSV
    function exportResults() {
        if (!quizResults) return;
        
        const exportFormat = confirm("Souhaitez-vous exporter les résultats au format PDF ? Choisissez 'OK' pour le format PDF ou 'Annuler' pour le format CSV.") ? "pdf" : "csv";
        
        if (exportFormat === "csv") {
            exportResultsToCSV();
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Exportation PDF indisponible',
                text: "L'exportation PDF n'est pas disponible actuellement. Les résultats seront exportés au format CSV à la place.",
            });
            exportResultsToCSV();
        }
    }
    
    function exportResultsToCSV() {
        if (!quizResults) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add header
        csvContent += "Question,Votre réponse,Réponse correcte,Résultat,Explication\n";
        
        // Add data
        quizResults.detailedResults.forEach(result => {
            const question = `"${result.question.replace(/"/g, '""')}"`;
            const userAnswers = `"${result.userAnswers.join(', ').replace(/"/g, '""')}"`;
            const correctAnswers = `"${result.correctAnswers.join(', ').replace(/"/g, '""')}"`;
            const status = result.status === "correct" ? "Correcte" : 
                          result.status === "partial" ? "Partielle" : "Incorrecte";
            const explanation = `"${(result.explanation || '').replace(/"/g, '""')}"`;
            
            csvContent += `${question},${userAnswers},${correctAnswers},${status},${explanation}\n`;
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `resultats_quiz_${quizResults.quizTitle}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up
        document.body.removeChild(link);
    }

    // Event Listeners
    function setupEventListeners() {
        // Theme toggle
        themeToggleButton.addEventListener("click", toggleTheme);
        
        // Quiz selector
        quizSelector.addEventListener("change", () => {
            const selectedOption = quizSelector.options[quizSelector.selectedIndex];
            const dataFile = selectedOption.getAttribute("data-file");
            const quizKey = quizSelector.value;
            
            if (dataFile && quizKey) {
                loadQuestions(dataFile, quizKey);
            }
        });
        
        // Question count selector
        questionCountSelector.addEventListener("change", () => {
            selectedQuestionCount = questionCountSelector.value;
            
            if (selectedQuestionCount === "custom") {
                customQuestionCountContainer.style.display = "flex";
            } else {
                customQuestionCountContainer.style.display = "none";
                
                // Reload questions with new count
                if (currentQuizKey && allQuestions.length > 0) {
                    currentQuestions = filterQuestionsByCount(allQuestions);
                    resetQuizState(false);
                    setupQuizUI();
                    showQuestion(0);
                    updateProgress();
                    initProgressChart();
                }
            }
        });
        
        // Apply custom count button
        applyCustomCountButton.addEventListener("click", () => {
            const count = parseInt(customQuestionCount.value, 10);
            
            if (isNaN(count) || count < 1) {
                Swal.fire({
                    icon: 'error',
                    title: 'Nombre invalide',
                    text: 'Veuillez entrer un nombre valide de questions.',
                });
                return;
            }
            
            if (count > allQuestions.length) {
                Swal.fire({
                    icon: 'error',
                    title: 'Sélection impossible',
                    text: `Impossible de sélectionner plus de ${allQuestions.length} questions (nombre total disponible).`,
                });
                customQuestionCount.value = allQuestions.length;
                return;
            }
            
            // Reload questions with custom count
            if (currentQuizKey && allQuestions.length > 0) {
                currentQuestions = filterQuestionsByCount(allQuestions);
                resetQuizState(false);
                setupQuizUI();
                showQuestion(0);
                updateProgress();
                initProgressChart();
            }
        });
        
        // Timer button
        timerButton.addEventListener("click", () => {
            if (timerActive) {
                pauseTimer();
            } else {
                startTimer();
            }
        });
        
        // Navigation buttons
        prevButton.addEventListener("click", () => {
            if (currentQuestionIndex > 0) {
                showQuestion(currentQuestionIndex - 1);
            }
        });
        
        nextButton.addEventListener("click", () => {
            if (currentQuestionIndex < currentQuestions.length - 1) {
                showQuestion(currentQuestionIndex + 1);
            }
        });
        
        // Check answers button
        checkButton.addEventListener("click", checkAnswers);
        
        // Reset button
        resetButton.addEventListener("click", () => resetQuizState(CONFIRM_RESET));
        
        // Export results button
        exportResultsButton.addEventListener("click", exportResults);
        
        // Keyboard navigation
        document.addEventListener("keydown", (e) => {
            // Only if not in an input field
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
                return;
            }
            
            if (e.key === "ArrowLeft" && !nextButton.disabled) {
                nextButton.click();
            } else if (e.key === "ArrowRight" && !prevButton.disabled) {
                prevButton.click();
            }
        });
    }

    // Initialization
    function init() {
        // Apply saved theme or default to system preference
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                applyTheme("dark");
            } else {
                applyTheme("light");
            }
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Try to restore saved state
        const savedState = loadQuizState();
        
        // Load default quiz or saved quiz
        if (savedState && savedState.quizKey) {
            // Find the option with matching quiz key
            for (let i = 0; i < quizSelector.options.length; i++) {
                if (quizSelector.options[i].value === savedState.quizKey) {
                    quizSelector.selectedIndex = i;
                    const dataFile = quizSelector.options[i].getAttribute("data-file");
                    loadQuestions(dataFile, savedState.quizKey, savedState);
                    break;
                }
            }
        } else {
            // Load default quiz (first option or selected option)
            const selectedOption = quizSelector.options[quizSelector.selectedIndex];
            const dataFile = selectedOption.getAttribute("data-file");
            const quizKey = quizSelector.value;
            
            if (dataFile && quizKey) {
                loadQuestions(dataFile, quizKey);
            }
        }
    }

    // Start the application
    init();
});









































// Refactored Quiz Application (refactored_quiz.js)

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // --- Configuration & Constants ---
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
            timerDuration: 10, // minutes
            questionCount: "all",
            customQuestionCount: 10,
            showExplanations: true,
            instantFeedback: false,
            theme: "light",
        },
        optionLetters: ["A", "B", "C", "D", "E"],
        confirmReset: true,
        lowTimeThreshold: 60, // seconds
        questionFadeDuration: 150, // ms
        confettiCount: 100,
        confettiColors: ["#4F46E5", "#16A34A", "#EA580C", "#DC2626"],
        confettiAnimationDuration: 6000, // ms
        adaptiveDifficultyThreshold: 0.7,
        adaptiveDifficultySplit: 0.7, // 70% adapted, 30% random
        minQuestionsForAdaptive: 10,
        performanceMidRange: [0.4, 0.6],
    };

    // --- DOM Element Cache ---
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
            ].filter(el => el); // Filter out null elements just in case
        }
    };

    // --- State Management ---
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
                customQuestionCount: dom.customQuestionCount.value
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
        }
    };

    // --- Utility Functions ---
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
            // Check if Swal is available
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: title,
                    text: text,
                });
            } else {
                // Fallback to standard alert
                alert(`${title}\n${text}`);
                console.error(title, text);
            }
        },

        showInfoAlert(title, text) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'info',
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
        }
    };

    // --- Theme Management ---
    const themeManager = {
        init() {
            const savedTheme = this.getSavedTheme();
            const preferredTheme = this.getSystemPreference();
            this.apply(savedTheme || preferredTheme);
        },

        apply(theme) {
            document.documentElement.classList.toggle(config.cssClasses.darkTheme, theme === "dark");
            this.saveTheme(theme);
            chartManager.update(); // Update chart on theme change
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
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return "dark";
            }
            return "light";
        }
    };

    // --- High Score Management ---
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
                    total: totalQuestions
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
        }
    };

    // --- Timer Management ---
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
                    utils.showErrorAlert('Durée invalide', 'Veuillez entrer une durée valide pour le minuteur.');
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
            // Always disable duration input when stopped, button becomes "Start" again
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
             // Restore timer state if it was running or paused with time left
            if (savedTimeLeft !== null && savedTimeLeft > 0) {
                state.timeLeft = savedTimeLeft;
                state.timerActive = false; // Start paused, user must click start/resume
                uiManager.showTimer(true);
                this.updateDisplay();
                uiManager.setTimerControlsState(false); // Enable controls (can change duration or start)
                uiManager.updateTimerButton(false); // Show 'Start'
            } else {
                // Reset timer display if no time was saved or timer wasn't active
                state.timeLeft = 0;
                state.timerActive = false;
                uiManager.showTimer(false);
                this.updateDisplay();
                 uiManager.setTimerControlsState(false); // Enable controls
                 uiManager.updateTimerButton(false); // Show 'Start'
            }
        }
    };

    // --- Chart Management ---
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
            this.destroy(); // Ensure no duplicates

            const isDark = document.documentElement.classList.contains(config.cssClasses.darkTheme);

            state.progressChart = new Chart(dom.progressChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Répondues', 'Non répondues'],
                    datasets: [{
                        data: [answered, unanswered],
                        backgroundColor: [
                            'rgb(79, 70, 229)', // Primary color
                            this.getUnansweredColor()
                        ],
                        borderColor: this.getBorderColor(),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: this.getTextColor(),
                                font: {
                                    size: 14,
                                    family: "'Poppins', 'Roboto', sans-serif"
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '70%',
                    animation: {
                        animateRotate: true,
                        animateScale: true
                    }
                }
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
            return document.documentElement.classList.contains(config.cssClasses.darkTheme) ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)';
        },
        getBorderColor() {
            return document.documentElement.classList.contains(config.cssClasses.darkTheme) ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)';
        }
    };

    // --- UI Management ---
    const uiManager = {
        setLoading(isLoading) {
            dom.loadingIndicator.classList.toggle(config.cssClasses.loadingHidden, !isLoading);
            dom.quizArea.setAttribute("aria-busy", isLoading ? "true" : "false");
            dom.allInteractiveElements.forEach((el) => { el.disabled = isLoading; });

            // Special handling for custom count input based on selector
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
            dom.timerDurationInput.disabled = false; // Allow setting duration for next try
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
            this.showExportButton(false);

            const selectedOption = dom.quizSelector.options[dom.quizSelector.selectedIndex];
            const quizTitle = selectedOption.getAttribute("data-title") || "Inconnu";
            dom.quizDescription.textContent = `Quiz ${quizTitle} - ${state.currentQuestions.length} questions`;
        },

        showTimer(show) {
            dom.timerContainer.style.display = show ? "flex" : "none";
        },

        setTimerControlsState(timerIsRunningOrStopped) {
            // Input disabled when running or after stopping (until reset)
            dom.timerDurationInput.disabled = timerIsRunningOrStopped;
            // Button always enabled unless stopped by timeout
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

            // Question Number Badge
            const badge = document.createElement("div");
            badge.className = "w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm";
            badge.textContent = questionIndex + 1;
            questionDiv.appendChild(badge);

            // Question Title
            const title = document.createElement("h3");
            title.className = "text-lg font-semibold mb-4 pl-6";
            title.textContent = questionData.question;
            questionDiv.appendChild(title);

            // Options Container
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

            // Hint (if available)
            if (questionData.hint) {
                this.addHintSection(questionDiv, questionData.hint);
            }

            // Correction details container (for review mode)
            if (isInReviewMode) {
                const correctionDiv = document.createElement("div");
                correctionDiv.className = "p-4 mt-4 rounded-lg";
                correctionDiv.id = `correction-${questionIndex}`;
                correctionDiv.setAttribute("aria-live", "polite");
                correctionDiv.style.display = "none"; // Initially hidden
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
            timerManager.stop(); // Ensure timer is stopped and controls disabled

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
            const correctionDiv = questionDiv.querySelector(`#correction-${resultDetails.index}`); // Assuming index is passed
            const optionsContainer = questionDiv.querySelector(".options-container");
            const labels = optionsContainer.querySelectorAll("label");
            const questionData = state.currentQuestions[resultDetails.index]; // Assuming index is passed

            const selectedIndices = state.userAnswers[resultDetails.index] || [];
            const correctIndices = new Set(questionData.correct);

            // Style selected options
            selectedIndices.forEach(idx => {
                if (labels[idx]) {
                    const isCorrect = correctIndices.has(idx);
                    labels[idx].classList.add(isCorrect ? config.cssClasses.correctOption : config.cssClasses.incorrectOption);
                    if (!isCorrect) labels[idx].setAttribute("aria-invalid", "true");
                }
            });

            // Style missed correct options
            correctIndices.forEach(idx => {
                if (!selectedIndices.includes(idx) && labels[idx]) {
                    labels[idx].classList.add(config.cssClasses.missedCorrect);
                }
            });

            // Style question container border
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

            // Populate correction feedback
            if (correctionDiv) {
                this.populateCorrectionFeedback(correctionDiv, resultDetails, questionData);
            }
        },

        populateCorrectionFeedback(correctionDiv, resultDetails, questionData) {
            let feedback = "";
            let correctionClass = "";
            const correctOptionsText = questionData.correct
                .map(index => questionData.options[index] ? `<span class="text-success font-medium">${questionData.options[index]}</span>` : "")
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
                default: // incorrect
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
                        ${this.createResultStatBox('Réponses correctes', results.correctQuestions, 'success')}
                        ${this.createResultStatBox('Réponses partielles', results.partiallyCorrectQuestions, 'warning')}
                        ${this.createResultStatBox('Réponses incorrectes', results.incorrectQuestions, 'error')}
                        ${this.createResultStatBox('Temps écoulé', utils.formatTime(results.timeTaken), 'primary')}
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

            questionElement.classList.add(config.cssClasses.timerPulse); // Re-use pulse animation
            setTimeout(() => {
                questionElement.classList.remove(config.cssClasses.timerPulse);
            }, 500);

            const correctAnswers = new Set(state.currentQuestions[qIndex].correct);
            const selectedAnswers = state.userAnswers[qIndex] || [];

            if (selectedAnswers.length > 0) {
                const allCorrect = selectedAnswers.every(ans => correctAnswers.has(ans)) &&
                                   selectedAnswers.length === correctAnswers.size;
                questionElement.style.borderLeft = `4px solid rgb(var(--color-${allCorrect ? 'success' : 'warning'}))`;
            } else {
                questionElement.style.borderLeft = 'none'; // Clear feedback if no answer selected
            }
        }
    };

    // --- Quiz Logic ---
    const quizLogic = {
        async loadQuiz(filename, quizKey, savedStateData = null) {
            uiManager.setLoading(true);
            if (!savedStateData) {
                this.resetQuiz(false); // Reset without confirmation
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
                // Re-enable elements potentially disabled during loading
                dom.quizSelector.disabled = false;
                dom.themeToggleButton.disabled = false;
                dom.showExplanationsToggle.disabled = false;
                dom.instantFeedbackToggle.disabled = false;
                dom.questionCountSelector.disabled = false;
                uiManager.updateCustomCountVisibility(); // Ensure custom count state is correct
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
            // Basic structure check on the first question
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
                return questions; // Return a copy if mutation is a concern, currently not.
            } else if (state.selectedQuestionCount === "custom") {
                count = parseInt(dom.customQuestionCount.value, 10);
            } else {
                count = parseInt(state.selectedQuestionCount, 10);
            }

            if (isNaN(count) || count < 1) {
                count = questions.length;
            }
            count = Math.min(count, questions.length);

            // Consider adaptive filtering here if implemented
            // return this.filterQuestionsByDifficulty(questions).slice(0, count);
            return utils.shuffleArray(questions).slice(0, count);
        },

        // Example of adaptive filtering (can be uncommented and refined)
        /*
        filterQuestionsByDifficulty(questions) {
            const userPerformance = 0.5; // Placeholder: Calculate based on past performance if available
            if (questions.length <= config.minQuestionsForAdaptive || 
                (userPerformance > config.performanceMidRange[0] && userPerformance < config.performanceMidRange[1])) {
                return utils.shuffleArray(questions);
            }

            const sortedQuestions = [...questions].sort((a, b) => {
                const diffA = a.difficulty || 0.5;
                const diffB = b.difficulty || 0.5;
                return (userPerformance > config.performanceMidRange[1]) ? (diffB - diffA) : (diffA - diffB);
            });

            const adaptedCount = Math.floor(questions.length * config.adaptiveDifficultySplit);
            const randomCount = questions.length - adaptedCount;
            const adaptedQuestions = sortedQuestions.slice(0, adaptedCount);
            const remainingQuestions = utils.shuffleArray(sortedQuestions.slice(adaptedCount));
            const randomQuestions = remainingQuestions.slice(0, randomCount);

            return utils.shuffleArray([...adaptedQuestions, ...randomQuestions]);
        },
        */

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
            chartManager.destroy(); // Destroy chart on reset

            if (state.currentQuestions.length > 0) {
                uiManager.showQuestion(0);
                uiManager.updateProgress();
                chartManager.init(); // Re-initialize chart
                dom.checkButton.disabled = true;
                dom.resetButton.disabled = false;
                uiManager.setTimerControlsState(false); // Enable timer controls
                uiManager.updateTimerButton(false);
                uiManager.showTimer(false); // Hide timer display
            }
            uiManager.showExportButton(false);
            state.clearSaved(); // Clear saved state on manual reset
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
            // If timer was active, use its calculation
            if (dom.timerContainer.style.display === 'flex' && state.timeLeft >= 0) {
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

                selected.forEach(selIdx => {
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
                    index: index, // Keep index for linking back
                    question: q.question,
                    status: status,
                    userAnswers: selected.map(idx => q.options[idx]),
                    correctAnswers: q.correct.map(idx => q.options[idx]),
                    explanation: q.explanation || "",
                    incorrectSelections: incorrectSelections // Store this for feedback
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
                detailedResults
            };
        },

        reloadQuizWithNewCount() {
            if (state.currentQuizKey && state.allQuestions.length > 0) {
                state.currentQuestions = this.filterQuestions(state.allQuestions);
                this.resetQuiz(false); // Reset without confirmation
                uiManager.setupQuizInterface();
                uiManager.showQuestion(0);
                uiManager.updateProgress();
                chartManager.init();
            }
        }
    };

    // --- Export Logic ---
    const exportManager = {
        exportResults() {
            if (!state.quizResults) return;

            // Simplified: Always export CSV for now, as PDF requires a library
            // const wantsPdf = utils.confirmAction("Exporter en PDF ? (Annuler pour CSV)");
            // if (wantsPdf) {
            //     utils.showInfoAlert('Exportation PDF', 'Fonctionnalité PDF non implémentée. Exportation en CSV...');
            //     this.exportToCSV();
            // } else {
            //     this.exportToCSV();
            // }
            this.exportToCSV();
        },

        exportToCSV() {
            if (!state.quizResults) return;

            let csvContent = "data:text/csv;charset=utf-8,";
            const header = ["Question", "Votre réponse", "Réponse correcte", "Résultat", "Explication"];
            csvContent += header.join(",") + "\n";

            state.quizResults.detailedResults.forEach(result => {
                const row = [
                    result.question,
                    result.userAnswers.join('; '), // Use semicolon if answers might contain commas
                    result.correctAnswers.join('; '),
                    result.status === "correct" ? "Correcte" : (result.status === "partial" ? "Partielle" : "Incorrecte"),
                    result.explanation || ''
                ].map(field => `"${String(field).replace(/"/g, '""')}"`); // Ensure double quotes are escaped

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
        }
    };

    // --- Event Listeners Setup ---
    const eventListeners = {
        setup() {
            // Theme toggle
            dom.themeToggleButton.addEventListener("click", () => themeManager.toggle());

            // Quiz selection
            dom.quizSelector.addEventListener("change", () => {
                const selectedOption = dom.quizSelector.options[dom.quizSelector.selectedIndex];
                const dataFile = selectedOption.getAttribute("data-file");
                const quizKey = dom.quizSelector.value;
                if (dataFile && quizKey) {
                    quizLogic.loadQuiz(dataFile, quizKey);
                }
            });

            // Question count selection
            dom.questionCountSelector.addEventListener("change", () => {
                state.selectedQuestionCount = dom.questionCountSelector.value;
                uiManager.updateCustomCountVisibility();
                if (state.selectedQuestionCount !== "custom") {
                    quizLogic.reloadQuizWithNewCount();
                }
            });

            // Apply custom question count
            dom.applyCustomCountButton.addEventListener("click", () => {
                const count = parseInt(dom.customQuestionCount.value, 10);
                if (isNaN(count) || count < 1) {
                    utils.showErrorAlert('Nombre invalide', 'Veuillez entrer un nombre valide de questions.');
                    return;
                }
                if (count > state.allQuestions.length) {
                     utils.showErrorAlert('Sélection impossible', `Impossible de sélectionner plus de ${state.allQuestions.length} questions (nombre total disponible).`);
                    dom.customQuestionCount.value = state.allQuestions.length;
                    return;
                }
                // selectedQuestionCount is already "custom", just reload
                quizLogic.reloadQuizWithNewCount();
            });

            // Timer controls
            dom.timerButton.addEventListener("click", () => {
                if (state.timerActive) {
                    timerManager.pause();
                } else {
                    timerManager.start();
                }
            });
            
            dom.timerDurationInput.addEventListener("change", () => {
                 // When duration changes AND timer isn't running, reset timeLeft
                 if (!state.timerActive) {
                     state.timeLeft = 0; // Reset time left, new duration will be used on next start
                     timerManager.updateDisplay(); // Update display to show 00:00 if reset
                     state.save(); // Save the change
                 }
             });

            // Navigation
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

            // Submit/Check answers
            dom.checkButton.addEventListener("click", () => quizLogic.submitAndReview());

            // Reset quiz
            dom.resetButton.addEventListener("click", () => quizLogic.resetQuiz(config.confirmReset));

            // Export results
            dom.exportResultsButton.addEventListener("click", () => exportManager.exportResults());

            // Settings toggles (save state on change)
             dom.showExplanationsToggle.addEventListener("change", () => state.save());
             dom.instantFeedbackToggle.addEventListener("change", () => state.save());

            // Keyboard navigation
            document.addEventListener("keydown", (e) => {
                if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
                    return; // Ignore keypresses in input fields
                }
                if (!state.reviewMode) { // Only allow navigation when not in review mode
                    if (e.key === "ArrowLeft" && !dom.prevButton.disabled) {
                         dom.prevButton.click();
                    } else if (e.key === "ArrowRight" && !dom.nextButton.disabled) {
                         dom.nextButton.click();
                    }
                }
            });
        }
    };

    // --- Initialization ---
    function init() {
        themeManager.init();
        eventListeners.setup();

        const savedStateData = state.load();
        let quizToLoad = null;

        if (savedStateData && savedStateData.quizKey) {
            // Find the option matching the saved quiz key
            const matchingOption = Array.from(dom.quizSelector.options).find(opt => opt.value === savedStateData.quizKey);
            if (matchingOption) {
                dom.quizSelector.value = savedStateData.quizKey; // Set dropdown to saved quiz
                quizToLoad = {
                    file: matchingOption.getAttribute("data-file"),
                    key: savedStateData.quizKey,
                    stateData: savedStateData
                };
            }
        }

        // If no saved state or matching quiz found, load the default selected quiz
        if (!quizToLoad) {
            const selectedOption = dom.quizSelector.options[dom.quizSelector.selectedIndex];
            if (selectedOption) {
                 quizToLoad = {
                    file: selectedOption.getAttribute("data-file"),
                    key: selectedOption.value,
                    stateData: null // No saved state to restore
                };
            }
        }

        // Load the determined quiz
        if (quizToLoad && quizToLoad.file && quizToLoad.key) {
            quizLogic.loadQuiz(quizToLoad.file, quizToLoad.key, quizToLoad.stateData);
        } else {
            console.error("No quiz selected or default quiz data-file/value missing.");
            uiManager.displayLoadError("N/A", new Error("Aucun quiz sélectionné ou configuration invalide."));
            uiManager.setLoading(false); // Ensure loading indicator is hidden
        }
    }

    // Start the application
    init();

}); // End DOMContentLoaded

