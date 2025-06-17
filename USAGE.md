# Electron Template Usage Guide

A comprehensive guide to using this modular Electron template system for building feature-rich desktop applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Template Structure](#template-structure)
- [Available Modules](#available-modules)
- [Building Your First App](#building-your-first-app)
- [Module Integration](#module-integration)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Customization](#customization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Clone the Template

```bash
git clone <your-template-repo>
cd electron-template
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Choose Your Modules

Edit `package.json` to include only the modules you need:

```json
{
  "dependencies": {
    "@template/core": "workspace:*",
    "@template/settings": "workspace:*",
    "@template/ai": "workspace:*",
    "@template/database": "workspace:*"
  }
}
```

### 4. Start Development

```bash
npm run dev
```

Your Electron app will launch with the selected modules integrated.

## Template Structure

```
electron-template/
├── packages/               # Modular packages
│   ├── core/              # Core Electron + React setup
│   ├── settings/          # Universal settings system
│   ├── ai/                # AI service integration
│   ├── database/          # SQLite database module
│   ├── vector-search/     # Vector search with LanceDB
│   ├── charts/            # Data visualization
│   ├── docs/              # Documentation system
│   ├── notifications/     # Toast & system notifications
│   ├── shortcuts/         # Keyboard shortcuts
│   ├── updater/           # Auto-update system
│   └── import-export/     # Data import/export
├── apps/                  # Template combinations
│   ├── basic/             # Minimal setup
│   ├── ai-app/            # AI-focused application
│   ├── data-app/          # Data analysis application
│   └── full/              # All modules included
├── tools/                 # Build and development tools
└── docs/                  # Documentation
```

## Available Modules

### Core Modules

#### @template/core
**Required for all applications**
- Electron + React + TypeScript setup
- Vite build system
- Hot reload development
- Cross-platform builds

```tsx
import { App } from '@template/core'

function MyApp() {
  return <App>Your content here</App>
}
```

#### @template/settings
**Universal settings system**
- Theme management (light/dark/system)
- Window preferences
- Accessibility options
- Persistent storage

```tsx
import { SettingsProvider, useSettings } from '@template/settings'

function App() {
  return (
    <SettingsProvider>
      <MyApp />
    </SettingsProvider>
  )
}

function MyComponent() {
  const { theme, setTheme } = useSettings()
  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  )
}
```

### Feature Modules

#### @template/ai
**Multi-provider AI integration**
- OpenAI, Claude, Gemini, Ollama support
- Streaming responses
- Conversation management
- Token usage tracking

```tsx
import { AIProvider, useAI } from '@template/ai'

function ChatComponent() {
  const { sendMessage, messages, isLoading } = useAI()
  
  const handleSend = async () => {
    await sendMessage({
      content: 'Hello, AI!',
      role: 'user'
    })
  }
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={handleSend} disabled={isLoading}>
        Send Message
      </button>
    </div>
  )
}
```

#### @template/database
**SQLite database integration**
- Better-sqlite3 for performance
- Type-safe queries
- Migrations system
- Backup functionality

```tsx
import { DatabaseProvider, useDatabase } from '@template/database'

interface User {
  id: number
  name: string
  email: string
}

function UserList() {
  const { query, execute } = useDatabase()
  const [users, setUsers] = useState<User[]>([])
  
  useEffect(() => {
    const loadUsers = async () => {
      const result = await query<User>('SELECT * FROM users')
      setUsers(result)
    }
    loadUsers()
  }, [])
  
  const addUser = async (name: string, email: string) => {
    await execute('INSERT INTO users (name, email) VALUES (?, ?)', [name, email])
  }
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name} - {user.email}</div>
      ))}
    </div>
  )
}
```

#### @template/vector-search
**Semantic search capabilities**
- LanceDB vector database
- Embedding generation
- Similarity search
- Document indexing

```tsx
import { VectorSearchProvider, useVectorSearch } from '@template/vector-search'

function DocumentSearch() {
  const { search, addDocument, isSearching } = useVectorSearch()
  const [results, setResults] = useState([])
  
  const handleSearch = async (query: string) => {
    const searchResults = await search(query, {
      limit: 10,
      threshold: 0.8
    })
    setResults(searchResults)
  }
  
  return (
    <div>
      <input 
        type="text" 
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search documents..."
      />
      {results.map(result => (
        <div key={result.id} className="search-result">
          <h3>{result.title}</h3>
          <p>Score: {result.score}</p>
        </div>
      ))}
    </div>
  )
}
```

#### @template/charts
**Data visualization**
- Chart.js, D3.js, Recharts integration
- Interactive charts
- Export capabilities
- Real-time updates

```tsx
import { ChartProvider, LineChart, BarChart, PieChart } from '@template/charts'

function Dashboard() {
  const data = [
    { month: 'Jan', sales: 1000, expenses: 800 },
    { month: 'Feb', sales: 1200, expenses: 900 },
    { month: 'Mar', sales: 1500, expenses: 1000 }
  ]
  
  return (
    <ChartProvider>
      <div className="dashboard">
        <LineChart 
          data={data}
          xKey="month"
          yKey="sales"
          title="Sales Trend"
        />
        <BarChart 
          data={data}
          xKey="month"
          yKey="expenses"
          title="Monthly Expenses"
        />
      </div>
    </ChartProvider>
  )
}
```

#### @template/docs
**Documentation system**
- Markdown rendering
- Search functionality
- Interactive tours
- Code highlighting

```tsx
import { DocsProvider, DocViewer, DocSearch } from '@template/docs'

function HelpCenter() {
  return (
    <DocsProvider>
      <div className="help-center">
        <DocSearch placeholder="Search documentation..." />
        <DocViewer 
          docId="getting-started"
          showToc={true}
          enableSearch={true}
        />
      </div>
    </DocsProvider>
  )
}
```

#### @template/notifications
**Notification system**
- Toast notifications
- System notifications
- Progress notifications
- Do Not Disturb mode

```tsx
import { NotificationProvider, useNotifications } from '@template/notifications'

function MyComponent() {
  const { showToast, showProgress, showSystem } = useNotifications()
  
  const handleSave = async () => {
    const progressId = showProgress({
      title: 'Saving...',
      message: 'Please wait while we save your data'
    })
    
    try {
      await saveData()
      showToast({
        type: 'success',
        title: 'Saved!',
        message: 'Your data has been saved successfully'
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save data'
      })
    } finally {
      hideProgress(progressId)
    }
  }
  
  return <button onClick={handleSave}>Save Data</button>
}
```

#### @template/shortcuts
**Keyboard shortcuts**
- Global and local shortcuts
- Conflict detection
- Customizable schemes
- Recording interface

```tsx
import { ShortcutProvider, useShortcuts } from '@template/shortcuts'

function App() {
  const { registerShortcut, removeShortcut } = useShortcuts()
  
  useEffect(() => {
    // Register global shortcuts
    registerShortcut({
      id: 'save',
      combination: 'Ctrl+S',
      description: 'Save document',
      global: false,
      action: () => saveDocument()
    })
    
    registerShortcut({
      id: 'search',
      combination: 'Ctrl+F',
      description: 'Search',
      global: false,
      action: () => openSearch()
    })
    
    return () => {
      removeShortcut('save')
      removeShortcut('search')
    }
  }, [])
  
  return <div>Your app content</div>
}
```

#### @template/updater
**Auto-update system**
- Background update checking
- Download progress
- Rollback support
- Changelog viewer

```tsx
import { 
  UpdateProvider, 
  UpdateDialog, 
  UpdateNotifications,
  useUpdateChecker 
} from '@template/updater'

function App() {
  const { checkNow, isChecking } = useUpdateChecker()
  
  return (
    <UpdateProvider>
      <div className="app">
        <header>
          <button onClick={() => checkNow(true)} disabled={isChecking}>
            {isChecking ? 'Checking...' : 'Check for Updates'}
          </button>
        </header>
        
        <main>Your app content</main>
        
        {/* Update UI components */}
        <UpdateDialog />
        <UpdateNotifications />
      </div>
    </UpdateProvider>
  )
}
```

#### @template/import-export
**Data import/export**
- Multiple format support (JSON, CSV, Excel)
- Drag & drop interface
- URL import
- Batch operations

```tsx
import { ImportExportProvider, useImportExport } from '@template/import-export'

function DataManager() {
  const { importData, exportData, isImporting, isExporting } = useImportExport()
  
  const handleImport = async (file: File) => {
    try {
      const data = await importData(file, {
        format: 'auto', // Auto-detect format
        validate: true,
        transform: (row) => ({
          ...row,
          imported_at: new Date().toISOString()
        })
      })
      console.log('Imported:', data.length, 'records')
    } catch (error) {
      console.error('Import failed:', error)
    }
  }
  
  const handleExport = async () => {
    await exportData(userData, {
      format: 'csv',
      filename: 'users-export.csv',
      includeHeaders: true
    })
  }
  
  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => handleImport(e.target.files[0])}
        accept=".json,.csv,.xlsx"
      />
      <button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export Data'}
      </button>
    </div>
  )
}
```

## Building Your First App

### Example: AI Chat Application

```tsx
// src/App.tsx
import React from 'react'
import { 
  SettingsProvider, 
  AIProvider, 
  NotificationProvider,
  ShortcutProvider 
} from '@template/core'
import { ChatInterface } from './components/ChatInterface'
import { Sidebar } from './components/Sidebar'

function App() {
  return (
    <SettingsProvider>
      <AIProvider config={{
        providers: ['openai', 'claude'],
        defaultProvider: 'openai'
      }}>
        <NotificationProvider>
          <ShortcutProvider>
            <div className="app-container">
              <Sidebar />
              <ChatInterface />
            </div>
          </ShortcutProvider>
        </NotificationProvider>
      </AIProvider>
    </SettingsProvider>
  )
}

export default App
```

```tsx
// src/components/ChatInterface.tsx
import React, { useState } from 'react'
import { useAI, useNotifications, useShortcuts } from '@template/core'

export function ChatInterface() {
  const { sendMessage, messages, isLoading } = useAI()
  const { showToast } = useNotifications()
  const { registerShortcut } = useShortcuts()
  const [input, setInput] = useState('')
  
  // Register keyboard shortcut
  React.useEffect(() => {
    registerShortcut({
      id: 'send-message',
      combination: 'Ctrl+Enter',
      description: 'Send message',
      action: handleSend
    })
  }, [input])
  
  const handleSend = async () => {
    if (!input.trim()) return
    
    try {
      await sendMessage({
        content: input,
        role: 'user'
      })
      setInput('')
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to send message',
        message: error.message
      })
    }
  }
  
  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
        {isLoading && <div className="typing-indicator">AI is typing...</div>}
      </div>
      
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message... (Ctrl+Enter to send)"
          rows={3}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}
```

### Example: Data Analysis Application

```tsx
// src/App.tsx
import React from 'react'
import {
  SettingsProvider,
  DatabaseProvider,
  ChartProvider,
  ImportExportProvider
} from '@template/core'
import { Dashboard } from './components/Dashboard'
import { DataImporter } from './components/DataImporter'

function App() {
  return (
    <SettingsProvider>
      <DatabaseProvider>
        <ChartProvider>
          <ImportExportProvider>
            <div className="app">
              <nav>Data Analysis Tool</nav>
              <main>
                <DataImporter />
                <Dashboard />
              </main>
            </div>
          </ImportExportProvider>
        </ChartProvider>
      </DatabaseProvider>
    </SettingsProvider>
  )
}
```

## Module Integration

### Provider Setup

Wrap your app with the required providers:

```tsx
import React from 'react'
import {
  SettingsProvider,
  AIProvider,
  DatabaseProvider,
  NotificationProvider
} from '@template/core'

function AppProviders({ children }) {
  return (
    <SettingsProvider>
      <DatabaseProvider>
        <AIProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AIProvider>
      </DatabaseProvider>
    </SettingsProvider>
  )
}
```

### Configuration

Create a configuration file:

```ts
// src/config/app.config.ts
export const appConfig = {
  ai: {
    providers: ['openai', 'claude'],
    defaultProvider: 'openai',
    apiKeys: {
      openai: process.env.OPENAI_API_KEY,
      claude: process.env.CLAUDE_API_KEY
    }
  },
  database: {
    path: './data/app.db',
    enableBackups: true,
    backupInterval: 24 * 60 * 60 * 1000 // 24 hours
  },
  notifications: {
    position: 'top-right',
    duration: 5000,
    enableSystem: true
  },
  updater: {
    autoCheck: true,
    channel: 'stable',
    checkInterval: 4 * 60 * 60 * 1000 // 4 hours
  }
}
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
# AI API Keys
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key

# Database
DATABASE_PATH=./data/app.db
ENABLE_DATABASE_BACKUPS=true

# Updates
UPDATE_SERVER_URL=https://your-update-server.com
UPDATE_CHANNEL=stable

# Development
NODE_ENV=development
DEBUG=true
```

### App Configuration

```ts
// src/config/index.ts
export const config = {
  app: {
    name: 'My Electron App',
    version: '1.0.0',
    description: 'Built with Electron Template'
  },
  
  window: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webSecurity: false // Only for development
  },
  
  features: {
    ai: true,
    database: true,
    charts: true,
    notifications: true,
    shortcuts: true,
    updater: true,
    importExport: true,
    docs: false,
    vectorSearch: false
  }
}
```

## Deployment

### Building for Production

```bash
# Build all packages
npm run build

# Build for specific platform
npm run build:win
npm run build:mac
npm run build:linux

# Build and publish
npm run build:publish
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/build.yml
name: Build and Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Auto-Updates Setup

1. Configure electron-builder:

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "your-username",
        "repo": "your-repo"
      }
    ],
    "win": {
      "publisherName": "Your Company"
    },
    "mac": {
      "hardenedRuntime": true,
      "entitlements": "assets/entitlements.mac.plist"
    }
  }
}
```

2. Initialize updater:

```tsx
import { useUpdateStore } from '@template/updater'

function App() {
  const { initialize } = useUpdateStore()
  
  useEffect(() => {
    initialize({
      version: '1.0.0',
      buildTime: '2024-01-15T10:00:00Z',
      gitCommit: 'abc123'
    })
  }, [])
  
  return <YourApp />
}
```

## Customization

### Theming

```tsx
// src/theme/index.ts
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    gray: {
      50: '#f9fafb',
      500: '#6b7280',
      900: '#111827'
    }
  },
  
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace']
  },
  
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem'
  }
}
```

### Custom Hooks

```tsx
// src/hooks/useAppState.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  sidebarOpen: boolean
  currentView: string
  recentFiles: string[]
  setSidebarOpen: (open: boolean) => void
  setCurrentView: (view: string) => void
  addRecentFile: (file: string) => void
}

export const useAppState = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      currentView: 'dashboard',
      recentFiles: [],
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCurrentView: (view) => set({ currentView: view }),
      addRecentFile: (file) => {
        const { recentFiles } = get()
        const updated = [file, ...recentFiles.filter(f => f !== file)].slice(0, 10)
        set({ recentFiles: updated })
      }
    }),
    {
      name: 'app-state'
    }
  )
)
```

### Custom Components

```tsx
// src/components/CustomButton.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '@template/settings'

interface CustomButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
}

export function CustomButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  disabled 
}: CustomButtonProps) {
  const { theme } = useSettings()
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        rounded-md font-medium transition-colors
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${theme === 'dark' ? 'dark:' : ''}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}
```

## Best Practices

### 1. Module Selection

**Choose only what you need:**
- Start with `@template/core` and `@template/settings`
- Add modules incrementally as features are needed
- Consider bundle size impact

### 2. State Management

**Use appropriate state solutions:**
- Component state for UI-only data
- Module stores for feature-specific state
- Global app state for cross-cutting concerns

```tsx
// Good: Feature-specific state
const { messages, sendMessage } = useAI()

// Good: Component state  
const [isOpen, setIsOpen] = useState(false)

// Good: Global app state
const { currentUser, isAuthenticated } = useAppState()
```

### 3. Error Handling

**Implement comprehensive error boundaries:**

```tsx
// src/components/ErrorBoundary.tsx
import React from 'react'
import { useNotifications } from '@template/notifications'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Log to external service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error && this.state.error.toString()}
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

### 4. Performance Optimization

**Optimize rendering and memory usage:**

```tsx
import React, { memo, useMemo, useCallback } from 'react'

const ExpensiveComponent = memo(({ data, onItemClick }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayName: `${item.firstName} ${item.lastName}`
    }))
  }, [data])
  
  const handleClick = useCallback((id: string) => {
    onItemClick(id)
  }, [onItemClick])
  
  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.displayName}
        </div>
      ))}
    </div>
  )
})
```

### 5. Testing Strategy

**Test at multiple levels:**

```tsx
// Component tests
import { render, screen, fireEvent } from '@testing-library/react'
import { CustomButton } from '../CustomButton'

test('renders button with correct text', () => {
  render(<CustomButton>Click me</CustomButton>)
  expect(screen.getByRole('button')).toHaveTextContent('Click me')
})

// Integration tests
import { renderWithProviders } from '../test-utils'
import { ChatInterface } from '../ChatInterface'

test('sends message when button clicked', async () => {
  const { user } = renderWithProviders(<ChatInterface />)
  
  const input = screen.getByPlaceholderText('Type your message...')
  const button = screen.getByRole('button', { name: /send/i })
  
  await user.type(input, 'Hello, AI!')
  await user.click(button)
  
  expect(screen.getByText('Hello, AI!')).toBeInTheDocument()
})
```

## Troubleshooting

### Common Issues

#### 1. Module Import Errors

**Problem:** `Cannot resolve module '@template/ai'`

**Solution:**
```bash
# Ensure workspace dependencies are installed
npm install

# Check package.json includes the module
"dependencies": {
  "@template/ai": "workspace:*"
}

# Rebuild if necessary
npm run build
```

#### 2. TypeScript Errors

**Problem:** Type errors with module interfaces

**Solution:**
```ts
// Add module declarations if needed
declare module '@template/ai' {
  export interface AIConfig {
    providers: string[]
    defaultProvider: string
  }
}

// Or use proper imports
import type { AIConfig } from '@template/ai'
```

#### 3. Electron Build Issues

**Problem:** Build fails with native dependencies

**Solution:**
```bash
# Rebuild native modules for Electron
npm run electron:rebuild

# Or install with proper target
npm install --target=electron
```

#### 4. Update System Not Working

**Problem:** Auto-updates not triggering

**Solution:**
```ts
// Check update configuration
const { initialize, checkForUpdates } = useUpdateStore()

useEffect(() => {
  // Ensure proper initialization
  initialize({
    version: process.env.npm_package_version || '1.0.0'
  })
  
  // Manual check for testing
  checkForUpdates(true)
}, [])
```

#### 5. Database Connection Issues

**Problem:** SQLite database errors

**Solution:**
```ts
// Ensure proper database path
const { initialize } = useDatabase()

useEffect(() => {
  initialize({
    path: path.join(app.getPath('userData'), 'app.db'),
    enableWAL: true,
    timeout: 5000
  })
}, [])
```

### Performance Issues

#### 1. Slow Startup

**Solution:**
- Lazy load non-critical modules
- Optimize bundle size
- Use code splitting

```tsx
// Lazy load heavy components
const ChartsModule = lazy(() => import('@template/charts'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {showCharts && <ChartsModule />}
    </Suspense>
  )
}
```

#### 2. Memory Leaks

**Solution:**
- Proper cleanup in useEffect
- Remove event listeners
- Cancel pending requests

```tsx
useEffect(() => {
  const controller = new AbortController()
  
  fetchData({ signal: controller.signal })
  
  return () => {
    controller.abort()
  }
}, [])
```

### Getting Help

1. **Check the documentation** for each module
2. **Search existing issues** in the repository
3. **Create a minimal reproduction** of the problem
4. **Open an issue** with detailed information:
   - OS and version
   - Node.js version
   - Template version
   - Steps to reproduce
   - Expected vs actual behavior

---

## Next Steps

1. **Explore the example apps** in the `apps/` directory
2. **Read module-specific documentation** for detailed APIs
3. **Join the community** for support and discussions
4. **Contribute back** with improvements and bug fixes

Happy building! 🚀