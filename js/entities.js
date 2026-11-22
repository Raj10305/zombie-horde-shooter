(function () {
  "use strict";

  var ZOMBIE_TYPES = {
    shambler: {
      name: "Shambler",
      radius: 15,
      hp: 72,
      speed: 95,
      damage: 18,
      attackRate: 0.85,
      cash: 14,
      score: 25,
      color: "#4d7c4f",
      headColor: "#6ca16f",
      eyeColor: "#fde047",
      bloodColor: "rgba(118, 22, 26, 0.55)",
      knockResist: 0.95
    },
    runner: {
      name: "Crimson Runner",
      radius: 13,
      hp: 52,
      speed: 210,
      damage: 16,
      attackRate: 0.60,
      cash: 18,
      score: 35,
      color: "#991b1b",
      headColor: "#dc2626",
      eyeColor: "#fef08a",
      bloodColor: "rgba(145, 20, 28, 0.58)",
      knockResist: 1.15
    },
    brute: {
      name: "Armored Brute",
      radius: 24,
      hp: 360,
      speed: 72,
      damage: 36,
      attackRate: 1.15,
      cash: 45,
      score: 90,
      color: "#475569",
      headColor: "#64748b",
      eyeColor: "#f97316",
      bloodColor: "rgba(95, 20, 24, 0.62)",
      knockResist: 0.18
    },
    spitter: {
      name: "Bile Vomiter",
      radius: 14,
      hp: 70,
      speed: 104,
      damage: 18,
      attackRate: 1.6,
      spitRange: 420,
      cash: 26,
      score: 50,
      color: "#4d7c0f",
      headColor: "#84cc16",
      eyeColor: "#ecfccb",
      bloodColor: "rgba(101, 163, 13, 0.55)",
      knockResist: 0.95
    },
    screamer: {
      name: "Sonic Screamer",
      radius: 14,
      hp: 80,
      speed: 122,
      damage: 24,
      attackRate: 1.7,
      screamRange: 460,
      cash: 28,
      score: 55,
      color: "#5b21b6",
      headColor: "#a78bfa",
      eyeColor: "#06b6d4",
      bloodColor: "rgba(91, 33, 182, 0.5)",
      knockResist: 0.95
    },
    exploder: {
      name: "Volatile Boomer",
      radius: 18,
      hp: 85,
      speed: 122,
      damage: 22,
      attackRate: 0.9,
      explodeRadius: 92,
      explodeDamage: 55,
      friendlyExplodeDamage: 50,
      cash: 32,
      score: 65,
      color: "#9a3412",
      headColor: "#fb923c",
      eyeColor: "#fef9c3",
      bloodColor: "rgba(180, 65, 16, 0.6)",
      knockResist: 0.8
    },
    boss: {
      name: "NECRO TITAN",
      radius: 38,
      hp: 3800,
      speed: 82,
      damage: 48,
      attackRate: 1.0,
      cash: 500,
      score: 1500,
      color: "#581c87",
      headColor: "#9333ea",
      eyeColor: "#ef4444",
      bloodColor: "rgba(126, 34, 206, 0.6)",
      knockResist: 0.05
    }
  };

  function SpatialHash(cellSize) {
    this.cellSize = cellSize || 72;
    this.cells = Object.create(null);
    this._stamp = 1;
  }

  SpatialHash.prototype.clear = function () {
    this.cells = Object.create(null);
  };

  SpatialHash.prototype.insert = function (entity) {
    var cs = this.cellSize;
    var cx = Math.floor(entity.x / cs);
    var cy = Math.floor(entity.y / cs);
    var key = cx + "," + cy;
    var bucket = this.cells[key];
    if (!bucket) {
      bucket = [];
      this.cells[key] = bucket;
    }
    bucket.push(entity);
  };

  SpatialHash.prototype.query = function (x, y, radius) {
    var cs = this.cellSize;
    var minX = Math.floor((x - radius) / cs);
    var maxX = Math.floor((x + radius) / cs);
    var minY = Math.floor((y - radius) / cs);
    var maxY = Math.floor((y + radius) / cs);
    var results = [];
    var stamp = ++this._stamp;
    var rSq = radius * radius;
    for (var cx = minX; cx <= maxX; cx++) {
      for (var cy = minY; cy <= maxY; cy++) {
        var bucket = this.cells[cx + "," + cy];
        if (!bucket) continue;
        for (var i = 0; i < bucket.length; i++) {
          var item = bucket[i];
          if (item._qStamp === stamp) continue;
          item._qStamp = stamp;
          var dx = item.x - x;
          var dy = item.y - y;
          var radSum = radius + (item.radius || 0);
          if (dx * dx + dy * dy <= radSum * radSum || dx * dx + dy * dy <= rSq) {
            results.push(item);
          }
        }
      }
    }
    return results;
  };

  function getWeaponData() {
    return typeof window !== "undefined" ? window.WeaponData : null;
  }

  function createWorldState(mode, map) {
    var wd = getWeaponData();
    var levels = {};
    var cooldowns = {};
    var maxCooldowns = {};
    var weaponKills = {};
    if (wd) {
      for (var i = 0; i < wd.WEAPONS.length; i++) {
        var w = wd.WEAPONS[i];
        levels[w.id] = mode === "sandbox" ? 3 : 1;
        cooldowns[w.id] = 0;
        maxCooldowns[w.id] = 1;
        weaponKills[w.id] = 0;
      }
      for (var j = 0; j < wd.TACTICALS.length; j++) {
        var t = wd.TACTICALS[j];
        levels[t.id] = mode === "sandbox" ? 3 : 1;
        cooldowns[t.id] = 0;
        maxCooldowns[t.id] = 1;
        weaponKills[t.id] = 0;
      }
    }

    return {
      mode: mode || "survival",
      map: map,
      time: 0,
      nextId: 1,
      player: {
        x: map.width / 2,
        y: map.height / 2,
        vx: 0,
        vy: 0,
        radius: 16,
        angle: 0,
        hp: 100,
        maxHp: 100,
        armor: mode === "sandbox" ? 100 : 50,
        maxArmor: 100,
        speed: 260,
        dashCooldown: 0,
        dashMaxCooldown: 1.5,
        dashTimer: 0,
        dashDirX: 0,
        dashDirY: 0,
        invulnTimer: 0,
        slowTimer: 0,
        slowFactor: 1,
        overdriveTimer: 0,
        muzzleFlash: 0,
        activeWeaponId: "rifle",
        weaponLevels: levels,
        weaponCooldowns: cooldowns,
        weaponMaxCooldowns: maxCooldowns,
        afterimages: []
      },
      zombies: [],
      projectiles: [],
      beams: [],
      aircraft: [],
      bombs: [],
      turrets: [],
      fortStructures: [],
      orbitals: [],
      acidPools: [],
      pickups: [],
      particles: [],
      shockwaves: [],
      floatingTexts: [],
      hash: new SpatialHash(72),
      stats: {
        kills: 0,
        score: 0,
        cash: mode === "sandbox" ? 99999 : 150,
        combo: 0,
        maxCombo: 0,
        comboTimer: 0,
        weaponKills: weaponKills,
        shotsFired: 0
      },
      events: {
        screenShake: 0,
        screenFlash: 0,
        flashColor: "#ffffff",
        onBossKill: null,
        onBanner: null
      }
    };
  }

  function safeDirection(dx, dy, fallbackAngle) {
    var len = Math.hypot(dx, dy);
    if (len < 6) {
      return {
        x: Math.cos(fallbackAngle || 0),
        y: Math.sin(fallbackAngle || 0),
        len: 0
      };
    }
    return { x: dx / len, y: dy / len, len: len };
  }

  function addShake(state, amount) {
    state.events.screenShake = Math.min(24, Math.max(state.events.screenShake, amount));
  }

  function spawnParticle(state, opts) {
    if (state.particles.length > 750) return;
    state.particles.push({
      x: opts.x,
      y: opts.y,
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      size: opts.size || 3,
      endSize: opts.endSize != null ? opts.endSize : (opts.size || 3),
      color: opts.color || "#fbbf24",
      alpha: opts.alpha != null ? opts.alpha : 1,
      life: opts.life || 0.35,
      maxLife: opts.life || 0.35,
      drag: opts.drag != null ? opts.drag : 0.92,
      glow: !!opts.glow
    });
  }

  function spawnShockwave(state, x, y, maxRadius, color, life) {
    state.shockwaves.push({
      x: x,
      y: y,
      radius: 8,
      maxRadius: maxRadius || 90,
      color: color || "#fbbf24",
      life: life || 0.28,
      maxLife: life || 0.28
    });
  }

  function spawnFloatingText(state, x, y, text, color, size) {
    if (state.floatingTexts.length > 90) return;
    state.floatingTexts.push({
      x: x,
      y: y,
      vy: -42,
      text: text,
      color: color || "#fde68a",
      size: size || 13,
      life: 0.75,
      maxLife: 0.75
    });
  }

  function spawnZombie(state, type, x, y, waveScale) {
    var proto = ZOMBIE_TYPES[type] || ZOMBIE_TYPES.shambler;
    var scale = waveScale || 1;
    var hpMult = type === "boss" ? (1 + (scale - 1) * 0.85) : (1 + (scale - 1) * 0.30);
    var spdMult = Math.min(1.65, 1 + (scale - 1) * 0.065);
    var z = {
      id: state.nextId++,
      type: type,
      name: proto.name,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      radius: proto.radius,
      hp: Math.round(proto.hp * hpMult),
      maxHp: Math.round(proto.hp * hpMult),
      speed: proto.speed * spdMult * (0.94 + Math.random() * 0.12),
      damage: Math.round(proto.damage * (1 + (scale - 1) * 0.16)),
      attackRate: proto.attackRate,
      attackCooldown: 0.25,
      spitRange: proto.spitRange || 0,
      spitCooldown: 0.8 + Math.random() * 0.8,
      screamRange: proto.screamRange || 0,
      screamCooldown: 0.9 + Math.random() * 0.9,
      screamCharge: 0,
      lastCheckX: x,
      lastCheckY: y,
      stuckCheckTimer: 0.25,
      stuckEscapeTimer: 0,
      stuckBias: Math.random() < 0.5 ? -1 : 1,
      slamCooldown: 3.8,
      summonCooldown: 5.5,
      cash: proto.cash,
      score: proto.score,
      color: proto.color,
      headColor: proto.headColor,
      eyeColor: proto.eyeColor,
      bloodColor: proto.bloodColor,
      knockResist: proto.knockResist,
      angle: 0,
      animPhase: Math.random() * Math.PI * 2,
      hitFlash: 0,
      burnTimer: 0,
      burnDps: 0,
      burnWeapon: "flamethrower",
      slowTimer: 0,
      slowFactor: 1,
      dead: false
    };
    state.map.resolveCircleObstacles(z);
    state.zombies.push(z);
    return z;
  }

  function spawnZombieAtEdge(state, type, waveScale, viewBounds) {
    var m = state.map;
    var margin = 45;
    var x = m.width / 2;
    var y = m.height / 2;
    for (var attempt = 0; attempt < 12; attempt++) {
      var side = Math.floor(Math.random() * 4);
      if (side === 0) {
        x = margin + Math.random() * (m.width - margin * 2);
        y = margin;
      } else if (side === 1) {
        x = m.width - margin;
        y = margin + Math.random() * (m.height - margin * 2);
      } else if (side === 2) {
        x = margin + Math.random() * (m.width - margin * 2);
        y = m.height - margin;
      } else {
        x = margin;
        y = margin + Math.random() * (m.height - margin * 2);
      }
      var distToPlayer = Math.hypot(x - state.player.x, y - state.player.y);
      var outsideView = !viewBounds ||
        x < viewBounds.left - 30 || x > viewBounds.right + 30 ||
        y < viewBounds.top - 30 || y > viewBounds.bottom + 30;
      if (distToPlayer > 420 && outsideView && !m.pointInObstacle(x, y, 24)) {
        break;
      }
    }
    return spawnZombie(state, type, x, y, waveScale);
  }

  function damagePlayer(state, amount, audio) {
    var p = state.player;
    if (p.invulnTimer > 0 || p.hp <= 0) return;
    var remaining = amount;
    if (p.armor > 0) {
      var absorbed = Math.min(p.armor, remaining * 0.62);
      p.armor -= absorbed;
      remaining -= absorbed;
    }
    p.hp = Math.max(0, p.hp - remaining);
    p.invulnTimer = 0.14;
    addShake(state, 10);
    if (audio) audio.playPlayerHurt();
    for (var i = 0; i < 6; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 70 + Math.random() * 90;
      spawnParticle(state, {
        x: p.x,
        y: p.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 3.5,
        endSize: 0.5,
        color: "#ef4444",
        life: 0.25
      });
    }
  }

  function killZombie(state, z, weaponId, audio) {
    if (z.dead) return;
    z.dead = true;

    state.stats.kills += 1;
    state.stats.combo += 1;
    state.stats.comboTimer = 2.8;
    if (state.stats.combo > state.stats.maxCombo) {
      state.stats.maxCombo = state.stats.combo;
    }

    var comboMult = 1 + Math.min(2.5, Math.floor(state.stats.combo / 6) * 0.15);
    var gainedScore = Math.round(z.score * comboMult);
    state.stats.score += gainedScore;

    if (state.mode === "survival") {
      state.stats.cash += z.cash;
    }
    if (weaponId) {
      state.stats.weaponKills[weaponId] = (state.stats.weaponKills[weaponId] || 0) + 1;
    }

    state.map.addBloodDecal(z.x, z.y, z.bloodColor, z.radius * 1.15);
    for (var i = 0; i < (z.type === "boss" ? 28 : 8); i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 55 + Math.random() * (z.type === "boss" ? 260 : 150);
      spawnParticle(state, {
        x: z.x,
        y: z.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: z.type === "boss" ? 6 : 3.5,
        endSize: 0.5,
        color: z.type === "spitter" ? "#84cc16" : "#b91c1c",
        life: 0.35 + Math.random() * 0.2
      });
    }

    if (z.type === "exploder") {
      var proto = ZOMBIE_TYPES.exploder;
      detonateExplosion(state, z.x, z.y, proto.explodeRadius, proto.friendlyExplodeDamage, weaponId || "exploder", audio, false);
      var dp = Math.hypot(state.player.x - z.x, state.player.y - z.y);
      if (dp < proto.explodeRadius) {
        var falloff = 1 - dp / proto.explodeRadius;
        damagePlayer(state, Math.round(proto.explodeDamage * Math.max(0.35, falloff)), audio);
      }
    }

    if (z.type === "boss") {
      spawnShockwave(state, z.x, z.y, 220, "#a855f7", 0.5);
      spawnFloatingText(state, z.x, z.y - 24, "BOSS DEFEATED +$" + z.cash, "#b45309", 17);
      dropPickup(state, "medkit", z.x - 18, z.y);
      dropPickup(state, "overdrive", z.x + 18, z.y);
      if (typeof state.events.onBossKill === "function") {
        state.events.onBossKill(z);
      }
    } else {
      // Drop chance for pickups
      var roll = Math.random();
      if (z.type === "brute") {
        if (roll < 0.34) dropPickup(state, "medkit", z.x, z.y);
        else if (roll < 0.65) dropPickup(state, "cash", z.x, z.y);
      } else {
        if (roll < 0.045) dropPickup(state, "medkit", z.x, z.y);
        else if (roll < 0.095) dropPickup(state, "cash", z.x, z.y);
        else if (roll < 0.112) dropPickup(state, "overdrive", z.x, z.y);
        else if (roll < 0.117) dropPickup(state, "nuke", z.x, z.y);
      }
    }

    if (audio) audio.playZombieDeath();
  }

  function dropPickup(state, type, x, y) {
    if (state.pickups.length > 45) return;
    state.pickups.push({
      type: type,
      x: x,
      y: y,
      radius: 14,
      life: 24,
      bobPhase: Math.random() * Math.PI * 2
    });
  }

  function damageZombie(state, z, dmg, knockX, knockY, weaponId, audio) {
    if (z.dead) return false;
    z.hp -= dmg;
    z.hitFlash = 0.09;
    if (knockX || knockY) {
      var res = z.knockResist != null ? z.knockResist : 1;
      z.x += knockX * res;
      z.y += knockY * res;
      state.map.resolveCircleObstacles(z);
    }
    if (z.hp <= 0) {
      killZombie(state, z, weaponId, audio);
      return true;
    } else if (audio) {
      audio.playHit();
    }
    return false;
  }

  function detonateExplosion(state, x, y, radius, damage, weaponId, audio, hitFlash) {
    state.map.addScorchDecal(x, y, radius * 0.72);
    spawnShockwave(state, x, y, radius, "#fb923c", 0.3);
    addShake(state, Math.min(18, radius * 0.1));
    if (hitFlash) {
      state.events.screenFlash = 0.1;
      state.events.flashColor = "rgba(255, 190, 90, 0.22)";
    }

    var pCount = Math.min(34, Math.max(14, Math.floor(radius * 0.22)));
    for (var i = 0; i < pCount; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 70 + Math.random() * (radius * 2.3);
      var isSmoke = i % 3 === 0;
      spawnParticle(state, {
        x: x + Math.cos(ang) * 6,
        y: y + Math.sin(ang) * 6,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: isSmoke ? 12 : 6,
        endSize: isSmoke ? 24 : 1,
        color: isSmoke ? "#334155" : (i % 2 === 0 ? "#fbbf24" : "#f97316"),
        alpha: isSmoke ? 0.55 : 1,
        life: isSmoke ? 0.55 : 0.32,
        drag: 0.88,
        glow: !isSmoke
      });
    }

    var nearby = state.hash.query(x, y, radius + 38);
    for (var j = 0; j < nearby.length; j++) {
      var z = nearby[j];
      if (z.dead) continue;
      var dx = z.x - x;
      var dy = z.y - y;
      var d = Math.hypot(dx, dy);
      if (d <= radius + z.radius) {
        var falloff = Math.max(0.35, 1 - (d / (radius + z.radius)) * 0.65);
        var nx = d > 0.01 ? dx / d : 0;
        var ny = d > 0.01 ? dy / d : 0;
        damageZombie(state, z, Math.round(damage * falloff), nx * 24 * falloff, ny * 24 * falloff, weaponId, null);
      }
    }
    if (audio) audio.playExplosion(Math.min(1.6, radius / 95));
  }

  function triggerDash(state, moveX, moveY, audio) {
    var p = state.player;
    if (p.dashCooldown > 0 || p.dashTimer > 0) return false;
    var dir = safeDirection(moveX, moveY, p.angle);
    p.dashDirX = dir.x;
    p.dashDirY = dir.y;
    p.dashTimer = 0.17;
    p.dashCooldown = p.dashMaxCooldown;
    p.invulnTimer = Math.max(p.invulnTimer, 0.24);
    if (audio) audio.playDash();
    return true;
  }

  function spawnA10(state, targetX, targetY, level, audio) {
    var wd = getWeaponData();
    var def = wd.WEAPON_BY_ID.a10;
    var stats = wd.getScaledStats(def, level);
    var p = state.player;
    var dir = safeDirection(targetX - p.x, targetY - p.y, p.angle);
    var perpX = -dir.y;
    var perpY = dir.x;
    var planes = stats.planes || 1;
    var speed = 1180;
    var travelHalf = 1050;

    for (var i = 0; i < planes; i++) {
      var laneIdx = i - (planes - 1) / 2;
      var lateral = laneIdx * 62;
      var cx = targetX + perpX * lateral;
      var cy = targetY + perpY * lateral;
      var startX = cx - dir.x * travelHalf;
      var startY = cy - dir.y * travelHalf;
      var totalDist = travelHalf * 2;
      state.aircraft.push({
        kind: "a10",
        x: startX,
        y: startY,
        vx: dir.x * speed,
        vy: dir.y * speed,
        dirX: dir.x,
        dirY: dir.y,
        angle: Math.atan2(dir.y, dir.x),
        delay: Math.abs(laneIdx) * 0.14,
        elapsed: 0,
        totalTime: totalDist / speed,
        strafeStart: 0.25,
        strafeEnd: 0.72,
        roundsLeft: stats.roundsPerPlane,
        fireAccum: 0,
        damage: stats.damage,
        blastRadius: stats.blastRadius,
        weaponId: "a10",
        soundPlayed: false
      });
    }
    if (audio) audio.playJetStrafe();
  }

  function spawnBomber(state, targetX, targetY, level, audio) {
    var wd = getWeaponData();
    var def = wd.WEAPON_BY_ID.bomber;
    var stats = wd.getScaledStats(def, level);
    var p = state.player;
    var dir = safeDirection(targetX - p.x, targetY - p.y, p.angle);
    var perpX = -dir.y;
    var perpY = dir.x;
    var planes = stats.planes || 1;
    var speed = 470;
    var travelHalf = 920;

    for (var i = 0; i < planes; i++) {
      var laneIdx = i - (planes - 1) / 2;
      var lateral = laneIdx * 95;
      var cx = targetX + perpX * lateral;
      var cy = targetY + perpY * lateral;
      var startX = cx - dir.x * travelHalf;
      var startY = cy - dir.y * travelHalf;
      var totalDist = travelHalf * 2;
      state.aircraft.push({
        kind: "bomber",
        x: startX,
        y: startY,
        vx: dir.x * speed,
        vy: dir.y * speed,
        dirX: dir.x,
        dirY: dir.y,
        angle: Math.atan2(dir.y, dir.x),
        delay: Math.abs(laneIdx) * 0.22,
        elapsed: 0,
        totalTime: totalDist / speed,
        dropStart: 0.24,
        dropEnd: 0.76,
        bombsLeft: stats.bombsPerPlane,
        totalBombs: stats.bombsPerPlane,
        dropAccum: 0,
        damage: stats.damage,
        blastRadius: stats.blastRadius,
        weaponId: "bomber"
      });
    }
    if (audio) audio.playBomberPass();
  }

  function spawnChopper(state, targetX, targetY, level, audio) {
    var wd = getWeaponData();
    var def = wd.WEAPON_BY_ID.chopper;
    var stats = wd.getScaledStats(def, level);
    var maxAllowed = state.mode === "sandbox" ? stats.maxActive + 3 : stats.maxActive;
    var activeChoppers = [];
    for (var i = 0; i < state.aircraft.length; i++) {
      if (state.aircraft[i].kind === "chopper") activeChoppers.push(state.aircraft[i]);
    }
    if (activeChoppers.length >= maxAllowed) {
      // Remove oldest chopper
      var idx = state.aircraft.indexOf(activeChoppers[0]);
      if (idx >= 0) state.aircraft.splice(idx, 1);
    }

    var p = state.player;
    var dir = safeDirection(targetX - p.x, targetY - p.y, p.angle);
    var spawnX = Math.max(40, Math.min(state.map.width - 40, p.x - dir.x * 520));
    var spawnY = Math.max(40, Math.min(state.map.height - 40, p.y - dir.y * 520));

    state.aircraft.push({
      kind: "chopper",
      x: spawnX,
      y: spawnY,
      anchorX: targetX,
      anchorY: targetY,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitRadius: 155,
      angle: Math.atan2(targetY - spawnY, targetX - spawnX),
      rotorAngle: 0,
      life: stats.duration,
      maxLife: stats.duration,
      gunCooldown: 0.25,
      rocketCooldown: 1.1,
      damage: stats.damage,
      rocketDamage: stats.rocketDamage,
      blastRadius: stats.blastRadius,
      range: stats.range,
      weaponId: "chopper"
    });
    if (audio) audio.playChopperShot();
  }

  function firePrimaryWeapon(state, targetX, targetY, audio) {
    var wd = getWeaponData();
    if (!wd) return false;
    var p = state.player;
    var weaponId = p.activeWeaponId;
    var def = wd.WEAPON_BY_ID[weaponId];
    if (!def) return false;

    if ((p.weaponCooldowns[weaponId] || 0) > 0) return false;

    var lv = p.weaponLevels[weaponId] || 1;
    var stats = wd.getScaledStats(def, lv);
    var overdriveMult = p.overdriveTimer > 0 ? 1.45 : 1.0;
    var sandboxAirMult = (state.mode === "sandbox" && def.category === "air") ? 0.35 : 1.0;

    var cooldown = stats.cooldown * sandboxAirMult;
    if (def.category !== "air") {
      cooldown = cooldown / overdriveMult;
    }
    p.weaponCooldowns[weaponId] = cooldown;
    p.weaponMaxCooldowns[weaponId] = cooldown;

    var dir = safeDirection(targetX - p.x, targetY - p.y, p.angle);
    var baseAngle = Math.atan2(dir.y, dir.x);
    p.angle = baseAngle;
    state.stats.shotsFired += 1;

    // Air support weapons
    if (weaponId === "a10") {
      spawnA10(state, targetX, targetY, lv, audio);
      return true;
    }
    if (weaponId === "bomber") {
      spawnBomber(state, targetX, targetY, lv, audio);
      return true;
    }
    if (weaponId === "chopper") {
      spawnChopper(state, targetX, targetY, lv, audio);
      return true;
    }

    var muzzleX = p.x + Math.cos(baseAngle) * 22;
    var muzzleY = p.y + Math.sin(baseAngle) * 22;
    p.muzzleFlash = 0.075;

    // Railgun instant piercing beam
    if (weaponId === "railgun") {
      var endX = muzzleX + Math.cos(baseAngle) * stats.range;
      var endY = muzzleY + Math.sin(baseAngle) * stats.range;
      var wallHit = state.map.segmentHitsObstacle(muzzleX, muzzleY, endX, endY);
      if (wallHit) {
        endX = wallHit.x;
        endY = wallHit.y;
      }
      var maxDist = Math.hypot(endX - muzzleX, endY - muzzleY);
      var rx = Math.cos(baseAngle);
      var ry = Math.sin(baseAngle);

      // Find zombies intersecting ray, sorted by distance
      var hits = [];
      for (var zi = 0; zi < state.zombies.length; zi++) {
        var z = state.zombies[zi];
        if (z.dead) continue;
        var vx = z.x - muzzleX;
        var vy = z.y - muzzleY;
        var proj = vx * rx + vy * ry;
        if (proj < -z.radius || proj > maxDist + z.radius) continue;
        var perpDist = Math.abs(vx * (-ry) + vy * rx);
        if (perpDist <= z.radius + 7) {
          hits.push({ zombie: z, dist: proj });
        }
      }
      hits.sort(function (a, b) { return a.dist - b.dist; });
      var pierceLimit = Math.min(hits.length, stats.pierce);
      for (var hi = 0; hi < pierceLimit; hi++) {
        var hz = hits[hi].zombie;
        damageZombie(state, hz, stats.damage, rx * 14, ry * 14, "railgun", null);
        for (var sp = 0; sp < 5; sp++) {
          spawnParticle(state, {
            x: hz.x,
            y: hz.y,
            vx: (Math.random() - 0.5) * 180 + rx * 90,
            vy: (Math.random() - 0.5) * 180 + ry * 90,
            size: 3,
            endSize: 0.5,
            color: "#fef08a",
            life: 0.25,
            glow: true
          });
        }
      }
      state.beams.push({
        kind: "rail",
        points: [{ x: muzzleX, y: muzzleY }, { x: endX, y: endY }],
        color: "#0284c7",
        width: 7,
        life: 0.22,
        maxLife: 0.22
      });
      addShake(state, 5);
      if (audio) audio.playRailgun();
      return true;
    }

    // Tesla chain lightning
    if (weaponId === "tesla") {
      var candidates = state.hash.query(p.x, p.y, stats.range);
      var bestTarget = null;
      var bestScore = Infinity;
      for (var ci = 0; ci < candidates.length; ci++) {
        var cz = candidates[ci];
        if (cz.dead) continue;
        var dx = cz.x - muzzleX;
        var dy = cz.y - muzzleY;
        var dist = Math.hypot(dx, dy);
        if (dist > stats.range) continue;
        var angDiff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - baseAngle), Math.cos(Math.atan2(dy, dx) - baseAngle)));
        if (angDiff < 0.72) {
          var score = dist * (0.6 + angDiff);
          if (score < bestScore) {
            bestScore = score;
            bestTarget = cz;
          }
        }
      }

      if (!bestTarget) {
        // Discharge cosmetic bolt toward aim
        var tx = muzzleX + Math.cos(baseAngle) * Math.min(260, stats.range);
        var ty = muzzleY + Math.sin(baseAngle) * Math.min(260, stats.range);
        state.beams.push({
          kind: "lightning",
          points: buildLightningPoints(muzzleX, muzzleY, tx, ty),
          color: "#0284c7",
          width: 3,
          life: 0.16,
          maxLife: 0.16
        });
        if (audio) audio.playTesla();
        return true;
      }

      var chained = [];
      var usedIds = Object.create(null);
      var curr = bestTarget;
      var prevX = muzzleX;
      var prevY = muzzleY;
      for (var jump = 0; jump < stats.chainCount && curr; jump++) {
        usedIds[curr.id] = true;
        chained.push({ x1: prevX, y1: prevY, x2: curr.x, y2: curr.y });
        curr.slowTimer = 1.4;
        curr.slowFactor = stats.slowFactor;
        var jumpDmg = Math.round(stats.damage * Math.pow(0.9, jump));
        damageZombie(state, curr, jumpDmg, 0, 0, "tesla", null);
        spawnParticle(state, {
          x: curr.x,
          y: curr.y,
          vx: (Math.random() - 0.5) * 90,
          vy: (Math.random() - 0.5) * 90,
          size: 4,
          endSize: 0.5,
          color: "#67e8f9",
          life: 0.2,
          glow: true
        });
        prevX = curr.x;
        prevY = curr.y;

        // Find next nearest zombie within 230px
        var nearJump = state.hash.query(prevX, prevY, 230);
        var nextZ = null;
        var nextDist = Infinity;
        for (var nj = 0; nj < nearJump.length; nj++) {
          var nz = nearJump[nj];
          if (nz.dead || usedIds[nz.id]) continue;
          var jd = Math.hypot(nz.x - prevX, nz.y - prevY);
          if (jd < 230 && jd < nextDist) {
            nextDist = jd;
            nextZ = nz;
          }
        }
        curr = nextZ;
      }

      for (var bi = 0; bi < chained.length; bi++) {
        var seg = chained[bi];
        state.beams.push({
          kind: "lightning",
          points: buildLightningPoints(seg.x1, seg.y1, seg.x2, seg.y2),
          color: "#0284c7",
          width: 3.5,
          life: 0.18,
          maxLife: 0.18
        });
      }
      if (audio) audio.playTesla();
      return true;
    }

    // Standard / Shotgun / Minigun / Flamethrower / RPG projectiles
    var pellets = stats.pellets || 1;
    for (var pi = 0; pi < pellets; pi++) {
      var angleOffset = (Math.random() - 0.5) * (stats.spread || 0);
      if (weaponId === "shotgun" && pellets > 1) {
        var frac = pi / (pellets - 1) - 0.5;
        angleOffset = frac * stats.spread + (Math.random() - 0.5) * 0.05;
      }
      var shotAng = baseAngle + angleOffset;
      var kind = weaponId === "flamethrower" ? "flame" : weaponId === "rpg" ? "rocket" : "bullet";
      state.projectiles.push({
        id: state.nextId++,
        kind: kind,
        weaponId: weaponId,
        x: muzzleX,
        y: muzzleY,
        prevX: muzzleX,
        prevY: muzzleY,
        vx: Math.cos(shotAng) * stats.speed * (kind === "flame" ? (0.85 + Math.random() * 0.3) : 1),
        vy: Math.sin(shotAng) * stats.speed * (kind === "flame" ? (0.85 + Math.random() * 0.3) : 1),
        radius: kind === "rocket" ? 6 : kind === "flame" ? 9 : 3.5,
        damage: stats.damage,
        pierceLeft: stats.pierce || 1,
        blastRadius: stats.blastRadius || 0,
        burnDamage: stats.burnDamage || 0,
        burnDuration: stats.burnDuration || 0,
        rangeLeft: stats.range,
        life: kind === "flame" ? 0.65 : 2.5,
        maxLife: kind === "flame" ? 0.65 : 2.5,
        hitIds: Object.create(null),
        knockback: weaponId === "shotgun" ? 13 : weaponId === "rifle" ? 5 : weaponId === "minigun" ? 3.5 : 1,
        color: weaponId === "minigun" ? "#c2410c" : weaponId === "shotgun" ? "#d97706" : "#b45309"
      });
    }

    if (weaponId === "rifle" || weaponId === "minigun" || weaponId === "shotgun") {
      var ejectAng = baseAngle + Math.PI * 0.55 + (Math.random() - 0.5) * 0.4;
      state.map.addCasingDecal(
        p.x + Math.cos(ejectAng) * (10 + Math.random() * 12),
        p.y + Math.sin(ejectAng) * (10 + Math.random() * 12),
        Math.random() * Math.PI
      );
    }

    if (weaponId === "shotgun") addShake(state, 3.5);
    else if (weaponId === "rpg") addShake(state, 4.5);

    if (audio) {
      if (weaponId === "rifle") audio.playRifle();
      else if (weaponId === "shotgun") audio.playShotgun();
      else if (weaponId === "minigun") audio.playMinigun();
      else if (weaponId === "flamethrower") audio.playFlame();
      else if (weaponId === "rpg") audio.playRocketLaunch();
    }
    return true;
  }

  function buildLightningPoints(x1, y1, x2, y2) {
    var pts = [{ x: x1, y: y1 }];
    var segs = 6;
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.hypot(dx, dy);
    var nx = len > 1 ? -dy / len : 0;
    var ny = len > 1 ? dx / len : 1;
    for (var i = 1; i < segs; i++) {
      var t = i / segs;
      var jitter = (Math.random() - 0.5) * Math.min(28, len * 0.14);
      pts.push({
        x: x1 + dx * t + nx * jitter,
        y: y1 + dy * t + ny * jitter
      });
    }
    pts.push({ x: x2, y: y2 });
    return pts;
  }

  function triggerTactical(state, tacticalId, targetX, targetY, audio) {
    var wd = getWeaponData();
    if (!wd) return { ok: false, reason: "Missing weapon data" };
    var def = wd.TACTICAL_BY_ID[tacticalId];
    if (!def) return { ok: false, reason: "Unknown tactical" };

    var p = state.player;
    if ((p.weaponCooldowns[tacticalId] || 0) > 0) {
      return { ok: false, reason: "Cooling down" };
    }

    var cost = state.mode === "sandbox" ? 0 : (def.survivalCost || 0);
    if (state.stats.cash < cost) {
      spawnFloatingText(state, p.x, p.y - 28, "NEED $" + cost, "#b91c1c", 13);
      return { ok: false, reason: "Not enough cash" };
    }

    var lv = p.weaponLevels[tacticalId] || 1;
    var stats = wd.getScaledStats(def, lv);

    state.stats.cash -= cost;
    var cd = state.mode === "sandbox" ? stats.cooldown * 0.45 : stats.cooldown;
    p.weaponCooldowns[tacticalId] = cd;
    p.weaponMaxCooldowns[tacticalId] = cd;

    if (tacticalId === "turret") {
      var maxTurrets = state.mode === "sandbox" ? stats.maxActive + 4 : stats.maxActive;
      if (state.turrets.length >= maxTurrets) {
        state.turrets.shift();
      }
      var dir = safeDirection(targetX - p.x, targetY - p.y, p.angle);
      var tx = p.x + dir.x * 42;
      var ty = p.y + dir.y * 42;
      var turret = {
        id: state.nextId++,
        x: tx,
        y: ty,
        radius: 17,
        angle: Math.atan2(dir.y, dir.x),
        life: stats.duration,
        maxLife: stats.duration,
        hp: stats.hp,
        maxHp: stats.hp,
        fireCooldown: 0.2,
        fireRate: stats.fireRate,
        damage: stats.damage,
        range: stats.range,
        muzzleFlash: 0
      };
      state.map.resolveCircleObstacles(turret);
      state.turrets.push(turret);
      spawnShockwave(state, turret.x, turret.y, 44, "#a78bfa", 0.24);
      if (audio) audio.playSwitch();
      return { ok: true };
    }

    if (tacticalId === "orbital") {
      state.orbitals.push({
        id: state.nextId++,
        x: targetX,
        y: targetY,
        radius: stats.radius,
        damagePerSec: stats.damagePerSec,
        life: stats.duration,
        maxLife: stats.duration,
        tickAccum: 0
      });
      addShake(state, 10);
      if (audio) audio.playOrbitalLaser();
      return { ok: true };
    }

    return { ok: false, reason: "Unsupported" };
  }

  function updateWorld(state, dt, input, audio) {
    state.time += dt;
    var p = state.player;
    var m = state.map;

    // Decay screen effects & combo
    if (state.events.screenShake > 0) {
      state.events.screenShake = Math.max(0, state.events.screenShake - dt * 36);
    }
    if (state.events.screenFlash > 0) {
      state.events.screenFlash = Math.max(0, state.events.screenFlash - dt);
    }
    if (state.stats.comboTimer > 0) {
      state.stats.comboTimer -= dt;
      if (state.stats.comboTimer <= 0) {
        state.stats.combo = 0;
      }
    }

    // Player timers & cooldowns
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.slowTimer > 0) p.slowTimer = Math.max(0, p.slowTimer - dt);
    if (p.overdriveTimer > 0) p.overdriveTimer = Math.max(0, p.overdriveTimer - dt);
    if (p.muzzleFlash > 0) p.muzzleFlash = Math.max(0, p.muzzleFlash - dt);
    if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);

    for (var wk in p.weaponCooldowns) {
      if (p.weaponCooldowns[wk] > 0) {
        p.weaponCooldowns[wk] = Math.max(0, p.weaponCooldowns[wk] - dt);
      }
    }

    // Player movement
    var moveX = (input && input.moveX) || 0;
    var moveY = (input && input.moveY) || 0;
    var wd = getWeaponData();
    var activeDef = wd ? wd.WEAPON_BY_ID[p.activeWeaponId] : null;
    var moveSlow = (input && input.firing && activeDef && activeDef.baseStats.moveSlow) ? activeDef.baseStats.moveSlow : 1;
    var slowMult = p.slowTimer > 0 ? (p.slowFactor || 0.72) : 1;
    var speedMult = (p.overdriveTimer > 0 ? 1.25 : 1) * moveSlow * slowMult;

    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      var dashSpeed = 760;
      p.x += p.dashDirX * dashSpeed * dt;
      p.y += p.dashDirY * dashSpeed * dt;
      p.afterimages.push({ x: p.x, y: p.y, angle: p.angle, life: 0.16, maxLife: 0.16 });
    } else {
      var moveLen = Math.hypot(moveX, moveY);
      if (moveLen > 0.01) {
        var nx = moveX / moveLen;
        var ny = moveY / moveLen;
        p.vx = nx * p.speed * speedMult;
        p.vy = ny * p.speed * speedMult;
      } else {
        p.vx *= Math.pow(0.001, dt);
        p.vy *= Math.pow(0.001, dt);
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    m.resolveCircleObstacles(p);
    if (state.fortStructures.length > 0) {
      resolveCircleFortStructures(p, state.fortStructures, true);
    }

    if (input && typeof input.mouseWorldX === "number" && typeof input.mouseWorldY === "number") {
      var adx = input.mouseWorldX - p.x;
      var ady = input.mouseWorldY - p.y;
      if (adx * adx + ady * ady > 4) {
        p.angle = Math.atan2(ady, adx);
      }
    }

    for (var ai = p.afterimages.length - 1; ai >= 0; ai--) {
      p.afterimages[ai].life -= dt;
      if (p.afterimages[ai].life <= 0) p.afterimages.splice(ai, 1);
    }

    // Rebuild spatial hash and update flow field toward player
    state.hash.clear();
    for (var zi = 0; zi < state.zombies.length; zi++) {
      if (!state.zombies[zi].dead) {
        state.hash.insert(state.zombies[zi]);
      }
    }
    if (typeof m.updateFlowField === "function") {
      m.updateFlowField(p.x, p.y);
    }

    // Fire primary weapon if trigger held
    if (input && input.firing && p.hp > 0) {
      firePrimaryWeapon(state, input.mouseWorldX, input.mouseWorldY, audio);
    }

    // Update Aircraft (A-10, B-52, Apache)
    updateAircraft(state, dt, audio);

    // Update Falling Bombs
    updateBombs(state, dt, audio);

    // Update Turrets
    updateTurrets(state, dt, audio);

    // Update Orbital Lasers
    updateOrbitals(state, dt, input, audio);

    // Update Projectiles
    updateProjectiles(state, dt, audio);

    // Update Acid Pools
    updateAcidPools(state, dt, audio);

    // Update Zombies
    updateZombies(state, dt, audio);

    // Update Pickups
    updatePickups(state, dt, audio);

    // Update Visual FX (beams, shockwaves, particles, floating texts)
    updateEffects(state, dt);
  }

  function updateAircraft(state, dt, audio) {
    for (var i = state.aircraft.length - 1; i >= 0; i--) {
      var ac = state.aircraft[i];
      if (ac.kind === "a10") {
        if (ac.delay > 0) {
          ac.delay -= dt;
          continue;
        }
        ac.elapsed += dt;
        ac.x += ac.vx * dt;
        ac.y += ac.vy * dt;
        var prog = ac.elapsed / ac.totalTime;

        // Wingtip contrail particles
        if (Math.random() < 0.75) {
          var perpX = -ac.dirY * 32;
          var perpY = ac.dirX * 32;
          spawnParticle(state, { x: ac.x + perpX, y: ac.y + perpY, size: 3, endSize: 7, color: "rgba(226,232,240,0.4)", life: 0.4 });
          spawnParticle(state, { x: ac.x - perpX, y: ac.y - perpY, size: 3, endSize: 7, color: "rgba(226,232,240,0.4)", life: 0.4 });
        }

        if (prog >= ac.strafeStart && prog <= ac.strafeEnd && ac.roundsLeft > 0) {
          ac.fireAccum += dt;
          var interval = (ac.totalTime * (ac.strafeEnd - ac.strafeStart)) / Math.max(1, ac.roundsLeft + 2);
          if (ac.fireAccum >= Math.max(0.025, interval)) {
            ac.fireAccum = 0;
            ac.roundsLeft -= 1;
            var impactX = ac.x + ac.dirX * 260 + (Math.random() - 0.5) * 76;
            var impactY = ac.y + ac.dirY * 260 + (Math.random() - 0.5) * 76;
            impactX = Math.max(30, Math.min(state.map.width - 30, impactX));
            impactY = Math.max(30, Math.min(state.map.height - 30, impactY));
            state.beams.push({
              kind: "tracer",
              points: [{ x: ac.x + ac.dirX * 28, y: ac.y + ac.dirY * 28 }, { x: impactX, y: impactY }],
              color: "#b45309",
              width: 3,
              life: 0.08,
              maxLife: 0.08
            });
            detonateExplosion(state, impactX, impactY, ac.blastRadius, ac.damage, "a10", audio, false);
          }
        }
        if (ac.elapsed >= ac.totalTime) {
          state.aircraft.splice(i, 1);
        }
      } else if (ac.kind === "bomber") {
        if (ac.delay > 0) {
          ac.delay -= dt;
          continue;
        }
        ac.elapsed += dt;
        ac.x += ac.vx * dt;
        ac.y += ac.vy * dt;
        var bprog = ac.elapsed / ac.totalTime;

        if (Math.random() < 0.8) {
          var pX = -ac.dirY;
          var pY = ac.dirX;
          var offsets = [-46, -24, 24, 46];
          for (var oi = 0; oi < offsets.length; oi++) {
            spawnParticle(state, {
              x: ac.x + pX * offsets[oi] - ac.dirX * 12,
              y: ac.y + pY * offsets[oi] - ac.dirY * 12,
              size: 4,
              endSize: 9,
              color: "rgba(203,213,225,0.35)",
              life: 0.55
            });
          }
        }

        if (bprog >= ac.dropStart && bprog <= ac.dropEnd && ac.bombsLeft > 0) {
          ac.dropAccum += dt;
          var dropInterval = (ac.totalTime * (ac.dropEnd - ac.dropStart)) / Math.max(1, ac.totalBombs);
          if (ac.dropAccum >= dropInterval) {
            ac.dropAccum = 0;
            ac.bombsLeft -= 1;
            var bx = Math.max(40, Math.min(state.map.width - 40, ac.x + (Math.random() - 0.5) * 65));
            var by = Math.max(40, Math.min(state.map.height - 40, ac.y + (Math.random() - 0.5) * 65));
            state.bombs.push({
              x: bx,
              y: by,
              z: 1.0,
              fallTime: 0.48,
              damage: ac.damage,
              blastRadius: ac.blastRadius,
              weaponId: "bomber"
            });
          }
        }
        if (ac.elapsed >= ac.totalTime) {
          state.aircraft.splice(i, 1);
        }
      } else if (ac.kind === "chopper") {
        ac.life -= dt;
        ac.rotorAngle += dt * 26;
        ac.orbitAngle += dt * 1.15;
        // Gently follow player area while orbiting
        var desiredAnchorX = state.player.x * 0.55 + ac.anchorX * 0.45;
        var desiredAnchorY = state.player.y * 0.55 + ac.anchorY * 0.45;
        var goalX = desiredAnchorX + Math.cos(ac.orbitAngle) * ac.orbitRadius;
        var goalY = desiredAnchorY + Math.sin(ac.orbitAngle) * ac.orbitRadius;
        ac.x += (goalX - ac.x) * Math.min(1, dt * 3.2);
        ac.y += (goalY - ac.y) * Math.min(1, dt * 3.2);

        // Acquire nearest zombie
        var nearest = findNearestZombie(state, ac.x, ac.y, ac.range);
        if (nearest) {
          var targetAng = Math.atan2(nearest.y - ac.y, nearest.x - ac.x);
          ac.angle = lerpAngle(ac.angle, targetAng, dt * 8);
          ac.gunCooldown -= dt;
          if (ac.gunCooldown <= 0) {
            ac.gunCooldown = 0.14;
            var spread = (Math.random() - 0.5) * 0.12;
            var sa = targetAng + spread;
            state.projectiles.push({
              id: state.nextId++,
              kind: "bullet",
              weaponId: "chopper",
              ignoreObstacles: true,
              x: ac.x + Math.cos(ac.angle) * 24,
              y: ac.y + Math.sin(ac.angle) * 24,
              prevX: ac.x,
              prevY: ac.y,
              vx: Math.cos(sa) * 1120,
              vy: Math.sin(sa) * 1120,
              radius: 4,
              damage: ac.damage,
              pierceLeft: 1,
              blastRadius: 0,
              rangeLeft: ac.range + 150,
              life: 1.5,
              maxLife: 1.5,
              hitIds: Object.create(null),
              knockback: 4,
              color: "#34d399"
            });
            if (audio) audio.playChopperShot();
          }
          ac.rocketCooldown -= dt;
          if (ac.rocketCooldown <= 0) {
            ac.rocketCooldown = 1.45;
            for (var side = -1; side <= 1; side += 2) {
              var perpX = -Math.sin(ac.angle) * 16 * side;
              var perpY = Math.cos(ac.angle) * 16 * side;
              var ra = targetAng + side * 0.06;
              state.projectiles.push({
                id: state.nextId++,
                kind: "rocket",
                weaponId: "chopper",
                ignoreObstacles: true,
                x: ac.x + perpX,
                y: ac.y + perpY,
                prevX: ac.x + perpX,
                prevY: ac.y + perpY,
                vx: Math.cos(ra) * 760,
                vy: Math.sin(ra) * 760,
                radius: 5,
                damage: ac.rocketDamage,
                pierceLeft: 1,
                blastRadius: ac.blastRadius,
                rangeLeft: ac.range + 200,
                life: 1.8,
                maxLife: 1.8,
                hitIds: Object.create(null),
                knockback: 0,
                color: "#2dd4bf"
              });
            }
            if (audio) audio.playRocketLaunch();
          }
        } else {
          ac.angle = lerpAngle(ac.angle, ac.orbitAngle + Math.PI / 2, dt * 4);
        }

        if (ac.life <= 0) {
          state.aircraft.splice(i, 1);
        }
      }
    }
  }

  function updateBombs(state, dt, audio) {
    for (var i = state.bombs.length - 1; i >= 0; i--) {
      var b = state.bombs[i];
      b.z -= dt / b.fallTime;
      if (b.z <= 0) {
        detonateExplosion(state, b.x, b.y, b.blastRadius, b.damage, b.weaponId, audio, false);
        state.bombs.splice(i, 1);
      }
    }
  }

  var FORT_DEFS = {
    wood_wall: {
      id: "wood_wall",
      name: "Wooden Wall",
      kind: "structure",
      wH: 96, hH: 42, wV: 24, hV: 96,
      hp: 360,
      blocksPlayer: true,
      blocksZombies: true,
      spriteH: "wood_wall_h",
      spriteV: "wood_wall_v",
      color: "#8b5a2b"
    },
    reinforced_wall: {
      id: "reinforced_wall",
      name: "Reinforced Wall",
      kind: "structure",
      wH: 96, hH: 42, wV: 24, hV: 96,
      hp: 950,
      blocksPlayer: true,
      blocksZombies: true,
      spriteH: "reinforced_wall_h",
      spriteV: "reinforced_wall_v",
      color: "#57534e"
    },
    fort_gate: {
      id: "fort_gate",
      name: "Fort Gate",
      kind: "structure",
      wH: 64, hH: 46, wV: 28, hV: 72,
      hp: 560,
      blocksPlayer: false,
      blocksZombies: true,
      spriteH: "fort_gate_h",
      spriteV: "fort_gate_v",
      color: "#78350f"
    },
    wire_fence: {
      id: "wire_fence",
      name: "Barbed Wire",
      kind: "structure",
      wH: 96, hH: 48, wV: 48, hV: 96,
      hp: 320,
      blocksPlayer: false,
      blocksZombies: false,
      slowFactor: 0.42,
      dps: 24,
      spriteH: "wire_fence_h",
      spriteV: "wire_fence_v",
      color: "#64748b"
    },
    mg_turret: {
      id: "mg_turret",
      name: "MG Turret",
      kind: "defense_turret",
      radius: 17,
      hp: 360,
      range: 360,
      fireRate: 7.5,
      damage: 26,
      color: "#d97706"
    },
    shotgun_turret: {
      id: "shotgun_turret",
      name: "Shotgun Bunker",
      kind: "defense_turret",
      radius: 18,
      hp: 440,
      range: 260,
      fireRate: 1.65,
      damage: 24,
      pellets: 5,
      color: "#ea580c"
    },
    flame_turret: {
      id: "flame_turret",
      name: "Flame Tower",
      kind: "defense_turret",
      radius: 18,
      hp: 400,
      range: 230,
      fireRate: 11.0,
      damage: 14,
      color: "#dc2626"
    },
    tesla_turret: {
      id: "tesla_turret",
      name: "Tesla Coil",
      kind: "defense_turret",
      radius: 18,
      hp: 380,
      range: 320,
      fireRate: 2.2,
      damage: 44,
      chains: 4,
      color: "#0284c7"
    },
    rpg_turret: {
      id: "rpg_turret",
      name: "Rocket Battery",
      kind: "defense_turret",
      radius: 19,
      hp: 420,
      range: 460,
      fireRate: 0.72,
      damage: 145,
      blastRadius: 112,
      color: "#047857"
    }
  };

  function snapFortCoord(val) {
    return Math.round(val / 24) * 24;
  }

  function placeFortItem(state, itemId, worldX, worldY, vertical, audio) {
    if (!state) return false;
    var sx = Math.max(48, Math.min(state.map.width - 48, snapFortCoord(worldX)));
    var sy = Math.max(48, Math.min(state.map.height - 48, snapFortCoord(worldY)));

    if (itemId === "demolish") {
      var removed = false;
      for (var i = state.fortStructures.length - 1; i >= 0; i--) {
        var st = state.fortStructures[i];
        if (worldX >= st.x - 16 && worldX <= st.x + st.w + 16 && worldY >= st.y - 16 && worldY <= st.y + st.h + 16) {
          spawnShockwave(state, st.x + st.w / 2, st.y + st.h / 2, 34, "#94a3b8", 0.2);
          state.fortStructures.splice(i, 1);
          removed = true;
          break;
        }
      }
      if (!removed) {
        for (var j = state.turrets.length - 1; j >= 0; j--) {
          var tur = state.turrets[j];
          if (Math.hypot(tur.x - worldX, tur.y - worldY) < 42) {
            spawnShockwave(state, tur.x, tur.y, 34, "#94a3b8", 0.2);
            state.turrets.splice(j, 1);
            removed = true;
            break;
          }
        }
      }
      if (removed && audio) audio.playSwitch();
      return removed;
    }

    var def = FORT_DEFS[itemId];
    if (!def) return false;

    if (def.kind === "structure") {
      if (state.fortStructures.length >= 160) return false;
      var w = vertical ? def.wV : def.wH;
      var h = vertical ? def.hV : def.hH;
      var rx = Math.round(sx - w / 2);
      var ry = Math.round(sy - h / 2);
      for (var k = 0; k < state.fortStructures.length; k++) {
        var ex = state.fortStructures[k];
        if (Math.abs((ex.x + ex.w / 2) - sx) < 18 && Math.abs((ex.y + ex.h / 2) - sy) < 18) {
          return false;
        }
      }
      state.fortStructures.push({
        id: state.nextId++,
        type: def.id,
        name: def.name,
        x: rx,
        y: ry,
        w: w,
        h: h,
        vertical: !!vertical,
        hp: def.hp,
        maxHp: def.hp,
        blocksPlayer: def.blocksPlayer,
        blocksZombies: def.blocksZombies,
        slowFactor: def.slowFactor || 1,
        dps: def.dps || 0,
        spriteKey: vertical ? def.spriteV : def.spriteH,
        color: def.color,
        hitFlash: 0
      });
      spawnFloatingText(state, sx, sy - 20, def.name.toUpperCase(), "#0f766e", 11);
      if (audio) audio.playTurretDeploy();
      return true;
    }

    if (def.kind === "defense_turret") {
      if (state.turrets.length >= 40) return false;
      for (var ti = 0; ti < state.turrets.length; ti++) {
        if (Math.hypot(state.turrets[ti].x - sx, state.turrets[ti].y - sy) < 34) {
          return false;
        }
      }
      state.turrets.push({
        id: state.nextId++,
        defenseType: def.id,
        name: def.name,
        x: sx,
        y: sy,
        radius: def.radius,
        angle: 0,
        hp: def.hp,
        maxHp: def.hp,
        life: 99999,
        maxLife: 99999,
        permanent: true,
        range: def.range,
        fireRate: def.fireRate,
        fireCooldown: 0.1,
        damage: def.damage,
        pellets: def.pellets || 1,
        chains: def.chains || 0,
        blastRadius: def.blastRadius || 0,
        color: def.color,
        muzzleFlash: 0
      });
      spawnShockwave(state, sx, sy, 36, def.color, 0.25);
      spawnFloatingText(state, sx, sy - 22, def.name.toUpperCase(), def.color, 11);
      if (audio) audio.playTurretDeploy();
      return true;
    }
    return false;
  }

  function repairAllFort(state, audio) {
    if (!state) return;
    var count = 0;
    for (var i = 0; i < state.fortStructures.length; i++) {
      var st = state.fortStructures[i];
      if (st.hp < st.maxHp) {
        st.hp = st.maxHp;
        count++;
      }
    }
    for (var j = 0; j < state.turrets.length; j++) {
      var t = state.turrets[j];
      if (t.hp < t.maxHp) {
        t.hp = t.maxHp;
        count++;
      }
    }
    if (count > 0) {
      spawnFloatingText(state, state.player.x, state.player.y - 30, "FORT REPAIRED (" + count + ")", "#16a34a", 13);
      if (audio) audio.playUpgrade();
    }
  }

  function segmentHitsRect(x1, y1, x2, y2, rx, ry, rw, rh, pad) {
    var p = pad || 0;
    var minX = rx - p;
    var maxX = rx + rw + p;
    var minY = ry - p;
    var maxY = ry + rh + p;
    var dx = x2 - x1;
    var dy = y2 - y1;
    var t0 = 0;
    var t1 = 1;
    var pp = [-dx, dx, -dy, dy];
    var qq = [x1 - minX, maxX - x1, y1 - minY, maxY - y1];
    for (var k = 0; k < 4; k++) {
      if (pp[k] === 0) {
        if (qq[k] < 0) return null;
      } else {
        var t = qq[k] / pp[k];
        if (pp[k] < 0) {
          if (t > t1) return null;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return null;
          if (t < t1) t1 = t;
        }
      }
    }
    if (t0 <= t1 && t0 >= 0 && t0 <= 1) {
      return { t: t0, x: x1 + dx * t0, y: y1 + dy * t0 };
    }
    return null;
  }

  function segmentHitsFortStructure(structures, x1, y1, x2, y2, pad) {
    if (!structures || structures.length === 0) return null;
    var bestT = 2;
    var best = null;
    for (var i = 0; i < structures.length; i++) {
      var st = structures[i];
      if (st.hp <= 0 || !st.blocksZombies) continue;
      var hit = segmentHitsRect(x1, y1, x2, y2, st.x, st.y, st.w, st.h, pad);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        best = { t: hit.t, x: hit.x, y: hit.y, structure: st };
      }
    }
    return best;
  }

  function resolveCircleFortStructures(entity, structures, isPlayer) {
    var hitStructure = null;
    var r = entity.radius || 14;
    for (var i = 0; i < structures.length; i++) {
      var ob = structures[i];
      if (ob.hp <= 0) continue;
      if (isPlayer && !ob.blocksPlayer) continue;
      if (!isPlayer && !ob.blocksZombies) continue;
      var closestX = entity.x < ob.x ? ob.x : entity.x > ob.x + ob.w ? ob.x + ob.w : entity.x;
      var closestY = entity.y < ob.y ? ob.y : entity.y > ob.y + ob.h ? ob.y + ob.h : entity.y;
      var dx = entity.x - closestX;
      var dy = entity.y - closestY;
      var distSq = dx * dx + dy * dy;
      if (distSq < r * r) {
        hitStructure = ob;
        if (distSq > 0.0001) {
          var dist = Math.sqrt(distSq);
          var push = r - dist;
          entity.x += (dx / dist) * push;
          entity.y += (dy / dist) * push;
        } else {
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
    return hitStructure;
  }

  function updateTurrets(state, dt, audio) {
    for (var i = state.turrets.length - 1; i >= 0; i--) {
      var t = state.turrets[i];
      if (!t.permanent) {
        t.life -= dt;
      }
      if (t.muzzleFlash > 0) t.muzzleFlash = Math.max(0, t.muzzleFlash - dt);
      t.fireCooldown -= dt;

      var target = findNearestZombie(state, t.x, t.y, t.range);
      if (target) {
        var ang = Math.atan2(target.y - t.y, target.x - t.x);
        t.angle = lerpAngle(t.angle, ang, dt * 12);
        if (t.fireCooldown <= 0) {
          t.fireCooldown = 1 / t.fireRate;
          t.muzzleFlash = 0.06;
          var mx = t.x + Math.cos(t.angle) * 20;
          var my = t.y + Math.sin(t.angle) * 20;
          var dtType = t.defenseType || "mg_turret";

          if (dtType === "shotgun_turret") {
            var pellets = t.pellets || 5;
            for (var pi = 0; pi < pellets; pi++) {
              var spread = (pi - (pellets - 1) / 2) * 0.11 + (Math.random() - 0.5) * 0.04;
              var sa = t.angle + spread;
              state.projectiles.push({
                id: state.nextId++,
                kind: "bullet",
                weaponId: "shotgun",
                x: mx, y: my, prevX: mx, prevY: my,
                vx: Math.cos(sa) * 900, vy: Math.sin(sa) * 900,
                radius: 3.5, damage: t.damage, pierceLeft: 1, blastRadius: 0,
                rangeLeft: t.range + 40, life: 0.7, maxLife: 0.7,
                hitIds: Object.create(null), knockback: 14, color: "#fb923c"
              });
            }
            if (audio) audio.playShotgun();
          } else if (dtType === "flame_turret") {
            var fa = t.angle + (Math.random() - 0.5) * 0.24;
            state.projectiles.push({
              id: state.nextId++,
              kind: "flame",
              weaponId: "flamethrower",
              x: mx, y: my, prevX: mx, prevY: my,
              vx: Math.cos(fa) * 440, vy: Math.sin(fa) * 440,
              radius: 9, damage: t.damage, burnDamage: 16, burnDuration: 2.5,
              pierceLeft: 3, blastRadius: 0, rangeLeft: t.range + 20,
              life: 0.52, maxLife: 0.52, hitIds: Object.create(null),
              knockback: 2, color: "#f97316"
            });
            if (audio && Math.random() < 0.35) audio.playFlame();
          } else if (dtType === "tesla_turret") {
            var hitSet = Object.create(null);
            var curX = mx;
            var curY = my;
            var curTarget = target;
            var pts = [{ x: curX, y: curY }];
            var chains = t.chains || 4;
            for (var ci = 0; ci < chains && curTarget; ci++) {
              hitSet[curTarget.id] = true;
              pts.push({ x: curTarget.x, y: curTarget.y });
              damageZombie(state, curTarget, Math.round(t.damage * Math.pow(0.86, ci)), 0, 0, "tesla", audio);
              curX = curTarget.x;
              curY = curTarget.y;
              var nearT = state.hash.query(curX, curY, 155);
              var nextBest = null;
              var nextSq = 155 * 155;
              for (var ni = 0; ni < nearT.length; ni++) {
                var cand = nearT[ni];
                if (cand.dead || hitSet[cand.id]) continue;
                var d2 = (cand.x - curX) * (cand.x - curX) + (cand.y - curY) * (cand.y - curY);
                if (d2 < nextSq) { nextSq = d2; nextBest = cand; }
              }
              curTarget = nextBest;
            }
            state.beams.push({ kind: "lightning", points: pts, color: "#38bdf8", width: 2.6, life: 0.14, maxLife: 0.14 });
            if (audio) audio.playTesla();
          } else if (dtType === "rpg_turret") {
            state.projectiles.push({
              id: state.nextId++,
              kind: "rocket",
              weaponId: "rpg",
              x: mx, y: my, prevX: mx, prevY: my,
              vx: Math.cos(t.angle) * 620, vy: Math.sin(t.angle) * 620,
              radius: 5.5, damage: t.damage, pierceLeft: 1,
              blastRadius: t.blastRadius || 110, rangeLeft: t.range + 90,
              life: 1.4, maxLife: 1.4, hitIds: Object.create(null),
              knockback: 0, color: "#10b981"
            });
            if (audio) audio.playRocketLaunch();
          } else {
            state.projectiles.push({
              id: state.nextId++,
              kind: "bullet",
              weaponId: "turret",
              x: mx,
              y: my,
              prevX: mx,
              prevY: my,
              vx: Math.cos(t.angle) * 980,
              vy: Math.sin(t.angle) * 980,
              radius: 3.5,
              damage: t.damage,
              pierceLeft: 1,
              blastRadius: 0,
              rangeLeft: t.range + 60,
              life: 1.2,
              maxLife: 1.2,
              hitIds: Object.create(null),
              knockback: 4,
              color: t.defenseType ? "#fbbf24" : "#c4b5fd"
            });
            if (audio) audio.playTurretShot();
          }
        }
      }
      if ((!t.permanent && t.life <= 0) || t.hp <= 0) {
        spawnShockwave(state, t.x, t.y, 38, "#94a3b8", 0.2);
        state.turrets.splice(i, 1);
      }
    }
  }

  function updateOrbitals(state, dt, input, audio) {
    for (var i = state.orbitals.length - 1; i >= 0; i--) {
      var orb = state.orbitals[i];
      orb.life -= dt;
      if (input && typeof input.mouseWorldX === "number" && typeof input.mouseWorldY === "number") {
        orb.x += (input.mouseWorldX - orb.x) * Math.min(1, dt * 4.5);
        orb.y += (input.mouseWorldY - orb.y) * Math.min(1, dt * 4.5);
      }
      orb.tickAccum += dt;
      if (orb.tickAccum >= 0.08) {
        var tickDt = orb.tickAccum;
        orb.tickAccum = 0;
        state.map.addScorchDecal(orb.x, orb.y, orb.radius * 0.45);
        addShake(state, 5);
        var nearby = state.hash.query(orb.x, orb.y, orb.radius + 32);
        for (var j = 0; j < nearby.length; j++) {
          var z = nearby[j];
          if (z.dead) continue;
          var dx = z.x - orb.x;
          var dy = z.y - orb.y;
          var dist = Math.hypot(dx, dy);
          if (dist <= orb.radius + z.radius) {
            damageZombie(state, z, Math.round(orb.damagePerSec * tickDt), 0, 0, "orbital", audio);
          }
        }
        for (var s = 0; s < 3; s++) {
          var ang = Math.random() * Math.PI * 2;
          var spd = 90 + Math.random() * 140;
          spawnParticle(state, {
            x: orb.x,
            y: orb.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: 4,
            endSize: 0.5,
            color: s % 2 === 0 ? "#e0f2fe" : "#38bdf8",
            life: 0.25,
            glow: true
          });
        }
      }
      if (orb.life <= 0) {
        state.orbitals.splice(i, 1);
      }
    }
  }

  function updateProjectiles(state, dt, audio) {
    var m = state.map;
    for (var i = state.projectiles.length - 1; i >= 0; i--) {
      var pr = state.projectiles[i];
      pr.prevX = pr.x;
      pr.prevY = pr.y;
      var stepX = pr.vx * dt;
      var stepY = pr.vy * dt;
      pr.x += stepX;
      pr.y += stepY;
      pr.life -= dt;
      pr.rangeLeft -= Math.hypot(stepX, stepY);

      if (pr.kind === "flame") {
        pr.radius += dt * 38;
        pr.vx *= Math.pow(0.28, dt);
        pr.vy *= Math.pow(0.28, dt);
      } else if (pr.kind === "sonic") {
        pr.radius = Math.min(56, pr.radius + dt * 52);
      } else if (pr.kind === "rocket" && Math.random() < 0.75) {
        spawnParticle(state, {
          x: pr.x,
          y: pr.y,
          vx: (Math.random() - 0.5) * 28,
          vy: (Math.random() - 0.5) * 28,
          size: 4,
          endSize: 10,
          color: "rgba(148, 163, 184, 0.55)",
          life: 0.35
        });
      }

      var remove = false;
      if (pr.life <= 0 || pr.rangeLeft <= 0 || pr.x < 10 || pr.x > m.width - 10 || pr.y < 10 || pr.y > m.height - 10) {
        remove = true;
      }

      var isEnemyProj = pr.kind === "vomit" || pr.kind === "acid" || pr.kind === "sonic";
      var wallPad = pr.kind === "sonic" ? 10 : (pr.kind === "vomit" || pr.kind === "acid") ? 4 : 0;

      if (!remove && !pr.ignoreObstacles) {
        var hitMapWall = m.pointInObstacle(pr.x, pr.y, wallPad) || m.segmentHitsObstacle(pr.prevX, pr.prevY, pr.x, pr.y);
        var hitFortWall = isEnemyProj ? segmentHitsFortStructure(state.fortStructures, pr.prevX, pr.prevY, pr.x, pr.y, wallPad) : null;

        if (hitMapWall || hitFortWall) {
          remove = true;
          var hx = hitFortWall ? hitFortWall.x : (hitMapWall && typeof hitMapWall === "object" ? hitMapWall.x : pr.prevX);
          var hy = hitFortWall ? hitFortWall.y : (hitMapWall && typeof hitMapWall === "object" ? hitMapWall.y : pr.prevY);

          if (hitFortWall && hitFortWall.structure) {
            hitFortWall.structure.hp -= Math.round(pr.damage * 0.75);
            hitFortWall.structure.hitFlash = 0.12;
            if (hitFortWall.structure.hp <= 0) {
              spawnShockwave(state, hitFortWall.structure.x + hitFortWall.structure.w / 2, hitFortWall.structure.y + hitFortWall.structure.h / 2, 42, "#d97706", 0.25);
            }
          }

          if (pr.kind === "rocket") {
            detonateExplosion(state, hx, hy, pr.blastRadius, pr.damage, pr.weaponId, audio, false);
          } else if (pr.kind === "vomit" || pr.kind === "acid") {
            state.acidPools.push({ x: pr.prevX, y: pr.prevY, radius: 34, life: 4.0, maxLife: 4.0, tick: 0 });
            pr.pooled = true;
          } else if (pr.kind === "sonic") {
            spawnShockwave(state, hx, hy, 26, "#a78bfa", 0.16);
          } else if (pr.kind === "bullet") {
            for (var sp = 0; sp < 3; sp++) {
              spawnParticle(state, {
                x: pr.prevX,
                y: pr.prevY,
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                size: 2.5,
                endSize: 0.5,
                color: "#b45309",
                life: 0.16
              });
            }
          }
        }
      }

      if (!remove) {
        if (pr.kind === "vomit" || pr.kind === "acid") {
          var dp = Math.hypot(pr.x - state.player.x, pr.y - state.player.y);
          if (dp <= pr.radius + state.player.radius &&
              !m.segmentHitsObstacle(pr.x, pr.y, state.player.x, state.player.y) &&
              !segmentHitsFortStructure(state.fortStructures, pr.x, pr.y, state.player.x, state.player.y, 0)) {
            damagePlayer(state, pr.damage, audio);
            state.player.slowTimer = 1.2;
            state.player.slowFactor = 0.70;
            state.acidPools.push({ x: pr.x, y: pr.y, radius: 42, life: 4.5, maxLife: 4.5, tick: 0 });
            pr.pooled = true;
            remove = true;
          }
        } else if (pr.kind === "sonic") {
          var ds = Math.hypot(pr.x - state.player.x, pr.y - state.player.y);
          if (ds <= pr.radius + state.player.radius &&
              !m.segmentHitsObstacle(pr.x, pr.y, state.player.x, state.player.y) &&
              !segmentHitsFortStructure(state.fortStructures, pr.x, pr.y, state.player.x, state.player.y, 0)) {
            damagePlayer(state, pr.damage, audio);
            state.player.slowTimer = 1.4;
            state.player.slowFactor = 0.65;
            var sLen = Math.hypot(pr.vx, pr.vy) || 1;
            state.player.x += (pr.vx / sLen) * (pr.knockback || 28);
            state.player.y += (pr.vy / sLen) * (pr.knockback || 28);
            m.resolveCircleObstacles(state.player);
            if (state.fortStructures.length > 0) {
              resolveCircleFortStructures(state.player, state.fortStructures, true);
            }
            addShake(state, 9);
            remove = true;
          }
        } else {
          var near = state.hash.query(pr.x, pr.y, pr.radius + 36);
          for (var zi = 0; zi < near.length; zi++) {
            var z = near[zi];
            if (z.dead || pr.hitIds[z.id]) continue;
            var dx = z.x - pr.x;
            var dy = z.y - pr.y;
            var sumR = z.radius + pr.radius;
            if (dx * dx + dy * dy <= sumR * sumR) {
              pr.hitIds[z.id] = true;
              if (pr.kind === "rocket") {
                detonateExplosion(state, pr.x, pr.y, pr.blastRadius, pr.damage, pr.weaponId, audio, true);
                remove = true;
                break;
              }
              var pLen = Math.hypot(pr.vx, pr.vy) || 1;
              var kx = (pr.vx / pLen) * (pr.knockback || 0);
              var ky = (pr.vy / pLen) * (pr.knockback || 0);
              if (pr.kind === "flame") {
                z.burnTimer = Math.max(z.burnTimer, pr.burnDuration || 2.5);
                z.burnDps = Math.max(z.burnDps, pr.burnDamage || 14);
                z.burnWeapon = pr.weaponId;
              }
              damageZombie(state, z, pr.damage, kx, ky, pr.weaponId, audio);
              pr.pierceLeft -= 1;
              if (pr.pierceLeft <= 0) {
                remove = true;
                break;
              }
            }
          }
        }
      }

      if (remove) {
        if ((pr.kind === "vomit" || pr.kind === "acid") && !pr.pooled && pr.rangeLeft <= 0) {
          state.acidPools.push({ x: pr.x, y: pr.y, radius: 36, life: 4.0, maxLife: 4.0, tick: 0 });
        }
        state.projectiles.splice(i, 1);
      }
    }
  }

  function updateAcidPools(state, dt, audio) {
    var p = state.player;
    for (var i = state.acidPools.length - 1; i >= 0; i--) {
      var pool = state.acidPools[i];
      pool.life -= dt;
      pool.tick -= dt;
      if (pool.tick <= 0) {
        pool.tick = 0.35;
        if (Math.hypot(p.x - pool.x, p.y - pool.y) < pool.radius + p.radius * 0.5 &&
            !state.map.segmentHitsObstacle(pool.x, pool.y, p.x, p.y) &&
            !segmentHitsFortStructure(state.fortStructures, pool.x, pool.y, p.x, p.y, 0)) {
          damagePlayer(state, 10, audio);
          p.slowTimer = 0.9;
          p.slowFactor = 0.72;
        }
      }
      if (pool.life <= 0) {
        state.acidPools.splice(i, 1);
      }
    }
  }

  function updateZombies(state, dt, audio) {
    var p = state.player;
    var m = state.map;

    for (var i = state.zombies.length - 1; i >= 0; i--) {
      var z = state.zombies[i];
      if (z.dead) {
        state.zombies.splice(i, 1);
        continue;
      }

      if (z.hitFlash > 0) z.hitFlash = Math.max(0, z.hitFlash - dt);
      if (z.attackCooldown > 0) z.attackCooldown = Math.max(0, z.attackCooldown - dt);
      if (z.slowTimer > 0) {
        z.slowTimer -= dt;
        if (z.slowTimer <= 0) z.slowFactor = 1;
      }
      if (z.burnTimer > 0) {
        z.burnTimer -= dt;
        var burnDmg = z.burnDps * dt;
        z.hp -= burnDmg;
        if (Math.random() < 0.35) {
          spawnParticle(state, {
            x: z.x + (Math.random() - 0.5) * z.radius,
            y: z.y + (Math.random() - 0.5) * z.radius,
            vx: (Math.random() - 0.5) * 20,
            vy: -35 - Math.random() * 25,
            size: 4.5,
            endSize: 1,
            color: Math.random() < 0.5 ? "#fb923c" : "#fde047",
            life: 0.25,
            glow: true
          });
        }
        if (z.hp <= 0) {
          killZombie(state, z, z.burnWeapon, audio);
          state.zombies.splice(i, 1);
          continue;
        }
      }

      // Target player or close unobstructed turret
      var tx = p.x;
      var ty = p.y;
      var targetTurret = null;
      var minTargetDist = Math.hypot(p.x - z.x, p.y - z.y);
      for (var ti = 0; ti < state.turrets.length; ti++) {
        var tur = state.turrets[ti];
        var td = Math.hypot(tur.x - z.x, tur.y - z.y);
        if (td < minTargetDist * 0.72 && td < 220 && !m.segmentHitsObstacle(z.x, z.y, tur.x, tur.y)) {
          minTargetDist = td;
          tx = tur.x;
          ty = tur.y;
          targetTurret = tur;
        }
      }

      var dx = tx - z.x;
      var dy = ty - z.y;
      var dist = Math.hypot(dx, dy) || 1;
      var hasClearPath = typeof m.hasLineOfSight === "function"
        ? m.hasLineOfSight(z.x, z.y, tx, ty, Math.min(20, z.radius * 0.85))
        : !m.segmentHitsObstacle(z.x, z.y, tx, ty);

      var moveDirX = dx / dist;
      var moveDirY = dy / dist;
      if (!hasClearPath && !targetTurret && typeof m.getFlowDirection === "function") {
        var flow = m.getFlowDirection(z.x, z.y);
        if (flow.x !== 0 || flow.y !== 0) {
          moveDirX = flow.x;
          moveDirY = flow.y;
        }
      }

      z.angle = Math.atan2(hasClearPath ? dy : moveDirY, hasClearPath ? dx : moveDirX);
      z.animPhase += dt * (z.speed * 0.08);

      // Ranged Bile Vomiter attack (multi-glob toxic vomit cone)
      if (z.type === "spitter" && !targetTurret && hasClearPath && dist < z.spitRange && dist > 110) {
        z.spitCooldown -= dt;
        if (z.spitCooldown <= 0) {
          z.spitCooldown = z.attackRate + Math.random() * 0.5;
          var baseAng = Math.atan2(dy, dx);
          var spreads = [-0.16, 0, 0.16];
          var speeds = [430, 470, 440];
          for (var vi = 0; vi < spreads.length; vi++) {
            var vang = baseAng + spreads[vi];
            state.projectiles.push({
              id: state.nextId++,
              kind: "vomit",
              weaponId: "spitter",
              x: z.x + Math.cos(vang) * 16,
              y: z.y + Math.sin(vang) * 16,
              prevX: z.x,
              prevY: z.y,
              vx: Math.cos(vang) * speeds[vi],
              vy: Math.sin(vang) * speeds[vi],
              radius: 7,
              damage: Math.max(8, Math.round(z.damage * 0.75)),
              pierceLeft: 1,
              rangeLeft: Math.min(dist + 50, 450),
              life: 1.45,
              maxLife: 1.45,
              hitIds: Object.create(null),
              color: "#84cc16"
            });
          }
          if (audio) audio.playVomit();
        }
      }

      // Ranged Sonic Screamer attack (telegraphed expanding soundwave arc)
      if (z.type === "screamer" && !targetTurret) {
        if (z.screamCharge > 0) {
          z.screamCharge -= dt;
          z.angle = Math.atan2(dy, dx);
          if (z.screamCharge <= 0) {
            var sang = Math.atan2(dy, dx);
            state.projectiles.push({
              id: state.nextId++,
              kind: "sonic",
              weaponId: "screamer",
              x: z.x + Math.cos(sang) * 18,
              y: z.y + Math.sin(sang) * 18,
              prevX: z.x,
              prevY: z.y,
              vx: Math.cos(sang) * 520,
              vy: Math.sin(sang) * 520,
              radius: 22,
              damage: z.damage,
              knockback: 30,
              pierceLeft: 1,
              rangeLeft: 500,
              life: 1.4,
              maxLife: 1.4,
              hitIds: Object.create(null),
              color: "#6d28d9"
            });
            z.screamCooldown = z.attackRate + Math.random() * 0.5;
            if (audio) audio.playSonicScream();
          }
        } else if (hasClearPath && dist < z.screamRange && dist > 110) {
          z.screamCooldown -= dt;
          if (z.screamCooldown <= 0) {
            z.screamCharge = 0.30;
          }
        }
      }

      // Boss special abilities
      if (z.type === "boss") {
        z.slamCooldown -= dt;
        if (z.slamCooldown <= 0 && dist < 210) {
          z.slamCooldown = 3.8;
          spawnShockwave(state, z.x, z.y, 200, "#c084fc", 0.36);
          addShake(state, 14);
          if (dist < 200) {
            damagePlayer(state, 35, audio);
          }
        }
        z.summonCooldown -= dt;
        if (z.summonCooldown <= 0 && state.zombies.length < 220) {
          z.summonCooldown = 5.2;
          for (var sm = 0; sm < 6; sm++) {
            var sa = (sm / 6) * Math.PI * 2 + Math.random() * 0.4;
            spawnZombie(state, sm % 2 === 0 ? "runner" : "shambler", z.x + Math.cos(sa) * 55, z.y + Math.sin(sa) * 55, 1.25);
          }
        }
      }

      // Separation force from nearby zombies
      var sepX = 0;
      var sepY = 0;
      var nearZ = state.hash.query(z.x, z.y, z.radius * 2.2);
      for (var ni = 0; ni < nearZ.length; ni++) {
        var oz = nearZ[ni];
        if (oz === z || oz.dead) continue;
        var sdx = z.x - oz.x;
        var sdy = z.y - oz.y;
        var sDistSq = sdx * sdx + sdy * sdy;
        var minSep = z.radius + oz.radius;
        if (sDistSq > 0.001 && sDistSq < minSep * minSep) {
          var sDist = Math.sqrt(sDistSq);
          var push = (minSep - sDist) / minSep;
          sepX += (sdx / sDist) * push * 135;
          sepY += (sdy / sDist) * push * 135;
        }
      }

      var moveFactor = 1;
      if (z.type === "spitter" && hasClearPath && dist < 210) moveFactor = 0.3;
      else if (z.type === "screamer" && z.screamCharge > 0) moveFactor = 0.15;
      else if (z.type === "screamer" && hasClearPath && dist < 240) moveFactor = 0.3;

      // Stuck detection & tangential corner-escape nudge
      z.stuckCheckTimer -= dt;
      if (z.stuckCheckTimer <= 0) {
        var movedDist = Math.hypot(z.x - z.lastCheckX, z.y - z.lastCheckY);
        if (moveFactor > 0.4 && movedDist < 8) {
          z.stuckEscapeTimer = 0.45;
          z.stuckBias = -z.stuckBias;
        }
        z.lastCheckX = z.x;
        z.lastCheckY = z.y;
        z.stuckCheckTimer = 0.25;
      }

      if (z.stuckEscapeTimer > 0) {
        z.stuckEscapeTimer -= dt;
        var perpX = -moveDirY * z.stuckBias;
        var perpY = moveDirX * z.stuckBias;
        var bx = moveDirX * 0.72 + perpX * 0.68;
        var by = moveDirY * 0.72 + perpY * 0.68;
        var bLen = Math.hypot(bx, by) || 1;
        moveDirX = bx / bLen;
        moveDirY = by / bLen;
      }

      var bossEnrage = (z.type === "boss" && z.hp < z.maxHp * 0.5) ? 1.35 : 1.0;
      var exploderRush = (z.type === "exploder" && dist < 165) ? 1.30 : 1.0;
      var spd = z.speed * z.slowFactor * moveFactor * bossEnrage * exploderRush;
      z.x += (moveDirX * spd + sepX) * dt;
      z.y += (moveDirY * spd + sepY) * dt;
      m.resolveCircleObstacles(z);

      // Fort structure siege & barbed wire interaction
      if (state.fortStructures.length > 0) {
        var hitFort = resolveCircleFortStructures(z, state.fortStructures, false);
        if (hitFort && z.attackCooldown <= 0) {
          z.attackCooldown = z.attackRate;
          hitFort.hp -= z.damage;
          hitFort.hitFlash = 0.12;
          if (hitFort.hp <= 0) {
            spawnShockwave(state, hitFort.x + hitFort.w / 2, hitFort.y + hitFort.h / 2, 42, "#d97706", 0.25);
          }
        }
        // Check barbed wire overlap (slow + bleed damage)
        for (var fi = state.fortStructures.length - 1; fi >= 0; fi--) {
          var fs = state.fortStructures[fi];
          if (fs.hitFlash > 0) fs.hitFlash = Math.max(0, fs.hitFlash - dt);
          if (fs.hp <= 0) {
            state.fortStructures.splice(fi, 1);
            continue;
          }
          if (fs.dps > 0 && z.x + z.radius > fs.x && z.x - z.radius < fs.x + fs.w && z.y + z.radius > fs.y && z.y - z.radius < fs.y + fs.h) {
            z.slowTimer = Math.max(z.slowTimer, 0.25);
            z.slowFactor = Math.min(z.slowFactor, fs.slowFactor || 0.45);
            z.hp -= fs.dps * dt;
            fs.hp -= 10 * dt;
            if (z.hp <= 0) {
              killZombie(state, z, "turret", audio);
              state.zombies.splice(i, 1);
              z.dead = true;
              break;
            }
          }
        }
        if (z.dead) continue;
      }

      // Melee collision against player or turret
      if (targetTurret) {
        var tdNow = Math.hypot(targetTurret.x - z.x, targetTurret.y - z.y);
        if (tdNow <= z.radius + targetTurret.radius + 4 && z.attackCooldown <= 0) {
          z.attackCooldown = z.attackRate;
          targetTurret.hp -= z.damage;
        }
      } else {
        var pdNow = Math.hypot(p.x - z.x, p.y - z.y);
        if (pdNow <= z.radius + p.radius + 3) {
          if (z.type === "exploder") {
            killZombie(state, z, "exploder", audio);
            state.zombies.splice(i, 1);
            continue;
          }
          if (z.attackCooldown <= 0) {
            z.attackCooldown = z.attackRate;
            damagePlayer(state, z.damage, audio);
          }
        }
      }
    }
  }

  function updatePickups(state, dt, audio) {
    var p = state.player;
    for (var i = state.pickups.length - 1; i >= 0; i--) {
      var pk = state.pickups[i];
      pk.life -= dt;
      pk.bobPhase += dt * 4.5;
      var dx = p.x - pk.x;
      var dy = p.y - pk.y;
      var dist = Math.hypot(dx, dy);

      if (dist < 140 && dist > 1) {
        var pull = 280 * (1 - dist / 140);
        pk.x += (dx / dist) * pull * dt;
        pk.y += (dy / dist) * pull * dt;
      }

      if (dist < p.radius + pk.radius + 6) {
        if (pk.type === "medkit") {
          p.hp = Math.min(p.maxHp, p.hp + 30);
          spawnFloatingText(state, pk.x, pk.y - 12, "+30 HP", "#15803d", 14);
        } else if (pk.type === "cash") {
          var bonus = 75;
          if (state.mode === "survival") state.stats.cash += bonus;
          state.stats.score += 100;
          spawnFloatingText(state, pk.x, pk.y - 12, "+$" + bonus, "#b45309", 14);
        } else if (pk.type === "overdrive") {
          p.overdriveTimer = 8.0;
          spawnFloatingText(state, pk.x, pk.y - 12, "OVERDRIVE!", "#0369a1", 15);
        } else if (pk.type === "nuke") {
          state.events.screenFlash = 0.4;
          state.events.flashColor = "rgba(255, 250, 220, 0.72)";
          addShake(state, 22);
          spawnShockwave(state, p.x, p.y, 720, "#d97706", 0.55);
          spawnFloatingText(state, p.x, p.y - 32, "TACTICAL NUKE!", "#b91c1c", 18);
          for (var zi = state.zombies.length - 1; zi >= 0; zi--) {
            var nz = state.zombies[zi];
            if (nz.dead) continue;
            if (nz.type === "boss") {
              damageZombie(state, nz, 900, 0, 0, "nuke", null);
            } else {
              killZombie(state, nz, "nuke", null);
            }
          }
          if (audio) audio.playExplosion(1.6);
        }
        if (audio) audio.playPickup();
        state.pickups.splice(i, 1);
        continue;
      }

      if (pk.life <= 0) {
        state.pickups.splice(i, 1);
      }
    }
  }

  function updateEffects(state, dt) {
    for (var bi = state.beams.length - 1; bi >= 0; bi--) {
      state.beams[bi].life -= dt;
      if (state.beams[bi].life <= 0) state.beams.splice(bi, 1);
    }
    for (var si = state.shockwaves.length - 1; si >= 0; si--) {
      var sw = state.shockwaves[si];
      sw.life -= dt;
      var t = 1 - sw.life / sw.maxLife;
      sw.radius = 8 + (sw.maxRadius - 8) * (1 - Math.pow(1 - t, 2));
      if (sw.life <= 0) state.shockwaves.splice(si, 1);
    }
    for (var pi = state.particles.length - 1; pi >= 0; pi--) {
      var pt = state.particles[pi];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      var drag = Math.pow(pt.drag, dt * 60);
      pt.vx *= drag;
      pt.vy *= drag;
      if (pt.life <= 0) state.particles.splice(pi, 1);
    }
    for (var fi = state.floatingTexts.length - 1; fi >= 0; fi--) {
      var ft = state.floatingTexts[fi];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) state.floatingTexts.splice(fi, 1);
    }
  }

  function findNearestZombie(state, x, y, maxRange) {
    var near = state.hash.query(x, y, maxRange);
    var best = null;
    var bestSq = maxRange * maxRange;
    for (var i = 0; i < near.length; i++) {
      var z = near[i];
      if (z.dead) continue;
      var dSq = (z.x - x) * (z.x - x) + (z.y - y) * (z.y - y);
      if (dSq < bestSq) {
        bestSq = dSq;
        best = z;
      }
    }
    return best;
  }

  function lerpAngle(a, b, t) {
    var diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + diff * Math.min(1, t);
  }

  window.GameEntities = {
    ZOMBIE_TYPES: ZOMBIE_TYPES,
    FORT_DEFS: FORT_DEFS,
    SpatialHash: SpatialHash,
    createWorldState: createWorldState,
    spawnZombie: spawnZombie,
    spawnZombieAtEdge: spawnZombieAtEdge,
    triggerDash: triggerDash,
    firePrimaryWeapon: firePrimaryWeapon,
    triggerTactical: triggerTactical,
    placeFortItem: placeFortItem,
    repairAllFort: repairAllFort,
    spawnA10: spawnA10,
    spawnBomber: spawnBomber,
    spawnChopper: spawnChopper,
    updateWorld: updateWorld
  };
})();
