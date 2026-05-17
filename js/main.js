/* ============================================================
   main.js — Performance-first rewrite
   
   ROOT CAUSES OF LAG FIXED:
   1. Cursor: was setting left/top (layout reflow every frame)
      → now uses transform:translate() only (compositor-only, zero reflow)
   2. mix-blend-mode removed from cursor (caused layer merge every frame)
   3. Cursor ring lerp: was also setting left/top → now transform only
   4. Event delegation replaces querySelectorAll at load time
   5. All scroll handlers use { passive: true }
   6. rAF used correctly — no double-rAF nesting
   ============================================================ */

/* ─── CUSTOM CURSOR ─── */
(function () {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  // Half-sizes for centering (pixels only — no % in JS transform)
  const CURSOR_HALF = 5;   // half of 10px
  const RING_HALF   = 18;  // half of 36px

  let mx = -200, my = -200;
  let rx = -200, ry = -200;
  let rafRunning = false;

  function moveCursor(x, y) {
    cursor.style.transform = `translate(${x - CURSOR_HALF}px, ${y - CURSOR_HALF}px)`;
  }
  function moveRing(x, y) {
    ring.style.transform = `translate(${x - RING_HALF}px, ${y - RING_HALF}px)`;
  }

  // Hide off-screen initially
  moveCursor(-200, -200);
  moveRing(-200, -200);
  cursor.style.opacity = '0';
  ring.style.opacity   = '0';

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    // Dot follows instantly — no lerp, no lag
    moveCursor(mx, my);
    cursor.style.opacity = '1';
    ring.style.opacity   = '0.9';
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    ring.style.opacity   = '0';
  });

  // Ring lerp loop — only runs, never stacks
  function lerpRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    moveRing(rx, ry);
    requestAnimationFrame(lerpRing);
  }
  lerpRing();

  // Hover states
  const hoverSel = 'a, button, .skill-tag, .project-card, .filter-btn, .tool-badge, .value-card, .edu-card, .cert-card, .social-link, .contact-email, .nav-cta, .add-project-btn';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverSel)) {
      cursor.classList.add('hover');
      ring.classList.add('hover');
    }
  }, { passive: true });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverSel)) {
      cursor.classList.remove('hover');
      ring.classList.remove('hover');
    }
  }, { passive: true });
})();

/* ─── NAV SCROLL ─── */
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
})();

/* ─── ACTIVE NAV LINK ─── */
(function () {
  const parts = location.pathname.split('/').filter(Boolean);
  const page  = parts.length ? parts[parts.length - 1] : 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active');
    const hrefPage = a.getAttribute('href').split('/').pop() || 'index.html';
    if (hrefPage === page) a.classList.add('active');
  });
})();

/* ─── MOBILE NAV ─── */
(function () {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (!hamburger || !mobileNav) return;

  function openNav() {
    hamburger.classList.add('open');
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  }
  hamburger.addEventListener('click', () =>
    mobileNav.classList.contains('open') ? closeNav() : openNav()
  );
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeNav();
  });
})();

/* ─── SMOOTH SCROLL ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ─── SCROLL REVEAL ─── */
(function () {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal, .timeline-item').forEach(el => observer.observe(el));
})();

/* ─── SKILL BARS ─── */
(function () {
  const bars = document.querySelectorAll('.skill-bar-fill');
  if (!bars.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        requestAnimationFrame(() => {
          entry.target.style.transform = `scaleX(${entry.target.dataset.width})`;
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => observer.observe(b));
})();

/* ─── COUNTER ANIMATION ─── */
(function () {
  const stats = document.querySelectorAll('.stat-num');
  if (!stats.length) return;
  stats.forEach(el => { el.dataset.original = el.textContent.trim(); });
  let animated = false;

  function animateCounter(el, original) {
    const numStr    = original.replace(/[^0-9.]/g, '');
    const num       = parseFloat(numStr);
    const suffix    = original.replace(numStr, '');
    const isDecimal = numStr.includes('.');
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1800, 1);
      const v = (1 - Math.pow(1 - p, 3)) * num;
      el.textContent = (isDecimal ? v.toFixed(1) : Math.floor(v)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      stats.forEach(el => animateCounter(el, el.dataset.original));
      observer.disconnect();
    }
  }, { threshold: 0.5 });
  const container = document.querySelector('.hero-stats') || document.querySelector('.stats-row');
  if (container) observer.observe(container);
})();

/* ─── HERO PARALLAX ORBS — throttled, only on hero page ─── */
(function () {
  if (!document.getElementById('hero')) return;
  const orb1 = document.querySelector('.hero-orb-1');
  const orb2 = document.querySelector('.hero-orb-2');
  if (!orb1 && !orb2) return;
  let ticking = false;
  const maxScroll = window.innerHeight * 1.5;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y < maxScroll) {
        /* transform only — no left/top, no layout */
        if (orb1) orb1.style.transform = `translateY(${y * 0.15}px) translateZ(0)`;
        if (orb2) orb2.style.transform = `translateY(${y * -0.1}px) translateZ(0)`;
      }
      ticking = false;
    });
  }, { passive: true });
})();

/* ─── PROJECT FILTER ─── */
(function () {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards   = document.querySelectorAll('.project-card[data-category]');
  if (!buttons.length || !cards.length) return;
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category.includes(filter);
        card.style.opacity       = match ? '1' : '0.25';
        card.style.pointerEvents = match ? '' : 'none';
        if (!match) card.style.transform = 'scale(0.97)';
        else card.style.removeProperty('transform');
      });
    });
  });
})();

/* ─── CONTACT FORM (Web3Forms AJAX) ─── */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const formData = new FormData(form);
    const object = Object.fromEntries(formData.entries());
    const jsonStr = JSON.stringify(object);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: jsonStr
    })
    .then(async (response) => {
      let json = await response.json();
      if (response.status == 200) {
        btn.textContent = '✓ Message Sent!';
        btn.style.background = '#4ade80';
        form.reset();
      } else {
        console.log(response);
        btn.textContent = 'Error Sending!';
        btn.style.background = '#ff4d4d';
      }
    })
    .catch(error => {
      console.log(error);
      btn.textContent = 'Error Sending!';
      btn.style.background = '#ff4d4d';
    })
    .finally(() => {
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    });
  });
})();

/* ─── END OF MAIN.JS ─── */
