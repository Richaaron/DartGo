/**
 * Analytics and monitoring utilities
 */

// Performance metrics
export interface PerformanceMetrics {
  pageLoad: number
  apiResponse: number
  renderTime: number
  memoryUsage: number
  errorCount: number
  userInteractions: number
}

// User behavior tracking
export interface UserBehavior {
  sessionId: string
  userId?: string
  events: AnalyticsEvent[]
  startTime: number
  lastActivity: number
}

// Analytics event
export interface AnalyticsEvent {
  type: 'page_view' | 'click' | 'form_submit' | 'error' | 'api_call' | 'search' | 'download'
  category: string
  action: string
  label?: string
  value?: number
  timestamp: number
  metadata?: Record<string, any>
}

// Web Vitals
export interface WebVitals {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
}

// Error tracking
export interface ErrorInfo {
  message: string
  stack: string
  filename: string
  lineno: number
  colno: number
  timestamp: number
  userAgent: string
  userId?: string
  sessionId: string
}

// Analytics manager
export class AnalyticsManager {
  private static instance: AnalyticsManager
  private behavior: UserBehavior
  private metrics: PerformanceMetrics
  private vitals: Partial<WebVitals>
  private config: AnalyticsConfig

  private constructor(config: AnalyticsConfig) {
    this.config = config
    this.behavior = this.initializeSession()
    this.metrics = this.initializeMetrics()
    this.vitals = {}
    this.setupPerformanceMonitoring()
    this.setupErrorTracking()
  }

  static getInstance(config?: AnalyticsConfig): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager(config || {})
    }
    return AnalyticsManager.instance
  }

  private initializeSession(): UserBehavior {
    return {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      events: []
    }
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      pageLoad: 0,
      apiResponse: 0,
      renderTime: 0,
      memoryUsage: 0,
      errorCount: 0,
      userInteractions: 0
    }
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // Event tracking
  trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now()
    }

    this.behavior.events.push(fullEvent)
    this.behavior.lastActivity = Date.now()

    if (event.type === 'click' || event.type === 'form_submit') {
      this.metrics.userInteractions++
    }

    // Send to analytics service
    this.sendEvent(fullEvent)
  }

  // Page view tracking
  trackPageView(page: string, title?: string): void {
    this.trackEvent({
      type: 'page_view',
      category: 'navigation',
      action: 'page_view',
      label: page,
      metadata: { title }
    })
  }

  // Form submission tracking
  trackFormSubmit(formName: string, success: boolean, errors?: string[]): void {
    this.trackEvent({
      type: 'form_submit',
      category: 'forms',
      action: 'submit',
      label: formName,
      value: success ? 1 : 0,
      metadata: { errors }
    })
  }

  // API call tracking
  trackApiCall(endpoint: string, method: string, duration: number, success: boolean): void {
    this.trackEvent({
      type: 'api_call',
      category: 'api',
      action: method.toLowerCase(),
      label: endpoint,
      value: duration,
      metadata: { success }
    })

    this.metrics.apiResponse = duration
  }

  // Error tracking
  trackError(error: Error, context?: string): void {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack || '',
      filename: '',
      lineno: 0,
      colno: 0,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      sessionId: this.behavior.sessionId
    }

    this.trackEvent({
      type: 'error',
      category: 'errors',
      action: 'javascript_error',
      label: context || 'unknown',
      metadata: errorInfo
    })

    this.metrics.errorCount++
  }

  // Search tracking
  trackSearch(query: string, resultCount: number, category?: string): void {
    this.trackEvent({
      type: 'search',
      category: 'search',
      action: 'query',
      label: category || 'general',
      value: resultCount,
      metadata: { query }
    })
  }

  // Download tracking
  trackDownload(filename: string, fileType: string): void {
    this.trackEvent({
      type: 'download',
      category: 'downloads',
      action: 'file_download',
      label: fileType,
      metadata: { filename }
    })
  }

  // Performance monitoring setup
  private setupPerformanceMonitoring(): void {
    // Page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.metrics.pageLoad = navigation.loadEventEnd - navigation.fetchStart
      }
    })

    // Web Vitals
    this.observeWebVitals()
  }

  // Web Vitals observation
  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.vitals.lcp = lastEntry.startTime
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.vitals.fid = entry.processingStart - entry.startTime
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          this.vitals.cls = clsValue
        }
      })
    }).observe({ entryTypes: ['layout-shift'] })

    // First Contentful Paint (FCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        this.vitals.fcp = fcpEntry.startTime
      }
    }).observe({ entryTypes: ['paint'] })
  }

  // Error tracking setup
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), event.filename)
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), 'unhandled_promise_rejection')
    })
  }

  // Memory usage monitoring
  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsage = memory.usedJSHeapSize
      return memory.usedJSHeapSize
    }
    return 0
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    this.getMemoryUsage()
    return { ...this.metrics }
  }

  // Get Web Vitals
  getWebVitals(): WebVitals {
    return {
      lcp: this.vitals.lcp || 0,
      fid: this.vitals.fid || 0,
      cls: this.vitals.cls || 0,
      fcp: this.vitals.fcp || 0,
      ttfb: this.vitals.ttfb || 0
    }
  }

  // Get user behavior data
  getUserBehavior(): UserBehavior {
    return { ...this.behavior }
  }

  // Send event to analytics service
  private sendEvent(event: AnalyticsEvent): void {
    if (!this.config.enabled) return

    // In production, this would send to your analytics service
    if (this.config.debug) {
      console.log('Analytics Event:', event)
    }

    // Example: Send to Google Analytics, Mixpanel, or custom endpoint
    if (this.config.endpoint) {
      fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(error => {
        console.warn('Failed to send analytics event:', error)
      })
    }
  }

  // Send batch events
  async sendBatchEvents(): Promise<void> {
    if (this.behavior.events.length === 0) return

    const events = [...this.behavior.events]
    this.behavior.events = []

    if (this.config.endpoint) {
      try {
        await fetch(this.config.endpoint + '/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events })
        })
      } catch (error) {
        console.warn('Failed to send batch analytics events:', error)
        // Re-add events on failure
        this.behavior.events.unshift(...events)
      }
    }
  }

  // Set user ID for cross-session tracking
  setUserId(userId: string): void {
    this.behavior.userId = userId
  }

  // Reset session
  resetSession(): void {
    this.behavior = this.initializeSession()
    this.metrics = this.initializeMetrics()
  }
}

// Analytics configuration
interface AnalyticsConfig {
  enabled: boolean
  debug: boolean
  endpoint?: string
  sampleRate: number
}

// React hooks for analytics
export function useAnalytics() {
  const analytics = AnalyticsManager.getInstance()

  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackFormSubmit: analytics.trackFormSubmit.bind(analytics),
    trackApiCall: analytics.trackApiCall.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackDownload: analytics.trackDownload.bind(analytics),
    getMetrics: analytics.getMetrics.bind(analytics),
    getWebVitals: analytics.getWebVitals.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    resetSession: analytics.resetSession.bind(analytics)
  }
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [vitals, setVitals] = useState<WebVitals | null>(null)
  const analytics = AnalyticsManager.getInstance()

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(analytics.getMetrics())
      setVitals(analytics.getWebVitals())
    }

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000)
    updateMetrics()

    return () => clearInterval(interval)
  }, [analytics])

  return { metrics, vitals }
}

// Initialize analytics
export const analytics = AnalyticsManager.getInstance({
  enabled: import.meta.env.PROD,
  debug: import.meta.env.DEV,
  sampleRate: 1.0
})
