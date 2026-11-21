(function () {
  "use strict";

  var MAX_LEVEL = 5;

  var CATEGORY_LABELS = {
    guns: "Guns",
    heavy: "Heavy & Sci-Fi",
    air: "Airplanes & Choppers",
    tactical: "Tactical Support"
  };

  var WEAPONS = [
    {
      id: "rifle",
      key: "1",
      name: "M4 Assault Rifle",
      shortName: "M4 Rifle",
      category: "guns",
      showCooldown: false,
      color: "#f59e0b",
      sprite: "assets/sprites/weapons/rifle.png",
      desc: "Reliable rapid-fire carbine with high muzzle velocity and crisp brass ejection.",
      upgradeBaseCost: 140,
      baseStats: {
        damage: 26,
        fireRate: 9.5,
        spread: 0.045,
        speed: 980,
        pellets: 1,
        pierce: 1,
        range: 920
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 10h15l3-1.5M5 10l-2 4M11 10v4.5M14 7.5h3"/></svg>'
    },
    {
      id: "shotgun",
      key: "2",
      name: "SPAS-12 Shotgun",
      shortName: "Shotgun",
      category: "guns",
      showCooldown: false,
      color: "#fb923c",
      sprite: "assets/sprites/weapons/shotgun.png",
      desc: "Fires a wide cone of heavy buckshot pellets with devastating close-range knockback.",
      upgradeBaseCost: 160,
      baseStats: {
        damage: 19,
        fireRate: 1.85,
        spread: 0.34,
        speed: 860,
        pellets: 8,
        pierce: 1,
        range: 460
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 11h17M3 11l-1 4M12 11l1 3M8 8.5h8"/></svg>'
    },
    {
      id: "minigun",
      key: "3",
      name: "M134 Vulcan Minigun",
      shortName: "Minigun",
      category: "guns",
      showCooldown: false,
      color: "#fbbf24",
      sprite: "assets/sprites/weapons/minigun.png",
      desc: "Six-barrel rotary storm spitting molten tracer rounds at an absurd rate.",
      upgradeBaseCost: 210,
      baseStats: {
        damage: 17,
        fireRate: 22,
        spread: 0.14,
        speed: 1050,
        pellets: 1,
        pierce: 1,
        range: 840,
        moveSlow: 0.82
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="7" width="8" height="6" rx="1"/><path d="M11 8h10M11 10h10M11 12h10"/></svg>'
    },
    {
      id: "railgun",
      key: "4",
      name: "Railgun Sniper",
      shortName: "Railgun",
      category: "guns",
      showCooldown: false,
      color: "#facc15",
      sprite: "assets/sprites/weapons/railgun.png",
      desc: "Hyper-velocity electromagnetic slug that instantly pierces entire lines of zombies.",
      upgradeBaseCost: 220,
      baseStats: {
        damage: 185,
        fireRate: 1.05,
        spread: 0.0,
        speed: 2200,
        pellets: 1,
        pierce: 18,
        range: 1350
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 10h20M6 7h12M6 13h12M19 6l3 4-3 4"/></svg>'
    },
    {
      id: "flamethrower",
      key: "5",
      name: "M2 Flamethrower",
      shortName: "Flamer",
      category: "heavy",
      showCooldown: false,
      color: "#f97316",
      sprite: "assets/sprites/weapons/flamethrower.png",
      desc: "Projects a roaring jet of burning napalm that ignites hordes over time.",
      upgradeBaseCost: 190,
      baseStats: {
        damage: 13,
        fireRate: 24,
        spread: 0.25,
        speed: 470,
        pellets: 2,
        pierce: 6,
        range: 330,
        burnDamage: 16,
        burnDuration: 2.6
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 11h10M12 11c2-4 7-4 9-1-2 2-4 3-7 3"/><circle cx="6" cy="7" r="2"/></svg>'
    },
    {
      id: "rpg",
      key: "6",
      name: "RPG-7 Rocket Launcher",
      shortName: "RPG-7",
      category: "heavy",
      showCooldown: true,
      color: "#38bdf8",
      sprite: "assets/sprites/weapons/rpg.png",
      desc: "Launches high-explosive warheads that shred dense zombie packs with shockwaves.",
      upgradeBaseCost: 230,
      baseStats: {
        damage: 165,
        fireRate: 0.9,
        spread: 0.02,
        speed: 620,
        pellets: 1,
        pierce: 1,
        range: 1100,
        blastRadius: 135
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 10h13l4-2v4l-4-2M7 10v4"/></svg>'
    },
    {
      id: "tesla",
      key: "7",
      name: "Tesla Arc Cannon",
      shortName: "Tesla Arc",
      category: "heavy",
      showCooldown: false,
      color: "#22d3ee",
      sprite: "assets/sprites/weapons/tesla.png",
      desc: "Discharges high-voltage lightning that jumps across multiple zombies and shocks them.",
      upgradeBaseCost: 240,
      baseStats: {
        damage: 66,
        fireRate: 2.8,
        spread: 0,
        speed: 1400,
        pellets: 1,
        pierce: 1,
        range: 460,
        chainCount: 6,
        slowFactor: 0.55
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L5 11h6l-1 7 9-10h-6l0-6z"/></svg>'
    },
    {
      id: "a10",
      key: "8",
      name: "A-10 Warthog Jet",
      shortName: "A-10 Jet",
      category: "air",
      showCooldown: true,
      color: "#10b981",
      desc: "Calls an A-10 attack airplane to strafe your aimed corridor with explosive 30mm shells!",
      upgradeBaseCost: 280,
      baseStats: {
        damage: 95,
        cooldown: 3.2,
        blastRadius: 74,
        planes: 1,
        roundsPerPlane: 14,
        range: 1800
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.5 6.5L22 10v2l-7.5-.5L13 17l3 1.5v1.5l-4-1-4 1v-1.5L11 17l-1.5-5.5L2 12v-2l7.5-1.5L12 2z"/></svg>'
    },
    {
      id: "bomber",
      key: "9",
      name: "B-52 Carpet Bomber",
      shortName: "B-52 Bomber",
      category: "air",
      showCooldown: true,
      color: "#34d399",
      desc: "Summons a heavy B-52 Stratofortress dropping a rolling line of 12 devastating bombs.",
      upgradeBaseCost: 340,
      baseStats: {
        damage: 180,
        cooldown: 5.2,
        blastRadius: 128,
        planes: 1,
        bombsPerPlane: 12,
        range: 2000
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2 5 8 4v2l-8-1.5-1 5.5 3 1.5v1.5l-4-1-4 1v-1.5l3-1.5-1-5.5L2 13v-2l8-4 2-5z"/></svg>'
    },
    {
      id: "chopper",
      key: "0",
      name: "Apache Gunship",
      shortName: "Apache Heli",
      category: "air",
      showCooldown: true,
      color: "#2dd4bf",
      desc: "Deploys an orbiting Apache helicopter with autocannon & twin homing Hydra rockets.",
      upgradeBaseCost: 320,
      baseStats: {
        damage: 34,
        rocketDamage: 125,
        cooldown: 6.5,
        duration: 14,
        blastRadius: 92,
        maxActive: 2,
        range: 700
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 5h16M12 5v4M6 12h10l4-2v4l-4-2M9 15h6"/><ellipse cx="11" cy="11" rx="4" ry="2.5"/></svg>'
    }
  ];

  var TACTICALS = [
    {
      id: "turret",
      key: "Q",
      name: "Deploy Auto-Turret",
      shortName: "Turret",
      category: "tactical",
      showCooldown: true,
      color: "#a78bfa",
      survivalCost: 150,
      desc: "Deploys an automated twin-barrel sentry turret that locks onto nearby zombies.",
      upgradeBaseCost: 220,
      baseStats: {
        damage: 24,
        fireRate: 7.5,
        cooldown: 2.0,
        duration: 36,
        range: 490,
        maxActive: 3,
        hp: 260
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M14 9h7M14 11h7M6 16l4-3 4 3"/></svg>'
    },
    {
      id: "orbital",
      key: "E",
      name: "Orbital Ion Laser",
      shortName: "Ion Laser",
      category: "tactical",
      showCooldown: true,
      color: "#c084fc",
      survivalCost: 250,
      desc: "Calls a continuous satellite ion beam from orbit that follows your cursor & vaporizes hordes.",
      upgradeBaseCost: 300,
      baseStats: {
        damagePerSec: 460,
        cooldown: 6.0,
        duration: 3.0,
        radius: 72
      },
      svg: '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v12M8 14h8M6 17h12M9 5l3-3 3 3"/></svg>'
    }
  ];

  var WEAPON_BY_ID = {};
  for (var i = 0; i < WEAPONS.length; i++) {
    WEAPON_BY_ID[WEAPONS[i].id] = WEAPONS[i];
  }
  var TACTICAL_BY_ID = {};
  for (var j = 0; j < TACTICALS.length; j++) {
    TACTICAL_BY_ID[TACTICALS[j].id] = TACTICALS[j];
  }

  function getUpgradeCost(def, level) {
    if (!def || level >= MAX_LEVEL) return Infinity;
    return Math.round(def.upgradeBaseCost * Math.pow(1.65, level - 1));
  }

  function getScaledStats(def, level) {
    var lv = Math.max(1, Math.min(MAX_LEVEL, level || 1));
    var b = def.baseStats;
    var dmgMult = 1 + (lv - 1) * 0.28;
    var rateMult = 1 + (lv - 1) * 0.14;
    var cdMult = Math.max(0.45, 1 - (lv - 1) * 0.13);
    var aoeMult = 1 + (lv - 1) * 0.12;

    if (def.category === "air") {
      var planes = b.planes || 1;
      if (def.id === "a10") {
        planes = lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
      } else if (def.id === "bomber") {
        planes = lv >= 4 ? 2 : 1;
      }
      return {
        damage: Math.round((b.damage || 0) * dmgMult),
        rocketDamage: Math.round((b.rocketDamage || 0) * dmgMult),
        cooldown: +(b.cooldown * cdMult).toFixed(2),
        blastRadius: Math.round((b.blastRadius || 60) * aoeMult),
        planes: planes,
        roundsPerPlane: (b.roundsPerPlane || 0) + (lv - 1) * 2,
        bombsPerPlane: (b.bombsPerPlane || 0) + (lv - 1) * 2,
        duration: (b.duration || 0) + (lv - 1) * 2.5,
        maxActive: (b.maxActive || 1) + (lv >= 3 ? 1 : 0) + (lv >= 5 ? 1 : 0),
        range: b.range || 1600
      };
    }

    if (def.id === "turret") {
      return {
        damage: Math.round(b.damage * dmgMult),
        fireRate: +(b.fireRate * rateMult).toFixed(2),
        cooldown: +(b.cooldown * cdMult).toFixed(2),
        duration: b.duration + (lv - 1) * 6,
        range: Math.round(b.range * (1 + (lv - 1) * 0.08)),
        maxActive: b.maxActive + (lv >= 3 ? 1 : 0) + (lv >= 5 ? 1 : 0),
        hp: Math.round(b.hp * dmgMult)
      };
    }

    if (def.id === "orbital") {
      return {
        damagePerSec: Math.round(b.damagePerSec * dmgMult),
        cooldown: +(b.cooldown * cdMult).toFixed(2),
        duration: +(b.duration + (lv - 1) * 0.45).toFixed(2),
        radius: Math.round(b.radius * aoeMult)
      };
    }

    // Guns & Heavy
    var fireRate = +(b.fireRate * rateMult).toFixed(2);
    return {
      damage: Math.round(b.damage * dmgMult),
      fireRate: fireRate,
      cooldown: +(1 / fireRate).toFixed(4),
      spread: b.spread,
      speed: Math.round(b.speed * (1 + (lv - 1) * 0.04)),
      pellets: b.pellets + (def.id === "shotgun" ? (lv - 1) * 2 : 0),
      pierce: b.pierce + (def.id === "railgun" ? (lv - 1) * 4 : 0),
      range: Math.round(b.range * (1 + (lv - 1) * 0.06)),
      blastRadius: b.blastRadius ? Math.round(b.blastRadius * aoeMult) : 0,
      burnDamage: b.burnDamage ? Math.round(b.burnDamage * dmgMult) : 0,
      burnDuration: b.burnDuration || 0,
      chainCount: b.chainCount ? b.chainCount + (lv - 1) * 1 : 0,
      slowFactor: b.slowFactor || 1,
      moveSlow: b.moveSlow || 1
    };
  }

  window.WeaponData = {
    MAX_LEVEL: MAX_LEVEL,
    CATEGORY_LABELS: CATEGORY_LABELS,
    WEAPONS: WEAPONS,
    TACTICALS: TACTICALS,
    WEAPON_BY_ID: WEAPON_BY_ID,
    TACTICAL_BY_ID: TACTICAL_BY_ID,
    getUpgradeCost: getUpgradeCost,
    getScaledStats: getScaledStats
  };
})();
