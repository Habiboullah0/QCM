document.addEventListener("DOMContentLoaded", () => {
    const HIGH_SCORES_KEY = "quizHighScores_v2";
    const THEME_KEY = "quizTheme";
    const QUIZ_STATE_KEY = "currentQuizState_v1";
    const CLASS_LOADING_HIDDEN = "hidden";
    const CLASS_UNANSWERED = "unanswered";
    const CLASS_CORRECT_ANSWER = "correct-answer";
    const CLASS_INCORRECT_ANSWER = "incorrect-answer";
    const CLASS_CORRECT_OPTION = "correct";
    const CLASS_INCORRECT_OPTION = "incorrect";
    const CLASS_MISSED_CORRECT = "missed-correct";
    const CONFIRM_RESET = true;

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
    const themeToggleButton = document.getElementById("themeToggleBtn");
    const body = document.body;
    const navigationContainer = document.getElementById("navigationContainer");
    const prevButton = document.getElementById("prevBtn");
    const nextButton = document.getElementById("nextBtn");
    const questionCounter = document.getElementById("questionCounter");

    let currentQuestions = [];
    let currentQuizKey = "";
    let timerInterval;
    let timeLeft = 0;
    let timerActive = false;
    let reviewMode = false;
    let quizStartTime = null;
    let currentQuestionIndex = 0;
    let userAnswers = {};

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "N/A";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    function saveQuizState() {
        if (!currentQuizKey || currentQuestions.length === 0) return;
        const state = {
            quizKey: currentQuizKey,
            questionIndex: currentQuestionIndex,
            answers: userAnswers,
            timeLeft: timerActive ? timeLeft : null,
            timerDuration: parseInt(timerDurationInput.value, 10),
            explanationsVisible: showExplanationsToggle.checked,
            startTime: quizStartTime,
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
                const state = JSON.parse(savedState);
                return state;
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
            scores[quizKey] = { percentage: percentage, date: new Date().toISOString() };
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
            highScoreDisplay.textContent = "Meilleur score : N/A";
            highScoreDisplay.style.display = "none";
            return;
        }
        const scores = getHighScores();
        const highScoreData = scores[quizKey];
        if (highScoreData?.percentage !== undefined) {
            highScoreDisplay.textContent = `Meilleur score : ${highScoreData.percentage}%`;
        } else {
            highScoreDisplay.textContent = "Meilleur score : Pas encore joué";
        }
        highScoreDisplay.style.display = "block";
    }

    function applyTheme(theme) {
        body.classList.toggle("dark-theme", theme === "dark");
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.error("Erreur lors de la sauvegarde du thème dans localStorage:", e);
        }
    }

    function toggleTheme() {
        const currentTheme = body.classList.contains("dark-theme") ? "light" : "dark";
        applyTheme(currentTheme);
    }

    function showLoading(show) {
        loadingIndicator.classList.toggle(CLASS_LOADING_HIDDEN, !show);
        quizArea.setAttribute("aria-busy", show ? "true" : "false");

        const elementsToDisable = [quizSelector, checkButton, resetButton, timerButton, timerDurationInput, showExplanationsToggle, themeToggleButton, prevButton, nextButton];
        elementsToDisable.forEach((el) => {
            if (el) el.disabled = show;
        });
    }

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

            currentQuestions = shuffleArray(data);

            if (savedState && savedState.quizKey === quizKey) {
                userAnswers = savedState.answers || {};
                currentQuestionIndex = savedState.questionIndex >= 0 && savedState.questionIndex < currentQuestions.length ? savedState.questionIndex : 0;
                timerDurationInput.value = savedState.timerDuration || 10;
                showExplanationsToggle.checked = savedState.explanationsVisible ?? true;
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
            }

            setupQuizUI();
            showQuestion(currentQuestionIndex);
            updateProgress();

            return true;
        } catch (error) {
            console.error("Erreur lors du chargement des questions:", error);
            displayLoadError(filename, error);
            currentQuestions = [];
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
        }
    }

    function displayLoadError(filename, error) {
        questionDisplayArea.innerHTML = "";
        quizForm.innerHTML = "";
        resultDiv.innerHTML = `
            <p><strong>Erreur de Chargement</strong></p>
            <p>Impossible de charger le quiz depuis '${filename}'.</p>
            <p><small>${error.message}</small></p>`;
        resultDiv.className = "result loading-error";
        resultDiv.style.display = "block";
        navigationContainer.style.display = "none";
    }

    function resetButtonStatesOnError() {
        checkButton.disabled = true;
        resetButton.disabled = true;
        timerButton.disabled = true;
        timerDurationInput.disabled = true;
        prevButton.disabled = true;
        nextButton.disabled = true;
    }

    function setupQuizUI() {
        reviewMode = false;
        questionDisplayArea.style.display = "block";
        quizForm.style.display = "none";
        navigationContainer.style.display = "flex";
        resultDiv.style.display = "none";
        resultDiv.className = "result";
        quizForm.innerHTML = "";
        questionDisplayArea.innerHTML = "";
    }

    function buildQuestionElement(q, questionIndex, isInReviewMode = false) {
        const questionDiv = document.createElement("div");
        questionDiv.className = "question";
        questionDiv.id = `question-${questionIndex}`;

        if (isInReviewMode) {
            const questionNumber = document.createElement("div");
            questionNumber.className = "question-number";
            questionNumber.textContent = questionIndex + 1;
            questionNumber.setAttribute("aria-hidden", "true");
            questionDiv.appendChild(questionNumber);
        }

        const title = document.createElement("h3");
        title.innerHTML = q.question;
        title.id = `question-title-${questionIndex}`;
        questionDiv.appendChild(title);

        const optionsContainer = document.createElement("div");
        optionsContainer.className = "options-container";
        optionsContainer.setAttribute("role", "group");
        optionsContainer.setAttribute("aria-labelledby", `question-title-${questionIndex}`);

        const currentAnswers = userAnswers[questionIndex] || [];

        q.options.forEach((optionText, optionIndex) => {
            const label = document.createElement("label");
            const inputId = `q${questionIndex}_opt${optionIndex}`;
            label.htmlFor = inputId;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = `q${questionIndex}`;
            checkbox.value = optionIndex;
            checkbox.id = inputId;
            checkbox.checked = currentAnswers.includes(optionIndex);
            checkbox.disabled = isInReviewMode;

            if (!isInReviewMode) {
                checkbox.addEventListener("change", (e) => handleAnswerChange(questionIndex, optionIndex, e.target.checked));
            }

            const span = document.createElement("span");
            span.textContent = optionText;

            label.appendChild(checkbox);
            label.appendChild(span);
            optionsContainer.appendChild(label);
        });

        questionDiv.appendChild(optionsContainer);

        if (isInReviewMode) {
            const correctionDiv = document.createElement("div");
            correctionDiv.className = "correction-details";
            correctionDiv.id = `correction-${questionIndex}`;
            correctionDiv.setAttribute("aria-live", "polite");
            correctionDiv.style.display = "none";
            questionDiv.appendChild(correctionDiv);
        }

        return questionDiv;
    }

    function showQuestion(index) {
        if (index < 0 || index >= currentQuestions.length) {
            console.warn(`Tentative d'affichage d'une question invalide : index ${index}`);
            return;
        }
        reviewMode = false;
        currentQuestionIndex = index;

        questionDisplayArea.classList.add("fade-out");

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

            questionDisplayArea.classList.remove("fade-out");
            questionDisplayArea.classList.add("fade-in");
            setTimeout(() => questionDisplayArea.classList.remove("fade-in"), 300);

            quizArea.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            quizArea.classList.add("hover");
            setTimeout(() => {
                quizArea.classList.remove("hover");
            }, 1000);

            checkButton.disabled = !areAllQuestionsAttempted();

            saveQuizState();
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
        checkButton.disabled = !areAllQuestionsAttempted();
        saveQuizState();
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
        const totalQuestions = currentQuestions.length;
        if (totalQuestions === 0) {
            progressBar.style.width = "0%";
            progressBar.setAttribute("aria-valuenow", 0);
            progressBar.setAttribute("aria-label", `Progression du quiz : 0%`);
            return;
        }

        const answeredCount = Object.keys(userAnswers).length;

        const percentage = Math.round((answeredCount / totalQuestions) * 100);
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute("aria-valuenow", percentage);
        progressBar.setAttribute("aria-label", `Questions répondues : ${percentage}%`);
    }

    function resetQuizVisuals() {
        quizForm.querySelectorAll(".question").forEach((qDiv) => {
            qDiv.classList.remove(CLASS_UNANSWERED, CLASS_CORRECT_ANSWER, CLASS_INCORRECT_ANSWER);
            const correctionDiv = qDiv.querySelector(".correction-details");
            if (correctionDiv) {
                correctionDiv.style.display = "none";
                correctionDiv.innerHTML = "";
                correctionDiv.className = "correction-details";
            }
            qDiv.querySelectorAll(".options-container label").forEach((label) => {
                label.classList.remove(CLASS_CORRECT_OPTION, CLASS_INCORRECT_OPTION, CLASS_MISSED_CORRECT);
                label.removeAttribute("aria-invalid");
            });
        });

        resultDiv.style.display = "none";
        resultDiv.innerHTML = "";
        resultDiv.className = "result";
    }

    function resetQuizState(confirm = CONFIRM_RESET) {
        if (reviewMode && confirm) {
            if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser le quiz et commencer une nouvelle tentative ?")) {
                return;
            }
        }

        if (timerActive) {
            clearInterval(timerInterval);
            timerActive = false;
            timerContainer.style.display = "none";
            updateTimerButtonText();
        }
        quizStartTime = Date.now();

        currentQuestionIndex = 0;
        userAnswers = {};
        reviewMode = false;

        clearQuizState();

        resetQuizVisuals();
        questionDisplayArea.innerHTML = "";
        quizForm.innerHTML = "";
        quizForm.style.display = "none";
        questionDisplayArea.style.display = "block";
        navigationContainer.style.display = currentQuestions.length > 0 ? "flex" : "none";

        if (currentQuestions.length > 0) {
            showQuestion(0);
            updateProgress();
        } else {
            questionCounter.textContent = "Question ? / ?";
            updateProgress();
        }

        checkButton.disabled = true;
        resetButton.disabled = currentQuestions.length === 0;
        timerButton.disabled = currentQuestions.length === 0;
        timerDurationInput.disabled = currentQuestions.length === 0 || timerActive;
        quizSelector.disabled = false;

        quizArea.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function checkAnswers() {
        if (reviewMode || currentQuestions.length === 0) return;

        let firstUnansweredIndex = -1;
        for (let i = 0; i < currentQuestions.length; i++) {
            if (!userAnswers[i] || (Array.isArray(userAnswers[i]) && userAnswers[i].length === 0)) {
                firstUnansweredIndex = i;
                break;
            }
        }

        if (firstUnansweredIndex !== -1) {
            resultDiv.innerHTML = `
                 <p><strong>Attention !</strong></p>
                 <p>Veuillez répondre à toutes les questions avant de vérifier.</p>
                 <p><small>Naviguez vers la question ${firstUnansweredIndex + 1} pour continuer.</small></p>`;
            resultDiv.className = "result error";
            resultDiv.style.display = "block";
            resultDiv.setAttribute("role", "alert");

            showQuestion(firstUnansweredIndex);

            checkButton.disabled = !areAllQuestionsAttempted();
            resetButton.disabled = false;

            return;
        }

        reviewMode = true;
        clearQuizState();

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

        questionDisplayArea.style.display = "none";
        navigationContainer.style.display = "none";
        quizForm.innerHTML = "";
        quizForm.style.display = "block";

        const reviewFragment = document.createDocumentFragment();

        let score = 0;
        const totalQuestions = currentQuestions.length;
        let correctQuestions = 0;
        let partiallyCorrectQuestions = 0;
        let incorrectQuestionsCount = 0;

        currentQuestions.forEach((q, questionIndex) => {
            const questionDiv = buildQuestionElement(q, questionIndex, true);
            const correctionDiv = questionDiv.querySelector(".correction-details");
            const optionsContainer = questionDiv.querySelector(".options-container");
            const labels = optionsContainer.querySelectorAll("label");

            const selectedAnswerIndices = userAnswers[questionIndex] || [];
            const correctAnswersSet = new Set(q.correct);

            let isQuestionPerfectlyCorrect = true;
            let correctSelectionsCount = 0;
            let incorrectSelectionsCount = 0;

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

            q.correct.forEach((correctIndex) => {
                if (!selectedAnswerIndices.includes(correctIndex)) {
                    const label = labels[correctIndex];
                    if (label) {
                        label.classList.add(CLASS_MISSED_CORRECT);
                    }
                    isQuestionPerfectlyCorrect = false;
                }
            });

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
            }

            questionDiv.classList.add(questionStatus === "correct" ? CLASS_CORRECT_ANSWER : CLASS_INCORRECT_ANSWER);

            if (correctionDiv) {
                let feedback = "";
                let correctionClass = "error";

                const correctOptionsText = q.correct
                    .map((index) => (q.options[index] ? `<span class='correct-answer-list'>${q.options[index]}</span>` : ""))
                    .filter(Boolean)
                    .join(", ");
                const correctAnswersString = `<strong>Réponses correctes :</strong> ${correctOptionsText || "Aucune"}`;

                if (questionStatus === "correct") {
                    feedback = `<p><strong><span style="color: var(--correct-color);">✓ Correct !</span></strong></p>`;
                    correctionClass = "success";
                } else if (questionStatus === "partial") {
                    feedback = `<p><strong><span style="color: var(--partial-color);">~ Partiellement Correct.</span></strong> Vous avez sélectionné correctement certaines options, mais pas toutes, et aucune incorrecte.</p>`;
                    feedback += `<p>${correctAnswersString}</p>`;
                    correctionClass = "error";
                } else {
                    feedback = `<p><strong><span style="color: var(--incorrect-color);">✗ Incorrect.</span></strong>`;
                    if (incorrectSelectionsCount > 0) {
                        feedback += ` Vous avez sélectionné une ou plusieurs réponses incorrectes.`;
                    } else if (correctSelectionsCount === 0 && selectedAnswerIndices.length > 0) {
                        feedback += ` Vos sélections ne contiennent aucune des bonnes réponses.`;
                    } else {
                        feedback += ` Vous n'avez pas sélectionné toutes les bonnes réponses requises.`;
                    }
                    feedback += `</p><p>${correctAnswersString}</p>`;
                    correctionClass = "error";
                }

                if (q.explanation && showExplanationsToggle.checked) {
                    feedback += `<p class="feedback-explanation" style="display: block;"><strong>Explication :</strong> ${q.explanation}</p>`;
                } else if (q.explanation) {
                    feedback += `<p class="feedback-explanation" style="display: none;"><strong>Explication :</strong> ${q.explanation}</p>`;
                }

                correctionDiv.innerHTML = feedback;
                correctionDiv.className = `correction-details ${correctionClass}`;
                correctionDiv.style.display = "block";
            }

            reviewFragment.appendChild(questionDiv);
        });

        quizForm.appendChild(reviewFragment);

        incorrectQuestionsCount = totalQuestions - correctQuestions - partiallyCorrectQuestions;
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

        saveHighScore(currentQuizKey, score, totalQuestions);

        let resultClass = "error";
        let resultMessage = "Résultats du Quiz";
        if (percentage === 100) {
            resultClass = "success";
            resultMessage = "Félicitations ! Score parfait !";
        } else if (percentage >= 75) {
            resultClass = "success";
            resultMessage = "Excellent travail !";
        } else if (percentage >= 50) {
            resultClass = "partial";
            resultMessage = "Bon travail !";
        } else {
            resultClass = "error";
            resultMessage = "Continuez à essayer ! Consultez les corrections.";
        }

        const timeTakenFormatted = timeTakenSeconds !== null ? formatTime(timeTakenSeconds) : null;
        const timeTakenHTML = timeTakenFormatted
            ? `
             <div class="result-item time">
                 <div class="result-value">${timeTakenFormatted}</div>
                 <div class="result-label">Temps Pris</div>
             </div>`
            : "";

        resultDiv.innerHTML = `
             <p>${resultMessage}</p>
             <p>Votre score final : ${score} / ${totalQuestions} (${percentage}%)</p>
             <div class="result-details">
                 <div class="result-item correct">
                     <div class="result-value">${correctQuestions}</div>
                     <div class="result-label">Correctes</div>
                 </div>
                 <div class="result-item partial">
                     <div class="result-value">${partiallyCorrectQuestions}</div>
                     <div class="result-label">Partielles</div>
                 </div>
                 <div class="result-item incorrect">
                     <div class="result-value">${incorrectQuestionsCount}</div>
                     <div class="result-label">Incorrectes</div>
                 </div>
                 ${timeTakenHTML}
             </div>`;
        resultDiv.className = `result ${resultClass}`;
        resultDiv.style.display = "block";
        resultDiv.setAttribute("role", "status");

        checkButton.disabled = true;
        resetButton.disabled = false;
        quizSelector.disabled = false;

        resultDiv.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    function startTimer() {
        if (timerActive || currentQuestions.length === 0 || reviewMode) return;

        const durationMinutes = parseInt(timerDurationInput.value, 10);
        if (isNaN(durationMinutes) || durationMinutes < 1 || durationMinutes > 60) {
            alert("Veuillez entrer une durée valide entre 1 et 60 minutes.");
            timerDurationInput.focus();
            timerDurationInput.select();
            return;
        }

        timeLeft = durationMinutes * 60;
        timerActive = true;
        timerContainer.style.display = "flex";
        timerButton.disabled = true;
        timerDurationInput.disabled = true;
        updateTimerButtonText();
        updateTimerDisplay();

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            saveQuizState();

            if (timeLeft < 0) {
                clearInterval(timerInterval);
                timerActive = false;
                timeLeft = 0;
                updateTimerDisplay();
                timerButton.disabled = false;
                timerDurationInput.disabled = false;
                updateTimerButtonText();
                clearQuizState();

                alert("Temps écoulé ! Vérification des réponses...");
                checkAnswers();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(timeLeft);
    }

    function updateTimerButtonText() {
        if (timerActive) {
            timerBtnText.textContent = "Chrono Actif";
        } else {
            const duration = timerDurationInput.value || "?";
            timerBtnText.textContent = `Lancer Chrono (${duration} min)`;
        }
    }

    function handleTimerInputChange() {
        if (!timerActive) {
            updateTimerButtonText();
        }
    }

    quizSelector.addEventListener("change", async (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const file = selectedOption.getAttribute("data-file");
        const title = selectedOption.getAttribute("data-title") || selectedOption.text;
        const key = selectedOption.value;

        quizDescription.textContent = `Testez vos connaissances sur : ${title}`;

        if (timerActive) {
            clearInterval(timerInterval);
            timerActive = false;
            timerContainer.style.display = "none";
            updateTimerButtonText();
        }

        await loadQuestions(file, key);
    });

    checkButton.addEventListener("click", checkAnswers);
    resetButton.addEventListener("click", () => resetQuizState(CONFIRM_RESET));
    timerButton.addEventListener("click", startTimer);
    timerDurationInput.addEventListener("change", handleTimerInputChange);
    timerDurationInput.addEventListener("input", handleTimerInputChange);
    themeToggleButton.addEventListener("click", toggleTheme);

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

    showExplanationsToggle.addEventListener("change", () => {
        if (reviewMode) {
            document.querySelectorAll(".feedback-explanation").forEach((el) => {
                el.style.display = showExplanationsToggle.checked ? "block" : "none";
            });
        }
    });

    window.addEventListener("beforeunload", () => {
        if (!reviewMode && currentQuestions.length > 0) {
            saveQuizState();
        } else {
            clearQuizState();
        }
    });

    async function initializeQuiz() {
        const savedTheme = localStorage.getItem(THEME_KEY) || "light";
        applyTheme(savedTheme);

        const savedQuizState = loadQuizState();

        let initialFile, initialTitle, initialKey;

        if (savedQuizState) {
            const savedQuizOption = quizSelector.querySelector(`option[value="${savedQuizState.quizKey}"]`);
            if (savedQuizOption) {
                quizSelector.value = savedQuizState.quizKey;
                initialFile = savedQuizOption.getAttribute("data-file");
                initialTitle = savedQuizOption.getAttribute("data-title") || savedQuizOption.text;
                initialKey = savedQuizState.quizKey;
                console.log(`Reprise du quiz : ${initialTitle}`);
            } else {
                clearQuizState();
                console.warn("État de quiz sauvegardé pour un quiz indisponible. Chargement du quiz par défaut.");
                const defaultOption = quizSelector.options[0];
                initialFile = defaultOption.getAttribute("data-file");
                initialTitle = defaultOption.getAttribute("data-title") || defaultOption.text;
                initialKey = defaultOption.value;
            }
        } else {
            const defaultOption = quizSelector.options[quizSelector.selectedIndex];
            initialFile = defaultOption.getAttribute("data-file");
            initialTitle = defaultOption.getAttribute("data-title") || defaultOption.text;
            initialKey = defaultOption.value;
        }

        quizDescription.textContent = `Testez vos connaissances sur : ${initialTitle}`;
        updateTimerButtonText();

        await loadQuestions(initialFile, initialKey, savedQuizState);
    }

    initializeQuiz();
});
