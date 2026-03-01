/* coi-serviceworker.js
 *
 * Enables Cross-Origin Isolation (COOP/COEP) on static hosting (e.g., GitHub Pages)
 * by injecting the required headers via a Service Worker.
 *
 * - Document must be reloaded once after the SW takes control.
 * - Required because Eyedid(SeeSo) Web SDK uses SharedArrayBuffer (Wasm threads).
 */
(() => {
    // If we're in a window context, register the service worker.
    if (typeof window !== "undefined") {
        if (!("serviceWorker" in navigator)) return;

        // If already isolated, nothing to do.
        if (window.crossOriginIsolated) return;

        // Register this very file as the service worker.
        navigator.serviceWorker
            .register("./coi-serviceworker.js", { scope: "./" })
            .then(() => {
                // If there is no controller yet, the SW hasn't taken control of this page.
                // Reload once so the controlled navigation includes COOP/COEP headers.
                if (!navigator.serviceWorker.controller) {
                    window.location.reload();
                }
            })
            .catch((err) => {
                console.warn("COI service worker registration failed:", err);
            });

        return;
    }

    // Otherwise, we're in the Service Worker global scope.
    self.addEventListener("install", (event) => {
        self.skipWaiting();
    });

    self.addEventListener("activate", (event) => {
        event.waitUntil(self.clients.claim());
    });

    // Add COOP/COEP headers to all same-origin responses.
    self.addEventListener("fetch", (event) => {
        const request = event.request;

        event.respondWith(
            fetch(request).then((response) => {
                // If response is opaque, we can't read/modify headers.
                if (!response || response.type === "opaque") return response;

                const headers = new Headers(response.headers);

                // Required to enable `crossOriginIsolated` and SharedArrayBuffer.
                headers.set("Cross-Origin-Opener-Policy", "same-origin");
                headers.set("Cross-Origin-Embedder-Policy", "require-corp");

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers,
                });
            })
        );
    });
})();
