import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TXT_FILE = process.argv[2]
const OUTPUT_DIR = path.join(__dirname, '../../nerdc-curriculum-data')

interface ParsedTopic {
  weekNumber: number
  topicName: string
  objectives: string[]
  duration: number
  resources: string[]
  assessmentMethod: string
}

interface ParsedSubject {
  subjectName: string
  subjectCode: string
  level: string
  creditUnits: number
  subjectCategory: string
  topics: ParsedTopic[]
}

// Extract objectives from teacher's activities text
function extractObjectives(teacherText: string): string[] {
  const objectives: string[] = []
  const lines = teacherText.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('i.') || trimmed.startsWith('ii.') || trimmed.startsWith('iii.') || 
        trimmed.startsWith('iv.') || trimmed.startsWith('v.') || trimmed.startsWith('vi.')) {
      const text = trimmed.replace(/^(i{1,6}\.|iv\.|v\.|vi\.)\s+/, '').trim()
      if (text.length > 10) {
        objectives.push(text)
      }
    }
  }
  
  return objectives.length > 0 ? objectives : ['Complete the lesson activities']
}

// Extract resources from learning resources column
function extractResources(resourcesText: string): string[] {
  return resourcesText
    .split('\n')
    .map(r => r.trim())
    .filter(r => r.length > 0 && r !== '-')
}

// Parse a scheme table from text
function parseSchemeTable(text: string, subject: string, level: string, term: string) {
  const topics: ParsedTopic[] = []
  
  // Split by lines and identify rows
  const lines = text.split('\n')
  let currentWeek = 0
  let currentTopic = ''
  let currentTeacherActivities = ''
  let currentPupilActivities = ''
  let currentResources = ''
  let isParsingRow = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Try to detect week number
    const weekMatch = line.match(/^(\d+)\s+/)
    if (weekMatch) {
      if (currentWeek > 0 && currentTopic) {
        const topic: ParsedTopic = {
          weekNumber: currentWeek,
          topicName: currentTopic,
          objectives: extractObjectives(currentTeacherActivities),
          duration: 45,
          resources: extractResources(currentResources),
          assessmentMethod: 'Observation and participation',
        }
        topics.push(topic)
      }

      currentWeek = parseInt(weekMatch[1])
      currentTopic = line.replace(weekMatch[0], '').split(/\s+/)[0] // Get first few words
      currentTeacherActivities = ''
      currentPupilActivities = ''
      currentResources = ''
      isParsingRow = true
    } else if (isParsingRow && line.length > 0) {
      // Accumulate activities and resources
      if (line.includes('Teacher') || line.startsWith('i.') || line.startsWith('ii.')) {
        currentTeacherActivities += '\n' + line
      } else if (line.includes('Pupil') || line.startsWith('Pupils')) {
        currentPupilActivities += '\n' + line
      } else {
        currentResources += '\n' + line
      }
    }
  }

  // Add last topic
  if (currentWeek > 0 && currentTopic) {
    const topic: ParsedTopic = {
      weekNumber: currentWeek,
      topicName: currentTopic,
      objectives: extractObjectives(currentTeacherActivities),
      duration: 45,
      resources: extractResources(currentResources),
      assessmentMethod: 'Observation and participation',
    }
    topics.push(topic)
  }

  return topics
}

// Map subjects with codes
const subjectCodes: Record<string, string> = {
  'Health Habits': 'HH',
  'Handwriting': 'HW',
  'Literacy': 'LIT',
  'Numeracy': 'NUM',
  'Pre-Science': 'PS',
  'Social Habits': 'SH',
  'English Language': 'ENG',
  'Mathematics': 'MTH',
  'Basic Science': 'BSC',
  'Physical and Health Education': 'PHE',
  'Christian Religious Studies': 'CRS',
  'Islamic Studies': 'IRS',
  'Nigerian History': 'NH',
  'Social and Citizenship Studies': 'SCS',
  'Cultural and Creative Arts': 'CCA',
}

// Parse TXT file and create subject files
function parseTXTFile(filePath: string) {
  console.log(`\n📖 Reading TXT file: ${filePath}`)

  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Extract sections for each level
  const levelSections = {
    'Pre-Nursery': content.match(/PRE-NURSERY([\s\S]*?)(?=NURSERY 1|NURSERY|$)/i),
    'Nursery': content.match(/NURSERY.*?([\s\S]*?)(?=PRIMARY|$)/i),
    'Primary': content.match(/PRIMARY([\s\S]*?)$/i),
  }

  let totalCreated = 0

  // Process Pre-Nursery
  if (levelSections['Pre-Nursery']) {
    console.log('\n📚 Processing Pre-Nursery subjects...')
    
    const subjects = ['Health Habits', 'Handwriting', 'Literacy', 'Numeracy', 'Pre-Science', 'Social Habits']
    
    for (const subject of subjects) {
      const topics = parseSchemeTable(
        levelSections['Pre-Nursery'][1],
        subject,
        'Pre-Nursery',
        'All Terms'
      )

      if (topics.length > 0) {
        const subjectData: ParsedSubject = {
          subjectName: subject,
          subjectCode: `${subjectCodes[subject] || 'XX'}-PRE`,
          level: 'Pre-Nursery',
          creditUnits: 2,
          subjectCategory: 'CORE',
          topics: topics.slice(0, 13), // Limit to 13 weeks
        }

        const fileName = subject.replace(/\s+/g, '-').toLowerCase()
        const outputPath = path.join(OUTPUT_DIR, 'pre-primary', `${fileName}.json`)
        
        // Create directory if not exists
        const dir = path.dirname(outputPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(outputPath, JSON.stringify(subjectData, null, 2))
        console.log(`  ✅ Created: ${fileName}.json (${topics.length} weeks)`)
        totalCreated++
      }
    }
  }

  // Process Primary
  if (levelSections['Primary']) {
    console.log('\n📚 Processing Primary subjects...')
    
    const primaryMatch = levelSections['Primary'][1]
    const subjects = [
      'English Language',
      'Mathematics',
      'Basic Science',
      'Physical and Health Education',
      'Christian Religious Studies',
      'Islamic Studies',
      'Nigerian History',
      'Social and Citizenship Studies',
      'Cultural and Creative Arts',
    ]

    for (const subject of subjects) {
      const topics = parseSchemeTable(
        primaryMatch,
        subject,
        'Primary',
        'All Terms'
      )

      if (topics.length > 0) {
        const subjectData: ParsedSubject = {
          subjectName: subject,
          subjectCode: `${subjectCodes[subject] || 'XX'}-PR`,
          level: 'Primary',
          creditUnits: 3,
          subjectCategory: 'CORE',
          topics: topics.slice(0, 13),
        }

        const fileName = subject.replace(/\s+/g, '-').toLowerCase()
        const outputPath = path.join(OUTPUT_DIR, 'primary', `${fileName}.json`)
        
        const dir = path.dirname(outputPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(outputPath, JSON.stringify(subjectData, null, 2))
        console.log(`  ✅ Created: ${fileName}.json (${topics.length} weeks)`)
        totalCreated++
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`✅ TXT PARSING COMPLETED`)
  console.log(`${'='.repeat(60)}`)
  console.log(`📊 Summary:`)
  console.log(`   • JSON Files Created: ${totalCreated}`)
  console.log(`   • Output Directory: ${OUTPUT_DIR}`)
  console.log(`\n💡 Next: Run "npm run import-nerdc" to import into database`)
  console.log(`${'='.repeat(60)}\n`)
}

// Main execution
if (!TXT_FILE) {
  console.error('❌ Error: Please provide path to TXT file')
  console.error('Usage: npx tsx scripts/parse-txt-nerdc.ts <path-to-txt-file>')
  process.exit(1)
}

if (!fs.existsSync(TXT_FILE)) {
  console.error(`❌ Error: File not found: ${TXT_FILE}`)
  process.exit(1)
}

parseTXTFile(TXT_FILE)
