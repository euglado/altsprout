#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
npm ci --ignore-scripts
npm run check
npm run setup
npm run register
printf '%s\n' 'Ready / Hazır. Run: bash start.sh'
