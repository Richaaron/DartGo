
import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Force local connection for migration as remote Atlas is inaccessible from this environment
const MONGO_URI = 'mongodb://127.0.0.1:27017/folusho';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Map to store MongoID -> SupabaseID
const idMap: Record<string, string> = {};

async function getTableColumns(tableName: string): Promise<string[]> {
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    // If table doesn't exist, return empty array
    if (error.message.includes('cache')) return [];
    console.warn(`Warning: Could not fetch columns for ${tableName}:`, error.message);
    return [];
  }
  return data && data.length > 0 ? Object.keys(data[0]) : [];
}

function filterObjectByColumns(obj: any, columns: string[], mapping: Record<string, string> = {}): any {
  const result: any = {};
  
  // Standard mappings (Mongo field -> Supabase field)
  const defaultMapping: Record<string, string> = {
    'creditUnits': 'credit_units',
    'subjectCategory': 'subject_category',
    'curriculumType': 'curriculum_type',
    'curriculum': 'curriculum_type',
    'yearsOfStudy': 'years_of_study',
    'implementationDate': 'implementation_date',
    'createdBy': 'created_by',
    'teacherId': 'teacher_id',
    'subjectId': 'subject_id',
    'classId': 'class_id',
    'academicYear': 'academic_year',
    'curriculumId': 'curriculum_id',
    'uploadedBy': 'uploaded_by',
    'approvedBy': 'approved_by',
    'approvalDate': 'approval_date',
    'studentId': 'student_id',
    'firstName': 'first_name',
    'lastName': 'last_name',
    'dateOfBirth': 'date_of_birth',
    'parentName': 'parent_name',
    'parentEmail': 'parent_email',
    'parentPhone': 'parent_phone',
    'parentUsername': 'parent_username',
    'parentPassword': 'parent_password',
    'assignedClasses': 'assigned_classes',
    'ca1Score': 'ca1_score',
    'ca2Score': 'ca2_score',
    'examScore': 'exam_score',
    'totalScore': 'total_score',
    'recordedBy': 'recorded_by',
    'userId': 'user_id',
    'entityType': 'entity_type',
    'entityId': 'entity_id',
    'recipientId': 'recipient_id',
    'senderId': 'sender_id',
    'isRead': 'is_read',
    'currentTerm': 'current_term',
    'currentAcademicYear': 'current_academic_year',
    'availableClasses': 'available_classes',
    'relationshipWithOthers': 'relationship_with_others',
    'emotionalStability': 'emotional_stability',
    'selfControl': 'self_control',
    'socialHabits': 'social_habits',
    'manualSkills': 'manual_skills',
    'timestamp': 'created_at',
    ...mapping
  };

  for (const key in obj) {
    const targetKey = defaultMapping[key] || key;
    if (columns.includes(targetKey)) {
      result[targetKey] = obj[key];
    }
  }
  return result;
}

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const collections = [
      { mongo: 'users', supabase: 'users', conflict: 'email' },
      { mongo: 'subjects', supabase: 'subjects', conflict: 'code' },
      { mongo: 'curriculums', supabase: 'curriculums' },
      { mongo: 'teachers', supabase: 'teachers', conflict: 'teacher_id' },
      { mongo: 'students', supabase: 'students', conflict: 'student_id' },
      { mongo: 'schemeofworks', supabase: 'schemes_of_work' },
      { mongo: 'subjectresults', supabase: 'subject_results' },
      { mongo: 'attendances', supabase: 'attendance' },
      { mongo: 'observations', supabase: 'observations' },
      { mongo: 'schoolconfigs', supabase: 'school_config' },
      { mongo: 'activities', supabase: 'activities' },
      { mongo: 'notifications', supabase: 'notifications' },
      { mongo: 'messages', supabase: 'messages' },
    ];

    for (const col of collections) {
      console.log(`\nMigrating ${col.mongo} -> ${col.supabase}...`);
      
      const columns = await getTableColumns(col.supabase);
      if (columns.length === 0) {
        // Try to get columns by inserting a dummy record if table exists but is empty
        // or just skip if table is totally missing from cache
        const { error: checkError } = await supabase.from(col.supabase).select('count', { count: 'exact', head: true });
        if (checkError && checkError.message.includes('cache')) {
          console.warn(`⚠️ Skipping ${col.supabase}: Table not found in Supabase schema cache.`);
          continue;
        }
        // If empty, we'll try to use the keys from the first mongo document as a hint
      }

      const mongoData = await mongoose.connection.db.collection(col.mongo).find({}).toArray();
      if (mongoData.length === 0) {
        console.log(`ℹ️ No data in ${col.mongo}.`);
        continue;
      }

      // If we couldn't get columns from Supabase (empty table), we'll try to infer from first doc
      // and common knowledge, but this is risky. Better to have them.
      let targetColumns = columns;
      if (targetColumns.length === 0) {
         // Fallback: assume all common columns might exist
         targetColumns = ['id', 'name', 'email', 'password', 'role', 'created_at', 'updated_at', 'code', 'level', 'description', 'status'];
      }

      let count = 0;
      for (const doc of mongoData) {
        const { _id, __v, createdAt, updatedAt, ...rest } = doc;
        
        // ID Mapping for foreign keys
        if (col.mongo === 'curriculums' && rest.subjects) {
          rest.subjects = rest.subjects.map((sid: any) => idMap[sid.toString()] || sid.toString());
        }
        if (col.supabase === 'schemes_of_work') {
          rest.subjectId = idMap[rest.subjectId?.toString()] || rest.subjectId?.toString();
          rest.curriculumId = idMap[rest.curriculumId?.toString()] || rest.curriculumId?.toString();
        }
        if (col.supabase === 'subject_results' || col.supabase === 'activities') {
          if (rest.subjectId) rest.subjectId = idMap[rest.subjectId?.toString()] || rest.subjectId?.toString();
          if (rest.userId) rest.userId = idMap[rest.userId?.toString()] || rest.userId?.toString();
        }

        const filtered = filterObjectByColumns(rest, targetColumns);
        
        const upsertOptions: any = {};
        if (col.conflict) upsertOptions.onConflict = col.conflict;

        const { data, error } = await supabase
          .from(col.supabase)
          .upsert(filtered, upsertOptions)
          .select()
          .single();

        if (error) {
          if (!error.message.includes('single row')) {
            console.error(`❌ Error in ${col.supabase}:`, error.message);
          }
        } else if (data) {
          idMap[_id.toString()] = data.id;
          count++;
        }
      }
      console.log(`✅ Migrated ${count}/${mongoData.length} records to ${col.supabase}.`);
    }

    console.log('\n✅ Migration completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
