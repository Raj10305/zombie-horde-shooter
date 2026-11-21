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

  var zombieSprites = Object.create(null);
  var weaponSprites = Object.create(null);

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

  preloadZombieSprites();
  preloadWeaponSprites();

  window.SpriteLoader = {
    ZOMBIE_SPRITE_PATHS: ZOMBIE_SPRITE_PATHS,
    WEAPON_SPRITE_PATHS: WEAPON_SPRITE_PATHS,
    getZombieSprite: function (type) {
      return zombieSprites[type] || null;
    },
    getWeaponSprite: function (weaponId) {
      var key = (weaponId === "a10" || weaponId === "bomber" || weaponId === "chopper")
        ? "designator"
        : weaponId;
      return weaponSprites[key] || null;
    }
  };
})();
