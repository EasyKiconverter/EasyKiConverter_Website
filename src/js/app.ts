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

const depthStage = document.querySelector<HTMLElement>('.hero-product-stage');
const depthRail = document.querySelector<HTMLElement>('[data-story-rail]');
const processStory = document.querySelector<HTMLElement>('[data-process-story]');
if ((depthStage || processStory) && !motionPreference.matches) {
  let pointerX = 0;
  let pointerY = 0;
  let currentX = 0;
  let currentY = 0;
  let frame = 0;
  let active = true;

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const renderDepth = () => {
    frame = 0;
    if (!active) return;
    const stageBox = depthStage?.getBoundingClientRect();
    const progress = stageBox ? clamp((window.innerHeight * 0.72 - stageBox.top) / Math.max(1, window.innerHeight * 1.2), 0, 1) : 0;
    currentX += (pointerX - currentX) * 0.12;
    currentY += (pointerY - currentY) * 0.12;
    if (depthStage) {
      depthStage.style.setProperty('--scene-x', currentX.toFixed(3));
      depthStage.style.setProperty('--scene-y', currentY.toFixed(3));
      depthStage.style.setProperty('--scene-progress', progress.toFixed(3));
    }
    if (depthRail) {
      depthRail.style.setProperty('--story-progress', progress.toFixed(3));
      depthRail.querySelectorAll<HTMLElement>('.story-card').forEach((card, index) => {
        const centerOffset = index - 1;
        card.style.setProperty('--story-z', `${Math.round((1 - progress) * 18 - Math.abs(centerOffset) * 15)}px`);
        card.style.setProperty('--story-turn', `${(centerOffset * (3 + progress * 4)).toFixed(2)}deg`);
      });
    }
    if (processStory) {
      const processBox = processStory.getBoundingClientRect();
      const processProgress = clamp((window.innerHeight * 0.82 - processBox.top) / Math.max(1, processBox.height + window.innerHeight * 0.24), 0, 1);
      processStory.style.setProperty('--process-progress', processProgress.toFixed(3));
      processStory.querySelectorAll<HTMLElement>('.steps > li').forEach((step, index) => {
        const activation = clamp(processProgress * 1.55 - index * 0.25, 0, 1);
        step.style.setProperty('--step-depth', `${Math.round((1 - activation) * 24)}px`);
        step.style.setProperty('--step-turn', `${((1 - activation) * (index % 2 ? -4 : 4)).toFixed(2)}deg`);
        step.toggleAttribute('data-active', activation > 0.52);
      });
    }
    if (Math.abs(pointerX - currentX) > 0.002 || Math.abs(pointerY - currentY) > 0.002) scheduleDepthFrame();
  };
  const scheduleDepthFrame = () => {
    if (!frame) frame = window.requestAnimationFrame(renderDepth);
  };

  depthStage?.addEventListener('pointermove', (event) => {
    const box = depthStage.getBoundingClientRect();
    pointerX = clamp((event.clientX - box.left) / box.width * 2 - 1, -1, 1);
    pointerY = clamp((event.clientY - box.top) / box.height * 2 - 1, -1, 1);
    scheduleDepthFrame();
  }, { passive: true });
  depthStage?.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; scheduleDepthFrame(); }, { passive: true });
  window.addEventListener('scroll', scheduleDepthFrame, { passive: true });
  document.addEventListener('visibilitychange', () => { active = !document.hidden; if (active) scheduleDepthFrame(); }, { passive: true });
  scheduleDepthFrame();
}

const secretKeys = ['q', 't', '6']; let keyBuffer: string[] = [];
document.addEventListener('keydown', (event) => { const target = event.target; if (event.key.length !== 1 || (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)))) return; keyBuffer = [...keyBuffer, event.key.toLowerCase()].slice(-3); if (keyBuffer.join('') === secretKeys.join('')) { showToast('Qt 6 mode · smoothness increased'); keyBuffer = []; } });
