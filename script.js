/* ============================================================
   THE OOVI — Premium calming interactions
   Principles: slow easings, lerped follow, scroll-linked reveals,
   no bouncy/spring motion, no autoplay video, no audio.
   ============================================================ */
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ------------------------------------------------------------
   * 1. Loader — breathe once, then dissolve
   * ---------------------------------------------------------- */
  const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.classList.add('is-gone');
    setTimeout(() => loader.remove(), 1500);
  };
  // Show loader briefly so first frame is calm (~1.2s)
  window.addEventListener('load', () => {
    setTimeout(hideLoader, prefersReducedMotion ? 100 : 1200);
  });

  /* ------------------------------------------------------------
   * 2. Soft cursor — lerped position, blend-mode
   * ---------------------------------------------------------- */
  if (!isTouch && !prefersReducedMotion) {
    const cursor = document.querySelector('.cursor');
    const dot = document.querySelector('.cursor-dot');
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: target.x, y: target.y };
    const point = { x: target.x, y: target.y };

    window.addEventListener('mousemove', (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
    }, { passive: true });

    const lerp = (a, b, t) => a + (b - a) * t;
    const tick = () => {
      ring.x  = lerp(ring.x,  target.x, 0.18);
      ring.y  = lerp(ring.y,  target.y, 0.18);
      point.x = lerp(point.x, target.x, 0.45);
      point.y = lerp(point.y, target.y, 0.45);
      cursor.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      dot.style.transform    = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Grow ring on interactive elements
    document.querySelectorAll('a, button, [data-magnetic], .swatch').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  }

  /* ------------------------------------------------------------
   * 3. Lenis smooth scroll
   * ---------------------------------------------------------- */
  let lenis;
  const isHeadless = /HeadlessChrome|Puppeteer|Playwright/i.test(navigator.userAgent);
  if (window.Lenis && !prefersReducedMotion && !isHeadless) {
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.85,
    });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ------------------------------------------------------------
   * 4. Word / letter splitters (for reveal animations)
   * ---------------------------------------------------------- */
  const splitWords = (el) => {
    // Walk text nodes only — preserve inline tags like <em>, <br>
    const wrapText = (textNode) => {
      const frag = document.createDocumentFragment();
      const tokens = textNode.nodeValue.split(/(\s+)/);
      tokens.forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(' '));
        } else {
          const word = document.createElement('span');
          word.className = 'word';
          const inner = document.createElement('span');
          inner.textContent = tok;
          word.appendChild(inner);
          frag.appendChild(word);
          frag.appendChild(document.createTextNode(' '));
        }
      });
      textNode.parentNode.replaceChild(frag, textNode);
    };

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let n; while ((n = walker.nextNode())) textNodes.push(n);
    textNodes.forEach(wrapText);

    // Stagger inner spans by index for graceful settle
    el.querySelectorAll('.word > span').forEach((span, i) => {
      span.style.transitionDelay = (i * 0.06) + 's';
    });
  };

  document.querySelectorAll('.reveal-words').forEach(splitWords);

  // Hero title — words already in inline spans, just add stagger
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    heroTitle.querySelectorAll('.line > span').forEach((span, i) => {
      span.style.transitionDelay = (i * 0.12 + 0.6) + 's';
    });
  }

  // Hero tagline — split into letters
  document.querySelectorAll('.reveal-letters').forEach((el) => {
    const text = el.dataset.text || el.textContent;
    el.textContent = '';
    [...text].forEach((c, i) => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = c === ' ' ? ' ' : c;
      span.style.transitionDelay = (i * 0.05 + 1.4) + 's';
      el.appendChild(span);
    });
  });

  /* ------------------------------------------------------------
   * 5. Hero reveal on load
   * ---------------------------------------------------------- */
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.querySelector('.hero-title')?.classList.add('is-in');
      document.querySelector('.reveal-letters')?.classList.add('is-in');
      document.querySelectorAll('.hero .fade-up').forEach((el) => {
        const delay = parseFloat(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('is-in'), delay * 1000);
      });
    }, prefersReducedMotion ? 0 : 600);
  });

  /* ------------------------------------------------------------
   * 6. Intersection-based reveal
   * ---------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseFloat(el.dataset.delay || 0) * 1000;
      setTimeout(() => el.classList.add('is-in'), delay);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll(
    '.reveal-on-scroll, .reveal-words, .swatch-reveal, .fade-up:not(.hero .fade-up)'
  ).forEach((el) => io.observe(el));

  /* ------------------------------------------------------------
   * 7. Magnetic buttons (subtle pull)
   * ---------------------------------------------------------- */
  if (!isTouch && !prefersReducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 14;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * strength;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* ------------------------------------------------------------
   * 8. Stat counters (count up slowly on enter)
   * ---------------------------------------------------------- */
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 2400;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        el.textContent = Math.round(eased * target).toString();
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target.toString();
      };
      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => counterIO.observe(el));

  /* ------------------------------------------------------------
   * 9. Breathing exercise — text changes synced to circle
   *    Cycle: 4s inhale, 4s hold, 4s exhale, 4s hold = 16s total
   * ---------------------------------------------------------- */
  const phaseEl = document.getElementById('breathPhase');
  if (phaseEl && !prefersReducedMotion) {
    const phases = ['Inspiră', 'Reține', 'Expiră', 'Reține'];
    let i = 0;
    const swap = () => {
      phaseEl.style.opacity = '0';
      setTimeout(() => {
        phaseEl.textContent = phases[i % 4];
        phaseEl.style.opacity = '1';
      }, 600);
      i++;
    };
    swap();
    setInterval(swap, 4000);
  }

  /* ------------------------------------------------------------
   * 10. Background color transitions by section
   * ---------------------------------------------------------- */
  const bgIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const bg = entry.target.dataset.bg;
      if (!bg) return;
      document.body.classList.forEach((c) => {
        if (c.startsWith('bg-')) document.body.classList.remove(c);
      });
      document.body.classList.add('bg-' + bg);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('section[data-bg]').forEach((s) => bgIO.observe(s));

  /* ------------------------------------------------------------
   * 11. Nav background + floating CTA on scroll
   * ---------------------------------------------------------- */
  const nav = document.querySelector('.nav');
  const floatingCta = document.getElementById('floatingCta');
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-floating', y > 40);
    if (floatingCta) {
      // Show after hero (~80% of viewport)
      const showAfter = window.innerHeight * 0.85;
      floatingCta.classList.toggle('is-shown', y > showAfter);
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------
   * 12. GSAP scroll-driven parallax (product image)
   * ---------------------------------------------------------- */
  if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // Sync GSAP with Lenis if present
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // Product image parallax
    gsap.utils.toArray('.parallax-image').forEach((wrap) => {
      const img = wrap.querySelector('img');
      gsap.fromTo(img,
        { yPercent: -8, scale: 1.12 },
        {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        }
      );
    });

    // Hero mark scale-down as user scrolls past it
    gsap.to('.hero-mark', {
      scale: 0.7,
      opacity: 0.5,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'center top',
        end: 'bottom top',
        scrub: 1.4,
      },
    });

    // Subtle fade for science viz
    gsap.fromTo('.science-viz',
      { opacity: 0, scale: 0.92 },
      {
        opacity: 1, scale: 1,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.science', start: 'top 60%' },
      }
    );

    // Closing mark gentle rotation
    gsap.to('.closing-mark', {
      rotation: 8,
      ease: 'none',
      scrollTrigger: {
        trigger: '.closing',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
    });
  }

  /* ------------------------------------------------------------
   * 13. Anchor links — route through Lenis for smooth scroll
   * ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 3) });
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
