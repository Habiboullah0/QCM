"use strict";

(function () {
    document.addEventListener("DOMContentLoaded", initializeAnimations);

    let elements = {};

    const ANIMATIONS = {
        DURATION: { SHORT: 300, MEDIUM: 500, LONG: 800 },
        EASING: {
            LINEAR: "linear",
            EASE_IN: "cubic-bezier(0.4, 0, 1, 1)",
            EASE_OUT: "cubic-bezier(0, 0, 0.2, 1)",
            EASE_IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
            BOUNCE: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        },
    };

    function initializeAnimations() {
        initializeDOMElements();
        setupEventListeners();
        addInitialAnimations();
    }

    function initializeDOMElements() {
        elements = {
            quizContainer: document.querySelector(".quiz-container"),
            quizHeader: document.querySelector(".quiz-header"),
            quizArea: document.querySelector("#quizArea"),
            resultDisplay: document.querySelector("#result"),
            checkButton: document.querySelector("#checkBtn"),
            resetButton: document.querySelector("#resetBtn"),
            exportButton: document.querySelector("#exportResultsBtn"),
            timerDisplay: document.querySelector("#timer"),
            progressBar: document.querySelector("#progressBar"),
            questionDisplayArea: document.querySelector("#questionDisplayArea"),
        };
    }

    function setupEventListeners() {
        document.querySelector("#quizSelector")?.addEventListener("change", animateQuizChange);
        document.querySelector("#prevBtn")?.addEventListener("click", () => animateQuestionTransition("prev"));
        document.querySelector("#nextBtn")?.addEventListener("click", () => animateQuestionTransition("next"));
        elements.checkButton?.addEventListener("click", animateCheckAnswers);
        document.querySelector("#timerBtn")?.addEventListener("click", animateTimerToggle);
        document.querySelector("#themeToggleBtn")?.addEventListener("click", animateThemeChange);
    }

    function addInitialAnimations() {
        if (elements.quizHeader) {
            elements.quizHeader.style.opacity = "0";
            elements.quizHeader.style.transform = "translateY(-20px)";
            setTimeout(() => {
                elements.quizHeader.style.transition = `opacity ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_OUT}, transform ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_OUT}`;
                elements.quizHeader.style.opacity = "1";
                elements.quizHeader.style.transform = "translateY(0)";
            }, 100);
        }
        addButtonHoverEffects();
        animateProgressBar();
    }

    function addButtonHoverEffects() {
        const buttons = document.querySelectorAll(".btn");
        buttons.forEach((button) => {
            button.addEventListener("mouseenter", () => {
                if (!button.disabled) {
                    button.style.transition = `transform ${ANIMATIONS.DURATION.SHORT}ms ${ANIMATIONS.EASING.EASE_OUT}, box-shadow ${ANIMATIONS.DURATION.SHORT}ms ${ANIMATIONS.EASING.EASE_OUT}`;
                    button.style.transform = "translateY(-2px)";
                    button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                }
            });
            button.addEventListener("mouseleave", () => {
                if (!button.disabled) {
                    button.style.transition = `transform ${ANIMATIONS.DURATION.SHORT}ms ${ANIMATIONS.EASING.EASE_OUT}, box-shadow ${ANIMATIONS.DURATION.SHORT}ms ${ANIMATIONS.EASING.EASE_OUT}`;
                    button.style.transform = "translateY(0)";
                    button.style.boxShadow = "none";
                }
            });
        });
    }

    function animateProgressBar() {
        if (!elements.progressBar) return;
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "style") {
                    elements.progressBar.style.transition = `width ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_IN_OUT}`;
                }
            });
        });
        observer.observe(elements.progressBar, { attributes: true });
    }

    function animateQuizChange() {
        if (!elements.quizArea) return;
        elements.quizArea.style.transition = `opacity ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_OUT}`;
        elements.quizArea.style.opacity = "0";
        setTimeout(() => {
            elements.quizArea.style.opacity = "1";
        }, ANIMATIONS.DURATION.MEDIUM);
    }

    function animateQuestionTransition(direction) {
        if (!elements.questionDisplayArea) return;
        elements.questionDisplayArea.style.transition = `opacity ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_OUT}, transform ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_OUT}`;
        elements.questionDisplayArea.style.opacity = "0";
        elements.questionDisplayArea.style.transform = direction === "prev" ? "translateX(20px)" : "translateX(-20px)";
        setTimeout(() => {
            elements.questionDisplayArea.style.transform = direction === "prev" ? "translateX(-20px)" : "translateX(20px)";
            setTimeout(() => {
                elements.questionDisplayArea.style.opacity = "1";
                elements.questionDisplayArea.style.transform = "translateX(0)";
            }, 50);
        }, ANIMATIONS.DURATION.MEDIUM / 2);
    }

    function animateCheckAnswers() {
        if (!elements.resultDisplay) return;
        setTimeout(() => {
            if (elements.resultDisplay.style.display !== "none" && elements.resultDisplay.innerHTML !== "") {
                elements.resultDisplay.style.transition = `opacity ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_OUT}, transform ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_OUT}`;
                elements.resultDisplay.style.opacity = "0";
                elements.resultDisplay.style.transform = "translateY(20px)";
                setTimeout(() => {
                    elements.resultDisplay.style.opacity = "1";
                    elements.resultDisplay.style.transform = "translateY(0)";
                }, ANIMATIONS.DURATION.SHORT);
            }
        }, 50);
    }

    function animateTimerToggle() {
        if (!elements.timerDisplay) return;
        elements.timerDisplay.classList.add("animate-pulse");
        setTimeout(() => {
            elements.timerDisplay.classList.remove("animate-pulse");
        }, ANIMATIONS.DURATION.LONG);
    }

    function animateThemeChange() {
        document.body.style.transition = `background-color ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_IN_OUT}, color ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_IN_OUT}`;
        const cards = document.querySelectorAll(".card, #result > div, .badge-item, .quiz-container, .bg-card-bg, .bg-bg");
        cards.forEach((card) => {
            card.style.transition = `background-color ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_IN_OUT}, border-color ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_IN_OUT}, box-shadow ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_IN_OUT}, color ${ANIMATIONS.DURATION.MEDIUM}ms ${ANIMATIONS.EASING.EASE_IN_OUT}`;
        });
    }

    function createParticleEffect(element, type = "confetti") {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const particleCount = type === "explosion" ? 30 : 20;
        const colors = ["#4F46E5", "#16A34A", "#F59E0B", "#EF4444"];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.style.position = "fixed";
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.pointerEvents = "none";
            particle.style.zIndex = "9999";
            particle.style.borderRadius = type === "explosion" ? "50%" : "0";

            if (type === "confetti") {
                particle.style.width = `${Math.random() * 6 + 4}px`;
                particle.style.height = `${Math.random() * 10 + 6}px`;
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            } else if (type === "sparkle") {
                particle.style.width = "4px";
                particle.style.height = "4px";
                particle.style.backgroundColor = "#fff";
                particle.style.boxShadow = "0 0 10px 2px rgba(255, 255, 255, 0.8)";
                particle.style.borderRadius = "50%";
            } else if (type === "explosion") {
                particle.style.width = "6px";
                particle.style.height = "6px";
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            }

            document.body.appendChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 80; // Add upward thrust
            const duration = Math.random() * 1000 + 800; // Longer duration

            particle.animate(
                [
                    { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1 },
                    { transform: `translate(${vx}px, ${vy + 200}px) rotate(${Math.random() * 720 - 360}deg) scale(0)`, opacity: 0 },
                ],
                {
                    duration: duration,
                    easing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
                    fill: "forwards",
                }
            );

            setTimeout(() => particle.remove(), duration);
        }
    }

    window.QuizAnimations = {
        createParticleEffect: createParticleEffect,
    };
})();
