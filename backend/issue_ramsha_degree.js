import { ethers } from "ethers";
import { dbRun, dbGet } from "./src/config/db.js";
import { getContractInstance } from "./src/services/blockchainService.js";
import { signVC } from "./src/utils/vcHelper.js";
import { uploadJSONToIPFS } from "./src/utils/ipfsHelper.js";

const studentId = "CSE26005";
const courseId = "c1";

async function issueDegree() {
  try {
    console.log("-----------------------------------------");
    console.log(`Starting degree issuance for student: ${studentId}`);
    console.log("-----------------------------------------");

    // 1. Fetch Student profile
    const student = await dbGet("SELECT * FROM Student WHERE student_id = ?", [studentId]);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found in database.`);
    }

    // 2. Fetch Course details
    const course = await dbGet("SELECT * FROM Courses WHERE id = ?", [courseId]);
    if (!course) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }

    // 3. Ensure Enrollment exists and is set to completed
    const enrollment = await dbGet("SELECT * FROM CourseEnrollments WHERE student_id = ? AND course_id = ?", [studentId, courseId]);
    if (!enrollment) {
      await dbRun(`
        INSERT INTO CourseEnrollments (student_id, course_id, status, enrolled_at, submitted_at)
        VALUES (?, ?, 'completed', datetime('now'), datetime('now'))
      `, [studentId, courseId]);
      console.log(`- Created enrollment record for course: ${course.title}`);
    } else {
      await dbRun(`
        UPDATE CourseEnrollments 
        SET status = 'completed', submitted_at = datetime('now')
        WHERE student_id = ? AND course_id = ?
      `, [studentId, courseId]);
      console.log(`- Updated enrollment status to 'completed' for course: ${course.title}`);
    }

    // 4. Generate W3C Verifiable Credential Payload
    const vcPayload = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
      ],
      "id": `urn:uuid:cse26005-${Date.now()}`,
      "type": ["VerifiableCredential", "CourseCertificate"],
      "issuer": "did:ethr:0xf39fd6e51aad88f6ab8827279cfffb92266:univ_admin",
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": student.did,
        "name": student.full_name,
        "rollNumber": student.student_id,
        "degree": course.title,
        "gradeCgpa": "A+",
        "passingYear": "2026",
        "institution": "Mahatma Gandhi Mission University (MGMU)",
        "type": "Course Certificate",
        "department": "Online Courses"
      }
    };

    // 5. Sign VC using University Admin private key
    const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    console.log("- Cryptographically signing the W3C Verifiable Credential JSON payload...");
    const signedVc = await signVC(vcPayload, privateKey);

    // 6. Save signed VC payload to mock IPFS storage
    console.log("- Uploading metadata to mock IPFS repository...");
    const ipfsCid = await uploadJSONToIPFS(signedVc);

    // 7. Compute Keccak-256 hash of signed VC
    const certHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(signedVc)));
    console.log(`- Calculated Keccak-256 hash: ${certHash}`);

    // 8. Anchor hash on Ethereum Blockchain local contract
    console.log("- Anchoring credential hash on Ethereum smart contract...");
    const contract = getContractInstance();
    const tx = await contract.issueDegree(certHash);
    console.log("- Waiting for transaction block confirmation...");
    const receipt = await tx.wait();
    console.log(`✔ On-Chain transaction successful: ${receipt.hash} (Block: ${receipt.blockNumber})`);

    // 9. Sync changes with local SQLite database Certificate table
    await dbRun("DELETE FROM Certificate WHERE student_id = ? AND degree_name = ?", [studentId, course.title]);
    await dbRun(`
      INSERT INTO Certificate (cert_id, degree_name, issue_date, grade_cgpa, status, cert_hash, ipfs_cid, student_id, univ_id)
      VALUES (?, ?, datetime('now'), 'A+', 'Active', ?, ?, ?, 'univ_admin')
    `, [vcPayload.id, course.title, certHash, ipfsCid, studentId]);
    console.log("✔ SQLite Database synchronized successfully.");

    console.log("\n=========================================");
    console.log("SUCCESS: Degree issued successfully to Ramsha Siddiqui!");
    console.log(`Certificate Hash: ${certHash}`);
    console.log(`Mock IPFS CID:    ${ipfsCid}`);
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("Issuance failed:", error);
    process.exit(1);
  }
}

issueDegree();
