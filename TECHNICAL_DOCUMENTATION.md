# DEADLINE: SKYFIRE — Technical Documentation

Comprehensive architecture, technology stack, algorithms, and asset-pipeline reference for **DEADLINE: SKYFIRE**, a standalone 2D top-down zombie horde shooter built in `C:\Users\Raj\Desktop\zombie-horde-shooter\`.

---

## 1. Executive Overview & Zero-Dependency Philosophy

**DEADLINE: SKYFIRE** is a 100% client-side browser game designed to run immediately when opening `index.html` directly from the local filesystem (`file://`) or from any static HTTP server — with zero frameworks, bundlers, transpilers, external CDNs, or runtime package installations.

Key architectural goals:
- **Zero external runtime dependencies**: All game logic, physics, AI pathfinding, Canvas 2D rendering, and sound synthesis run natively in standard browser APIs.
- **`file://`-safe execution**: Scripts are written as IIFEs (`(function () { "use strict"; ... })()`) loaded via `<script defer>` and attached to `window.*` namespaces instead of `<script type="module">`, avoiding browser CORS blocks on `file://` origins. Offscreen hit-flash generation uses Canvas `globalCompositeOperation = "source-in"` rather than `getImageData()` / `toDataURL()`, preventing tainted-canvas security errors on local files.
- **High-performance horde simulation**: Spatial hashing (`O(N)` neighbor lookup), a cached `60×45` Dijkstra flow field using preallocated typed arrays, and pre-rendered offscreen terrain/decal canvases keep frame times smooth even with large zombie swarms, aircraft, and particle bursts.

---

## 2. Technology Stack Summary

| Layer | Technology / API | Purpose in Project |
| :--- | :--- | :--- |
| **Document & UI Structure** | HTML5 (`index.html`, `controls.html`) | Full-viewport `<canvas>`, minimal unstylized title screen, HUD, Weapon Dock, Armory modal, Pause/Game Over overlays, and separate reference page (`controls.html`). |
| **Styling & Layout** | CSS3 (`styles.css`) | Simple light theme (`#ffffff` / `#f5f5f5`), CSS custom properties, Flexbox & CSS Grid, flat `1px` borders, and strict `border-radius: 0` rectangular controls. |
| **Application & Game Logic** | Vanilla JavaScript (ES5/ES6 IIFEs) | Modular client architecture across 7 classic scripts (`audio.js`, `weapons.js`, `map.js`, `entities.js`, `sprites.js`, `renderer.js`, `game.js`). |
| **2D Graphics & Rendering** | HTML5 Canvas 2D (`CanvasRenderingContext2D`) | High-DPI (`devicePixelRatio`, capped at `2`) game viewport, offscreen terrain/decal buffers, multi-layer entity & airspace rendering, and live `160×120` minimap. |
| **Audio Synthesis** | Web Audio API (`AudioContext`) | Real-time procedural sound effects (oscillators, filtered white-noise buffers, gain envelopes, polyphony cooldown throttling) with zero external `.mp3`/`.wav` files. |
| **Persistence** | Web Storage API (`localStorage`) | Saves best Survival wave and high score under `deadline_skyfire_records_v1` (with `try/catch` protection for restricted environments). |
| **Visual Assets** | Transparent RGBA PNGs + Inline SVGs | 7 custom top-down zombie PNG sprites and 8 weapon PNG sprites (`assets/sprites/`), plus crisp inline SVG icons for aircraft and tactical dock slots. |
| **Asset Processing Pipeline** | Python 3.12 (`Pillow`, `NumPy`, `SciPy`) | Build-time background flood-fill removal, cutout transparency, 1px white-matte un-premultiplication, 4× supersampled procedural weapon rendering, and LANCZOS downsampling. |
| **Automated Verification** | Node.js v24 (`node --check`, `node:vm`, `assert`) | Build-time syntax validation, DOM ID integrity checks, CSS border-radius auditing, PNG header validation, and headless physics/AI/combat simulation tests. |

---

## 3. Project File Structure & Script Load Order

```text
C:\Users\Raj\Desktop\zombie-horde-shooter\
├── index.html                  # Main game page, canvas, HUD, modals, and script manifest
├── controls.html               # Standalone light-themed controls & weapon reference page
├── styles.css                  # Light theme stylesheet with square buttons (border-radius: 0)
├── README.md                   # Quick-start play guide
├── TECHNICAL_DOCUMENTATION.md  # This technical reference document
├── assets/
│   └── sprites/
│       ├── shambler.png        # 128x128 transparent top-down zombie sprite
│       ├── runner.png          # 128x128 transparent top-down zombie sprite
│       ├── spitter.png         # 128x128 transparent top-down zombie sprite
│       ├── screamer.png        # 128x128 transparent top-down zombie sprite
│       ├── exploder.png        # 128x128 transparent top-down zombie sprite
│       ├── brute.png           # 160x160 transparent top-down zombie sprite
│       ├── boss.png            # 224x224 transparent top-down zombie sprite
│       └── weapons/
│           ├── rifle.png       # 160x80 M4 Assault Rifle sprite
│           ├── shotgun.png     # 160x80 SPAS-12 Shotgun sprite
│           ├── minigun.png     # 160x80 M134 Vulcan Minigun sprite
│           ├── railgun.png     # 160x80 Railgun Sniper sprite
│           ├── flamethrower.png# 160x80 M2 Flamethrower sprite
│           ├── rpg.png         # 160x80 RPG-7 Rocket Launcher sprite
│           ├── tesla.png       # 160x80 Tesla Arc Cannon sprite
│           └── designator.png  # 160x80 Laser Target Designator sprite (air support)
└── js/
    ├── audio.js                # -> window.SoundEngine
    ├── weapons.js              # -> window.WeaponData
    ├── map.js                  # -> window.GameMap
    ├── entities.js             # -> window.GameEntities
    ├── sprites.js              # -> window.SpriteLoader
    ├── renderer.js             # -> window.GameRenderer
    └── game.js                 # -> window.ZombieGame / window.__GAME__
```

### Script Load Order (`index.html`)
Scripts load in strict dependency order using `<script defer src="...">`:
1. `js/audio.js` — Standalone Web Audio wrapper (`window.SoundEngine`).
2. `js/weapons.js` — Static weapon catalog, SVG icons, sprite paths, and Level 1–5 scaling math (`window.WeaponData`).
3. `js/map.js` — Arena geometry, offscreen terrain/decal canvases, collision helpers, and Dijkstra flow field (`window.GameMap`).
4. `js/entities.js` — Simulation state, spatial hash, combat, aircraft, turrets, orbitals, and zombie AI (`window.GameEntities`).
5. `js/sprites.js` — Async `Image` preloader for zombie and weapon PNGs + cached white hit-flash canvases (`window.SpriteLoader`).
6. `js/renderer.js` — World canvas & minimap renderer (`window.GameRenderer`).
7. `js/game.js` — Main `requestAnimationFrame` loop, Wave Director, HUD binding, Armory UI, and input controller (`window.ZombieGame`).

---

## 4. Core Game Loop, State Machine & Input (`js/game.js`)

### Game Loop & Timing
- Driven by `requestAnimationFrame(gameLoop)`.
- Frame delta `dt` is clamped to `[0.001, 0.05]` seconds (`Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000))`) so switching browser tabs or experiencing a frame spike never teleports zombies or breaks physics.

### Phase State Machine
`app.phase` transitions cleanly among 5 states:
- `"menu"`: Plain light start screen (`#startOverlay`) with strictly **Survival** (`#btnSurvival`), **Sandbox** (`#btnSandbox`), and a `Controls` link to `controls.html`.
- `"playing"`: Active simulation, camera tracking, HUD updates, and input firing.
- `"armory"`: Pauses simulation while browsing/equipping weapons, buying Level 1–5 upgrades, or refilling Medkits (`$120`) and Armor (`$180`).
- `"paused"`: Pauses simulation (`#pauseOverlay`) with quick links to Resume, Armory, Restart, Main Menu, and `controls.html`.
- `"gameover"`: Displays run statistics (Wave reached, Eliminations, Final Score, Best Combo, Top Weapon, Best Record) and saves Survival records to `localStorage`.

### Camera Tracking & Screen Shake
- Smooth exponential camera interpolation follows the player plus subtle mouse lookahead (`±90px` horizontally, `±70px` vertically), clamped inside the `2400×1800` arena bounds.
- Trauma-based screen shake (`state.events.screenShake`, capped at `24`) offsets the viewport during explosions, railgun shots, orbital laser strikes, sonic screams, and boss slams, decaying continuously at `36/s`.

### Wave Director & Game Modes
- **Survival Waves**: Starts with `$150` cash and `50` armor. Wave size scales dynamically (`16 + floor(w * 7.5 + w^1.32)`), granting a `+$80 + w*25` cash bonus and `+15 HP` on each new wave after Wave 1, plus a **NECRO TITAN** boss every 5th wave (`w % 5 === 0`).
- **Sandbox Chaos**: Starts with `$99,999` cash, `100` armor, all weapons pre-upgraded to Level 3, `0.35×` air-support cooldowns (`0.45×` tactical cooldowns), free upgrades, and an instant **`+ HORDE [H]`** trigger (`spawnSandboxMegaHorde`) spawning 36 mixed zombies at screen edges.
- **Exploder Spawn Balancing**: On Wave 4+, exploders are capped at `Math.min(3, Math.max(1, Math.floor((waveNum - 2) / 2)))` per wave (`3%` roll), and Sandbox Mega-Hordes include strictly `1` exploder out of 36 zombies.

### Input & Selective Cooldown Display
- Supports `WASD`/Arrows, mouse aim & hold-to-fire, mouse-wheel weapon cycling, keys `1`–`9`/`0`, `Q` (Auto-Turret), `E` (Orbital Ion Laser), `Space`/`Shift` (Dash), `B`/`Tab` (Armory), `H` (Sandbox horde), `M` (Mute), and `P`/`Esc` (Pause).
- In `updateHud()`, the bottom dock's `.slot-cd-overlay` progress fill only displays when `def.showCooldown === true` (heavy/air/tactical weapons: `rpg`, `a10`, `bomber`, `chopper`, `turret`, `orbital`). Guns and lighter weapons (`rifle`, `shotgun`, `minigun`, `railgun`, `flamethrower`, `tesla`) have `showCooldown: false` and stay cleanly at `0%`.

---

## 5. World Map, Collision Physics & AI Pathfinding (`js/map.js`, `js/entities.js`)

### Arena Layout & Collision Primitives (`js/map.js`)
- **World Dimensions**: `WORLD_W = 2400`, `WORLD_H = 1800`, featuring four corner L-shaped concrete bunkers, mid-ring cargo crates, flanking roadblocks, inner plaza sandbags, and a wide central helipad spawn plaza at `(1200, 900)`.
- **Circle-vs-AABB Resolution (`resolveCircleObstacles`)**: Clamps every moving actor inside the `20px` perimeter padding and pushes overlapping circles out along the shortest penetration vector to the nearest point on each rectangular obstacle.
- **Ray-vs-AABB Intersection (`segmentHitsObstacle`)**: Liang-Barsky / slab intersection test returning the earliest hit parameter `t ∈ [0, 1]` and exact wall impact coordinates for railgun beams, line-of-sight checks, and projectile collision.

### Grid Flow-Field Pathfinding
To prevent zombies from getting stuck behind walls, barriers, or L-shaped bunkers:
1. **Static Navigation Grid**: The world is discretized into `NAV_CELL = 40px` tiles (`NAV_COLS = 60`, `NAV_ROWS = 45`, `NAV_TOTAL = 2700` cells). At map creation, `navBlocked` (`Uint8Array`) marks cells whose centers fall inside any obstacle padded by `14px` or outside the perimeter.
2. **Cached Dijkstra Propagation (`updateFlowField`)**:
   - Recomputes only when the player moves into a new `40×40` grid cell (`goalIdx !== navGoalCell`), using preallocated `Int32Array` buffers (`navDist`, binary min-heap `heapIdx` / `heapCost`) — **zero heap allocations per frame**.
   - Runs 8-neighbor Dijkstra with cardinal cost `10` and diagonal cost `14`, explicitly blocking diagonal corner-cutting when either adjacent cardinal cell is blocked.
   - Extracts smooth unit flow vectors (`Float32Array` `navFlowX`, `navFlowY`) pointing toward the lowest-cost neighbor (and pointing out of blocked perimeter cells into open lanes).
3. **Steering & Corner-Escape (`updateZombies`)**:
   - Each zombie tests `hasLineOfSight(z.x, z.y, tx, ty, min(20, z.radius * 0.85))`, which checks center line-of-sight plus two parallel body-clearance rays.
   - If clear, the zombie pursues directly; if occluded by an obstacle, it follows `getFlowDirection(z.x, z.y)` around the walls.
   - A `0.25s` progress monitor detects if a zombie moved less than `8px` while advancing (`moveFactor > 0.4`) and injects a `0.45s` tangential corner-escape nudge (`stuckBias`), preventing corner snags.

### Spatial Hashing (`SpatialHash`)
- Cleared and rebuilt once per frame (`cellSize = 72`).
- Uses an incremental integer `_stamp` counter on entities rather than allocating `Set` objects during `query(x, y, radius)`.
- Accelerates zombie-to-zombie separation forces, RPG/A-10/Bomber/Exploder/Orbital AoE splash damage, Tesla chain-lightning jumps, and Auto-Turret / Apache target acquisition.

---

## 6. Weapons, Scaling & Air Support Systems (`js/weapons.js`, `js/entities.js`)

### Full Arsenal Specification

| Key | ID | Weapon | Category | Cooldown Dock Bar | Core Mechanic |
| :---: | :--- | :--- | :--- | :---: | :--- |
| `1` | `rifle` | M4 Assault Rifle | Guns | No | High-velocity automatic carbine (`9.5/s`, brass casings). |
| `2` | `shotgun` | SPAS-12 Shotgun | Guns | No | 8-pellet spread fan (`+2` pellets per upgrade), strong knockback. |
| `3` | `minigun` | M134 Vulcan Minigun | Guns | No | Rotary stream (`22/s`), `0.82×` move speed while firing. |
| `4` | `railgun` | Railgun Sniper | Guns | No | Instant wall-clipped ray piercing up to `18` zombies (`+4`/lv). |
| `5` | `flamethrower` | M2 Flamethrower | Heavy | No | Expanding flame particles piercing `6` zombies & applying burn DoT. |
| `6` | `rpg` | RPG-7 Rocket Launcher | Heavy | Yes | Smoke-trailing rocket detonating for `135px` AoE splash + scorch crater. |
| `7` | `tesla` | Tesla Arc Cannon | Heavy | No | Jagged chain lightning jumping across `6`+ unique zombies + `0.55×` slow. |
| `8` | `a10` | A-10 Warthog Jet | Airplanes | Yes | Low-flying jet strafe firing `14+` explosive 30mm shells along cursor corridor (`2` jets at Lv 3, `3`-jet V-formation at Lv 5). |
| `9` | `bomber` | B-52 Carpet Bomber | Airplanes | Yes | Heavy bomber dropping `12+` altitude-falling incendiary bombs (`2` bombers at Lv 4+). |
| `0` | `chopper` | Apache Gunship | Airplanes | Yes | Orbiting helicopter (`14s+`) with rapid autocannon + twin Hydra rockets. |
| `Q` | `turret` | Deploy Auto-Turret | Tactical | Yes | `$150` (`$0` Sandbox); deploys sentry (`490px` range, max `3`–`5` active). |
| `E` | `orbital` | Orbital Ion Laser | Tactical | Yes | `$250` (`$0` Sandbox); `3.0s+` satellite beam tracking the mouse cursor. |

### Level 1–5 Scaling (`getScaledStats`, `getUpgradeCost`)
- Upgrade cost: `round(upgradeBaseCost * 1.65^(level - 1))` up to `MAX_LEVEL = 5`.
- Deterministic per-level multipliers:
  - Damage: `1 + (lv - 1) * 0.28`
  - Fire rate: `1 + (lv - 1) * 0.14`
  - Cooldown multiplier: `max(0.45, 1 - (lv - 1) * 0.13)`
  - Blast / beam AoE radius: `1 + (lv - 1) * 0.12`
- **Player Overdrive Buff**: Boosts movement speed by `1.25×` and non-air weapon fire rate by `1.45×` for `8s`.

---

## 7. Enemy Archetypes & Pickups (`js/entities.js`)

| ID | Display Name | Radius | Base HP | Speed | Special Behavior |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `shambler` | Shambler | 15 | 62 | 78 | Classic horde melee pursuer. |
| `runner` | Crimson Runner | 13 | 40 | 172 | High-speed flanker with rapid melee strikes. |
| `brute` | Armored Brute | 24 | 265 | 58 | Heavy tank (`0.3` knockback multiplier); `34%` medkit / `31%` cash drop rate. |
| `spitter` | Bile Vomiter | 14 | 58 | 88 | Fires a 3-glob `vomit` cone when within `380px` with unobstructed LOS; impacts create `4s` damaging toxic pools. |
| `screamer` | Sonic Screamer | 14 | 66 | 96 | Telegraphs for `0.36s` within `440px` LOS, then unleashes an expanding `sonic` soundwave arc that damages and knocks back the player with screen shake. |
| `exploder` | Volatile Boomer | 18 | 78 | 102 | Detonates on contact or death (`82px` radius, `42` player damage / `45` friendly-fire splash). |
| `boss` | NECRO TITAN | 38 | 2600 | 68 | Spawns every 5 waves; performs a `175px` radial shockwave slam, summons 4 minions every `8.5s`, and drives the top Boss HP bar. |

### Pickups
Killed zombies can drop magnetic pickups (`140px` pull radius):
- **Medkit (`+`)**: Restores `+30 HP`.
- **Cash (`$`)**: Grants `+$75` (Survival) and `+100` score.
- **Overdrive (`⚡`)**: Grants `8.0s` speed and fire-rate boost.
- **Tactical Nuke (`☢`)**: Triggers white screen flash, `720px` shockwave, wipes non-boss zombies on the field, and deals `900` damage to bosses.

---

## 8. Rendering Pipeline, Sprites & UI Theme (`js/sprites.js`, `js/renderer.js`, `styles.css`)

### Offscreen Terrain & Persistent Decals (`js/map.js`)
- `terrainCanvas` (`2400×1800`): Pre-renders the light concrete floor (`#eceff3`), sector grid (`#dcdfe6`), crossroads (`#dfe4ec`), central helipad plaza, road markings, deterministic grit noise, and perimeter border once per match.
- `decalCanvas` (`2400×1800`): Accumulates persistent zombie blood splatters, explosion scorch craters, and brass shell casings. Every frame blits only the visible camera slice (`sx, sy, sw, sh`) to the main canvas.

### 12-Layer Frame Composition (`renderWorld`)
1. Viewport-clipped Terrain & Persistent Decal canvases.
2. Acid/vomit pools.
3. Ground-projected weapon aim previews (RPG blast circle, Apache orbit circle, A-10 & B-52 dashed strafe/bombing corridor).
4. Map obstacles with drop shadows & highlights.
5. Bobbing pickups.
6. Deployed Auto-Turrets (tripod base, rotating twin-barrel head, lifetime bar).
7. Zombies (ground shadow + rotated/animated PNG sprite or procedural fallback + telegraph/burn/shock rings + damaged HP bars).
8. Player (dash afterimages, overdrive ring, soldier body, rotated weapon PNG sprite with recoil & muzzle flash, helmet).
9. Projectiles (bullets, flames, smoke-trailing rockets, 2-droplet bile globs, 3-ring curved sonic waves), Beams (railgun, jagged Tesla lightning, A-10 tracers), Shockwaves, and Particles.
10. Airspace layer (offset ground shadows, descending B-52 bombs shrinking shadows as `z: 1 → 0`, A-10 Warthogs, B-52 Bombers, rotor-spinning Apache Choppers, and full-column Orbital Ion Lasers).
11. Floating combat text popups.
12. Custom weapon-colored crosshair and full-screen explosion/nuke flash.
- Plus a dedicated `160×120` tactical minimap (`renderMinimap`) rendering obstacles, pickups, turrets, zombies, gold boss markers, aircraft, camera viewport box, and player dot.

### Sprite Preloading & Hit-Flash (`js/sprites.js`)
- Preloads 7 zombie sprites (`assets/sprites/*.png`) and 8 weapon sprites (`assets/sprites/weapons/*.png`) via `Image()`.
- On load, each zombie image generates a matching white silhouette `flashCanvas` using `globalCompositeOperation = "source-in"`.
- In `drawZombies`, sprites animate with archetype-specific walk sway (`0.07–0.14 rad`) and stride squash-and-stretch. In `drawPlayer`, `WEAPON_RENDER_CFG` aligns each gun sprite and muzzle flash position dynamically with `p.muzzleFlash` recoil kickback.
- Headless environments without `Image` (such as Node.js tests) receive `null` gracefully without throwing.

### Light UI Theme & Controls Separation (`index.html`, `controls.html`, `styles.css`)
- Styled with flat light surfaces (`#ffffff` / `#f5f5f5`), dark ink typography (`#111111`), `1px solid` borders, and global `border-radius: 0` (strictly square buttons and panels).
- The front page (`#startOverlay`) contains strictly the title, two buttons (`Survival` and `Sandbox`), and a plain text link to `controls.html`, keeping keybindings and arsenal tables cleanly separated on their own scrollable page.

---

## 9. Procedural Web Audio Engine (`js/audio.js`)

`window.SoundEngine` synthesizes every sound effect programmatically with no external audio files:
- **Lazy Unlock**: Initializes `AudioContext` (with `masterGain.gain = 0.34`) on the first click/keypress and pre-generates a `1.5s` mono white-noise `AudioBuffer`.
- **Two Synthesis Primitives**:
  - `playTone`: `OscillatorNode` (`sine`, `square`, `sawtooth`, `triangle`) with exponential frequency sweeps and ADSR-style gain ramps.
  - `playNoise`: `AudioBufferSourceNode` routed through a `BiquadFilterNode` (`lowpass`, `highpass`, `bandpass`) with sweepable cutoff and `Q`.
- **Polyphony Throttling (`canTrigger(tag, minIntervalMs)`)**: Prevents audio distortion during rapid minigun fire, A-10 cannon bursts, or multi-kill chains.
- **Synthesized Sound Catalog**: `playRifle`, `playShotgun`, `playMinigun`, `playRailgun`, `playFlame`, `playRocketLaunch`, `playExplosion(scale)`, `playTesla`, `playJetStrafe` (flyby roar + *BRRRT* burst), `playBomberPass`, `playChopperShot`, `playTurretShot`, `playOrbitalLaser`, `playVomit`, `playSonicScream`, `playHit`, `playZombieDeath`, `playPlayerHurt`, `playDash`, `playPickup`, `playUpgrade`, `playSwitch`, `playWaveStart`, and `playBossWarning`.

---

## 10. Sprite Creation & Verification Pipelines

### Sprite Production Pipeline (Python `Pillow` + `NumPy` + `SciPy`)
- **Zombie Sprites (`process_sprites.py`)**: All 7 raw AI-generated overhead top-down sprites were converted to transparent RGBA PNGs via 4-connected border flood-fill (`luma >= 224` & `chroma <= 26`), 1px fringe alpha smoothing with white-matte un-premultiplication, tight alpha bounding-box cropping, symmetric square padding, and `Image.Resampling.LANCZOS` resizing (`128×128` standard, `160×160` brute, `224×224` boss).
- **Weapon Sprites (`process_weapon_sprites.py`)**:
  - `rifle`, `shotgun`, and `minigun` used border-connected flood-fill plus interior pure-white cutout detection (`luma >= 243` & `chroma <= 12`) to make folding stocks, trigger guards, and handle loops transparent, then resized cleanly to `160×80`.
  - `railgun`, `flamethrower`, `rpg`, `tesla`, and `designator` were procedurally illustrated at 4× supersampling (`640×320`) with matching `#12161d` bold ink outlines and multi-tone shading before LANCZOS downsampling to `160×80`.

### Automated Verification Harness (`verify_game.js` + `node --check`)
- **Syntax Validation**: `node --check` verifies all 7 JavaScript modules.
- **HTML/DOM & Style Integrity**: Checks that every `document.getElementById(...)` in `js/game.js` exists in `index.html`, `#startOverlay` contains strictly 2 buttons and links to `controls.html`, `js/sprites.js` loads before `js/renderer.js`, and `styles.css` contains zero non-zero `border-radius` declarations.
- **Asset Verification**: Verifies all 7 zombie PNGs and 8 weapon PNGs exist, are non-empty, and contain valid PNG magic headers (`89 50 4E 47`).
- **Headless Simulation Suite (`node:vm`)**: Loads `weapons.js`, `map.js`, `entities.js`, and `sprites.js` in an isolated VM context and verifies Level 1–5 stat scaling, combat across all 12 weapons/tacticals and 7 zombie types, flow-field routing around L-bunker walls, Bile Vomiter & Sonic Screamer ranged attacks, and Exploder blast balance.
