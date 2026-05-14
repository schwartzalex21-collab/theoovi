/* ============================================================
   THE OOVI — Practici interactive
   Each practice = one Practice instance.
   Animation is driven by JS setting CSS transitions per phase,
   so we get exact timing per breath rhythm.
   ============================================================ */
(() => {

  class Practice {
    constructor(stage) {
      this.stage = stage;
      this.btn = stage.querySelector('.practice-toggle');
      this.btnText = stage.querySelector('.practice-toggle-text');
      this.phaseEl = stage.querySelector('[data-phase]');
      this.cycleCurEl = stage.querySelector('.practice-cycle-current');
      this.phases = JSON.parse(this.btn.dataset.phases);
      this.durations = JSON.parse(this.btn.dataset.phaseDurations);
      this.totalCycles = parseInt(this.btn.dataset.cycles, 10);
      this.shape = this.btn.dataset.shape;
      this.running = false;
      this.cycle = 0;
      this.timer = null;
      this.btn.addEventListener('click', () => this.toggle());
    }

    toggle() {
      if (this.running) this.stop();
      else this.start();
    }

    start() {
      this.running = true;
      this.cycle = 0;
      this.btnText.textContent = 'Oprește';
      this.stage.classList.add('is-running');
      this.resetVisuals();
      setTimeout(() => this.beginCycle(), 60);
    }

    stop() {
      this.running = false;
      this.btnText.textContent = 'Începe';
      this.stage.classList.remove('is-running');
      this.phaseEl.textContent = 'Începe când ești gata';
      this.cycleCurEl.textContent = '0';
      this.resetVisuals();
      clearTimeout(this.timer);
    }

    beginCycle() {
      if (!this.running) return;
      if (this.cycle >= this.totalCycles) {
        this.complete();
        return;
      }
      this.cycle++;
      this.cycleCurEl.textContent = String(this.cycle);

      // Reset things that need a full reset between cycles
      if (this.shape === 'square') this.resetTrace();
      if (this.shape === 'wave') this.resetWave();

      setTimeout(() => this.runPhase(0), 60);
    }

    runPhase(idx) {
      if (!this.running) return;
      if (idx >= this.phases.length) {
        this.beginCycle();
        return;
      }
      this.setPhase(this.phases[idx], this.durations[idx], idx);
      this.timer = setTimeout(() => this.runPhase(idx + 1), this.durations[idx]);
    }

    setPhase(text, ms, idx) {
      // Cross-fade phase text
      this.phaseEl.style.opacity = '0';
      setTimeout(() => {
        this.phaseEl.textContent = text;
        this.phaseEl.style.opacity = '1';
      }, 280);

      // Trigger the visualization
      if (this.shape === 'square')      this.animateSquare(idx, ms);
      else if (this.shape === 'lung')   this.animateLung(idx, ms);
      else if (this.shape === 'wave')   this.animateWave(idx, ms);
      else if (this.shape === 'sigh')   this.animateSigh(idx, ms);
    }

    /* ---- Box Breathing: dot traces a square, trace fills 25% per phase ---- */
    animateSquare(idx, ms) {
      const dot = this.stage.querySelector('.viz-box-dot');
      const trace = this.stage.querySelector('.viz-box-trace');
      // Box corners (viewBox 300x300, rect at 40,40 with size 220x220)
      const corners = [
        { top: '13.3%',  left: '13.3%'  }, // top-left  (40/300)
        { top: '13.3%',  left: '86.66%' }, // top-right
        { top: '86.66%', left: '86.66%' }, // bottom-right
        { top: '86.66%', left: '13.3%'  }, // bottom-left
      ];
      const next = corners[(idx + 1) % 4];
      if (dot) {
        dot.style.transition = `top ${ms}ms linear, left ${ms}ms linear`;
        dot.style.top = next.top;
        dot.style.left = next.left;
      }
      // Trace fills 25% per phase: 100 → 75 → 50 → 25 → 0
      if (trace) {
        const targetOffset = 100 - ((idx + 1) * 25);
        trace.style.transition = `stroke-dashoffset ${ms}ms linear`;
        trace.style.strokeDashoffset = String(targetOffset);
      }
    }

    /* ---- 4-7-8: circle scales asymmetrically ---- */
    animateLung(idx, ms) {
      const circle = this.stage.querySelector('.viz-lung-circle');
      if (!circle) return;
      // 0 = Inhale 4s → expand; 1 = Hold 7s → stay big; 2 = Exhale 8s → contract
      let target = 0.55;
      if (idx === 0 || idx === 1) target = 1.0;
      else if (idx === 2) target = 0.5;
      const easing = idx === 2
        ? 'cubic-bezier(0.65, 0, 0.35, 1)'   // smooth exhale
        : 'cubic-bezier(0.16, 1, 0.3, 1)';   // settle inhale
      circle.style.transition = `transform ${ms}ms ${easing}`;
      circle.style.transform = `scale(${target})`;
    }

    /* ---- Coherent: dot rides a sine wave, trace fills under it ---- */
    animateWave(idx, ms) {
      const trace = this.stage.querySelector('.viz-wave-trace');
      const dot = this.stage.querySelector('.viz-wave-dot');
      // 0 = Inhale 5s → halfway across; 1 = Exhale 5s → all the way
      const targetOffset = idx === 0 ? 50 : 0;
      const targetDist = idx === 0 ? '50%' : '100%';
      const easing = 'cubic-bezier(0.42, 0, 0.58, 1)';
      if (trace) {
        trace.style.transition = `stroke-dashoffset ${ms}ms ${easing}`;
        trace.style.strokeDashoffset = String(targetOffset);
      }
      if (dot) {
        dot.style.transition = `offset-distance ${ms}ms ${easing}`;
        dot.style.offsetDistance = targetDist;
      }
    }

    /* ---- Sigh: bubble does small puff → big puff → long release ---- */
    animateSigh(idx, ms) {
      const bubble = this.stage.querySelector('.viz-sigh-bubble');
      if (!bubble) return;
      let target = 0.4;
      if (idx === 0) target = 0.62;       // small inhale
      else if (idx === 1) target = 1.0;   // big inhale
      else if (idx === 2) target = 0.35;  // long exhale
      const easing = idx === 2
        ? 'cubic-bezier(0.65, 0, 0.35, 1)'
        : 'cubic-bezier(0.34, 1.05, 0.4, 1)'; // tiny pop on inhales
      bubble.style.transition = `transform ${ms}ms ${easing}`;
      bubble.style.transform = `scale(${target})`;
    }

    /* ---- Resets ---- */
    resetTrace() {
      const trace = this.stage.querySelector('.viz-box-trace');
      const dot = this.stage.querySelector('.viz-box-dot');
      if (trace) {
        trace.style.transition = 'none';
        trace.style.strokeDashoffset = '100';
      }
      if (dot) {
        dot.style.transition = 'none';
        dot.style.top = '13.3%';
        dot.style.left = '13.3%';
      }
    }
    resetWave() {
      const trace = this.stage.querySelector('.viz-wave-trace');
      const dot = this.stage.querySelector('.viz-wave-dot');
      if (trace) {
        trace.style.transition = 'none';
        trace.style.strokeDashoffset = '100';
      }
      if (dot) {
        dot.style.transition = 'none';
        dot.style.offsetDistance = '0%';
      }
    }
    resetVisuals() {
      if (this.shape === 'square')      this.resetTrace();
      else if (this.shape === 'wave')   this.resetWave();
      else if (this.shape === 'lung') {
        const c = this.stage.querySelector('.viz-lung-circle');
        if (c) { c.style.transition = 'none'; c.style.transform = 'scale(0.55)'; }
      } else if (this.shape === 'sigh') {
        const b = this.stage.querySelector('.viz-sigh-bubble');
        if (b) { b.style.transition = 'none'; b.style.transform = 'scale(0.4)'; }
      }
    }

    complete() {
      this.running = false;
      this.btnText.textContent = 'Începe';
      this.stage.classList.remove('is-running');
      this.phaseEl.textContent = 'Gata';
      document.getElementById('practiceDone')?.classList.add('is-shown');
    }
  }

  /* ---- Initialize all practice stages ---- */
  const practices = new Map();
  document.querySelectorAll('.practice-stage').forEach((stage) => {
    practices.set(stage.dataset.stage, new Practice(stage));
  });

  /* ---- Picker: switch stages ---- */
  const switchToPractice = (practiceName) => {
    // Stop any running
    practices.forEach((p) => { if (p.running) p.stop(); });
    // Hide done overlay
    document.getElementById('practiceDone')?.classList.remove('is-shown');
    // Toggle cards
    document.querySelectorAll('.practice-card').forEach((c) => {
      c.classList.toggle('is-active', c.dataset.practice === practiceName);
    });
    // Toggle stages + body bg
    document.querySelectorAll('.practice-stage').forEach((s) => {
      const active = s.dataset.stage === practiceName;
      s.classList.toggle('is-active', active);
      if (active && s.dataset.bg) {
        document.body.classList.forEach((c) => {
          if (c.startsWith('bg-')) document.body.classList.remove(c);
        });
        document.body.classList.add('bg-' + s.dataset.bg);
      }
    });
  };

  document.querySelectorAll('.practice-card').forEach((card) => {
    card.addEventListener('click', () => {
      switchToPractice(card.dataset.practice);
      // Scroll to player
      const player = document.getElementById('player');
      if (player) player.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---- Done overlay ---- */
  document.getElementById('practiceAnother')?.addEventListener('click', () => {
    document.getElementById('practiceDone').classList.remove('is-shown');
    document.querySelector('.practici-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---- Apply initial body bg from default active stage ---- */
  const defaultStage = document.querySelector('.practice-stage.is-active');
  if (defaultStage && defaultStage.dataset.bg) {
    document.body.classList.forEach((c) => {
      if (c.startsWith('bg-')) document.body.classList.remove(c);
    });
    document.body.classList.add('bg-' + defaultStage.dataset.bg);
  }

})();
