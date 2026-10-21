// Jest setup file - defines globals needed for testing
// This runs before each test file

// Mock globals that the app expects
global.window = global;
global.document = {
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn(),
  createElement: jest.fn(() => ({
    classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    remove: jest.fn(),
    style: {},
    dataset: {},
    innerHTML: '',
    textContent: '',
    value: '',
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn()
  })),
  body: {
    classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() },
    appendChild: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.console = console;
global.fetch = jest.fn();
global.crypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
};
global.performance = {
  now: () => Date.now()
};
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.MutationObserver = class {
  constructor(cb) { this.cb = cb; }
  observe() {}
  disconnect() {}
};
global.URL = URL;
global.File = class File {};
global.FileReader = class FileReader {};
global.FormData = class FormData {};
global.createImageBitmap = jest.fn();
global.AudioContext = class {
  constructor() {
    this.state = 'running';
    this.destination = {};
    this.createGain = () => ({ gain: { value: 1, setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }, connect: jest.fn() });
    this.createOscillator = () => ({ type: 'square', frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }, connect: jest.fn(), start: jest.fn(), stop: jest.fn() });
    this.createBiquadFilter = () => ({ type: 'lowpass', frequency: { value: 1200 } });
    this.createBufferSource = () => ({ buffer: null, connect: jest.fn(), start: jest.fn() });
    this.resume = jest.fn();
  }
};
global.webkitAudioContext = global.AudioContext;

// App globals
global.db = null;
global.currentUser = null;
global.products = [];
global.cart = [];
global.favorites = [];
global.orders = [];
global.customers = [];
global.activeCategory = 'all';
global.authMode = 'login';

// Mock functions
global.toast = jest.fn();
global.showLevelUp = jest.fn();
global.openModal = jest.fn();
global.closeModal = jest.fn();
global.navigateTo = jest.fn();
global.showPage = jest.fn();
global.escapeHTML = (str) => String(str)
  .replaceAll('&', '&')
  .replaceAll('<', '<')
  .replaceAll('>', '>')
  .replaceAll('"', '"')
  .replaceAll("'", '&#039;');
global.getLevelInfo = (xp) => ({ level: Math.floor((xp || 0) / 100) + 1, xpIntoLevel: (xp || 0) % 100, xpTotal: xp || 0, xpForNextLevel: 100 });
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
global.sfx = {
  blip: jest.fn(), coin: jest.fn(), discovery: jest.fn(), achievement: jest.fn(),
  levelUp: jest.fn(), legendary: jest.fn(), perfect: jest.fn(), bitter: jest.fn(),
  miss: jest.fn(), gameOver: jest.fn(), hurt: jest.fn(), grab: jest.fn(),
  gold: jest.fn(), tick: jest.fn(), flip: jest.fn(), match: jest.fn(),
  victory: jest.fn(), record: jest.fn()
};
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
global.MC = {
  VERSION: '1.1.0',
  CH: 16,
  WH: 96,
  WATER: 47,
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  hash2i: (x, z, seed) => ((x * 374761393 + z * 668265263 + seed * 1442695040888963407) | 0),
  mulberry32: (a) => {
    return function() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  vnoise2: jest.fn(),
  fbm2: jest.fn(),
  BLOCKS: [],
  TILE_LIST: {},
  BLOCK: {},
  ITEMS: {},
  itemTexture: jest.fn(),
  itemName: jest.fn(),
  isTool: jest.fn(),
  toolTier: jest.fn(),
  toolKind: jest.fn(),
  CREATIVE_HOTBAR: [],
  CRAFTING: [],
  SMELTING: {},
  FUEL: {},
  matchCrafting: jest.fn(),
  craftUses: jest.fn(),
  TILE: {},
  buildAtlas: jest.fn(),
  sound: {},
  sfx: {},
  World: class World {},
  buildMesh: jest.fn(),
  ChunkRender: class ChunkRender {},
  gfx: {
    init: jest.fn(),
    setCanvas: jest.fn(),
    setWorld: jest.fn(),
    meshChunk: jest.fn(),
    markDirty: jest.fn(),
    processQueued: jest.fn(),
    hasChunk: jest.fn(),
    drawSky: jest.fn(),
    drawChunks: jest.fn(),
    drawClouds: jest.fn(),
    drawBillboard: jest.fn(),
    get remainingQueued() { return 0; }
  },
  input: { keys: new Set(), mouseDX: 0, mouseDY: 0, mousedown: 0, locked: false },
  PW: 0.6, PH: 1.8, EYE: 1.62, GRAV: 32, JUMP: 8.6, WALK: 4.3, SPRINT: 5.7, FLY: 10.5,
  playerPos: [0, 80, 0],
  Player: class Player {},
  findEntitySpawn: jest.fn(),
  raycast: jest.fn(),
  dayLength: 24000,
  timeToAngle: jest.fn(),
  skyState: jest.fn(),
  explode: jest.fn(),
  fuses: [],
  fuseTNT: jest.fn(),
  tickFuses: jest.fn(),
  ignite: jest.fn(),
  particles: [],
  spawnParticles: jest.fn(),
  tickParticles: jest.fn(),
  mobs: [],
  mobDefs: {},
  spawnMob: jest.fn(),
  tickMobs: jest.fn(),
  pointReach: { creative: 6, survival: 4.5 },
  playerBreakBlock: jest.fn(),
  setBlockWithDrops: jest.fn(),
  itemEntities: [],
  spawnItemEntity: jest.fn(),
  tickItemEntities: jest.fn(),
  placeSelected: jest.fn(),
  itemColor: jest.fn(),
  dirFromAngles: jest.fn(),
  onPlayerDeath: jest.fn(),
  modelMat: new Float32Array(16),
  mat4: {
    identity: (out) => { for(let i=0;i<16;i++) out[i]=i%5==0?1:0; return out; },
    perspective: jest.fn(),
    lookAt: jest.fn(),
    multiply: jest.fn(),
    translate: jest.fn(),
    rotateX: jest.fn(),
    rotateY: jest.fn(),
    scale: jest.fn(),
    copy: jest.fn()
  },
  canvas: { width: 800, height: 600, clientWidth: 800, clientHeight: 600, getContext: () => ({}) },
  unitCubeData: null,
  buildUnitCube: jest.fn(),
  drawBox: jest.fn(),
  renderMob: jest.fn(),
  setWorldMatrix: jest.fn(),
  getMobState: jest.fn(),
  SAVE_KEY: 'mcquest_save_v1',
  menuKey: 'mcquest_menu_v1',
  saveWorld: jest.fn(),
  loadWorld: jest.fn(),
  clearSave: jest.fn(),
  applyEdits: jest.fn()
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});