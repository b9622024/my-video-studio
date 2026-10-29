#!/usr/bin/env bash
# Full upstream checkout + official skill link; no system/package changes.
set -euo pipefail
HUASHU_COMMIT=52467f99c602b76ba86d511d37acdfe93fa1e16e
HUASHU_REMOTE=https://github.com/alchaincyf/huashu-motion.git
TASK_ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
HUASHU_DIR="$TASK_ROOT/.runtime/huashu-motion"
HUASHU_LINK="$TASK_ROOT/.agents/skills/huashu-motion"
node -e 'if(+process.versions.node.split(".")[0]<22)process.exit(1)'
command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null
mkdir -p "$TASK_ROOT/.runtime" "$TASK_ROOT/.agents/skills"
if [[ ! -d "$HUASHU_DIR/.git" ]]; then
  [[ ! -e "$HUASHU_DIR" ]] || { echo 'Refusing to replace an existing non-git install' >&2; exit 1; }
  git clone "$HUASHU_REMOTE" "$HUASHU_DIR"
fi
[[ "$(git -C "$HUASHU_DIR" remote get-url origin)" == "$HUASHU_REMOTE" ]] || { echo 'Unexpected upstream; refusing to modify' >&2; exit 1; }
if [[ "$(git -C "$HUASHU_DIR" rev-parse HEAD)" != "$HUASHU_COMMIT" ]]; then
  [[ -z "$(git -C "$HUASHU_DIR" status --porcelain)" ]] || { echo 'Local upstream edits exist; refusing checkout' >&2; exit 1; }
  git -C "$HUASHU_DIR" fetch origin "$HUASHU_COMMIT"
  git -C "$HUASHU_DIR" checkout --detach "$HUASHU_COMMIT"
fi
for file in skills/huashu-motion/SKILL.md skills/huashu-motion/bin/om cli/om.js runtime/om-engine.js; do
  [[ -f "$HUASHU_DIR/$file" ]] || { echo "Missing $file" >&2; exit 1; }
done
for folder in runtime templates studio examples fonts; do test -d "$HUASHU_DIR/$folder"; done
if [[ -e "$HUASHU_LINK" && ! -L "$HUASHU_LINK" ]]; then
  echo 'Existing skill directory retained; move it to a backup before linking full checkout' >&2; exit 1
fi
ln -sfn ../../.runtime/huashu-motion/skills/huashu-motion "$HUASHU_LINK"
OM_CHROME="${OM_CHROME:-$(command -v chromium || command -v google-chrome || command -v chromium-browser || true)}" "$HUASHU_LINK/bin/om" doctor
printf 'Skill: %s\nCLI: %s\nSource commit: %s\n' "$HUASHU_LINK" "$HUASHU_LINK/bin/om" "$HUASHU_COMMIT"
echo 'Doctor detects executables only; run official still/render separately with supported platform permissions.'
