import { dbRun, dbAll } from "./src/config/db.js";

async function purgeTestData() {
  try {
    console.log("Starting SQLite database purge...");
    
    // 1. Delete all students except CSE26005 (Ramsha Siddiqui)
    const purgeStudents = await dbRun("DELETE FROM Student WHERE student_id != 'CSE26005'");
    console.log(`- Deleted ${purgeStudents.changes} testing student profiles from Student table.`);
    
    // 2. Delete all user profiles except CSE26005 and univ_admin
    const purgeUsers = await dbRun("DELETE FROM Users WHERE profile_id != 'CSE26005' AND profile_id != 'univ_admin'");
    console.log(`- Deleted ${purgeUsers.changes} login credentials from Users table.`);
    
    // 3. Delete all course enrollments of other students
    const purgeEnrollments = await dbRun("DELETE FROM CourseEnrollments WHERE student_id != 'CSE26005'");
    console.log(`- Cleared ${purgeEnrollments.changes} inactive course enrollment logs.`);
    
    // 4. Delete all certificates of other students
    const purgeCertificates = await dbRun("DELETE FROM Certificate WHERE student_id != 'CSE26005'");
    console.log(`- Cleared ${purgeCertificates.changes} inactive certificate registries.`);
    
    console.log("\n=========================================");
    console.log("SUCCESS: Database successfully purged of all test accounts!");
    console.log("=========================================");
    
    // Print remaining active database profiles
    const users = await dbAll("SELECT email, role, profile_id FROM Users");
    console.log("\nRemaining active profiles in database:");
    for (const u of users) {
      console.log(` - Role: ${u.role.padEnd(12)} | ID: ${String(u.profile_id).padEnd(10)} | Email: ${u.email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Purge operation failed:", error);
    process.exit(1);
  }
}

purgeTestData();
