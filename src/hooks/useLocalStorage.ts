import { useState, useEffect } from 'react'

const CACHE_VERSION = '2026-04-20-v2' // Increment this to bust cache

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const versionKey = `${key}_version`
      const storedVersion = window.localStorage.getItem(versionKey)
      
      // If version mismatch, ignore cached value and use initial
      if (storedVersion !== CACHE_VERSION) {
        window.localStorage.removeItem(key)
        window.localStorage.setItem(versionKey, CACHE_VERSION)
        return initialValue
      }
      
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
      window.localStorage.setItem(`${key}_version`, CACHE_VERSION)
    } catch (error) {
      console.error(`Error writing to localStorage for key "${key}":`, error)
    }
  }

  useEffect(() => {
    const handleStorageChange = (e: any) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue]
}

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return [isDarkMode, setIsDarkMode] as const
}
