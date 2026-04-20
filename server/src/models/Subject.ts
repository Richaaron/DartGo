import mongoose, { Schema, Document } from 'mongoose'

export interface ITopic {
  weekNumber: number
  topicName: string
  objectives: string[]
  duration: number // hours
  resources: string[]
  assessmentMethod: string
}

export interface ISubject extends Document {
  name: string
  code: string
  level: 'Pre-Nursery' | 'Nursery' | 'Primary' | 'Secondary' | 'Junior Secondary' | 'Vocational'
  creditUnits: number
  subjectCategory?: 'CORE' | 'ELECTIVE' | 'VOCATIONAL'
  description?: string
  curriculumType: 'NIGERIAN' | 'IGCSE' | 'OTHER'
  prerequisiteSubjects?: string[]
  topics?: ITopic[]
}

const TopicSchema = new Schema<ITopic>({
  weekNumber: { type: Number, required: true },
  topicName: { type: String, required: true },
  objectives: [{ type: String }],
  duration: { type: Number, default: 5 }, // hours per week
  resources: [{ type: String }],
  assessmentMethod: { type: String, default: 'Quiz' },
})

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    level: { type: String, enum: ['Pre-Nursery', 'Nursery', 'Primary', 'Secondary', 'Junior Secondary', 'Vocational'], required: true },
    creditUnits: { type: Number, default: 0 },
    subjectCategory: { type: String, enum: ['CORE', 'ELECTIVE', 'VOCATIONAL'], default: 'CORE' },
    description: { type: String },
    curriculumType: { type: String, enum: ['NIGERIAN', 'IGCSE', 'OTHER'], default: 'NIGERIAN' },
    prerequisiteSubjects: [{ type: String }],
    topics: [TopicSchema],
  },
  { timestamps: true }
)

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema)
