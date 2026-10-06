# Claude Code mod 清單與本機測試計畫

2026-10-06 在雲端 session 實測 5 個 mod。結論：雲端 session 只適合純背景 hook 的 mod；有畫面的 mod（面板、提示列、按鈕）要在本機 Claude Code（終端機或桌面版 Code 分頁）測。repo 已移除雲端自動安裝 mod 的機制（`.claude/plugins.list`、`setup-plugins.sh`），要用 mod 照下方指令手動裝。

## 雲端實測結果

| mod | 來源 marketplace | 類型 | 雲端結果 | 後續 |
|---|---|---|---|---|
| check-ledger 0.1.0 | LeeHigma0201/claude-code-mods | 背景記錄＋MCP 工具 | ✅ 正確記錄 PASS/FAIL 與檢查後改過的檔案 | 可保留。限制：用整條指令的 exit code 判定，`\| tail`、`; echo` 結尾時失敗也記成 PASS |
| house-rules 0.2.0 | WilsonKinyua/claude-mods | 改寫／擋指令 | ⚠️ 擋 email、改 AI 前綴 branch、刪 Co-Authored-By 都生效，但有 2 個 bug | 已由 `.githooks/` 取代，不帶到公司 |
| blast-radius 0.1.0 | anthropics/claude-code-playground（`claude-code/mods`） | 暫停等確認＋面板 | ❌ 判定高風險正確，但沒暫停，`rm -rf` 直接執行 | 本機測 |
| replay-theater 0.1.0 | 同上 | 提示列＋面板 | ❌ 畫面沒出現 | 本機測 |
| token-weather 0.1.0 | 同上 | 提示列 | ❌ 畫面沒出現 | 本機測 |

house-rules 的 bug：
1. 多行 commit 訊息中間有署名時，會把該行之後的指令一起刪掉，造成引號不成對、整條指令失敗。
2. `git push origin HEAD:refs/heads/bot/x` 能繞過 branch 前綴檢查。

另外：house-rules 與 check-ledger 是 claude.ai 帳號層級同步安裝的，不在本 repo；要停用 house-rules 得從帳號的 plugin 設定關掉。

## 本機安裝

```bash
claude plugin marketplace add LeeHigma0201/claude-code-mods
claude plugin install check-ledger@claude-code-mods

git clone --depth 1 https://github.com/anthropics/claude-code-playground.git ~/claude-code-playground
claude plugin marketplace add ~/claude-code-playground/claude-code/mods
claude plugin install blast-radius@claude-code-playground-mods
claude plugin install replay-theater@claude-code-playground-mods
claude plugin install token-weather@claude-code-playground-mods
```

裝完重開 Claude Code。公司電腦先確認 IT 是否允許第三方 plugin；裝前讀過 `hooks/` 原始碼。

## 本機驗收清單

在暫存資料夾測，不要拿真的專案刪檔。

- [ ] **blast-radius**：建 `build/` 放幾個檔，叫 Claude 跑 `rm -rf build`。預期跳出面板列出要刪的檔案；按 Cancel 檔案還在、Claude 回報被拒；再跑一次按 Proceed 才刪掉。另測 `git reset --hard`（有未提交修改時）。
- [ ] **replay-theater**：叫 Claude 改同一個檔 2～3 次。預期該輪結束後提示列上方出現「▶ Replay: N edits」，`/replay` 或按 r 開面板，Prev／Next 能逐步看 diff。
- [ ] **token-weather**：開新 session 後提示列上方出現「☀ Clear xx% of context」；讀幾個大檔後百分比與圖示會變。
- [ ] **check-ledger**：跑 `pnpm test:unit` 後打 `/evidence`，狀態列應顯示 `✓`；之後改一個檔，應出現「1 files unchecked」。

## 候選（未測）

- **git-gates**（bahaospanov/skills，L3）：未經本 session 授權擋 commit/push/merge、拒推已合併 branch。會呼叫模型與註冊工具，裝前要讀碼。

## 已改用 git hooks 的規則

身分、AI 署名、AI 前綴 branch 改由 `.githooks/` 強制，不依賴 mod，換電腦只要 `git config core.hooksPath .githooks`。規則改 `.githooks/config`，驗證跑 `bash .githooks/test.sh`。
