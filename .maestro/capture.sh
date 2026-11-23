#!/bin/bash
# Usage: .maestro/capture.sh <device-udid-or-serial> <phase> <name>
#   e.g. .maestro/capture.sh 6C681EF1-... before iphone-17-pro-max-en-light
# Runs capture.yaml, moves the screenshots to .maestro/out/<phase>/<name>/,
# deletes the repeated frames at the bottom of each tab and Maestro's own run
# folders (disk space is tight).
set -euo pipefail
DEVICE="$1"; PHASE="$2"; NAME="$3"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$PATH:$HOME/.maestro/bin"
cd "$ROOT"

# The same clock and full bars on every shot, so two frames of the same place are
# identical and comparable across runs. iOS simulator = a UDID.
IOS=false
if [[ "$DEVICE" =~ ^[0-9A-F-]{36}$ ]]; then
  IOS=true
  xcrun simctl status_bar "$DEVICE" override --time "9:41" \
    --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4
else
  # Android: the System UI demo mode does the same (clock 9:41, full bars, no notifications).
  ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb -s $DEVICE"
  $ADB shell settings put global sysui_demo_allowed 1
  demo() { $ADB shell am broadcast -a com.android.systemui.demo -e command "$@" >/dev/null; }
  demo enter
  demo clock -e hhmm 0941
  demo battery -e level 100 -e plugged false
  demo network -e wifi show -e level 4 -e mobile show -e level 4
  demo notifications -e visible false
fi

restore() { if $IOS; then xcrun simctl status_bar "$DEVICE" clear; else demo exit; fi; }
if ! maestro --device "$DEVICE" test -e OUT=shot .maestro/capture.yaml > /tmp/maestro-capture.log 2>&1; then
  restore
  grep -E "FAILED|not found|Assertion" /tmp/maestro-capture.log | head -5
  echo "Maestro failed – full log /tmp/maestro-capture.log, debug files in ~/.maestro/tests/"
  exit 1
fi
restore

RUN="$(ls -td "$HOME"/.maestro/tests/*/ | head -1)"
DEST="$ROOT/.maestro/out/$PHASE/$NAME"
rm -rf "$DEST"; mkdir -p "$DEST"
find "$RUN" -path "*takeScreenshot/shot/*.png" -exec mv {} "$DEST"/ \;
rm -rf "$HOME"/.maestro/tests/*

# A frame that looks like the one before it in the same tab = the bottom was reached.
python3 "$ROOT/.maestro/dedupe.py" "$DEST"

echo "$(ls "$DEST" | wc -l | tr -d ' ') screenshots in .maestro/out/$PHASE/$NAME"
