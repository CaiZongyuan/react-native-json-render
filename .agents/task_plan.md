# Task Plan — Chatbot JSON-Render “Freeform Agent UI”

## Goal
在 Expo React Native 的 Chatbot 页面中拓展 json-render：让 Agent 能更自由地通过 JSON Tree 渲染组件（不仅限于当前 TodoAssistantCard 的 `todo_ui` 工具），并且：

- 每条 assistant 消息里的 UI（若存在）都是**独立 UI Block**（一个 Chat 页面会有多轮会话、多棵 UITree）
- UI Block 的交互能力应与“正常组件”一致（例如 TodoList 可 CRUD）
- 重点设计：**数据持久化、历史快照一致性、消息过期/冻结**（参考白皮书理念）

## Non-Goals (for now)
- 不把 Next.js 参考项目的实现原样照搬（技术栈不同：React Native + Expo Router）。
- 不在本阶段引入新的后端服务或复杂权限体系（先在现有 `app/api/*+api.ts` 能力内扩展）。

## Phases
| Phase | Status | Output |
|------|--------|--------|
| 1. Audit current RN chatbot/json-render | complete | `findings.md` 记录当前数据流/组件/工具协议 |
| 2. Study reference Next.js project | complete | `findings.md` 对齐“聊天 UI + JSON UI”模式与协议 |
| 3. Define target protocol + data model | complete | Tool schema、消息结构、渲染约束、错误恢复策略 |
| 4. Implement block-level rendering | in_progress | 每个 UI Block 自己的 Providers + state 隔离（不污染历史/其他 block） |
| 5. Implement generic UI tool contract | pending | Chatbot 支持渲染任意 `UITree`（安全/校验/降级） |
| 6. Persistence + expiry policy | pending | 数据持久化、过期冻结、回放一致性（策略 + 实现） |
| 7. Expand registry/catalog + actions | pending | 更多组件、动作、数据绑定、CRUD 能力 |
| 8. QA + docs | pending | `README.md`/`README-zh.md` 变更说明、用例示例 |

## Open Questions
- 交互语义：交互本质是“给 agent 提供额外上下文 + 触发器”。
  - 典型例子：许可确认 UI（按钮点击）= 本地状态变更 + 发送一条“确认事件”给 agent（类似用户发文本确认，但用按钮更可靠）。
  - 这意味着：UI 可能会“就地更新”（例如把按钮置灰、显示已确认），同时也要把事件写入对话流用于后续推理。
- UI Block 的“过期/冻结”不能一刀切，需要按 **Block 类型 / Action 类型** 定义策略：
  - “确认/批准”类：有强时效与幂等要求；点击一次后仍可看到 UI，但再次点击应提示“已处理”，且不再触发原行为。
  - “查询/展示”类（如天气）：应是当时数据的快照，10 天后看也不应变化（除非明确是 live 数据源）。
- 持久化：本阶段只做**本地持久化**即可（不做服务端持久化）。
- Actions：本阶段只做**本地 action handlers**即可（不依赖服务端执行/鉴权）。
- 数据源：每个 UI block 的数据应来自**全局数据源**（但允许其中一部分是“按 blockId 分桶的快照数据”）。

## Proposed Direction (MVP → V1)
### MVP：每条消息的 UI Block 独立 + 可交互 + 可冻结
优先落地 “block-level providers + 独立 state + freeze 策略”，再扩展通用 tool。

1) **UI Block 数据模型（前端）**
- 为每个 tool part / ui part 生成 `blockId`（建议直接用 `toolCallId`）。
- 维护一个全局 store（本地持久化）：包含共享数据 + 按 block 分桶的数据。
  - `globalData.shared`：跨 block 共享（例如真正的“全局 Todo”）
  - `globalData.blocks[blockId]`：每条消息 UI 独立数据（用于快照、或该 block 的局部状态）
- 每个 UI Block 记录自己的策略元数据：
  - `dataPolicy: "shared" | "block" | "snapshot"`（snapshot = 只读快照）
  - `expiryPolicy: "none" | "after_next_assistant" | "after_consumed" | { ttlMs: number }`
  - `mode: "live" | "frozen"`（frozen = UI 仍展示，但交互受限/幂等）

2) **Block-level Providers**
- 每个 UI Block 自己包一套 `DataProvider`/`VisibilityProvider`/`ActionProvider`（必要时 `ValidationProvider`），保证：
  - block 内 CRUD 不影响其他 block
  - 历史回放时渲染的是 block 的 `dataSnapshot`（而不是全局最新 data）
- `DataProvider onDataChange` 用来把 block 内部的 data 更新同步回 `blocks[blockId].data`，为“本地持久化/回放/冻结”提供可靠数据源。
  - 对于 `dataPolicy: "snapshot"`：忽略 `onDataChange`（或直接不提供可写 handlers / 禁用交互组件）。
  - 对于 `dataPolicy: "shared"`：把变更写入 `globalData.shared`（用于全局 todo 之类）。

3) **Freeze/Expiry（与白皮书理念对齐）**
- 默认 `mode: "live"`（允许“像正常组件一样 CRUD”）。
- 触发冻结后切到 `mode: "frozen"`：
  - UI 仍可见（历史可回放）
  - 对“触发器类 action”（confirm/approve/run）需要幂等：再次触发只提示“已处理/已过期”，不再产生新事件
  - 对“纯展示类 block”本来就应是 snapshot（无需冻结）
- 冻结触发以策略为准（常见默认：`after_next_assistant`，但允许每个 block 覆盖）。

4) **通用工具（tool calling，先不做 patch streaming）**
- 新增通用工具（示例命名）：`render_ui`（tool calling）
  - **Input**：`{ title?, registry: "dashboard"|"todolist"|"chatbot", tree: UITree, dataSnapshot?: DataModel, mode?: "live"|"snapshot", ttlMs?: number }`
  - **Server-side validate**：优先用 Catalog 做整树校验（已有 `src/components/dashboard/dashboardCatalog.ts`）；并限制元素数量/keys/children/深度/字符串大小；action 白名单；data path 白名单。
  - **Output**：回传已校验/裁剪后的 `tree` + `dataSnapshot` + `mode` + `ttlMs`，前端固化进 `blocks[blockId]`。

### V1：引入 “文本 + UI patches” 的 streaming（参考白皮书 4.2/4.3）
- 方案 A：继续沿用 AI SDK 的 tool calling（不做 patch streaming），但允许多次 tool call 逐步生成/更新 UI（离散更新）。
- 方案 B：新增一条专用 API（如 `/api/chatbot-ui`）使用 SSE typed events（`text_delta`/`ui_patch`/`done`），客户端写一个 RN 版本的 stream parser + patch applier（更贴近白皮书）。

## Decision Checklist (updated from your answers)
- Freeze：默认“下一条 agent 回复后，很多触发器类操作失效”，但按 block/action 类型可覆盖（confirm 类必须幂等 + 失效提示；weather 类默认 snapshot）。
- Persistence：本地持久化（AsyncStorage）。
- Data：采用统一 store 分域：`shared` + `blocks[blockId]`（weather=block snapshot，todo=shared.todos）。
- Actions：本地 handlers；按钮点击=本地状态变更 + 发送**结构化事件**给 agent（用 `data-*` message parts）。
  - 注意：需要在 API 侧为 `convertToModelMessages` 提供 `convertDataPart`，否则 data parts 不会进入模型上下文（见 `.agents/findings.md`）。

## Follow-up Questions (to finalize design)
Resolved:
- Data domain: **B**
- Event injection: **B**
- Todo freeze: **C**

Remaining (need your preference):
1) 结构化事件的最小 schema（建议）：
   - `name: string`（例如 `confirm_yes` / `todo_add` / `ui_submit`）
   - `blockId: string`
   - `action: { name: string; params?: object }`
   - `at: ISO string`
   - `dedupeKey?: string`（用于幂等）
你是否同意直接用这个 schema？如果要更精简/更严格，请给出字段白名单。

Confirmed:
- Event schema: `{ name, blockId, action: { name, params? }, at, dedupeKey? }`

## Phase 4 Implementation Checklist (RN)
Goal: “每条 assistant 消息里的 UI = 独立 UI Block”，并能接入 shared/block 数据域与事件注入。

- Done:
  - `todo_ui` block 局部状态隔离（`/blocks/{blockId}` 重写）+ actions 触发 `data-user_event`
  - API `convertDataPart` 让 `data-user_event` 进入模型上下文
  - 通用 `render_ui` tool + `JsonRenderCard`（catalog 校验）
  - 增加 `todolistCatalog`（严格校验）

- `src/lib/chatbot/blockStore.ts`：定义 `ChatbotStore` 类型（`shared` + `blocks[blockId]`）与序列化结构（供 AsyncStorage）。
- `src/hooks/useChatbotStore.ts`：加载/保存 store、提供 `getBlockData`/`setBlockData`/`getSharedData`/`setSharedData`、以及 `freezeBlock(blockId)`。
- `src/components/chatbot/JsonRenderBlock.tsx`：
  - props: `{ blockId, tree, registry, dataPolicy, expiryPolicy, mode }`
  - block-level `DataProvider`：根据 `dataPolicy` 选择 `initialData`，并用 `onDataChange` 同步回 store
  - block-level `ActionProvider`：按 `mode`（live/frozen）做 disable / 幂等提示
- `src/app/(tabs)/chatbot/index.tsx`：
  - 统一渲染 tool parts → `JsonRenderBlock`（先兼容 `todo_ui`，后续扩展 `render_ui` / 其它 tools）
  - 用户点击触发器类 action：通过 `sendMessage({ parts: [{ type: "data-user_event", data: event }] })` 注入事件（结构化）
- `src/app/api/chatbot+api.ts`：
  - `convertToModelMessages(messages, { convertDataPart })`：把 `data-user_event` 转成模型可见的 text part（例如 `USER_EVENT: {...json...}`），确保 agent 能读到点击事件


## Risks
- 安全：tool 返回任意 tree 可能触发不期望的 action 或写入路径。
- 可维护性：组件 registry/catalog 的扩展方式需要清晰分层（`components/` vs `lib/`）。
- 体验：渲染失败/校验失败需要可见错误和自动降级（fallback text）。

## Notes
参考材料：
- `/root/Projects/Frontend/nextjs-json-render`（代码）
- `/root/Projects/Frontend/nextjs-json-render/docs/chat-ui-whitepaper.md`
