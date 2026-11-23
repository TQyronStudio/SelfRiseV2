# Maestro – before/after screenshots (design migration)

Flows that walk the app's main screens and take a screenshot of each, so every migration stage can be
compared with the state before it (`design-migration-plan.md`, E0 step 2). Screenshots go to
`.maestro/out/<phase>/<device-lang-theme>/` (gitignored – large and machine-specific).

## Files

| File | What it does |
|---|---|
| `setup-ios.yaml` | Fresh iOS simulator → open the dev build against Metro, system dialogs by position, then `setup-common` |
| `setup-android.yaml` | Same for the Android emulator (**not yet run end to end** – the Pixel was set up step by step) |
| `setup-common.yaml` | Consent, language, theme, reminders, onboarding (one habit, one goal), then `demo-data` |
| `demo-data.yaml` | (Re)loads the marketing demo data in the app's current language – dated from today |
| `gen-capture.py` | Writes `capture.yaml` – shots per tab are set there (generous, so the iPhone SE reaches the bottom) |
| `capture.yaml` | GENERATED – fresh demo data, then the walk through the five tabs |
| `capture.sh` | Runs the walk, fixes the status bar (9:41, full bars – iOS and Android), moves the shots to `out/`, calls `dedupe.py` |
| `dedupe.py` | Deletes repeated frames at the bottom of each tab (ignores the flashing scroll bar; needs Pillow) |
| `pick.sh` | Taps a row in Settings by its text – theme (`"Dark Mode"`, in English) or language (`"Deutsch"`, `"Español"`, `"English"`) |
| `sheet.py` | Contact sheet: a whole run side by side in one image (for looking and comparing) |

## Run (from the repo root)

    .maestro/capture.sh <udid-or-serial> before iphone-se-en-light
    .maestro/pick.sh <udid> "Dark Mode" && .maestro/capture.sh <udid> before iphone-17-pro-max-en-dark
    python3 .maestro/sheet.py .maestro/out/before/iphone-se-en-light /tmp/sheet.png

After a migration stage use the phase `after-E<n>` with the same names and compare the two sheets.
Put the device back afterwards (`pick.sh … "Light Mode"`, `"English"`).

Prerequisites: Metro running (`script -q .metro.log npm start`, or `CI=1 npx expo start --dev-client >
.metro.log`), the app installed (EAS `development-simulator` build for iOS, `development` APK for Android),
setup done, dev menu "Tools button" and performance monitor **off** (they would be in every screenshot).

## Devices (little disk space and RAM – ONE running at a time)

| Device | Id | State 2026-11-23 |
|---|---|---|
| iPhone SE (3rd gen) | `3040D29C-2E1B-4872-A99A-5D9EAF7577CA` | set up (EN, light); "before": EN light (25) |
| iPhone 17 Pro Max | `6C681EF1-003E-4360-B710-B152E3A4625D` | set up (EN, light); "before": EN light, EN dark, DE light, ES light (18 each) |
| Android Pixel 7 (AVD `Pixel_7`) | `emulator-5554` | set up (EN, light); "before": EN light (23) |

Shut the previous device down before booting the next: `xcrun simctl shutdown all`, `adb emu kill`.
Open the app on a simulator with `xcrun simctl openurl <udid> "exp+selfrisev2://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"`.
Start the emulator **with a window** (`emulator -avd Pixel_7 -no-audio -no-boot-anim`) – headless it
barely redraws. Then `adb reverse tcp:8081 tcp:8081`. The debug app needs ~5 minutes to start there.

## Gotchas learned

- Maestro does not see iOS **system** dialogs (open-in-app, tracking, notifications) and cannot tap them,
  not even by position. Never tap the Notifications row in Settings – its prompt stayed even after an app
  restart; only `xcrun simctl shutdown` + `boot` cleared it.
- Maestro reads a Settings row as one label with its description: match `".*Dark Mode.*"`, not `"Dark Mode"`.
- `-e NAME=…` variables did not get into text selectors here – `pick.sh` writes the text into the flow.
- Tabs remember their scroll. Scroll to the top with swipes that **start at 50 %**: higher up, Goals has
  fixed buttons over its list (on the iPhone SE a swipe from 30 % never moved it).
- Wait for the next screen (`extendedWaitUntil`) before tapping a button with the same text again
  ("Confirm" on language and theme) – a slow device otherwise taps the old screen twice.
- Text matches are regex and match titles too: tap "Delete my data.*", not ".*load demo.*".
- The demo data are dated from the day they are loaded – a run on another day without reloading shows
  different journal entries. `capture.yaml` therefore reloads them first.
- On a fresh Android install the dev menu can stay open under the app's first dialogs and swallow taps;
  the red dev error toast at the bottom also catches taps (close it with "Dismiss").
- Android emulator startup logs "Service initialization failed: … timeout" – a slow machine; the retry
  succeeds. Not seen on a phone.
- The Journal walk (4 shots) does not reach the end of the long entry list – the cards repeat, on purpose.
