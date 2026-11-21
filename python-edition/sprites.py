"""Pygame PNG sprite loader, hit-flash masks, and angle-bucketed rotation cache."""

import math
import os

ZOMBIE_SPRITE_PATHS = {
    "shambler": "assets/sprites/shambler.png",
    "runner": "assets/sprites/runner.png",
    "brute": "assets/sprites/brute.png",
    "spitter": "assets/sprites/spitter.png",
    "screamer": "assets/sprites/screamer.png",
    "exploder": "assets/sprites/exploder.png",
    "boss": "assets/sprites/boss.png",
}

WEAPON_SPRITE_PATHS = {
    "rifle": "assets/sprites/weapons/rifle.png",
    "shotgun": "assets/sprites/weapons/shotgun.png",
    "minigun": "assets/sprites/weapons/minigun.png",
    "railgun": "assets/sprites/weapons/railgun.png",
    "flamethrower": "assets/sprites/weapons/flamethrower.png",
    "rpg": "assets/sprites/weapons/rpg.png",
    "tesla": "assets/sprites/weapons/tesla.png",
    "designator": "assets/sprites/weapons/designator.png",
}


class SpriteStore:
    def __init__(self, base_dir=None):
        self.base_dir = base_dir or os.path.dirname(os.path.abspath(__file__))
        self.zombies = {}
        self.zombie_flash = {}
        self.weapons = {}
        self.scaled_cache = {}
        self.rotated_cache = {}
        self.icon_cache = {}
        self.loaded = False

    def load_all(self):
        import pygame

        has_display = pygame.display.get_surface() is not None
        for z_type, rel_path in ZOMBIE_SPRITE_PATHS.items():
            full_path = os.path.join(self.base_dir, rel_path)
            if os.path.exists(full_path):
                surf = pygame.image.load(full_path)
                if has_display:
                    surf = surf.convert_alpha()
                self.zombies[z_type] = surf
                mask = pygame.mask.from_surface(surf)
                flash = mask.to_surface(setcolor=(255, 255, 255, 255), unsetcolor=(0, 0, 0, 0))
                if has_display:
                    flash = flash.convert_alpha()
                self.zombie_flash[z_type] = flash

        for wid, rel_path in WEAPON_SPRITE_PATHS.items():
            full_path = os.path.join(self.base_dir, rel_path)
            if os.path.exists(full_path):
                surf = pygame.image.load(full_path)
                if has_display:
                    surf = surf.convert_alpha()
                self.weapons[wid] = surf

        self.loaded = True

    def get_zombie_rotated(self, z_type, draw_size, angle_rad, is_flash=False):
        import pygame

        base_map = self.zombie_flash if is_flash else self.zombies
        base = base_map.get(z_type)
        if base is None:
            return None

        sz = max(8, int(round(draw_size)))
        # Angle bucket every 5 degrees; negative because Pygame rotates CCW while atan2 is CW
        deg = -math.degrees(angle_rad)
        bucket = round(deg / 5.0) % 72
        rot_key = ("z", z_type, sz, bucket, is_flash)
        cached = self.rotated_cache.get(rot_key)
        if cached is not None:
            return cached

        scale_key = ("z", z_type, sz, is_flash)
        scaled = self.scaled_cache.get(scale_key)
        if scaled is None:
            scaled = pygame.transform.smoothscale(base, (sz, sz))
            self.scaled_cache[scale_key] = scaled

        rot_surf = pygame.transform.rotate(scaled, bucket * 5.0)
        if len(self.rotated_cache) > 4000:
            self.rotated_cache.clear()
        self.rotated_cache[rot_key] = rot_surf
        return rot_surf

    def get_weapon_rotated(self, weapon_id, w, h, angle_rad):
        import pygame

        key = "designator" if weapon_id in ("a10", "bomber", "chopper") else weapon_id
        base = self.weapons.get(key)
        if base is None:
            return None

        deg = -math.degrees(angle_rad)
        bucket = round(deg / 4.0) % 90
        rot_key = ("w", key, w, h, bucket)
        cached = self.rotated_cache.get(rot_key)
        if cached is not None:
            return cached

        scale_key = ("w", key, w, h)
        scaled = self.scaled_cache.get(scale_key)
        if scaled is None:
            scaled = pygame.transform.smoothscale(base, (w, h))
            self.scaled_cache[scale_key] = scaled

        rot_surf = pygame.transform.rotate(scaled, bucket * 4.0)
        self.rotated_cache[rot_key] = rot_surf
        return rot_surf

    def get_weapon_icon(self, weapon_id, max_w, max_h):
        import pygame

        base = self.weapons.get(weapon_id)
        if base is None:
            return None
        cache_key = (weapon_id, max_w, max_h)
        cached = self.icon_cache.get(cache_key)
        if cached is not None:
            return cached
        bw, bh = base.get_size()
        scale = min(max_w / max(1, bw), max_h / max(1, bh))
        nw = max(1, round(bw * scale))
        nh = max(1, round(bh * scale))
        icon = pygame.transform.smoothscale(base, (nw, nh))
        self.icon_cache[cache_key] = icon
        return icon
