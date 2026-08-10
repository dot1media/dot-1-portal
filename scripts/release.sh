#!/usr/bin/env bash
set -euo pipefail

# Bump the app version, tag it in git, and push. Usage:
#   npm run release          -> patch  (1.0.0 -> 1.0.1)
#   npm run release:minor    -> minor  (1.0.1 -> 1.1.0)
#   npm run release:major    -> major  (1.1.0 -> 2.0.0)

BUMP="${1:-patch}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [ -n "$(git status --porcelain)" ]; then
  echo "You have uncommitted changes. Commit them first, then run release:"
  git status --short
  exit 1
fi

# npm version updates package.json, makes a commit, and creates a git tag.
npm version "$BUMP" -m "release v%s"

git push origin "$BRANCH" --follow-tags

echo "Released v$(node -p "require('./package.json').version") and pushed to '$BRANCH'."
echo "Vercel will build and deploy this version automatically."
