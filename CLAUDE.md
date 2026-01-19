This is an Expo React Native project using Expo Router for file-based routing with native tabs navigation.

**Key Technologies:**

- Expo SDK ~54.0.31 with React Native 0.81.5
- React 19.1.0
- Expo Router v6 (file-based routing with Native Tabs navigator)
- `@json-render/core` and `@json-render/react` for JSON rendering
- `ai` and `@ai-sdk/react` for AI chat integration
- GLM-4.7 AI model via OpenAI-compatible SDK
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
- `src/app/(tabs)/render/index.tsx` - Render screen (route: `/render`)
- `src/app/(tabs)/chatbot/index.tsx` - Chatbot screen (route: `/chatbot`)

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
│   │   │   ├── render/        # Render feature
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

### Features

**Tab Navigation:**

- Home - Main landing page
- Render - JSON rendering functionality
- Chatbot - AI-powered chat interface

**AI Chat Integration:**

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
