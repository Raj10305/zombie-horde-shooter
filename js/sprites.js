(function () {
  "use strict";

  var ZOMBIE_SPRITE_PATHS = {
    shambler: "assets/sprites/shambler.png",
    runner: "assets/sprites/runner.png",
    brute: "assets/sprites/brute.png",
    spitter: "assets/sprites/spitter.png",
    screamer: "assets/sprites/screamer.png",
    exploder: "assets/sprites/exploder.png",
    boss: "assets/sprites/boss.png"
  };

  var WEAPON_SPRITE_PATHS = {
    rifle: "assets/sprites/weapons/rifle.png",
    shotgun: "assets/sprites/weapons/shotgun.png",
    minigun: "assets/sprites/weapons/minigun.png",
    railgun: "assets/sprites/weapons/railgun.png",
    flamethrower: "assets/sprites/weapons/flamethrower.png",
    rpg: "assets/sprites/weapons/rpg.png",
    tesla: "assets/sprites/weapons/tesla.png",
    designator: "assets/sprites/weapons/designator.png"
  };

  var PLAYER_SPRITE_PATHS = {
    down_idle: "assets/sprites/player/player_down_idle.png",
    up_idle: "assets/sprites/player/player_up_idle.png",
    right_idle: "assets/sprites/player/player_right_idle.png",
    left_idle: "assets/sprites/player/player_left_idle.png",
    down_run: "assets/sprites/player/player_down_run.png",
    up_run: "assets/sprites/player/player_up_run.png",
    right_run: "assets/sprites/player/player_right_run.png",
    left_run: "assets/sprites/player/player_left_run.png"
  };

  var FORT_SPRITE_PATHS = {
    wood_wall_h: "assets/sprites/fort/wood_wall_h.png",
    wood_wall_v: "assets/sprites/fort/wood_wall_v.png",
    reinforced_wall_h: "assets/sprites/fort/reinforced_wall_h.png",
    reinforced_wall_v: "assets/sprites/fort/reinforced_wall_v.png",
    fort_gate_h: "assets/sprites/fort/fort_gate_h.png",
    fort_gate_v: "assets/sprites/fort/fort_gate_v.png",
    wire_fence_h: "assets/sprites/fort/wire_fence_h.png",
    wire_fence_v: "assets/sprites/fort/wire_fence_v.png"
  };

  var PICKUP_SPRITE_PATHS = {
    medkit: "assets/sprites/pickups/medkit.png",
    cash: "assets/sprites/pickups/cash.png",
    overdrive: "assets/sprites/pickups/overdrive.png",
    nuke: "assets/sprites/pickups/nuke.png"
  };

  var zombieSprites = Object.create(null);
  var weaponSprites = Object.create(null);
  var playerSprites = Object.create(null);
  var fortSprites = Object.create(null);
  var pickupSprites = Object.create(null);

  function buildFlashCanvas(img) {
    if (typeof document === "undefined") return null;
    try {
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      if (!w || !h) return null;
      var c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      var cctx = c.getContext("2d");
      cctx.drawImage(img, 0, 0, w, h);
      cctx.globalCompositeOperation = "source-in";
      cctx.fillStyle = "#ffffff";
      cctx.fillRect(0, 0, w, h);
      return c;
    } catch (_e) {
      return null;
    }
  }

  function preloadZombieSprites() {
    if (typeof Image === "undefined") return;
    for (var type in ZOMBIE_SPRITE_PATHS) {
      (function (t, src) {
        var entry = { img: null, flashCanvas: null, ready: false };
        zombieSprites[t] = entry;
        var img = new Image();
        img.onload = function () {
          entry.img = img;
          entry.flashCanvas = buildFlashCanvas(img);
          entry.ready = true;
        };
        img.onerror = function () {
          entry.ready = false;
        };
        img.src = src;
      })(type, ZOMBIE_SPRITE_PATHS[type]);
    }
  }

  function preloadWeaponSprites() {
    if (typeof Image === "undefined") return;
    for (var id in WEAPON_SPRITE_PATHS) {
      (function (key, src) {
        var entry = { img: null, ready: false };
        weaponSprites[key] = entry;
        var img = new Image();
        img.onload = function () {
          entry.img = img;
          entry.ready = true;
        };
        img.onerror = function () {
          entry.ready = false;
        };
        img.src = src;
      })(id, WEAPON_SPRITE_PATHS[id]);
    }
  }

  function preloadSimpleMap(paths, store) {
    if (typeof Image === "undefined") return;
    for (var key in paths) {
      (function (k, src) {
        var entry = { img: null, ready: false };
        store[k] = entry;
        var img = new Image();
        img.onload = function () {
          entry.img = img;
          entry.ready = true;
        };
        img.onerror = function () {
          entry.ready = false;
        };
        img.src = src;
      })(key, paths[key]);
    }
  }

  preloadZombieSprites();
  preloadWeaponSprites();
  preloadSimpleMap(PLAYER_SPRITE_PATHS, playerSprites);
  preloadSimpleMap(FORT_SPRITE_PATHS, fortSprites);
  preloadSimpleMap(PICKUP_SPRITE_PATHS, pickupSprites);

  window.SpriteLoader = {
    ZOMBIE_SPRITE_PATHS: ZOMBIE_SPRITE_PATHS,
    WEAPON_SPRITE_PATHS: WEAPON_SPRITE_PATHS,
    PLAYER_SPRITE_PATHS: PLAYER_SPRITE_PATHS,
    FORT_SPRITE_PATHS: FORT_SPRITE_PATHS,
    PICKUP_SPRITE_PATHS: PICKUP_SPRITE_PATHS,
    getZombieSprite: function (type) {
      return zombieSprites[type] || null;
    },
    getWeaponSprite: function (weaponId) {
      var key = (weaponId === "a10" || weaponId === "bomber" || weaponId === "chopper")
        ? "designator"
        : weaponId;
      return weaponSprites[key] || null;
    },
    getPlayerSprite: function (dir, moving) {
      var k = (dir || "down") + "_" + (moving ? "run" : "idle");
      return playerSprites[k] || null;
    },
    getFortSprite: function (key) {
      return fortSprites[key] || null;
    },
    getPickupSprite: function (type) {
      return pickupSprites[type] || null;
    }
  };
})();
