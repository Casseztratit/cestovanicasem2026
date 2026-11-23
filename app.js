/**
 * Hlavní aplikační logika pro expediční hru "Čas se ztratit"
 * Včetně automatického ukládání postupu do localStorage (pro GitHub Pages)
 */

const STORAGE_KEY = "cas_se_ztratit_save_v1";

const gameState = {
    currentStepIndex: 0,
    uiPhase: "step", // "step" | "step_report" | "branch_nav" | "branch_task" | "branch_done"
    remainingBranches: ['A', 'B', 'C'],
    visitedBranches: [],
    currentActiveBranch: null,
    lastCompletedBranch: null,
    branchRound: 0,
    userLocation: null,
    deviceHeading: null,
    shownPopups: new Set(),
    unlockedIndiciaB: new Set(), // Trvale odemčené indicie pro Boží kámen
    showingReportMode: false,
    currentTargetGps: null,
    stepTransitionLock: false, // Pojistka proti opakovanému spuštění po dosažení GPS
    lunchTimer: null,
    lunchSecondsLeft: 1200,
    lunchEndTime: null,
    selectedMapLatLng: null,
    leafletMap: null,
    leafletMarker: null
};

// ==========================================
// UKLÁDÁNÍ A OBNOVA POSTUPU (localStorage)
// ==========================================

function saveGameState() {
    try {
        const dataToSave = {
            currentStepIndex: gameState.currentStepIndex,
            uiPhase: gameState.uiPhase,
            remainingBranches: gameState.remainingBranches,
            visitedBranches: gameState.visitedBranches,
            currentActiveBranch: gameState.currentActiveBranch,
            lastCompletedBranch: gameState.lastCompletedBranch,
            branchRound: gameState.branchRound,
            shownPopups: Array.from(gameState.shownPopups),
            unlockedIndiciaB: Array.from(gameState.unlockedIndiciaB),
            lunchEndTime: gameState.lunchEndTime
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
        console.warn("Nepodařilo se uložit postup hry:", e);
    }
}

function loadGameState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;

        const saved = JSON.parse(raw);
        if (typeof saved.currentStepIndex === "number") {
            gameState.currentStepIndex = saved.currentStepIndex;
        }
        if (saved.uiPhase) gameState.uiPhase = saved.uiPhase;
        if (Array.isArray(saved.remainingBranches)) gameState.remainingBranches = saved.remainingBranches;
        if (Array.isArray(saved.visitedBranches)) gameState.visitedBranches = saved.visitedBranches;
        gameState.currentActiveBranch = saved.currentActiveBranch || null;
        gameState.lastCompletedBranch = saved.lastCompletedBranch || null;
        if (typeof saved.branchRound === "number") gameState.branchRound = saved.branchRound;
        if (Array.isArray(saved.shownPopups)) gameState.shownPopups = new Set(saved.shownPopups);
        if (Array.isArray(saved.unlockedIndiciaB)) gameState.unlockedIndiciaB = new Set(saved.unlockedIndiciaB);
        gameState.lunchEndTime = saved.lunchEndTime || null;

        return true;
    } catch (e) {
        console.warn("Nepodařilo se načíst uložený postup:", e);
        return false;
    }
}

function resetGameProgress() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn("Chyba při mazání uložené hry:", e);
    }
    location.reload();
}

// ==========================================
// INICIALIZACE APLIKACE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadGameState();
    initGPS();
    initOrientation();
    setupEventListeners();
    restoreGameView();
});

function restoreGameView() {
    const step = gameData.steps[gameState.currentStepIndex];
    if (!step) {
        gameState.currentStepIndex = 0;
        gameState.uiPhase = "step";
        saveGameState();
        renderCurrentStep();
        return;
    }

    if (gameState.uiPhase === "branch_nav" && gameState.currentActiveBranch) {
        const branchConfig = gameData.branches[gameState.currentActiveBranch];
        renderBranchNavReport(branchConfig);
    } else if (gameState.uiPhase === "branch_task" && gameState.currentActiveBranch) {
        const branchConfig = gameData.branches[gameState.currentActiveBranch];
        renderActiveBranchTask(branchConfig);
    } else if (gameState.uiPhase === "branch_done" && gameState.lastCompletedBranch) {
        renderBranchDoneReport(gameState.lastCompletedBranch);
    } else if (gameState.uiPhase === "step_report") {
        renderStepReport(step);
    } else {
        renderCurrentStep();
    }
}

function initGPS() {
    const statusDot = document.querySelector(".status-dot");
    const gpsText = document.getElementById("gps-text");

    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            (position) => {
                gameState.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                if (statusDot) statusDot.classList.add("active");
                if (gpsText) gpsText.textContent = "GPS aktivní";

                checkGpsTriggers();
                checkReportGpsArrival();
                checkLabyrintFinishGps();
                checkReznyGpsArrival();
            },
            (error) => {
                if (statusDot) statusDot.classList.remove("active");
                if (gpsText) gpsText.textContent = "GPS nedostupné";
                console.warn("Chyba GPS:", error.message);
            },
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );
    } else {
        if (gpsText) gpsText.textContent = "GPS není podporováno";
    }
}

function initOrientation() {
    const handleOrientation = (event) => {
        if (typeof event.webkitCompassHeading === "number") {
            gameState.deviceHeading = event.webkitCompassHeading;
        } else if (event.alpha !== null) {
            gameState.deviceHeading = (360 - event.alpha) % 360;
        }
    };

    if ("ondeviceorientationabsolute" in window) {
        window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    } else if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation, true);
    }
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Automatická detekce cíle Labyrintu (Z4) při vstupu na ukončovací souřadnice
function checkLabyrintFinishGps() {
    if (!gameState.userLocation || gameState.stepTransitionLock || gameState.uiPhase !== "step") return;
    const currentStep = gameData.steps[gameState.currentStepIndex];
    const targetPoint = (currentStep && currentStep.type === "labyrint")
        ? (currentStep.endGps || currentStep.targetGps)
        : null;

    if (targetPoint) {
        const dist = getDistanceMeters(
            gameState.userLocation.lat,
            gameState.userLocation.lng,
            targetPoint.lat,
            targetPoint.lng
        );
        if (dist <= targetPoint.radius) {
            gameState.stepTransitionLock = true;
            handleStepCompletion(currentStep);
        }
    }
}

// Detekce příchodu na GPS u Z5b (Zpět za dobrodružstvím)
function checkReznyGpsArrival() {
    if (!gameState.userLocation || gameState.stepTransitionLock || gameState.uiPhase !== "step") return;
    const currentStep = gameData.steps[gameState.currentStepIndex];
    if (currentStep && currentStep.type === "gps_check" && currentStep.endGps) {
        const dist = getDistanceMeters(
            gameState.userLocation.lat,
            gameState.userLocation.lng,
            currentStep.endGps.lat,
            currentStep.endGps.lng
        );
        if (dist <= currentStep.endGps.radius) {
            gameState.stepTransitionLock = true;
            showFeedback("Dorazili jste na cílové místo!", false);
            setTimeout(() => {
                advanceToNextStep();
            }, 1000);
        }
    }
}

// Kontrola příchodu na cílovou GPS u hlášení a odemčení tlačítka
function checkReportGpsArrival() {
    if (!gameState.showingReportMode || !gameState.currentTargetGps) return;
    const btn = document.getElementById("next-step-btn");
    if (!btn) return;

    if (!gameState.userLocation) {
        btn.disabled = true;
        btn.textContent = "Čekám na signál GPS...";
        btn.classList.remove("btn-success");
        return;
    }

    const dist = getDistanceMeters(
        gameState.userLocation.lat,
        gameState.userLocation.lng,
        gameState.currentTargetGps.lat,
        gameState.currentTargetGps.lng
    );

    if (dist <= gameState.currentTargetGps.radius) {
        btn.disabled = false;
        btn.textContent = "Dorazili jste na místo (Pokračovat)";
        btn.classList.add("btn-success");
    } else {
        // Poznámka pro testování od stolu: pro obejití GPS v terénu změňte níže na false
        btn.disabled = true;
        btn.textContent = `Čekám na příchod na GPS (Zbývá: ${Math.round(dist)} m)`;
        btn.classList.remove("btn-success");
    }
}

// Kontrola Pop-Up indicií a odemykání panelu B
function checkGpsTriggers() {
    if (!gameState.userLocation) return;
    const currentStep = gameData.steps[gameState.currentStepIndex];
    let activePopups = [];

    if (currentStep && currentStep.popups && gameState.uiPhase === "step") {
        activePopups = activePopups.concat(currentStep.popups);
    }
    if (gameState.currentActiveBranch && gameData.branches[gameState.currentActiveBranch] && gameState.uiPhase === "branch_task") {
        const branchPopups = gameData.branches[gameState.currentActiveBranch].popups;
        if (branchPopups) activePopups = activePopups.concat(branchPopups);
    }
    if (currentStep && currentStep.type === "labyrint" && gameState.uiPhase === "step") {
        if (currentStep.intersections) activePopups = activePopups.concat(currentStep.intersections);
        if (currentStep.deadEnds) activePopups = activePopups.concat(currentStep.deadEnds);
    }

    activePopups.forEach((popup) => {
        const popupId = `${popup.lat}_${popup.lng}_${popup.image}`;
        const dist = getDistanceMeters(
            gameState.userLocation.lat,
            gameState.userLocation.lng,
            popup.lat,
            popup.lng
        );

        if (dist <= popup.radius) {
            if (gameState.shownPopups.has(popupId) && !popup.repeatable && currentStep.type !== "labyrint") {
                return;
            }

            if (popup.id && currentStep.type === "labyrint") {
                const isFacingNorth = gameState.deviceHeading === null ||
                                      (gameState.deviceHeading >= 315 || gameState.deviceHeading <= 45);
                if (!isFacingNorth) return;
            }

            // Trvalé odemčení indicie u Božího kamene (varianta B)
            if (popup.index && gameState.currentActiveBranch === "B") {
                gameState.unlockedIndiciaB.add(popup.index);
                updateIndiciaPanelB();
            }

            openPopupModal(popup.image);
            gameState.shownPopups.add(popupId);
            saveGameState();
        }
    });
}

function openPopupModal(imagePath) {
    const modal = document.getElementById("popup-modal");
    const img = document.getElementById("popup-indicia-img");
    if (img) img.src = imagePath;
    if (modal) modal.classList.remove("hidden");
}

function renderCurrentStep() {
    hideAllSections();
    clearFeedback();
    gameState.showingReportMode = false;
    gameState.currentTargetGps = null;
    gameState.uiPhase = "step";
    saveGameState();

    const step = gameData.steps[gameState.currentStepIndex];
    if (!step) return;

    if (step.type === "branch_draw") {
        handleBranchDrawStep(step.roundNumber);
        return;
    }

    if (step.cardImage || step.cardImages) {
        showCardImages(step.cardImage || step.cardImages);
    }

    switch (step.type) {
        case "map_pin":
            showMapSection(step.targetGps);
            break;
        case "video_pass":
            showVideoSection(step.videoUrl);
            showPasswordForm("Zadejte heslo ze startu:");
            break;
        case "gps_search":
            showVideoSection(step.videoUrl);
            showPasswordForm("Zadejte heslo k úkolu:");
            break;
        case "gps_and_pass":
        case "text_pass":
        case "final_map_puzzle":
            showPasswordForm("Zadejte heslo k úkolu:");
            break;
        case "timer_30_min":
            showTimerContainer();
            break;
        case "gps_check":
            showFeedback("Jděte na cílové GPS místo u pomníku...", false);
            break;
        case "form_questionnaire":
            showGoogleFormsContainer(step.formUrl);
            showPasswordForm("Zadejte závěrečné heslo z formuláře:");
            break;
        case "final_screen":
            showCardImages([step.reportImage]);
            appendResetButtonToFinalScreen();
            break;
    }
}

function appendResetButtonToFinalScreen() {
    const container = document.getElementById("image-container");
    if (!container) return;

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "btn btn-secondary";
    resetBtn.textContent = "Hrát znovu od začátku (Vymazat postup)";
    resetBtn.style.marginTop = "16px";
    resetBtn.onclick = () => {
        if (confirm("Opravdu chcete vymazat uložený postup a začít hru od začátku?")) {
            resetGameProgress();
        }
    };
    container.appendChild(resetBtn);
}

function handleBranchDrawStep(roundNumber) {
    gameState.branchRound = roundNumber;
    saveGameState();
    const container = document.getElementById("draw-container");
    if (container) container.classList.remove("hidden");
}

function executeDraw() {
    let selectedBranch = null;
    if (gameState.branchRound === 1 || gameState.branchRound === 2) {
        const randomIndex = Math.floor(Math.random() * gameState.remainingBranches.length);
        selectedBranch = gameState.remainingBranches[randomIndex];
    } else if (gameState.branchRound === 3) {
        selectedBranch = Array.isArray(gameState.remainingBranches)
            ? gameState.remainingBranches[0]
            : gameState.remainingBranches;
    }

    if (Array.isArray(gameState.remainingBranches)) {
        gameState.remainingBranches = gameState.remainingBranches.filter(b => b !== selectedBranch);
    }

    gameState.visitedBranches.push(selectedBranch);
    gameState.currentActiveBranch = selectedBranch;
    gameState.uiPhase = "branch_nav";
    saveGameState();

    const branchConfig = gameData.branches[selectedBranch];
    renderBranchNavReport(branchConfig);
}

function renderBranchNavReport(branchConfig) {
    hideAllSections();
    clearFeedback();
    const roundKey = `round${gameState.branchRound}`;
    const navReportImage = branchConfig.reports[roundKey].nav;
    showCardImages([navReportImage]);

    gameState.showingReportMode = true;
    gameState.currentTargetGps = branchConfig.targetGps;
    showNextStepContainer("Čekám na příchod na GPS...", () => {
        renderActiveBranchTask(branchConfig);
    });
}

function renderActiveBranchTask(branchConfig) {
    hideAllSections();
    clearFeedback();
    gameState.showingReportMode = false;
    gameState.currentTargetGps = null;
    gameState.uiPhase = "branch_task";
    saveGameState();

    showCardImages(branchConfig.cardImages || [branchConfig.cardImage]);

    if (branchConfig.id === "B") {
        const panelB = document.getElementById("indicia-panel-b");
        if (panelB) panelB.classList.remove("hidden");
        updateIndiciaPanelB();
        showTripleSelectForm(branchConfig.multipleChoice);
    } else if (branchConfig.correctAnswers) {
        showDualPasswordForm();
    } else {
        showPasswordForm("Zadejte výsledné heslo úkolu:");
    }
}

function updateIndiciaPanelB() {
    const branchB = gameData.branches.B;
    if (!branchB) return;
    branchB.popups.forEach(popup => {
        const btn = document.getElementById(`indicia-btn-${popup.index}`);
        if (!btn) return;
        if (gameState.unlockedIndiciaB.has(popup.index)) {
            btn.disabled = false;
            btn.textContent = popup.name;
            btn.onclick = () => openPopupModal(popup.image);
        } else {
            btn.disabled = true;
            btn.textContent = `${popup.name} (Zamčeno)`;
        }
    });
}

function showTripleSelectForm(questions) {
    const form = document.getElementById("triple-select-form");
    if (!form || !questions) return;
    questions.forEach(q => {
        const label = document.getElementById(`label-${q.id}`);
        const select = document.getElementById(`select-${q.id}`);
        if (label) label.textContent = q.label;
        if (select) {
            select.innerHTML = '<option value="">-- Vyberte možnost --</option>';
            q.options.forEach(opt => {
                const option = document.createElement("option");
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
            });
        }
    });
    form.classList.remove("hidden");
}

function showGoogleFormsContainer(formUrl) {
    const container = document.getElementById("google-forms-container");
    const link = document.getElementById("google-forms-link");
    if (link && formUrl) link.href = formUrl;
    if (container) container.classList.remove("hidden");
}

function hideAllSections() {
    document.querySelectorAll(".screen-section").forEach(s => s.classList.add("hidden"));
    document.querySelectorAll(".control-form").forEach(f => f.classList.add("hidden"));

    const video = document.getElementById("game-video");
    if (video) {
        video.src = "";
    }

    const container = document.getElementById("image-container");
    if (container) container.innerHTML = "";

    const ctrlSec = document.getElementById("controls-section");
    if (ctrlSec) ctrlSec.classList.remove("hidden");
}

function showCardImages(images) {
    const container = document.getElementById("image-container");
    if (!container) return;
    container.innerHTML = "";
    const imgArray = Array.isArray(images) ? images : [images];

    imgArray.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Karta hry";
        container.appendChild(img);
    });

    const section = document.getElementById("card-display-section");
    if (section) section.classList.remove("hidden");
}

function showVideoSection(videoUrl) {
    const section = document.getElementById("video-section");
    const video = document.getElementById("game-video");
    if (video) {
        video.src = videoUrl;
    }
    if (section) section.classList.remove("hidden");
}

function showMapSection(targetGps) {
    const section = document.getElementById("map-section");
    if (section) section.classList.remove("hidden");

    gameState.selectedMapLatLng = null;
    const pinBtn = document.getElementById("confirm-pin-btn");
    if (pinBtn) pinBtn.disabled = true;

    if (!gameState.leafletMap && window.L) {
        gameState.leafletMap = L.map('interactive-map').setView([targetGps.lat, targetGps.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(gameState.leafletMap);

        gameState.leafletMap.on('click', (e) => {
            gameState.selectedMapLatLng = e.latlng;
            if (gameState.leafletMarker) {
                gameState.leafletMarker.setLatLng(e.latlng);
            } else {
                gameState.leafletMarker = L.marker(e.latlng).addTo(gameState.leafletMap);
            }
            const btn = document.getElementById("confirm-pin-btn");
            if (btn) btn.disabled = false;
        });
    } else if (gameState.leafletMap) {
        setTimeout(() => {
            gameState.leafletMap.invalidateSize();
        }, 100);
    }

    if (pinBtn) {
        pinBtn.onclick = () => {
            if (!gameState.selectedMapLatLng) return;
            const dist = getDistanceMeters(
                gameState.selectedMapLatLng.lat,
                gameState.selectedMapLatLng.lng,
                targetGps.lat,
                targetGps.lng
            );
            if (dist <= 50) {
                showFeedback("Správné místo na mapě!", false);
                setTimeout(() => {
                    const currentStep = gameData.steps[gameState.currentStepIndex];
                    handleStepCompletion(currentStep);
                }, 800);
            } else {
                showFeedback("Zkus to označit přesněji na jiném místě.", true);
            }
        };
    }
}

function showPasswordForm(label = "Zadejte heslo:") {
    const form = document.getElementById("password-form");
    if (!form) return;
    const lbl = form.querySelector(".form-label");
    if (lbl) lbl.textContent = label;
    const input = document.getElementById("password-input");
    if (input) input.value = "";
    form.classList.remove("hidden");
}

function showDualPasswordForm() {
    const form = document.getElementById("dual-password-form");
    if (!form) return;
    const p1 = document.getElementById("pass-input-1");
    const p2 = document.getElementById("pass-input-2");
    if (p1) p1.value = "";
    if (p2) p2.value = "";
    form.classList.remove("hidden");
}

function showTimerContainer() {
    const container = document.getElementById("timer-container");
    if (container) container.classList.remove("hidden");

    // Pokud už časovač běžel před obnovením stránky, plynule naváže
    if (gameState.lunchEndTime) {
        startLunchCountdown(gameState.lunchEndTime);
    }
}

function startLunchCountdown(endTime) {
    const startTimerBtn = document.getElementById("start-timer-btn");
    if (startTimerBtn) startTimerBtn.classList.add("hidden");

    if (gameState.lunchTimer) {
        clearInterval(gameState.lunchTimer);
    }

    const updateTimer = () => {
        const remainingMs = endTime - Date.now();
        gameState.lunchSecondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));

        const mins = Math.floor(gameState.lunchSecondsLeft / 60);
        const secs = gameState.lunchSecondsLeft % 60;
        const display = document.getElementById("timer-display");
        if (display) {
            display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        if (gameState.lunchSecondsLeft <= 0) {
            clearInterval(gameState.lunchTimer);
            document.removeEventListener("visibilitychange", updateTimer);
            const finishTimerBtn = document.getElementById("finish-timer-btn");
            if (finishTimerBtn) finishTimerBtn.classList.remove("hidden");
        }
    };

    updateTimer();
    gameState.lunchTimer = setInterval(updateTimer, 1000);
    document.addEventListener("visibilitychange", updateTimer);
}

function showNextStepContainer(buttonText = "Pokračovat", onClickCallback = null) {
    const container = document.getElementById("next-step-container");
    const btn = document.getElementById("next-step-btn");
    if (!btn || !container) return;

    btn.textContent = buttonText;
    btn.classList.remove("btn-success");
    btn.disabled = gameState.showingReportMode;

    btn.onclick = () => {
        if (onClickCallback) {
            onClickCallback();
        } else {
            advanceToNextStep();
        }
    };

    container.classList.remove("hidden");

    // Okamžité ověření polohy, pokud už hráč stojí v cílovém rádiusu
    if (gameState.showingReportMode) {
        checkReportGpsArrival();
    }
}

function showFeedback(message, isError = false) {
    const feedback = document.getElementById("feedback-message");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `feedback-msg ${isError ? 'error' : 'success'}`;
}

function clearFeedback() {
    const feedback = document.getElementById("feedback-message");
    if (!feedback) return;
    feedback.textContent = "";
    feedback.className = "feedback-msg";
}

function setupEventListeners() {
    const closeBtn = document.getElementById("close-modal-btn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            const modal = document.getElementById("popup-modal");
            if (modal) modal.classList.add("hidden");
        });
    }

    const drawBtn = document.getElementById("draw-btn");
    if (drawBtn) {
        drawBtn.addEventListener("click", () => {
            executeDraw();
        });
    }

    const passForm = document.getElementById("password-form");
    if (passForm) {
        passForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const inputPass = document.getElementById("password-input").value.trim().toLowerCase().replace(/\s+/g, " ");
            const currentStep = gameData.steps[gameState.currentStepIndex];

            if (gameState.currentActiveBranch) {
                validateBranchAnswer(inputPass);
                return;
            }

            if (currentStep && currentStep.correctAnswer) {
                if (inputPass === currentStep.correctAnswer.toLowerCase()) {
                    showFeedback("Správně!", false);
                    setTimeout(() => {
                        handleStepCompletion(currentStep);
                    }, 800);
                } else {
                    showFeedback("Nesprávné heslo, zkus to znovu.", true);
                }
            }
        });
    }

    // Vyhodnocení 3 výběrových otázek (Boží kámen - varianta B)
    const tripleForm = document.getElementById("triple-select-form");
    if (tripleForm) {
        tripleForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const q1 = document.getElementById("select-q1").value;
            const q2 = document.getElementById("select-q2").value;
            const q3 = document.getElementById("select-q3").value;
            const branchB = gameData.branches.B;

            if (q1 === branchB.multipleChoice[0].correct &&
                q2 === branchB.multipleChoice[1].correct &&
                q3 === branchB.multipleChoice[2].correct) {
                showFeedback("Všechny 3 odpovědi jsou správné!", false);
                setTimeout(() => {
                    finishBranchTask();
                }, 800);
            } else {
                showFeedback("Některá z odpovědí je nesprávná, zkontrolujte indicie a zkuste to znovu.", true);
            }
        });
    }

    // Vyhodnocení úkolu Skalka (varianta C)
    const dualForm = document.getElementById("dual-password-form");
    if (dualForm) {
        dualForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const pass1 = document.getElementById("pass-input-1").value.trim();
            const pass2 = document.getElementById("pass-input-2").value.trim();

            if (gameState.currentActiveBranch === "C") {
                const branch = gameData.branches["C"];
                const correct = branch.correctAnswers.map(a => String(a).trim());

                if (correct.includes(pass1) && correct.includes(pass2) && pass1 !== pass2) {
                    showFeedback("Obě data jsou správná!", false);
                    setTimeout(() => {
                        finishBranchTask();
                    }, 800);
                } else {
                    showFeedback("Nesprávně zadaná data, zkus to znovu.", true);
                }
            }
        });
    }

    const startTimerBtn = document.getElementById("start-timer-btn");
    if (startTimerBtn) {
        startTimerBtn.addEventListener("click", () => {
            gameState.lunchEndTime = Date.now() + gameState.lunchSecondsLeft * 1000;
            saveGameState();
            startLunchCountdown(gameState.lunchEndTime);
        });
    }

    const finishTimerBtn = document.getElementById("finish-timer-btn");
    if (finishTimerBtn) {
        finishTimerBtn.addEventListener("click", () => {
            advanceToNextStep();
        });
    }
}

function validateBranchAnswer(inputPass) {
    const branch = gameData.branches[gameState.currentActiveBranch];
    const validAnswers = branch.correctAnswer.split("/").map(a => a.trim().toLowerCase());

    if (validAnswers.some(ans => inputPass === ans)) {
        showFeedback("Správné heslo!", false);
        setTimeout(() => {
            finishBranchTask();
        }, 800);
    } else {
        showFeedback("Nesprávné heslo, zkus to znovu.", true);
    }
}

function finishBranchTask() {
    const finishedBranchId = gameState.currentActiveBranch;
    gameState.lastCompletedBranch = finishedBranchId;
    gameState.currentActiveBranch = null;
    gameState.uiPhase = "branch_done";
    saveGameState();

    renderBranchDoneReport(finishedBranchId);
}

function renderBranchDoneReport(branchId) {
    const branchConfig = gameData.branches[branchId];
    const roundKey = `round${gameState.branchRound}`;
    const doneReportImage = branchConfig.reports[roundKey].done;

    hideAllSections();
    clearFeedback();
    showCardImages([doneReportImage]);

    const nextStep = gameData.steps[gameState.currentStepIndex + 1];
    if (nextStep && nextStep.targetGps) {
        gameState.showingReportMode = true;
        gameState.currentTargetGps = nextStep.targetGps;
        showNextStepContainer("Čekám na příchod na GPS...", () => {
            advanceToNextStep();
        });
    } else {
        // Po 3. losování (následuje z9_potvrzeni_cile bez GPS)
        gameState.showingReportMode = false;
        gameState.currentTargetGps = null;
        showNextStepContainer("Pokračovat dál", () => {
            advanceToNextStep();
        });
    }
}

function handleStepCompletion(step) {
    const nextStep = gameData.steps[gameState.currentStepIndex + 1];

    if (step.reportImage || (nextStep && nextStep.type === "final_screen" && nextStep.targetGps)) {
        gameState.uiPhase = "step_report";
        saveGameState();
        renderStepReport(step);
    } else {
        advanceToNextStep();
    }
}

function renderStepReport(step) {
    const nextStep = gameData.steps[gameState.currentStepIndex + 1];

    if (step.reportImage) {
        hideAllSections();
        clearFeedback();
        showCardImages([step.reportImage]);

        if (step.id === "z4_labyrint") {
            gameState.showingReportMode = false;
            gameState.currentTargetGps = null;
            showNextStepContainer("Jsem ve Strakonicích", () => {
                advanceToNextStep();
            });
        } else if (nextStep && nextStep.targetGps) {
            gameState.showingReportMode = true;
            gameState.currentTargetGps = nextStep.targetGps;
            showNextStepContainer("Čekám na příchod na GPS...", () => {
                advanceToNextStep();
            });
        } else {
            gameState.showingReportMode = false;
            gameState.currentTargetGps = null;
            showNextStepContainer("Pokračovat dál", () => {
                advanceToNextStep();
            });
        }
    } else if (nextStep && nextStep.type === "final_screen" && nextStep.targetGps) {
        // Přechod ze z9_potvrzeni_cile na finální GPS u cíle hry
        hideAllSections();
        clearFeedback();
        showFeedback("Cíl zaměřen! Vyrazte na cílové souřadnice.", false);
        gameState.showingReportMode = true;
        gameState.currentTargetGps = nextStep.targetGps;
        showNextStepContainer("Čekám na příchod na GPS...", () => {
            advanceToNextStep();
        });
    } else {
        advanceToNextStep();
    }
}

function advanceToNextStep() {
    gameState.stepTransitionLock = false;
    gameState.uiPhase = "step";
    gameState.currentActiveBranch = null;
    gameState.lastCompletedBranch = null;
    gameState.lunchEndTime = null;
    gameState.currentStepIndex++;
    saveGameState();
    renderCurrentStep();
}