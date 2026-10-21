# 🍃 TeaQuest

### Brew Your Adventure.

TeaQuest is a premium tea e-commerce website with an original pixel-art fantasy theme. It combines a modern shopping experience with optional game-inspired features such as tea discovery, quests, progression, and exploration.

The goal is simple: **make buying tea easy while making the experience memorable.**

## 🌐 Live Demo

<p align="center">
  <a href="https://riyadh5674.github.io/TeaQuest/">
    <strong>🚀 View Live Demo</strong>
  </a>
</p>

---

## ✨ Features

### 🛍️ E-Commerce

* Browse and search tea products
* Category filtering
* Product details
* Favorites
* Shopping cart
* Quantity management
* **Real Stripe checkout** (cards, Apple Pay, Google Pay)
* **Cash on Delivery** option
* **Demo mode** for testing
* Order history with status tracking
* **Offline order queuing** with auto-sync

### 🎮 Game-Inspired Experience

* Tea Roulette (weighted rarity — legendary drops at 6%)
* Tea Oracle recommendations
* Tea Codex collection
* XP, levels & progression
* Quests and achievements
* Tea discovery system

### 🕹️ The Tea Arcade

Four original mini games with XP rewards, achievements and persistent high scores:

* **Perfect Brew** — timing game with rising heat
* **Leaf Catch** — catch leaves, dodge rocks, three lives
* **Tea Memory** — pair matching that discovers teas in your Codex
* **Minecraft Quest** — a full voxel sandbox built on WebGL
* Chiptune sound effects synthesized in code (no audio files) with a mute toggle
* Pixel-confetti celebrations, screen shake and gold flashes for legendary moments

### ⛏️ Minecraft Quest

A complete voxel sandbox that runs entirely in the browser — **no assets, no libraries, no build step**:

* Procedurally generated 3D world from a seed (smooth noise terrain, caves, ores, trees, lakes)
* Infinite-style chunk streaming rendered with raw WebGL (shaders compiled at runtime)
* **Creative mode** — fly, place and destroy blocks freely (63 block types incl. TNT)
* **Survival mode** — mine (with tool tiers & block hardness), fall damage, hunger, health, day/night cycle with stars, sun & moon
* TNT fuses and block explosions, particle effects, item drops
* Crafting (2×2 and 3×3), a smelting furnace with fuel, inventory UI with click-to-pickup
* Wandering mobs (pigs, cows, sheep) that take damage and drop loot
* World saving (`localStorage`), resume & delete-save flow, pause / death screens
* Arcade score & XP: mines/blocks placed/mobs slain convert to high scores and XP rewards

### 🏛️ The Tavern — Social Hub

A real-time social layer for players:

* **Tavern Floor** — global live chat (Firebase Realtime, no refresh)
* **Brew Buddies** — search players, send/accept friend requests
* **Tea Letters** — private messaging with unread badges
* Media messages: images, video, audio and documents (Firebase Storage)
* Player avatars, live online presence dots and counters
* Delete your own messages — synced for everyone instantly
* Privacy by design: only accepted buddies can exchange letters (enforced by database RLS), and the player directory never exposes emails

### 👤 User & Admin

* Customer registration and login
* **Forgot password** — email a secure reset link (Firebase Auth)
* User profiles with XP, achievements, order history
* Admin dashboard with full management
* Product management (CRUD)
* Order management with status updates
* Customer management with role promotion

### 🛡️ Security & Production Ready

* **Content Security Policy** (strict CSP headers)
* **XSS Prevention** (input sanitization, escapeHTML)
* **CSRF Protection** (tokens on all forms)
* **Rate Limiting** (client-side + server-ready)
* **Secure File Uploads** (8MB max, type validation, no SVGs)
* **Row Level Security** (database-enforced permissions)
* **PCI Compliant Payments** (Stripe Elements, no card data on server)
* **Automated Dependency Updates** (Dependabot)
* **Security Scanning** (npm audit, Snyk ready)

### 🔧 Developer Experience

* **ESLint + Prettier** (consistent code style)
* **Jest** (unit tests with coverage)
* **GitHub Actions CI/CD** (lint, test, build, deploy)
* **Automated Preview Deployments** (Firebase Hosting)
* **Production Build** (minification, service worker, PWA manifest)
* **Conventional Commits** enforced
* **Issue & PR Templates**
* **Code Owners** for review routing

---

## 🎨 Design

TeaQuest combines:

* Pixel-art fantasy aesthetics
* Cozy RPG-inspired atmosphere
* Premium tea branding
* Modern e-commerce UX
* Responsive layouts (mobile-first)
* Subtle animations and micro-interactions
* **Dark/Night mode** toggle
* **Reduced motion** support

The visual style is **original** and does not use copyrighted game assets or layouts.

---

## 🛠️ Tech Stack

* **HTML5** / **CSS3** / **Vanilla JavaScript (ES2022+)**
* **WebGL** (Minecraft Quest voxel renderer; shaders compiled at runtime)
* **Firebase** (Auth, Firestore, Storage, Realtime Database)
* **Stripe** (Payment Elements, Checkout Sessions)
* **Web Audio API** (synthesized chiptune sound effects)
* **GitHub Actions** (CI/CD pipeline)
* **Jest** (testing)

No frontend frameworks or build tools required for development.

---

## 📁 Project Structure

```text
TeaQuest/
├── index.html              # Main HTML (all pages)
├── style.css               # All styles (3800+ lines)
├── java.js                 # Core app: shop, auth, admin, quests
├── fx.js                   # Sound engine, confetti, screen juice
├── arcade.js               # Arcade games + high scores
├── minecraft.js            # Minecraft Quest: voxel engine + game (WebGL)
├── social.js               # Tavern: friends, chat, media
├── tea_db.js               # Firebase backend adapter
├── security.js             # Security utilities (XSS, CSRF, rate limit)
├── payment.js              # Stripe payment integration
├── scripts/
│   └── build.js            # Production build script
├── supabase/
│   └── schema.sql          # Database schema, RLS, functions
├── __tests__/              # Unit tests
├── .github/
│   ├── workflows/          # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/     # Bug/Feature templates
│   ├── dependabot.yml      # Auto dependency updates
│   ├── CODEOWNERS          # Review routing
│   └── PULL_REQUEST_TEMPLATE.md
├── .env.example            # Environment template
├── .eslintrc.json          # ESLint config
├── .prettierrc             # Prettier config
├── .stylelintrc.json       # Stylelint config
├── jest.config.js          # Jest config
├── babel.config.json       # Babel config
├── package.json            # Dependencies & scripts
├── CONTRIBUTING.md         # Contribution guide
├── SECURITY.md             # Security policy
└── README.md
```

---

## 💻 Local Development

### Quick Start (No Build Required)

```bash
# Clone the repository
git clone https://github.com/riyadh5674/TeaQuest.git
cd TeaQuest

# Open in VS Code and launch with Live Server extension
# OR use any static server:
npx serve . -p 3000
```

### Full Development Setup (with linting, tests, build)

```bash
# Install dependencies
npm ci

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Firebase config
# FIREBASE_API_KEY=your_key
# FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# FIREBASE_PROJECT_ID=your_project
# FIREBASE_STORAGE_BUCKET=your_project.appspot.com
# FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# FIREBASE_APP_ID=your_app_id
# TEAQUEST_STRIPE_KEY=pk_test_your_stripe_key

# Start development server
npm run dev

# Run tests
npm test

# Lint & format
npm run lint
npm run format

# Production build
npm run build
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password
3. Create **Firestore Database** (start in test mode, then apply rules)
4. Enable **Storage**
5. Enable **Realtime Database** (for presence)
6. Copy config to `.env.local`
7. Apply Firestore rules from `supabase/schema.sql` (adapted for Firestore)

### Stripe Setup (Optional)

1. Create Stripe account at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get **Publishable Key** → add to `TEAQUEST_STRIPE_KEY`
3. For production: Create **Webhook Endpoint** → `/api/stripe-webhook`
4. Add **Secret Key** to Firebase Functions environment

---

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (first time)
firebase init hosting

# Deploy
npm run build
firebase deploy
```

### GitHub Actions Auto-Deploy

The repository includes a complete CI/CD pipeline:

1. **On PR**: Lint → Test → Build → Deploy Preview
2. **On Merge to Main**: Lint → Test → Build → Security Scan → Deploy Production

Required GitHub Secrets:
- `FIREBASE_SERVICE_ACCOUNT` (from Firebase Console → Service Accounts)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, etc.
- `SNYK_TOKEN` (optional, for security scanning)

### Other Platforms

The production build in `dist/` can be deployed to any static host:
- Netlify, Vercel, Cloudflare Pages
- AWS S3 + CloudFront
- GitHub Pages (already configured)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage

# Lint only
npm run lint

# Validate (lint + test)
npm run validate
```

### Test Coverage Targets

- Utilities: >90%
- Core logic: >80%
- Overall: >75%

---

## 📦 Production Build

The build script (`scripts/build.js`) creates an optimized `dist/` folder:

* Minified JavaScript (Terser)
* Minified CSS (clean-css)
* Minified HTML (html-minifier-terser)
* Service Worker for offline support
* Web App Manifest (PWA ready)
* Firebase config injected from environment
* Asset hashing for cache busting

```bash
npm run build
# Output: ./dist/
```

---

## 🗺️ Roadmap

### ✅ Completed (Production Ready)

- [x] E-commerce storefront with real payments
- [x] Product browsing, filtering, search
- [x] Cart, checkout, order history
- [x] Favorites, user profiles
- [x] Admin dashboard (products, orders, customers)
- [x] Tea Roulette, Tea Oracle, Tea Codex
- [x] XP, levels, quests, achievements
- [x] Arcade games (3) + high scores
- [x] Minecraft Quest (creative & survival)
- [x] Chiptune sound engine & visual effects
- [x] Tavern (chat, friends, DMs, media)
- [x] Firebase backend with RLS
- [x] Security hardening (CSP, XSS, CSRF, rate limit)
- [x] CI/CD pipeline with preview deployments
- [x] Automated testing & linting
- [x] PWA support (manifest, service worker)
- [x] Accessibility improvements

### 🔄 In Progress

- [ ] Global leaderboards
- [ ] Daily quests & login streaks
- [ ] Message reactions & typing indicators
- [ ] Push notifications
- [ ] Email templates customization

### 📋 Planned

- [ ] Subscription/recurring orders
- [ ] Gift cards
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (Capacitor/PWA)
- [ ] Webhook integrations (Discord, Slack)

---

## 🌿 Vision

TeaQuest aims to become a **premium tea store wrapped inside an original fantasy world** — combining discovery, collecting, exploration, and shopping without compromising usability.

> **Discover. Brew. Explore.**

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Code of Conduct
- Development workflow
- Coding standards
- Testing requirements
- Pull request process
- Architecture overview

---

## 🔒 Security

Please read [SECURITY.md](SECURITY.md) for our security policy, including how to report vulnerabilities responsibly.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

* **Press Start 2P** & **VT323** fonts by Google Fonts
* **Firebase** for backend infrastructure
* **Stripe** for payment processing
* **WebGL** for Minecraft Quest rendering
* The open-source community for inspiration

---

<p align="center">
  <strong>🍵 TeaQuest</strong><br>
  <em>Brew Your Adventure.</em>
</p>