(function () {
  "use strict";

  var WORLD_W = 2400;
  var WORLD_H = 1800;

  var MAP_DEFINITIONS = {
    outpost: {
      id: "outpost",
      name: "Military Outpost",
      subtitle: "Fortified perimeter with central helipad & concrete bunkers",
      theme: "light"
    },
    ruins: {
      id: "ruins",
      name: "Abandoned City",
      subtitle: "Overgrown pixel-art city ruins, rusted buses, flipped cars & shipping containers",
      theme: "urban"
    }
  };

  function createObstacles(mapId) {
    if (mapId === "ruins") {
      return [
        // Four quadrant abandoned city buildings (exact 3x pixel-art sprite sizes)
        { x: 260, y: 220, w: 240, h: 192, type: "building", color: "#52525b", sprite: "assets/maps/city_props/building_gray.png" },
        { x: 1860, y: 220, w: 240, h: 192, type: "building", color: "#78716c", sprite: "assets/maps/city_props/building_beige.png" },
        { x: 260, y: 1360, w: 240, h: 192, type: "building", color: "#78716c", sprite: "assets/maps/city_props/building_beige.png" },
        { x: 1860, y: 1360, w: 240, h: 192, type: "building", color: "#52525b", sprite: "assets/maps/city_props/building_gray.png" },

        // Inner corner storefronts / dark ruined apartments
        { x: 670, y: 460, w: 192, h: 144, type: "building", color: "#3f3f46", sprite: "assets/maps/city_props/building_dark.png" },
        { x: 1540, y: 460, w: 192, h: 144, type: "building", color: "#3f3f46", sprite: "assets/maps/city_props/building_dark.png" },
        { x: 670, y: 1200, w: 192, h: 144, type: "building", color: "#3f3f46", sprite: "assets/maps/city_props/building_dark.png" },
        { x: 1540, y: 1200, w: 192, h: 144, type: "building", color: "#3f3f46", sprite: "assets/maps/city_props/building_dark.png" },

        // Abandoned rusted transit buses blocking north & south avenues
        { x: 1090, y: 310, w: 183, h: 93, type: "wreck_bus", color: "#854d0e", sprite: "assets/maps/city_props/bus_yellow_rust.png" },
        { x: 1120, y: 1380, w: 192, h: 96, type: "wreck_bus", color: "#1e3a8a", sprite: "assets/maps/city_props/bus_blue_overgrown.png" },

        // Crashed & flipped vehicles on east/west boulevards
        { x: 350, y: 820, w: 129, h: 81, type: "car_wreck", color: "#1d4ed8", sprite: "assets/maps/city_props/van_blue_rust.png" },
        { x: 1920, y: 830, w: 117, h: 60, type: "car_wreck", color: "#a16207", sprite: "assets/maps/city_props/car_scrap_yellow.png" },
        { x: 740, y: 860, w: 81, h: 111, type: "car_wreck", color: "#991b1b", sprite: "assets/maps/city_props/car_flipped_red.png" },
        { x: 1580, y: 820, w: 75, h: 120, type: "car_wreck", color: "#52525b", sprite: "assets/maps/city_props/car_gray_overgrown.png" },

        // Overgrown shipping containers & street barricades
        { x: 1440, y: 240, w: 123, h: 87, type: "crate", color: "#7f1d1d", sprite: "assets/maps/city_props/container_red_h.png" },
        { x: 760, y: 1470, w: 123, h: 87, type: "crate", color: "#4b5563", sprite: "assets/maps/city_props/container_gray_h.png" },
        { x: 250, y: 540, w: 87, h: 138, type: "crate", color: "#365314", sprite: "assets/maps/city_props/container_green_v.png" },
        { x: 2050, y: 1100, w: 87, h: 138, type: "crate", color: "#365314", sprite: "assets/maps/city_props/container_green_v.png" },

        // Dumpsters, vending machines, rusted barrels & overgrown trees
        { x: 900, y: 630, w: 87, h: 69, type: "barrier", color: "#3f6212", sprite: "assets/maps/city_props/dumpster.png" },
        { x: 1440, y: 1090, w: 87, h: 69, type: "barrier", color: "#3f6212", sprite: "assets/maps/city_props/dumpster.png" },
        { x: 920, y: 1090, w: 57, h: 78, type: "barrier", color: "#991b1b", sprite: "assets/maps/city_props/vending_red.png" },
        { x: 1460, y: 620, w: 36, h: 48, type: "biohazard", color: "#991b1b", sprite: "assets/maps/city_props/barrel_red.png" },
        { x: 1502, y: 632, w: 36, h: 48, type: "biohazard", color: "#1d4ed8", sprite: "assets/maps/city_props/barrel_blue.png" },
        { x: 540, y: 240, w: 63, h: 90, type: "tree", color: "#3f6212", sprite: "assets/maps/city_props/tree_dark.png" },
        { x: 1740, y: 1460, w: 69, h: 96, type: "tree", color: "#713f12", sprite: "assets/maps/city_props/tree_dry.png" },
        { x: 560, y: 1440, w: 69, h: 96, type: "tree", color: "#713f12", sprite: "assets/maps/city_props/tree_dry.png" },
        { x: 1750, y: 250, w: 63, h: 90, type: "tree", color: "#3f6212", sprite: "assets/maps/city_props/tree_dark.png" }
      ];
    }

    // Default: Military Outpost cover with wide avenues & central plaza
    return [
      // Four outer quadrant concrete walls/bunkers
      { x: 460, y: 360, w: 170, h: 42, type: "concrete", color: "#64748b" },
      { x: 460, y: 402, w: 42, h: 115, type: "concrete", color: "#64748b" },

      { x: 1770, y: 360, w: 170, h: 42, type: "concrete", color: "#64748b" },
      { x: 1898, y: 402, w: 42, h: 115, type: "concrete", color: "#64748b" },

      { x: 460, y: 1398, w: 170, h: 42, type: "concrete", color: "#64748b" },
      { x: 460, y: 1283, w: 42, h: 115, type: "concrete", color: "#64748b" },

      { x: 1770, y: 1398, w: 170, h: 42, type: "concrete", color: "#64748b" },
      { x: 1898, y: 1283, w: 42, h: 115, type: "concrete", color: "#64748b" },

      // Mid-ring tactical barriers & military cargo containers
      { x: 850, y: 540, w: 130, h: 48, type: "crate", color: "#5c6b57" },
      { x: 1420, y: 540, w: 130, h: 48, type: "crate", color: "#5c6b57" },
      { x: 850, y: 1212, w: 130, h: 48, type: "crate", color: "#5c6b57" },
      { x: 1420, y: 1212, w: 130, h: 48, type: "crate", color: "#5c6b57" },

      // Flanking roadblocks
      { x: 320, y: 840, w: 56, h: 120, type: "barrier", color: "#6b7280" },
      { x: 2024, y: 840, w: 56, h: 120, type: "barrier", color: "#6b7280" },
      { x: 1140, y: 250, w: 120, h: 52, type: "barrier", color: "#6b7280" },
      { x: 1140, y: 1498, w: 120, h: 52, type: "barrier", color: "#6b7280" },

      // Inner plaza corner cover
      { x: 930, y: 860, w: 44, h: 80, type: "sandbag", color: "#78716c" },
      { x: 1426, y: 860, w: 44, h: 80, type: "sandbag", color: "#78716c" }
    ];
  }

  function buildTerrainCanvas(w, h, mapId) {
    if (typeof document === "undefined") return null;
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");

    if (mapId === "ruins") {
      // Initial fallback while pixel-art Abandoned City ground PNG loads
      ctx.fillStyle = "#4b5a46";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#5b5c69";
      ctx.fillRect(0, 720, w, 360);
      ctx.fillRect(1008, 0, 384, h);
      ctx.strokeStyle = "rgba(185, 28, 28, 0.7)";
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      if (typeof Image !== "undefined") {
        var bgImg = new Image();
        bgImg.onload = function () {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(bgImg, 0, 0, w, h);
          ctx.restore();
        };
        bgImg.src = "assets/maps/abandoned_city_ground.png";
      }
      return c;
    }

    // Default: Military Outpost (Clean concrete base)
    ctx.fillStyle = "#eceff3";
    ctx.fillRect(0, 0, w, h);

    // Subtle sector grid lines
    ctx.strokeStyle = "#dcdfe6";
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= w; gx += 80) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (var gy = 0; gy <= h; gy += 80) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Main crossroad avenues
    ctx.fillStyle = "#dfe4ec";
    ctx.fillRect(0, h / 2 - 150, w, 300);
    ctx.fillRect(w / 2 - 150, 0, 300, h);

    // Central helipad / command plaza circle
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = "#d5dbe5";
    ctx.beginPath();
    ctx.arc(0, 0, 175, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, 155, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Helipad 'H'
    ctx.fillStyle = "rgba(100, 116, 139, 0.35)";
    ctx.fillRect(-38, -42, 14, 84);
    ctx.fillRect(24, -42, 14, 84);
    ctx.fillRect(-24, -7, 48, 14);
    ctx.restore();

    // Dashed road divider lines
    ctx.strokeStyle = "rgba(180, 83, 9, 0.38)";
    ctx.lineWidth = 4;
    ctx.setLineDash([28, 22]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w / 2 - 190, h / 2);
    ctx.moveTo(w / 2 + 190, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h / 2 - 190);
    ctx.moveTo(w / 2, h / 2 + 190);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Deterministic surface grit
    var seed = 1337;
    function rand() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }
    for (var i = 0; i < 650; i++) {
      var rx = rand() * w;
      var ry = rand() * h;
      var rr = 1 + rand() * 3.0;
      ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.45)" : "rgba(100,116,139,0.14)";
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Perimeter boundary
    ctx.strokeStyle = "rgba(185, 28, 28, 0.55)";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    return c;
  }

  function createDecalCanvas(w, h) {
    if (typeof document === "undefined") return null;
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  var NAV_CELL = 40;
  var NAV_COLS = Math.ceil(WORLD_W / NAV_CELL);
  var NAV_ROWS = Math.ceil(WORLD_H / NAV_CELL);
  var NAV_TOTAL = NAV_COLS * NAV_ROWS;
  var NAV_INF = 0x3fffffff;

  function createMap(mapId) {
    var validId = (mapId && MAP_DEFINITIONS[mapId]) ? mapId : "outpost";
    var meta = MAP_DEFINITIONS[validId];
    var obstacles = createObstacles(validId);
    var terrainCanvas = buildTerrainCanvas(WORLD_W, WORLD_H, validId);
    var decalCanvas = createDecalCanvas(WORLD_W, WORLD_H);
    var decalCtx = decalCanvas ? decalCanvas.getContext("2d") : null;

    // Precompute blocked cells for flow-field pathfinding
    var navBlocked = new Uint8Array(NAV_TOTAL);
    var navDist = new Int32Array(NAV_TOTAL);
    var navFlowX = new Float32Array(NAV_TOTAL);
    var navFlowY = new Float32Array(NAV_TOTAL);
    var heapIdx = new Int32Array(NAV_TOTAL * 2);
    var heapCost = new Int32Array(NAV_TOTAL * 2);
    var navGoalCell = -1;

    function isWorldBlocked(x, y, pad) {
      if (x < 24 + pad || x > WORLD_W - 24 - pad || y < 24 + pad || y > WORLD_H - 24 - pad) {
        return true;
      }
      for (var i = 0; i < obstacles.length; i++) {
        var ob = obstacles[i];
        if (x >= ob.x - pad && x <= ob.x + ob.w + pad && y >= ob.y - pad && y <= ob.y + ob.h + pad) {
          return true;
        }
      }
      return false;
    }

    for (var r = 0; r < NAV_ROWS; r++) {
      for (var c = 0; c < NAV_COLS; c++) {
        var cx = c * NAV_CELL + NAV_CELL * 0.5;
        var cy = r * NAV_CELL + NAV_CELL * 0.5;
        navBlocked[r * NAV_COLS + c] = isWorldBlocked(cx, cy, 14) ? 1 : 0;
      }
    }

    var DIRS_C = [1, -1, 0, 0, 1, 1, -1, -1];
    var DIRS_R = [0, 0, 1, -1, 1, -1, 1, -1];
    var DIRS_COST = [10, 10, 10, 10, 14, 14, 14, 14];

    function buildFlowField(targetX, targetY) {
      var gc = Math.max(0, Math.min(NAV_COLS - 1, Math.floor(targetX / NAV_CELL)));
      var gr = Math.max(0, Math.min(NAV_ROWS - 1, Math.floor(targetY / NAV_CELL)));
      var goalIdx = gr * NAV_COLS + gc;

      if (navBlocked[goalIdx]) {
        var found = -1;
        var bestSq = Infinity;
        for (var dr = -3; dr <= 3; dr++) {
          for (var dc = -3; dc <= 3; dc++) {
            var nc = gc + dc;
            var nr = gr + dr;
            if (nc < 0 || nc >= NAV_COLS || nr < 0 || nr >= NAV_ROWS) continue;
            var nIdx = nr * NAV_COLS + nc;
            if (!navBlocked[nIdx]) {
              var sq = dc * dc + dr * dr;
              if (sq < bestSq) {
                bestSq = sq;
                found = nIdx;
              }
            }
          }
        }
        if (found >= 0) {
          goalIdx = found;
          gc = goalIdx % NAV_COLS;
          gr = Math.floor(goalIdx / NAV_COLS);
        }
      }

      if (goalIdx === navGoalCell) return;
      navGoalCell = goalIdx;

      for (var i = 0; i < NAV_TOTAL; i++) {
        navDist[i] = NAV_INF;
        navFlowX[i] = 0;
        navFlowY[i] = 0;
      }

      // Binary min-heap Dijkstra from target cell outward
      var heapLen = 0;
      function pushHeap(idx, cost) {
        var pos = heapLen++;
        heapIdx[pos] = idx;
        heapCost[pos] = cost;
        while (pos > 0) {
          var parent = (pos - 1) >> 1;
          if (heapCost[parent] <= heapCost[pos]) break;
          var ti = heapIdx[parent];
          var tc = heapCost[parent];
          heapIdx[parent] = heapIdx[pos];
          heapCost[parent] = heapCost[pos];
          heapIdx[pos] = ti;
          heapCost[pos] = tc;
          pos = parent;
        }
      }

      function popHeap() {
        var topIdx = heapIdx[0];
        var topCost = heapCost[0];
        heapLen--;
        if (heapLen > 0) {
          heapIdx[0] = heapIdx[heapLen];
          heapCost[0] = heapCost[heapLen];
          var pos = 0;
          while (true) {
            var left = pos * 2 + 1;
            var right = left + 1;
            var smallest = pos;
            if (left < heapLen && heapCost[left] < heapCost[smallest]) smallest = left;
            if (right < heapLen && heapCost[right] < heapCost[smallest]) smallest = right;
            if (smallest === pos) break;
            var ti = heapIdx[pos];
            var tc = heapCost[pos];
            heapIdx[pos] = heapIdx[smallest];
            heapCost[pos] = heapCost[smallest];
            heapIdx[smallest] = ti;
            heapCost[smallest] = tc;
            pos = smallest;
          }
        }
        return { idx: topIdx, cost: topCost };
      }

      navDist[goalIdx] = 0;
      pushHeap(goalIdx, 0);

      while (heapLen > 0) {
        var cur = popHeap();
        var cIdx = cur.idx;
        if (cur.cost > navDist[cIdx]) continue;
        var cc = cIdx % NAV_COLS;
        var cr = Math.floor(cIdx / NAV_COLS);

        for (var d = 0; d < 8; d++) {
          var dc = DIRS_C[d];
          var dr = DIRS_R[d];
          var nc = cc + dc;
          var nr = cr + dr;
          if (nc < 0 || nc >= NAV_COLS || nr < 0 || nr >= NAV_ROWS) continue;
          var nIdx = nr * NAV_COLS + nc;
          if (navBlocked[nIdx]) continue;

          // Prevent diagonal corner cutting across obstacle corners
          if (dc !== 0 && dr !== 0) {
            if (navBlocked[cr * NAV_COLS + (cc + dc)] || navBlocked[(cr + dr) * NAV_COLS + cc]) {
              continue;
            }
          }

          var newCost = cur.cost + DIRS_COST[d];
          if (newCost < navDist[nIdx]) {
            navDist[nIdx] = newCost;
            pushHeap(nIdx, newCost);
          }
        }
      }

      // Compute smooth unit flow vector for every cell
      for (var row = 0; row < NAV_ROWS; row++) {
        for (var col = 0; col < NAV_COLS; col++) {
          var idx = row * NAV_COLS + col;
          if (idx === goalIdx) continue;

          var bestCost = NAV_INF;
          var bestDx = 0;
          var bestDy = 0;
          var isBlockedCell = navBlocked[idx] === 1;

          for (var d2 = 0; d2 < 8; d2++) {
            var ddc = DIRS_C[d2];
            var ddr = DIRS_R[d2];
            var nnc = col + ddc;
            var nnr = row + ddr;
            if (nnc < 0 || nnc >= NAV_COLS || nnr < 0 || nnr >= NAV_ROWS) continue;
            var nnIdx = nnr * NAV_COLS + nnc;
            if (navBlocked[nnIdx]) continue;
            if (!isBlockedCell && ddc !== 0 && ddr !== 0) {
              if (navBlocked[row * NAV_COLS + (col + ddc)] || navBlocked[(row + ddr) * NAV_COLS + col]) {
                continue;
              }
            }
            var nCost = navDist[nnIdx];
            if (nCost < bestCost) {
              bestCost = nCost;
              bestDx = ddc;
              bestDy = ddr;
            }
          }

          if (bestCost < NAV_INF) {
            var mag = Math.hypot(bestDx, bestDy) || 1;
            navFlowX[idx] = bestDx / mag;
            navFlowY[idx] = bestDy / mag;
          }
        }
      }
    }

    var map = {
      id: validId,
      name: meta.name,
      subtitle: meta.subtitle,
      theme: meta.theme,
      width: WORLD_W,
      height: WORLD_H,
      obstacles: obstacles,
      terrainCanvas: terrainCanvas,
      decalCanvas: decalCanvas,
      decalCtx: decalCtx,

      clearDecals: function () {
        if (decalCtx) {
          decalCtx.clearRect(0, 0, WORLD_W, WORLD_H);
        }
      },

      addBloodDecal: function (x, y, color, radius) {
        if (!decalCtx) return;
        var r = radius || 14;
        decalCtx.save();
        decalCtx.fillStyle = color || "rgba(153, 27, 27, 0.45)";
        for (var i = 0; i < 4; i++) {
          var ang = Math.random() * Math.PI * 2;
          var dist = Math.random() * r * 0.7;
          var br = r * (0.25 + Math.random() * 0.45);
          decalCtx.beginPath();
          decalCtx.arc(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, br, 0, Math.PI * 2);
          decalCtx.fill();
        }
        decalCtx.restore();
      },

      addScorchDecal: function (x, y, radius) {
        if (!decalCtx) return;
        var r = radius || 48;
        decalCtx.save();
        var grad = decalCtx.createRadialGradient(x, y, r * 0.1, x, y, r);
        grad.addColorStop(0, "rgba(30, 30, 35, 0.42)");
        grad.addColorStop(0.55, "rgba(55, 50, 48, 0.22)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        decalCtx.fillStyle = grad;
        decalCtx.beginPath();
        decalCtx.arc(x, y, r, 0, Math.PI * 2);
        decalCtx.fill();
        decalCtx.restore();
      },

      addCasingDecal: function (x, y, angle) {
        if (!decalCtx) return;
        decalCtx.save();
        decalCtx.translate(x, y);
        decalCtx.rotate(angle || 0);
        decalCtx.fillStyle = "rgba(146, 64, 14, 0.65)";
        decalCtx.fillRect(-2.5, -1, 5, 2);
        decalCtx.restore();
      },

      resolveCircleObstacles: function (entity) {
        var r = entity.radius || 14;
        var pad = 20;
        if (entity.x < pad + r) entity.x = pad + r;
        if (entity.x > WORLD_W - pad - r) entity.x = WORLD_W - pad - r;
        if (entity.y < pad + r) entity.y = pad + r;
        if (entity.y > WORLD_H - pad - r) entity.y = WORLD_H - pad - r;

        for (var i = 0; i < obstacles.length; i++) {
          var ob = obstacles[i];
          var closestX = entity.x < ob.x ? ob.x : entity.x > ob.x + ob.w ? ob.x + ob.w : entity.x;
          var closestY = entity.y < ob.y ? ob.y : entity.y > ob.y + ob.h ? ob.y + ob.h : entity.y;
          var dx = entity.x - closestX;
          var dy = entity.y - closestY;
          var distSq = dx * dx + dy * dy;
          if (distSq < r * r) {
            if (distSq > 0.0001) {
              var dist = Math.sqrt(distSq);
              var push = r - dist;
              entity.x += (dx / dist) * push;
              entity.y += (dy / dist) * push;
            } else {
              // Inside rectangle center fallback
              var leftPen = entity.x - ob.x;
              var rightPen = ob.x + ob.w - entity.x;
              var topPen = entity.y - ob.y;
              var botPen = ob.y + ob.h - entity.y;
              var minPen = Math.min(leftPen, rightPen, topPen, botPen);
              if (minPen === leftPen) entity.x = ob.x - r;
              else if (minPen === rightPen) entity.x = ob.x + ob.w + r;
              else if (minPen === topPen) entity.y = ob.y - r;
              else entity.y = ob.y + ob.h + r;
            }
          }
        }
      },

      pointInObstacle: function (x, y, pad) {
        var p = pad || 0;
        if (x < 20 + p || x > WORLD_W - 20 - p || y < 20 + p || y > WORLD_H - 20 - p) {
          return true;
        }
        for (var i = 0; i < obstacles.length; i++) {
          var ob = obstacles[i];
          if (x >= ob.x - p && x <= ob.x + ob.w + p && y >= ob.y - p && y <= ob.y + ob.h + p) {
            return true;
          }
        }
        return false;
      },

      segmentHitsObstacle: function (x1, y1, x2, y2) {
        var bestT = 2;
        var hitInfo = null;
        var dx = x2 - x1;
        var dy = y2 - y1;

        for (var i = 0; i < obstacles.length; i++) {
          var ob = obstacles[i];
          // Slab intersection
          var t0 = 0;
          var t1 = 1;
          var p = [-dx, dx, -dy, dy];
          var q = [x1 - ob.x, ob.x + ob.w - x1, y1 - ob.y, ob.y + ob.h - y1];
          var inside = true;
          for (var k = 0; k < 4; k++) {
            if (p[k] === 0) {
              if (q[k] < 0) {
                inside = false;
                break;
              }
            } else {
              var t = q[k] / p[k];
              if (p[k] < 0) {
                if (t > t1) { inside = false; break; }
                if (t > t0) t0 = t;
              } else {
                if (t < t0) { inside = false; break; }
                if (t < t1) t1 = t;
              }
            }
          }
          if (inside && t0 <= t1 && t0 >= 0 && t0 <= 1 && t0 < bestT) {
            bestT = t0;
            hitInfo = {
              t: t0,
              x: x1 + dx * t0,
              y: y1 + dy * t0,
              obstacle: ob
            };
          }
        }
        return hitInfo;
      },

      updateFlowField: function (targetX, targetY) {
        buildFlowField(targetX, targetY);
      },

      getFlowDirection: function (x, y) {
        var c = Math.max(0, Math.min(NAV_COLS - 1, Math.floor(x / NAV_CELL)));
        var r = Math.max(0, Math.min(NAV_ROWS - 1, Math.floor(y / NAV_CELL)));
        var idx = r * NAV_COLS + c;
        return { x: navFlowX[idx], y: navFlowY[idx] };
      },

      hasLineOfSight: function (x1, y1, x2, y2, clearance) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        var len = Math.hypot(dx, dy);
        if (len < 6) return true;
        if (map.segmentHitsObstacle(x1, y1, x2, y2)) return false;
        var clr = clearance || 0;
        if (clr <= 0 || len < 48) return true;
        var px = (-dy / len) * clr;
        var py = (dx / len) * clr;
        if (map.segmentHitsObstacle(x1 + px, y1 + py, x2 + px * 0.4, y2 + py * 0.4)) return false;
        if (map.segmentHitsObstacle(x1 - px, y1 - py, x2 - px * 0.4, y2 - py * 0.4)) return false;
        return true;
      }
    };

    return map;
  }

  window.GameMap = {
    WORLD_W: WORLD_W,
    WORLD_H: WORLD_H,
    MAP_DEFINITIONS: MAP_DEFINITIONS,
    createMap: createMap
  };
})();
