document.addEventListener("DOMContentLoaded", function () {
  // Layout
  import('./layout/load-navbar.js');
  import('./layout/load-footer.js');

  // Firebase
  import('./auth/firebase-init.js');

  // Auth
  import('./auth/login.js');
  import('./auth/google-login.js');
  import('./auth/password-reset.js');

  // Canvas animation
  if (document.getElementById("aestheticCanvas")) {
    import('./visual/aesthetic-canvas.js').then(mod => mod.initAestheticCanvas());
  }
});
