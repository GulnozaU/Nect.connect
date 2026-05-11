#!/bin/sh
# Regenerate public/demo_YC-S26.mp4 from demo_YC-S26.mov (macOS avconvert, stream copy).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
avconvert -s "$ROOT/demo_YC-S26.mov" -o "$ROOT/public/demo_YC-S26.mp4" -p PresetPassthrough --replace
