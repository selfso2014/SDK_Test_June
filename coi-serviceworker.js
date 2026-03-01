/*! coi-service-worker v0.1.7 - Guido Zuidhof, licensed under MIT */
/*  PATCHED: Safari/iOS infinite reload loop prevention */
if (typeof window === 'undefined') {
    // ── Service Worker context ──
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
    self.addEventListener("message", (ev) => {
        if (ev.data && ev.data.type === "deregister") {
            self.registration.unregister().then(() => {
                return self.clients.matchAll();
            }).then(clients => {
                clients.forEach(client => client.navigate(client.url));
            });
        }
    });
    self.addEventListener("fetch", function (e) {
        if (e.request.cache === "only-if-cached" && e.request.mode !== "same-origin") return;
        e.respondWith(
            fetch(e.request).then(response => {
                if (response.status === 0) return response;
                const newHeaders = new Headers(response.headers);
                newHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
                newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders
                });
            }).catch(e => console.error(e))
        );
    });
} else {
    // ── Window context ──
    (async () => {
        // Already isolated — nothing to do
        if (window.crossOriginIsolated !== false) return;

        // ╔════════════════════════════════════════════════════════════════════╗
        // ║  [PATCH] Safari/iOS does NOT support COOP/COEP via ServiceWorker ║
        // ║  Attempting to register + reload creates an infinite loop.       ║
        // ║  Solution: Skip entirely on Safari/iOS.                          ║
        // ╚════════════════════════════════════════════════════════════════════╝
        const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        if (IS_SAFARI || IS_IOS) {
            console.warn('[COI] Safari/iOS detected — skipping COOP/COEP ServiceWorker (not supported). SharedArrayBuffer may be unavailable.');
            return;
        }

        // ── Prevent infinite reload: only attempt once per session ──
        const COI_RELOAD_KEY = '__coi_reloaded__';
        if (sessionStorage.getItem(COI_RELOAD_KEY) === '1') {
            console.warn('[COI] Already reloaded once for COOP/COEP — stopping to prevent loop.');
            return;
        }

        const registration = await navigator.serviceWorker
            .register(window.document.currentScript.src)
            .catch(e => console.error("COOP/COEP Service Worker failed:", e));

        if (registration) {
            console.log("COOP/COEP Service Worker registered, reloading...");
            sessionStorage.setItem(COI_RELOAD_KEY, '1');
            setTimeout(() => window.location.reload(), 500);
        }
    })();
}
