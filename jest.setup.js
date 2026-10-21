/* =========================================================
   TEAQUEST — JEST SETUP
   ---------------------------------------------------------
   Runs before every test file.

   The jsdom test environment already provides a real DOM
   (window, document, localStorage, fetch, timers ...), so we
   must NOT overwrite those. Instead we only add the app-level
   globals that the classic scripts expect to find, and load the
   shared pure-utility module so tests exercise production code.
   ========================================================= */

const path = require("path");

/* ---------------------------------------------------------
   Load the real utility module under test.
   --------------------------------------------------------- */

const utils = require(path.resolve(__dirname, "utils.js"));

global.TeaQuestUtils = utils;

/* ---------------------------------------------------------
   App globals expected by the classic scripts.
   --------------------------------------------------------- */

global.db = null;
global.currentUser = null;
global.products = [];
global.cart = [];
global.favorites = [];
global.orders = [];
global.customers = [];
global.activeCategory = "all";
global.authMode = "login";

/* ---------------------------------------------------------
   Mocked app functions (never the subject under test).
   --------------------------------------------------------- */

global.toast = jest.fn();
global.showLevelUp = jest.fn();
global.openModal = jest.fn();
global.closeModal = jest.fn();
global.navigateTo = jest.fn();
global.showPage = jest.fn();
global.discoverTea = jest.fn();
global.checkAchievements = jest.fn();
global.renderCodex = jest.fn();
global.saveCurrentUser = jest.fn();
global.syncProfile = jest.fn();
global.loadServerData = jest.fn();
global.restoreSession = jest.fn();
global.normalizeUser = (u) => u;
global.saveStorage = jest.fn();
global.getStorage = (key, fallback) => fallback;
global.confettiBurst = jest.fn();
global.legendaryPulse = jest.fn();
global.pulseScreen = jest.fn();
global.openAuth = jest.fn();
global.renderEverything = jest.fn();
global.renderFeaturedProducts = jest.fn();
global.renderShopProducts = jest.fn();
global.renderCart = jest.fn();
global.renderFavorites = jest.fn();
global.updateNavigation = jest.fn();
global.renderProfile = jest.fn();
global.renderAdmin = jest.fn();
global.updateCounts = jest.fn();
global.initializeNavigation = jest.fn();
global.initializeTheme = jest.fn();
global.initializeShop = jest.fn();
global.initializeCart = jest.fn();
global.initializeFavorites = jest.fn();
global.initializeAuthentication = jest.fn();
global.initializeCheckout = jest.fn();
global.initializeContact = jest.fn();
global.initializeAdmin = jest.fn();
global.initializeRandomTea = jest.fn();
global.initializeRoulette = jest.fn();
global.initializeOracle = jest.fn();
global.initializeArcadePage = jest.fn();
global.initializePerfectBrew = jest.fn();
global.initializeLeafCatch = jest.fn();
global.initializeTeaMemory = jest.fn();
global.initializeEditProfile = jest.fn();
global.renderArcadeBests = jest.fn();
global.renderArcadeRecords = jest.fn();
global.openPerfectBrew = jest.fn();
global.openLeafCatch = jest.fn();
global.openTeaMemory = jest.fn();
global.recordArcadePlay = jest.fn();
global.saveArcadeScore = jest.fn();
global.awardArcadeXp = jest.fn();
global.refreshTavern = jest.fn();
global.shutdownTavern = jest.fn();
global.bootTavern = jest.fn();
global.loadDirectory = jest.fn();
global.refreshFriendState = jest.fn();
global.renderFriendLists = jest.fn();
global.renderSearchResults = jest.fn();
global.sendFriendRequest = jest.fn();
global.acceptRequest = jest.fn();
global.declineRequest = jest.fn();
global.removeBuddy = jest.fn();
global.openDm = jest.fn();
global.showFloor = jest.fn();
global.loadFloorHistory = jest.fn();
global.sendFloorMessage = jest.fn();
global.loadDmHistory = jest.fn();
global.sendDmLetter = jest.fn();
global.subscribeRealtime = jest.fn();
global.subscribePresence = jest.fn();
global.queueFriendshipSync = jest.fn();

global.sfx = {
  blip: jest.fn(), coin: jest.fn(), discovery: jest.fn(), achievement: jest.fn(),
  levelUp: jest.fn(), legendary: jest.fn(), perfect: jest.fn(), bitter: jest.fn(),
  miss: jest.fn(), gameOver: jest.fn(), hurt: jest.fn(), grab: jest.fn(),
  gold: jest.fn(), tick: jest.fn(), flip: jest.fn(), match: jest.fn(),
  victory: jest.fn(), record: jest.fn()
};

/* ---------------------------------------------------------
   App helpers re-exported from utils so legacy call sites
   inside the app keep working under test.
   --------------------------------------------------------- */

global.escapeHTML = utils.escapeHTML;
global.escapeAttr = utils.escapeAttr;
global.getLevelInfo = utils.getLevelInfo;
global.getProductRarity = utils.getProductRarity;
global.shortOrderId = utils.shortOrderId;

/* ---------------------------------------------------------
   Cleanup between tests.
   --------------------------------------------------------- */

afterEach(() => {
  jest.clearAllMocks();
});
