"""Main Pygame entry point, wave director, input handling, and UI navigation."""

import json
import os
import random
import pygame

import audio
import entities
import game_map
import renderer
import sprites
import weapons

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RECORDS_PATH = os.path.join(BASE_DIR, "records.json")


class GameApp:
    def __init__(self, width=1280, height=760):
        self.view_w = width
        self.view_h = height
        self.screen = pygame.display.set_mode((width, height), pygame.RESIZABLE)
        pygame.display.set_caption("DEADLINE: SKYFIRE")

        self.clock = pygame.time.Clock()
        self.sound = audio.SoundEngine()
        self.sound.init()

        self.sprite_store = sprites.SpriteStore(BASE_DIR)
        self.sprite_store.load_all()
        self.gfx = renderer.GameRenderer()

        self.phase = "menu"  # menu | controls | playing | armory | paused | gameover
        self.controls_return_phase = "menu"
        self.mode = "survival"
        self.armory_filter = "all"
        self.armory_scroll = 0
        self.controls_scroll = 0

        self.map = None
        self.state = None
        self.camera = [1200.0, 900.0]
        self.wave = {
            "number": 1,
            "queue": [],
            "spawn_timer": 0.0,
            "intermission": 0.0,
            "banner_timer": 0.0,
            "banner_title": "",
            "banner_sub": "",
        }
        self.firing = False
        self.records = self._load_records()
        self.ui_rects = {}
        self.running = True

    def _load_records(self):
        try:
            if os.path.exists(RECORDS_PATH):
                with open(RECORDS_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return {"best_score": int(data.get("best_score", 0)), "best_wave": int(data.get("best_wave", 0))}
        except Exception:
            pass
        return {"best_score": 0, "best_wave": 0}

    def _save_records(self):
        try:
            with open(RECORDS_PATH, "w", encoding="utf-8") as f:
                json.dump(self.records, f, indent=2)
        except Exception:
            pass

    def show_banner(self, title, sub="", duration=2.6):
        self.wave["banner_title"] = title
        self.wave["banner_sub"] = sub
        self.wave["banner_timer"] = duration

    def start_run(self, mode):
        self.mode = mode
        self.map = game_map.create_map(build_gfx=True)
        self.state = entities.create_world_state(mode, self.map)
        self.camera = [self.state.player.x, self.state.player.y]
        self.firing = False
        self.wave["number"] = 0
        self.wave["queue"] = []
        self.wave["spawn_timer"] = 0.0
        self.wave["intermission"] = 0.0
        self.state.events.on_boss_kill = lambda _z: self.show_banner("BOSS ELIMINATED", "MASSIVE SUPPLY BONUS AWARDED", 2.8)
        self.phase = "playing"
        self.begin_next_wave()

    def build_wave_queue(self, wave_num, mode):
        queue = []
        total = (
            26 + min(70, wave_num * 8)
            if mode == "sandbox"
            else 16 + int(wave_num * 7.5 + (wave_num ** 1.32))
        )
        max_exploders = min(3, max(1, (wave_num - 2) // 2)) if wave_num >= 4 else 0
        exploder_count = 0

        for _ in range(total):
            r = random.random()
            if wave_num >= 4 and exploder_count < max_exploders and r < 0.03:
                queue.append("exploder")
                exploder_count += 1
            elif wave_num >= 3 and r < 0.22:
                queue.append("brute")
            elif r < 0.34:
                queue.append("spitter")
            elif r < 0.44:
                queue.append("screamer")
            elif r < 0.68:
                queue.append("runner")
            else:
                queue.append("shambler")

        if wave_num % 5 == 0:
            queue.insert(0, "boss")
        return queue

    def begin_next_wave(self):
        self.wave["number"] += 1
        w = self.wave["number"]
        self.wave["queue"] = self.build_wave_queue(w, self.mode)
        self.wave["spawn_timer"] = 0.2

        if w % 5 == 0:
            self.show_banner(f"WAVE {w} - BOSS INBOUND", "NECRO TITAN DETECTED - USE HEAVY & AIR SUPPORT!", 3.4)
            self.sound.play_boss_warning()
        else:
            if self.mode == "sandbox":
                sub = "SANDBOX WAVE - PRESS [H] FOR EXTRA MEGA-HORDE"
            elif w == 1:
                sub = "SWITCH WEAPONS [1-0] OR CALL AIRPLANES [8-0]!"
            else:
                sub = f"SURVIVAL CASH BONUS +${80 + w * 25}"
            self.show_banner(f"WAVE {w}", sub, 2.8)
            self.sound.play_wave_start()

        if w > 1 and self.mode == "survival":
            self.state.stats.cash += 80 + w * 25
            self.state.player.hp = min(float(self.state.player.max_hp), self.state.player.hp + 15.0)

    def spawn_sandbox_mega_horde(self):
        if not self.state or self.phase != "playing":
            return
        bounds = self._view_bounds()
        types = ["shambler", "runner", "brute", "spitter", "screamer"]
        for i in range(36):
            z_type = "exploder" if i == 18 else types[i % len(types)]
            entities.spawn_zombie_at_edge(self.state, z_type, 1.0 + self.wave["number"] * 0.12, bounds)
        self.show_banner("MEGA HORDE RELEASED!", "LIGHT UP THE SKY WITH AIRSTRIKES!", 2.0)
        self.sound.play_boss_warning()

    def _view_bounds(self):
        return (
            self.camera[0] - self.view_w / 2.0,
            self.camera[0] + self.view_w / 2.0,
            self.camera[1] - self.view_h / 2.0,
            self.camera[1] + self.view_h / 2.0,
        )

    def select_weapon(self, wid):
        if self.state and wid in weapons.WEAPON_BY_ID:
            self.state.player.active_weapon_id = wid
            self.sound.play_switch()

    def cycle_weapon(self, direction):
        if not self.state:
            return
        ids = [w["id"] for w in weapons.WEAPONS]
        idx = ids.index(self.state.player.active_weapon_id) if self.state.player.active_weapon_id in ids else 0
        self.select_weapon(ids[(idx + direction) % len(ids)])

    def upgrade_weapon(self, wid):
        if not self.state:
            return
        defn = weapons.WEAPON_BY_ID.get(wid) or weapons.TACTICAL_BY_ID.get(wid)
        if not defn:
            return
        lv = self.state.player.weapon_levels.get(wid, 1)
        if lv >= weapons.MAX_LEVEL:
            return
        cost = 0 if self.mode == "sandbox" else weapons.get_upgrade_cost(defn, lv)
        if self.state.stats.cash < cost:
            return
        self.state.stats.cash -= cost
        self.state.player.weapon_levels[wid] = lv + 1
        self.sound.play_upgrade()

    def _mouse_world(self, pos=None):
        mx, my = pos if pos is not None else pygame.mouse.get_pos()
        return self.camera[0] - self.view_w / 2.0 + mx, self.camera[1] - self.view_h / 2.0 + my

    def _move_axes(self):
        keys = pygame.key.get_pressed()
        mx = (-1.0 if (keys[pygame.K_a] or keys[pygame.K_LEFT]) else 0.0) + (
            1.0 if (keys[pygame.K_d] or keys[pygame.K_RIGHT]) else 0.0
        )
        my = (-1.0 if (keys[pygame.K_w] or keys[pygame.K_UP]) else 0.0) + (
            1.0 if (keys[pygame.K_s] or keys[pygame.K_DOWN]) else 0.0
        )
        return mx, my

    def handle_event(self, event):
        if event.type == pygame.QUIT:
            self.running = False
            return

        if event.type == pygame.VIDEORESIZE:
            self.view_w, self.view_h = max(800, event.w), max(560, event.h)
            self.screen = pygame.display.set_mode((self.view_w, self.view_h), pygame.RESIZABLE)
            return

        if event.type == pygame.MOUSEWHEEL:
            if self.phase == "playing":
                self.cycle_weapon(1 if event.y < 0 else -1)
            elif self.phase == "armory":
                max_s = self.ui_rects.get("max_scroll", 0)
                self.armory_scroll = max(0, min(max_s, self.armory_scroll - event.y * 36))
            elif self.phase == "controls":
                max_s = self.ui_rects.get("max_scroll", 0)
                self.controls_scroll = max(0, min(max_s, self.controls_scroll - event.y * 36))
            return

        if event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            self.firing = False
            return

        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            self._handle_click(event.pos)
            return

        if event.type == pygame.KEYDOWN:
            self._handle_keydown(event.key)

    def _handle_click(self, pos):
        r = self.ui_rects
        if self.phase == "menu":
            if r.get("survival") and r["survival"].collidepoint(pos):
                self.start_run("survival")
            elif r.get("sandbox") and r["sandbox"].collidepoint(pos):
                self.start_run("sandbox")
            elif r.get("controls") and r["controls"].collidepoint(pos):
                self.controls_return_phase = "menu"
                self.controls_scroll = 0
                self.phase = "controls"
            return

        if self.phase == "controls":
            if (r.get("back") and r["back"].collidepoint(pos)) or (r.get("back_bottom") and r["back_bottom"].collidepoint(pos)):
                self.phase = self.controls_return_phase
            return

        if self.phase == "playing":
            if r.get("armory") and r["armory"].collidepoint(pos):
                self.firing = False
                self.armory_scroll = 0
                self.phase = "armory"
                return
            if r.get("mute") and r["mute"].collidepoint(pos):
                self.sound.toggle_mute()
                return
            if r.get("pause") and r["pause"].collidepoint(pos):
                self.firing = False
                self.phase = "paused"
                return
            if r.get("sandbox_horde") and r["sandbox_horde"].collidepoint(pos):
                self.spawn_sandbox_mega_horde()
                return
            for sid, is_tac, srect in r.get("dock_slots", []):
                if srect.collidepoint(pos):
                    if is_tac:
                        mwx, mwy = self._mouse_world(pos)
                        entities.trigger_tactical(self.state, sid, mwx, mwy, self.sound)
                    else:
                        self.select_weapon(sid)
                    return
            self.firing = True
            return

        if self.phase == "armory":
            if r.get("close") and r["close"].collidepoint(pos):
                self.phase = "playing"
                return
            for cat, tr in r.get("tabs", []):
                if tr.collidepoint(pos):
                    self.armory_filter = cat
                    self.armory_scroll = 0
                    return
            if r.get("medkit") and r["medkit"].collidepoint(pos):
                cost = 0 if self.mode == "sandbox" else 120
                if self.state.stats.cash >= cost and self.state.player.hp < self.state.player.max_hp:
                    self.state.stats.cash -= cost
                    self.state.player.hp = min(float(self.state.player.max_hp), self.state.player.hp + 50.0)
                    self.sound.play_pickup()
                return
            if r.get("armor") and r["armor"].collidepoint(pos):
                cost = 0 if self.mode == "sandbox" else 180
                if self.state.stats.cash >= cost and self.state.player.armor < self.state.player.max_armor:
                    self.state.stats.cash -= cost
                    self.state.player.armor = float(self.state.player.max_armor)
                    self.sound.play_pickup()
                return
            for wid, er in r.get("equips", []):
                if er.collidepoint(pos):
                    self.select_weapon(wid)
                    return
            for wid, ur in r.get("upgrades", []):
                if ur.collidepoint(pos):
                    self.upgrade_weapon(wid)
                    return
            for tid, dr in r.get("deploys", []):
                if dr.collidepoint(pos):
                    self.phase = "playing"
                    mwx, mwy = self._mouse_world(pos)
                    entities.trigger_tactical(self.state, tid, mwx, mwy, self.sound)
                    return
            return

        if self.phase == "paused":
            if r.get("resume") and r["resume"].collidepoint(pos):
                self.phase = "playing"
            elif r.get("armory") and r["armory"].collidepoint(pos):
                self.armory_scroll = 0
                self.phase = "armory"
            elif r.get("restart") and r["restart"].collidepoint(pos):
                self.start_run(self.mode)
            elif r.get("menu") and r["menu"].collidepoint(pos):
                self.phase = "menu"
            elif r.get("controls") and r["controls"].collidepoint(pos):
                self.controls_return_phase = "paused"
                self.controls_scroll = 0
                self.phase = "controls"
            return

        if self.phase == "gameover":
            if r.get("again") and r["again"].collidepoint(pos):
                self.start_run(self.mode)
            elif r.get("switch") and r["switch"].collidepoint(pos):
                self.start_run("sandbox" if self.mode == "survival" else "survival")
            elif r.get("menu") and r["menu"].collidepoint(pos):
                self.phase = "menu"

    def _handle_keydown(self, key):
        if key == pygame.K_m:
            self.sound.toggle_mute()
            return

        if key in (pygame.K_p, pygame.K_ESCAPE):
            if self.phase == "playing":
                self.firing = False
                self.phase = "paused"
            elif self.phase == "paused":
                self.phase = "playing"
            elif self.phase == "armory":
                self.phase = "playing"
            elif self.phase == "controls":
                self.phase = self.controls_return_phase
            return

        if key in (pygame.K_b, pygame.K_TAB):
            if self.phase in ("playing", "paused"):
                self.firing = False
                self.armory_scroll = 0
                self.phase = "armory"
            elif self.phase == "armory":
                self.phase = "playing"
            return

        if self.phase != "playing" or not self.state:
            return

        key_map = {
            pygame.K_1: "rifle",
            pygame.K_2: "shotgun",
            pygame.K_3: "minigun",
            pygame.K_4: "railgun",
            pygame.K_5: "flamethrower",
            pygame.K_6: "rpg",
            pygame.K_7: "tesla",
            pygame.K_8: "a10",
            pygame.K_9: "bomber",
            pygame.K_0: "chopper",
        }
        if key in key_map:
            self.select_weapon(key_map[key])
            return

        mwx, mwy = self._mouse_world()
        if key == pygame.K_q:
            entities.trigger_tactical(self.state, "turret", mwx, mwy, self.sound)
        elif key == pygame.K_e:
            entities.trigger_tactical(self.state, "orbital", mwx, mwy, self.sound)
        elif key in (pygame.K_SPACE, pygame.K_LSHIFT, pygame.K_RSHIFT):
            mx, my = self._move_axes()
            entities.trigger_dash(self.state, mx, my, self.sound)
        elif key == pygame.K_h and self.mode == "sandbox":
            self.spawn_sandbox_mega_horde()

    def step(self, dt):
        if self.phase != "playing" or not self.state:
            return
        mx, my = self._move_axes()
        mwx, mwy = self._mouse_world()
        inp = {"move_x": mx, "move_y": my, "mouse_world_x": mwx, "mouse_world_y": mwy, "firing": self.firing}
        entities.update_world(self.state, dt, inp, self.sound)
        self._update_wave_director(dt)

        p = self.state.player
        msx, msy = pygame.mouse.get_pos()
        look_x = max(-90.0, min(90.0, (msx - self.view_w / 2.0) * 0.14))
        look_y = max(-70.0, min(70.0, (msy - self.view_h / 2.0) * 0.14))
        t_cam_x = max(self.view_w * 0.25, min(self.map.width - self.view_w * 0.25, p.x + look_x))
        t_cam_y = max(self.view_h * 0.25, min(self.map.height - self.view_h * 0.25, p.y + look_y))
        lerp = min(1.0, dt * 8.0)
        self.camera[0] += (t_cam_x - self.camera[0]) * lerp
        self.camera[1] += (t_cam_y - self.camera[1]) * lerp

        if p.hp <= 0:
            self.firing = False
            if self.mode == "survival":
                if self.state.stats.score > self.records["best_score"]:
                    self.records["best_score"] = self.state.stats.score
                if self.wave["number"] > self.records["best_wave"]:
                    self.records["best_wave"] = self.wave["number"]
                self._save_records()
            self.phase = "gameover"

    def _update_wave_director(self, dt):
        if self.wave["banner_timer"] > 0:
            self.wave["banner_timer"] = max(0.0, self.wave["banner_timer"] - dt)

        if self.wave["queue"]:
            self.wave["spawn_timer"] -= dt
            if self.wave["spawn_timer"] <= 0:
                batch = min(len(self.wave["queue"]), 1 + self.wave["number"] // 4)
                bounds = self._view_bounds()
                scale = 1.0 + (self.wave["number"] - 1) * 0.14
                for _ in range(batch):
                    entities.spawn_zombie_at_edge(self.state, self.wave["queue"].pop(0), scale, bounds)
                self.wave["spawn_timer"] = max(0.16, 0.62 - self.wave["number"] * 0.03)
        elif not self.state.zombies:
            if self.wave["intermission"] <= 0:
                self.wave["intermission"] = 2.6
                self.show_banner(f"WAVE {self.wave['number']} CLEARED!", "PREPARING NEXT WAVE...", 2.4)
            else:
                self.wave["intermission"] -= dt
                if self.wave["intermission"] <= 0:
                    self.begin_next_wave()

    def render(self):
        mouse_pos = pygame.mouse.get_pos()
        if self.phase == "menu":
            self.ui_rects = self.gfx.render_menu(self.screen, self.view_w, self.view_h, mouse_pos)
            return
        if self.phase == "controls":
            self.ui_rects = self.gfx.render_controls(self.screen, self.view_w, self.view_h, self.controls_scroll, mouse_pos)
            return

        if self.state:
            mwx, mwy = self._mouse_world()
            inp = {"mouse_world_x": mwx, "mouse_world_y": mwy} if self.phase == "playing" else None
            self.gfx.render_world(self.screen, self.state, self.camera, inp, self.sprite_store, self.view_w, self.view_h)
            hud_rects = self.gfx.render_hud(
                self.screen, self.state, self.wave, self.sprite_store, self.view_w, self.view_h, mouse_pos, self.sound.is_muted()
            )
            if self.phase == "playing":
                self.ui_rects = hud_rects
            elif self.phase == "armory":
                self.ui_rects = self.gfx.render_armory(
                    self.screen, self.state, self.armory_filter, self.armory_scroll, self.sprite_store, self.view_w, self.view_h, mouse_pos
                )
            elif self.phase == "paused":
                self.ui_rects = self.gfx.render_pause(self.screen, self.view_w, self.view_h, mouse_pos)
            elif self.phase == "gameover":
                self.ui_rects = self.gfx.render_gameover(
                    self.screen, self.state, self.wave["number"], self.records, self.view_w, self.view_h, mouse_pos
                )

    def run(self):
        while self.running:
            dt = min(0.05, max(0.001, self.clock.tick(60) / 1000.0))
            for event in pygame.event.get():
                self.handle_event(event)
            self.step(dt)
            self.render()
            pygame.display.flip()


def main():
    pygame.init()
    app = GameApp()
    app.run()
    pygame.quit()


if __name__ == "__main__":
    main()
