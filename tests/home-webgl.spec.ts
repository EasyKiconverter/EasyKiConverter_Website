import { expect, test } from '@playwright/test';

test('homepage renders and scroll-assembles the real multipart model with reduced-motion and fallback paths', async ({ page }) => {
  const modelRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('easyki-conversion-story.glb')) modelRequests.push(request.url());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const viewport = page.locator('.conversion-model-viewport');
  await expect(page.locator('[data-conversion-canvas]')).toBeAttached();
  await expect.poll(() => modelRequests.length, { timeout: 15_000 }).toBe(1);

  const rail = page.locator('[data-story-rail]');
  const initialTarget = await rail.evaluate((element) => {
    const scene = element.querySelector<HTMLElement>('[data-conversion-scene]')!;
    const cards = [...element.querySelectorAll<HTMLElement>('.story-card')];
    const first = cards[0].getBoundingClientRect();
    const firstCenter = first.top + window.scrollY + first.height / 2;
    const sceneBox = scene.getBoundingClientRect();
    const sceneCenter = (Number.parseFloat(getComputedStyle(scene).top) || 0) + sceneBox.height / 2;
    const phone = window.innerWidth < 600;
    const landscape = window.innerWidth >= 600 && window.innerWidth <= 850 && window.innerHeight <= 500;
    const anchor = sceneCenter + (phone ? sceneBox.height / 2 + 150 : landscape ? sceneBox.height / 2 + 155 : 0);
    return firstCenter - anchor;
  });
  await page.evaluate((target) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: target, behavior: 'instant' });
  }, initialTarget);
  await expect(viewport).toHaveAttribute('data-webgl-ready', 'true');
  await expect(viewport).toHaveAttribute('data-part-count', '303');
  await expect(viewport).toHaveAttribute('data-moving-part-count', '302');
  await expect(viewport).toHaveAttribute('data-protagonist-contact-count', '56');
  const physicalProtagonistScale = await viewport.evaluate((element) =>
    Number(element.dataset.protagonistScale) * Number(element.dataset.modelSourceSpanMm),
  );
  expect(physicalProtagonistScale).toBeCloseTo(2.3, 2);
  expect(Number(await viewport.getAttribute('data-camera-zoom'))).toBeCloseTo(7 / 54.077, 3);
  expect(modelRequests).toHaveLength(1);

  for (const [progress, expectedSeparation, expectedVisual, expectedDisplaced, expectedTransition] of [
    [0, 0, 'rp2040-package', '0', 0],
    [1 / 3, 1, 'rp2040-package', '57', 0],
    [2 / 3, 0.36, 'rp2040-package', '57', 0],
    [0.84, 0.169, 'component-to-board-transition', '57', 0.5],
    [1, 0, 'illustrative-board-context', '0', 1],
  ] as const) {
    const target = await rail.evaluate((element, progress) => {
      const scene = element.querySelector<HTMLElement>('[data-conversion-scene]')!;
      const cards = [...element.querySelectorAll<HTMLElement>('.story-card')];
      const first = cards[0].getBoundingClientRect();
      const last = cards[cards.length - 1].getBoundingClientRect();
      const firstCenter = first.top + window.scrollY + first.height / 2;
      const lastCenter = last.top + window.scrollY + last.height / 2;
      const sceneBox = scene.getBoundingClientRect();
      const sceneCenter = (Number.parseFloat(getComputedStyle(scene).top) || 0) + sceneBox.height / 2;
      const phone = window.innerWidth < 600;
      const landscape = window.innerWidth >= 600 && window.innerWidth <= 850 && window.innerHeight <= 500;
      const anchor = sceneCenter + (phone ? sceneBox.height / 2 + 150 : landscape ? sceneBox.height / 2 + 155 : 0);
      return firstCenter - anchor + (lastCenter - firstCenter) * progress;
    }, progress);
    await page.evaluate((scrollTarget) => {
      window.scrollTo({ top: scrollTarget, behavior: 'instant' });
    }, target);
    await expect(viewport).toHaveAttribute('data-part-separation', expectedSeparation.toFixed(3));
    await expect(viewport).toHaveAttribute('data-active-visual', expectedVisual);
    await expect(viewport).toHaveAttribute('data-displaced-part-count', expectedDisplaced);
    await expect(viewport).toHaveAttribute('data-active-part-count', expectedVisual === 'illustrative-board-context' ? '303' : '57');
    await expect(viewport).toHaveAttribute('data-transition-progress', expectedTransition.toFixed(3));
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(viewport).toHaveAttribute('data-part-separation', '0.000');
  const reducedMotionTarget = await rail.evaluate((element) => {
    const scene = element.querySelector<HTMLElement>('[data-conversion-scene]')!;
    const cards = [...element.querySelectorAll<HTMLElement>('.story-card')];
    const first = cards[0].getBoundingClientRect();
    const last = cards[cards.length - 1].getBoundingClientRect();
    const firstCenter = first.top + window.scrollY + first.height / 2;
    const lastCenter = last.top + window.scrollY + last.height / 2;
    const sceneBox = scene.getBoundingClientRect();
    const sceneCenter = (Number.parseFloat(getComputedStyle(scene).top) || 0) + sceneBox.height / 2;
    const phone = window.innerWidth < 600;
    const landscape = window.innerWidth >= 600 && window.innerWidth <= 850 && window.innerHeight <= 500;
    const anchor = sceneCenter + (phone ? sceneBox.height / 2 + 150 : landscape ? sceneBox.height / 2 + 155 : 0);
    return firstCenter - anchor + (lastCenter - firstCenter) * 0.5;
  });
  await page.evaluate((scrollTarget) => {
    window.scrollTo({ top: scrollTarget, behavior: 'instant' });
  }, reducedMotionTarget);
  await page.waitForTimeout(100);
  await expect(viewport).toHaveAttribute('data-part-separation', '0.000');
  await expect(viewport).toHaveAttribute('data-active-visual', 'rp2040-package');
  const reducedMotionFinalTarget = await rail.evaluate((element) => {
    const scene = element.querySelector<HTMLElement>('[data-conversion-scene]')!;
    const cards = [...element.querySelectorAll<HTMLElement>('.story-card')];
    const first = cards[0].getBoundingClientRect();
    const last = cards[cards.length - 1].getBoundingClientRect();
    const firstCenter = first.top + window.scrollY + first.height / 2;
    const lastCenter = last.top + window.scrollY + last.height / 2;
    const sceneBox = scene.getBoundingClientRect();
    const sceneCenter = (Number.parseFloat(getComputedStyle(scene).top) || 0) + sceneBox.height / 2;
    const phone = window.innerWidth < 600;
    const landscape = window.innerWidth >= 600 && window.innerWidth <= 850 && window.innerHeight <= 500;
    const anchor = sceneCenter + (phone ? sceneBox.height / 2 + 150 : landscape ? sceneBox.height / 2 + 155 : 0);
    return firstCenter - anchor + (lastCenter - firstCenter);
  });
  await page.evaluate((scrollTarget) => window.scrollTo({ top: scrollTarget, behavior: 'instant' }), reducedMotionFinalTarget);
  await expect(viewport).toHaveAttribute('data-active-visual', 'illustrative-board-context');
  await expect(viewport).toHaveAttribute('data-part-separation', '0.000');

  const contextLossSupported = await viewport.locator('canvas').evaluate((canvas) => {
    const context = canvas.getContext('webgl2');
    const extension = context?.getExtension('WEBGL_lose_context');
    extension?.loseContext();
    return Boolean(extension);
  });
  expect(contextLossSupported).toBe(true);
  await expect(viewport).toHaveAttribute('data-webgl-error', 'true');
  await expect(viewport).not.toHaveAttribute('data-webgl-ready', 'true');
  await expect(viewport.locator('img')).toHaveCSS('opacity', '1');
  await expect(page.locator('.conversion-scene-note-fallback')).toBeVisible();

  await page.route('**/easyki-conversion-story.glb', (route) => route.abort());
  await page.reload({ waitUntil: 'domcontentloaded' });
  const fallbackViewport = page.locator('.conversion-model-viewport');
  const fallbackTarget = await page.locator('[data-story-rail]').evaluate((element) => {
    const scene = element.querySelector<HTMLElement>('[data-conversion-scene]')!;
    const card = element.querySelector<HTMLElement>('.story-card')!;
    const cardBox = card.getBoundingClientRect();
    const cardCenter = cardBox.top + window.scrollY + cardBox.height / 2;
    const sceneBox = scene.getBoundingClientRect();
    const sceneCenter = (Number.parseFloat(getComputedStyle(scene).top) || 0) + sceneBox.height / 2;
    const phone = window.innerWidth < 600;
    const landscape = window.innerWidth >= 600 && window.innerWidth <= 850 && window.innerHeight <= 500;
    const anchor = sceneCenter + (phone ? sceneBox.height / 2 + 150 : landscape ? sceneBox.height / 2 + 155 : 0);
    return cardCenter - anchor;
  });
  await page.evaluate((scrollTarget) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: scrollTarget, behavior: 'instant' });
  }, fallbackTarget);
  await expect.poll(() => fallbackViewport.getAttribute('data-webgl-error')).toBe('true');
  await expect(fallbackViewport.locator('img')).toHaveCSS('opacity', '1');
  await expect(page.locator('.conversion-scene-note-fallback')).toBeVisible();
  expect(modelRequests).toHaveLength(2);
});

test('mobile WebGL keeps the RP2040 package visible at its board-relative scale', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const viewport = page.locator('.conversion-model-viewport');
  await expect(viewport).toHaveAttribute('data-webgl-ready', 'true');

  const rail = page.locator('[data-story-rail]');
  const target = await rail.evaluate((element) => {
    const scene = element.querySelector<HTMLElement>('[data-conversion-scene]')!;
    const cards = [...element.querySelectorAll<HTMLElement>('.story-card')];
    const first = cards[0].getBoundingClientRect();
    const last = cards[cards.length - 1].getBoundingClientRect();
    const firstCenter = first.top + window.scrollY + first.height / 2;
    const lastCenter = last.top + window.scrollY + last.height / 2;
    const sceneBox = scene.getBoundingClientRect();
    const sceneCenter = (Number.parseFloat(getComputedStyle(scene).top) || 0) + sceneBox.height / 2;
    const anchor = sceneCenter + sceneBox.height / 2 + 150;
    return firstCenter - anchor + (lastCenter - firstCenter) * 0.5;
  });
  await page.evaluate((scrollTarget) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: scrollTarget, behavior: 'instant' });
  }, target);

  await expect(viewport).toHaveAttribute('data-active-visual', 'rp2040-package');
  const geometry = await page.locator('[data-conversion-canvas]').evaluate((canvas) => {
    const bounds = canvas.getBoundingClientRect();
    const scene = canvas.closest<HTMLElement>('[data-conversion-scene]')!.getBoundingClientRect();
    return { bounds: bounds.toJSON(), scene: scene.toJSON() };
  });
  expect(geometry.bounds.width).toBeGreaterThan(200);
  expect(geometry.bounds.left).toBeGreaterThanOrEqual(geometry.scene.left - 1);
  expect(geometry.bounds.right).toBeLessThanOrEqual(geometry.scene.right + 1);
  expect(Number(await viewport.getAttribute('data-camera-zoom'))).toBeCloseTo(7 / 54.077, 3);
});
