import bcrypt from "bcryptjs";
import { dbRun, dbAll } from "./src/config/db.js";

async function resetPasswords() {
  try {
    console.log("Generating fresh password hash for 'password123'...");
    const freshHash = await bcrypt.hash("password123", 10);
    
    console.log("Updating all users in SQLite database...");
    const result = await dbRun("UPDATE Users SET password_hash = ?", [freshHash]);
    
    console.log("=========================================");
    console.log(`SUCCESS: All user passwords reset to: password123`);
    console.log(`Total accounts updated: ${result.changes}`);
    console.log("=========================================");
    
    // Print current users list for verification
    const users = await dbAll("SELECT email, role, profile_id FROM Users");
    console.log("\nActive accounts ready for login:");
    for (const u of users) {
      console.log(` - Role: ${u.role.padEnd(10)} | ID: ${String(u.profile_id).padEnd(10)} | Email: ${u.email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Failed to reset passwords:", error);
    process.exit(1);
  }
}

resetPasswords();
