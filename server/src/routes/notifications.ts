import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize } from '../middleware/auth'
import { sendEmail } from '../utils/email'

const router = Router()

// Test email endpoint
router.post('/test-email', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' })
    }

    console.log(`[NOTIF] Sending test email to: ${email}`)
    
    await sendEmail({
      to: email,
      subject: 'Test Notification - Folusho Victory Schools',
      text: 'This is a test email notification from your Folusho Victory Schools Result Management System.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #7c3aed;">Notification Test</h1>
          <p>This is a test email notification from your <strong>Folusho Victory Schools Result Management System</strong>.</p>
          <p>If you are receiving this, your email configuration (SMTP) is working perfectly!</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #64748b;">This email was triggered by the Admin Health Check.</p>
        </div>
      `,
      type: 'teacher_assigned' // Using an existing valid type
    })

    res.json({ message: 'Test email sent successfully! Please check your inbox.' })
  } catch (error) {
    console.error('[NOTIF] Test email failed:', error)
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: error instanceof Error ? error.message : String(error) 
    })
  }
})

// Helper to map Supabase notification to old MongoDB format for frontend compatibility
const mapNotification = (n: any) => ({
  _id: n.id,
  recipientEmail: n.recipient_email,
  recipientName: n.recipient_name,
  type: n.type,
  subject: n.title,
  body: n.message,
  status: n.status?.toLowerCase(),
  studentId: n.student_id,
  errorMessage: n.error_message,
  metadata: n.metadata,
  createdAt: n.created_at,
  sentAt: n.created_at
})

// Get all notifications (admin only)
router.get('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { status, type, limit = '50', page = '1' } = req.query
    const limitInt = parseInt(limit as string)
    const pageInt = parseInt(page as string)
    const from = (pageInt - 1) * limitInt
    const to = from + limitInt - 1

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (status) query = query.eq('status', (status as string).toUpperCase())
    if (type) query = query.eq('type', type)
    
    const { data, count, error } = await query

    if (error) throw error
    
    res.json({
      notifications: data?.map(mapNotification) || [],
      total: count,
      page: pageInt,
      pages: Math.ceil((count || 0) / limitInt)
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Get notifications for a student
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('student_id', req.params.studentId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    res.json(data?.map(mapNotification) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student notifications' })
  }
})

// Get notification statistics
router.get('/stats/summary', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { count: totalSent, error: sentError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SENT')

    const { count: totalFailed, error: failedError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'FAILED')

    const { count: totalUnread, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'UNREAD')

    if (sentError || failedError || unreadError) throw (sentError || failedError || unreadError)

    // For type aggregation, we might need a RPC or just fetch all and aggregate in JS 
    // since Supabase/PostgREST aggregation is limited without RPC
    const { data: typeData, error: typeError } = await supabase
      .from('notifications')
      .select('type')

    if (typeError) throw typeError

    const byTypeMap: Record<string, number> = {}
    typeData.forEach(item => {
      byTypeMap[item.type] = (byTypeMap[item.type] || 0) + 1
    })

    const byType = Object.entries(byTypeMap).map(([_id, count]) => ({ _id, count }))
    
    res.json({
      summary: {
        totalSent: totalSent || 0,
        totalFailed: totalFailed || 0,
        totalUnread: totalUnread || 0,
        total: (totalSent || 0) + (totalFailed || 0) + (totalUnread || 0)
      },
      byType
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notification statistics' })
  }
})

// Resend a failed notification
router.post('/:id/resend', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (fetchError || !notification) return res.status(404).json({ error: 'Notification not found' })
    
    // Mark as pending for retry (or just update status and let some worker handle it)
    // For now, we'll just update the status to 'PENDING'
    const { data: updated, error: updateError } = await supabase
      .from('notifications')
      .update({ 
        status: 'PENDING',
        error_message: null
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (updateError) throw updateError
    
    res.json({ message: 'Notification marked for retry', notification: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to resend notification' })
  }
})

// Delete a notification record
router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Notification deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

export default router
