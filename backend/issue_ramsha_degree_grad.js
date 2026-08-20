import { ethers } from "ethers";
import { dbRun, dbGet } from "./src/config/db.js";
import { getContractInstance } from "./src/services/blockchainService.js";
import { signVC } from "./src/utils/vcHelper.js";
import { uploadJSONToIPFS } from "./src/utils/ipfsHelper.js";

const studentId = "CSE26005";
const degreeName = "Bachelor of Technology in Computer Science & Engineering";

async function issueGradDegree() {
  try {
    console.log("-----------------------------------------");
    console.log(`Starting graduation degree issuance for: ${studentId}`);
    console.log("-----------------------------------------");

    // 1. Fetch Student profile
    const student = await dbGet("SELECT * FROM Student WHERE student_id = ?", [studentId]);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found in database.`);
    }

    // 2. Generate W3C Verifiable Credential Payload for Graduation Degree
    const vcPayload = {
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

    // 3. Sign VC using University Admin private key
    const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    console.log("- Cryptographically signing the W3C Verifiable Degree JSON payload...");
    const signedVc = await signVC(vcPayload, privateKey);

    // 4. Save signed VC payload to mock IPFS storage
    console.log("- Uploading degree metadata to mock IPFS repository...");
    const ipfsCid = await uploadJSONToIPFS(signedVc);

    // 5. Compute Keccak-256 hash of signed VC
    const certHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(signedVc)));
    console.log(`- Calculated Keccak-256 hash: ${certHash}`);

    // 6. Anchor hash on Ethereum Blockchain local contract
    console.log("- Anchoring degree hash on Ethereum smart contract...");
    const contract = getContractInstance();
    const tx = await contract.issueDegree(certHash);
    console.log("- Waiting for transaction block confirmation...");
    const receipt = await tx.wait();
    console.log(`✔ On-Chain transaction successful: ${receipt.hash} (Block: ${receipt.blockNumber})`);

    // 7. Sync changes with local SQLite database Certificate table (Ensure we don't conflict with the course certificate)
    await dbRun("DELETE FROM Certificate WHERE student_id = ? AND degree_name = ?", [studentId, degreeName]);
    await dbRun(`
      INSERT INTO Certificate (cert_id, degree_name, issue_date, grade_cgpa, status, cert_hash, ipfs_cid, student_id, univ_id)
      VALUES (?, ?, datetime('now'), '9.10', 'Active', ?, ?, ?, 'univ_admin')
    `, [vcPayload.id, degreeName, certHash, ipfsCid, studentId]);
    console.log("✔ SQLite Database synchronized successfully.");

    console.log("\n=========================================");
    console.log("SUCCESS: B.Tech Graduation Degree issued successfully to Ramsha Siddiqui!");
    console.log(`Degree Hash: ${certHash}`);
    console.log(`Mock IPFS CID: ${ipfsCid}`);
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("Issuance failed:", error);
    process.exit(1);
  }
}

issueGradDegree();
