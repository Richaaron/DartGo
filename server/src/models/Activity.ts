import mongoose, { Schema, Document } from 'mongoose'

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId
  userName: string
  role: string
  action: string
  details: string
  createdAt: Date
}

const ActivitySchema = new Schema<IActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
}, { timestamps: true })

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema)
