import { supabase } from '../config/supabase'
import { getEnvConfig } from './envConfig'

const config = getEnvConfig()

interface SMSOptions {
  to: string
  message: string
  studentId?: string
  type?: 'student_registration' | 'result_published' | 'attendance_warning' | 'teacher_credentials'
  metadata?: Record<string, any>
}

/**
 * Sends SMS via Termii (Recommended for Nigeria)
 * Documentation: https://termii.com/documentation
 */
export const sendSMS = async (options: SMSOptions) => {
  const { to, message, type, studentId, metadata } = options

  // Ensure phone number is in international format (e.g., 2348012345678)
  let formattedPhone = to.replace(/\D/g, '')
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '234' + formattedPhone.substring(1)
  } else if (!formattedPhone.startsWith('234')) {
    formattedPhone = '234' + formattedPhone
  }

  try {
    // Check if SMS is enabled and API key exists
    if (!process.env.TERMII_API_KEY) {
      console.log('--- MOCK SMS SEND ---')
      console.log(`To: ${formattedPhone}`)
      console.log(`Message: ${message}`)
      console.log('---------------------')
      return { status: 'mocked', message_id: 'mock_' + Date.now() }
    }

    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        from: process.env.TERMII_SENDER_ID || 'FolushoSch',
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: process.env.TERMII_API_KEY,
      }),
    })

    const result = await response.json()

    // Log notification to database
    if (type) {
      try {
        await supabase.from('notifications').insert({
          recipient_email: to, // Using phone field for recipient identifier
          recipient_name: to,
          type: `SMS_${type}`,
          title: 'SMS Notification',
          message: message,
          status: response.ok ? 'SENT' : 'FAILED',
          student_id: studentId,
          metadata: { ...metadata, phone: formattedPhone, provider: 'Termii', provider_response: result },
        })
      } catch (err) {
        console.error('Failed to log SMS notification:', err)
      }
    }

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send SMS via Termii')
    }

    console.log('SMS sent successfully via Termii:', result.message_id)
    return result
  } catch (error) {
    console.error('Error sending SMS:', error)
    
    // Log failed notification
    if (type) {
      try {
        await supabase.from('notifications').insert({
          recipient_email: to,
          recipient_name: to,
          type: `SMS_${type}`,
          title: 'SMS Notification',
          message: message,
          status: 'FAILED',
          student_id: studentId,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          metadata: { ...metadata, phone: formattedPhone },
        })
      } catch (err) {
        console.error('Failed to log SMS notification error:', err)
      }
    }
    throw error
  }
}

/**
 * Specifically for student/parent registration details
 */
export const sendParentCredentialsSMS = async (parentPhone: string, studentName: string, username: string, password: string, studentId?: string) => {
  const message = `Welcome to Folusho Victory Schools! Login details for ${studentName}: Username: ${username}, Password: ${password}. Login at: ${config.FRONTEND_URL}`
  
  return sendSMS({
    to: parentPhone,
    message,
    type: 'student_registration',
    studentId,
    metadata: { username, studentName }
  })
}
