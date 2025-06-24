# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modular Electron application template system that provides reusable packages for building desktop applications. The system includes a published npm CLI tool (`@michaelborck/create-electron-kit`) that generates new Electron projects from predefined template combinations.

## Architecture

### Workspace Structure
- **packages/**: Independent modules that can be combined into applications
- **tools/create-app/**: Published npm CLI package for project generation
- **test-output/**: Generated test projects (not part of the main codebase)

### Core Architecture Pattern
The system uses a modular architecture where each package in `packages/` is self-contained:
- Each module exports its functionality through an `index.ts` file
- Modules follow a consistent structure: managers/services, components, stores, types
- The `core` package provides the base Electron + React setup that other modules extend
- Template combinations are defined in `tools/create-app/src/templates.ts`

### Key Technologies
- **Electron**: Desktop app framework
- **React 18**: UI framework with TypeScript
- **Vite**: Build tool for renderer process
- **Tailwind CSS**: Styling system
- **Zustand**: State management
- **TypeScript**: Throughout the entire stack

## Development Commands

### Root Level (Workspace)
```bash
# Core development
npm run dev              # Start core package development
npm run build            # Build core package only
npm run build:all        # Build all packages in workspace

# Quality assurance
npm run test             # Run tests across all packages
npm run lint             # Lint all packages
npm run format           # Format code with Prettier

# Utilities
npm run clean            # Clean all dist folders and node_modules
```

### Core Package (packages/core)
```bash
# Development
npm run dev              # Start both main and renderer in watch mode
npm run dev:main         # Watch main + preload processes only
npm run dev:renderer     # Start Vite dev server for renderer

# Building
npm run build            # Build all processes (main, preload, renderer)
npm run build:main       # Build Electron main process
npm run build:preload    # Build preload script
npm run build:renderer   # Build React renderer with Vite

# Distribution
npm run start            # Start built Electron app
npm run dist             # Create distributable with electron-builder

# Quality
npm run lint             # ESLint for TypeScript/React
npm run typecheck        # TypeScript compilation check
```

### CLI Tool (tools/create-app)
```bash
# Development
npm run build            # Compile TypeScript to dist/
npm run dev              # Watch mode compilation

# Publishing
npm publish --access=public  # Publish to npm (already published as @michaelborck/create-electron-kit)
```

## Module System

### Adding New Modules
When creating new packages, follow this structure:
```
packages/new-module/
├── src/
│   ├── index.ts         # Main export file
│   ├── ManagerClass.ts  # Core functionality
│   ├── types.ts         # TypeScript definitions
│   ├── components/      # React components (if applicable)
│   └── stores/          # State management (if applicable)
├── package.json
└── tsconfig.json
```

### Template Configuration
Template combinations are defined in `tools/create-app/src/templates.ts`. Each template specifies:
- `modules`: Array of package names to include
- `name` and `description`: Metadata for CLI display

The CLI automatically handles:
- Copying module source code to generated projects
- Adding appropriate dependencies to package.json
- Merging module-specific configurations

### Dependency Management
The CLI tool in `tools/create-app/src/createApp.ts` contains a `getModuleDependencies()` function that maps each module to its required npm dependencies. Update this when adding new modules that require external packages.

## Build System Details

### Electron Multi-Process Architecture
- **Main process** (`src/main/`): Node.js environment, window management
- **Preload script** (`src/preload/`): Secure bridge between main and renderer
- **Renderer process** (`src/renderer/`): React application in Chromium

### TypeScript Configuration
- Root `tsconfig.json`: Base configuration
- Process-specific configs: `tsconfig.main.json`, `tsconfig.renderer.json`
- Each package has its own `tsconfig.json` for independent compilation

### State Management Pattern
Uses Zustand for state management with this pattern:
- Stores in `src/stores/` or `src/renderer/stores/`
- Manager classes handle business logic
- Components consume stores via hooks

## Testing Generated Projects

When testing CLI-generated projects:
```bash
# Generate test project
npx @michaelborck/create-electron-kit test-project --template=ai-app --skip-install --skip-git

# Manual testing in generated project
cd test-project
npm install
npm run dev
```

## Publishing Updates

The CLI tool is published as `@michaelborck/create-electron-kit`. To update:
1. Increment version in `tools/create-app/package.json`
2. Build: `cd tools/create-app && npm run build`
3. Publish: `npm publish --access=public`

## Module Integration Pattern

When modules are combined in generated projects, they follow this provider pattern:
```tsx
<SettingsProvider>
  <DatabaseProvider>
    <AIProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AIProvider>
  </DatabaseProvider>
</SettingsProvider>
```

Each module exports its provider and related hooks for consumption by the application.