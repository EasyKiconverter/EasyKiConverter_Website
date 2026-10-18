import { expect, test } from '@playwright/test';

test('homepage renders and scroll-assembles the real multipart model with reduced-motion and fallback paths', async ({ page }) => {
  const modelRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('easyki-conversion-story.glb')) modelRequests.push(request.url());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const viewport = page.locator('.conversion-model-viewport');
  await expect(page.locator('[data-conversion-canvas]')).toBeAttached();
  expect(modelRequests).toHaveLength(1);

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
  expect(modelRequests).toHaveLength(1);

  for (const [progress, expectedSeparation] of [[0, 0], [1 / 3, 1], [2 / 3, 0.36], [1, 0]] as const) {
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
    await expect(viewport).toHaveAttribute('data-displaced-part-count', expectedSeparation === 0 ? '0' : '302');
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
  expect(modelRequests).toHaveLength(2);
});
