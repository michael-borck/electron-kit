import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'
import { AboutPage } from './pages/AboutPage'
import { useTheme } from './hooks/useTheme'
import { useElectron } from './hooks/useElectron'

const App: React.FC = () => {
  useTheme() // Initialize theme system
  useElectron() // Initialize Electron integration

  return (
    <Router>
      <div className="h-screen flex flex-col overflow-hidden">
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </AppShell>
      </div>
    </Router>
  )
}

export default App