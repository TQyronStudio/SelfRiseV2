/**
 * Frame probe for the lab (kolo 27): after an action it watches both threads for a
 * few seconds and prints ONE line to the Metro log, e.g.
 *   [LabPerf] goal log — UI: 298 frames, worst 41 ms, 3 over 25 ms · JS: 140 frames,
 *   worst 96 ms, 5 over 25 ms
 * UI drops = what the eye sees (animations, scrolling). JS drops = taps and React
 * work wait, native animations do not. Facts instead of "it feels choppy".
 *
 * Results are read on the UI thread and sent over: a shared value must never be
 * read from JS (lesson 45). Idle unless measuring.
 *
 * GOING LIVE: do NOT port — a development tool.
 */
import { useEffect } from 'react';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

const WINDOW_MS = 2500;
const HITCH_MS = 25;

type Start = (label: string) => void;
let start: Start | null = null;

/** Measure the next few seconds. No-op outside the lab screen. */
export function measureLabPerf(label: string) {
  start?.(label);
}

/** Mounted once by the lab screen. */
export function LabPerfProbe() {
  const frames = useSharedValue(0);
  const worst = useSharedValue(0);
  const hitches = useSharedValue(0);
  const callback = useFrameCallback(info => {
    'worklet';
    const dt = info.timeSincePreviousFrame;
    if (dt === null) return;
    frames.value += 1;
    if (dt > worst.value) worst.value = dt;
    if (dt > HITCH_MS) hitches.value += 1;
  }, false);

  useEffect(() => {
    let running = false;
    start = label => {
      if (running) return;
      running = true;
      frames.value = 0;
      worst.value = 0;
      hitches.value = 0;
      callback.setActive(true);

      let jsFrames = 0;
      let jsWorst = 0;
      let jsHitches = 0;
      const startedAt = performance.now();
      let last = startedAt;
      const tick = (now: number) => {
        const dt = now - last;
        last = now;
        jsFrames += 1;
        if (dt > jsWorst) jsWorst = dt;
        if (dt > HITCH_MS) jsHitches += 1;
        if (now - startedAt < WINDOW_MS) {
          requestAnimationFrame(tick);
          return;
        }
        callback.setActive(false);
        const report = (ui: number, uiWorst: number, uiHitches: number) => {
          running = false;
          console.log(
            `[LabPerf] ${label} — UI: ${ui} frames, worst ${Math.round(uiWorst)} ms, ` +
              `${uiHitches} over ${HITCH_MS} ms · JS: ${jsFrames} frames, ` +
              `worst ${Math.round(jsWorst)} ms, ${jsHitches} over ${HITCH_MS} ms`
          );
        };
        scheduleOnUI(() => {
          'worklet';
          scheduleOnRN(report, frames.value, worst.value, hitches.value);
        });
      };
      requestAnimationFrame(tick);
    };
    return () => {
      start = null;
    };
  }, [callback, frames, worst, hitches]);

  return null;
}
