import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

async function setupTeacher() {
  const client = new MongoClient("mongodb://localhost:27017");
  try {
    await client.connect();
    const db = client.db("folusho");
    const teachers = db.collection("teachers");
    
    // Check if teacher exists
    let teacher = await teachers.findOne({ email: "teacher1@folusho.com" });
    
    if (!teacher) {
      globalThis.console.log("Teacher not found, creating...");
      const hashedPassword = await bcrypt.hash("TeacherPassword123!@#", 10);
      const result = await teachers.insertOne({
        email: "teacher1@folusho.com",
        name: "Teacher One",
        password: hashedPassword,
        role: "Teacher",
        subject: "Mathematics",
        level: "Secondary",
        assignedClasses: ["SSS1A", "SSS1B"],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      globalThis.console.log("✅ Teacher created:", result.insertedId);
    } else {
      globalThis.console.log("Teacher exists, updating password...");
      const hashedPassword = await bcrypt.hash("TeacherPassword123!@#", 10);
      await teachers.updateOne(
        { email: "teacher1@folusho.com" },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      globalThis.console.log("✅ Password updated for teacher1@folusho.com");
    }
    
    // Verify the password was set correctly by testing login
    const updated = await teachers.findOne({ email: "teacher1@folusho.com" });
    const passwordMatch = await bcrypt.compare("TeacherPassword123!@#", updated.password);
    globalThis.console.log("Password verification:", passwordMatch ? "✅ MATCHES" : "❌ DOES NOT MATCH");
    
  } finally {
    await client.close();
  }
}

setupTeacher().catch(globalThis.console.error);
