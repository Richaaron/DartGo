interface QueuedNotification {
  id: string
  type: 'email' | 'sms'
  recipient: string
  subject?: string
  body: string
  metadata?: Record<string, any>
  retryCount: number
  maxRetries: number
  nextRetryAt: number
  status: 'pending' | 'failed' | 'sent'
  createdAt: number
  lastError?: string
}

class NotificationQueue {
  private queue: QueuedNotification[] = []
  private storageKey = 'notification_queue'
  private isProcessing = false
  private retryDelays = [60000, 300000, 900000, 3600000] // 1min, 5min, 15min, 1hr
  private processInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.loadFromStorage()
    this.startProcessing()
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue())
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load notification queue:', e)
      this.queue = []
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue))
    } catch (e) {
      console.error('Failed to save notification queue:', e)
    }
  }

  add(params: {
    type: 'email' | 'sms'
    recipient: string
    subject?: string
    body: string
    metadata?: Record<string, any>
  }): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const notification: QueuedNotification = {
      id,
      type: params.type,
      recipient: params.recipient,
      subject: params.subject,
      body: params.body,
      metadata: params.metadata,
      retryCount: 0,
      maxRetries: 4,
      nextRetryAt: Date.now(),
      status: 'pending',
      createdAt: Date.now()
    }

    this.queue.push(notification)
    this.saveToStorage()
    this.processQueue()

    return id
  }

  remove(id: string) {
    this.queue = this.queue.filter(n => n.id !== id)
    this.saveToStorage()
  }

  getPending(): QueuedNotification[] {
    return this.queue.filter(n => n.status === 'pending')
  }

  getFailed(): QueuedNotification[] {
    return this.queue.filter(n => n.status === 'failed')
  }

  getAll(): QueuedNotification[] {
    return [...this.queue]
  }

  async retry(id: string): Promise<boolean> {
    const notification = this.queue.find(n => n.id === id)
    if (!notification) return false

    notification.status = 'pending'
    notification.nextRetryAt = Date.now()
    notification.retryCount = 0
    this.saveToStorage()

    return this.processQueue()
  }

  async processQueue(): Promise<boolean> {
    if (this.isProcessing || !navigator.onLine) return false
    
    this.isProcessing = true
    const pending = this.queue.filter(
      n => n.status === 'pending' && n.nextRetryAt <= Date.now()
    )

    let allSuccessful = true

    for (const notification of pending) {
      try {
        if (notification.type === 'email') {
          await this.sendEmail(notification)
        } else {
          await this.sendSMS(notification)
        }
        
        notification.status = 'sent'
        this.queue = this.queue.filter(n => n.id !== notification.id)
      } catch (error) {
        notification.lastError = error instanceof Error ? error.message : 'Unknown error'
        notification.retryCount++
        
        if (notification.retryCount >= notification.maxRetries) {
          notification.status = 'failed'
          allSuccessful = false
        } else {
          notification.nextRetryAt = Date.now() + this.getRetryDelay(notification.retryCount)
        }
      }
    }

    this.saveToStorage()
    this.isProcessing = false

    return allSuccessful
  }

  private getRetryDelay(retryCount: number): number {
    return this.retryDelays[Math.min(retryCount, this.retryDelays.length - 1)]
  }

  private async sendEmail(notification: QueuedNotification): Promise<void> {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email',
        to: notification.recipient,
        subject: notification.subject,
        body: notification.body,
        metadata: notification.metadata
      })
    })

    if (!response.ok) {
      throw new Error(`Email send failed: ${response.status}`)
    }
  }

  private async sendSMS(notification: QueuedNotification): Promise<void> {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sms',
        to: notification.recipient,
        body: notification.body,
        metadata: notification.metadata
      })
    })

    if (!response.ok) {
      throw new Error(`SMS send failed: ${response.status}`)
    }
  }

  private startProcessing() {
    if (this.processInterval) return
    
    this.processInterval = setInterval(() => {
      this.processQueue()
    }, 60000)
  }

  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
    }
  }

  clear() {
    this.queue = []
    this.saveToStorage()
  }
}

export const notificationQueue = new NotificationQueue()

export function queueEmail(params: {
  recipient: string
  subject: string
  body: string
  metadata?: Record<string, any>
}): string {
  return notificationQueue.add({ type: 'email', ...params })
}

export function queueSMS(params: {
  recipient: string
  body: string
  metadata?: Record<string, any>
}): string {
  return notificationQueue.add({ type: 'sms', ...params })
}

export function retryNotification(id: string): Promise<boolean> {
  return notificationQueue.retry(id)
}

export function getFailedNotifications() {
  return notificationQueue.getFailed()
}

export function getPendingNotifications() {
  return notificationQueue.getPending()
}

export default notificationQueue