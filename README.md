# Electron Template

A branded Electron app template system with modular architecture for consistent, professional desktop applications.

## Features

- **TypeScript-first** development experience
- **Modular architecture** with optional feature modules
- **Consistent design system** with Tailwind CSS
- **Universal settings** (theme, accessibility, window management)
- **Multi-platform builds** (Windows, macOS, Linux)
- **Professional layout patterns** (collapsible sidebar, responsive design)

## Quick Start

```bash
# Create a new app with the AI template
npx @yourname/create-electron-app my-app --template=ai-app

# Or start with the basic template
npx @yourname/create-electron-app my-app --template=basic
```

## Available Templates

- **basic** - Core features only
- **ai-app** - Core + AI service integration
- **data-app** - Core + charts + export functionality  
- **research-app** - Core + AI + vector search + export
- **full** - All available modules

## Available Modules

- **@template/core** - Base Electron + React + TypeScript + Tailwind
- **@template/ai-service** - Multi-provider AI integration (OpenAI, Claude, Gemini, Ollama)
- **@template/export** - JSON/HTML/PDF/Word export functionality
- **@template/vector-search** - Local semantic search with LanceDB
- **@template/charts** - Data visualization with Chart.js, D3, Recharts

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build all packages
npm run build:all

# Run tests
npm run test

# Lint and format
npm run lint
npm run format
```

## Documentation

See [TEMPLATE_PLAN.md](./TEMPLATE_PLAN.md) for the complete development plan and [TASKS.md](./TASKS.md) for detailed implementation tasks.

## License

MIT