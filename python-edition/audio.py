"""Procedural 16-bit PCM synthesizer using standard library + pygame.mixer."""

import array
import math
import random
import time

SAMPLE_RATE = 22050


def _build_pcm(duration_s, generator_fn):
    total = max(1, int(SAMPLE_RATE * duration_s))
    buf = array.array("h")
    for i in range(total):
        t = i / SAMPLE_RATE
        val = generator_fn(t, duration_s)
        clamped = max(-1.0, min(1.0, val))
        buf.append(int(clamped * 32767))
    return buf


def _make_sound(pygame_mod, buf):
    try:
        snd = pygame_mod.mixer.Sound(buffer=buf)
        snd.set_volume(0.35)
        return snd
    except Exception:
        return None


class SoundEngine:
    def __init__(self):
        self.muted = False
        self.ready = False
        self.last_played = {}
        self.sounds = {}

    def init(self):
        try:
            import pygame

            if not pygame.mixer.get_init():
                pygame.mixer.init(frequency=SAMPLE_RATE, size=-16, channels=1, buffer=512)
            pygame.mixer.set_num_channels(24)
            self._build_all(pygame)
            self.ready = True
        except Exception:
            self.ready = False

    def _build_all(self, pygame_mod):
        rng = random.Random(42)

        def tone_buf(freq_a, freq_b, dur, gain=0.45, wave="square", delay=0.0):
            def fn(t, total_d):
                if t < delay:
                    return 0.0
                lt = t - delay
                u = min(1.0, lt / max(0.001, total_d - delay))
                freq = freq_a + (freq_b - freq_a) * u
                phase = lt * freq * math.tau
                if wave == "sine":
                    s = math.sin(phase)
                elif wave == "triangle":
                    s = 2.0 * abs(2.0 * ((lt * freq) % 1.0) - 1.0) - 1.0
                else:
                    s = 1.0 if math.sin(phase) >= 0 else -1.0
                env = (1.0 - u) ** 1.4
                return s * env * gain

            return _build_pcm(dur + delay, fn)

        def noise_buf(dur, gain=0.45, smooth=0.3, delay=0.0):
            prev = [0.0]

            def fn(t, total_d):
                if t < delay:
                    return 0.0
                u = (t - delay) / max(0.001, total_d - delay)
                raw = rng.random() * 2.0 - 1.0
                prev[0] = prev[0] * smooth + raw * (1.0 - smooth)
                env = (1.0 - u) ** 1.3
                return prev[0] * env * gain

            return _build_pcm(dur + delay, fn)

        def mix_bufs(*bufs):
            max_len = max(len(b) for b in bufs)
            out = array.array("h", [0] * max_len)
            for b in bufs:
                for i, v in enumerate(b):
                    s = out[i] + v
                    out[i] = max(-32767, min(32767, s))
            return out

        self.sounds["rifle"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(320, 95, 0.075, 0.35), noise_buf(0.06, 0.3, 0.15))
        )
        self.sounds["shotgun"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(190, 48, 0.17, 0.5), noise_buf(0.20, 0.55, 0.45))
        )
        self.sounds["minigun"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(410, 130, 0.05, 0.28), noise_buf(0.045, 0.25, 0.2))
        )
        self.sounds["railgun"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(1550, 180, 0.28, 0.5, "sine"), tone_buf(760, 70, 0.22, 0.3))
        )
        self.sounds["flame"] = _make_sound(pygame_mod, noise_buf(0.14, 0.35, 0.65))
        self.sounds["rocket"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(220, 85, 0.22, 0.35, "triangle"), noise_buf(0.26, 0.42, 0.5))
        )
        self.sounds["explosion"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(115, 28, 0.36, 0.55, "sine"), noise_buf(0.42, 0.6, 0.7))
        )
        self.sounds["tesla"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(1280, 460, 0.11, 0.32), tone_buf(950, 1500, 0.09, 0.24, delay=0.03))
        )
        self.sounds["jet"] = _make_sound(
            pygame_mod, mix_bufs(noise_buf(0.8, 0.45, 0.55), tone_buf(98, 72, 0.45, 0.45, delay=0.2))
        )
        self.sounds["bomber"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(78, 48, 0.9, 0.4), noise_buf(0.95, 0.45, 0.78))
        )
        self.sounds["chopper"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(260, 90, 0.055, 0.24), noise_buf(0.04, 0.2, 0.25))
        )
        self.sounds["turret"] = _make_sound(pygame_mod, tone_buf(510, 165, 0.045, 0.22))
        self.sounds["orbital"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(180, 720, 0.35, 0.42), tone_buf(110, 68, 0.9, 0.45, "sine", 0.15))
        )
        self.sounds["vomit"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(240, 92, 0.19, 0.34, "triangle"), noise_buf(0.2, 0.35, 0.55))
        )
        self.sounds["sonic"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(940, 460, 0.28, 0.36, "sine"), tone_buf(1360, 620, 0.24, 0.22, delay=0.02))
        )
        self.sounds["hit"] = _make_sound(pygame_mod, tone_buf(220, 85, 0.045, 0.2, "triangle"))
        self.sounds["zdeath"] = _make_sound(pygame_mod, tone_buf(165, 52, 0.11, 0.25))
        self.sounds["hurt"] = _make_sound(pygame_mod, tone_buf(180, 62, 0.18, 0.45))
        self.sounds["dash"] = _make_sound(pygame_mod, noise_buf(0.14, 0.35, 0.4))
        self.sounds["pickup"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(580, 920, 0.11, 0.3, "sine"), tone_buf(920, 1240, 0.11, 0.28, "sine", 0.06))
        )
        self.sounds["upgrade"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(440, 660, 0.12, 0.34, "triangle"), tone_buf(660, 880, 0.16, 0.36, "triangle", 0.08))
        )
        self.sounds["switch"] = _make_sound(pygame_mod, tone_buf(480, 620, 0.045, 0.2, "sine"))
        self.sounds["wave"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(260, 390, 0.22, 0.34, "triangle"), tone_buf(390, 520, 0.28, 0.36, "triangle", 0.15))
        )
        self.sounds["boss"] = _make_sound(
            pygame_mod, mix_bufs(tone_buf(140, 95, 0.32, 0.46), tone_buf(140, 95, 0.35, 0.46, delay=0.38))
        )

    def toggle_mute(self):
        self.muted = not self.muted
        return self.muted

    def is_muted(self):
        return self.muted

    def _play(self, key, min_interval_ms=0):
        if self.muted or not self.ready:
            return
        snd = self.sounds.get(key)
        if snd is None:
            return
        if min_interval_ms > 0:
            now_ms = time.perf_counter() * 1000.0
            last = self.last_played.get(key, 0.0)
            if now_ms - last < min_interval_ms:
                return
            self.last_played[key] = now_ms
        try:
            snd.play()
        except Exception:
            pass

    def play_rifle(self):
        self._play("rifle", 45)

    def play_shotgun(self):
        self._play("shotgun", 120)

    def play_minigun(self):
        self._play("minigun", 38)

    def play_railgun(self):
        self._play("railgun", 150)

    def play_flame(self):
        self._play("flame", 75)

    def play_rocket_launch(self):
        self._play("rocket", 120)

    def play_explosion(self, _scale=1.0):
        self._play("explosion", 55)

    def play_tesla(self):
        self._play("tesla", 90)

    def play_jet_strafe(self):
        self._play("jet", 250)

    def play_bomber_pass(self):
        self._play("bomber", 300)

    def play_chopper_shot(self):
        self._play("chopper", 80)

    def play_turret_shot(self):
        self._play("turret", 75)

    def play_orbital_laser(self):
        self._play("orbital", 220)

    def play_vomit(self):
        self._play("vomit", 160)

    def play_sonic_scream(self):
        self._play("sonic", 180)

    def play_hit(self):
        self._play("hit", 42)

    def play_zombie_death(self):
        self._play("zdeath", 55)

    def play_player_hurt(self):
        self._play("hurt", 160)

    def play_dash(self):
        self._play("dash", 150)

    def play_pickup(self):
        self._play("pickup", 70)

    def play_upgrade(self):
        self._play("upgrade", 0)

    def play_switch(self):
        self._play("switch", 40)

    def play_wave_start(self):
        self._play("wave", 0)

    def play_boss_warning(self):
        self._play("boss", 0)
