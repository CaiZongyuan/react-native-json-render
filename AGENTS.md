# Expo JSON Render - Project Documentation

This is an Expo React Native project using Expo Router for file-based routing with native tabs navigation.

## Directory Structure

```
expo-json-render/
├── src/
│   ├── app/                    # Expo Router file-based routing
│   │   ├── (tabs)/
│   │   │   ├── dashboard/      # AI Dashboard Generator (page only)
│   │   │   │   ├── _layout.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── index.tsx       # Home screen
│   │   │   └── chatbot/        # AI Chatbot
│   │   └── api/
│   │       └── chat+api.ts     # Chat streaming endpoint
│   ├── components/             # Reusable components
│   │   └── dashboard/
│   │       ├── registry.tsx
│   │       └── dashboardCatalog.ts
│   ├── hooks/                  # Custom React hooks
│   │   └── useDashboardTreeStream.ts
│   ├── lib/                    # Library code
│   │   └── dashboard/
│   │       ├── systemPrompt.ts
│   │       ├── initialData.ts
│   │       └── mockPatches.ts
│   └── utils/
│       └── urlGenerator.ts
├── assets/
├── .env
├── .env.example
├── README.md                   # English documentation
└── README-zh.md                # Chinese documentation
```

## Project Structure Principles

**Important**: The `app/` directory is reserved for Expo Router file-based routing and should only contain page files. All business logic, components, hooks, and utilities must be placed in their appropriate directories:

- **`app/`** - Route pages and layouts only
- **`components/`** - Reusable UI components
- **`hooks/`** - Custom React hooks
- **`lib/`** - Library code and business logic
- **`utils/`** - Utility functions

## Key Technologies

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
- `src/app/(tabs)/dashboard/index.tsx` - Dashboard screen with AI-powered generator (route: `/dashboard`)
- `src/app/(tabs)/chatbot/index.tsx` - Simple AI chatbot (route: `/chatbot`)

### API Routes

- `src/app/api/chat+api.ts` - POST endpoint for AI chat streaming

## Features

### Tab Navigation

- **Home** - Main landing page
- **Dashboard** - AI-powered JSON dashboard generator
- **Chatbot** - Simple AI chat interface

### AI Dashboard Generator (Dashboard Tab)

The Dashboard feature is a sophisticated AI-powered dashboard generator that uses GLM-4.7 to create React Native UI components from natural language prompts.

**How it works:**

1. User enters a prompt (e.g., "Revenue dashboard with metrics and chart")
2. AI generates JSONL (JSON Lines) patches via streaming
3. Patches are parsed incrementally and applied to build a UI tree
4. Components are rendered using the `@json-render/react` library

**Key Files:**

- `src/app/(tabs)/dashboard/index.tsx` - Main UI with prompt input, quick prompts, and rendering output (page only)
- `src/components/dashboard/registry.tsx` - Component registry with 15 React Native components
- `src/components/dashboard/dashboardCatalog.ts` - Zod schemas for component validation
- `src/hooks/useDashboardTreeStream.ts` - Custom hook for parsing JSONL patches
- `src/lib/dashboard/systemPrompt.ts` - AI system prompt generator
- `src/lib/dashboard/initialData.ts` - Sample data for dashboards
- `src/lib/dashboard/mockPatches.ts` - Mock JSONL patches for testing

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

## Configuration Notes

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

1. **Registry** (`src/components/dashboard/registry.tsx`): Maps component type names to React components
2. **Catalog** (`src/components/dashboard/dashboardCatalog.ts`): Defines Zod schemas for component props
3. **Renderer**: Renders UI elements from a tree structure with data binding support

**Data Providers:**

- `DataProvider` - Supplies data to components via `useData()` hook
- `VisibilityProvider` - Controls component visibility
- `ActionProvider` - Handles button actions with confirmation dialogs
- `ValidationProvider` - Validates component props against schemas

## Code Style Guidelines

**File Organization:**

- Keep `app/` directory clean - only route pages and layouts
- Place reusable components in `components/`
- Place custom hooks in `hooks/`
- Place business logic in `lib/`
- Place utilities in `utils/`

**TypeScript:**

- Always use strict mode
- Define proper types for all props and functions
- Avoid `any` type

**React Native:**

- Use `View` instead of `div`
- Use `Text` for all text content
- Use `Pressable` for buttons and touchable elements
- Use StyleSheet for styles

## Documentation Maintenance

**When to Update Documentation:**

1. **README.md / README-zh.md** - Update when:
   - Adding new features visible to users
   - Changing project structure
   - Updating configuration requirements
   - Modifying API endpoints or environment variables

2. **AGENTS.md** - Update when:
   - Changing directory structure
   - Adding new architectural patterns
   - Updating development commands
   - Modifying key technologies or dependencies

**Documentation Sync:**

Always update both English (README.md) and Chinese (README-zh.md) versions together to keep them in sync.
