/* =========================================================
   TEAQUEST ARCADE
   MINI GAMES · PERFECT BREW · LEAF CATCH · TEA MEMORY
   Depends on globals from java.js (classic script scope)
======================================================== */

"use strict";


/* =========================================================
   ARCADE STATE HELPERS
======================================================== */

const ARCADE_GAMES = {
    "perfect-brew": { label: "PERFECT BREW", mode: "max" },
    "leaf-catch": { label: "LEAF CATCH", mode: "max" },
    "tea-memory": { label: "TEA MEMORY", mode: "min" }
};


function getHighScore(gameId) {

    if (!currentUser || !currentUser.highScores) {
        return null;
    }

    const value =
        currentUser.highScores[gameId];

    return typeof value === "number"
        ? value
        : null;

}


function saveArcadeScore(gameId, value) {

    const config =
        ARCADE_GAMES[gameId];

    if (!config || !currentUser) {

        return {
            isNewRecord: false,
            previous: null
        };

    }


    normalizeUser(currentUser);

    const previous =
        getHighScore(gameId);


    let isNewRecord = false;


    if (
        previous === null ||
        (config.mode === "max" &&
            value > previous) ||
        (config.mode === "min" &&
            value > 0 &&
            value < previous)
    ) {

        currentUser.highScores[gameId] = value;

        isNewRecord = true;

        saveCurrentUser();

    }


    return {
        isNewRecord,
        previous
    };

}


function recordArcadePlay() {

    if (!currentUser) return;

    normalizeUser(currentUser);

    currentUser.arcadePlays =
        (currentUser.arcadePlays || 0) + 1;

    saveCurrentUser();

    checkAchievements();

}


function awardArcadeXp(amount) {

    if (!currentUser || !amount) return;

    normalizeUser(currentUser);

    const previousLevel =
        getLevelInfo(currentUser.xp).level;

    currentUser.xp =
        Number(currentUser.xp || 0) + amount;

    const newLevel =
        getLevelInfo(currentUser.xp).level;


    saveCurrentUser();


    if (newLevel > previousLevel) {
        showLevelUp(newLevel);
    }

}


function renderArcadeBests() {

    const brewBest =
        $("#bestPerfectBrew");

    const leafBest =
        $("#bestLeafCatch");

    const memoryBest =
        $("#bestTeaMemory");


    const brew =
        getHighScore("perfect-brew");

    const leaf =
        getHighScore("leaf-catch");

    const memory =
        getHighScore("tea-memory");


    if (brewBest) {
        brewBest.textContent =
            brew === null ? "—" : `${brew} cups`;
    }

    if (leafBest) {
        leafBest.textContent =
            leaf === null ? "—" : `${leaf} pts`;
    }

    if (memoryBest) {
        memoryBest.textContent =
            memory === null ? "—" : `${memory} moves`;
    }

}


window.renderArcadeRecords = function () {

    const container =
        $("#arcadeRecords");

    if (!container) return;


    if (!currentUser) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🕹</div>
                <p>Log in to save your arcade records.</p>
            </div>
        `;

        return;

    }


    normalizeUser(currentUser);


    container.innerHTML = Object
        .keys(ARCADE_GAMES)
        .map(gameId => {

            const config =
                ARCADE_GAMES[gameId];

            const value =
                getHighScore(gameId);

            const display =
                gameId === "tea-memory"
                    ? (value === null ? "—" : `${value} MOVES`)
                    : (value === null ? "—" : `${value}`);

            const suffix =
                gameId === "perfect-brew" && value !== null
                    ? " CUPS"
                    : gameId === "leaf-catch" && value !== null
                        ? " PTS"
                        : "";


            return `
                <div class="arcade-record">

                    <span class="arcade-record-icon">
                        ${gameId === "perfect-brew" ? "☕" : gameId === "leaf-catch" ? "🍃" : "🃏"}
                    </span>

                    <strong>${config.label}</strong>

                    <span class="arcade-record-value">
                        ${display}${suffix}
                    </span>

                </div>
            `;

        })
        .join("");

};


/* =========================================================
   GAME LIFECYCLE — stop loops when a modal closes
======================================================== */

function watchModalClose(modal, onStop) {

    const observer =
        new MutationObserver(() => {

            if (!modal.classList.contains("open")) {
                onStop();
            }

        });

    observer.observe(modal, {
        attributes: true,
        attributeFilter: ["class"]
    });

}


function canvasX(canvas, clientX) {

    const rect =
        canvas.getBoundingClientRect();

    return (clientX - rect.left) *
        (canvas.width / rect.width);

}


/* =========================================================
   ARCADE INITIALIZATION
======================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeArcadePage();

    initializePerfectBrew();

    initializeLeafCatch();

    initializeTeaMemory();

});


function initializeArcadePage() {

    $("#playPerfectBrew")?.addEventListener(
        "click",
        openPerfectBrew
    );

    $("#playLeafCatch")?.addEventListener(
        "click",
        openLeafCatch
    );

    $("#playTeaMemory")?.addEventListener(
        "click",
        openTeaMemory
    );


    document.addEventListener("click", event => {

        const target =
            event.target.closest("[data-page]");

        if (target && target.dataset.page === "arcade") {
            setTimeout(renderArcadeBests, 50);
        }

    });

    renderArcadeBests();

}


/* =========================================================
   GAME 1 — PERFECT BREW
======================================================== */

let brewRunning = false;

let brewNeedleT = 0;

let brewSpeed = 2.4;

let brewStreakValue = 0;

let brewRunXp = 0;

let brewZone = null;

let brewLastFrame = 0;

let brewRafId = null;


const BREW_TRACK_START = 50;

const BREW_TRACK_END = 370;


function openPerfectBrew() {

    const modal =
        $("#perfectBrewModal");

    if (!modal) return;

    resetBrewGame(true);

    openModal(modal);

    startBrewLoop();

}


function resetBrewGame(idleMode) {

    brewStreakValue = 0;

    brewRunXp = 0;

    brewSpeed = 2.4;

    brewNeedleT = 0;

    newBrewZone();

    updateBrewHud();

    drawBrewFrame();


    $("#brewRestart")?.classList.add("hidden-field");

    $("#brewButton")?.classList.remove("hidden-field");

    $("#brewHint").textContent =
        "Press SPACE or tap BREW when the needle is in the green zone.";


    if (idleMode && !brewRunning) {
        /* keep drawing idle animation */
    }

}


function newBrewZone() {

    const shrink =
        Math.min(
            56,
            brewStreakValue * 2.6
        );


    const width =
        Math.max(34, 92 - shrink);

    const center =
        BREW_TRACK_START + width / 2 +
        Math.random() * (
            BREW_TRACK_END -
            BREW_TRACK_START - width
        );

    const perfectWidth =
        Math.max(10, width * 0.42);


    brewZone = {
        center,
        width,
        perfect: perfectWidth
    };

}


function needlePosition() {

    const amplitude =
        (BREW_TRACK_END - BREW_TRACK_START) / 2;

    const mid =
        (BREW_TRACK_END + BREW_TRACK_START) / 2;

    return mid +
        Math.sin(brewNeedleT * brewSpeed) * amplitude;

}


function startBrewLoop() {

    stopBrewLoop();

    recordArcadePlay();

    brewRunning = true;

    brewLastFrame = performance.now();


    const step = now => {

        if (!brewRunning) return;


        const delta =
            (now - brewLastFrame) / 1000;

        brewLastFrame = now;

        brewNeedleT += delta;


        drawBrewFrame();

        brewRafId =
            requestAnimationFrame(step);

    };


    brewRafId =
        requestAnimationFrame(step);

}


function stopBrewLoop() {

    brewRunning = false;

    if (brewRafId) {

        cancelAnimationFrame(brewRafId);

        brewRafId = null;

    }

}


function drawBrewFrame() {

    const canvas =
        $("#brewCanvas");

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    const W = canvas.width;

    const H = canvas.height;


    ctx.clearRect(0, 0, W, H);


    /* track */

    ctx.fillStyle = "#203228";

    ctx.fillRect(
        BREW_TRACK_START - 10,
        132,
        BREW_TRACK_END - BREW_TRACK_START + 20,
        26
    );

    ctx.strokeStyle = "#344d3e";

    ctx.lineWidth = 4;

    ctx.strokeRect(
        BREW_TRACK_START - 10,
        132,
        BREW_TRACK_END - BREW_TRACK_START + 20,
        26
    );



    /* zones */

    if (brewZone) {

        ctx.fillStyle = "#32633c";

        ctx.fillRect(
            brewZone.center - brewZone.width / 2,
            136,
            brewZone.width,
            18
        );

        ctx.fillStyle = "#75d66b";

        ctx.fillRect(
            brewZone.center - brewZone.perfect / 2,
            140,
            brewZone.perfect,
            10
        );

    }



    /* needle */

    const nx =
        brewRunning || brewZone
            ? needlePosition()
            : (BREW_TRACK_START + BREW_TRACK_END) / 2;


    ctx.fillStyle = "#f4e6bd";

    ctx.fillRect(nx - 3, 112, 6, 66);



    /* teacup */

    const fill =
        Math.min(1, brewStreakValue / 15);

    const cupY = 236;


    ctx.fillStyle = "#f4e6bd";

    ctx.fillRect(W / 2 - 44, cupY, 88, 46);

    ctx.fillRect(W / 2 + 44, cupY + 8, 16, 22);

    ctx.fillStyle = "#17251d";

    ctx.fillRect(W / 2 - 36, cupY + 8, 72, 30);


    ctx.fillStyle =
        fill > 0 ? "#75d66b" : "#24352a";

    ctx.fillRect(
        W / 2 - 36,
        cupY + 8 + 30 - 30 * fill,
        72,
        30 * fill
    );



    /* steam */

    ctx.fillStyle = "rgba(244,230,189,.35)";

    for (let i = 0; i < 3; i++) {

        const sway =
            Math.sin(brewNeedleT * 3 + i * 2) * 6;

        ctx.fillRect(
            W / 2 - 18 + i * 16 + sway,
            cupY - 26 - i * 4,
            5,
            14
        );

    }



    /* status text */

    ctx.font = "13px 'Press Start 2P', monospace";

    ctx.textAlign = "center";

    ctx.fillStyle = "#a7f29a";

    ctx.fillText(
        brewStreakValue > 0
            ? `STREAK ${brewStreakValue}`
            : "READY TO BREW",
        W / 2,
        60
    );

}


function updateBrewHud() {

    $("#brewStreak").textContent =
        brewStreakValue;

    $("#brewHeat").textContent =
        `x${Math.floor(brewStreakValue / 5) + 1}`;

    const best =
        getHighScore("perfect-brew");

    $("#brewBestHud").textContent =
        best === null ? 0 : best;

}


function brewAttempt() {

    if (!$("#perfectBrewModal")?.classList.contains("open")) {
        return;
    }


    if (!brewRunning) {

        /* starting fresh after game over */

        resetBrewGame(false);

        startBrewLoop();

        return;

    }


    const nx =
        needlePosition();


    const distance =
        Math.abs(nx - brewZone.center);


    if (distance <= brewZone.perfect / 2) {

        brewStreakValue++;

        brewRunXp += 2;

        brewSpeed =
            Math.min(7, brewSpeed + 0.28);


        toast(
            "PERFECT BREW ☕",
            `Streak ${brewStreakValue}. +2 XP`
        );


        newBrewZone();

        updateBrewHud();

        drawBrewFrame();

        checkAchievements();

        return;

    }


    if (distance <= brewZone.width / 2) {

        toast(
            "A BITTER SIP",
            "Close, but only the green zone counts."
        );

        return;

    }


    endBrewRun();

}


function endBrewRun() {

    stopBrewLoop();


    const result =
        saveArcadeScore("perfect-brew", brewStreakValue);


    if (currentUser && brewRunXp > 0) {
        awardArcadeXp(brewRunXp);
    }


    checkAchievements();

    renderArcadeBests();


    let message =
        `You brewed ${brewStreakValue} perfect cups.` +
        (brewRunXp > 0 ? ` +${brewRunXp} XP` : "");


    if (result.isNewRecord && brewStreakValue > 0) {
        message += " NEW RECORD!";
    }


    if (!currentUser && brewStreakValue > 0) {
        message += " Log in to keep records.";
    }


    $("#brewHint").textContent = message;


    $("#brewButton")?.classList.add("hidden-field");

    $("#brewRestart")?.classList.remove("hidden-field");

}


function initializePerfectBrew() {

    const modal =
        $("#perfectBrewModal");

    if (!modal) return;


    watchModalClose(modal, stopBrewLoop);


    $("#closePerfectBrew")?.addEventListener(
        "click",
        () => closeModal(modal)
    );


    $("#brewButton")?.addEventListener(
        "click",
        brewAttempt
    );

    $("#brewRestart")?.addEventListener(
        "click",
        () => {

            resetBrewGame(false);

            startBrewLoop();

        }
    );


    $("#brewCanvas")?.addEventListener(
        "pointerdown",
        brewAttempt
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Space" &&
                modal.classList.contains("open")
            ) {

                event.preventDefault();

                brewAttempt();

            }

        }
    );

}


/* =========================================================
   GAME 2 — LEAF CATCH
======================================================== */

let leafRunning = false;

let leafItems = [];

let leafScoreValue = 0;

let leafLivesLeft = 3;

let leafCupX = 210;

let leafSpawnTimer = 0;

let leafElapsed = 0;

let leafLastFrame = 0;

let leafRafId = null;

let leafKeys = { left: false, right: false };


const LEAF_W = 420;

const LEAF_H = 480;

const LEAF_CUP_Y = 420;


function openLeafCatch() {

    const modal =
        $("#leafCatchModal");

    if (!modal) return;

    resetLeafGame();

    openModal(modal);

}


function resetLeafGame() {

    stopLeafLoop();

    leafItems = [];

    leafScoreValue = 0;

    leafLivesLeft = 3;

    leafCupX = LEAF_W / 2;

    leafSpawnTimer = 0;

    leafElapsed = 0;


    updateLeafHud();

    drawLeafIdle();

    $("#leafStart")?.classList.remove("hidden-field");

    $("#leafHint").textContent =
        "Move with mouse, touch or ← → keys.";

}


function startLeafGame() {

    resetLeafGame();

    $("#leafStart")?.classList.add("hidden-field");

    recordArcadePlay();

    leafRunning = true;

    leafLastFrame = performance.now();

    leafRafId =
        requestAnimationFrame(leafStep);

}


function stopLeafLoop() {

    leafRunning = false;

    if (leafRafId) {

        cancelAnimationFrame(leafRafId);

        leafRafId = null;

    }

}


function spawnLeafItem() {

    const roll =
        Math.random();


    let type = "leaf";

    if (roll > 0.86) type = "rock";
    else if (roll > 0.74) type = "gold";


    leafItems.push({
        x: 30 + Math.random() * (LEAF_W - 60),
        y: -20,

        type,

        vy:
            type === "gold" ? 2.6 : 2.2,

        spin:
            Math.random() * Math.PI * 2
    });

}


function leafStep(now) {

    if (!leafRunning) return;


    const delta =
        Math.min(
            0.05,
            (now - leafLastFrame) / 1000
        );

    leafLastFrame = now;

    leafElapsed += delta;


    /* difficulty ramps */

    const fallBoost =
        Math.min(2.6, leafElapsed * 0.09);

    const spawnEvery =
        Math.max(0.38, 0.95 - leafElapsed * 0.02);


    /* keyboard movement */

    const cupSpeed = 320;

    if (leafKeys.left) {
        leafCupX -= cupSpeed * delta;
    }

    if (leafKeys.right) {
        leafCupX += cupSpeed * delta;
    }


    leafCupX =
        Math.max(
            36,
            Math.min(LEAF_W - 36, leafCupX)
        );


    /* spawning */

    leafSpawnTimer += delta;

    if (leafSpawnTimer >= spawnEvery) {

        leafSpawnTimer = 0;

        spawnLeafItem();

    }


    /* items physics */

    for (const item of leafItems) {

        item.y +=
            item.vy * (1 + fallBoost * 0.55) * 60 * delta;

        item.spin += delta * 2;

    }


    /* catching */

    for (const item of leafItems) {

        if (item.caught) continue;


        if (
            item.y >= LEAF_CUP_Y - 14 &&
            item.y <= LEAF_CUP_Y + 22 &&
            Math.abs(item.x - leafCupX) <= 34
        ) {

            item.caught = true;


            if (item.type === "rock") {

                leafLivesLeft--;

                pulseScreen();

                toast(
                    "OUCH!",
                    "A rock cracked your cup."
                );


                if (leafLivesLeft <= 0) {
                    endLeafGame();
                    return;
                }

            } else {

                leafScoreValue +=
                    item.type === "gold" ? 50 : 10;

            }

        }

    }


    leafItems =
        leafItems.filter(
            item =>
                !item.caught && item.y < LEAF_H + 30
        );


    updateLeafHud();

    drawLeafFrame();


    leafRafId =
        requestAnimationFrame(leafStep);

}


function drawLeafIdle() {

    const canvas =
        $("#leafCanvas");

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");


    ctx.clearRect(0, 0, LEAF_W, LEAF_H);

    drawLeafCup(ctx);

}


function drawLeafCup(ctx) {

    ctx.save();

    ctx.translate(leafCupX, LEAF_CUP_Y);


    ctx.fillStyle = "#f4e6bd";

    ctx.fillRect(-34, 0, 68, 34);

    ctx.fillRect(34, 6, 14, 16);

    ctx.fillStyle = "#17251d";

    ctx.fillRect(-27, 6, 54, 22);

    ctx.fillStyle = "#32633c";

    ctx.fillRect(-27, 6, 54, 6);

    ctx.restore();

}


function drawLeafFrame() {

    const canvas =
        $("#leafCanvas");

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");


    ctx.clearRect(0, 0, LEAF_W, LEAF_H);


    ctx.font = "26px serif";

    ctx.textAlign = "center";


    for (const item of leafItems) {


        ctx.save();

        ctx.translate(item.x, item.y);

        ctx.rotate(Math.sin(item.spin) * 0.4);


        if (item.type === "leaf") {
            ctx.fillText("🍃", 0, 0);
        } else if (item.type === "gold") {

            ctx.shadowColor = "#f5c95d";

            ctx.fillText("✨", 0, 0);

        } else {
            ctx.fillText("🪨", 0, 0);
        }


        ctx.restore();

    }


    drawLeafCup(ctx);

}


function updateLeafHud() {

    $("#leafScore").textContent =
        leafScoreValue;


    $("#leafLives").textContent =
        "♥".repeat(Math.max(0, leafLivesLeft)) +
        "·".repeat(Math.max(0, 3 - leafLivesLeft));


    const best =
        getHighScore("leaf-catch");

    $("#leafBestHud").textContent =
        best === null ? 0 : best;

}


function endLeafGame() {

    stopLeafLoop();


    const xpEarned =
        Math.min(
            30,
            Math.floor(leafScoreValue / 20)
        );


    const result =
        saveArcadeScore("leaf-catch", leafScoreValue);


    if (xpEarned > 0) {
        awardArcadeXp(xpEarned);
    }

    checkAchievements();

    renderArcadeBests();


    let message =
        `Final score ${leafScoreValue}.` +
        (xpEarned > 0 ? ` +${xpEarned} XP` : "");


    if (result.isNewRecord && leafScoreValue > 0) {
        message += " NEW RECORD!";
    }


    if (!currentUser) {
        message += " Log in to keep records.";
    }


    $("#leafHint").textContent = message;

    $("#leafStart")?.classList.remove("hidden-field");

    $("#leafStart").textContent = "↻ PLAY AGAIN";

}


function initializeLeafCatch() {

    const modal =
        $("#leafCatchModal");

    if (!modal) return;


    const canvas =
        $("#leafCanvas");


    watchModalClose(modal, stopLeafLoop);


    $("#closeLeafCatch")?.addEventListener(
        "click",
        () => closeModal(modal)
    );


    $("#leafStart")?.addEventListener(
        "click",
        startLeafGame
    );


    canvas?.addEventListener(
        "pointermove",
        event => {

            if (!modal.classList.contains("open")) return;

            leafCupX =
                Math.max(
                    36,
                    Math.min(
                        LEAF_W - 36,
                        canvasX(canvas, event.clientX)
                    )
                );

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (!modal.classList.contains("open")) return;


            if (event.key === "ArrowLeft") {
                leafKeys.left = true;
            }

            if (event.key === "ArrowRight") {
                leafKeys.right = true;
            }

        }
    );


    document.addEventListener(
        "keyup",
        event => {

            if (event.key === "ArrowLeft") {
                leafKeys.left = false;
            }

            if (event.key === "ArrowRight") {
                leafKeys.right = false;
            }

        }
    );

}


/* =========================================================
   GAME 3 — TEA MEMORY
======================================================== */

let memoryDeck = [];

let memoryFirstCard = null;

let memorySecondCard = null;

let memoryMovesCount = 0;

let memoryPairsFound = 0;

let memoryLockInput = false;


function buildMemoryDeck() {

    const pool =
        products.slice(0, 8);


    const deck = [];


    pool.forEach((product, index) => {

        deck.push({
            id: `${product.id}-a`,
            pairKey: product.id,
            icon: product.icon || "🍵",
            productId: product.id,
            name: product.name
        });

        deck.push({
            id: `${product.id}-b`,
            pairKey: product.id,
            icon: product.icon || "🍵",
            productId: product.id,
            name: product.name
        });

    });


    for (let i = deck.length - 1; i > 0; i--) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [deck[i], deck[j]] =
            [deck[j], deck[i]];

    }


    return deck;

}


function openTeaMemory() {

    const modal =
        $("#memoryModal");

    if (!modal) return;

    openModal(modal);

    startMemoryGame();

}


function startMemoryGame() {

    memoryDeck =
        buildMemoryDeck();

    memoryFirstCard = null;

    memorySecondCard = null;

    memoryMovesCount = 0;

    memoryPairsFound = 0;

    memoryLockInput = false;


    recordArcadePlay();

    renderMemoryGrid();

    updateMemoryHud();


    $("#memoryHint").textContent =
        "Matched pairs discover their tea in your Codex.";

}


function renderMemoryGrid() {

    const container =
        $("#memoryGrid");

    if (!container) return;


    container.innerHTML =
        memoryDeck.map(card => `

            <button
                class="memory-card"
                data-card-id="${escapeHTML(card.id)}"
                data-pair-key="${escapeHTML(card.pairKey)}"
                aria-label="Hidden tea card"
            >

                <span class="memory-card-inner">

                    <span class="memory-face memory-back">?</span>

                    <span class="memory-face memory-front">
                        ${escapeHTML(card.icon)}
                    </span>

                </span>

            </button>

        `).join("");


    container
        .querySelectorAll("[data-card-id]")
        .forEach(element => {

            element.addEventListener(
                "click",
                () =>
                    attemptMemoryCard(element)
            );

        });

}


function findMemoryCard(element) {

    return memoryDeck.find(
        card =>
            card.id === element.dataset.cardId
    );

}


function attemptMemoryCard(element) {

    if (memoryLockInput) return;


    if (element.classList.contains("matched")) return;


    if (
        memoryFirstCard &&
        memoryFirstCard.element === element
    ) return;


    const card =
        findMemoryCard(element);

    if (!card) return;


    element.classList.add("flipped");


    if (!memoryFirstCard) {

        memoryFirstCard = {
            ...card,
            element
        };

        return;

    }


    memorySecondCard = {
        ...card,
        element
    };

    memoryMovesCount++;


    updateMemoryHud();


    if (
        memoryFirstCard.pairKey ===
        memorySecondCard.pairKey
    ) {

        handleMemoryMatch();

    } else {

        handleMemoryMismatch();

    }

}


function handleMemoryMatch() {

    memoryFirstCard.element.classList.add("matched");

    memorySecondCard.element.classList.add("matched");


    bumpElement(memoryFirstCard.element, "confirmed");

    bumpElement(memorySecondCard.element, "confirmed");


    discoverTea(memoryFirstCard.productId);


    memoryPairsFound++;


    memoryFirstCard = null;

    memorySecondCard = null;


    if (memoryPairsFound >= 8) {

        finishMemoryGame();

    }

}


function handleMemoryMismatch() {

    memoryLockInput = true;


    const first =
        memoryFirstCard;

    const second =
        memorySecondCard;


    setTimeout(() => {

        first.element.classList.remove("flipped");

        second.element.classList.remove("flipped");


        memoryFirstCard = null;

        memorySecondCard = null;

        memoryLockInput = false;

    }, 750);

}


function updateMemoryHud() {

    $("#memoryMoves").textContent =
        memoryMovesCount;

    $("#memoryPairs").textContent =
        `${memoryPairsFound} / 8`;

    const best =
        getHighScore("tea-memory");

    $("#memoryBestHud").textContent =
        best === null ? "—" : best;

}


function finishMemoryGame() {


    let xpEarned = 10;

    if (memoryMovesCount <= 14) xpEarned = 30;
    else if (memoryMovesCount <= 20) xpEarned = 20;


    const result =
        saveArcadeScore("tea-memory", memoryMovesCount);


    awardArcadeXp(xpEarned);

    checkAchievements();

    renderArcadeBests();


    let message =
        `All teas matched in ${memoryMovesCount} moves! ` +
        `+${xpEarned} XP`;


    if (result.isNewRecord) {
        message += " NEW RECORD!";
    }


    $("#memoryHint").textContent = message;

}


function initializeTeaMemory() {

    const modal =
        $("#memoryModal");

    if (!modal) return;


    $("#closeMemory")?.addEventListener(
        "click",
        () => closeModal(modal)
    );


    $("#memoryRestart")?.addEventListener(
        "click",
        startMemoryGame
    );

}
