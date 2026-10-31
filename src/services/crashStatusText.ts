/**
 * Plain-language readout of the Crashlytics state, for the crash test in
 * Settings (EXPO_PUBLIC_ENABLE_CRASH_TEST=true). English on purpose: it is a
 * developer tool, like the marketing demo section.
 *
 * Import-free so the verdict logic is tested without any native module.
 */
export interface CrashStatusInput {
  moduleAvailable: boolean;
  enabledAtLaunch: boolean | null;
  requestedThisSession: boolean | null;
  crashedOnPreviousExecution: boolean | null;
}

const onOff = (value: boolean | null): string => (value === null ? 'unknown' : value ? 'ON' : 'OFF');
const yesNo = (value: boolean | null): string => (value === null ? 'unknown' : value ? 'yes' : 'no');

/** Can a forced crash be expected to show up in the Firebase console right now? */
export function isReadyForTestCrash(status: CrashStatusInput, developmentSession: boolean): boolean {
  return status.moduleAvailable && status.enabledAtLaunch === true && !developmentSession;
}

export function describeCrashStatus(status: CrashStatusInput, developmentSession: boolean): string {
  const lines = [
    `Native module: ${status.moduleAvailable ? 'present' : 'MISSING'}`,
    `Collection at launch: ${onOff(status.enabledAtLaunch)}`,
    `Requested this session: ${onOff(status.requestedThisSession)}`,
    `Crashed on previous run: ${yesNo(status.crashedOnPreviousExecution)}`,
    `Development session: ${developmentSession ? 'yes' : 'no'}`,
    '',
  ];

  if (!status.moduleAvailable) {
    lines.push('NOT READY: this binary has no Crashlytics module (Expo Go, or built before it was added).');
  } else if (developmentSession) {
    lines.push(
      'NOT READY: this is a development session, so Crashlytics is switched off. ' +
        'Set EXPO_PUBLIC_ANALYTICS_IN_DEV=true in .env, restart npm start, open the app twice, then check again.'
    );
  } else if (status.enabledAtLaunch !== true) {
    lines.push(
      'NOT READY: collection was OFF when the app launched. On iOS the setting applies from the NEXT ' +
        'launch — close the app completely, open it again and check this screen once more. If it stays OFF ' +
        'after two launches, crash reporting is not being switched on (report this).'
    );
  } else {
    lines.push(
      'READY: collection was ON at launch. Force a crash, reopen the app, wait a few minutes and look ' +
        'in Firebase → Crashlytics.'
    );
  }
  return lines.join('\n');
}
