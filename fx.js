"use strict";


/* =========================================================
   FX ENGINE — chiptune synth, confetti, screen juice
   Loads after java.js, before arcade.js.
   Wraps toast()/showLevelUp() so every system gets sound
   for free, exposes window.sfx / window.confettiBurst /
   window.legendaryPulse for direct calls.
========================================================= */


const FX_STORAGE_KEY =
    "teaquest_sound";


const FX_REDUCED_MOTION =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;


let fxMuted =
    localStorage.getItem(
        FX_STORAGE_KEY
    ) === "off";


/* =========================================================
   AUDIO ENGINE
========================================================= */

let fxContext = null;

let fxMasterGain = null;


function fxReady() {

    if (fxMuted) {
        return false;
    }

    if (!fxContext) {

        const AudioCtx =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioCtx) {
            return false;
        }

        fxContext =
            new AudioCtx();

        fxMasterGain =
            fxContext.createGain();

        fxMasterGain.gain.value =
            0.12;

        fxMasterGain.connect(
            fxContext.destination
        );

    }

    if (fxContext.state === "suspended") {
        fxContext.resume();
    }

    return true;

}


function tone(options) {

    /* options: freq, end?, dur, type?, delay?, vol? */

    if (!fxReady()) {
        return;
    }

    const startAt =
        fxContext.currentTime +
        (options.delay || 0);

    const oscillator =
        fxContext.createOscillator();

    const envelope =
        fxContext.createGain();


    oscillator.type =
        options.type || "square";


    oscillator.frequency.setValueAtTime(
        options.freq,
        startAt
    );


    if (options.end) {

        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(30, options.end),
            startAt + options.dur
        );

    }


    envelope.gain.setValueAtTime(
        options.vol || 0.4,
        startAt
    );


    envelope.gain.exponentialRampToValueAtTime(
        0.001,
        startAt + options.dur
    );


    oscillator.connect(envelope);

    envelope.connect(fxMasterGain);


    oscillator.start(startAt);

    oscillator.stop(startAt + options.dur + 0.02);

}


/* =========================================================
   SOUND LIBRARY
========================================================= */

const sfx = {

    blip() {

        tone({
            freq: 880,
            dur: 0.05,
            type: "square",
            vol: 0.22
        });

    },

    coin() {

        tone({
            freq: 988,
            dur: 0.07,
            type: "square",
            vol: 0.38
        });

        tone({
            freq: 1319,
            dur: 0.18,
            type: "square",
            vol: 0.38,
            delay: 0.07
        });

    },

    discovery() {

        [660, 880, 1175]
            .forEach((freq, index) =>
                tone({
                    freq,
                    dur: 0.09,
                    type: "triangle",
                    vol: 0.38,
                    delay: index * 0.06
                })
            );

    },

    achievement() {

        [523, 659, 784, 1047]
            .forEach((freq, index) =>
                tone({
                    freq,
                    dur: 0.11,
                    type: "square",
                    vol: 0.32,
                    delay: index * 0.08
                })
            );

    },

    levelUp() {

        [392, 523, 659, 784, 1047, 1319]
            .forEach((freq, index) =>
                tone({
                    freq,
                    dur: 0.13,
                    type: "square",
                    vol: 0.3,
                    delay: index * 0.085
                })
            );

    },

    legendary() {

        [523, 659, 784, 1047, 1319, 1568, 2093]
            .forEach((freq, index) =>
                tone({
                    freq,
                    dur: 0.14,
                    type: "square",
                    vol: 0.3,
                    delay: index * 0.07
                })
            );

        [2093, 2637]
            .forEach((freq, index) =>
                tone({
                    freq,
                    dur: 0.3,
                    type: "triangle",
                    vol: 0.22,
                    delay: 0.5 + index * 0.12
                })
            );

    },

    perfect() {

        tone({
            freq: 784,
            dur: 0.06,
            type: "triangle",
            vol: 0.38
        });

        tone({
            freq: 1046,
            dur: 0.14,
            type: "triangle",
            vol: 0.38,
            delay: 0.06
        });

    },

    bitter() {

        tone({
            freq: 240,
            end: 175,
            dur: 0.15,
            type: "sawtooth",
            vol: 0.28
        });

    },

    miss() {

        tone({
            freq: 320,
            end: 130,
            dur: 0.35,
            type: "square",
            vol: 0.32
        });

    },

    gameOver() {

        [330, 262, 196]
            .forEach((freq, index) =>
                tone({
                    freq,
                    dur: 0.18,
                    type: "sawtooth",
                    vol: 0.28,
                    delay: index * 0.16
                })
            );

    },

    hurt() {

        tone({
            freq: 185,
            end: 85,
            dur: 0.12,
            type: "sawtooth",
            vol: 0.38
        });

    },

    grab() {

        tone({
            freq: 700,
            dur: 0.05,
            type: "triangle",
            vol: 0.34
        });

    },

    gold() {

        tone({
            freq: 1319,
            dur: 0.06,
            type: "triangle",
            vol: 0.34
        });

        tone({
            freq: 1760,
            dur: 0.16,
            type: "triangle",
            vol: 0.34,
            delay: 0.05
        });

    },

    tick() {

        tone({
            freq: 1200,
            dur: 0.03,
            type: "square",
            vol: 0.14
        });

    },

    flip() {

        tone({
            freq: 520,
            dur: 0.04,
            type: "triangle",
            vol: 0.28
        });

    },

    match() {

        tone({
            freq: 880,
            dur: 0.06,
            type: "triangle",
            vol: 0.34
        });

        tone({
            freq: 1175,
            dur: 0.12,
            type: "triangle",
            vol: 0.34,
            delay: 0.06
        });

    },

    victory() {

        [784, 659, 880, 1047]
            .forEach((freq, index) =>
                tone({
                    freq,
                    dur: 0.14,
                    type: "triangle",
                    vol: 0.32,
                    delay: index * 0.1
                })
            );

    },

    record() {

        tone({
            freq: 480,
            end: 1050,
            dur: 0.32,
            type: "square",
            vol: 0.28
        });

    }

};


window.sfx = sfx;


/* =========================================================
   CONFETTI
========================================================= */

const FX_CONFETTI_COLORS = [
    "#f5c95d",
    "#75d66b",
    "#f4e6bd",
    "#a8f0c0",
    "#e88b4e"
];


let fxConfettiLayer = null;

let fxConfettiPieces = [];

let fxConfettiRunning = false;

let fxConfettiLastFrame = 0;


function fxEnsureConfettiLayer() {

    if (fxConfettiLayer) {
        return;
    }

    fxConfettiLayer =
        document.createElement("div");

    fxConfettiLayer.className =
        "fx-confetti-layer";

    document.body.appendChild(
        fxConfettiLayer
    );

}


function fxConfettiStep(now) {

    const delta =
        Math.min(0.05,
            (now - fxConfettiLastFrame) / 1000
        ) || 0.016;

    fxConfettiLastFrame = now;


    for (let index =
        fxConfettiPieces.length - 1;
        index >= 0;
        index--) {

        const piece =
            fxConfettiPieces[index];

        piece.life -= delta;

        piece.vy += 900 * delta;

        piece.vx *= 0.995;

        piece.x += piece.vx * delta;

        piece.y += piece.vy * delta;

        piece.rot +=
            piece.vr * delta;


        if (
            piece.life <= 0 ||
            piece.y > window.innerHeight + 60
        ) {

            piece.el.remove();

            fxConfettiPieces.splice(index, 1);

            continue;

        }


        const fade =
            Math.min(1, piece.life / 0.35);

        piece.el.style.opacity =
            fade;

        piece.el.style.transform =
            `translate3d(${piece.x}px, ${piece.y}px, 0) rotate(${piece.rot}deg)`;

    }


    if (fxConfettiPieces.length) {

        requestAnimationFrame(
            fxConfettiStep
        );

    } else {

        fxConfettiRunning = false;

    }

}


function confettiBurst(
    originX,
    originY,
    count = 26
) {

    if (FX_REDUCED_MOTION) {
        return;
    }

    fxEnsureConfettiLayer();


    for (let index = 0; index < count; index++) {

        const angle =
            (-20 - Math.random() * 140) *
            Math.PI / 180;

        const speed =
            220 + Math.random() * 320;

        const size =
            6 + Math.floor(Math.random() * 6);

        const element =
            document.createElement("div");


        element.className =
            "fx-confetti-piece";


        element.style.width =
            `${size}px`;

        element.style.height =
            `${size}px`;

        element.style.background =
            FX_CONFETTI_COLORS[
                Math.floor(
                    Math.random() *
                    FX_CONFETTI_COLORS.length
                )
            ];


        fxConfettiLayer.appendChild(
            element
        );


        fxConfettiPieces.push({

            el: element,

            x: originX,

            y: originY,

            vx: Math.cos(angle) * speed,

            vy: Math.sin(angle) * speed,

            rot: Math.random() * 360,

            vr:
                (Math.random() - 0.5) * 1440,

            life: 1 + Math.random() * 0.5

        });

    }


    if (!fxConfettiRunning) {

        fxConfettiRunning = true;

        fxConfettiLastFrame =
            performance.now();

        requestAnimationFrame(
            fxConfettiStep
        );

    }

}


window.confettiBurst =
    confettiBurst;


/* =========================================================
   SCREEN JUICE
========================================================= */

function legendaryPulse() {

    pulseScreen();


    const flash =
        $("#screenFlash");


    if (flash) {

        flash.classList.add("fx-gold");

        setTimeout(
            () => flash.classList.remove("fx-gold"),
            650
        );

    }


    if (FX_REDUCED_MOTION) {
        return;
    }


    document.body.classList.remove(
        "fx-shake"
    );

    void document.body.offsetWidth;

    document.body.classList.add(
        "fx-shake"
    );

}


window.legendaryPulse =
    legendaryPulse;


document.addEventListener(
    "animationend",
    event => {

        if (
            event.target === document.body &&
            event.animationName === "fx-shake-kf"
        ) {

            document.body.classList.remove(
                "fx-shake"
            );

        }

    }
);


/* =========================================================
   AUTO-HOOKS — wrap toast & level-up so the whole app
   gains sound without touching every call site
========================================================= */

function fxPlayToastSound(title) {

    const label =
        String(title || "").toUpperCase();


    if (label.includes("ACHIEVEMENT")) {

        sfx.achievement();

        return;

    }


    if (
        label.includes("DISCOVERY") ||
        label.includes("CODEX")
    ) {

        sfx.discovery();

        return;

    }


    if (
        label.includes("ITEM ACQUIRED") ||
        label.includes("CART") ||
        label.includes("ORDER")
    ) {

        sfx.coin();

    }

}


const fxOriginalToast =
    toast;


toast = function fxToast(title, message) {

    fxPlayToastSound(title);

    return fxOriginalToast(title, message);

};


const fxOriginalShowLevelUp =
    showLevelUp;


showLevelUp = function fxShowLevelUp(level) {

    fxOriginalShowLevelUp(level);

    sfx.levelUp();

    confettiBurst(
        window.innerWidth / 2,
        window.innerHeight / 2.4,
        34
    );

};


/* subtle UI blip on real button presses */

let fxLastBlip = 0;


document.addEventListener(
    "pointerdown",
    event => {

        const target =
            event.target.closest(
                ".pixel-button, .icon-button, .account-button, .nav-button, .modal-close, .memory-card:not(.flipped):not(.matched)"
            );

        if (!target) {
            return;
        }


        const now =
            performance.now();

        if (now - fxLastBlip < 70) {
            return;
        }

        fxLastBlip = now;

        sfx.blip();

    }
);


/* =========================================================
   MUTE TOGGLE
========================================================= */

function fxUpdateSoundButton() {

    const button =
        $("#soundButton");

    if (!button) {
        return;
    }

    button.textContent =
        fxMuted ? "🔇" : "🔊";

    button.title =
        fxMuted
            ? "Sound: OFF"
            : "Sound: ON";

}


$("#soundButton")?.addEventListener(
    "click",
    () => {

        fxMuted = !fxMuted;

        localStorage.setItem(
            FX_STORAGE_KEY,
            fxMuted ? "off" : "on"
        );

        fxUpdateSoundButton();

        if (!fxMuted) {
            sfx.coin();
        }

    }
);


fxUpdateSoundButton();
