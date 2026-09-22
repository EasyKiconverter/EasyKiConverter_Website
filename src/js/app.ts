const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stableRelease = { tag: 'v3.1.11', url: 'https://github.com/EasyKiconverter/EasyKiConverter/releases/tag/v3.1.11' };
const toast = document.querySelector<HTMLElement>('.egg-toast') || (() => { const element = document.createElement('div'); element.className = 'egg-toast'; element.setAttribute('role', 'status'); element.setAttribute('aria-live', 'polite'); document.body.append(element); return element; })();
let toastTimer: number | undefined;

const applyRelease = (tag: string, url: string) => {
  document.querySelectorAll('[data-release-version], .hero-facts span:first-child b, .download-copy strong').forEach((element) => { element.textContent = tag; });
  const link = document.querySelector<HTMLAnchorElement>('[data-release-link], .download-actions .button-light');
  if (link && url) { link.href = url; if (link.firstChild) link.firstChild.textContent = `${document.documentElement.lang === 'en' ? 'Download' : '下载'} ${tag}${link.querySelector('span') ? ' ' : ' ↗'}`; }
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
  if (!['http:', 'https:'].includes(window.location.protocol) || ['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
  let cached = null;
  try { cached = window.sessionStorage.getItem('easyki-latest-release'); } catch { /* Storage can be disabled by privacy settings. */ }
  if (cached) {
    try {
      const saved = JSON.parse(cached);
      if (saved.expires > Date.now() && saved.tag && saved.url) {
        applyRelease(saved.tag, saved.url);
        return;
      }
    } catch { try { window.sessionStorage.removeItem('easyki-latest-release'); } catch { /* Ignore unavailable storage. */ } }
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2800);
  try {
    const response = await fetch('https://api.github.com/repos/EasyKiconverter/EasyKiConverter/releases/latest', { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
    if (!response.ok) return;
    const release = await response.json();
    if (!release.tag_name || release.prerelease || release.draft) return;
    applyRelease(release.tag_name, release.html_url || stableRelease.url);
    try { window.sessionStorage.setItem('easyki-latest-release', JSON.stringify({ tag: release.tag_name, url: release.html_url, expires: Date.now() + 600000 })); } catch { /* The static fallback remains available without storage. */ }
  } catch { /* Static v3.1.11 content remains usable when API/rate limit/network fails. */ }
  finally { window.clearTimeout(timeout); }
};
refreshRelease();

const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
menuButton?.addEventListener('click', () => {
  const isOpen = mobileNav?.classList.toggle('is-open') ?? false;
  menuButton.setAttribute('aria-expanded', String(isOpen));
});
mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

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

void import('./model-viewer').then(({ setupModel }) => setupModel());

document.querySelectorAll<HTMLElement>('.magnetic').forEach((button) => {
  if (reducedMotion) return;
  button.addEventListener('pointermove', (event) => { const box = button.getBoundingClientRect(); const x = (event.clientX - box.left - box.width / 2) * 0.1; const y = (event.clientY - box.top - box.height / 2) * 0.14; button.style.transform = `translate(${x}px,${y}px)`; });
  button.addEventListener('pointerleave', () => { button.style.transform = ''; });
});

const logo = document.querySelector<HTMLImageElement>('.brand img'); let logoClicks = 0; let logoReset: number | undefined;
logo?.addEventListener('click', (event) => { event.preventDefault(); logoClicks += 1; clearTimeout(logoReset); logoReset = window.setTimeout(() => { logoClicks = 0; }, 1100); if (logoClicks === 3) { showToast('小小的 Qt 灵魂，已被唤醒 ✦'); logoClicks = 0; } });
const secretKeys = ['q', 't', '6']; let keyBuffer: string[] = [];
document.addEventListener('keydown', (event) => { if (event.key.length !== 1) return; keyBuffer = [...keyBuffer, event.key.toLowerCase()].slice(-3); if (keyBuffer.join('') === secretKeys.join('')) { showToast('Qt 6 mode · smoothness increased'); keyBuffer = []; } });
