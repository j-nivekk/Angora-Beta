/* ===========================
   Angora Landing Page — Script
   Theme switch, scroll reveal, and the interactive workflow demo.
   =========================== */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollReveal();
  initSmoothNav();
  initDemoAnimation();
});

/* ===========================
   Theme switch
   =========================== */

function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('angora-theme', next);
    } catch (e) {}
  });
}

/* ===========================
   Scroll Reveal
   =========================== */

function initScrollReveal() {
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/* ===========================
   Smooth Nav Highlight
   =========================== */

function initSmoothNav() {
  const nav = document.getElementById('nav');
  const links = nav.querySelectorAll('.nav-links a:not(.nav-cta)');
  const sections = [];

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const section = document.querySelector(href);
      if (section) sections.push({ el: section, link });
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const match = sections.find((s) => s.el === entry.target);
      if (match && entry.isIntersecting) {
        links.forEach((l) => l.classList.remove('active'));
        match.link.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  sections.forEach((s) => observer.observe(s.el));
}

/* ===========================
   Demo Animation Engine
   =========================== */

function initDemoAnimation() {
  const state = {
    running: false,
    previewCursor: document.getElementById('preview-cursor'),
    angoraCursor: document.getElementById('angora-cursor'),
    previewPath: document.querySelector('#preview-path polyline'),
    angoraPath: document.querySelector('#angora-path polyline'),
    previewHighlight: document.getElementById('preview-highlight'),
    angoraHighlight: document.getElementById('angora-highlight'),
    previewPdf: document.getElementById('preview-pdf'),
    angoraPdf: document.getElementById('angora-pdf'),
    previewTarget: document.getElementById('preview-target'),
    angoraTarget: document.getElementById('angora-target'),
    previewToolHighlight: document.getElementById('preview-tool-highlight'),
    previewToolbar: document.getElementById('preview-toolbar'),
  };

  const demoSection = document.getElementById('demo');
  const replayBtn = document.getElementById('demo-replay');

  // Reduced motion: present the end-state without animating.
  if (prefersReducedMotion) {
    renderStaticResult(state);
    if (replayBtn) replayBtn.style.display = 'none';
    return;
  }

  let hasPlayed = false;
  const demoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasPlayed && !state.running) {
        hasPlayed = true;
        setTimeout(() => runDemo(state), 500);
      }
    });
  }, { threshold: 0.3 });

  demoObserver.observe(demoSection);

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      if (!state.running) {
        resetDemo(state);
        runDemo(state);
      }
    });
  }
}

function renderStaticResult(state) {
  // Preview: highlight applied, with the tool toggled on.
  if (state.previewToolHighlight) state.previewToolHighlight.classList.add('active');
  const pRect = state.previewTarget.getBoundingClientRect();
  const pPdf = state.previewPdf.getBoundingClientRect();
  state.previewHighlight.style.left = '18px';
  state.previewHighlight.style.top = (pRect.top + pRect.height / 2 - pPdf.top - 10) + 'px';
  state.previewHighlight.style.width = (pRect.width - 28) + 'px';
  state.previewHighlight.classList.add('visible');

  const aRect = state.angoraTarget.getBoundingClientRect();
  const aPdf = state.angoraPdf.getBoundingClientRect();
  state.angoraHighlight.style.left = '18px';
  state.angoraHighlight.style.top = (aRect.top + aRect.height / 2 - aPdf.top - 10) + 'px';
  state.angoraHighlight.style.width = (aRect.width - 28) + 'px';
  state.angoraHighlight.classList.add('visible');

  const hTool = document.querySelector('[data-tool="H"]');
  if (hTool) hTool.classList.add('active');

  document.getElementById('preview-steps').textContent = '6';
  document.getElementById('preview-distance').textContent = '~480px';
  document.getElementById('angora-steps').textContent = '2';
  document.getElementById('angora-distance').textContent = '~150px';
}

function resetDemo(state) {
  state.previewCursor.classList.remove('visible');
  state.angoraCursor.classList.remove('visible');
  state.previewCursor.style.left = '';
  state.previewCursor.style.top = '';
  state.angoraCursor.style.left = '';
  state.angoraCursor.style.top = '';

  state.previewHighlight.classList.remove('visible');
  state.previewHighlight.style.left = '';
  state.previewHighlight.style.top = '';
  state.previewHighlight.style.width = '0';
  state.angoraHighlight.classList.remove('visible');
  state.angoraHighlight.style.left = '';
  state.angoraHighlight.style.top = '';
  state.angoraHighlight.style.width = '0';

  state.previewPath.setAttribute('points', '');
  state.angoraPath.setAttribute('points', '');

  state.previewToolHighlight.classList.remove('active');

  const hTool = document.querySelector('[data-tool="H"]');
  if (hTool) hTool.classList.remove('active');

  document.querySelectorAll('.kb-key').forEach((k) => k.classList.remove('pressed'));

  document.getElementById('preview-steps').textContent = '—';
  document.getElementById('preview-distance').textContent = '—';
  document.getElementById('angora-steps').textContent = '—';
  document.getElementById('angora-distance').textContent = '—';
}

async function runDemo(state) {
  state.running = true;
  resetDemo(state);

  const previewTargetRect = state.previewTarget.getBoundingClientRect();
  const previewPdfRect = state.previewPdf.getBoundingClientRect();
  const angoraTargetRect = state.angoraTarget.getBoundingClientRect();
  const angoraPdfRect = state.angoraPdf.getBoundingClientRect();

  const toolRect = state.previewToolHighlight.getBoundingClientRect();
  const toolbarY = toolRect.top + toolRect.height / 2 - previewPdfRect.top;
  const toolbarX = toolRect.left + toolRect.width / 2 - previewPdfRect.left;

  const pTargetY = previewTargetRect.top + previewTargetRect.height / 2 - previewPdfRect.top;
  const pTargetStartX = 18;
  const pTargetEndX = previewTargetRect.width - 10;

  const aTargetY = angoraTargetRect.top + angoraTargetRect.height / 2 - angoraPdfRect.top;
  const aTargetStartX = 18;
  const aTargetEndX = angoraTargetRect.width - 10;

  const previewStartX = pTargetStartX + 20;
  const previewStartY = pTargetY + 30;
  const angoraStartX = aTargetStartX + 20;
  const angoraStartY = aTargetY + 30;

  setCursorPos(state.previewCursor, previewStartX, previewStartY);
  setCursorPos(state.angoraCursor, angoraStartX, angoraStartY);
  state.previewCursor.classList.add('visible');
  state.angoraCursor.classList.add('visible');

  let previewPathPoints = [`${previewStartX},${previewStartY}`];
  let angoraPathPoints = [`${angoraStartX},${angoraStartY}`];
  let previewDist = 0;
  let angoraDist = 0;
  let previewSteps = 0;
  let angoraSteps = 0;

  const updateStats = () => {
    document.getElementById('preview-steps').textContent = previewSteps;
    document.getElementById('preview-distance').textContent = previewDist + 'px';
    document.getElementById('angora-steps').textContent = angoraSteps;
    document.getElementById('angora-distance').textContent = angoraDist + 'px';
  };

  const previewTimeline = async () => {
    previewSteps++;
    updateStats();
    const d1 = calcDist(previewStartX, previewStartY, toolbarX, toolbarY);
    previewDist += Math.round(d1);
    await animateCursor(state.previewCursor, previewStartX, previewStartY, toolbarX, toolbarY, 800, previewPathPoints, state.previewPath);
    updateStats();

    previewSteps++;
    await wait(300);
    state.previewToolHighlight.classList.add('active');
    updateStats();
    await wait(400);

    previewSteps++;
    const d2 = calcDist(toolbarX, toolbarY, pTargetStartX, pTargetY);
    previewDist += Math.round(d2);
    await animateCursor(state.previewCursor, toolbarX, toolbarY, pTargetStartX, pTargetY, 700, previewPathPoints, state.previewPath);
    updateStats();
    await wait(200);

    previewSteps++;
    const d3 = calcDist(pTargetStartX, pTargetY, pTargetEndX, pTargetY);
    previewDist += Math.round(d3);

    state.previewHighlight.style.left = pTargetStartX + 'px';
    state.previewHighlight.style.top = (pTargetY - 10) + 'px';
    state.previewHighlight.classList.add('visible');

    await animateCursorWithHighlight(
      state.previewCursor, pTargetStartX, pTargetY, pTargetEndX, pTargetY, 600,
      previewPathPoints, state.previewPath, state.previewHighlight
    );
    updateStats();
    await wait(400);

    previewSteps++;
    const d4 = calcDist(pTargetEndX, pTargetY, toolbarX, toolbarY);
    previewDist += Math.round(d4);
    await animateCursor(state.previewCursor, pTargetEndX, pTargetY, toolbarX, toolbarY, 700, previewPathPoints, state.previewPath);
    updateStats();
    await wait(500);

    previewSteps++;
    const finalY = pTargetY + 50;
    const d5 = calcDist(toolbarX, toolbarY, previewStartX + 40, finalY);
    previewDist += Math.round(d5);
    await animateCursor(state.previewCursor, toolbarX, toolbarY, previewStartX + 40, finalY, 600, previewPathPoints, state.previewPath);
    updateStats();
  };

  const angoraTimeline = async () => {
    await wait(200);

    angoraSteps++;
    const hKey = document.querySelector('.kb-key[data-key="H"]');
    const hTool = document.querySelector('[data-tool="H"]');
    hKey.classList.add('pressed');
    if (hTool) hTool.classList.add('active');
    updateStats();
    await wait(500);
    hKey.classList.remove('pressed');
    await wait(200);

    angoraSteps++;
    const d1 = calcDist(angoraStartX, angoraStartY, aTargetStartX, aTargetY);
    angoraDist += Math.round(d1);
    await animateCursor(state.angoraCursor, angoraStartX, angoraStartY, aTargetStartX, aTargetY, 300, angoraPathPoints, state.angoraPath);

    const d2 = calcDist(aTargetStartX, aTargetY, aTargetEndX, aTargetY);
    angoraDist += Math.round(d2);

    state.angoraHighlight.style.left = aTargetStartX + 'px';
    state.angoraHighlight.style.top = (aTargetY - 10) + 'px';
    state.angoraHighlight.classList.add('visible');

    await animateCursorWithHighlight(
      state.angoraCursor, aTargetStartX, aTargetY, aTargetEndX, aTargetY, 500,
      angoraPathPoints, state.angoraPath, state.angoraHighlight
    );
    updateStats();
    await wait(400);

    angoraSteps++;
    const threeKey = document.querySelector('.kb-key[data-key="3"]');
    threeKey.classList.add('pressed');
    state.angoraHighlight.style.background = 'rgba(222, 42, 18, 0.32)';
    updateStats();
    await wait(600);
    threeKey.classList.remove('pressed');
  };

  await Promise.all([previewTimeline(), angoraTimeline()]);

  state.running = false;
}

/* ===========================
   Animation Helpers
   =========================== */

function setCursorPos(el, x, y) {
  el.style.left = x + 'px';
  el.style.top = y + 'px';
}

function calcDist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateCursor(el, fromX, fromY, toX, toY, duration, pathPoints, pathEl) {
  return new Promise((resolve) => {
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      const x = fromX + (toX - fromX) * eased;
      const y = fromY + (toY - fromY) * eased;

      setCursorPos(el, x, y);

      if (progress === 1 || elapsed % 30 < 16) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        const newPoint = `${Math.round(x)},${Math.round(y)}`;
        if (lastPoint !== newPoint) {
          pathPoints.push(newPoint);
          pathEl.setAttribute('points', pathPoints.join(' '));
        }
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setCursorPos(el, toX, toY);
        const finalPoint = `${Math.round(toX)},${Math.round(toY)}`;
        if (pathPoints[pathPoints.length - 1] !== finalPoint) {
          pathPoints.push(finalPoint);
          pathEl.setAttribute('points', pathPoints.join(' '));
        }
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function animateCursorWithHighlight(el, fromX, fromY, toX, toY, duration, pathPoints, pathEl, highlightEl) {
  return new Promise((resolve) => {
    const start = performance.now();
    const startLeft = parseFloat(highlightEl.style.left) || fromX;

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      const x = fromX + (toX - fromX) * eased;
      const y = fromY + (toY - fromY) * eased;

      setCursorPos(el, x, y);

      const width = x - startLeft;
      if (width > 0) {
        highlightEl.style.width = width + 'px';
      }

      if (progress === 1 || elapsed % 30 < 16) {
        const newPoint = `${Math.round(x)},${Math.round(y)}`;
        const lastPoint = pathPoints[pathPoints.length - 1];
        if (lastPoint !== newPoint) {
          pathPoints.push(newPoint);
          pathEl.setAttribute('points', pathPoints.join(' '));
        }
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setCursorPos(el, toX, toY);
        highlightEl.style.width = (toX - startLeft) + 'px';
        const finalPoint = `${Math.round(toX)},${Math.round(toY)}`;
        if (pathPoints[pathPoints.length - 1] !== finalPoint) {
          pathPoints.push(finalPoint);
          pathEl.setAttribute('points', pathPoints.join(' '));
        }
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}
