# Expo JSON Render

**English | [中文](README-zh.md)**

A React Native app built with Expo Router featuring AI-powered JSON dashboard generation and AI chat capabilities.

## Tech Stack

- **Expo SDK** ~54.0.31 (React Native 0.81.5)
- **React** 19.1.0
- **Expo Router** v6 (file-based routing + Native Tabs navigation)
- **@json-render/core** & **@json-render/react** - JSON-driven UI rendering
- **Vercel AI SDK** - AI chat integration
- **GLM-4.7** - Zhipu AI large language model (swappable with other models)
- **Zod** - Component schema validation
- **TypeScript** (strict mode)
- **Bun** - Package manager

## References

This project is inspired by the following excellent resources:

- [vercel-labs/json-render](https://github.com/vercel-labs/json-render) - Core library for JSON-driven UI rendering
- [Vercel AI SDK - Expo Getting Started](https://ai-sdk.dev/docs/getting-started/expo) - Guide for integrating AI SDK with Expo
- [Expo Documentation](https://docs.expo.dev/) - Official Expo development framework docs
- [Vercel AI SDK - Choosing a Provider](https://ai-sdk.dev/docs/getting-started/choosing-a-provider) - Multiple AI model providers supported

## Features

### AI Dashboard Generator

Automatically generate React Native dashboard interfaces from natural language descriptions. Simply enter a prompt like "Revenue dashboard with metrics and chart" and the AI will stream and render the corresponding UI components in real-time.

**Core Features:**

- 15 built-in components (Card, Grid, Stack, Metric, Chart, Table, Button, etc.)
- JSONL (JSON Lines) incremental rendering with real-time component display
- Data binding support (valuePath, dataPath, bindPath)
- Quick prompt templates
- AI output viewer (Patches/Tree dual view)

**Available Components:**

| Component  | Description                      | Main Props                       |
| ---------- | -------------------------------- | -------------------------------- |
| Card       | Container with title/description | title, description, padding      |
| Grid       | Grid layout (1-4 columns)        | columns, gap                     |
| Stack      | Flex layout container            | direction, gap, align            |
| Metric     | Numeric metric display           | label, valuePath, format, trend  |
| Chart      | Bar chart visualization          | type, dataPath, title, height    |
| Table      | Data table                       | title, dataPath, columns         |
| Button     | Action button                    | label, variant, action, disabled |
| Select     | Radio-style selector             | label, bindPath, options         |
| DatePicker | Date input field                 | label, bindPath, placeholder     |
| Heading    | Heading text (h1-h4)             | text, level                      |
| Text       | Paragraph text                   | content, variant, color          |
| Badge      | Status badge                     | text, variant                    |
| Alert      | Alert banner                     | type, title, message             |
| Divider    | Section divider                  | label                            |
| Empty      | Empty state display              | title, description               |

### Tab Navigation

- **Home** - Main landing page
- **Render** - AI-powered JSON dashboard generator
- **Chatbot** - AI chat interface

### AI Chat

Integrated with Zhipu GLM-4.7 large language model with streaming support:

- API endpoint: `/api/chat`
- Streaming responses via Vercel AI SDK
- Requires `GLM_API_KEY` environment variable

### Model Replacement

This project uses Zhipu GLM-4.7 by default, but you can easily switch to other AI model providers. The Vercel AI SDK supports various models including:

- **OpenAI**
- **Anthropic**
- **Google**
- **Others** - Mistral, Hugging Face, Azure OpenAI, etc.

**Steps to switch:**

1. Install the corresponding provider package (e.g., `bun add @ai-sdk/openai`)
2. Modify the model configuration in `src/app/api/chat+api.ts`
3. Update environment variables (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)

For detailed configuration, see: [Vercel AI SDK - Choosing a Provider](https://ai-sdk.dev/docs/getting-started/choosing-a-provider)

## Getting Started

### Prerequisites

1. Install dependencies:

```bash
bun install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` file and add your API key:

```
GLM_API_KEY=your_api_key_here
```

### Development

```bash
# Start development server
bun start

# Platform-specific start
bun run android    # Android
bun run ios        # iOS
bun run web        # Web
```

### Code Quality

```bash
# Run ESLint
bun run lint

# TypeScript type checking
bun run typecheck
```

## Project Structure

```
expo-json-render/
├── src/
│   ├── app/                    # Expo Router file-based routing
│   │   ├── _layout.tsx        # Root layout
│   │   ├── (tabs)/            # Tabs navigator group
│   │   │   ├── _layout.tsx    # Tabs layout
│   │   │   ├── index.tsx      # Home screen
│   │   │   ├── render/        # AI Dashboard Generator
│   │   │   │   ├── index.tsx              # Main interface
│   │   │   │   ├── registry.tsx            # Component registry (15 components)
│   │   │   │   ├── dashboardCatalog.ts     # Component schema catalog
│   │   │   │   ├── useDashboardTreeStream.ts # JSONL stream parser
│   │   │   │   └── initialData.ts          # Sample data
│   │   │   └── chatbot/       # AI Chat feature
│   │   └── api/               # API routes
│   │       └── chat+api.ts    # Chat streaming endpoint
│   └── utils/                 # Utility functions
│       └── urlGenerator.ts    # API URL generation
├── assets/
│   └── images/                # App icons, splash screens
├── .env                       # Environment variables (not committed)
├── .env.example              # Environment variables template
└── [config files]
```

## How AI Dashboard Generator Works

1. User enters a natural language description (e.g., "Revenue dashboard with metrics and chart")
2. AI streams JSONL (JSON Lines) patches
3. Patches are incrementally parsed and applied to a UI tree
4. Components are rendered via the `@json-render/react` library

**Quick Prompt Examples:**

- "Revenue dashboard with metrics and chart" - Revenue dashboard
- "Recent transactions table with status badges" - Recent transactions table
- "Customer and orders overview with filters" - Customer and orders overview
- "Sales by region chart and key metrics" - Regional sales chart

**Data Binding:**

- `valuePath`: "/analytics/revenue" - Read a single value
- `dataPath`: "/analytics/salesByRegion" - Read an array for charts/tables
- `bindPath`: "/form/region" - Two-way binding for form inputs

## Environment Variables

| Variable                   | Description             | Required |
| -------------------------- | ----------------------- | -------- |
| `GLM_API_KEY`              | Zhipu AI API key        | Yes      |
| `EXPO_PUBLIC_API_BASE_URL` | Production API base URL | No       |

## Component Registry System

The app uses `@json-render/react`'s component registry system:

1. **Registry** (`registry.tsx`): Maps component type names to React components
2. **Catalog** (`dashboardCatalog.ts`): Defines Zod schemas for component props
3. **Renderer**: Renders UI elements from a tree structure with data binding support

**Data Providers:**

- `DataProvider` - Supplies data via `useData()` hook
- `VisibilityProvider` - Controls component visibility
- `ActionProvider` - Handles button actions and confirmation dialogs
- `ValidationProvider` - Validates component props

## API URL Configuration

The `urlGenerator.ts` utility handles API URL construction:

- **Development**: Uses `Constants.experienceUrl` to construct local API URLs
- **Production**: Requires `EXPO_PUBLIC_API_BASE_URL` environment variable

## Expo Experimental Features

- New Architecture
- Typed Routes
- React Compiler
- Static Web Output

## Path Aliases

- `@/*` maps to the project root directory (configured in `tsconfig.json`)

## License

MIT
