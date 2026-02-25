#!/bin/bash
# End-of-session save and push script
# Usage: ./save.sh "optional message"

cd "$(dirname "$0")"

MSG="${1:-Session update $(date '+%Y-%m-%d %H:%M')}"

git add -A
git diff --cached --quiet && echo "Nothing to commit — already up to date." && exit 0

git commit -m "$MSG"
git push && echo "✓ Pushed to GitHub successfully."
