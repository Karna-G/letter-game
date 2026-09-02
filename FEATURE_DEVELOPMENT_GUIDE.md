# 📜 PostMe: Comprehensive Feature Development & Architectural Guidance Guide

> **Project Realm**: *PostMe — An 18th-Century Epistle Salon & Courier Guild*  
> **Repository**: [Karna-G/letter-game](https://github.com/Karna-G/letter-game)  
> **Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, HTML5 Canvas, Web Audio API, Node.js, Express, Socket.IO, MongoDB & Mongoose.

---

## 🧭 Table of Contents
1. [Executive Summary & Realm Philosophy](#1-executive-summary--realm-philosophy)
2. [Feature 1: Ranged Mailman Proximity & Encounter System](#2-feature-1-ranged-mailman-proximity--encounter-system)
3. [Feature 2: Royal Story Herald (9:16 Vertical Story Studio)](#3-feature-2-royal-story-herald-916-vertical-story-studio)
4. [Feature 3: Recipient Time Lock & Time Capsule Enforcement](#4-feature-3-recipient-time-lock--time-capsule-enforcement)
5. [Feature 4: Procedural Web Audio Synthesis Engine](#5-feature-4-procedural-web-audio-synthesis-engine)
6. [Feature 5: Postmaster High Command & Admin Tribunal Overhaul](#6-feature-5-postmaster-high-command--admin-tribunal-overhaul)
7. [Repository Structure & Code Navigation](#7-repository-structure--code-navigation)
8. [Local Development, Testing & Production Build Checklist](#8-local-development-testing--production-build-checklist)

---

## 1. Executive Summary & Realm Philosophy

PostMe is designed as a theatrical, immersive, 18th-century epistolary world where users (called **Scribes** and **Couriers**) exchange physical and digital letters sealed with sovereign wax seals, dynamic quantum variants (Schrödinger boxes), spectral dybbuk messages, and drifting ocean bottles.

Throughout development, several core features were implemented, refined, and polished:
- **Spatial Mailman Geofencing**: Real-time proximity alerts when couriers enter a scribe's radius.
- **Royal Story Herald**: A 9:16 exportable story canvas with live countdowns and functional QR codes.
- **Time Capsule Locks**: True recipient content masking until an appointed future hour.
- **Organic Audio**: 50% softened procedural sound design with a 2.4 kHz low-pass acoustic bus.
- **Admin High Command**: A dedicated sovereign tribunal interface for grievance resolution and user role management.

---

## 2. Feature 1: Ranged Mailman Proximity & Encounter System

### 🎯 The Objective
Allow Scribes (senders) to receive real-time alerts whenever a Royal Mailman (courier) enters their designated proximity radius (e.g. 50m to 1500m), enabling seamless in-person letter handover requests.

### ⚙️ Architecture & Backend Implementation
- **File**: [`backend/proximityService.js`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/backend/proximityService.js)
- **Mathematical Formula**: Haversine distance algorithm calculates the geodesic distance in meters between Scribe coordinates and Courier coordinates:
  ```js
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }
  ```
- **Socket.IO Event Flow**:
  1. `register-user`: Emitted upon user login with `{ userId, name, role, lat, lng }`.
  2. `pickup-radius-alert`: Server emits to Scribes when an active Courier is within their threshold radius. Single-encounter deduplication guarantees each courier encounter alerts only **once**.
  3. `courier-received-pickup-request`: Scribe triggers an on-demand pickup; courier receives the request card with distance and location.
  4. `scribe-pickup-response`: Courier accepts or declines; scribe receives immediate audio/toast feedback.
  5. `letter-handover-animated`: Triggered when a physical QR code is scanned; plays letter flight handover animation.

### 🎨 Frontend Components
- **[`PickupRadiusAlertToast.tsx`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/components/PickupRadiusAlertToast.tsx)**: Slide-in notification banner when a courier is nearby.
- **[`PickupAlertSettingsCard.tsx`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/components/PickupAlertSettingsCard.tsx)**: Interactive slider to adjust detection radius (50m to 1.5km) and audio preferences.
- **[`NotificationChronicleDrawer.tsx`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/components/NotificationChronicleDrawer.tsx)**: Persistent slide-out history log of all past courier alerts and pickup responses.

---

## 3. Feature 2: Royal Story Herald (9:16 Vertical Story Studio)

### 🎯 The Objective
Provide an animated, one-click 9:16 export studio suitable for mobile stories, featuring a sealed antique envelope, wax seal with pulsing golden particle aura, real functional QR codes, copyable token badge, and live ticking countdown timers.

### ⚙️ Technical Highlights
- **Canvas Renderer**: [`frontend/src/utils/storyCanvasRenderer.ts`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/utils/storyCanvasRenderer.ts)
  - Native HTML5 Canvas rendered at **1080 × 1920 pixels** (standard 9:16).
  - Uses `qrcode` generator to paint scannable matrix modules directly onto the canvas.
  - Generates realistic particle embers, candlelight vignette, and 3D wax seal relief.
  - Supports 4 curated aesthetic themes: *Imperial Velvet*, *Obsidian Gold*, *Astral Spectral*, and *Ocean Swell*.
- **Local Timezone Conversion (`formatLocalDateTime`)**:
  - Replaced naive UTC `.toISOString().slice(0, 16)` with local datetime strings so presets (`+5m`, `+15m`, `+30m`, `+1h`, `+6h`, `+24h`, `+3d`, `+7d`) compute the exact local future time accurately across all world timezones.
- **Video Exporter**: [`frontend/src/utils/storyVideoExporter.ts`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/utils/storyVideoExporter.ts)
  - Uses browser `MediaRecorder` with `canvas.captureStream(30)` to export animated WebM video clips.
- **Studio Interface**: [`frontend/src/components/SocialTeaserModal.tsx`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/components/SocialTeaserModal.tsx)
  - Real-time preview with zoom controls, download buttons, and two-way sync with the letter's database record via `updateLetter`.

---

## 4. Feature 3: Recipient Time Lock & Time Capsule Enforcement

### 🎯 The Problem
Previously, if a sender set a future time lock (`scheduledFor`), recipients could immediately read the plaintext letter in `MyMailbox` or `LetterArchive`.

### 🛡️ The Solution
1. **Plaintext Masking on Letter Cards**:
   - In [`App.tsx`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/App.tsx) (`MyMailbox` & `LetterArchive`), if `letter.scheduledFor && new Date(letter.scheduledFor).getTime() > Date.now()`:
     - Plaintext preview is hidden.
     - A glowing lock badge displays: `⏳ Sealed Until [Date & Time]`.
     - The read button transforms into `[ 🔒 ⏳ Sealed Capsule ]`.
2. **Interactive Envelope View (`WaxSealRevealModal.tsx`)**:
   - If `isTimeLocked === true`:
     - Letter content is **not rendered in the DOM**.
     - Center seal displays a golden padlock emblem.
     - Live 1-second interval timer displays remaining `Days : Hours : Minutes : Seconds`.
     - Clicking the seal plays a locked thud and refuses to break.
     - When the countdown reaches `00:00:00`, the padlock unlocks with golden sparkles. Clicking then triggers the brittle wax fracture and smooth parchment unroll ceremony!
3. **Backend Read Receipt Protection**:
   - In [`backend/routes/letters.js`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/backend/routes/letters.js), `PUT /api/letters/:id/read` returns `403 Forbidden` if `scheduledFor > Date.now()`, ensuring read receipts cannot fire ahead of time.

---

## 5. Feature 4: Procedural Web Audio Synthesis Engine

### 🎯 The Objective
Deliver tactile, organic sound effects for wax seals, parchment unrolling, desk stamps, and courier chimes without static `.mp3` assets, while preventing ear fatigue and harsh treble frequencies.

### ⚙️ Master Acoustic Bus Design
- **File**: [`frontend/src/utils/waxSealAudio.ts`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/utils/waxSealAudio.ts)
- **Audio Routing Chain**:
  ```
  [Procedural Synthesis Node] 
            │
            ▼
  [Dynamics Compressor Node] (Threshold -18dB, Knee 20, Ratio 2.5)
            │
            ▼
  [Master Warm Low-Pass Filter] (2.4 kHz Butterworth curve, Q=0.6)
            │
            ▼
  [Master Gain Node] (Desktop: 0.34, Mobile: 0.19 -> 50% of previous levels)
            │
            ▼
  [AudioContext Destination (Speakers / Headphones)]
  ```

### 🔊 Sound Catalog
| Sound Method | Synthesis Structure | Acoustic Quality |
|---|---|---|
| `playUiTap()` | Bandpass noise (980Hz → 480Hz) + triangle tap (240Hz → 90Hz) | Soft ASMR parchment slide & wood tap |
| `playWaxCrack()` | Bandpass crackle (1150Hz → 420Hz) + triangle snap (360Hz → 110Hz) | Brittle organic wax snap (zero piercing treble) |
| `playParchmentUnroll()` | Granular paper friction with bandpass filter (880Hz → 450Hz) | Smooth paper unrolling rustle |
| `playWaxStampThud()` | Deep triangle thud (160Hz → 55Hz) + brass sine overtone (520Hz) | Velvet desk impact & matrix thud |
| `playSaddlebagDispatch()` | Leather thud (150Hz) + brass latch + sine triad (C4, E4, G4, C5) | Warm courier dispatch fanfare |
| `playCourierProximityChime()`| Pure sine bell triad (F4 349Hz, A4 440Hz, C5 523Hz) | Gentle Victorian postal arrival chime |
| `playCorkPop()` | Triangle cavity plop (520Hz → 130Hz) + decompression hiss (950Hz) | Round wooden cork pop |
| `playPaperTear()` | Modulated fiber friction (1100Hz → 450Hz) + shear snap (420Hz) | Soft parchment tear |

---

## 6. Feature 5: Postmaster High Command & Admin Tribunal Overhaul

### 🎯 The Objective
Re-skin the Admin Dashboard into an authentic 18th-century Sovereign Tribunal, remove citizen-only navigation links for admins, and update role terminology from "Student" to "Scribe".

### 👑 Refinements & Architecture
- **File**: [`frontend/src/AdminDashboard.tsx`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/AdminDashboard.tsx)
- **Design Tokens**:
  - Theatrical obsidian & burgundy canvas (`theatrical-card`).
  - Typography: `'Cinzel Decorative', serif` (titles), `'Cinzel', serif` (headers/badges), `'Cormorant Garamond', serif` (transcripts).
- **Navigation Cleanup ([`App.tsx`](file:///c:/Users/Fahim/Desktop/repo_clone/letter_game/letter-game/frontend/src/App.tsx))**:
  - When `user.role === 'admin'`, the navbar strictly shows **Tribunal**, **Hall of Fame**, and **Notice Board**.
  - Citizen-only links (*Thy Ledger*, *Scan Seal*, and *Story Herald*) are hidden.
- **Terminology Updates**:
  - Action button: **`[ ✍️ Make Scribe ]`** (promotes/reassigns citizen to `sender`).
  - Directory Filter: **`Scribes Only`**.
  - Stat Card: **`Total Scribes & Citizens`**.
- **Interactive Modals**:
  1. **Decree of Restriction (Ban Hammer)**: Steppers for Years, Days, Hours, Minutes to enact timed sanctions.
  2. **Tribunal Verdict & Decree**: Composes a formal verdict note dispatched directly to the reporting user's mailbox, resolving the report.
  3. **Intercept Missive Transcript**: Authentic parchment scroll reader revealing unmasked true identities and letter body.

---

## 7. Repository Structure & Code Navigation

```
letter-game/
├── backend/
│   ├── index.js                  # Express app & Socket.IO server setup
│   ├── db.js                     # MongoDB connection
│   ├── proximityService.js       # Courier geofencing & proximity telemetry
│   ├── models/
│   │   ├── User.js               # Scribe, Mailman & Admin schemas
│   │   └── Letter.js             # Missives, Time Capsules, Bottles, Dybbuk
│   └── routes/
│       ├── admin.js              # High Command stats, user roles, bans & messages
│       ├── letters.js            # Dispatch, mailboxes, time lock guards, read receipts
│       └── users.js              # Auth, leaderboards, proximity pings
├── frontend/
│   ├── src/
│   │   ├── AdminDashboard.tsx    # Sovereign High Command & Tribunal interface
│   │   ├── App.tsx               # Main application routing, mailboxes & navigation
│   │   ├── api.ts                # Centralized authenticated API caller
│   │   ├── components/
│   │   │   ├── NotificationChronicleDrawer.tsx  # Proximity notification history
│   │   │   ├── PickupAlertSettingsCard.tsx      # Radius & audio preference toggles
│   │   │   ├── PickupRadiusAlertToast.tsx       # Live encounter toast banner
│   │   │   ├── LetterTransferModal.tsx          # Physical scan handover animation
│   │   │   ├── SocialTeaserModal.tsx            # Royal Story Herald Studio modal
│   │   │   └── WaxSealRevealModal.tsx           # Time Capsule countdown & wax seal crack
│   │   └── utils/
│   │       ├── storyCanvasRenderer.ts           # 9:16 Canvas rendering & QR painting
│   │       ├── storyVideoExporter.ts            # WebM video clip exporter
│   │       └── waxSealAudio.ts                  # Procedural Web Audio synthesis engine
│   └── vite.config.ts            # Vite bundler configuration & proxy
└── package.json                  # Root scripts & dependencies
```

---

## 8. Local Development, Testing & Production Build Checklist

### 🏃 Running Locally
1. Start Backend & Frontend concurrently:
   ```bash
   npm run dev
   ```
   *Or in separate terminal tabs:*
   ```bash
   npm run dev:backend   # Runs on http://localhost:5000
   npm run dev:frontend  # Runs on http://localhost:5173
   ```

### 🧪 Validation & Production Build
Before pushing any new code to Git, always run the production build check:
```bash
# In frontend directory:
npm run build
```
Expected output:
```
✓ built in ~2.5s (0 errors)
```

To validate Node.js syntax on backend files:
```bash
node -c backend/index.js backend/proximityService.js backend/routes/letters.js backend/routes/admin.js
```

---

*Authored for the Sovereign Scribes & Couriers of PostMe.*
