# Findings — Chatbot JSON-Render Extension

## Current Project (expo-json-render)

### Chatbot Layout / Data / Actions
- `src/app/(tabs)/chatbot/_layout.tsx` 使用 `DataProvider initialData={INITIAL_DATA}` 并包裹 `VisibilityProvider` + `ActionProvider`。
- 当前 `ActionProvider` 仅提供 todo 相关 handlers：`todo_add_custom` / `todo_add_selected` / `todo_clear_completed`。
- Data 形状基于 `src/lib/todolist/initialData.ts`，并扩展了可选的 `todoAssistant.suggestions[]`。
- 重要：当前 `DataProvider` 在页面级，意味着多个 tool 卡片会共享同一份 data；这与“每条消息 UI 独立 + 历史快照一致性”的目标冲突，需要改为 **block-level DataProvider** 或引入 block-scoped data store。

### json-render DataProvider Capability (good for persistence)
- `@json-render/react` 的 `DataProvider` 支持 `onDataChange?: (path, value) => void` 回调（见 `node_modules/@json-render/react/dist/index.d.ts`），可用于：
  - UI block 内部发生数据变更时，把变更同步回 “block store”（用于持久化/回放/冻结）。

### AI SDK UIMessage “data-*” Parts (needed for structured user events)
- `ai` SDK 的 `UIMessagePart` 支持 `DataUIPart`：`type: "data-${NAME}"` + `data: ...`（见 `node_modules/ai/src/ui/ui-messages.ts`）。
- 关键点：`convertToModelMessages()` 默认会忽略 user 的 `data-*` parts，除非在 options 里提供 `convertDataPart` 把它们转换成模型可见的 text/file parts（见 `node_modules/ai/src/ui/convert-to-model-messages.ts`）。
  - 结论：如果我们要“按钮点击发送结构化事件给 agent”（而不是伪装成文本），需要在 `src/app/api/chatbot+api.ts` 调用 `convertToModelMessages(messages, { convertDataPart })`。

### Implemented: Todo UI Block Scoping + Structured Events
- `src/components/chatbot/TodoAssistantCard.tsx` 现在要求传入 `blockId`，并把 `/todoAssistant/*` 与 `/form/*` 自动重写为 `/blocks/{blockId}/...`，从而让每条消息的 UI 局部状态隔离（suggestions/newTodo 不互相污染）。
- Todo 列表本体仍使用全局路径 `/todos`（符合“来自全局数据源”）。
- 点击 todo actions（add custom / add selected / clear done）会发送 `data-user_event`（结构化），并在 API 侧被转换为模型可见的 `USER_EVENT: {...}` 文本。

### Chatbot UI Message Rendering
- `src/app/(tabs)/chatbot/index.tsx` 使用 `useChat` + `DefaultChatTransport`（`expo/fetch`）对接 `POST /api/chatbot`。
- UI 渲染逻辑目前是“文本气泡 + todo_ui 工具卡片”的硬编码：
  - 从 `message.parts` 提取 `type === "text"` 拼接文本。
  - 只识别 `p.type === "tool-todo_ui"` 的 tool parts，并在 `state === "output-available"` 时渲染 `TodoAssistantCard`。
  - tool 错误态 `output-error` 使用固定样式展示 `errorText`。

### Chatbot API Tooling
- `src/app/api/chatbot+api.ts` 通过 `streamText()` 配置 GLM `glm-4.7`，system prompt 为 `CHATBOT_SYSTEM_PROMPT`。
- 当前仅注册一个 tool：`todo_ui`，输入由 `TodoUiToolInputSchema` 校验；输出包含 `tree: UITree`（由 `buildTodoAssistantTree()` 生成）。

### Tool Output Validation + Fallback Rendering
- `src/components/chatbot/TodoAssistantCard.tsx`：
  - 对 `output` 做 `TodoUiToolOutputSchema.safeParse`；成功才直接渲染 tool 返回的 `tree`。
  - 若 `output` 不可用/不合法，则尝试解析 `input` 并本地调用 `buildTodoAssistantTree()` 生成 tree（用于 input streaming / output missing 的中间态）。
  - 使用 `useData().get/set` 将 `derived.suggestions` 同步进 `/todoAssistant/suggestions`，并初始化 `selected: false`。
  - 通过 `<Renderer tree={...} registry={todolistRegistry} fallback={UnknownComponent} />` 渲染。

### Todo UI Tool Contract
- `src/lib/todolist/todoAssistantTool.ts`：
  - tool 名称常量：`TODO_UI_TOOL_NAME = "todo_ui"`。
  - 输入 schema：`{ title?, assistantMessage?, suggestions?: string[] (<=6) }`。
  - 输出 schema：`{ title?, assistantMessage?, suggestions: string[], tree: { root, elements } }`（tree 最终视为 `UITree`）。
  - 内置 suggestion fallback：当 AI 未提供 suggestions 时，按关键词生成默认建议。

### Registries (RN Components)
- `src/components/todolist/registry.tsx`：
  - 通过 `ComponentRegistry` 注册 `Title` / `Text` / `Table` / `Checkbox` / `Button` / `Confirm` / `Waiting` / `Input` / `Stack` 等组件。
  - 多数组件使用 `useDataBinding` / `useDataValue` 读写 json-render data（path 支持 `a.b.c` 形式并 normalize 为 `/a/b/c`）。
  - 交互触发动作依赖 `onAction?.(Action)`（比如 `TodoButton` 把 `props.action` 转为 `{ name }`）。
- `src/components/dashboard/registry.tsx`：
  - Dashboard 侧 registry 更丰富，包含布局（`Grid`/`Stack`）、展示（`Card`/`Heading`/`Badge`/`Alert`/...）、表单（`Select`/`DatePicker`）等。
  - 同样通过 `useData`/`useDataBinding` + `onAction` 来实现绑定与动作。

### Catalogs / Validation
- `src/components/dashboard/dashboardCatalog.ts` 定义了 `dashboardCatalog = createCatalog({...})`（Zod props + actions 白名单，`validation: "strict"`），并导出 `componentList` 供 prompt/白名单使用。
- TodoList 侧目前没有等价的 `createCatalog`（更多依赖 prompt + 运行时 registry/fallback）；若要做“通用 UI tool + 服务端校验”，建议补一个 `todolistCatalog` 或合并成 `chatbotCatalog`。
  - ✅ 已补：`src/components/todolist/todolistCatalog.ts`（供 `render_ui` tool 校验）。

## Reference Project (nextjs-json-render)
### Whitepaper Key Ideas (2026-01-22)
- 核心目标：在类似 ChatGPT 的消息流中渲染“可交互 UI”，并满足 guardrails / streaming / 可追溯 / 历史快照一致性。
- 推荐消息模型：`ChatMessage.parts`（`markdown` + `ui`），其中 `ui` part 直接携带 `tree: UITree`，可选 `dataSnapshot`，并区分 `mode: "snapshot" | "live"`。
- Provider 组织建议：把 `DataProvider` 放到“UI 块级”（每个 message 的 ui part 一套 Provider），避免不同消息 UI 共享状态导致历史被污染。
- Streaming UI：用 JSONL patches（逐行 patch 应用到当前 `UITree`），或在“同一接口输出文本+UI”时改用 SSE typed events（`text_delta` / `ui_patch` / `done`），避免靠“是不是 JSON”来分流。
- Guardrails：Catalog（Zod schema）约束 AI 可生成的组件/props/actions；Registry 约束前端可渲染的组件集合；两者需要在组件 type 维度对齐。
- Patch 细节：默认 patch apply 不会级联清理 parent.children 引用；如果要“删除=级联删除并清理引用”，需要应用层额外处理（参考项目的 `patchUtils.ts` 思路）。
- Actions 策略：交互不应“修改旧消息”，而是把交互作为新的对话事件（产生新的 user/tool/assistant 消息），从而保证“历史是快照”。
- 安全校验：服务端优先校验 patch（op/path 结构、path 白名单、component type/props 白名单、tree 大小上限、children 数量/深度/总字符数等）；未知组件用 fallback，流式中断需要可控策略。

### Reference Implementation Notes
- `src/components/playground/chat-panel.tsx`（Next.js）：
  - 逐行读取 stream：若该行能 `JSON.parse` 且包含 `{op,path}`，当作 patch；否则当作 markdown 文本。
  - 通过 `inCodeFence` 避免 fenced JSON 被误判为 patch；支持 `//` 前缀作为“注释行/指令行”（去掉前缀后当 markdown）。
  - patch apply 失败会把错误写回 assistant markdown，并中止 streaming。
- `src/app/api/generate/route.ts`：
  - 纯 text stream（`toTextStreamResponse()`），不使用 tool calling。
  - System prompt 显式列出 component types、props 形状、patch 规则、编辑规则（最小编辑、删除时清理 children、优先 selectedKey、keys 稳定）。
  - 请求体包含 `prompt + selectedKey + data + uiOutline + currentTree`，用于“UI editor”场景的上下文对齐。

## Prompts / Output Styles
- `src/lib/chatbot/systemPrompt.ts` 当前是“通用助手 + todo_ui 强制调用”规则，并未包含可渲染组件清单或通用 UI tool 协议。
- `src/lib/todolist/systemPrompt.ts` 是另一条路径：要求模型输出 JSONL patches 来构建 UI（生成器模式），与 Chatbot 里的“tool 直接返回 tree”模式不同。
