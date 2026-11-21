"""Pygame world renderer, minimap, and light-themed rectangular UI screens."""

import math
import pygame

import weapons

BG_LIGHT = (236, 239, 243)
WHITE = (255, 255, 255)
PANEL_BG = (248, 249, 250)
BTN_BG = (240, 240, 240)
BTN_HOVER = (224, 224, 224)
TEXT_DARK = (17, 17, 17)
TEXT_MUTED = (85, 85, 85)
BORDER_GRAY = (153, 153, 153)
BORDER_DARK = (51, 51, 51)
LINK_BLUE = (11, 87, 208)

WEAPON_RENDER_CFG = {
    "rifle": {"w": 34, "h": 17, "ox": 12, "oy": 1, "muzzle_x": 31},
    "shotgun": {"w": 36, "h": 18, "ox": 12, "oy": 1, "muzzle_x": 32},
    "minigun": {"w": 38, "h": 20, "ox": 14, "oy": 2, "muzzle_x": 35},
    "railgun": {"w": 40, "h": 18, "ox": 14, "oy": 1, "muzzle_x": 36},
    "flamethrower": {"w": 36, "h": 18, "ox": 13, "oy": 2, "muzzle_x": 33},
    "rpg": {"w": 40, "h": 18, "ox": 10, "oy": 3, "muzzle_x": 32},
    "tesla": {"w": 36, "h": 18, "ox": 13, "oy": 1, "muzzle_x": 33},
    "designator": {"w": 24, "h": 14, "ox": 13, "oy": 1, "muzzle_x": 25},
}


def _rot_poly(cx, cy, angle, pts):
    ca = math.cos(angle)
    sa = math.sin(angle)
    return [(cx + px * ca - py * sa, cy + px * sa + py * ca) for px, py in pts]


def _draw_dashed_line(surf, color, p1, p2, width=2, dash=10, gap=7):
    dx, dy = p2[0] - p1[0], p2[1] - p1[1]
    dist = math.hypot(dx, dy)
    if dist < 1:
        return
    ux, uy = dx / dist, dy / dist
    pos = 0.0
    while pos < dist:
        end = min(dist, pos + dash)
        pygame.draw.line(
            surf,
            color,
            (round(p1[0] + ux * pos), round(p1[1] + uy * pos)),
            (round(p1[0] + ux * end), round(p1[1] + uy * end)),
            width,
        )
        pos += dash + gap


class GameRenderer:
    def __init__(self):
        self.font_xs = pygame.font.SysFont("segoeui,arial,sans-serif", 10, bold=True)
        self.font_sm = pygame.font.SysFont("segoeui,arial,sans-serif", 12, bold=True)
        self.font_md = pygame.font.SysFont("segoeui,arial,sans-serif", 14)
        self.font_md_b = pygame.font.SysFont("segoeui,arial,sans-serif", 14, bold=True)
        self.font_lg = pygame.font.SysFont("segoeui,arial,sans-serif", 20, bold=True)
        self.font_xl = pygame.font.SysFont("segoeui,arial,sans-serif", 26, bold=True)
        self.font_mono = pygame.font.SysFont("consolas,couriernew,monospace", 12, bold=True)
        self.font_link = pygame.font.SysFont("segoeui,arial,sans-serif", 15)
        self.font_link.set_underline(True)
        self.minimap_surf = pygame.Surface((160, 120))

    def _box(self, surf, rect, fill, border=BORDER_GRAY, border_w=1):
        pygame.draw.rect(surf, fill, rect)
        if border_w > 0 and border is not None:
            pygame.draw.rect(surf, border, rect, border_w)

    def _text(self, surf, font, text, color, pos, anchor="topleft"):
        img = font.render(str(text), True, color)
        r = img.get_rect(**{anchor: pos})
        surf.blit(img, r)
        return r

    def _button(self, surf, rect, label, mouse_pos, fill=BTN_BG, hover_fill=BTN_HOVER, border=BORDER_DARK, text_col=TEXT_DARK, font=None, border_w=1):
        hovered = rect.collidepoint(mouse_pos)
        self._box(surf, rect, hover_fill if hovered else fill, border, border_w)
        self._text(surf, font or self.font_sm, label, text_col, rect.center, "center")
        return rect

    # ---------------- WORLD RENDERING ----------------
    def render_world(self, screen, state, camera, inp, sprites, view_w, view_h):
        screen.fill(BG_LIGHT)
        shake = state.events.screen_shake
        sx_off = (math.sin(state.time * 91.0) * shake * 0.5) if shake > 0 else 0.0
        sy_off = (math.cos(state.time * 79.0) * shake * 0.5) if shake > 0 else 0.0
        cam_left = camera[0] - view_w / 2.0 + sx_off
        cam_top = camera[1] - view_h / 2.0 + sy_off

        # 1. Terrain & decals clipped to viewport
        sx = max(0, int(math.floor(cam_left)))
        sy = max(0, int(math.floor(cam_top)))
        ex = min(state.map.width, int(math.ceil(cam_left + view_w)))
        ey = min(state.map.height, int(math.ceil(cam_top + view_h)))
        sw, sh = ex - sx, ey - sy
        if sw > 0 and sh > 0:
            area = pygame.Rect(sx, sy, sw, sh)
            dst = (round(sx - cam_left), round(sy - cam_top))
            if state.map.terrain_surface is not None:
                screen.blit(state.map.terrain_surface, dst, area)
            if state.map.decal_surface is not None:
                screen.blit(state.map.decal_surface, dst, area)

        # 2. Acid / vomit pools
        for pl in state.acid_pools:
            px, py = round(pl.x - cam_left), round(pl.y - cam_top)
            r = int(pl.radius)
            alpha = int(min(1.0, pl.life) * 145)
            pool_s = pygame.Surface((r * 2 + 2, r * 2 + 2), pygame.SRCALPHA)
            pygame.draw.circle(pool_s, (101, 163, 13, alpha), (r + 1, r + 1), r)
            pygame.draw.circle(pool_s, (163, 230, 53, min(255, alpha + 30)), (r + 1, r + 1), max(4, int(r * 0.6)))
            screen.blit(pool_s, (px - r - 1, py - r - 1))

        # 3. Ground aim previews
        if inp and "mouse_world_x" in inp:
            self._draw_aim_preview(screen, state, inp["mouse_world_x"], inp["mouse_world_y"], cam_left, cam_top)

        # 4. Obstacles
        for ob in state.map.obstacles:
            ox = ob["x"] - cam_left
            oy = ob["y"] - cam_top
            ow, oh = ob["w"], ob["h"]
            if ox + ow < -30 or ox > view_w + 30 or oy + oh < -30 or oy > view_h + 30:
                continue
            pygame.draw.rect(screen, (175, 182, 192), (round(ox + 5), round(oy + 7), ow, oh))
            pygame.draw.rect(screen, ob["color"], (round(ox), round(oy), ow, oh))
            pygame.draw.rect(screen, (30, 41, 59), (round(ox), round(oy), ow, oh), 2)
            if ob["type"] == "crate":
                pygame.draw.line(screen, (45, 55, 42), (round(ox + 8), round(oy + 8)), (round(ox + ow - 8), round(oy + oh - 8)), 2)
            elif ob["type"] == "barrier":
                pygame.draw.rect(screen, (217, 119, 6), (round(ox + 4), round(oy + 4), max(2, ow - 8), 6))

        # 5. Pickups
        for pk in state.pickups:
            bob = math.sin(pk.bob_phase) * 3.0
            px, py = round(pk.x - cam_left), round(pk.y + bob - cam_top)
            col = (
                (21, 128, 61)
                if pk.type == "medkit"
                else ((180, 83, 9) if pk.type == "cash" else ((3, 105, 161) if pk.type == "overdrive" else (185, 28, 28)))
            )
            pygame.draw.circle(screen, WHITE, (px, py), 11)
            pygame.draw.circle(screen, col, (px, py), 11, 2)
            sym = "+" if pk.type == "medkit" else ("$" if pk.type == "cash" else ("E" if pk.type == "overdrive" else "N"))
            self._text(screen, self.font_sm, sym, col, (px, py), "center")

        # 6. Turrets
        for t in state.turrets:
            tx, ty = round(t.x - cam_left), round(t.y - cam_top)
            pygame.draw.circle(screen, (30, 41, 59), (tx, ty), 14)
            pygame.draw.circle(screen, (100, 116, 139), (tx, ty), 14, 2)
            head_pts = _rot_poly(tx, ty, t.angle, [(-7, -7), (8, -7), (8, 7), (-7, 7)])
            pygame.draw.polygon(screen, (124, 58, 237), head_pts)
            b1 = _rot_poly(tx, ty, t.angle, [(8, -5), (21, -5), (21, -2), (8, -2)])
            b2 = _rot_poly(tx, ty, t.angle, [(8, 2), (21, 2), (21, 5), (8, 5)])
            pygame.draw.polygon(screen, (203, 213, 225), b1)
            pygame.draw.polygon(screen, (203, 213, 225), b2)
            if t.muzzle_flash > 0:
                fx = round(tx + math.cos(t.angle) * 23)
                fy = round(ty + math.sin(t.angle) * 23)
                pygame.draw.circle(screen, (253, 224, 71), (fx, fy), 5)
            frac = max(0.0, t.life / t.max_life)
            pygame.draw.rect(screen, (40, 40, 40), (tx - 14, ty - 22, 28, 4))
            pygame.draw.rect(screen, (139, 92, 246), (tx - 14, ty - 22, round(28 * frac), 4))

        # 7. Zombies
        self._draw_zombies(screen, state.zombies, sprites, cam_left, cam_top, view_w, view_h)

        # 8. Player
        self._draw_player(screen, state.player, sprites, cam_left, cam_top)

        # 9. Projectiles, Beams, Shockwaves, Particles
        self._draw_projectiles(screen, state.projectiles, cam_left, cam_top)
        self._draw_beams(screen, state.beams, cam_left, cam_top)
        for sw in state.shockwaves:
            alpha = max(0.0, sw.life / sw.max_life)
            r = max(2, int(sw.radius))
            sw_s = pygame.Surface((r * 2 + 4, r * 2 + 4), pygame.SRCALPHA)
            pygame.draw.circle(sw_s, (*sw.color[:3], int(alpha * 190)), (r + 2, r + 2), r, 3)
            screen.blit(sw_s, (round(sw.x - cam_left) - r - 2, round(sw.y - cam_top) - r - 2))

        for pt in state.particles:
            t = 1.0 - pt.life / pt.max_life
            rad = max(1, round(pt.size + (pt.end_size - pt.size) * t))
            alpha = max(0, int((1.0 - t) * pt.alpha * 255))
            px, py = round(pt.x - cam_left), round(pt.y - cam_top)
            if alpha >= 245:
                pygame.draw.circle(screen, pt.color[:3], (px, py), rad)
            else:
                ps = pygame.Surface((rad * 2 + 2, rad * 2 + 2), pygame.SRCALPHA)
                pygame.draw.circle(ps, (*pt.color[:3], alpha), (rad + 1, rad + 1), rad)
                screen.blit(ps, (px - rad - 1, py - rad - 1))

        # 10. Airspace Layer (Bombs + Aircraft + Orbital Lasers)
        self._draw_bombs(screen, state.bombs, cam_left, cam_top)
        self._draw_aircraft(screen, state.aircraft, cam_left, cam_top)
        self._draw_orbitals(screen, state.orbitals, cam_left, cam_top)

        # 11. Floating Combat Texts
        for ft in state.floating_texts:
            fx, fy = round(ft.x - cam_left), round(ft.y - cam_top)
            self._text(screen, self.font_sm, ft.text, WHITE, (fx + 1, fy + 1), "center")
            self._text(screen, self.font_sm, ft.text, ft.color, (fx, fy), "center")

        # 12. Crosshair
        if inp and "mouse_world_x" in inp:
            cx, cy = round(inp["mouse_world_x"] - cam_left), round(inp["mouse_world_y"] - cam_top)
            wid = state.player.active_weapon_id
            is_air = wid in ("a10", "bomber", "chopper")
            col = (4, 120, 87) if is_air else (17, 24, 39)
            pygame.draw.circle(screen, col, (cx, cy), 13 if is_air else 9, 2)
            pygame.draw.line(screen, col, (cx - 16, cy), (cx - 6, cy), 2)
            pygame.draw.line(screen, col, (cx + 6, cy), (cx + 16, cy), 2)
            pygame.draw.line(screen, col, (cx, cy - 16), (cx, cy - 6), 2)
            pygame.draw.line(screen, col, (cx, cy + 6), (cx, cy + 16), 2)

        # Low HP border pulse
        if 0 < state.player.hp <= 32:
            pygame.draw.rect(screen, (185, 28, 28), (0, 0, view_w, view_h), 6)

        # Screen flash
        if state.events.screen_flash > 0:
            fl = pygame.Surface((view_w, view_h), pygame.SRCALPHA)
            a = min(220, int(state.events.screen_flash * 420))
            fl.fill((*state.events.flash_color[:3], a))
            screen.blit(fl, (0, 0))

    def _draw_aim_preview(self, screen, state, mx, my, cam_left, cam_top):
        p = state.player
        wid = p.active_weapon_id
        defn = weapons.WEAPON_BY_ID.get(wid)
        if not defn:
            return
        stats = weapons.get_scaled_stats(defn, p.weapon_levels.get(wid, 1))
        smx, smy = mx - cam_left, my - cam_top

        if wid in ("a10", "bomber"):
            dx, dy = mx - p.x, my - p.y
            length = math.hypot(dx, dy)
            ux, uy = (dx / length, dy / length) if length > 6 else (math.cos(p.angle), math.sin(p.angle))
            half_span = 240 if wid == "a10" else 280
            half_w = 34 if wid == "a10" else 55
            ang = math.atan2(uy, ux)
            corners = _rot_poly(smx, smy, ang, [(-half_span, -half_w), (half_span, -half_w), (half_span, half_w), (-half_span, half_w)])
            pygame.draw.polygon(screen, (4, 120, 87), corners, 2)
            _draw_dashed_line(screen, (4, 120, 87), (smx - ux * half_span, smy - uy * half_span), (smx + ux * half_span, smy + uy * half_span), 2, 8, 6)
        elif wid == "chopper":
            pygame.draw.circle(screen, (4, 120, 87), (round(smx), round(smy)), 155, 2)
        elif wid == "rpg":
            pygame.draw.circle(screen, (3, 105, 161), (round(smx), round(smy)), stats["blast_radius"], 1)

    def _draw_zombies(self, screen, zombies, sprites, cam_left, cam_top, view_w, view_h):
        for z in zombies:
            zx, zy = z.x - cam_left, z.y - cam_top
            if zx + z.radius < -50 or zx - z.radius > view_w + 50 or zy + z.radius < -50 or zy - z.radius > view_h + 50:
                continue
            izx, izy = round(zx), round(zy)
            pygame.draw.ellipse(screen, (175, 182, 192), (round(zx - z.radius * 0.9), round(zy - z.radius * 0.5), round(z.radius * 1.9), round(z.radius * 1.4)))

            sway_amp = 0.14 if z.type == "runner" else (0.07 if z.type in ("brute", "boss") else 0.10)
            scale_mult = 2.7 if z.type in ("brute", "boss") else (2.65 if z.type == "exploder" else 2.8)
            draw_size = z.radius * scale_mult
            rot_surf = sprites.get_zombie_rotated(z.type, draw_size, z.angle + math.sin(z.anim_phase) * sway_amp, z.hit_flash > 0)

            if rot_surf is not None:
                rw, rh = rot_surf.get_size()
                screen.blit(rot_surf, (izx - rw // 2, izy - rh // 2))
            else:
                col = WHITE if z.hit_flash > 0 else z.color
                hcol = WHITE if z.hit_flash > 0 else z.head_color
                pygame.draw.circle(screen, col, (izx, izy), z.radius)
                hx = round(izx + math.cos(z.angle) * z.radius * 0.25)
                hy = round(izy + math.sin(z.angle) * z.radius * 0.25)
                pygame.draw.circle(screen, hcol, (hx, hy), max(4, round(z.radius * 0.55)))

            if z.type == "screamer" and z.scream_charge > 0:
                prog = 1.0 - z.scream_charge / 0.36
                pygame.draw.circle(screen, (109, 40, 217), (izx, izy), round(z.radius + 6 + prog * 14), 2)
            if z.burn_timer > 0:
                pygame.draw.circle(screen, (234, 88, 12), (izx, izy), z.radius + 3, 2)
            elif z.slow_timer > 0:
                pygame.draw.circle(screen, (2, 132, 199), (izx, izy), z.radius + 3, 2)

            if z.hp < z.max_hp and z.type != "boss":
                bw = z.radius * 2
                pygame.draw.rect(screen, (30, 30, 30), (izx - z.radius, izy - z.radius - 9, bw, 4))
                pygame.draw.rect(screen, (220, 38, 38), (izx - z.radius, izy - z.radius - 9, max(0, round(bw * (z.hp / z.max_hp))), 4))

    def _draw_player(self, screen, p, sprites, cam_left, cam_top):
        for im in p.afterimages:
            ix, iy = round(im.x - cam_left), round(im.y - cam_top)
            pygame.draw.circle(screen, (56, 189, 248), (ix, iy), p.radius, 2)

        px, py = p.x - cam_left, p.y - cam_top
        ipx, ipy = round(px), round(py)
        if p.overdrive_timer > 0:
            pygame.draw.circle(screen, (2, 132, 199), (ipx, ipy), p.radius + 6, 2)

        pygame.draw.ellipse(screen, (165, 173, 184), (ipx - 14, ipy - 8, 30, 24))
        body_col = (252, 165, 165) if (p.invuln_timer > 0 and int(p.invuln_timer * 30) % 2 == 0) else (37, 99, 235)
        body_pts = _rot_poly(px, py, p.angle, [(-12, -13), (8, -14), (10, 0), (8, 14), (-12, 13), (-14, 0)])
        pygame.draw.polygon(screen, body_col, body_pts)
        pygame.draw.polygon(screen, (30, 58, 138), body_pts, 2)

        wid = p.active_weapon_id
        cfg_key = "designator" if wid in ("a10", "bomber", "chopper") else wid
        wcfg = WEAPON_RENDER_CFG.get(cfg_key, WEAPON_RENDER_CFG["rifle"])
        recoil = -3.5 * (p.muzzle_flash / 0.075) if p.muzzle_flash > 0 else 0.0
        wspr = sprites.get_weapon_rotated(wid, wcfg["w"], wcfg["h"], p.angle)
        ca, sa = math.cos(p.angle), math.sin(p.angle)

        if wspr is not None:
            ox = wcfg["ox"] + recoil
            oy = wcfg["oy"]
            wx = px + ox * ca - oy * sa
            wy = py + ox * sa + oy * ca
            rw, rh = wspr.get_size()
            screen.blit(wspr, (round(wx - rw / 2.0), round(wy - rh / 2.0)))
            flash_x, flash_y = wcfg["muzzle_x"] + recoil, wcfg["oy"]
        else:
            bpts = _rot_poly(px, py, p.angle, [(6, -3), (25, -3), (25, 3), (6, 3)])
            pygame.draw.polygon(screen, (51, 65, 85), bpts)
            flash_x, flash_y = 26.0, 0.0

        if p.muzzle_flash > 0:
            fpts = _rot_poly(px, py, p.angle, [(flash_x, flash_y), (flash_x + 13, flash_y - 6), (flash_x + 9, flash_y), (flash_x + 13, flash_y + 6)])
            pygame.draw.polygon(screen, (253, 224, 71), fpts)

        # Helmet + visor
        pygame.draw.circle(screen, (30, 41, 59), (ipx, ipy), 9)
        vpts = _rot_poly(px, py, p.angle, [(4, -4), (8, -4), (8, 4), (4, 4)])
        pygame.draw.polygon(screen, (56, 189, 248), vpts)

    def _draw_projectiles(self, screen, projectiles, cam_left, cam_top):
        for pr in projectiles:
            px, py = pr.x - cam_left, pr.y - cam_top
            if pr.kind == "flame":
                frac = max(0.0, pr.life / pr.max_life)
                col = (250, 204, 21) if frac > 0.55 else ((249, 115, 22) if frac > 0.28 else (220, 38, 38))
                r = max(2, round(pr.radius))
                fs = pygame.Surface((r * 2 + 2, r * 2 + 2), pygame.SRCALPHA)
                pygame.draw.circle(fs, (*col, int(frac * 200)), (r + 1, r + 1), r)
                screen.blit(fs, (round(px - r - 1), round(py - r - 1)))
            elif pr.kind == "rocket":
                ang = math.atan2(pr.vy, pr.vx)
                body = _rot_poly(px, py, ang, [(-9, -3), (7, -3), (13, 0), (7, 3), (-9, 3)])
                pygame.draw.polygon(screen, (51, 65, 85), body)
                tip = _rot_poly(px, py, ang, [(7, -3), (13, 0), (7, 3)])
                pygame.draw.polygon(screen, (220, 38, 38), tip)
            elif pr.kind in ("vomit", "acid"):
                vang = math.atan2(pr.vy, pr.vx)
                pygame.draw.circle(screen, (132, 204, 22), (round(px), round(py)), round(pr.radius))
                pygame.draw.circle(screen, (54, 83, 20), (round(px), round(py)), round(pr.radius), 2)
                tx = round(px - math.cos(vang) * 7)
                ty = round(py - math.sin(vang) * 7)
                pygame.draw.circle(screen, (190, 242, 100), (tx, ty), max(2, round(pr.radius * 0.52)))
            elif pr.kind == "sonic":
                sang = math.atan2(pr.vy, pr.vx)
                for ring in range(3):
                    rad = max(6, round(pr.radius - ring * 7))
                    col = (2, 132, 199) if ring == 1 else (109, 40, 217)
                    ox = px - math.cos(sang) * ring * 5
                    oy = py - math.sin(sang) * ring * 5
                    rect = pygame.Rect(round(ox - rad), round(oy - rad), rad * 2, rad * 2)
                    # pygame.draw.arc uses CCW angles (Y-up), so negate screen angle
                    pygame.draw.arc(screen, col, rect, -sang - 0.78, -sang + 0.78, max(1, 3 - ring))
            else:
                pygame.draw.line(
                    screen,
                    pr.color,
                    (round(pr.prev_x - cam_left), round(pr.prev_y - cam_top)),
                    (round(px), round(py)),
                    3,
                )

    def _draw_beams(self, screen, beams, cam_left, cam_top):
        for b in beams:
            if len(b.points) < 2:
                continue
            alpha = max(0.15, b.life / b.max_life)
            pts = [(round(pt[0] - cam_left), round(pt[1] - cam_top)) for pt in b.points]
            w = max(1, round(b.width * alpha))
            pygame.draw.lines(screen, b.color, False, pts, w)
            if b.kind in ("rail", "lightning") and w >= 2:
                pygame.draw.lines(screen, WHITE, False, pts, max(1, round(w * 0.4)))

    def _draw_bombs(self, screen, bombs, cam_left, cam_top):
        for b in bombs:
            z = max(0.0, b.z)
            bx, by = round(b.x - cam_left), round(b.y - cam_top)
            pygame.draw.circle(screen, (150, 155, 165), (bx, by), round(4 + z * 16))
            pygame.draw.circle(screen, (220, 38, 38), (bx, by), round(6 + z * 20), 1)
            by_air = round(by - z * 140)
            sc = 0.65 + z * 0.7
            pygame.draw.ellipse(screen, (30, 41, 59), (round(bx - 5 * sc), round(by_air - 10 * sc), round(10 * sc), round(20 * sc)))
            pygame.draw.ellipse(screen, (234, 88, 12), (round(bx - 5 * sc), round(by_air - 10 * sc), round(10 * sc), round(20 * sc)), 2)

    def _draw_aircraft(self, screen, aircraft, cam_left, cam_top):
        for ac in aircraft:
            if getattr(ac, "delay", 0) > 0:
                continue
            ax, ay = ac.x - cam_left, ac.y - cam_top
            if ac.kind == "a10":
                wing = [(-6, -42), (10, -40), (14, 40), (-6, 42)]
                fuse = [(34, 0), (14, -7), (-32, -5), (-36, 0), (-32, 5), (14, 7)]
                tail = [(-35, -16), (-27, -16), (-27, 16), (-35, 16)]
                pygame.draw.polygon(screen, (165, 172, 182), _rot_poly(ax + 65, ay + 85, ac.angle, [(p[0] * 0.75, p[1] * 0.75) for p in wing]))
                pygame.draw.polygon(screen, (100, 116, 139), _rot_poly(ax, ay, ac.angle, wing))
                pygame.draw.polygon(screen, (15, 23, 42), _rot_poly(ax, ay, ac.angle, wing), 2)
                pygame.draw.polygon(screen, (71, 85, 105), _rot_poly(ax, ay, ac.angle, fuse))
                pygame.draw.polygon(screen, (15, 23, 42), _rot_poly(ax, ay, ac.angle, fuse), 2)
                pygame.draw.polygon(screen, (51, 65, 85), _rot_poly(ax, ay, ac.angle, tail))
            elif ac.kind == "bomber":
                wing = [(18, -7), (-26, -74), (-40, -70), (-4, -6), (-4, 6), (-40, 70), (-26, 74), (18, 7)]
                fuse = [(52, 0), (36, -8), (-48, -6), (-54, 0), (-48, 6), (36, 8)]
                pygame.draw.polygon(screen, (165, 172, 182), _rot_poly(ax + 95, ay + 125, ac.angle, [(p[0] * 0.78, p[1] * 0.78) for p in wing]))
                pygame.draw.polygon(screen, (51, 65, 85), _rot_poly(ax, ay, ac.angle, wing))
                pygame.draw.polygon(screen, (15, 23, 42), _rot_poly(ax, ay, ac.angle, wing), 2)
                pygame.draw.polygon(screen, (30, 41, 59), _rot_poly(ax, ay, ac.angle, fuse))
                pygame.draw.polygon(screen, (15, 23, 42), _rot_poly(ax, ay, ac.angle, fuse), 2)
            elif ac.kind == "chopper":
                fuse = [(26, 0), (14, -8), (-16, -7), (-38, -2), (-38, 2), (-16, 7), (14, 8)]
                stub = [(-4, -20), (8, -20), (8, 20), (-4, 20)]
                pygame.draw.polygon(screen, (165, 172, 182), _rot_poly(ax + 48, ay + 68, ac.angle, [(p[0] * 0.78, p[1] * 0.78) for p in fuse]))
                pygame.draw.polygon(screen, (51, 65, 85), _rot_poly(ax, ay, ac.angle, stub))
                pygame.draw.polygon(screen, (15, 23, 42), _rot_poly(ax, ay, ac.angle, stub), 1)
                pygame.draw.polygon(screen, (51, 65, 85), _rot_poly(ax, ay, ac.angle, fuse))
                pygame.draw.polygon(screen, (15, 23, 42), _rot_poly(ax, ay, ac.angle, fuse), 2)
                ra = ac.rotor_angle
                for b_ang in (ra, ra + math.pi / 2.0):
                    dx, dy = math.cos(b_ang) * 36, math.sin(b_ang) * 36
                    pygame.draw.line(screen, (148, 163, 184), (round(ax - dx), round(ay - dy)), (round(ax + dx), round(ay + dy)), 3)

    def _draw_orbitals(self, screen, orbitals, cam_left, cam_top):
        for orb in orbitals:
            ox = round(orb.x - cam_left)
            oy = round(orb.y - cam_top)
            pulse = 0.88 + math.sin(orb.life * 28.0) * 0.12
            rad = max(8, round(orb.radius * pulse))
            col_s = pygame.Surface((rad * 2, max(10, oy + 40)), pygame.SRCALPHA)
            pygame.draw.rect(col_s, (2, 132, 199, 145), (0, 0, rad * 2, max(10, oy + 40)))
            pygame.draw.rect(col_s, (255, 255, 255, 220), (rad // 2, 0, rad, max(10, oy + 40)))
            screen.blit(col_s, (ox - rad, -20))
            pygame.draw.circle(screen, (2, 132, 199), (ox, oy), rad, 4)
            pygame.draw.circle(screen, WHITE, (ox, oy), max(4, rad // 2))

    # ---------------- UI SCREENS ----------------
    def render_menu(self, screen, view_w, view_h, mouse_pos):
        screen.fill(WHITE)
        cx, cy = view_w // 2, view_h // 2
        self._text(screen, self.font_xl, "DEADLINE: SKYFIRE", TEXT_DARK, (cx, cy - 54), "center")

        surv_rect = pygame.Rect(cx - 122, cy - 12, 114, 40)
        sand_rect = pygame.Rect(cx + 8, cy - 12, 114, 40)
        self._button(screen, surv_rect, "Survival", mouse_pos, font=self.font_md_b)
        self._button(screen, sand_rect, "Sandbox", mouse_pos, font=self.font_md_b)

        ctrl_rect = self._text(screen, self.font_link, "Controls", LINK_BLUE, (cx, cy + 56), "center")
        return {"survival": surv_rect, "sandbox": sand_rect, "controls": ctrl_rect}

    def render_controls(self, screen, view_w, view_h, scroll_y, mouse_pos):
        screen.fill(WHITE)
        col_w = min(760, view_w - 40)
        x0 = (view_w - col_w) // 2
        y = 24 - scroll_y

        back_top = self._text(screen, self.font_link, "Back to Game", LINK_BLUE, (x0, y), "topleft")
        y += 34
        self._text(screen, self.font_xl, "Controls", TEXT_DARK, (x0, y), "topleft")
        y += 40

        controls_rows = [
            ("WASD / Arrow Keys", "Move"),
            ("Mouse Move", "Aim weapon or target airstrike corridor"),
            ("Left Click (Hold or Click)", "Fire gun or call selected air support"),
            ("1 - 9, 0 or Mouse Wheel", "Switch between all 10 primary weapons"),
            ("Q", "Deploy Auto-Turret"),
            ("E", "Call Orbital Ion Laser (follows cursor)"),
            ("Space / Shift", "Dash (brief invulnerability)"),
            ("B / Tab", "Open Armory & Upgrades"),
            ("H (Sandbox mode)", "Spawn Extra Mega-Horde"),
            ("M", "Mute / Unmute Sound Effects"),
            ("P / Esc", "Pause / Resume"),
        ]
        y = self._draw_table(screen, x0, y, col_w, ["Input", "Action"], [0.36, 0.64], controls_rows)
        y += 28
        self._text(screen, self.font_lg, "Weapons & Support", TEXT_DARK, (x0, y), "topleft")
        y += 32

        weapon_rows = []
        for defn in weapons.WEAPONS + weapons.TACTICALS:
            weapon_rows.append((defn["key"], weapons.CATEGORY_LABELS[defn["category"]], defn["name"], defn["desc"]))
        y = self._draw_table(screen, x0, y, col_w, ["Key", "Category", "Weapon", "Description"], [0.08, 0.22, 0.24, 0.46], weapon_rows)
        y += 22
        back_bot = self._text(screen, self.font_link, "Back to Game", LINK_BLUE, (x0, y), "topleft")
        total_h = y + 48 + scroll_y
        max_scroll = max(0, total_h - view_h)
        return {"back": back_top, "back_bottom": back_bot, "max_scroll": max_scroll}

    def _draw_table(self, screen, x, y, width, headers, fracs, rows):
        row_h = 30
        col_xs = [x]
        acc = x
        for f in fracs[:-1]:
            acc += round(width * f)
            col_xs.append(acc)
        col_xs.append(x + width)

        self._box(screen, pygame.Rect(x, y, width, row_h), (238, 238, 238), BORDER_GRAY, 1)
        for idx, h in enumerate(headers):
            pygame.draw.line(screen, BORDER_GRAY, (col_xs[idx], y), (col_xs[idx], y + row_h), 1)
            self._text(screen, self.font_sm, h, TEXT_DARK, (col_xs[idx] + 8, y + row_h // 2), "midleft")
        y += row_h

        for r in rows:
            self._box(screen, pygame.Rect(x, y, width, row_h), WHITE, BORDER_GRAY, 1)
            for idx, val in enumerate(r):
                pygame.draw.line(screen, BORDER_GRAY, (col_xs[idx], y), (col_xs[idx], y + row_h), 1)
                self._text(screen, self.font_sm if idx == 0 else self.font_md, val, TEXT_DARK, (col_xs[idx] + 8, y + row_h // 2), "midleft")
            y += row_h
        return y

    def render_hud(self, screen, state, wave_state, sprites, view_w, view_h, mouse_pos, muted):
        p = state.player
        rects = {"dock_slots": [], "sandbox_horde": None}

        # Top-left stats panel
        lp = pygame.Rect(10, 10, 290, 86)
        self._box(screen, lp, (255, 255, 255), BORDER_GRAY, 1)

        # HP
        self._text(screen, self.font_xs, "HP", TEXT_MUTED, (20, 24), "midleft")
        hp_track = pygame.Rect(68, 18, 152, 11)
        self._box(screen, hp_track, (229, 231, 235), BORDER_GRAY, 1)
        hp_w = round(150 * max(0.0, min(1.0, p.hp / p.max_hp)))
        if hp_w > 0:
            pygame.draw.rect(screen, (22, 163, 74), (69, 19, hp_w, 9))
        self._text(screen, self.font_mono, f"{math.ceil(p.hp)}/{p.max_hp}", TEXT_DARK, (288, 24), "midright")

        # Armor
        self._text(screen, self.font_xs, "ARMOR", TEXT_MUTED, (20, 44), "midleft")
        ar_track = pygame.Rect(68, 38, 152, 11)
        self._box(screen, ar_track, (229, 231, 235), BORDER_GRAY, 1)
        ar_w = round(150 * max(0.0, min(1.0, p.armor / p.max_armor)))
        if ar_w > 0:
            pygame.draw.rect(screen, (2, 132, 199), (69, 39, ar_w, 9))
        self._text(screen, self.font_mono, f"{math.ceil(p.armor)}/{p.max_armor}", TEXT_DARK, (288, 44), "midright")

        # Dash + Pills
        self._text(screen, self.font_xs, "DASH", TEXT_MUTED, (20, 72), "midleft")
        d_track = pygame.Rect(68, 67, 56, 8)
        self._box(screen, d_track, (229, 231, 235), BORDER_GRAY, 1)
        d_frac = max(0.0, min(1.0, 1.0 - p.dash_cooldown / p.dash_max_cooldown))
        if d_frac > 0:
            pygame.draw.rect(screen, (217, 119, 6), (69, 68, round(54 * d_frac), 6))

        cash_r = pygame.Rect(130, 62, 68, 20)
        self._box(screen, cash_r, (254, 243, 199), (217, 119, 6), 1)
        self._text(screen, self.font_mono, f"${state.stats.cash:,}", (146, 64, 14), cash_r.center, "center")

        pts_r = pygame.Rect(202, 62, 88, 20)
        self._box(screen, pts_r, (224, 242, 254), (2, 132, 199), 1)
        self._text(screen, self.font_mono, f"{state.stats.score:,}", (7, 89, 133), pts_r.center, "center")

        if state.stats.combo >= 3:
            cb_r = pygame.Rect(10, 100, 74, 20)
            self._box(screen, cb_r, (254, 226, 226), (220, 38, 38), 1)
            self._text(screen, self.font_mono, f"COMBO x{state.stats.combo}", (153, 27, 27), cb_r.center, "center")

        # Top-center Wave pill
        is_sb = state.mode == "sandbox"
        pill_w = 360 if is_sb else 260
        wp_rect = pygame.Rect((view_w - pill_w) // 2, 10, pill_w, 34)
        self._box(screen, wp_rect, WHITE, BORDER_GRAY, 1)
        mode_lbl = "SANDBOX" if is_sb else "SURVIVAL"
        mode_bg = (237, 233, 254) if is_sb else (229, 231, 235)
        self._box(screen, pygame.Rect(wp_rect.x + 8, wp_rect.y + 7, 74, 20), mode_bg, BORDER_GRAY, 1)
        self._text(screen, self.font_xs, mode_lbl, TEXT_DARK, (wp_rect.x + 45, wp_rect.y + 17), "center")
        self._text(screen, self.font_sm, f"WAVE {wave_state['number']}", TEXT_DARK, (wp_rect.x + 124, wp_rect.y + 17), "center")
        rem = len(state.zombies) + len(wave_state["queue"])
        self._text(screen, self.font_mono, f"{rem} LEFT", (185, 28, 28), (wp_rect.x + 198, wp_rect.y + 17), "center")

        if is_sb:
            sh_r = pygame.Rect(wp_rect.right - 108, wp_rect.y + 5, 100, 24)
            self._button(screen, sh_r, "+ HORDE [H]", mouse_pos, (220, 38, 38), (185, 28, 28), (127, 29, 29), WHITE, self.font_xs)
            rects["sandbox_horde"] = sh_r

        # Boss HP bar
        boss = next((z for z in state.zombies if z.type == "boss" and not z.dead), None)
        if boss:
            br = pygame.Rect((view_w - 340) // 2, 50, 340, 34)
            self._box(screen, br, WHITE, (185, 28, 28), 1)
            self._text(screen, self.font_xs, f"{boss.name}  ({int(boss.hp)}/{int(boss.max_hp)})", (185, 28, 28), (br.centerx, br.y + 9), "center")
            self._box(screen, pygame.Rect(br.x + 8, br.y + 18, 324, 10), (229, 231, 235), BORDER_GRAY, 1)
            pygame.draw.rect(screen, (220, 38, 38), (br.x + 9, br.y + 19, round(322 * max(0.0, boss.hp / boss.max_hp)), 8))

        # Top-right Minimap + buttons
        rp = pygame.Rect(view_w - 186, 10, 176, 162)
        self._box(screen, rp, WHITE, BORDER_GRAY, 1)
        self._render_minimap(state, (view_w, view_h))
        screen.blit(self.minimap_surf, (rp.x + 8, rp.y + 8))
        pygame.draw.rect(screen, BORDER_GRAY, (rp.x + 8, rp.y + 8, 160, 120), 1)

        arm_r = pygame.Rect(rp.x + 8, rp.y + 134, 62, 22)
        mut_r = pygame.Rect(rp.x + 74, rp.y + 134, 48, 22)
        pau_r = pygame.Rect(rp.x + 126, rp.y + 134, 42, 22)
        self._button(screen, arm_r, "ARM [B]", mouse_pos, (254, 243, 199), (253, 230, 138), (180, 83, 9), (120, 53, 15), self.font_xs)
        self._button(screen, mut_r, "MUTE" if muted else "SFX", mouse_pos, font=self.font_xs)
        self._button(screen, pau_r, "PAUSE", mouse_pos, font=self.font_xs)
        rects["armory"] = arm_r
        rects["mute"] = mut_r
        rects["pause"] = pau_r

        # Wave Banner
        if wave_state["banner_timer"] > 0:
            bw = 540
            b_rect = pygame.Rect((view_w - bw) // 2, round(view_h * 0.18), bw, 60)
            self._box(screen, b_rect, WHITE, BORDER_DARK, 1)
            self._text(screen, self.font_xl, wave_state["banner_title"], TEXT_DARK, (b_rect.centerx, b_rect.y + 20), "center")
            self._text(screen, self.font_sm, wave_state["banner_sub"], TEXT_MUTED, (b_rect.centerx, b_rect.y + 44), "center")

        # Bottom Active Hint + Weapon Dock
        defn = weapons.WEAPON_BY_ID.get(p.active_weapon_id)
        if defn:
            lv = p.weapon_levels.get(p.active_weapon_id, 1)
            act = "CLICK TO CALL AIRSTRIKE AT CURSOR" if defn["category"] == "air" else "HOLD CLICK TO FIRE"
            hint = f"{defn['name'].upper()} - LV {lv} - {act}"
            hw = max(320, len(hint) * 7 + 24)
            hr = pygame.Rect((view_w - hw) // 2, view_h - 92, hw, 20)
            self._box(screen, hr, WHITE, BORDER_GRAY, 1)
            self._text(screen, self.font_xs, hint, TEXT_DARK, hr.center, "center")

        all_slots = [(w, False) for w in weapons.WEAPONS] + [(t, True) for t in weapons.TACTICALS]
        slot_w, slot_h, gap = 68, 56, 5
        total_w = len(all_slots) * slot_w + (len(all_slots) - 1) * gap + 22
        dock_x = max(8, (view_w - total_w) // 2)
        dock_y = view_h - 68
        dock_bg = pygame.Rect(dock_x - 6, dock_y - 5, total_w + 12, slot_h + 10)
        self._box(screen, dock_bg, WHITE, BORDER_GRAY, 1)

        cx = dock_x
        for idx, (sdef, is_tac) in enumerate(all_slots):
            if idx == len(weapons.WEAPONS):
                pygame.draw.line(screen, BORDER_GRAY, (cx + 4, dock_y + 4), (cx + 4, dock_y + slot_h - 4), 1)
                cx += 10
            sr = pygame.Rect(cx, dock_y, slot_w, slot_h)
            is_act = (not is_tac) and p.active_weapon_id == sdef["id"]
            if is_act:
                bg = (254, 243, 199) if sdef["category"] == "guns" else ((224, 242, 254) if sdef["category"] == "heavy" else (209, 250, 229))
                b_col, bw_px = sdef["color"], 2
            else:
                bg = BTN_HOVER if sr.collidepoint(mouse_pos) else (245, 245, 245)
                b_col = (109, 40, 217) if is_tac else BORDER_GRAY
                bw_px = 1
            self._box(screen, sr, bg, b_col, bw_px)

            # Selective cooldown overlay (ONLY for heavy/air/tactical with show_cooldown=True)
            if sdef.get("show_cooldown"):
                cd = p.weapon_cooldowns.get(sdef["id"], 0.0)
                max_cd = p.weapon_max_cooldowns.get(sdef["id"], 1.0)
                if cd > 0.01 and max_cd > 0:
                    fill_h = round(slot_h * min(1.0, cd / max_cd))
                    ov = pygame.Surface((slot_w - 2, fill_h), pygame.SRCALPHA)
                    ov.fill((0, 0, 0, 72))
                    screen.blit(ov, (sr.x + 1, sr.bottom - fill_h - 1))

            self._text(screen, self.font_xs, sdef["key"], TEXT_MUTED, (sr.x + 4, sr.y + 2), "topleft")
            if is_tac:
                cost_txt = "FREE" if is_sb else f"${sdef['survival_cost']}"
                self._text(screen, self.font_xs, cost_txt, (146, 64, 14), (sr.right - 4, sr.y + 2), "topright")

            icon_s = sprites.get_weapon_icon(sdef["id"], 44, 22)
            if icon_s is not None:
                ir = icon_s.get_rect(center=(sr.centerx, sr.y + 23))
                screen.blit(icon_s, ir)
            else:
                self._draw_slot_vector(screen, sdef["id"], sdef["color"], sr.centerx, sr.y + 23)

            self._text(screen, self.font_xs, sdef["short_name"], TEXT_DARK, (sr.centerx, sr.y + 41), "center")
            lv = p.weapon_levels.get(sdef["id"], 1)
            pip_x0 = sr.centerx - 19
            for k in range(weapons.MAX_LEVEL):
                pcol = (180, 83, 9) if k < lv else (204, 204, 204)
                pygame.draw.rect(screen, pcol, (pip_x0 + k * 8, sr.bottom - 7, 6, 3))

            rects["dock_slots"].append((sdef["id"], is_tac, sr))
            cx += slot_w + gap

        return rects

    def _draw_slot_vector(self, surf, wid, col, cx, cy):
        if wid == "a10":
            pts = [(cx, cy - 8), (cx + 3, cy - 2), (cx + 12, cy), (cx + 3, cy + 3), (cx + 2, cy + 8), (cx - 2, cy + 8), (cx - 3, cy + 3), (cx - 12, cy), (cx - 3, cy - 2)]
            pygame.draw.polygon(surf, col, pts)
        elif wid == "bomber":
            pts = [(cx, cy - 8), (cx + 3, cy - 2), (cx + 13, cy + 4), (cx + 3, cy + 3), (cx + 2, cy + 8), (cx - 2, cy + 8), (cx - 3, cy + 3), (cx - 13, cy + 4), (cx - 3, cy - 2)]
            pygame.draw.polygon(surf, col, pts)
        elif wid == "chopper":
            pygame.draw.line(surf, col, (cx - 11, cy - 6), (cx + 11, cy - 6), 2)
            pygame.draw.line(surf, col, (cx, cy - 6), (cx, cy - 2), 2)
            pygame.draw.ellipse(surf, col, (cx - 7, cy - 2, 14, 7))
        elif wid == "turret":
            pygame.draw.circle(surf, col, (cx - 2, cy), 5)
            pygame.draw.line(surf, col, (cx + 2, cy - 2), (cx + 10, cy - 2), 2)
            pygame.draw.line(surf, col, (cx + 2, cy + 2), (cx + 10, cy + 2), 2)
        else:  # orbital
            pygame.draw.line(surf, col, (cx, cy - 8), (cx, cy + 5), 3)
            pygame.draw.line(surf, col, (cx - 8, cy + 6), (cx + 8, cy + 6), 2)

    def _render_minimap(self, state, view_dims):
        mm = self.minimap_surf
        mm.fill((243, 244, 246))
        sx = 160.0 / state.map.width
        sy = 120.0 / state.map.height

        for ob in state.map.obstacles:
            pygame.draw.rect(
                mm,
                (100, 116, 139),
                (round(ob["x"] * sx), round(ob["y"] * sy), max(2, round(ob["w"] * sx)), max(2, round(ob["h"] * sy))),
            )
        for pk in state.pickups:
            pygame.draw.rect(mm, (22, 163, 74), (round(pk.x * sx) - 1, round(pk.y * sy) - 1, 3, 3))
        for t in state.turrets:
            pygame.draw.rect(mm, (109, 40, 217), (round(t.x * sx) - 1, round(t.y * sy) - 1, 3, 3))
        for z in state.zombies:
            if z.dead:
                continue
            if z.type == "boss":
                pygame.draw.circle(mm, (180, 83, 9), (round(z.x * sx), round(z.y * sy)), 4)
            else:
                pygame.draw.rect(mm, (220, 38, 38), (round(z.x * sx) - 1, round(z.y * sy) - 1, 2, 2))
        for ac in state.aircraft:
            pygame.draw.circle(mm, (4, 120, 87), (round(ac.x * sx), round(ac.y * sy)), 3)

        pygame.draw.circle(mm, (29, 78, 216), (round(state.player.x * sx), round(state.player.y * sy)), 3)

    # ---------------- MODALS ----------------
    def render_armory(self, screen, state, armory_filter, scroll_y, sprites, view_w, view_h, mouse_pos):
        dim = pygame.Surface((view_w, view_h), pygame.SRCALPHA)
        dim.fill((240, 242, 245, 220))
        screen.blit(dim, (0, 0))

        mw = min(940, view_w - 40)
        mh = min(640, view_h - 40)
        mr = pygame.Rect((view_w - mw) // 2, (view_h - mh) // 2, mw, mh)
        self._box(screen, mr, WHITE, BORDER_DARK, 1)

        self._text(screen, self.font_lg, "ARMORY & AIR SUPPORT", TEXT_DARK, (mr.x + 18, mr.y + 16), "topleft")
        self._text(screen, self.font_sm, "Equip weapons for free or upgrade stats & squadron count.", TEXT_MUTED, (mr.x + 18, mr.y + 42), "topleft")

        wallet = pygame.Rect(mr.right - 178, mr.y + 14, 160, 44)
        self._box(screen, wallet, (254, 243, 199), (180, 83, 9), 1)
        self._text(screen, self.font_xs, "AVAILABLE FUNDS", (120, 53, 15), (wallet.right - 8, wallet.y + 6), "topright")
        self._text(screen, self.font_lg, f"${state.stats.cash:,}", (146, 64, 14), (wallet.right - 8, wallet.y + 20), "topright")

        rects = {"tabs": [], "equips": [], "upgrades": [], "deploys": []}
        tabs = [("all", "All Arsenal"), ("guns", "Guns"), ("heavy", "Heavy & Sci-Fi"), ("air", "Airplanes"), ("tactical", "Tactical")]
        tx = mr.x + 18
        for cat, label in tabs:
            tw = max(78, len(label) * 8 + 18)
            tr = pygame.Rect(tx, mr.y + 68, tw, 28)
            is_act = armory_filter == cat
            self._button(screen, tr, label, mouse_pos, TEXT_DARK if is_act else BTN_BG, TEXT_DARK if is_act else BTN_HOVER, BORDER_DARK, WHITE if is_act else TEXT_DARK)
            rects["tabs"].append((cat, tr))
            tx += tw + 6

        med_r = pygame.Rect(mr.right - 270, mr.y + 68, 118, 28)
        arm_r = pygame.Rect(mr.right - 144, mr.y + 68, 126, 28)
        self._button(screen, med_r, "+ Medkit ($120)", mouse_pos, (236, 253, 245), (209, 250, 229), (4, 120, 87), (6, 95, 70))
        self._button(screen, arm_r, "+ Armor ($180)", mouse_pos, (236, 253, 245), (209, 250, 229), (4, 120, 87), (6, 95, 70))
        rects["medkit"] = med_r
        rects["armor"] = arm_r

        # Grid area
        grid_r = pygame.Rect(mr.x + 18, mr.y + 106, mw - 36, mh - 160)
        old_clip = screen.get_clip()
        screen.set_clip(grid_r)

        items = [d for d in (weapons.WEAPONS + weapons.TACTICALS) if armory_filter == "all" or d["category"] == armory_filter]
        cols = 3 if mw >= 840 else 2
        card_gap = 10
        card_w = (grid_r.width - card_gap * (cols - 1)) // cols
        card_h = 152
        p = state.player

        for i, defn in enumerate(items):
            r_idx, c_idx = i // cols, i % cols
            cx = grid_r.x + c_idx * (card_w + card_gap)
            cy = grid_r.y + r_idx * (card_h + card_gap) - scroll_y
            cr = pygame.Rect(cx, cy, card_w, card_h)
            if cr.bottom < grid_r.top or cr.top > grid_r.bottom:
                continue

            lv = p.weapon_levels.get(defn["id"], 1)
            stats = weapons.get_scaled_stats(defn, lv)
            cost = 0 if state.mode == "sandbox" else weapons.get_upgrade_cost(defn, lv)
            is_max = lv >= weapons.MAX_LEVEL
            is_eq = p.active_weapon_id == defn["id"]

            self._box(screen, cr, (254, 252, 232) if is_eq else (250, 250, 250), TEXT_DARK if is_eq else BORDER_GRAY, 2 if is_eq else 1)

            icon_box = pygame.Rect(cr.x + 10, cr.y + 10, 46, 30)
            self._box(screen, icon_box, (229, 231, 235), (204, 204, 204), 1)
            icon_s = sprites.get_weapon_icon(defn["id"], 40, 24)
            if icon_s is not None:
                screen.blit(icon_s, icon_s.get_rect(center=icon_box.center))
            else:
                self._draw_slot_vector(screen, defn["id"], defn["color"], icon_box.centerx, icon_box.centery)

            self._text(screen, self.font_sm, defn["name"], TEXT_DARK, (cr.x + 64, cr.y + 11), "topleft")
            self._text(screen, self.font_xs, f"{weapons.CATEGORY_LABELS[defn['category']]} - [{defn['key']}]", TEXT_MUTED, (cr.x + 64, cr.y + 27), "topleft")
            lv_r = pygame.Rect(cr.right - 58, cr.y + 10, 48, 20)
            self._box(screen, lv_r, (229, 231, 235), BORDER_GRAY, 1)
            self._text(screen, self.font_xs, f"LV {lv}/{weapons.MAX_LEVEL}", TEXT_DARK, lv_r.center, "center")

            # Short description (up to 2 lines)
            desc = defn["desc"]
            line1 = desc[:48]
            line2 = desc[48:96]
            if len(desc) > 96:
                line2 = line2[:45] + "..."
            self._text(screen, self.font_xs, line1, TEXT_MUTED, (cr.x + 10, cr.y + 48), "topleft")
            if line2:
                self._text(screen, self.font_xs, line2, TEXT_MUTED, (cr.x + 10, cr.y + 62), "topleft")

            # Stats bar
            sbox = pygame.Rect(cr.x + 10, cr.y + 82, cr.width - 20, 26)
            self._box(screen, sbox, (240, 240, 240), (204, 204, 204), 1)
            stat_line = self._format_stats_line(defn, stats)
            self._text(screen, self.font_xs, stat_line, TEXT_DARK, (sbox.x + 8, sbox.centery), "midleft")

            # Action buttons
            bw = (cr.width - 28) // 2
            eq_r = pygame.Rect(cr.x + 10, cr.bottom - 34, bw, 24)
            up_r = pygame.Rect(eq_r.right + 8, cr.bottom - 34, bw, 24)

            if defn["category"] == "tactical":
                self._button(screen, eq_r, f"KEY [{defn['key']}]", mouse_pos, font=self.font_xs)
                if grid_r.collidepoint(eq_r.center):
                    rects["deploys"].append((defn["id"], eq_r))
            else:
                lbl = "EQUIPPED" if is_eq else f"EQUIP [{defn['key']}]"
                self._button(
                    screen,
                    eq_r,
                    lbl,
                    mouse_pos,
                    (209, 250, 229) if is_eq else BTN_BG,
                    (209, 250, 229) if is_eq else BTN_HOVER,
                    (4, 120, 87) if is_eq else BORDER_DARK,
                    (6, 95, 70) if is_eq else TEXT_DARK,
                    self.font_xs,
                )
                if grid_r.collidepoint(eq_r.center):
                    rects["equips"].append((defn["id"], eq_r))

            up_lbl = "MAX LEVEL" if is_max else ("UPGRADE (FREE)" if state.mode == "sandbox" else f"UPGRADE (${cost})")
            can_up = (not is_max) and state.stats.cash >= cost
            self._button(
                screen,
                up_r,
                up_lbl,
                mouse_pos,
                (254, 243, 199) if can_up else (229, 231, 235),
                (253, 230, 138) if can_up else (229, 231, 235),
                (180, 83, 9) if can_up else (187, 187, 187),
                (120, 53, 15) if can_up else (119, 119, 119),
                self.font_xs,
            )
            if can_up and grid_r.collidepoint(up_r.center):
                rects["upgrades"].append((defn["id"], up_r))

        screen.set_clip(old_clip)

        total_rows = (len(items) + cols - 1) // cols
        content_h = total_rows * (card_h + card_gap)
        rects["max_scroll"] = max(0, content_h - grid_r.height)

        close_r = pygame.Rect(mr.right - 210, mr.bottom - 42, 192, 30)
        self._button(screen, close_r, "BACK TO BATTLE [B / ESC]", mouse_pos, font=self.font_sm)
        self._text(screen, self.font_xs, "Tip: Upgrading Airplanes calls multi-plane squadrons!", TEXT_MUTED, (mr.x + 18, mr.bottom - 27), "midleft")
        rects["close"] = close_r
        return rects

    def _format_stats_line(self, defn, stats):
        if defn["category"] == "air":
            if defn["id"] == "chopper":
                return f"Cannon: {stats['damage']}   Rockets: {stats['rocket_damage']}   Dur: {stats['duration']}s"
            return f"Damage: {stats['damage']}   Planes: {stats['planes']}x   CD: {stats['cooldown']}s"
        if defn["id"] == "turret":
            return f"Damage: {stats['damage']}   Rate: {stats['fire_rate']}/s   Max: {stats['max_active']}"
        if defn["id"] == "orbital":
            return f"DPS: {stats['damage_per_sec']}   Radius: {stats['radius']}px   Dur: {stats['duration']}s"
        extra = (
            f"Blast: {stats['blast_radius']}px"
            if stats["blast_radius"]
            else (
                f"Chains: {stats['chain_count']}"
                if stats["chain_count"]
                else (f"Pellets: {stats['pellets']}" if stats["pellets"] > 1 else f"Pierce: {stats['pierce']}")
            )
        )
        return f"Dmg: {stats['damage']}   Rate: {stats['fire_rate']}/s   {extra}"

    def render_pause(self, screen, view_w, view_h, mouse_pos):
        dim = pygame.Surface((view_w, view_h), pygame.SRCALPHA)
        dim.fill((240, 242, 245, 220))
        screen.blit(dim, (0, 0))

        box = pygame.Rect((view_w - 360) // 2, (view_h - 310) // 2, 360, 310)
        self._box(screen, box, WHITE, BORDER_DARK, 1)
        self._text(screen, self.font_lg, "COMBAT PAUSED", TEXT_DARK, (box.centerx, box.y + 30), "center")

        r_res = pygame.Rect(box.x + 36, box.y + 66, 288, 36)
        r_arm = pygame.Rect(box.x + 36, box.y + 110, 288, 36)
        r_rst = pygame.Rect(box.x + 36, box.y + 154, 288, 36)
        r_mnu = pygame.Rect(box.x + 36, box.y + 198, 288, 36)
        self._button(screen, r_res, "RESUME BATTLE", mouse_pos, font=self.font_sm)
        self._button(screen, r_arm, "OPEN ARMORY [B]", mouse_pos, font=self.font_sm)
        self._button(screen, r_rst, "RESTART RUN", mouse_pos, font=self.font_sm)
        self._button(screen, r_mnu, "MAIN MENU", mouse_pos, WHITE, BTN_HOVER, BORDER_GRAY, TEXT_MUTED, self.font_sm)
        r_ctl = self._text(screen, self.font_link, "Controls", LINK_BLUE, (box.centerx, box.y + 266), "center")
        return {"resume": r_res, "armory": r_arm, "restart": r_rst, "menu": r_mnu, "controls": r_ctl}

    def render_gameover(self, screen, state, wave_num, records, view_w, view_h, mouse_pos):
        dim = pygame.Surface((view_w, view_h), pygame.SRCALPHA)
        dim.fill((240, 242, 245, 220))
        screen.blit(dim, (0, 0))

        box = pygame.Rect((view_w - 420) // 2, (view_h - 380) // 2, 420, 380)
        self._box(screen, box, WHITE, BORDER_DARK, 1)
        self._text(screen, self.font_xs, "PERIMETER OVERRUN", (185, 28, 28), (box.centerx, box.y + 22), "center")
        self._text(screen, self.font_lg, "MISSION ENDED", TEXT_DARK, (box.centerx, box.y + 44), "center")

        top_wid = max(state.stats.weapon_kills, key=lambda k: state.stats.weapon_kills[k], default="rifle")
        top_defn = weapons.WEAPON_BY_ID.get(top_wid) or weapons.TACTICAL_BY_ID.get(top_wid)
        top_name = f"{top_defn['short_name']} ({state.stats.weapon_kills.get(top_wid, 0)})" if top_defn else "M4 Rifle"

        cells = [
            ("Wave Reached", str(wave_num)),
            ("Zombies Eliminated", f"{state.stats.kills:,}"),
            ("Final Score", f"{state.stats.score:,}"),
            ("Best Combo", f"x{state.stats.max_combo}"),
            ("Top Weapon", top_name),
            ("Best Record", f"W{records['best_wave']} - {records['best_score']:,}"),
        ]
        cw, ch = 176, 44
        for idx, (lbl, val) in enumerate(cells):
            col, row = idx % 2, idx // 2
            cr = pygame.Rect(box.x + 28 + col * (cw + 12), box.y + 72 + row * (ch + 8), cw, ch)
            self._box(screen, cr, (245, 245, 245), (204, 204, 204), 1)
            self._text(screen, self.font_xs, lbl, TEXT_MUTED, (cr.centerx, cr.y + 12), "center")
            self._text(screen, self.font_sm, val, TEXT_DARK, (cr.centerx, cr.y + 30), "center")

        r_ag = pygame.Rect(box.x + 28, box.y + 236, 364, 36)
        r_sw = pygame.Rect(box.x + 28, box.y + 280, 364, 36)
        r_mn = pygame.Rect(box.x + 28, box.y + 324, 364, 36)
        sw_lbl = "TRY SANDBOX CHAOS" if state.mode == "survival" else "PLAY SURVIVAL WAVES"
        self._button(screen, r_ag, "PLAY AGAIN", mouse_pos, font=self.font_sm)
        self._button(screen, r_sw, sw_lbl, mouse_pos, font=self.font_sm)
        self._button(screen, r_mn, "MAIN MENU", mouse_pos, WHITE, BTN_HOVER, BORDER_GRAY, TEXT_MUTED, self.font_sm)
        return {"again": r_ag, "switch": r_sw, "menu": r_mn}
