// Using native fetch in Node v18+
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const API_BASE = "http://localhost:5000";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function resetTestDbState() {
  let dbPath = path.resolve("backend/db/database.sqlite");
  if (!fs.existsSync(dbPath)) {
    dbPath = path.resolve("db/database.sqlite");
  }
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("DELETE FROM CourseEnrollments WHERE student_id = 'CSE26005' AND course_id = 'c1'", (err) => {
        if (err) console.warn("DB reset warning (enrollments):", err.message);
      });
      db.run("DELETE FROM Certificate WHERE student_id = 'CSE26005' AND degree_name = 'Introduction to Smart Contracts (Solidity)'", (err) => {
        if (err) console.warn("DB reset warning (certificates):", err.message);
      });
      db.run("DELETE FROM BlockchainRecord WHERE cert_id NOT IN (SELECT cert_id FROM Certificate)", (err) => {
        if (err) console.warn("DB reset warning (blockchain records):", err.message);
        resolve();
      });
    });
  });
}

async function runTests() {
  console.log("=============================================================");
  console.log("STARTING COURSE COMPLETION GATE INTEGRATION TESTS");
  console.log("=============================================================\n");

  console.log("[Setup] Resetting database test records...");
  await resetTestDbState();
  console.log("Database test state cleaned.");

  let studentToken = "";
  let adminToken = "";
  const studentId = "CSE26005"; // Hardcoded test student ID from seeded db/tests
  const courseId = "c1"; // Introduction to Smart Contracts (Solidity)

  // Step 1: Fetch Courses catalog
  console.log("[Step 1] Fetching courses catalog...");
  try {
    const res = await fetch(`${API_BASE}/api/courses`);
    const data = await res.json();
    console.log(`Successfully fetched courses: ${data.length} found.`);
    data.forEach(c => {
      console.log(` - [${c.id}] ${c.title} offered by ${c.academy}`);
    });
  } catch (err) {
    console.error("Failed to fetch courses:", err.message);
    process.exit(1);
  }

  // Step 2: Login as Student
  console.log("\n[Step 2] Authenticating as Student...");
  
  async function loginUser(username, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data.token;
  }

  try {
    studentToken = await loginUser("CSE26005", "password123");
    console.log("Student login successful.");
  } catch (err) {
    console.error("Student login failed:", err.message);
    process.exit(1);
  }

  // Step 3: Enroll in course
  console.log("\n[Step 3] Enrolling in Solidity course (c1)...");
  try {
    const res = await fetch(`${API_BASE}/api/courses/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ courseId })
    });
    const data = await res.json();
    console.log("Enrollment Response:", data.message || data.error);
    if (!res.ok) throw new Error("Enrollment request failed");
  } catch (err) {
    console.error("Enrollment failed:", err.message);
    process.exit(1);
  }

  // Step 4: Submit quiz with failing answers (e.g. all option index 1)
  console.log("\n[Step 4] Submitting quiz with incorrect answers...");
  try {
    const res = await fetch(`${API_BASE}/api/courses/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        courseId,
        answers: [1, 1, 1, 1, 1] // Failing options
      })
    });
    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log("Response:", JSON.stringify(data));
    if (res.status === 400 && data.error.includes("Quiz failed")) {
      console.log("✅ Successfully blocked progress on quiz failure!");
    } else {
      throw new Error("Failed to block submission on quiz failure.");
    }
  } catch (err) {
    console.error("Incorrect quiz validation test failed:", err.message);
    process.exit(1);
  }

  // Step 5: Submit quiz with passing answers [0, 1, 0, 0, 0] (score 100%)
  console.log("\n[Step 5] Submitting quiz with correct answers...");
  try {
    const res = await fetch(`${API_BASE}/api/courses/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        courseId,
        answers: [0, 1, 0, 0, 0] // 100% correct
      })
    });
    const data = await res.json();
    console.log("Response:", JSON.stringify(data));
    if (res.ok && data.status === "pending_review") {
      console.log("✅ Quiz passed! Enrollment status successfully updated to 'pending_review'.");
    } else {
      throw new Error("Failed to update status to pending_review on passing score.");
    }
  } catch (err) {
    console.error("Correct quiz validation test failed:", err.message);
    process.exit(1);
  }

  // Step 6: Verify certificate is NOT minted before approval
  console.log("\n[Step 6] Confirming certificate is NOT yet issued in certificates list...");
  try {
    const res = await fetch(`${API_BASE}/api/credentials/all`);
    const data = await res.json();
    const cert = data.find(c => c.student_id === studentId && c.degree_name === "Introduction to Smart Contracts (Solidity)");
    if (!cert) {
      console.log("✅ Confirmed: certificate is not minted yet before review approval.");
    } else {
      throw new Error("Security breach: certificate was minted prematurely!");
    }
  } catch (err) {
    console.error("Certificate pre-issuance check failed:", err.message);
    process.exit(1);
  }

  // Step 7: Authenticate as Admin/University to approve
  console.log("\n[Step 7] Authenticating as University admin...");
  try {
    adminToken = await loginUser("admin@soet.mgmu.ac.in", "password123");
    console.log("University login successful.");
  } catch (err) {
    console.error("University login failed:", err.message);
    process.exit(1);
  }

  // Step 8: Approve the certificate request
  console.log("\n[Step 8] Approving pending certificate request...");
  try {
    const res = await fetch(`${API_BASE}/api/courses/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ studentId, courseId })
    });
    const data = await res.json();
    console.log("Approval Response:", JSON.stringify(data));
    if (res.ok && data.certId) {
      console.log(`✅ Certificate approved and anchored successfully! Cert ID: ${data.certId}`);
    } else {
      throw new Error("Failed to approve certificate request");
    }
  } catch (err) {
    console.error("Certificate approval failed:", err.message);
    process.exit(1);
  }

  // Step 9: Confirm certificate is minted and matches correct labeling
  console.log("\n[Step 9] Validating minted certificate details in registry...");
  try {
    const res = await fetch(`${API_BASE}/api/credentials/all`);
    const data = await res.json();
    const cert = data.find(c => c.student_id === studentId && c.degree_name === "Introduction to Smart Contracts (Solidity)");
    if (cert) {
      console.log("✅ Certificate found in registry!");
      console.log(` - ID: ${cert.cert_id}`);
      console.log(` - Grade: ${cert.grade_cgpa}`);
      console.log(` - Status: ${cert.status}`);
      console.log(` - University ID: ${cert.univ_id}`);
    } else {
      throw new Error("Certificate was not found in registry after approval.");
    }
  } catch (err) {
    console.error("Post-approval validation failed:", err.message);
    process.exit(1);
  }

  console.log("\n=============================================================");
  console.log("INTEGRATION TESTS PASSED SUCCESSFULLY!");
  console.log("=============================================================");
}

runTests();
