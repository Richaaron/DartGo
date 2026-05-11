import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const CURRICULUM_DATA_DIR = path.join(__dirname, '../../nerdc-curriculum-data')

async function importSubjects() {
  console.log('--- Starting NERDC Curriculum Import ---')
  
  // 1. Get all subject files
  const levels = ['pre-primary', 'primary', 'secondary', 'vocational']
  const allSubjects: any[] = []

  for (const levelDir of levels) {
    const fullPath = path.join(CURRICULUM_DATA_DIR, levelDir)
    if (!fs.existsSync(fullPath)) {
      console.warn(`Directory not found: ${fullPath}`)
      continue
    }

    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json'))
    console.log(`Found ${files.length} subjects in ${levelDir}`)

    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(path.join(fullPath, file), 'utf8'))
      
      // Map granular levels to DB enum (Pre-Nursery, Nursery, Primary, Secondary)
      const mapLevel = (lvl: string) => {
        const l = lvl.toLowerCase()
        if (l.includes('pre-nursery') || l.includes('pre-primary')) return 'Pre-Nursery'
        if (l.includes('nursery')) return 'Nursery'
        if (l.includes('primary')) return 'Primary'
        if (l.includes('secondary') || l.includes('vocational') || l.includes('vt')) return 'Secondary'
        return 'Secondary' // Default fallback
      }

      // Map to DB schema
      allSubjects.push({
        name: content.subjectName,
        code: content.subjectCode,
        level: mapLevel(content.level),
        credit_units: content.creditUnits || 0,
        subject_category: content.subjectCategory || 'General',
        curriculum_type: 'NIGERIAN',
        description: content.description || `${content.subjectName} curriculum for ${content.level}`,
        topics: content.topics || []
      })
    }
  }

  if (allSubjects.length === 0) {
    console.error('No subjects found to import!')
    return
  }

  console.log(`Total subjects prepared: ${allSubjects.length}`)

  // 2. Clear existing subjects (Except those with specific IDs if needed, but here we wipe clean as requested)
  console.log('Cleaning existing subjects table...')
  const { error: deleteError } = await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (deleteError) {
    console.error('Error clearing subjects:', deleteError.message)
    return
  }

  // 3. Insert new subjects in batches to avoid payload limits
  const BATCH_SIZE = 50
  for (let i = 0; i < allSubjects.length; i += BATCH_SIZE) {
    const batch = allSubjects.slice(i, i + BATCH_SIZE)
    console.log(`Inserting batch ${i / BATCH_SIZE + 1}...`)
    const { error: insertError } = await supabase.from('subjects').insert(batch)
    
    if (insertError) {
      console.error(`Error inserting batch starting at ${i}:`, insertError.message)
      // Log individual errors if needed
      if (insertError.message.includes('duplicate key')) {
          console.warn('Skipping duplicate keys in this batch...')
      }
    }
  }

  console.log('--- Import Completed Successfully ---')
}

importSubjects().catch(err => {
  console.error('Critical import error:', err)
  process.exit(1)
})
