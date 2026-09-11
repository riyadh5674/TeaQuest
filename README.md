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
* Checkout flow
* Order history

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

* **Tavern Floor** — global live chat (Supabase Realtime, no refresh)
* **Brew Buddies** — search players, send/accept friend requests
* **Tea Letters** — private messaging with unread badges
* Media messages: images, video, audio and documents (Supabase Storage)
* Player avatars, live online presence dots and counters
* Delete your own messages — synced for everyone instantly
* Privacy by design: only accepted buddies can exchange letters (enforced by database RLS), and the player directory never exposes emails

### 👤 User & Admin

* Customer registration and login
* **Forgot password** — email a 6-digit reset code, then set a new password (Supabase Auth recovery)
* User profiles
* Favorites and order history
* Admin dashboard
* Product management
* Order management
* Order status updates

---

## 🎨 Design

TeaQuest combines:

* Pixel-art fantasy aesthetics
* Cozy RPG-inspired atmosphere
* Premium tea branding
* Modern e-commerce UX
* Responsive layouts
* Subtle animations and micro-interactions

The visual style is **original** and does not use copyrighted game assets or layouts.

---

## 🛠️ Tech Stack

* **HTML5**
* **CSS3**
* **Vanilla JavaScript**
* **WebGL** (Minecraft Quest voxel renderer; shaders compiled at runtime)
* **Supabase** (auth, Postgres database with Row Level Security, Storage for media, Realtime for live chat and presence)
* **Web Audio API** (synthesized chiptune sound effects)

No frameworks or build tools are required.

---

## 📁 Project Structure

```text
TeaQuest/
├── index.html
├── style.css
├── java.js        # core app: shop, auth, admin, quests
├── fx.js          # sound engine, confetti, screen juice
├── arcade.js      # the arcade games + high scores
├── minecraft.js   # Minecraft Quest: voxel engine + game (WebGL)
├── social.js      # the Tavern: friends, chat, media
├── supabase/
│   └── schema.sql # tables, RLS policies, storage, realtime
└── README.md
```

---

## 💻 Local Development

TeaQuest is a lightweight frontend project with no build process or external dependencies.

To run the project locally:

1. Clone the repository.
2. Open the project folder in **Visual Studio Code**.
3. Launch `index.html` with the **Live Server** extension.

The website will open locally in your browser.

> **No Node.js, npm, or package installation is required.**

---

## ⚠️ Current Limitations

* Authentication and data are powered by **Supabase**; some state is cached in localStorage for offline fallback.
* No real payment processing is implemented (demo checkout).
* Admin promotion of the first Guild Master is done once via the Supabase SQL editor.
* Tavern media uploads are capped at 8 MB per file; SVG uploads are blocked for security.
* Orders placed while offline are queued locally and re-synced automatically; prices are always recomputed server-side by the `create_order` RPC in `supabase/schema.sql` — run the updated schema once to enable it.
* Password-reset emails use Supabase's built-in sender; configure custom SMTP in the Supabase dashboard for reliable delivery.

---

## 🗺️ Roadmap

* [x] E-commerce storefront
* [x] Product browsing and filtering
* [x] Cart and checkout
* [x] Favorites
* [x] User profiles
* [x] Admin dashboard
* [x] Tea Roulette (weighted rarity)
* [x] Tea Oracle
* [x] Tea Codex
* [x] Backend & database integration (Supabase)
* [x] Secure authentication (Supabase Auth + RLS)
* [x] Expanded XP & achievement system
* [x] The Tea Arcade — four mini games with high scores
* [x] Minecraft Quest — full WebGL voxel sandbox (creative & survival)
* [x] Chiptune sound engine & visual juice
* [x] The Tavern — live chat, friends, private messages, media sharing
* [ ] Global leaderboards
* [ ] Daily quests & streaks
* [ ] Message reactions & typing indicators
* [ ] Real payment integration

---

## 🌿 Vision

TeaQuest aims to become a **premium tea store wrapped inside an original fantasy world** — combining discovery, collecting, exploration, and shopping without compromising usability.

> **Discover. Brew. Explore.**

---

<p align="center">
  <strong>🍵 TeaQuest</strong><br>
  <em>Brew Your Adventure.</em>
</p>
