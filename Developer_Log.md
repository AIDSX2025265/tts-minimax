# TTS 配音网站开发者日志 - 2026年3月

## 2026-03-10

### 🔧 环境与配置

*   **接入新模型**: 尝试接入 `benyue` (gpt-5.4) 模型，但因 Gateway 服务重启问题和 OpenClaw 工具限制，暂时搁置，并切换回 `minimax-cn/MiniMax-M2.5`。
*   **飞书环境变量**: 将 `auth/route.ts` 中硬编码的 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 替换为环境变量。

### ✨ 功能更新

*   **MiniMax API Keys**: 将 `tts/route.ts` 中硬编码的 `MINIMAX_API_KEY` 和 `MINIMAX_GROUP_ID` 替换为环境变量。
*   **飞书多维表格积分管理**:
    *   修复了 `feishu_bitable_update_record` 工具的 `FieldNameNotFound` 问题 (通过直接使用 `curl` 调用 API，并使用字段名而非字段 ID)。
    *   **已将所有现有用户的积分设定为 10000。**
    *   **已创建管理员账号 `test@example.com` (密码: `password123`) 并设定 10000 积分。**
    *   网站积分逻辑已确认，每次消耗都会实时查询飞书多维表格的存量并扣除。

### 📚 文档

*   **开发存档**: 生成并上传 `TTS_Development_Archive_20260310.md` 至飞书文档。

### 🐞 Bug 修复与问题解决

*   解决了 `feishu_bitable_update_record` 工具的 `FieldNameNotFound` 问题（通过 `curl` 直接调用 API）。
*   解决了飞书文档 `write` / `append` API 对复杂 Markdown 内容的写入限制（通过拆分内容逐块追加）。
*   协助大师兄确认 Vercel 环境变量配置（MiniMax API Key/Group ID, Feishu App ID/Secret）。

### 🚀 部署与发布

*   代码已推送到 GitHub (`AIDSX2025265/tts-minimax`)，触发 Vercel 自动部署。

### ✅ 待办事项

*   **网站功能测试**: 大师兄确认网站 `www.dsx365.online` 的各项功能 (TTS 生成、积分扣除、管理员登录) 是否正常。
*   **音色列表确认**: 确认前端 `page.tsx` 中 `VOICES` 数组是否需要增加新的音色。
*   **Vercel 项目可见性**: `minimax-ttspro` 仍需大师兄在 Vercel Dashboard 手动设置为公开 (如果尚未完成)。
