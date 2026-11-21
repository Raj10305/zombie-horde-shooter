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
      name: "Quarantine City Ruins",
      subtitle: "Downtown urban ruins, narrow alleys, car wrecks & biohazard drums",
      theme: "urban"
    }
  };

  function createObstacles(mapId) {
    if (mapId === "ruins") {
      return [
        // Corner skyscraper ruined foundations (L-shaped urban barricades)
        { x: 360, y: 300, w: 260, h: 54, type: "building", color: "#334155" },
        { x: 360, y: 354, w: 54, h: 170, type: "building", color: "#334155" },

        { x: 1780, y: 300, w: 260, h: 54, type: "building", color: "#334155" },
        { x: 1986, y: 354, w: 54, h: 170, type: "building", color: "#334155" },

        { x: 360, y: 1446, w: 260, h: 54, type: "building", color: "#334155" },
        { x: 360, y: 1276, w: 54, h: 170, type: "building", color: "#334155" },

        { x: 1780, y: 1446, w: 260, h: 54, type: "building", color: "#334155" },
        { x: 1986, y: 1276, w: 54, h: 170, type: "building", color: "#334155" },

        // Inner street commercial buildings & brick store ruins
        { x: 720, y: 560, w: 170, h: 65, type: "building", color: "#475569" },
        { x: 1510, y: 560, w: 170, h: 65, type: "building", color: "#475569" },
        { x: 720, y: 1175, w: 170, h: 65, type: "building", color: "#475569" },
        { x: 1510, y: 1175, w: 170, h: 65, type: "building", color: "#475569" },

        // Center highway bus barricades (destroyed quarantine transit)
        { x: 1110, y: 360, w: 180, h: 52, type: "wreck_bus", color: "#78350f" },
        { x: 1110, y: 1388, w: 180, h: 52, type: "wreck_bus", color: "#78350f" },

        // Flanking destroyed car wrecks
        { x: 310, y: 840, w: 56, h: 120, type: "car_wreck", color: "#854d0e" },
        { x: 2034, y: 840, w: 56, h: 120, type: "car_wreck", color: "#854d0e" },

        // Biohazard toxic drum clusters & sandbag checkpoints
        { x: 920, y: 865, w: 54, h: 70, type: "biohazard", color: "#4d7c0f" },
        { x: 1426, y: 865, w: 54, h: 70, type: "biohazard", color: "#4d7c0f" },
        { x: 1140, y: 700, w: 120, h: 42, type: "sandbag", color: "#64748b" },
        { x: 1140, y: 1058, w: 120, h: 42, type: "sandbag", color: "#64748b" }
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
      // Atmospheric post-apocalyptic urban ruins: dark cracked asphalt & debris
      ctx.fillStyle = "#1e242c";
      ctx.fillRect(0, 0, w, h);

      // Cracked city sidewalk grid
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.5;
      for (var rx = 0; rx <= w; rx += 100) {
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx, h);
        ctx.stroke();
      }
      for (var ry = 0; ry <= h; ry += 100) {
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(w, ry);
        ctx.stroke();
      }

      // Main damaged boulevard avenues (dual carriageway)
      ctx.fillStyle = "#2d3748";
      ctx.fillRect(0, h / 2 - 160, w, 320);
      ctx.fillRect(w / 2 - 160, 0, 320, h);

      // Cracked central intersection plaza
      ctx.fillStyle = "#252f3e";
      ctx.fillRect(w / 2 - 200, h / 2 - 200, 400, 400);

      // Pedestrian crosswalk stripes
      ctx.fillStyle = "rgba(226, 232, 240, 0.28)";
      var stripeW = 12;
      for (var cw = -150; cw <= 150; cw += 26) {
        // Horizontal avenue crosswalks
        ctx.fillRect(w / 2 - 220, h / 2 + cw, stripeW, 18);
        ctx.fillRect(w / 2 + 208, h / 2 + cw, stripeW, 18);
        // Vertical avenue crosswalks
        ctx.fillRect(w / 2 + cw, h / 2 - 220, 18, stripeW);
        ctx.fillRect(w / 2 + cw, h / 2 + 208, 18, stripeW);
      }

      // Yellow hazard caution road stripes (decayed quarantine markings)
      ctx.strokeStyle = "rgba(202, 138, 4, 0.45)";
      ctx.lineWidth = 4;
      ctx.setLineDash([32, 24]);
      ctx.beginPath();
      ctx.moveTo(0, h / 2 - 3);
      ctx.lineTo(w / 2 - 210, h / 2 - 3);
      ctx.moveTo(w / 2 + 210, h / 2 - 3);
      ctx.lineTo(w, h / 2 - 3);
      ctx.moveTo(w / 2 - 3, 0);
      ctx.lineTo(w / 2 - 3, h / 2 - 210);
      ctx.moveTo(w / 2 - 3, h / 2 + 210);
      ctx.lineTo(w / 2 - 3, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hazard biohazard sector text stencil in central plaza
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.fillStyle = "rgba(234, 179, 8, 0.18)";
      ctx.font = "900 32px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("QUARANTINE SECTOR 4", 0, -28);
      ctx.font = "700 16px monospace";
      ctx.fillText("[BIOHAZARD ACTIVE - AUTHORIZED ONLY]", 0, 8);

      // Biohazard circle emblem
      ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Debris, oil slicks, asphalt cracks
      var seed2 = 4242;
      function rand2() {
        seed2 = (seed2 * 16807) % 2147483647;
        return (seed2 - 1) / 2147483646;
      }
      for (var d = 0; d < 800; d++) {
        var dx = rand2() * w;
        var dy = rand2() * h;
        var dr = 1.5 + rand2() * 4.5;
        ctx.fillStyle = rand2() > 0.4 ? "rgba(15, 23, 42, 0.65)" : "rgba(100, 116, 139, 0.22)";
        ctx.beginPath();
        ctx.arc(dx, dy, dr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer quarantine border
      ctx.strokeStyle = "rgba(220, 38, 38, 0.7)";
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, w - 20, h - 20);

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
