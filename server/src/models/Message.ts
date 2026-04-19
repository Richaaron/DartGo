import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId
  recipientId: mongoose.Types.ObjectId
  content: string
  isRead: boolean
  type: 'general' | 'deadline' | 'caution'
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  type: { type: String, enum: ['general', 'deadline', 'caution'], default: 'general' },
}, { timestamps: true })

export const Message = mongoose.model<IMessage>('Message', MessageSchema)
