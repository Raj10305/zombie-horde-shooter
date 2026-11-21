(function () {
  "use strict";

  function renderWorld(ctx, state, camera, input, viewW, viewH, zoom) {
    var scale = zoom || 1;
    var worldViewW = viewW / scale;
    var worldViewH = viewH / scale;
    ctx.save();
    ctx.fillStyle = "#eceff3";
    ctx.fillRect(0, 0, viewW, viewH);

    var shakeX = state.events.screenShake > 0 ? (Math.random() - 0.5) * state.events.screenShake : 0;
    var shakeY = state.events.screenShake > 0 ? (Math.random() - 0.5) * state.events.screenShake : 0;
    var camLeft = camera.x - worldViewW / 2 + shakeX;
    var camTop = camera.y - worldViewH / 2 + shakeY;

    ctx.save();
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }
    ctx.translate(-camLeft, -camTop);

    // 1. Pre-rendered terrain & persistent decals (clipped to viewport)
    var sx = Math.max(0, Math.floor(camLeft));
    var sy = Math.max(0, Math.floor(camTop));
    var ex = Math.min(state.map.width, Math.ceil(camLeft + worldViewW));
    var ey = Math.min(state.map.height, Math.ceil(camTop + worldViewH));
    var sw = ex - sx;
    var sh = ey - sy;
    if (sw > 0 && sh > 0) {
      if (state.map.terrainCanvas) {
        ctx.drawImage(state.map.terrainCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
      }
      if (state.map.decalCanvas) {
        ctx.drawImage(state.map.decalCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
      }
    }

    // 2. Acid pools
    drawAcidPools(ctx, state.acidPools);

    // 3. Tactical Aim Preview on ground (Airstrike / Bomber / Chopper / RPG)
    if (input && typeof input.mouseWorldX === "number") {
      drawGroundAimPreview(ctx, state, input.mouseWorldX, input.mouseWorldY);
    }

    // 4. Obstacles
    drawObstacles(ctx, state.map.obstacles, camLeft, camTop, worldViewW, worldViewH);

    // 5. Pickups
    drawPickups(ctx, state.pickups);

    // 6. Auto-Turrets
    drawTurrets(ctx, state.turrets);

    // 7. Zombies
    drawZombies(ctx, state.zombies, camLeft, camTop, worldViewW, worldViewH);

    // 8. Player
    drawPlayer(ctx, state.player);

    // 9. Projectiles, Beams, Shockwaves, Particles
    drawProjectiles(ctx, state.projectiles);
    drawBeams(ctx, state.beams);
    drawShockwaves(ctx, state.shockwaves);
    drawParticles(ctx, state.particles);

    // 10. Airspace Layer (Shadows + Falling Bombs + Aircraft + Orbital Laser)
    drawBombs(ctx, state.bombs);
    drawAircraft(ctx, state.aircraft);
    drawOrbitals(ctx, state.orbitals, camTop);

    // 11. Floating Combat Texts
    drawFloatingTexts(ctx, state.floatingTexts);

    // 12. Custom Reticle
    if (input && typeof input.mouseWorldX === "number") {
      drawCrosshair(ctx, state, input.mouseWorldX, input.mouseWorldY);
    }

    ctx.restore();

    // Screen-space Flash (Nuke / Explosion)
    if (state.events.screenFlash > 0) {
      ctx.fillStyle = state.events.flashColor || "rgba(255,255,255,0.4)";
      ctx.globalAlpha = Math.min(1, state.events.screenFlash * 2.5);
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawAcidPools(ctx, pools) {
    for (var i = 0; i < pools.length; i++) {
      var pl = pools[i];
      var alpha = Math.min(1, pl.life / 1.0) * 0.55;
      ctx.save();
      ctx.globalAlpha = alpha;
      var grad = ctx.createRadialGradient(pl.x, pl.y, 4, pl.x, pl.y, pl.radius);
      grad.addColorStop(0, "rgba(163, 230, 53, 0.85)");
      grad.addColorStop(0.7, "rgba(101, 163, 13, 0.55)");
      grad.addColorStop(1, "rgba(101, 163, 13, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pl.x, pl.y, pl.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawGroundAimPreview(ctx, state, mx, my) {
    var p = state.player;
    var id = p.activeWeaponId;
    var wd = window.WeaponData;
    if (!wd) return;
    var def = wd.WEAPON_BY_ID[id];
    if (!def) return;
    var stats = wd.getScaledStats(def, p.weaponLevels[id] || 1);

    if (id === "a10" || id === "bomber") {
      var dx = mx - p.x;
      var dy = my - p.y;
      var len = Math.hypot(dx, dy);
      var ux = len > 6 ? dx / len : Math.cos(p.angle);
      var uy = len > 6 ? dy / len : Math.sin(p.angle);
      var halfSpan = id === "a10" ? 240 : 280;
      var width = id === "a10" ? 68 : 110;
      var x1 = mx - ux * halfSpan;
      var y1 = my - uy * halfSpan;
      var x2 = mx + ux * halfSpan;
      var y2 = my + uy * halfSpan;

      ctx.save();
      ctx.strokeStyle = id === "a10" ? "rgba(4, 120, 87, 0.55)" : "rgba(5, 150, 105, 0.55)";
      ctx.fillStyle = id === "a10" ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.12)";
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]);
      ctx.translate(mx, my);
      ctx.rotate(Math.atan2(uy, ux));
      ctx.fillRect(-halfSpan, -width / 2, halfSpan * 2, width);
      ctx.strokeRect(-halfSpan, -width / 2, halfSpan * 2, width);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(4, 120, 87, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    } else if (id === "chopper") {
      ctx.save();
      ctx.strokeStyle = "rgba(4, 120, 87, 0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(mx, my, 155, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (id === "rpg") {
      ctx.save();
      ctx.strokeStyle = "rgba(3, 105, 161, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(mx, my, stats.blastRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawObstacles(ctx, obstacles, camLeft, camTop, viewW, viewH) {
    for (var i = 0; i < obstacles.length; i++) {
      var ob = obstacles[i];
      if (ob.x + ob.w < camLeft - 30 || ob.x > camLeft + viewW + 30 ||
          ob.y + ob.h < camTop - 30 || ob.y > camTop + viewH + 30) {
        continue;
      }
      // Drop shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fillRect(ob.x + 5, ob.y + 7, ob.w, ob.h);

      // Main block
      ctx.fillStyle = ob.color;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

      // Top highlight & border
      ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(ob.x + 1, ob.y + 1, ob.w - 2, ob.h - 2);

      // Detail lines for crates/barriers
      if (ob.type === "crate") {
        ctx.strokeStyle = "rgba(0,0,0,0.28)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ob.x + 8, ob.y + 8);
        ctx.lineTo(ob.x + ob.w - 8, ob.y + ob.h - 8);
        ctx.stroke();
      } else if (ob.type === "barrier") {
        ctx.fillStyle = "rgba(217, 119, 6, 0.55)";
        ctx.fillRect(ob.x + 4, ob.y + 4, ob.w - 8, 6);
      }
    }
  }

  function drawPickups(ctx, pickups) {
    for (var i = 0; i < pickups.length; i++) {
      var pk = pickups[i];
      var bob = Math.sin(pk.bobPhase) * 3;
      var color = pk.type === "medkit" ? "#15803d"
        : pk.type === "cash" ? "#b45309"
        : pk.type === "overdrive" ? "#0369a1"
        : "#b91c1c";
      ctx.save();
      ctx.translate(pk.x, pk.y + bob);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var label = pk.type === "medkit" ? "+" : pk.type === "cash" ? "$" : pk.type === "overdrive" ? "⚡" : "☢";
      ctx.fillText(label, 0, 0.5);
      ctx.restore();
    }
  }

  function drawTurrets(ctx, turrets) {
    for (var i = 0; i < turrets.length; i++) {
      var t = turrets[i];
      ctx.save();
      ctx.translate(t.x, t.y);

      // Base tripod
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotating head
      ctx.save();
      ctx.rotate(t.angle);
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(-7, -7, 15, 14);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(8, -4.5, 13, 3);
      ctx.fillRect(8, 1.5, 13, 3);
      if (t.muzzleFlash > 0) {
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(23, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Duration bar
      var frac = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(-14, -22, 28, 4);
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(-14, -22, 28 * frac, 4);
      ctx.restore();
    }
  }

  function drawZombies(ctx, zombies, camLeft, camTop, viewW, viewH) {
    for (var i = 0; i < zombies.length; i++) {
      var z = zombies[i];
      if (z.x + z.radius < camLeft - 40 || z.x - z.radius > camLeft + viewW + 40 ||
          z.y + z.radius < camTop - 40 || z.y - z.radius > camTop + viewH + 40) {
        continue;
      }

      ctx.save();
      ctx.translate(z.x, z.y);

      // Ground shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(2, 5, z.radius * 0.95, z.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      var spr = typeof window !== "undefined" && window.SpriteLoader
        ? window.SpriteLoader.getZombieSprite(z.type)
        : null;

      if (spr && spr.ready && spr.img) {
        var swayAmp = z.type === "runner" ? 0.14 : (z.type === "brute" || z.type === "boss") ? 0.07 : 0.10;
        var scaleMult = (z.type === "brute" || z.type === "boss") ? 2.7 : z.type === "exploder" ? 2.65 : 2.8;
        var drawSize = z.radius * scaleMult;
        var stride = Math.sin(z.animPhase * 2);

        ctx.save();
        ctx.rotate(z.angle + Math.sin(z.animPhase) * swayAmp);
        ctx.scale(1 + stride * 0.04, 1 - stride * 0.03);
        var drawImg = (z.hitFlash > 0 && spr.flashCanvas) ? spr.flashCanvas : spr.img;
        ctx.drawImage(drawImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.restore();
      } else {
        ctx.save();
        ctx.rotate(z.angle);
        var sway = Math.sin(z.animPhase) * 3;
        var bodyColor = z.hitFlash > 0 ? "#ffffff" : z.color;
        var headColor = z.hitFlash > 0 ? "#ffffff" : z.headColor;

        // Outstretched zombie arms
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(4, -z.radius * 0.88 + sway * 0.4, z.radius * 0.9, z.radius * 0.34, 3);
        ctx.roundRect(4, z.radius * 0.54 - sway * 0.4, z.radius * 0.9, z.radius * 0.34, 3);
        ctx.fill();

        // Shoulders / torso
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, z.radius * 0.78, z.radius * 0.92, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brute shoulder plates / Boss crown spikes / Bile sacs / Screamer telegraph
        if (z.type === "brute") {
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (z.type === "boss") {
          ctx.strokeStyle = "#e879f9";
          ctx.lineWidth = 3.5;
          ctx.stroke();
        } else if (z.type === "spitter") {
          ctx.fillStyle = "#a3e635";
          ctx.beginPath();
          ctx.arc(-z.radius * 0.2, -z.radius * 0.72, z.radius * 0.34, 0, Math.PI * 2);
          ctx.arc(-z.radius * 0.2, z.radius * 0.72, z.radius * 0.34, 0, Math.PI * 2);
          ctx.fill();
        }

        // Head
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(z.radius * 0.16, 0, z.radius * 0.56, 0, Math.PI * 2);
        ctx.fill();

        // Screamer wide-open mouth
        if (z.type === "screamer") {
          ctx.fillStyle = "#1e1b4b";
          ctx.beginPath();
          ctx.ellipse(z.radius * 0.54, 0, z.radius * 0.18, z.radius * 0.26, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Glowing eyes
        ctx.fillStyle = z.eyeColor;
        ctx.beginPath();
        ctx.arc(z.radius * 0.46, -z.radius * 0.2, Math.max(1.8, z.radius * 0.12), 0, Math.PI * 2);
        ctx.arc(z.radius * 0.46, z.radius * 0.2, Math.max(1.8, z.radius * 0.12), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Screamer windup telegraph rings
      if (z.type === "screamer" && z.screamCharge > 0) {
        var chargeProg = 1 - z.screamCharge / 0.36;
        ctx.strokeStyle = "rgba(109, 40, 217, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, z.radius + 6 + chargeProg * 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Status aura (burning / shocked)
      if (z.burnTimer > 0) {
        ctx.strokeStyle = "rgba(249, 115, 22, 0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, z.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (z.slowTimer > 0) {
        ctx.strokeStyle = "rgba(34, 211, 238, 0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, z.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Health bar if damaged
      if (z.hp < z.maxHp && z.type !== "boss") {
        var bw = z.radius * 2;
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(-bw / 2, -z.radius - 9, bw, 4);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-bw / 2, -z.radius - 9, bw * Math.max(0, z.hp / z.maxHp), 4);
      }

      ctx.restore();
    }
  }

  var WEAPON_RENDER_CFG = {
    rifle:        { w: 34, h: 17, ox: 12, oy: 1, muzzleX: 31 },
    shotgun:      { w: 36, h: 18, ox: 12, oy: 1, muzzleX: 32 },
    minigun:      { w: 38, h: 20, ox: 14, oy: 2, muzzleX: 35 },
    railgun:      { w: 40, h: 18, ox: 14, oy: 1, muzzleX: 36 },
    flamethrower: { w: 36, h: 18, ox: 13, oy: 2, muzzleX: 33 },
    rpg:          { w: 40, h: 18, ox: 10, oy: 3, muzzleX: 32 },
    tesla:        { w: 36, h: 18, ox: 13, oy: 1, muzzleX: 33 },
    designator:   { w: 24, h: 14, ox: 13, oy: 1, muzzleX: 25 }
  };

  function drawPlayer(ctx, p) {
    // Dash afterimages
    for (var ai = 0; ai < p.afterimages.length; ai++) {
      var im = p.afterimages[ai];
      ctx.save();
      ctx.globalAlpha = (im.life / im.maxLife) * 0.35;
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(im.x, im.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.overdriveTimer > 0) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.ellipse(2, 5, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(p.angle);

    // Tactical soldier body
    ctx.fillStyle = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 30) % 2 === 0 ? "#fca5a5" : "#2563eb";
    ctx.beginPath();
    ctx.ellipse(-2, 0, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Weapon sprite / fallback vector barrel
    var wid = p.activeWeaponId;
    var cfgKey = (wid === "a10" || wid === "bomber" || wid === "chopper") ? "designator" : wid;
    var wcfg = WEAPON_RENDER_CFG[cfgKey] || WEAPON_RENDER_CFG.rifle;
    var recoil = p.muzzleFlash > 0 ? -3.5 * (p.muzzleFlash / 0.075) : 0;
    var wspr = typeof window !== "undefined" && window.SpriteLoader
      ? window.SpriteLoader.getWeaponSprite(wid)
      : null;

    var flashX = 26;
    var flashY = 0;

    if (wspr && wspr.ready && wspr.img) {
      ctx.drawImage(
        wspr.img,
        wcfg.ox - wcfg.w / 2 + recoil,
        wcfg.oy - wcfg.h / 2,
        wcfg.w,
        wcfg.h
      );
      flashX = wcfg.muzzleX + recoil;
      flashY = wcfg.oy;
    } else if (wid === "a10" || wid === "bomber" || wid === "chopper") {
      // Tactical laser target designator fallback
      ctx.fillStyle = "#10b981";
      ctx.fillRect(6, -3, 14, 6);
      ctx.fillStyle = "#a7f3d0";
      ctx.fillRect(19, -1.5, 4, 3);
    } else if (wid === "rpg") {
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-4, 2, 27, 6);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(22, 1.5, 5, 7);
    } else if (wid === "minigun") {
      ctx.fillStyle = "#475569";
      ctx.fillRect(4, -5, 22, 10);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(24, -4, 4, 8);
    } else if (wid === "flamethrower") {
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(4, -3.5, 20, 7);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(22, -2, 4, 4);
    } else {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(6, -2.5, 19, 5);
    }

    // Muzzle flash
    if (p.muzzleFlash > 0) {
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.moveTo(flashX, flashY);
      ctx.lineTo(flashX + 13, flashY - 6);
      ctx.lineTo(flashX + 9, flashY);
      ctx.lineTo(flashX + 13, flashY + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Helmet
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(4, -4, 4, 8);

    ctx.restore();
  }

  function drawProjectiles(ctx, projectiles) {
    for (var i = 0; i < projectiles.length; i++) {
      var pr = projectiles[i];
      if (pr.kind === "flame") {
        var frac = Math.max(0, pr.life / pr.maxLife);
        ctx.save();
        ctx.globalAlpha = frac * 0.78;
        ctx.fillStyle = frac > 0.55 ? "#fde047" : frac > 0.28 ? "#f97316" : "#dc2626";
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pr.kind === "rocket") {
        var ang = Math.atan2(pr.vy, pr.vx);
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.rotate(ang);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(-9, -3, 16, 6);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(7, -3);
        ctx.lineTo(13, 0);
        ctx.lineTo(7, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(-10, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pr.kind === "vomit" || pr.kind === "acid") {
        var vang = Math.atan2(pr.vy, pr.vx);
        ctx.save();
        ctx.fillStyle = "#84cc16";
        ctx.strokeStyle = "#365314";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#bef264";
        ctx.beginPath();
        ctx.arc(pr.x - Math.cos(vang) * 7, pr.y - Math.sin(vang) * 7, pr.radius * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pr.kind === "sonic") {
        var sang = Math.atan2(pr.vy, pr.vx);
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.rotate(sang);
        for (var ring = 0; ring < 3; ring++) {
          var rad = Math.max(6, pr.radius - ring * 7);
          ctx.strokeStyle = ring === 1 ? "#0284c7" : "#6d28d9";
          ctx.lineWidth = 3 - ring * 0.5;
          ctx.beginPath();
          ctx.arc(-ring * 5, 0, rad, -0.78, 0.78);
          ctx.stroke();
        }
        ctx.restore();
      } else {
        // Bullet with crisp tracer streak
        ctx.save();
        ctx.strokeStyle = pr.color || "#b45309";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pr.prevX, pr.prevY);
        ctx.lineTo(pr.x, pr.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawBeams(ctx, beams) {
    for (var i = 0; i < beams.length; i++) {
      var b = beams[i];
      if (!b.points || b.points.length < 2) continue;
      var alpha = Math.max(0, b.life / b.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = b.color || "#0284c7";
      ctx.lineWidth = (b.width || 4) * alpha;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(b.points[0].x, b.points[0].y);
      for (var k = 1; k < b.points.length; k++) {
        ctx.lineTo(b.points[k].x, b.points[k].y);
      }
      ctx.stroke();

      if (b.kind === "rail" || b.kind === "lightning") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1, (b.width || 4) * 0.4 * alpha);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawShockwaves(ctx, waves) {
    for (var i = 0; i < waves.length; i++) {
      var sw = waves[i];
      var alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles(ctx, particles) {
    for (var i = 0; i < particles.length; i++) {
      var pt = particles[i];
      var t = 1 - pt.life / pt.maxLife;
      var rad = pt.size + (pt.endSize - pt.size) * t;
      ctx.save();
      ctx.globalAlpha = Math.max(0, (1 - t) * pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(0.5, rad), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBombs(ctx, bombs) {
    for (var i = 0; i < bombs.length; i++) {
      var b = bombs[i];
      var z = Math.max(0, b.z);
      // Ground target shadow shrinking as bomb approaches impact
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4 + z * 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(239, 68, 68, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6 + z * 20, 0, Math.PI * 2);
      ctx.stroke();

      // Bomb casing descending toward shadow
      var bombY = b.y - z * 140;
      var scale = 0.65 + z * 0.7;
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(b.x, bombY, 5 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawAircraft(ctx, aircraft) {
    for (var i = 0; i < aircraft.length; i++) {
      var ac = aircraft[i];
      if (ac.delay && ac.delay > 0) continue;

      if (ac.kind === "a10") {
        // Ground shadow offset
        drawA10Sprite(ctx, ac.x + 65, ac.y + 85, ac.angle, 0.75, true);
        drawA10Sprite(ctx, ac.x, ac.y, ac.angle, 1.0, false);
      } else if (ac.kind === "bomber") {
        drawBomberSprite(ctx, ac.x + 95, ac.y + 125, ac.angle, 0.78, true);
        drawBomberSprite(ctx, ac.x, ac.y, ac.angle, 1.0, false);
      } else if (ac.kind === "chopper") {
        drawChopperSprite(ctx, ac.x + 48, ac.y + 68, ac.angle, ac.rotorAngle, 0.78, true);
        drawChopperSprite(ctx, ac.x, ac.y, ac.angle, ac.rotorAngle, 1.0, false);
      }
    }
  }

  function drawA10Sprite(ctx, x, y, angle, scale, isShadow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    ctx.fillStyle = isShadow ? "rgba(0,0,0,0.22)" : "#64748b";
    ctx.strokeStyle = isShadow ? "transparent" : "#0f172a";
    ctx.lineWidth = 1.6;

    // Straight broad main wing
    ctx.beginPath();
    ctx.moveTo(-6, -42);
    ctx.lineTo(10, -40);
    ctx.lineTo(14, 40);
    ctx.lineTo(-6, 42);
    ctx.closePath();
    ctx.fill();
    if (!isShadow) ctx.stroke();

    // Fuselage
    ctx.fillStyle = isShadow ? "rgba(0,0,0,0.22)" : "#475569";
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(14, -7);
    ctx.lineTo(-32, -5);
    ctx.lineTo(-36, 0);
    ctx.lineTo(-32, 5);
    ctx.lineTo(14, 7);
    ctx.closePath();
    ctx.fill();
    if (!isShadow) ctx.stroke();

    // H-tail
    ctx.fillRect(-35, -16, 8, 32);
    if (!isShadow) {
      // Twin rear turbine nacelles
      ctx.fillStyle = "#334155";
      ctx.fillRect(-20, -13, 14, 6);
      ctx.fillRect(-20, 7, 14, 6);
      // Canopy & nose GAU-8 gun barrel
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.ellipse(16, 0, 7, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(32, -1.5, 7, 3);
    }
    ctx.restore();
  }

  function drawBomberSprite(ctx, x, y, angle, scale, isShadow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    ctx.fillStyle = isShadow ? "rgba(0,0,0,0.22)" : "#334155";
    ctx.strokeStyle = isShadow ? "transparent" : "#0f172a";
    ctx.lineWidth = 1.8;

    // Giant swept B-52 wings
    ctx.beginPath();
    ctx.moveTo(18, -7);
    ctx.lineTo(-26, -74);
    ctx.lineTo(-40, -70);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-4, 6);
    ctx.lineTo(-40, 70);
    ctx.lineTo(-26, 74);
    ctx.lineTo(18, 7);
    ctx.closePath();
    ctx.fill();
    if (!isShadow) ctx.stroke();

    // Long slender fuselage
    ctx.fillStyle = isShadow ? "rgba(0,0,0,0.22)" : "#1e293b";
    ctx.beginPath();
    ctx.moveTo(52, 0);
    ctx.lineTo(36, -8);
    ctx.lineTo(-48, -6);
    ctx.lineTo(-54, 0);
    ctx.lineTo(-48, 6);
    ctx.lineTo(36, 8);
    ctx.closePath();
    ctx.fill();
    if (!isShadow) ctx.stroke();

    // Tail stabilizer
    ctx.beginPath();
    ctx.moveTo(-36, -4);
    ctx.lineTo(-52, -24);
    ctx.lineTo(-58, -22);
    ctx.lineTo(-48, 0);
    ctx.lineTo(-58, 22);
    ctx.lineTo(-52, 24);
    ctx.lineTo(-36, 4);
    ctx.closePath();
    ctx.fill();

    if (!isShadow) {
      // 4 twin-engine pods
      ctx.fillStyle = "#64748b";
      ctx.fillRect(-10, -48, 12, 5);
      ctx.fillRect(-2, -28, 12, 5);
      ctx.fillRect(-2, 23, 12, 5);
      ctx.fillRect(-10, 43, 12, 5);
      // Cockpit glass
      ctx.fillStyle = "#34d399";
      ctx.fillRect(32, -4, 9, 8);
    }
    ctx.restore();
  }

  function drawChopperSprite(ctx, x, y, angle, rotorAngle, scale, isShadow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    ctx.fillStyle = isShadow ? "rgba(0,0,0,0.22)" : "#334155";
    ctx.strokeStyle = isShadow ? "transparent" : "#0f172a";
    ctx.lineWidth = 1.5;

    // Stub weapon wings
    ctx.fillRect(-4, -20, 12, 40);
    if (!isShadow) ctx.strokeRect(-4, -20, 12, 40);

    // Tail boom & tail rotor
    ctx.fillRect(-36, -3, 28, 6);
    ctx.fillRect(-38, -10, 4, 14);

    // Gunship fuselage
    ctx.beginPath();
    ctx.ellipse(4, 0, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!isShadow) ctx.stroke();

    if (!isShadow) {
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.ellipse(14, 0, 7, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spinning rotor disc & blades
    ctx.save();
    ctx.rotate(rotorAngle);
    ctx.strokeStyle = isShadow ? "rgba(0,0,0,0.22)" : "rgba(226, 232, 240, 0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(36, 0);
    ctx.moveTo(0, -36);
    ctx.lineTo(0, 36);
    ctx.stroke();

    ctx.fillStyle = isShadow ? "rgba(0,0,0,0.12)" : "rgba(148, 163, 184, 0.14)";
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  function drawOrbitals(ctx, orbitals, camTop) {
    for (var i = 0; i < orbitals.length; i++) {
      var orb = orbitals[i];
      var pulse = 0.88 + Math.sin(orb.life * 28) * 0.12;
      var rad = orb.radius * pulse;
      var topY = camTop - 60;

      ctx.save();
      // Outer energy column
      var colGrad = ctx.createLinearGradient(orb.x - rad, 0, orb.x + rad, 0);
      colGrad.addColorStop(0, "rgba(2, 132, 199, 0)");
      colGrad.addColorStop(0.25, "rgba(2, 132, 199, 0.68)");
      colGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
      colGrad.addColorStop(0.75, "rgba(2, 132, 199, 0.68)");
      colGrad.addColorStop(1, "rgba(2, 132, 199, 0)");

      ctx.fillStyle = colGrad;
      ctx.fillRect(orb.x - rad, topY, rad * 2, orb.y - topY);

      // Ground burn ring
      var groundGrad = ctx.createRadialGradient(orb.x, orb.y, 4, orb.x, orb.y, rad * 1.25);
      groundGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      groundGrad.addColorStop(0.45, "rgba(2, 132, 199, 0.75)");
      groundGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
      ctx.fillStyle = groundGrad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, rad * 1.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFloatingTexts(ctx, texts) {
    for (var i = 0; i < texts.length; i++) {
      var ft = texts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = "800 " + ft.size + "px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  function drawCrosshair(ctx, state, mx, my) {
    var wid = state.player.activeWeaponId;
    var isAir = wid === "a10" || wid === "bomber" || wid === "chopper";
    var color = isAir ? "#047857" : "#111827";
    ctx.save();
    ctx.translate(mx, my);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, isAir ? 13 : 9, 0, Math.PI * 2);
    ctx.moveTo(-16, 0);
    ctx.lineTo(-6, 0);
    ctx.moveTo(6, 0);
    ctx.lineTo(16, 0);
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -6);
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 16);
    ctx.stroke();
    ctx.restore();
  }

  function renderMinimap(miniCtx, state, camera, viewW, viewH) {
    var mw = miniCtx.canvas.width;
    var mh = miniCtx.canvas.height;
    var sx = mw / state.map.width;
    var sy = mh / state.map.height;

    miniCtx.clearRect(0, 0, mw, mh);
    miniCtx.fillStyle = "#f3f4f6";
    miniCtx.fillRect(0, 0, mw, mh);

    // Obstacles
    miniCtx.fillStyle = "#64748b";
    var obs = state.map.obstacles;
    for (var i = 0; i < obs.length; i++) {
      miniCtx.fillRect(obs[i].x * sx, obs[i].y * sy, Math.max(2, obs[i].w * sx), Math.max(2, obs[i].h * sy));
    }

    // Pickups
    miniCtx.fillStyle = "#16a34a";
    for (var pi = 0; pi < state.pickups.length; pi++) {
      miniCtx.fillRect(state.pickups[pi].x * sx - 1, state.pickups[pi].y * sy - 1, 2.5, 2.5);
    }

    // Turrets
    miniCtx.fillStyle = "#6d28d9";
    for (var ti = 0; ti < state.turrets.length; ti++) {
      miniCtx.fillRect(state.turrets[ti].x * sx - 1.5, state.turrets[ti].y * sy - 1.5, 3, 3);
    }

    // Zombies
    for (var zi = 0; zi < state.zombies.length; zi++) {
      var z = state.zombies[zi];
      if (z.dead) continue;
      if (z.type === "boss") {
        miniCtx.fillStyle = "#b45309";
        miniCtx.beginPath();
        miniCtx.arc(z.x * sx, z.y * sy, 4, 0, Math.PI * 2);
        miniCtx.fill();
      } else {
        miniCtx.fillStyle = "#dc2626";
        miniCtx.fillRect(z.x * sx - 1, z.y * sy - 1, 2, 2);
      }
    }

    // Aircraft
    miniCtx.fillStyle = "#047857";
    for (var ai = 0; ai < state.aircraft.length; ai++) {
      var ac = state.aircraft[ai];
      miniCtx.beginPath();
      miniCtx.arc(ac.x * sx, ac.y * sy, 2.5, 0, Math.PI * 2);
      miniCtx.fill();
    }

    // Camera box
    miniCtx.strokeStyle = "rgba(17, 24, 39, 0.45)";
    miniCtx.lineWidth = 1;
    miniCtx.strokeRect(
      (camera.x - viewW / 2) * sx,
      (camera.y - viewH / 2) * sy,
      viewW * sx,
      viewH * sy
    );

    // Player dot
    miniCtx.fillStyle = "#1d4ed8";
    miniCtx.beginPath();
    miniCtx.arc(state.player.x * sx, state.player.y * sy, 3.2, 0, Math.PI * 2);
    miniCtx.fill();
  }

  window.GameRenderer = {
    renderWorld: renderWorld,
    renderMinimap: renderMinimap
  };
})();
