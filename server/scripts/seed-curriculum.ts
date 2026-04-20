import mongoose from 'mongoose'
import { Curriculum } from '../models/Curriculum'
import { Subject } from '../models/Subject'
import { envConfig } from '../utils/envConfig'

/**
 * NERDC Curriculum & Scheme of Work Seeding Script
 * 
 * USAGE:
 * 1. Update the curriculumData object below with your NERDC PDF content
 * 2. Run: npm run seed:curriculum
 * 
 * STRUCTURE:
 * - School Levels: Pre-Nursery, Nursery, Primary, Secondary (JSS/SSS)
 * - Each level has classes and subjects
 * - Each subject has topics organized by term and week
 */

// ADMIN USER ID - Replace with actual admin ID
const ADMIN_ID = 'admin-user-id'

interface TopicData {
  weekNumber: number
  topicName: string
  objectives: string[]
  duration: number // in weeks
  resources: string[]
  assessmentMethod: string
}

interface SubjectData {
  name: string
  code: string
  level: 'Pre-Nursery' | 'Nursery' | 'Primary' | 'Secondary'
  creditUnits: number
  subjectCategory: 'CORE' | 'ELECTIVE' | 'VOCATIONAL'
  description: string
  curriculumType: 'NIGERIAN' | 'IGCSE' | 'OTHER'
  prerequisites?: string[]
  termTopics: {
    [term: string]: TopicData[]
  }
}

interface CurriculumLevelData {
  levelName: string
  yearsOfStudy: number
  classes: string[]
  subjects: SubjectData[]
}

interface CurriculumSeedData {
  [key: string]: CurriculumLevelData
}

// ============================================
// PRIMARY SCHOOL CURRICULUM (2025 NERDC)
// ============================================
const PRIMARY_CURRICULUM: CurriculumSeedData = {
  Primary1: {
    levelName: 'Primary 1',
    yearsOfStudy: 1,
    classes: ['Primary 1'],
    subjects: [
      {
        name: 'English Language',
        code: 'ENG-P1-001',
        level: 'Primary',
        creditUnits: 5,
        subjectCategory: 'CORE',
        description: 'English Language for Primary 1',
        curriculumType: 'NIGERIAN',
        termTopics: {
          term1: [
            {
              weekNumber: 1,
              topicName: 'Phonics and Letter Recognition (A-E)',
              duration: 1,
              objectives: [
                'Recognize capital and small letters A-E',
                'Identify initial sounds of A, E, I, O, U',
                'Trace and write letters correctly'
              ],
              resources: ['Flashcards', 'Letter tracing books', 'Picture cards'],
              assessmentMethod: 'Oral and written assessment'
            },
            {
              weekNumber: 2,
              topicName: 'Letter Recognition (F-J)',
              duration: 1,
              objectives: [
                'Recognize letters F-J',
                'Identify consonant sounds',
                'Form letter combinations'
              ],
              resources: ['Flashcards', 'Workbooks', 'Alphabet charts'],
              assessmentMethod: 'Observation and letter writing'
            },
            {
              weekNumber: 3,
              topicName: 'Simple Three-Letter Words',
              duration: 2,
              objectives: [
                'Blend sounds into simple words (CVC patterns)',
                'Recognize and read sight words',
                'Write simple words'
              ],
              resources: ['Word cards', 'Reading books', 'Phonics workbooks'],
              assessmentMethod: 'Reading and writing exercises'
            },
            {
              weekNumber: 5,
              topicName: 'Listening and Speaking Skills',
              duration: 1,
              objectives: [
                'Listen attentively to stories and instructions',
                'Speak clearly and confidently',
                'Use appropriate greetings'
              ],
              resources: ['Story books', 'Audio materials', 'Puppet shows'],
              assessmentMethod: 'Oral presentation and dialogue'
            },
            {
              weekNumber: 6,
              topicName: 'Basic Sentence Construction',
              duration: 2,
              objectives: [
                'Form simple sentences with 2-3 words',
                'Use correct subject-verb agreement',
                'Recognize basic punctuation'
              ],
              resources: ['Sentence strips', 'Picture stories', 'Word cards'],
              assessmentMethod: 'Written and spoken sentences'
            },
            {
              weekNumber: 8,
              topicName: 'Reading for Comprehension',
              duration: 2,
              objectives: [
                'Answer simple questions about texts',
                'Identify main ideas in short passages',
                'Recall details from stories'
              ],
              resources: ['Story books', 'Comprehension worksheets', 'Pictures'],
              assessmentMethod: 'Comprehension questions and discussion'
            },
            {
              weekNumber: 10,
              topicName: 'Creative Writing - Simple Sentences',
              duration: 2,
              objectives: [
                'Write simple captions for pictures',
                'Create short sentences about familiar topics',
                'Use correct letter formation'
              ],
              resources: ['Writing books', 'Picture prompts', 'Letter templates'],
              assessmentMethod: 'Written work and portfolio'
            },
            {
              weekNumber: 12,
              topicName: 'Revision and Assessment',
              duration: 1,
              objectives: [
                'Review all learned letters and sounds',
                'Practice reading and writing skills',
                'Prepare for term examination'
              ],
              resources: ['Review worksheets', 'Past assessments', 'Practice books'],
              assessmentMethod: 'Continuous assessment and exams'
            }
          ],
          term2: [
            {
              weekNumber: 1,
              topicName: 'Vowels and Consonants Consolidation',
              duration: 1,
              objectives: [
                'Strengthen vowel and consonant recognition',
                'Read CVC words fluently',
                'Understand short vowel sounds'
              ],
              resources: ['Phonics workbooks', 'Flashcards', 'Sound charts'],
              assessmentMethod: 'Reading assessment'
            },
            {
              weekNumber: 2,
              topicName: 'Digraphs (ch, sh, th, ng)',
              duration: 2,
              objectives: [
                'Recognize digraph combinations',
                'Read words with digraphs',
                'Identify digraph sounds'
              ],
              resources: ['Word lists', 'Picture cards', 'Phonics materials'],
              assessmentMethod: 'Phonics test and oral reading'
            },
            {
              weekNumber: 4,
              topicName: 'Sight Words Development',
              duration: 2,
              objectives: [
                'Learn and recognize 50+ sight words',
                'Use sight words in sentences',
                'Improve reading fluency'
              ],
              resources: ['Sight word cards', 'Sentence strips', 'Reading books'],
              assessmentMethod: 'Sight word tests and reading fluency'
            },
            {
              weekNumber: 6,
              topicName: 'Story Comprehension and Sequencing',
              duration: 2,
              objectives: [
                'Understand story sequence',
                'Answer comprehension questions',
                'Retell stories in order'
              ],
              resources: ['Story books', 'Picture sequences', 'Worksheets'],
              assessmentMethod: 'Discussion and written responses'
            },
            {
              weekNumber: 8,
              topicName: 'Descriptive Language and Adjectives',
              duration: 2,
              objectives: [
                'Use simple adjectives',
                'Describe objects and people',
                'Expand vocabulary'
              ],
              resources: ['Picture books', 'Descriptive cards', 'Workbooks'],
              assessmentMethod: 'Oral and written descriptions'
            },
            {
              weekNumber: 10,
              topicName: 'Writing Activities and Journals',
              duration: 2,
              objectives: [
                'Write daily journal entries',
                'Create simple stories',
                'Improve handwriting'
              ],
              resources: ['Writing journals', 'Picture prompts', 'Templates'],
              assessmentMethod: 'Portfolio and journal assessment'
            },
            {
              weekNumber: 12,
              topicName: 'Term 2 Revision',
              duration: 1,
              objectives: [
                'Consolidate all term 2 learning',
                'Practice for examinations',
                'Identify areas needing support'
              ],
              resources: ['Revision worksheets', 'Practice tests', 'Materials'],
              assessmentMethod: 'Final assessment and exams'
            }
          ],
          term3: [
            {
              weekNumber: 1,
              topicName: 'Blending and Word Building Review',
              duration: 1,
              objectives: [
                'Review sound blending techniques',
                'Build words from letter combinations',
                'Strengthen phonetic skills'
              ],
              resources: ['Sound cards', 'Word building activities', 'Workbooks'],
              assessmentMethod: 'Oral and written activities'
            },
            {
              weekNumber: 2,
              topicName: 'Silent Letters and Irregular Words',
              duration: 2,
              objectives: [
                'Identify silent letters',
                'Read irregular words',
                'Understand exceptions to phonetic rules'
              ],
              resources: ['Word lists', 'Picture cards', 'Reading materials'],
              assessmentMethod: 'Reading and comprehension tests'
            },
            {
              weekNumber: 4,
              topicName: 'Sentence Writing Skills',
              duration: 2,
              objectives: [
                'Write complete sentences',
                'Use capital letters and punctuation',
                'Organize thoughts in writing'
              ],
              resources: ['Writing books', 'Sentence frames', 'Worksheets'],
              assessmentMethod: 'Written work samples'
            },
            {
              weekNumber: 6,
              topicName: 'Poetry and Rhyming Words',
              duration: 2,
              objectives: [
                'Identify rhyming patterns',
                'Create simple rhymes',
                'Enjoy poetry and rhythm'
              ],
              resources: ['Poetry books', 'Rhyming cards', 'Audio materials'],
              assessmentMethod: 'Recitation and creative writing'
            },
            {
              weekNumber: 8,
              topicName: 'Reading Different Text Types',
              duration: 2,
              objectives: [
                'Read informational texts',
                'Understand simple instructions',
                'Read labels and signs'
              ],
              resources: ['Information books', 'Labels', 'Instructions materials'],
              assessmentMethod: 'Reading comprehension'
            },
            {
              weekNumber: 10,
              topicName: 'Creative Expression and Communication',
              duration: 2,
              objectives: [
                'Express ideas through writing',
                'Share stories and experiences',
                'Develop confidence in communication'
              ],
              resources: ['Story starters', 'Picture prompts', 'Art materials'],
              assessmentMethod: 'Portfolio and presentations'
            },
            {
              weekNumber: 12,
              topicName: 'Annual Revision and Consolidation',
              duration: 1,
              objectives: [
                'Review year\'s learning objectives',
                'Consolidate skills for next level',
                'Celebrate reading progress'
              ],
              resources: ['Review materials', 'Assessment tools', 'Certificates'],
              assessmentMethod: 'Annual assessment and evaluation'
            }
          ]
        }
      },
      {
        name: 'Mathematics',
        code: 'MATH-P1-001',
        level: 'Primary',
        creditUnits: 5,
        subjectCategory: 'CORE',
        description: 'Mathematics for Primary 1',
        curriculumType: 'NIGERIAN',
        termTopics: {
          term1: [
            {
              weekNumber: 1,
              topicName: 'Counting 1-10',
              duration: 1,
              objectives: [
                'Count from 1-10 accurately',
                'Recognize numbers 1-10',
                'Understand one-to-one correspondence'
              ],
              resources: ['Number cards', 'Counting beads', 'Pictures'],
              assessmentMethod: 'Observation and counting exercises'
            },
            {
              weekNumber: 2,
              topicName: 'Number Writing 1-10',
              duration: 1,
              objectives: [
                'Write numbers 1-10 correctly',
                'Trace number formations',
                'Match numbers to quantities'
              ],
              resources: ['Writing paper', 'Number cards', 'Tracing books'],
              assessmentMethod: 'Written work samples'
            },
            {
              weekNumber: 3,
              topicName: 'Number Bonds and Combinations',
              duration: 2,
              objectives: [
                'Understand parts and wholes',
                'Find different ways to make numbers',
                'Develop subitizing skills'
              ],
              resources: ['Ten frames', 'Counters', 'Number bond cards'],
              assessmentMethod: 'Practical activities and observation'
            },
            {
              weekNumber: 5,
              topicName: 'Addition within 10',
              duration: 2,
              objectives: [
                'Add two numbers within 10',
                'Use concrete and pictorial representations',
                'Develop mental addition strategies'
              ],
              resources: ['Counters', 'Number lines', 'Addition worksheets'],
              assessmentMethod: 'Practical and written exercises'
            },
            {
              weekNumber: 7,
              topicName: 'Subtraction within 10',
              duration: 2,
              objectives: [
                'Subtract numbers within 10',
                'Model subtraction situations',
                'Develop mental subtraction strategies'
              ],
              resources: ['Counters', 'Number lines', 'Picture problems'],
              assessmentMethod: 'Practical problems and worksheets'
            },
            {
              weekNumber: 9,
              topicName: 'Shape and Space - 2D Shapes',
              duration: 2,
              objectives: [
                'Identify common 2D shapes',
                'Describe shape properties',
                'Sort and classify shapes'
              ],
              resources: ['Shape cards', 'Shape cut-outs', 'Sorting boxes'],
              assessmentMethod: 'Shape identification and sorting'
            },
            {
              weekNumber: 11,
              topicName: 'Measurement - Length and Height',
              duration: 1,
              objectives: [
                'Compare lengths using non-standard units',
                'Understand concepts of tall/short',
                'Develop measurement language'
              ],
              resources: ['Measuring tools', 'Objects', 'Comparison cards'],
              assessmentMethod: 'Practical measuring activities'
            }
          ],
          term2: [
            {
              weekNumber: 1,
              topicName: 'Consolidation: Numbers 1-20',
              duration: 1,
              objectives: [
                'Count and recognize numbers up to 20',
                'Write numbers 1-20 correctly',
                'Understand place value concepts'
              ],
              resources: ['Number cards', 'Place value materials', 'Workbooks'],
              assessmentMethod: 'Written and oral assessment'
            },
            {
              weekNumber: 2,
              topicName: 'Addition and Subtraction to 20',
              duration: 2,
              objectives: [
                'Add and subtract numbers to 20',
                'Use different strategies',
                'Develop fact fluency'
              ],
              resources: ['Number cards', 'Counters', 'Worksheets'],
              assessmentMethod: 'Practical and written problems'
            },
            {
              weekNumber: 4,
              topicName: '3D Shapes and Objects',
              duration: 2,
              objectives: [
                'Identify 3D shapes',
                'Describe shape properties',
                'Find shapes in the environment'
              ],
              resources: ['3D objects', 'Shape cards', 'Picture materials'],
              assessmentMethod: 'Shape exploration and identification'
            },
            {
              weekNumber: 6,
              topicName: 'Patterns and Sequences',
              duration: 2,
              objectives: [
                'Identify and create patterns',
                'Continue simple sequences',
                'Describe pattern rules'
              ],
              resources: ['Pattern cards', 'Beads', 'Shape sequences'],
              assessmentMethod: 'Pattern activities and worksheets'
            },
            {
              weekNumber: 8,
              topicName: 'Money - Recognition of Coins',
              duration: 2,
              objectives: [
                'Recognize common coins',
                'Match coins to values',
                'Develop money concepts'
              ],
              resources: ['Play coins', 'Price cards', 'Shop materials'],
              assessmentMethod: 'Practical money activities'
            },
            {
              weekNumber: 10,
              topicName: 'Time - Concepts and Clock',
              duration: 1,
              objectives: [
                'Understand time concepts',
                'Recognize clock faces',
                'Identify time to the hour'
              ],
              resources: ['Clock face', 'Time cards', 'Daily schedule'],
              assessmentMethod: 'Observation and time exercises'
            },
            {
              weekNumber: 11,
              topicName: 'Data Handling - Simple Graphs',
              duration: 1,
              objectives: [
                'Collect and organize simple data',
                'Create pictographs',
                'Interpret data visually'
              ],
              resources: ['Picture cards', 'Graph paper', 'Counters'],
              assessmentMethod: 'Data collection and graph creation'
            }
          ],
          term3: [
            {
              weekNumber: 1,
              topicName: 'Review and Consolidation',
              duration: 1,
              objectives: [
                'Review numbers 1-20',
                'Strengthen addition and subtraction facts',
                'Build confidence in number skills'
              ],
              resources: ['Review worksheets', 'Practice cards', 'Games'],
              assessmentMethod: 'Mixed practice activities'
            },
            {
              weekNumber: 2,
              topicName: 'Problem Solving with Numbers',
              duration: 2,
              objectives: [
                'Solve simple word problems',
                'Develop problem-solving strategies',
                'Apply mathematics to real situations'
              ],
              resources: ['Problem cards', 'Picture stories', 'Scenarios'],
              assessmentMethod: 'Problem-solving assessments'
            },
            {
              weekNumber: 4,
              topicName: 'Fractions - Halves and Wholes',
              duration: 2,
              objectives: [
                'Understand concept of halves',
                'Divide objects into two equal parts',
                'Use fraction language'
              ],
              resources: ['Fraction circles', 'Pictures', 'Objects'],
              assessmentMethod: 'Practical fraction activities'
            },
            {
              weekNumber: 6,
              topicName: 'Weight and Capacity',
              duration: 2,
              objectives: [
                'Compare weights using non-standard units',
                'Understand capacity concepts',
                'Use comparing language'
              ],
              resources: ['Objects', 'Containers', 'Balances'],
              assessmentMethod: 'Practical measurement activities'
            },
            {
              weekNumber: 8,
              topicName: 'More Patterns and Relationships',
              duration: 2,
              objectives: [
                'Create more complex patterns',
                'Understand mathematical relationships',
                'Develop algebraic thinking'
              ],
              resources: ['Pattern materials', 'Sequence cards', 'Beads'],
              assessmentMethod: 'Pattern creation and analysis'
            },
            {
              weekNumber: 10,
              topicName: 'Mathematical Games and Activities',
              duration: 2,
              objectives: [
                'Develop mathematical thinking through play',
                'Practice skills in engaging contexts',
                'Build confidence and fluency'
              ],
              resources: ['Mathematical games', 'Puzzles', 'Learning cards'],
              assessmentMethod: 'Observation during games'
            },
            {
              weekNumber: 12,
              topicName: 'Year End Assessment and Celebration',
              duration: 1,
              objectives: [
                'Assess year\'s mathematical progress',
                'Identify strengths and areas for development',
                'Celebrate mathematical achievements'
              ],
              resources: ['Assessment tools', 'Achievement certificates', 'Prizes'],
              assessmentMethod: 'Annual assessment and evaluation'
            }
          ]
        }
      }
    ]
  }
}

// ============================================
// SECONDARY SCHOOL CURRICULUM (2025 NERDC)
// ============================================
const SECONDARY_CURRICULUM: CurriculumSeedData = {
  JSS1: {
    levelName: 'JSS 1',
    yearsOfStudy: 1,
    classes: ['JSS 1'],
    subjects: [
      {
        name: 'English Language',
        code: 'ENG-JSS1-001',
        level: 'Secondary',
        creditUnits: 5,
        subjectCategory: 'CORE',
        description: 'English Language for JSS 1',
        curriculumType: 'NIGERIAN',
        termTopics: {
          term1: [
            {
              weekNumber: 1,
              topicName: 'Parts of Speech: Nouns and Pronouns',
              duration: 2,
              objectives: [
                'Identify different types of nouns',
                'Use pronouns correctly',
                'Understand pronoun-antecedent agreement'
              ],
              resources: ['Grammar textbooks', 'Worksheets', 'Sentence examples'],
              assessmentMethod: 'Written exercises and tests'
            },
            {
              weekNumber: 3,
              topicName: 'Verbs and Tenses',
              duration: 2,
              objectives: [
                'Identify different verb types',
                'Use verb tenses correctly',
                'Understand past, present, and future'
              ],
              resources: ['Tense charts', 'Grammar books', 'Practice sentences'],
              assessmentMethod: 'Tense usage tests'
            },
            {
              weekNumber: 5,
              topicName: 'Adjectives and Adverbs',
              duration: 2,
              objectives: [
                'Use adjectives to describe nouns',
                'Understand adverb functions',
                'Apply modifiers correctly in writing'
              ],
              resources: ['Descriptive materials', 'Worksheets', 'Literature'],
              assessmentMethod: 'Written descriptions and exercises'
            },
            {
              weekNumber: 7,
              topicName: 'Sentences and Punctuation',
              duration: 2,
              objectives: [
                'Identify sentence types',
                'Apply punctuation rules',
                'Write grammatically correct sentences'
              ],
              resources: ['Punctuation guides', 'Sample texts', 'Workbooks'],
              assessmentMethod: 'Sentence construction tests'
            },
            {
              weekNumber: 9,
              topicName: 'Comprehension and Analysis',
              duration: 2,
              objectives: [
                'Read and analyze texts',
                'Answer comprehension questions',
                'Identify main ideas and supporting details'
              ],
              resources: ['Comprehension passages', 'Question sets', 'Analysis guides'],
              assessmentMethod: 'Comprehension tests'
            },
            {
              weekNumber: 11,
              topicName: 'Vocabulary Development',
              duration: 1,
              objectives: [
                'Expand vocabulary across contexts',
                'Understand word meanings and usage',
                'Use context clues for word meanings'
              ],
              resources: ['Vocabulary lists', 'Dictionaries', 'Word cards'],
              assessmentMethod: 'Vocabulary tests'
            }
          ],
          term2: [
            {
              weekNumber: 1,
              topicName: 'Literature: Prose and Fiction',
              duration: 2,
              objectives: [
                'Understand elements of prose',
                'Analyze character development',
                'Identify plot and theme'
              ],
              resources: ['Short stories', 'Novels', 'Analysis guides'],
              assessmentMethod: 'Literature discussions and essays'
            },
            {
              weekNumber: 3,
              topicName: 'Literature: Poetry',
              duration: 2,
              objectives: [
                'Understand poetic devices',
                'Analyze poems',
                'Appreciate poetry forms'
              ],
              resources: ['Poetry collections', 'Poetic devices charts', 'Analyses'],
              assessmentMethod: 'Poetry analysis and interpretation'
            },
            {
              weekNumber: 5,
              topicName: 'Oral Communication and Listening',
              duration: 2,
              objectives: [
                'Develop listening skills',
                'Present information clearly',
                'Participate in discussions'
              ],
              resources: ['Audio materials', 'Discussion topics', 'Speech prompts'],
              assessmentMethod: 'Oral presentations and discussions'
            },
            {
              weekNumber: 7,
              topicName: 'Writing: Narrative and Descriptive',
              duration: 2,
              objectives: [
                'Write effective narratives',
                'Create vivid descriptions',
                'Develop characters and settings'
              ],
              resources: ['Writing prompts', 'Narrative structures', 'Examples'],
              assessmentMethod: 'Written compositions'
            },
            {
              weekNumber: 9,
              topicName: 'Writing: Exposition and Persuasion',
              duration: 2,
              objectives: [
                'Write explanatory texts',
                'Develop persuasive arguments',
                'Use evidence effectively'
              ],
              resources: ['Argumentative texts', 'Evidence sources', 'Templates'],
              assessmentMethod: 'Persuasive and expository essays'
            },
            {
              weekNumber: 11,
              topicName: 'Language Use: Prefixes and Suffixes',
              duration: 1,
              objectives: [
                'Understand word formation',
                'Use prefixes and suffixes',
                'Expand vocabulary through morphology'
              ],
              resources: ['Word formation charts', 'Worksheets', 'Reference lists'],
              assessmentMethod: 'Word building exercises'
            }
          ],
          term3: [
            {
              weekNumber: 1,
              topicName: 'Reading: Critical Thinking',
              duration: 2,
              objectives: [
                'Analyze author\'s purpose',
                'Identify bias and perspective',
                'Think critically about texts'
              ],
              resources: ['Opinion texts', 'Analysis guides', 'Critical questions'],
              assessmentMethod: 'Critical analysis essays'
            },
            {
              weekNumber: 3,
              topicName: 'Drama and Plays',
              duration: 2,
              objectives: [
                'Understand dramatic structure',
                'Analyze dialogue',
                'Appreciate theatrical elements'
              ],
              resources: ['Play scripts', 'Stage directions', 'Drama guides'],
              assessmentMethod: 'Script analysis and performances'
            },
            {
              weekNumber: 5,
              topicName: 'Research and Information Literacy',
              duration: 2,
              objectives: [
                'Conduct effective research',
                'Evaluate information sources',
                'Cite sources properly'
              ],
              resources: ['Research guides', 'Citation styles', 'Information sources'],
              assessmentMethod: 'Research projects'
            },
            {
              weekNumber: 7,
              topicName: 'Communication: Formal and Informal',
              duration: 2,
              objectives: [
                'Distinguish register and tone',
                'Write formal correspondence',
                'Adapt communication for audiences'
              ],
              resources: ['Letter templates', 'Email examples', 'Communication guides'],
              assessmentMethod: 'Written correspondence'
            },
            {
              weekNumber: 9,
              topicName: 'Media Literacy',
              duration: 2,
              objectives: [
                'Analyze media messages',
                'Understand advertising techniques',
                'Evaluate digital information'
              ],
              resources: ['Media samples', 'Advertisement analysis', 'Digital guides'],
              assessmentMethod: 'Media analysis projects'
            },
            {
              weekNumber: 11,
              topicName: 'Year Review and Consolidation',
              duration: 1,
              objectives: [
                'Review year\'s language skills',
                'Consolidate learning',
                'Prepare for advancement'
              ],
              resources: ['Review materials', 'Practice assessments', 'Summaries'],
              assessmentMethod: 'Comprehensive assessment'
            }
          ]
        }
      },
      {
        name: 'Mathematics',
        code: 'MATH-JSS1-001',
        level: 'Secondary',
        creditUnits: 5,
        subjectCategory: 'CORE',
        description: 'Mathematics for JSS 1',
        curriculumType: 'NIGERIAN',
        termTopics: {
          term1: [
            {
              weekNumber: 1,
              topicName: 'Number Systems: Natural and Whole Numbers',
              duration: 1,
              objectives: [
                'Understand natural and whole numbers',
                'Identify number properties',
                'Perform operations with whole numbers'
              ],
              resources: ['Number theory texts', 'Practice worksheets', 'Number lines'],
              assessmentMethod: 'Written tests and exercises'
            },
            {
              weekNumber: 2,
              topicName: 'Integers and Operations',
              duration: 2,
              objectives: [
                'Understand positive and negative integers',
                'Add, subtract, multiply, divide integers',
                'Solve integer problems'
              ],
              resources: ['Number lines', 'Operation charts', 'Problem sets'],
              assessmentMethod: 'Computational assessments'
            },
            {
              weekNumber: 4,
              topicName: 'Fractions and Decimals',
              duration: 2,
              objectives: [
                'Convert between fractions and decimals',
                'Perform fraction operations',
                'Apply fractions in problems'
              ],
              resources: ['Fraction circles', 'Decimal charts', 'Worksheets'],
              assessmentMethod: 'Fraction and decimal tests'
            },
            {
              weekNumber: 6,
              topicName: 'Percentages and Ratios',
              duration: 2,
              objectives: [
                'Calculate percentages',
                'Understand ratios and proportions',
                'Apply percentages to real situations'
              ],
              resources: ['Percentage tables', 'Ratio cards', 'Real-world problems'],
              assessmentMethod: 'Percentage calculations'
            },
            {
              weekNumber: 8,
              topicName: 'Basic Algebra: Expressions and Equations',
              duration: 2,
              objectives: [
                'Write algebraic expressions',
                'Simplify expressions',
                'Solve simple equations'
              ],
              resources: ['Algebra textbooks', 'Equation sheets', 'Variable cards'],
              assessmentMethod: 'Algebraic problem solving'
            },
            {
              weekNumber: 10,
              topicName: 'Geometry: Angles and Lines',
              duration: 2,
              objectives: [
                'Identify angle types',
                'Understand angle relationships',
                'Work with parallel and perpendicular lines'
              ],
              resources: ['Protractors', 'Angle cards', 'Geometry software'],
              assessmentMethod: 'Angle measurement and identification'
            }
          ],
          term2: [
            {
              weekNumber: 1,
              topicName: 'Geometry: Triangles and Quadrilaterals',
              duration: 2,
              objectives: [
                'Classify triangles and quadrilaterals',
                'Calculate perimeters and areas',
                'Understand shape properties'
              ],
              resources: ['Shape models', 'Formula sheets', 'Grid paper'],
              assessmentMethod: 'Shape classification and calculations'
            },
            {
              weekNumber: 3,
              topicName: 'Circles and Circumference',
              duration: 2,
              objectives: [
                'Understand circle properties',
                'Calculate circumference and area',
                'Apply circle concepts'
              ],
              resources: ['Compass', 'Circle templates', 'Formula cards'],
              assessmentMethod: 'Circle calculations'
            },
            {
              weekNumber: 5,
              topicName: '3D Geometry: Solids and Volumes',
              duration: 2,
              objectives: [
                'Identify 3D shapes',
                'Calculate surface area and volume',
                'Visualize spatial relationships'
              ],
              resources: ['3D models', 'Formula sheets', 'Volume containers'],
              assessmentMethod: 'Volume and area calculations'
            },
            {
              weekNumber: 7,
              topicName: 'Statistics and Data Handling',
              duration: 2,
              objectives: [
                'Collect and organize data',
                'Create and interpret graphs',
                'Calculate measures of central tendency'
              ],
              resources: ['Graph paper', 'Data sets', 'Graphing software'],
              assessmentMethod: 'Data analysis projects'
            },
            {
              weekNumber: 9,
              topicName: 'Probability Basics',
              duration: 2,
              objectives: [
                'Understand probability concepts',
                'Calculate probability',
                'Conduct probability experiments'
              ],
              resources: ['Dice', 'Cards', 'Probability tables'],
              assessmentMethod: 'Probability calculations'
            },
            {
              weekNumber: 11,
              topicName: 'Sets and Logic',
              duration: 1,
              objectives: [
                'Understand set notation',
                'Work with set operations',
                'Apply logical thinking'
              ],
              resources: ['Venn diagrams', 'Set notation charts', 'Logic puzzles'],
              assessmentMethod: 'Set theory exercises'
            }
          ],
          term3: [
            {
              weekNumber: 1,
              topicName: 'Number Theory: Factors and Multiples',
              duration: 2,
              objectives: [
                'Find factors and multiples',
                'Understand prime and composite numbers',
                'Use LCM and GCF'
              ],
              resources: ['Factor trees', 'Prime number charts', 'Worksheets'],
              assessmentMethod: 'Factor and multiple problems'
            },
            {
              weekNumber: 3,
              topicName: 'Powers and Exponents',
              duration: 2,
              objectives: [
                'Understand powers and roots',
                'Calculate with exponents',
                'Apply laws of exponents'
              ],
              resources: ['Exponent charts', 'Calculator activities', 'Worksheets'],
              assessmentMethod: 'Exponent calculations'
            },
            {
              weekNumber: 5,
              topicName: 'Linear Equations and Graphing',
              duration: 2,
              objectives: [
                'Solve linear equations',
                'Graph linear functions',
                'Understand slope and intercepts'
              ],
              resources: ['Coordinate grids', 'Graphing calculators', 'Equation cards'],
              assessmentMethod: 'Graphing and equation solving'
            },
            {
              weekNumber: 7,
              topicName: 'Systems of Equations',
              duration: 2,
              objectives: [
                'Solve systems of equations',
                'Use substitution and elimination methods',
                'Apply to real-world problems'
              ],
              resources: ['System worksheets', 'Solution methods guides', 'Applications'],
              assessmentMethod: 'System solving assessments'
            },
            {
              weekNumber: 9,
              topicName: 'Mathematical Reasoning and Proofs',
              duration: 2,
              objectives: [
                'Develop logical reasoning',
                'Understand mathematical proofs',
                'Apply deductive thinking'
              ],
              resources: ['Proof examples', 'Logic guides', 'Challenge problems'],
              assessmentMethod: 'Proof writing exercises'
            },
            {
              weekNumber: 11,
              topicName: 'Review and Consolidation',
              duration: 1,
              objectives: [
                'Consolidate year\'s mathematics',
                'Practice problem-solving',
                'Prepare for advancement'
              ],
              resources: ['Review worksheets', 'Practice tests', 'Summaries'],
              assessmentMethod: 'Comprehensive review test'
            }
          ]
        }
      }
    ]
  }
}

/**
 * Seed the database with curriculum and subject data
 */
async function seedCurriculum() {
  try {
    // Connect to MongoDB
    await mongoose.connect(envConfig.DATABASE_URL!)
    console.log('📚 Connected to database. Starting curriculum seeding...')

    // Clear existing data (optional - comment out to preserve data)
    // await Curriculum.deleteMany({})
    // await Subject.deleteMany({})

    // Seed Primary Curriculum
    console.log('\n📖 Seeding Primary Curriculum...')
    for (const [key, levelData] of Object.entries(PRIMARY_CURRICULUM)) {
      const curriculumDoc = await Curriculum.create({
        name: `NERDC Curriculum - ${levelData.levelName} (2025)`,
        version: '2025',
        level: 'Primary',
        yearsOfStudy: levelData.yearsOfStudy,
        implementationDate: new Date('2025-01-01'),
        description: `Comprehensive NERDC curriculum for ${levelData.levelName}`,
        curriculum: 'NIGERIAN',
        status: 'ACTIVE',
        createdBy: ADMIN_ID,
      })

      for (const subject of levelData.subjects) {
        const topics = []

        // Flatten topics from all terms
        for (const term of ['term1', 'term2', 'term3']) {
          if (subject.termTopics[term]) {
            topics.push(...subject.termTopics[term])
          }
        }

        const subjectDoc = await Subject.create({
          name: subject.name,
          code: subject.code,
          level: subject.level,
          creditUnits: subject.creditUnits,
          subjectCategory: subject.subjectCategory,
          description: subject.description,
          curriculumType: subject.curriculumType,
          topics: topics,
        })

        // Link subject to curriculum
        curriculumDoc.subjects.push(subjectDoc._id)
      }

      await curriculumDoc.save()
      console.log(`✅ Created curriculum for ${levelData.levelName}`)
    }

    // Seed Secondary Curriculum
    console.log('\n📖 Seeding Secondary Curriculum...')
    for (const [key, levelData] of Object.entries(SECONDARY_CURRICULUM)) {
      const curriculumDoc = await Curriculum.create({
        name: `NERDC Curriculum - ${levelData.levelName} (2025)`,
        version: '2025',
        level: 'Secondary',
        yearsOfStudy: levelData.yearsOfStudy,
        implementationDate: new Date('2025-01-01'),
        description: `Comprehensive NERDC curriculum for ${levelData.levelName}`,
        curriculum: 'NIGERIAN',
        status: 'ACTIVE',
        createdBy: ADMIN_ID,
      })

      for (const subject of levelData.subjects) {
        const topics = []

        // Flatten topics from all terms
        for (const term of ['term1', 'term2', 'term3']) {
          if (subject.termTopics[term]) {
            topics.push(...subject.termTopics[term])
          }
        }

        const subjectDoc = await Subject.create({
          name: subject.name,
          code: subject.code,
          level: subject.level,
          creditUnits: subject.creditUnits,
          subjectCategory: subject.subjectCategory,
          description: subject.description,
          curriculumType: subject.curriculumType,
          topics: topics,
        })

        // Link subject to curriculum
        curriculumDoc.subjects.push(subjectDoc._id)
      }

      await curriculumDoc.save()
      console.log(`✅ Created curriculum for ${levelData.levelName}`)
    }

    console.log('\n✅ Curriculum seeding completed successfully!')
    console.log('\n📊 Summary:')
    const curriculumCount = await Curriculum.countDocuments()
    const subjectCount = await Subject.countDocuments()
    console.log(`   - Curricula created: ${curriculumCount}`)
    console.log(`   - Subjects created: ${subjectCount}`)

    await mongoose.connection.close()
  } catch (error) {
    console.error('❌ Error seeding curriculum:', error)
    process.exit(1)
  }
}

// Run the seed function
seedCurriculum()
