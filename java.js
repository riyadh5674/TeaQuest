/* =========================================================
   TEAQUEST
   FRONT-END APPLICATION ENGINE
========================================================= */

"use strict";


/* =========================================================
   DATA
========================================================= */

const defaultProducts = [

    {
        id: "tea-001",
        name: "Forest Mint",
        category: "green",
        price: 12,
        icon: "🌿",
        rating: 4.9,
        rarity: "common",
        origin: "Misty Highland Slopes",
        flavorNotes: "Cool, Grassy, Bright",
        moods: ["calm", "focused"],
        flavorProfile: ["fresh"],
        strength: "light",
        description:
            "Fresh mountain green tea with cool mint leaves."
    },

    {
        id: "tea-002",
        name: "Dragon Ember",
        category: "black",
        price: 15,
        icon: "🔥",
        rating: 4.8,
        rarity: "uncommon",
        origin: "Ember Valley Roasteries",
        flavorNotes: "Smoky, Caramel, Bold",
        moods: ["energetic", "adventurous"],
        flavorProfile: ["spicy", "earthy"],
        strength: "bold",
        description:
            "A powerful roasted black tea with smoky caramel notes."
    },

    {
        id: "tea-003",
        name: "Moon Blossom",
        category: "herbal",
        price: 14,
        icon: "🌸",
        rating: 5,
        rarity: "uncommon",
        origin: "Moon Garden Terraces",
        flavorNotes: "Floral, Calming, Light",
        moods: ["calm", "cozy"],
        flavorProfile: ["floral"],
        strength: "light",
        description:
            "A calming floral infusion for quiet nights."
    },

    {
        id: "tea-004",
        name: "Emerald Mist",
        category: "green",
        price: 18,
        icon: "🍃",
        rating: 4.9,
        rarity: "rare",
        origin: "Cloudpeak Highlands",
        flavorNotes: "Silky, Clean, Delicate",
        moods: ["focused", "calm"],
        flavorProfile: ["fresh", "floral"],
        strength: "medium",
        description:
            "Rare highland leaves with a clean, silky finish."
    },

    {
        id: "tea-005",
        name: "Sunset Chai",
        category: "special",
        price: 17,
        icon: "☀️",
        rating: 4.7,
        rarity: "rare",
        origin: "Golden Highlands Market",
        flavorNotes: "Spiced, Warm, Vanilla",
        moods: ["cozy", "adventurous"],
        flavorProfile: ["spicy", "fruity"],
        strength: "medium",
        description:
            "Warm spices, black tea and golden vanilla."
    },

    {
        id: "tea-006",
        name: "Wizard's Berry",
        category: "herbal",
        price: 16,
        icon: "🫐",
        rating: 4.8,
        rarity: "rare",
        origin: "Moon Garden Thicket",
        flavorNotes: "Berry, Tart, Magical",
        moods: ["cozy", "adventurous"],
        flavorProfile: ["fruity"],
        strength: "light",
        description:
            "Wild berry herbs blended into a magical crimson brew."
    },

    {
        id: "tea-007",
        name: "Iron Leaf",
        category: "black",
        price: 19,
        icon: "⚔️",
        rating: 4.6,
        rarity: "epic",
        origin: "Ember Valley Forge",
        flavorNotes: "Deep, Malty, Robust",
        moods: ["energetic", "adventurous"],
        flavorProfile: ["earthy", "spicy"],
        strength: "bold",
        description:
            "Bold, deep and powerful enough for an early quest."
    },

    {
        id: "tea-008",
        name: "Golden Phoenix",
        category: "special",
        price: 25,
        icon: "🐉",
        rating: 5,
        rarity: "legendary",
        origin: "The Golden Highlands Summit",
        flavorNotes: "Rare, Radiant, Complex",
        moods: ["adventurous", "energetic"],
        flavorProfile: ["spicy", "fruity"],
        strength: "bold",
        description:
            "Our legendary limited-edition tea for elite brewers."
    }
];


const defaultUsers = [

    {
        id: "admin-001",
        name: "Guild Master",
        email: "admin@teaquest.com",
        password: "admin123",
        role: "admin",
        xp: 999
    }

];


const QUESTS = [

    {
        id: "first-brew",
        name: "FIRST BREW",
        description: "Discover your first tea.",
        target: 1,
        progress: user =>
            (user.discoveries || []).length
    },

    {
        id: "relic-hunter",
        name: "RELIC HUNTER",
        description: "Discover 5 teas.",
        target: 5,
        progress: user =>
            (user.discoveries || []).length
    },

    {
        id: "tea-scholar-quest",
        name: "TEA SCHOLAR",
        description: "Discover 10 teas.",
        target: 10,
        progress: user =>
            (user.discoveries || []).length
    },

    {
        id: "lucky-leaf-quest",
        name: "LUCKY LEAF",
        description: "Spin Tea Roulette 5 times.",
        target: 5,
        progress: user =>
            user.rouletteSpins || 0
    },

    {
        id: "master-brewer",
        name: "MASTER BREWER",
        description: "Complete an order.",
        target: 1,
        progress: user =>
            orders.filter(
                order =>
                    order.userId === user.id
            ).length
    }

];


const ACHIEVEMENTS = [

    {
        id: "first-leaf",
        name: "FIRST LEAF",
        description: "First tea discovered.",
        condition: user =>
            (user.discoveries || []).length >= 1
    },

    {
        id: "collector",
        name: "COLLECTOR",
        description: "Discover 5 teas.",
        condition: user =>
            (user.discoveries || []).length >= 5
    },

    {
        id: "tea-scholar",
        name: "TEA SCHOLAR",
        description: "Discover 10 teas.",
        condition: user =>
            (user.discoveries || []).length >= 10
    },

    {
        id: "lucky-leaf",
        name: "LUCKY LEAF",
        description: "Spin the Tea Roulette 10 times.",
        condition: user =>
            (user.rouletteSpins || 0) >= 10
    },

    {
        id: "tea-master",
        name: "TEA MASTER",
        description: "Reach Level 10.",
        condition: user =>
            getLevelInfo(user.xp).level >= 10
    },

    {
        id: "codex-keeper",
        name: "CODEX KEEPER",
        description: "Discover every tea in the marketplace.",
        condition: user =>
            products.length > 0 &&
            (user.discoveries || []).length >= products.length
    }

];


/* =========================================================
   APPLICATION STATE
========================================================= */

let products =
    getStorage("teaquest_products", defaultProducts);

let users =
    getStorage("teaquest_users", defaultUsers);

let cart =
    getStorage("teaquest_cart", []);

let favorites =
    getStorage("teaquest_favorites", []);

let orders =
    getStorage("teaquest_orders", []);

let currentUser =
    getStorage("teaquest_currentUser", null);

let activeCategory = "all";

let authMode = "login";


/* =========================================================
   STORAGE
========================================================= */

function getStorage(key, fallback) {

    try {

        const value = localStorage.getItem(key);

        if (!value) {
            return JSON.parse(JSON.stringify(fallback));
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            `Storage read failed for ${key}`,
            error
        );

        return JSON.parse(JSON.stringify(fallback));
    }
}


function saveStorage(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn(
            `Storage save failed for ${key}`,
            error
        );
    }
}


/* =========================================================
   SUPABASE BACKEND
======================================================== */

const SUPABASE_URL =
    "https://mfgvssuodjtsibfqrcgu.db.co";

const SUPABASE_KEY =
    "sb_publishable_GoQbk7khZkkvxJWnLXR8mQ_05xJQjot";


const db =
    window.supabase &&
    typeof window.supabase.createClient === "function"
        ? window.supabase.createClient(
              SUPABASE_URL,
              SUPABASE_KEY
          )
        : null;


function mapProfile(row) {

    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        xp: Number(row.xp || 0),
        discoveries: Array.isArray(row.discoveries)
            ? row.discoveries
            : [],
        achievements: Array.isArray(row.achievements)
            ? row.achievements
            : [],
        rouletteSpins:
            Number(row.roulette_spins || 0)
    };

}


async function fetchProfile(userId) {

    const { data, error } =
        await db
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();


    if (error) {
        throw error;
    }

    return data;

}


async function ensureProfile(authUser) {

    let profile = null;


    try {

        profile =
            await fetchProfile(authUser.id);

    } catch (error) {

        profile = null;

    }


    if (profile) {
        return profile;
    }


    const fallbackName =
        (authUser.user_metadata &&
            authUser.user_metadata.name) ||
        (authUser.email || "player")
            .split("@")[0];


    await db
        .from("profiles")
        .upsert({
            id: authUser.id,
            email: authUser.email || "",
            name: fallbackName
        });


    return await fetchProfile(authUser.id);

}


async function loadProfileSession() {

    const { data } =
        await db.auth.getSession();


    const sessionUser =
        data &&
        data.session &&
        data.session.user;


    if (!sessionUser) {
        return null;
    }


    const profile =
        await ensureProfile(sessionUser);


    return profile
        ? mapProfile(profile)
        : null;

}


function syncProfile() {

    if (!db || !currentUser) {
        return Promise.resolve();
    }

    return db
        .from("profiles")
        .update({
            name: currentUser.name,
            xp: currentUser.xp,
            discoveries: currentUser.discoveries,
            achievements: currentUser.achievements,
            roulette_spins: currentUser.rouletteSpins
        })
        .eq("id", currentUser.id);

}


function saveCurrentUser() {

    saveStorage(
        "teaquest_currentUser",
        currentUser
    );

    syncProfile();

}


async function restoreSession() {

    if (!db) {

        currentUser =
            getStorage("teaquest_currentUser", null);

        return;

    }


    try {

        currentUser =
            await loadProfileSession();

    } catch (error) {

        currentUser =
            getStorage("teaquest_currentUser", null);

        return;

    }


    if (currentUser) {

        saveStorage(
            "teaquest_currentUser",
            currentUser
        );

    } else {

        localStorage.removeItem(
            "teaquest_currentUser"
        );

    }

}


function normalizeUser(user) {

    if (!user) return user;


    if (!Array.isArray(user.discoveries)) {
        user.discoveries = [];
    }

    if (!Array.isArray(user.achievements)) {
        user.achievements = [];
    }

    if (typeof user.rouletteSpins !== "number") {
        user.rouletteSpins = 0;
    }

    if (typeof user.xp !== "number") {
        user.xp = 0;
    }


    return user;

}


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = selector =>
    document.querySelector(selector);

const $$ = selector =>
    [...document.querySelectorAll(selector)];


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   SECURITY — PASSWORD HASHING
========================================================= */

async function hashPassword(password) {

    const encoded =
        new TextEncoder().encode(
            `${password}::teaquest-salt`
        );

    try {

        if (window.crypto && crypto.subtle) {

            const digest =
                await crypto.subtle.digest(
                    "SHA-256",
                    encoded
                );

            return Array.from(
                new Uint8Array(digest)
            ).map(byte =>
                byte.toString(16).padStart(2, "0")
            ).join("");

        }

    } catch (error) {

        console.warn(
            "Web Crypto unavailable, using fallback hash",
            error
        );

    }

    let fallback = 2166136261;

    for (const byte of encoded) {

        fallback ^= byte;

        fallback =
            Math.imul(fallback, 16777619);

    }

    return `fnv-${(fallback >>> 0).toString(16)}`;

}


async function verifyPassword(user, password) {

    const hash =
        await hashPassword(password);


    if (user.passwordHash) {
        return user.passwordHash === hash;
    }


    if (user.password === password) {

        user.passwordHash = hash;

        delete user.password;

        saveStorage(
            "teaquest_users",
            users
        );

        return true;

    }


    return false;

}


function getProductRarity(product) {

    if (!product) return "common";

    if (product.rarity) return product.rarity;


    const price =
        Number(product.price) || 0;


    if (price >= 24) return "legendary";

    if (price >= 19) return "epic";

    if (price >= 16) return "rare";

    if (price >= 13) return "uncommon";

    return "common";

}


const XP_PER_LEVEL = 100;

const ORDER_XP_REWARD = 100;


function getLevelInfo(xpTotal) {

    const xp =
        Math.max(
            0,
            Number(xpTotal) || 0
        );

    const level =
        Math.floor(xp / XP_PER_LEVEL) + 1;

    const xpIntoLevel =
        xp % XP_PER_LEVEL;


    return {
        level,
        xpIntoLevel,
        xpTotal: xp,
        xpForNextLevel: XP_PER_LEVEL
    };

}


const DISCOVERY_XP_REWARD = 25;


function discoverTea(productId) {

    if (!currentUser) return;


    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) return;


    const user =
        users.find(
            item => item.id === currentUser.id
        );

    if (!user) return;


    normalizeUser(user);


    if (user.discoveries.includes(productId)) {
        return;
    }


    user.discoveries.push(productId);


    const previousLevel =
        getLevelInfo(user.xp).level;

    user.xp =
        Number(user.xp || 0) +
        DISCOVERY_XP_REWARD;

    const newLevel =
        getLevelInfo(user.xp).level;


    currentUser.discoveries =
        user.discoveries;

    currentUser.xp =
        user.xp;


    saveStorage(
        "teaquest_users",
        users
    );

    saveCurrentUser();


    toast(
        "NEW DISCOVERY",
        `${product.name} added to your Codex. +${DISCOVERY_XP_REWARD} XP`
    );


    if (newLevel > previousLevel) {

        showLevelUp(newLevel);

    }


    checkAchievements();

    renderProfile();

    renderCodex();

}


function renderCodex() {

    const container =
        $("#codexGrid");

    if (!container) return;


    const discoveries =
        currentUser
            ? (
                users.find(
                    item => item.id === currentUser.id
                )?.discoveries ||
                currentUser.discoveries ||
                []
            )
            : [];


    const progressLabel =
        $("#codexProgress");

    if (progressLabel) {

        progressLabel.textContent =
            `[ ${discoveries.length} / ${products.length} DISCOVERED ]`;

    }


    container.innerHTML =
        products.map(product => {

            const isDiscovered =
                discoveries.includes(product.id);


            if (!isDiscovered) {

                return `
                    <div class="codex-card locked">

                        <div class="codex-art">

                            <span class="codex-icon silhouette">
                                ?
                            </span>

                        </div>

                        <div class="codex-info">

                            <h3>???</h3>

                            <span class="codex-origin">
                                UNDISCOVERED
                            </span>

                            <p class="codex-flavor">
                                View this tea in the shop to
                                add it to your Codex.
                            </p>

                        </div>

                    </div>
                `;

            }


            const rarity =
                getProductRarity(product);


            return `
                <div class="codex-card discovered">

                    <div class="codex-art">

                        <span class="rarity-pill rarity-${escapeHTML(rarity)}">
                            ${escapeHTML(rarity.toUpperCase())}
                        </span>

                        <span class="codex-icon">
                            ${escapeHTML(product.icon)}
                        </span>

                    </div>

                    <div class="codex-info">

                        <h3>
                            ${escapeHTML(product.name)}
                        </h3>

                        <span class="codex-origin">
                            ${escapeHTML(product.origin || "Unknown Origin")}
                        </span>

                        <p class="codex-flavor">
                            ${escapeHTML(product.flavorNotes || "Flavor notes not yet recorded.")}
                        </p>

                    </div>

                </div>
            `;

        }).join("");

}


function checkAchievements() {

    if (!currentUser) return;


    const user =
        users.find(
            item => item.id === currentUser.id
        );

    if (!user) return;


    normalizeUser(user);


    let unlockedNew = false;


    ACHIEVEMENTS.forEach(achievement => {

        if (user.achievements.includes(achievement.id)) {
            return;
        }

        if (!achievement.condition(user)) {
            return;
        }

        user.achievements.push(achievement.id);

        unlockedNew = true;

        toast(
            "ACHIEVEMENT UNLOCKED",
            achievement.name
        );

    });


    if (unlockedNew) {

        currentUser.achievements =
            user.achievements;

        saveStorage(
            "teaquest_users",
            users
        );

        saveCurrentUser();

        renderProfile();

    }

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    initializeNavigation();

    initializeTheme();

    initializeShop();

    initializeCart();

    initializeFavorites();

    initializeAuthentication();

    initializeCheckout();

    initializeContact();

    initializeAdmin();

    initializeRandomTea();

    initializeRoulette();

    initializeOracle();


    await restoreSession();


    renderEverything();

});


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    renderFeaturedProducts();

    renderShopProducts();

    renderCart();

    renderFavorites();

    updateNavigation();

    renderProfile();

    renderCodex();

    renderAdmin();

    updateCounts();

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    $$("[data-page]").forEach(button => {

        button.addEventListener("click", () => {

            navigateTo(button.dataset.page);

            $("#mobileNav")?.classList.remove("open");
        });

    });


    $("#mobileMenuButton")?.addEventListener(
        "click",
        () => {

            $("#mobileNav")?.classList.toggle("open");

        }
    );


    window.addEventListener(
        "popstate",
        () => {

            const page =
                location.hash.replace("#", "") || "home";

            showPage(page, false);

        }
    );


    const initialPage =
        location.hash.replace("#", "") || "home";

    showPage(initialPage, false);
}


function navigateTo(page) {

    showPage(page, true);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function showPage(page, updateHash = true) {

    const validPages = [
        "home",
        "shop",
        "codex",
        "about",
        "contact",
        "profile",
        "admin"
    ];

    if (!validPages.includes(page)) {
        page = "home";
    }


    if (page === "profile" && !currentUser) {

        openAuth();

        return;
    }


    if (page === "admin" &&
        (!currentUser || currentUser.role !== "admin")) {

        toast(
            "ACCESS DENIED",
            "Guild Master privileges required."
        );

        openAuth();

        return;
    }


    $$(".page").forEach(section => {

        section.classList.remove("active-page");

    });


    $(`#${page}`)?.classList.add("active-page");


    $$(".nav-link").forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.page === page
        );

    });


    if (updateHash) {

        history.pushState(
            null,
            "",
            `#${page}`
        );

    }

}


/* =========================================================
   PRODUCT RENDERING
========================================================= */

function productCard(product) {

    const isFavorite =
        favorites.includes(product.id);


    return `
        <article
            class="product-card"
            data-product-id="${escapeHTML(product.id)}"
        >

            <button
                class="favorite-product ${isFavorite ? "active" : ""}"
                data-favorite="${escapeHTML(product.id)}"
                title="Favorite"
            >
                ${isFavorite ? "♥" : "♡"}
            </button>

            <div
                class="product-art"
                data-view-product="${escapeHTML(product.id)}"
            >
                <span class="product-icon">
                    ${escapeHTML(product.icon)}
                </span>
            </div>

            <div class="product-content">

                <span class="product-category">
                    ${escapeHTML(product.category)}
                </span>

                <h3 class="product-name">
                    ${escapeHTML(product.name)}
                </h3>

                <p class="product-description">
                    ${escapeHTML(product.description)}
                </p>

                <div class="product-bottom">

                    <span class="product-price">
                        $${Number(product.price).toFixed(2)}
                    </span>

                    <span class="product-rating">
                        ★ ${Number(product.rating).toFixed(1)}
                    </span>

                </div>

                <div class="product-actions">

                    <button
                        class="add-cart"
                        data-add-cart="${escapeHTML(product.id)}"
                    >
                        + ADD TO CART
                    </button>

                    <button
                        class="view-product"
                        data-view-product="${escapeHTML(product.id)}"
                    >
                        ↗
                    </button>

                </div>

            </div>

        </article>
    `;
}


function renderFeaturedProducts() {

    const container =
        $("#featuredProducts");

    if (!container) return;

    container.innerHTML =
        products
            .slice(0, 4)
            .map(productCard)
            .join("");

    attachProductEvents(container);
}


function renderShopProducts() {

    const container =
        $("#shopProducts");

    if (!container) return;


    const search =
        ($("#searchInput")?.value || "")
            .trim()
            .toLowerCase();


    let result =
        products.filter(product => {

            const matchesCategory =
                activeCategory === "all" ||
                product.category === activeCategory;

            const searchable =
                `${product.name}
                 ${product.description}
                 ${product.category}`
                    .toLowerCase();

            const matchesSearch =
                !search ||
                searchable.includes(search);

            return matchesCategory && matchesSearch;

        });


    const sort =
        $("#sortSelect")?.value || "featured";


    if (sort === "low") {

        result.sort(
            (a, b) => a.price - b.price
        );

    } else if (sort === "high") {

        result.sort(
            (a, b) => b.price - a.price
        );

    } else if (sort === "rating") {

        result.sort(
            (a, b) => b.rating - a.rating
        );

    }


    if (!result.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No tea found.</h3>
                <p>Try another search or category.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        result.map(productCard).join("");

    attachProductEvents(container);
}


function attachProductEvents(container) {

    container
        .querySelectorAll("[data-add-cart]")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    bumpElement(
                        button,
                        "confirmed"
                    );

                    addToCart(
                        button.dataset.addCart
                    );

                }
            );

        });


    container
        .querySelectorAll("[data-favorite]")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleFavorite(
                        button.dataset.favorite
                    );

                }
            );

        });


    container
        .querySelectorAll("[data-view-product]")
        .forEach(element => {

            element.addEventListener(
                "click",
                () => {

                    openProductModal(
                        element.dataset.viewProduct
                    );

                }
            );

        });

}


/* =========================================================
   SHOP FILTERS
========================================================= */

function initializeShop() {

    $("#searchInput")?.addEventListener(
        "input",
        renderShopProducts
    );


    $("#sortSelect")?.addEventListener(
        "change",
        renderShopProducts
    );


    $$(".shop-controls .filter-button").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                activeCategory =
                    button.dataset.category;

                $$(".filter-button")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                renderShopProducts();

            }
        );

    });

}


/* =========================================================
   CART
========================================================= */

function initializeCart() {

    $("#cartButton")?.addEventListener(
        "click",
        openCart
    );

    $("#closeCart")?.addEventListener(
        "click",
        closeCart
    );

    $("#cartOverlay")?.addEventListener(
        "click",
        closeCart
    );

    $("#checkoutButton")?.addEventListener(
        "click",
        openCheckout
    );

}


function addToCart(productId) {

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) return;


    const existing =
        cart.find(
            item => item.productId === productId
        );


    if (existing) {

        existing.quantity++;

    } else {

        cart.push({
            productId,
            quantity: 1
        });

    }


    saveStorage(
        "teaquest_cart",
        cart
    );


    updateCounts();

    renderCart();

    bumpElement(
        $("#cartCount"),
        "bump"
    );

    toast(
        "ITEM ACQUIRED",
        `${product.name} added to your inventory.`
    );

}


function changeQuantity(productId, amount) {

    const item =
        cart.find(
            cartItem =>
                cartItem.productId === productId
        );

    if (!item) return;


    item.quantity += amount;


    if (item.quantity <= 0) {

        cart =
            cart.filter(
                cartItem =>
                    cartItem.productId !== productId
            );

    }


    saveStorage(
        "teaquest_cart",
        cart
    );


    renderCart();

    updateCounts();

}


function pruneStaleCartItems() {

    const validCart =
        cart.filter(item =>
            products.some(
                product =>
                    product.id === item.productId
            )
        );


    if (validCart.length !== cart.length) {

        cart = validCart;

        saveStorage(
            "teaquest_cart",
            cart
        );

    }

}


function renderCart() {

    pruneStaleCartItems();

    const container =
        $("#cartItems");

    if (!container) return;


    if (!cart.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🍵
                </div>

                <h3>Your inventory is empty.</h3>

                <p>
                    The next legendary brew
                    is waiting for you.
                </p>

            </div>
        `;

        $("#cartTotal").textContent = "$0.00";

        return;
    }


    let total = 0;


    container.innerHTML =
        cart.map(item => {

            const product =
                products.find(
                    product =>
                        product.id === item.productId
                );

            if (!product) return "";


            total +=
                product.price * item.quantity;


            return `
                <div class="cart-item">

                    <div class="cart-item-icon">
                        ${escapeHTML(product.icon)}
                    </div>

                    <div>

                        <div class="cart-item-name">
                            ${escapeHTML(product.name)}
                        </div>

                        <div class="cart-item-price">
                            $${(
                                product.price *
                                item.quantity
                            ).toFixed(2)}
                        </div>

                        <div class="quantity-controls">

                            <button
                                data-quantity="${product.id}"
                                data-change="-1"
                            >
                                −
                            </button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                data-quantity="${product.id}"
                                data-change="1"
                            >
                                +
                            </button>

                        </div>

                    </div>

                </div>
            `;

        }).join("");


    $("#cartTotal").textContent =
        `$${total.toFixed(2)}`;


    container
        .querySelectorAll("[data-quantity]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeQuantity(
                        button.dataset.quantity,
                        Number(button.dataset.change)
                    );

                }
            );

        });

}


function openCart() {

    $("#cartDrawer")?.classList.add("open");

    $("#cartOverlay")?.classList.add("open");

}


function closeCart() {

    $("#cartDrawer")?.classList.remove("open");

    $("#cartOverlay")?.classList.remove("open");

}


/* =========================================================
   FAVORITES
========================================================= */

function initializeFavorites() {

    $("#favoritesButton")?.addEventListener(
        "click",
        openFavorites
    );

    $("#closeFavorites")?.addEventListener(
        "click",
        closeFavorites
    );

    $("#favoriteOverlay")?.addEventListener(
        "click",
        closeFavorites
    );

}


function toggleFavorite(productId) {

    if (favorites.includes(productId)) {

        favorites =
            favorites.filter(
                id => id !== productId
            );

        toast(
            "REMOVED",
            "Tea removed from saved loot."
        );

    } else {

        favorites.push(productId);

        toast(
            "FAVORITED",
            "Tea added to saved loot. ♥"
        );

    }


    saveStorage(
        "teaquest_favorites",
        favorites
    );


    updateCounts();

    bumpElement(
        $("#favoriteCount"),
        "bump"
    );

    renderFeaturedProducts();

    renderShopProducts();

    renderFavorites();

}


function renderFavorites() {

    const container =
        $("#favoriteItems");

    if (!container) return;


    const favoriteProducts =
        products.filter(
            product =>
                favorites.includes(product.id)
        );


    if (!favoriteProducts.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">♥</div>
                <h3>No saved loot.</h3>
                <p>Favorite your favorite brews.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        favoriteProducts.map(product => `

            <div class="cart-item">

                <div class="cart-item-icon">
                    ${escapeHTML(product.icon)}
                </div>

                <div>

                    <div class="cart-item-name">
                        ${escapeHTML(product.name)}
                    </div>

                    <div class="cart-item-price">
                        $${Number(product.price).toFixed(2)}
                    </div>

                    <button
                        class="add-cart"
                        style="margin-top:10px;padding:7px 10px;"
                        data-fav-add="${product.id}"
                    >
                        + ADD
                    </button>

                </div>

            </div>

        `).join("");


    container
        .querySelectorAll("[data-fav-add]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    bumpElement(
                        button,
                        "confirmed"
                    );

                    addToCart(
                        button.dataset.favAdd
                    );

                }
            );

        });

}


function openFavorites() {

    renderFavorites();

    $("#favoriteDrawer")
        ?.classList.add("open");

    $("#favoriteOverlay")
        ?.classList.add("open");

}


function closeFavorites() {

    $("#favoriteDrawer")
        ?.classList.remove("open");

    $("#favoriteOverlay")
        ?.classList.remove("open");

}


/* =========================================================
   COUNTERS
========================================================= */

function updateCounts() {

    pruneStaleCartItems();

    const cartCount =
        cart.reduce(
            (sum, item) =>
                sum + item.quantity,
            0
        );


    $("#cartCount").textContent =
        cartCount;


    $("#favoriteCount").textContent =
        favorites.length;

}


/* =========================================================
   PRODUCT MODAL
========================================================= */

function openProductModal(productId) {

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) return;


    discoverTea(productId);


    $("#productModalContent").innerHTML = `

        <div class="product-modal-art">

            <span>
                ${escapeHTML(product.icon)}
            </span>

        </div>

        <div class="product-modal-info">

            <span class="eyebrow">
                ${escapeHTML(product.category)}
            </span>

            <h2>
                ${escapeHTML(product.name)}
            </h2>

            <div class="product-rating">
                ★ ${Number(product.rating).toFixed(1)}
            </div>

            <p>
                ${escapeHTML(product.description)}
            </p>

            <div class="modal-price">
                $${Number(product.price).toFixed(2)}
            </div>

            <button
                class="pixel-button primary full"
                id="modalAddCart"
            >
                ADD TO INVENTORY →
            </button>

        </div>

    `;


    $("#modalAddCart").addEventListener(
        "click",
        () => {

            addToCart(product.id);

            closeModal(
                $("#productModal")
            );

        }
    );


    openModal(
        $("#productModal")
    );

}


$("#closeProduct")?.addEventListener(
    "click",
    () =>
        closeModal(
            $("#productModal")
        )
);


/* =========================================================
   AUTHENTICATION
========================================================= */

function initializeAuthentication() {

    $("#accountButton")?.addEventListener(
        "click",
        () => {

            if (currentUser) {

                navigateTo("profile");

            } else {

                openAuth();

            }

        }
    );


    $("#closeAuth")?.addEventListener(
        "click",
        () =>
            closeModal(
                $("#authModal")
            )
    );


    $("#authSwitchButton")?.addEventListener(
        "click",
        toggleAuthMode
    );


    $("#authForm")?.addEventListener(
        "submit",
        handleAuthentication
    );


    $("#adminLoginButton")?.addEventListener(
        "click",
        openAdminLogin
    );


    $("#logoutButton")?.addEventListener(
        "click",
        logout
    );

}


function openAuth() {

    setAuthMode("login");

    openModal(
        $("#authModal")
    );

}


function openAdminLogin() {

    setAuthMode("login");

    $("#authTitle").textContent =
        "GUILD MASTER ACCESS";

    $("#authSubtitle").textContent =
        "Enter your master credentials to open the command center.";

    const emailInput = $("#authEmail");

    if (emailInput && !emailInput.value) {

        emailInput.value =
            "admin@teaquest.com";

    }

    $("#authPassword")?.focus();

}


function toggleAuthMode() {

    setAuthMode(
        authMode === "login"
            ? "signup"
            : "login"
    );

}


function setAuthMode(mode) {

    authMode = mode;


    const signup =
        mode === "signup";


    $("#authTitle").textContent =
        signup
            ? "CREATE YOUR CHARACTER"
            : "WELCOME BACK";


    $("#authSubtitle").textContent =
        signup
            ? "Create your player account."
            : "Login to continue your tea quest.";


    $("#authSubmitText").textContent =
        signup
            ? "CREATE ACCOUNT"
            : "ENTER WORLD";


    $("#authSwitchText").textContent =
        signup
            ? "Already a player?"
            : "New player?";


    $("#authSwitchButton").textContent =
        signup
            ? "LOGIN"
            : "CREATE ACCOUNT";


    $("#signupNameGroup")
        ?.classList.toggle(
            "hidden-field",
            !signup
        );


    $("#authName").required =
        signup;

}


async function handleAuthentication(event) {

    event.preventDefault();


    const email =
        $("#authEmail")
            .value
            .trim()
            .toLowerCase();


    const password =
        $("#authPassword")
            .value;


    if (authMode === "login") {

        if (!db) {

            toast(
                "BACKEND OFFLINE",
                "Cannot reach the server. Try again later."
            );

            return;
        }


        const { data, error } =
            await db.auth.signInWithPassword({
                email,
                password
            });


        if (error || !data.user) {

            toast(
                "LOGIN FAILED",
                "Wrong email or password."
            );

            return;
        }


        let profile = null;

        try {

            profile =
                await ensureProfile(data.user);

        } catch (profileError) {

            profile = null;

        }


        if (!profile) {

            toast(
                "LOGIN FAILED",
                "Player profile not found."
            );

            return;
        }


        currentUser = mapProfile(profile);


        saveStorage(
            "teaquest_currentUser",
            currentUser
        );


        closeModal(
            $("#authModal")
        );


        updateNavigation();

        renderProfile();

        toast(
            "WELCOME BACK",
            `Welcome, ${currentUser.name}.`
        );


        if (currentUser.role === "admin") {

            navigateTo("admin");

        } else {

            navigateTo("shop");

        }


        return;
    }


    const name =
        $("#authName")
            .value
            .trim();


    if (!name) {

        toast(
            "CHARACTER ERROR",
            "Enter your player name."
        );

        return;
    }


    if (!db) {

        toast(
            "BACKEND OFFLINE",
            "Cannot reach the server. Try again later."
        );

        return;
    }


    const { data, error } =
        await db.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });


    if (error || !data.user) {

        toast(
            "SIGNUP FAILED",
            error
                ? error.message
                : "Could not create account."
        );

        return;
    }


    let profile = null;

    try {

        profile =
            await ensureProfile(data.user);

    } catch (profileError) {

        profile = null;

    }


    currentUser = profile
        ? mapProfile(profile)
        : {
              id: data.user.id,
              name,
              email,
              role: "player",
              xp: 0,
              discoveries: [],
              achievements: [],
              rouletteSpins: 0
          };


    saveStorage(
        "teaquest_currentUser",
        currentUser
    );


    closeModal(
        $("#authModal")
    );


    updateNavigation();

    renderProfile();

    toast(
        "CHARACTER CREATED",
        "Your tea adventure begins."
    );


    navigateTo("shop");

}


async function logout() {

    if (db) {
        await db.auth.signOut();
    }

    currentUser = null;

    localStorage.removeItem(
        "teaquest_currentUser"
    );


    updateNavigation();

    navigateTo("home");


    toast(
        "LOGGED OUT",
        "See you on the next quest."
    );

}


function updateNavigation() {

    document.body.classList.toggle(
        "is-admin",
        !!currentUser &&
        currentUser.role === "admin"
    );


    if (!currentUser) {

        $("#accountLabel").textContent =
            "PLAYER";

        return;
    }


    $("#accountLabel").textContent =
        currentUser.role === "admin"
            ? "ADMIN"
            : currentUser.name
                .split(" ")[0]
                .toUpperCase();

}


/* =========================================================
   PROFILE
========================================================= */

function renderQuests() {

    const container =
        $("#questList");

    if (!container || !currentUser) return;


    const user =
        users.find(
            item => item.id === currentUser.id
        ) || currentUser;

    normalizeUser(user);


    container.innerHTML =
        QUESTS.map(quest => {

            const progress =
                Math.min(
                    quest.progress(user),
                    quest.target
                );

            const complete =
                progress >= quest.target;

            const percent =
                Math.min(
                    100,
                    Math.round(
                        (progress / quest.target) * 100
                    )
                );


            return `
                <div class="quest-card ${complete ? "complete" : ""}">

                    <div class="quest-info">

                        <strong>
                            ${escapeHTML(quest.name)}
                        </strong>

                        <span>
                            ${escapeHTML(quest.description)}
                        </span>

                    </div>

                    <div class="quest-progress">

                        <div class="quest-progress-bar">

                            <div
                                class="quest-progress-fill"
                                style="width:${percent}%"
                            ></div>

                        </div>

                        <small>
                            ${progress} / ${quest.target}
                        </small>

                    </div>

                    ${complete ? '<span class="quest-check">✓</span>' : ""}

                </div>
            `;

        }).join("");

}


function renderAchievements() {

    const container =
        $("#achievementList");

    if (!container || !currentUser) return;


    const user =
        users.find(
            item => item.id === currentUser.id
        ) || currentUser;

    normalizeUser(user);


    container.innerHTML =
        ACHIEVEMENTS.map(achievement => {

            const unlocked =
                user.achievements.includes(
                    achievement.id
                );


            return `
                <div class="achievement-badge ${unlocked ? "unlocked" : "locked"}">

                    <span class="achievement-icon">
                        ${unlocked ? "🏅" : "🔒"}
                    </span>

                    <strong>
                        ${escapeHTML(achievement.name)}
                    </strong>

                    <small>
                        ${escapeHTML(achievement.description)}
                    </small>

                </div>
            `;

        }).join("");

}


function renderProfile() {

    if (!currentUser) return;


    $("#profileName").textContent =
        currentUser.name;


    $("#profileEmail").textContent =
        currentUser.email;


    $("#profileAvatar").textContent =
        currentUser.role === "admin"
            ? "👑"
            : "🧙";


    const levelInfo =
        getLevelInfo(currentUser.xp);


    $("#profileLevel").textContent =
        `LEVEL ${levelInfo.level}`;


    $("#xpProgress").style.width =
        `${levelInfo.xpIntoLevel}%`;


    $("#xpText").textContent =
        `${levelInfo.xpIntoLevel} / ${levelInfo.xpForNextLevel} XP`;


    renderQuests();

    renderAchievements();


    const userOrders =
        orders.filter(
            order =>
                order.userId === currentUser.id
        );


    const container =
        $("#customerOrders");


    if (!container) return;


    if (!userOrders.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No completed quests.</h3>
                <p>Your orders will appear here.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        userOrders
            .slice()
            .reverse()
            .map(order => `

                <div class="order-card">

                    <div>

                        <div class="order-id">
                            ${escapeHTML(order.id)}
                        </div>

                        <div>
                            ${order.items.length}
                            tea item(s)
                        </div>

                    </div>

                    <strong>
                        $${Number(order.total).toFixed(2)}
                    </strong>

                    <span class="order-status">
                        ${escapeHTML(order.status)}
                    </span>

                </div>

            `)
            .join("");

}


/* =========================================================
   CHECKOUT
========================================================= */

function initializeCheckout() {

    $("#closeCheckout")?.addEventListener(
        "click",
        () =>
            closeModal(
                $("#checkoutModal")
            )
    );


    $("#checkoutForm")?.addEventListener(
        "submit",
        submitOrder
    );

}


function openCheckout() {

    pruneStaleCartItems();

    if (!cart.length) {

        toast(
            "EMPTY INVENTORY",
            "Add some tea before checking out."
        );

        return;
    }


    if (!currentUser) {

        toast(
            "PLAYER LOGIN REQUIRED",
            "Login before starting checkout."
        );

        closeCart();

        openAuth();

        return;
    }


    const total =
        getCartTotal();


    const summary =
        $("#checkoutSummary");


    summary.innerHTML = `

        <div class="checkout-summary">

            ${cart.map(item => {

                const product =
                    products.find(
                        p =>
                            p.id === item.productId
                    );

                return `
                    <div class="checkout-summary-row">
                        <span>
                            ${escapeHTML(product.name)}
                            × ${item.quantity}
                        </span>

                        <span>
                            $${(
                                product.price *
                                item.quantity
                            ).toFixed(2)}
                        </span>
                    </div>
                `;

            }).join("")}

            <div class="checkout-summary-total">
                <span>TOTAL</span>
                <span>
                    $${total.toFixed(2)}
                </span>
            </div>

        </div>

    `;


    $("#checkoutName").value =
        currentUser.name;


    $("#checkoutAddress").value = "";

    $("#checkoutPhone").value = "";


    closeCart();

    openModal(
        $("#checkoutModal")
    );

}


function getCartTotal() {

    return cart.reduce(
        (total, item) => {

            const product =
                products.find(
                    p =>
                        p.id === item.productId
                );

            if (!product) {
                return total;
            }

            return total +
                product.price *
                item.quantity;

        },
        0
    );

}


function submitOrder(event) {

    event.preventDefault();


    const total =
        getCartTotal();


    const order = {

        id:
            `ORDER-${Date.now()
                .toString()
                .slice(-6)}`,

        userId:
            currentUser.id,

        customer:
            $("#checkoutName").value.trim(),

        address:
            $("#checkoutAddress").value.trim(),

        phone:
            $("#checkoutPhone").value.trim(),

        payment:
            $("#checkoutPayment").value,

        items:
            cart.map(item => {

                const product =
                    products.find(
                        p =>
                            p.id === item.productId
                    );

                return {
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity
                };

            }),

        total,

        status: "PROCESSING",

        createdAt:
            new Date().toISOString()

    };


    orders.push(order);


    saveStorage(
        "teaquest_orders",
        orders
    );


    const userIndex =
        users.findIndex(
            user =>
                user.id === currentUser.id
        );


    if (userIndex !== -1) {

        const previousLevel =
            getLevelInfo(
                users[userIndex].xp
            ).level;


        users[userIndex].xp =
            Number(users[userIndex].xp || 0) +
            ORDER_XP_REWARD;


        currentUser.xp =
            users[userIndex].xp;


        saveStorage(
            "teaquest_users",
            users
        );


        saveCurrentUser();


        const newLevel =
            getLevelInfo(
                currentUser.xp
            ).level;


        if (newLevel > previousLevel) {

            showLevelUp(newLevel);

        }

    }


    cart = [];


    saveStorage(
        "teaquest_cart",
        cart
    );


    closeModal(
        $("#checkoutModal")
    );


    renderEverything();

    pulseScreen();


    toast(
        "QUEST COMPLETE ✦",
        `Order ${order.id} has been created.`
    );


    navigateTo("profile");

}


/* =========================================================
   CONTACT
========================================================= */

function initializeContact() {

    $("#contactForm")?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            $("#contactForm").reset();


            toast(
                "MESSAGE SENT",
                "The Tea Guild received your signal."
            );

        }
    );

}


/* =========================================================
   ADMIN
========================================================= */
const ORDER_STATUSES = [
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED"
];


let activeAdminTab = "overview";

let activeOrderStatusFilter = "all";


function initializeAdmin() {

    $$(".admin-tab").forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                activeAdminTab =
                    tab.dataset.adminTab;


                $$(".admin-tab").forEach(item =>
                    item.classList.toggle(
                        "active",
                        item === tab
                    )
                );


                $$(".admin-view").forEach(view =>
                    view.classList.toggle(
                        "active-view",
                        view.dataset.adminView === activeAdminTab
                    )
                );

            }
        );

    });


    $("#addProductButton")?.addEventListener(
        "click",
        () => openAdminProductModal()
    );


    $("#closeAdminProduct")?.addEventListener(
        "click",
        () =>
            closeModal(
                $("#adminProductModal")
            )
    );


    $("#adminProductForm")?.addEventListener(
        "submit",
        saveAdminProduct
    );


    $("#adminProductSearch")?.addEventListener(
        "input",
        renderAdminProductsTable
    );


    $$("#orderStatusFilters .filter-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    activeOrderStatusFilter =
                        button.dataset.statusFilter;


                    $$("#orderStatusFilters .filter-button")
                        .forEach(item =>
                            item.classList.toggle(
                                "active",
                                item === button
                            )
                        );


                    renderAdminOrdersTable();

                }
            );

        });


    $("#closeOrderModal")?.addEventListener(
        "click",
        () =>
            closeModal(
                $("#orderModal")
            )
    );


    $("#changePasswordForm")?.addEventListener(
        "submit",
        changeAdminPassword
    );


    $("#exportDataButton")?.addEventListener(
        "click",
        exportBackup
    );


    $("#importDataButton")?.addEventListener(
        "click",
        () => $("#importDataInput")?.click()
    );


    $("#importDataInput")?.addEventListener(
        "change",
        importBackup
    );


    $("#resetDataButton")?.addEventListener(
        "click",
        resetAllData
    );

}


function renderAdmin() {

    if (
        !currentUser ||
        currentUser.role !== "admin"
    ) {

        return;

    }


    renderAdminStats();

    renderRevenueChart();

    renderAdminRecentOrders();

    renderAdminProductsTable();

    renderAdminOrdersTable();

    renderAdminCustomersTable();

}


function renderAdminStats() {

    const revenue =
        orders.reduce(
            (sum, order) =>
                sum + Number(order.total),
            0
        );


    $("#adminRevenue").textContent =
        `$${revenue.toFixed(2)}`;


    $("#adminOrders").textContent =
        orders.length;


    $("#adminUsers").textContent =
        users.filter(
            user =>
                user.role === "customer"
        ).length;


    $("#adminProducts").textContent =
        products.length;

}


function renderRevenueChart() {

    const container =
        $("#revenueChart");

    if (!container) return;


    const days = [];


    for (let i = 6; i >= 0; i--) {

        const date =
            new Date();

        date.setDate(date.getDate() - i);


        days.push({
            key:
                date.toISOString().slice(0, 10),

            label:
                date.toLocaleDateString("en-US", { weekday: "short" }),

            total: 0
        });

    }


    orders.forEach(order => {

        const key =
            (order.createdAt || "").slice(0, 10);

        const day =
            days.find(item => item.key === key);

        if (day) {
            day.total +=
                Number(order.total) || 0;
        }

    });


    const max =
        Math.max(
            ...days.map(day => day.total),
            1
        );


    container.innerHTML =
        days.map(day => `

            <div class="chart-column">

                <strong>
                    ${day.total > 0 ? `$${day.total.toFixed(0)}` : ""}
                </strong>

                <div class="chart-bar-track">

                    <div
                        class="chart-bar"
                        style="height:${Math.max(4, Math.round((day.total / max) * 100))}%"
                    ></div>

                </div>

                <small>${escapeHTML(day.label)}</small>

            </div>

        `).join("");

}


function renderAdminRecentOrders() {

    const container =
        $("#adminRecentOrders");

    if (!container) return;


    if (!orders.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <p>No orders yet.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        orders
            .slice()
            .reverse()
            .slice(0, 5)
            .map(order => `

                <div class="admin-order">

                    <div class="admin-order-top">

                        <strong>
                            ${escapeHTML(order.id)}
                        </strong>

                        <span>
                            $${Number(order.total).toFixed(2)}
                        </span>

                    </div>

                    <p>
                        ${escapeHTML(order.customer)}
                        ·
                        ${escapeHTML(order.status)}
                    </p>

                </div>

            `)
            .join("");

}


function renderAdminProductsTable() {

    const body =
        $("#adminProductsBody");

    if (!body) return;


    const search =
        ($("#adminProductSearch")?.value || "")
            .trim()
            .toLowerCase();


    const result =
        products.filter(product =>

            !search ||
            `${product.name} ${product.category}`
                .toLowerCase()
                .includes(search)

        );


    if (!result.length) {

        body.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <p>No products found.</p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        result.map(product => `

            <tr>

                <td>
                    <div class="table-product">

                        <span class="table-product-icon">
                            ${escapeHTML(product.icon)}
                        </span>

                        <strong>
                            ${escapeHTML(product.name)}
                        </strong>

                    </div>
                </td>

                <td>
                    <span class="category-tag">
                        ${escapeHTML(product.category)}
                    </span>
                </td>

                <td>
                    $${Number(product.price).toFixed(2)}
                </td>

                <td>
                    ★ ${Number(product.rating).toFixed(1)}
                </td>

                <td>
                    <div class="admin-actions">

                        <button
                            title="Edit"
                            data-edit-product="${escapeHTML(product.id)}"
                        >
                            ✎
                        </button>

                        <button
                            class="delete-product"
                            title="Delete"
                            data-delete-product="${escapeHTML(product.id)}"
                        >
                            ×
                        </button>

                    </div>
                </td>

            </tr>

        `).join("");


    bindAdminProductActions(body);

}


function bindAdminProductActions(scope) {

    scope
        .querySelectorAll("[data-edit-product]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openAdminProductModal(
                        button.dataset.editProduct
                    )
            );

        });


    scope
        .querySelectorAll("[data-delete-product]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteProduct(
                        button.dataset.deleteProduct
                    )
            );

        });

}


function formatOrderDate(iso) {

    if (!iso) return "—";

    const date =
        new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }


    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    }) + " · " + date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });

}


function renderAdminOrdersTable() {

    const body =
        $("#adminOrdersBody");

    if (!body) return;


    const result =
        activeOrderStatusFilter === "all"
            ? orders
            : orders.filter(
                order =>
                    order.status === activeOrderStatusFilter
            );


    if (!result.length) {

        body.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <p>No orders in this status.</p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        result
            .slice()
            .reverse()
            .map(order => `

                <tr>

                    <td>
                        <strong class="order-id">
                            ${escapeHTML(order.id)}
                        </strong>
                        <small class="table-sub">
                            ${formatOrderDate(order.createdAt)}
                        </small>
                    </td>

                    <td>
                        ${escapeHTML(order.customer)}
                        <small class="table-sub">
                            ${escapeHTML(order.phone || "")}
                        </small>
                    </td>

                    <td>
                        ${(order.items || []).length}
                    </td>

                    <td>
                        $${Number(order.total).toFixed(2)}
                    </td>

                    <td>
                        <select
                            class="status-select"
                            data-order-status="${escapeHTML(order.id)}"
                        >
                            ${ORDER_STATUSES.map(status => `
                                <option
                                    value="${status}"
                                    ${order.status === status ? "selected" : ""}
                                >
                                    ${status}
                                </option>
                            `).join("")}
                        </select>
                    </td>

                    <td>
                        <div class="admin-actions">

                            <button
                                title="View details"
                                data-view-order="${escapeHTML(order.id)}"
                            >
                                👁
                            </button>

                            <button
                                class="delete-product"
                                title="Delete order"
                                data-delete-order="${escapeHTML(order.id)}"
                            >
                                ×
                            </button>

                        </div>
                    </td>

                </tr>

            `)
            .join("");


    body
        .querySelectorAll("[data-order-status]")
        .forEach(select => {

            select.addEventListener(
                "change",
                () =>
                    updateOrderStatus(
                        select.dataset.orderStatus,
                        select.value
                    )
            );

        });


    body
        .querySelectorAll("[data-view-order]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    viewOrderDetails(
                        button.dataset.viewOrder
                    )
            );

        });


    body
        .querySelectorAll("[data-delete-order]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    adminDeleteOrder(
                        button.dataset.deleteOrder
                    )
            );

        });

}


function updateOrderStatus(orderId, status) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;


    order.status = status;


    saveStorage(
        "teaquest_orders",
        orders
    );


    renderProfile();

    renderAdminRecentOrders();


    toast(
        "ORDER UPDATED",
        `${orderId} marked as ${status}.`
    );

}


function viewOrderDetails(orderId) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;


    $("#orderModalTitle").textContent =
        order.id;


    $("#orderDetailsContent").innerHTML = `

        <div class="order-info-grid">

            <div class="order-info-line">
                <span>CUSTOMER</span>
                <strong>${escapeHTML(order.customer)}</strong>
            </div>

            <div class="order-info-line">
                <span>PHONE</span>
                <strong>${escapeHTML(order.phone || "—")}</strong>
            </div>

            <div class="order-info-line">
                <span>ADDRESS</span>
                <strong>${escapeHTML(order.address || "—")}</strong>
            </div>

            <div class="order-info-line">
                <span>PAYMENT</span>
                <strong>${escapeHTML(order.payment || "—")}</strong>
            </div>

            <div class="order-info-line">
                <span>STATUS</span>
                <strong>${escapeHTML(order.status)}</strong>
            </div>

            <div class="order-info-line">
                <span>DATE</span>
                <strong>${formatOrderDate(order.createdAt)}</strong>
            </div>

        </div>

        <div class="order-details-list">

            ${(order.items || []).map(item => `

                <div class="order-detail-row">
                    <span>
                        ${escapeHTML(item.name)} × ${item.quantity}
                    </span>
                    <span>
                        $${(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                </div>

            `).join("")}

            <div class="checkout-summary-total">
                <span>TOTAL</span>
                <span>
                    $${Number(order.total).toFixed(2)}
                </span>
            </div>

        </div>

    `;


    openModal(
        $("#orderModal")
    );

}


function adminDeleteOrder(orderId) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;


    if (!window.confirm(`Delete order ${orderId}?`)) {
        return;
    }


    orders =
        orders.filter(
            item => item.id !== orderId
        );


    saveStorage(
        "teaquest_orders",
        orders
    );


    renderEverything();


    toast(
        "ORDER DELETED",
        `${orderId} has been removed.`
    );

}


function renderAdminCustomersTable() {

    const body =
        $("#adminCustomersBody");

    if (!body) return;


    if (!users.length) {

        body.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <p>No players yet.</p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        users.map(user => {

            normalizeUser(user);


            const isSelf =
                user.id === currentUser.id;

            const level =
                getLevelInfo(user.xp).level;

            const userOrderCount =
                orders.filter(
                    order =>
                        order.userId === user.id
                ).length;


            const roleTag =
                user.role === "admin"
                    ? '<span class="role-tag admin">ADMIN</span>'
                    : '<span class="role-tag">CUSTOMER</span>';


            return `

                <tr>

                    <td>
                        <div class="table-product">

                            <span class="table-product-icon">
                                ${user.role === "admin" ? "👑" : "🧙"}
                            </span>

                            <strong>
                                ${escapeHTML(user.name)}${isSelf ? ' <small class="table-sub">(you)</small>' : ""}
                            </strong>

                        </div>
                    </td>

                    <td>
                        ${escapeHTML(user.email)}
                    </td>

                    <td>
                        LVL ${level}
                    </td>

                    <td>
                        ${userOrderCount}
                    </td>

                    <td>
                        ${roleTag}
                    </td>

                    <td>
                        <div class="admin-actions">
                            ${isSelf
                                ? '<small class="table-sub">—</small>'
                                : `
                                    <button
                                        title="${user.role === "admin" ? "Demote to customer" : "Promote to admin"}"
                                        data-toggle-role="${escapeHTML(user.id)}"
                                    >
                                        ${user.role === "admin" ? "▼" : "▲"}
                                    </button>

                                    ${user.role === "admin"
                                        ? ""
                                        : `
                                            <button
                                                class="delete-product"
                                                title="Delete player"
                                                data-delete-user="${escapeHTML(user.id)}"
                                            >
                                                ×
                                            </button>
                                        `}
                                `}
                        </div>
                    </td>

                </tr>

            `;

        }).join("");


    body
        .querySelectorAll("[data-toggle-role]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    toggleUserRole(
                        button.dataset.toggleRole
                    )
            );

        });


    body
        .querySelectorAll("[data-delete-user]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    adminDeleteUser(
                        button.dataset.deleteUser
                    )
            );

        });

}


function toggleUserRole(userId) {

    const user =
        users.find(
            item => item.id === userId
        );

    if (!user) return;


    if (user.email === "admin@teaquest.com") {

        toast(
            "PROTECTED ACCOUNT",
            "The primary guild master cannot be changed."
        );

        return;

    }


    user.role =
        user.role === "admin"
            ? "customer"
            : "admin";


    if (currentUser.id === userId) {

        currentUser.role =
            user.role;

        saveCurrentUser();

        updateNavigation();

    }


    saveStorage(
        "teaquest_users",
        users
    );


    renderAdminCustomersTable();


    toast(
        "ROLE UPDATED",
        `${user.name} is now ${user.role === "admin" ? "an admin" : "a customer"}.`
    );

}


function adminDeleteUser(userId) {

    const user =
        users.find(
            item => item.id === userId
        );

    if (!user) return;


    if (user.id === currentUser.id) return;


    if (user.role === "admin") {

        toast(
            "ACCESS DENIED",
            "Demote this admin before deleting."
        );

        return;

    }


    if (!window.confirm(`Delete player "${user.name}"? Their orders will remain.`)) {
        return;
    }


    users =
        users.filter(
            item => item.id !== userId
        );


    saveStorage(
        "teaquest_users",
        users
    );


    renderAdminCustomersTable();

    renderAdminStats();


    toast(
        "PLAYER REMOVED",
        `${user.name} left the guild.`
    );

}


async function changeAdminPassword(event) {

    event.preventDefault();


    const current =
        $("#currentPassword").value;

    const next =
        $("#newPassword").value;

    const confirm =
        $("#confirmPassword").value;


    if (next !== confirm) {

        toast(
            "MISMATCH",
            "New passwords do not match."
        );

        return;

    }


    const admin =
        users.find(
            item => item.id === currentUser.id
        );

    if (!admin) return;


    if (!(await verifyPassword(admin, current))) {

        toast(
            "WRONG PASSWORD",
            "Current password is incorrect."
        );

        return;

    }


    admin.passwordHash =
        await hashPassword(next);

    delete admin.password;


    saveStorage(
        "teaquest_users",
        users
    );


    event.target.reset();


    toast(
        "SECURITY UPDATED",
        "Your password has been changed."
    );

}


function exportBackup() {

    const backup = {
        exportedAt:
            new Date().toISOString(),

        products,

        users,

        orders,

        cart,

        favorites
    };


    const blob =
        new Blob(
            [JSON.stringify(backup, null, 2)],
            { type: "application/json" }
        );


    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        `teaquest-backup-${Date.now()}.json`;

    link.click();

    URL.revokeObjectURL(link.href);


    toast(
        "BACKUP EXPORTED",
        "Your data has been downloaded."
    );

}


function importBackup(event) {

    const file =
        event.target.files[0];

    if (!file) return;


    const reader =
        new FileReader();


    reader.onload = () => {

        try {

            const data =
                JSON.parse(reader.result);


            if (
                !Array.isArray(data.products) ||
                !Array.isArray(data.users)
            ) {
                throw new Error("Invalid backup");
            }


            if (!window.confirm("Import this backup? Current data will be replaced.")) {
                return;
            }


            products =
                data.products;

            users =
                data.users;

            orders =
                Array.isArray(data.orders) ? data.orders : [];

            cart =
                Array.isArray(data.cart) ? data.cart : [];

            favorites =
                Array.isArray(data.favorites) ? data.favorites : [];


            saveStorage("teaquest_products", products);

            saveStorage("teaquest_users", users);

            saveStorage("teaquest_orders", orders);

            saveStorage("teaquest_cart", cart);

            saveStorage("teaquest_favorites", favorites);


            currentUser = null;

            localStorage.removeItem("teaquest_currentUser");


            updateNavigation();

            renderEverything();


            toast(
                "BACKUP RESTORED",
                "Data imported successfully."
            );

        } catch (error) {

            toast(
                "IMPORT FAILED",
                "That file is not a valid TEAQUEST backup."
            );

        }

        event.target.value = "";

    };


    reader.readAsText(file);

}


function resetAllData() {

    if (!window.confirm("Reset EVERYTHING? All products, players and orders will be wiped.")) {
        return;
    }


    if (!window.confirm("Final warning. This cannot be undone.")) {
        return;
    }


    [
        "teaquest_products",
        "teaquest_users",
        "teaquest_orders",
        "teaquest_cart",
        "teaquest_favorites",
        "teaquest_currentUser"
    ].forEach(key =>
        localStorage.removeItem(key)
    );


    location.reload();

}


function openAdminProductModal(productId = null) {

    if (
        !currentUser ||
        currentUser.role !== "admin"
    ) {

        toast(
            "ACCESS DENIED",
            "Admin privileges required."
        );

        return;
    }


    const form =
        $("#adminProductForm");


    form.reset();


    $("#editProductId").value = "";


    if (productId) {

        const product =
            products.find(
                item =>
                    item.id === productId
            );


        if (!product) return;


        $("#adminProductModalTitle")
            .textContent =
            "EDIT TEA";


        $("#editProductId").value =
            product.id;


        $("#adminProductName").value =
            product.name;


        $("#adminProductPrice").value =
            product.price;


        $("#adminProductCategory").value =
            product.category;


        $("#adminProductIcon").value =
            product.icon;


        $("#adminProductDescription").value =
            product.description;

    } else {

        $("#adminProductModalTitle")
            .textContent =
            "ADD NEW TEA";

    }


    openModal(
        $("#adminProductModal")
    );

}


function saveAdminProduct(event) {

    event.preventDefault();


    const id =
        $("#editProductId").value;


    const productData = {

        name:
            $("#adminProductName")
                .value
                .trim(),

        price:
            Number(
                $("#adminProductPrice").value
            ),

        category:
            $("#adminProductCategory").value,

        icon:
            $("#adminProductIcon")
                .value
                .trim() || "🍵",

        description:
            $("#adminProductDescription")
                .value
                .trim(),

        rating: 4.8

    };


    if (id) {

        const index =
            products.findIndex(
                product =>
                    product.id === id
            );


        if (index !== -1) {

            products[index] = {
                ...products[index],
                ...productData
            };

        }


        toast(
            "DATABASE UPDATED",
            "Tea item successfully modified."
        );

    } else {

        products.push({

            id:
                `tea-${Date.now()}`,

            ...productData

        });


        toast(
            "NEW TEA CREATED",
            "The tea has entered the marketplace."
        );

    }


    saveStorage(
        "teaquest_products",
        products
    );


    closeModal(
        $("#adminProductModal")
    );


    renderEverything();

}


function deleteProduct(productId) {

    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!product) return;


    const confirmed =
        window.confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmed) return;


    products =
        products.filter(
            item =>
                item.id !== productId
        );


    favorites =
        favorites.filter(
            id =>
                id !== productId
        );


    cart =
        cart.filter(
            item =>
                item.productId !== productId
        );


    saveStorage(
        "teaquest_products",
        products
    );


    saveStorage(
        "teaquest_favorites",
        favorites
    );


    saveStorage(
        "teaquest_cart",
        cart
    );


    renderEverything();


    toast(
        "ITEM DELETED",
        `${product.name} removed from marketplace.`
    );

}


/* =========================================================
   TEA ORACLE
========================================================= */

let oracleSelections = {
    mood: null,
    flavor: null,
    strength: null
};

let oracleSelectedProduct = null;


function initializeOracle() {

    $("#teaOracleButton")?.addEventListener(
        "click",
        openOracleModal
    );


    $("#closeOracle")?.addEventListener(
        "click",
        () =>
            closeModal(
                $("#oracleModal")
            )
    );


    $$(".oracle-option").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const group =
                    button.closest("[data-oracle-group]");

                if (!group) return;


                group
                    .querySelectorAll(".oracle-option")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");


                oracleSelections[group.dataset.oracleGroup] =
                    button.dataset.value;

            }
        );

    });


    $("#oracleReveal")?.addEventListener(
        "click",
        revealOracleResult
    );


    $("#oracleAddCart")?.addEventListener(
        "click",
        () => {

            if (!oracleSelectedProduct) return;

            bumpElement(
                $("#oracleAddCart"),
                "confirmed"
            );

            addToCart(
                oracleSelectedProduct.id
            );

        }
    );


    $("#oracleViewTea")?.addEventListener(
        "click",
        () => {

            if (!oracleSelectedProduct) return;

            closeModal(
                $("#oracleModal")
            );

            openProductModal(
                oracleSelectedProduct.id
            );

        }
    );


    $("#oracleTryAgain")?.addEventListener(
        "click",
        resetOracle
    );

}


function openOracleModal() {

    resetOracle();

    openModal(
        $("#oracleModal")
    );

}


function resetOracle() {

    oracleSelections = {
        mood: null,
        flavor: null,
        strength: null
    };

    oracleSelectedProduct = null;


    $$(".oracle-option").forEach(button =>
        button.classList.remove("active")
    );


    $("#oracleQuiz")
        ?.classList.remove("hidden-field");

    $("#oracleResult")
        ?.classList.add("hidden-field");

    $("#oracleActions")
        ?.classList.add("hidden-field");


    $("#oracleTitle").textContent =
        "ASK THE ORACLE";

}


function getOracleRecommendation(selections) {

    if (!products.length) return null;


    let bestScore = -1;

    let candidates = [];


    products.forEach(product => {

        let score = 0;


        const moods =
            product.moods || [];

        const flavors =
            product.flavorProfile || [];

        const strength =
            product.strength || null;


        if (moods.includes(selections.mood)) {
            score += 2;
        }

        if (flavors.includes(selections.flavor)) {
            score += 2;
        }

        if (strength === selections.strength) {
            score += 1;
        }


        if (score > bestScore) {

            bestScore = score;

            candidates = [product];

        } else if (score === bestScore) {

            candidates.push(product);

        }

    });


    return candidates[
        Math.floor(
            Math.random() * candidates.length
        )
    ];

}


function revealOracleResult() {

    if (
        !oracleSelections.mood ||
        !oracleSelections.flavor ||
        !oracleSelections.strength
    ) {

        toast(
            "THE ORACLE WAITS",
            "Choose a mood, flavor and strength first."
        );

        return;
    }


    const product =
        getOracleRecommendation(oracleSelections);

    if (!product) return;


    oracleSelectedProduct = product;


    const rarity =
        getProductRarity(product);


    $("#oracleTitle").textContent =
        "YOU HAVE DISCOVERED YOUR BREW.";


    $("#oracleResult").innerHTML = `

        <span class="rarity-pill rarity-${escapeHTML(rarity)}">
            ${escapeHTML(rarity.toUpperCase())}
        </span>

        <h2 class="roulette-name">
            ${escapeHTML(product.name)}
        </h2>

        <p class="roulette-description">
            ${escapeHTML(product.description)}
        </p>

        <div class="roulette-meta">

            <span class="product-price">
                $${Number(product.price).toFixed(2)}
            </span>

            <span class="product-rating">
                ★ ${Number(product.rating).toFixed(1)}
            </span>

        </div>

    `;


    $("#oracleQuiz")
        ?.classList.add("hidden-field");

    $("#oracleResult")
        ?.classList.remove("hidden-field");

    $("#oracleActions")
        ?.classList.remove("hidden-field");


    discoverTea(product.id);

}


/* =========================================================
   TEA ROULETTE
========================================================= */

let rouletteIntervalId = null;

let rouletteSelectedProduct = null;

let rouletteSpinning = false;


function initializeRandomTea() {

    $("#randomTeaButton")?.addEventListener(
        "click",
        openRouletteModal
    );

}


function initializeRoulette() {

    $("#closeRoulette")?.addEventListener(
        "click",
        () =>
            closeModal(
                $("#rouletteModal")
            )
    );


    $("#rouletteAddCart")?.addEventListener(
        "click",
        () => {

            if (!rouletteSelectedProduct) return;

            bumpElement(
                $("#rouletteAddCart"),
                "confirmed"
            );

            addToCart(
                rouletteSelectedProduct.id
            );

        }
    );


    $("#rouletteBuyNow")?.addEventListener(
        "click",
        () => {

            if (!rouletteSelectedProduct) return;

            addToCart(
                rouletteSelectedProduct.id
            );

            closeModal(
                $("#rouletteModal")
            );

            openCheckout();

        }
    );


    $("#rouletteViewDetails")?.addEventListener(
        "click",
        () => {

            if (!rouletteSelectedProduct) return;

            closeModal(
                $("#rouletteModal")
            );

            openProductModal(
                rouletteSelectedProduct.id
            );

        }
    );


    $("#rouletteSpinAgain")?.addEventListener(
        "click",
        spinRoulette
    );

}


function openRouletteModal() {

    if (!products.length) return;

    openModal(
        $("#rouletteModal")
    );

    spinRoulette();

}


function spinRoulette() {

    if (!products.length) return;


    if (rouletteIntervalId) {

        clearInterval(rouletteIntervalId);

        rouletteIntervalId = null;

    }


    rouletteSpinning = true;

    rouletteSelectedProduct = null;


    $("#rouletteTitle").textContent =
        "SPINNING THE WHEEL...";

    $("#rouletteResult")
        ?.classList.add("hidden-field");

    $("#rouletteActions")
        ?.classList.add("hidden-field");


    const stage =
        $("#rouletteIcon");

    if (!stage) {

        rouletteSpinning = false;

        return;
    }


    let ticks = 0;

    const totalTicks = 18;


    rouletteIntervalId = setInterval(
        () => {

            const spinningProduct =
                products[
                    Math.floor(
                        Math.random() *
                        products.length
                    )
                ];

            stage.textContent =
                spinningProduct.icon;

            ticks++;


            if (ticks >= totalTicks) {

                clearInterval(rouletteIntervalId);

                rouletteIntervalId = null;


                const finalProduct =
                    products[
                        Math.floor(
                            Math.random() *
                            products.length
                        )
                    ];

                revealRouletteResult(finalProduct);

            }

        },
        90
    );

}


function revealRouletteResult(product) {

    rouletteSelectedProduct = product;

    rouletteSpinning = false;


    $("#rouletteIcon").textContent =
        product.icon;

    $("#rouletteTitle").textContent =
        "TEA DISCOVERED!";


    const rarity =
        getProductRarity(product);


    $("#rouletteResult").innerHTML = `

        <span class="rarity-pill rarity-${escapeHTML(rarity)}">
            ${escapeHTML(rarity.toUpperCase())}
        </span>

        <h2 class="roulette-name">
            ${escapeHTML(product.name)}
        </h2>

        <p class="roulette-description">
            ${escapeHTML(product.description)}
        </p>

        <div class="roulette-meta">

            <span class="product-price">
                $${Number(product.price).toFixed(2)}
            </span>

            <span class="product-rating">
                ★ ${Number(product.rating).toFixed(1)}
            </span>

        </div>

    `;


    $("#rouletteResult")
        ?.classList.remove("hidden-field");

    $("#rouletteActions")
        ?.classList.remove("hidden-field");


    pulseScreen();


    if (currentUser) {

        const user =
            users.find(
                item => item.id === currentUser.id
            );

        if (user) {

            normalizeUser(user);

            user.rouletteSpins =
                (user.rouletteSpins || 0) + 1;

            currentUser.rouletteSpins =
                user.rouletteSpins;

            saveStorage(
                "teaquest_users",
                users
            );

            saveCurrentUser();

        }

    }


    discoverTea(product.id);

    checkAchievements();

}


/* =========================================================
   MODALS
========================================================= */

function openModal(modal) {

    if (!modal) return;

    modal.classList.add("open");

    document.body.style.overflow = "hidden";

}


function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("open");

    document.body.style.overflow = "";

}


$$(".modal-overlay").forEach(overlay => {

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                closeModal(overlay);

            }

        }
    );

});


document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            $$(".modal-overlay.open")
                .forEach(closeModal);

            closeCart();

            closeFavorites();

        }

    }
);


/* =========================================================
   THEME / WORLD CYCLE
========================================================= */

function initializeTheme() {

    const savedTheme =
        localStorage.getItem(
            "teaquest_theme"
        ) || "day";


    applyTheme(savedTheme);


    $("#themeButton")?.addEventListener(
        "click",
        () => {

            const current =
                localStorage.getItem(
                    "teaquest_theme"
                ) || "day";


            const next =
                current === "day"
                    ? "night"
                    : "day";


            applyTheme(next);

        }
    );

}


function applyTheme(theme) {

    localStorage.setItem(
        "teaquest_theme",
        theme
    );


    const night =
        theme === "night";


    document.body.classList.toggle(
        "night-mode",
        night
    );


    if (night) {

        document.documentElement.style.setProperty(
            "--green",
            "#82ab74"
        );

        document.documentElement.style.setProperty(
            "--green-dark",
            "#24352a"
        );

        document.documentElement.style.setProperty(
            "--mint",
            "#b8ccb0"
        );

        $("#themeButton").textContent =
            "☾";

    } else {

        document.documentElement.style.setProperty(
            "--green",
            "#75d66b"
        );

        document.documentElement.style.setProperty(
            "--green-dark",
            "#32633c"
        );

        document.documentElement.style.setProperty(
            "--mint",
            "#a7f29a"
        );

        $("#themeButton").textContent =
            "☀";

    }


    const metaTheme =
        document.querySelector(
            'meta[name="theme-color"]'
        );

    if (metaTheme) {

        metaTheme.setAttribute(
            "content",
            night ? "#0b0d0c" : "#101b16"
        );

    }

}


/* =========================================================
   TOASTS
========================================================= */

function toast(title, message) {

    const container =
        $("#toastContainer");


    if (!container) return;


    const element =
        document.createElement("div");


    element.className = "toast";


    element.innerHTML = `

        <strong>
            ${escapeHTML(title)}
        </strong>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    container.appendChild(element);


    setTimeout(
        () => element.remove(),
        3700
    );

}


/* =========================================================
   VISUAL EFFECTS
========================================================= */

function pulseScreen() {

    const flash =
        $("#screenFlash");


    if (!flash) return;


    flash.classList.remove("flash");


    void flash.offsetWidth;


    flash.classList.add("flash");

}


function bumpElement(element, className) {

    if (!element) return;


    element.classList.remove(className);


    void element.offsetWidth;


    element.classList.add(className);

}


let levelUpTimeoutId = null;


function showLevelUp(level) {

    const overlay =
        $("#levelUpOverlay");

    if (!overlay) return;


    $("#levelUpNumber").textContent =
        level;


    if (levelUpTimeoutId) {

        clearTimeout(levelUpTimeoutId);

    }


    overlay.classList.remove("show");

    void overlay.offsetWidth;

    overlay.classList.add("show");


    levelUpTimeoutId = setTimeout(
        () => {

            overlay.classList.remove("show");

            levelUpTimeoutId = null;

        },
        1850
    );


    toast(
        "LEVEL UP",
        `You reached Level ${level}.`
    );

}


/* =========================================================
   EASTER EGG
========================================================= */

let secretSequence = [];

const secretCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight"
];


document.addEventListener(
    "keydown",
    event => {

        secretSequence.push(
            event.key
        );


        if (
            secretSequence.length >
            secretCode.length
        ) {

            secretSequence.shift();

        }


        if (
            JSON.stringify(secretSequence) ===
            JSON.stringify(secretCode)
        ) {

            document.body.style.filter =
                "hue-rotate(80deg)";


            toast(
                "SECRET QUEST UNLOCKED",
                "The ancient brew has awakened."
            );


            setTimeout(
                () => {

                    document.body.style.filter =
                        "";

                },
                3000
            );


            secretSequence = [];

        }

    }
);


/* =========================================================
   SAFETY: KEEP DATA VALID
========================================================= */

if (!Array.isArray(products)) {
    products = [...defaultProducts];
}

if (!Array.isArray(users)) {
    users = [...defaultUsers];
}

if (!Array.isArray(cart)) {
    cart = [];
}

if (!Array.isArray(favorites)) {
    favorites = [];
}

if (!Array.isArray(orders)) {
    orders = [];
}


users = users.map(normalizeUser);

saveStorage("teaquest_users", users);