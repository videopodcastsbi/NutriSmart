// NutriSmart — Landing Page Interactions

function showToast(message, type = 'success') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon =
    type === 'success'
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>`;
  t.innerHTML = `${icon}<span>${message}</span>`;
  wrap.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 250);
  }, 3200);
}

// Theme Toggle
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('ns_theme', next);
  });
}

// Year in footer
const yr = document.getElementById('year');
if (yr) yr.textContent = new Date().getFullYear();

// Scroll effects
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (nav) {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
}, { passive: true });

// Mobile navigation toggle
const navBurger = document.getElementById('nav-burger');
const navLinks = document.getElementById('nav-links');
const navBackdrop = document.getElementById('nav-backdrop');

function setMobileNav(open) {
  if (!navLinks || !navBurger) return;
  const isOpen = typeof open === 'boolean' ? open : !navLinks.classList.contains('open');
  navLinks.classList.toggle('open', isOpen);
  navBurger.classList.toggle('active', isOpen);
  navBurger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  if (navBackdrop) navBackdrop.classList.toggle('active', isOpen);
  document.body.classList.toggle('nav-menu-open', isOpen);
}

if (navBurger && navLinks) {
  navBurger.addEventListener('click', (e) => {
    e.stopPropagation();
    setMobileNav();
  });

  if (navBackdrop) {
    navBackdrop.addEventListener('click', () => setMobileNav(false));
    navBackdrop.addEventListener('touchstart', (e) => {
      e.preventDefault();
      setMobileNav(false);
    }, { passive: false });
  }

  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setMobileNav(false));
  });

  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !navBurger.contains(e.target)) {
      setMobileNav(false);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      setMobileNav(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && navLinks.classList.contains('open')) {
      setMobileNav(false);
    }
  }, { passive: true });
}

// Reveal on scroll
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach((el) => obs.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('visible'));
}

// Counter animation for stats
const counters = document.querySelectorAll('[data-count]');
if ('IntersectionObserver' in window && counters.length) {
  const cObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        cObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach((el) => cObs.observe(el));
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const duration = 1200;
  const start = performance.now();

  function step(now) {
    const p = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - p, 3);
    const current = target * ease;
    el.textContent = current.toFixed(decimals);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toFixed(decimals);
  }
  requestAnimationFrame(step);
}

// Demo account handler
async function loginDemo(btn) {
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Memuat Demo...`;
  try {
    const res = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal masuk akun demo');
    showToast('Berhasil masuk sebagai Keluarga Pratama! Mengalihkan...', 'success');
    setTimeout(() => {
      window.location.href = '/app.html';
    }, 700);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

const heroDemoBtn = document.getElementById('hero-demo');
if (heroDemoBtn) heroDemoBtn.addEventListener('click', () => loginDemo(heroDemoBtn));

const ctaDemoBtn = document.getElementById('cta-demo');
if (ctaDemoBtn) ctaDemoBtn.addEventListener('click', () => loginDemo(ctaDemoBtn));

// Check if user is already logged in
(async () => {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const { user } = await res.json();
      if (user) {
        const loginLink = document.getElementById('nav-login');
        const regLink = document.getElementById('nav-register');
        const mobLoginLink = document.getElementById('nav-mobile-login');
        const mobRegLink = document.getElementById('nav-mobile-register');
        const heroStart = document.getElementById('hero-start');
        const ctaRegister = document.getElementById('cta-register');

        if (loginLink) {
          loginLink.textContent = user.name;
          loginLink.href = '/app.html';
        }
        if (regLink) {
          regLink.textContent = 'Buka Aplikasi';
          regLink.href = '/app.html';
        }
        if (mobLoginLink) {
          mobLoginLink.textContent = user.name;
          mobLoginLink.href = '/app.html';
        }
        if (mobRegLink) {
          mobRegLink.textContent = 'Buka Aplikasi';
          mobRegLink.href = '/app.html';
        }
        if (heroStart) {
          heroStart.innerHTML = `Buka Rencana Menu <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
          heroStart.href = '/app.html';
        }
        if (ctaRegister) {
          ctaRegister.textContent = 'Buka Aplikasi';
          ctaRegister.href = '/app.html';
        }
      }
    }
  } catch {
    // ignore
  }
})();

// =========================================================================
// NutriSmart — Cinematic Opening Intro Controller & Particle / Audio Engine
// =========================================================================
function initIntroAnimation() {
  const intro = document.getElementById('intro-screen');
  if (!intro) return;

  const canvas = document.getElementById('intro-canvas');
  const bar = document.getElementById('intro-progress-bar');
  const percentEl = document.getElementById('intro-percent-text');
  const statusEl = document.getElementById('intro-status-text');
  const skipBtn = document.getElementById('intro-skip');
  const replayBtn = document.getElementById('replay-intro-btn');
  const soundToggleBtn = document.getElementById('intro-sound-toggle');
  const soundOnIcon = soundToggleBtn ? soundToggleBtn.querySelector('.sound-on-icon') : null;
  const soundOffIcon = soundToggleBtn ? soundToggleBtn.querySelector('.sound-off-icon') : null;

  // Arc quadrant elements
  const arcCarb = intro.querySelector('.arc-carb');
  const arcVeg = intro.querySelector('.arc-veg');
  const arcProt = intro.querySelector('.arc-prot');
  const arcFruit = intro.querySelector('.arc-fruit');
  const foodNodes = intro.querySelectorAll('.food-node');

  let animFrameId = null;
  let canvasFrameId = null;
  let isFinished = false;
  let audioEnabled = localStorage.getItem('ns_intro_sound') !== 'false'; // default on

  function updateSoundUI() {
    if (!soundToggleBtn) return;
    if (audioEnabled) {
      if (soundOnIcon) soundOnIcon.classList.remove('hidden');
      if (soundOffIcon) soundOffIcon.classList.add('hidden');
      soundToggleBtn.title = 'Suara Aktif (Klik untuk Mematikan)';
    } else {
      if (soundOnIcon) soundOnIcon.classList.add('hidden');
      if (soundOffIcon) soundOffIcon.classList.remove('hidden');
      soundToggleBtn.title = 'Suara Mati (Klik untuk Menyalakan)';
    }
  }
  updateSoundUI();

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audioEnabled = !audioEnabled;
      localStorage.setItem('ns_intro_sound', audioEnabled ? 'true' : 'false');
      updateSoundUI();
      if (audioEnabled) playTone(523.25, 0.4, 'triangle'); // C5 confirmation chime
    });
  }

  // -----------------------------------------------------------------------
  // 1. Web Audio API Synthesizer (Zero External Assets)
  // -----------------------------------------------------------------------
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, duration = 0.8, type = 'sine', gainVal = 0.08) {
    if (!audioEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx || ctx.state === 'suspended') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, ctx.currentTime);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainVal, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext policy safe catch
    }
  }

  function playCelestialChord() {
    if (!audioEnabled) return;
    // Pentatonic chord: E4, G4, B4, E5 (warm, inspiring health vibe)
    const notes = [329.63, 392.00, 493.88, 659.25, 987.77];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 1.4 + idx * 0.2, 'sine', 0.07);
      }, idx * 90);
    });
  }

  // -----------------------------------------------------------------------
  // 2. Interactive Bioluminescent Particle Canvas Engine
  // -----------------------------------------------------------------------
  let particles = [];
  let sparks = [];
  let mouse = { x: -1000, y: -1000, active: false };
  let canvasListenersBound = false;

  function initCanvas() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    function onResize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    // Spawn 60 bioluminescent nutrient particles
    const colors = [
      { r: 52, g: 211, b: 153 }, // Emerald
      { r: 16, g: 185, b: 129 }, // Brand green
      { r: 245, g: 158, b: 11 }, // Warm Amber
      { r: 56, g: 189, b: 248 }, // Cyan
      { r: 251, g: 113, b: 133 }  // Coral rose
    ];

    particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.6 + 1.2,
        baseAlpha: Math.random() * 0.5 + 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2
      });
    }

    function createSparkBurst(x, y) {
      playTone(659.25, 0.35, 'triangle', 0.05);
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 2.5 + 1.2,
          life: 1.0,
          decay: Math.random() * 0.035 + 0.02,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    // Bind listeners only once to prevent memory leaks on replay
    if (!canvasListenersBound) {
      window.addEventListener('resize', onResize, { passive: true });

      canvas.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
      });
      canvas.addEventListener('mouseleave', () => {
        mouse.active = false;
      });
      canvas.addEventListener('click', (e) => {
        createSparkBurst(e.clientX, e.clientY);
      });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches[0]) {
          mouse.x = e.touches[0].clientX;
          mouse.y = e.touches[0].clientY;
          mouse.active = true;
        }
      }, { passive: true });
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches[0]) {
          createSparkBurst(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      canvasListenersBound = true;
    }

    if (canvasFrameId) cancelAnimationFrame(canvasFrameId);

    function renderCanvas() {
      if (isFinished) return;
      ctx.clearRect(0, 0, width, height);

      // Render & update ambient particles
      for (let p of particles) {
        p.phase += 0.025;
        p.x += p.vx + Math.sin(p.phase) * 0.3;
        p.y += p.vy + Math.cos(p.phase) * 0.3;

        // Wrap around bounds
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Subtle attraction to mouse
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 5) {
            const force = (180 - dist) / 180 * 0.04;
            p.x += (dx / dist) * force * 15;
            p.y += (dy / dist) * force * 15;
          }
        }

        const alpha = p.baseAlpha * (0.7 + 0.3 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
        ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.8)`;
        ctx.shadowBlur = 12;
        ctx.fill();
      }

      // Render & update click sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.94;
        s.vy *= 0.94;
        s.life -= s.decay;

        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * s.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${s.life})`;
        ctx.shadowColor = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, 1)`;
        ctx.shadowBlur = 14;
        ctx.fill();
      }

      ctx.shadowBlur = 0; // reset
      canvasFrameId = requestAnimationFrame(renderCanvas);
    }

    renderCanvas();
  }

  // -----------------------------------------------------------------------
  // 3. Stage & Status Timeline
  // -----------------------------------------------------------------------
  const stages = [
    { p: 0, text: 'Menginisialisasi standar AKG Kemenkes RI...', chime: 329.63 },
    { p: 28, text: 'Menghitung porsi seimbang Isi Piringku...', chime: 392.00 },
    { p: 58, text: 'Menyusun rekomendasi karbohidrat & serat...', chime: 493.88 },
    { p: 85, text: 'Dapur NutriSmart siap dinikmati!', chime: 659.25 }
  ];

  let currentStageIndex = -1;

  function updateArcs(progress) {
    // Quadrant visual lighting threshold
    if (arcCarb) arcCarb.style.opacity = progress > 15 ? '1' : '0.35';
    if (arcVeg) arcVeg.style.opacity = progress > 38 ? '1' : '0.35';
    if (arcProt) arcProt.style.opacity = progress > 62 ? '1' : '0.35';
    if (arcFruit) arcFruit.style.opacity = progress > 84 ? '1' : '0.35';
  }

  function getStatusText(progress) {
    let current = stages[0].text;
    for (let i = 0; i < stages.length; i++) {
      if (progress >= stages[i].p) {
        current = stages[i].text;
        if (currentStageIndex !== i) {
          currentStageIndex = i;
          playTone(stages[i].chime, 0.45, 'sine', 0.06);
        }
      }
    }
    return current;
  }

  // Food nodes click/hover interaction
  foodNodes.forEach((node) => {
    node.addEventListener('mouseenter', () => {
      const q = node.dataset.quadrant;
      if (q === 'carb') playTone(329.63, 0.3);
      if (q === 'veg') playTone(392.00, 0.3);
      if (q === 'prot') playTone(493.88, 0.3);
      if (q === 'fruit') playTone(587.33, 0.3);
    });
  });

  let finishTimeout1 = null;
  let finishTimeout2 = null;

  function finishIntro() {
    if (isFinished) return;
    isFinished = true;
    sessionStorage.setItem('ns_intro_seen', 'true');
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (canvasFrameId) cancelAnimationFrame(canvasFrameId);

    if (bar) bar.style.width = '100%';
    if (percentEl) percentEl.textContent = '100%';
    if (statusEl) statusEl.textContent = 'Selamat datang di NutriSmart!';
    updateArcs(100);

    // Final arrival chord
    playCelestialChord();

    finishTimeout1 = setTimeout(() => {
      intro.classList.add('finished');
      intro.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('intro-active');

      finishTimeout2 = setTimeout(() => {
        intro.style.display = 'none';
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, 850);
    }, 280);
  }

  function startIntro() {
    if (finishTimeout1) clearTimeout(finishTimeout1);
    if (finishTimeout2) clearTimeout(finishTimeout2);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (canvasFrameId) cancelAnimationFrame(canvasFrameId);

    isFinished = false;
    currentStageIndex = -1;
    document.documentElement.classList.remove('skip-intro');
    intro.setAttribute('aria-hidden', 'false');
    intro.style.display = 'flex';
    intro.classList.remove('finished');
    document.body.classList.add('intro-active');

    // Reset progress UI
    if (bar) bar.style.width = '0%';
    if (percentEl) percentEl.textContent = '0%';
    if (statusEl) statusEl.textContent = stages[0].text;
    updateArcs(0);

    // Reflow kinetic typography & logo animations
    const chars = intro.querySelectorAll('.char');
    chars.forEach((c) => {
      c.style.animation = 'none';
      void c.offsetWidth;
      c.style.animation = '';
    });

    const emblem = intro.querySelector('.emblem-glass-card');
    if (emblem) {
      emblem.style.animation = 'none';
      void emblem.offsetWidth;
      emblem.style.animation = '';
    }

    const vein = intro.querySelector('.intro-leaf-vein');
    if (vein) {
      vein.style.animation = 'none';
      void vein.offsetWidth;
      vein.style.animation = '';
    }

    // Play subtle opening note
    playTone(261.63, 0.6, 'sine', 0.05); // C4 welcome tone

    const duration = 2400; // ms
    const startTime = performance.now();

    function tick(now) {
      if (isFinished) return;
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / duration);

      // Smooth cubic bezier easing
      const eased = ratio < 0.5
        ? 4 * ratio * ratio * ratio
        : 1 - Math.pow(-2 * ratio + 2, 3) / 2;

      const currentPercent = Math.min(100, Math.round(eased * 100));

      if (bar) bar.style.width = `${currentPercent}%`;
      if (percentEl) percentEl.textContent = `${currentPercent}%`;
      updateArcs(currentPercent);

      if (statusEl) {
        const nextText = getStatusText(currentPercent);
        if (statusEl.textContent !== nextText) {
          statusEl.textContent = nextText;
        }
      }

      if (ratio < 1) {
        animFrameId = requestAnimationFrame(tick);
      } else {
        finishIntro();
      }
    }

    animFrameId = requestAnimationFrame(tick);
  }

  // Event handlers
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      finishIntro();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !isFinished) {
      finishIntro();
    }
  });

  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      initCanvas();
      startIntro();
    });
  }

  // Check if intro has already been viewed in this session or reduced motion preferred
  const alreadySeen = sessionStorage.getItem('ns_intro_seen') === 'true';
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (alreadySeen || prefersReduced) {
    isFinished = true;
    intro.style.display = 'none';
    intro.classList.add('finished');
    intro.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('intro-active');
  } else {
    initCanvas();
    startIntro();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initIntroAnimation();
    initIsiPiringkuShowcase();
  });
} else {
  initIntroAnimation();
  initIsiPiringkuShowcase();
}

// =========================================================================
// Isi Piringku — Interactive 3D Showcase Controller
// =========================================================================
let isiPiringkuInitialized = false;

function initIsiPiringkuShowcase() {
  if (isiPiringkuInitialized) return;
  const section = document.getElementById('isi-piringku');
  if (!section) return;
  isiPiringkuInitialized = true;

  const slices = section.querySelectorAll('.piring-slice');
  const cards = section.querySelectorAll('.piring-card');
  const shuffleBtn = document.getElementById('plate-shuffle-btn');

  let activeSlice = 'pokok';
  let autoCycleTimer = null;
  let isUserInteracting = false;

  const order = ['pokok', 'sayur', 'lauk', 'buah'];

  function setActiveSlice(sliceKey, fromAuto = false) {
    if (!sliceKey) return;
    activeSlice = sliceKey;

    // Update slices on plate
    slices.forEach((s) => {
      const match = s.dataset.slice === sliceKey;
      s.classList.toggle('active', match);
    });

    // Update cards on right
    cards.forEach((c) => {
      const match = c.dataset.slice === sliceKey;
      c.classList.toggle('active', match);
      if (match && !fromAuto) {
        // Subtle scroll into view if card is out of bounds on mobile
        if (window.innerWidth <= 768) {
          c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
  }

  // Handle keyboard activation (Enter / Space) for accessibility
  function handleKeydown(e, sliceKey) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      isUserInteracting = true;
      setActiveSlice(sliceKey);
    }
  }

  // Slice click, hover & keydown
  slices.forEach((s) => {
    s.addEventListener('click', () => {
      isUserInteracting = true;
      setActiveSlice(s.dataset.slice);
    });
    s.addEventListener('mouseenter', () => {
      setActiveSlice(s.dataset.slice);
    });
    s.addEventListener('keydown', (e) => handleKeydown(e, s.dataset.slice));
  });

  // Card click, hover & keydown
  cards.forEach((c) => {
    c.addEventListener('click', () => {
      isUserInteracting = true;
      setActiveSlice(c.dataset.slice);
    });
    c.addEventListener('mouseenter', () => {
      setActiveSlice(c.dataset.slice);
    });
    c.addEventListener('keydown', (e) => handleKeydown(e, c.dataset.slice));
  });

  // Auto-cycle through quadrants every 3.8s when idle
  function startAutoCycle() {
    stopAutoCycle();
    autoCycleTimer = setInterval(() => {
      if (!isUserInteracting) {
        const nextIdx = (order.indexOf(activeSlice) + 1) % order.length;
        setActiveSlice(order[nextIdx], true);
      }
    }, 3800);
  }

  function stopAutoCycle() {
    if (autoCycleTimer) clearInterval(autoCycleTimer);
  }

  section.addEventListener('mouseenter', () => {
    isUserInteracting = true;
    stopAutoCycle();
  });

  section.addEventListener('mouseleave', () => {
    isUserInteracting = false;
    startAutoCycle();
  });

  startAutoCycle();

  // -----------------------------------------------------------------------
  // Interactive Meal Combination Shuffler
  // -----------------------------------------------------------------------
  const mealPresets = [
    {
      name: 'Menu Pasundan',
      pokok: { emoji: '🍚', icon: '🍚', desc: 'Nasi liwet wangi atau nasi putih sebagai karbohidrat utama.', chips: ['Nasi Liwet', 'Nasi Putih', 'Jagung Manis', 'Ubi Kukus'] },
      sayur: { emoji: '🥦', icon: '🥦', desc: 'Sayur asem segar berkuah asam jawa kaya mineral & antioksidan.', chips: ['Sayur Asem', 'Lalapan Timun', 'Kacang Panjang', 'Labu Siam'] },
      lauk: { emoji: '🍗', icon: '🍗', desc: 'Ayam bakar rempah & tempe bacem kaya protein nabati dan hewani.', chips: ['Ayam Bakar', 'Tempe Bacem', 'Tahu Goreng', 'Ikan Gurame'] },
      buah: { emoji: '🍌', icon: '🍌', desc: 'Pisang raja manis alami kaya kalium & melancarkan metabolisme.', chips: ['Pisang Raja', 'Jeruk Segar', 'Pepaya', 'Jambu Biji'] }
    },
    {
      name: 'Menu Nusantara Sehat',
      pokok: { emoji: '🍚', icon: '🍚', desc: 'Nasi merah organik tinggi serat lambat cerna untuk energi tahan lama.', chips: ['Nasi Merah', 'Nasi Cokelat', 'Singkong Rebus', 'Oatmeal'] },
      sayur: { emoji: '🥬', icon: '🥬', desc: 'Sayur bening bayam dan jagung manis kaya zat besi & asam folat.', chips: ['Sayur Bening Bayam', 'Jagung Pipil', 'Wortel Iris', 'Oyong'] },
      lauk: { emoji: '🐟', icon: '🐟', desc: 'Ikan nila bakar bumbu kunyit & tahu kukus rendah lemak jenuh.', chips: ['Ikan Nila', 'Ikan Kembung', 'Tahu Putih', 'Telur Rebus'] },
      buah: { emoji: '🥭', icon: '🥭', desc: 'Pepaya california manis mengandung enzim papain untuk pencernaan prima.', chips: ['Pepaya California', 'Mangga Manis', 'Semangka', 'Melon'] }
    },
    {
      name: 'Menu Tradisional Serat Tinggi',
      pokok: { emoji: '🍠', icon: '🍠', desc: 'Ubi jalar ungu & singkong kukus pengganti nasi rendah glikemik.', chips: ['Ubi Jalar Ungu', 'Singkong Kukus', 'Kentang Panggang', 'Talas'] },
      sayur: { emoji: '🥗', icon: '🥗', desc: 'Urap aneka sayuran daun singkong, tauge, dan wortel parutan kelapa.', chips: ['Urap Sayur', 'Kangkung Tumis', 'Buncis Rebus', 'Daun Katuk'] },
      lauk: { emoji: '🥚', icon: '🥚', desc: 'Telur balado & tempe mendoan hangat sumber protein lengkap terjangkau.', chips: ['Telur Balado', 'Tempe Mendoan', 'Ikan Tongkol', 'Ati Ayam'] },
      buah: { emoji: '🍊', icon: '🍊', desc: 'Jeruk pontianak kaya vitamin C 100% dari kebutuhan harian.', chips: ['Jeruk Pontianak', 'Belimbing', 'Salak', 'Nanas Madu'] }
    },
    {
      name: 'Menu Pesisir Kaya Protein',
      pokok: { emoji: '🌽', icon: '🌽', desc: 'Nasi jagung pulen tradisional sumber serat & vitamin B kompleks.', chips: ['Nasi Jagung', 'Nasi Putih Pulen', 'Ubi Madu', 'Kentang Rebus'] },
      sayur: { emoji: '🥣', icon: '🥣', desc: 'Sayur lodeh labu siam dan terong hijau gurih segar menggugah selera.', chips: ['Sayur Lodeh', 'Terong Hijau', 'Daun Melinjo', 'Kacang Panjang'] },
      lauk: { emoji: '🥩', icon: '🥩', desc: 'Empal daging empuk & rempah tempe goreng protein tinggi zat besi.', chips: ['Empal Daging', 'Ikan Kembung Goreng', 'Tahu Tempe', 'Udang'] },
      buah: { emoji: '🍉', icon: '🍉', desc: 'Semangka merah dingin menghidrasi tubuh dengan likopen tinggi.', chips: ['Semangka Merah', 'Melon Emas', 'Pisang Barangan', 'Alpukat'] }
    }
  ];

  let currentPresetIndex = 0;

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentPresetIndex = (currentPresetIndex + 1) % mealPresets.length;
      const preset = mealPresets[currentPresetIndex];

      // Update plate emojis with bounce animation
      const plateEmojis = {
        pokok: document.getElementById('plate-emoji-pokok'),
        sayur: document.getElementById('plate-emoji-sayur'),
        lauk: document.getElementById('plate-emoji-lauk'),
        buah: document.getElementById('plate-emoji-buah')
      };

      Object.entries(plateEmojis).forEach(([key, el]) => {
        if (!el) return;
        el.style.transform = 'scale(0.3) rotate(-20deg)';
        setTimeout(() => {
          el.textContent = preset[key].emoji;
          el.style.transform = 'scale(1.2) rotate(10deg)';
          setTimeout(() => {
            el.style.transform = '';
          }, 200);
        }, 120);
      });

      // Update card content (icons, desc, chips)
      order.forEach((key) => {
        const iconEl = document.getElementById(`icon-${key}`);
        const descEl = document.getElementById(`desc-${key}`);
        const chipsEl = document.getElementById(`chips-${key}`);

        if (iconEl) iconEl.textContent = preset[key].icon;
        if (descEl) descEl.textContent = preset[key].desc;
        if (chipsEl && preset[key].chips) {
          chipsEl.innerHTML = preset[key].chips
            .map((c) => `<span class="food-chip">${c}</span>`)
            .join('');
        }
      });

      // Quick toast notification
      showToast(`Contoh diubah ke: ${preset.name}!`, 'success');
    });
  }
}



