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

test('release refresh stays same-origin and keeps the static fallback path', async ({ page }) => {
  const releaseRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('latest-release.json') || request.url().includes('api.github.com/repos/EasyKiconverter/EasyKiConverter/releases/latest')) {
      releaseRequests.push(request.url());
    }
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  expect(releaseRequests).toHaveLength(1);
  expect(new URL(releaseRequests[0]).origin).toBe(new URL(page.url()).origin);
  expect(releaseRequests[0]).toContain('/data/latest-release.json');
  await expect(page.locator('[data-release-version]').first()).toHaveText('v3.1.13');
});

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

test('mobile story cards keep decorative labels clear of their copy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    const storyCards = page.locator('.story-card');
    await storyCards.first().scrollIntoViewIfNeeded();
    const bounds = await storyCards.evaluateAll((cards) => cards.map((card) => {
      const copy = card.querySelector('p')?.getBoundingClientRect();
      const decoration = card.querySelector('.story-pulse, .story-stack, .story-check')?.getBoundingClientRect();
      if (!copy || !decoration) return null;
      return {
        copyRight: copy.right,
        copyLeft: copy.left,
        copyBottom: copy.bottom,
        copyTop: copy.top,
        decorationRight: decoration.right,
        decorationLeft: decoration.left,
        decorationBottom: decoration.bottom,
        decorationTop: decoration.top,
      };
    }));
    expect(bounds).toHaveLength(3);
    bounds.forEach((bound) => {
      expect(bound).not.toBeNull();
      const horizontalGap = bound!.copyRight <= bound!.decorationLeft + 1 || bound!.decorationRight <= bound!.copyLeft + 1;
      const verticalGap = bound!.copyBottom <= bound!.decorationTop + 1 || bound!.decorationBottom <= bound!.copyTop + 1;
      expect(horizontalGap || verticalGap).toBe(true);
    });
  }
});

test('bilingual homepages do not overflow horizontally on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  }
});

test('bilingual secondary pages do not overflow horizontally on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/formats/', '/en/formats/', '/cases/', '/en/cases/', '/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  }
});

test('homepage format summary matches the capability matrix data', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const summary = page.locator('[data-format-summary]');
    await expect(summary).toContainText('KiCad');
    await expect(summary).toContainText('Altium Designer');
    await expect(summary).toContainText(/\+ 9 (个已注册目标|registered targets)/);
    await expect(summary).not.toContainText('3D');
  }
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

test('format matrix rows remain readable on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/formats/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.format-table-wrap table')).toHaveCSS('min-width', '0px');
  await expect(page.locator('.format-table-wrap tbody tr').first()).toBeVisible();
  await expect(page.locator('.format-table-wrap tbody tr').first().locator('td[data-label="版本状态"]')).toBeVisible();
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

test('inner pages share the same localized header navigation', async ({ page }) => {
  const pages = [
    { path: '/formats/', current: '格式矩阵', lab: false },
    { path: '/cases/', current: '转换案例', lab: false },
    { path: '/lab/', current: '3D 实验室', lab: true },
    { path: '/en/formats/', current: 'Formats', lab: false },
    { path: '/en/cases/', current: 'Cases', lab: false },
    { path: '/en/lab/', current: '3D Lab', lab: true },
  ];
  for (const { path, current, lab } of pages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const header = page.locator('.content-page-header');
    await expect(header.locator('.nav-links a')).toHaveCount(5);
    await expect(header.locator('.nav-links a[aria-current="page"]')).toHaveText(current);
    await expect(page.locator('.mobile-nav a')).toHaveCount(6);
    if (lab) await expect(header.locator('.brand')).toContainText('/ Lab');
    else await expect(header.locator('.brand')).not.toContainText('/ Lab');
  }
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
  for (const path of ['/formats/', '/en/formats/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const cta = page.locator('.content-page-cta');
    await expect(cta).toBeVisible();
    await expect(cta.locator('[data-release-link]')).toHaveAttribute('href', /releases/);
    await expect(cta.locator('.text-link')).toHaveAttribute('href', /^(\/|https?:)/);
    await expect(cta.locator('h2')).toBeVisible();
    await expect(cta).toContainText(/选定一个目标|CHOOSE A TARGET/);
  }
  for (const path of ['/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const cta = page.locator('.content-page-cta');
    await expect(cta).toBeVisible();
    await expect(cta.locator('[data-release-link]')).toHaveAttribute('href', /releases/);
    await expect(cta.locator('.text-link')).toHaveAttribute('href', /^(\/|https?:)/);
    await expect(cta.locator('h2')).toBeVisible();
    await expect(cta).toContainText(/下一步，验证|NEXT, VERIFY/);
  }
});

test('format matrix offers evidence and release next steps in both languages', async ({ page }) => {
  for (const path of ['/formats/', '/en/formats/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.format-matrix-actions .button-dark')).toHaveAttribute('href', /cases/);
    await expect(page.locator('.format-matrix-actions .text-link')).toHaveAttribute('href', /releases\/tag\/v3\.1\.13/);
    await expect(page.locator('.format-summary')).toContainText(/2/);
    await expect(page.locator('.format-summary')).toContainText(/9/);
    await expect(page.locator('.evidence-summary')).toContainText('v3.1.13');
    await expect(page.locator('.evidence-summary')).toContainText('11');
    await expect(page.locator('thead th').nth(2)).toHaveText(/Release status|版本状态/);
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
    await expect(page.locator('.evidence-summary')).toContainText('v3.1.13');
    await expect(page.locator('.evidence-summary')).toContainText('3');
    await expect(page.locator('.case-proof')).toHaveCount(3);
    await expect(page.locator('.case-evidence-action')).toHaveCount(6);
    await expect(page.locator('.case-evidence-action').first()).toContainText(/打开测试样本|Open fixture/);
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

test('all public pages share the bilingual footer navigation', async ({ page }) => {
  const pages = [
    { path: '/', labels: ['格式矩阵', '案例', '3D 实验室', '文档'] },
    { path: '/formats/', labels: ['格式矩阵', '案例', '3D 实验室', '文档'] },
    { path: '/cases/', labels: ['格式矩阵', '案例', '3D 实验室', '文档'] },
    { path: '/lab/', labels: ['格式矩阵', '案例', '3D 实验室', '文档'] },
    { path: '/en/', labels: ['Formats', 'Cases', '3D Lab', 'Docs'] },
    { path: '/en/formats/', labels: ['Formats', 'Cases', '3D Lab', 'Docs'] },
    { path: '/en/cases/', labels: ['Formats', 'Cases', '3D Lab', 'Docs'] },
    { path: '/en/lab/', labels: ['Formats', 'Cases', '3D Lab', 'Docs'] },
  ];
  for (const { path, labels } of pages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const footer = page.locator('.site-footer');
    await expect(footer.locator('.brand')).toBeVisible();
    await expect(footer.locator('.footer-links a')).toHaveCount(7);
    for (const label of labels) await expect(footer).toContainText(label);
    await expect(footer.locator('a[href*="EasyKiConverter/issues"]')).toHaveText('Issues');
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
  await expect(page.locator('.nav-links a').filter({ hasText: '3D 实验室' })).toHaveAttribute('href', /lab\/$/);
  await expect(page.locator('.mobile-nav a[href="https://github.com/EasyKiconverter/EasyKiConverter/tree/master/docs"]')).toHaveText('文档');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav-links a[href="#download"]')).toHaveText('Download');
  await expect(page.locator('.mobile-nav a[href="#download"]')).toHaveText('Download');
});

test('homepage platform summary mirrors the available Release assets', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const platforms = page.locator('.platform-list > div');
    await expect(platforms).toHaveCount(3);
    await expect(platforms.nth(0)).toContainText(/Windows/);
    await expect(platforms.nth(0)).toContainText(/x86_64/);
    await expect(platforms.nth(0)).toContainText(/arm64/);
    await expect(platforms.nth(0).locator('.platform-count')).toContainText(/2/);
    await expect(platforms.nth(1)).toContainText(/aarch64/);
    await expect(platforms.nth(1).locator('.platform-count')).toContainText(/3/);
    await expect(platforms.nth(2)).toContainText(/Intel/);
    await expect(platforms.nth(2)).toContainText(/Apple Silicon/);
    await expect(platforms.nth(2).locator('.platform-count')).toContainText(/2/);
  }
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

test('Chinese homepage keeps visual microcopy localized', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const homepage = page.locator('main');
  await expect(homepage.locator('.hero-product-window figcaption')).toContainText('元件库');
  await expect(homepage.locator('.hero-float-input')).toContainText('元件数据已就绪');
  await expect(homepage.locator('.hero-float-output')).toContainText('库文件输出');
  await expect(homepage.locator('.hero-float-output')).toContainText('3D 模型');
  await expect(homepage.locator('.hero-stage-tag')).toHaveText('元件数据 → EDA 库');
  await expect(homepage.locator('.story-card-a .story-index')).toHaveText('01 / 输入');
  await expect(homepage.locator('.story-card-b .story-index')).toHaveText('02 / 整理');
  await expect(homepage.locator('.story-card-c .story-index')).toHaveText('03 / 回到工作流');
  await expect(homepage.locator('.story-check')).toHaveText('✓ 已准备就绪');
  await expect(homepage).not.toContainText('Component data ready');
  await expect(homepage).not.toContainText('LIBRARY OUTPUT');
  await expect(homepage).not.toContainText('ready to use');
  await expect(homepage.locator('.download-stamp')).toContainText('开源');
  await expect(homepage.locator('.download-stamp')).toContainText('工程师而做');
  await expect(homepage.locator('.download-stamp')).not.toContainText('OPEN SOURCE');
});

test('Chinese Lab keeps its entry label localized', async ({ page }) => {
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-intro .kicker')).toHaveText('按需加载 · 实验性 3D');
  await expect(page.locator('.lab-intro')).not.toContainText('EXPERIMENTAL 3D');
  await expect(page.locator('.motion-chapter-input > span')).toHaveText('01 — 输入');
  await expect(page.locator('.motion-chapter-library > span')).toHaveText('02 — 构建元件库');
  await expect(page.locator('.motion-artifacts')).toHaveText('符号+封装+3D 模型');
  await expect(page.locator('.morph-orbit-import')).toHaveText('导入轨道 ↥');
  await expect(page.locator('.tomogram-import')).toHaveText('导入 ↥');
  await expect(page.locator('.motion-chapter-product > span')).toHaveText('03 — 真实工作台');
  await expect(page.locator('.motion-chapter-product')).not.toContainText('THE REAL WORKBENCH');
  await page.goto('/en/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-intro .kicker')).toHaveText('ON DEMAND · EXPERIMENTAL 3D');
  await expect(page.locator('.motion-chapter-input > span')).toHaveText('01 — INPUT');
  await expect(page.locator('.motion-artifacts')).toHaveText('SYMBOL+FOOTPRINT+3D MODEL');
  await expect(page.locator('.morph-orbit-import')).toHaveText('ORBIT ↥');
});

test('Chinese case summaries keep evidence terms localized', async ({ page }) => {
  await page.goto('/cases/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.case-card').nth(0)).toContainText('CAD 测试样本');
  await expect(page.locator('.case-card').nth(2)).toContainText('BOM 测试样本');
  const chineseSummaries = await page.locator('.case-card > p').allTextContents();
  expect(chineseSummaries.join(' ')).not.toContain('fixture');
  await page.goto('/en/cases/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.case-card').nth(0)).toContainText('CAD fixtures');
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
