import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { useEffect } from 'react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  
  // Log the current theme state to help with debugging
  useEffect(() => {
    console.log('Current theme:', theme)
    console.log('Dark mode class on HTML:', document.documentElement.classList.contains('dark'))
  }, [theme])

  const handleToggle = () => {
    console.log('Toggle theme clicked, current theme:', theme)
    toggleTheme()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="w-9 h-9 p-0 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-blue-600" />
      ) : (
        <Sun className="h-4 w-4 text-yellow-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
