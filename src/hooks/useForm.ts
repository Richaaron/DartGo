/**
 * Custom hooks for form management
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { UseFormResult } from '../types/api'

// Generic form hook
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: (values: T) => Record<keyof T, string>
): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>)
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((field: keyof T) => (value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validate field on blur if validation schema exists
    if (validationSchema) {
      const fieldErrors = validationSchema(values)
      if (fieldErrors[field]) {
        setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
      }
    }
  }, [validationSchema, values])

  const validate = useCallback(() => {
    if (!validationSchema) return true
    
    const newErrors = validationSchema(values)
    const hasErrors = Object.values(newErrors).some(error => error)
    
    setErrors(newErrors)
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}) as Record<keyof T, boolean>)
    
    return !hasErrors
  }, [validationSchema, values])

  const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => {
    return async (e?: React.FormEvent) => {
      e?.preventDefault()
      
      if (!validate()) return
      
      setIsSubmitting(true)
      
      try {
        await onSubmit(values)
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [validate, values])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({} as Record<keyof T, string>)
    setTouched({} as Record<keyof T, boolean>)
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const isValid = validationSchema ? !Object.values(validationSchema(values)).some(error => error) : true

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    handleBlur
  }
}

// Hook for form field validation
export function useFieldValidation<T>(
  value: T,
  rules: Array<(value: T) => string | null>
): { error: string | null; isValid: boolean } {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateField = () => {
      for (const rule of rules) {
        const ruleError = rule(value)
        if (ruleError) {
          setError(ruleError)
          return
        }
      }
      setError(null)
    }

    validateField()
  }, [value, rules])

  return {
    error,
    isValid: error === null
  }
}

// Hook for form submission with loading states
export function useFormSubmission<T>(
  submitFunction: (values: T) => Promise<any>,
  onSuccess?: (result: any) => void,
  onError?: (error: string) => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submit = useCallback(async (values: T) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await submitFunction(values)
      setSuccess(true)
      onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Submission failed'
      setError(errorMessage)
      onError?.(errorMessage)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [submitFunction, onSuccess, onError])

  const reset = useCallback(() => {
    setError(null)
    setSuccess(false)
  }, [])

  return {
    submit,
    isSubmitting,
    error,
    success,
    reset
  }
}

// Hook for multi-step forms
export function useMultiStepForm<T extends Record<string, any>>(
  steps: Array<keyof T>,
  initialValues: T
) {
  const [currentStep, setCurrentStep] = useState(0)
  const [values, setValues] = useState<T>(initialValues)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const currentStepKey = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const updateValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(prev => prev + 1)
    }
  }, [isLastStep, currentStep])

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }, [isFirstStep])

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex)
    }
  }, [steps.length])

  const markStepComplete = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]))
  }, [])

  const isStepCompleted = useCallback((stepIndex: number) => {
    return completedSteps.has(stepIndex)
  }, [completedSteps])

  const progress = ((currentStep + 1) / steps.length) * 100

  return {
    currentStep,
    currentStepKey,
    values,
    isLastStep,
    isFirstStep,
    progress,
    nextStep,
    prevStep,
    goToStep,
    updateValue,
    markStepComplete,
    isStepCompleted,
    completedSteps: Array.from(completedSteps)
  }
}

// Hook for form persistence
export function useFormPersistence<T>(
  key: string,
  initialValues: T,
  enablePersistence: boolean = true
) {
  const [values, setValues] = useState<T>(() => {
    if (!enablePersistence) return initialValues
    
    try {
      const saved = localStorage.getItem(key)
      return saved ? { ...initialValues, ...JSON.parse(saved) } : initialValues
    } catch {
      return initialValues
    }
  })

  const updateValues = useCallback((newValues: Partial<T>) => {
    const updated = { ...values, ...newValues }
    setValues(updated)
    
    if (enablePersistence) {
      try {
        localStorage.setItem(key, JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
    }
  }, [values, key, enablePersistence])

  const clearPersistedValues = useCallback(() => {
    if (enablePersistence) {
      try {
        localStorage.removeItem(key)
      } catch {
        // Ignore storage errors
      }
    }
    setValues(initialValues)
  }, [key, initialValues, enablePersistence])

  return {
    values,
    updateValues,
    clearPersistedValues
  }
}

// Hook for form auto-save
export function useFormAutoSave<T>(
  values: T,
  saveFunction: (values: T) => Promise<void>,
  delay: number = 1000
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        await saveFunction(values)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [values, saveFunction, delay])

  return {
    isSaving,
    lastSaved
  }
}
