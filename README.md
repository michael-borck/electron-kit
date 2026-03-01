# Electron Template System

<!-- BADGES:START -->
[![data-visualization](https://img.shields.io/badge/-data--visualization-blue?style=flat-square)](https://github.com/topics/data-visualization) [![electron](https://img.shields.io/badge/-electron-47848f?style=flat-square)](https://github.com/topics/electron) [![electron-builder](https://img.shields.io/badge/-electron--builder-blue?style=flat-square)](https://github.com/topics/electron-builder) [![notifications](https://img.shields.io/badge/-notifications-blue?style=flat-square)](https://github.com/topics/notifications) [![react](https://img.shields.io/badge/-react-61dafb?style=flat-square)](https://github.com/topics/react) [![sqlite](https://img.shields.io/badge/-sqlite-blue?style=flat-square)](https://github.com/topics/sqlite) [![tailwind-css](https://img.shields.io/badge/-tailwind--css-blue?style=flat-square)](https://github.com/topics/tailwind-css) [![typescript](https://img.shields.io/badge/-typescript-3178c6?style=flat-square)](https://github.com/topics/typescript) [![vector-search](https://img.shields.io/badge/-vector--search-blue?style=flat-square)](https://github.com/topics/vector-search) [![vite](https://img.shields.io/badge/-vite-blue?style=flat-square)](https://github.com/topics/vite)
<!-- BADGES:END -->

A comprehensive, modular Electron application template system for building consistent, professional desktop applications with modern web technologies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-22+-green.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

## 🚀 Features

### Core Framework
- **🔷 TypeScript-first** - Complete type safety throughout the stack
- **⚡ Modern Build System** - Vite + Electron Builder for fast development and optimized builds
- **🎨 Design System** - Tailwind CSS with custom theme and dark mode support
- **📱 Responsive Layout** - Professional desktop UI patterns with collapsible sidebars
- **🔧 Universal Settings** - Theme, accessibility, window management, and user preferences
- **🌍 Multi-platform** - Windows, macOS, and Linux builds with GitHub Actions CI/CD

### Modular Architecture
- **🧩 Pick Your Stack** - Include only the modules you need
- **🔌 Plugin System** - Clean integration patterns for extending functionality
- **📦 Self-contained Modules** - Each module is independently developed and tested
- **🔄 Hot Reload** - Fast development experience across all modules

### Advanced Modules
- **🤖 AI Integration** - Multi-provider support (OpenAI, Claude, Gemini, Ollama)
- **🗄️ Database** - SQLite integration with migrations and backups
- **🔍 Vector Search** - Local semantic search with LanceDB
- **📊 Data Visualization** - Chart.js, D3.js, and Recharts integration
- **📄 Documentation** - Markdown rendering with search and interactive tours
- **🔔 Notifications** - Toast, system, and progress notifications
- **⌨️ Shortcuts** - Comprehensive keyboard shortcut management
- **🔄 Auto-Updates** - Built-in update system with rollback support
- **📤 Import/Export** - Multiple format support with drag-drop interface

## 🏗️ Template Structure

```
electron-template/
├── packages/              # Core modules
│   ├── core/             # Base Electron + React setup
│   ├── settings/         # Universal settings system
│   ├── ai/               # AI service integration
│   ├── database/         # SQLite database
│   ├── vector-search/    # Semantic search
│   ├── charts/           # Data visualization
│   ├── docs/             # Documentation system
│   ├── notifications/    # Notification system
│   ├── shortcuts/        # Keyboard shortcuts
│   ├── updater/          # Auto-update system
│   └── import-export/    # Data import/export
├── templates/            # Pre-built combinations
│   ├── basic/            # Minimal setup
│   ├── ai-app/           # AI-focused application
│   ├── data-app/         # Data analysis application
│   └── full/             # Complete feature set
└── tools/                # Development tools
    └── create-app/       # CLI generator
```

## 🚀 Quick Start

### Using the CLI Generator (Recommended)

```bash
# Create a new AI-powered application
npx @michaelborck/create-electron-kit my-ai-app --template=ai-app

# Create a data analysis application
npx @michaelborck/create-electron-kit my-data-app --template=data-app

# Create with all modules
npx @michaelborck/create-electron-kit my-full-app --template=full

# Start with minimal setup
npx @michaelborck/create-electron-kit my-basic-app --template=basic
```

### Manual Setup

```bash
# Clone the template
git clone https://github.com/yourusername/electron-template.git my-app
cd my-app

# Install dependencies
npm install

# Start development
npm run dev
```

## 📋 Available Templates

| Template | Modules Included | Best For |
|----------|------------------|----------|
| **basic** | Core + Settings | Simple utilities, minimal apps |
| **ai-app** | Core + Settings + AI + Notifications | Chat apps, AI assistants, content tools |
| **data-app** | Core + Settings + Database + Charts + Import/Export | Analytics, reporting, data management |
| **research-app** | Core + AI + Database + Vector Search + Docs | Research tools, knowledge management |
| **full** | All modules | Feature-rich applications, demos |

## 🧩 Available Modules

### Core Modules

| Module | Description | Key Features |
|--------|-------------|--------------|
| **@template/core** | Base Electron setup | React 18, TypeScript, Vite, Hot reload |
| **@template/settings** | Universal settings | Theme, accessibility, persistence |

### Feature Modules

| Module | Description | Key Features |
|--------|-------------|--------------|
| **@template/ai** | AI service integration | OpenAI, Claude, Gemini, Ollama, streaming |
| **@template/database** | SQLite database | Migrations, backups, type-safe queries |
| **@template/vector-search** | Semantic search | LanceDB, embeddings, similarity search |
| **@template/charts** | Data visualization | Chart.js, D3, Recharts, responsive |
| **@template/docs** | Documentation system | Markdown, search, tours, highlighting |
| **@template/notifications** | Notification system | Toast, system, progress, DND mode |
| **@template/shortcuts** | Keyboard shortcuts | Global/local, recording, conflict detection |
| **@template/updater** | Auto-update system | Background updates, rollback, channels |
| **@template/import-export** | Data import/export | JSON, CSV, Excel, drag-drop |

## 💻 Development

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/electron-template.git
cd electron-template

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Start development servers
npm run dev:web          # Web-only development
npm run dev:electron     # Electron development

# Building
npm run build            # Build all packages
npm run build:packages   # Build packages only
npm run build:templates  # Build template combinations

# Platform-specific builds
npm run build:win        # Build for Windows
npm run build:mac        # Build for macOS  
npm run build:linux      # Build for Linux

# Quality assurance
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:e2e         # End-to-end tests
npm run lint             # ESLint check
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript check
npm run format           # Prettier formatting

# Utilities
npm run clean            # Clean build artifacts
npm run reset            # Reset all dependencies
```

## 📚 Documentation

- **[USAGE.md](./USAGE.md)** - Comprehensive usage guide with examples
- **[ACKNOWLEDGMENTS.md](./ACKNOWLEDGMENTS.md)** - Open source attributions
- **Module Documentation** - Each package includes detailed README
- **Example Applications** - See `templates/` directory for working examples

## 🛠️ Module Integration Example

```tsx
import React from 'react'
import {
  SettingsProvider,
  AIProvider,
  DatabaseProvider,
  NotificationProvider
} from '@template/core'
import { ChatInterface } from './components/ChatInterface'

function App() {
  return (
    <SettingsProvider>
      <DatabaseProvider>
        <AIProvider>
          <NotificationProvider>
            <div className="app">
              <ChatInterface />
            </div>
          </NotificationProvider>
        </AIProvider>
      </DatabaseProvider>
    </SettingsProvider>
  )
}

export default App
```

## 🚢 Deployment

### Automated Builds

GitHub Actions automatically builds for all platforms when you push tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Manual Builds

```bash
# Build for current platform
npm run build

# Build for all platforms
npm run build:all

# Build and publish
npm run release
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- **TypeScript**: All code must be properly typed
- **Testing**: Add tests for new features
- **Documentation**: Update relevant documentation
- **Accessibility**: Follow WCAG 2.1 AA guidelines
- **Performance**: Consider bundle size and runtime performance

## 🐛 Troubleshooting

### Common Issues

**Build fails with native dependencies:**
```bash
npm run electron:rebuild
```

**TypeScript errors:**
```bash
npm run type-check
```

**Module resolution issues:**
```bash
npm run clean && npm install
```

For more troubleshooting help, see [USAGE.md](./USAGE.md#troubleshooting).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This template system builds upon many excellent open source projects. See [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md) for the complete list of attributions.

---

**Built with ❤️ for the Electron community**