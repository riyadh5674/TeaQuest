/**
 * TeaQuest — shared utility tests
 *
 * These exercise the REAL production module (utils.js) that the
 * application loads in the browser. Nothing here re-implements the
 * logic: if a function breaks in the app, these tests fail.
 */

const utils = require('../utils.js');

const {
  escapeHTML,
  escapeAttr,
  sanitizeText,
  sanitizeFilename,
  sanitizeURL,
  validateEmail,
  validatePhone,
  normalizeEmail,
  calculateAge,
  isValidAge,
  formatCurrency,
  round2,
  clamp,
  shortOrderId,
  getLevelInfo,
  getProductRarity,
  calculateCartTotal,
  calculateCartCount,
  addCartItem,
  removeCartItem,
  setCartQuantity,
  toggleFavorite,
  isFavorite,
  getUnlockedAchievementIds,
  ACHIEVEMENT_DEFINITIONS,
  XP_PER_LEVEL,
  ORDER_XP_REWARD,
  MIN_SIGNUP_AGE
} = utils;

/* =========================================================
   HTML ESCAPING (XSS)
   ========================================================= */

describe('escapeHTML', () => {
  test('encodes the five dangerous characters', () => {
    expect(escapeHTML('&')).toBe('&amp;');
    expect(escapeHTML('<')).toBe('&lt;');
    expect(escapeHTML('>')).toBe('&gt;');
    expect(escapeHTML('"')).toBe('&quot;');
    expect(escapeHTML("'")).toBe('&#039;');
  });

  test('encodes ampersands first so entities are not double-broken', () => {
    expect(escapeHTML('&lt;')).toBe('&amp;lt;');
  });

  test('neutralises a script tag payload', () => {
    const escaped = escapeHTML('<script>alert("xss")</script>');
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  test('neutralises an img onerror payload', () => {
    const escaped = escapeHTML('<img src=x onerror=alert(1)>');
    expect(escaped).not.toContain('<img');
    expect(escaped).not.toContain('<');
    expect(escaped).toContain('&lt;img');
  });

  test('neutralises a closing-tag injection payload', () => {
    const escaped = escapeHTML('</div><script>alert(1)</script>');
    expect(escaped).toContain('&#x2F;');
    expect(escaped).not.toContain('</div>');
  });

  test('handles null and undefined as empty strings', () => {
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
  });

  test('handles numbers and booleans', () => {
    expect(escapeHTML(123)).toBe('123');
    expect(escapeHTML(0)).toBe('0');
    expect(escapeHTML(false)).toBe('false');
  });

  test('leaves plain text untouched', () => {
    expect(escapeHTML('Forest Mint')).toBe('Forest Mint');
    expect(escapeHTML('')).toBe('');
  });
});

describe('escapeAttr', () => {
  test('encodes quote characters used to break out of attributes', () => {
    expect(escapeAttr('" onmouseover="alert(1)')).toBe(
      '&quot; onmouseover=&quot;alert(1)'
    );
  });

  test('encodes single quotes', () => {
    expect(escapeAttr("' onfocus='alert(1)")).toBe(
      '&#039; onfocus=&#039;alert(1)'
    );
  });

  test('returns empty string for null', () => {
    expect(escapeAttr(null)).toBe('');
  });
});

/* =========================================================
   TEXT / FILENAME / URL SANITISATION
   ========================================================= */

describe('sanitizeText', () => {
  test('removes control characters', () => {
    expect(sanitizeText('hel\u0000lo')).toBe('hello');
    expect(sanitizeText('a\u0007b')).toBe('ab');
    expect(sanitizeText('a\tb')).toBe('ab');
    expect(sanitizeText('a\nb')).toBe('ab');
  });

  test('trims and collapses whitespace', () => {
    expect(sanitizeText('  spaced   out  ')).toBe('spaced out');
  });

  test('enforces the maximum length', () => {
    expect(sanitizeText('x'.repeat(50), 10)).toHaveLength(10);
  });

  test('returns empty string for null', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });
});

describe('sanitizeFilename', () => {
  test('replaces path traversal characters', () => {
    const result = sanitizeFilename('../../etc/passwd');
    expect(result).not.toContain('/');
    expect(result).not.toContain('\\');
    expect(result).not.toContain('..');
  });

  test('keeps a sensible fallback', () => {
    expect(sanitizeFilename('')).toBe('file');
    expect(sanitizeFilename('   ')).toBe('file');
  });

  test('preserves ordinary names', () => {
    expect(sanitizeFilename('receipt.pdf')).toBe('receipt.pdf');
  });
});

describe('sanitizeURL', () => {
  test('rejects javascript: URLs', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('');
  });

  test('rejects data: URLs', () => {
    expect(sanitizeURL('data:text/html;base64,PHNjcmlwdD4=')).toBe('');
  });

  test('rejects vbscript: URLs', () => {
    expect(sanitizeURL('vbscript:msgbox(1)')).toBe('');
  });

  test('allows https and http', () => {
    expect(sanitizeURL('https://teaquest.dev')).toBe('https://teaquest.dev');
    expect(sanitizeURL('http://example.com/x')).toBe('http://example.com/x');
  });

  test('allows mailto and tel', () => {
    expect(sanitizeURL('mailto:hi@teaquest.dev')).toBe('mailto:hi@teaquest.dev');
    expect(sanitizeURL('tel:+15550000000')).toBe('tel:+15550000000');
  });

  test('allows relative URLs and fragments', () => {
    expect(sanitizeURL('/shop')).toBe('/shop');
    expect(sanitizeURL('#quest')).toBe('#quest');
  });

  test('upgrades a bare domain to https', () => {
    expect(sanitizeURL('teaquest.dev')).toBe('https://teaquest.dev');
  });

  test('returns empty string for empty input', () => {
    expect(sanitizeURL('')).toBe('');
    expect(sanitizeURL(null)).toBe('');
  });
});

/* =========================================================
   VALIDATION
   ========================================================= */

describe('validateEmail', () => {
  test('accepts valid addresses', () => {
    expect(validateEmail('brewer@teaquest.dev')).toBe(true);
    expect(validateEmail('first.last+tag@example.co.uk')).toBe(true);
  });

  test('rejects invalid addresses', () => {
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('missing@tld')).toBe(false);
    expect(validateEmail('@nolocal.com')).toBe(false);
    expect(validateEmail('spaces in@mail.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(null)).toBe(false);
  });
});

describe('validatePhone', () => {
  test('accepts common formats', () => {
    expect(validatePhone('+1 (555) 000-0000')).toBe(true);
    expect(validatePhone('5550000000')).toBe(true);
  });

  test('rejects bad lengths and characters', () => {
    expect(validatePhone('12345')).toBe(false);
    expect(validatePhone('abcdefghij')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });
});

describe('normalizeEmail', () => {
  test('trims and lowercases', () => {
    expect(normalizeEmail('  Brewer@TeaQuest.DEV ')).toBe('brewer@teaquest.dev');
  });
});

describe('calculateAge', () => {
  test('computes whole years', () => {
    expect(calculateAge('1990-05-10', '2026-05-10')).toBe(36);
    expect(calculateAge('1990-05-10', '2026-05-09')).toBe(35);
    expect(calculateAge('1990-05-10', '2026-06-01')).toBe(36);
  });

  test('returns null for missing or invalid dates', () => {
    expect(calculateAge('', '2026-01-01')).toBeNull();
    expect(calculateAge('not-a-date', '2026-01-01')).toBeNull();
  });
});

describe('isValidAge', () => {
  test('accepts an adult', () => {
    expect(isValidAge('1990-01-01', 13, '2026-01-01')).toBe(true);
  });

  test('rejects a 12 year old', () => {
    expect(isValidAge('2014-01-01', 13, '2026-01-01')).toBe(false);
  });

  test('accepts exactly 13', () => {
    expect(isValidAge('2013-01-01', 13, '2026-01-01')).toBe(true);
  });

  test('treats a missing birth date as unknown, not invalid', () => {
    expect(isValidAge('', 13, '2026-01-01')).toBe(true);
  });

  test('uses the configured minimum age by default', () => {
    expect(MIN_SIGNUP_AGE).toBe(13);
    expect(isValidAge('2015-01-01', undefined, '2026-01-01')).toBe(false);
  });
});

/* =========================================================
   FORMATTING
   ========================================================= */

describe('formatCurrency', () => {
  test('formats to two decimals', () => {
    expect(formatCurrency(12)).toBe('$12.00');
    expect(formatCurrency(12.5)).toBe('$12.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  test('handles invalid input safely', () => {
    expect(formatCurrency('abc')).toBe('$0.00');
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });

  test('supports a custom currency symbol', () => {
    expect(formatCurrency(10, '£')).toBe('£10.00');
  });
});

describe('round2', () => {
  test('rounds to 2 decimals', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.346)).toBe(2.35);
  });

  test('returns 0 for invalid input', () => {
    expect(round2('nope')).toBe(0);
    expect(round2(undefined)).toBe(0);
  });
});

describe('clamp', () => {
  test('bounds the value', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(0, 1, 10)).toBe(1);
    expect(clamp(99, 1, 10)).toBe(10);
  });
});

describe('shortOrderId', () => {
  test('keeps short ids untouched', () => {
    expect(shortOrderId('abc')).toBe('abc');
  });

  test('compacts long ids to a readable reference', () => {
    const result = shortOrderId('order-1234567890abcdef');
    expect(result).toMatch(/^#[A-Z0-9]{6}$/);
  });

  test('handles empty input', () => {
    expect(shortOrderId('')).toBe('');
    expect(shortOrderId(null)).toBe('');
  });
});

/* =========================================================
   PROGRESSION
   ========================================================= */

describe('getLevelInfo', () => {
  test('calculates the level', () => {
    expect(getLevelInfo(0).level).toBe(1);
    expect(getLevelInfo(50).level).toBe(1);
    expect(getLevelInfo(100).level).toBe(2);
    expect(getLevelInfo(250).level).toBe(3);
    expect(getLevelInfo(999).level).toBe(10);
  });

  test('calculates XP into the level', () => {
    expect(getLevelInfo(0).xpIntoLevel).toBe(0);
    expect(getLevelInfo(150).xpIntoLevel).toBe(50);
    expect(getLevelInfo(100).xpIntoLevel).toBe(0);
  });

  test('never returns a negative level', () => {
    expect(getLevelInfo(-10).level).toBe(1);
    expect(getLevelInfo(-10).xpIntoLevel).toBe(0);
  });

  test('handles non-numeric input', () => {
    expect(getLevelInfo('abc').level).toBe(1);
    expect(getLevelInfo(null).level).toBe(1);
    expect(getLevelInfo(undefined).level).toBe(1);
  });

  test('uses the shared XP constant', () => {
    expect(getLevelInfo(XP_PER_LEVEL * 3).level).toBe(4);
    expect(XP_PER_LEVEL).toBe(100);
    expect(ORDER_XP_REWARD).toBe(100);
  });
});

describe('getProductRarity', () => {
  test('returns an explicit rarity when set', () => {
    expect(getProductRarity({ rarity: 'epic', price: 10 })).toBe('epic');
  });

  test('derives rarity from price', () => {
    expect(getProductRarity({ price: 10 })).toBe('common');
    expect(getProductRarity({ price: 13 })).toBe('uncommon');
    expect(getProductRarity({ price: 16 })).toBe('rare');
    expect(getProductRarity({ price: 19 })).toBe('epic');
    expect(getProductRarity({ price: 24 })).toBe('legendary');
  });

  test('handles missing products', () => {
    expect(getProductRarity({})).toBe('common');
    expect(getProductRarity(null)).toBe('common');
  });
});

/* =========================================================
   CART
   ========================================================= */

describe('calculateCartTotal', () => {
  test('sums price x quantity', () => {
    expect(calculateCartTotal([
      { price: 12, quantity: 2 },
      { price: 15, quantity: 1 }
    ])).toBe(39);
  });

  test('returns 0 for an empty or invalid cart', () => {
    expect(calculateCartTotal([])).toBe(0);
    expect(calculateCartTotal(null)).toBe(0);
  });

  test('ignores malformed items', () => {
    expect(calculateCartTotal([{ price: 'x', quantity: 2 }])).toBe(0);
  });
});

describe('calculateCartCount', () => {
  test('sums quantities', () => {
    expect(calculateCartCount([
      { quantity: 2 },
      { quantity: 3 }
    ])).toBe(5);
  });

  test('returns 0 for an empty cart', () => {
    expect(calculateCartCount([])).toBe(0);
    expect(calculateCartCount(undefined)).toBe(0);
  });
});

describe('addCartItem', () => {
  test('adds a new line item', () => {
    const cart = addCartItem([], 'tea-001', 2);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toEqual({ productId: 'tea-001', quantity: 2 });
  });

  test('merges into an existing line item', () => {
    let cart = addCartItem([], 'tea-001', 1);
    cart = addCartItem(cart, 'tea-001', 2);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  test('does NOT mutate the input cart (purity)', () => {
    const original = [{ productId: 'tea-001', quantity: 1 }];
    const snapshot = JSON.parse(JSON.stringify(original));
    addCartItem(original, 'tea-001', 5);
    expect(original).toEqual(snapshot);
  });

  test('clamps the quantity', () => {
    const cart = addCartItem([], 'tea-001', 500);
    expect(cart[0].quantity).toBe(99);
  });

  test('ignores an empty product id', () => {
    expect(addCartItem([], '')).toHaveLength(0);
  });
});

describe('removeCartItem', () => {
  test('removes the matching item', () => {
    const cart = removeCartItem([
      { productId: 'tea-001', quantity: 1 },
      { productId: 'tea-002', quantity: 1 }
    ], 'tea-001');

    expect(cart).toHaveLength(1);
    expect(cart[0].productId).toBe('tea-002');
  });

  test('returns an empty array for invalid input', () => {
    expect(removeCartItem(null, 'x')).toEqual([]);
  });
});

describe('setCartQuantity', () => {
  test('updates the quantity', () => {
    const cart = setCartQuantity([{ productId: 'tea-001', quantity: 1 }], 'tea-001', 4);
    expect(cart[0].quantity).toBe(4);
  });

  test('removes the item when the quantity reaches zero', () => {
    const cart = setCartQuantity([{ productId: 'tea-001', quantity: 1 }], 'tea-001', 0);
    expect(cart).toHaveLength(0);
  });
});

/* =========================================================
   FAVORITES
   ========================================================= */

describe('toggleFavorite', () => {
  test('adds a product', () => {
    const favorites = toggleFavorite([], 'tea-001');
    expect(isFavorite(favorites, 'tea-001')).toBe(true);
  });

  test('removes a product', () => {
    let favorites = toggleFavorite([], 'tea-001');
    favorites = toggleFavorite(favorites, 'tea-001');
    expect(isFavorite(favorites, 'tea-001')).toBe(false);
  });

  test('does not mutate the input', () => {
    const original = ['tea-001'];
    toggleFavorite(original, 'tea-002');
    expect(original).toEqual(['tea-001']);
  });
});

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

describe('getUnlockedAchievementIds', () => {
  test('unlocks FIRST LEAF on the first discovery', () => {
    const ids = getUnlockedAchievementIds({ discoveries: ['tea-001'] }, 8);
    expect(ids).toContain('first-leaf');
    expect(ids).not.toContain('collector');
  });

  test('unlocks COLLECTOR at 5 discoveries', () => {
    const ids = getUnlockedAchievementIds({
      discoveries: ['a', 'b', 'c', 'd', 'e']
    }, 8);
    expect(ids).toContain('collector');
    expect(ids).not.toContain('tea-scholar');
  });

  test('unlocks TEA MASTER at level 10', () => {
    expect(getUnlockedAchievementIds({ xp: 899 }, 8)).not.toContain('tea-master');
    expect(getUnlockedAchievementIds({ xp: 900 }, 8)).toContain('tea-master');
  });

  test('unlocks CODEX KEEPER only when every product is discovered', () => {
    const ids = getUnlockedAchievementIds({
      discoveries: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    }, 8);
    expect(ids).toContain('codex-keeper');
  });

  test('does not unlock CODEX KEEPER with no products loaded', () => {
    const ids = getUnlockedAchievementIds({ discoveries: ['a'] }, 0);
    expect(ids).not.toContain('codex-keeper');
  });

  test('unlocks arcade and roulette achievements', () => {
    const ids = getUnlockedAchievementIds({
      arcadePlays: 1,
      rouletteSpins: 10
    }, 8);
    expect(ids).toContain('arcade-rookie');
    expect(ids).toContain('lucky-leaf');
  });

  test('unlocks MEMORY MASTER only for a win under 12 moves', () => {
    expect(getUnlockedAchievementIds({ highScores: { 'tea-memory': 12 } }, 8))
      .toContain('memory-master');
    expect(getUnlockedAchievementIds({ highScores: { 'tea-memory': 13 } }, 8))
      .not.toContain('memory-master');
    expect(getUnlockedAchievementIds({ highScores: { 'tea-memory': 0 } }, 8))
      .not.toContain('memory-master');
  });

  test('every definition has a stable id, name and description', () => {
    ACHIEVEMENT_DEFINITIONS.forEach((def) => {
      expect(typeof def.id).toBe('string');
      expect(def.id.length).toBeGreaterThan(0);
      expect(typeof def.name).toBe('string');
      expect(typeof def.description).toBe('string');
      expect(typeof def.condition).toBe('function');
    });
  });

  test('handles a missing user object', () => {
    expect(() => getUnlockedAchievementIds(null, 8)).not.toThrow();
    expect(getUnlockedAchievementIds(null, 8)).toEqual([]);
  });
});
