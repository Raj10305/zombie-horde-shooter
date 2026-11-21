(function () {
  "use strict";

  var STORAGE_KEY = "deadline_skyfire_records_v1";

  var canvas = document.getElementById("gameCanvas");
  var ctx = canvas.getContext("2d");
  var minimapCanvas = document.getElementById("minimapCanvas");
  var miniCtx = minimapCanvas.getContext("2d");

  var dom = {
    hudTop: document.getElementById("hudTop"),
    hudBottom: document.getElementById("hudBottom"),
    lowHpVignette: document.getElementById("lowHpVignette"),
    hpBar: document.getElementById("hpBar"),
    hpText: document.getElementById("hpText"),
    armorBar: document.getElementById("armorBar"),
    armorText: document.getElementById("armorText"),
    dashBar: document.getElementById("dashBar"),
    cashText: document.getElementById("cashText"),
    scoreText: document.getElementById("scoreText"),
    comboBadge: document.getElementById("comboBadge"),
    comboText: document.getElementById("comboText"),
    mapBadge: document.getElementById("mapBadge"),
    waveText: document.getElementById("waveText"),
    zombiesText: document.getElementById("zombiesText"),
    modeBadge: document.getElementById("modeBadge"),
    sandboxHordeBtn: document.getElementById("sandboxHordeBtn"),
    bossBarWrap: document.getElementById("bossBarWrap"),
    bossName: document.getElementById("bossName"),
    bossBar: document.getElementById("bossBar"),
    armoryBtn: document.getElementById("armoryBtn"),
    muteBtn: document.getElementById("muteBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    waveBanner: document.getElementById("waveBanner"),
    waveBannerTitle: document.getElementById("waveBannerTitle"),
    waveBannerSub: document.getElementById("waveBannerSub"),
    weaponDock: document.getElementById("weaponDock"),
    activeWeaponHint: document.getElementById("activeWeaponHint"),

    startOverlay: document.getElementById("startOverlay"),
    mapSelect: document.getElementById("mapSelect"),
    btnSurvival: document.getElementById("btnSurvival"),
    btnSandbox: document.getElementById("btnSandbox"),

    armoryOverlay: document.getElementById("armoryOverlay"),
    armoryCashText: document.getElementById("armoryCashText"),
    armoryTabs: document.getElementById("armoryTabs"),
    armoryGrid: document.getElementById("armoryGrid"),
    buyMedkitBtn: document.getElementById("buyMedkitBtn"),
    buyArmorBtn: document.getElementById("buyArmorBtn"),
    closeArmoryBtn: document.getElementById("closeArmoryBtn"),

    pauseOverlay: document.getElementById("pauseOverlay"),
    pauseMapSelect: document.getElementById("pauseMapSelect"),
    resumeBtn: document.getElementById("resumeBtn"),
    pauseArmoryBtn: document.getElementById("pauseArmoryBtn"),
    restartFromPauseBtn: document.getElementById("restartFromPauseBtn"),
    mainMenuFromPauseBtn: document.getElementById("mainMenuFromPauseBtn"),

    gameOverOverlay: document.getElementById("gameOverOverlay"),
    goMapSelect: document.getElementById("goMapSelect"),
    goWave: document.getElementById("goWave"),
    goKills: document.getElementById("goKills"),
    goScore: document.getElementById("goScore"),
    goBestCombo: document.getElementById("goBestCombo"),
    goFavWeapon: document.getElementById("goFavWeapon"),
    goHighScore: document.getElementById("goHighScore"),
    playAgainBtn: document.getElementById("playAgainBtn"),
    switchModeBtn: document.getElementById("switchModeBtn"),
    goMenuBtn: document.getElementById("goMenuBtn"),

    touchControls: document.getElementById("touchControls"),
    joyMoveZone: document.getElementById("joyMoveZone"),
    joyMoveKnob: document.getElementById("joyMoveKnob"),
    joyAimZone: document.getElementById("joyAimZone"),
    joyAimKnob: document.getElementById("joyAimKnob"),
    touchDashBtn: document.getElementById("touchDashBtn"),
    touchTurretBtn: document.getElementById("touchTurretBtn"),
    touchOrbitalBtn: document.getElementById("touchOrbitalBtn")
  };

  var gameContainer = document.getElementById("gameContainer");
  var viewW = (gameContainer && gameContainer.clientWidth) || window.innerWidth;
  var viewH = (gameContainer && gameContainer.clientHeight) || window.innerHeight;
  var viewScale = 1;

  var app = {
    phase: "menu", // menu | playing | paused | armory | gameover
    mode: "survival",
    currentMapId: "outpost",
    armoryFilter: "all",
    map: null,
    state: null,
    camera: { x: 1200, y: 900 },
    wave: {
      number: 1,
      spawnQueue: [],
      spawnTimer: 0,
      intermission: 0,
      bannerTimer: 0
    },
    input: {
      keys: Object.create(null),
      mouseScreenX: viewW / 2,
      mouseScreenY: viewH / 2,
      mouseWorldX: 1200,
      mouseWorldY: 900,
      firing: false,
      moveX: 0,
      moveY: 0
    },
    touch: {
      enabled: ("ontouchstart" in window) || ((navigator.maxTouchPoints || 0) > 0),
      moveId: null,
      moveX: 0,
      moveY: 0,
      aimId: null,
      aimX: 0,
      aimY: 0,
      canvasId: null
    },
    records: loadRecords(),
    dockSlots: {}
  };

  function loadRecords() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return {
          bestScore: parsed.bestScore || 0,
          bestWave: parsed.bestWave || 0
        };
      }
    } catch (_e) {}
    return { bestScore: 0, bestWave: 0 };
  }

  function saveRecords() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(app.records));
    } catch (_e) {}
  }

  function resizeCanvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    viewW = (gameContainer && gameContainer.clientWidth) || window.innerWidth;
    viewH = (gameContainer && gameContainer.clientHeight) || window.innerHeight;
    viewScale = Math.min(1, Math.max(0.65, Math.min(viewW / 1100, viewH / 640)));
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetTouchState() {
    app.touch.moveId = null;
    app.touch.moveX = 0;
    app.touch.moveY = 0;
    app.touch.aimId = null;
    app.touch.aimX = 0;
    app.touch.aimY = 0;
    app.touch.canvasId = null;
    dom.joyMoveKnob.style.transform = "translate(0px, 0px)";
    dom.joyAimKnob.style.transform = "translate(0px, 0px)";
  }

  function syncTouchControlsVisibility() {
    var show = app.touch.enabled && app.phase === "playing";
    dom.touchControls.classList.toggle("hidden", !show);
    if (!show) {
      resetTouchState();
    }
  }

  function showBanner(title, sub, duration) {
    dom.waveBannerTitle.textContent = title;
    dom.waveBannerSub.textContent = sub || "";
    dom.waveBanner.classList.remove("hidden");
    app.wave.bannerTimer = duration || 2.6;
  }

  function syncMapSelectors(id) {
    if (dom.mapSelect) dom.mapSelect.value = id;
    if (dom.pauseMapSelect) dom.pauseMapSelect.value = id;
    if (dom.goMapSelect) dom.goMapSelect.value = id;
  }

  function startRun(mode, mapId) {
    window.SoundEngine.unlock();
    app.mode = mode;
    if (mapId) {
      app.currentMapId = mapId;
    } else if (dom.mapSelect && dom.mapSelect.value) {
      app.currentMapId = dom.mapSelect.value;
    } else {
      app.currentMapId = app.currentMapId || "outpost";
    }
    syncMapSelectors(app.currentMapId);

    app.map = window.GameMap.createMap(app.currentMapId);
    app.state = window.GameEntities.createWorldState(mode, app.map);
    app.camera.x = app.state.player.x;
    app.camera.y = app.state.player.y;
    app.input.firing = false;
    app.input.keys = Object.create(null);

    app.wave.number = 0;
    app.wave.spawnQueue = [];
    app.wave.spawnTimer = 0;
    app.wave.intermission = 0;

    app.state.events.onBossKill = function () {
      showBanner("BOSS ELIMINATED", "MASSIVE SUPPLY BONUS AWARDED", 2.8);
    };

    dom.startOverlay.classList.add("hidden");
    dom.pauseOverlay.classList.add("hidden");
    dom.armoryOverlay.classList.add("hidden");
    dom.gameOverOverlay.classList.add("hidden");
    dom.hudTop.classList.remove("hidden");
    dom.hudBottom.classList.remove("hidden");
    dom.lowHpVignette.classList.add("hidden");

    if (dom.mapBadge) {
      dom.mapBadge.textContent = app.map.id === "ruins" ? "RUINS" : "OUTPOST";
    }

    if (mode === "sandbox") {
      dom.modeBadge.textContent = "SANDBOX CHAOS";
      dom.modeBadge.classList.add("sandbox");
      dom.sandboxHordeBtn.classList.remove("hidden");
    } else {
      dom.modeBadge.textContent = "SURVIVAL";
      dom.modeBadge.classList.remove("sandbox");
      dom.sandboxHordeBtn.classList.add("hidden");
    }

    buildWeaponDock();
    updateActiveWeaponHint();
    app.phase = "playing";
    syncTouchControlsVisibility();
    beginNextWave();
  }

  function buildWaveQueue(waveNum, mode) {
    var queue = [];
    var total = mode === "sandbox"
      ? 36 + Math.min(110, waveNum * 12)
      : 24 + Math.floor(waveNum * 10 + Math.pow(waveNum, 1.45));
    var maxExploders = waveNum >= 3 ? Math.min(4, Math.max(1, Math.floor((waveNum - 1) / 2))) : 0;
    var exploderCount = 0;

    for (var i = 0; i < total; i++) {
      var r = Math.random();
      if (waveNum >= 3 && exploderCount < maxExploders && r < 0.05) {
        queue.push("exploder");
        exploderCount += 1;
      } else if (waveNum >= 2 && r < 0.24) queue.push("brute");
      else if (r < 0.38) queue.push("spitter");
      else if (r < 0.50) queue.push("screamer");
      else if (r < 0.76) queue.push("runner");
      else queue.push("shambler");
    }

    if (waveNum % 5 === 0) {
      queue.unshift("boss");
    }
    return queue;
  }

  function beginNextWave() {
    app.wave.number += 1;
    var w = app.wave.number;
    app.wave.spawnQueue = buildWaveQueue(w, app.mode);
    app.wave.spawnTimer = 0.2;

    var hasBoss = w % 5 === 0;
    if (hasBoss) {
      showBanner("WAVE " + w + " — BOSS INBOUND", "NECRO TITAN DETECTED • USE HEAVY & AIR SUPPORT!", 3.4);
      window.SoundEngine.playBossWarning();
    } else {
      var sub = app.mode === "sandbox"
        ? "SANDBOX WAVE • PRESS [H] FOR EXTRA MEGA-HORDE"
        : w === 1
          ? "SWITCH WEAPONS [1-0] OR CALL AIRPLANES [8-0]!"
          : "SURVIVAL CASH BONUS +$" + (80 + w * 25);
      showBanner("WAVE " + w, sub, 2.8);
      window.SoundEngine.playWaveStart();
    }

    if (w > 1 && app.mode === "survival") {
      app.state.stats.cash += 80 + w * 25;
      app.state.player.hp = Math.min(app.state.player.maxHp, app.state.player.hp + 15);
    }
  }

  function spawnSandboxMegaHorde() {
    if (!app.state || app.phase !== "playing") return;
    var bounds = getViewBounds();
    var types = ["shambler", "runner", "brute", "spitter", "screamer"];
    for (var i = 0; i < 36; i++) {
      var t = i === 18 ? "exploder" : types[i % types.length];
      window.GameEntities.spawnZombieAtEdge(app.state, t, 1 + app.wave.number * 0.12, bounds);
    }
    showBanner("MEGA HORDE RELEASED!", "LIGHT UP THE SKY WITH AIRSTRIKES!", 2.0);
    window.SoundEngine.playBossWarning();
  }

  function getViewBounds() {
    var worldW = viewW / viewScale;
    var worldH = viewH / viewScale;
    return {
      left: app.camera.x - worldW / 2,
      right: app.camera.x + worldW / 2,
      top: app.camera.y - worldH / 2,
      bottom: app.camera.y + worldH / 2
    };
  }

  function buildWeaponDock() {
    var wd = window.WeaponData;
    dom.weaponDock.innerHTML = "";
    app.dockSlots = {};

    for (var i = 0; i < wd.WEAPONS.length; i++) {
      var w = wd.WEAPONS[i];
      var slot = createDockSlot(w, false);
      dom.weaponDock.appendChild(slot.el);
      app.dockSlots[w.id] = slot;
    }

    var div = document.createElement("div");
    div.className = "dock-divider";
    dom.weaponDock.appendChild(div);

    for (var j = 0; j < wd.TACTICALS.length; j++) {
      var t = wd.TACTICALS[j];
      var tslot = createDockSlot(t, true);
      dom.weaponDock.appendChild(tslot.el);
      app.dockSlots[t.id] = tslot;
    }
    refreshDockState();
  }

  function createDockSlot(def, isTactical) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "weapon-slot cat-" + def.category;
    btn.title = def.name + " [" + def.key + "] — " + def.desc;

    var cdOverlay = document.createElement("div");
    cdOverlay.className = "slot-cd-overlay";
    btn.appendChild(cdOverlay);

    var keySpan = document.createElement("span");
    keySpan.className = "slot-key";
    keySpan.textContent = def.key;
    btn.appendChild(keySpan);

    if (isTactical) {
      var costSpan = document.createElement("span");
      costSpan.className = "slot-cost";
      costSpan.textContent = app.mode === "sandbox" ? "FREE" : "$" + def.survivalCost;
      btn.appendChild(costSpan);
    }

    var iconDiv = document.createElement("div");
    iconDiv.className = "slot-icon";
    iconDiv.style.color = def.color;
    if (def.sprite) {
      var img = document.createElement("img");
      img.className = "weapon-sprite-icon";
      img.src = def.sprite;
      img.alt = def.shortName;
      iconDiv.appendChild(img);
    } else {
      iconDiv.innerHTML = def.svg;
    }
    btn.appendChild(iconDiv);

    var nameSpan = document.createElement("span");
    nameSpan.className = "slot-name";
    nameSpan.textContent = def.shortName;
    btn.appendChild(nameSpan);

    var pipsDiv = document.createElement("div");
    pipsDiv.className = "slot-pips";
    var pips = [];
    for (var k = 0; k < window.WeaponData.MAX_LEVEL; k++) {
      var pip = document.createElement("span");
      pip.className = "pip";
      pipsDiv.appendChild(pip);
      pips.push(pip);
    }
    btn.appendChild(pipsDiv);

    function activateSlot() {
      if (!app.state || app.phase !== "playing") return;
      if (isTactical) {
        updateInputAxes();
        window.GameEntities.triggerTactical(
          app.state,
          def.id,
          app.input.mouseWorldX,
          app.input.mouseWorldY,
          window.SoundEngine
        );
      } else {
        selectWeapon(def.id);
      }
    }

    // Multi-touch support: allows switching guns immediately while moving with the joystick
    var slotTouchId = null;
    var slotStartX = 0;
    var slotStartY = 0;
    btn.addEventListener("touchstart", function (e) {
      if (e.changedTouches.length > 0) {
        var t = e.changedTouches[0];
        slotTouchId = t.identifier;
        slotStartX = t.clientX;
        slotStartY = t.clientY;
      }
    }, { passive: true });

    btn.addEventListener("touchend", function (e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === slotTouchId) {
          slotTouchId = null;
          if (Math.hypot(t.clientX - slotStartX, t.clientY - slotStartY) < 16) {
            e.preventDefault();
            activateSlot();
          }
          break;
        }
      }
    }, { passive: false });

    btn.addEventListener("touchcancel", function () {
      slotTouchId = null;
    });

    btn.addEventListener("click", activateSlot);

    return { el: btn, cdOverlay: cdOverlay, pips: pips, isTactical: isTactical };
  }

  function refreshDockState() {
    if (!app.state) return;
    var p = app.state.player;
    for (var id in app.dockSlots) {
      var slot = app.dockSlots[id];
      var lv = p.weaponLevels[id] || 1;
      if (!slot.isTactical) {
        slot.el.classList.toggle("active", p.activeWeaponId === id);
      }
      for (var i = 0; i < slot.pips.length; i++) {
        slot.pips[i].classList.toggle("filled", i < lv);
      }
    }
  }

  function updateActiveWeaponHint() {
    if (!app.state) return;
    var wd = window.WeaponData;
    var id = app.state.player.activeWeaponId;
    var def = wd.WEAPON_BY_ID[id];
    if (!def) return;
    var lv = app.state.player.weaponLevels[id] || 1;
    var actionHint = def.category === "air"
      ? "CLICK TO CALL AIRSTRIKE AT CURSOR"
      : "HOLD CLICK TO FIRE";
    dom.activeWeaponHint.textContent = def.name.toUpperCase() + " • LV " + lv + " • " + actionHint;
  }

  function selectWeapon(weaponId) {
    if (!app.state) return;
    if (!window.WeaponData.WEAPON_BY_ID[weaponId]) return;
    app.state.player.activeWeaponId = weaponId;
    window.SoundEngine.playSwitch();
    refreshDockState();
    updateActiveWeaponHint();
  }

  function cycleWeapon(dir) {
    if (!app.state) return;
    var list = window.WeaponData.WEAPONS;
    var idx = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === app.state.player.activeWeaponId) {
        idx = i;
        break;
      }
    }
    var nextIdx = (idx + dir + list.length) % list.length;
    selectWeapon(list[nextIdx].id);
  }

  function openArmory() {
    if (!app.state || (app.phase !== "playing" && app.phase !== "paused")) return;
    app.phase = "armory";
    app.input.firing = false;
    syncTouchControlsVisibility();
    dom.pauseOverlay.classList.add("hidden");
    dom.armoryOverlay.classList.remove("hidden");
    renderArmory();
  }

  function closeArmory() {
    if (app.phase !== "armory") return;
    dom.armoryOverlay.classList.add("hidden");
    app.phase = "playing";
    syncTouchControlsVisibility();
    refreshDockState();
    updateActiveWeaponHint();
  }

  function renderArmory() {
    if (!app.state) return;
    var wd = window.WeaponData;
    var p = app.state.player;
    dom.armoryCashText.textContent = "$" + app.state.stats.cash.toLocaleString();
    dom.armoryGrid.innerHTML = "";

    var allItems = wd.WEAPONS.concat(wd.TACTICALS);
    for (var i = 0; i < allItems.length; i++) {
      var def = allItems[i];
      if (app.armoryFilter !== "all" && def.category !== app.armoryFilter) continue;

      var lv = p.weaponLevels[def.id] || 1;
      var stats = wd.getScaledStats(def, lv);
      var cost = app.mode === "sandbox" ? 0 : wd.getUpgradeCost(def, lv);
      var isMax = lv >= wd.MAX_LEVEL;
      var isEquipped = p.activeWeaponId === def.id;

      var card = document.createElement("div");
      card.className = "armory-item" + (isEquipped ? " equipped" : "");

      var statBlocks = buildStatLabels(def, stats);
      var equipBtnHtml = def.category === "tactical"
        ? '<button class="btn-equip" data-deploy="' + def.id + '">KEY [' + def.key + ']</button>'
        : '<button class="btn-equip' + (isEquipped ? ' is-equipped' : '') + '" data-equip="' + def.id + '">' + (isEquipped ? "EQUIPPED" : "EQUIP [" + def.key + "]") + '</button>';

      var upgLabel = isMax ? "MAX LEVEL" : (app.mode === "sandbox" ? "UPGRADE (FREE)" : "UPGRADE ($" + cost + ")");
      var upgDisabled = isMax || app.state.stats.cash < cost ? "disabled" : "";

      var iconHtml = def.sprite
        ? '<img class="weapon-sprite-icon" src="' + def.sprite + '" alt="' + def.shortName + '">'
        : def.svg;

      card.innerHTML =
        '<div class="armory-item-head">' +
          '<div class="armory-icon" style="color:' + def.color + '">' + iconHtml + '</div>' +
          '<div class="armory-title-wrap">' +
            '<div class="armory-item-name">' + def.name + '</div>' +
            '<div class="armory-item-meta">' + wd.CATEGORY_LABELS[def.category] + ' • Key [' + def.key + ']</div>' +
          '</div>' +
          '<span class="armory-lv-badge">LV ' + lv + '/' + wd.MAX_LEVEL + '</span>' +
        '</div>' +
        '<div class="armory-desc">' + def.desc + '</div>' +
        '<div class="armory-stats">' + statBlocks + '</div>' +
        '<div class="armory-actions">' +
          equipBtnHtml +
          '<button class="btn-upgrade" data-upgrade="' + def.id + '" ' + upgDisabled + '>' + upgLabel + '</button>' +
        '</div>';

      dom.armoryGrid.appendChild(card);
    }
  }

  function buildStatLabels(def, stats) {
    if (def.category === "air") {
      if (def.id === "chopper") {
        return "<div><span>Cannon</span><b>" + stats.damage + "</b></div>" +
          "<div><span>Rockets</span><b>" + stats.rocketDamage + "</b></div>" +
          "<div><span>Duration</span><b>" + stats.duration + "s</b></div>";
      }
      return "<div><span>Damage</span><b>" + stats.damage + "</b></div>" +
        "<div><span>Planes</span><b>" + stats.planes + "x</b></div>" +
        "<div><span>Cooldown</span><b>" + stats.cooldown + "s</b></div>";
    }
    if (def.id === "turret") {
      return "<div><span>Damage</span><b>" + stats.damage + "</b></div>" +
        "<div><span>Rate</span><b>" + stats.fireRate + "/s</b></div>" +
        "<div><span>Max Units</span><b>" + stats.maxActive + "</b></div>";
    }
    if (def.id === "orbital") {
      return "<div><span>Beam DPS</span><b>" + stats.damagePerSec + "</b></div>" +
        "<div><span>Radius</span><b>" + stats.radius + "px</b></div>" +
        "<div><span>Duration</span><b>" + stats.duration + "s</b></div>";
    }
    var thirdLabel = stats.blastRadius ? "Blast" : stats.chainCount ? "Chains" : stats.pellets > 1 ? "Pellets" : "Pierce";
    var thirdVal = stats.blastRadius ? stats.blastRadius + "px" : stats.chainCount ? stats.chainCount : stats.pellets > 1 ? stats.pellets : stats.pierce;
    return "<div><span>Damage</span><b>" + stats.damage + "</b></div>" +
      "<div><span>Fire Rate</span><b>" + stats.fireRate + "/s</b></div>" +
      "<div><span>" + thirdLabel + "</span><b>" + thirdVal + "</b></div>";
  }

  function upgradeWeapon(id) {
    var wd = window.WeaponData;
    var def = wd.WEAPON_BY_ID[id] || wd.TACTICAL_BY_ID[id];
    if (!def || !app.state) return;
    var lv = app.state.player.weaponLevels[id] || 1;
    if (lv >= wd.MAX_LEVEL) return;
    var cost = app.mode === "sandbox" ? 0 : wd.getUpgradeCost(def, lv);
    if (app.state.stats.cash < cost) return;
    app.state.stats.cash -= cost;
    app.state.player.weaponLevels[id] = lv + 1;
    window.SoundEngine.playUpgrade();
    renderArmory();
    refreshDockState();
    updateActiveWeaponHint();
  }

  function togglePause() {
    if (app.phase === "playing") {
      app.phase = "paused";
      app.input.firing = false;
      syncTouchControlsVisibility();
      dom.pauseOverlay.classList.remove("hidden");
    } else if (app.phase === "paused") {
      app.phase = "playing";
      syncTouchControlsVisibility();
      dom.pauseOverlay.classList.add("hidden");
    } else if (app.phase === "armory") {
      closeArmory();
    }
  }

  function triggerGameOver() {
    app.phase = "gameover";
    app.input.firing = false;
    syncTouchControlsVisibility();
    var st = app.state.stats;

    if (app.mode === "survival") {
      if (st.score > app.records.bestScore) app.records.bestScore = st.score;
      if (app.wave.number > app.records.bestWave) app.records.bestWave = app.wave.number;
      saveRecords();
    }

    // Determine favorite weapon
    var topWeapon = "M4 Assault Rifle";
    var topKills = -1;
    var wd = window.WeaponData;
    for (var wid in st.weaponKills) {
      if (st.weaponKills[wid] > topKills) {
        topKills = st.weaponKills[wid];
        var d = wd.WEAPON_BY_ID[wid] || wd.TACTICAL_BY_ID[wid];
        if (d) topWeapon = d.shortName + " (" + topKills + ")";
      }
    }

    dom.goWave.textContent = app.wave.number;
    dom.goKills.textContent = st.kills.toLocaleString();
    dom.goScore.textContent = st.score.toLocaleString();
    dom.goBestCombo.textContent = "x" + st.maxCombo;
    dom.goFavWeapon.textContent = topWeapon;
    dom.goHighScore.textContent = "W" + app.records.bestWave + " • " + app.records.bestScore.toLocaleString();

    dom.switchModeBtn.textContent = app.mode === "survival" ? "TRY SANDBOX CHAOS" : "PLAY SURVIVAL WAVES";
    dom.gameOverOverlay.classList.remove("hidden");
    dom.lowHpVignette.classList.add("hidden");
  }

  function returnToMenu() {
    app.phase = "menu";
    app.input.firing = false;
    syncTouchControlsVisibility();
    dom.hudTop.classList.add("hidden");
    dom.hudBottom.classList.add("hidden");
    dom.waveBanner.classList.add("hidden");
    dom.pauseOverlay.classList.add("hidden");
    dom.armoryOverlay.classList.add("hidden");
    dom.gameOverOverlay.classList.add("hidden");
    dom.lowHpVignette.classList.add("hidden");
    dom.startOverlay.classList.remove("hidden");
  }

  function updateHud() {
    var st = app.state;
    var p = st.player;

    dom.hpBar.style.width = Math.max(0, (p.hp / p.maxHp) * 100) + "%";
    dom.hpText.textContent = Math.ceil(p.hp) + " / " + p.maxHp;
    dom.armorBar.style.width = Math.max(0, (p.armor / p.maxArmor) * 100) + "%";
    dom.armorText.textContent = Math.ceil(p.armor) + " / " + p.maxArmor;

    var dashReady = 1 - p.dashCooldown / p.dashMaxCooldown;
    dom.dashBar.style.width = Math.max(0, Math.min(100, dashReady * 100)) + "%";

    dom.cashText.textContent = "$" + st.stats.cash.toLocaleString();
    dom.scoreText.textContent = st.stats.score.toLocaleString() + " PTS";

    if (st.stats.combo >= 3) {
      dom.comboBadge.classList.remove("hidden");
      dom.comboText.textContent = st.stats.combo;
    } else {
      dom.comboBadge.classList.add("hidden");
    }

    var remaining = st.zombies.length + app.wave.spawnQueue.length;
    dom.waveText.textContent = "WAVE " + app.wave.number;
    dom.zombiesText.textContent = remaining + " LEFT";

    dom.lowHpVignette.classList.toggle("hidden", p.hp > 32 || p.hp <= 0);

    // Boss HP bar
    var boss = null;
    for (var i = 0; i < st.zombies.length; i++) {
      if (st.zombies[i].type === "boss" && !st.zombies[i].dead) {
        boss = st.zombies[i];
        break;
      }
    }
    if (boss) {
      dom.bossBarWrap.classList.remove("hidden");
      dom.bossName.textContent = boss.name;
      dom.bossBar.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + "%";
    } else {
      dom.bossBarWrap.classList.add("hidden");
    }

    // Cooldown overlays on dock (only for heavy weapons, airplanes, and tactical support)
    var wd = window.WeaponData;
    for (var id in app.dockSlots) {
      var def = wd.WEAPON_BY_ID[id] || wd.TACTICAL_BY_ID[id];
      if (def && def.showCooldown) {
        var cd = p.weaponCooldowns[id] || 0;
        var maxCd = p.weaponMaxCooldowns[id] || 1;
        var pct = cd > 0.01 ? Math.min(100, (cd / maxCd) * 100) : 0;
        app.dockSlots[id].cdOverlay.style.height = pct + "%";
      } else {
        app.dockSlots[id].cdOverlay.style.height = "0%";
      }
    }
  }

  function updateWaveDirector(dt) {
    if (app.wave.bannerTimer > 0) {
      app.wave.bannerTimer -= dt;
      if (app.wave.bannerTimer <= 0) {
        dom.waveBanner.classList.add("hidden");
      }
    }

    if (app.wave.spawnQueue.length > 0) {
      app.wave.spawnTimer -= dt;
      if (app.wave.spawnTimer <= 0) {
        var batch = Math.min(app.wave.spawnQueue.length, 2 + Math.floor(app.wave.number / 2));
        var bounds = getViewBounds();
        var scale = 1 + (app.wave.number - 1) * 0.22;
        for (var i = 0; i < batch; i++) {
          var zType = app.wave.spawnQueue.shift();
          window.GameEntities.spawnZombieAtEdge(app.state, zType, scale, bounds);
        }
        app.wave.spawnTimer = Math.max(0.10, 0.45 - app.wave.number * 0.035);
      }
    } else if (app.state.zombies.length === 0) {
      if (app.wave.intermission <= 0) {
        app.wave.intermission = 2.6;
        showBanner("WAVE " + app.wave.number + " CLEARED!", "PREPARING NEXT WAVE...", 2.4);
      } else {
        app.wave.intermission -= dt;
        if (app.wave.intermission <= 0) {
          beginNextWave();
        }
      }
    }
  }

  function updateInputAxes() {
    var k = app.input.keys;
    var mx = 0;
    var my = 0;
    if (k.KeyA || k.ArrowLeft) mx -= 1;
    if (k.KeyD || k.ArrowRight) mx += 1;
    if (k.KeyW || k.ArrowUp) my -= 1;
    if (k.KeyS || k.ArrowDown) my += 1;
    if (Math.abs(app.touch.moveX) > 0.1 || Math.abs(app.touch.moveY) > 0.1) {
      mx = app.touch.moveX;
      my = app.touch.moveY;
    }
    app.input.moveX = mx;
    app.input.moveY = my;

    if (app.touch.aimId !== null && app.state) {
      var aimMag = Math.hypot(app.touch.aimX, app.touch.aimY);
      if (aimMag > 0.08) {
        var nx = app.touch.aimX / aimMag;
        var ny = app.touch.aimY / aimMag;
        app.input.mouseWorldX = app.state.player.x + nx * 260;
        app.input.mouseWorldY = app.state.player.y + ny * 260;
        app.input.mouseScreenX = (app.input.mouseWorldX - app.camera.x) * viewScale + viewW / 2;
        app.input.mouseScreenY = (app.input.mouseWorldY - app.camera.y) * viewScale + viewH / 2;
        app.input.firing = aimMag > 0.18;
        return;
      }
    }

    app.input.mouseWorldX = app.camera.x + (app.input.mouseScreenX - viewW / 2) / viewScale;
    app.input.mouseWorldY = app.camera.y + (app.input.mouseScreenY - viewH / 2) / viewScale;
  }

  var lastTime = performance.now();
  function gameLoop(now) {
    var dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    if (app.state && app.phase === "playing") {
      updateInputAxes();
      window.GameEntities.updateWorld(app.state, dt, app.input, window.SoundEngine);
      updateWaveDirector(dt);

      // Smooth camera tracking with subtle mouse lookahead
      var p = app.state.player;
      var worldW = viewW / viewScale;
      var worldH = viewH / viewScale;
      var lookX = Math.max(-90, Math.min(90, (app.input.mouseScreenX - viewW / 2) * 0.14));
      var lookY = Math.max(-70, Math.min(70, (app.input.mouseScreenY - viewH / 2) * 0.14));
      var targetCamX = Math.max(worldW * 0.25, Math.min(app.map.width - worldW * 0.25, p.x + lookX));
      var targetCamY = Math.max(worldH * 0.25, Math.min(app.map.height - worldH * 0.25, p.y + lookY));
      app.camera.x += (targetCamX - app.camera.x) * Math.min(1, dt * 8);
      app.camera.y += (targetCamY - app.camera.y) * Math.min(1, dt * 8);

      updateHud();

      if (p.hp <= 0) {
        triggerGameOver();
      }
    }

    if (app.state) {
      window.GameRenderer.renderWorld(ctx, app.state, app.camera, app.phase === "playing" ? app.input : null, viewW, viewH, viewScale);
      window.GameRenderer.renderMinimap(miniCtx, app.state, app.camera, viewW / viewScale, viewH / viewScale);
    }

    requestAnimationFrame(gameLoop);
  }

  // Event Wiring
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("orientationchange", function () {
    setTimeout(resizeCanvas, 120);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resizeCanvas);
  }

  window.addEventListener("keydown", function (e) {
    if (["Space", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) >= 0) {
      if (app.phase === "playing" || app.phase === "armory") {
        e.preventDefault();
      }
    }

    app.input.keys[e.code] = true;

    if (e.code === "KeyM") {
      var isMuted = window.SoundEngine.toggleMute();
      dom.muteBtn.textContent = isMuted ? "MUTED [M]" : "SFX ON [M]";
      return;
    }

    if (e.code === "KeyP" || e.code === "Escape") {
      if (app.phase === "playing" || app.phase === "paused" || app.phase === "armory") {
        togglePause();
      }
      return;
    }

    if (e.code === "KeyB" || e.code === "Tab") {
      if (app.phase === "playing" || app.phase === "paused") {
        openArmory();
      } else if (app.phase === "armory") {
        closeArmory();
      }
      return;
    }

    if (app.phase !== "playing" || !app.state) return;

    // Weapon hotkeys 1-9, 0
    var wd = window.WeaponData;
    for (var i = 0; i < wd.WEAPONS.length; i++) {
      var keyCode = wd.WEAPONS[i].key === "0" ? "Digit0" : "Digit" + wd.WEAPONS[i].key;
      if (e.code === keyCode) {
        selectWeapon(wd.WEAPONS[i].id);
        return;
      }
    }

    if (e.code === "KeyQ") {
      updateInputAxes();
      window.GameEntities.triggerTactical(app.state, "turret", app.input.mouseWorldX, app.input.mouseWorldY, window.SoundEngine);
    } else if (e.code === "KeyE") {
      updateInputAxes();
      window.GameEntities.triggerTactical(app.state, "orbital", app.input.mouseWorldX, app.input.mouseWorldY, window.SoundEngine);
    } else if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
      updateInputAxes();
      window.GameEntities.triggerDash(app.state, app.input.moveX, app.input.moveY, window.SoundEngine);
    } else if (e.code === "KeyH" && app.mode === "sandbox") {
      spawnSandboxMegaHorde();
    }
  });

  window.addEventListener("keyup", function (e) {
    app.input.keys[e.code] = false;
  });

  canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    app.input.mouseScreenX = e.clientX - rect.left;
    app.input.mouseScreenY = e.clientY - rect.top;
  });

  canvas.addEventListener("mousedown", function (e) {
    window.SoundEngine.unlock();
    if (e.button === 0 && app.phase === "playing") {
      app.input.firing = true;
    }
  });

  window.addEventListener("mouseup", function () {
    app.input.firing = false;
  });

  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  canvas.addEventListener("wheel", function (e) {
    if (app.phase !== "playing") return;
    e.preventDefault();
    cycleWeapon(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // Multi-touch twin-stick & canvas direct-aim support for iOS / mobile
  function enableTouchControls() {
    if (!app.touch.enabled) {
      app.touch.enabled = true;
      syncTouchControlsVisibility();
    }
  }

  function updateJoyStick(zone, knob, touch) {
    var rect = zone.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var dx = touch.clientX - cx;
    var dy = touch.clientY - cy;
    var maxR = Math.max(20, (rect.width - (knob.offsetWidth || 36)) / 2);
    var dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    knob.style.transform = "translate(" + Math.round(dx) + "px, " + Math.round(dy) + "px)";
    return { nx: dx / maxR, ny: dy / maxR };
  }

  document.addEventListener("touchstart", function () {
    window.SoundEngine.unlock();
    enableTouchControls();
  }, { passive: true });

  dom.joyMoveZone.addEventListener("touchstart", function (e) {
    e.preventDefault();
    window.SoundEngine.unlock();
    enableTouchControls();
    if (app.touch.moveId === null && e.changedTouches.length > 0) {
      var t = e.changedTouches[0];
      app.touch.moveId = t.identifier;
      var v = updateJoyStick(dom.joyMoveZone, dom.joyMoveKnob, t);
      app.touch.moveX = v.nx;
      app.touch.moveY = v.ny;
    }
  }, { passive: false });

  dom.joyMoveZone.addEventListener("touchmove", function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === app.touch.moveId) {
        var v = updateJoyStick(dom.joyMoveZone, dom.joyMoveKnob, t);
        app.touch.moveX = v.nx;
        app.touch.moveY = v.ny;
      }
    }
  }, { passive: false });

  function endMoveTouch(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === app.touch.moveId) {
        app.touch.moveId = null;
        app.touch.moveX = 0;
        app.touch.moveY = 0;
        dom.joyMoveKnob.style.transform = "translate(0px, 0px)";
      }
    }
  }
  dom.joyMoveZone.addEventListener("touchend", endMoveTouch);
  dom.joyMoveZone.addEventListener("touchcancel", endMoveTouch);

  dom.joyAimZone.addEventListener("touchstart", function (e) {
    e.preventDefault();
    window.SoundEngine.unlock();
    enableTouchControls();
    if (app.touch.aimId === null && e.changedTouches.length > 0) {
      var t = e.changedTouches[0];
      app.touch.aimId = t.identifier;
      var v = updateJoyStick(dom.joyAimZone, dom.joyAimKnob, t);
      app.touch.aimX = v.nx;
      app.touch.aimY = v.ny;
    }
  }, { passive: false });

  dom.joyAimZone.addEventListener("touchmove", function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === app.touch.aimId) {
        var v = updateJoyStick(dom.joyAimZone, dom.joyAimKnob, t);
        app.touch.aimX = v.nx;
        app.touch.aimY = v.ny;
      }
    }
  }, { passive: false });

  function endAimTouch(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === app.touch.aimId) {
        app.touch.aimId = null;
        app.touch.aimX = 0;
        app.touch.aimY = 0;
        app.input.firing = false;
        dom.joyAimKnob.style.transform = "translate(0px, 0px)";
      }
    }
  }
  dom.joyAimZone.addEventListener("touchend", endAimTouch);
  dom.joyAimZone.addEventListener("touchcancel", endAimTouch);

  canvas.addEventListener("touchstart", function (e) {
    if (app.phase !== "playing") return;
    e.preventDefault();
    window.SoundEngine.unlock();
    enableTouchControls();
    if (app.touch.canvasId === null && e.changedTouches.length > 0) {
      var t = e.changedTouches[0];
      var rect = canvas.getBoundingClientRect();
      app.touch.canvasId = t.identifier;
      app.input.mouseScreenX = t.clientX - rect.left;
      app.input.mouseScreenY = t.clientY - rect.top;
      app.input.firing = true;
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", function (e) {
    if (app.phase !== "playing") return;
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === app.touch.canvasId) {
        app.input.mouseScreenX = t.clientX - rect.left;
        app.input.mouseScreenY = t.clientY - rect.top;
      }
    }
  }, { passive: false });

  function endCanvasTouch(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === app.touch.canvasId) {
        app.touch.canvasId = null;
        if (app.touch.aimId === null) {
          app.input.firing = false;
        }
      }
    }
  }
  canvas.addEventListener("touchend", endCanvasTouch);
  canvas.addEventListener("touchcancel", endCanvasTouch);

  function bindTouchAction(btn, handler) {
    btn.addEventListener("touchstart", function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.SoundEngine.unlock();
      handler();
    }, { passive: false });
    btn.addEventListener("click", handler);
  }

  bindTouchAction(dom.touchDashBtn, function () {
    if (app.phase !== "playing" || !app.state) return;
    updateInputAxes();
    window.GameEntities.triggerDash(app.state, app.input.moveX, app.input.moveY, window.SoundEngine);
  });
  bindTouchAction(dom.touchTurretBtn, function () {
    if (app.phase !== "playing" || !app.state) return;
    updateInputAxes();
    window.GameEntities.triggerTactical(app.state, "turret", app.input.mouseWorldX, app.input.mouseWorldY, window.SoundEngine);
  });
  bindTouchAction(dom.touchOrbitalBtn, function () {
    if (app.phase !== "playing" || !app.state) return;
    updateInputAxes();
    window.GameEntities.triggerTactical(app.state, "orbital", app.input.mouseWorldX, app.input.mouseWorldY, window.SoundEngine);
  });

  // Button handlers
  dom.btnSurvival.addEventListener("click", function () { startRun("survival"); });
  dom.btnSandbox.addEventListener("click", function () { startRun("sandbox"); });
  dom.sandboxHordeBtn.addEventListener("click", spawnSandboxMegaHorde);
  dom.armoryBtn.addEventListener("click", openArmory);
  dom.closeArmoryBtn.addEventListener("click", closeArmory);
  dom.pauseBtn.addEventListener("click", togglePause);
  dom.muteBtn.addEventListener("click", function () {
    var isMuted = window.SoundEngine.toggleMute();
    dom.muteBtn.textContent = isMuted ? "MUTED [M]" : "SFX ON [M]";
  });

  dom.armoryTabs.addEventListener("click", function (e) {
    var tab = e.target.closest(".armory-tab");
    if (!tab) return;
    app.armoryFilter = tab.getAttribute("data-cat") || "all";
    var allTabs = dom.armoryTabs.querySelectorAll(".armory-tab");
    for (var i = 0; i < allTabs.length; i++) {
      allTabs[i].classList.toggle("active", allTabs[i] === tab);
    }
    renderArmory();
  });

  dom.armoryGrid.addEventListener("click", function (e) {
    var eq = e.target.closest("[data-equip]");
    if (eq) {
      selectWeapon(eq.getAttribute("data-equip"));
      renderArmory();
      return;
    }
    var up = e.target.closest("[data-upgrade]");
    if (up) {
      upgradeWeapon(up.getAttribute("data-upgrade"));
      return;
    }
    var dep = e.target.closest("[data-deploy]");
    if (dep) {
      closeArmory();
      window.GameEntities.triggerTactical(app.state, dep.getAttribute("data-deploy"), app.input.mouseWorldX, app.input.mouseWorldY, window.SoundEngine);
    }
  });

  dom.buyMedkitBtn.addEventListener("click", function () {
    if (!app.state) return;
    var cost = app.mode === "sandbox" ? 0 : 120;
    if (app.state.stats.cash < cost || app.state.player.hp >= app.state.player.maxHp) return;
    app.state.stats.cash -= cost;
    app.state.player.hp = Math.min(app.state.player.maxHp, app.state.player.hp + 50);
    window.SoundEngine.playPickup();
    renderArmory();
  });

  dom.buyArmorBtn.addEventListener("click", function () {
    if (!app.state) return;
    var cost = app.mode === "sandbox" ? 0 : 180;
    if (app.state.stats.cash < cost || app.state.player.armor >= app.state.player.maxArmor) return;
    app.state.stats.cash -= cost;
    app.state.player.armor = app.state.player.maxArmor;
    window.SoundEngine.playPickup();
    renderArmory();
  });

  dom.resumeBtn.addEventListener("click", togglePause);
  dom.pauseArmoryBtn.addEventListener("click", openArmory);
  dom.restartFromPauseBtn.addEventListener("click", function () {
    var chosenMap = dom.pauseMapSelect ? dom.pauseMapSelect.value : app.currentMapId;
    startRun(app.mode, chosenMap);
  });
  dom.mainMenuFromPauseBtn.addEventListener("click", returnToMenu);

  dom.playAgainBtn.addEventListener("click", function () {
    var chosenMap = dom.goMapSelect ? dom.goMapSelect.value : app.currentMapId;
    startRun(app.mode, chosenMap);
  });
  dom.switchModeBtn.addEventListener("click", function () {
    var chosenMap = dom.goMapSelect ? dom.goMapSelect.value : app.currentMapId;
    startRun(app.mode === "survival" ? "sandbox" : "survival", chosenMap);
  });
  dom.goMenuBtn.addEventListener("click", returnToMenu);

  if (dom.mapSelect) {
    dom.mapSelect.addEventListener("change", function () {
      app.currentMapId = dom.mapSelect.value;
      syncMapSelectors(app.currentMapId);
    });
  }
  if (dom.pauseMapSelect) {
    dom.pauseMapSelect.addEventListener("change", function () {
      app.currentMapId = dom.pauseMapSelect.value;
      syncMapSelectors(app.currentMapId);
    });
  }
  if (dom.goMapSelect) {
    dom.goMapSelect.addEventListener("change", function () {
      app.currentMapId = dom.goMapSelect.value;
      syncMapSelectors(app.currentMapId);
    });
  }

  // Initialize
  resizeCanvas();
  returnToMenu();
  if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  window.__GAME__ = app;
  window.ZombieGame = app;
  requestAnimationFrame(gameLoop);
})();
