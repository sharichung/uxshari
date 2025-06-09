// Load footer
fetch('/footer.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('footer-placeholder').innerHTML = html;
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
