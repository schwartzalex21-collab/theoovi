/* ============================================================
   THE OOVI — Home polish runtime
   ------------------------------------------------------------
   - Sets html.is-scrolling while the user is actively scrolling so
     heavy decorative animations (breathing rings, drifting
     particles, ripple effects) can pause via CSS — this is the
     biggest single perf win on the homepage.
   - Toggles .lineup.is-hover-antracit / .is-hover-rose when the
     user hovers each hoodie image, driving the section's
     background-gradient toward that hoodie's colour.
   - Touch-friendly: short tap-to-preview that auto-clears.
   ============================================================ */
(() => {
  'use strict';

  /* ---- 1. Scroll-active flag ---- */
  const html = document.documentElement;
  let scrollTimer = null;
  const onScroll = () => {
    if (!html.classList.contains('is-scrolling')) {
      html.classList.add('is-scrolling');
    }
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      html.classList.remove('is-scrolling');
      scrollTimer = null;
    }, 180);
  };
  window.addEventListener('scroll',    onScroll, { passive: true });
  window.addEventListener('wheel',     onScroll, { passive: true });
  window.addEventListener('touchmove', onScroll, { passive: true });

  /* ---- 2. Lineup hover → section bg gradient ---- */
  const lineup = document.getElementById('lineupGrid')?.closest('.lineup');
  if (!lineup) return;

  const cards = lineup.querySelectorAll('.choose-card[data-color]');
  const setHover = (color) => {
    lineup.classList.remove('is-hover-antracit', 'is-hover-rose');
    if (color === 'antracit') lineup.classList.add('is-hover-antracit');
    else if (color === 'rose') lineup.classList.add('is-hover-rose');
  };
  const clearHover = () => {
    lineup.classList.remove('is-hover-antracit', 'is-hover-rose');
  };

  cards.forEach((card) => {
    const c = card.dataset.color;
    card.addEventListener('mouseenter', () => setHover(c));
    card.addEventListener('mouseleave', clearHover);

    // Mobile: tap-to-preview, auto-clear after 1.6s
    let tapTimer = null;
    card.addEventListener('touchstart', () => {
      setHover(c);
      if (tapTimer) clearTimeout(tapTimer);
      tapTimer = setTimeout(clearHover, 1600);
    }, { passive: true });
  });
})();
