/* ══════════════════════════════════════════════════════════════
   HELIX — Landing Page Interactive Script
   DNA Canvas Animation · Scroll Choreography · Navigation
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     1. DNA DOUBLE HELIX — Canvas Rendering
     ───────────────────────────────────────────────────────── */
  const canvas = document.getElementById('dna-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // B-DNA geometry constants
  const RISE_PER_BP  = 3.4;       // Å per base pair (scaled)
  const TWIST_ANGLE  = (2 * Math.PI) / 10; // 36° per bp (B-DNA = 10 bp/turn)
  const HELIX_RADIUS = 80;        // pixel radius of each strand
  const NUM_PAIRS    = 28;        // visible base pairs
  const BP_SPACING   = 22;        // vertical pixel spacing between bps

  let W, H;
  let scrollProgress = 0;
  let mouseX = 0.5, mouseY = 0.5;
  let animFrame = 0;
  let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // Scroll tracking
  function updateScroll() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = docH > 0 ? window.scrollY / docH : 0;
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  // Mouse tracking for subtle parallax
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX / W;
    mouseY = e.clientY / H;
  }, { passive: true });

  // Color palette
  const TEAL      = { r: 20, g: 184, b: 166 };
  const CYAN      = { r: 34, g: 211, b: 238 };
  const WHITE_DIM = { r: 148, g: 163, b: 184 };

  function rgba(c, a) {
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  }

  function lerpColor(c1, c2, t) {
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * t),
      g: Math.round(c1.g + (c2.g - c1.g) * t),
      b: Math.round(c1.b + (c2.b - c1.b) * t)
    };
  }

  /* ─── Helix section-based choreography ─── */
  function getHelixParams(t) {
    // t = scrollProgress [0, 1]
    // Smoothly interpolate helix position, scale, rotation, opacity

    // Horizontal center bias: start right (hero), drift center, end center
    const xBias = 0.62 - t * 0.15;

    // Vertical position follows scroll
    const yCenter = H * 0.45;

    // Scale: largest at top, slightly smaller at bottom
    const scale = 1.1 - t * 0.25;

    // Extra rotation from scroll
    const scrollRotation = t * Math.PI * 4;

    // Opacity: full at hero, softer mid-page, gentle at bottom
    const opacity = Math.max(0.15, 0.55 - t * 0.2);

    // Tilt (3D perspective rotation around X axis)
    const tilt = 0.18 + t * 0.12;

    return { xBias, yCenter, scale, scrollRotation, opacity, tilt };
  }

  /* ─── Render one frame ─── */
  function drawHelix(time) {
    ctx.clearRect(0, 0, W, H);

    const params = getHelixParams(scrollProgress);
    const centerX = W * params.xBias + (mouseX - 0.5) * 30;
    const centerY = params.yCenter;
    const autoRotation = time * 0.0003; // slow idle spin
    const totalRotation = autoRotation + params.scrollRotation;

    // Collect all renderable points (for depth sorting)
    const points = [];

    for (let i = 0; i < NUM_PAIRS; i++) {
      const verticalOffset = (i - NUM_PAIRS / 2) * BP_SPACING * params.scale;
      const angle = i * TWIST_ANGLE + totalRotation;
      const r = HELIX_RADIUS * params.scale;

      // 3D projection with tilt
      const cos_a = Math.cos(angle);
      const sin_a = Math.sin(angle);
      const cos_tilt = Math.cos(params.tilt);

      // Strand A
      const ax = centerX + cos_a * r;
      const ay = centerY + verticalOffset * cos_tilt + sin_a * r * Math.sin(params.tilt);
      const az = sin_a; // depth [-1, 1]

      // Strand B (180° offset)
      const bx = centerX + Math.cos(angle + Math.PI) * r;
      const by = centerY + verticalOffset * cos_tilt + Math.sin(angle + Math.PI) * r * Math.sin(params.tilt);
      const bz = Math.sin(angle + Math.PI);

      // Depth-based opacity
      const aDepthAlpha = 0.3 + (az + 1) * 0.35;
      const bDepthAlpha = 0.3 + (bz + 1) * 0.35;

      // Highlight specific base pairs based on scroll
      const sectionIndex = Math.floor(scrollProgress * 7);
      const isHighlighted = (i % 7 === sectionIndex);

      points.push({
        type: 'bp',
        ax, ay, az, bx, by, bz,
        aDepthAlpha, bDepthAlpha,
        i, isHighlighted,
        depth: (az + bz) / 2
      });
    }

    // Sort by depth (back to front)
    points.sort((a, b) => a.depth - b.depth);

    // Draw
    for (const p of points) {
      const globalAlpha = params.opacity;

      // Base pair connecting line
      const bpAlpha = (p.isHighlighted ? 0.4 : 0.12) * globalAlpha;
      ctx.beginPath();
      ctx.moveTo(p.ax, p.ay);
      ctx.lineTo(p.bx, p.by);
      ctx.strokeStyle = p.isHighlighted ? rgba(TEAL, bpAlpha * 1.5) : rgba(WHITE_DIM, bpAlpha);
      ctx.lineWidth = p.isHighlighted ? 2 : 1;
      ctx.stroke();

      // Nucleotide dots at base pair ends
      const dotSizeA = (3 + p.aDepthAlpha * 3) * params.scale;
      const dotSizeB = (3 + p.bDepthAlpha * 3) * params.scale;

      // Strand A dot (teal)
      ctx.beginPath();
      ctx.arc(p.ax, p.ay, dotSizeA, 0, Math.PI * 2);
      ctx.fillStyle = rgba(TEAL, p.aDepthAlpha * globalAlpha);
      ctx.fill();

      // Glow for strand A
      if (p.aDepthAlpha > 0.5) {
        ctx.beginPath();
        ctx.arc(p.ax, p.ay, dotSizeA * 2.5, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.ax, p.ay, 0, p.ax, p.ay, dotSizeA * 2.5);
        grad.addColorStop(0, rgba(TEAL, 0.15 * globalAlpha));
        grad.addColorStop(1, rgba(TEAL, 0));
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Strand B dot (cyan)
      ctx.beginPath();
      ctx.arc(p.bx, p.by, dotSizeB, 0, Math.PI * 2);
      ctx.fillStyle = rgba(CYAN, p.bDepthAlpha * globalAlpha);
      ctx.fill();

      // Glow for strand B
      if (p.bDepthAlpha > 0.5) {
        ctx.beginPath();
        ctx.arc(p.bx, p.by, dotSizeB * 2.5, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.bx, p.by, 0, p.bx, p.by, dotSizeB * 2.5);
        grad.addColorStop(0, rgba(CYAN, 0.12 * globalAlpha));
        grad.addColorStop(1, rgba(CYAN, 0));
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Highlighted bp: draw small center dot
      if (p.isHighlighted) {
        const mx = (p.ax + p.bx) / 2;
        const my = (p.ay + p.by) / 2;
        ctx.beginPath();
        ctx.arc(mx, my, 2.5 * params.scale, 0, Math.PI * 2);
        ctx.fillStyle = rgba({ r: 240, g: 253, b: 250 }, 0.6 * globalAlpha);
        ctx.fill();
      }
    }

    // Draw strand backbone curves
    ctx.lineWidth = 1.5 * params.scale;
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      const color = strand === 0 ? TEAL : CYAN;
      const phaseOffset = strand * Math.PI;

      for (let i = 0; i < NUM_PAIRS; i++) {
        const verticalOffset = (i - NUM_PAIRS / 2) * BP_SPACING * params.scale;
        const angle = i * TWIST_ANGLE + totalRotation + phaseOffset;
        const r = HELIX_RADIUS * params.scale;
        const cos_tilt = Math.cos(params.tilt);

        const x = centerX + Math.cos(angle) * r;
        const y = centerY + verticalOffset * cos_tilt + Math.sin(angle) * r * Math.sin(params.tilt);
        const depth = Math.sin(angle);
        const alpha = (0.15 + (depth + 1) * 0.2) * params.opacity;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = rgba(color, 0.3 * params.opacity);
      ctx.stroke();
    }
  }

  /* ─────────────────────────────────────────────────────────
     2. FLOATING PARTICLES
     ───────────────────────────────────────────────────────── */
  const PARTICLE_COUNT = 40;
  const particles = [];

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2 - 0.1,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.05
      });
    }
  }

  initParticles();
  window.addEventListener('resize', initParticles);

  function drawParticles() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(TEAL, p.alpha * (1 - scrollProgress * 0.5));
      ctx.fill();
    }
  }

  /* ─────────────────────────────────────────────────────────
     3. ANIMATION LOOP
     ───────────────────────────────────────────────────────── */
  function animate(time) {
    if (!prefersReducedMotion) {
      drawHelix(time);
      drawParticles();
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  /* ─────────────────────────────────────────────────────────
     4. SCROLL ANIMATIONS (Intersection Observer)
     ───────────────────────────────────────────────────────── */
  const animElements = document.querySelectorAll('[data-animate]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    animElements.forEach(function (el) { observer.observe(el); });
  } else {
    // Fallback: show everything
    animElements.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ─────────────────────────────────────────────────────────
     5. HEADER SCROLL STATE
     ───────────────────────────────────────────────────────── */
  const header = document.getElementById('site-header');

  function updateHeader() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* ─────────────────────────────────────────────────────────
     6. ACTIVE NAV LINK TRACKING
     ───────────────────────────────────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveNav() {
    let current = '';
    const scrollY = window.scrollY + 100;

    sections.forEach(function (section) {
      if (section.offsetTop <= scrollY) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ─────────────────────────────────────────────────────────
     7. MOBILE NAVIGATION
     ───────────────────────────────────────────────────────── */
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileLinks  = document.querySelectorAll('.mobile-link');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', function () {
      const isOpen = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!isOpen));
      mobileDrawer.setAttribute('aria-hidden', String(isOpen));
    });

    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileDrawer.setAttribute('aria-hidden', 'true');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     8. MODAL
     ───────────────────────────────────────────────────────── */
  const modal      = document.getElementById('demo-modal');
  const modalClose = document.getElementById('modal-close');

  // All elements that link to #demo-modal
  const modalTriggers = document.querySelectorAll('a[href="#demo-modal"]');

  function openModal(e) {
    e.preventDefault();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  modalTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', openModal);
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  /* ─────────────────────────────────────────────────────────
     9. SMOOTH SCROLL FOR NAV LINKS
     ───────────────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#demo-modal') return; // handled by modal

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    });
  });

  /* ─────────────────────────────────────────────────────────
     10. PATHWAY CARD HOVER EFFECT (subtle glow follow)
     ───────────────────────────────────────────────────────── */
  document.querySelectorAll('.pathway-card, .workflow-step, .how-step').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.background =
        'radial-gradient(circle at ' + x + 'px ' + y + 'px, rgba(20,184,166,0.06) 0%, rgba(10,22,40,0.65) 70%)';
    });

    card.addEventListener('mouseleave', function () {
      card.style.background = '';
    });
  });

  /* ─────────────────────────────────────────────────────────
     11. REDUCED MOTION DETECTION
     ───────────────────────────────────────────────────────── */
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
    prefersReducedMotion = e.matches;
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, W, H);
    }
  });

})();
