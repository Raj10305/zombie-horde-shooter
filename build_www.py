"""Copy web game assets into www/ for Capacitor native iOS packaging."""

import os
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
WWW_DIR = os.path.join(ROOT, "www")

FILES_TO_COPY = [
    "index.html",
    "controls.html",
    "styles.css",
    "manifest.json",
    "sw.js",
]

DIRS_TO_COPY = [
    "js",
    "assets",
]


def main():
    if os.path.exists(WWW_DIR):
        shutil.rmtree(WWW_DIR)
    os.makedirs(WWW_DIR, exist_ok=True)

    for fname in FILES_TO_COPY:
        src = os.path.join(ROOT, fname)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(WWW_DIR, fname))

    for dname in DIRS_TO_COPY:
        src = os.path.join(ROOT, dname)
        if os.path.exists(src):
            shutil.copytree(src, os.path.join(WWW_DIR, dname))

    print(f"BUILT {WWW_DIR}")


if __name__ == "__main__":
    main()
