This is an Expo React Native project using Expo Router for file-based routing with native tabs navigation.

**Key Technologies:**

- Expo SDK ~54.0.31 with React Native 0.81.5
- React 19.1.0
- Expo Router v6 (file-based routing with Native Tabs navigator)
- `@json-render/core` and `@json-render/react` for JSON-based UI rendering
- `ai` and `@ai-sdk/react` for AI chat integration
- GLM-4.7 AI model via OpenAI-compatible SDK
- Zod for component schema validation
- TypeScript (strict mode enabled)
- Bun as the package manager

## Development Commands

```bash
# Start development server (opens Expo DevTools)
bun start          # or npm start

# Platform-specific starts
bun run android    # Start for Android
bun run ios        # Start for iOS
bun run web        # Start for web

# Code quality
bun run lint       # Run ESLint
bun run typecheck  # Run TypeScript type checking (tsc --noEmit)
```

## Architecture

### File-Based Routing (Expo Router)

The app uses Expo Router's file system based routing with Native Tabs:

- `src/app/_layout.tsx` - Root layout using Slot
- `src/app/(tabs)/_layout.tsx` - Tabs layout with 3 tabs
- `src/app/(tabs)/index.tsx` - Home screen (route: `/`)
- `src/app/(tabs)/render/index.tsx` - Render screen with AI-powered dashboard generator (route: `/render`)
- `src/app/(tabs)/chatbot/index.tsx` - Simple AI chatbot (route: `/chatbot`)

### API Routes

- `src/app/api/chat+api.ts` - POST endpoint for AI chat streaming

### Directory Structure

```
expo-json-render/
├── src/
│   ├── app/                    # Expo Router file-based routing
│   │   ├── _layout.tsx        # Root layout with Slot
│   │   ├── (tabs)/            # Tabs navigator group
│   │   │   ├── _layout.tsx    # Native Tabs layout
│   │   │   ├── index.tsx      # Home screen
│   │   │   ├── render/        # AI Dashboard Generator feature
│   │   │   │   ├── index.tsx              # Main render screen
│   │   │   │   ├── registry.tsx            # Component registry (15 components)
│   │   │   │   ├── dashboardCatalog.ts     # Component schema catalog
│   │   │   │   ├── useDashboardTreeStream.ts # JSONL stream parser
│   │   │   │   └── initialData.ts          # Sample analytics data
│   │   │   └── chatbot/       # AI Chatbot feature
│   │   └── api/               # API routes
│   │       └── chat+api.ts    # Chat streaming endpoint
│   └── utils/                 # Utility functions
│       └── urlGenerator.ts    # API URL generation
├── assets/
│   └── images/                # App icons, splash screens, images
├── docs/                      # Documentation (empty, for future use)
├── .vscode/                   # VS Code settings
├── .env                       # Environment variables (not committed)
├── .env.example              # Environment variables template
└── [config files]
```

## Features

### Tab Navigation

- **Home** - Main landing page
- **Render** - AI-powered JSON dashboard generator
- **Chatbot** - Simple AI chat interface

### AI Dashboard Generator (Render Tab)

The Render feature is a sophisticated AI-powered dashboard generator that uses GLM-4.7 to create React Native UI components from natural language prompts.

**How it works:**

1. User enters a prompt (e.g., "Revenue dashboard with metrics and chart")
2. AI generates JSONL (JSON Lines) patches via streaming
3. Patches are parsed incrementally and applied to build a UI tree
4. Components are rendered using the `@json-render/react` library

**Key Files:**

- `src/app/(tabs)/render/index.tsx` - Main UI with prompt input, quick prompts, and rendering output
- `src/app/(tabs)/render/registry.tsx` - Component registry with 15 React Native components
- `src/app/(tabs)/render/dashboardCatalog.ts` - Zod schemas for component validation
- `src/app/(tabs)/render/useDashboardTreeStream.ts` - Custom hook for parsing JSONL patches
- `src/app/(tabs)/render/initialData.ts` - Sample data for dashboards

**Available Components:**

| Component  | Description                      | Props                                         |
| ---------- | -------------------------------- | --------------------------------------------- |
| Card       | Container with title/description | `title`, `description`, `padding`             |
| Grid       | Grid layout (1-4 columns)        | `columns`, `gap`                              |
| Stack      | Flex layout container            | `direction`, `gap`, `align`                   |
| Metric     | Display a value from data        | `label`, `valuePath`, `format`, `trend`       |
| Chart      | Bar chart visualization          | `type`, `dataPath`, `title`, `height`         |
| Table      | Data table with formatting       | `title`, `dataPath`, `columns`                |
| Button     | Action trigger                   | `label`, `variant`, `action`, `disabled`      |
| Select     | Radio-style select input         | `label`, `bindPath`, `options`, `placeholder` |
| DatePicker | Date input field                 | `label`, `bindPath`, `placeholder`            |
| Heading    | Heading text (h1-h4)             | `text`, `level`                               |
| Text       | Text paragraph                   | `content`, `variant`, `color`                 |
| Badge      | Status badge                     | `text`, `variant`                             |
| Alert      | Alert banner                     | `type`, `title`, `message`                    |
| Divider    | Section divider                  | `label`                                       |
| Empty      | Empty state display              | `title`, `description`                        |

**Quick Prompts:**

- "Revenue dashboard with metrics and chart"
- "Recent transactions table with status badges"
- "Customer and orders overview with filters"
- "Sales by region chart and key metrics"

**Data Binding:**

- `valuePath`: "/analytics/revenue" - Read a single value
- `dataPath`: "/analytics/salesByRegion" - Read an array for charts/tables
- `bindPath`: "/form/region" - Two-way binding for form inputs

**System Prompt:**

The AI is configured with a detailed system prompt that includes:

- Available component list
- Component schemas and descriptions
- Data binding rules
- JSONL patch output format
- Validation rules

### AI Chatbot

Simple chat interface with streaming responses using GLM-4.7.

### AI Chat Integration

- Uses GLM-4.7 model via OpenAI-compatible SDK
- Streaming responses using Vercel AI SDK
- API endpoint: `/api/chat`
- Requires `GLM_API_KEY` environment variable

### Configuration Notes

**Path Aliases:**

- `@/*` maps to the project root directory (configured in `tsconfig.json`)

**TypeScript:**

- Strict mode is enabled
- Extends `expo/tsconfig.base`
- Run `bun run typecheck` to verify types without emitting files

**Expo Experiments Enabled:**

- New Architecture
- Typed routes
- React Compiler
- Static web output

**Environment Variables:**

Required environment variables (see `.env.example`):

- `GLM_API_KEY` - API key for GLM model access
- `EXPO_PUBLIC_API_BASE_URL` - Production API base URL (optional, defaults to development URL)

**API URL Generation:**

The `urlGenerator.ts` utility handles API URL construction:

- Development: Uses `Constants.experienceUrl` to construct local API URLs
- Production: Requires `EXPO_PUBLIC_API_BASE_URL` environment variable

## Component Registry System

The app uses `@json-render/react`'s component registry system:

1. **Registry** (`registry.tsx`): Maps component type names to React components
2. **Catalog** (`dashboardCatalog.ts`): Defines Zod schemas for component props
3. **Renderer**: Renders UI elements from a tree structure with data binding support

**Data Providers:**

- `DataProvider` - Supplies data to components via `useData()` hook
- `VisibilityProvider` - Controls component visibility
- `ActionProvider` - Handles button actions with confirmation dialogs
- `ValidationProvider` - Validates component props against schemas
