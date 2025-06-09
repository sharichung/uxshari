document.addEventListener("DOMContentLoaded", function () {
  // FAQ toggle
  document.querySelectorAll(".faq-question").forEach(question => {
    question.addEventListener("click", () => {
      const answer = question.nextElementSibling;
      const isActive = question.classList.contains("active");
      document.querySelectorAll(".faq-answer").forEach(a => a.classList.remove("show"));
      document.querySelectorAll(".faq-question").forEach(q => q.classList.remove("active"));
      if (!isActive) {
        answer.classList.add("show");
        question.classList.add("active");
      }
    });
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({
          top: targetElement.offsetTop - 70,
          behavior: 'smooth'
        });
      }
    });
  });

  // Mobile menu toggle
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // Floating CTA
  const floatingCta = document.getElementById('floating-cta');
  if (floatingCta) {
    floatingCta.addEventListener('click', () => {
      const authWrapper = document.getElementById('auth-wrapper');
      if (authWrapper) {
        window.scrollTo({
          top: authWrapper.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) floatingCta.classList.add('expanded');
      else floatingCta.classList.remove('expanded');
    });
  }

  // Countdown
  function updateCountdown() {
    const deadline = new Date("May 27, 2025 23:59:59").getTime();
    const now = Date.now();
    const diff = deadline - now;
    const el = document.getElementById("countdown");
    if (!el) return;

    if (diff <= 0) {
      el.innerHTML = "倒數已結束！";
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    el.innerHTML = `
      <div class="countdown">
          <div class="countdown-item"><span class="countdown-number">${days}</span><span class="countdown-label">天</span></div>
          <div class="countdown-item"><span class="countdown-number">${hours}</span><span class="countdown-label">時</span></div>
          <div class="countdown-item"><span class="countdown-number">${minutes}</span><span class="countdown-label">分</span></div>
          <div class="countdown-item"><span class="countdown-number">${seconds}</span><span class="countdown-label">秒</span></div>
      </div>`;
  }
  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Lazy load videos
  const lazyVideos = document.querySelectorAll('.lazy-video');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          video.src = video.dataset.src;
          video.classList.add('loaded');
          obs.unobserve(video);
        }
      });
    }, { rootMargin: '0px 0px 200px 0px' });
    lazyVideos.forEach(video => observer.observe(video));
  } else {
    lazyVideos.forEach(video => {
      video.src = video.dataset.src;
      video.classList.add('loaded');
    });
  }

  // Load videos on tab or accordion interaction
  document.querySelectorAll('#courseTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-bs-target');
      const video = document.querySelector(`${tabId} iframe.lazy-video`);
      if (video && !video.src) {
        video.src = video.dataset.src;
        video.classList.add('loaded');
      }
    });
  });

  document.querySelectorAll('.accordion-button').forEach(button => {
    button.addEventListener('click', () => {
      const collapseId = button.getAttribute('data-bs-target');
      const video = document.querySelector(`${collapseId} iframe.lazy-video`);
      if (video && !video.src) {
        video.src = video.dataset.src;
        video.classList.add('loaded');
      }
    });
  });

  // Set current year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Touch support
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('touch-device');
  }
});
