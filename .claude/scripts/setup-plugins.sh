#!/usr/bin/env bash
# SessionStart hook：只在雲端 session 依 .claude/plugins.list 安裝 marketplace 與 plugin。
set -u
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

LIST="$(cd "$(dirname "$0")/.." && pwd)/plugins.list"
SRC_DIR="$HOME/.claude-mod-sources"
mkdir -p "$SRC_DIR"

while read -r kind a b; do
  case "$kind" in
    marketplace)
      dest="$SRC_DIR/$(basename "$a" .git)"
      if [ -d "$dest/.git" ]; then git -C "$dest" pull -q --ff-only || true
      else git clone -q --depth 1 "$a" "$dest" || { echo "clone failed: $a" >&2; continue; }
      fi
      claude plugin marketplace add "$dest/${b:-.}" >/dev/null 2>&1 || true ;;
    plugin)
      claude plugin install "$a" --scope user >/dev/null 2>&1 || echo "install failed: $a" >&2 ;;
  esac
done < <(grep -vE '^\s*(#|$)' "$LIST")
exit 0
