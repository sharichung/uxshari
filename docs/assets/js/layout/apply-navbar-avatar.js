// Apply user avatar to the general navbar across pages
(function(){
  function setNavAvatar(url) {
    try {
      if (!url) return false;
      try { localStorage.setItem('userAvatar', url); sessionStorage.setItem('userAvatar', url); } catch (_) {}
      const nav = document.getElementById('mainNavbar');
      if (!nav) return false;
      const navLink = nav.querySelector('a[href="account.html"]');
      if (!navLink) return false;
      const existingImg = navLink.querySelector('#userAvatar');
      if (existingImg) { existingImg.src = url; return true; }
      const img = document.createElement('img');
      img.id = 'userAvatar';
      img.alt = 'User Avatar';
      img.className = 'rounded-circle';
      img.style.width = '32px';
      img.style.height = '32px';
      img.style.objectFit = 'cover';
      img.src = url;
      navLink.innerHTML = '';
      navLink.appendChild(img);
      return true;
    } catch (_) { return false; }
  }

  function getStoredAvatar() {
    try {
      return localStorage.getItem('userAvatar') || sessionStorage.getItem('userAvatar') || '';
    } catch (_) { return ''; }
  }

  function tryApplyOnce() {
    // 1) From storage
    const stored = getStoredAvatar();
    if (stored && setNavAvatar(stored)) return true;
    // 2) From account page preview if available
    const preview = document.getElementById('avatar-preview');
    const previewSrc = preview && preview.getAttribute('src');
    if (previewSrc && previewSrc.length > 5 && setNavAvatar(previewSrc)) return true;
    return false;
  }

  function applyAvatarWithRetries() {
    if (tryApplyOnce()) return;
    // Poll for up to ~5 seconds while auth/account scripts initialize
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (tryApplyOnce() || attempts >= 8) {
        clearInterval(timer);
      }
    }, 700);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAvatarWithRetries);
  } else {
    applyAvatarWithRetries();
  }
})();