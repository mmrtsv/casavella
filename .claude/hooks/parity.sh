#!/bin/sh
# Stop hook: Claude can't finish while the Android app is behind Maite web (android/tools/parity.mjs).
# Once per stop: if it already sent Claude back, it lets it finish and the next stop checks again.
input=$(cat)
case "$input" in *'"stop_hook_active":true'*) exit 0 ;; esac
cd "$(dirname "$0")/../.." || exit 0
out=$(node android/tools/parity.mjs 2>&1) && exit 0
printf 'The Android app is behind Maite web. Port these to android/ (or list the commit in android/parity-skip.txt with the reason), then build and release the APK as android/README.md says:\n%s\n' "$out" >&2
exit 2
