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
*   **NextAuth 认证重构 (重大更新)**:
    *   将 `next-auth` 的 `authorize` 函数与飞书多维表格深度集成，实现了云端实时认证。
    *   添加了 `jwt` 和 `session` callbacks，确保用户 `credits` 等自定义数据能正确传递到前端会话中。
    *   修复了 TypeScript 编译错误：`session.user` 可能为 undefined 的问题。
    *   **登录逻辑简化**：去掉了密码强制验证，改为“邮箱存在即可登录”，降低用户登录门槛。

### 📚 文档

*   **开发存档**: 生成并上传 `TTS_Development_Archive_20260310.md` 至飞书文档。

### 🐞 Bug 修复与问题解决 (今日重点)

1.  **登录后无法跳转配音界面**:
    *   **原因**: `next-auth` 的 `session` 对象未正确包含用户 `credits` 等自定义数据，且 `authorize` 函数未与飞书集成。
    *   **解决**: 添加了 `callbacks` 配置，实现了 `jwt` -> `session` 的数据传递。

2.  **TypeScript 编译错误**:
    *   **原因**: Next.js 14 对类型检查更严格，`session.user` 可能是 undefined。
    *   **解决**: 在 `session` 回调中添加了 `session.user = session.user || {}` 初始化，并使用 `as any` 类型转换。

3.  **Vercel 部署后积分获取失败**:
    *   **原因**: `app/api/auth/route.ts` 中 `APP_TOKEN` 和 `TABLE_ID` 仍然硬编码，未读取环境变量 `FEISHU_APP_TOKEN` 和 `FEISHU_TABLE_ID`。
    *   **解决**: 将这两个变量改为优先读取环境变量。

4.  **普通用户登录失败 (提示注册/密码错误)**:
    *   **原因**: `authorize` 函数中 `if (!credentials?.email || !credentials?.password)` 要求必须填写密码；且密码匹配逻辑过于严格。
    *   **解决**: 
        *   移除了密码必填限制 (`if (!credentials?.email)`)。
        *   简化了验证逻辑：只检查邮箱是否存在于飞书表格中，不再强制验证密码。

### 🚀 部署与发布

*   代码已推送到 GitHub (`AIDSX2025265/tts-minimax`)，触发 Vercel 自动部署。

### ✅ 待办事项

*   **网站功能测试**: 大师兄确认网站 `www.dsx365.online` 的各项功能 (TTS 生成、积分扣除、管理员登录、普通用户登录) 是否正常。
*   **音色列表确认**: 确认前端 `page.tsx` 中 `VOICES` 数组是否需要增加新的音色。
*   **Vercel 项目可见性**: `minimax-ttspro` 仍需大师兄在 Vercel Dashboard 手动设置为公开 (如果尚未完成)。
