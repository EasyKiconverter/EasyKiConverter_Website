import { latestRelease } from '../data/release';

document.documentElement.classList.add('js-ready');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const stableRelease = { tag: latestRelease.tag, url: latestRelease.url };
const releaseAssetSuffixes = {
  windows: ['windows-x86_64-installer.exe', 'windows-arm64-installer.exe'],
  linux: ['linux-x86_64.AppImage', 'linux-amd64.deb', 'linux-aarch64.AppImage'],
  macos: ['macos-arm64.dmg', 'macos-x86_64.dmg'],
} as const;
const releaseAssetCount = Object.values(releaseAssetSuffixes).reduce((count, suffixes) => count + suffixes.length, 1);
const toast = document.querySelector<HTMLElement>('.egg-toast') || (() => { const element = document.createElement('div'); element.className = 'egg-toast'; element.setAttribute('role', 'status'); element.setAttribute('aria-live', 'polite'); document.body.append(element); return element; })();
let toastTimer: number | undefined;

const applyRelease = (tag: string, url: string, assetUrls: Record<string, string> = {}) => {
  document.querySelectorAll('[data-release-version], .hero-facts span:first-child b, .download-copy strong').forEach((element) => { element.textContent = tag; });
  const links = document.querySelectorAll<HTMLAnchorElement>('[data-release-link], .download-actions .button-light');
  links.forEach((link) => {
    if (!url) return;
    link.href = url;
    if (link.firstChild) {
      const isEnglish = document.documentElement.lang === 'en';
      const label = isEnglish ? `${tag} downloads` : `${tag} 下载项`;
      link.firstChild.textContent = `${label}${link.querySelector('span') ? ' ' : ' ↗'}`;
    }
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-release-asset]').forEach((link) => { const assetUrl = assetUrls[link.dataset.releaseAsset || '']; if (assetUrl) link.href = assetUrl; });
  const schema = document.querySelector('script[type="application/ld+json"]');
  if (schema) {
    try { const data = JSON.parse(schema.textContent); data.softwareVersion = tag.replace(/^v/, ''); data.downloadUrl = url; schema.textContent = JSON.stringify(data); } catch { /* Keep the static structured-data fallback. */ }
  }
};
applyRelease(stableRelease.tag, stableRelease.url);

const showToast = (message: string) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-active');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-active'), 2600);
};

const refreshRelease = async () => {
  if (!['http:', 'https:'].includes(window.location.protocol)) return;
  let cached = null;
  try { cached = window.sessionStorage.getItem('easyki-latest-release'); } catch { /* Storage can be disabled by privacy settings. */ }
  if (cached) {
    try {
      const saved = JSON.parse(cached);
      if (saved.expires > Date.now() && saved.tag && saved.url && saved.assetUrls && Object.keys(saved.assetUrls).length === releaseAssetCount) {
        applyRelease(saved.tag, saved.url, saved.assetUrls || {});
        return;
      }
    } catch { try { window.sessionStorage.removeItem('easyki-latest-release'); } catch { /* Ignore unavailable storage. */ } }
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2800);
  try {
    const releaseDataUrl = new URL(`${import.meta.env.BASE_URL}data/latest-release.json`, window.location.origin).href;
    const response = await fetch(releaseDataUrl, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return;
    const release = await response.json();
    if (!release.tag || !release.url || !release.assetUrls || typeof release.assetUrls !== 'object') return;
    const assetUrls = release.assetUrls as Record<string, string>;
    if (Object.keys(assetUrls).length !== releaseAssetCount) return;
    applyRelease(release.tag, release.url, assetUrls);
    try { window.sessionStorage.setItem('easyki-latest-release', JSON.stringify({ tag: release.tag, url: release.url, assetUrls, expires: Date.now() + 600000 })); } catch { /* The static fallback remains available without storage. */ }
  } catch { /* The checked-in Release data remains usable when API/rate limit/network fails. */ }
  finally { window.clearTimeout(timeout); }
};
refreshRelease();

const menuButton = document.querySelector<HTMLButtonElement>('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
menuButton?.addEventListener('click', () => {
  const isOpen = mobileNav?.classList.toggle('is-open') ?? false;
  menuButton.setAttribute('aria-expanded', String(isOpen));
});
mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !mobileNav?.classList.contains('is-open')) return;
  mobileNav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.focus();
});

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}
if (window.location.hash) {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

document.querySelectorAll<HTMLElement>('.magnetic').forEach((button) => {
  button.addEventListener('pointermove', (event) => { if (motionPreference.matches) return; const box = button.getBoundingClientRect(); const x = (event.clientX - box.left - box.width / 2) * 0.1; const y = (event.clientY - box.top - box.height / 2) * 0.14; button.style.transform = `translate(${x}px,${y}px)`; });
  button.addEventListener('pointerleave', () => { button.style.transform = ''; });
});
motionPreference.addEventListener('change', ({ matches }) => {
  if (matches) document.querySelectorAll<HTMLElement>('.magnetic').forEach((button) => { button.style.transform = ''; });
});

const depthStage = document.querySelector<HTMLElement>('[data-product-stage]');
const depthRail = document.querySelector<HTMLElement>('[data-story-rail]');
if (depthStage || depthRail) {
  let pointerX = 0;
  let pointerY = 0;
  let currentX = 0;
  let currentY = 0;
  let frame = 0;
  let inViewport = !('IntersectionObserver' in window);
  let pageVisible = !document.hidden;

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const canAnimate = () => inViewport && pageVisible && !motionPreference.matches;
  const resetDepthMotion = () => {
    pointerX = 0;
    pointerY = 0;
    currentX = 0;
    currentY = 0;
    depthStage?.style.setProperty('--scene-x', '0');
    depthStage?.style.setProperty('--scene-y', '0');
  };
  const renderDepth = () => {
    frame = 0;
    if (!pageVisible || !inViewport) return;
    const stageBox = depthStage?.getBoundingClientRect();
    const progress = stageBox ? clamp((window.innerHeight * 0.72 - stageBox.top) / Math.max(1, window.innerHeight * 1.2), 0, 1) : 0;
    if (canAnimate()) {
      currentX += (pointerX - currentX) * 0.12;
      currentY += (pointerY - currentY) * 0.12;
    } else {
      resetDepthMotion();
    }
    if (depthStage) {
      depthStage.style.setProperty('--scene-x', currentX.toFixed(3));
      depthStage.style.setProperty('--scene-y', currentY.toFixed(3));
      depthStage.style.setProperty('--scene-progress', (canAnimate() ? progress : 0).toFixed(3));
    }
    if (depthRail) {
      const scene = depthRail.querySelector<HTMLElement>('[data-conversion-scene]');
      const sceneBox = scene?.getBoundingClientRect();
      const sceneIsSticky = scene && window.getComputedStyle(scene).position === 'sticky';
      const cards = [...depthRail.querySelectorAll<HTMLElement>('.story-card')];
      const sceneCenter = sceneIsSticky && sceneBox
        ? (Number.parseFloat(window.getComputedStyle(scene).top) || 0) + sceneBox.height / 2
        : window.innerHeight * 0.62;
      const phoneLayout = window.matchMedia('(max-width: 599px)').matches;
      const shortLandscape = window.matchMedia('(min-width: 600px) and (max-width: 850px) and (max-height: 500px)').matches;
      const storyAnchor = sceneBox && (phoneLayout || shortLandscape)
        ? sceneCenter + sceneBox.height / 2 + (shortLandscape ? 155 : 150)
        : sceneCenter;
      const firstCard = cards[0]?.getBoundingClientRect();
      const lastCard = cards[cards.length - 1]?.getBoundingClientRect();
      const firstCardCenter = firstCard ? firstCard.top + firstCard.height / 2 : sceneCenter;
      const lastCardCenter = lastCard ? lastCard.top + lastCard.height / 2 : firstCardCenter;
      const storyProgress = clamp(
        (storyAnchor - firstCardCenter) / Math.max(1, lastCardCenter - firstCardCenter),
        0,
        1,
      );
      depthRail.style.setProperty('--story-progress', storyProgress.toFixed(3));
      const storyPosition = storyProgress * Math.max(1, cards.length - 1);
      if (scene && cards.length) {
        scene.dataset.stage = cards[Math.round(storyPosition)]?.dataset.storyStage || 'use';
      }
      cards.forEach((card, index) => {
        const centerOffset = index - (cards.length - 1) / 2;
        const activation = clamp(1 - Math.abs(storyPosition - index) * 1.45, 0, 1);
        card.style.setProperty('--story-z', `${Math.round(activation * 20 - Math.abs(centerOffset) * 10)}px`);
        card.style.setProperty('--story-turn', `${(centerOffset * 2.4 * (1 - activation)).toFixed(2)}deg`);
        card.toggleAttribute('data-active', activation > 0.48);
      });
    }
    if (canAnimate() && (Math.abs(pointerX - currentX) > 0.002 || Math.abs(pointerY - currentY) > 0.002)) scheduleDepthFrame();
  };
  const scheduleDepthFrame = () => {
    if (!frame && pageVisible && inViewport) frame = window.requestAnimationFrame(renderDepth);
  };

  depthStage?.addEventListener('pointermove', (event) => {
    if (!canAnimate()) return;
    const box = depthStage.getBoundingClientRect();
    pointerX = clamp((event.clientX - box.left) / box.width * 2 - 1, -1, 1);
    pointerY = clamp((event.clientY - box.top) / box.height * 2 - 1, -1, 1);
    scheduleDepthFrame();
  }, { passive: true });
  depthStage?.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; scheduleDepthFrame(); }, { passive: true });
  window.addEventListener('scroll', scheduleDepthFrame, { passive: true });
  window.addEventListener('resize', scheduleDepthFrame, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleDepthFrame, { passive: true });
  window.addEventListener('orientationchange', scheduleDepthFrame, { passive: true });
  const sizeObserver = 'ResizeObserver' in window ? new ResizeObserver(scheduleDepthFrame) : null;
  [depthStage, depthRail, depthRail?.querySelector('[data-story-track]')].forEach((element) => {
    if (element) sizeObserver?.observe(element);
  });
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) scheduleDepthFrame();
    else if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
  }, { passive: true });
  const intersectingTargets = new Set<Element>();
  const viewportObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) intersectingTargets.add(entry.target);
      else intersectingTargets.delete(entry.target);
    });
    inViewport = intersectingTargets.size > 0;
    if (inViewport) scheduleDepthFrame();
    else if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: '120px 0px', threshold: 0 }) : null;
  [depthStage, depthRail?.querySelector('[data-story-track]')].forEach((element) => { if (element) viewportObserver?.observe(element); });
  motionPreference.addEventListener('change', ({ matches }) => {
    if (matches) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      resetDepthMotion();
      depthStage?.style.setProperty('--scene-progress', '0');
      depthRail?.querySelectorAll<HTMLElement>('.story-card').forEach((card) => {
        card.style.removeProperty('--story-z');
        card.style.removeProperty('--story-turn');
      });
    } else scheduleDepthFrame();
  });
  scheduleDepthFrame();
}

const conversionScene = document.querySelector<HTMLElement>('[data-conversion-scene][data-model-url]');
if (conversionScene) {
  let modelStarted = false;
  const startModel = () => {
    if (modelStarted) return;
    modelStarted = true;
    void import('./conversion-model').then(({ startConversionModel }) => startConversionModel(conversionScene));
  };
  if ('IntersectionObserver' in window) {
    const modelLoaderObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      modelLoaderObserver.disconnect();
      startModel();
    }, { rootMargin: '420px 0px' });
    modelLoaderObserver.observe(conversionScene);
  } else startModel();
}

const secretKeys = ['q', 't', '6']; let keyBuffer: string[] = [];
document.addEventListener('keydown', (event) => { const target = event.target; if (event.key.length !== 1 || (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)))) return; keyBuffer = [...keyBuffer, event.key.toLowerCase()].slice(-3); if (keyBuffer.join('') === secretKeys.join('')) { showToast('Qt 6 mode · smoothness increased'); keyBuffer = []; } });
