import { expect, test } from '@playwright/test';
import { temporalGhostDepth, temporalGhostOpacity } from '../src/js/model-narrative';

test('temporal model echoes trail behind past geometry and lead future geometry', () => {
  expect(temporalGhostDepth('past')).toBeLessThan(0);
  expect(temporalGhostDepth('present')).toBe(0);
  expect(temporalGhostDepth('future')).toBeGreaterThan(0);
});

test('temporal wireframe echoes stay subtle enough to preserve surface detail', () => {
  expect(temporalGhostOpacity('past', 0)).toBe(0.06);
  expect(temporalGhostOpacity('present', 0.5)).toBe(0.012);
  expect(temporalGhostOpacity('future', 1)).toBe(0.07);
  for (const track of ['past', 'present', 'future'] as const) {
    expect(temporalGhostOpacity(track, 0.5)).toBeLessThanOrEqual(0.07);
    expect(temporalGhostOpacity(track, -1)).toBe(temporalGhostOpacity(track, 0));
    expect(temporalGhostOpacity(track, 2)).toBe(temporalGhostOpacity(track, 1));
  }
});
