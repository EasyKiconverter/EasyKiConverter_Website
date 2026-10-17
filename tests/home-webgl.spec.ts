import { expect, test } from '@playwright/test';

test('homepage lazily renders and scroll-assembles the real multipart model with reduced-motion and fallback paths', async ({ page }) => {
  const modelRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('easyki-conversion-story.glb')) modelRequests.push(request.url());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const viewport = page.locator('.conversion-model-viewport');
  await expect(page.locator('[data-conversion-canvas]')).toBeAttached();
  expect(modelRequests).toHaveLength(0);

  const rail = page.locator('[data-story-rail]');
  const { top, runway, stickyTop } = await rail.evaluate((element) => {
    const scene = element.querySelector<HTMLElement>('[data-conversion-scene]')!;
    return {
      top: element.getBoundingClientRect().top + window.scrollY,
      runway: element.getBoundingClientRect().height - scene.getBoundingClientRect().height,
      stickyTop: Number.parseFloat(getComputedStyle(scene).top),
    };
  });
  await page.evaluate(({ top, stickyTop, runway }) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: top - stickyTop + runway * 0.1, behavior: 'instant' });
  }, { top, stickyTop, runway });
  await expect(viewport).toHaveAttribute('data-webgl-ready', 'true');
  await expect(viewport).toHaveAttribute('data-part-count', '303');
  expect(modelRequests).toHaveLength(1);

  for (const [progress, expectedSeparation] of [[0, 0], [0.5, 1], [1, 0]] as const) {
    await page.evaluate(({ top, stickyTop, runway, progress }) => {
      window.scrollTo({ top: top - stickyTop + runway * progress, behavior: 'instant' });
    }, { top, stickyTop, runway, progress });
    await expect(viewport).toHaveAttribute('data-part-separation', expectedSeparation.toFixed(3));
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(viewport).toHaveAttribute('data-part-separation', '0.000');
  await page.evaluate(({ top, stickyTop, runway }) => {
    window.scrollTo({ top: top - stickyTop + runway * 0.5, behavior: 'instant' });
  }, { top, stickyTop, runway });
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
  const fallbackRailTop = await page.locator('[data-story-rail]').evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((railTop) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: railTop - 100, behavior: 'instant' });
  }, fallbackRailTop);
  await expect.poll(() => fallbackViewport.getAttribute('data-webgl-error')).toBe('true');
  await expect(fallbackViewport.locator('img')).toHaveCSS('opacity', '1');
  expect(modelRequests).toHaveLength(2);
});
