"""Weapon and tactical support catalog with Level 1-5 upgrade scaling."""

MAX_LEVEL = 5

CATEGORY_LABELS = {
    "guns": "Guns",
    "heavy": "Heavy & Sci-Fi",
    "air": "Airplanes & Choppers",
    "tactical": "Tactical Support",
}

WEAPONS = [
    {
        "id": "rifle",
        "key": "1",
        "name": "M4 Assault Rifle",
        "short_name": "M4 Rifle",
        "category": "guns",
        "show_cooldown": False,
        "color": (180, 83, 9),
        "sprite": "assets/sprites/weapons/rifle.png",
        "desc": "Reliable rapid-fire carbine with high muzzle velocity and crisp brass ejection.",
        "upgrade_base_cost": 140,
        "base_stats": {
            "damage": 26,
            "fire_rate": 9.5,
            "spread": 0.045,
            "speed": 980,
            "pellets": 1,
            "pierce": 1,
            "range": 920,
        },
    },
    {
        "id": "shotgun",
        "key": "2",
        "name": "SPAS-12 Shotgun",
        "short_name": "Shotgun",
        "category": "guns",
        "show_cooldown": False,
        "color": (217, 119, 6),
        "sprite": "assets/sprites/weapons/shotgun.png",
        "desc": "Fires a wide cone of heavy buckshot pellets with devastating close-range knockback.",
        "upgrade_base_cost": 160,
        "base_stats": {
            "damage": 19,
            "fire_rate": 1.85,
            "spread": 0.34,
            "speed": 860,
            "pellets": 8,
            "pierce": 1,
            "range": 460,
        },
    },
    {
        "id": "minigun",
        "key": "3",
        "name": "M134 Vulcan Minigun",
        "short_name": "Minigun",
        "category": "guns",
        "show_cooldown": False,
        "color": (194, 65, 12),
        "sprite": "assets/sprites/weapons/minigun.png",
        "desc": "Six-barrel rotary storm spitting molten tracer rounds at an absurd rate.",
        "upgrade_base_cost": 210,
        "base_stats": {
            "damage": 17,
            "fire_rate": 22.0,
            "spread": 0.14,
            "speed": 1050,
            "pellets": 1,
            "pierce": 1,
            "range": 840,
            "move_slow": 0.82,
        },
    },
    {
        "id": "railgun",
        "key": "4",
        "name": "Railgun Sniper",
        "short_name": "Railgun",
        "category": "guns",
        "show_cooldown": False,
        "color": (2, 132, 199),
        "sprite": "assets/sprites/weapons/railgun.png",
        "desc": "Hyper-velocity electromagnetic slug that instantly pierces entire lines of zombies.",
        "upgrade_base_cost": 220,
        "base_stats": {
            "damage": 185,
            "fire_rate": 1.05,
            "spread": 0.0,
            "speed": 2200,
            "pellets": 1,
            "pierce": 18,
            "range": 1350,
        },
    },
    {
        "id": "flamethrower",
        "key": "5",
        "name": "M2 Flamethrower",
        "short_name": "Flamer",
        "category": "heavy",
        "show_cooldown": False,
        "color": (234, 88, 12),
        "sprite": "assets/sprites/weapons/flamethrower.png",
        "desc": "Projects a roaring jet of burning napalm that ignites hordes over time.",
        "upgrade_base_cost": 190,
        "base_stats": {
            "damage": 13,
            "fire_rate": 24.0,
            "spread": 0.25,
            "speed": 470,
            "pellets": 2,
            "pierce": 6,
            "range": 330,
            "burn_damage": 16,
            "burn_duration": 2.6,
        },
    },
    {
        "id": "rpg",
        "key": "6",
        "name": "RPG-7 Rocket Launcher",
        "short_name": "RPG-7",
        "category": "heavy",
        "show_cooldown": True,
        "color": (3, 105, 161),
        "sprite": "assets/sprites/weapons/rpg.png",
        "desc": "Launches high-explosive warheads that shred dense zombie packs with shockwaves.",
        "upgrade_base_cost": 230,
        "base_stats": {
            "damage": 165,
            "fire_rate": 0.9,
            "spread": 0.02,
            "speed": 620,
            "pellets": 1,
            "pierce": 1,
            "range": 1100,
            "blast_radius": 135,
        },
    },
    {
        "id": "tesla",
        "key": "7",
        "name": "Tesla Arc Cannon",
        "short_name": "Tesla Arc",
        "category": "heavy",
        "show_cooldown": False,
        "color": (8, 145, 178),
        "sprite": "assets/sprites/weapons/tesla.png",
        "desc": "Discharges high-voltage lightning that jumps across multiple zombies and shocks them.",
        "upgrade_base_cost": 240,
        "base_stats": {
            "damage": 66,
            "fire_rate": 2.8,
            "spread": 0.0,
            "speed": 1400,
            "pellets": 1,
            "pierce": 1,
            "range": 460,
            "chain_count": 6,
            "slow_factor": 0.55,
        },
    },
    {
        "id": "a10",
        "key": "8",
        "name": "A-10 Warthog Jet",
        "short_name": "A-10 Jet",
        "category": "air",
        "show_cooldown": True,
        "color": (4, 120, 87),
        "sprite": None,
        "desc": "Calls an A-10 attack airplane to strafe your aimed corridor with explosive 30mm shells!",
        "upgrade_base_cost": 280,
        "base_stats": {
            "damage": 95,
            "cooldown": 3.2,
            "blast_radius": 74,
            "planes": 1,
            "rounds_per_plane": 14,
            "range": 1800,
        },
    },
    {
        "id": "bomber",
        "key": "9",
        "name": "B-52 Carpet Bomber",
        "short_name": "B-52 Bomber",
        "category": "air",
        "show_cooldown": True,
        "color": (5, 150, 105),
        "sprite": None,
        "desc": "Summons a heavy B-52 Stratofortress dropping a rolling line of 12 devastating bombs.",
        "upgrade_base_cost": 340,
        "base_stats": {
            "damage": 180,
            "cooldown": 5.2,
            "blast_radius": 128,
            "planes": 1,
            "bombs_per_plane": 12,
            "range": 2000,
        },
    },
    {
        "id": "chopper",
        "key": "0",
        "name": "Apache Gunship",
        "short_name": "Apache Heli",
        "category": "air",
        "show_cooldown": True,
        "color": (13, 148, 136),
        "sprite": None,
        "desc": "Deploys an orbiting Apache helicopter with autocannon & twin homing Hydra rockets.",
        "upgrade_base_cost": 320,
        "base_stats": {
            "damage": 34,
            "rocket_damage": 125,
            "cooldown": 6.5,
            "duration": 14.0,
            "blast_radius": 92,
            "max_active": 2,
            "range": 700,
        },
    },
]

TACTICALS = [
    {
        "id": "turret",
        "key": "Q",
        "name": "Deploy Auto-Turret",
        "short_name": "Turret",
        "category": "tactical",
        "show_cooldown": True,
        "color": (109, 40, 217),
        "sprite": None,
        "survival_cost": 150,
        "desc": "Deploys an automated twin-barrel sentry turret that locks onto nearby zombies.",
        "upgrade_base_cost": 220,
        "base_stats": {
            "damage": 24,
            "fire_rate": 7.5,
            "cooldown": 2.0,
            "duration": 36.0,
            "range": 490,
            "max_active": 3,
            "hp": 260,
        },
    },
    {
        "id": "orbital",
        "key": "E",
        "name": "Orbital Ion Laser",
        "short_name": "Ion Laser",
        "category": "tactical",
        "show_cooldown": True,
        "color": (124, 58, 237),
        "sprite": None,
        "survival_cost": 250,
        "desc": "Calls a continuous satellite ion beam from orbit that follows your cursor & vaporizes hordes.",
        "upgrade_base_cost": 300,
        "base_stats": {
            "damage_per_sec": 460,
            "cooldown": 6.0,
            "duration": 3.0,
            "radius": 72,
        },
    },
]

WEAPON_BY_ID = {w["id"]: w for w in WEAPONS}
TACTICAL_BY_ID = {t["id"]: t for t in TACTICALS}


def get_upgrade_cost(defn, level):
    if not defn or level >= MAX_LEVEL:
        return float("inf")
    return round(defn["upgrade_base_cost"] * (1.65 ** (level - 1)))


def get_scaled_stats(defn, level):
    lv = max(1, min(MAX_LEVEL, level or 1))
    b = defn["base_stats"]
    dmg_mult = 1.0 + (lv - 1) * 0.28
    rate_mult = 1.0 + (lv - 1) * 0.14
    cd_mult = max(0.45, 1.0 - (lv - 1) * 0.13)
    aoe_mult = 1.0 + (lv - 1) * 0.12

    if defn["category"] == "air":
        planes = b.get("planes", 1)
        if defn["id"] == "a10":
            planes = 3 if lv >= 5 else 2 if lv >= 3 else 1
        elif defn["id"] == "bomber":
            planes = 2 if lv >= 4 else 1
        return {
            "damage": round(b.get("damage", 0) * dmg_mult),
            "rocket_damage": round(b.get("rocket_damage", 0) * dmg_mult),
            "cooldown": round(b["cooldown"] * cd_mult, 2),
            "blast_radius": round(b.get("blast_radius", 60) * aoe_mult),
            "planes": planes,
            "rounds_per_plane": b.get("rounds_per_plane", 0) + (lv - 1) * 2,
            "bombs_per_plane": b.get("bombs_per_plane", 0) + (lv - 1) * 2,
            "duration": b.get("duration", 0) + (lv - 1) * 2.5,
            "max_active": b.get("max_active", 1) + (1 if lv >= 3 else 0) + (1 if lv >= 5 else 0),
            "range": b.get("range", 1600),
        }

    if defn["id"] == "turret":
        return {
            "damage": round(b["damage"] * dmg_mult),
            "fire_rate": round(b["fire_rate"] * rate_mult, 2),
            "cooldown": round(b["cooldown"] * cd_mult, 2),
            "duration": b["duration"] + (lv - 1) * 6.0,
            "range": round(b["range"] * (1.0 + (lv - 1) * 0.08)),
            "max_active": b["max_active"] + (1 if lv >= 3 else 0) + (1 if lv >= 5 else 0),
            "hp": round(b["hp"] * dmg_mult),
        }

    if defn["id"] == "orbital":
        return {
            "damage_per_sec": round(b["damage_per_sec"] * dmg_mult),
            "cooldown": round(b["cooldown"] * cd_mult, 2),
            "duration": round(b["duration"] + (lv - 1) * 0.45, 2),
            "radius": round(b["radius"] * aoe_mult),
        }

    fire_rate = round(b["fire_rate"] * rate_mult, 2)
    return {
        "damage": round(b["damage"] * dmg_mult),
        "fire_rate": fire_rate,
        "cooldown": round(1.0 / fire_rate, 4),
        "spread": b["spread"],
        "speed": round(b["speed"] * (1.0 + (lv - 1) * 0.04)),
        "pellets": b["pellets"] + ((lv - 1) * 2 if defn["id"] == "shotgun" else 0),
        "pierce": b["pierce"] + ((lv - 1) * 4 if defn["id"] == "railgun" else 0),
        "range": round(b["range"] * (1.0 + (lv - 1) * 0.06)),
        "blast_radius": round(b["blast_radius"] * aoe_mult) if b.get("blast_radius") else 0,
        "burn_damage": round(b["burn_damage"] * dmg_mult) if b.get("burn_damage") else 0,
        "burn_duration": b.get("burn_duration", 0),
        "chain_count": b["chain_count"] + (lv - 1) if b.get("chain_count") else 0,
        "slow_factor": b.get("slow_factor", 1.0),
        "move_slow": b.get("move_slow", 1.0),
    }
