# DEADLINE: SKYFIRE — iOS Mobile App Guide

You can run **DEADLINE: SKYFIRE** on your iPhone or iPad using either the instant **iOS Home Screen App (PWA)** directly from Windows, or by compiling the **native Capacitor iOS `.ipa` package**.

---

## Mobile Touch Controls (Built In)
On iPhone and iPad (or any touchscreen), touch controls appear automatically during combat:
- **Left Pad (`MOVE`)**: Virtual thumbstick to move your soldier in any direction.
- **Right Pad (`AIM / FIRE`)**: Virtual thumbstick to aim and continuously fire guns, or tap/drag directly anywhere on the battlefield to shoot or target A-10 airstrikes, B-52 carpet bombers, and Apache gunships right where you touch.
- **Tactical Touch Buttons** (above the right thumbstick):
  - **DASH**: Tactical dodge with brief invulnerability.
  - **TURRET**: Deploy Auto-Turret (`[Q]`).
  - **LASER**: Call Orbital Ion Laser (`[E]`).
- **Weapon Dock**: Tap any weapon slot along the bottom bar to switch weapons (`1`–`9`, `0`).

---

## Option 1: Install on iPhone / iPad Instantly via Wi-Fi (No Mac Required)

1. Connect your Windows PC and iPhone/iPad to the **same Wi-Fi network**.
2. On Windows, double-click **`play_on_ios.bat`** (or run `python serve_ios.py` in this folder).
3. If Windows Defender Firewall prompts, allow Python access on your private Wi-Fi network.
4. Open **Safari** on your iPhone/iPad and open the `http://<YOUR-PC-IP>:8080` URL printed in the terminal.
5. Tap Safari's **Share** button (square with upward arrow) and choose **Add to Home Screen** → **Add**.
6. Launch the **SKYFIRE** icon from your Home Screen. It opens full-screen without Safari toolbars and caches all sprites/scripts offline via `sw.js`.

---

## Option 2: Build a Native iOS `.ipa` Without a Mac (GitHub Actions Cloud Build)

Apple requires macOS + Xcode to compile a native `.ipa` file. This folder includes a ready-to-run Capacitor configuration (`package.json`, `capacitor.config.json`, `build_www.py`) and a macOS cloud workflow (`.github/workflows/ios-build.yml`):

1. Push the `zombie-horde-shooter` folder to a GitHub repository.
2. Open the **Actions** tab on GitHub and run **Build iOS IPA (Capacitor)** (or it triggers automatically on push to `main`/`master`).
3. Download the **`DEADLINE-SKYFIRE-iOS-IPA`** artifact (`DEADLINE-SKYFIRE-iOS.ipa`).
4. Install `DEADLINE-SKYFIRE-iOS.ipa` onto your iPhone/iPad using **Sideloadly** or **AltStore** on Windows (free Apple ID signing supported).

---

## Option 3: Build Directly in Xcode (If You Have Access to a Mac)

```bash
python build_www.py
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then select your iPhone or iPad in Xcode and press **Run (▶)**.
