import { Dashboard } from './components/Dashboard'
import { ThemeProvider } from './contexts/ThemeContext'
import { useEffect } from 'react'

function App() {
  // Apply initial theme class to HTML element on mount
  useEffect(() => {
    // Check for saved theme preference in localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    
    // Apply the theme class to the HTML element
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    console.log('Initial theme applied:', savedTheme)
  }, [])
  
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  )
}

export default App
