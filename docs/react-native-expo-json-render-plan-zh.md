# 在 React Native（Expo）中实现 json-render 的集成计划

本文基于对本仓库 `json-render` 的代码阅读与示例（`examples/dashboard/`）分析，给出一套在已完成初始化的 React Native + Expo 项目中落地“JSON 驱动渲染（catalog 约束 + JSON Tree 渲染）”的详细实施计划。目标是不做复杂功能（例如导出工程/导出文件），优先把“从 JSON Tree 安全渲染 UI + 数据绑定 + actions”跑通。

---

## 1. 我对 json-render 代码的理解（与关键文件）

### 1.1 核心数据结构：`@json-render/core`

json-render 的核心思想是：让模型输出一个**受约束的 UI Tree**，并且树结构采用“扁平 map + children key 引用”的形式，便于流式增量构建与校验。

- `UITree`：`{ root: string, elements: Record<string, UIElement> }`
- `UIElement`：`{ key, type, props, children?, parentKey?, visible? }`
- `DynamicValue`：允许在 action/校验/可见性中通过 `{ path: "/a/b" }` 引用 data model

对应实现：

- `packages/core/src/types.ts`：`UITree` / `UIElement` / `getByPath` / `setByPath` 等
- `packages/core/src/catalog.ts`：`createCatalog()` 用 Zod schema 约束组件 props；`catalog.treeSchema` 用于校验整个 tree
- `packages/core/src/visibility.ts`：`evaluateVisibility()` 与逻辑表达式（and/or/not/eq/gt...）
- `packages/core/src/actions.ts`：`Action`、`resolveAction()`、`executeAction()`，支持 confirm、onSuccess/onError 的副作用描述
- `packages/core/src/validation.ts`：`runValidation()` 与内置校验函数（required/email/min...）

### 1.2 React 渲染层：`@json-render/react`

渲染层本质是“递归渲染器 + 上下文（data/actions/visibility/validation）”：

- `packages/react/src/renderer.tsx`
  - `Renderer` 从 `tree.root` 开始递归渲染
  - `registry[element.type]` 选择对应的组件渲染器（你提供）
  - `useIsVisible(element.visible)` 决定是否渲染
  - `onAction` 交给 `ActionProvider` 的 `execute()`
- `packages/react/src/contexts/*`
  - `data.tsx`：维护 data model（支持 `get('/a/b')`、`set('/a/b', v)`）
  - `visibility.tsx`：封装 core 的 `evaluateVisibility`
  - `actions.tsx`：封装 core 的 action resolve/execute，并管理 confirm 流程
  - `validation.tsx`：封装 core 的 validation，提供 `useFieldValidation`
- `packages/react/src/hooks.ts`
  - `useUIStream()`：通过 `fetch()` 读取 `response.body.getReader()`，按行解析 JSONL patch，并对本地 `UITree` 做增量更新（`applyPatch` + `setByPath`）

### 1.3 示例：`examples/dashboard/`

- `examples/dashboard/app/api/generate/route.ts`：模型输出 **JSONL patches**（逐行 patch）
- `examples/dashboard/app/page.tsx`：前端通过 `useUIStream({ api: '/api/generate' })` 获取 tree 并用 `Renderer` 渲染

这套链路里，“LLM 输出 JSON → 前端渲染”并不依赖 DOM；真正依赖浏览器/DOM 的地方主要在：

- `ConfirmDialog` 的默认实现（`packages/react/src/contexts/actions.tsx`）使用了 `<div>/<button>` 等 DOM 标签
- `useUIStream()` 依赖 `ReadableStream` + `TextDecoder` 的流式读取能力（RN/Expo 环境需要单独验证）

---

## 2. 在 React Native（Expo）里复用/落地的思路

### 2.1 哪些可以直接复用

1. `@json-render/core` 可以直接复用：数据结构、catalog 校验、actions/visibility/validation 都是纯 TS 逻辑。
2. `Renderer` 的“递归渲染 + registry 分发”思路可以直接复用：React Native 同样是 React，只要 registry 里的组件返回 RN 组件（`View/Text/Pressable/...`）即可。
3. `DataProvider` / `VisibilityProvider` / `ValidationProvider` 逻辑层可以直接复用（不依赖 DOM）。

### 2.2 需要适配/替换的点（RN/Expo 重点）

0. **是否直接使用 `@json-render/react`（结论：建议直接用）**  
   在新的 RN + Expo 项目里（React 19），`@json-render/react` 的核心渲染与上下文逻辑都可以直接复用：`Renderer`、`DataProvider`、`ActionProvider`、`VisibilityProvider`、`ValidationProvider` 都不依赖 DOM。  
   需要注意的是：不要直接使用 `JSONUIProvider`（它会渲染默认的 `ConfirmDialog`，该组件是 DOM 实现），而是用“手动组合 Provider + RN 版确认弹窗管理器”。

1. **确认弹窗（Confirm）**  
   `@json-render/react` 默认 `ConfirmDialog` 使用 DOM 标签；在 RN 中必须替换为：

- `Alert.alert(...)`（最简单），或
- `Modal` + 自定义 UI（更可控）

同时避免直接使用 `JSONUIProvider`（它会默认渲染 `ConfirmDialog` 管理器），建议在 RN 项目里自己组合 Provider 并提供 RN 版本的确认弹窗管理器。

2. **流式生成（Streaming）**  
   Expo 可以直接使用 Vercel AI SDK 的 Expo 集成来消费 **SSE**。本计划默认只走流式：

- 服务端输出 JSONL patches（或 SSE data 事件中携带 patch 行）
- Expo 侧用 AI SDK 读取增量文本，按行解析 patch 并 `applyPatch` 更新 `UITree`（渲染即时推进）

落地方式（客户端）建议是“AI SDK 负责拿到流式文本，json-render 负责把文本增量变成树”：

- 维护 `buffer: string`
- 每次收到 chunk：`buffer += chunk`，按 `\\n` 切行
- 对每一行 `JSON.parse` 得到 `JsonPatch`，用与 `packages/react/src/hooks.ts` 等价的 `applyPatch()` 更新本地 tree
- 解析失败的残缺行留在 `buffer` 里等待下一次补全

3. **布局与组件库差异**  
   示例 `dashboard` 里的 `Grid/Stack/Card` 等在 Web 上靠 CSS；在 RN 上要用 Flexbox + `StyleSheet` 实现，并注意：

- 文本组件必须用 `Text`
- 容器用 `View` / `ScrollView`
- 列表建议用 `FlatList` 做虚拟化（大数据时）

4. **安全与鲁棒性**  
   建议在客户端与服务端都做 `catalog.validateTree()`：

- 服务端：对模型输出做 schema 校验，不通过就拒绝返回/要求重试
- 客户端：对入参再校验一次，避免渲染异常

---

## 3. 详细实施计划（按里程碑拆分）

### Milestone 0：明确最小目标与约束

- 目标：在 Expo App 中做一个 `DashboardScreen`，支持输入 prompt → 调用后端 → 得到 `UITree` → 渲染出类似 `examples/dashboard/` 的卡片/指标/简单列表
- 不做：导出工程、复杂代码生成、复杂图表（除非你已有 RN 图表库）
- 组件最小集合（建议）：
  - `Screen`（根容器）
  - `Card`（卡片容器，可 children）
  - `Stack`（行/列布局，可 children）
  - `Metric`（label + valuePath + format）
  - `Text`（展示文案）
  - `Button`（触发 action）
  - `List`（绑定数组数据，内部用 `FlatList`）

### Milestone 1：在 Expo 项目引入依赖与工程配置

1. 安装依赖（在你的 Expo 项目里执行）：

- `@json-render/core`
- （可选）`@json-render/react`：如果你只复用 `Renderer`/contexts 的思路，也可以不直接依赖它，而是在 RN 项目里实现一个轻量 `RendererRN`

2. Metro/Resolver 兼容性检查（关键风险点）：

- 若 Metro 对 `package.json#exports` 解析有问题：在 `metro.config.js` 开启对应开关，或临时改用 `main` 的 CJS 入口（视 Expo/Metro 版本而定）

产物验收：

- RN 项目能正常打包运行，并能在一个测试页面 import 到 `createCatalog` / `UITree` 类型

### Milestone 2：定义 RN Dashboard Catalog（约束 LLM 输出）

1. 新建 `src/json-render/catalog.ts`：

- `createCatalog({ components, actions })`
- 每个组件：
  - `props` 用 Zod 定义（尽量严格，避免模型自由发挥）
  - 对容器类组件标记 `hasChildren: true`

2. 定义 actions（最小化）：

- `refresh_data`
- `view_details`（带 params，例如 `{ id: string }`）

3. 为“数据绑定”约定字段：

- 所有取值都通过 `valuePath`/`dataPath` 指向 data model（遵循示例的 `"/analytics/revenue"` 风格）

产物验收：

- 任意 `tree` 都能通过 `catalog.validateTree(tree)` 做校验

### Milestone 3：实现 React Native 组件 registry（UI 映射）

1. 新建 `src/json-render/registry.tsx`：

- `Card` → `View` + `Text`（标题）+ children
- `Stack` → `View` + `flexDirection` 控制（row/column）
- `Metric` → `View` + `Text`，使用 `useDataValue(valuePath)` 取数并格式化
- `Button` → `Pressable`，触发 `onAction?.(action)`
- `List` → `FlatList`，`dataPath` 指向数组，renderItem 用 `Text` 或更复杂的 item 组件

2. 统一处理未知组件：

- 提供 fallback renderer：显示“unknown component type”

产物验收：

- 用一个手写的静态 `UITree`（不依赖后端/LLM）能渲染出完整页面

### Milestone 4：在 RN 中落地 Providers + Renderer（推荐自建轻量封装）

结论：直接使用 `@json-render/react` 的 Provider 与 `Renderer`，并在 RN 项目里写一个 `JSONUIProviderRN`（或类似命名）做组合封装，同时自己处理确认弹窗。

1. Provider 组合：

- `DataProvider`
- `VisibilityProvider`
- `ActionProvider`
- `ValidationProvider`

2. RN 版本确认弹窗：

- 监听 `pendingConfirmation`
- 用 `Alert.alert(confirm.title, confirm.message, [...])` 调 `confirm()` / `cancel()`
- 或 `Modal` 自渲染（更可定制）

3. Renderer：

- 直接复用 `@json-render/react` 的 `Renderer`（它本身不依赖 DOM）

产物验收：

- action 能触发 handler（用 `console.log`/`Alert` 验证）
- visibility 条件生效（切换 data model 后 UI 会 show/hide）

### Milestone 5：实现后端生成接口（SSE + JSONL patches）

注意：RN App 不应直接持有模型 API Key；建议你已有一个服务端（Next.js/Express/云函数均可）。

服务端方案（流式，唯一方案）：

1. `POST /generate`（或 `POST /api/chat` 形式），返回 `text/event-stream`
2. 入参：`{ prompt, context: { data }, currentTree? }`
3. 出参：SSE 流；每个事件携带一行 patch（JSONL 的单行 JSON），例如：
   - `{"op":"set","path":"/root","value":"main"}`
   - `{"op":"add","path":"/elements/main","value":{...}}`
4. 服务端校验策略（强烈建议）：
   - **生成时约束**：system prompt 只允许输出 patch 行
   - **接收端兜底**：对 patch 应用后的 `tree` 做 `catalog.validateTree(tree)`（至少在结束时校验）；不通过则返回错误或触发重试

产物验收：

- 给固定 prompt（例如 “显示收入与增长”）能稳定返回可渲染 tree

### Milestone 6：在 Expo 里做一个 Dashboard 页面闭环

1. `DashboardScreen`：

- 顶部 `TextInput` 输入 prompt
- “Generate” 按钮调用 hook
- 成功后渲染：`<Renderer tree={tree} registry={registry} />`

2. 初始 data：

- 直接复用 `examples/dashboard/app/page.tsx` 中的 `INITIAL_DATA` 结构（拷贝到 RN 项目）

3. 网络错误与空态：

- loading 状态（ActivityIndicator）
- error 文案
- tree 为空时显示占位

产物验收：

- 真机/模拟器可以完成：输入 prompt → 渲染 dashboard

### Milestone 7：可选增强（按需取舍）

- 性能：对大列表使用 `FlatList`，对树深度/节点数设置上限
- 组件丰富：图表可接入 `react-native-svg` + 图表库，或先用“表格/列表”替代
- streaming：在确认 Expo 版本支持后，才上 JSONL patches 增量渲染
- 设计系统：把 `Card/Metric/Button` 的样式收敛到统一 theme

---

## 4. 推荐的 RN 项目文件结构（示例）

```
src/
  json-render/
    catalog.ts
    registry.tsx
    renderer.tsx            // 若不直接依赖 @json-render/react
    providers.tsx           // JSONUIProviderRN + Confirm 处理
    useUIGenerate.ts        // 非流式：POST /generate -> setTree
  screens/
    DashboardScreen.tsx
  data/
    initialData.ts
```

---

## 5. 风险清单与规避建议

- Metro 对 `exports` 解析问题：优先在最早期验证；必要时做 resolver 配置或临时 vendor 代码
- SSE/流式消费与“按行 patch”对齐：确保服务端每个 patch 都以 `\\n` 结尾；客户端只对完整行 `JSON.parse`
- DOM 组件误用：不要在 RN 中渲染 `ConfirmDialog`（务必替换确认 UI）
- LLM 输出不稳定：服务端必须用 `catalog.treeSchema` 校验，不通过就重试/拒绝
