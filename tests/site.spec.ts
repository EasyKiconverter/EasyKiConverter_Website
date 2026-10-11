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
  await expect(page.locator('.content-page-header .nav-links')).toBeVisible();
  await expect(page.locator('.content-page-header a[aria-current="page"]')).toHaveText('Formats');
  await page.keyboard.press('Tab');
  await expect(page.locator('.content-page-skip')).toBeFocused();
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
  await expect(page.locator('.lab-warning')).toContainText('9.6 MB');
  await expect(page.locator('.lab-warning')).toContainText('8.1 MB');
  await expect(page.locator('.lab-warning')).toContainText('STEP/WASM');
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
