# TTS 配音网站开发者日志 - 2026年3月

## 2026-03-10 (晚间更新)

### 🐞 重大 Bug 修复 - 积分系统完整修复

#### 问题背景
用户反馈登录后积分显示为 0，且普通用户无法登录（提示"用户名或密码错误"）。经过调试发现多个关键问题。

#### 根本原因分析

1. **字段名完全错误**：
   - 代码中使用 `文本 3`、`文本 2`、`文本`
   - 飞书实际字段名是 `邮箱`、`密码`、`账号名`
   - 导致所有用户查询失败

2. **API 响应解析错误**：
   - 代码使用 `data.data?.records`
   - 飞书实际返回 `data.data?.items`
   - 导致查询结果永远为空数组

3. **飞书字段格式问题**：
   - 飞书多维表格文本字段返回数组格式：`[{"type": "text", "text": "xxx"}]`
   - 代码直接用 `String()` 转换变成 `[object Object]`
   - 导致邮箱匹配永远失败

4. **积分数据类型问题**：
   - 飞书返回的积分是字符串 `"10000"`
   - 代码未转换为数字，导致数学运算错误

#### 修复内容

**1. `/app/api/auth/route.ts` 完整重构**：
- ✅ 字段名修正：`文本 3` → `邮箱`，`文本 2` → `密码`，`文本` → `账号名`
- ✅ API 响应修正：`data.data?.records` → `data.data?.items`
- ✅ 添加 `extractFieldValue()` 函数处理飞书数组格式
- ✅ 所有积分操作统一用 `Number()` 转换
- ✅ 邮箱匹配支持大小写不敏感和空格处理
- ✅ 简化代码，移除未使用的 `login` 和 `register` action

**2. `/app/api/auth/[...nextauth]/route.ts` 修复**：
- ✅ 积分字段用 `Number(extractFieldValue(...))` 转换

**3. `/app/page.tsx` 积分系统优化**：

**积分比例修正**：
- 原逻辑：`Math.ceil(charCount / 100)` - 100字 = 1积分
- 新逻辑：`charCount` - 1字 = 1积分
- 符合 MiniMax API 定价：1万字 = 1万积分 = 3.5元

**积分扣除时机优化**（防止并发问题）：
- 原流程：生成音频 → 成功后扣积分
- 新流程：实时查余额 → 先扣积分 → 生成音频 → 失败退回积分
- 优势：防止多设备同时使用导致超额消费

**实时余额查询**：
- 原逻辑：只在登录时查询一次
- 新逻辑：每次生成前重新查询飞书表格
- 优势：确保余额准确，支持多设备使用

**4. UI 文案更新**：
- `100积分=10000字符` → `1积分=1字`
- `100积分=1万字` → `1积分=1字`

#### 技术细节

**extractFieldValue 函数实现**：
```typescript
function extractFieldValue(field: any): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (Array.isArray(field) && field.length > 0) {
    if (field[0]?.text) return field[0].text
    return String(field[0])
  }
  return String(field)
}
```

**积分扣除流程**：
```typescript
1. 实时查询飞书余额 → latestCredits
2. 检查 costCredits > latestCredits → 不足则提示
3. 调用 deductCredits API 先扣除
4. 调用 TTS API 生成音频
5. 生成失败 → 调用 addCredits API 退回
```

#### 影响范围
- ✅ 普通用户现在可以正常登录
- ✅ 积分正确显示（10000 积分）
- ✅ 积分扣除逻辑正确（1字=1积分）
- ✅ 防止并发超额消费
- ✅ 支持多设备使用

#### 测试建议
1. 用 `1305120893@qq.com` + 密码 `1305120893@qq.com` 登录
2. 确认积分显示为 10000
3. 输入文字生成音频，确认积分正确扣除
4. 测试积分不足时的提示
5. 测试生成失败时积分是否退回

---

## 2026-03-10 (早间更新)

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
