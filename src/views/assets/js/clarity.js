// Lightweight, deferred Clarity loader with page allowlist
(function () {
  try {
    var path = window.location.pathname || "/";
    if (path === "/") path = "/index.html";

    // Only load on public marketing pages
    var ALLOW = new Set([
      "/index.html",
      "/pricing.html",
      "/success.html",
      "/404.html",
    ]);
    if (!ALLOW.has(path)) return; // Skip on app/private pages

    var loadClarity = function () {
      try {
        (function (c, l, a, r, i, t, y) {
          c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
          t = l.createElement(r);
          t.async = 1;
          t.src = "https://www.clarity.ms/tag/" + i;
          y = l.getElementsByTagName(r)[0];
          y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", "u6yhpaipuv");
      } catch (e) {
        // no-op
      }
    };

    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(loadClarity, { timeout: 2000 });
    } else {
      setTimeout(loadClarity, 1000);
    }
  } catch (_) { /* ignore */ }
})();
