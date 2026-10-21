/* =========================================================
   TEAQUEST — SECURITY HARDENING MODULE
   Loaded first, before all other scripts
   ========================================================= */
"use strict";

(function () {
  // =========================================================
  // CONTENT SECURITY POLICY (injected via meta tag)
  // =========================================================
  function injectCSP() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss://*.firebaseio.com",
      "media-src 'self' https://*.firebaseio.com https://*.firebasestorage.googleapis.com blob:",
      "frame-src 'self' https://*.firebaseapp.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);
  }

  // =========================================================
  // INPUT SANITIZATION & XSS PREVENTION
  // =========================================================
  window.Security = {
    // Enhanced HTML escaping
    escapeHTML: function (value) {
      return String(value)
        .replaceAll('&', '&')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", '&#039;')
        .replaceAll('/', '&#x2F;'); // Prevents closing tag injection
    },

    // Sanitize for safe attribute values
    escapeAttr: function (value) {
      return String(value)
        .replaceAll('&', '&')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", '&#039;');
    },

    // Sanitize URLs - only allow safe protocols
    sanitizeURL: function (url) {
      try {
        const parsed = new URL(url, window.location.href);
        const allowedProtocols = ['https:', 'http:', 'mailto:', 'tel:'];
        if (!allowedProtocols.includes(parsed.protocol)) {
          return '#';
        }
        // Block javascript: and data: URIs
        if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
          return '#';
        }
        return parsed.href;
      } catch (e) {
        return '#';
      }
    },

    // Validate email format
    validateEmail: function (email) {
      const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      return re.test(String(email).toLowerCase());
    },

    // Validate phone (basic)
    validatePhone: function (phone) {
      const re = /^[\d\s\-+()]{7,20}$/;
      return re.test(String(phone));
    },

    // Sanitize text input (max length, no control chars)
    sanitizeText: function (text, maxLength = 500) {
      if (!text) return '';
      return String(text)
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .slice(0, maxLength)
        .trim();
    },

    // Sanitize filename
    sanitizeFilename: function (name) {
      return String(name)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 100);
    }
  };

  // =========================================================
  // RATE LIMITING (client-side)
  // =========================================================
  window.RateLimiter = {
    limits: new Map(),

    check: function (key, maxRequests, windowMs) {
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!this.limits.has(key)) {
        this.limits.set(key, []);
      }

      const requests = this.limits.get(key).filter(t => t > windowStart);

      if (requests.length >= maxRequests) {
        return {
          allowed: false,
          retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000)
        };
      }

      requests.push(now);
      this.limits.set(key, requests);
      return { allowed: true };
    },

    // Pre-configured limiters
    api: function (action) {
      return this.check(`api:${action}`, 30, 60000); // 30/min
    },
    auth: function () {
      return this.check('auth', 5, 300000); // 5/5min
    },
    chat: function () {
      return this.check('chat', 10, 60000); // 10/min
    },
    upload: function () {
      return this.check('upload', 5, 300000); // 5/5min
    }
  };

  // =========================================================
  // SECURE STORAGE WRAPPER
  // =========================================================
  window.SecureStorage = {
    prefix: 'tq_secure_',

    set: function (key, value, encrypt = false) {
      try {
        const data = {
          value: value,
          timestamp: Date.now(),
          version: 1
        };

        if (encrypt) {
          // Simple obfuscation (not true encryption - use Web Crypto for that)
          data.value = btoa(JSON.stringify(value));
          data.encrypted = true;
        }

        localStorage.setItem(this.prefix + key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.warn('SecureStorage set failed:', e);
        return false;
      }
    },

    get: function (key, defaultValue = null) {
      try {
        const item = localStorage.getItem(this.prefix + key);
        if (!item) return defaultValue;

        const data = JSON.parse(item);
        if (data.encrypted) {
          return JSON.parse(atob(data.value));
        }
        return data.value;
      } catch (e) {
        console.warn('SecureStorage get failed:', e);
        return defaultValue;
      }
    },

    remove: function (key) {
      localStorage.removeItem(this.prefix + key);
    },

    clear: function () {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this.prefix))
        .forEach(k => localStorage.removeItem(k));
    }
  };

  // =========================================================
  // CSRF PROTECTION (for forms)
  // =========================================================
  window.CSRF = {
    tokenName: 'tq_csrf',

    generate: function () {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(this.tokenName, token);
      return token;
    },

    get: function () {
      return sessionStorage.getItem(this.tokenName) || this.generate();
    },

    validate: function (token) {
      return token === this.get();
    },

    // Add token to form data
    inject: function (formData) {
      if (formData instanceof FormData) {
        formData.append('_csrf', this.get());
      } else if (typeof formData === 'object') {
        formData._csrf = this.get();
      }
      return formData;
    }
  };

  // Initialize CSRF token on load
  if (!sessionStorage.getItem(window.CSRF.tokenName)) {
    window.CSRF.generate();
  }

  // =========================================================
  // SECURE FETCH WRAPPER
  // =========================================================
  window.secureFetch = async function (url, options = {}) {
    const defaultOptions = {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': window.CSRF.get()
      }
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };

    // Add CSRF token to body for mutating requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(mergedOptions.method?.toUpperCase())) {
      if (mergedOptions.body && typeof mergedOptions.body === 'object') {
        const body = typeof mergedOptions.body === 'string'
          ? JSON.parse(mergedOptions.body)
          : mergedOptions.body;
        body._csrf = window.CSRF.get();
        mergedOptions.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, mergedOptions);

      // Handle auth errors
      if (response.status === 401) {
        // Token expired, try to refresh
        console.warn('[Security] Auth token expired');
      }

      if (response.status === 403) {
        console.warn('[Security] CSRF token invalid or forbidden');
      }

      return response;
    } catch (error) {
      console.error('[Security] Fetch error:', error);
      throw error;
    }
  };

  // =========================================================
  // SUBRESOURCE INTEGRITY (for external scripts)
  // =========================================================
  window.SubresourceIntegrity = {
    // Expected hashes for external resources
    hashes: {
      'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap': 'sha384-',
      'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js': 'sha384-',
      'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js': 'sha384-',
      'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js': 'sha384-',
      'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js': 'sha384-'
    },

    verify: function (url, content) {
      const expected = this.hashes[url];
      if (!expected) return true; // No hash to verify

      // In production, compute actual hash and compare
      // For now, just log
      console.log('[SRI] Verifying:', url);
      return true;
    }
  };

  // =========================================================
  // INITIALIZE SECURITY ON LOAD
  // =========================================================
  document.addEventListener('DOMContentLoaded', () => {
    injectCSP();

    // Prevent clickjacking
    if (window.self !== window.top) {
      console.warn('[Security] Page is framed, breaking out...');
      window.top.location = window.self.location;
    }

    // Disable right-click context menu on production (optional)
    // document.addEventListener('contextmenu', e => e.preventDefault());

    // Disable devtools shortcuts (optional, UX impact)
    // document.addEventListener('keydown', e => {
    //   if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
    //     e.preventDefault();
    //   }
    // });

    console.log('[Security] TeaQuest security module initialized');
  });
})();