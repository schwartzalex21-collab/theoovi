/* ============================================================
   THE OOVI — Preloader
   ------------------------------------------------------------
   Tracks asset loading progress (images, scripts, stylesheets)
   and reveals the page once everything settles.

   Coexists with the existing #loader element from styles.css
   (different ID, higher z-index). When all resources finish:
     1. Progress bar fills to 100%
     2. Preloader fades out (~700ms)
     3. Existing #loader also continues its own fade — no conflict
   ============================================================ */
(() => {
  'use strict';

  const PRELOADER_ID = 'oovi-preloader';
  const existing = document.getElementById(PRELOADER_ID);
  if (!existing) return; // markup not present on this page

  const bar = existing.querySelector('.oovi-preloader__bar-fill');
  const label = existing.querySelector('.oovi-preloader__pct');

  // Track image loading + window.load for everything else
  const images = Array.from(document.images || []);
  const total = images.length + 1; // +1 for window.load itself
  let loaded = 0;

  const setProgress = (pct) => {
    if (bar) bar.style.transform = `scaleX(${pct})`;
    if (label) label.textContent = `${Math.round(pct * 100)}%`;
  };

  const advance = () => {
    loaded++;
    // Cap visible progress at 95% until window.load fires for real
    const fraction = Math.min(0.95, loaded / total);
    setProgress(fraction);
  };

  // Image counters
  images.forEach((img) => {
    if (img.complete) advance();
    else {
      img.addEventListener('load',  advance, { once: true });
      img.addEventListener('error', advance, { once: true });
    }
  });

  // Final completion
  const finish = () => {
    setProgress(1);
    setTimeout(() => {
      existing.classList.add('is-gone');
      // Remove from DOM after the fade so it doesn't intercept any input
      setTimeout(() => existing.remove(), 900);
    }, 350); // brief hold at 100% so user perceives completion
  };

  if (document.readyState === 'complete') {
    finish();
  } else {
    window.addEventListener('load', finish, { once: true });
  }

  // Safety: never block forever — auto-finish after 6s no matter what
  setTimeout(() => {
    if (document.body.contains(existing) && !existing.classList.contains('is-gone')) {
      finish();
    }
  }, 6000);
})();
