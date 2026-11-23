#!/bin/bash
# Usage: .maestro/pick.sh <device-udid-or-serial> "<row text in Settings>"
#   e.g. .maestro/pick.sh 6C681EF1-... "Dark Mode"     (switch themes while in English)
#        .maestro/pick.sh 6C681EF1-... "Deutsch"       (language names never change)
# Taps the first row in Settings containing the text, then goes back to Home.
# (Maestro reads a row as one label with its description – hence ".*text.*".)
# Why a script and not one flow with `-e PICK=…`: that did not work here (with an
# `env:` default the selector stayed empty, tapped the Notifications row and raised
# the system permission prompt, which Maestro cannot dismiss – only a simulator
# reboot cleared it). Writing the text into the flow avoids the question.
set -euo pipefail
DEVICE="$1"; TEXT="$2"
[[ -n "$TEXT" ]] || { echo "empty row text"; exit 1; }
export PATH="$PATH:$HOME/.maestro/bin"
FLOW="$(mktemp -t maestro-pick).yaml"
SWIPE='- swipe:
    start: "50%,50%"
    end: "50%,90%"
    duration: 300'
cat > "$FLOW" <<EOF
appId: com.petrturek.selfrise
---
- tapOn:
    point: "90%,94%"
- waitForAnimationToEnd
$SWIPE
$SWIPE
$SWIPE
$SWIPE
$SWIPE
$SWIPE
$SWIPE
$SWIPE
- scrollUntilVisible:
    element: ".*$TEXT.*"
    direction: DOWN
- tapOn: ".*$TEXT.*"
- waitForAnimationToEnd
- tapOn:
    text: "OK"
    optional: true
- tapOn:
    point: "10%,94%"
- waitForAnimationToEnd
EOF
maestro --device "$DEVICE" test "$FLOW" 2>&1 | grep -E "FAILED|Tap on \"" || true
rm -f "$FLOW"
