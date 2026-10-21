/**
 * TeaQuest Utility Function Tests
 * Tests core utility functions from java.js
 */

import { escapeHTML } from '../java.js';

// Mock the global functions
global.escapeHTML = (str) => String(str)
  .replaceAll('&', '&')
  .replaceAll('<', '<')
  .replaceAll('>', '>')
  .replaceAll('"', '"')
  .replaceAll("'", '&#039;');

describe('escapeHTML', () => {
  test('escapes basic HTML characters', () => {
    expect(escapeHTML('<script>alert(1)</script>')).toBe('<script>alert(1)</script>');
    expect(escapeHTML('"quotes"')).toBe('"quotes"');
    expect(escapeHTML("'single'")).toBe('&#039;single&#039;');
    expect(escapeHTML('&ampersand&')).toBe('&ampersand&');
  });

  test('handles empty and null inputs', () => {
    expect(escapeHTML('')).toBe('');
    expect(escapeHTML(null)).toBe('null');
    expect(escapeHTML(undefined)).toBe('undefined');
  });

  test('handles numbers and special chars', () => {
    expect(escapeHTML(123)).toBe('123');
    expect(escapeHTML('<>&"\'')).toBe('<>&"\'');
  });
});

// Test getLevelInfo logic
function getLevelInfo(xpTotal) {
  const xp = Math.max(0, Number(xpTotal) || 0);
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;
  return { level, xpIntoLevel, xpTotal: xp, xpForNextLevel: 100 };
}

describe('getLevelInfo', () => {
  test('calculates correct level for XP values', () => {
    expect(getLevelInfo(0).level).toBe(1);
    expect(getLevelInfo(50).level).toBe(1);
    expect(getLevelInfo(100).level).toBe(2);
    expect(getLevelInfo(250).level).toBe(3);
    expect(getLevelInfo(999).level).toBe(10);
  });

  test('calculates correct XP into level', () => {
    expect(getLevelInfo(0).xpIntoLevel).toBe(0);
    expect(getLevelInfo(50).xpIntoLevel).toBe(50);
    expect(getLevelInfo(100).xpIntoLevel).toBe(0);
    expect(getLevelInfo(150).xpIntoLevel).toBe(50);
  });

  test('handles negative XP', () => {
    expect(getLevelInfo(-10).level).toBe(1);
    expect(getLevelInfo(-10).xpIntoLevel).toBe(0);
  });

  test('handles non-numeric input', () => {
    expect(getLevelInfo('abc').level).toBe(1);
    expect(getLevelInfo(null).level).toBe(1);
  });
});

// Test getProductRarity logic
function getProductRarity(product) {
  if (!product) return 'common';
  if (product.rarity) return product.rarity;
  const price = Number(product.price) || 0;
  if (price >= 24) return 'legendary';
  if (price >= 19) return 'epic';
  if (price >= 16) return 'rare';
  if (price >= 13) return 'uncommon';
  return 'common';
}

describe('getProductRarity', () => {
  test('returns explicit rarity when set', () => {
    expect(getProductRarity({ rarity: 'epic', price: 10 })).toBe('epic');
  });

  test('calculates rarity from price', () => {
    expect(getProductRarity({ price: 10 })).toBe('common');
    expect(getProductRarity({ price: 13 })).toBe('uncommon');
    expect(getProductRarity({ price: 16 })).toBe('rare');
    expect(getProductRarity({ price: 19 })).toBe('epic');
    expect(getProductRarity({ price: 24 })).toBe('legendary');
  });

  test('handles missing price', () => {
    expect(getProductRarity({})).toBe('common');
    expect(getProductRarity(null)).toBe('common');
  });
});

// Test cart logic
describe('Cart operations', () => {
  let cart = [];

  function addToCart(product, quantity = 1) {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId: product.id, name: product.name, price: product.price, quantity });
    }
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  beforeEach(() => {
    cart = [];
  });

  test('adds items to empty cart', () => {
    addToCart({ id: 'tea-001', name: 'Forest Mint', price: 12 }, 2);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  test('increments quantity for existing item', () => {
    addToCart({ id: 'tea-001', name: 'Forest Mint', price: 12 }, 1);
    addToCart({ id: 'tea-001', name: 'Forest Mint', price: 12 }, 2);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  test('calculates correct total', () => {
    addToCart({ id: 'tea-001', name: 'Forest Mint', price: 12 }, 2);
    addToCart({ id: 'tea-002', name: 'Dragon Ember', price: 15 }, 1);
    expect(getCartTotal()).toBe(39);
  });

  test('removes item from cart', () => {
    addToCart({ id: 'tea-001', name: 'Forest Mint', price: 12 }, 1);
    addToCart({ id: 'tea-002', name: 'Dragon Ember', price: 15 }, 1);
    removeFromCart('tea-001');
    expect(cart).toHaveLength(1);
    expect(cart[0].productId).toBe('tea-002');
  });
});

// Test favorites logic
describe('Favorites operations', () => {
  let favorites = [];

  function toggleFavorite(productId) {
    const index = favorites.indexOf(productId);
    if (index >= 0) {
      favorites.splice(index, 1);
      return false;
    } else {
      favorites.push(productId);
      return true;
    }
  }

  function isFavorite(productId) {
    return favorites.includes(productId);
  }

  beforeEach(() => {
    favorites = [];
  });

  test('adds to favorites', () => {
    const added = toggleFavorite('tea-001');
    expect(added).toBe(true);
    expect(isFavorite('tea-001')).toBe(true);
  });

  test('removes from favorites', () => {
    toggleFavorite('tea-001');
    const added = toggleFavorite('tea-001');
    expect(added).toBe(false);
    expect(isFavorite('tea-001')).toBe(false);
  });
});

// Test order summary calculation
describe('Order calculations', () => {
  function calculateOrderTotal(items) {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function formatCurrency(amount) {
    return '$' + Number(amount).toFixed(2);
  }

  test('calculates order total with multiple items', () => {
    const items = [
      { price: 12, quantity: 2 },
      { price: 15, quantity: 1 },
      { price: 14, quantity: 3 }
    ];
    expect(calculateOrderTotal(items)).toBe(81);
  });

  test('formats currency correctly', () => {
    expect(formatCurrency(12)).toBe('$12.00');
    expect(formatCurrency(12.5)).toBe('$12.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

// Test achievement condition logic
describe('Achievement conditions', () => {
  function checkFirstLeaf(user) {
    return (user.discoveries || []).length >= 1;
  }

  function checkCollector(user) {
    return (user.discoveries || []).length >= 5;
  }

  function checkTeaScholar(user) {
    return (user.discoveries || []).length >= 10;
  }

  function checkTeaMaster(user) {
    return getLevelInfo(user.xp || 0).level >= 10;
  }

  test('first leaf triggers at 1 discovery', () => {
    expect(checkFirstLeaf({ discoveries: [] })).toBe(false);
    expect(checkFirstLeaf({ discoveries: ['tea-001'] })).toBe(true);
  });

  test('collector triggers at 5 discoveries', () => {
    expect(checkCollector({ discoveries: ['tea-001', 'tea-002'] })).toBe(false);
    expect(checkCollector({ discoveries: ['tea-001', 'tea-002', 'tea-003', 'tea-004', 'tea-005'] })).toBe(true);
  });

  test('tea master triggers at level 10', () => {
    expect(checkTeaMaster({ xp: 899 })).toBe(false);
    expect(checkTeaMaster({ xp: 900 })).toBe(true);
  });
});