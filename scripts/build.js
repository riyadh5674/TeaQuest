/**
 * TeaQuest Production Build Script
 * Creates an optimized production build in the dist/ directory
 * - Minifies JavaScript (using Terser)
 * - Minifies CSS (using clean-css)
 * - Minifies HTML (using html-minifier-terser)
 * - Copies assets
 * - Generates service worker for offline support
 * - Injects Firebase config from environment variables
 *
 * The list of scripts is derived from index.html so a new script can
 * never be forgotten here again (that previously left utils.js,
 * security.js and payment.js out of the build).
 */

const fs = require('fs');
const path = require('path');
const { minify: terserMinify } = require('terser');
const CleanCSS = require('clean-css');
const { minify: htmlMinify } = require('html-minifier-terser');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const SRC_DIR = PROJECT_ROOT;

async function build() {
  console.log('🏗️  Starting TeaQuest production build...');
  console.log(`Source: ${SRC_DIR}`);
  console.log(`Output: ${DIST_DIR}`);

  // Clean and create dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Work out which local scripts the app actually loads.
  const jsFiles = collectLocalScripts();

  // Copy static assets
  await copyAssets();

  // Build HTML with injected config
  await buildHtml(jsFiles);

  // Build and minify CSS
  await buildCss();

  // Build and minify JavaScript
  await buildJs(jsFiles);

  // Generate service worker
  await generateServiceWorker(jsFiles);

  // Generate manifest
  await generateManifest();

  console.log('✅ Build completed successfully!');
  console.log(`📦 Output ready in: ${DIST_DIR}`);
}

/**
 * Read index.html and return every local <script src="*.js"> file.
 * Remote scripts (Firebase SDK, Stripe) are ignored.
 */
function collectLocalScripts() {
  const html = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');

  const pattern = /<script\s+src="([^"]+\.js)"><\/script>/g;
  const found = [];
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const src = match[1];

    if (/^(https?:)?\/\//.test(src)) continue;
    if (!fs.existsSync(path.join(SRC_DIR, src))) continue;
    if (found.includes(src)) continue;

    found.push(src);
  }

  return found;
}

async function copyAssets() {
  console.log('📁 Copying static assets...');

  const assetsToCopy = [
    'icons',
    'screenshots',
    'supabase'
  ];

  for (const asset of assetsToCopy) {
    const src = path.join(SRC_DIR, asset);
    const dest = path.join(DIST_DIR, asset);
    if (fs.existsSync(src)) {
      copyRecursiveSync(src, dest);
      console.log(`  ✓ Copied ${asset}/`);
    }
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function buildHtml(jsFiles) {
  console.log('📄 Building HTML...');

  let html = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');

  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || 'YOUR_API_KEY',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
    projectId: process.env.FIREBASE_PROJECT_ID || 'your-project',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
    appId: process.env.FIREBASE_APP_ID || '1:123456789:web:abcdef'
  };

  // ---------------------------------------------------------------
  // Replace the EXISTING window.FIREBASE_CONFIG block.
  //
  // Injecting a second <script> before </head> did not work: the
  // original empty config in the body ran afterwards and overwrote
  // the injected values with empty strings, so the production build
  // always started in "BACKEND OFFLINE" mode.
  // ---------------------------------------------------------------
  const configPattern =
    /window\.FIREBASE_CONFIG\s*=\s*\{[\s\S]*?\};/;

  const configScript =
    `window.FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig, null, 2)};`;

  if (configPattern.test(html)) {
    html = html.replace(configPattern, configScript);
    console.log('  ✓ Firebase config injected from environment');
  } else {
    html = html.replace(
      '</head>',
      `  <script>\n    ${configScript}\n  </script>\n  </head>`
    );
    console.log('  ✓ Firebase config injected (new block)');
  }

  // Point every local script at its minified twin.
  for (const file of jsFiles) {
    const minName = file.replace(/\.js$/, '.min.js');
    html = html.replace(`src="${file}"`, `src="${minName}"`);
  }

  html = html.replace('href="style.css"', 'href="style.min.css"');

  // Add production meta tags
  html = html.replace(
    '<meta name="description" content="TEAQUEST — A pixel-powered tea adventure.">',
    `<meta name="description" content="TEAQUEST — A pixel-powered tea adventure.">
    <meta name="theme-color" content="#101b16">
    <link rel="manifest" href="manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="TeaQuest">`
  );

  // Minify HTML
  const minified = await htmlMinify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true
  });

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), minified);
  console.log('  ✓ index.html (minified)');
}

async function buildCss() {
  console.log('🎨 Building CSS...');

  const css = fs.readFileSync(path.join(SRC_DIR, 'style.css'), 'utf8');

  const minified = new CleanCSS({
    level: 2,
    format: 'beautify',
    inline: ['all'],
    rebase: false
  }).minify(css).styles;

  fs.writeFileSync(path.join(DIST_DIR, 'style.min.css'), minified);
  console.log('  ✓ style.min.css');
}

async function buildJs(jsFiles) {
  console.log('⚙️  Building JavaScript...');

  for (const file of jsFiles) {
    const srcPath = path.join(SRC_DIR, file);
    const destPath = path.join(DIST_DIR, file.replace(/\.js$/, '.min.js'));

    if (!fs.existsSync(srcPath)) {
      console.log(`  ⚠️  ${file} not found, skipping`);
      continue;
    }

    const code = fs.readFileSync(srcPath, 'utf8');

    try {
      const result = await terserMinify(code, {
        compress: {
          passes: 2,
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info'],
          ecma: 2020
        },
        mangle: {
          toplevel: true,
          keep_fnames: /^(initialize|render|open|close|show|handle|on|update|save|load|fetch|send|get|set|check|discover|award|record|build|create|start|stop|reset|end|finish|complete|toggle|switch|change|add|remove|delete|update|refresh|sync|normalize|validate|format|parse|stringify|encode|decode|escape|sanitize|verify|authenticate|authorize|connect|disconnect|subscribe|unsubscribe|track|untrack|watch|unwatch|listen|unlisten|emit|on|off|once|trigger|fire|dispatch|publish|notify|alert|warn|error|log|info|debug|trace)$/
        },
        format: {
          comments: false,
          ecma: 2020
        },
        ecma: 2020
      });

      fs.writeFileSync(destPath, result.code);
      console.log(`  ✓ ${file.replace(/\.js$/, '.min.js')} (${(result.code.length / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`  ❌ Failed to minify ${file}:`, error.message);
      // Fallback: copy original
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function generateServiceWorker(jsFiles) {
  console.log('🔧 Generating Service Worker...');

  const staticAssets = [
    '/',
    '/index.html',
    '/style.min.css',
    ...jsFiles.map(file => '/' + file.replace(/\.js$/, '.min.js')),
    '/icons/pixel-house.png',
    '/manifest.json'
  ];

  const swCode = `/**
 * TeaQuest Service Worker
 * Provides offline support and caching for production
 */

const CACHE_NAME = 'teaquest-v1.0.0';
const STATIC_CACHE = 'teaquest-static-v1';
const DYNAMIC_CACHE = 'teaquest-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = ${JSON.stringify(staticAssets, null, 2)};

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (Firebase, fonts, etc.)
  if (url.origin !== location.origin) {
    // For Firebase API calls, use network-first strategy
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
      event.respondWith(networkFirst(request));
      return;
    }
    // For fonts, use cache-first
    if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
      event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
      return;
    }
    return;
  }

  // For HTML, use network-first (to get updates)
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // For everything else, use cache-first
  event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
});

// Cache-first strategy
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/index.html');
    }
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cacheName = DYNAMIC_CACHE) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Return offline fallback for navigation
    if (request.mode === 'navigate') {
      return cache.match('/index.html');
    }
    throw error;
  }
}

// Background sync for offline orders
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // This would sync locally queued orders to Firebase
  console.log('[SW] Syncing offline orders...');
  // Implementation would go here
}

// Push notifications (future)
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/pixel-house.png',
    badge: '/icons/pixel-house.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
`;

  fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), swCode);
  console.log('  ✓ sw.js');
}

async function generateManifest() {
  console.log('📋 Generating Web App Manifest...');

  const manifest = {
    name: 'TeaQuest',
    short_name: 'TeaQuest',
    description: 'A premium tea e-commerce experience inside an original pixel-art fantasy world',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c1411',
    theme_color: '#101b16',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icons/pixel-house.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['shopping', 'games', 'lifestyle'],
    screenshots: [
      {
        src: '/screenshots/home.png',
        sizes: '1280x720',
        form_factor: 'wide',
        label: 'TeaQuest Home Page'
      },
      {
        src: '/screenshots/shop.png',
        sizes: '1280x720',
        form_factor: 'wide',
        label: 'TeaQuest Shop'
      }
    ],
    shortcuts: [
      {
        name: 'Shop Teas',
        short_name: 'Shop',
        description: 'Browse and buy teas',
        url: '/#shop',
        icons: [{ src: '/icons/pixel-house.png', sizes: '192x192' }]
      },
      {
        name: 'Play Arcade',
        short_name: 'Arcade',
        description: 'Play mini games',
        url: '/#arcade',
        icons: [{ src: '/icons/pixel-house.png', sizes: '192x192' }]
      }
    ]
  };

  fs.writeFileSync(
    path.join(DIST_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('  ✓ manifest.json');
}

// Run build
build().catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
