# 🕹️ Twisted Game

> *"Subject 42 showed signs of extreme paranoia. The shapes... they aren't just hallucinations. They are manifesting."*

**Twisted Game** is a minimalist, retro terminal-style psychological survival horror game built with **React**, **TypeScript**, and **Tailwind CSS**. Stripping away high-fidelity 3D graphics in favor of green-phosphor ASCII art, CRT monitor aesthetics, and procedural Web Audio synthesizers, it delivers a deeply atmospheric and suspenseful experience inspired by classic survival horror and analog horror fiction.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Story & Lore](#story--lore)
- [Key Features](#key-features)
- [Game Loop & Mechanics](#game-loop--mechanics)
  - [1. The Prologue / Intro Sequence](#1-the-prologue--intro-sequence)
  - [2. The Night Shift (Nights 1–5)](#2-the-night-shift-nights-15)
  - [3. Entity Behavior & CCTV](#3-entity-behavior--cctv)
  - [4. Night 5: The Final Confrontation](#4-night-5-the-final-confrontation)
  - [5. Lore & Inventory System](#5-lore--inventory-system)
- [Controls Reference](#controls-reference)
- [Audio & Visual Design](#audio--visual-design)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Roadmap & What's Next](#roadmap--whats-next)
- [License](#license)

---

## 👁️ Overview

You awaken trapped inside a subterranean research facility. Monitored by unseen observers and guided only by cryptic telephone transmissions, your objective seems simple: **Survive until 6:00 AM**.

As the nights progress, anomalous geometric entities begin prowling the corridors. Every door you close and every camera you inspect draws precious battery power. If the generator dies, the facility goes dark—and whatever lurks outside will not hesitate.

---

## 📜 Story & Lore

- **The Observation Test:** You are the latest test subject in a classified psychological trial. You are instructed to monitor the facility's security cameras while dealing with extreme sleep deprivation, gas mixtures, and relentless sensory isolation.
- **Subject 42:** Scattered documents reveal that you are not the first. Previous occupants experienced identical hallucinations that gradually began interacting with the physical environment.
- **The Voice on the Phone:** Periodic ringing phones deliver unsettling, distorted messages from the test administrators. Can they be trusted, or are their directives part of the psychological stress evaluation?
- **Collectable Notes:** Throughout the intro sequence, players can search hidden corners to retrieve confidential logs stored in their inventory.

---

## ⚡ Key Features

- **📺 Retro CRT Terminal Aesthetics:** Monospaced typography, green-tinted phosphor palette, scanline styling, and customizable glitch effects.
- **📹 8-Channel CCTV Network:** Switch between 8 security camera feeds to monitor hallway corridors, storage vaults, and approaching threats.
- **⚡ Strategic Power Management:** Dynamic power drain based on door statuses and monitor usage over authentic, tension-building in-game hours.
- **👾 Escalating Threat AI:**
  - **TRIANGLE (`/\`):** Aggressive stalker that infiltrates along the left ventilation wing.
  - **CIRCLE (`OO`):** Fast-moving anomaly that flanks from the right sector beginning on Night 2.
- **⚔️ Night 5 Bullet-Hell Twist:** At 3:00 AM on the final night, containment fails. The office transforms into a real-time bullet-hell arena where you must dodge incoming anomalies using keyboard movement.
- **🎒 Notes & Inventory (`[TAB]`):** Discoverable backstory notes stored in a clean HUD drawer accessible at any time during gameplay.
- **🔊 Procedural Web Audio Engine:** Zero external audio dependencies—all sound effects (creaking pipes, droning generators, phone rings, static glitches, heartbeat palpitations, footsteps, and jumpscares) are generated natively using the Web Audio API.
- **💾 Local Storage Persistence:** Automatic checkpoint saves record your highest cleared night, audio volume preferences, and visual toggle states.

---

## 🕹️ Game Loop & Mechanics

### 1. The Prologue / Intro Sequence
Before reaching the security desk, players navigate a text-based ASCII stick-figure sequence:
- Wake up in a dark room.
- Explore the surrounding storage rooms to retrieve the security door key.
- Search nearby debris with `[R]` to collect classified research notes.
- Encounter facility guards, endure sedative gas, and receive the introductory phone call explaining protocol.

### 2. The Night Shift (Nights 1–5)
- Each in-game hour spans 2 real-time minutes (12-minute nights).
- The player starts with **100% battery power**.
- Closing the left door, closing the right door, and keeping the CCTV monitor open each increase power consumption.
- If power reaches 0%, lighting systems fail, doors forcefully disengage, and entity jumpscares become imminent.

### 3. Entity Behavior & CCTV
- Check the CCTV grid (`CAM 1` through `CAM 8`) using keys `[1]`–`[8]`.
- As entities close distance toward the office (`distance: 0`), close the corresponding blast door (`[A]` for left, `[D]` for right) to repel them back to their starting nodes.
- Failing to seal the door when an entity enters results in an immediate jumpscare and game over.

### 4. Night 5: The Final Confrontation
- Between 3:00 AM and 5:00 AM on Night 5, standard door and camera controls malfunction.
- The interface converts into a 30x30 spatial grid.
- Players have 3 health points and must pilot their stick figure using `[W]`, `[A]`, `[S]`, `[D]` to dodge erratic projectile waves emitted by both anomalies.

### 5. Lore & Inventory System
- When near points of interest in the facility, tap `[R]` to inspect items and discover hidden memos.
- Press `[TAB]` at any moment during the intro or night gameplay to inspect your collected notes.

---

## ⌨️ Controls Reference

### Intro & Exploration
| Action | Key | Description |
| :--- | :---: | :--- |
| **Move Up / Down** | `W` / `S` | Move stick figure vertically |
| **Move Left / Right** | `A` / `D` | Move stick figure horizontally |
| **Inspect / Pick Up Note** | `R` | Read and pocket notes when standing nearby |
| **Advance Dialogue** | `SPACE` | Continue story dialogue |
| **Open / Close Inventory** | `TAB` | View collected documents and notes |
| **Confirm / Start Shift** | `ENTER` | Complete phone call and begin Night 1 |

### Security Room Shift (Nights 1–5)
| Action | Key | Description |
| :--- | :---: | :--- |
| **Toggle Left Blast Door** | `A` | Close / open left security door |
| **Toggle Right Blast Door** | `D` | Close / open right security door |
| **Toggle CCTV Monitor** | `C` | Open / close security camera feed |
| **Switch Cameras** | `1` – `8` | Switch between CCTV channels 1 through 8 |
| **Answer Phone** | `P` | Answer incoming voice calls when ringing |
| **Open Inventory** | `TAB` | Open note log drawer |

### Night 5 Dodging Sequence
| Action | Key | Description |
| :--- | :---: | :--- |
| **Dodge Up / Down / Left / Right** | `W`, `A`, `S`, `D` | Maneuver stick figure across the 30x30 grid |

---

## 🎨 Audio & Visual Design

- **Green Monochromatic CRT:** Custom CSS scanline overlays, bordered viewport styling, and flickering lighting simulating cold-war era computing equipment.
- **Glitch Synthesis:** Procedural string scrambling during transitions and jump scares, with the option to disable screen shake/glitches in the settings menu.
- **Custom Web Audio Synthesizer:**
  - White-noise bandpass filters for gas hiss and ventilation wind.
  - Dual sine-wave oscillators for the classic 1980s telephone ringer.
  - Sub-bass rumble for generator hums and elevator shafts.
  - Low-frequency square waves for door hydraulic slams.
  - Distorted frequency chirps for anomalous entity jumpscares.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict typing)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Bundler & Tooling:** [Vite](https://vitejs.dev/)
- **Icons:** [lucide-react](https://lucide.dev/)
- **Audio:** Native Browser Web Audio API (`AudioContext`, `BiquadFilterNode`, `GainNode`, `OscillatorNode`)
- **Storage:** Browser `localStorage` for progress and configuration

---

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18+ recommended)
- npm or pnpm or bun

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/twisted-game.git
   cd twisted-game
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Project Architecture

```
├── index.html            # HTML entry point with retro meta tags & font links
├── metadata.json         # Project metadata and permissions
├── package.json          # Dependencies & build scripts
├── src/
│   ├── main.tsx          # React application root mount
│   ├── index.css         # Global styling & Tailwind directives
│   ├── App.tsx           # Core game state loop, CCTV, doors, power, dodging & HUD
│   ├── Intro.tsx         # Interactive ASCII prologue, stick figure engine, note pickups
│   ├── TitleScreen.tsx   # Main menu, night select, settings (SFX/Music/Glitch)
│   └── audio.ts          # Pure Web Audio API synthesis engine (no external assets)
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build & plugin configuration
```

---

## 🔮 Roadmap & What's Next

- [ ] **Custom Night Mode:** Allow players to customize individual AI difficulty levels (0–20).
- [ ] **Additional Anomalies:** Introducing new entities with unique stealth mechanics (e.g., an anomaly that moves only when the monitor is active).
- [ ] **Branching Phone Transmissions:** Interactive dialogue prompts during phone calls influencing the facility's power routing.
- [ ] **Secret Endings:** Additional hidden logs and an alternative escape sequence if all notes are collected.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
