"""Pure Python world simulation: spatial hash, zombie AI, weapons, and air support."""

import math
import random
from types import SimpleNamespace

import weapons

ZOMBIE_TYPES = {
    "shambler": {
        "name": "Shambler",
        "radius": 15,
        "hp": 72,
        "speed": 95,
        "damage": 18,
        "attack_rate": 0.85,
        "cash": 14,
        "score": 25,
        "color": (77, 124, 79),
        "head_color": (108, 161, 111),
        "eye_color": (253, 224, 71),
        "blood_color": (118, 22, 26, 120),
        "knock_resist": 0.95,
    },
    "runner": {
        "name": "Crimson Runner",
        "radius": 13,
        "hp": 52,
        "speed": 210,
        "damage": 16,
        "attack_rate": 0.60,
        "cash": 18,
        "score": 35,
        "color": (153, 27, 27),
        "head_color": (220, 38, 38),
        "eye_color": (254, 240, 138),
        "blood_color": (145, 20, 28, 130),
        "knock_resist": 1.15,
    },
    "brute": {
        "name": "Armored Brute",
        "radius": 24,
        "hp": 360,
        "speed": 72,
        "damage": 36,
        "attack_rate": 1.15,
        "cash": 45,
        "score": 90,
        "color": (71, 85, 105),
        "head_color": (100, 116, 139),
        "eye_color": (249, 115, 22),
        "blood_color": (95, 20, 24, 140),
        "knock_resist": 0.18,
    },
    "spitter": {
        "name": "Bile Vomiter",
        "radius": 14,
        "hp": 70,
        "speed": 104,
        "damage": 18,
        "attack_rate": 1.6,
        "spit_range": 420,
        "cash": 26,
        "score": 50,
        "color": (77, 124, 15),
        "head_color": (132, 204, 22),
        "eye_color": (236, 252, 203),
        "blood_color": (101, 163, 13, 125),
        "knock_resist": 0.95,
    },
    "screamer": {
        "name": "Sonic Screamer",
        "radius": 14,
        "hp": 80,
        "speed": 122,
        "damage": 24,
        "attack_rate": 1.7,
        "scream_range": 460,
        "cash": 28,
        "score": 55,
        "color": (91, 33, 182),
        "head_color": (167, 139, 250),
        "eye_color": (6, 182, 212),
        "blood_color": (91, 33, 182, 120),
        "knock_resist": 0.95,
    },
    "exploder": {
        "name": "Volatile Boomer",
        "radius": 18,
        "hp": 85,
        "speed": 122,
        "damage": 22,
        "attack_rate": 0.9,
        "explode_radius": 92,
        "explode_damage": 55,
        "friendly_explode_damage": 50,
        "cash": 32,
        "score": 65,
        "color": (154, 52, 18),
        "head_color": (251, 146, 60),
        "eye_color": (254, 249, 195),
        "blood_color": (180, 65, 16, 130),
        "knock_resist": 0.8,
    },
    "boss": {
        "name": "NECRO TITAN",
        "radius": 38,
        "hp": 3800,
        "speed": 82,
        "damage": 48,
        "attack_rate": 1.0,
        "cash": 500,
        "score": 1500,
        "color": (88, 28, 135),
        "head_color": (147, 51, 234),
        "eye_color": (239, 68, 68),
        "blood_color": (126, 34, 206, 140),
        "knock_resist": 0.05,
    },
}


class SpatialHash:
    def __init__(self, cell_size=72):
        self.cell_size = cell_size
        self.cells = {}
        self._stamp = 1

    def clear(self):
        self.cells.clear()

    def insert(self, entity):
        cs = self.cell_size
        key = (int(entity.x // cs), int(entity.y // cs))
        bucket = self.cells.get(key)
        if bucket is None:
            bucket = []
            self.cells[key] = bucket
        bucket.append(entity)

    def query(self, x, y, radius):
        cs = self.cell_size
        min_x = int((x - radius) // cs)
        max_x = int((x + radius) // cs)
        min_y = int((y - radius) // cs)
        max_y = int((y + radius) // cs)
        results = []
        self._stamp += 1
        stamp = self._stamp
        r_sq = radius * radius

        for cx in range(min_x, max_x + 1):
            for cy in range(min_y, max_y + 1):
                bucket = self.cells.get((cx, cy))
                if not bucket:
                    continue
                for item in bucket:
                    if item._q_stamp == stamp:
                        continue
                    item._q_stamp = stamp
                    dx = item.x - x
                    dy = item.y - y
                    rad_sum = radius + getattr(item, "radius", 0)
                    d_sq = dx * dx + dy * dy
                    if d_sq <= rad_sum * rad_sum or d_sq <= r_sq:
                        results.append(item)
        return results


def create_world_state(mode, game_map):
    levels = {}
    cooldowns = {}
    max_cooldowns = {}
    weapon_kills = {}

    for w in weapons.WEAPONS:
        levels[w["id"]] = 3 if mode == "sandbox" else 1
        cooldowns[w["id"]] = 0.0
        max_cooldowns[w["id"]] = 1.0
        weapon_kills[w["id"]] = 0
    for t in weapons.TACTICALS:
        levels[t["id"]] = 3 if mode == "sandbox" else 1
        cooldowns[t["id"]] = 0.0
        max_cooldowns[t["id"]] = 1.0
        weapon_kills[t["id"]] = 0

    player = SimpleNamespace(
        x=game_map.width / 2.0,
        y=game_map.height / 2.0,
        vx=0.0,
        vy=0.0,
        radius=16,
        angle=0.0,
        hp=100.0,
        max_hp=100,
        armor=100.0 if mode == "sandbox" else 50.0,
        max_armor=100,
        speed=260.0,
        dash_cooldown=0.0,
        dash_max_cooldown=1.5,
        dash_timer=0.0,
        dash_dir_x=0.0,
        dash_dir_y=0.0,
        invuln_timer=0.0,
        overdrive_timer=0.0,
        muzzle_flash=0.0,
        active_weapon_id="rifle",
        weapon_levels=levels,
        weapon_cooldowns=cooldowns,
        weapon_max_cooldowns=max_cooldowns,
        afterimages=[],
    )

    return SimpleNamespace(
        mode=mode or "survival",
        map=game_map,
        time=0.0,
        next_id=1,
        player=player,
        zombies=[],
        projectiles=[],
        beams=[],
        aircraft=[],
        bombs=[],
        turrets=[],
        orbitals=[],
        acid_pools=[],
        pickups=[],
        particles=[],
        shockwaves=[],
        floating_texts=[],
        hash=SpatialHash(72),
        stats=SimpleNamespace(
            kills=0,
            score=0,
            cash=99999 if mode == "sandbox" else 150,
            combo=0,
            max_combo=0,
            combo_timer=0.0,
            weapon_kills=weapon_kills,
            shots_fired=0,
        ),
        events=SimpleNamespace(
            screen_shake=0.0,
            screen_flash=0.0,
            flash_color=(255, 255, 255),
            on_boss_kill=None,
        ),
    )


def _safe_dir(dx, dy, fallback_angle=0.0):
    length = math.hypot(dx, dy)
    if length < 6.0:
        return math.cos(fallback_angle), math.sin(fallback_angle), 0.0
    return dx / length, dy / length, length


def _lerp_angle(a, b, t):
    diff = math.atan2(math.sin(b - a), math.cos(b - a))
    return a + diff * min(1.0, t)


def add_shake(state, amount):
    state.events.screen_shake = min(24.0, max(state.events.screen_shake, amount))


def spawn_particle(state, x, y, vx=0.0, vy=0.0, size=3.0, end_size=None, color=(217, 119, 6), alpha=1.0, life=0.35, drag=0.92):
    if len(state.particles) > 750:
        return
    state.particles.append(
        SimpleNamespace(
            x=x,
            y=y,
            vx=vx,
            vy=vy,
            size=size,
            end_size=size if end_size is None else end_size,
            color=color,
            alpha=alpha,
            life=life,
            max_life=life,
            drag=drag,
        )
    )


def spawn_shockwave(state, x, y, max_radius=90, color=(217, 119, 6), life=0.28):
    state.shockwaves.append(
        SimpleNamespace(x=x, y=y, radius=8.0, max_radius=max_radius, color=color, life=life, max_life=life)
    )


def spawn_floating_text(state, x, y, text, color=(180, 83, 9), size=14):
    if len(state.floating_texts) > 90:
        return
    state.floating_texts.append(
        SimpleNamespace(x=x, y=y, vy=-42.0, text=text, color=color, size=size, life=0.75, max_life=0.75)
    )


def spawn_zombie(state, z_type, x, y, wave_scale=1.0):
    proto = ZOMBIE_TYPES.get(z_type, ZOMBIE_TYPES["shambler"])
    hp_mult = 1.0 + (wave_scale - 1.0) * (0.65 if z_type == "boss" else 0.22)
    spd_mult = min(1.45, 1.0 + (wave_scale - 1.0) * 0.04)
    hp_val = round(proto["hp"] * hp_mult)

    z = SimpleNamespace(
        id=state.next_id,
        _q_stamp=0,
        type=z_type,
        name=proto["name"],
        x=float(x),
        y=float(y),
        radius=proto["radius"],
        hp=float(hp_val),
        max_hp=float(hp_val),
        speed=proto["speed"] * spd_mult * (0.94 + random.random() * 0.12),
        damage=round(proto["damage"] * (1.0 + (wave_scale - 1.0) * 0.12)),
        attack_rate=proto["attack_rate"],
        attack_cooldown=0.3,
        spit_range=proto.get("spit_range", 0),
        spit_cooldown=1.0 + random.random(),
        scream_range=proto.get("scream_range", 0),
        scream_cooldown=1.1 + random.random() * 1.1,
        scream_charge=0.0,
        last_check_x=float(x),
        last_check_y=float(y),
        stuck_check_timer=0.25,
        stuck_escape_timer=0.0,
        stuck_bias=-1 if random.random() < 0.5 else 1,
        slam_cooldown=4.5,
        summon_cooldown=7.0,
        cash=proto["cash"],
        score=proto["score"],
        color=proto["color"],
        head_color=proto["head_color"],
        eye_color=proto["eye_color"],
        blood_color=proto["blood_color"],
        knock_resist=proto["knock_resist"],
        angle=0.0,
        anim_phase=random.random() * math.tau,
        hit_flash=0.0,
        burn_timer=0.0,
        burn_dps=0.0,
        burn_weapon="flamethrower",
        slow_timer=0.0,
        slow_factor=1.0,
        dead=False,
    )
    state.next_id += 1
    state.map.resolve_circle_obstacles(z)
    state.zombies.append(z)
    return z


def spawn_zombie_at_edge(state, z_type, wave_scale=1.0, view_bounds=None):
    m = state.map
    margin = 45
    x, y = m.width / 2.0, m.height / 2.0
    for _ in range(12):
        side = random.randint(0, 3)
        if side == 0:
            x = margin + random.random() * (m.width - margin * 2)
            y = margin
        elif side == 1:
            x = m.width - margin
            y = margin + random.random() * (m.height - margin * 2)
        elif side == 2:
            x = margin + random.random() * (m.width - margin * 2)
            y = m.height - margin
        else:
            x = margin
            y = margin + random.random() * (m.height - margin * 2)

        dist_p = math.hypot(x - state.player.x, y - state.player.y)
        outside = (
            view_bounds is None
            or x < view_bounds[0] - 30
            or x > view_bounds[1] + 30
            or y < view_bounds[2] - 30
            or y > view_bounds[3] + 30
        )
        if dist_p > 420 and outside and not m.point_in_obstacle(x, y, 24):
            break
    return spawn_zombie(state, z_type, x, y, wave_scale)


def damage_player(state, amount, audio=None):
    p = state.player
    if p.invuln_timer > 0 or p.hp <= 0:
        return
    remaining = float(amount)
    if p.armor > 0:
        absorbed = min(p.armor, remaining * 0.72)
        p.armor -= absorbed
        remaining -= absorbed
    p.hp = max(0.0, p.hp - remaining)
    p.invuln_timer = 0.22
    add_shake(state, 9.0)
    if audio:
        audio.play_player_hurt()
    for _ in range(6):
        ang = random.random() * math.tau
        spd = 70 + random.random() * 90
        spawn_particle(
            state, p.x, p.y, math.cos(ang) * spd, math.sin(ang) * spd, size=3.5, end_size=0.5, color=(220, 38, 38), life=0.25
        )


def drop_pickup(state, p_type, x, y):
    if len(state.pickups) > 45:
        return
    state.pickups.append(
        SimpleNamespace(type=p_type, x=float(x), y=float(y), radius=14, life=24.0, bob_phase=random.random() * math.tau)
    )


def kill_zombie(state, z, weapon_id, audio=None):
    if z.dead:
        return
    z.dead = True

    state.stats.kills += 1
    state.stats.combo += 1
    state.stats.combo_timer = 2.8
    if state.stats.combo > state.stats.max_combo:
        state.stats.max_combo = state.stats.combo

    combo_mult = 1.0 + min(2.5, (state.stats.combo // 6) * 0.15)
    state.stats.score += round(z.score * combo_mult)
    if state.mode == "survival":
        state.stats.cash += z.cash
    if weapon_id:
        state.stats.weapon_kills[weapon_id] = state.stats.weapon_kills.get(weapon_id, 0) + 1

    state.map.add_blood_decal(z.x, z.y, z.blood_color, z.radius * 1.15)
    p_count = 28 if z.type == "boss" else 8
    max_spd = 260 if z.type == "boss" else 150
    p_col = (132, 204, 22) if z.type == "spitter" else (185, 28, 28)
    for _ in range(p_count):
        ang = random.random() * math.tau
        spd = 55 + random.random() * max_spd
        spawn_particle(
            state,
            z.x,
            z.y,
            math.cos(ang) * spd,
            math.sin(ang) * spd,
            size=6.0 if z.type == "boss" else 3.5,
            end_size=0.5,
            color=p_col,
            life=0.35 + random.random() * 0.2,
        )

    if z.type == "exploder":
        proto = ZOMBIE_TYPES["exploder"]
        detonate_explosion(
            state, z.x, z.y, proto["explode_radius"], proto["friendly_explode_damage"], weapon_id or "exploder", audio, False
        )
        dp = math.hypot(state.player.x - z.x, state.player.y - z.y)
        if dp < proto["explode_radius"]:
            falloff = 1.0 - dp / proto["explode_radius"]
            damage_player(state, round(proto["explode_damage"] * max(0.35, falloff)), audio)

    if z.type == "boss":
        spawn_shockwave(state, z.x, z.y, 220, (147, 51, 234), 0.5)
        spawn_floating_text(state, z.x, z.y - 24, f"BOSS DEFEATED +${z.cash}", (180, 83, 9), 17)
        drop_pickup(state, "medkit", z.x - 18, z.y)
        drop_pickup(state, "overdrive", z.x + 18, z.y)
        if callable(state.events.on_boss_kill):
            state.events.on_boss_kill(z)
    else:
        roll = random.random()
        if z.type == "brute":
            if roll < 0.34:
                drop_pickup(state, "medkit", z.x, z.y)
            elif roll < 0.65:
                drop_pickup(state, "cash", z.x, z.y)
        else:
            if roll < 0.045:
                drop_pickup(state, "medkit", z.x, z.y)
            elif roll < 0.095:
                drop_pickup(state, "cash", z.x, z.y)
            elif roll < 0.112:
                drop_pickup(state, "overdrive", z.x, z.y)
            elif roll < 0.117:
                drop_pickup(state, "nuke", z.x, z.y)

    if audio:
        audio.play_zombie_death()


def damage_zombie(state, z, dmg, knock_x=0.0, knock_y=0.0, weapon_id=None, audio=None):
    if z.dead:
        return False
    z.hp -= dmg
    z.hit_flash = 0.09
    if knock_x or knock_y:
        res = z.knock_resist
        z.x += knock_x * res
        z.y += knock_y * res
        state.map.resolve_circle_obstacles(z)
    if z.hp <= 0:
        kill_zombie(state, z, weapon_id, audio)
        return True
    if audio:
        audio.play_hit()
    return False


def detonate_explosion(state, x, y, radius, damage, weapon_id, audio=None, hit_flash=False):
    state.map.add_scorch_decal(x, y, radius * 0.72)
    spawn_shockwave(state, x, y, radius, (234, 88, 12), 0.3)
    add_shake(state, min(18.0, radius * 0.1))
    if hit_flash:
        state.events.screen_flash = 0.1
        state.events.flash_color = (255, 190, 90)

    p_count = min(34, max(14, int(radius * 0.22)))
    for i in range(p_count):
        ang = random.random() * math.tau
        spd = 70 + random.random() * (radius * 2.3)
        is_smoke = i % 3 == 0
        spawn_particle(
            state,
            x + math.cos(ang) * 6,
            y + math.sin(ang) * 6,
            math.cos(ang) * spd,
            math.sin(ang) * spd,
            size=12.0 if is_smoke else 6.0,
            end_size=24.0 if is_smoke else 1.0,
            color=(71, 85, 105) if is_smoke else ((245, 158, 11) if i % 2 == 0 else (234, 88, 12)),
            alpha=0.55 if is_smoke else 1.0,
            life=0.55 if is_smoke else 0.32,
            drag=0.88,
        )

    nearby = state.hash.query(x, y, radius + 38)
    for z in nearby:
        if z.dead:
            continue
        dx = z.x - x
        dy = z.y - y
        d = math.hypot(dx, dy)
        if d <= radius + z.radius:
            falloff = max(0.35, 1.0 - (d / (radius + z.radius)) * 0.65)
            nx = dx / d if d > 0.01 else 0.0
            ny = dy / d if d > 0.01 else 0.0
            damage_zombie(state, z, round(damage * falloff), nx * 24 * falloff, ny * 24 * falloff, weapon_id, None)

    if audio:
        audio.play_explosion(min(1.6, radius / 95.0))


def trigger_dash(state, move_x, move_y, audio=None):
    p = state.player
    if p.dash_cooldown > 0 or p.dash_timer > 0:
        return False
    dx, dy, _ = _safe_dir(move_x, move_y, p.angle)
    p.dash_dir_x = dx
    p.dash_dir_y = dy
    p.dash_timer = 0.17
    p.dash_cooldown = p.dash_max_cooldown
    p.invuln_timer = max(p.invuln_timer, 0.24)
    if audio:
        audio.play_dash()
    return True


def spawn_a10(state, target_x, target_y, level, audio=None):
    defn = weapons.WEAPON_BY_ID["a10"]
    stats = weapons.get_scaled_stats(defn, level)
    p = state.player
    dx, dy, _ = _safe_dir(target_x - p.x, target_y - p.y, p.angle)
    perp_x, perp_y = -dy, dx
    planes = stats["planes"]
    speed = 1180.0
    travel_half = 1050.0

    for i in range(planes):
        lane_idx = i - (planes - 1) / 2.0
        lateral = lane_idx * 62.0
        cx = target_x + perp_x * lateral
        cy = target_y + perp_y * lateral
        state.aircraft.append(
            SimpleNamespace(
                kind="a10",
                x=cx - dx * travel_half,
                y=cy - dy * travel_half,
                vx=dx * speed,
                vy=dy * speed,
                dir_x=dx,
                dir_y=dy,
                angle=math.atan2(dy, dx),
                delay=abs(lane_idx) * 0.14,
                elapsed=0.0,
                total_time=(travel_half * 2.0) / speed,
                strafe_start=0.25,
                strafe_end=0.72,
                rounds_left=stats["rounds_per_plane"],
                fire_accum=0.0,
                damage=stats["damage"],
                blast_radius=stats["blast_radius"],
                weapon_id="a10",
            )
        )
    if audio:
        audio.play_jet_strafe()


def spawn_bomber(state, target_x, target_y, level, audio=None):
    defn = weapons.WEAPON_BY_ID["bomber"]
    stats = weapons.get_scaled_stats(defn, level)
    p = state.player
    dx, dy, _ = _safe_dir(target_x - p.x, target_y - p.y, p.angle)
    perp_x, perp_y = -dy, dx
    planes = stats["planes"]
    speed = 470.0
    travel_half = 920.0

    for i in range(planes):
        lane_idx = i - (planes - 1) / 2.0
        lateral = lane_idx * 95.0
        cx = target_x + perp_x * lateral
        cy = target_y + perp_y * lateral
        state.aircraft.append(
            SimpleNamespace(
                kind="bomber",
                x=cx - dx * travel_half,
                y=cy - dy * travel_half,
                vx=dx * speed,
                vy=dy * speed,
                dir_x=dx,
                dir_y=dy,
                angle=math.atan2(dy, dx),
                delay=abs(lane_idx) * 0.22,
                elapsed=0.0,
                total_time=(travel_half * 2.0) / speed,
                drop_start=0.24,
                drop_end=0.76,
                bombs_left=stats["bombs_per_plane"],
                total_bombs=stats["bombs_per_plane"],
                drop_accum=0.0,
                damage=stats["damage"],
                blast_radius=stats["blast_radius"],
                weapon_id="bomber",
            )
        )
    if audio:
        audio.play_bomber_pass()


def spawn_chopper(state, target_x, target_y, level, audio=None):
    defn = weapons.WEAPON_BY_ID["chopper"]
    stats = weapons.get_scaled_stats(defn, level)
    max_allowed = stats["max_active"] + 3 if state.mode == "sandbox" else stats["max_active"]
    active = [ac for ac in state.aircraft if ac.kind == "chopper"]
    if len(active) >= max_allowed:
        state.aircraft.remove(active[0])

    p = state.player
    dx, dy, _ = _safe_dir(target_x - p.x, target_y - p.y, p.angle)
    spawn_x = max(40.0, min(state.map.width - 40.0, p.x - dx * 520.0))
    spawn_y = max(40.0, min(state.map.height - 40.0, p.y - dy * 520.0))

    state.aircraft.append(
        SimpleNamespace(
            kind="chopper",
            x=spawn_x,
            y=spawn_y,
            anchor_x=target_x,
            anchor_y=target_y,
            orbit_angle=random.random() * math.tau,
            orbit_radius=155.0,
            angle=math.atan2(target_y - spawn_y, target_x - spawn_x),
            rotor_angle=0.0,
            life=stats["duration"],
            max_life=stats["duration"],
            gun_cooldown=0.25,
            rocket_cooldown=1.1,
            damage=stats["damage"],
            rocket_damage=stats["rocket_damage"],
            blast_radius=stats["blast_radius"],
            range=stats["range"],
            weapon_id="chopper",
        )
    )
    if audio:
        audio.play_chopper_shot()


def _build_lightning_points(x1, y1, x2, y2):
    pts = [(x1, y1)]
    segs = 6
    dx, dy = x2 - x1, y2 - y1
    length = math.hypot(dx, dy)
    nx = -dy / length if length > 1 else 0.0
    ny = dx / length if length > 1 else 1.0
    for i in range(1, segs):
        t = i / segs
        jitter = (random.random() - 0.5) * min(28.0, length * 0.14)
        pts.append((x1 + dx * t + nx * jitter, y1 + dy * t + ny * jitter))
    pts.append((x2, y2))
    return pts


def fire_primary_weapon(state, target_x, target_y, audio=None):
    p = state.player
    wid = p.active_weapon_id
    defn = weapons.WEAPON_BY_ID.get(wid)
    if not defn:
        return False
    if p.weapon_cooldowns.get(wid, 0.0) > 0:
        return False

    lv = p.weapon_levels.get(wid, 1)
    stats = weapons.get_scaled_stats(defn, lv)
    overdrive_mult = 1.45 if p.overdrive_timer > 0 else 1.0
    sandbox_air_mult = 0.35 if (state.mode == "sandbox" and defn["category"] == "air") else 1.0

    cooldown = stats["cooldown"] * sandbox_air_mult
    if defn["category"] != "air":
        cooldown /= overdrive_mult

    p.weapon_cooldowns[wid] = cooldown
    p.weapon_max_cooldowns[wid] = cooldown

    dx, dy, _ = _safe_dir(target_x - p.x, target_y - p.y, p.angle)
    base_angle = math.atan2(dy, dx)
    p.angle = base_angle
    state.stats.shots_fired += 1

    if wid == "a10":
        spawn_a10(state, target_x, target_y, lv, audio)
        return True
    if wid == "bomber":
        spawn_bomber(state, target_x, target_y, lv, audio)
        return True
    if wid == "chopper":
        spawn_chopper(state, target_x, target_y, lv, audio)
        return True

    muzzle_x = p.x + math.cos(base_angle) * 22
    muzzle_y = p.y + math.sin(base_angle) * 22
    p.muzzle_flash = 0.075

    if wid == "railgun":
        rx, ry = math.cos(base_angle), math.sin(base_angle)
        end_x = muzzle_x + rx * stats["range"]
        end_y = muzzle_y + ry * stats["range"]
        wall_hit = state.map.segment_hits_obstacle(muzzle_x, muzzle_y, end_x, end_y)
        if wall_hit:
            end_x, end_y = wall_hit["x"], wall_hit["y"]
        max_dist = math.hypot(end_x - muzzle_x, end_y - muzzle_y)

        hits = []
        for z in state.zombies:
            if z.dead:
                continue
            vx = z.x - muzzle_x
            vy = z.y - muzzle_y
            proj = vx * rx + vy * ry
            if proj < -z.radius or proj > max_dist + z.radius:
                continue
            perp_dist = abs(vx * (-ry) + vy * rx)
            if perp_dist <= z.radius + 7:
                hits.append((proj, z))
        hits.sort(key=lambda item: item[0])

        for _, hz in hits[: stats["pierce"]]:
            damage_zombie(state, hz, stats["damage"], rx * 14, ry * 14, "railgun", None)
            for _ in range(5):
                spawn_particle(
                    state,
                    hz.x,
                    hz.y,
                    (random.random() - 0.5) * 180 + rx * 90,
                    (random.random() - 0.5) * 180 + ry * 90,
                    size=3.0,
                    end_size=0.5,
                    color=(56, 189, 248),
                    life=0.25,
                )

        state.beams.append(
            SimpleNamespace(
                kind="rail",
                points=[(muzzle_x, muzzle_y), (end_x, end_y)],
                color=(2, 132, 199),
                width=7.0,
                life=0.22,
                max_life=0.22,
            )
        )
        add_shake(state, 5.0)
        if audio:
            audio.play_railgun()
        return True

    if wid == "tesla":
        candidates = state.hash.query(p.x, p.y, stats["range"])
        best_target = None
        best_score = float("inf")
        for cz in candidates:
            if cz.dead:
                continue
            cdx, cdy = cz.x - muzzle_x, cz.y - muzzle_y
            dist = math.hypot(cdx, cdy)
            if dist > stats["range"]:
                continue
            ang_diff = abs(math.atan2(math.sin(math.atan2(cdy, cdx) - base_angle), math.cos(math.atan2(cdy, cdx) - base_angle)))
            if ang_diff < 0.72:
                score = dist * (0.6 + ang_diff)
                if score < best_score:
                    best_score = score
                    best_target = cz

        if not best_target:
            tx = muzzle_x + math.cos(base_angle) * min(260, stats["range"])
            ty = muzzle_y + math.sin(base_angle) * min(260, stats["range"])
            state.beams.append(
                SimpleNamespace(
                    kind="lightning",
                    points=_build_lightning_points(muzzle_x, muzzle_y, tx, ty),
                    color=(2, 132, 199),
                    width=3.0,
                    life=0.16,
                    max_life=0.16,
                )
            )
            if audio:
                audio.play_tesla()
            return True

        used_ids = set()
        curr = best_target
        prev_x, prev_y = muzzle_x, muzzle_y
        for jump in range(stats["chain_count"]):
            if not curr:
                break
            used_ids.add(curr.id)
            state.beams.append(
                SimpleNamespace(
                    kind="lightning",
                    points=_build_lightning_points(prev_x, prev_y, curr.x, curr.y),
                    color=(2, 132, 199),
                    width=3.5,
                    life=0.18,
                    max_life=0.18,
                )
            )
            curr.slow_timer = 1.4
            curr.slow_factor = stats["slow_factor"]
            jump_dmg = round(stats["damage"] * (0.9 ** jump))
            damage_zombie(state, curr, jump_dmg, 0, 0, "tesla", None)
            spawn_particle(
                state,
                curr.x,
                curr.y,
                (random.random() - 0.5) * 90,
                (random.random() - 0.5) * 90,
                size=4.0,
                end_size=0.5,
                color=(56, 189, 248),
                life=0.2,
            )
            prev_x, prev_y = curr.x, curr.y

            near_jump = state.hash.query(prev_x, prev_y, 230)
            next_z = None
            next_dist = 230.0
            for nz in near_jump:
                if nz.dead or nz.id in used_ids:
                    continue
                jd = math.hypot(nz.x - prev_x, nz.y - prev_y)
                if jd < next_dist:
                    next_dist = jd
                    next_z = nz
            curr = next_z

        if audio:
            audio.play_tesla()
        return True

    pellets = stats["pellets"]
    for pi in range(pellets):
        if wid == "shotgun" and pellets > 1:
            frac = pi / (pellets - 1) - 0.5
            angle_offset = frac * stats["spread"] + (random.random() - 0.5) * 0.05
        else:
            angle_offset = (random.random() - 0.5) * stats["spread"]
        shot_ang = base_angle + angle_offset
        kind = "flame" if wid == "flamethrower" else ("rocket" if wid == "rpg" else "bullet")
        spd_jitter = 0.85 + random.random() * 0.3 if kind == "flame" else 1.0
        col = (194, 65, 12) if wid == "minigun" else ((217, 119, 6) if wid == "shotgun" else (180, 83, 9))
        kb = 13 if wid == "shotgun" else (5 if wid == "rifle" else (3.5 if wid == "minigun" else 1))

        state.projectiles.append(
            SimpleNamespace(
                id=state.next_id,
                kind=kind,
                weapon_id=wid,
                ignore_obstacles=False,
                x=muzzle_x,
                y=muzzle_y,
                prev_x=muzzle_x,
                prev_y=muzzle_y,
                vx=math.cos(shot_ang) * stats["speed"] * spd_jitter,
                vy=math.sin(shot_ang) * stats["speed"] * spd_jitter,
                radius=6.0 if kind == "rocket" else (9.0 if kind == "flame" else 3.5),
                damage=stats["damage"],
                pierce_left=stats["pierce"],
                blast_radius=stats["blast_radius"],
                burn_damage=stats["burn_damage"],
                burn_duration=stats["burn_duration"],
                range_left=float(stats["range"]),
                life=0.65 if kind == "flame" else 2.5,
                max_life=0.65 if kind == "flame" else 2.5,
                hit_ids=set(),
                knockback=kb,
                color=col,
                pooled=False,
            )
        )
        state.next_id += 1

    if wid in ("rifle", "minigun", "shotgun"):
        eject_ang = base_angle + math.pi * 0.55 + (random.random() - 0.5) * 0.4
        dist_ej = 10 + random.random() * 12
        state.map.add_casing_decal(
            p.x + math.cos(eject_ang) * dist_ej, p.y + math.sin(eject_ang) * dist_ej, random.random() * math.pi
        )

    if wid == "shotgun":
        add_shake(state, 3.5)
    elif wid == "rpg":
        add_shake(state, 4.5)

    if audio:
        if wid == "rifle":
            audio.play_rifle()
        elif wid == "shotgun":
            audio.play_shotgun()
        elif wid == "minigun":
            audio.play_minigun()
        elif wid == "flamethrower":
            audio.play_flame()
        elif wid == "rpg":
            audio.play_rocket_launch()
    return True


def trigger_tactical(state, tactical_id, target_x, target_y, audio=None):
    defn = weapons.TACTICAL_BY_ID.get(tactical_id)
    if not defn:
        return False, "Unknown tactical"
    p = state.player
    if p.weapon_cooldowns.get(tactical_id, 0.0) > 0:
        return False, "Cooling down"

    cost = 0 if state.mode == "sandbox" else defn.get("survival_cost", 0)
    if state.stats.cash < cost:
        spawn_floating_text(state, p.x, p.y - 28, f"NEED ${cost}", (185, 28, 28), 14)
        return False, "Not enough cash"

    lv = p.weapon_levels.get(tactical_id, 1)
    stats = weapons.get_scaled_stats(defn, lv)
    state.stats.cash -= cost
    cd = stats["cooldown"] * (0.45 if state.mode == "sandbox" else 1.0)
    p.weapon_cooldowns[tactical_id] = cd
    p.weapon_max_cooldowns[tactical_id] = cd

    if tactical_id == "turret":
        max_turrets = stats["max_active"] + 4 if state.mode == "sandbox" else stats["max_active"]
        if len(state.turrets) >= max_turrets:
            state.turrets.pop(0)
        dx, dy, _ = _safe_dir(target_x - p.x, target_y - p.y, p.angle)
        turret = SimpleNamespace(
            id=state.next_id,
            x=p.x + dx * 42,
            y=p.y + dy * 42,
            radius=17,
            angle=math.atan2(dy, dx),
            life=stats["duration"],
            max_life=stats["duration"],
            hp=float(stats["hp"]),
            max_hp=float(stats["hp"]),
            fire_cooldown=0.2,
            fire_rate=stats["fire_rate"],
            damage=stats["damage"],
            range=stats["range"],
            muzzle_flash=0.0,
        )
        state.next_id += 1
        state.map.resolve_circle_obstacles(turret)
        state.turrets.append(turret)
        spawn_shockwave(state, turret.x, turret.y, 44, (109, 40, 217), 0.24)
        if audio:
            audio.play_switch()
        return True, ""

    if tactical_id == "orbital":
        state.orbitals.append(
            SimpleNamespace(
                id=state.next_id,
                x=float(target_x),
                y=float(target_y),
                radius=stats["radius"],
                damage_per_sec=stats["damage_per_sec"],
                life=stats["duration"],
                max_life=stats["duration"],
                tick_accum=0.0,
            )
        )
        state.next_id += 1
        add_shake(state, 10.0)
        if audio:
            audio.play_orbital_laser()
        return True, ""

    return False, "Unsupported"


def _find_nearest_zombie(state, x, y, max_range):
    near = state.hash.query(x, y, max_range)
    best = None
    best_sq = max_range * max_range
    for z in near:
        if z.dead:
            continue
        d_sq = (z.x - x) ** 2 + (z.y - y) ** 2
        if d_sq < best_sq:
            best_sq = d_sq
            best = z
    return best


def update_world(state, dt, inp, audio=None):
    state.time += dt
    p = state.player
    m = state.map

    if state.events.screen_shake > 0:
        state.events.screen_shake = max(0.0, state.events.screen_shake - dt * 36.0)
    if state.events.screen_flash > 0:
        state.events.screen_flash = max(0.0, state.events.screen_flash - dt)
    if state.stats.combo_timer > 0:
        state.stats.combo_timer -= dt
        if state.stats.combo_timer <= 0:
            state.stats.combo = 0

    if p.invuln_timer > 0:
        p.invuln_timer = max(0.0, p.invuln_timer - dt)
    if p.overdrive_timer > 0:
        p.overdrive_timer = max(0.0, p.overdrive_timer - dt)
    if p.muzzle_flash > 0:
        p.muzzle_flash = max(0.0, p.muzzle_flash - dt)
    if p.dash_cooldown > 0:
        p.dash_cooldown = max(0.0, p.dash_cooldown - dt)

    for wk in p.weapon_cooldowns:
        if p.weapon_cooldowns[wk] > 0:
            p.weapon_cooldowns[wk] = max(0.0, p.weapon_cooldowns[wk] - dt)

    move_x = inp.get("move_x", 0.0) if inp else 0.0
    move_y = inp.get("move_y", 0.0) if inp else 0.0
    firing = bool(inp.get("firing")) if inp else False
    active_def = weapons.WEAPON_BY_ID.get(p.active_weapon_id)
    move_slow = active_def["base_stats"].get("move_slow", 1.0) if (firing and active_def) else 1.0
    speed_mult = (1.25 if p.overdrive_timer > 0 else 1.0) * move_slow

    if p.dash_timer > 0:
        p.dash_timer -= dt
        p.x += p.dash_dir_x * 760.0 * dt
        p.y += p.dash_dir_y * 760.0 * dt
        p.afterimages.append(SimpleNamespace(x=p.x, y=p.y, angle=p.angle, life=0.16, max_life=0.16))
    else:
        move_len = math.hypot(move_x, move_y)
        if move_len > 0.01:
            p.vx = (move_x / move_len) * p.speed * speed_mult
            p.vy = (move_y / move_len) * p.speed * speed_mult
        else:
            damp = 0.001 ** dt
            p.vx *= damp
            p.vy *= damp
        p.x += p.vx * dt
        p.y += p.vy * dt
    m.resolve_circle_obstacles(p)

    if inp and "mouse_world_x" in inp and "mouse_world_y" in inp:
        adx = inp["mouse_world_x"] - p.x
        ady = inp["mouse_world_y"] - p.y
        if adx * adx + ady * ady > 4.0:
            p.angle = math.atan2(ady, adx)

    for i in range(len(p.afterimages) - 1, -1, -1):
        p.afterimages[i].life -= dt
        if p.afterimages[i].life <= 0:
            p.afterimages.pop(i)

    state.hash.clear()
    for z in state.zombies:
        if not z.dead:
            state.hash.insert(z)
    m.update_flow_field(p.x, p.y)

    if firing and p.hp > 0:
        fire_primary_weapon(state, inp["mouse_world_x"], inp["mouse_world_y"], audio)

    _update_aircraft(state, dt, audio)
    _update_bombs(state, dt, audio)
    _update_turrets(state, dt, audio)
    _update_orbitals(state, dt, inp, audio)
    _update_projectiles(state, dt, audio)
    _update_acid_pools(state, dt, audio)
    _update_zombies(state, dt, audio)
    _update_pickups(state, dt, audio)
    _update_effects(state, dt)


def _update_aircraft(state, dt, audio):
    for i in range(len(state.aircraft) - 1, -1, -1):
        ac = state.aircraft[i]
        if ac.kind == "a10":
            if ac.delay > 0:
                ac.delay -= dt
                continue
            ac.elapsed += dt
            ac.x += ac.vx * dt
            ac.y += ac.vy * dt
            prog = ac.elapsed / ac.total_time

            if random.random() < 0.75:
                perp_x, perp_y = -ac.dir_y * 32, ac.dir_x * 32
                spawn_particle(state, ac.x + perp_x, ac.y + perp_y, size=3, end_size=7, color=(203, 213, 225), alpha=0.5, life=0.4)
                spawn_particle(state, ac.x - perp_x, ac.y - perp_y, size=3, end_size=7, color=(203, 213, 225), alpha=0.5, life=0.4)

            if ac.strafe_start <= prog <= ac.strafe_end and ac.rounds_left > 0:
                ac.fire_accum += dt
                interval = (ac.total_time * (ac.strafe_end - ac.strafe_start)) / max(1, ac.rounds_left + 2)
                if ac.fire_accum >= max(0.025, interval):
                    ac.fire_accum = 0.0
                    ac.rounds_left -= 1
                    ix = max(30.0, min(state.map.width - 30.0, ac.x + ac.dir_x * 260 + (random.random() - 0.5) * 76))
                    iy = max(30.0, min(state.map.height - 30.0, ac.y + ac.dir_y * 260 + (random.random() - 0.5) * 76))
                    state.beams.append(
                        SimpleNamespace(
                            kind="tracer",
                            points=[(ac.x + ac.dir_x * 28, ac.y + ac.dir_y * 28), (ix, iy)],
                            color=(180, 83, 9),
                            width=3.0,
                            life=0.08,
                            max_life=0.08,
                        )
                    )
                    detonate_explosion(state, ix, iy, ac.blast_radius, ac.damage, "a10", audio, False)

            if ac.elapsed >= ac.total_time:
                state.aircraft.pop(i)

        elif ac.kind == "bomber":
            if ac.delay > 0:
                ac.delay -= dt
                continue
            ac.elapsed += dt
            ac.x += ac.vx * dt
            ac.y += ac.vy * dt
            prog = ac.elapsed / ac.total_time

            if random.random() < 0.8:
                px, py = -ac.dir_y, ac.dir_x
                for off in (-46, -24, 24, 46):
                    spawn_particle(
                        state,
                        ac.x + px * off - ac.dir_x * 12,
                        ac.y + py * off - ac.dir_y * 12,
                        size=4,
                        end_size=9,
                        color=(180, 190, 205),
                        alpha=0.45,
                        life=0.55,
                    )

            if ac.drop_start <= prog <= ac.drop_end and ac.bombs_left > 0:
                ac.drop_accum += dt
                drop_interval = (ac.total_time * (ac.drop_end - ac.drop_start)) / max(1, ac.total_bombs)
                if ac.drop_accum >= drop_interval:
                    ac.drop_accum = 0.0
                    ac.bombs_left -= 1
                    bx = max(40.0, min(state.map.width - 40.0, ac.x + (random.random() - 0.5) * 65))
                    by = max(40.0, min(state.map.height - 40.0, ac.y + (random.random() - 0.5) * 65))
                    state.bombs.append(
                        SimpleNamespace(
                            x=bx,
                            y=by,
                            z=1.0,
                            fall_time=0.48,
                            damage=ac.damage,
                            blast_radius=ac.blast_radius,
                            weapon_id="bomber",
                        )
                    )

            if ac.elapsed >= ac.total_time:
                state.aircraft.pop(i)

        elif ac.kind == "chopper":
            ac.life -= dt
            ac.rotor_angle += dt * 26.0
            ac.orbit_angle += dt * 1.15
            anchor_x = state.player.x * 0.55 + ac.anchor_x * 0.45
            anchor_y = state.player.y * 0.55 + ac.anchor_y * 0.45
            goal_x = anchor_x + math.cos(ac.orbit_angle) * ac.orbit_radius
            goal_y = anchor_y + math.sin(ac.orbit_angle) * ac.orbit_radius
            ac.x += (goal_x - ac.x) * min(1.0, dt * 3.2)
            ac.y += (goal_y - ac.y) * min(1.0, dt * 3.2)

            nearest = _find_nearest_zombie(state, ac.x, ac.y, ac.range)
            if nearest:
                target_ang = math.atan2(nearest.y - ac.y, nearest.x - ac.x)
                ac.angle = _lerp_angle(ac.angle, target_ang, dt * 8.0)
                ac.gun_cooldown -= dt
                if ac.gun_cooldown <= 0:
                    ac.gun_cooldown = 0.14
                    sa = target_ang + (random.random() - 0.5) * 0.12
                    mx = ac.x + math.cos(ac.angle) * 24
                    my = ac.y + math.sin(ac.angle) * 24
                    state.projectiles.append(
                        SimpleNamespace(
                            id=state.next_id,
                            kind="bullet",
                            weapon_id="chopper",
                            ignore_obstacles=True,
                            x=mx,
                            y=my,
                            prev_x=ac.x,
                            prev_y=ac.y,
                            vx=math.cos(sa) * 1120.0,
                            vy=math.sin(sa) * 1120.0,
                            radius=4.0,
                            damage=ac.damage,
                            pierce_left=1,
                            blast_radius=0,
                            burn_damage=0,
                            burn_duration=0,
                            range_left=float(ac.range + 150),
                            life=1.5,
                            max_life=1.5,
                            hit_ids=set(),
                            knockback=4,
                            color=(4, 120, 87),
                            pooled=False,
                        )
                    )
                    state.next_id += 1
                    if audio:
                        audio.play_chopper_shot()

                ac.rocket_cooldown -= dt
                if ac.rocket_cooldown <= 0:
                    ac.rocket_cooldown = 1.45
                    for side in (-1, 1):
                        px = -math.sin(ac.angle) * 16 * side
                        py = math.cos(ac.angle) * 16 * side
                        ra = target_ang + side * 0.06
                        state.projectiles.append(
                            SimpleNamespace(
                                id=state.next_id,
                                kind="rocket",
                                weapon_id="chopper",
                                ignore_obstacles=True,
                                x=ac.x + px,
                                y=ac.y + py,
                                prev_x=ac.x + px,
                                prev_y=ac.y + py,
                                vx=math.cos(ra) * 760.0,
                                vy=math.sin(ra) * 760.0,
                                radius=5.0,
                                damage=ac.rocket_damage,
                                pierce_left=1,
                                blast_radius=ac.blast_radius,
                                burn_damage=0,
                                burn_duration=0,
                                range_left=float(ac.range + 200),
                                life=1.8,
                                max_life=1.8,
                                hit_ids=set(),
                                knockback=0,
                                color=(13, 148, 136),
                                pooled=False,
                            )
                        )
                        state.next_id += 1
                    if audio:
                        audio.play_rocket_launch()
            else:
                ac.angle = _lerp_angle(ac.angle, ac.orbit_angle + math.pi / 2.0, dt * 4.0)

            if ac.life <= 0:
                state.aircraft.pop(i)


def _update_bombs(state, dt, audio):
    for i in range(len(state.bombs) - 1, -1, -1):
        b = state.bombs[i]
        b.z -= dt / b.fall_time
        if b.z <= 0:
            detonate_explosion(state, b.x, b.y, b.blast_radius, b.damage, b.weapon_id, audio, False)
            state.bombs.pop(i)


def _update_turrets(state, dt, audio):
    for i in range(len(state.turrets) - 1, -1, -1):
        t = state.turrets[i]
        t.life -= dt
        if t.muzzle_flash > 0:
            t.muzzle_flash = max(0.0, t.muzzle_flash - dt)
        t.fire_cooldown -= dt

        target = _find_nearest_zombie(state, t.x, t.y, t.range)
        if target:
            ang = math.atan2(target.y - t.y, target.x - t.x)
            t.angle = _lerp_angle(t.angle, ang, dt * 12.0)
            if t.fire_cooldown <= 0:
                t.fire_cooldown = 1.0 / t.fire_rate
                t.muzzle_flash = 0.05
                mx = t.x + math.cos(t.angle) * 20
                my = t.y + math.sin(t.angle) * 20
                state.projectiles.append(
                    SimpleNamespace(
                        id=state.next_id,
                        kind="bullet",
                        weapon_id="turret",
                        ignore_obstacles=False,
                        x=mx,
                        y=my,
                        prev_x=mx,
                        prev_y=my,
                        vx=math.cos(t.angle) * 980.0,
                        vy=math.sin(t.angle) * 980.0,
                        radius=3.5,
                        damage=t.damage,
                        pierce_left=1,
                        blast_radius=0,
                        burn_damage=0,
                        burn_duration=0,
                        range_left=float(t.range + 60),
                        life=1.2,
                        max_life=1.2,
                        hit_ids=set(),
                        knockback=4,
                        color=(109, 40, 217),
                        pooled=False,
                    )
                )
                state.next_id += 1
                if audio:
                    audio.play_turret_shot()

        if t.life <= 0 or t.hp <= 0:
            spawn_shockwave(state, t.x, t.y, 38, (100, 116, 139), 0.2)
            state.turrets.pop(i)


def _update_orbitals(state, dt, inp, audio):
    for i in range(len(state.orbitals) - 1, -1, -1):
        orb = state.orbitals[i]
        orb.life -= dt
        if inp and "mouse_world_x" in inp and "mouse_world_y" in inp:
            orb.x += (inp["mouse_world_x"] - orb.x) * min(1.0, dt * 4.5)
            orb.y += (inp["mouse_world_y"] - orb.y) * min(1.0, dt * 4.5)
        orb.tick_accum += dt
        if orb.tick_accum >= 0.08:
            tick_dt = orb.tick_accum
            orb.tick_accum = 0.0
            state.map.add_scorch_decal(orb.x, orb.y, orb.radius * 0.45)
            add_shake(state, 5.0)
            nearby = state.hash.query(orb.x, orb.y, orb.radius + 32)
            for z in nearby:
                if z.dead:
                    continue
                if math.hypot(z.x - orb.x, z.y - orb.y) <= orb.radius + z.radius:
                    damage_zombie(state, z, round(orb.damage_per_sec * tick_dt), 0, 0, "orbital", audio)
            for s in range(3):
                ang = random.random() * math.tau
                spd = 90 + random.random() * 140
                spawn_particle(
                    state,
                    orb.x,
                    orb.y,
                    math.cos(ang) * spd,
                    math.sin(ang) * spd,
                    size=4.0,
                    end_size=0.5,
                    color=(224, 242, 254) if s % 2 == 0 else (2, 132, 199),
                    life=0.25,
                )
        if orb.life <= 0:
            state.orbitals.pop(i)


def _update_projectiles(state, dt, audio):
    m = state.map
    for i in range(len(state.projectiles) - 1, -1, -1):
        pr = state.projectiles[i]
        pr.prev_x = pr.x
        pr.prev_y = pr.y
        step_x = pr.vx * dt
        step_y = pr.vy * dt
        pr.x += step_x
        pr.y += step_y
        pr.life -= dt
        pr.range_left -= math.hypot(step_x, step_y)

        if pr.kind == "flame":
            pr.radius += dt * 38.0
            drag = 0.28 ** dt
            pr.vx *= drag
            pr.vy *= drag
        elif pr.kind == "sonic":
            pr.radius = min(56.0, pr.radius + dt * 52.0)
        elif pr.kind == "rocket" and random.random() < 0.75:
            spawn_particle(
                state,
                pr.x,
                pr.y,
                (random.random() - 0.5) * 28,
                (random.random() - 0.5) * 28,
                size=4.0,
                end_size=10.0,
                color=(148, 163, 184),
                alpha=0.55,
                life=0.35,
            )

        remove = False
        if (
            pr.life <= 0
            or pr.range_left <= 0
            or pr.x < 10
            or pr.x > m.width - 10
            or pr.y < 10
            or pr.y > m.height - 10
        ):
            remove = True

        wall_pad = 10 if pr.kind == "sonic" else (4 if pr.kind in ("vomit", "acid") else 0)
        if not remove and not pr.ignore_obstacles and (
            m.point_in_obstacle(pr.x, pr.y, wall_pad)
            or m.segment_hits_obstacle(pr.prev_x, pr.prev_y, pr.x, pr.y)
        ):
            remove = True
            if pr.kind == "rocket":
                detonate_explosion(state, pr.prev_x, pr.prev_y, pr.blast_radius, pr.damage, pr.weapon_id, audio, False)
            elif pr.kind in ("vomit", "acid"):
                state.acid_pools.append(
                    SimpleNamespace(x=pr.prev_x, y=pr.prev_y, radius=34, life=4.0, max_life=4.0, tick=0.0)
                )
                pr.pooled = True
            elif pr.kind == "sonic":
                spawn_shockwave(state, pr.prev_x, pr.prev_y, 26, (167, 139, 250), 0.16)
            elif pr.kind == "bullet":
                for _ in range(3):
                    spawn_particle(
                        state,
                        pr.prev_x,
                        pr.prev_y,
                        (random.random() - 0.5) * 140,
                        (random.random() - 0.5) * 140,
                        size=2.5,
                        end_size=0.5,
                        color=(180, 83, 9),
                        life=0.16,
                    )

        if not remove:
            if pr.kind in ("vomit", "acid"):
                if (
                    math.hypot(pr.x - state.player.x, pr.y - state.player.y) <= pr.radius + state.player.radius
                    and not m.segment_hits_obstacle(pr.x, pr.y, state.player.x, state.player.y)
                ):
                    damage_player(state, pr.damage, audio)
                    state.acid_pools.append(
                        SimpleNamespace(x=pr.x, y=pr.y, radius=40, life=4.5, max_life=4.5, tick=0.0)
                    )
                    pr.pooled = True
                    remove = True
            elif pr.kind == "sonic":
                if (
                    math.hypot(pr.x - state.player.x, pr.y - state.player.y) <= pr.radius + state.player.radius
                    and not m.segment_hits_obstacle(pr.x, pr.y, state.player.x, state.player.y)
                ):
                    damage_player(state, pr.damage, audio)
                    s_len = math.hypot(pr.vx, pr.vy) or 1.0
                    state.player.x += (pr.vx / s_len) * (pr.knockback or 24)
                    state.player.y += (pr.vy / s_len) * (pr.knockback or 24)
                    m.resolve_circle_obstacles(state.player)
                    add_shake(state, 7.0)
                    remove = True
            else:
                near = state.hash.query(pr.x, pr.y, pr.radius + 36)
                for z in near:
                    if z.dead or z.id in pr.hit_ids:
                        continue
                    dx = z.x - pr.x
                    dy = z.y - pr.y
                    sum_r = z.radius + pr.radius
                    if dx * dx + dy * dy <= sum_r * sum_r:
                        pr.hit_ids.add(z.id)
                        if pr.kind == "rocket":
                            detonate_explosion(state, pr.x, pr.y, pr.blast_radius, pr.damage, pr.weapon_id, audio, True)
                            remove = True
                            break
                        p_len = math.hypot(pr.vx, pr.vy) or 1.0
                        kx = (pr.vx / p_len) * pr.knockback
                        ky = (pr.vy / p_len) * pr.knockback
                        if pr.kind == "flame":
                            z.burn_timer = max(z.burn_timer, pr.burn_duration or 2.5)
                            z.burn_dps = max(z.burn_dps, pr.burn_damage or 14)
                            z.burn_weapon = pr.weapon_id
                        damage_zombie(state, z, pr.damage, kx, ky, pr.weapon_id, audio)
                        pr.pierce_left -= 1
                        if pr.pierce_left <= 0:
                            remove = True
                            break

        if remove:
            if pr.kind in ("vomit", "acid") and not pr.pooled and pr.range_left <= 0:
                state.acid_pools.append(
                    SimpleNamespace(x=pr.x, y=pr.y, radius=36, life=4.0, max_life=4.0, tick=0.0)
                )
            state.projectiles.pop(i)


def _update_acid_pools(state, dt, audio):
    p = state.player
    for i in range(len(state.acid_pools) - 1, -1, -1):
        pool = state.acid_pools[i]
        pool.life -= dt
        pool.tick -= dt
        if pool.tick <= 0:
            pool.tick = 0.45
            if math.hypot(p.x - pool.x, p.y - pool.y) < pool.radius + p.radius * 0.5:
                damage_player(state, 7, audio)
        if pool.life <= 0:
            state.acid_pools.pop(i)


def _update_zombies(state, dt, audio):
    p = state.player
    m = state.map

    for i in range(len(state.zombies) - 1, -1, -1):
        z = state.zombies[i]
        if z.dead:
            state.zombies.pop(i)
            continue

        if z.hit_flash > 0:
            z.hit_flash = max(0.0, z.hit_flash - dt)
        if z.attack_cooldown > 0:
            z.attack_cooldown = max(0.0, z.attack_cooldown - dt)
        if z.slow_timer > 0:
            z.slow_timer -= dt
            if z.slow_timer <= 0:
                z.slow_factor = 1.0
        if z.burn_timer > 0:
            z.burn_timer -= dt
            z.hp -= z.burn_dps * dt
            if random.random() < 0.35:
                spawn_particle(
                    state,
                    z.x + (random.random() - 0.5) * z.radius,
                    z.y + (random.random() - 0.5) * z.radius,
                    (random.random() - 0.5) * 20,
                    -35 - random.random() * 25,
                    size=4.5,
                    end_size=1.0,
                    color=(249, 115, 22) if random.random() < 0.5 else (234, 179, 8),
                    life=0.25,
                )
            if z.hp <= 0:
                kill_zombie(state, z, z.burn_weapon, audio)
                state.zombies.pop(i)
                continue

        # Target player or close unobstructed turret
        tx, ty = p.x, p.y
        target_turret = None
        min_target_dist = math.hypot(p.x - z.x, p.y - z.y)
        for tur in state.turrets:
            td = math.hypot(tur.x - z.x, tur.y - z.y)
            if td < min_target_dist * 0.72 and td < 220 and not m.segment_hits_obstacle(z.x, z.y, tur.x, tur.y):
                min_target_dist = td
                tx, ty = tur.x, tur.y
                target_turret = tur

        dx, dy = tx - z.x, ty - z.y
        dist = math.hypot(dx, dy) or 1.0
        has_clear_path = m.has_line_of_sight(z.x, z.y, tx, ty, min(20.0, z.radius * 0.85))

        move_dir_x, move_dir_y = dx / dist, dy / dist
        if not has_clear_path and not target_turret:
            fx, fy = m.get_flow_direction(z.x, z.y)
            if fx != 0.0 or fy != 0.0:
                move_dir_x, move_dir_y = fx, fy

        z.angle = math.atan2(dy if has_clear_path else move_dir_y, dx if has_clear_path else move_dir_x)
        z.anim_phase += dt * (z.speed * 0.08)

        # Ranged Bile Vomiter attack
        if z.type == "spitter" and not target_turret and has_clear_path and 110 < dist < z.spit_range:
            z.spit_cooldown -= dt
            if z.spit_cooldown <= 0:
                z.spit_cooldown = z.attack_rate + random.random() * 0.6
                base_ang = math.atan2(dy, dx)
                for spread, spd in ((-0.16, 330.0), (0.0, 365.0), (0.16, 345.0)):
                    vang = base_ang + spread
                    state.projectiles.append(
                        SimpleNamespace(
                            id=state.next_id,
                            kind="vomit",
                            weapon_id="spitter",
                            ignore_obstacles=False,
                            x=z.x + math.cos(vang) * 16,
                            y=z.y + math.sin(vang) * 16,
                            prev_x=z.x,
                            prev_y=z.y,
                            vx=math.cos(vang) * spd,
                            vy=math.sin(vang) * spd,
                            radius=6.0,
                            damage=max(6, round(z.damage * 0.7)),
                            pierce_left=1,
                            blast_radius=0,
                            burn_damage=0,
                            burn_duration=0,
                            range_left=min(dist + 35.0, 390.0),
                            life=1.45,
                            max_life=1.45,
                            hit_ids=set(),
                            knockback=0,
                            color=(132, 204, 22),
                            pooled=False,
                        )
                    )
                    state.next_id += 1
                if audio:
                    audio.play_vomit()

        # Ranged Sonic Screamer attack
        if z.type == "screamer" and not target_turret:
            if z.scream_charge > 0:
                z.scream_charge -= dt
                z.angle = math.atan2(dy, dx)
                if z.scream_charge <= 0:
                    sang = math.atan2(dy, dx)
                    state.projectiles.append(
                        SimpleNamespace(
                            id=state.next_id,
                            kind="sonic",
                            weapon_id="screamer",
                            ignore_obstacles=False,
                            x=z.x + math.cos(sang) * 18,
                            y=z.y + math.sin(sang) * 18,
                            prev_x=z.x,
                            prev_y=z.y,
                            vx=math.cos(sang) * 420.0,
                            vy=math.sin(sang) * 420.0,
                            radius=18.0,
                            damage=z.damage,
                            pierce_left=1,
                            blast_radius=0,
                            burn_damage=0,
                            burn_duration=0,
                            range_left=460.0,
                            life=1.4,
                            max_life=1.4,
                            hit_ids=set(),
                            knockback=26,
                            color=(109, 40, 217),
                            pooled=False,
                        )
                    )
                    state.next_id += 1
                    z.scream_cooldown = z.attack_rate + random.random() * 0.6
                    if audio:
                        audio.play_sonic_scream()
            elif has_clear_path and 110 < dist < z.scream_range:
                z.scream_cooldown -= dt
                if z.scream_cooldown <= 0:
                    z.scream_charge = 0.36

        # Boss abilities
        if z.type == "boss":
            z.slam_cooldown -= dt
            if z.slam_cooldown <= 0 and dist < 190:
                z.slam_cooldown = 5.5
                spawn_shockwave(state, z.x, z.y, 175, (147, 51, 234), 0.36)
                add_shake(state, 12.0)
                if dist < 175:
                    damage_player(state, 26, audio)
            z.summon_cooldown -= dt
            if z.summon_cooldown <= 0 and len(state.zombies) < 180:
                z.summon_cooldown = 8.5
                for sm in range(4):
                    sa = (sm / 4.0) * math.tau + random.random() * 0.4
                    spawn_zombie(
                        state, "runner" if sm % 2 == 0 else "shambler", z.x + math.cos(sa) * 55, z.y + math.sin(sa) * 55, 1.1
                    )

        # Separation force
        sep_x, sep_y = 0.0, 0.0
        for oz in state.hash.query(z.x, z.y, z.radius * 2.2):
            if oz is z or oz.dead:
                continue
            sdx, sdy = z.x - oz.x, z.y - oz.y
            s_dist_sq = sdx * sdx + sdy * sdy
            min_sep = z.radius + oz.radius
            if 0.001 < s_dist_sq < min_sep * min_sep:
                s_dist = math.sqrt(s_dist_sq)
                push = (min_sep - s_dist) / min_sep
                sep_x += (sdx / s_dist) * push * 135.0
                sep_y += (sdy / s_dist) * push * 135.0

        move_factor = 1.0
        if z.type == "spitter" and has_clear_path and dist < 210:
            move_factor = 0.3
        elif z.type == "screamer" and z.scream_charge > 0:
            move_factor = 0.15
        elif z.type == "screamer" and has_clear_path and dist < 240:
            move_factor = 0.3

        # Stuck detection & corner escape
        z.stuck_check_timer -= dt
        if z.stuck_check_timer <= 0:
            moved = math.hypot(z.x - z.last_check_x, z.y - z.last_check_y)
            if move_factor > 0.4 and moved < 8.0:
                z.stuck_escape_timer = 0.45
                z.stuck_bias = -z.stuck_bias
            z.last_check_x, z.last_check_y = z.x, z.y
            z.stuck_check_timer = 0.25

        if z.stuck_escape_timer > 0:
            z.stuck_escape_timer -= dt
            px, py = -move_dir_y * z.stuck_bias, move_dir_x * z.stuck_bias
            bx = move_dir_x * 0.72 + px * 0.68
            by = move_dir_y * 0.72 + py * 0.68
            b_len = math.hypot(bx, by) or 1.0
            move_dir_x, move_dir_y = bx / b_len, by / b_len

        spd = z.speed * z.slow_factor * move_factor
        z.x += (move_dir_x * spd + sep_x) * dt
        z.y += (move_dir_y * spd + sep_y) * dt
        m.resolve_circle_obstacles(z)

        # Melee collision
        if target_turret:
            if math.hypot(target_turret.x - z.x, target_turret.y - z.y) <= z.radius + target_turret.radius + 4:
                if z.attack_cooldown <= 0:
                    z.attack_cooldown = z.attack_rate
                    target_turret.hp -= z.damage
        else:
            if math.hypot(p.x - z.x, p.y - z.y) <= z.radius + p.radius + 3:
                if z.type == "exploder":
                    kill_zombie(state, z, "exploder", audio)
                    state.zombies.pop(i)
                    continue
                if z.attack_cooldown <= 0:
                    z.attack_cooldown = z.attack_rate
                    damage_player(state, z.damage, audio)


def _update_pickups(state, dt, audio):
    p = state.player
    for i in range(len(state.pickups) - 1, -1, -1):
        pk = state.pickups[i]
        pk.life -= dt
        pk.bob_phase += dt * 4.5
        dx, dy = p.x - pk.x, p.y - pk.y
        dist = math.hypot(dx, dy)

        if 1.0 < dist < 140.0:
            pull = 280.0 * (1.0 - dist / 140.0)
            pk.x += (dx / dist) * pull * dt
            pk.y += (dy / dist) * pull * dt

        if dist < p.radius + pk.radius + 6:
            if pk.type == "medkit":
                p.hp = min(float(p.max_hp), p.hp + 30.0)
                spawn_floating_text(state, pk.x, pk.y - 12, "+30 HP", (21, 128, 61), 14)
            elif pk.type == "cash":
                bonus = 75
                if state.mode == "survival":
                    state.stats.cash += bonus
                state.stats.score += 100
                spawn_floating_text(state, pk.x, pk.y - 12, f"+${bonus}", (180, 83, 9), 14)
            elif pk.type == "overdrive":
                p.overdrive_timer = 8.0
                spawn_floating_text(state, pk.x, pk.y - 12, "OVERDRIVE!", (3, 105, 161), 15)
            elif pk.type == "nuke":
                state.events.screen_flash = 0.4
                state.events.flash_color = (255, 250, 220)
                add_shake(state, 22.0)
                spawn_shockwave(state, p.x, p.y, 720, (217, 119, 6), 0.55)
                spawn_floating_text(state, p.x, p.y - 32, "TACTICAL NUKE!", (185, 28, 28), 18)
                for nz in list(state.zombies):
                    if nz.dead:
                        continue
                    if nz.type == "boss":
                        damage_zombie(state, nz, 900, 0, 0, "nuke", None)
                    else:
                        kill_zombie(state, nz, "nuke", None)
                if audio:
                    audio.play_explosion(1.6)
            if audio:
                audio.play_pickup()
            state.pickups.pop(i)
            continue

        if pk.life <= 0:
            state.pickups.pop(i)


def _update_effects(state, dt):
    for i in range(len(state.beams) - 1, -1, -1):
        state.beams[i].life -= dt
        if state.beams[i].life <= 0:
            state.beams.pop(i)

    for i in range(len(state.shockwaves) - 1, -1, -1):
        sw = state.shockwaves[i]
        sw.life -= dt
        t = 1.0 - sw.life / sw.max_life
        sw.radius = 8.0 + (sw.max_radius - 8.0) * (1.0 - (1.0 - t) ** 2)
        if sw.life <= 0:
            state.shockwaves.pop(i)

    for i in range(len(state.particles) - 1, -1, -1):
        pt = state.particles[i]
        pt.life -= dt
        pt.x += pt.vx * dt
        pt.y += pt.vy * dt
        drag = pt.drag ** (dt * 60.0)
        pt.vx *= drag
        pt.vy *= drag
        if pt.life <= 0:
            state.particles.pop(i)

    for i in range(len(state.floating_texts) - 1, -1, -1):
        ft = state.floating_texts[i]
        ft.life -= dt
        ft.y += ft.vy * dt
        if ft.life <= 0:
            state.floating_texts.pop(i)
