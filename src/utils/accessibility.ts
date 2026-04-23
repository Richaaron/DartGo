/**
 * Accessibility utilities and helpers
 */

// ARIA label generators
export const generateAriaLabel = (action: string, object: string, context?: string): string => {
  const base = `${action} ${object}`
  return context ? `${base} for ${context}` : base
}

// Focus management
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
  )
  const firstFocusable = focusableElements[0] as HTMLElement
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus()
          e.preventDefault()
        }
      }
    }
  }

  element.addEventListener('keydown', handleTabKey)
  return () => element.removeEventListener('keydown', handleTabKey)
}

// Screen reader announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Keyboard navigation helpers
export const handleKeyboardNavigation = (
  e: KeyboardEvent,
  actions: {
    onEnter?: () => void
    onSpace?: () => void
    onEscape?: () => void
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowLeft?: () => void
    onArrowRight?: () => void
    onHome?: () => void
    onEnd?: () => void
  }
) => {
  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      actions.onEnter?.()
      break
    case ' ':
    case 'Spacebar':
      e.preventDefault()
      actions.onSpace?.()
      break
    case 'Escape':
      e.preventDefault()
      actions.onEscape?.()
      break
    case 'ArrowUp':
      e.preventDefault()
      actions.onArrowUp?.()
      break
    case 'ArrowDown':
      e.preventDefault()
      actions.onArrowDown?.()
      break
    case 'ArrowLeft':
      e.preventDefault()
      actions.onArrowLeft?.()
      break
    case 'ArrowRight':
      e.preventDefault()
      actions.onArrowRight?.()
      break
    case 'Home':
      e.preventDefault()
      actions.onHome?.()
      break
    case 'End':
      e.preventDefault()
      actions.onEnd?.()
      break
  }
}

// Color contrast checker
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g)
    if (!rgb || rgb.length < 3) return 0

    const [r, g, b] = rgb.map(Number)
    const [rs, gs, bs] = [r, g, b].map(c => {
      const normalizedC = c / 255
      return normalizedC <= 0.03928 ? normalizedC / 12.92 : Math.pow((normalizedC + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

export const meetsWCAGStandard = (contrastRatio: number, level: 'AA' | 'AAA' = 'AA'): boolean => {
  return level === 'AA' ? contrastRatio >= 4.5 : contrastRatio >= 7
}

// Skip link generator
export const createSkipLink = (targetId: string, text: string = 'Skip to main content'): HTMLElement => {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = text
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50'
  skipLink.setAttribute('aria-label', text)
  
  return skipLink
}

// Form validation accessibility
export const announceValidationErrors = (errors: string[]) => {
  if (errors.length > 0) {
    const errorMessage = errors.length === 1 
      ? `Error: ${errors[0]}` 
      : `Errors: ${errors.join(', ')}`
    
    announceToScreenReader(errorMessage, 'assertive')
  }
}

// Table accessibility helpers
export const enhanceTableAccessibility = (table: HTMLTableElement) => {
  // Add caption if missing
  if (!table.caption) {
    const caption = document.createElement('caption')
    caption.textContent = 'Data table'
    caption.className = 'sr-only'
    table.insertBefore(caption, table.firstChild)
  }

  // Ensure headers are properly associated
  const headers = table.querySelectorAll('th')
  headers.forEach(header => {
    if (!header.id) {
      header.id = `header-${Math.random().toString(36).substr(2, 9)}`
    }
  })

  // Add scope to headers
  headers.forEach(header => {
    if (!header.getAttribute('scope')) {
      const row = header.closest('tr')
      const isColumnHeader = row?.parentElement?.querySelector('thead')?.contains(row)
      header.setAttribute('scope', isColumnHeader ? 'col' : 'row')
    }
  })
}

// Modal accessibility
export const enhanceModalAccessibility = (modal: HTMLElement, title: string) => {
  // Add aria attributes
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-modal', 'true')
  modal.setAttribute('aria-labelledby', 'modal-title')

  // Add title if missing
  let titleElement = modal.querySelector('#modal-title') as HTMLElement
  if (!titleElement) {
    titleElement = document.createElement('h2')
    titleElement.id = 'modal-title'
    titleElement.textContent = title
    titleElement.className = 'sr-only'
    modal.insertBefore(titleElement, modal.firstChild)
  }

  // Focus management
  const previousFocus = document.activeElement as HTMLElement
  
  // Focus first focusable element
  const firstFocusable = modal.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as HTMLElement
  
  if (firstFocusable) {
    firstFocusable.focus()
  }

  // Return focus cleanup function
  return () => {
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus()
    }
  }
}

// Progress bar accessibility
export const enhanceProgressBarAccessibility = (
  progressBar: HTMLElement, 
  value: number, 
  max: number = 100,
  label?: string
) => {
  progressBar.setAttribute('role', 'progressbar')
  progressBar.setAttribute('aria-valuenow', value.toString())
  progressBar.setAttribute('aria-valuemin', '0')
  progressBar.setAttribute('aria-valuemax', max.toString())
  
  if (label) {
    progressBar.setAttribute('aria-label', label)
  }

  // Announce progress changes
  const percentage = Math.round((value / max) * 100)
  announceToScreenReader(`Progress: ${percentage}%`)
}

// Button accessibility enhancer
export const enhanceButtonAccessibility = (
  button: HTMLElement, 
  label?: string, 
  description?: string
) => {
  if (label && !button.getAttribute('aria-label')) {
    button.setAttribute('aria-label', label)
  }

  if (description) {
    const describedById = `button-desc-${Math.random().toString(36).substr(2, 9)}`
    button.setAttribute('aria-describedby', describedById)
    
    const descriptionElement = document.createElement('span')
    descriptionElement.id = describedById
    descriptionElement.textContent = description
    descriptionElement.className = 'sr-only'
    
    button.appendChild(descriptionElement)
  }

  // Ensure button is keyboard navigable
  if (!button.hasAttribute('tabindex')) {
    button.setAttribute('tabindex', '0')
  }
}

// Link accessibility enhancer
export const enhanceLinkAccessibility = (
  link: HTMLElement, 
  external?: boolean, 
  description?: string
) => {
  if (external && !link.getAttribute('aria-label')) {
    const currentLabel = link.textContent || link.getAttribute('aria-label') || ''
    link.setAttribute('aria-label', `${currentLabel} (opens in new window)`)
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
  }

  if (description) {
    const describedById = `link-desc-${Math.random().toString(36).substr(2, 9)}`
    link.setAttribute('aria-describedby', describedById)
    
    const descriptionElement = document.createElement('span')
    descriptionElement.id = describedById
    descriptionElement.textContent = description
    descriptionElement.className = 'sr-only'
    
    link.appendChild(descriptionElement)
  }
}

// Form field accessibility
export const enhanceFormFieldAccessibility = (
  field: HTMLElement,
  label: string,
  required?: boolean,
  error?: string
) => {
  const fieldId = field.id || `field-${Math.random().toString(36).substr(2, 9)}`
  field.id = fieldId

  // Create or find label
  let labelElement = field.previousElementSibling as HTMLLabelElement
  if (!labelElement || labelElement.tagName !== 'LABEL') {
    labelElement = document.createElement('label')
    labelElement.setAttribute('for', fieldId)
    labelElement.textContent = label
    if (required) {
      labelElement.setAttribute('aria-required', 'true')
      labelElement.innerHTML += ' <span aria-label="required">*</span>'
    }
    field.parentNode?.insertBefore(labelElement, field)
  }

  // Add required attribute
  if (required) {
    field.setAttribute('aria-required', 'true')
    field.setAttribute('required', '')
  }

  // Add error message
  if (error) {
    const errorId = `${fieldId}-error`
    field.setAttribute('aria-describedby', errorId)
    field.setAttribute('aria-invalid', 'true')
    
    let errorElement = document.getElementById(errorId)
    if (!errorElement) {
      errorElement = document.createElement('div')
      errorElement.id = errorId
      errorElement.setAttribute('role', 'alert')
      errorElement.className = 'text-red-600 text-sm mt-1'
      field.parentNode?.insertBefore(errorElement, field.nextSibling)
    }
    errorElement.textContent = error
  }
}

// Reduced motion support
export const checkReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const setReducedMotion = (element: HTMLElement, respect: boolean = true) => {
  if (respect && checkReducedMotion()) {
    element.style.setProperty('--transition-duration', '0.01ms')
    element.style.setProperty('--animation-duration', '0.01ms')
  }
}
