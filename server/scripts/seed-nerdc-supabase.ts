import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })
const NERDC_DATA_DIR = path.join(__dirname, '../../nerdc-curriculum-data')

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedNERDC() {
  console.log('[SEED] Starting NERDC curriculum import to Supabase...')

  const levels = ['pre-primary', 'primary', 'secondary', 'vocational']
  const levelMapping: Record<string, string> = {
    'pre-primary': 'Pre-Nursery',
    'primary': 'Primary',
    'secondary': 'Secondary',
    'vocational': 'Secondary'
  }

  for (const levelFolder of levels) {
    const levelPath = path.join(NERDC_DATA_DIR, levelFolder)
    if (!fs.existsSync(levelPath)) continue

    const files = fs.readdirSync(levelPath).filter(f => f.endsWith('.json'))
    console.log(`\n📚 Processing ${levelFolder} - ${files.length} subjects`)

    for (const file of files) {
      const rawData = fs.readFileSync(path.join(levelPath, file), 'utf-8')
      const data = JSON.parse(rawData)

      const subjectName = data.subjectName
      const subjectCode = data.subjectCode
      const level = levelMapping[levelFolder]
      
      // Determine prefix for ID based on level and name
      let idPrefix = 'gen-'
      if (levelFolder === 'secondary') {
        if (file.includes('JSS')) idPrefix = 'jss-'
        else if (file.includes('SS')) idPrefix = 'ss-'
      } else if (levelFolder === 'primary') {
        idPrefix = 'pri-'
      } else if (levelFolder === 'pre-primary') {
        idPrefix = 'pre-'
      }

      const subjectToInsert = {
        name: subjectName,
        code: subjectCode,
        level,
        subject_category: data.subjectCategory || 'General',
        description: `NERDC ${data.level} ${subjectName}`,
        topics: data.topics || [],
        credit_units: data.creditUnits || 2,
        curriculum_type: 'NIGERIAN'
      }

      const { error } = await supabase
        .from('subjects')
        .upsert(subjectToInsert, { onConflict: 'code' })

      if (error) {
        console.error(`❌ Failed to seed ${subjectName}:`, error.message)
      } else {
        console.log(`✅ Seeded ${subjectName} (${subjectCode})`)
      }
    }
  }

  console.log('\n[SEED] Seeding completed!')
}

seedNERDC().catch(console.error)
