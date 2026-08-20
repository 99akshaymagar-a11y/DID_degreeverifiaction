import { ethers } from "ethers";
import { dbRun, dbGet } from "./src/config/db.js";
import { getContractInstance } from "./src/services/blockchainService.js";
import { signVC } from "./src/utils/vcHelper.js";
import { uploadJSONToIPFS } from "./src/utils/ipfsHelper.js";

const studentId = "CSE26005";
const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const providerUrl = process.env.BLOCKCHAIN_PROVIDER_URL || "http://127.0.0.1:8545";

async function runReissue() {
  try {
    console.log("-----------------------------------------");
    console.log("Updating Student Name to Ananya Sharma...");
    console.log("-----------------------------------------");
    
    // 1. Update database record
    await dbRun("UPDATE Student SET full_name = ? WHERE student_id = ?", ["Ananya Sharma", studentId]);
    console.log("✔ SQLite database updated: name set to 'Ananya Sharma'");
    
    // Fetch updated student profile
    const student = await dbGet("SELECT * FROM Student WHERE student_id = ?", [studentId]);
    
    // 2. Clear old certificates
    await dbRun("DELETE FROM Certificate WHERE student_id = ?", [studentId]);
    console.log("✔ Cleared old certificate database records.");
    
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = getContractInstance();

    // =========================================
    // PART A: RE-ISSUE COURSE CERTIFICATE
    // =========================================
    console.log("\n[Part 1/2] Generating Course Certificate for Ananya Sharma...");
    const course = await dbGet("SELECT * FROM Courses WHERE id = ?", ["c1"]);
    
    const coursePayload = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
      ],
      "id": `urn:uuid:cse26005-course-${Date.now()}`,
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
    
    const signedCourseVc = await signVC(coursePayload, privateKey);
    const courseCid = await uploadJSONToIPFS(signedCourseVc);
    const courseHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(signedCourseVc)));
    
    // Fetch fresh nonce for transaction 1
    const nonce1 = await provider.getTransactionCount(wallet.address);
    console.log(`- Anchoring course certificate hash with nonce: ${nonce1}...`);
    
    const txCourse = await contract.issueDegree(courseHash, { nonce: nonce1 });
    await txCourse.wait();
    console.log(`✔ Anchored Course Cert: ${courseHash}`);
    
    await dbRun(`
      INSERT INTO Certificate (cert_id, degree_name, issue_date, grade_cgpa, status, cert_hash, ipfs_cid, student_id, univ_id)
      VALUES (?, ?, datetime('now'), 'A+', 'Active', ?, ?, ?, 'univ_admin')
    `, [coursePayload.id, course.title, courseHash, courseCid, studentId]);

    // Delay 1.5 seconds to let block mine fully
    console.log("- Waiting for block confirmation & sync...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    // =========================================
    // PART B: RE-ISSUE GRADUATION DEGREE
    // =========================================
    console.log("\n[Part 2/2] Generating Graduation Degree for Ananya Sharma...");
    const degreeName = "Bachelor of Technology in Computer Science & Engineering";
    
    const degreePayload = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
      ],
      "id": `urn:uuid:cse26005-degree-${Date.now()}`,
      "type": ["VerifiableCredential", "UniversityDegreeCredential"],
      "issuer": "did:ethr:0xf39fd6e51aad88f6ab8827279cfffb92266:univ_admin",
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": student.did,
        "name": student.full_name,
        "rollNumber": student.student_id,
        "degree": degreeName,
        "gradeCgpa": "9.10",
        "passingYear": "2026",
        "institution": "Mahatma Gandhi Mission University (MGMU)",
        "type": "B.Tech Degree",
        "department": "Computer Science & Engineering"
      }
    };
    
    const signedDegreeVc = await signVC(degreePayload, privateKey);
    const degreeCid = await uploadJSONToIPFS(signedDegreeVc);
    const degreeHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(signedDegreeVc)));
    
    // Fetch fresh nonce for transaction 2
    const nonce2 = await provider.getTransactionCount(wallet.address);
    console.log(`- Anchoring graduation degree hash with nonce: ${nonce2}...`);
    
    const txDegree = await contract.issueDegree(degreeHash, { nonce: nonce2 });
    await txDegree.wait();
    console.log(`✔ Anchored Degree: ${degreeHash}`);
    
    await dbRun(`
      INSERT INTO Certificate (cert_id, degree_name, issue_date, grade_cgpa, status, cert_hash, ipfs_cid, student_id, univ_id)
      VALUES (?, ?, datetime('now'), '9.10', 'Active', ?, ?, ?, 'univ_admin')
    `, [degreePayload.id, degreeName, degreeHash, degreeCid, studentId]);

    console.log("\n=========================================");
    console.log("SUCCESS: Reissued all credentials to Ananya Sharma!");
    console.log(`Course Cert Hash: ${courseHash}`);
    console.log(`Degree Hash:      ${degreeHash}`);
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("Reissue failed:", error);
    process.exit(1);
  }
}

runReissue();
