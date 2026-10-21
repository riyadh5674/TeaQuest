# Contributing to TeaQuest

Thank you for your interest in contributing to TeaQuest! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Architecture Overview](#architecture-overview)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- Firebase account (for backend)
- Stripe account (for payments, optional)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/riyadh5674/TeaQuest.git
cd TeaQuest

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
```

The site will be available at `http://localhost:3000`.

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Storage
5. Copy config to `.env.local`
6. Run the SQL schema from `supabase/schema.sql` in Firestore (adapt for Firestore)

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch (optional)
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Hotfixes: `hotfix/description`

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests
- `chore`: Maintenance tasks
- `security`: Security fix

Examples:
```
feat(shop): add product filtering by price range
fix(auth): resolve password reset email not sending
docs: update API documentation
refactor(arcade): simplify Perfect Brew game loop
```

### Development Commands

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Validate (lint + test)
npm run validate

# Build for production
npm run build
```

## Coding Standards

### JavaScript

- ES2022+ features allowed (targeting modern browsers)
- No frameworks - vanilla JS only
- Functions should be small and single-purpose
- Use `const` by default, `let` when reassignment needed
- No `var`
- Async/await preferred over promises
- Meaningful variable names (no single letters except loops)
- JSDoc comments for public functions

### CSS

- CSS Custom Properties for theming
- BEM-style class naming: `.block__element--modifier`
- Mobile-first responsive design
- Pixel-art aesthetic maintained
- No CSS frameworks

### HTML

- Semantic HTML5 elements
- Accessibility attributes (ARIA labels, roles)
- Meta tags for SEO and social sharing
- Valid HTML (validated by HTMLHint)

### File Organization

```
TeaQuest/
├── index.html          # Main HTML (all pages)
├── style.css           # All styles
├── java.js             # Core app logic
├── fx.js               # Sound & visual effects
├── arcade.js           # Arcade games
├── minecraft.js        # Minecraft Quest (WebGL)
├── social.js           # Tavern social features
├── tea_db.js           # Firebase backend adapter
├── security.js         # Security utilities
├── payment.js          # Stripe integration
├── supabase/
│   └── schema.sql      # Database schema
├── scripts/
│   └── build.js        # Production build
├── __tests__/          # Unit tests
├── .github/            # GitHub config
└── docs/               # Documentation
```

## Testing

### Unit Tests

- Location: `__tests__/`
- Framework: Jest with jsdom
- Run: `npm test`
- Coverage target: >80% for utilities

### Writing Tests

```javascript
// __tests__/myFeature.test.js
import { myFunction } from '../java.js';

describe('myFunction', () => {
  test('handles normal case', () => {
    expect(myFunction('input')).toBe('expected');
  });

  test('handles edge case', () => {
    expect(myFunction('')).toBe('default');
  });
});
```

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] All pages load without console errors
- [ ] Navigation works (desktop & mobile)
- [ ] Shop filtering & sorting
- [ ] Cart add/remove/quantity
- [ ] Checkout flow (demo & Stripe)
- [ ] Authentication (login, signup, logout)
- [ ] Profile page (XP, achievements, orders)
- [ ] Arcade games (all 3)
- [ ] Minecraft Quest (creative & survival)
- [ ] Tavern (chat, friends, DMs)
- [ ] Admin dashboard (if admin)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility (keyboard nav, screen reader)

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `npm run validate`
2. Update documentation if needed
3. Add/update tests for new functionality
4. Follow commit convention
5. Keep PRs focused and small

### PR Requirements

- Clear title following convention
- Description linking to issue
- Screenshots for UI changes
- Tests passing in CI
- No merge conflicts
- At least one approval (for core changes)

### Review Process

1. Automated checks run (lint, test, build)
2. Maintainer reviews code
3. Address feedback
4. Squash and merge (maintainers)

## Architecture Overview

### Core Modules

| Module | Responsibility |
|--------|----------------|
| `java.js` | App state, routing, shop, auth, admin, quests |
| `fx.js` | Audio engine, confetti, screen effects |
| `arcade.js` | Mini games (Perfect Brew, Leaf Catch, Tea Memory) |
| `minecraft.js` | Full WebGL voxel sandbox |
| `social.js` | Tavern (chat, friends, DMs, media) |
| `tea_db.js` | Firebase adapter (Supabase-compatible API) |
| `security.js` | XSS prevention, rate limiting, CSP |
| `payment.js` | Stripe Elements integration |

### State Management

- Global variables for app state (legacy pattern)
- `currentUser` - authenticated user
- `products` - tea catalog
- `cart` - shopping cart
- `favorites` - user favorites
- `orders` - order history
- `customers` - admin user list

### Data Flow

```
User Action → Event Handler → State Update → Render Function → DOM Update
                    ↓
              Firebase Sync (async)
                    ↓
              LocalStorage Cache
```

### Firebase Collections

| Collection | Purpose | RLS |
|------------|---------|-----|
| `profiles` | User data, XP, achievements | Owner/Admin |
| `products` | Tea catalog | Read all, Write admin |
| `orders` | Purchase history | Owner/Admin |
| `order_items` | Order line items | Via orders |
| `favorites` | User wishlist | Owner only |
| `friendships` | Buddy relationships | Participants |
| `direct_messages` | Private messages | Buddies only |
| `tavern_messages` | Global chat | Authenticated |
| `presence` | Online status | All authenticated |

## Adding New Features

### New Tea Product

1. Add to `defaultProducts` in `java.js`
2. Add to seed data in `supabase/schema.sql`
3. Run schema update in Firebase

### New Arcade Game

1. Create game module in `arcade.js`
2. Add modal HTML in `index.html`
3. Add styles in `style.css`
4. Register in `ARCADE_GAMES` object
5. Add high score tracking

### New Admin Feature

1. Add tab in `index.html` admin section
2. Add view in admin section
3. Add handler in `java.js` initializeAdmin()
4. Add API calls in `tea_db.js` if needed

### New Tavern Feature

1. Add UI in `index.html` tavern section
2. Add logic in `social.js`
3. Add database tables/policies in `supabase/schema.sql`
4. Add realtime subscriptions

## Performance Guidelines

- Lazy-load heavy modules (Minecraft Quest)
- Debounce search inputs (300ms)
- Virtualize long lists
- Compress images (WebP)
- Minify in production build
- Use service worker for caching

## Accessibility Guidelines

- Semantic HTML
- Keyboard navigation for all interactive elements
- Focus indicators visible
- Color contrast ratios (WCAG AA)
- ARIA labels for icon buttons
- Alt text for images
- Reduced motion support

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. GitHub Actions builds & deploys
6. Verify deployment

## Questions?

Open a [discussion](https://github.com/riyadh5674/TeaQuest/discussions) or ask in a PR.