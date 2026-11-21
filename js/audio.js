(function () {
  "use strict";

  var ctx = null;
  var masterGain = null;
  var noiseBuffer = null;
  var muted = false;
  var lastPlayed = {};

  function ensureContext() {
    if (muted) return null;
    if (typeof window === "undefined") return null;
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
      try {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.34;
        masterGain.connect(ctx.destination);
        noiseBuffer = buildNoiseBuffer(ctx);
      } catch (_e) {
        return null;
      }
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function buildNoiseBuffer(audioCtx) {
    var len = audioCtx.sampleRate * 1.5;
    var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  function canTrigger(tag, minIntervalMs) {
    var now = performance.now ? performance.now() : Date.now();
    if (lastPlayed[tag] && now - lastPlayed[tag] < minIntervalMs) {
      return false;
    }
    lastPlayed[tag] = now;
    return true;
  }

  function playTone(opts) {
    var c = ensureContext();
    if (!c || !masterGain) return;
    var now = c.currentTime + (opts.delay || 0);
    var dur = opts.duration || 0.12;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opts.type || "sawtooth";
    osc.frequency.setValueAtTime(opts.freqStart || 440, now);
    if (opts.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), now + dur);
    }
    var peak = opts.gain || 0.18;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + (opts.attack || 0.005));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function playNoise(opts) {
    var c = ensureContext();
    if (!c || !masterGain || !noiseBuffer) return;
    var now = c.currentTime + (opts.delay || 0);
    var dur = opts.duration || 0.15;
    var src = c.createBufferSource();
    src.buffer = noiseBuffer;
    var filter = c.createBiquadFilter();
    filter.type = opts.filterType || "bandpass";
    filter.frequency.setValueAtTime(opts.freqStart || 1000, now);
    if (opts.freqEnd) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), now + dur);
    }
    filter.Q.value = opts.q || 1.2;
    var gain = c.createGain();
    gain.gain.setValueAtTime(opts.gain || 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start(now, Math.random() * 0.4, dur + 0.03);
  }

  var SoundEngine = {
    unlock: function () {
      ensureContext();
    },
    toggleMute: function () {
      muted = !muted;
      if (masterGain && ctx) {
        masterGain.gain.setValueAtTime(muted ? 0 : 0.34, ctx.currentTime);
      }
      return muted;
    },
    isMuted: function () {
      return muted;
    },
    playRifle: function () {
      if (!canTrigger("rifle", 45)) return;
      playTone({ type: "square", freqStart: 320, freqEnd: 90, duration: 0.075, gain: 0.14 });
      playNoise({ filterType: "highpass", freqStart: 1400, duration: 0.06, gain: 0.14 });
    },
    playShotgun: function () {
      if (!canTrigger("shotgun", 120)) return;
      playTone({ type: "sawtooth", freqStart: 190, freqEnd: 45, duration: 0.17, gain: 0.24 });
      playNoise({ filterType: "lowpass", freqStart: 2400, freqEnd: 260, duration: 0.2, gain: 0.3 });
    },
    playMinigun: function () {
      if (!canTrigger("minigun", 38)) return;
      playTone({ type: "sawtooth", freqStart: 420, freqEnd: 130, duration: 0.05, gain: 0.1 });
      playNoise({ filterType: "bandpass", freqStart: 1900, duration: 0.045, gain: 0.11 });
    },
    playRailgun: function () {
      if (!canTrigger("railgun", 150)) return;
      playTone({ type: "sine", freqStart: 1650, freqEnd: 180, duration: 0.28, gain: 0.26 });
      playTone({ type: "sawtooth", freqStart: 780, freqEnd: 70, duration: 0.24, gain: 0.16 });
      playNoise({ filterType: "highpass", freqStart: 2200, freqEnd: 500, duration: 0.16, gain: 0.15 });
    },
    playFlame: function () {
      if (!canTrigger("flame", 75)) return;
      playNoise({ filterType: "bandpass", freqStart: 580, freqEnd: 240, duration: 0.14, gain: 0.14, q: 0.8 });
    },
    playRocketLaunch: function () {
      if (!canTrigger("rocket", 120)) return;
      playTone({ type: "triangle", freqStart: 220, freqEnd: 85, duration: 0.22, gain: 0.16 });
      playNoise({ filterType: "bandpass", freqStart: 950, freqEnd: 280, duration: 0.28, gain: 0.22 });
    },
    playExplosion: function (scale) {
      var s = scale || 1;
      if (!canTrigger("explosion", 55)) return;
      playTone({ type: "sine", freqStart: 120, freqEnd: 28, duration: 0.35 * s, gain: Math.min(0.4, 0.26 * s) });
      playNoise({ filterType: "lowpass", freqStart: 1200, freqEnd: 95, duration: 0.42 * s, gain: Math.min(0.42, 0.28 * s) });
    },
    playTesla: function () {
      if (!canTrigger("tesla", 90)) return;
      playTone({ type: "square", freqStart: 1320, freqEnd: 460, duration: 0.11, gain: 0.12 });
      playTone({ type: "sawtooth", freqStart: 980, freqEnd: 1580, duration: 0.09, delay: 0.03, gain: 0.1 });
      playNoise({ filterType: "highpass", freqStart: 3200, duration: 0.09, gain: 0.1 });
    },
    playJetStrafe: function () {
      if (!canTrigger("jet", 250)) return;
      // Jet flyby roar + iconic A-10 BRRRT bursts
      playNoise({ filterType: "bandpass", freqStart: 520, freqEnd: 1600, duration: 0.55, gain: 0.24, q: 1.4 });
      playNoise({ filterType: "bandpass", freqStart: 1600, freqEnd: 340, duration: 0.65, delay: 0.45, gain: 0.24, q: 1.1 });
      playTone({ type: "sawtooth", freqStart: 98, freqEnd: 74, duration: 0.46, delay: 0.28, gain: 0.26 });
      playNoise({ filterType: "lowpass", freqStart: 1100, duration: 0.45, delay: 0.28, gain: 0.22 });
    },
    playBomberPass: function () {
      if (!canTrigger("bomber", 300)) return;
      playTone({ type: "sawtooth", freqStart: 78, freqEnd: 48, duration: 1.1, gain: 0.2 });
      playNoise({ filterType: "lowpass", freqStart: 420, freqEnd: 220, duration: 1.2, gain: 0.26 });
    },
    playChopperShot: function () {
      if (!canTrigger("chopper", 80)) return;
      playTone({ type: "square", freqStart: 270, freqEnd: 88, duration: 0.055, gain: 0.09 });
      playNoise({ filterType: "bandpass", freqStart: 1200, duration: 0.04, gain: 0.08 });
    },
    playTurretShot: function () {
      if (!canTrigger("turret", 75)) return;
      playTone({ type: "square", freqStart: 510, freqEnd: 165, duration: 0.045, gain: 0.07 });
    },
    playOrbitalLaser: function () {
      if (!canTrigger("orbital", 220)) return;
      playTone({ type: "sawtooth", freqStart: 180, freqEnd: 740, duration: 0.35, gain: 0.22 });
      playTone({ type: "sine", freqStart: 110, freqEnd: 65, duration: 1.6, delay: 0.15, gain: 0.26 });
      playNoise({ filterType: "bandpass", freqStart: 1500, freqEnd: 600, duration: 1.5, delay: 0.15, gain: 0.18, q: 1.8 });
    },
    playHit: function () {
      if (!canTrigger("hit", 42)) return;
      playTone({ type: "triangle", freqStart: 220, freqEnd: 85, duration: 0.045, gain: 0.07 });
    },
    playZombieDeath: function () {
      if (!canTrigger("zdeath", 55)) return;
      playTone({ type: "sawtooth", freqStart: 165, freqEnd: 52, duration: 0.11, gain: 0.09 });
    },
    playPlayerHurt: function () {
      if (!canTrigger("hurt", 160)) return;
      playTone({ type: "sawtooth", freqStart: 180, freqEnd: 62, duration: 0.18, gain: 0.22 });
    },
    playDash: function () {
      if (!canTrigger("dash", 150)) return;
      playNoise({ filterType: "bandpass", freqStart: 1200, freqEnd: 400, duration: 0.15, gain: 0.16 });
    },
    playPickup: function () {
      if (!canTrigger("pickup", 70)) return;
      playTone({ type: "sine", freqStart: 580, freqEnd: 920, duration: 0.11, gain: 0.15 });
      playTone({ type: "sine", freqStart: 920, freqEnd: 1240, duration: 0.11, delay: 0.06, gain: 0.14 });
    },
    playUpgrade: function () {
      playTone({ type: "triangle", freqStart: 440, freqEnd: 660, duration: 0.12, gain: 0.18 });
      playTone({ type: "triangle", freqStart: 660, freqEnd: 880, duration: 0.16, delay: 0.08, gain: 0.2 });
    },
    playSwitch: function () {
      if (!canTrigger("switch", 40)) return;
      playTone({ type: "sine", freqStart: 480, freqEnd: 620, duration: 0.045, gain: 0.08 });
    },
    playWaveStart: function () {
      playTone({ type: "triangle", freqStart: 260, freqEnd: 390, duration: 0.22, gain: 0.18 });
      playTone({ type: "triangle", freqStart: 390, freqEnd: 520, duration: 0.3, delay: 0.15, gain: 0.2 });
    },
    playBossWarning: function () {
      playTone({ type: "sawtooth", freqStart: 140, freqEnd: 95, duration: 0.35, gain: 0.26 });
      playTone({ type: "sawtooth", freqStart: 140, freqEnd: 95, duration: 0.4, delay: 0.42, gain: 0.28 });
    },
    playVomit: function () {
      if (!canTrigger("vomit", 160)) return;
      playTone({ type: "triangle", freqStart: 240, freqEnd: 92, duration: 0.19, gain: 0.15 });
      playNoise({ filterType: "bandpass", freqStart: 620, freqEnd: 240, duration: 0.22, gain: 0.16, q: 1.6 });
    },
    playSonicScream: function () {
      if (!canTrigger("sonic", 180)) return;
      playTone({ type: "sine", freqStart: 940, freqEnd: 460, duration: 0.28, gain: 0.16 });
      playTone({ type: "sawtooth", freqStart: 1380, freqEnd: 620, duration: 0.24, delay: 0.03, gain: 0.11 });
      playNoise({ filterType: "bandpass", freqStart: 1900, freqEnd: 900, duration: 0.22, gain: 0.1, q: 2.2 });
    }
  };

  window.SoundEngine = SoundEngine;
})();
