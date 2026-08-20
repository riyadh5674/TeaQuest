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

    saveStorage(
        "teaquest_currentUser",
        currentUser
    );


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

        saveStorage(
            "teaquest_currentUser",
            currentUser
        );

        renderProfile();

    }

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

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


    $$(".filter-button").forEach(button => {

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


function handleAuthentication(event) {

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

        const user =
            users.find(
                item =>
                    item.email === email &&
                    item.password === password
            );


        if (!user) {

            toast(
                "LOGIN FAILED",
                "Wrong email or password."
            );

            return;
        }


        normalizeUser(user);


        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            xp: user.xp,
            discoveries: user.discoveries,
            achievements: user.achievements,
            rouletteSpins: user.rouletteSpins
        };


        saveStorage(
            "teaquest_users",
            users
        );

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
            `Welcome, ${user.name}.`
        );


        if (user.role === "admin") {

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


    if (
        users.some(
            user =>
                user.email === email
        )
    ) {

        toast(
            "ACCOUNT EXISTS",
            "That email is already registered."
        );

        return;
    }


    const newUser = {

        id:
            `user-${Date.now()}`,

        name,

        email,

        password,

        role: "customer",

        xp: 0,

        discoveries: [],

        achievements: [],

        rouletteSpins: 0

    };


    users.push(newUser);


    saveStorage(
        "teaquest_users",
        users
    );


    currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        xp: newUser.xp,
        discoveries: newUser.discoveries,
        achievements: newUser.achievements,
        rouletteSpins: newUser.rouletteSpins
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


function logout() {

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


        saveStorage(
            "teaquest_currentUser",
            currentUser
        );


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

function initializeAdmin() {

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

}


function renderAdmin() {

    if (
        !currentUser ||
        currentUser.role !== "admin"
    ) {

        return;
    }


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


    const productList =
        $("#adminProductsList");


    if (productList) {

        productList.innerHTML =
            products.map(product => `

                <div class="admin-product-row">

                    <div class="admin-product-icon">
                        ${escapeHTML(product.icon)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(product.name)}
                        </strong>

                        <small>
                            $${Number(product.price).toFixed(2)}
                            ·
                            ${escapeHTML(product.category)}
                        </small>

                    </div>

                    <div class="admin-actions">

                        <button
                            title="Edit"
                            data-edit-product="${product.id}"
                        >
                            ✎
                        </button>

                        <button
                            class="delete-product"
                            title="Delete"
                            data-delete-product="${product.id}"
                        >
                            ×
                        </button>

                    </div>

                </div>

            `).join("");


        productList
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


        productList
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


    const ordersList =
        $("#adminOrdersList");


    if (ordersList) {

        if (!orders.length) {

            ordersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <p>No orders yet.</p>
                </div>
            `;

        } else {

            ordersList.innerHTML =
                orders
                    .slice()
                    .reverse()
                    .slice(0, 10)
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

    }

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

            saveStorage(
                "teaquest_currentUser",
                currentUser
            );

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


    if (theme === "night") {

        document.documentElement.style.setProperty(
            "--green",
            "#9c7cff"
        );

        document.documentElement.style.setProperty(
            "--green-dark",
            "#493b78"
        );

        document.documentElement.style.setProperty(
            "--mint",
            "#c4b6ff"
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

if (currentUser) {

    normalizeUser(currentUser);


    const storedUser =
        users.find(
            item => item.id === currentUser.id
        );

    if (storedUser) {

        normalizeUser(storedUser);

        currentUser.discoveries = storedUser.discoveries;

        currentUser.achievements = storedUser.achievements;

        currentUser.rouletteSpins = storedUser.rouletteSpins;

        currentUser.xp = storedUser.xp;

    }


    saveStorage("teaquest_currentUser", currentUser);

}