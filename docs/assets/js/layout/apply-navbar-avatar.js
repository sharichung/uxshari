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
      // Ensure wrapper + badge exist
      let wrapper = navLink.querySelector('.avatar-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'avatar-wrapper position-relative';
        wrapper.style.lineHeight = '0';
        navLink.innerHTML = '';
        navLink.appendChild(wrapper);
      }
      let img = wrapper.querySelector('#userAvatar');
      if (!img) {
        img = document.createElement('img');
        img.id = 'userAvatar';
        img.alt = 'User Avatar';
        img.className = 'rounded-circle';
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.objectFit = 'cover';
        wrapper.appendChild(img);
      }
      img.src = url;
      if (!wrapper.querySelector('#avatar-badge')) {
        const b = document.createElement('span');
        b.id = 'avatar-badge';
        b.className = 'avatar-badge';
        wrapper.appendChild(b);
      }
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

  function applyBadge() {
    try {
      const nav = document.getElementById('mainNavbar');
      if (!nav) return;
      const badge = nav.querySelector('#avatar-badge');
      if (!badge) return;
      const paid = (localStorage.getItem('userPaid') || sessionStorage.getItem('userPaid')) === '1';
      badge.classList.remove('paid','free');
      if (paid) {
        badge.classList.add('paid');
        badge.innerHTML = '<i class="fas fa-crown" aria-hidden="true"></i>';
        badge.title = '付費會員';
      } else {
        badge.classList.add('free');
        badge.innerHTML = '<i class="fas fa-star" aria-hidden="true"></i>';
        badge.title = '免費會員';
      }
    } catch (_) {}
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
    document.addEventListener('DOMContentLoaded', function(){ applyAvatarWithRetries(); applyBadge(); });
  } else {
    applyAvatarWithRetries();
    applyBadge();
  }
  // Also update badge when storage changes (best-effort)
  window.addEventListener('storage', function(e){ if (e.key === 'userPaid') applyBadge(); });
})();