import('mongoose').then(async (m) => {
  const conn = await m.default.connect('mongodb://localhost:27017/folusho');
  const db = conn.connection.db;
  const teachers = db.collection('teachers');
  
  const teacher = await teachers.findOne({email: 'teacher1@folusho.com'});
  if (teacher) {
    globalThis.console.log('✅ Teacher found in database:');
    globalThis.console.log('  Email:', teacher.email);
    globalThis.console.log('  Name:', teacher.name);
    globalThis.console.log('  Role:', teacher.role);
    globalThis.console.log('  Subject:', teacher.subject);
    globalThis.console.log('  Level:', teacher.level);
    globalThis.console.log('  Assigned Classes:', teacher.assignedClasses);
    globalThis.console.log('  ID:', teacher._id);
  } else {
    globalThis.console.log('❌ Teacher not found');
  }
  globalThis.process.exit(0);
}).catch(e => { 
  globalThis.console.error('Error:', e.message); 
  globalThis.process.exit(1); 
})
