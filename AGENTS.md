This is an Expo React Native project using Expo Router for file-based routing. The project was initialized from the Expo tabs template and has been stripped of its boilerplate code, leaving a clean slate for custom development.

**Key Technologies:**

- Expo SDK ~54.0.31 with React Native 0.81.5
- React 19.1.0
- Expo Router v6 (file-based routing with Stack navigator)
- `@json-render/core` and `@json-render/react` for JSON rendering
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

**Note:** The `reset-project` script mentioned in the template README has been removed.

## Architecture

### File-Based Routing (Expo Router)

The app uses Expo Router's file system based routing. Routes are defined by creating files in the `src/app/` directory:

- `src/app/_layout.tsx` - Root layout using Stack navigator
- `src/app/index.tsx` - Home screen (route: `/`)
- Create new files like `src/app/settings.tsx` for route `/settings`

### Directory Structure

```
expo-json-render/
├── src/
│   └── app/              # Expo Router file-based routing
│       ├── _layout.tsx  # Root layout with Stack navigator
│       └── index.tsx    # Home screen
├── assets/
│   └── images/          # App icons, splash screens, images
├── docs/                # Documentation (empty, for future use)
├── .vscode/            # VS Code settings
└── [config files]
```
