import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  recipientEmail: string
  recipientName: string
  type: 'student_registration' | 'result_published' | 'attendance_warning' | 'low_grades' | 'teacher_assigned' | 'fee_reminder'
  subject: string
  body: string
  status: 'sent' | 'failed' | 'pending'
  studentId?: mongoose.Types.ObjectId
  teacherId?: mongoose.Types.ObjectId
  sentAt?: Date
  errorMessage?: string
  metadata?: Record<string, any>
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>({
  recipientEmail: { type: String, required: true },
  recipientName: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['student_registration', 'result_published', 'attendance_warning', 'low_grades', 'teacher_assigned', 'fee_reminder'],
    required: true 
  },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  sentAt: { type: Date },
  errorMessage: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

// Index for efficient queries
NotificationSchema.index({ recipientEmail: 1, createdAt: -1 })
NotificationSchema.index({ status: 1, createdAt: -1 })
NotificationSchema.index({ studentId: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
