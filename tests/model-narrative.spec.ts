import { expect, test } from '@playwright/test';
import { temporalGhostDepth } from '../src/js/model-narrative';

test('temporal model echoes trail behind past geometry and lead future geometry', () => {
  expect(temporalGhostDepth('past')).toBeLessThan(0);
  expect(temporalGhostDepth('present')).toBe(0);
  expect(temporalGhostDepth('future')).toBeGreaterThan(0);
});
