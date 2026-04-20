import mongoose, { Schema, Document } from 'mongoose'

export interface ICurriculum extends Document {
  name: string
  version: string
  level: 'Pre-Nursery' | 'Nursery' | 'Primary' | 'Secondary' | 'Junior Secondary' | 'Vocational'
  yearsOfStudy: number
  subjects: any[] // Subject IDs or populated Subject documents
  implementationDate: Date
  revisionDate?: Date
  description: string
  curriculum: 'NIGERIAN' | 'IGCSE' | 'OTHER'
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  createdBy: string // Admin user ID
  createdAt: Date
  updatedAt: Date
}

const CurriculumSchema = new Schema<ICurriculum>(
  {
    name: { type: String, required: true },
    version: { type: String, required: true },
    level: { 
      type: String, 
      enum: ['Pre-Nursery', 'Nursery', 'Primary', 'Secondary', 'Junior Secondary', 'Vocational'], 
      required: true 
    },
    yearsOfStudy: { type: Number, required: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    implementationDate: { type: Date, required: true },
    revisionDate: { type: Date },
    description: { type: String },
    curriculum: { 
      type: String, 
      enum: ['NIGERIAN', 'IGCSE', 'OTHER'], 
      default: 'NIGERIAN' 
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'], 
      default: 'DRAFT' 
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
)

export const Curriculum = mongoose.model<ICurriculum>('Curriculum', CurriculumSchema)
