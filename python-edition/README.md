# DEADLINE: SKYFIRE (Python + Pygame Edition)

A pure Python 2D top-down zombie horde shooter powered by **Pygame**, using 100% Python game logic, flow-field AI pathfinding, procedural PCM sound synthesis, and custom transparent zombie and weapon sprites.

## Setup & Launch
1. Install Pygame (if not already installed):
   ```cmd
   pip install -r requirements.txt
   ```
2. Double-click **`play.bat`** or run:
   ```cmd
   python main.py
   ```

## Features
- **Plain Light UI**: Clean white start screen with `Survival`, `Sandbox`, and a separate `Controls` screen, square (`border-radius: 0`) buttons, and a light arena.
- **10 Primary Weapons (`1`–`9`, `0`) + 2 Tactical Supports (`Q`, `E`)**:
  - **Guns (`1`–`4`)**: M4 Assault Rifle, SPAS-12 Shotgun, M134 Vulcan Minigun, Railgun Sniper.
  - **Heavy & Sci-Fi (`5`–`7`)**: M2 Flamethrower, RPG-7 Rocket Launcher, Tesla Arc Cannon.
  - **Airplanes & Choppers (`8`–`0`)**: A-10 Warthog Jet, B-52 Carpet Bomber, Apache Gunship.
  - **Tactical Support (`Q`, `E`)**: Deploy Auto-Turret, Orbital Ion Laser.
- **Smart Flow-Field Zombie AI**: 7 archetypes (`Shambler`, `Crimson Runner`, `Armored Brute`, ranged `Bile Vomiter`, ranged `Sonic Screamer`, `Volatile Boomer`, and `NECRO TITAN` boss) that actively navigate around walls and bunkers.

## File Structure
- `main.py` — Window loop, phase state machine, Wave Director, and input handler
- `weapons.py` — Weapon catalog and Level 1–5 scaling math
- `game_map.py` — `2400×1800` arena, collision, Dijkstra flow field, and terrain/decal surfaces
- `entities.py` — Pure Python world simulation, spatial hash, combat, aircraft, and zombie AI
- `sprites.py` — Sprite loader, white hit-flash masks, and angle-bucketed rotation cache
- `renderer.py` — World renderer, minimap, HUD, Weapon Dock, and modals
- `audio.py` — Synthesized 16-bit PCM SFX engine
- `assets/sprites/` — Transparent PNG zombie and weapon sprites
