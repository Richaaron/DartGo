import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { connectDB } from '../src/config/db'
import { User } from '../src/models/User'
import { Teacher } from '../src/models/Teacher'
import { Subject } from '../src/models/Subject'
import { Curriculum } from '../src/models/Curriculum'
import { SchemeOfWork } from '../src/models/SchemeOfWork'

dotenv.config()

// Comprehensive Nigerian School Curriculum Subjects
const NIGERIAN_SUBJECTS = [
  // PRE-NURSERY SUBJECTS
  { name: 'Numeracy', code: 'NUM-PN', level: 'Pre-Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Basic number recognition and counting' },
  { name: 'Early Literacy', code: 'LIT-PN', level: 'Pre-Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Introduction to letters and phonics' },
  { name: 'Personal Development', code: 'PD-PN', level: 'Pre-Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Social and emotional development' },
  { name: 'Creative Arts', code: 'ART-PN', level: 'Pre-Nursery', creditUnits: 1, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Drawing, painting and crafts' },
  { name: 'Physical Development', code: 'PHY-PN', level: 'Pre-Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Motor skills and physical activities' },

  // NURSERY SUBJECTS
  { name: 'Numeracy', code: 'NUM-NS', level: 'Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Number operations and basic arithmetic' },
  { name: 'Literacy', code: 'LIT-NS', level: 'Nursery', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Reading, writing and comprehension' },
  { name: 'Phonics', code: 'PHO-NS', level: 'Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Sound recognition and blending' },
  { name: 'Environmental Studies', code: 'ENV-NS', level: 'Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Introduction to nature and environment' },
  { name: 'Creative Arts', code: 'ART-NS', level: 'Nursery', creditUnits: 1, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Art, music and creative expression' },
  { name: 'Physical Education', code: 'PE-NS', level: 'Nursery', creditUnits: 1, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Sports and physical activities' },
  { name: 'Social Studies', code: 'SS-NS', level: 'Nursery', creditUnits: 1, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Community and family awareness' },

  // PRIMARY SCHOOL SUBJECTS (Classes 1-6)
  { name: 'English Language', code: 'ENG-PR', level: 'Primary', creditUnits: 4, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Comprehensive English language skills' },
  { name: 'Mathematics', code: 'MTH-PR', level: 'Primary', creditUnits: 4, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Numeracy and mathematical concepts' },
  { name: 'Basic Science', code: 'BSC-PR', level: 'Primary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Introduction to science concepts' },
  { name: 'Social Studies', code: 'SS-PR', level: 'Primary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Civic education and social sciences' },
  { name: 'Creative Arts', code: 'ART-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Visual arts and music' },
  { name: 'Physical Education', code: 'PE-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Sports and health education' },
  { name: 'Computer Studies', code: 'CST-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'ICT basics and computer literacy' },
  { name: 'Islamic Religion Studies', code: 'IRS-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Islamic education and ethics' },
  { name: 'Christian Religion Studies', code: 'CRS-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Christian education and ethics' },
  { name: 'Yoruba Language', code: 'YOR-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Yoruba language and culture' },
  { name: 'Igbo Language', code: 'IGB-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Igbo language and culture' },
  { name: 'Hausa Language', code: 'HSA-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Hausa language and culture' },

  // SECONDARY SCHOOL SUBJECTS (JSS 1-3 and SSS 1-3)
  // Core Subjects
  { name: 'English Language', code: 'ENG-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Advanced English language and literature' },
  { name: 'Mathematics', code: 'MTH-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Advanced mathematics' },
  { name: 'Integrated Science', code: 'ISC-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Biology, Chemistry, Physics (JSS)' },
  { name: 'Social Studies', code: 'SS-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Civic education, history, geography' },

  // Science Subjects (SSS)
  { name: 'Physics', code: 'PHY-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Physics curriculum' },
  { name: 'Chemistry', code: 'CHM-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Chemistry curriculum' },
  { name: 'Biology', code: 'BIO-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Biology curriculum' },
  { name: 'Further Mathematics', code: 'FMT-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Advanced mathematics (SSS 2-3)' },

  // Arts/Humanities Subjects
  { name: 'Literature in English', code: 'LEN-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Literature curriculum' },
  { name: 'History', code: 'HIS-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'World and African history' },
  { name: 'Geography', code: 'GEO-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Physical and human geography' },
  { name: 'Government', code: 'GOV-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Political science and government' },
  { name: 'Economics', code: 'ECO-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Economics principles and applications' },

  // Vocational/Technical Subjects
  { name: 'Computer Science', code: 'CSC-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Computer Science' },
  { name: 'Information Technology', code: 'IT-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'VOCATIONAL', curriculumType: 'NIGERIAN', description: 'Practical ICT skills' },
  { name: 'Business Studies', code: 'BUS-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Commerce and business concepts' },
  { name: 'Accounting', code: 'ACC-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Bookkeeping and accounting principles' },
  { name: 'Technical Drawing', code: 'TD-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'VOCATIONAL', curriculumType: 'NIGERIAN', description: 'Engineering and technical drawing' },

  // Language Subjects
  { name: 'French', code: 'FRN-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO French' },
  { name: 'Yoruba', code: 'YOR-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Yoruba language and culture' },
  { name: 'Igbo', code: 'IGB-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Igbo language and culture' },
  { name: 'Hausa', code: 'HSA-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Hausa language and culture' },
  { name: 'Arabic', code: 'ARB-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Arabic language and culture' },

  // Special Subjects
  { name: 'Physical Education', code: 'PE-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Sports science and health education' },
  { name: 'Health Education', code: 'HED-SEC', level: 'Secondary', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Health and wellness education' },
  { name: 'Islamic Religion Studies', code: 'IRS-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Islamic education (WAEC/NECO)' },
  { name: 'Christian Religion Studies', code: 'CRS-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Christian education (WAEC/NECO)' },
  { name: 'Fine Arts', code: 'FA-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Visual arts and design' },
  { name: 'Music', code: 'MUS-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Music theory and practice' },
]

const DEFAULT_ADMIN = {
  email: 'admin@folusho.com',
  name: 'Admin User',
  password: 'AdminPassword123!@#',
  role: 'Admin',
}

// Comprehensive topic generator for Nigerian School Curriculum
function generateTopicsForSubject(subject: any) {
  const allTopics: Record<string, Record<string, any[]>> = {
    // PRE-NURSERY SUBJECTS
    'Numeracy': {
      'Pre-Nursery': [
        { weekNumber: 1, topicName: 'Numbers 1-5', objectives: ['Count from 1 to 5', 'Recognize number symbols'], duration: 3, resources: ['Number cards 1-5', 'Counting objects'], assessmentMethod: 'Observation' },
        { weekNumber: 2, topicName: 'Numbers 6-10', objectives: ['Count from 6 to 10', 'Match numbers to objects'], duration: 3, resources: ['Number cards 6-10', 'Counting frame'], assessmentMethod: 'Observation' },
        { weekNumber: 3, topicName: 'Shapes - Circle and Square', objectives: ['Identify circles', 'Identify squares'], duration: 3, resources: ['Shape cutouts', 'Shape templates'], assessmentMethod: 'Sorting activity' },
        { weekNumber: 4, topicName: 'Shapes - Triangle and Rectangle', objectives: ['Identify triangles', 'Identify rectangles'], duration: 3, resources: ['Shape models', 'Drawing materials'], assessmentMethod: 'Drawing activity' },
        { weekNumber: 5, topicName: 'Big and Small', objectives: ['Classify objects by size', 'Use comparison words'], duration: 3, resources: ['Objects of different sizes', 'Picture cards'], assessmentMethod: 'Sorting' },
        { weekNumber: 6, topicName: 'Long and Short', objectives: ['Compare lengths', 'Use length words'], duration: 3, resources: ['String, ribbons', 'Measuring tools'], assessmentMethod: 'Comparison activity' },
        { weekNumber: 7, topicName: 'Colors', objectives: ['Identify primary colors', 'Sort by color'], duration: 3, resources: ['Color cards', 'Colored objects'], assessmentMethod: 'Sorting game' },
        { weekNumber: 8, topicName: 'Patterns - Simple', objectives: ['Recognize simple patterns', 'Complete patterns'], duration: 3, resources: ['Pattern blocks', 'Colored beads'], assessmentMethod: 'Pattern completion' },
        { weekNumber: 9, topicName: 'One-to-One Correspondence', objectives: ['Match one-to-one', 'Count accurately'], duration: 3, resources: ['Objects, containers'], assessmentMethod: 'Matching activity' },
        { weekNumber: 10, topicName: 'More and Less', objectives: ['Compare quantities', 'Use more/less words'], duration: 3, resources: ['Objects, picture cards'], assessmentMethod: 'Comparison exercise' },
        { weekNumber: 11, topicName: 'Addition Basics (1+1, 2+1)', objectives: ['Add two small numbers', 'Understand combining'], duration: 3, resources: ['Counting objects', 'Number cards'], assessmentMethod: 'Object-based addition' },
        { weekNumber: 12, topicName: 'Subtraction Basics (2-1)', objectives: ['Remove objects', 'Understand taking away'], duration: 3, resources: ['Counting objects', 'Removal activities'], assessmentMethod: 'Object-based subtraction' },
        { weekNumber: 13, topicName: 'Revision and Assessment', objectives: ['Review all topics', 'Demonstrate understanding'], duration: 3, resources: ['Review materials', 'Assessment cards'], assessmentMethod: 'Overall assessment' },
      ],
      'Nursery': [
        { weekNumber: 1, topicName: 'Numbers 1-10 Recognition', objectives: ['Count accurately to 10', 'Recognize number symbols 1-10'], duration: 4, resources: ['Number cards 1-10', 'Counting beads', 'Number line'], assessmentMethod: 'Counting exercise' },
        { weekNumber: 2, topicName: 'Number Operations - Addition Basics', objectives: ['Add small numbers', 'Understand combining sets'], duration: 4, resources: ['Counting objects', 'Addition worksheets'], assessmentMethod: 'Object addition' },
        { weekNumber: 3, topicName: 'Number Operations - Subtraction Basics', objectives: ['Remove objects', 'Understand taking away'], duration: 4, resources: ['Counting objects', 'Subtraction worksheets'], assessmentMethod: 'Object subtraction' },
        { weekNumber: 4, topicName: 'Shapes - 2D and 3D', objectives: ['Identify basic shapes', 'Sort by shape'], duration: 4, resources: ['Shape cards', 'Shape models', 'Tangram pieces'], assessmentMethod: 'Shape identification' },
        { weekNumber: 5, topicName: 'Size and Comparison', objectives: ['Compare objects by size', 'Use comparison words'], duration: 4, resources: ['Objects of various sizes', 'Picture cards'], assessmentMethod: 'Comparison exercise' },
        { weekNumber: 6, topicName: 'Measurement - Length', objectives: ['Compare lengths', 'Use standard units'], duration: 4, resources: ['Rulers', 'String', 'Measuring tape'], assessmentMethod: 'Measurement activity' },
        { weekNumber: 7, topicName: 'Colors and Sorting', objectives: ['Identify colors', 'Sort by color'], duration: 4, resources: ['Color cards', 'Colored objects'], assessmentMethod: 'Sorting game' },
        { weekNumber: 8, topicName: 'Patterns and Sequences', objectives: ['Recognize patterns', 'Complete sequences'], duration: 4, resources: ['Pattern blocks', 'Colored beads'], assessmentMethod: 'Pattern activity' },
        { weekNumber: 9, topicName: 'Odd and Even Numbers', objectives: ['Distinguish odd/even', 'Sort numbers'], duration: 4, resources: ['Number cards', 'Objects'], assessmentMethod: 'Classification' },
        { weekNumber: 10, topicName: 'More, Less, and Equal', objectives: ['Compare quantities', 'Understand equality'], duration: 4, resources: ['Objects for comparison', 'Number cards'], assessmentMethod: 'Comparison exercise' },
        { weekNumber: 11, topicName: 'Time Concepts - Days and Seasons', objectives: ['Understand days', 'Learn seasons'], duration: 4, resources: ['Calendar', 'Season pictures'], assessmentMethod: 'Calendar activity' },
        { weekNumber: 12, topicName: 'Money Recognition', objectives: ['Identify coins and notes', 'Understand value'], duration: 4, resources: ['Play money', 'Coin pictures'], assessmentMethod: 'Money matching' },
        { weekNumber: 13, topicName: 'Revision and Assessment', objectives: ['Review all numeracy topics', 'Demonstrate skills'], duration: 4, resources: ['Review materials', 'Assessment sheet'], assessmentMethod: 'Assessment activity' },
      ],
    },
    'Early Literacy': {
      'Pre-Nursery': [
        { weekNumber: 1, topicName: 'Letter Recognition A-E', objectives: ['Recognize letters A-E', 'Trace letters'], duration: 3, resources: ['Letter cards', 'Tracing paper'], assessmentMethod: 'Recognition activity' },
        { weekNumber: 2, topicName: 'Letter Recognition F-J', objectives: ['Recognize letters F-J', 'Trace letters'], duration: 3, resources: ['Letter cards', 'Tracing books'], assessmentMethod: 'Identification' },
        { weekNumber: 3, topicName: 'Letter Recognition K-O', objectives: ['Recognize letters K-O', 'Match letters'], duration: 3, resources: ['Letter flash cards', 'Matching games'], assessmentMethod: 'Matching activity' },
        { weekNumber: 4, topicName: 'Letter Recognition P-T', objectives: ['Recognize letters P-T', 'Find letters'], duration: 3, resources: ['Letter hunt materials', 'Picture books'], assessmentMethod: 'Letter hunt' },
        { weekNumber: 5, topicName: 'Letter Recognition U-Z', objectives: ['Recognize letters U-Z', 'Complete alphabet'], duration: 3, resources: ['Alphabet chart', 'Letter blocks'], assessmentMethod: 'Alphabet completion' },
        { weekNumber: 6, topicName: 'Sound /a/ - Apple', objectives: ['Hear /a/ sound', 'Find /a/ words'], duration: 3, resources: ['Sound cards', 'Picture cards'], assessmentMethod: 'Sound identification' },
        { weekNumber: 7, topicName: 'Sound /e/ - Egg', objectives: ['Hear /e/ sound', 'Match /e/ pictures'], duration: 3, resources: ['Sound cards', 'Real objects'], assessmentMethod: 'Matching by sound' },
        { weekNumber: 8, topicName: 'Sound /i/ - Ice', objectives: ['Hear /i/ sound', 'Repeat /i/ words'], duration: 3, resources: ['Sound cards', 'Picture book'], assessmentMethod: 'Repetition exercise' },
        { weekNumber: 9, topicName: 'Sound /o/ - Orange', objectives: ['Hear /o/ sound', 'Respond to /o/ words'], duration: 3, resources: ['Real objects', 'Song materials'], assessmentMethod: 'Response activity' },
        { weekNumber: 10, topicName: 'Sound /u/ - Umbrella', objectives: ['Hear /u/ sound', 'Find /u/ words'], duration: 3, resources: ['Sound cards', 'Picture hunt'], assessmentMethod: 'Word finding' },
        { weekNumber: 11, topicName: 'Simple Words - Cat, Dog, Mat', objectives: ['Recognize simple words', 'Point to words'], duration: 3, resources: ['Word cards', 'Picture books'], assessmentMethod: 'Word recognition' },
        { weekNumber: 12, topicName: 'Rhyming Words', objectives: ['Hear rhymes', 'Match rhyming words'], duration: 3, resources: ['Rhyme cards', 'Songs'], assessmentMethod: 'Rhyming game' },
        { weekNumber: 13, topicName: 'Revision and Book Exploration', objectives: ['Review sounds and letters', 'Enjoy books'], duration: 3, resources: ['Review cards', 'Picture books'], assessmentMethod: 'Story time' },
      ],
    },

    // NURSERY SCHOOL TOPICS
    'Literacy': {
      'Nursery': [
        { weekNumber: 1, topicName: 'Letter Sounds A-G', objectives: ['Learn letter sounds', 'Blend sounds'], duration: 4, resources: ['Sound cards', 'Phonics worksheets'], assessmentMethod: 'Sound identification' },
        { weekNumber: 2, topicName: 'Letter Sounds H-N', objectives: ['Learn more sounds', 'Practice blending'], duration: 4, resources: ['Sound cards', 'Blending games'], assessmentMethod: 'Sound practice' },
        { weekNumber: 3, topicName: 'Letter Sounds O-U', objectives: ['Vowel sounds', 'Identify long/short sounds'], duration: 4, resources: ['Vowel cards', 'Picture cards'], assessmentMethod: 'Vowel identification' },
        { weekNumber: 4, topicName: 'Letter Sounds V-Z', objectives: ['Complete alphabet sounds', 'Review all sounds'], duration: 4, resources: ['Sound cards', 'Review sheet'], assessmentMethod: 'Sound review' },
        { weekNumber: 5, topicName: 'CVC Words (Consonant-Vowel-Consonant)', objectives: ['Read simple CVC words', 'Write CVC words'], duration: 4, resources: ['CVC word cards', 'Writing materials'], assessmentMethod: 'Word reading' },
        { weekNumber: 6, topicName: 'Blending Syllables', objectives: ['Blend syllables', 'Read multisyllabic words'], duration: 4, resources: ['Syllable cards', 'Word lists'], assessmentMethod: 'Blending exercise' },
        { weekNumber: 7, topicName: 'Simple Sentence Reading', objectives: ['Read simple sentences', 'Understand meaning'], duration: 4, resources: ['Simple texts', 'Picture books'], assessmentMethod: 'Reading comprehension' },
        { weekNumber: 8, topicName: 'Sight Words', objectives: ['Learn high-frequency words', 'Use in sentences'], duration: 4, resources: ['Sight word cards', 'Flash cards'], assessmentMethod: 'Word recognition' },
        { weekNumber: 9, topicName: 'Writing - Letter Formation', objectives: ['Write letters correctly', 'Practice handwriting'], duration: 4, resources: ['Writing paper', 'Pencils'], assessmentMethod: 'Handwriting sample' },
        { weekNumber: 10, topicName: 'Writing - Simple Words', objectives: ['Write CVC words', 'Copy sentences'], duration: 4, resources: ['Writing materials', 'Letter templates'], assessmentMethod: 'Writing sample' },
        { weekNumber: 11, topicName: 'Comprehension - Story Sequencing', objectives: ['Order story events', 'Understand narrative'], duration: 4, resources: ['Story cards', 'Picture sequences'], assessmentMethod: 'Sequencing activity' },
        { weekNumber: 12, topicName: 'Phonics Review and Consolidation', objectives: ['Review all phonics', 'Apply to reading'], duration: 4, resources: ['Review materials', 'Practice texts'], assessmentMethod: 'Phonics test' },
        { weekNumber: 13, topicName: 'Final Reading Assessment', objectives: ['Demonstrate reading ability', 'Assess progress'], duration: 4, resources: ['Assessment texts', 'Evaluation sheet'], assessmentMethod: 'Reading assessment' },
      ],
    },
    'Phonics': {
      'Nursery': [
        { weekNumber: 1, topicName: 'Initial Sounds - Consonants', objectives: ['Identify initial consonants', 'Match sounds to letters'], duration: 4, resources: ['Sound cards', 'Picture cards'], assessmentMethod: 'Sound matching' },
        { weekNumber: 2, topicName: 'Vowel Sounds - Short Vowels', objectives: ['Identify short vowels', 'Use in words'], duration: 4, resources: ['Vowel cards', 'Word examples'], assessmentMethod: 'Vowel identification' },
        { weekNumber: 3, topicName: 'Digraphs - Ch, Sh, Th', objectives: ['Recognize digraphs', 'Use in words'], duration: 4, resources: ['Digraph cards', 'Words with digraphs'], assessmentMethod: 'Digraph recognition' },
        { weekNumber: 4, topicName: 'Blending - CVC Words', objectives: ['Blend sounds into words', 'Read CVC words'], duration: 4, resources: ['Sound cards', 'CVC word list'], assessmentMethod: 'Blending exercise' },
        { weekNumber: 5, topicName: 'Ending Sounds - Consonants', objectives: ['Identify ending sounds', 'Compare with initial sounds'], duration: 4, resources: ['Word cards', 'Sound cards'], assessmentMethod: 'Sound comparison' },
        { weekNumber: 6, topicName: 'Rhyming and Word Families', objectives: ['Identify rhymes', 'Use word families'], duration: 4, resources: ['Rhyme cards', 'Word family sheets'], assessmentMethod: 'Rhyming activity' },
        { weekNumber: 7, topicName: 'Consonant Blends - Initial', objectives: ['Identify initial blends', 'Blend and read'], duration: 4, resources: ['Blend cards', 'Word lists'], assessmentMethod: 'Blend recognition' },
        { weekNumber: 8, topicName: 'Consonant Blends - Final', objectives: ['Identify final blends', 'Use in words'], duration: 4, resources: ['Blend cards', 'Reading material'], assessmentMethod: 'Blend usage' },
        { weekNumber: 9, topicName: 'Long Vowel Patterns', objectives: ['Recognize long vowels', 'Read long vowel words'], duration: 4, resources: ['Vowel pattern cards', 'Word examples'], assessmentMethod: 'Pattern identification' },
        { weekNumber: 10, topicName: 'Silencing E Words', objectives: ['Understand silent e rule', 'Apply to reading'], duration: 4, resources: ['Silent e cards', 'Word pairs'], assessmentMethod: 'Rule application' },
        { weekNumber: 11, topicName: 'Sight Words and Tricky Words', objectives: ['Learn irregular words', 'Recognize automatically'], duration: 4, resources: ['Sight word cards', 'Flash cards'], assessmentMethod: 'Word recognition' },
        { weekNumber: 12, topicName: 'Phonics in Context', objectives: ['Use phonics in sentences', 'Read connected text'], duration: 4, resources: ['Sentences', 'Simple texts'], assessmentMethod: 'Reading application' },
        { weekNumber: 13, topicName: 'Phonics Assessment and Review', objectives: ['Review all phonics rules', 'Demonstrate mastery'], duration: 4, resources: ['Assessment materials', 'Review sheets'], assessmentMethod: 'Phonics assessment' },
      ],
    },
    'Environmental Studies': {
      'Nursery': [
        { weekNumber: 1, topicName: 'My Home and Family', objectives: ['Understand family structure', 'Identify family members'], duration: 4, resources: ['Family pictures', 'Discussion cards'], assessmentMethod: 'Family drawing' },
        { weekNumber: 2, topicName: 'My School and Community', objectives: ['Understand school environment', 'Know community helpers'], duration: 4, resources: ['School pictures', 'Community role cards'], assessmentMethod: 'School tour' },
        { weekNumber: 3, topicName: 'Basic Plants', objectives: ['Identify plant parts', 'Understand plant needs'], duration: 4, resources: ['Plant samples', 'Plant diagrams'], assessmentMethod: 'Plant observation' },
        { weekNumber: 4, topicName: 'Basic Animals', objectives: ['Classify animals', 'Understand habitats'], duration: 4, resources: ['Animal pictures', 'Habitat cards'], assessmentMethod: 'Animal sorting' },
        { weekNumber: 5, topicName: 'Weather and Seasons', objectives: ['Identify weather types', 'Understand seasons'], duration: 4, resources: ['Weather pictures', 'Seasonal items'], assessmentMethod: 'Weather chart' },
        { weekNumber: 6, topicName: 'Day and Night', objectives: ['Understand day/night cycle', 'Identify celestial bodies'], duration: 4, resources: ['Sun/moon pictures', 'Night sky chart'], assessmentMethod: 'Observation' },
        { weekNumber: 7, topicName: 'Water and Its Uses', objectives: ['Understand water importance', 'Learn water safety'], duration: 4, resources: ['Water samples', 'Safety rules'], assessmentMethod: 'Water experiment' },
        { weekNumber: 8, topicName: 'Air and Its Importance', objectives: ['Understand air', 'Learn air quality'], duration: 4, resources: ['Wind toys', 'Air experiment kit'], assessmentMethod: 'Wind activity' },
        { weekNumber: 9, topicName: 'Soil and Rocks', objectives: ['Observe soil composition', 'Identify rocks'], duration: 4, resources: ['Soil samples', 'Rock collection'], assessmentMethod: 'Soil exploration' },
        { weekNumber: 10, topicName: 'Food Sources', objectives: ['Identify food sources', 'Understand nutrition'], duration: 4, resources: ['Food pictures', 'Food samples'], assessmentMethod: 'Food sorting' },
        { weekNumber: 11, topicName: 'Living and Non-Living Things', objectives: ['Distinguish organisms', 'Classify objects'], duration: 4, resources: ['Picture cards', 'Objects'], assessmentMethod: 'Classification' },
        { weekNumber: 12, topicName: 'Caring for Our Environment', objectives: ['Understand conservation', 'Learn recycling'], duration: 4, resources: ['Recycling materials', 'Environment posters'], assessmentMethod: 'Recycling activity' },
        { weekNumber: 13, topicName: 'Environment Review and Project', objectives: ['Review all concepts', 'Complete project'], duration: 4, resources: ['Review sheet', 'Project materials'], assessmentMethod: 'Environment project' },
      ],
    },
    'Creative Arts': {
      'Nursery': [
        { weekNumber: 1, topicName: 'Drawing - Colors and Lines', objectives: ['Use crayons/markers', 'Explore colors'], duration: 4, resources: ['Crayons', 'Markers', 'Paper'], assessmentMethod: 'Color exploration' },
        { weekNumber: 2, topicName: 'Shapes in Art', objectives: ['Use basic shapes', 'Create pictures with shapes'], duration: 4, resources: ['Shape templates', 'Art paper'], assessmentMethod: 'Shape art' },
        { weekNumber: 3, topicName: 'Patterns and Designs', objectives: ['Create patterns', 'Decorate objects'], duration: 4, resources: ['Pattern templates', 'Decorative materials'], assessmentMethod: 'Pattern design' },
        { weekNumber: 4, topicName: 'Painting - Techniques', objectives: ['Use paintbrush', 'Mix colors'], duration: 4, resources: ['Paint set', 'Brushes', 'Canvas paper'], assessmentMethod: 'Paint exploration' },
        { weekNumber: 5, topicName: 'Collage Making', objectives: ['Cut and paste', 'Arrange materials'], duration: 4, resources: ['Magazines', 'Glue', 'Scissors'], assessmentMethod: 'Collage creation' },
        { weekNumber: 6, topicName: 'Clay and Modeling', objectives: ['Mold clay', 'Create shapes'], duration: 4, resources: ['Clay', 'Modeling tools'], assessmentMethod: 'Clay model' },
        { weekNumber: 7, topicName: 'Paper Crafts - Folding', objectives: ['Fold paper', 'Make origami'], duration: 4, resources: ['Colored paper', 'Folding instructions'], assessmentMethod: 'Paper folding' },
        { weekNumber: 8, topicName: 'Printing and Stamping', objectives: ['Use stamps', 'Create prints'], duration: 4, resources: ['Stamps', 'Ink pads', 'Paper'], assessmentMethod: 'Print creation' },
        { weekNumber: 9, topicName: 'Mixed Media', objectives: ['Combine materials', 'Experiment with media'], duration: 4, resources: ['Various materials', 'Adhesives'], assessmentMethod: 'Mixed media project' },
        { weekNumber: 10, topicName: 'Music - Rhythm and Beat', objectives: ['Keep rhythm', 'Use percussion instruments'], duration: 4, resources: ['Drums', 'Shakers', 'Bells'], assessmentMethod: 'Rhythm performance' },
        { weekNumber: 11, topicName: 'Music - Songs and Singing', objectives: ['Learn songs', 'Sing in group'], duration: 4, resources: ['Song materials', 'Audio recordings'], assessmentMethod: 'Song performance' },
        { weekNumber: 12, topicName: 'Dance and Movement', objectives: ['Move to music', 'Express through movement'], duration: 4, resources: ['Music player', 'Space for movement'], assessmentMethod: 'Movement performance' },
        { weekNumber: 13, topicName: 'Art Exhibition and Review', objectives: ['Display artwork', 'Celebrate creativity'], duration: 4, resources: ['Display space', 'Artwork collection'], assessmentMethod: 'Art exhibition' },
      ],
      'Primary': [
        { weekNumber: 1, topicName: 'Drawing - Sketching and Perspective', objectives: ['Use pencils', 'Practice shading'], duration: 5, resources: ['Pencils', 'Sketch paper'], assessmentMethod: 'Sketch portfolio' },
        { weekNumber: 2, topicName: 'Painting - Colors and Techniques', objectives: ['Mix colors', 'Use brushes'], duration: 5, resources: ['Paint set', 'Canvas'], assessmentMethod: 'Painting' },
        { weekNumber: 3, topicName: 'Printmaking', objectives: ['Create prints', 'Use printing tools'], duration: 5, resources: ['Printing block', 'Ink'], assessmentMethod: 'Print creation' },
        { weekNumber: 4, topicName: 'Sculpture and Carving', objectives: ['Create 3D art', 'Carve materials'], duration: 5, resources: ['Clay', 'Carving tools'], assessmentMethod: 'Sculpture' },
        { weekNumber: 5, topicName: 'Collage and Mixed Media', objectives: ['Combine materials', 'Create compositions'], duration: 5, resources: ['Magazines', 'Glue'], assessmentMethod: 'Collage' },
        { weekNumber: 6, topicName: 'Fiber Arts - Weaving', objectives: ['Weave patterns', 'Use looms'], duration: 5, resources: ['Loom', 'Yarn'], assessmentMethod: 'Woven piece' },
        { weekNumber: 7, topicName: 'Fiber Arts - Sewing and Embroidery', objectives: ['Sew', 'Embroider'], duration: 5, resources: ['Needle', 'Thread'], assessmentMethod: 'Sewn project' },
        { weekNumber: 8, topicName: 'Music - Instrument Basics', objectives: ['Play instruments', 'Learn notes'], duration: 5, resources: ['Instruments', 'Sheet music'], assessmentMethod: 'Performance' },
        { weekNumber: 9, topicName: 'Music - Singing and Vocals', objectives: ['Sing songs', 'Develop voice'], duration: 5, resources: ['Song materials', 'Audio'], assessmentMethod: 'Song performance' },
        { weekNumber: 10, topicName: 'Dance - Movement Styles', objectives: ['Learn dance', 'Create moves'], duration: 5, resources: ['Music', 'Dance space'], assessmentMethod: 'Dance performance' },
        { weekNumber: 11, topicName: 'Drama and Theatre', objectives: ['Act scenes', 'Create plays'], duration: 5, resources: ['Scripts', 'Props'], assessmentMethod: 'Drama performance' },
        { weekNumber: 12, topicName: 'Digital Art', objectives: ['Use art software', 'Create digital art'], duration: 5, resources: ['Computers', 'Software'], assessmentMethod: 'Digital creation' },
        { weekNumber: 13, topicName: 'Art Show and Celebration', objectives: ['Display work', 'Celebrate art'], duration: 5, resources: ['Display space', 'Gallery items'], assessmentMethod: 'Art exhibition' },
      ],
    },
    'Physical Education': {
      'Nursery': [
        { weekNumber: 1, topicName: 'Gross Motor Skills - Walking and Running', objectives: ['Walk properly', 'Run safely'], duration: 4, resources: ['Open space', 'Running track'], assessmentMethod: 'Movement observation' },
        { weekNumber: 2, topicName: 'Gross Motor Skills - Jumping and Hopping', objectives: ['Jump correctly', 'Hop on one foot'], duration: 4, resources: ['Jumping mat', 'Hopping line'], assessmentMethod: 'Movement test' },
        { weekNumber: 3, topicName: 'Gross Motor Skills - Balance', objectives: ['Balance on beam', 'Walk on line'], duration: 4, resources: ['Balance beam', 'Line marking'], assessmentMethod: 'Balance test' },
        { weekNumber: 4, topicName: 'Throwing and Catching', objectives: ['Throw accurately', 'Catch ball'], duration: 4, resources: ['Balls', 'Targets'], assessmentMethod: 'Skill demonstration' },
        { weekNumber: 5, topicName: 'Climbing and Crawling', objectives: ['Climb safely', 'Crawl under obstacles'], duration: 4, resources: ['Climbing structure', 'Tunnel'], assessmentMethod: 'Skill observation' },
        { weekNumber: 6, topicName: 'Fine Motor Skills - Hand Strength', objectives: ['Strengthen hands', 'Improve control'], duration: 4, resources: ['Playdough', 'Squeezing toys'], assessmentMethod: 'Grip strength' },
        { weekNumber: 7, topicName: 'Fine Motor Skills - Coordination', objectives: ['Develop hand-eye coordination', 'Improve dexterity'], duration: 4, resources: ['Bead strings', 'Puzzles'], assessmentMethod: 'Coordination test' },
        { weekNumber: 8, topicName: 'Cooperative Games', objectives: ['Play with others', 'Follow rules'], duration: 4, resources: ['Game equipment', 'Game rules'], assessmentMethod: 'Game participation' },
        { weekNumber: 9, topicName: 'Ball Skills - Kicking', objectives: ['Kick ball', 'Control direction'], duration: 4, resources: ['Soccer ball', 'Goal markers'], assessmentMethod: 'Kicking practice' },
        { weekNumber: 10, topicName: 'Ball Skills - Rolling', objectives: ['Roll ball', 'Roll and catch'], duration: 4, resources: ['Balls', 'Bowling pins'], assessmentMethod: 'Rolling practice' },
        { weekNumber: 11, topicName: 'Dance and Rhythmic Activities', objectives: ['Dance to music', 'Follow rhythm'], duration: 4, resources: ['Music player', 'Dance space'], assessmentMethod: 'Dance performance' },
        { weekNumber: 12, topicName: 'Health and Safety', objectives: ['Understand hygiene', 'Learn safety rules'], duration: 4, resources: ['Health posters', 'Safety equipment'], assessmentMethod: 'Safety discussion' },
        { weekNumber: 13, topicName: 'Sports Day and Assessment', objectives: ['Participate in sports', 'Demonstrate skills'], duration: 4, resources: ['Sports equipment', 'Assessment sheet'], assessmentMethod: 'Sports day participation' },
      ],
      'Primary': [
        { weekNumber: 1, topicName: 'Fitness - Strength and Endurance', objectives: ['Build strength', 'Improve fitness'], duration: 5, resources: ['Equipment', 'Exercise guide'], assessmentMethod: 'Fitness test' },
        { weekNumber: 2, topicName: 'Fitness - Flexibility and Balance', objectives: ['Stretch', 'Improve balance'], duration: 5, resources: ['Mats', 'Stretching guide'], assessmentMethod: 'Flexibility test' },
        { weekNumber: 3, topicName: 'Athletics - Running', objectives: ['Run efficiently', 'Improve speed'], duration: 5, resources: ['Track', 'Timing equipment'], assessmentMethod: 'Running test' },
        { weekNumber: 4, topicName: 'Athletics - Jumping', objectives: ['Jump far/high', 'Perfect technique'], duration: 5, resources: ['Jumping pads', 'Markers'], assessmentMethod: 'Jump test' },
        { weekNumber: 5, topicName: 'Athletics - Throwing', objectives: ['Throw accurately', 'Build power'], duration: 5, resources: ['Balls', 'Throwing area'], assessmentMethod: 'Throw test' },
        { weekNumber: 6, topicName: 'Soccer', objectives: ['Play soccer', 'Develop skills'], duration: 5, resources: ['Soccer ball', 'Goals'], assessmentMethod: 'Game participation' },
        { weekNumber: 7, topicName: 'Volleyball', objectives: ['Play volleyball', 'Learn techniques'], duration: 5, resources: ['Volleyball', 'Net'], assessmentMethod: 'Game participation' },
        { weekNumber: 8, topicName: 'Badminton', objectives: ['Play badminton', 'Develop skills'], duration: 5, resources: ['Rackets', 'Shuttlecock'], assessmentMethod: 'Game participation' },
        { weekNumber: 9, topicName: 'Basketball', objectives: ['Play basketball', 'Learn tactics'], duration: 5, resources: ['Basketball', 'Hoop'], assessmentMethod: 'Game participation' },
        { weekNumber: 10, topicName: 'Table Tennis', objectives: ['Play table tennis', 'Develop technique'], duration: 5, resources: ['Paddles', 'Ball'], assessmentMethod: 'Game participation' },
        { weekNumber: 11, topicName: 'Gymnastics', objectives: ['Perform movements', 'Master techniques'], duration: 5, resources: ['Mats', 'Equipment'], assessmentMethod: 'Gymnastics test' },
        { weekNumber: 12, topicName: 'Health and Safety', objectives: ['Understand health', 'Learn safety'], duration: 5, resources: ['Health info', 'Safety guide'], assessmentMethod: 'Health discussion' },
        { weekNumber: 13, topicName: 'Sports Day Competition', objectives: ['Compete', 'Demonstrate skills'], duration: 5, resources: ['Sports equipment', 'Field'], assessmentMethod: 'Sports day results' },
      ],
    },
    'Social Studies': {
      'Nursery': [
        { weekNumber: 1, topicName: 'Myself and My Identity', objectives: ['Know own name', 'Understand identity'], duration: 4, resources: ['Name cards', 'Mirror'], assessmentMethod: 'Self introduction' },
        { weekNumber: 2, topicName: 'My Family', objectives: ['Name family members', 'Understand roles'], duration: 4, resources: ['Family pictures', 'Role cards'], assessmentMethod: 'Family discussion' },
        { weekNumber: 3, topicName: 'My School', objectives: ['Know school places', 'Understand school rules'], duration: 4, resources: ['School map', 'Rule posters'], assessmentMethod: 'School exploration' },
        { weekNumber: 4, topicName: 'School Community', objectives: ['Know school personnel', 'Understand their roles'], duration: 4, resources: ['Staff pictures', 'Role cards'], assessmentMethod: 'Community interaction' },
        { weekNumber: 5, topicName: 'Community Helpers', objectives: ['Identify helpers', 'Understand their roles'], duration: 4, resources: ['Helper pictures', 'Role cards'], assessmentMethod: 'Discussion' },
        { weekNumber: 6, topicName: 'Sharing and Cooperation', objectives: ['Understand sharing', 'Cooperate with others'], duration: 4, resources: ['Toys', 'Games'], assessmentMethod: 'Group activities' },
        { weekNumber: 7, topicName: 'Listening and Respect', objectives: ['Listen to others', 'Show respect'], duration: 4, resources: ['Role play materials'], assessmentMethod: 'Observation' },
        { weekNumber: 8, topicName: 'Feelings and Emotions', objectives: ['Identify emotions', 'Express feelings'], duration: 4, resources: ['Emotion cards', 'Mirrors'], assessmentMethod: 'Emotion identification' },
        { weekNumber: 9, topicName: 'Friendship Skills', objectives: ['Make friends', 'Maintain friendships'], duration: 4, resources: ['Friendship cards', 'Games'], assessmentMethod: 'Friendship activities' },
        { weekNumber: 10, topicName: 'Responsibility and Chores', objectives: ['Understand responsibility', 'Help with tasks'], duration: 4, resources: ['Chore cards', 'Task materials'], assessmentMethod: 'Task completion' },
        { weekNumber: 11, topicName: 'Community and Celebrations', objectives: ['Know local celebrations', 'Understand traditions'], duration: 4, resources: ['Festival pictures', 'Tradition stories'], assessmentMethod: 'Discussion and activities' },
        { weekNumber: 12, topicName: 'Nigerian Culture', objectives: ['Know Nigerian culture', 'Appreciate diversity'], duration: 4, resources: ['Cultural items', 'Stories'], assessmentMethod: 'Cultural activities' },
        { weekNumber: 13, topicName: 'Social Skills Review and Project', objectives: ['Review all concepts', 'Apply in daily life'], duration: 4, resources: ['Review materials', 'Project items'], assessmentMethod: 'Social skills project' },
      ],
      'Primary': [
        { weekNumber: 1, topicName: 'Family and Community', objectives: ['Understand family roles', 'Know community members'], duration: 5, resources: ['Family pictures', 'Community maps'], assessmentMethod: 'Discussion' },
        { weekNumber: 2, topicName: 'Houses and Homes', objectives: ['Identify home types', 'Understand shelter'], duration: 5, resources: ['House pictures', 'Building materials'], assessmentMethod: 'Drawing activity' },
        { weekNumber: 3, topicName: 'Transportation', objectives: ['Know transport types', 'Understand travel'], duration: 5, resources: ['Transport pictures', 'Models'], assessmentMethod: 'Classification' },
        { weekNumber: 4, topicName: 'Communication', objectives: ['Understand communication', 'Learn tools'], duration: 5, resources: ['Communication items', 'Technology'], assessmentMethod: 'Communication activity' },
        { weekNumber: 5, topicName: 'Community Helpers - Occupations', objectives: ['Know jobs', 'Understand roles'], duration: 5, resources: ['Job pictures', 'Career cards'], assessmentMethod: 'Career discussion' },
        { weekNumber: 6, topicName: 'Our School', objectives: ['Know school places', 'Understand rules'], duration: 5, resources: ['School map', 'Rule posters'], assessmentMethod: 'School tour' },
        { weekNumber: 7, topicName: 'Culture and Traditions', objectives: ['Know Nigerian culture', 'Appreciate diversity'], duration: 5, resources: ['Cultural items', 'Stories'], assessmentMethod: 'Cultural project' },
        { weekNumber: 8, topicName: 'Festivals and Celebrations', objectives: ['Know local festivals', 'Understand traditions'], duration: 5, resources: ['Festival pictures', 'Celebration items'], assessmentMethod: 'Festival discussion' },
        { weekNumber: 9, topicName: 'Our Country - Nigeria', objectives: ['Know about Nigeria', 'Learn national symbols'], duration: 5, resources: ['Map of Nigeria', 'Flag, anthem'], assessmentMethod: 'Country study' },
        { weekNumber: 10, topicName: 'Rights and Responsibilities', objectives: ['Understand rights', 'Know duties'], duration: 5, resources: ['Rights posters', 'Responsibility cards'], assessmentMethod: 'Responsibility exercise' },
        { weekNumber: 11, topicName: 'Citizenship and Rules', objectives: ['Understand rules', 'Learn laws'], duration: 5, resources: ['Rule cards', 'Law information'], assessmentMethod: 'Role play' },
        { weekNumber: 12, topicName: 'Health and Hygiene', objectives: ['Learn healthy habits', 'Understand hygiene'], duration: 5, resources: ['Health posters', 'Hygiene products'], assessmentMethod: 'Health practice' },
        { weekNumber: 13, topicName: 'Social Studies Review and Project', objectives: ['Review all topics', 'Complete project'], duration: 5, resources: ['Review sheets', 'Project materials'], assessmentMethod: 'Social studies project' },
      ],
    },

    // PRIMARY SCHOOL TOPICS (EXTENDED - ADDITIONAL SUBJECTS)
    'English Language': {
      'Primary': [
        { weekNumber: 1, topicName: 'Parts of Speech - Nouns', objectives: ['Identify nouns', 'Use nouns in sentences'], duration: 5, resources: ['Grammar textbook', 'Word cards', 'Picture cards'], assessmentMethod: 'Identification exercise' },
        { weekNumber: 2, topicName: 'Parts of Speech - Verbs', objectives: ['Identify action verbs', 'Use verbs correctly'], duration: 5, resources: ['Action cards', 'Video clips'], assessmentMethod: 'Action identification' },
        { weekNumber: 3, topicName: 'Parts of Speech - Adjectives', objectives: ['Identify adjectives', 'Describe objects'], duration: 5, resources: ['Picture cards', 'Word list'], assessmentMethod: 'Description exercise' },
        { weekNumber: 4, topicName: 'Sentence Structure - Subjects and Predicates', objectives: ['Identify subject and predicate', 'Create sentences'], duration: 5, resources: ['Textbook', 'Sentence cards'], assessmentMethod: 'Sentence building' },
        { weekNumber: 5, topicName: 'Comprehension - Main Idea', objectives: ['Identify main idea', 'Answer questions'], duration: 5, resources: ['Reading passage', 'Question sheet'], assessmentMethod: 'Comprehension questions' },
        { weekNumber: 6, topicName: 'Comprehension - Details', objectives: ['Find supporting details', 'Answer detail questions'], duration: 5, resources: ['Text excerpt', 'Question cards'], assessmentMethod: 'Detail identification' },
        { weekNumber: 7, topicName: 'Punctuation - Period and Question Mark', objectives: ['Use periods correctly', 'Use question marks'], duration: 5, resources: ['Sentence cards', 'Workbook'], assessmentMethod: 'Punctuation exercise' },
        { weekNumber: 8, topicName: 'Capitalization - Days, Months, Names', objectives: ['Capitalize properly', 'Use capital letters'], duration: 5, resources: ['Calendar', 'Name cards'], assessmentMethod: 'Writing exercise' },
        { weekNumber: 9, topicName: 'Reading - Phonetic Decoding', objectives: ['Decode words', 'Read fluently'], duration: 5, resources: ['Phonetic readers', 'Word lists'], assessmentMethod: 'Reading assessment' },
        { weekNumber: 10, topicName: 'Writing - Simple Sentences', objectives: ['Write complete sentences', 'Use proper grammar'], duration: 5, resources: ['Writing paper', 'Model sentences'], assessmentMethod: 'Writing assignment' },
        { weekNumber: 11, topicName: 'Vocabulary - Synonyms and Antonyms', objectives: ['Identify synonyms', 'Find antonyms'], duration: 5, resources: ['Word cards', 'Thesaurus'], assessmentMethod: 'Word matching' },
        { weekNumber: 12, topicName: 'Literature - Fairy Tales', objectives: ['Analyze fairy tales', 'Discuss themes'], duration: 5, resources: ['Fairy tale books', 'Discussion guide'], assessmentMethod: 'Story discussion' },
        { weekNumber: 13, topicName: 'Revision and Assessment', objectives: ['Review all topics', 'Demonstrate competency'], duration: 5, resources: ['Review sheets', 'Test paper'], assessmentMethod: 'Final assessment' },
      ],
      'Secondary': [
        { weekNumber: 1, topicName: 'Literature in Context - Nigerian Writers', objectives: ['Study Nigerian authors', 'Understand cultural context'], duration: 5, resources: ['Literature anthology', 'Author biography'], assessmentMethod: 'Essay' },
        { weekNumber: 2, topicName: 'Poetry - Themes and Devices', objectives: ['Analyze poetic devices', 'Identify themes'], duration: 5, resources: ['Poetry collection', 'Analysis guide'], assessmentMethod: 'Poetry analysis' },
        { weekNumber: 3, topicName: 'Drama - Shakespeare and Modern', objectives: ['Study dramatic works', 'Analyze characters'], duration: 5, resources: ['Play texts', 'Video clips'], assessmentMethod: 'Character analysis' },
        { weekNumber: 4, topicName: 'Prose - Novel Structure', objectives: ['Analyze plot structure', 'Discuss themes'], duration: 5, resources: ['Novel', 'Study guide'], assessmentMethod: 'Novel discussion' },
        { weekNumber: 5, topicName: 'Grammar - Complex Sentences', objectives: ['Write complex sentences', 'Use punctuation'], duration: 5, resources: ['Grammar textbook', 'Writing samples'], assessmentMethod: 'Writing exercise' },
        { weekNumber: 6, topicName: 'Grammar - Tenses and Aspects', objectives: ['Master verb tenses', 'Use correctly'], duration: 5, resources: ['Tense chart', 'Worksheets'], assessmentMethod: 'Tense practice' },
        { weekNumber: 7, topicName: 'Comprehension - Critical Reading', objectives: ['Read critically', 'Analyze arguments'], duration: 5, resources: ['Texts, articles'], assessmentMethod: 'Comprehension test' },
        { weekNumber: 8, topicName: 'Writing - Essays and Reports', objectives: ['Write formal essays', 'Create reports'], duration: 5, resources: ['Writing guide', 'Model essays'], assessmentMethod: 'Essay writing' },
        { weekNumber: 9, topicName: 'Vocabulary - Academic Terms', objectives: ['Learn academic vocabulary', 'Use appropriately'], duration: 5, resources: ['Vocabulary list', 'Context cards'], assessmentMethod: 'Vocabulary test' },
        { weekNumber: 10, topicName: 'Oral Communication - Public Speaking', objectives: ['Deliver speeches', 'Communicate effectively'], duration: 5, resources: ['Speech topics', 'Recording device'], assessmentMethod: 'Speech delivery' },
        { weekNumber: 11, topicName: 'Listening and Note-Taking', objectives: ['Listen actively', 'Take notes'], duration: 5, resources: ['Audio materials', 'Note templates'], assessmentMethod: 'Note-taking exercise' },
        { weekNumber: 12, topicName: 'WAEC Exam Preparation', objectives: ['Review exam format', 'Practice questions'], duration: 5, resources: ['Past papers', 'Sample questions'], assessmentMethod: 'Mock exam' },
        { weekNumber: 13, topicName: 'Final Assessment and Review', objectives: ['Demonstrate mastery', 'Review all topics'], duration: 5, resources: ['Review guide', 'Assessment tool'], assessmentMethod: 'Final exam' },
      ],
    },
    'Mathematics': {
      'Primary': [
        { weekNumber: 1, topicName: 'Place Value - Units and Tens', objectives: ['Understand place value', 'Write numbers'], duration: 5, resources: ['Base-10 blocks', 'Place value chart'], assessmentMethod: 'Place value identification' },
        { weekNumber: 2, topicName: 'Place Value - Hundreds', objectives: ['Understand hundreds', 'Compare numbers'], duration: 5, resources: ['Abacus', 'Number cards'], assessmentMethod: 'Comparison exercise' },
        { weekNumber: 3, topicName: 'Addition - Single Digit', objectives: ['Add single digits', 'Memorize facts'], duration: 5, resources: ['Addition flash cards', 'Manipulatives'], assessmentMethod: 'Speed drill' },
        { weekNumber: 4, topicName: 'Addition - Two Digits', objectives: ['Add two-digit numbers', 'Regroup'], duration: 5, resources: ['Worksheet', 'Base-10 blocks'], assessmentMethod: 'Problem solving' },
        { weekNumber: 5, topicName: 'Subtraction - Single Digit', objectives: ['Subtract single digits', 'Memorize facts'], duration: 5, resources: ['Flash cards', 'Number line'], assessmentMethod: 'Fact fluency' },
        { weekNumber: 6, topicName: 'Subtraction - Two Digits', objectives: ['Subtract two-digit numbers', 'Regroup'], duration: 5, resources: ['Worksheet', 'Manipulatives'], assessmentMethod: 'Algorithm practice' },
        { weekNumber: 7, topicName: 'Multiplication - Concept', objectives: ['Understand multiplication', 'Use arrays'], duration: 5, resources: ['Arrays model', 'Picture cards'], assessmentMethod: 'Concept demonstration' },
        { weekNumber: 8, topicName: 'Multiplication - Tables 2-5', objectives: ['Memorize times tables', 'Apply multiplication'], duration: 5, resources: ['Times table chart', 'Flash cards'], assessmentMethod: 'Multiplication drill' },
        { weekNumber: 9, topicName: 'Division - Concept', objectives: ['Understand division', 'Divide equally'], duration: 5, resources: ['Manipulatives', 'Picture cards'], assessmentMethod: 'Sharing activity' },
        { weekNumber: 10, topicName: 'Fractions - Halves and Quarters', objectives: ['Divide into parts', 'Name fractions'], duration: 5, resources: ['Fraction circles', 'Paper folding'], assessmentMethod: 'Identification exercise' },
        { weekNumber: 11, topicName: 'Measurement - Length and Weight', objectives: ['Measure length', 'Compare weights'], duration: 5, resources: ['Rulers', 'Scales'], assessmentMethod: 'Measurement activity' },
        { weekNumber: 12, topicName: 'Geometry - Shapes and Properties', objectives: ['Identify shapes', 'Describe properties'], duration: 5, resources: ['Shape models', 'Tangrams'], assessmentMethod: 'Shape classification' },
        { weekNumber: 13, topicName: 'Problem Solving and Assessment', objectives: ['Solve word problems', 'Review all skills'], duration: 5, resources: ['Word problem cards', 'Test paper'], assessmentMethod: 'Comprehensive test' },
      ],
      'Secondary': [
        { weekNumber: 1, topicName: 'Number Systems - Real Numbers', objectives: ['Classify number types', 'Understand properties'], duration: 5, resources: ['Textbook', 'Number line'], assessmentMethod: 'Classification exercise' },
        { weekNumber: 2, topicName: 'Algebra - Linear Equations', objectives: ['Solve linear equations', 'Graph lines'], duration: 5, resources: ['Graphing tools', 'Equation cards'], assessmentMethod: 'Problem solving' },
        { weekNumber: 3, topicName: 'Algebra - Quadratic Equations', objectives: ['Solve quadratic equations', 'Factor polynomials'], duration: 5, resources: ['Textbook', 'Factoring guide'], assessmentMethod: 'Algebraic solution' },
        { weekNumber: 4, topicName: 'Functions and Relations', objectives: ['Understand functions', 'Analyze relations'], duration: 5, resources: ['Function notation', 'Graphing calculator'], assessmentMethod: 'Function analysis' },
        { weekNumber: 5, topicName: 'Geometry - Angles and Triangles', objectives: ['Calculate angles', 'Prove theorems'], duration: 5, resources: ['Geometry tools', 'Theorem cards'], assessmentMethod: 'Geometric proof' },
        { weekNumber: 6, topicName: 'Geometry - Circles and Area', objectives: ['Calculate arc length', 'Find area'], duration: 5, resources: ['Circle templates', 'Formula sheet'], assessmentMethod: 'Calculation practice' },
        { weekNumber: 7, topicName: 'Trigonometry - Ratios', objectives: ['Calculate trig ratios', 'Solve triangles'], duration: 5, resources: ['Trig table', 'Calculator'], assessmentMethod: 'Calculation test' },
        { weekNumber: 8, topicName: 'Trigonometry - Applications', objectives: ['Apply trigonometry', 'Solve problems'], duration: 5, resources: ['Problem cards', 'Real-world examples'], assessmentMethod: 'Problem solving' },
        { weekNumber: 9, topicName: 'Statistics - Data Analysis', objectives: ['Analyze data', 'Create graphs'], duration: 5, resources: ['Data sets', 'Graphing software'], assessmentMethod: 'Data project' },
        { weekNumber: 10, topicName: 'Statistics - Probability', objectives: ['Calculate probability', 'Analyze distributions'], duration: 5, resources: ['Dice, cards', 'Probability guide'], assessmentMethod: 'Probability test' },
        { weekNumber: 11, topicNumber: 11, topicName: 'Calculus Basics - Limits and Derivatives', objectives: ['Understand limits', 'Calculate derivatives'], duration: 5, resources: ['Calculus text', 'Formula sheet'], assessmentMethod: 'Calculus problems' },
        { weekNumber: 12, topicName: 'WAEC Exam Preparation - Review All Topics', objectives: ['Review all mathematics', 'Practice exam questions'], duration: 5, resources: ['Past papers', 'Review materials'], assessmentMethod: 'Mock exam' },
        { weekNumber: 13, topicName: 'Final Assessment and Problem Solving', objectives: ['Solve complex problems', 'Demonstrate mastery'], duration: 5, resources: ['Assessment paper'], assessmentMethod: 'Comprehensive exam' },
      ],
    },
    'Basic Science': {
      'Primary': [
        { weekNumber: 1, topicName: 'Living and Non-Living Things', objectives: ['Distinguish organisms', 'Classify objects'], duration: 5, resources: ['Picture cards', 'Objects'], assessmentMethod: 'Classification' },
        { weekNumber: 2, topicName: 'Parts of Plants', objectives: ['Identify plant parts', 'Understand functions'], duration: 5, resources: ['Plant samples', 'Diagrams'], assessmentMethod: 'Labeling activity' },
        { weekNumber: 3, topicName: 'Parts of Animals', objectives: ['Identify body parts', 'Understand adaptation'], duration: 5, resources: ['Animal pictures', 'Models'], assessmentMethod: 'Matching activity' },
        { weekNumber: 4, topicName: 'The Human Body - Skeleton and Muscles', objectives: ['Understand skeleton', 'Know major bones'], duration: 5, resources: ['Skeleton model', 'Diagrams'], assessmentMethod: 'Labeling exercise' },
        { weekNumber: 5, topicName: 'Senses - Sight and Hearing', objectives: ['Understand eyes and ears', 'Learn care'], duration: 5, resources: ['Eye/ear diagrams', 'Safety materials'], assessmentMethod: 'Observation activity' },
        { weekNumber: 6, topicName: 'Senses - Touch, Taste, and Smell', objectives: ['Explore three senses', 'Understand safety'], duration: 5, resources: ['Sensory materials', 'Safety info'], assessmentMethod: 'Sensory exploration' },
        { weekNumber: 7, topicName: 'Food and Nutrition', objectives: ['Understand food groups', 'Know healthy eating'], duration: 5, resources: ['Food pictures', 'Nutrition guide'], assessmentMethod: 'Food sorting' },
        { weekNumber: 8, topicName: 'Water and Its Properties', objectives: ['Understand water', 'Learn water forms'], duration: 5, resources: ['Water samples', 'Experiment kit'], assessmentMethod: 'Water experiment' },
        { weekNumber: 9, topicName: 'Air and Weather', objectives: ['Understand air', 'Identify weather'], duration: 5, resources: ['Wind toys', 'Weather pictures'], assessmentMethod: 'Weather observation' },
        { weekNumber: 10, topicName: 'Soil and Rocks', objectives: ['Observe soil', 'Identify rocks'], duration: 5, resources: ['Soil samples', 'Rock collection'], assessmentMethod: 'Rock identification' },
        { weekNumber: 11, topicName: 'Simple Machines', objectives: ['Understand lever and pulley', 'Use tools'], duration: 5, resources: ['Machine models', 'Tools'], assessmentMethod: 'Machine demonstration' },
        { weekNumber: 12, topicName: 'Light and Shadow', objectives: ['Understand light', 'Study shadows'], duration: 5, resources: ['Light source', 'Shadow materials'], assessmentMethod: 'Light experiment' },
        { weekNumber: 13, topicName: 'Science Review and Fair Project', objectives: ['Review all topics', 'Complete project'], duration: 5, resources: ['Review sheets', 'Project materials'], assessmentMethod: 'Science fair' },
      ],
    },
    'Computer Studies': {
      'Primary': [
        { weekNumber: 1, topicName: 'Introduction to Computers', objectives: ['Know computer parts', 'Understand hardware'], duration: 5, resources: ['Computer', 'Manual'], assessmentMethod: 'Identification' },
        { weekNumber: 2, topicName: 'Computer Basics - Keyboard and Mouse', objectives: ['Use keyboard', 'Control mouse'], duration: 5, resources: ['Keyboard', 'Mouse'], assessmentMethod: 'Skill practice' },
        { weekNumber: 3, topicName: 'Operating Systems - Windows/MacOS', objectives: ['Navigate OS', 'Understand menus'], duration: 5, resources: ['Computer', 'Tutorial'], assessmentMethod: 'OS navigation' },
        { weekNumber: 4, topicName: 'File Management', objectives: ['Create folders', 'Organize files'], duration: 5, resources: ['Computer', 'File system'], assessmentMethod: 'File organization' },
        { weekNumber: 5, topicName: 'Word Processing - Microsoft Word', objectives: ['Type documents', 'Format text'], duration: 5, resources: ['Word', 'Tutorials'], assessmentMethod: 'Document creation' },
        { weekNumber: 6, topicName: 'Spreadsheets - Excel Basics', objectives: ['Create spreadsheets', 'Enter data'], duration: 5, resources: ['Excel', 'Data sets'], assessmentMethod: 'Spreadsheet creation' },
        { weekNumber: 7, topicName: 'Presentations - PowerPoint', objectives: ['Create slides', 'Add graphics'], duration: 5, resources: ['PowerPoint', 'Templates'], assessmentMethod: 'Presentation' },
        { weekNumber: 8, topicName: 'Internet Basics', objectives: ['Use browsers', 'Search websites'], duration: 5, resources: ['Internet', 'Browser'], assessmentMethod: 'Web search' },
        { weekNumber: 9, topicName: 'Email Communication', objectives: ['Create email', 'Send messages'], duration: 5, resources: ['Email', 'Accounts'], assessmentMethod: 'Email practice' },
        { weekNumber: 10, topicName: 'Digital Safety', objectives: ['Understand cybersecurity', 'Know dangers'], duration: 5, resources: ['Safety guide', 'Videos'], assessmentMethod: 'Safety discussion' },
        { weekNumber: 11, topicName: 'Graphics and Design', objectives: ['Edit images', 'Create designs'], duration: 5, resources: ['Design software', 'Images'], assessmentMethod: 'Design project' },
        { weekNumber: 12, topicName: 'Coding Basics - Scratch', objectives: ['Learn programming', 'Create program'], duration: 5, resources: ['Scratch', 'Tutorials'], assessmentMethod: 'Program creation' },
        { weekNumber: 13, topicName: 'Computer Projects and Assessment', objectives: ['Complete project', 'Demonstrate skills'], duration: 5, resources: ['Computer', 'Project materials'], assessmentMethod: 'Project presentation' },
      ],
    },
    'Islamic Religion Studies': {
      'Primary': [
        { weekNumber: 1, topicName: 'Introduction to Islam', objectives: ['Understand Islam', 'Know basic tenets'], duration: 5, resources: ['Religion texts', 'Quran excerpts'], assessmentMethod: 'Discussion' },
        { weekNumber: 2, topicName: 'The Five Pillars', objectives: ['Know the pillars', 'Understand practices'], duration: 5, resources: ['Islamic texts', 'Prayer guide'], assessmentMethod: 'Learning activity' },
        { weekNumber: 3, topicName: 'Salat (Prayer) - Introduction', objectives: ['Learn prayer basics', 'Understand practice'], duration: 5, resources: ['Prayer mat', 'Guide'], assessmentMethod: 'Prayer practice' },
        { weekNumber: 4, topicName: 'Islamic History - Prophet Muhammad', objectives: ['Learn prophet life', 'Know teachings'], duration: 5, resources: ['History text', 'Stories'], assessmentMethod: 'Story discussion' },
        { weekNumber: 5, topicName: 'Islamic History - The Four Caliphs', objectives: ['Know caliphs', 'Understand era'], duration: 5, resources: ['History books', 'Timeline'], assessmentMethod: 'Timeline activity' },
        { weekNumber: 6, topicName: 'Quranic Studies - Chapters Overview', objectives: ['Know Quran structure', 'Learn surahs'], duration: 5, resources: ['Quran', 'Study guide'], assessmentMethod: 'Quran study' },
        { weekNumber: 7, topicName: 'Islamic Ethics - Morality and Values', objectives: ['Learn Islamic values', 'Understand ethics'], duration: 5, resources: ['Ethics guide', 'Stories'], assessmentMethod: 'Value discussion' },
        { weekNumber: 8, topicName: 'Islamic Holidays - Eid and Ramadan', objectives: ['Understand celebrations', 'Know practices'], duration: 5, resources: ['Holiday guide', 'Pictures'], assessmentMethod: 'Holiday project' },
        { weekNumber: 9, topicName: 'Islamic Family Life', objectives: ['Understand family', 'Learn responsibilities'], duration: 5, resources: ['Family guide', 'Stories'], assessmentMethod: 'Family discussion' },
        { weekNumber: 10, topicName: 'Islamic Science and Learning', objectives: ['Understand scholars', 'Know contributions'], duration: 5, resources: ['Science text', 'Biographies'], assessmentMethod: 'Research project' },
        { weekNumber: 11, topicName: 'Islamic Community and Social Responsibility', objectives: ['Learn Ummah', 'Understand service'], duration: 5, resources: ['Community guide', 'Service ideas'], assessmentMethod: 'Service project' },
        { weekNumber: 12, topicName: 'Comparative Religion', objectives: ['Compare religions', 'Understand differences'], duration: 5, resources: ['Religion texts', 'Comparison chart'], assessmentMethod: 'Comparison activity' },
        { weekNumber: 13, topicName: 'Islamic Studies Assessment and Reflection', objectives: ['Review all topics', 'Reflect on learning'], duration: 5, resources: ['Review sheet', 'Reflection guide'], assessmentMethod: 'Assessment' },
      ],
    },
    'Christian Religion Studies': {
      'Primary': [
        { weekNumber: 1, topicName: 'Introduction to Christianity', objectives: ['Understand Christianity', 'Know basic beliefs'], duration: 5, resources: ['Bible', 'Religion guide'], assessmentMethod: 'Discussion' },
        { weekNumber: 2, topicName: 'The Holy Bible - Structure and Books', objectives: ['Know Bible structure', 'Learn books'], duration: 5, resources: ['Bible', 'Study guide'], assessmentMethod: 'Bible study' },
        { weekNumber: 3, topicName: 'Life of Jesus Christ', objectives: ['Know Jesus life', 'Learn teachings'], duration: 5, resources: ['Gospel texts', 'Stories'], assessmentMethod: 'Story discussion' },
        { weekNumber: 4, topicName: 'The Ten Commandments', objectives: ['Learn commandments', 'Understand ethics'], duration: 5, resources: ['Commandment cards', 'Guide'], assessmentMethod: 'Learning activity' },
        { weekNumber: 5, topicName: 'Christian Virtues and Values', objectives: ['Learn virtues', 'Understand morality'], duration: 5, resources: ['Virtue guide', 'Stories'], assessmentMethod: 'Value discussion' },
        { weekNumber: 6, topicName: 'The Beatitudes', objectives: ['Learn beatitudes', 'Understand teachings'], duration: 5, resources: ['Gospel text', 'Explanation'], assessmentMethod: 'Teaching study' },
        { weekNumber: 7, topicName: 'Christian Sacraments and Rituals', objectives: ['Know sacraments', 'Understand practices'], duration: 5, resources: ['Ritual guides', 'Explanations'], assessmentMethod: 'Practice discussion' },
        { weekNumber: 8, topicName: 'Christian Holy Days - Christmas and Easter', objectives: ['Understand celebrations', 'Know significance'], duration: 5, resources: ['Holiday guide', 'Stories'], assessmentMethod: 'Holiday project' },
        { weekNumber: 9, topicName: 'The Apostles and Early Church', objectives: ['Know apostles', 'Understand church history'], duration: 5, resources: ['History text', 'Biographies'], assessmentMethod: 'History study' },
        { weekNumber: 10, topicName: 'Church History and Denominations', objectives: ['Learn church history', 'Understand divisions'], duration: 5, resources: ['History books', 'Timeline'], assessmentMethod: 'Timeline activity' },
        { weekNumber: 11, topicName: 'Christian Social Responsibility', objectives: ['Learn service', 'Understand charity'], duration: 5, resources: ['Service guide', 'Community info'], assessmentMethod: 'Service project' },
        { weekNumber: 12, topicName: 'Prayer and Worship', objectives: ['Learn prayers', 'Understand worship'], duration: 5, resources: ['Prayer book', 'Worship guide'], assessmentMethod: 'Prayer practice' },
        { weekNumber: 13, topicName: 'Christian Studies Assessment and Reflection', objectives: ['Review all topics', 'Reflect on faith'], duration: 5, resources: ['Review sheet', 'Reflection guide'], assessmentMethod: 'Assessment' },
      ],
    },
    'Yoruba Language': {
      'Primary': [
        { weekNumber: 1, topicName: 'Greetings and Salutations', objectives: ['Learn greetings', 'Understand customs'], duration: 5, resources: ['Greeting guide', 'Audio'], assessmentMethod: 'Greeting practice' },
        { weekNumber: 2, topicName: 'Basic Vocabulary - Family', objectives: ['Learn family words', 'Use in sentences'], duration: 5, resources: ['Vocabulary list', 'Family cards'], assessmentMethod: 'Vocabulary test' },
        { weekNumber: 3, topicName: 'Basic Vocabulary - Food', objectives: ['Learn food words', 'Name items'], duration: 5, resources: ['Food pictures', 'Word list'], assessmentMethod: 'Food vocabulary' },
        { weekNumber: 4, topicName: 'Basic Vocabulary - Numbers', objectives: ['Count in Yoruba', 'Write numbers'], duration: 5, resources: ['Number cards', 'Audio'], assessmentMethod: 'Number drill' },
        { weekNumber: 5, topicName: 'Basic Vocabulary - Colors', objectives: ['Learn color words', 'Describe objects'], duration: 5, resources: ['Color cards', 'Pictures'], assessmentMethod: 'Color identification' },
        { weekNumber: 6, topicName: 'Simple Sentences', objectives: ['Form sentences', 'Understand grammar'], duration: 5, resources: ['Grammar guide', 'Sentence cards'], assessmentMethod: 'Sentence formation' },
        { weekNumber: 7, topicName: 'Yoruba Pronunciation and Tones', objectives: ['Pronounce correctly', 'Understand tones'], duration: 5, resources: ['Audio guide', 'Pronunciation chart'], assessmentMethod: 'Pronunciation practice' },
        { weekNumber: 8, topicName: 'Yoruba Culture and Traditions', objectives: ['Know culture', 'Understand customs'], duration: 5, resources: ['Cultural guide', 'Stories'], assessmentMethod: 'Culture project' },
        { weekNumber: 9, topicName: 'Yoruba Proverbs and Sayings', objectives: ['Learn proverbs', 'Understand meanings'], duration: 5, resources: ['Proverb collection', 'Explanations'], assessmentMethod: 'Proverb discussion' },
        { weekNumber: 10, topicName: 'Yoruba Literature and Folktales', objectives: ['Read folktales', 'Understand stories'], duration: 5, resources: ['Story books', 'Audio'], assessmentMethod: 'Story telling' },
        { weekNumber: 11, topicName: 'Yoruba Music and Dance', objectives: ['Learn songs', 'Understand music'], duration: 5, resources: ['Music guide', 'Audio'], assessmentMethod: 'Music performance' },
        { weekNumber: 12, topicName: 'Yoruba Festivals', objectives: ['Know festivals', 'Understand significance'], duration: 5, resources: ['Festival guide', 'Pictures'], assessmentMethod: 'Festival project' },
        { weekNumber: 13, topicName: 'Yoruba Language Assessment', objectives: ['Demonstrate skills', 'Speak and write'], duration: 5, resources: ['Assessment sheet', 'Audio'], assessmentMethod: 'Language test' },
      ],
    },
    'Igbo Language': {
      'Primary': [
        { weekNumber: 1, topicName: 'Greetings in Igbo', objectives: ['Learn greetings', 'Practice speaking'], duration: 5, resources: ['Greeting guide', 'Audio'], assessmentMethod: 'Greeting practice' },
        { weekNumber: 2, topicName: 'Basic Vocabulary - People', objectives: ['Learn people words', 'Name individuals'], duration: 5, resources: ['Vocabulary list', 'Picture cards'], assessmentMethod: 'People vocabulary' },
        { weekNumber: 3, topicName: 'Basic Vocabulary - Animals', objectives: ['Learn animal words', 'Describe animals'], duration: 5, resources: ['Animal pictures', 'Word list'], assessmentMethod: 'Animal identification' },
        { weekNumber: 4, topicName: 'Basic Vocabulary - Objects', objectives: ['Learn object words', 'Name things'], duration: 5, resources: ['Object pictures', 'Vocabulary cards'], assessmentMethod: 'Object naming' },
        { weekNumber: 5, topicName: 'Simple Conversation', objectives: ['Hold conversations', 'Understand dialogue'], duration: 5, resources: ['Conversation guide', 'Dialogue cards'], assessmentMethod: 'Conversation practice' },
        { weekNumber: 6, topicName: 'Numbers and Counting', objectives: ['Count in Igbo', 'Use numbers'], duration: 5, resources: ['Number cards', 'Audio'], assessmentMethod: 'Number counting' },
        { weekNumber: 7, topicName: 'Igbo Grammar Basics', objectives: ['Learn grammar', 'Form sentences'], duration: 5, resources: ['Grammar book', 'Examples'], assessmentMethod: 'Grammar exercise' },
        { weekNumber: 8, topicName: 'Igbo Culture and Traditions', objectives: ['Know culture', 'Understand practices'], duration: 5, resources: ['Culture guide', 'Stories'], assessmentMethod: 'Culture project' },
        { weekNumber: 9, topicName: 'Igbo Naming Ceremonies', objectives: ['Understand naming', 'Know significance'], duration: 5, resources: ['Ceremony guide', 'Information'], assessmentMethod: 'Ceremony discussion' },
        { weekNumber: 10, topicName: 'Igbo Marriage Customs', objectives: ['Learn customs', 'Understand traditions'], duration: 5, resources: ['Custom guide', 'Explanations'], assessmentMethod: 'Custom study' },
        { weekNumber: 11, topicName: 'Igbo Food and Cooking', objectives: ['Learn food words', 'Understand recipes'], duration: 5, resources: ['Recipe guide', 'Food vocabulary'], assessmentMethod: 'Food project' },
        { weekNumber: 12, topicName: 'Igbo Proverbs and Wisdom', objectives: ['Learn proverbs', 'Understand meanings'], duration: 5, resources: ['Proverb book', 'Explanations'], assessmentMethod: 'Proverb learning' },
        { weekNumber: 13, topicName: 'Igbo Language Assessment', objectives: ['Demonstrate skills', 'Speak fluently'], duration: 5, resources: ['Assessment sheet', 'Audio'], assessmentMethod: 'Language test' },
      ],
    },
    'Hausa Language': {
      'Primary': [
        { weekNumber: 1, topicName: 'Hausa Greetings', objectives: ['Learn greetings', 'Practice responses'], duration: 5, resources: ['Greeting guide', 'Audio'], assessmentMethod: 'Greeting practice' },
        { weekNumber: 2, topicName: 'Basic Vocabulary - Daily Words', objectives: ['Learn daily words', 'Use in context'], duration: 5, resources: ['Vocabulary list', 'Context cards'], assessmentMethod: 'Vocabulary test' },
        { weekNumber: 3, topicName: 'Hausa Numbers', objectives: ['Count in Hausa', 'Use numbers'], duration: 5, resources: ['Number chart', 'Audio'], assessmentMethod: 'Number counting' },
        { weekNumber: 4, topicName: 'Family and Relations', objectives: ['Learn family words', 'Understand structure'], duration: 5, resources: ['Family tree', 'Word list'], assessmentMethod: 'Family vocabulary' },
        { weekNumber: 5, topicName: 'Simple Sentences and Phrases', objectives: ['Form sentences', 'Practice dialogue'], duration: 5, resources: ['Grammar guide', 'Phrase cards'], assessmentMethod: 'Sentence formation' },
        { weekNumber: 6, topicName: 'Hausa Alphabet and Writing', objectives: ['Write Hausa', 'Understand script'], duration: 5, resources: ['Alphabet chart', 'Writing guide'], assessmentMethod: 'Writing practice' },
        { weekNumber: 7, topicName: 'Hausa Culture and Customs', objectives: ['Know culture', 'Understand traditions'], duration: 5, resources: ['Culture guide', 'Explanations'], assessmentMethod: 'Culture project' },
        { weekNumber: 8, topicName: 'Hausa Markets and Commerce', objectives: ['Learn market words', 'Understand commerce'], duration: 5, resources: ['Market vocabulary', 'Price cards'], assessmentMethod: 'Market dialogue' },
        { weekNumber: 9, topicName: 'Hausa Clothing and Appearance', objectives: ['Learn clothing words', 'Describe appearance'], duration: 5, resources: ['Clothing pictures', 'Vocabulary'], assessmentMethod: 'Clothing identification' },
        { weekNumber: 10, topicName: 'Hausa Traditional Crafts', objectives: ['Learn craft words', 'Understand traditions'], duration: 5, resources: ['Craft guide', 'Pictures'], assessmentMethod: 'Craft project' },
        { weekNumber: 11, topicName: 'Hausa Music and Dance', objectives: ['Learn music words', 'Understand traditions'], duration: 5, resources: ['Music guide', 'Audio'], assessmentMethod: 'Music learning' },
        { weekNumber: 12, topicName: 'Hausa Proverbs and Sayings', objectives: ['Learn proverbs', 'Understand wisdom'], duration: 5, resources: ['Proverb book', 'Explanations'], assessmentMethod: 'Proverb study' },
        { weekNumber: 13, topicName: 'Hausa Language Assessment', objectives: ['Demonstrate skills', 'Speak Hausa'], duration: 5, resources: ['Assessment sheet', 'Audio'], assessmentMethod: 'Language test' },
      ],
    },

    // SECONDARY SCHOOL TOPICS  
    'Biology': {
      'Secondary': [
        { weekNumber: 1, topicName: 'Cell Biology - Cell Structure', objectives: ['Identify cell organelles', 'Understand functions'], duration: 5, resources: ['Microscope', 'Cell models'], assessmentMethod: 'Labeling exercise' },
        { weekNumber: 2, topicName: 'Cell Biology - Cell Division', objectives: ['Understand mitosis', 'Study meiosis'], duration: 5, resources: ['Cell division diagrams', 'Animation'], assessmentMethod: 'Diagram labeling' },
        { weekNumber: 3, topicName: 'Genetics - Inheritance', objectives: ['Understand Mendelian laws', 'Solve genetics problems'], duration: 5, resources: ['Punnett squares', 'Genetics problems'], assessmentMethod: 'Genetics problems' },
        { weekNumber: 4, topicName: 'Genetics - DNA and Protein Synthesis', objectives: ['Understand DNA structure', 'Study protein making'], duration: 5, resources: ['DNA model', 'Diagram cards'], assessmentMethod: 'Concept explanation' },
        { weekNumber: 5, topicName: 'Ecology - Ecosystems', objectives: ['Understand food chains', 'Study interactions'], duration: 5, resources: ['Ecosystem diagrams', 'Video'], assessmentMethod: 'Ecosystem mapping' },
        { weekNumber: 6, topicName: 'Ecology - Population Dynamics', objectives: ['Analyze populations', 'Understand growth'], duration: 5, resources: ['Population data', 'Graphs'], assessmentMethod: 'Data analysis' },
        { weekNumber: 7, topicName: 'Photosynthesis', objectives: ['Understand light reactions', 'Study Calvin cycle'], duration: 5, resources: ['Process diagram', 'Equation cards'], assessmentMethod: 'Process explanation' },
        { weekNumber: 8, topicName: 'Respiration', objectives: ['Understand cellular respiration', 'Compare aerobic/anaerobic'], duration: 5, resources: ['Respiration diagram', 'Equations'], assessmentMethod: 'Energy calculation' },
        { weekNumber: 9, topicName: 'Human Body - Circulatory System', objectives: ['Understand heart', 'Study blood vessels'], duration: 5, resources: ['Heart model', 'Blood flow diagram'], assessmentMethod: 'Labeling and questions' },
        { weekNumber: 10, topicName: 'Human Body - Respiratory System', objectives: ['Understand lungs', 'Study gas exchange'], duration: 5, resources: ['Lung model', 'Respiratory tract diagram'], assessmentMethod: 'Breathing experiment' },
        { weekNumber: 11, topicName: 'Evolution and Natural Selection', objectives: ['Understand evolution', 'Study adaptations'], duration: 5, resources: ['Evolution timeline', 'Case studies'], assessmentMethod: 'Essay on evolution' },
        { weekNumber: 12, topicName: 'WAEC Exam Preparation', objectives: ['Review all biology topics', 'Practice questions'], duration: 5, resources: ['Past papers', 'Sample questions'], assessmentMethod: 'Mock exam' },
        { weekNumber: 13, topicName: 'Final Practical and Assessment', objectives: ['Conduct lab practicals', 'Final exam'], duration: 5, resources: ['Lab equipment', 'Practical guide'], assessmentMethod: 'Practical exam' },
      ],
    },
    'Physics': {
      'Secondary': [
        { weekNumber: 1, topicName: 'Mechanics - Motion', objectives: ['Understand velocity', 'Calculate acceleration'], duration: 5, resources: ['Equations of motion', 'Motion simulator'], assessmentMethod: 'Calculation problems' },
        { weekNumber: 2, topicName: 'Mechanics - Forces', objectives: ['Understand Newton\'s laws', 'Solve force problems'], duration: 5, resources: ['Force diagrams', 'Free body diagrams'], assessmentMethod: 'Force calculation' },
        { weekNumber: 3, topicName: 'Mechanics - Work and Energy', objectives: ['Calculate work', 'Understand energy'], duration: 5, resources: ['Energy equations', 'Work problems'], assessmentMethod: 'Energy problems' },
        { weekNumber: 4, topicName: 'Mechanics - Power and Efficiency', objectives: ['Calculate power', 'Find efficiency'], duration: 5, resources: ['Power formula', 'Problem cards'], assessmentMethod: 'Power calculations' },
        { weekNumber: 5, topicName: 'Waves - Properties', objectives: ['Understand wave characteristics', 'Measure wavelength'], duration: 5, resources: ['Wave simulator', 'Wave equations'], assessmentMethod: 'Wave analysis' },
        { weekNumber: 6, topicName: 'Sound', objectives: ['Understand sound properties', 'Study acoustics'], duration: 5, resources: ['Sound recorder', 'Frequency equipment'], assessmentMethod: 'Sound experiment' },
        { weekNumber: 7, topicName: 'Light - Reflection and Refraction', objectives: ['Study light behavior', 'Solve optics problems'], duration: 5, resources: ['Mirrors, lenses', 'Ray diagram'], assessmentMethod: 'Optics experiment' },
        { weekNumber: 8, topicName: 'Electricity - Current and Voltage', objectives: ['Understand circuits', 'Measure current'], duration: 5, resources: ['Circuit kit', 'Multimeter'], assessmentMethod: 'Circuit lab' },
        { weekNumber: 9, topicName: 'Electricity - Resistance and Power', objectives: ['Calculate resistance', 'Find power'], duration: 5, resources: ['Resistor values', 'Formula sheet'], assessmentMethod: 'Electrical calculations' },
        { weekNumber: 10, topicName: 'Magnetism', objectives: ['Understand magnetic fields', 'Study electromagnetic induction'], duration: 5, resources: ['Magnets', 'Iron filings'], assessmentMethod: 'Magnetism experiment' },
        { weekNumber: 11, topicName: 'Modern Physics - Atoms and Nuclei', objectives: ['Understand atomic structure', 'Study radioactivity'], duration: 5, resources: ['Atomic models', 'Decay equations'], assessmentMethod: 'Nuclear problems' },
        { weekNumber: 12, topicName: 'WAEC Exam Preparation', objectives: ['Review all physics', 'Practice problems'], duration: 5, resources: ['Past papers', 'Problem bank'], assessmentMethod: 'Mock exam' },
        { weekNumber: 13, topicName: 'Final Practical and Exam', objectives: ['Complete practicals', 'Final assessment'], duration: 5, resources: ['Lab equipment', 'Experiment guides'], assessmentMethod: 'Practical exam' },
      ],
    },
    'Chemistry': {
      'Secondary': [
        { weekNumber: 1, topicName: 'Atomic Structure and Periodic Table', objectives: ['Understand atoms', 'Locate elements'], duration: 5, resources: ['Periodic table', 'Atom models'], assessmentMethod: 'Periodic table quiz' },
        { weekNumber: 2, topicName: 'Chemical Bonding - Ionic', objectives: ['Understand ionic bonds', 'Write formulas'], duration: 5, resources: ['Bonding diagrams', 'Lewis structures'], assessmentMethod: 'Formula writing' },
        { weekNumber: 3, topicName: 'Chemical Bonding - Covalent', objectives: ['Understand covalent bonds', 'Draw structures'], duration: 4, resources: ['Bonding models', 'Dot diagrams'], assessmentMethod: 'Structure drawing' },
        { weekNumber: 4, topicName: 'Chemical Equations and Balancing', objectives: ['Balance equations', 'Classify reactions'], duration: 5, resources: ['Equation cards', 'Balancing worksheet'], assessmentMethod: 'Equation balancing test' },
        { weekNumber: 5, topicName: 'Stoichiometry', objectives: ['Calculate mole ratios', 'Solve stoichiometry problems'], duration: 5, resources: ['Molar mass table', 'Problem cards'], assessmentMethod: 'Stoichiometry calculations' },
        { weekNumber: 6, topicName: 'Acids, Bases and Salts', objectives: ['Understand pH', 'Study neutralization'], duration: 5, resources: ['pH meter', 'Solutions'], assessmentMethod: 'pH lab' },
        { weekNumber: 7, topicName: 'Oxidation and Reduction', objectives: ['Identify redox reactions', 'Balance redox equations'], duration: 5, resources: ['Redox worksheet', 'Oxidation state table'], assessmentMethod: 'Redox problems' },
        { weekNumber: 8, topicName: 'Organic Chemistry - Hydrocarbons', objectives: ['Study carbon compounds', 'Name alkanes'], duration: 5, resources: ['Molecular models', 'Naming guide'], assessmentMethod: 'Nomenclature test' },
        { weekNumber: 9, topicName: 'Organic Chemistry - Functional Groups', objectives: ['Identify functional groups', 'Study reactions'], duration: 5, resources: ['Structure cards', 'Reaction chart'], assessmentMethod: 'Functional group identification' },
        { weekNumber: 10, topicName: 'States of Matter', objectives: ['Understand phase changes', 'Study properties'], duration: 5, resources: ['Phase diagram', 'State models'], assessmentMethod: 'Phase change lab' },
        { weekNumber: 11, topicName: 'Solution Chemistry', objectives: ['Understand dissolution', 'Calculate molarity'], duration: 5, resources: ['Solution worksheet', 'Concentration calculator'], assessmentMethod: 'Solution calculations' },
        { weekNumber: 12, topicName: 'WAEC Exam Preparation', objectives: ['Review all chemistry', 'Practice questions'], duration: 5, resources: ['Past papers', 'Review guide'], assessmentMethod: 'Mock exam' },
        { weekNumber: 13, topicName: 'Final Practical and Assessment', objectives: ['Complete lab practicals', 'Final exam'], duration: 5, resources: ['Chemical supplies', 'Safety equipment'], assessmentMethod: 'Practical exam' },
      ],
    },
  }

  // Try to find subject-specific topics by code pattern
  for (const topicSubject in allTopics) {
    if (subject.name.includes(topicSubject)) {
      const byLevel = allTopics[topicSubject]
      for (const level in byLevel) {
        if (subject.level === level) {
          return byLevel[level]
        }
      }
    }
  }

  // Default topics for any other subjects
  return [
    { weekNumber: 1, topicName: 'Introduction to ' + subject.name, objectives: ['Understand fundamentals', 'Learn key concepts'], duration: 5, resources: ['Textbook Chapter 1', 'Course materials'], assessmentMethod: 'Pre-assessment' },
    { weekNumber: 2, topicName: 'Core Principles', objectives: ['Master principles', 'Apply knowledge'], duration: 5, resources: ['Textbook Chapter 2', 'Case studies'], assessmentMethod: 'Quiz' },
    { weekNumber: 3, topicName: 'Advanced Concepts', objectives: ['Deepen understanding', 'Solve problems'], duration: 5, resources: ['Textbook Chapter 3', 'Worksheets'], assessmentMethod: 'Problem set' },
    { weekNumber: 4, topicName: 'Applications and Practice', objectives: ['Apply skills', 'Practice regularly'], duration: 5, resources: ['Practice materials', 'Exercises'], assessmentMethod: 'Practical work' },
    { weekNumber: 5, topicName: 'Real-World Examples', objectives: ['Connect to reality', 'See relevance'], duration: 5, resources: ['Case studies', 'Examples'], assessmentMethod: 'Analysis' },
    { weekNumber: 6, topicName: 'Problem Solving', objectives: ['Solve complex problems', 'Think critically'], duration: 5, resources: ['Problem bank', 'Thinking tools'], assessmentMethod: 'Problem solving test' },
    { weekNumber: 7, topicName: 'Review and Consolidation', objectives: ['Review concepts', 'Consolidate learning'], duration: 5, resources: ['Summary sheets', 'Review guide'], assessmentMethod: 'Review quiz' },
    { weekNumber: 8, topicName: 'Mini Project', objectives: ['Apply knowledge', 'Create something'], duration: 5, resources: ['Project brief', 'Materials'], assessmentMethod: 'Project submission' },
    { weekNumber: 9, topicName: 'Discussion and Debate', objectives: ['Share ideas', 'Think critically'], duration: 5, resources: ['Discussion topics', 'Debate materials'], assessmentMethod: 'Participation' },
    { weekNumber: 10, topicName: 'Peer Teaching', objectives: ['Explain concepts', 'Help others'], duration: 5, resources: ['Teaching materials'], assessmentMethod: 'Teaching demonstration' },
    { weekNumber: 11, topicName: 'Self-Assessment and Reflection', objectives: ['Evaluate progress', 'Identify strengths'], duration: 5, resources: ['Assessment rubric', 'Reflection sheet'], assessmentMethod: 'Self-assessment' },
    { weekNumber: 12, topicName: 'Final Review', objectives: ['Review all topics', 'Prepare for exam'], duration: 5, resources: ['Review materials', 'Study guide'], assessmentMethod: 'Review session' },
    { weekNumber: 13, topicName: 'Final Assessment', objectives: ['Demonstrate mastery', 'Show competency'], duration: 5, resources: ['Exam paper', 'Assessment tool'], assessmentMethod: 'Final exam' },
  ]
}

async function seed() {
  await connectDB()
  console.log('Connected to MongoDB')

  await User.deleteMany({})
  await Teacher.deleteMany({})
  await Subject.deleteMany({})
  await Curriculum.deleteMany({})
  await SchemeOfWork.deleteMany({})

  await User.create(DEFAULT_ADMIN)
  console.log('✅ Created default admin')

  // Add topics to subjects before creating them
  const subjectsWithTopics = NIGERIAN_SUBJECTS.map(subject => ({
    ...subject,
    topics: generateTopicsForSubject(subject),
  }))

  const subjects = await Subject.insertMany(subjectsWithTopics)
  console.log(`✅ Created ${subjects.length} Nigerian curriculum subjects with topics`)

  // Create default curriculum
  const preNurserySubjects = subjects.filter(s => s.level === 'Pre-Nursery').map(s => s._id.toString())
  const nurserySubjects = subjects.filter(s => s.level === 'Nursery').map(s => s._id.toString())
  const primarySubjects = subjects.filter(s => s.level === 'Primary').map(s => s._id.toString())
  const secondarySubjects = subjects.filter(s => s.level === 'Secondary').map(s => s._id.toString())
  const juniorSecondarySubjects = subjects.filter(s => s.level === 'Junior Secondary').map(s => s._id.toString())
  const vocationalSubjects = subjects.filter(s => s.level === 'Vocational').map(s => s._id.toString())

  await Curriculum.create([
    {
      name: 'Nigerian Pre-Nursery Curriculum',
      version: '2023.1',
      level: 'Pre-Nursery',
      yearsOfStudy: 2,
      subjects: preNurserySubjects,
      implementationDate: new Date('2023-09-01'),
      description: 'Nigerian pre-nursery curriculum',
      curriculum: 'NIGERIAN',
      status: 'ACTIVE',
      createdBy: 'admin@folusho.com',
    },
    {
      name: 'Nigerian Nursery Curriculum',
      version: '2023.1',
      level: 'Nursery',
      yearsOfStudy: 1,
      subjects: nurserySubjects,
      implementationDate: new Date('2023-09-01'),
      description: 'Nigerian nursery school curriculum',
      curriculum: 'NIGERIAN',
      status: 'ACTIVE',
      createdBy: 'admin@folusho.com',
    },
    {
      name: 'Nigerian Primary School Curriculum',
      version: '2023.1',
      level: 'Primary',
      yearsOfStudy: 6,
      subjects: primarySubjects,
      implementationDate: new Date('2023-09-01'),
      description: 'Current Nigerian primary school curriculum (Classes 1-6)',
      curriculum: 'NIGERIAN',
      status: 'ACTIVE',
      createdBy: 'admin@folusho.com',
    },
    {
      name: 'Nigerian Junior Secondary School Curriculum',
      version: '2023.1',
      level: 'Junior Secondary',
      yearsOfStudy: 3,
      subjects: juniorSecondarySubjects,
      implementationDate: new Date('2023-09-01'),
      description: 'Nigerian junior secondary school curriculum (JSS 1-3)',
      curriculum: 'NIGERIAN',
      status: 'ACTIVE',
      createdBy: 'admin@folusho.com',
    },
    {
      name: 'Nigerian Secondary School Curriculum',
      version: '2023.1',
      level: 'Secondary',
      yearsOfStudy: 6,
      subjects: secondarySubjects,
      implementationDate: new Date('2023-09-01'),
      description: 'Current Nigerian secondary school curriculum (JSS 1-3, SSS 1-3)',
      curriculum: 'NIGERIAN',
      status: 'ACTIVE',
      createdBy: 'admin@folusho.com',
    },
    {
      name: 'Nigerian Vocational Training Curriculum',
      version: '2023.1',
      level: 'Vocational',
      yearsOfStudy: 1,
      subjects: vocationalSubjects,
      implementationDate: new Date('2023-09-01'),
      description: 'Nigerian vocational and technical training curriculum',
      curriculum: 'NIGERIAN',
      status: 'ACTIVE',
      createdBy: 'admin@folusho.com',
    },
  ])
  console.log('✅ Created default curriculum catalogs')

  await Teacher.create({
    email: 'teacher1@folusho.com',
    name: 'Mr. Adeyemi',
    teacherId: 'T001',
    username: 'teacher1',
    password: 'TeacherPassword123!@#',
    subject: 'Mathematics',
    level: 'Secondary',
    assignedClasses: ['SSS1A', 'SSS1B', 'SSS2A'],
  })
  console.log('✅ Created default teacher')

  // Get curriculum IDs
  const preNurseryCurr = await Curriculum.findOne({ level: 'Pre-Nursery' })
  const nurseryCurr = await Curriculum.findOne({ level: 'Nursery' })
  const primaryCurr = await Curriculum.findOne({ level: 'Primary' })
  const secondaryCurr = await Curriculum.findOne({ level: 'Secondary' })
  const juniorSecondaryCurr = await Curriculum.findOne({ level: 'Junior Secondary' })
  const vocationalCurr = await Curriculum.findOne({ level: 'Vocational' })

  // Define classes by level
  const classMap: Record<string, string[]> = {
    'Pre-Nursery': ['Pre-Nursery A', 'Pre-Nursery B'],
    'Nursery': ['Nursery A', 'Nursery B', 'Nursery C'],
    'Primary': ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    'Secondary': ['JSS 1A', 'JSS 1B', 'JSS 2A', 'JSS 2B', 'JSS 3A', 'JSS 3B', 'SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B', 'SSS 3A', 'SSS 3B'],
    'Junior Secondary': ['JSS 1A', 'JSS 1B', 'JSS 2A', 'JSS 2B', 'JSS 3A', 'JSS 3B'],
    'Vocational': ['Class A', 'Class B', 'Class C'],
  }

  // Helper function to get curriculum for a subject level
  const getCurriculumForLevel = (level: string) => {
    const curriculumMap: Record<string, any> = {
      'Pre-Nursery': preNurseryCurr,
      'Nursery': nurseryCurr,
      'Primary': primaryCurr,
      'Secondary': secondaryCurr,
      'Junior Secondary': juniorSecondaryCurr,
      'Vocational': vocationalCurr,
    }
    return curriculumMap[level]
  }

  // Generate scheme of work for each subject
  const schemesData: any[] = []
  for (const subject of subjects) {
    const classes = classMap[subject.level] || [subject.level + ' A']
    const curriculum = getCurriculumForLevel(subject.level)

    // Create 3 schemes per subject (for 3 terms)
    for (let term = 1; term <= 3; term++) {
      // Create a scheme for the first class in the list
      const classId = classes[0]
      
      // Convert subject topics to scheme topics
      const schemeTopics = (subject.topics || []).map((topic: any) => ({
        weekNumber: topic.weekNumber,
        topic: topic.topicName,
        duration: topic.duration,
        objectives: topic.objectives || [],
        resources: topic.resources || [],
        assessmentMethod: topic.assessmentMethod,
        status: 'PLANNED',
      }))

      schemesData.push({
        teacherId: 'teacher1@folusho.com',
        subjectId: subject._id.toString(),
        classId,
        academicYear: '2025/2026',
        term,
        curriculumId: curriculum?._id.toString() || '',
        topics: schemeTopics,
        uploadedBy: 'teacher1@folusho.com',
        uploadedDate: new Date(),
        lastUpdated: new Date(),
        version: 1,
        status: 'APPROVED',
        approvedBy: 'admin@folusho.com',
        approvalDate: new Date(),
        notes: `Pre-configured scheme of work for ${subject.name} - ${subject.level} (Term ${term}, Academic Year 2025/2026)`,
      })
    }
  }

  // Create all schemes of work
  if (schemesData.length > 0) {
    await SchemeOfWork.insertMany(schemesData)
    console.log(`✅ Created ${schemesData.length} scheme of work entries for all subjects`)
  }

  console.log('\n🎓 Seed completed successfully!')
  console.log(`Total Subjects: ${subjects.length}`)
  console.log('Available Levels: Pre-Nursery, Nursery, Primary, Junior Secondary, Secondary, Vocational')
  process.exit(0)
}

seed().catch(console.error)
