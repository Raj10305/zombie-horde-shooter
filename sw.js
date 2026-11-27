var CACHE_NAME = "skyfire-web-v2";
var ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./controls.html",
  "./styles.css",
  "./manifest.json",
  "./js/audio.js",
  "./js/weapons.js",
  "./js/map.js",
  "./js/entities.js",
  "./js/sprites.js",
  "./js/renderer.js",
  "./js/game.js",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/sprites/shambler.png",
  "./assets/sprites/runner.png",
  "./assets/sprites/brute.png",
  "./assets/sprites/spitter.png",
  "./assets/sprites/screamer.png",
  "./assets/sprites/exploder.png",
  "./assets/sprites/boss.png",
  "./assets/sprites/weapons/rifle.png",
  "./assets/sprites/weapons/shotgun.png",
  "./assets/sprites/weapons/minigun.png",
  "./assets/sprites/weapons/railgun.png",
  "./assets/sprites/weapons/flamethrower.png",
  "./assets/sprites/weapons/rpg.png",
  "./assets/sprites/weapons/tesla.png",
  "./assets/sprites/weapons/designator.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(function (resp) {
        if (resp && resp.status === 200 && resp.type === "basic") {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return resp;
      })
      .catch(function () {
        return caches.match(event.request);
      })
  );
});
