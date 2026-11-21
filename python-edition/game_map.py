"""Arena map, obstacles, collision physics, flow-field pathfinding, and decals."""

import heapq
import math
import random
from array import array

WORLD_W = 2400
WORLD_H = 1800
NAV_CELL = 40
NAV_COLS = math.ceil(WORLD_W / NAV_CELL)
NAV_ROWS = math.ceil(WORLD_H / NAV_CELL)
NAV_TOTAL = NAV_COLS * NAV_ROWS
NAV_INF = 0x3FFFFFFF

_DIRS_C = (1, -1, 0, 0, 1, 1, -1, -1)
_DIRS_R = (0, 0, 1, -1, 1, -1, 1, -1)
_DIRS_COST = (10, 10, 10, 10, 14, 14, 14, 14)


def create_obstacles(map_id="outpost"):
    if map_id == "ruins":
        return [
            # Corner skyscraper ruined foundations (L-shaped urban barricades)
            {"x": 360, "y": 300, "w": 260, "h": 54, "type": "building", "color": (51, 65, 85)},
            {"x": 360, "y": 354, "w": 54, "h": 170, "type": "building", "color": (51, 65, 85)},
            {"x": 1780, "y": 300, "w": 260, "h": 54, "type": "building", "color": (51, 65, 85)},
            {"x": 1986, "y": 354, "w": 54, "h": 170, "type": "building", "color": (51, 65, 85)},
            {"x": 360, "y": 1446, "w": 260, "h": 54, "type": "building", "color": (51, 65, 85)},
            {"x": 360, "y": 1276, "w": 54, "h": 170, "type": "building", "color": (51, 65, 85)},
            {"x": 1780, "y": 1446, "w": 260, "h": 54, "type": "building", "color": (51, 65, 85)},
            {"x": 1986, "y": 1276, "w": 54, "h": 170, "type": "building", "color": (51, 65, 85)},
            # Inner street commercial buildings & brick store ruins
            {"x": 720, "y": 560, "w": 170, "h": 65, "type": "building", "color": (71, 85, 105)},
            {"x": 1510, "y": 560, "w": 170, "h": 65, "type": "building", "color": (71, 85, 105)},
            {"x": 720, "y": 1175, "w": 170, "h": 65, "type": "building", "color": (71, 85, 105)},
            {"x": 1510, "y": 1175, "w": 170, "h": 65, "type": "building", "color": (71, 85, 105)},
            # Center highway bus barricades (destroyed quarantine transit)
            {"x": 1110, "y": 360, "w": 180, "h": 52, "type": "wreck_bus", "color": (120, 53, 15)},
            {"x": 1110, "y": 1388, "w": 180, "h": 52, "type": "wreck_bus", "color": (120, 53, 15)},
            # Flanking destroyed car wrecks
            {"x": 310, "y": 840, "w": 56, "h": 120, "type": "car_wreck", "color": (133, 77, 14)},
            {"x": 2034, "y": 840, "w": 56, "h": 120, "type": "car_wreck", "color": (133, 77, 14)},
            # Biohazard toxic drum clusters & sandbag checkpoints
            {"x": 920, "y": 865, "w": 54, "h": 70, "type": "biohazard", "color": (77, 124, 15)},
            {"x": 1426, "y": 865, "w": 54, "h": 70, "type": "biohazard", "color": (77, 124, 15)},
            {"x": 1140, "y": 700, "w": 120, "h": 42, "type": "sandbag", "color": (100, 116, 139)},
            {"x": 1140, "y": 1058, "w": 120, "h": 42, "type": "sandbag", "color": (100, 116, 139)},
        ]

    return [
        # Four outer quadrant concrete L-bunkers
        {"x": 460, "y": 360, "w": 170, "h": 42, "type": "concrete", "color": (100, 116, 139)},
        {"x": 460, "y": 402, "w": 42, "h": 115, "type": "concrete", "color": (100, 116, 139)},
        {"x": 1770, "y": 360, "w": 170, "h": 42, "type": "concrete", "color": (100, 116, 139)},
        {"x": 1898, "y": 402, "w": 42, "h": 115, "type": "concrete", "color": (100, 116, 139)},
        {"x": 460, "y": 1398, "w": 170, "h": 42, "type": "concrete", "color": (100, 116, 139)},
        {"x": 460, "y": 1283, "w": 42, "h": 115, "type": "concrete", "color": (100, 116, 139)},
        {"x": 1770, "y": 1398, "w": 170, "h": 42, "type": "concrete", "color": (100, 116, 139)},
        {"x": 1898, "y": 1283, "w": 42, "h": 115, "type": "concrete", "color": (100, 116, 139)},
        # Mid-ring military crates
        {"x": 850, "y": 540, "w": 130, "h": 48, "type": "crate", "color": (92, 107, 87)},
        {"x": 1420, "y": 540, "w": 130, "h": 48, "type": "crate", "color": (92, 107, 87)},
        {"x": 850, "y": 1212, "w": 130, "h": 48, "type": "crate", "color": (92, 107, 87)},
        {"x": 1420, "y": 1212, "w": 130, "h": 48, "type": "crate", "color": (92, 107, 87)},
        # Flanking roadblocks
        {"x": 320, "y": 840, "w": 56, "h": 120, "type": "barrier", "color": (107, 114, 128)},
        {"x": 2024, "y": 840, "w": 56, "h": 120, "type": "barrier", "color": (107, 114, 128)},
        {"x": 1140, "y": 250, "w": 120, "h": 52, "type": "barrier", "color": (107, 114, 128)},
        {"x": 1140, "y": 1498, "w": 120, "h": 52, "type": "barrier", "color": (107, 114, 128)},
        # Inner plaza sandbags
        {"x": 930, "y": 860, "w": 44, "h": 80, "type": "sandbag", "color": (120, 113, 108)},
        {"x": 1426, "y": 860, "w": 44, "h": 80, "type": "sandbag", "color": (120, 113, 108)},
    ]


def _draw_dashed_line(pygame, surf, color, p1, p2, width=3, dash=24, gap=18):
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
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


class GameMap:
    def __init__(self, map_id="outpost"):
        self.width = WORLD_W
        self.height = WORLD_H
        self.map_id = map_id
        self.obstacles = create_obstacles(map_id)
        self.terrain_surface = None
        self.decal_surface = None

        # Precompute flow-field navigation grid
        self.nav_blocked = bytearray(NAV_TOTAL)
        self.nav_dist = array("i", [NAV_INF] * NAV_TOTAL)
        self.nav_flow_x = array("f", [0.0] * NAV_TOTAL)
        self.nav_flow_y = array("f", [0.0] * NAV_TOTAL)
        self.nav_goal_cell = -1

        for r in range(NAV_ROWS):
            cy = r * NAV_CELL + NAV_CELL * 0.5
            for c in range(NAV_COLS):
                cx = c * NAV_CELL + NAV_CELL * 0.5
                self.nav_blocked[r * NAV_COLS + c] = 1 if self._is_world_blocked(cx, cy, 14) else 0

    def _is_world_blocked(self, x, y, pad):
        if x < 24 + pad or x > WORLD_W - 24 - pad or y < 24 + pad or y > WORLD_H - 24 - pad:
            return True
        for ob in self.obstacles:
            if (
                ob["x"] - pad <= x <= ob["x"] + ob["w"] + pad
                and ob["y"] - pad <= y <= ob["y"] + ob["h"] + pad
            ):
                return True
        return False

    def build_surfaces(self):
        import pygame

        surf = pygame.Surface((WORLD_W, WORLD_H))
        if self.map_id == "ruins":
            surf.fill((30, 36, 44))
            for gx in range(0, WORLD_W + 1, 100):
                pygame.draw.line(surf, (51, 65, 85), (gx, 0), (gx, WORLD_H), 1)
            for gy in range(0, WORLD_H + 1, 100):
                pygame.draw.line(surf, (51, 65, 85), (0, gy), (WORLD_W, gy), 1)
            pygame.draw.rect(surf, (45, 55, 72), (0, WORLD_H // 2 - 160, WORLD_W, 320))
            pygame.draw.rect(surf, (45, 55, 72), (WORLD_W // 2 - 160, 0, 320, WORLD_H))
            cx, cy = WORLD_W // 2, WORLD_H // 2
            pygame.draw.rect(surf, (37, 47, 62), (cx - 200, cy - 200, 400, 400))
            caution_color = (202, 138, 4)
            _draw_dashed_line(pygame, surf, caution_color, (0, cy), (cx - 210, cy), 4, 32, 24)
            _draw_dashed_line(pygame, surf, caution_color, (cx + 210, cy), (WORLD_W, cy), 4, 32, 24)
            _draw_dashed_line(pygame, surf, caution_color, (cx, 0), (cx, cy - 210), 4, 32, 24)
            _draw_dashed_line(pygame, surf, caution_color, (cx, cy + 210), (cx, WORLD_H), 4, 32, 24)
            pygame.draw.rect(surf, (220, 38, 38), (10, 10, WORLD_W - 20, WORLD_H - 20), 6)
            decal_surf = pygame.Surface((WORLD_W, WORLD_H), pygame.SRCALPHA)
            return surf, decal_surf

        surf.fill((236, 239, 243))

        # Subtle sector grid
        for gx in range(0, WORLD_W + 1, 80):
            pygame.draw.line(surf, (220, 223, 230), (gx, 0), (gx, WORLD_H), 1)
        for gy in range(0, WORLD_H + 1, 80):
            pygame.draw.line(surf, (220, 223, 230), (0, gy), (WORLD_W, gy), 1)

        # Crossroad avenues
        pygame.draw.rect(surf, (223, 228, 236), (0, WORLD_H // 2 - 150, WORLD_W, 300))
        pygame.draw.rect(surf, (223, 228, 236), (WORLD_W // 2 - 150, 0, 300, WORLD_H))

        # Central helipad command plaza
        cx, cy = WORLD_W // 2, WORLD_H // 2
        pygame.draw.circle(surf, (213, 219, 229), (cx, cy), 175)
        for seg in range(24):
            a0 = (seg / 24.0) * math.tau
            a1 = a0 + (math.tau / 24.0) * 0.58
            pts = [
                (cx + math.cos(a0) * 155, cy + math.sin(a0) * 155),
                (cx + math.cos(a1) * 155, cy + math.sin(a1) * 155),
            ]
            pygame.draw.line(surf, (100, 116, 139), pts[0], pts[1], 3)

        # Helipad 'H'
        h_color = (165, 175, 189)
        pygame.draw.rect(surf, h_color, (cx - 38, cy - 42, 14, 84))
        pygame.draw.rect(surf, h_color, (cx + 24, cy - 42, 14, 84))
        pygame.draw.rect(surf, h_color, (cx - 24, cy - 7, 48, 14))

        # Dashed road markings
        road_color = (180, 120, 65)
        _draw_dashed_line(pygame, surf, road_color, (0, cy), (cx - 190, cy), 4, 28, 22)
        _draw_dashed_line(pygame, surf, road_color, (cx + 190, cy), (WORLD_W, cy), 4, 28, 22)
        _draw_dashed_line(pygame, surf, road_color, (cx, 0), (cx, cy - 190), 4, 28, 22)
        _draw_dashed_line(pygame, surf, road_color, (cx, cy + 190), (cx, WORLD_H), 4, 28, 22)

        # Deterministic surface grit
        seed = 1337
        for _ in range(650):
            seed = (seed * 16807) % 2147483647
            rx = int(((seed - 1) / 2147483646.0) * WORLD_W)
            seed = (seed * 16807) % 2147483647
            ry = int(((seed - 1) / 2147483646.0) * WORLD_H)
            seed = (seed * 16807) % 2147483647
            rr = 1 + int(((seed - 1) / 2147483646.0) * 3)
            col = (248, 250, 252) if seed % 2 == 0 else (200, 206, 215)
            pygame.draw.circle(surf, col, (rx, ry), rr)

        # Arena perimeter border
        pygame.draw.rect(surf, (185, 28, 28), (10, 10, WORLD_W - 20, WORLD_H - 20), 6)

        if pygame.display.get_surface():
            surf = surf.convert()
        self.terrain_surface = surf
        self.decal_surface = pygame.Surface((WORLD_W, WORLD_H), pygame.SRCALPHA)

    def clear_decals(self):
        if self.decal_surface is not None:
            self.decal_surface.fill((0, 0, 0, 0))

    def add_blood_decal(self, x, y, color=(153, 27, 27, 115), radius=14):
        if self.decal_surface is None:
            return
        import pygame

        for _ in range(4):
            ang = random.random() * math.tau
            dist = random.random() * radius * 0.7
            br = max(2, round(radius * (0.25 + random.random() * 0.45)))
            pygame.draw.circle(
                self.decal_surface,
                color,
                (round(x + math.cos(ang) * dist), round(y + math.sin(ang) * dist)),
                br,
            )

    def add_scorch_decal(self, x, y, radius=48):
        if self.decal_surface is None:
            return
        import pygame

        r = max(8, round(radius))
        ix, iy = round(x), round(y)
        pygame.draw.circle(self.decal_surface, (55, 50, 48, 52), (ix, iy), r)
        pygame.draw.circle(self.decal_surface, (30, 30, 35, 95), (ix, iy), max(4, round(r * 0.55)))

    def add_casing_decal(self, x, y, angle=0.0):
        if self.decal_surface is None:
            return
        import pygame

        dx = math.cos(angle) * 2.5
        dy = math.sin(angle) * 2.5
        pygame.draw.line(
            self.decal_surface,
            (146, 64, 14, 165),
            (round(x - dx), round(y - dy)),
            (round(x + dx), round(y + dy)),
            2,
        )

    def resolve_circle_obstacles(self, entity):
        r = getattr(entity, "radius", 14)
        pad = 20
        if entity.x < pad + r:
            entity.x = pad + r
        elif entity.x > WORLD_W - pad - r:
            entity.x = WORLD_W - pad - r
        if entity.y < pad + r:
            entity.y = pad + r
        elif entity.y > WORLD_H - pad - r:
            entity.y = WORLD_H - pad - r

        for ob in self.obstacles:
            ox, oy, ow, oh = ob["x"], ob["y"], ob["w"], ob["h"]
            closest_x = ox if entity.x < ox else (ox + ow if entity.x > ox + ow else entity.x)
            closest_y = oy if entity.y < oy else (oy + oh if entity.y > oy + oh else entity.y)
            dx = entity.x - closest_x
            dy = entity.y - closest_y
            dist_sq = dx * dx + dy * dy
            if dist_sq < r * r:
                if dist_sq > 0.0001:
                    dist = math.sqrt(dist_sq)
                    push = r - dist
                    entity.x += (dx / dist) * push
                    entity.y += (dy / dist) * push
                else:
                    left_pen = entity.x - ox
                    right_pen = ox + ow - entity.x
                    top_pen = entity.y - oy
                    bot_pen = oy + oh - entity.y
                    min_pen = min(left_pen, right_pen, top_pen, bot_pen)
                    if min_pen == left_pen:
                        entity.x = ox - r
                    elif min_pen == right_pen:
                        entity.x = ox + ow + r
                    elif min_pen == top_pen:
                        entity.y = oy - r
                    else:
                        entity.y = oy + oh + r

    def point_in_obstacle(self, x, y, pad=0):
        if x < 20 + pad or x > WORLD_W - 20 - pad or y < 20 + pad or y > WORLD_H - 20 - pad:
            return True
        for ob in self.obstacles:
            if (
                ob["x"] - pad <= x <= ob["x"] + ob["w"] + pad
                and ob["y"] - pad <= y <= ob["y"] + ob["h"] + pad
            ):
                return True
        return False

    def segment_hits_obstacle(self, x1, y1, x2, y2):
        best_t = 2.0
        hit_info = None
        dx = x2 - x1
        dy = y2 - y1

        for ob in self.obstacles:
            ox, oy, ow, oh = ob["x"], ob["y"], ob["w"], ob["h"]
            t0 = 0.0
            t1 = 1.0
            p = (-dx, dx, -dy, dy)
            q = (x1 - ox, ox + ow - x1, y1 - oy, oy + oh - y1)
            inside = True
            for k in range(4):
                pk, qk = p[k], q[k]
                if pk == 0:
                    if qk < 0:
                        inside = False
                        break
                else:
                    t = qk / pk
                    if pk < 0:
                        if t > t1:
                            inside = False
                            break
                        if t > t0:
                            t0 = t
                    else:
                        if t < t0:
                            inside = False
                            break
                        if t < t1:
                            t1 = t
            if inside and t0 <= t1 and 0.0 <= t0 <= 1.0 and t0 < best_t:
                best_t = t0
                hit_info = {"t": t0, "x": x1 + dx * t0, "y": y1 + dy * t0, "obstacle": ob}
        return hit_info

    def update_flow_field(self, target_x, target_y):
        gc = max(0, min(NAV_COLS - 1, int(target_x // NAV_CELL)))
        gr = max(0, min(NAV_ROWS - 1, int(target_y // NAV_CELL)))
        goal_idx = gr * NAV_COLS + gc

        if self.nav_blocked[goal_idx]:
            found = -1
            best_sq = NAV_INF
            for dr in range(-3, 4):
                for dc in range(-3, 4):
                    nc, nr = gc + dc, gr + dr
                    if 0 <= nc < NAV_COLS and 0 <= nr < NAV_ROWS:
                        n_idx = nr * NAV_COLS + nc
                        if not self.nav_blocked[n_idx]:
                            sq = dc * dc + dr * dr
                            if sq < best_sq:
                                best_sq = sq
                                found = n_idx
            if found >= 0:
                goal_idx = found
                gc = goal_idx % NAV_COLS
                gr = goal_idx // NAV_COLS

        if goal_idx == self.nav_goal_cell:
            return
        self.nav_goal_cell = goal_idx

        nav_dist = self.nav_dist
        nav_blocked = self.nav_blocked
        nav_flow_x = self.nav_flow_x
        nav_flow_y = self.nav_flow_y

        for i in range(NAV_TOTAL):
            nav_dist[i] = NAV_INF
            nav_flow_x[i] = 0.0
            nav_flow_y[i] = 0.0

        nav_dist[goal_idx] = 0
        pq = [(0, goal_idx)]

        while pq:
            cost, c_idx = heapq.heappop(pq)
            if cost > nav_dist[c_idx]:
                continue
            cc = c_idx % NAV_COLS
            cr = c_idx // NAV_COLS

            for d in range(8):
                dc, dr = _DIRS_C[d], _DIRS_R[d]
                nc, nr = cc + dc, cr + dr
                if not (0 <= nc < NAV_COLS and 0 <= nr < NAV_ROWS):
                    continue
                n_idx = nr * NAV_COLS + nc
                if nav_blocked[n_idx]:
                    continue
                if dc != 0 and dr != 0:
                    if nav_blocked[cr * NAV_COLS + (cc + dc)] or nav_blocked[(cr + dr) * NAV_COLS + cc]:
                        continue
                new_cost = cost + _DIRS_COST[d]
                if new_cost < nav_dist[n_idx]:
                    nav_dist[n_idx] = new_cost
                    heapq.heappush(pq, (new_cost, n_idx))

        for row in range(NAV_ROWS):
            for col in range(NAV_COLS):
                idx = row * NAV_COLS + col
                if idx == goal_idx:
                    continue
                best_cost = NAV_INF
                best_dx = 0
                best_dy = 0
                is_blocked = nav_blocked[idx] == 1

                for d in range(8):
                    dc, dr = _DIRS_C[d], _DIRS_R[d]
                    nc, nr = col + dc, row + dr
                    if not (0 <= nc < NAV_COLS and 0 <= nr < NAV_ROWS):
                        continue
                    n_idx = nr * NAV_COLS + nc
                    if nav_blocked[n_idx]:
                        continue
                    if not is_blocked and dc != 0 and dr != 0:
                        if nav_blocked[row * NAV_COLS + (col + dc)] or nav_blocked[(row + dr) * NAV_COLS + col]:
                            continue
                    n_cost = nav_dist[n_idx]
                    if n_cost < best_cost:
                        best_cost = n_cost
                        best_dx = dc
                        best_dy = dr

                if best_cost < NAV_INF:
                    mag = math.hypot(best_dx, best_dy) or 1.0
                    nav_flow_x[idx] = best_dx / mag
                    nav_flow_y[idx] = best_dy / mag

    def get_flow_direction(self, x, y):
        c = max(0, min(NAV_COLS - 1, int(x // NAV_CELL)))
        r = max(0, min(NAV_ROWS - 1, int(y // NAV_CELL)))
        idx = r * NAV_COLS + c
        return self.nav_flow_x[idx], self.nav_flow_y[idx]

    def has_line_of_sight(self, x1, y1, x2, y2, clearance=0.0):
        dx = x2 - x1
        dy = y2 - y1
        dist = math.hypot(dx, dy)
        if dist < 6.0:
            return True
        if self.segment_hits_obstacle(x1, y1, x2, y2):
            return False
        if clearance <= 0.0 or dist < 48.0:
            return True
        px = (-dy / dist) * clearance
        py = (dx / dist) * clearance
        if self.segment_hits_obstacle(x1 + px, y1 + py, x2 + px * 0.4, y2 + py * 0.4):
            return False
        if self.segment_hits_obstacle(x1 - px, y1 - py, x2 - px * 0.4, y2 - py * 0.4):
            return False
        return True


def create_map(map_id="outpost", build_gfx=False):
    m = GameMap(map_id=map_id)
    if build_gfx:
        m.build_surfaces()
    return m
