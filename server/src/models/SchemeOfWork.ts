import mongoose, { Schema, Document } from 'mongoose'

export interface ISchemeOfWork extends Document {
  teacherId: string
  subjectId: string
  classId: string
  academicYear: string
  term: number
  curriculumId: string
  topics: {
    weekNumber: number
    topic: string
    duration: number // in weeks
    objectives: string[]
    resources: string[]
    assessmentMethod: string
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
  }[]
  uploadedBy: string
  uploadedDate: Date
  lastUpdated: Date
  version: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ACTIVE'
  approvedBy?: string
  approvalDate?: Date
  notes: string
  createdAt: Date
  updatedAt: Date
}

const TopicSchema = new Schema({
  weekNumber: { type: Number, required: true },
  topic: { type: String, required: true },
  duration: { type: Number, required: true },
  objectives: [{ type: String }],
  resources: [{ type: String }],
  assessmentMethod: { type: String },
  status: { 
    type: String, 
    enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED'], 
    default: 'PLANNED' 
  },
})

const SchemeOfWorkSchema = new Schema<ISchemeOfWork>(
  {
    teacherId: { type: String, required: true },
    subjectId: { type: String, required: true },
    classId: { type: String, required: true },
    academicYear: { type: String, required: true },
    term: { type: Number, required: true },
    curriculumId: { type: String, required: true },
    topics: [TopicSchema],
    uploadedBy: { type: String, required: true },
    uploadedDate: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    status: { 
      type: String, 
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE'], 
      default: 'DRAFT' 
    },
    approvedBy: { type: String },
    approvalDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
)

// Create indexes for faster queries
SchemeOfWorkSchema.index({ teacherId: 1 })
SchemeOfWorkSchema.index({ teacherId: 1, academicYear: -1, term: -1 })
SchemeOfWorkSchema.index({ subjectId: 1 })
SchemeOfWorkSchema.index({ classId: 1 })

export const SchemeOfWork = mongoose.model<ISchemeOfWork>('SchemeOfWork', SchemeOfWorkSchema)
