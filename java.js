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
    },

    {
        id: "arcade-rookie",
        name: "ARCADE ROOKIE",
        description: "Play your first arcade game.",
        condition: user =>
            (user.arcadePlays || 0) >= 1
    },

    {
        id: "perfect-palate",
        name: "PERFECT PALATE",
        description: "Brew 15 perfect cups in a row.",
        condition: user =>
            (user.highScores?.["perfect-brew"] || 0) >= 15
    },

    {
        id: "leaf-legend",
        name: "LEAF LEGEND",
        description: "Score 500 in Leaf Catch.",
        condition: user =>
            (user.highScores?.["leaf-catch"] || 0) >= 500
    },

    {
        id: "memory-master",
        name: "MEMORY MASTER",
        description: "Win Tea Memory in 12 moves or fewer.",
        condition: user =>
        {
            const best =
                user.highScores?.["tea-memory"] || 0;

            return best > 0 && best <= 12;
        }
    }

];


/* =========================================================
   APPLICATION STATE
========================================================= */

let products =
    getStorage("teaquest_products", defaultProducts);

let customers = [];

let cart =
    getStorage("teaquest_cart", []);

let favorites =
    getStorage("teaquest_favorites", []);

let orders =
    getStorage("teaquest_orders", []);

let currentUser =
    getStorage("teaquest_currentUser", null);

if (currentUser) {
    normalizeUser(currentUser);
}

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
    "https://mfgvssuodjtsibfqrcgu.supabase.co";

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
        role: row.role === "admin" ? "admin" : "player",
        xp: Number(row.xp || 0),
        discoveries: Array.isArray(row.discoveries)
            ? row.discoveries
            : [],
        achievements: Array.isArray(row.achievements)
            ? row.achievements
            : [],
        rouletteSpins:
            Number(row.roulette_spins || 0),
        highScores:
            row.high_scores &&
            typeof row.high_scores === "object" &&
            !Array.isArray(row.high_scores)
                ? row.high_scores
                : {},
        arcadePlays:
            Number(row.arcade_plays || 0)
    };

}


function mapProductRow(row) {

    return {
        id: row.id,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        icon: row.icon || "🍵",
        rating: Number(row.rating || 5),
        rarity: row.rarity || undefined,
        origin: row.origin || "",
        flavorNotes: row.flavor_notes || "",
        moods: Array.isArray(row.moods) ? row.moods : [],
        flavorProfile: Array.isArray(row.flavor_profile)
            ? row.flavor_profile
            : [],
        strength: row.strength || "medium",
        description: row.description || ""
    };

}


function mapProductToRow(product) {

    return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: Number(product.price),
        icon: product.icon || "🍵",
        rating: Number(product.rating || 5),
        rarity: product.rarity || getProductRarity(product),
        origin: product.origin || "",
        flavor_notes: product.flavorNotes || "",
        moods: product.moods || [],
        flavor_profile: product.flavorProfile || [],
        strength: product.strength || "medium",
        description: product.description || ""
    };

}


function mapOrderRow(row) {

    return {
        id: row.id,
        userId: row.user_id,
        customer: row.customer,
        address: row.address,
        phone: row.phone || "",
        payment: row.payment || "card",
        total: Number(row.total),
        status: row.status,
        createdAt: row.created_at,

        items: (row.order_items || []).map(item => ({
            productId: item.product_id,
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity
        }))

    };

}


async function fetchProducts() {

    if (!db) return false;

    const { data, error } =
        await db
            .from("products")
            .select("*")
            .order("created_at", { ascending: true });


    if (error) {

        console.warn("Failed to load products", error);

        return false;

    }


    if (!data || !data.length) {
        return false;
    }


    products = data.map(mapProductRow);

    saveStorage("teaquest_products", products);

    return true;

}


async function upsertProductRemote(product) {

    if (!db) throw new Error("Backend offline");

    const { error } =
        await db
            .from("products")
            .upsert(mapProductToRow(product));

    if (error) throw error;

}


async function deleteProductRemote(productId) {

    if (!db) throw new Error("Backend offline");

    const { error } =
        await db
            .from("products")
            .delete()
            .eq("id", productId);

    if (error) throw error;

}


async function fetchOrders() {

    if (!db) return false;

    const { data, error } =
        await db
            .from("orders")
            .select("*, order_items(*)")
            .order("created_at", { ascending: true });


    if (error) {

        console.warn("Failed to load orders", error);

        return false;

    }


    orders = (data || []).map(mapOrderRow);

    saveStorage("teaquest_orders", orders);

    return true;

}


async function insertOrderRemote(order) {

    if (!db) throw new Error("Backend offline");

    const { data, error } =
        await db
            .from("orders")
            .insert({
                user_id: order.userId,
                customer: order.customer,
                address: order.address,
                phone: order.phone,
                payment: order.payment,
                total: order.total,
                status: order.status
            })
            .select()
            .single();


    if (error) throw error;


    const rows = order.items.map(item => ({
        order_id: data.id,
        product_id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
    }));


    if (rows.length) {

        const { error: itemsError } =
            await db.from("order_items").insert(rows);


        if (itemsError) throw itemsError;

    }

    return data.id;

}


async function updateOrderStatusRemote(orderId, status) {

    if (!db) throw new Error("Backend offline");

    const { error } =
        await db
            .from("orders")
            .update({ status })
            .eq("id", orderId);

    if (error) throw error;

}


async function deleteOrderRemote(orderId) {

    if (!db) throw new Error("Backend offline");

    const { error } =
        await db
            .from("orders")
            .delete()
            .eq("id", orderId);

    if (error) throw error;

}


async function fetchCustomers() {

    if (!db) return false;

    const { data, error } =
        await db
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: true });


    if (error) {

        console.warn("Failed to load customers", error);

        return false;

    }


    customers = (data || []).map(mapProfile);

    return true;

}


async function updateCustomerRoleRemote(userId, role) {

    if (!db) throw new Error("Backend offline");

    const { error } =
        await db
            .from("profiles")
            .update({ role })
            .eq("id", userId);

    if (error) throw error;

}


async function deleteCustomerRemote(userId) {

    if (!db) throw new Error("Backend offline");

    const { error } =
        await db
            .from("profiles")
            .delete()
            .eq("id", userId);

    if (error) throw error;

}


async function fetchFavorites() {

    if (!db || !currentUser) return;

    const { data, error } =
        await db
            .from("favorites")
            .select("product_id")
            .eq("user_id", currentUser.id);


    if (error) {

        console.warn("Failed to load favorites", error);

        return;

    }


    favorites = (data || []).map(
        row => row.product_id
    );

    saveStorage("teaquest_favorites", favorites);

}


async function setFavoriteRemote(productId, active) {

    if (!db || !currentUser) return;


    if (!active) {

        const { error } =
            await db
                .from("favorites")
                .delete()
                .match({
                    user_id: currentUser.id,
                    product_id: productId
                });

        if (error) console.warn(error);

        return;

    }

    const { error } =
        await db
            .from("favorites")
            .upsert({
                user_id: currentUser.id,
                product_id: productId
            });

    if (error) console.warn(error);

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


let profileSyncWarned = false;


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
            roulette_spins: currentUser.rouletteSpins,
            high_scores: currentUser.highScores || {},
            arcade_plays: currentUser.arcadePlays || 0
        })
        .eq("id", currentUser.id)
        .then(({ error }) => {

            if (error && !profileSyncWarned) {

                profileSyncWarned = true;

                toast(
                    "SYNC FAILED",
                    "Progress could not reach the server."
                );

            }

        })
        .catch(() => {

            if (!profileSyncWarned) {

                profileSyncWarned = true;

                toast(
                    "OFFLINE",
                    "Progress will sync when you reconnect."
                );

            }

        });

}


function saveCurrentUser() {

    normalizeUser(currentUser);

    saveStorage(
        "teaquest_currentUser",
        currentUser
    );

    syncProfile();

}


async function restoreSession() {

    if (!db) {
        return;
    }

    let sessionUser = null;

    try {

        sessionUser =
            await loadProfileSession();

        currentUser = sessionUser;

    } catch (error) {

        currentUser =
            getStorage("teaquest_currentUser", null);

        if (currentUser) {
            normalizeUser(currentUser);
        }

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


async function loadServerData() {

    if (!db) return;

    await fetchProducts();

    if (currentUser) {

        await Promise.all([
            fetchFavorites(),
            fetchOrders()
        ]);

    }

    if (
        currentUser &&
        currentUser.role === "admin"
    ) {

        await fetchCustomers();

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


    if (!user.highScores ||
        typeof user.highScores !== "object" ||
        Array.isArray(user.highScores)) {
        user.highScores = {};
    }

    if (typeof user.arcadePlays !== "number") {
        user.arcadePlays = 0;
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


function shortOrderId(id) {

    const text =
        String(id || "");

    if (text.length <= 10) {
        return text;
    }

    return `#${text.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase()}`;

}


/* =========================================================
   RARITY & PROGRESSION
======================================================== */

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


    normalizeUser(currentUser);


    if (currentUser.discoveries.includes(productId)) {
        return;
    }


    currentUser.discoveries.push(productId);


    const previousLevel =
        getLevelInfo(currentUser.xp).level;

    currentUser.xp =
        Number(currentUser.xp || 0) +
        DISCOVERY_XP_REWARD;

    const newLevel =
        getLevelInfo(currentUser.xp).level;


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
            ? currentUser.discoveries || []
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


    normalizeUser(currentUser);


    let unlockedNew = false;


    ACHIEVEMENTS.forEach(achievement => {

        if (currentUser.achievements.includes(achievement.id)) {
            return;
        }

        if (!achievement.condition(currentUser)) {
            return;
        }

        currentUser.achievements.push(achievement.id);

        unlockedNew = true;

        toast(
            "ACHIEVEMENT UNLOCKED",
            achievement.name
        );

    });


    if (unlockedNew) {

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

    await loadServerData();


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

    window.refreshTavern?.();

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
        "arcade",
        "tavern",
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

            const searchable = [
                product.name,
                product.description,
                product.category
            ]
                .join(" ")
                .replace(/\s+/g, " ")
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
                                data-quantity="${escapeHTML(product.id)}"
                                data-change="-1"
                            >
                                −
                            </button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                data-quantity="${escapeHTML(product.id)}"
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

    const active =
        favorites.includes(productId);


    if (active) {

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


    setFavoriteRemote(productId, !active);


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
                        data-fav-add="${escapeHTML(product.id)}"
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

    if (authMode === "admin") {

        setAuthMode("login");

        return;

    }


    setAuthMode("admin");


    $("#authEmail")?.focus();

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

    const admin =
        mode === "admin";


    $(".auth-modal")?.classList.toggle(
        "admin-mode",
        admin
    );


    $("#authEyebrow").textContent =
        admin
            ? "GUILD MASTER"
            : "PLAYER ACCESS";


    $("#authTitle").textContent =
        admin
            ? "GUILD MASTER ACCESS"
            : signup
                ? "CREATE YOUR CHARACTER"
                : "WELCOME BACK";


    $("#authSubtitle").textContent =
        admin
            ? "Enter your master credentials to open the command center."
            : signup
                ? "Create your player account."
                : "Login to continue your tea quest.";


    $("#authSubmitText").textContent =
        admin
            ? "OPEN COMMAND CENTER"
            : signup
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


    $("#adminLoginButton").textContent =
        admin
            ? "← BACK TO PLAYER LOGIN"
            : "⚙ LOGIN AS GUILD MASTER";


    $("#adminSetupNote")
        ?.classList.toggle(
            "hidden-field",
            !admin
        );


    $(".auth-switch")
        ?.classList.toggle(
            "hidden-field",
            admin
        );


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


    if (authMode === "admin") {

        if (!db) {

            toast(
                "BACKEND OFFLINE",
                "Cannot reach the server."
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
                "ACCESS DENIED",
                "Wrong master credentials."
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


        const mappedProfile =
            profile
                ? mapProfile(profile)
                : null;


        if (
            !mappedProfile ||
            mappedProfile.role !== "admin"
        ) {

            await db.auth.signOut();


            toast(
                "ACCESS DENIED",
                "This account is not a Guild Master."
            );

            return;
        }


        currentUser = mappedProfile;


        saveStorage(
            "teaquest_currentUser",
            currentUser
        );


        await fetchCustomers();

        await fetchOrders();


        closeModal(
            $("#authModal")
        );


        renderEverything();


        toast(
            "HAIL, GUILD MASTER",
            "The command center awaits."
        );


        navigateTo("admin");

        return;
    }


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


        await fetchFavorites();

        await fetchOrders();


        if (currentUser.role === "admin") {
            await fetchCustomers();
        }


        closeModal(
            $("#authModal")
        );


        renderEverything();


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


    if (!data.session) {

        closeModal(
            $("#authModal")
        );


        toast(
            "CONFIRM YOUR EMAIL",
            "Check your inbox to activate your account, then log in."
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


    await fetchFavorites();

    await fetchOrders();


    closeModal(
        $("#authModal")
    );


    renderEverything();

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

    window.shutdownTavern?.();

    currentUser = null;

    customers = [];

    favorites =
        getStorage("teaquest_favorites", []);

    localStorage.removeItem(
        "teaquest_currentUser"
    );


    await fetchOrders().catch(() => {});


    updateNavigation();

    renderEverything();

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


    const user = normalizeUser(currentUser);


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


    const user = normalizeUser(currentUser);


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


    if (typeof window.renderArcadeRecords === "function") {
        window.renderArcadeRecords();
    }


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
                            ${escapeHTML(shortOrderId(order.id))}
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


async function submitOrder(event) {

    event.preventDefault();


    const total =
        getCartTotal();


    const order = {

        id:
            (window.crypto && crypto.randomUUID)
                ? crypto.randomUUID()
                : `local-${Date.now()}-${Math.random()
                      .toString(16)
                      .slice(2, 8)}`,

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

        items: cart.map(item => {

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


    let remoteId = null;

    let serverError = false;


    try {

        remoteId =
            await insertOrderRemote(order);

    } catch (error) {

        console.warn(
            "Order sync failed, kept locally",
            error
        );

        serverError = true;

    }


    if (remoteId) {
        order.id = remoteId;
    }


    orders.push(order);


    saveStorage(
        "teaquest_orders",
        orders
    );


    const previousLevel =
        getLevelInfo(currentUser.xp).level;


    currentUser.xp =
        Number(currentUser.xp || 0) +
        ORDER_XP_REWARD;


    saveCurrentUser();


    const newLevel =
        getLevelInfo(currentUser.xp).level;


    if (newLevel > previousLevel) {

        showLevelUp(newLevel);

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
        serverError
            ? "Order saved on this device only (offline)."
            : `Order has been placed.`
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
        currentUser && !customers.length
            ? 1
            : customers.filter(
                  user =>
                      user.role === "player"
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
                            ${escapeHTML(shortOrderId(order.id))}
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
                            ${escapeHTML(shortOrderId(order.id))}
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


async function updateOrderStatus(orderId, status) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;


    try {

        await updateOrderStatusRemote(orderId, status);

    } catch (error) {

        console.warn(error);

        toast(
            "UPDATE FAILED",
            "Could not reach the server."
        );

        renderAdminOrdersTable();

        return;

    }


    order.status = status;

    saveStorage(
        "teaquest_orders",
        orders
    );


    renderProfile();

    renderAdminRecentOrders();


    toast(
        "ORDER UPDATED",
        `${shortOrderId(orderId)} marked as ${status}.`
    );

}


function viewOrderDetails(orderId) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;


    $("#orderModalTitle").textContent =
        shortOrderId(order.id);


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


async function adminDeleteOrder(orderId) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;


    if (!window.confirm(`Delete order ${shortOrderId(orderId)}?`)) {
        return;
    }


    try {

        await deleteOrderRemote(orderId);

    } catch (error) {

        console.warn(error);

        toast(
            "DELETE FAILED",
            "Could not reach the server."
        );

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
        `${shortOrderId(orderId)} has been removed.`
    );

}


function renderAdminCustomersTable() {

    const body =
        $("#adminCustomersBody");

    if (!body) return;


    const visibleCustomers =
        currentUser && !customers.length
            ? [currentUser]
            : customers;


    if (!visibleCustomers.length) {

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
        visibleCustomers.map(user => {

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
                    : '<span class="role-tag">PLAYER</span>';


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
                                        title="${user.role === "admin" ? "Demote to player" : "Promote to admin"}"
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


async function toggleUserRole(userId) {

    const user =
        customers.find(
            item => item.id === userId
        ) ||
        (currentUser && currentUser.id === userId
            ? currentUser
            : null);

    if (!user) return;


    const nextRole =
        user.role === "admin"
            ? "player"
            : "admin";


    try {

        await updateCustomerRoleRemote(userId, nextRole);

    } catch (error) {

        console.warn(error);

        toast(
            "UPDATE FAILED",
            "Could not reach the server."
        );

        return;

    }


    user.role = nextRole;


    if (currentUser.id === userId) {

        currentUser.role = nextRole;

        saveCurrentUser();

        updateNavigation();

    }


    renderAdminCustomersTable();


    toast(
        "ROLE UPDATED",
        `${user.name} is now ${nextRole === "admin" ? "an admin" : "a player"}.`
    );

}


async function adminDeleteUser(userId) {

    const user =
        customers.find(
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


    if (!window.confirm(`Delete player "${user.name}"? Their profile and orders will be removed. The login account itself must be removed from the Supabase dashboard.`)) {
        return;
    }


    try {

        await deleteCustomerRemote(userId);

    } catch (error) {

        console.warn(error);

        toast(
            "DELETE FAILED",
            "Could not reach the server."
        );

        return;

    }


    customers =
        customers.filter(
            item => item.id !== userId
        );


    orders = orders.filter(
        order => order.userId !== userId
    );

    saveStorage("teaquest_orders", orders);


    renderAdminCustomersTable();

    renderAdminStats();

    renderAdminOrdersTable();


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


    if (!db) {

        toast(
            "BACKEND OFFLINE",
            "Cannot reach the server."
        );

        return;

    }


    const email =
        currentUser && currentUser.email;


    if (!email) {

        toast(
            "SESSION ERROR",
            "Please log in again."
        );

        return;

    }


    const { error: verifyError } =
        await db.auth.signInWithPassword({
            email,
            password: current
        });


    if (verifyError) {

        toast(
            "WRONG PASSWORD",
            "Current password is incorrect."
        );

        return;

    }


    const { error } =
        await db.auth.updateUser({
            password: next
        });


    if (error) {

        toast(
            "UPDATE FAILED",
            error.message || "Could not change password."
        );

        return;

    }


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

        profile: currentUser,

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


async function saveAdminProduct(event) {

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


    let savedProduct = null;

    let isNew = false;


    if (id) {

        const index =
            products.findIndex(
                product =>
                    product.id === id
            );


        if (index === -1) return;


        savedProduct = {
            ...products[index],
            ...productData
        };

    } else {

        isNew = true;

        savedProduct = {
            id:
                (window.crypto && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : `tea-${Date.now()}`,
            rarity: getProductRarity({
                ...productData,
                price: productData.price
            }),
            origin: "",
            flavorNotes: "",
            moods: [],
            flavorProfile: [],
            strength: "medium",
            ...productData
        };

    }


    try {

        await upsertProductRemote(savedProduct);

    } catch (error) {

        console.warn(error);

        toast(
            "SAVE FAILED",
            error.message || "Could not reach the server."
        );

        return;

    }


    if (isNew) {

        products.push(savedProduct);

        toast(
            "NEW TEA CREATED",
            "The tea has entered the marketplace."
        );

    } else {

        toast(
            "DATABASE UPDATED",
            "Tea item successfully modified."
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


async function deleteProduct(productId) {

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


    try {

        await deleteProductRemote(productId);

    } catch (error) {

        console.warn(error);

        toast(
            "DELETE FAILED",
            "Could not reach the server."
        );

        return;

    }


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


/* =========================================================
   TEA ROULETTE
========================================================= */

const ROULETTE_WEIGHTS = {
    common: 40,
    uncommon: 25,
    rare: 17,
    epic: 12,
    legendary: 6
};


function pickWeightedProduct() {

    const pool = [];

    let totalWeight = 0;


    products.forEach(product => {

        const weight =
            ROULETTE_WEIGHTS[
                getProductRarity(product)
            ] || 10;

        pool.push({
            product,
            weight
        });

        totalWeight += weight;

    });


    if (!pool.length) {
        return null;
    }


    let roll =
        Math.random() * totalWeight;

    for (const entry of pool) {

        roll -= entry.weight;

        if (roll <= 0) {
            return entry.product;
        }

    }

    return pool[pool.length - 1].product;

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

            window.sfx?.tick?.();

            ticks++;


            if (ticks >= totalTicks) {

                clearInterval(rouletteIntervalId);

                rouletteIntervalId = null;


                revealRouletteResult(
                    pickWeightedProduct()
                );

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


    if (rarity === "legendary") {

        $("#rouletteTitle").textContent =
            "✦ LEGENDARY DROP ✦";

        window.sfx?.legendary?.();

        window.legendaryPulse?.();

    } else {

        pulseScreen();

        window.sfx?.coin?.();

    }


    if (currentUser) {

        normalizeUser(currentUser);

        currentUser.rouletteSpins =
            (currentUser.rouletteSpins || 0) + 1;

        saveCurrentUser();

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
======================================================== */

if (!Array.isArray(products)) {
    products = [...defaultProducts];
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

if (!Array.isArray(customers)) {
    customers = [];
}