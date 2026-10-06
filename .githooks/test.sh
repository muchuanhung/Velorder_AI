#!/usr/bin/env bash
# git hooks 測試：在暫存 repo 逐一驗證 pre-commit、commit-msg、pre-push。用法：bash .githooks/test.sh
set -u
HOOKS="$(cd "$(dirname "$0")" && pwd)"
. "$HOOKS/config"

# 隔離外部的 git 身分設定，每個案例自己指定。
unset GIT_CONFIG_PARAMETERS GIT_CONFIG_COUNT GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
export HOME="$(mktemp -d)" GIT_CONFIG_NOSYSTEM=1

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP" "$HOME"' EXIT
git init -q --bare "$TMP/remote.git"
git init -q -b main "$TMP/work"
cd "$TMP/work"
git config core.hooksPath "$HOOKS"
git config commit.gpgsign false
git config user.name "$EXPECTED_NAME"
git config user.email "$EXPECTED_EMAIL"
git remote add origin "$TMP/remote.git"

pass=0 fail=0
expect() { # expect <ok|reject> <說明> <指令...>
  local want=$1 desc=$2; shift 2
  if "$@" >/dev/null 2>&1; then got=ok; else got=reject; fi
  if [ "$got" = "$want" ]; then pass=$((pass + 1)); echo "  ✓ $desc"
  else fail=$((fail + 1)); echo "  ✗ $desc（預期 $want，實際 $got）"; fi
}
n=0
commit_msg() { n=$((n + 1)); echo "$n" > f.txt; git add f.txt; git commit -q -m "$1"; }
commit_as() { n=$((n + 1)); echo "$n" > f.txt; git add f.txt; env "$@" git commit -q -m "test $n"; }

echo "pre-commit：身分"
expect ok     "正確身分可以 commit"            commit_msg "init"
expect reject "author email 錯誤"              commit_as GIT_AUTHOR_EMAIL=someone@else.com
expect reject "author 名字錯誤"                commit_as GIT_AUTHOR_NAME=Claude
expect reject "committer email 錯誤"           commit_as GIT_COMMITTER_EMAIL=noreply@anthropic.com
git reset -q --hard

echo "commit-msg：AI 署名"
expect reject "Co-Authored-By: Claude"         commit_msg $'feat: x\n\nCo-Authored-By: Claude Opus <noreply@anthropic.com>'
expect reject "co-authored-by 小寫、Copilot"   commit_msg $'feat: x\n\nco-authored-by: Copilot <copilot@github.com>'
expect reject "Claude-Session 尾註"            commit_msg $'feat: x\n\nClaude-Session: https://claude.ai/code/session_abc'
expect reject "Generated with Claude Code"     commit_msg $'feat: x\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)'
expect reject "只有 session 連結"              commit_msg $'feat: x\n\nhttps://claude.ai/code/session_abc'
expect ok     "人類 co-author 可以"            commit_msg $'feat: x\n\nCo-Authored-By: Alice Chen <alice@example.com>'
expect ok     "內文提到 claude 字樣可以"       commit_msg "docs: 說明 claude/ 分支命名"
git reset -q --hard

echo "pre-push：branch 前綴"
expect reject "bot/x"                          git push -q origin HEAD:bot/x
expect reject "refs/heads/bot/x 寫法"          git push -q origin HEAD:refs/heads/bot/x
expect reject "ai-fix（- 分隔）"               git push -q origin HEAD:ai-fix
expect reject "codex/x"                        git push -q origin HEAD:codex/x
expect ok     "claude/ 放行（雲端 session）"   git push -q origin HEAD:claude/determined-bohr-x
expect ok     "feat/x"                         git push -q origin HEAD:feat/x
expect ok     "名稱中間含 ai 不擋：feat/ai-x"  git push -q origin HEAD:feat/ai-x

echo
echo "結果：$pass 通過，$fail 失敗"
[ "$fail" -eq 0 ]
