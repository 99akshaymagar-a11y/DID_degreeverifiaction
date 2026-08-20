import readline from "readline";
import bcrypt from "bcryptjs";
import { dbRun, dbGet, dbAll } from "./src/config/db.js";
import { getContractInstance } from "./src/services/blockchainService.js";
import { signVC } from "./src/utils/vcHelper.js";

// ANSI Terminal Formatting Constants
const CLEAR = "\x1B[2J\x1B[H";
const RESET = "\x1B[0m";
const BOLD = "\x1B[1m";
const CYAN = "\x1B[36m";
const GREEN = "\x1B[32m";
const YELLOW = "\x1B[33m";
const RED = "\x1B[31m";
const BLUE = "\x1B[34m";
const MAGENTA = "\x1B[35m";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const waitKey = (promptText = `\n${YELLOW}Press [Enter] to continue...${RESET}`) => {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      resolve();
      return;
    }
    rl.question(promptText, () => {
      resolve();
    });
  });
};

function drawBox(title, lines, color = CYAN) {
  const width = 74;
  console.log(color + "╔" + "═".repeat(width - 2) + "╗" + RESET);
  
  // Center Title
  const titlePadding = Math.max(0, Math.floor((width - 4 - title.length) / 2));
  console.log(color + "║ " + " ".repeat(titlePadding) + BOLD + title + RESET + color + " ".repeat(width - 4 - title.length - titlePadding) + " ║" + RESET);
  console.log(color + "╠" + "═".repeat(width - 2) + "╣" + RESET);
  
  // Lines
  for (const line of lines) {
    const content = line.padEnd(width - 4).substring(0, width - 4);
    console.log(color + "║ " + RESET + content + color + " ║" + RESET);
  }
  console.log(color + "╚" + "═".repeat(width - 2) + "╝" + RESET);
}

async function runDemo() {
  console.log(CLEAR);
  
  drawBox("MGM UNIVERSITY — SCHOOL OF ENGINEERING & TECHNOLOGY", [
    "  BLOCKCHAIN-BASED DEGREE VERIFICATION SYSTEM",
    "  ===========================================",
    "  Interactive CLI Live Demonstration & Logic walkthrough",
    "  This runner simulates the entire E2E credential flow."
  ], MAGENTA);
  
  await waitKey();
  
  // SETUP
  console.log(CLEAR);
  drawBox("DEMO SETUP: DATABASE CLEANUP", [
    " Cleaning up database test records from SQLite...",
    " Seeding fresh user identities and online course models..."
  ], BLUE);
  
  const studentId = "CSE26005";
  const courseId = "c1";
  
  // Delete existing records to avoid conflicts
  await dbRun("DELETE FROM CourseEnrollments WHERE student_id = ?", [studentId]);
  await dbRun("DELETE FROM Certificate WHERE student_id = ?", [studentId]);
  
  // Ensure the student exists in the database
  const studentExists = await dbGet("SELECT * FROM Student WHERE student_id = ?", [studentId]);
  if (!studentExists) {
    await dbRun(`
      INSERT INTO Student (student_id, full_name, email, did, abc_id)
      VALUES (?, 'Ramsha Siddiqui', 'ramshars280@gmail.com', 'did:ethr:0x70997970C51812dc3A010C7d01b50e0d17dc79C8:cse26005', 'ABC-111-222-333')
    `, [studentId]);
  }
  
  console.log(`\n${GREEN}✔ SQLite database initialized and seeded for ${studentId}.${RESET}`);
  await waitKey();

  // STEP 1: DID DOCUMENT GENERATION
  console.log(CLEAR);
  drawBox("STEP 1: STUDENT DECENTRALIZED IDENTITY (DID)", [
    " W3C-compliant Decentralized Identifiers (DIDs) establish secure,",
    " self-sovereign cryptographic identities. The Student DID points to",
    " their public key document on the Ethereum Sepolia network."
  ], CYAN);
  
  const student = await dbGet("SELECT * FROM Student WHERE student_id = ?", [studentId]);
  console.log(`\n${BOLD}Resolved W3C Student DID Profile:${RESET}`);
  console.log(` - ${BOLD}Name:${RESET}      ${student.full_name}`);
  console.log(` - ${BOLD}ID:${RESET}        ${student.student_id}`);
  console.log(` - ${BOLD}ABC ID:${RESET}    ${student.abc_id}`);
  console.log(` - ${BOLD}DID Key:${RESET}   ${CYAN}${student.did}${RESET}`);
  
  await waitKey();

  // STEP 2: COURSE ENROLLMENT
  console.log(CLEAR);
  drawBox("STEP 2: ENROLLING IN ACADEMIC COURSES", [
    " Students can enroll in online learning courses. The course database",
    " resides on the backend to enforce evaluation gates before issuance."
  ], CYAN);
  
  const course = await dbGet("SELECT * FROM Courses WHERE id = ?", [courseId]);
  console.log(`\nEnrolling Student in: ${BOLD}${course.title}${RESET} offered by ${BOLD}${course.academy}${RESET}`);
  
  // Enroll
  await dbRun(`
    INSERT INTO CourseEnrollments (student_id, course_id, status, enrolled_at)
    VALUES (?, ?, 'enrolled', datetime('now'))
  `, [studentId, courseId]);
  
  console.log(`\n${GREEN}✔ Enrollment completed! Status set to 'enrolled' in database.${RESET}`);
  await waitKey();

  // STEP 3: QUIZ EVALUATION - FAIL ATTEMPT
  console.log(CLEAR);
  drawBox("STEP 3A: THE COMPLETION GATE — FAILED ATTEMPT", [
    " To protect the University's signature, a student cannot mint a",
    " certificate without passing the exam. Let's simulate a failed attempt",
    " where the student scores only 20% (1/5 correct)."
  ], RED);
  
  const failedScore = 20; // 1 out of 5
  console.log(`\nStudent submits quiz answers...`);
  console.log(`${RED}Grading result: Score is ${failedScore}% (Minimum required: 80%)${RESET}`);
  console.log(`Action: Certificate request is rejected. Course status remains 'enrolled'.`);
  
  await waitKey();

  // STEP 4: QUIZ EVALUATION - PASS ATTEMPT
  console.log(CLEAR);
  drawBox("STEP 3B: THE COMPLETION GATE — SUCCESSFUL ATTEMPT", [
    " Now, let's simulate the student studying and retaking the quiz,",
    " scoring 100% (5/5 correct). This meets the completion criteria."
  ], GREEN);
  
  const passScore = 100;
  console.log(`\nStudent re-submits quiz answers...`);
  console.log(`${GREEN}Grading result: Score is ${passScore}% (Passed! Minimum required: 80%)${RESET}`);
  
  // Update status to pending_review
  await dbRun(`
    UPDATE CourseEnrollments 
    SET status = 'pending_review', submitted_at = datetime('now')
    WHERE student_id = ? AND course_id = ?
  `, [studentId, courseId]);
  
  console.log(`\n${GREEN}✔ Status upgraded to 'pending_review'. Certificate request queued for Admin approval.${RESET}`);
  await waitKey();

  // STEP 5: ADMIN REVIEW & W3C VERIFIABLE CREDENTIAL SIGNING
  console.log(CLEAR);
  drawBox("STEP 4: UNIVERSITY SIGNATURE & VC CREATION", [
    " The University Admin reviews the pending requests, verifies the passing",
    " score, and cryptographically signs the W3C Verifiable Credential",
    " using the University's private key."
  ], CYAN);
  
  console.log(`\nAdmin approves course certificate request...`);
  console.log(`Generating signed W3C Verifiable Credential payload...`);
  
  // Generate Verifiable Credential payload
  const vcPayload = {
    id: `urn:uuid:${studentId.toLowerCase()}-${Date.now()}`,
    type: ["VerifiableCredential", "CourseCertificate"],
    issuer: "did:ethr:0xf39fd6e51aad88f6ab8827279cfffb92266:univ_admin",
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: student.did,
      studentName: student.full_name,
      rollNo: student.student_id,
      courseTitle: course.title,
      grade: "A+"
    }
  };
  
  const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const signedVc = await signVC(vcPayload, privateKey);
  
  console.log(`\n${BOLD}Signed W3C Verifiable Credential (VC) JSON:${RESET}`);
  console.log(CYAN + JSON.stringify(signedVc, null, 2) + RESET);
  
  await waitKey();

  // STEP 6: BLOCKCHAIN ANCHORING
  console.log(CLEAR);
  drawBox("STEP 5: ANCHORING CERTIFICATE ON ETHEREUM LEDGER", [
    " To prevent credential tampering, the SHA-256 hash of the signed",
    " credential payload is anchored on-chain by calling our deployed",
    " smart contract (DegreeVerifier.sol) on the Hardhat test network."
  ], CYAN);
  
  const certHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(signedVc)));
  console.log(`\nCredential Hash (SHA-256): ${CYAN}${certHash}${RESET}`);
  console.log(`Sending contract transaction...`);
  
  try {
    const contract = getContractInstance();
    const tx = await contract.issueDegree(certHash);
    console.log(`Mining transaction block...`);
    const receipt = await tx.wait();
    
    console.log(`\n${GREEN}✔ ON-CHAIN ANCHOR SUCCESSFUL!${RESET}`);
    console.log(` - ${BOLD}Contract Address:${RESET} ${receipt.to}`);
    console.log(` - ${BOLD}Transaction Hash:${RESET} ${GREEN}${receipt.hash}${RESET}`);
    console.log(` - ${BOLD}Block Number:${RESET}     ${receipt.blockNumber}`);
    
    // Save to local database
    await dbRun(`
      INSERT INTO Certificate (cert_id, degree_name, issue_date, status, cert_hash, ipfs_cid, student_id, univ_id)
      VALUES (?, ?, datetime('now'), 'Active', ?, 'ipfs_mock_cid_hash_solidity_c1', ?, 'univ_admin')
    `, [vcPayload.id, course.title, certHash, studentId]);
    
    await dbRun(`
      UPDATE CourseEnrollments 
      SET status = 'completed'
      WHERE student_id = ? AND course_id = ?
    `, [studentId, courseId]);
    
  } catch (error) {
    console.error(`${RED}Blockchain anchoring failed. Make sure your local hardhat node is running (npm run blockchain).${RESET}`);
    console.error(error);
  }
  
  await waitKey();

  // STEP 7: VERIFICATION PORTAL
  console.log(CLEAR);
  drawBox("STEP 6: PUBLIC INDEPENDENT AUDIT & VERIFICATION", [
    " Third-party recruiters can audit the certificate hash directly",
    " on the blockchain. If the hash matches the contract's registry,",
    " the degree is validated instantly as authentic."
  ], GREEN);
  
  console.log(`\nRecruiter queries certificate registry using degree hash...`);
  try {
    const contract = getContractInstance();
    const result = await contract.verifyDegree(certHash);
    const isValid = result.isValid;
    
    console.log(`\n=================================================`);
    console.log(`  VERIFICATION AUDIT RESULT:`);
    console.log(`  - Degree Hash:   ${CYAN}${certHash}${RESET}`);
    console.log(`  - Registry Status: ${isValid ? GREEN + "★ ACTIVE & VALID (AUTHENTIC)" : RED + "✖ INVALID RECORD (FORGERY)"}${RESET}`);
    console.log(`=================================================`);
    
  } catch (err) {
    console.error("Verification failed:", err);
  }
  
  console.log(`\n${BOLD}Demo completed successfully! Press [Enter] to exit.${RESET}`);
  await waitKey("");
  rl.close();
}

import { ethers } from "ethers";
runDemo();
