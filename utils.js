/* =========================================================
   TEAQUEST — SHARED PURE UTILITIES
   ---------------------------------------------------------
   Single source of truth for sanitisation, validation,
   formatting and progression maths.

   Loaded two ways on purpose:
     • browser  — classic <script>, exposes window.TeaQuestUtils
     • jest     — CommonJS require() from __tests__/

   Nothing in here touches the DOM, the network or storage,
   so every function is deterministic and unit-testable.
   ========================================================= */

(function (root, factory) {

    "use strict";

    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.TeaQuestUtils = api;
    }

})(typeof globalThis !== "undefined" ? globalThis : this, () => {

    "use strict";


    /* =========================================================
       CONSTANTS
    ========================================================= */

    const XP_PER_LEVEL = 100;

    const ORDER_XP_REWARD = 100;

    const MIN_SIGNUP_AGE = 13;

    const MAX_CART_QUANTITY = 99;

    const ESCAPE_MAP = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
        "/": "&#x2F;",
        "`": "&#x60;"
    };

    const ESCAPE_PATTERN = /[&<>"'/`]/g;


    /* =========================================================
       SANITISATION
    ========================================================= */

    /**
     * Escape a value for safe interpolation into HTML text/attributes.
     * Order matters: "&" must be replaced first.
     */
    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(ESCAPE_PATTERN, (char) => {
                return ESCAPE_MAP[char];
            });

    }


    /**
     * Escape a value for use inside a double-quoted HTML attribute.
     */
    function escapeAttr(value) {

        return escapeHTML(value);

    }


    /**
     * Strip control characters and collapse whitespace.
     * Used for free-text fields (tavern chat, names, notes).
     */
    function sanitizeText(value, maxLength) {

        if (value === null || value === undefined) {
            return "";
        }

        const limit =
            typeof maxLength === "number" && maxLength > 0
                ? maxLength
                : 500;

        return String(value)
            /* eslint-disable-next-line no-control-regex */
            .replace(/[\u0000-\u001F\u007F]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, limit);

    }


    /**
     * Make an arbitrary string safe to use as a download filename.
     */
    function sanitizeFilename(value) {

        const cleaned =
            sanitizeText(value, 120)
                .replace(/[\\/:*?"<>|]/g, "-")
                .replace(/\s+/g, "_")
                .replace(/^[.\-]+/, "");

        return cleaned || "file";

    }


    /**
     * Allow only safe URL schemes. Returns "" for anything else
     * (javascript:, data:, vbscript: ... are rejected).
     */
    function sanitizeURL(value) {

        if (!value) return "";

        const raw = String(value).trim();

        if (!raw) return "";

        /* Relative URLs and fragments are fine. */
        if (raw.charAt(0) === "/" ||
            raw.charAt(0) === "#" ||
            raw.charAt(0) === "?") {
            return raw;
        }

        const lowered = raw.toLowerCase();

        const safePrefixes = [
            "http://",
            "https://",
            "mailto:",
            "tel:"
        ];

        for (let i = 0; i < safePrefixes.length; i++) {
            if (lowered.indexOf(safePrefixes[i]) === 0) {
                return raw;
            }
        }

        /* Plain domains such as "example.com" -> https://example.com */
        if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/.*)?$/i.test(raw)) {
            return `https://${  raw}`;
        }

        return "";

    }


    /* =========================================================
       VALIDATION
    ========================================================= */

    const EMAIL_PATTERN =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const PHONE_PATTERN =
        /^\+?[0-9\s().-]{7,20}$/;


    function validateEmail(value) {

        if (!value) return false;

        return EMAIL_PATTERN.test(String(value).trim());

    }


    function validatePhone(value) {

        if (!value) return false;

        const cleaned = String(value).trim();

        if (!cleaned) return false;

        const digits = cleaned.replace(/\D/g, "");

        if (digits.length < 7 || digits.length > 15) {
            return false;
        }

        return PHONE_PATTERN.test(cleaned);

    }


    function normalizeEmail(value) {

        return String(value || "")
            .trim()
            .toLowerCase();

    }


    /**
     * Parse a date safely.
     *
     * "YYYY-MM-DD" is parsed as a LOCAL date, not UTC — otherwise a
     * birth date can appear one day earlier in negative-UTC-offset
     * timezones, which silently breaks age checks.
     */
    function parseLocalDate(value) {

        if (!value) return null;

        if (value instanceof Date) {
            return isNaN(value.getTime()) ? null : value;
        }

        const text = String(value).trim();

        const isoMatch =
            text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (isoMatch) {
            const year = Number(isoMatch[1]);
            const month = Number(isoMatch[2]);
            const day = Number(isoMatch[3]);

            const local = new Date(year, month - 1, day);

            /* Reject impossible dates such as 2026-02-31. */
            if (local.getFullYear() !== year ||
                local.getMonth() !== month - 1 ||
                local.getDate() !== day) {
                return null;
            }

            return local;
        }

        const parsed = new Date(text);

        return isNaN(parsed.getTime()) ? null : parsed;

    }


    /**
     * Age in whole years for a YYYY-MM-DD birth date.
     * Returns null when the date is missing or unparseable.
     */
    function calculateAge(dateOfBirth, today) {

        const birth = parseLocalDate(dateOfBirth);

        if (!birth) return null;

        const now = today ? parseLocalDate(today) : new Date();

        if (!now) return null;

        let age =
            now.getFullYear() - birth.getFullYear();

        const monthDiff =
            now.getMonth() - birth.getMonth();

        if (monthDiff < 0 ||
            (monthDiff === 0 &&
                now.getDate() < birth.getDate())) {
            age--;
        }

        return age;

    }


    /**
     * True when the given birth date satisfies a minimum age.
     */
    function isValidAge(dateOfBirth, minAge, today) {

        const age = calculateAge(dateOfBirth, today);

        if (age === null) {
            /* No date supplied -> not a failure, just unknown. */
            return true;
        }

        return age >= (minAge || MIN_SIGNUP_AGE);

    }


    /* =========================================================
       FORMATTING
    ========================================================= */

    function formatCurrency(amount, currency) {

        const symbol = currency || "$";

        let value = Number(amount);

        if (!isFinite(value)) {
            value = 0;
        }

        return symbol + value.toFixed(2);

    }


    function round2(value) {

        const num = Number(value);

        if (!isFinite(num)) return 0;

        return Math.round((num + Number.EPSILON) * 100) / 100;

    }


    function clamp(value, min, max) {

        const num = Number(value);

        if (!isFinite(num)) return min;

        if (num < min) return min;

        if (num > max) return max;

        return num;

    }


    function formatDate(value) {

        if (!value) return "";

        const date = new Date(value);

        if (isNaN(date.getTime())) return "";

        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

    }


    function formatDateTime(value) {

        if (!value) return "";

        const date = new Date(value);

        if (isNaN(date.getTime())) return "";

        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    }


    /**
     * Compact order reference used in the UI, e.g. "#A1B2C3".
     */
    function shortOrderId(id) {

        const text = String(id || "");

        if (text.length <= 10) {
            return text;
        }

        return `#${ 
            text.replace(/[^a-z0-9]/gi, "")
                .slice(-6)
                .toUpperCase()}`;

    }


    /* =========================================================
       PROGRESSION & RARITY
    ========================================================= */

    function getLevelInfo(xpTotal) {

        const xp = Math.max(
            0,
            Number(xpTotal) || 0
        );

        const level =
            Math.floor(xp / XP_PER_LEVEL) + 1;

        const xpIntoLevel = xp % XP_PER_LEVEL;

        return {
            level,
            xpIntoLevel,
            xpTotal: xp,
            xpForNextLevel: XP_PER_LEVEL
        };

    }


    function getProductRarity(product) {

        if (!product) return "common";

        if (product.rarity) return product.rarity;

        const price = Number(product.price) || 0;

        if (price >= 24) return "legendary";
        if (price >= 19) return "epic";
        if (price >= 16) return "rare";
        if (price >= 13) return "uncommon";

        return "common";

    }


    /* =========================================================
       CART
    ========================================================= */

    function calculateCartTotal(items) {

        if (!Array.isArray(items)) return 0;

        return round2(
            items.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 0;
                return sum + (price * qty);
            }, 0)
        );

    }


    function calculateCartCount(items) {

        if (!Array.isArray(items)) return 0;

        return items.reduce((sum, item) => {
            return sum + (Number(item.quantity) || 0);
        }, 0);

    }


    /**
     * Pure cart mutation — returns a NEW array, never mutates the input.
     */
    function addCartItem(cart, productId, quantity) {

        const list = Array.isArray(cart) ? cart.slice() : [];

        if (!productId) return list;

        const qty = clamp(
            quantity === undefined ? 1 : quantity,
            1,
            MAX_CART_QUANTITY
        );

        const index = list.findIndex((item) => {
            return item.productId === productId;
        });

        if (index === -1) {
            list.push({
                productId,
                quantity: qty
            });
        } else {
            list[index] = {
                productId: list[index].productId,
                quantity: clamp(
                    (Number(list[index].quantity) || 0) + qty,
                    1,
                    MAX_CART_QUANTITY
                )
            };
        }

        return list;

    }


    function removeCartItem(cart, productId) {

        if (!Array.isArray(cart)) return [];

        return cart.filter((item) => {
            return item.productId !== productId;
        });

    }


    function setCartQuantity(cart, productId, quantity) {

        if (!Array.isArray(cart)) return [];

        const qty = clamp(quantity, 0, MAX_CART_QUANTITY);

        if (qty === 0) {
            return removeCartItem(cart, productId);
        }

        return cart.map((item) => {
            if (item.productId !== productId) return item;

            return {
                productId: item.productId,
                quantity: qty
            };
        });

    }


    /* =========================================================
       FAVORITES
    ========================================================= */

    function toggleFavorite(favorites, productId) {

        const list = Array.isArray(favorites) ? favorites.slice() : [];

        if (!productId) return list;

        const index = list.indexOf(productId);

        if (index >= 0) {
            list.splice(index, 1);
        } else {
            list.push(productId);
        }

        return list;

    }


    function isFavorite(favorites, productId) {

        if (!Array.isArray(favorites)) return false;

        return favorites.indexOf(productId) >= 0;

    }


    /* =========================================================
       ACHIEVEMENTS
    ---------------------------------------------------------
       Pure definitions. `condition(user, productCount)` keeps
       them independent of app globals so they can be unit-tested.
    ========================================================= */

    const ACHIEVEMENT_DEFINITIONS = [
        {
            id: "first-leaf",
            name: "FIRST LEAF",
            description: "First tea discovered.",
            condition (user) {
                return (user.discoveries || []).length >= 1;
            }
        },
        {
            id: "collector",
            name: "COLLECTOR",
            description: "Discover 5 teas.",
            condition (user) {
                return (user.discoveries || []).length >= 5;
            }
        },
        {
            id: "tea-scholar",
            name: "TEA SCHOLAR",
            description: "Discover 10 teas.",
            condition (user) {
                return (user.discoveries || []).length >= 10;
            }
        },
        {
            id: "lucky-leaf",
            name: "LUCKY LEAF",
            description: "Spin the Tea Roulette 10 times.",
            condition (user) {
                return (user.rouletteSpins || 0) >= 10;
            }
        },
        {
            id: "tea-master",
            name: "TEA MASTER",
            description: "Reach Level 10.",
            condition (user) {
                return getLevelInfo(user.xp).level >= 10;
            }
        },
        {
            id: "codex-keeper",
            name: "CODEX KEEPER",
            description: "Discover every tea in the marketplace.",
            condition (user, productCount) {
                return productCount > 0 &&
                    (user.discoveries || []).length >= productCount;
            }
        },
        {
            id: "arcade-rookie",
            name: "ARCADE ROOKIE",
            description: "Play your first arcade game.",
            condition (user) {
                return (user.arcadePlays || 0) >= 1;
            }
        },
        {
            id: "perfect-palate",
            name: "PERFECT PALATE",
            description: "Brew 15 perfect cups in a row.",
            condition (user) {
                return (user.highScores || {})["perfect-brew"] >= 15;
            }
        },
        {
            id: "leaf-legend",
            name: "LEAF LEGEND",
            description: "Score 500 in Leaf Catch.",
            condition (user) {
                return (user.highScores || {})["leaf-catch"] >= 500;
            }
        },
        {
            id: "memory-master",
            name: "MEMORY MASTER",
            description: "Win Tea Memory in 12 moves or fewer.",
            condition (user) {
                const best = (user.highScores || {})["tea-memory"] || 0;
                return best > 0 && best <= 12;
            }
        }
    ];


    /**
     * Returns the ids of every achievement unlocked by the user.
     */
    function getUnlockedAchievementIds(user, productCount) {

        const profile = user || {};

        return ACHIEVEMENT_DEFINITIONS
            .filter((def) => {
                try {
                    return !!def.condition(profile, productCount || 0);
                } catch (error) {
                    return false;
                }
            })
            .map((def) => {
                return def.id;
            });

    }


    /* =========================================================
       EXPORTS
    ========================================================= */

    return {
        XP_PER_LEVEL,
        ORDER_XP_REWARD,
        MIN_SIGNUP_AGE,
        MAX_CART_QUANTITY,
        ACHIEVEMENT_DEFINITIONS,

        escapeHTML,
        escapeAttr,
        sanitizeText,
        sanitizeFilename,
        sanitizeURL,

        validateEmail,
        validatePhone,
        normalizeEmail,
        parseLocalDate,
        calculateAge,
        isValidAge,

        formatCurrency,
        formatDate,
        formatDateTime,
        shortOrderId,
        round2,
        clamp,

        getLevelInfo,
        getProductRarity,

        calculateCartTotal,
        calculateCartCount,
        addCartItem,
        removeCartItem,
        setCartQuantity,

        toggleFavorite,
        isFavorite,

        getUnlockedAchievementIds
    };

});
