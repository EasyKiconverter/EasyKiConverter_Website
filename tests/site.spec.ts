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
  await expect(page.locator('#formats')).toContainText('其他目标格式的可用范围');
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
  await expect(page.locator('.format-matrix-actions .text-link')).toHaveText(/阅读当前发布页/);
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
    await expect(page.locator('.format-matrix-actions .button-dark')).toHaveAttribute('href', /cases/);
    await expect(page.locator('.format-matrix-actions .text-link')).toHaveAttribute('href', /releases\/tag\/v3\.1\.13/);
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

test('format matrix explains tested output artifacts and links each row to main-project evidence', async ({ page }) => {
  for (const [path, outputs, linkLabel] of [
    ['/formats/', ['.kicad_sym', 'SchLib + PcbLib', 'XML 符号库', '.lplib', '.pool 符号数据'], '查看仓库测试'],
    ['/en/formats/', ['.kicad_sym', 'SchLib + PcbLib', 'XML symbol library', '.lplib', '.pool symbol data'], 'Open repository test'],
  ] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const artifacts = page.locator('.format-artifacts-cell');
    await expect(artifacts).toHaveCount(11);
    for (const output of outputs) await expect(page.locator('.format-table-wrap')).toContainText(output);
    await expect(artifacts.first().locator('a')).toContainText(linkLabel);
    await expect(artifacts.first().locator('a')).toHaveAttribute('href', /test_parallel_export_cancellation\.cpp$/);
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

test('bilingual pages share the base brand tokens with the accessibility layer', async ({ page }) => {
  for (const path of ['/', '/en/', '/formats/', '/en/formats/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => ({
      muted: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim(),
      violet: getComputedStyle(document.documentElement).getPropertyValue('--violet').trim(),
    }))).toEqual({ muted: '#746f66', violet: '#6f61d8' });
  }
});

test('bilingual workbench captions preserve the same product evidence', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.app-window > img')).toHaveAttribute('alt', /BOM/);
  await expect(page.locator('.app-window figcaption')).toContainText('resources/imgs/screenshot1.png');
  await expect(page.locator('.showcase-proof-items')).toContainText('添加元件');
  await expect(page.locator('.showcase-proof-items')).toContainText('导入 BOM');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.app-window > img')).toHaveAttribute('alt', /BOM import and export settings/);
  await expect(page.locator('.app-window figcaption')).toContainText('resources/imgs/screenshot1.png');
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
  await expect(page.locator('.hero-lede')).toContainText('KiCad and Altium');
  await expect(page.locator('.hero-lede')).toContainText('symbols, footprints, and 3D models');
});

test('English homepage keeps product section labels concrete', async ({ page }) => {
  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.product-showcase .kicker')).toHaveText('THE REAL WORKBENCH');
  await expect(page.locator('#workflow .kicker')).toHaveText('A SMALL WORKFLOW');
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

test('download cards show the actual Release asset architectures', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const chineseLinks = page.locator('.download-links > a');
  await expect(chineseLinks).toHaveCount(8);
  await expect(chineseLinks.nth(0)).toContainText('x86_64 安装包');
  await expect(chineseLinks.nth(1)).toContainText('arm64 安装包');
  expect((await chineseLinks.locator('span').allTextContents()).join(' ')).not.toContain('installer');

  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  const englishLinks = page.locator('.download-links > a');
  await expect(englishLinks).toHaveCount(8);
  await expect(englishLinks.nth(0)).toContainText('x86_64 installer');
  for (const label of ['arm64 installer', 'x86_64 AppImage', 'amd64 DEB', 'aarch64 AppImage', 'Apple Silicon DMG', 'Intel DMG']) {
    await expect(englishLinks.filter({ hasText: label })).toHaveCount(1);
  }
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
  expect(edgeMeshes).toBeGreaterThan(96);
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

test('Lab asset guidance matches the generated delivery path', async ({ page }) => {
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lab-warning')).toContainText('10.0 MB');
  await expect(page.locator('.lab-warning')).toContainText('8.4 MB');
  await expect(page.locator('.lab-warning')).toContainText('STEP/WASM');
});

test('Lab artifact switcher updates the active view and delivery copy', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const stage = page.locator('[data-model-stage]');
    await expect(stage).toHaveAttribute('data-model-source', 'glb', { timeout: 20000 });
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
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const switcher = page.locator('.artifact-switcher');
      await switcher.scrollIntoViewIfNeeded();
      await expect(switcher).toBeVisible();
      const geometry = await page.evaluate(() => {
        const stageElement = document.querySelector<HTMLElement>('[data-model-stage]');
        const switcherElement = document.querySelector<HTMLElement>('.artifact-switcher');
        if (!stageElement || !switcherElement) return null;
        const stageRect = stageElement.getBoundingClientRect();
        const switcherRect = switcherElement.getBoundingClientRect();
        return { stageHeight: stageRect.height, stageTop: stageRect.top, switcherTop: switcherRect.top };
      });
      expect(geometry).not.toBeNull();
      expect(geometry!.switcherTop - geometry!.stageTop).toBeLessThan(geometry!.stageHeight * 0.25);
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
    await sliceToggle.evaluate((toggle: HTMLButtonElement) => { toggle.disabled = false; });
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
  await expect(page.locator('.lab-intro')).toContainText('GLB delivery model');
  await expect(page.locator('.lab-intro')).toContainText('real STEP geometry');
  await expect(page.locator('.lab-intro')).toContainText('mesh atlas');
  await expect(page.locator('.lab-intro')).toContainText('section tomogram');
  await expect(page.locator('.lab-intro')).toContainText('topology views');
});

test('Lab pages expose a direct bilingual stable-download path', async ({ page }) => {
  for (const path of ['/lab/', '/en/lab/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const link = page.locator('[data-release-link]');
    await expect(link).toHaveClass(/button-dark/);
    await expect(link).toHaveAttribute('href', /releases\/tag\/v3\.1\.13/);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noreferrer');
    await expect(link).toContainText(/下载稳定版 v3\.1\.13|Download stable v3\.1\.13/);
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
