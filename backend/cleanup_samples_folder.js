import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const samplesDir = "C:/BlockChainDIDProject/samples";
const ipfsMockDir = "C:/BlockChainDIDProject/backend/db/ipfs_mock";

async function cleanup() {
  try {
    console.log("Cleaning up samples and ipfs_mock folders...");

    // 1. Clean the samples directory
    if (fs.existsSync(samplesDir)) {
      const files = fs.readdirSync(samplesDir);
      for (const file of files) {
        const filePath = path.join(samplesDir, file);
        fs.unlinkSync(filePath);
        console.log(`- Deleted sample file: ${file}`);
      }
    } else {
      fs.mkdirSync(samplesDir, { recursive: true });
    }

    // 2. Create the two credentials files in samples/
    const studentData = {
      role: "Student",
      name: "Ramsha Siddiqui",
      roll_number: "CSE26005",
      email: "ramshars280@gmail.com",
      password: "password123"
    };

    const adminData = {
      role: "University Registrar / Admin",
      institution: "Mahatma Gandhi Mission University (MGMU)",
      email: "admin@soet.mgmu.ac.in",
      password: "password123"
    };

    fs.writeFileSync(
      path.join(samplesDir, "student_account.json"),
      JSON.stringify(studentData, null, 2),
      "utf8"
    );
    console.log("✔ Created student_account.json");

    fs.writeFileSync(
      path.join(samplesDir, "admin_account.json"),
      JSON.stringify(adminData, null, 2),
      "utf8"
    );
    console.log("✔ Created admin_account.json");

    // 3. Clear all files inside the ipfs_mock ("im") folder
    if (fs.existsSync(ipfsMockDir)) {
      const ipfsFiles = fs.readdirSync(ipfsMockDir);
      let deletedMockCount = 0;
      for (const file of ipfsFiles) {
        const filePath = path.join(ipfsMockDir, file);
        fs.unlinkSync(filePath);
        deletedMockCount++;
      }
      console.log(`✔ Cleared all ${deletedMockCount} sample metadata files from ipfs_mock ("im") folder.`);
    }

    console.log("\n=========================================");
    console.log("SUCCESS: Sample folders cleaned up completely!");
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

cleanup();
