import { expect, test } from '@playwright/test';
import { narrativeModelRotation, narrativeRotationTravel, temporalGhostDepth, temporalGhostOpacity } from '../src/js/model-narrative';

test('mobile story rotation keeps the library-build view angled toward component detail', () => {
  const initialAngle = 0.22;
  const libraryBuildAngle = 3.1;
  const mobileAngle = narrativeModelRotation(initialAngle, libraryBuildAngle, 390);

  expect(narrativeRotationTravel(760)).toBe(0.3);
  expect(mobileAngle).toBeLessThan((70 * Math.PI) / 180);
  expect(narrativeRotationTravel(761)).toBeGreaterThan(0.3);
  expect(narrativeRotationTravel(761)).toBeLessThan(narrativeRotationTravel(768));
  expect(narrativeRotationTravel(1280)).toBe(1);
  expect(narrativeModelRotation(initialAngle, libraryBuildAngle, 1440)).toBe(libraryBuildAngle);
});

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
