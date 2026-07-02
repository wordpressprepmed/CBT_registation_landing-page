/* ==========================================================================
   PrepMed CBT Portal — Interactions & Animations
   ========================================================================== */

const gsapReady = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
if (gsapReady) {
  gsap.registerPlugin(ScrollTrigger);
} else {
  console.error('PrepMed: GSAP/ScrollTrigger failed to load from CDN — animations disabled, rest of the UI still works.');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ *
   * Scroll reveal — native IntersectionObserver, not GSAP ScrollTrigger.
   * This is the mechanism that decides whether content is visible at all,
   * so it must never depend on a third-party CDN script loading correctly.
   * ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll('.reveal');

  ['.features-grid', '.exam-grid', '.pricing-grid'].forEach((sel) => {
    document.querySelectorAll(`${sel} > .reveal`).forEach((child, i) => {
      child.style.transitionDelay = `${i * 90}ms`;
    });
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  /* ------------------------------------------------------------------ *
   * Mobile nav — works regardless of GSAP
   * ------------------------------------------------------------------ */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  /* ------------------------------------------------------------------ *
   * Portal tabs — works regardless of GSAP
   * ------------------------------------------------------------------ */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function openTab(name) {
    tabBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === name));
    tabPanels.forEach((panel) => {
      const isActive = panel.dataset.panel === name;
      panel.classList.toggle('active', isActive);
    });
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => openTab(btn.dataset.tab));
  });

  document.querySelectorAll('[data-tab-open]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openTab(el.dataset.tabOpen);
      document.getElementById('portal').scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ------------------------------------------------------------------ *
   * Category toggle (Internal ₹200 / External ₹360) — works regardless of GSAP
   * ------------------------------------------------------------------ */
  const categoryToggle = document.getElementById('categoryToggle');
  const ctLabelLeft = document.querySelector('.ct-label-left');
  const ctLabelRight = document.querySelector('.ct-label-right');
  const feeAmounts = document.querySelectorAll('.fee-amount');

  ctLabelLeft?.classList.add('active');

  categoryToggle?.addEventListener('click', () => {
    const isExternal = categoryToggle.classList.toggle('on');
    ctLabelLeft.classList.toggle('active', !isExternal);
    ctLabelRight.classList.toggle('active', isExternal);

    feeAmounts.forEach((fee) => {
      const newAmount = isExternal ? '360' : '200';
      if (gsapReady) {
        gsap.to(fee, {
          duration: 0.25,
          onStart: () => { fee.textContent = newAmount; },
          scale: 1.2,
          yoyo: true,
          repeat: 1,
        });
      } else {
        fee.textContent = newAmount;
      }
    });
  });

  /* ------------------------------------------------------------------ *
   * Toast helper — works regardless of GSAP
   * ------------------------------------------------------------------ */
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  let toastTimer;

  function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* Demo-only form submissions */
  document.querySelectorAll('form.tab-panel').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const panel = form.dataset.panel;
      const messages = {
        'internal-login': 'Demo only — internal student login is not connected to a backend yet.',
        'external-login': 'Demo only — external student login is not connected to a backend yet.',
        register: 'Demo only — account registration is not connected to a backend yet.',
      };
      showToast(messages[panel] || 'This is a UI demo — no backend connected.');
    });
  });

  /* Demo-only exam action buttons */
  document.querySelectorAll('.exam-foot .btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Demo only — "${btn.textContent.trim()}" isn't wired to a backend yet.`);
    });
  });

  document.querySelector('.result-card .btn')?.addEventListener('click', () => {
    showToast('Demo only — report download isn\'t wired to a backend yet.');
  });

  /* ------------------------------------------------------------------ *
   * Animated counters — GSAP tweens the number if available, otherwise
   * the final value is set immediately so it never gets stuck at "0".
   * ------------------------------------------------------------------ */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const render = (val) => {
      el.textContent = `${prefix}${Math.round(val).toLocaleString('en-IN')}${suffix}`;
    };

    if (!gsapReady || !('IntersectionObserver' in window)) {
      render(target);
      return;
    }

    const counter = { val: 0 };
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          gsap.to(counter, {
            val: target,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate: () => render(counter.val),
          });
          countObserver.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    countObserver.observe(el);
  });

  /* ------------------------------------------------------------------ *
   * Score ring (results section) — GSAP animates the sweep if available,
   * otherwise the final progress is set immediately (never stuck empty).
   * ------------------------------------------------------------------ */
  const scoreRing = document.querySelector('.score-ring-fg');
  if (scoreRing) {
    const radius = scoreRing.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const progress = parseFloat(scoreRing.dataset.progress) || 0;
    const finalOffset = circumference - (progress / 100) * circumference;
    scoreRing.style.strokeDasharray = circumference;
    scoreRing.style.strokeDashoffset = circumference;

    if (!gsapReady || !('IntersectionObserver' in window)) {
      scoreRing.style.strokeDashoffset = finalOffset;
    } else {
      const ringObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            gsap.to(scoreRing, { strokeDashoffset: finalOffset, duration: 1.4, ease: 'power2.out' });
            ringObserver.unobserve(scoreRing);
          });
        },
        { threshold: 0.4 }
      );
      ringObserver.observe(scoreRing);
    }
  }

  if (!gsapReady) return; // Everything below is a pure animation enhancement.

  /* ------------------------------------------------------------------ *
   * Scroll progress bar + navbar state
   * ------------------------------------------------------------------ */
  const progressBar = document.getElementById('progressBar');
  const navbar = document.getElementById('navbar');

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      progressBar.style.width = `${self.progress * 100}%`;
      navbar.classList.toggle('scrolled', self.scroll() > 40);
    },
  });

  /* ------------------------------------------------------------------ *
   * Hero title stagger — independent of the .reveal system above, since
   * these spans aren't hidden by CSS; GSAP hides+reveals them itself, so
   * they're simply static (already visible) if GSAP never runs.
   * ------------------------------------------------------------------ */
  gsap.from('.hero-title .reveal-line > span', {
    yPercent: 120,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
    delay: 0.2,
  });

  /* Floating idle animation for hero visual cards */
  gsap.to('.dashboard-card', { y: -12, duration: 3.4, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('.mini-card-1', { y: 10, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.3 });
  gsap.to('.mini-card-2', { y: -10, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.6 });

  /* ------------------------------------------------------------------ *
   * Parallax blobs — mousemove + scroll
   * ------------------------------------------------------------------ */
  const blobs = gsap.utils.toArray('.hero-blob');

  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const relX = (e.clientX - cx) / cx;
    const relY = (e.clientY - cy) / cy;

    blobs.forEach((blob) => {
      const speed = parseFloat(blob.dataset.speed) || 0.1;
      gsap.to(blob, {
        x: relX * 60 * speed * 10,
        y: relY * 60 * speed * 10,
        duration: 1.2,
        ease: 'power2.out',
      });
    });
  });

  blobs.forEach((blob) => {
    const speed = parseFloat(blob.dataset.speed) || 0.1;
    gsap.to(blob, {
      y: `+=${120 * speed}`,
      ease: 'none',
      scrollTrigger: {
        trigger: blob.closest('section'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
  });
});
