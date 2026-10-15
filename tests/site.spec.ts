import { expect, test } from '@playwright/test';

const pages = ['/', '/en/'];

test('bilingual homepages render one localized document title', async ({ page }) => {
  for (const path of pages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('head title')).toHaveCount(1);
    const expectedTitle = path === '/' ? 'EasyKiConverter · 让元件库转换顺手一点' : 'EasyKiConverter · Make parts EDA-ready';
    await expect(page).toHaveTitle(expectedTitle);
  }
});

for (const path of pages) {
  test(`${path} serves the release-backed static page`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('[data-release-version]').first()).toHaveText('v3.1.13');
    await expect(page.locator('[data-release-link]').first()).toHaveAttribute('href', /v3\.1\.13/);
    await expect(page.locator('.hero-actions [data-release-link]')).toHaveAttribute('href', /v3\.1\.13/);
    await expect(page.locator('.download-actions [data-release-link]')).toHaveAttribute('href', /v3\.1\.13/);
    await expect(page.locator('.hero-actions [data-release-link]')).toContainText(/v3\.1\.13 下载项|v3\.1\.13 downloads/);
    await expect(page.locator('.download-actions [data-release-link]')).toContainText(/v3\.1\.13 下载项|v3\.1\.13 downloads/);
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

test('homepage release CTA stays on one line at 320px in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  for (const path of pages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const link = page.locator('.hero-actions [data-release-link]');
    const labelLines = await link.evaluate((element) => {
      const range = document.createRange();
      range.selectNode(element.firstChild!);
      return range.getClientRects().length;
    });
    expect(labelLines, `${path} release CTA line count`).toBe(1);
  }
});

test('bilingual product screenshots use one public asset and disclose the hidden local path', async ({ page }) => {
  for (const [path, disclosure] of [
    ['/', '本机输出路径已隐藏'],
    ['/en/', 'Local output path hidden'],
  ]) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const heroImage = page.locator('.hero-product-window img');
    const showcaseImage = page.locator('.app-window > img');
    const source = await heroImage.getAttribute('src');
    expect(source).toContain('easykiconverter-main-public.webp');
    await expect(showcaseImage).toHaveAttribute('src', source ?? '');
    await expect(heroImage).toHaveAttribute('alt', new RegExp(disclosure));
    await expect(page.locator('.app-window .showcase-source')).toContainText(disclosure);
    for (const image of [heroImage, showcaseImage]) {
      const dimensions = await image.evaluate((element) => {
        const image = element as HTMLImageElement;
        return { width: image.naturalWidth, height: image.naturalHeight };
      });
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    }
  }
});

test('all social previews use the sanitized product screenshot', async ({ page }) => {
  for (const path of ['/', '/en/', '/lab/', '/en/lab/', '/formats/', '/en/formats/', '/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /easykiconverter-main-public\.webp/);
    if (path.includes('/lab/')) {
      await expect(page.locator('.motion-app-window img')).toHaveAttribute('src', /easykiconverter-main-public\.webp/);
      await expect(page.locator('.motion-app-window figcaption')).toContainText(/LOCAL PATH HIDDEN|本机路径已隐藏/);
    }
  }
});

test('bilingual footers keep each navigation entry readable on one line', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of ['/', '/en/', '/formats/', '/en/formats/', '/cases/', '/en/cases/', '/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    const links = await page.locator('.site-footer .footer-links a').evaluateAll((elements) => elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      return { height: bounds.height, lineHeight: Number.parseFloat(styles.lineHeight) };
    }));
    expect(links).toHaveLength(7);
    links.forEach(({ height, lineHeight }) => expect(height).toBeLessThanOrEqual(lineHeight + 1));
  }
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

test('homepage skip links are localized and move keyboard focus to main content', async ({ page }) => {
  for (const [path, label] of [['/', '跳转到正文'], ['/en/', 'Skip to content']]) {
    await page.goto(path, { waitUntil: 'networkidle' });
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveText(label);
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#top')).toBeFocused();
    await expect(page).toHaveURL(/#top$/);
  }
});

test('content-page skip links move keyboard focus into the main content', async ({ page }) => {
  for (const path of ['/formats/', '/en/formats/', '/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const skipLink = page.locator('.content-page-skip');
    const main = page.locator('main#content-page-main');
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(main).toBeFocused();
    await expect(page).toHaveURL(/#content-page-main$/);
  }
});

test('Lab skip links are localized and move keyboard focus to the main content', async ({ page }) => {
  for (const [path, label] of [['/lab/', '跳转到实验室正文'], ['/en/lab/', 'Skip to lab content']]) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const skipLink = page.locator('.content-page-skip');
    const main = page.locator('main#lab-main');
    await expect(skipLink).toHaveText(label);
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(main).toBeFocused();
    await expect(page).toHaveURL(/#lab-main$/);
  }
});

test('mobile story cards keep decorative labels clear of their copy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
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

test('mobile homepage keeps the Hero product proof readable', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium-mobile', 'Mobile-specific visual contract');
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const image = page.locator('.hero-product-window img');
    await expect(image).toHaveCSS('object-fit', 'cover');
    await expect(image).toHaveCSS('object-position', '50% 0%');
    const box = await image.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(220);
  }
});

test('Chinese mobile hero keeps the conversion phrase together', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium-mobile', 'Mobile-specific visual contract');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const phrase = page.locator('.hero-title-conversion');
  const lineCount = await phrase.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getClientRects().length;
  });

  expect(lineCount).toBe(1);
  const titleHeight = await page.locator('#hero-title').evaluate((element) => element.getBoundingClientRect().height);
  expect(titleHeight).toBeLessThan(125);
});

test('English mobile hero keeps a compact promise and brings product proof higher', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium-mobile', 'Mobile-specific visual contract');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/', { waitUntil: 'domcontentloaded' });

  const title = page.locator('#hero-title');
  await expect(title).toHaveText('Make parts EDA-ready.');
  expect(await title.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(110);
  const ledeHeight = await page.locator('.hero-lede').evaluate((element) => element.getBoundingClientRect().height);
  const productImageTop = await page
    .locator('.hero-product-window img')
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(ledeHeight).toBeLessThan(60);
  expect(productImageTop).toBeLessThan(600);
});

test('bilingual mobile hero keeps its facts compact and product proof in view', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium-mobile', 'Mobile-specific visual contract');
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const factTops = await page.locator('.hero-facts span').evaluateAll((facts) =>
      facts.map((fact) => fact.getBoundingClientRect().top),
    );
    expect(factTops).toHaveLength(3);
    expect(Math.max(...factTops) - Math.min(...factTops)).toBeLessThan(2);

    const visibleProductHeight = await page.locator('.hero-product-window img').evaluate((image) => {
      const bounds = image.getBoundingClientRect();
      return Math.max(0, Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0));
    });
    expect(visibleProductHeight).toBeGreaterThanOrEqual(180);
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

test('homepage format summary explains version-scoped support', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#formats')).toContainText('其他目标格式的具体支持范围');
  await expect(page.locator('#formats')).not.toContainText('主项目还注册了');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#formats')).toContainText('confirm current support');
  await expect(page.locator('#formats')).not.toContainText('the main project also registers');
});

test('Chinese pages keep release guidance localized', async ({ page }) => {
  for (const path of ['/', '/formats/', '/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).not.toContainText('Release');
  }
  await page.goto('/formats/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.format-matrix-actions .text-link')).toHaveText(/当前发布/);
  await expect(page.locator('.format-legend-registered')).toHaveText(/按发布版本验证/);
});

test('homepage format and case actions have a clear primary hierarchy', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const actions = page.locator('#formats .feature-links');
    await expect(actions).toHaveCount(1);
    await expect(actions.locator('.feature-link-primary')).toHaveAttribute('href', /formats\/$/);
    await expect(actions.locator('.feature-link-secondary')).toHaveAttribute('href', /cases\/$/);
  }
});

test('homepage workbench evidence offers bilingual next steps', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const chineseActions = page.locator('.showcase-actions');
  await expect(chineseActions).toContainText('先从真实界面确认工作方式');
  await expect(chineseActions).toContainText('查看转换案例');
  await expect(chineseActions).toContainText('打开 3D 实验室');
  await expect(chineseActions.locator('a[href="cases/"]')).toHaveClass(/showcase-action-primary/);

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  const englishActions = page.locator('.showcase-actions');
  await expect(englishActions).toContainText('Start from the real interface');
  await expect(englishActions).toContainText('View conversion cases');
  await expect(englishActions).toContainText('Open the 3D Lab');
  await expect(englishActions.locator('a[href="cases/"]')).toHaveClass(/showcase-action-primary/);
});

test('bilingual internal actions use the in-site arrow treatment', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    for (const href of ['formats/', 'cases/']) {
      const link = page.locator(`a[href="${href}"]`).filter({ has: page.locator('span') }).first();
      await expect(link.locator('span')).toHaveText('→');
    }
    await expect(page.locator('.showcase-actions a[href="cases/"] span')).toHaveText('→');
  }

  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.lab-intro-actions a').filter({ hasText: /格式矩阵|format matrix/ }).locator('span')).toHaveText('→');
  }
});

test('bilingual hero story links keep the animated downward cue', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const link = page.locator('.hero-actions a[href="#story"]');
    await expect(link).toHaveClass(/text-link-down/);
    await expect(link.locator('span')).toHaveText('↓');
  }
});

test('text-link hover directions match their navigation semantics', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.showcase-actions .text-link-internal')).toHaveClass(/text-link-internal/);
  await expect(page.locator('.workflow-copy .text-link-external')).toHaveClass(/text-link-external/);
  await expect(page.locator('.platform-intro-link')).toHaveClass(/text-link-down/);

  await page.goto('/formats/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.format-matrix-actions .text-link')).toHaveClass(/text-link-external/);
  await page.locator('.format-matrix-actions .text-link').hover();
  const externalTransform = await page.locator('.format-matrix-actions .text-link span').evaluate((element) => getComputedStyle(element).transform);
  expect(externalTransform).not.toBe('none');

  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-intro-actions .text-link-internal')).toHaveCount(2);
});

test('homepage feature actions keep internal-arrow motion horizontal', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.showcase-actions .showcase-action-internal')).toHaveClass(/showcase-action-internal/);
    await expect(page.locator('.feature-link-internal')).toHaveCount(2);
  }
});

test('bilingual download cards mark the all-releases exit as external', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const link = page.locator('.download-link-external');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link.locator('span')).toHaveText('↗');
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

test('bilingual case pages explain the evidence-reading order', async ({ page }) => {
  for (const [path, steps] of [['/cases/', ['选定路径', '核对输入依据', '复核测试']], ['/en/cases/', ['Choose a route', 'Inspect the input', 'Review the test']]] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const guide = page.locator('.case-reading-guide');
    await expect(guide.locator('li')).toHaveCount(3);
    for (const step of steps) await expect(guide).toContainText(step);
  }
});

test('bilingual workflow quick-start links use the shared external-arrow treatment', async ({ page }) => {
  for (const [path, label] of [['/', '阅读快速入门'], ['/en/', 'Read the quick start']] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const link = page.locator('.workflow-copy .text-link');
    await expect(link).toContainText(label);
    await expect(link.locator('span')).toHaveText('↗');
    await expect(link).toHaveAttribute('target', '_blank');
  }
});

test('bilingual workflow actions pair in-site cases with the external quick start', async ({ page }) => {
  for (const [path, label] of [['/', '查看真实转换案例'], ['/en/', 'View conversion cases']] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const actions = page.locator('.workflow-actions');
    await expect(actions.locator('a[href="cases/"]')).toContainText(label);
    await expect(actions.locator('.text-link-external')).toHaveAttribute('target', '_blank');
    await expect(actions.locator('.text-link-external span')).toHaveText('↗');
  }
});

test('desktop Chinese case title avoids an orphan line', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/cases/', { waitUntil: 'domcontentloaded' });
  const title = page.locator('#case-studies-title');
  const box = await title.boundingBox();
  const lineHeight = await title.evaluate((element) => Number.parseFloat(getComputedStyle(element).lineHeight));
  expect(box).not.toBeNull();
  expect(box!.height).toBeLessThan(lineHeight * 1.4);
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
    if (lab) await expect(header.locator('.brand')).toContainText(path.startsWith('/en/') ? '/ Lab' : '/ 实验室');
    else await expect(header.locator('.brand')).not.toContainText('/ Lab');
  }
});

test('internal navigation stays on the current preview origin', async ({ page }) => {
  for (const path of ['/formats/', '/cases/', '/lab/', '/en/formats/', '/en/cases/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const links = await page.locator('.site-header .nav-links a').evaluateAll((anchors) =>
      anchors.map((anchor) => new URL(anchor.href)),
    );
    expect(links.every((link) => link.origin === new URL(page.url()).origin)).toBe(true);
    expect(links.map((link) => link.pathname)).toContain(path);
  }
});

test('site chrome and product images load assets from the current preview origin', async ({ page }) => {
  for (const path of ['/', '/en/', '/formats/', '/en/formats/', '/cases/', '/en/cases/', '/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const externalAssets = await page.locator('img[src], link[rel="icon"]').evaluateAll((elements) =>
      elements.map((element) => {
        const asset = element.getAttribute('src') || element.getAttribute('href');
        return asset ? new URL(asset, location.href).href : '';
      }).filter((url) => url && new URL(url).origin !== location.origin),
    );
    expect(externalAssets, `${path} should not fetch local site assets from the production domain`).toEqual([]);
  }
});

test('inner mobile navigation marks the current page in both languages', async ({ page }) => {
  const pages = [
    { path: '/formats/', current: '格式矩阵' },
    { path: '/cases/', current: '转换案例' },
    { path: '/lab/', current: '3D 实验室' },
    { path: '/en/formats/', current: 'Formats' },
    { path: '/en/cases/', current: 'Cases' },
    { path: '/en/lab/', current: '3D Lab' },
  ];
  for (const { path, current } of pages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const currentLink = page.locator('.mobile-nav a[aria-current="page"]');
    await expect(currentLink).toHaveText(current);
    await expect(currentLink).toHaveCSS('font-weight', '800');
    await expect(currentLink).toHaveCSS('background-color', 'rgb(217, 210, 255)');
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
    await expect(cta.locator('[data-release-link]')).toHaveClass(/button-light/);
    const colors = await cta.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      buttonBackground: getComputedStyle(element.querySelector('[data-release-link]') as HTMLElement).backgroundColor,
    }));
    expect(colors.buttonBackground).not.toBe(colors.background);
    await expect(cta.locator('.text-link')).toHaveAttribute('href', /^(\/|https?:)/);
    await expect(cta.locator('h2')).toBeVisible();
    await expect(cta).toContainText(/选定一个目标|CHOOSE A TARGET/);
  }
  for (const path of ['/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const cta = page.locator('.content-page-cta');
    await expect(cta).toBeVisible();
    await expect(cta.locator('[data-release-link]')).toHaveAttribute('href', /releases/);
    await expect(cta.locator('[data-release-link]')).toHaveClass(/button-light/);
    const colors = await cta.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      buttonBackground: getComputedStyle(element.querySelector('[data-release-link]') as HTMLElement).backgroundColor,
    }));
    expect(colors.buttonBackground).not.toBe(colors.background);
    await expect(cta.locator('.text-link')).toHaveAttribute('href', /^(\/|https?:)/);
    await expect(cta.locator('h2')).toBeVisible();
    await expect(cta).toContainText(/下一步，验证|NEXT, VERIFY/);
  }
});

test('mobile content CTAs keep the title and primary action readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/formats/', '/en/formats/', '/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const cta = page.locator('.content-page-cta');
    await cta.scrollIntoViewIfNeeded();
    const layout = await cta.evaluate((element) => {
      const title = element.querySelector('h2')?.getBoundingClientRect();
      const button = element.querySelector('[data-release-link]')?.getBoundingClientRect();
      return {
        titleBottom: title?.bottom ?? 0,
        buttonTop: button?.top ?? 0,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    expect(layout.buttonTop).toBeGreaterThan(layout.titleBottom);
    expect(layout.overflow).toBeFalsy();
  }
});

test('format matrix offers evidence and release next steps in both languages', async ({ page }) => {
  for (const path of ['/formats/', '/en/formats/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const casesLink = page.locator('.format-matrix-actions .button-dark');
    const releaseLink = page.locator('.format-matrix-actions .text-link');
    await expect(casesLink).toHaveAttribute('href', /cases/);
    await expect(casesLink).toContainText(/查看测试案例|Test cases/);
    await expect(releaseLink).toHaveAttribute('href', /releases\/tag\/v3\.1\.13/);
    await expect(releaseLink).toContainText(/当前发布|Latest Release/);
    const summary = page.locator('.format-matrix .evidence-summary');
    await expect(summary).toContainText('v3.1.13');
    await expect(summary).toContainText(/2/);
    await expect(summary).toContainText(/9/);
    await expect(page.locator('.format-summary')).toHaveCount(0);
    await expect(page.locator('thead th').nth(2)).toHaveText(/Release status|版本状态/);
    await expect(page.locator('.format-legend')).toBeVisible();
    await expect(page.locator('.format-status-primary')).toHaveCount(2);
    await expect(page.locator('.format-status-registered')).toHaveCount(9);
    await expect(page.locator('.format-artifacts-cell')).toHaveCount(11);
    await expect(page.locator('.format-artifacts-cell a')).toHaveCount(11);
  }
});

test('bilingual evidence-page actions stay compact and wrap only when needed', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [path, selector] of [
      ['/formats/', '.format-matrix-actions'],
      ['/en/formats/', '.format-matrix-actions'],
      ['/cases/', '.case-studies-actions'],
      ['/en/cases/', '.case-studies-actions'],
    ]) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const centerOffset = await page.locator(selector).evaluate((container) => {
        const [primary, secondary] = Array.from(container.children);
        const first = primary.getBoundingClientRect();
        const second = secondary.getBoundingClientRect();
        return Math.abs(first.top + first.height / 2 - second.top - second.height / 2);
      });
      const needsWrap = (path === '/en/cases/' || path === '/en/formats/') && width === 320;
      if (needsWrap) {
        expect(centerOffset, `${path} at ${width}px should wrap the secondary action`).toBeGreaterThan(2);
      } else {
        expect(centerOffset, `${path} at ${width}px should keep both actions on one row`).toBeLessThan(2);
      }
    }
  }
});

test('English evidence-page introductions stay concise on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, selector, maxHeight] of [
    ['/en/formats/', '.format-matrix-heading > p:not(.kicker)', 106],
    ['/en/cases/', '.case-studies-heading > p:not(.kicker)', 106],
  ] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const height = await page.locator(selector).evaluate((element) => element.getBoundingClientRect().height);
    expect(height).toBeLessThanOrEqual(maxHeight);
  }

  await page.goto('/en/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#lab-title')).toHaveText('Explore real geometry.');
  expect(await page.locator('#lab-title').evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(110);
  expect(await page.locator('.lab-intro > p:not(.kicker)').evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(80);
  expect(await page.locator('.lab-warning').evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(380);
});

test('format matrix rows use concise bilingual status labels with full accessible meaning', async ({ page }) => {
  for (const [path, shortLabels, fullLabel] of [
    ['/formats/', ['稳定版目标', '按发布验证'], '已注册导出目标，按发布版本验证'],
    ['/en/formats/', ['Stable target', 'Verify per Release'], 'Registered target; verify per Release'],
  ] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const statuses = page.locator('.format-status');
    await expect(statuses).toHaveCount(11);
    await expect(statuses.filter({ hasText: shortLabels[0] })).toHaveCount(2);
    await expect(statuses.filter({ hasText: shortLabels[1] })).toHaveCount(9);
    await expect(statuses.nth(2)).toHaveAttribute('aria-label', fullLabel);
  }
});

test('format summary counts distinguish the additional tier from all configured targets', async ({ page }) => {
  for (const [path, additionalLabel, totalLabel] of [
    ['/formats/', '其他目标', '全部 11 个已配置目标与对应验证依据'],
    ['/en/formats/', 'additional targets', 'All 11 configured targets and linked evidence'],
  ] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const counts = page.locator('.evidence-summary > span');
    await expect(counts).toHaveCount(3);
    await expect(counts.nth(1).locator('b')).toHaveText('2');
    await expect(counts.nth(2).locator('b')).toHaveText('9');
    await expect(counts.nth(2)).toContainText(additionalLabel);
    await expect(page.locator('tbody tr')).toHaveCount(11);
    await expect(page.locator('caption')).toHaveText(totalLabel);
  }
});

test('format matrix describes evidence scope and links each target to relevant repository evidence', async ({ page }) => {
  const evidencePaths = [
    'tests/unit/test_kicad_exporter_golden.cpp',
    'tests/manual/ALTIUM_EXPORT_MANUAL_TEST.md',
    'tests/unit/test_xpedition_exporter.cpp',
    'tests/unit/test_allegro_exporter.cpp',
    'tests/unit/test_pads_exporter.cpp',
    'tests/unit/test_eagle_exporter.cpp',
    'tests/unit/test_pcad_exporter.cpp',
    'tests/unit/test_cadstar_exporter.cpp',
    'tests/unit/test_orcad_exporter.cpp',
    'tests/unit/test_librepcb_exporter.cpp',
    'tests/unit/test_horizon_exporter.cpp',
  ];
  for (const [path, outputs, linkLabel] of [
    ['/formats/', ['.kicad_sym', 'SchLib + PcbLib', 'XML 符号库', '.lplib', '.pool 符号数据'], '查看仓库验证依据'],
    ['/en/formats/', ['.kicad_sym', 'SchLib + PcbLib', 'XML symbol library', '.lplib', '.pool symbol data'], 'Open repository evidence'],
  ] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const artifacts = page.locator('.format-artifacts-cell');
    await expect(artifacts).toHaveCount(11);
    for (const output of outputs) await expect(page.locator('.format-table-wrap')).toContainText(output);
    await expect(page.locator('thead th').nth(3)).toHaveText(/Evidence scope|验证依据涉及的产物/);
    await expect(artifacts.first().locator('a')).toContainText(linkLabel);
    for (const [index, evidencePath] of evidencePaths.entries()) {
      await expect(artifacts.nth(index).locator('a')).toHaveAttribute('href', new RegExp(`${evidencePath.replaceAll('.', '\\.')}$`));
    }
    await expect(page.locator('.format-matrix-note')).toContainText(/人工验证流程|manual procedure/);
    await expect(page.locator('#format-matrix-title').locator('..')).toContainText(/不等同于已在目标桌面软件中验收|desktop-app validation/);
  }
});

test('case studies expose their evidence scope and next-step paths', async ({ page }) => {
  for (const path of ['/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.case-studies-actions .button-dark')).toHaveAttribute('href', /formats/);
    await expect(page.locator('.case-studies-actions .text-link')).toHaveAttribute('href', /github\.com\/EasyKiconverter\/EasyKiConverter$/);
    await expect(page.locator('.evidence-summary')).toContainText('v3.1.13');
    await expect(page.locator('.evidence-summary')).toContainText('2');
    await expect(page.locator('.case-proof')).toHaveCount(2);
    await expect(page.locator('.case-evidence-action')).toHaveCount(4);
    await expect(page.locator('.case-evidence-action').first()).toContainText(/打开测试样本|Open fixture/);
  }
});

test('case-study introductions keep the evidence-first promise aligned in both languages', async ({ page }) => {
  for (const [path, title, evidenceCopy, manualCopy] of [
    ['/cases/', '先核对证据，再看路径。', '关联集成测试实际验证的内容', '仍需人工检查'],
    ['/en/cases/', 'Check the evidence, then trace each route.', 'only what linked tests verify', 'checks remain manual'],
  ]) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#case-studies-title')).toHaveText(title);
    const summary = page.locator('.case-studies-heading > p').nth(1);
    await expect(summary).toContainText(evidenceCopy);
    await expect(summary).toContainText(manualCopy);
  }
});

test('case studies expose bilingual input and output routes', async ({ page }) => {
  await page.goto('/cases/', { waitUntil: 'domcontentloaded' });
  const chineseRoutes = page.locator('.case-route');
  await expect(chineseRoutes).toHaveCount(2);
  await expect(chineseRoutes.first()).toContainText('输入');
  await expect(chineseRoutes.first()).toContainText('符号与封装样本');
  await expect(chineseRoutes.first()).toContainText('KiCad 符号库 + 封装');

  await page.goto('/en/cases/', { waitUntil: 'domcontentloaded' });
  const englishRoutes = page.locator('.case-route');
  await expect(englishRoutes).toHaveCount(2);
  await expect(englishRoutes.first()).toContainText('INPUT');
  await expect(englishRoutes.first()).toContainText('Symbol and footprint fixtures');
  await expect(englishRoutes.first()).toContainText('KiCad symbol library + footprint');
});

test('Lab pages keep the experiment connected to product navigation', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const actions = page.locator('.lab-intro-actions');
    await expect(actions).toBeVisible();
    await expect(actions.locator('a').first()).toHaveAttribute('data-release-link', '');
    await expect(actions.locator('a.text-link').first()).toHaveAttribute('href', /^(\/|https?:)/);
    await expect(actions.locator('[data-release-link]')).toHaveClass(/button-dark/);
    await expect(actions.locator('a[href*="formats"]')).toHaveAttribute('href', /formats/);
  }
});

test('Lab advanced controls explain their collapsed hierarchy', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.motion-model button:disabled').first()).toHaveCSS('cursor', 'not-allowed');
    const toggle = page.locator('[data-experiment-controls]');
    await expect(toggle).toHaveAttribute('aria-controls', 'lab-experiment-controls');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#lab-experiment-controls')).toContainText(/some unlock after model data|加载模型、完成扫描或导入数据/);
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
    { path: '/', labels: ['格式矩阵', '转换案例', '3D 实验室', '文档'] },
    { path: '/formats/', labels: ['格式矩阵', '转换案例', '3D 实验室', '文档'] },
    { path: '/cases/', labels: ['格式矩阵', '转换案例', '3D 实验室', '文档'] },
    { path: '/lab/', labels: ['格式矩阵', '转换案例', '3D 实验室', '文档'] },
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
    await expect(footer.locator('a[href*="EasyKiConverter/issues"]')).toContainText(path.startsWith('/en/') ? 'Issues' : '问题反馈');
  }
});

test('bilingual external navigation entries expose the exit cue', async ({ page }) => {
  for (const path of ['/', '/en/', '/formats/', '/en/formats/', '/cases/', '/en/cases/', '/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const externalLinks = page.locator('.site-footer .footer-link-external');
    await expect(externalLinks).toHaveCount(4);
    await expect(externalLinks.locator('span[aria-hidden="true"]')).toHaveCount(4);
    await expect(page.locator('.site-header .nav-link-external span[aria-hidden="true"]')).toHaveCount(path === '/' || path === '/en/' ? 1 : 0);
    if (path === '/' || path === '/en/') {
      await expect(page.locator('.mobile-nav .nav-link-external span[aria-hidden="true"]')).toHaveCount(1);
    }
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

test('bilingual shared text colors meet WCAG AA on light brand surfaces', async ({ page }) => {
  for (const path of ['/', '/en/', '/formats/', '/en/formats/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(['muted', 'violet', 'paper', 'peach', 'lilac', 'mint', 'yellow'].map((token) => [
        token,
        style.getPropertyValue(`--${token}`).trim(),
      ])) as Record<string, string>;
    });
    expect(tokens).toMatchObject({ muted: '#5b564f', violet: '#5848b8' });

    const luminance = (color: string): number => {
      const channels = color.match(/[\da-f]{2}/gi)?.map((value) => parseInt(value, 16) / 255) ?? [];
      const [red, green, blue] = channels.map((channel) =>
        channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
      );
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };
    const contrastRatio = (foreground: string, background: string): number => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    for (const surface of [tokens.paper, tokens.peach, tokens.lilac, tokens.mint, tokens.yellow]) {
      expect(contrastRatio(tokens.muted, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tokens.violet, surface)).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('bilingual workbench captions preserve the same product evidence', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.app-window > img')).toHaveAttribute('alt', /BOM/);
  await expect(page.locator('.showcase-source')).toHaveText('截取自桌面软件实际运行界面 · 本机输出路径已隐藏');
  await expect(page.locator('.app-window figcaption')).not.toContainText('resources/');
  await expect(page.locator('.showcase-proof-items')).toContainText('添加元件');
  await expect(page.locator('.showcase-proof-items')).toContainText('导入 BOM');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.app-window > img')).toHaveAttribute('alt', /BOM import and export settings/);
  await expect(page.locator('.showcase-source')).toHaveText('Captured from the running desktop app · Local output path hidden');
  await expect(page.locator('.app-window figcaption')).not.toContainText('resources/');
  await expect(page.locator('.showcase-proof-items')).toContainText('Add components');
  await expect(page.locator('.showcase-proof-items')).toContainText('Import BOM');
});

test('bilingual homepages expose localized navigation destinations', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav-links a[href="#formats"]')).toHaveText('格式矩阵');
  await expect(page.locator('.nav-links a[href="cases/"]')).toHaveText('转换案例');
  await expect(page.locator('.mobile-nav a[href="cases/"]')).toHaveText('转换案例');
  await expect(page.locator('.nav-links a').filter({ hasText: '3D 实验室' })).toHaveAttribute('href', /lab\/$/);
  await expect(page.locator('.mobile-nav a[href="https://github.com/EasyKiconverter/EasyKiConverter/tree/master/docs"]')).toContainText('文档');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav-links a[href="#download"]')).toHaveText('Download');
  await expect(page.locator('.mobile-nav a[href="#download"]')).toHaveText('Download');
});

test('homepage story navigation uses the descriptive story anchor', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main#top #story')).toBeVisible();
    await expect(page.locator('.nav-links a[href="#story"]')).toHaveCount(1);
    await expect(page.locator('.mobile-nav a[href="#story"]')).toHaveCount(1);
    await expect(page.locator('.hero-actions a[href="#story"]')).toHaveCount(1);
  }
});

test('homepage story cards connect the narrative to evidence and action', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const links = page.locator('.story-rail .story-link');
    await expect(links).toHaveCount(3);
    await expect(links.nth(0)).toHaveAttribute('href', 'cases/');
    await expect(links.nth(1)).toHaveAttribute('href', 'lab/');
    await expect(links.nth(2)).toHaveAttribute('href', '#download');
  }
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
    await expect(platforms.nth(2)).toContainText(path === '/' ? 'Apple 芯片' : 'Apple Silicon');
    await expect(platforms.nth(2).locator('.platform-count')).toContainText(/2/);
    await expect(platforms.nth(0).locator('.platform-architecture')).toHaveCount(2);
    await expect(platforms.nth(1).locator('.platform-architecture')).toHaveCount(3);
    await expect(platforms.nth(2).locator('.platform-architecture')).toHaveCount(2);
  }
});

test('homepage platform copy speaks in user-facing download terms', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.platform-summary')).toContainText('macOS 构建尚未完成维护者验收');
  await expect(page.locator('.platform-summary')).toContainText('按设备架构选择对应下载项');
  await expect(page.locator('.platform-list > div').first()).toContainText('2 个下载项');
  await expect(page.locator('.download-links')).toHaveAttribute('aria-label', '平台下载入口');
  await expect(page.locator('.download-copy')).not.toContainText('GitHub API');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.platform-summary')).toContainText('macOS builds have not completed maintainer validation');
  await expect(page.locator('.platform-summary')).toContainText('Choose the download that matches your architecture');
  await expect(page.locator('.platform-list > div').first()).toContainText('2 downloads');
  await expect(page.locator('.download-links')).toHaveAttribute('aria-label', 'Platform download entries');
  await expect(page.locator('.download-copy')).not.toContainText('GitHub API');
});

test('bilingual platform headings distinguish experimental macOS builds', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.platform-intro .kicker')).toHaveText('平台状态');
  await expect(page.locator('#platforms-title')).toContainText('macOS 安装包');
  await expect(page.locator('#platforms-title')).toContainText('仍属实验阶段');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.platform-intro .kicker')).toHaveText('PLATFORM STATUS');
  await expect(page.locator('#platforms-title')).toContainText('macOS packages');
  await expect(page.locator('#platforms-title')).toContainText('still experimental');
});

test('macOS download caveat links to the known Gatekeeper issue in both languages', async ({ page }) => {
  for (const [path, languageText] of [
    ['/', 'Apple Silicon 用户曾报告 Gatekeeper 提示'],
    ['/en/', 'An Apple Silicon user reported Gatekeeper’s'],
  ]) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const notice = page.locator('.download-platform-notice');
    const actions = page.locator('.download-actions');
    await expect(notice).toContainText(languageText);
    const noticeBox = await notice.boundingBox();
    const actionBox = await actions.boundingBox();
    if (!noticeBox || !actionBox) throw new Error('Download notice or actions are not visible');
    expect(noticeBox.y + noticeBox.height).toBeLessThan(actionBox.y);
    await expect(notice.locator('a')).toHaveAttribute(
      'href',
      'https://github.com/EasyKiconverter/EasyKiConverter/issues/153',
    );
    await expect(notice.locator('a')).toHaveAttribute('target', '_blank');
    await expect(notice.locator('a')).toHaveAttribute('rel', 'noreferrer');
    await expect(notice).toContainText(path === '/' ? '请勿根据未经核实的教程关闭系统安全防护' : 'Do not disable macOS security protections');
  }
});

test('platform sections offer a direct path to the matching download area', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.platform-intro-link')).toHaveAttribute('href', '#download');
  await expect(page.locator('.platform-intro-link')).toContainText('查看平台下载项');
  await expect(page.locator('.platform-summary')).toHaveCSS('max-width', '400px');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.platform-intro-link')).toHaveAttribute('href', '#download');
  await expect(page.locator('.platform-intro-link')).toContainText('See platform downloads');
  await expect(page.locator('.platform-summary')).toHaveCSS('max-width', '400px');
});

test('bilingual hero copy names target EDAs and generated library content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero-lede')).toContainText('KiCad、Altium');
  await expect(page.locator('.hero-lede')).toContainText('符号、封装与 3D 模型');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero-lede')).toContainText('KiCad / Altium');
  await expect(page.locator('.hero-lede')).toContainText('symbols, footprints & 3D models');
});

test('bilingual hero artwork stays fully visible from phone through desktop widths', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const path of pages) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const artwork = await page.locator('.hero-product-stage').evaluate((stage) => {
        const selectors = ['.hero-float-input', '.hero-float-output', '.hero-stage-tag'];
        return Object.fromEntries(selectors.map((selector) => {
          const rect = stage.querySelector(selector)!.getBoundingClientRect();
          return [selector, { left: rect.left, right: rect.right }];
        }));
      });
      for (const [selector, bounds] of Object.entries(artwork)) {
        expect(bounds.left, `${path} ${viewport.width}px ${selector} left edge`).toBeGreaterThanOrEqual(0);
        expect(bounds.right, `${path} ${viewport.width}px ${selector} right edge`).toBeLessThanOrEqual(viewport.width);
      }
    }
  }
});

test('English homepage keeps product section labels concrete', async ({ page }) => {
  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.product-showcase .kicker')).toHaveText('THE REAL WORKBENCH');
  await expect(page.locator('#workflow .kicker')).toHaveText('A SMALL WORKFLOW');
});

test('bilingual workflow copy explains the same four concrete steps', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#workflow .workflow-copy > p').nth(1)).toHaveText(
    '粘贴 LCSC 编号或导入 BOM，选择目标 EDA 格式和 3D 模型选项，运行转换，再把生成的库带回 EDA 工具。',
  );

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#workflow .workflow-copy > p').nth(1)).toHaveText(
    'Paste an LCSC number or import a BOM. Choose target EDA formats and 3D model options, run the conversion, then bring the generated libraries back into your EDA.',
  );
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

test('homepage preserves Qt brand casing and concise release guidance in both languages', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const brand = page.locator('.hero-copy .kicker-brand-case');
    await expect(brand).toHaveText('Qt');
    expect(await brand.evaluate((element) => getComputedStyle(element).textTransform)).toBe('none');
    expect(await brand.evaluate((element) => getComputedStyle(element).letterSpacing)).toBe('normal');
  }

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.showcase-proof-label')).toHaveText('真实 Qt Quick 界面');
  await expect(page.locator('#formats p')).toContainText('其他目标格式的具体支持范围，请查看对应版本的发布说明和格式矩阵。');
  await expect(page.locator('#download small')).toContainText('查看对应版本发布说明并核对 SHA256');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.showcase-proof-label')).toHaveText('REAL Qt Quick UI');
  await expect(page.locator('#formats p')).toContainText('For other targets, use the matching Release and format matrix');
});

test('Chinese homepage and inner-page titles avoid orphaned characters on mobile', async ({ page }) => {
  for (const width of [390, 360, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const language of [
      { path: '/', english: false },
      { path: '/en/', english: true },
    ]) {
      await page.goto(language.path, { waitUntil: 'domcontentloaded' });
      const textLines = async (selector: string) => page.locator(selector).first().evaluate((element) => {
        const lines = new Map<number, string>();
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const value = node.nodeValue || '';
          let offset = 0;
          for (const character of value) {
            const end = offset + character.length;
            if (!/\s/.test(character)) {
              const range = document.createRange();
              range.setStart(node, offset);
              range.setEnd(node, end);
              const top = Math.round(range.getBoundingClientRect().top);
              lines.set(top, (lines.get(top) || '') + character);
            }
            offset = end;
          }
        }
        return [...lines.values()];
      });
      const assertNoOrphanedHan = (lines: string[], label: string) => {
        if (!language.english) {
          expect(lines.some((line) => /^[\p{Script=Han}。！？、，；：]$/u.test(line)), label).toBe(false);
        }
      };
      const workbenchHeadline = await textLines('.product-showcase #showcase-title em');
      assertNoOrphanedHan(workbenchHeadline, `${language.path} ${width}px workbench headline has an orphaned character`);
      if (language.english) expect(workbenchHeadline.length).toBeLessThanOrEqual(width === 320 ? 3 : 2);

      const languagePath = language.english ? '/en' : '';
      await page.goto(`${languagePath}/formats/`, { waitUntil: 'domcontentloaded' });
      const formatHeadline = await textLines('#format-matrix-title');
      assertNoOrphanedHan(formatHeadline, `${language.path} ${width}px format title has an orphaned character`);
      if (language.english) expect(formatHeadline.length).toBeLessThanOrEqual(width === 320 ? 3 : 2);

      await page.goto(`${languagePath}/cases/`, { waitUntil: 'domcontentloaded' });
      const caseHeadline = await textLines('.case-card h2');
      assertNoOrphanedHan(caseHeadline, `${language.path} ${width}px first case title has an orphaned character`);
      if (width === 320) {
        expect(caseHeadline.length, `${language.path} ${width}px first case route title lines`).toBeLessThanOrEqual(2);
      } else {
        expect(caseHeadline.length, `${language.path} ${width}px first case route title lines`).toBe(1);
      }

      await page.goto(`${languagePath}/lab/`, { waitUntil: 'domcontentloaded' });
      const labHeadline = await textLines('#lab-title');
      assertNoOrphanedHan(labHeadline, `${language.path} ${width}px lab title has an orphaned character`);
      if (language.english) expect(labHeadline.length).toBeLessThanOrEqual(2);
    }
  }
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

test('bilingual platform summaries localize architecture labels consistently', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const chinesePlatforms = page.locator('.platform-list');
  await expect(chinesePlatforms).toContainText('Apple 芯片 DMG');
  await expect(chinesePlatforms).not.toContainText('Apple Silicon');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  const englishPlatforms = page.locator('.platform-list');
  await expect(englishPlatforms).toContainText('Apple Silicon DMG');
});

test('Chinese Lab keeps its entry label localized', async ({ page }) => {
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-intro .kicker')).toHaveText('按需加载 · 实验性 3D');
  await expect(page.locator('.lab-intro')).not.toContainText('EXPERIMENTAL 3D');
  await expect(page.locator('.motion-chapter-input > span')).toHaveText('01 — 输入');
  await expect(page.locator('.motion-chapter-library > span')).toHaveText('02 — 构建元件库');
  await expect(page.locator('.motion-artifacts')).toHaveText('符号+封装+3D 模型');
  await expect(page.locator('[data-visual="symbol"]')).toContainText('元件');
  await expect(page.locator('[data-visual="symbol"]')).not.toContainText('COMPONENT');
  await expect(page.locator('[data-visual="footprint"]')).toContainText('俯视图 · 非按比例');
  await expect(page.locator('[data-visual="footprint"]')).not.toContainText('TOP VIEW');
  await expect(page.locator('.morph-orbit-import')).toHaveText('导入轨道 ↥');
  await expect(page.locator('.tomogram-import')).toHaveText('导入 ↥');
  await expect(page.locator('.motion-chapter-product > span')).toHaveText('03 — 真实工作台');
  await expect(page.locator('.motion-chapter-product')).not.toContainText('THE REAL WORKBENCH');
  await page.goto('/en/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-intro .kicker')).toHaveText('ON DEMAND · EXPERIMENTAL 3D');
  await expect(page.locator('.motion-chapter-input > span')).toHaveText('01 — INPUT');
  await expect(page.locator('.motion-artifacts')).toHaveText('SYMBOL+FOOTPRINT+3D MODEL');
  await expect(page.locator('[data-visual="symbol"]')).toContainText('COMPONENT');
  await expect(page.locator('[data-visual="footprint"]')).toContainText('TOP VIEW · NOT TO SCALE');
  await expect(page.locator('.morph-orbit-import')).toHaveText('ORBIT ↥');
});

test('case studies describe only conversion routes supported by linked integration tests', async ({ page }) => {
  await page.goto('/cases/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.case-card')).toHaveCount(2);
  await expect(page.locator('#easyeda-kicad')).toContainText('符号与封装样本');
  await expect(page.locator('#easyeda-kicad .case-evidence-link')).toHaveCount(3);
  await expect(page.locator('#easyeda-kicad .case-evidence-link').nth(1)).toHaveAttribute('href', /footprint_basic\.json$/);
  await expect(page.locator('#altium-pipeline')).toContainText('本地构造确定性元件数据');
  await expect(page.locator('#altium-pipeline')).toContainText('不代表 EasyEDA 在线导入');
  await expect(page.locator('#altium-pipeline .case-evidence-link')).toHaveAttribute('href', /test_parallel_export_cancellation\.cpp$/);
  await expect(page.locator('#bom-batch')).toHaveCount(0);
  await page.goto('/en/cases/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.case-card')).toHaveCount(2);
  await expect(page.locator('#easyeda-kicad')).toContainText('Both EasyEDA JSON fixtures are read directly by this test.');
  await expect(page.locator('#altium-pipeline')).toContainText('does not represent an EasyEDA online import');
  await expect(page.locator('#bom-batch')).toHaveCount(0);
});

test('bilingual case copy keeps inputs, target files, and manual validation scope explicit', async ({ page }) => {
  await page.goto('/cases/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#easyeda-kicad')).toContainText('KiCad 符号库 + 封装');
  await expect(page.locator('#altium-pipeline')).toContainText('SchLib + PcbLib + STEP');
  await expect(page.locator('.case-disclaimer')).toContainText('自动化测试通过不等同于已在');
  await page.goto('/en/cases/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#easyeda-kicad')).toContainText('KiCad symbol library + footprint');
  await expect(page.locator('#altium-pipeline')).toContainText('SchLib + PcbLib + STEP');
  await expect(page.locator('.case-disclaimer')).toContainText('does not replace opening and checking exported files');
});

test('case evidence paths foreground filenames while retaining directories', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const firstEvidence = page.locator('.case-evidence-link').first();
    await expect(firstEvidence.locator('.case-evidence-name')).toHaveText('symbol_basic.json');
    await expect(firstEvidence.locator('.case-evidence-directory')).toHaveText('tests/fixtures/easyeda/');
    await expect(firstEvidence).toHaveAttribute('aria-label', /symbol_basic\.json/);
  }
});

test('bilingual case evidence follows each summary without stretched-card gaps', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/cases/', '/en/cases/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const cards = page.locator('.case-card');
      const geometry = await cards.evaluateAll((elements) => elements.map((card) => {
        const summary = card.querySelector(':scope > p')!.getBoundingClientRect();
        const evidence = card.querySelector('dl')!.getBoundingClientRect();
        return {
          gap: evidence.top - summary.bottom,
          bottom: card.getBoundingClientRect().bottom,
        };
      }));

      expect(geometry).toHaveLength(2);
      expect(geometry.every(({ gap }) => gap >= 20 && gap < 48)).toBe(true);
      if (width > 850) expect(Math.abs(geometry[0].bottom - geometry[1].bottom)).toBeGreaterThan(40);
    }
  }
});

test('download cards show the actual Release asset architectures', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const chineseLinks = page.locator('.download-links > a');
  await expect(chineseLinks).toHaveCount(8);
  await expect(chineseLinks.nth(0)).toContainText('x86_64 安装包');
  await expect(chineseLinks.nth(1)).toContainText('arm64 安装包');
  expect((await chineseLinks.locator('span').allTextContents()).join(' ')).not.toContain('installer');
  await expect(page.locator('.download-copy small')).toContainText('便携版、MSIX、RPM、Arch Linux 包及逐项校验文件');
  await expect(page.getByRole('link', { name: /查看全部发布版本/ })).toHaveAttribute('href', 'https://github.com/EasyKiconverter/EasyKiConverter/releases');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  const englishLinks = page.locator('.download-links > a');
  await expect(englishLinks).toHaveCount(8);
  await expect(englishLinks.nth(0)).toContainText('x86_64 installer');
  for (const label of ['arm64 installer', 'x86_64 AppImage', 'amd64 DEB', 'aarch64 AppImage', 'Apple Silicon DMG', 'Intel DMG']) {
    await expect(englishLinks.filter({ hasText: label })).toHaveCount(1);
  }
  await expect(page.locator('.download-copy small')).toContainText('portable builds, MSIX, RPM, Arch Linux packages, and per-file checksums');
  await expect(page.getByRole('link', { name: 'All releases ↗' })).toHaveAttribute('href', 'https://github.com/EasyKiconverter/EasyKiConverter/releases');
  for (const links of [chineseLinks, englishLinks]) {
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
  await expect(stage).toHaveAttribute('data-model-edge-segments');
  const edgeMeshes = Number(await stage.getAttribute('data-model-edge-meshes'));
  expect(edgeMeshes).toBeGreaterThan(64);
  await expect(stage).not.toHaveClass(/model-fallback/);
});

test('Lab explains that surface detail continues after the GLB is ready', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const stage = page.locator('[data-model-stage]');
    await expect(stage).toHaveAttribute('data-model-source', 'glb', { timeout: 20000 });
    await expect(stage.locator('[data-model-detail-status]')).toContainText(/表面细节|SURFACE DETAIL/);
  }
});

test('Lab keeps model metadata, view controls, caption, and slice panel from overlapping', async ({ page }) => {
  await page.route('**/assets/model/**', (route) => route.abort());
  await page.route('**/assets/vendor/**', (route) => route.abort());
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/lab/', '/en/lab/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const stage = page.locator('[data-model-stage]');
      await expect(stage).toBeVisible();
      const overlaps = await stage.evaluate((element) => {
        const rect = (selector: string) => element.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
        const intersects = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const caption = rect('.artifact-caption');
        const captionStyle = getComputedStyle(element.querySelector<HTMLElement>('.artifact-caption')!);
        const switcher = rect('.artifact-switcher');
        return {
          noteWithSwitcher: intersects(rect('.motion-model-note'), switcher),
          detailWithSwitcher: intersects(rect('.model-detail-status'), switcher),
          advancedWithSwitcher: intersects(rect('.experiment-controls-toggle'), rect('.artifact-switcher')),
          sliceDockWithSwitcher: intersects(rect('.model-controls-dock'), switcher),
          captionIsVisuallyHidden: caption.width <= 1 && caption.height <= 1 && captionStyle.clipPath !== 'none',
        };
      });
      expect(overlaps).toEqual({
        noteWithSwitcher: false,
        detailWithSwitcher: false,
        advancedWithSwitcher: false,
        sliceDockWithSwitcher: false,
        captionIsVisuallyHidden: true,
      });
    }
  }
});

test('Lab asset guidance matches the generated delivery path', async ({ page }) => {
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-warning')).toContainText('10.0 MB');
  await expect(page.locator('.lab-warning')).toContainText('8.4 MB');
  await expect(page.locator('.lab-warning')).toContainText('STEP/WASM');
});

test('Lab artifact switcher updates the active view and delivery copy', async ({ page }) => {
  test.setTimeout(60_000);
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const stage = page.locator('[data-model-stage]');
    await expect(stage).toHaveAttribute('data-model-source', 'glb', { timeout: 20000 });
    await expect(stage).toHaveAttribute('data-artifact-controls-ready', 'true', { timeout: 30000 });
    await expect(stage.locator('#model-canvas')).toHaveAttribute('aria-label', /GLB delivery model|GLB 交付模型/);
    const atlas = stage.locator('[data-artifact-view="atlas"]');
    await atlas.dispatchEvent('click');
    await expect(stage).toHaveAttribute('data-artifact-view', 'atlas');
    await expect(atlas).toHaveAttribute('aria-pressed', 'true');
    await expect(stage.locator('.mesh-atlas')).not.toHaveAttribute('inert', '');
    await expect(stage.locator('.mesh-atlas')).not.toHaveAttribute('aria-hidden', 'true');
    await expect(stage.locator('#model-canvas')).toHaveAttribute('inert', '');
    await expect(stage.locator('#model-canvas')).toHaveAttribute('aria-hidden', 'true');
    await expect(stage.locator('.artifact-caption')).toContainText(/mesh|网格/i);
    const model = stage.locator('[data-artifact-view="model"]');
    await model.dispatchEvent('click');
    await expect(stage).toHaveAttribute('data-artifact-view', 'model');
    await expect(model).toHaveAttribute('aria-pressed', 'true');
    await expect(stage.locator('#model-canvas')).not.toHaveAttribute('inert', '');
    await expect(stage.locator('#model-canvas')).not.toHaveAttribute('aria-hidden', 'true');
    await expect(stage.locator('.mesh-atlas')).toHaveAttribute('inert', '');
    await expect(stage.locator('[data-artifact-label]')).toContainText(/GLB DELIVERY MODEL|GLB 交付模型/);
  }
});

test('Lab keeps the model view switcher above the geometry on desktop and mobile', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const switcher = page.locator('.artifact-switcher');
      await expect(switcher).toBeVisible();
      const geometry = await page.evaluate(() => {
        const stageElement = document.querySelector<HTMLElement>('[data-model-stage]');
        const switcherElement = document.querySelector<HTMLElement>('.artifact-switcher');
        if (!stageElement || !switcherElement) return null;
        const stageRect = stageElement.getBoundingClientRect();
        const switcherRect = switcherElement.getBoundingClientRect();
        return {
          stage: { left: stageRect.left, right: stageRect.right, top: stageRect.top, height: stageRect.height },
          switcher: { left: switcherRect.left, right: switcherRect.right, top: switcherRect.top },
          buttonHeights: [...switcherElement.querySelectorAll('button')].map((button) => button.getBoundingClientRect().height),
        };
      });
      expect(geometry).not.toBeNull();
      expect(geometry!.switcher.top - geometry!.stage.top).toBeLessThan(geometry!.stage.height * 0.25);
      expect(geometry!.switcher.left).toBeGreaterThanOrEqual(geometry!.stage.left);
      expect(geometry!.switcher.right).toBeLessThanOrEqual(geometry!.stage.right);
      geometry!.buttonHeights.forEach((height) => expect(height).toBeLessThanOrEqual(34));
    }
  }
});

test('Lab gives the mobile model stage enough room in both languages', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 640 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/lab/', '/en/lab/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const stage = page.locator('[data-model-stage]');
      await expect(stage).toHaveAttribute('data-model-source', 'glb', { timeout: 20000 });
      const bounds = await stage.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      const minimumHeight = viewport.height <= 700 ? viewport.height * 0.32 : viewport.height * 0.4;
      expect(bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.height).toBeGreaterThanOrEqual(minimumHeight);
    }
  }
});

test('Lab mobile scroll chapters stay clear of model controls in both languages', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 640 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/lab/', '/en/lab/']) {
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
          configurable: true,
          value(contextId: string, ...options: unknown[]) {
            if (contextId.startsWith('webgl')) return null;
            return Reflect.apply(originalGetContext, this, [contextId, ...options]);
          },
        });
      });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        const story = document.querySelector<HTMLElement>('.motion-narrative');
        if (story) window.scrollTo(0, story.offsetTop + 120);
      });

      for (const [step, chapter] of [
        ['1', 'input'],
        ['2', 'library'],
        ['3', 'product'],
      ]) {
        await page.locator('[data-motion-timeline]').evaluate((timeline, activeStep) => {
          timeline.setAttribute('data-story-step', activeStep);
        }, step);
        if (step === '3') {
          const appImage = page.locator('.motion-app-window img');
          await expect(appImage).toHaveJSProperty('complete', true);
          await expect.poll(() => appImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
        }
        await page.waitForTimeout(450);

        const layout = await page.evaluate((chapterName) => {
          const chapterElement = document.querySelector<HTMLElement>(`[data-motion-chapter="${chapterName}"]`);
          const stageElement = document.querySelector<HTMLElement>('[data-model-stage]');
          if (!chapterElement || !stageElement) return null;
          const chapter = chapterElement.getBoundingClientRect();
          const stage = stageElement.getBoundingClientRect();
          const controls = Array.from(stageElement.querySelectorAll<HTMLElement>(
            '.artifact-switcher, .model-explode, .artifact-caption, .model-detail-status, .experiment-controls-toggle',
          )).map((element) => {
            const rect = element.getBoundingClientRect();
            return { name: element.className, top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
          }).filter((rect) => rect.bottom > rect.top && rect.right > rect.left);
          return {
            chapter: { top: chapter.top, bottom: chapter.bottom, left: chapter.left, right: chapter.right },
            stage: { top: stage.top, bottom: stage.bottom, visibility: getComputedStyle(stageElement).visibility },
            destinations: (() => {
              const element = document.querySelector<HTMLElement>('.motion-destinations');
              const rect = element?.getBoundingClientRect();
              return rect && { top: rect.top, bottom: rect.bottom };
            })(),
            controls,
          };
        }, chapter);

        expect(layout, `${path} ${viewport.width}px story step ${step}`).not.toBeNull();
        if (step === '3') {
          expect(layout!.stage.visibility, `${path} ${viewport.width}px final product chapter should hand off the model`).toBe('hidden');
          expect(layout!.chapter.bottom, `${path} ${viewport.width}px final chapter should stay clear of destination links`).toBeLessThan(layout!.destinations!.top);
        } else {
          expect(layout!.chapter.bottom, `${path} ${viewport.width}px story step ${step} should keep copy above the model`).toBeLessThan(layout!.stage.top);
          for (const control of layout!.controls) {
            const overlaps = layout!.chapter.top < control.bottom
              && layout!.chapter.bottom > control.top
              && layout!.chapter.left < control.right
              && layout!.chapter.right > control.left;
            expect(overlaps, `${path} ${viewport.width}px story step ${step} overlaps ${control.name}`).toBe(false);
          }
        }
      }
    }
  }
});

test('Lab tablet layout keeps the narrative heading clear of the model in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const layout = await page.evaluate(() => {
      const heading = document.querySelector<HTMLElement>('.motion-heading');
      const model = document.querySelector<HTMLElement>('[data-model-stage]');
      if (!heading || !model) return null;
      const headingRect = heading.getBoundingClientRect();
      const modelRect = model.getBoundingClientRect();
      return { headingBottom: headingRect.bottom, modelTop: modelRect.top, scrollWidth: document.documentElement.scrollWidth };
    });
    expect(layout).not.toBeNull();
    expect(layout!.headingBottom).toBeLessThan(layout!.modelTop);
    expect(layout!.scrollWidth).toBeLessThanOrEqual(768);
  }
});

test('Lab desktop model stage stays clear of the narrative heading', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const layout = await page.evaluate(() => {
      const heading = document.querySelector<HTMLElement>('.motion-heading');
      const model = document.querySelector<HTMLElement>('[data-model-stage]');
      if (!heading || !model) return null;
      const headingRect = heading.getBoundingClientRect();
      const modelRect = model.getBoundingClientRect();
      return { headingRight: headingRect.right, modelLeft: modelRect.left, scrollWidth: document.documentElement.scrollWidth };
    });
    expect(layout).not.toBeNull();
    expect(layout!.headingRight).toBeLessThan(layout!.modelLeft);
    expect(layout!.scrollWidth).toBeLessThanOrEqual(1440);
  }
});

test('Lab narrative headlines keep the Chinese lead together on desktop', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/lab/', '/en/lab/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const lines = await page.locator('.motion-heading h1').evaluate((element) => {
        const grouped = new Map<number, string>();
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          let offset = 0;
          for (const character of node.nodeValue || '') {
            const range = document.createRange();
            range.setStart(node, offset);
            range.setEnd(node, offset + character.length);
            const top = Math.round(range.getBoundingClientRect().top);
            if (!/\s/.test(character)) grouped.set(top, (grouped.get(top) || '') + character);
            offset += character.length;
          }
        }
        return [...grouped.values()];
      });

      if (path === '/lab/') {
        expect(lines, `${path} ${viewport.width}px headline lines`).toEqual(['让元件库转换，', '顺手一点。']);
      } else {
        expect(lines.length, `${path} ${viewport.width}px headline line count`).toBeLessThanOrEqual(3);
      }
    }
  }
});

test('Lab model controls stay inside the visible stage at phone, tablet, and desktop widths', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/lab/', '/en/lab/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const bounds = await page.evaluate(() => {
        const stage = document.querySelector<HTMLElement>('[data-model-stage]');
        const controls = stage?.querySelector<HTMLElement>('.model-explode');
        if (!stage || !controls) return null;
        const stageRect = stage.getBoundingClientRect();
        const controlsRect = controls.getBoundingClientRect();
        return {
          stage: { top: stageRect.top, right: stageRect.right, bottom: stageRect.bottom, left: stageRect.left },
          controls: { top: controlsRect.top, right: controlsRect.right, bottom: controlsRect.bottom, left: controlsRect.left },
        };
      });
      expect(bounds).not.toBeNull();
      expect(bounds!.controls.top).toBeGreaterThanOrEqual(bounds!.stage.top);
      expect(bounds!.controls.right).toBeLessThanOrEqual(bounds!.stage.right);
      expect(bounds!.controls.bottom).toBeLessThanOrEqual(bounds!.stage.bottom);
      expect(bounds!.controls.left).toBeGreaterThanOrEqual(bounds!.stage.left);
    }
  }
});

test('Lab advanced-tools entry stays with the model and clear of the view switcher', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/lab/', '/en/lab/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const bounds = await page.evaluate(() => {
        const stage = document.querySelector<HTMLElement>('[data-model-stage]');
        const toggle = stage?.querySelector<HTMLElement>('[data-experiment-controls]');
        const switcher = stage?.querySelector<HTMLElement>('.artifact-switcher');
        if (!stage || !toggle || !switcher) return null;
        const rect = (element: HTMLElement) => {
          const { top, right, bottom, left } = element.getBoundingClientRect();
          return { top, right, bottom, left };
        };
        return { stage: rect(stage), toggle: rect(toggle), switcher: rect(switcher) };
      });
      expect(bounds).not.toBeNull();
      expect(bounds!.toggle.top).toBeGreaterThanOrEqual(bounds!.stage.top);
      expect(bounds!.toggle.right).toBeLessThanOrEqual(bounds!.stage.right);
      expect(bounds!.toggle.bottom).toBeLessThanOrEqual(bounds!.stage.bottom);
      expect(bounds!.toggle.left).toBeGreaterThanOrEqual(bounds!.stage.left);
      const overlaps = bounds!.toggle.left < bounds!.switcher.right &&
        bounds!.toggle.right > bounds!.switcher.left &&
        bounds!.toggle.top < bounds!.switcher.bottom &&
        bounds!.toggle.bottom > bounds!.switcher.top;
      expect(overlaps).toBe(false);
    }
  }
});

test('Lab story keeps a concise scroll runway across desktop and mobile', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const maxViewports = viewport.width <= 760 ? 2.9 : 3.3;
    for (const path of ['/lab/', '/en/lab/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const storyHeight = await page.locator('.motion-narrative').evaluate((element) =>
        element.getBoundingClientRect().height,
      );
      expect(storyHeight / viewport.height).toBeLessThanOrEqual(maxViewports);
    }
  }
});

test('mobile Lab controls keep the model open and reveal slice controls on demand', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const controls = await page.locator('.artifact-switcher').evaluate((switcher) => {
      const stage = switcher.closest('[data-model-stage]');
      const panel = stage?.querySelector('.model-explode');
      return {
        flexWrap: getComputedStyle(switcher).flexWrap,
        overflowX: getComputedStyle(switcher).overflowX,
        clientWidth: switcher.clientWidth,
        scrollWidth: switcher.scrollWidth,
        switcherHeight: switcher.getBoundingClientRect().height,
        sliceAxesDisplay: getComputedStyle(panel?.querySelector('.model-slice-axes') as Element).display,
        sliceRangeDisplay: getComputedStyle(panel?.querySelector('.model-slice-range') as Element).display,
      };
    });

    expect(controls.flexWrap).toBe('nowrap');
    expect(controls.overflowX).toBe('auto');
    expect(controls.scrollWidth).toBeGreaterThan(controls.clientWidth);
    expect(controls.switcherHeight).toBeLessThan(48);
    expect(controls.sliceAxesDisplay).toBe('none');
    expect(controls.sliceRangeDisplay).toBe('none');

    const stage = page.locator('[data-model-stage]');
    const sliceToggle = page.locator('.model-slice-toggle');
    await expect(stage).toHaveAttribute('data-controls-ready', 'true');
    await expect(stage).toHaveClass(/model-loaded/, { timeout: 20_000 });
    await expect(sliceToggle).toBeEnabled();
    await sliceToggle.click();
    await expect(sliceToggle).toHaveAttribute('aria-pressed', 'true');
    const expandedControls = await sliceToggle.evaluate((toggle) => {
      const panel = toggle.closest('.model-explode');
      return {
        sliceAxesDisplay: getComputedStyle(panel?.querySelector('.model-slice-axes') as Element).display,
        sliceRangeDisplay: getComputedStyle(panel?.querySelector('.model-slice-range') as Element).display,
      };
    });
    expect(expandedControls.sliceAxesDisplay).not.toBe('none');
    expect(expandedControls.sliceRangeDisplay).not.toBe('none');
  }
});

test('Lab loading guidance avoids repeating the same delivery facts', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.lab-facts')).toHaveCount(0);
    await expect(page.locator('.lab-intro')).toContainText(/首页不加载 CAD\/WASM|CAD\/WASM stays off the homepage/);
    await expect(page.locator('.lab-warning')).toContainText(/GLB 优先|GLB first/);
    await expect(page.locator('.lab-warning')).toContainText(/STEP\/WASM/);
  }
});

test('Lab loading guidance separates delivery sizes from fallback copy', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const warning = page.locator('.lab-warning');
    await expect(warning.locator('.lab-warning-heading strong')).toHaveText(/GLB 优先|GLB first/);
    await expect(warning.locator('.lab-warning-metrics')).toHaveCount(1);
    await expect(warning.locator('.lab-warning-metrics b')).toHaveText(['10.0 MB', '8.4 MB']);
    await expect(warning.locator('p')).toContainText(/STEP\/WASM/);
  }
});

test('Lab introductions explain the real geometry story in both languages', async ({ page }) => {
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-intro')).toContainText('真实 STEP 几何');
  await expect(page.locator('.lab-intro')).toContainText('GLB 交付模型');
  await expect(page.locator('.lab-intro')).toContainText('网格星图');
  await expect(page.locator('.lab-intro')).toContainText('剖面断层');
  await expect(page.locator('.lab-intro')).toContainText('拓扑视图');

  await page.goto('/en/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-intro')).toContainText('GLB');
  await expect(page.locator('.lab-intro')).toContainText('real STEP geometry');
  await expect(page.locator('.lab-intro')).toContainText('mesh, section, and topology views');
});

test('Lab pages clearly label the versioned release downloads page', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const link = page.locator('[data-release-link]');
    await expect(link).toHaveClass(/button-dark/);
    await expect(link).toHaveAttribute('href', /releases\/tag\/v3\.1\.13/);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noreferrer');
    await expect(link).toContainText(/v3\.1\.13 下载项|v3\.1\.13 downloads/);
  }
});

test('Formats and Cases CTAs clearly direct visitors to Release download options', async ({ page }) => {
  for (const path of ['/formats/', '/en/formats/', '/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const link = page.locator('.content-page-cta [data-release-link]');
    await expect(link).toHaveAttribute('href', /releases\/tag\/v3\.1\.13/);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noreferrer');
    await expect(link).toContainText(/v3\.1\.13 下载项|v3\.1\.13 downloads/);

    const copy = page.locator('.content-page-cta > div').first();
    await expect(copy).toContainText(/版本发布页选择安装包|release page/);
  }
});

test('320px Cases actions stay inside the viewport in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const path of ['/cases/', '/en/cases/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const layout = await page.evaluate(() => {
      const actions = document.querySelector<HTMLElement>('.case-studies-actions');
      if (!actions) return null;
      const links = Array.from(actions.children, (element) => {
        const { left, right, top, bottom } = element.getBoundingClientRect();
        return { left, right, top, bottom };
      });
      return { viewport: innerWidth, document: document.documentElement.scrollWidth, links };
    });

    expect(layout, `${path} should render its case actions`).not.toBeNull();
    expect(layout!.document, `${path} should not create page-level horizontal overflow`).toBeLessThanOrEqual(320);
    expect(layout!.links).toHaveLength(2);
    for (const link of layout!.links) {
      expect(link.left, `${path} action should stay inside the left viewport edge`).toBeGreaterThanOrEqual(0);
      expect(link.right, `${path} action should stay inside the right viewport edge`).toBeLessThanOrEqual(320);
    }
  }
});

test('Format actions stay inside their content column at narrow mobile widths', async ({ page }) => {
  for (const width of [320, 360]) {
    await page.setViewportSize({ width, height: 740 });
    for (const path of ['/formats/', '/en/formats/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const layout = await page.evaluate(() => {
        const actions = document.querySelector<HTMLElement>('.format-matrix-actions');
        if (!actions) return null;
        const { left, right } = actions.getBoundingClientRect();
        const links = Array.from(actions.children, (element) => {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            clientWidth: (element as HTMLElement).clientWidth,
            scrollWidth: (element as HTMLElement).scrollWidth,
          };
        });
        return {
          viewport: innerWidth,
          document: document.documentElement.scrollWidth,
          container: { left, right, clientWidth: actions.clientWidth, scrollWidth: actions.scrollWidth },
          links,
        };
      });

      expect(layout, `${path} should render format actions at ${width}px`).not.toBeNull();
      expect(layout!.document, `${path} should not create page-level overflow at ${width}px`).toBeLessThanOrEqual(width);
      expect(layout!.container.scrollWidth, `${path} action row should fit its content column at ${width}px`).toBeLessThanOrEqual(layout!.container.clientWidth);
      expect(layout!.links).toHaveLength(2);
      for (const link of layout!.links) {
        expect(link.left, `${path} action should remain inside its content column at ${width}px`).toBeGreaterThanOrEqual(layout!.container.left - 1);
        expect(link.right, `${path} action should remain inside its content column at ${width}px`).toBeLessThanOrEqual(layout!.container.right + 1);
        expect(link.scrollWidth, `${path} action text should not be clipped at ${width}px`).toBeLessThanOrEqual(link.clientWidth);
      }

      if (width === 320 && path === '/en/formats/') {
        expect(layout!.links[1].top, 'the English release link should wrap below the primary CTA when needed').toBeGreaterThanOrEqual(layout!.links[0].bottom - 1);
      }
      if (width === 360) {
        expect(layout!.links[1].top, `${path} actions should remain on one row when they fit`).toBeLessThan(layout!.links[0].bottom);
      }
    }
  }
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

test('reduced-motion Lab keeps the model stage below its heading in every render view', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.route('**/assets/model/**', (route) => route.abort());
  await page.route('**/assets/vendor/**', (route) => route.abort());

  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/lab/', '/en/lab/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const stage = page.locator('[data-model-stage]');
      for (const view of ['model', 'atlas', 'tomogram', 'oracle', 'trinity', 'morph']) {
        await stage.evaluate((element, artifactView) => {
          element.dataset.artifactView = artifactView;
        }, view);
        const layout = await page.evaluate(() => {
          const heading = document.querySelector('.motion-heading')!.getBoundingClientRect();
          const model = document.querySelector('[data-model-stage]')!.getBoundingClientRect();
          return { headingBottom: heading.bottom, modelTop: model.top, modelLeft: model.left, modelRight: model.right };
        });
        expect(layout.modelTop, `${path} ${viewport.width}px ${view} should follow its heading`).toBeGreaterThanOrEqual(layout.headingBottom - 1);
        expect(layout.modelLeft, `${path} ${viewport.width}px ${view} should remain in the viewport`).toBeGreaterThanOrEqual(-1);
        expect(layout.modelRight, `${path} ${viewport.width}px ${view} should remain in the viewport`).toBeLessThanOrEqual(viewport.width + 1);

        if (view === 'model') {
          const controls = await page.evaluate(() => {
            const stage = document.querySelector('[data-model-stage]')!.getBoundingClientRect();
            const switcher = document.querySelector('.artifact-switcher')!.getBoundingClientRect();
            const dock = document.querySelector('.model-controls-dock')!.getBoundingClientRect();
            return {
              switcherInsideStage: switcher.top >= stage.top - 1 && switcher.bottom <= stage.bottom + 1,
              dockInsideStage: dock.top >= stage.top - 1 && dock.bottom <= stage.bottom + 1,
              controlsOverlap: switcher.left < dock.right && switcher.right > dock.left && switcher.top < dock.bottom && switcher.bottom > dock.top,
            };
          });
          expect(controls.switcherInsideStage, `${path} ${viewport.width}px view switcher should stay inside its model stage`).toBe(true);
          expect(controls.dockInsideStage, `${path} ${viewport.width}px model controls should stay inside their stage`).toBe(true);
          expect(controls.controlsOverlap, `${path} ${viewport.width}px view switcher and model controls should not overlap`).toBe(false);
        }
      }
    }
  }

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
    const titles = html.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) || [];
    expect(titles, `${path} should expose exactly one document title`).toHaveLength(1);
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:image"');
    expect(html).toContain('rel="icon"');
  }
});
