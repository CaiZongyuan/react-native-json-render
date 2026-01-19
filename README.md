# Expo JSON Render

基于 Expo Router 的 React Native 应用，支持 JSON 渲染和 AI 聊天功能。

## 技术栈

- **Expo SDK** ~54.0.31 (React Native 0.81.5)
- **React** 19.1.0
- **Expo Router** v6 (文件路由 + Native Tabs 导航)
- **@json-render/core** & **@json-render/react** - JSON 渲染
- **Vercel AI SDK** - AI 聊天集成
- **GLM-4.7** - 智谱 AI 大模型
- **TypeScript** (严格模式)
- **Bun** - 包管理器

## 开始使用

### 环境准备

1. 安装依赖：

```bash
bun install
```

2. 配置环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API 密钥：

```
GLM_API_KEY=your_api_key_here
```

### 开发

```bash
# 启动开发服务器
bun start

# 指定平台启动
bun run android    # Android
bun run ios        # iOS
bun run web        # Web
```

## 项目结构

```
expo-json-render/
├── src/
│   ├── app/                    # Expo Router 文件路由
│   │   ├── _layout.tsx        # 根布局
│   │   ├── (tabs)/            # 标签页导航组
│   │   │   ├── _layout.tsx    # 标签页布局
│   │   │   ├── index.tsx      # 首页
│   │   │   ├── render/        # JSON 渲染功能
│   │   │   └── chatbot/       # AI 聊天功能
│   │   └── api/               # API 路由
│   │       └── chat+api.ts    # 聊天流式接口
│   └── utils/                 # 工具函数
│       └── urlGenerator.ts    # API URL 生成
├── assets/
│   └── images/                # 应用图标、启动页
├── .env                       # 环境变量（不提交）
├── .env.example              # 环境变量模板
└── [配置文件]
```

## 功能说明

### 标签页导航

- **首页** - 应用主页面
- **渲染** - JSON 渲染功能
- **聊天机器人** - AI 对话界面

### AI 聊天

集成智谱 GLM-4.7 大模型，支持流式响应：

- API 端点：`/api/chat`
- 使用 Vercel AI SDK 实现流式传输
- 需配置 `GLM_API_KEY` 环境变量

### API URL 配置

`urlGenerator.ts` 工具自动处理 API URL 构建：

- **开发环境**：使用 `Constants.experienceUrl` 构建本地 API URL
- **生产环境**：需配置 `EXPO_PUBLIC_API_BASE_URL` 环境变量

## 环境变量

| 变量                       | 说明                  | 必填 |
| -------------------------- | --------------------- | ---- |
| `GLM_API_KEY`              | 智谱 AI API 密钥      | 是   |
| `EXPO_PUBLIC_API_BASE_URL` | 生产环境 API 基础 URL | 否   |

## Expo 实验性功能

- New Architecture
- Typed Routes
- React Compiler
- Static Web Output
