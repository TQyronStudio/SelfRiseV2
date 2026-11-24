/**
 * The window layer must paint ABOVE every onboarding layer (review 2026-11-24):
 * React Native stacks siblings by zIndex (iOS) / elevation (Android), not by
 * order. The onboarding waits for its first trophy window to be closed — under
 * the takeover nobody could close it and the form froze for 2 minutes.
 */
import fs from 'fs';
import path from 'path';

it('WINDOW_LAYER_Z is higher than any zIndex / elevation in the onboarding', () => {
  const { WINDOW_LAYER_Z } = require('../windowLayer');
  const dir = path.join(__dirname, '../../components/onboarding');
  const values: number[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!/\.tsx?$/.test(file)) continue;
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const m of text.matchAll(/(?:zIndex|elevation):\s*(\d+)/g)) values.push(Number(m[1]));
  }
  expect(values.length).toBeGreaterThan(0);
  expect(WINDOW_LAYER_Z).toBeGreaterThan(Math.max(...values));
});
