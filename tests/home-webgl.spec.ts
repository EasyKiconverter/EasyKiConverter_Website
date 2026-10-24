import { expect, test } from '@playwright/test';

const storyScrollTarget = (page: import('@playwright/test').Page, progress: number) =>
  page.locator('[data-story-rail]').evaluate((rail, progress) => {
    const cards = [...rail.querySelectorAll<HTMLElement>('.story-card')];
    const headerBottom = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
    const anchor = Math.max(80, Math.min(window.innerHeight - 80, headerBottom + Math.min(156, Math.max(120, (window.innerHeight - headerBottom) * 0.22))));
    const centers = cards.map((card) => {
      const rect = card.getBoundingClientRect();
      return rect.top + window.scrollY + rect.height / 2;
    });
    const position = Math.max(0, Math.min(1, progress)) * Math.max(0, centers.length - 1);
    const index = Math.min(Math.floor(position), Math.max(0, centers.length - 2));
    const fraction = position - index;
    const center = centers.length < 2 ? (centers[0] ?? window.scrollY) : centers[index] + (centers[index + 1] - centers[index]) * fraction;
    return center - anchor;
  }, progress);

test('homepage renders and scroll-assembles the real multipart model with reduced-motion and fallback paths', async ({ page }) => {
  const modelRequests: string[] = [];
  const geometryErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /BufferGeometry\.(computeBoundingBox|computeBoundingSphere).*NaN/.test(message.text())) {
      geometryErrors.push(message.text());
    }
  });
  page.on('request', (request) => {
    if (request.url().endsWith('easyki-conversion-story.glb')) modelRequests.push(request.url());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const viewport = page.locator('.conversion-model-viewport');
  await expect(page.locator('[data-conversion-canvas]')).toBeAttached();
  await expect.poll(() => modelRequests.length, { timeout: 15_000 }).toBe(1);

  const rail = page.locator('[data-story-rail]');
  const initialTarget = await storyScrollTarget(page, 0);
  await page.evaluate((target) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: target, behavior: 'instant' });
  }, initialTarget);
  await expect(viewport).toHaveAttribute('data-webgl-ready', 'true');
  await expect(viewport).toHaveAttribute('data-part-count', '303');
  await expect(viewport).toHaveAttribute('data-moving-part-count', '302');
  await expect(viewport).toHaveAttribute('data-protagonist-contact-count', '56');
  expect(geometryErrors).toEqual([]);
  const physicalProtagonistScale = await viewport.evaluate((element) => Number(element.dataset.protagonistScale) * Number(element.dataset.modelSourceSpanMm));
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
    const target = await storyScrollTarget(page, progress);
    await page.evaluate((scrollTarget) => {
      window.scrollTo({ top: scrollTarget, behavior: 'instant' });
    }, target);
    await expect.poll(async () => Number(await viewport.getAttribute('data-part-separation'))).toBeCloseTo(expectedSeparation, 2);
    await expect(viewport).toHaveAttribute('data-active-visual', expectedVisual);
    await expect(viewport).toHaveAttribute('data-displaced-part-count', expectedDisplaced);
    await expect(viewport).toHaveAttribute('data-active-part-count', expectedVisual === 'illustrative-board-context' ? '303' : '57');
    await expect.poll(async () => Number(await viewport.getAttribute('data-transition-progress'))).toBeCloseTo(expectedTransition, 2);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(viewport).toHaveAttribute('data-part-separation', '0.000');
  const reducedMotionTarget = await storyScrollTarget(page, 0.5);
  await page.evaluate((scrollTarget) => {
    window.scrollTo({ top: scrollTarget, behavior: 'instant' });
  }, reducedMotionTarget);
  await expect.poll(() => page.evaluate((scrollTarget) => Math.abs(window.scrollY - scrollTarget), reducedMotionTarget)).toBeLessThan(2);
  await expect.poll(() => rail.evaluate((element) => Number.parseFloat(getComputedStyle(element).getPropertyValue('--story-progress')))).toBeCloseTo(0.5, 1);
  await expect(viewport).toHaveAttribute('data-part-separation', '0.000');
  await expect(viewport).toHaveAttribute('data-active-visual', 'rp2040-package');
  const reducedMotionFinalTarget = await storyScrollTarget(page, 1);
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
  const fallbackTarget = await storyScrollTarget(page, 0);
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
  const target = await storyScrollTarget(page, 0.5);
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

test('tablet story stages keep the transformed model clear of complete cards and viewport edges', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 760 });

  for (const [path, stages] of [
    ['/', ['input', 'prepare', 'convert', 'use']],
    ['/en/', ['input', 'prepare', 'convert', 'use']],
  ] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const viewport = page.locator('.conversion-model-viewport');
    await expect(viewport).toHaveAttribute('data-webgl-ready', 'true', {
      timeout: 20_000,
    });
    const rail = page.locator('[data-story-rail]');

    for (const [index, progress] of [0, 1 / 3, 2 / 3, 1].entries()) {
      const target = await storyScrollTarget(page, progress);
      await page.evaluate((scrollTarget) => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo({ top: scrollTarget, behavior: 'instant' });
      }, target);
      await expect(page.locator('[data-conversion-scene]')).toHaveAttribute('data-stage', stages[index]);
      await expect
        .poll(() => rail.evaluate((element) => Number.parseFloat(getComputedStyle(element).getPropertyValue('--story-progress'))))
        .toBeCloseTo(progress, 2);

      const layout = await page.evaluate(() => {
        const scene = document.querySelector<HTMLElement>('[data-conversion-scene]')!;
        const board = scene.querySelector<HTMLElement>('.conversion-scene-board')!;
        const canvas = scene.querySelector<HTMLCanvasElement>('[data-conversion-canvas]')!;
        const card = document.querySelector<HTMLElement>('.story-card[data-active]')!;
        const caption = [...board.querySelectorAll<HTMLElement>('figcaption span')];
        const activeLayerName = {
          input: 'input',
          prepare: 'parts',
          convert: 'output',
          use: 'use',
        }[scene.dataset.stage || 'input'];
        const activeLayer = scene.querySelector<HTMLElement>(`.conversion-${activeLayerName}-layer`)!;
        const rect = (element: Element) => {
          const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
          return { left, right, top, bottom, width, height };
        };
        const canvasRect = rect(canvas);
        const hitSamples = Array.from({ length: 13 }, (_, row) =>
          Array.from({ length: 13 }, (_, column) => {
            const x = canvasRect.left + ((column + 0.5) * canvasRect.width) / 13;
            const y = canvasRect.top + ((row + 0.5) * canvasRect.height) / 13;
            const hit = document.elementFromPoint(x, y);
            return !hit?.closest('.story-card');
          }),
        ).flat();
        const captionContentFits = caption.every((element) => element.scrollWidth <= element.clientWidth);

        return {
          scene: rect(scene),
          board: rect(board),
          canvas: canvasRect,
          card: rect(card),
          caption: caption.map(rect),
          captionContentFits,
          activeLayer: {
            ...rect(activeLayer),
            display: getComputedStyle(activeLayer).display,
            visibility: getComputedStyle(activeLayer).visibility,
          },
          hitSamples,
          viewport: { width: innerWidth, height: innerHeight },
        };
      });

      const inside = (inner: (typeof layout)['canvas'], outer: (typeof layout)['scene']) =>
        inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
      const overlaps = (a: (typeof layout)['card'], b: (typeof layout)['scene']) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

      expect(inside(layout.board, layout.scene), `${path} ${stages[index]} transformed board stays within the scene`).toBe(true);
      expect(inside(layout.canvas, layout.board), `${path} ${stages[index]} transformed model canvas stays within its board`).toBe(true);
      expect(layout.card.left, `${path} ${stages[index]} full story card stays inside the viewport`).toBeGreaterThanOrEqual(0);
      expect(layout.card.right, `${path} ${stages[index]} full story card stays inside the viewport`).toBeLessThanOrEqual(layout.viewport.width);
      expect(layout.card.top, `${path} ${stages[index]} full story card stays inside the viewport`).toBeGreaterThanOrEqual(0);
      expect(layout.card.bottom, `${path} ${stages[index]} story card clears the sticky stage`).toBeLessThanOrEqual(layout.scene.top);
      expect(layout.scene.top, `${path} ${stages[index]} sticky stage starts within the viewport`).toBeGreaterThanOrEqual(0);
      expect(layout.scene.bottom, `${path} ${stages[index]} sticky stage leaves a bottom safety margin`).toBeLessThanOrEqual(layout.viewport.height - 8);
      expect(layout.caption).toHaveLength(2);
      for (const [captionIndex, caption] of layout.caption.entries()) {
        expect(caption.left, `${path} ${stages[index]} caption ${captionIndex} fits the transformed board`).toBeGreaterThanOrEqual(layout.board.left - 1);
        expect(caption.right, `${path} ${stages[index]} caption ${captionIndex} fits the transformed board`).toBeLessThanOrEqual(layout.board.right + 1);
      }
      expect(overlaps(layout.canvas, layout.card), `${path} ${stages[index]} story card does not cover the model`).toBe(false);
      expect(layout.activeLayer.display, `${path} ${stages[index]} floating card stays out of the tablet model area`).toBe('none');
      expect(layout.captionContentFits, `${path} ${stages[index]} caption text is not clipped`).toBe(true);
      expect(layout.hitSamples, `${path} ${stages[index]} dense hit grid keeps the transformed model unobstructed`).toEqual(
        Array.from({ length: 13 * 13 }, () => true),
      );
    }
  }
});
