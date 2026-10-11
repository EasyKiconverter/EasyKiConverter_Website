import { expect, test } from '@playwright/test';

const pages = ['/', '/en/'];

for (const path of pages) {
  test(`${path} serves the release-backed static page`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('[data-release-version]').first()).toHaveText('v3.1.13');
    await expect(page.locator('[data-release-link]').first()).toHaveAttribute('href', /v3\.1\.13/);
    await expect(page.locator('.hero-actions [data-release-link]')).toHaveAttribute('href', /v3\.1\.13/);
    await expect(page.locator('.download-actions [data-release-link]')).toHaveAttribute('href', /v3\.1\.13/);
    await expect(page.locator('h1')).toBeVisible();

    const duplicateIds = await page.locator('[id]').evaluateAll((elements) => {
      const ids = elements.map((element) => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    expect(duplicateIds).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('mobile navigation opens, closes, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const menu = page.locator('.menu-button');
  const mobileNav = page.locator('.mobile-nav');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(mobileNav).toHaveClass(/is-open/);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
});

test('content pages keep navigation reachable on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/formats/', { waitUntil: 'networkidle' });
  const menu = page.locator('.menu-button');
  await menu.click();
  await expect(page.locator('.mobile-nav')).toHaveClass(/is-open/);
  await expect(page.locator('.mobile-nav a[aria-current="page"]')).toHaveText('Formats');
  await expect(page.locator('.content-page-skip')).toHaveAttribute('href', '#content-page-main');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
});

test('content and Lab headers keep the shared brand treatment', async ({ page }) => {
  await page.goto('/formats/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.content-page-header .brand img')).toHaveAttribute('src', /easyki-icon\.svg/);
  if (test.info().project.name === 'chromium') {
    await expect(page.locator('.content-page-header .github-link')).toBeVisible();
  } else {
    await expect(page.locator('.content-page-header .github-link')).toBeHidden();
  }
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-header .brand img')).toHaveAttribute('src', /easyki-icon\.svg/);
  await expect(page.locator('.lab-header a[aria-current="page"]')).toHaveText('3D 实验室');
  await expect(page.locator('.lab-header .github-link span')).toHaveText('↗');
  await expect(page.locator('.content-page-skip')).toHaveAttribute('href', '#lab-main');
  await expect(page.locator('.lab-warning')).toContainText('10.0 MB');
  await expect(page.locator('.lab-warning')).toContainText('8.4 MB');
  await page.goto('/en/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-header a[aria-current="page"]')).toHaveText('3D Lab');
  await expect(page.locator('.content-page-skip')).toHaveText('Skip to lab content');
});

test('Lab pages use the shared mobile navigation behavior', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const menu = page.locator('.menu-button');
    await menu.click();
    await expect(page.locator('.mobile-nav')).toHaveClass(/is-open/);
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
  }
});

test('content pages offer a bilingual next-step release CTA', async ({ page }) => {
  for (const path of ['/formats/', '/en/formats/', '/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const cta = page.locator('.content-page-cta');
    await expect(cta).toBeVisible();
    await expect(cta.locator('[data-release-link]')).toHaveAttribute('href', /releases/);
    await expect(cta.locator('.text-link')).toHaveAttribute('href', /^(\/|https?:)/);
    await expect(cta.locator('h2')).toBeVisible();
  }
});

test('format matrix offers evidence and release next steps in both languages', async ({ page }) => {
  for (const path of ['/formats/', '/en/formats/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.format-matrix-actions .button-dark')).toHaveAttribute('href', /cases/);
    await expect(page.locator('.format-matrix-actions .text-link')).toHaveAttribute('href', /releases\/tag\/v3\.1\.13/);
    await expect(page.locator('.format-legend')).toBeVisible();
    await expect(page.locator('.format-status-primary')).toHaveCount(2);
    await expect(page.locator('.format-status-registered')).toHaveCount(9);
  }
});

test('case studies expose their evidence scope and next-step paths', async ({ page }) => {
  for (const path of ['/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.case-studies-actions .button-dark')).toHaveAttribute('href', /formats/);
    await expect(page.locator('.case-studies-actions .text-link')).toHaveAttribute('href', /github\.com\/EasyKiconverter\/EasyKiConverter$/);
    await expect(page.locator('.case-proof')).toHaveCount(3);
  }
});

test('Lab pages keep the experiment connected to product navigation', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const actions = page.locator('.lab-intro-actions');
    await expect(actions).toBeVisible();
    await expect(actions.locator('.button-dark')).toHaveAttribute('href', /^(\/|https?:)/);
    await expect(actions.locator('.text-link')).toHaveAttribute('href', /formats/);
  }
});

test('Lab advanced controls explain their collapsed hierarchy', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const toggle = page.locator('[data-experiment-controls]');
    await expect(toggle).toHaveAttribute('aria-controls', 'lab-experiment-controls');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#lab-experiment-controls')).toContainText(/Topology|拓扑/);
    await toggle.click({ force: true });
    await expect(toggle).toHaveText(/ADVANCED|高级工具/);
  }
});

test('reduced motion keeps content visible without marquee animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveClass(/js-ready/);
  await expect(page.locator('.reveal').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('.marquee').first()).toHaveCSS('animation-name', 'none');
  await context.close();
});

test('the heavy 3D runtime is isolated to the Lab route', async ({ request }) => {
  for (const path of ['/lab/', '/en/lab/', '/formats/', '/en/formats/', '/cases/', '/en/cases/']) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    if (path.includes('lab')) expect(html).toContain('model-canvas');
    else if (path.includes('formats')) expect(html).toContain('format-matrix-title');
    else expect(html).toContain('case-studies-title');
  }
  for (const path of ['/', '/en/']) {
    const response = await request.get(path);
    const html = await response.text();
    expect(response.ok()).toBeTruthy();
    expect(html).not.toContain('model-viewer');
    expect(html).not.toContain('occt-import');
  }
});

test('all public pages share the paper-grain visual layer', async ({ page }) => {
  for (const path of ['/', '/en/', '/formats/', '/en/formats/', '/cases/', '/en/cases/', '/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body > .grain')).toHaveCount(1);
  }
});

test('bilingual homepages keep the same interaction rhythm', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.hero-actions .button-dark')).toHaveClass(/magnetic/);
    await expect(page.locator('.hero-actions .button-dark span')).toHaveText('↗');
    await expect(page.locator('.story-card-b')).toHaveClass(/reveal-delay-1/);
    await expect(page.locator('.story-card-c')).toHaveClass(/reveal-delay-2/);
    await expect(page.locator('.feature-card-mint')).toHaveClass(/reveal-delay-1/);
    await expect(page.locator('.feature-card-peach')).toHaveClass(/reveal-delay-2/);
    await expect(page.locator('.feature-card-yellow')).toHaveClass(/reveal-delay-1/);
    await expect(page.locator('.steps')).toHaveClass(/reveal-delay/);
    await expect(page.locator('.platform-list')).toHaveClass(/reveal-delay/);
    await expect(page.locator('.download-actions .button-light')).toHaveClass(/magnetic/);
    await expect(page.locator('.download-actions .button-light span')).toHaveText('↗');
    await expect(page.locator('.github-link span')).toHaveText('↗');
    await expect(page.locator('.scroll-cue')).toHaveAttribute('aria-label');
  }
});

test('bilingual homepages expose localized navigation destinations', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav-links a[href="#formats"]')).toHaveText('格式矩阵');
  await expect(page.locator('.nav-links a[href="lab/"]')).toHaveText('3D 实验室');
  await expect(page.locator('.mobile-nav a[href="https://github.com/EasyKiconverter/EasyKiConverter/tree/master/docs"]')).toHaveText('文档');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav-links a[href="#download"]')).toHaveText('Download');
  await expect(page.locator('.mobile-nav a[href="#download"]')).toHaveText('Download');
});

test('Chinese homepage keeps editorial labels localized', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const homepage = page.locator('main');
  await expect(homepage).not.toContainText('OPEN SOURCE · Qt 6 DESKTOP TOOL');
  await expect(homepage).not.toContainText('THE QUIET MIDDLE');
  await expect(homepage).not.toContainText('THE REAL THING');
  await expect(homepage).not.toContainText('A TOOL WITH GOOD MANNERS');
  await expect(homepage).not.toContainText('A SMALL RITUAL');
  await expect(homepage).not.toContainText('WHERE IT LIVES');
  await expect(homepage).not.toContainText('READY WHEN YOU ARE');
  await expect(homepage.locator('.kicker').filter({ hasText: '开源' })).toHaveCount(1);
  await expect(homepage.locator('.kicker').filter({ hasText: '随时可以开始' })).toHaveCount(1);
});

test('download cards show the actual Release asset architectures', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const links = page.locator('.download-links > a');
    await expect(links).toHaveCount(8);
    await expect(links.nth(0)).toContainText('x86_64 installer');
    for (const label of ['arm64 installer', 'x86_64 AppImage', 'amd64 DEB', 'aarch64 AppImage', 'Apple Silicon DMG', 'Intel DMG']) {
      await expect(links.filter({ hasText: label })).toHaveCount(1);
    }
    for (let index = 0; index < 8; index += 1) {
      await expect(links.nth(index)).toHaveAttribute('href', /v3\.1\.13/);
    }
    await expect(links.nth(7)).toContainText(/SHA256/);
  }
});

test('Lab runtime assets remain reachable from nested routes', async ({ request }) => {
  for (const asset of [
    '/assets/vendor/occt-import-js.js',
    '/assets/vendor/occt-import-js.wasm',
    '/assets/model/Easykiconverter_%E5%B1%95%E7%A4%BA%E6%A8%A1%E5%9E%8B.step',
    '/assets/model/Easykiconverter_%E5%B1%95%E7%A4%BA%E6%A8%A1%E5%9E%8B.glb',
    '/assets/model/Easykiconverter_%E5%B1%95%E7%A4%BA%E6%A8%A1%E5%9E%8B-mobile.glb',
  ]) {
    const response = await request.get(asset);
    expect(response.ok()).toBeTruthy();
  }
});

test('Lab advanced controls are collapsed until explicitly opened', async ({ page }) => {
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  const toggle = page.locator('[data-experiment-controls]');
  await expect(page.locator('[data-model-stage]')).toHaveAttribute('data-controls-ready', 'true');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.morph-horizon')).toBeHidden();
  await toggle.click({ force: true });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.morph-horizon')).toBeVisible();
});

test('Lab prefers the generated GLB delivery asset', async ({ page }) => {
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  const stage = page.locator('[data-model-stage]');
  await expect(stage).toHaveAttribute('data-model-source', 'glb', { timeout: 20000 });
  await expect(stage).toHaveAttribute('data-model-asset', test.info().project.name === 'chromium-mobile' ? 'mobile' : 'desktop');
  await expect(stage).toHaveAttribute('data-model-normals', 'provided');
  await expect(stage).not.toHaveClass(/model-fallback/);
});

test('Lab asset guidance matches the generated delivery path', async ({ page }) => {
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-warning')).toContainText('10.0 MB');
  await expect(page.locator('.lab-warning')).toContainText('8.4 MB');
  await expect(page.locator('.lab-warning')).toContainText('STEP/WASM');
});

test('reduced motion renders the Lab without a continuous animation loop', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    let frames = 0;
    const request = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => request((time) => {
      frames += 1;
      callback(time);
    });
    (window as typeof window & { __modelFrames?: () => number }).__modelFrames = () => frames;
  });
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-model-stage]')).toHaveAttribute('data-model-source', 'glb', { timeout: 20000 });
  await page.waitForTimeout(1000);
  const frames = await page.evaluate(() => (window as typeof window & { __modelFrames?: () => number }).__modelFrames?.() ?? 0);
  expect(frames).toBeLessThan(12);
  await context.close();
});

test('sitemap lists every public bilingual route', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBeTruthy();
  const sitemap = await response.text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname,
  );
  expect(paths).toEqual([
    '/',
    '/en/',
    '/formats/',
    '/en/formats/',
    '/cases/',
    '/en/cases/',
    '/lab/',
    '/en/lab/',
  ]);
});

test('all public routes expose complete social metadata', async ({ request }) => {
  for (const path of ['/', '/en/', '/formats/', '/en/formats/', '/cases/', '/en/cases/', '/lab/', '/en/lab/']) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:image"');
    expect(html).toContain('rel="icon"');
  }
});
