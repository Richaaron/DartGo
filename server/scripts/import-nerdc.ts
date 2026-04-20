import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { connectDB } from '../src/config/db.js'
import { Subject } from '../src/models/Subject.js'
import { SchemeOfWork } from '../src/models/SchemeOfWork.js'
import { Curriculum } from '../src/models/Curriculum.js'
import { Teacher } from '../src/models/Teacher.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NERDC_DATA_DIR = path.join(__dirname, '../../nerdc-curriculum-data')

interface TopicData {
  weekNumber: number
  topicName: string
  objectives: string[]
  duration: number
  resources: string[]
  assessmentMethod: string
}

interface SubjectData {
  subjectName: string
  subjectCode: string
  level: string
  creditUnits: number
  subjectCategory: string
  topics: TopicData[]
}

// Map term names to numbers
const termMap: Record<string, number> = {
  'First Term': 1,
  'Second Term': 2,
  'Third Term': 3,
}

async function importNERDCCurriculum() {
  try {
    console.log('[IMPORT] Connecting to MongoDB...')
    await connectDB()
    console.log('✅ Connected to MongoDB')

    // Get default teacher for import
    let defaultTeacher = await Teacher.findOne({ username: 'teacher1' })
    if (!defaultTeacher) {
      console.warn('⚠️  Default teacher not found, creating import teacher...')
      defaultTeacher = await Teacher.create({
        email: 'import@folusho.com',
        name: 'Import User',
        username: 'import-user',
        password: 'Import123!@#',
        subject: 'General',
        level: 'All',
        teacherId: 'IMP-001',
        assignedClasses: [],
      })
    }

    // Read all JSON files from nerdc-curriculum-data
    const levels = ['pre-primary', 'primary', 'secondary', 'vocational']
    const levelMap: Record<string, string> = {
      'pre-primary': 'Primary',  // Map Pre-Nursery to Primary for curriculum matching
      'primary': 'Primary',
      'secondary': 'Secondary',
      'vocational': 'Vocational',
    }
    
    // Map file level to subject level enum
    const subjectLevelMap: Record<string, string> = {
      'pre-primary': 'Pre-Nursery',
      'primary': 'Primary',
      'secondary': 'Secondary',
      'vocational': 'Vocational',
    }

    let totalSubjectsImported = 0
    let totalSchemesCreated = 0

    for (const levelFolder of levels) {
      const levelPath = path.join(NERDC_DATA_DIR, levelFolder)
      
      if (!fs.existsSync(levelPath)) {
        console.log(`⚠️  Folder not found: ${levelPath}`)
        continue
      }

      const files = fs.readdirSync(levelPath).filter(f => f.endsWith('.json'))
      console.log(`\n📚 Processing ${levelFolder} - Found ${files.length} subject files`)

      for (const file of files) {
        const filePath = path.join(levelPath, file)
        const rawData = fs.readFileSync(filePath, 'utf-8')
        const subjectData: SubjectData = JSON.parse(rawData)

        // Validate data
        if (!subjectData.subjectName || !subjectData.topics || subjectData.topics.length === 0) {
          console.error(`❌ Invalid data in ${file}: Missing required fields`)
          continue
        }

        try {
          // Check if subject already exists
          const existingSubject = await Subject.findOne({
            name: subjectData.subjectName,
            level: subjectData.level,
          })

          let subjectId: any

          if (existingSubject) {
            console.log(`  ℹ️  Subject already exists: ${subjectData.subjectName}`)
            subjectId = existingSubject._id
          } else {
            // Create subject
            const newSubject = await Subject.create({
              name: subjectData.subjectName,
              code: subjectData.subjectCode,
              level: subjectData.level,
              creditUnits: subjectData.creditUnits,
              subjectCategory: subjectData.subjectCategory,
              curriculumType: 'NIGERIAN',
              description: `NERDC ${subjectData.level} ${subjectData.subjectName}`,
            })
            subjectId = newSubject._id
            totalSubjectsImported++
            console.log(`  ✅ Created subject: ${subjectData.subjectName}`)
          }

          // Delete existing scheme of work for this subject
          await SchemeOfWork.deleteMany({ subjectId })

          // Get curriculum for this level
          const curriculumLevel = levelMap[levelFolder]
          const curriculum = await Curriculum.findOne({ level: curriculumLevel })

          if (!curriculum) {
            console.warn(`  ⚠️  No curriculum found for level: ${curriculumLevel}`)
            continue
          }

          // Define classes for each level folder
          const classMap: Record<string, any[]> = {
            'pre-primary': ['Pre-Nursery A', 'Pre-Nursery B', 'Nursery A', 'Nursery B', 'Nursery C'],
            'primary': ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
            'secondary': [
              'JSS 1A', 'JSS 1B', 'JSS 2A', 'JSS 2B', 'JSS 3A', 'JSS 3B',
              'SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B', 'SSS 3A', 'SSS 3B',
            ],
            'vocational': ['Class A', 'Class B', 'Class C'],
          }

          const classes = classMap[levelFolder] || ['Class A']

          // Create scheme of work for each class and each term
          let schemeCount = 0
          for (const className of classes) {
            for (let termNum = 1; termNum <= 3; termNum++) {
              // Convert topic structure to match model
              const convertedTopics = subjectData.topics.map(topic => ({
                weekNumber: topic.weekNumber,
                topic: topic.topicName,  // Map topicName to topic field
                duration: topic.duration,
                objectives: topic.objectives,
                resources: topic.resources,
                assessmentMethod: topic.assessmentMethod,
                status: 'PLANNED' as const,
              }))

              try {
                const scheme = await SchemeOfWork.create({
                  teacherId: defaultTeacher.email,  // Use email instead of ID
                  subjectId: subjectId.toString(),
                  classId: className,  // Using className as classId for now
                  curriculumId: curriculum._id.toString(),
                  academicYear: new Date().getFullYear().toString(),
                  term: termNum,
                  topics: convertedTopics,
                  uploadedBy: defaultTeacher.email,
                  uploadedDate: new Date(),
                  lastUpdated: new Date(),
                  version: 1,
                  status: 'ACTIVE',
                  notes: `NERDC ${subjectData.level} Curriculum - Term ${termNum}`,
                })

                totalSchemesCreated++
                schemeCount++
              } catch (schemeError) {
                console.error(`    ❌ Failed to create scheme for ${className} Term ${termNum}:`, 
                  schemeError instanceof Error ? schemeError.message : schemeError)
              }
            }
          }

          console.log(`  📝 Created ${schemeCount} scheme of work records`)
        } catch (error) {
          console.error(`  ❌ Error processing ${file}:`, error instanceof Error ? error.message : error)
        }
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log('✅ NERDC CURRICULUM IMPORT COMPLETED')
    console.log(`${'='.repeat(60)}`)
    console.log(`📊 Summary:`)
    console.log(`   • Subjects Created/Updated: ${totalSubjectsImported}`)
    console.log(`   • Scheme of Work Records: ${totalSchemesCreated}`)
    console.log(`\n📂 Data Source: ${NERDC_DATA_DIR}`)
    console.log(`${'='.repeat(60)}\n`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

// Run the import
importNERDCCurriculum()
