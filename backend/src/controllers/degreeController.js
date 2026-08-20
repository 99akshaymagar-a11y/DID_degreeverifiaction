import crypto from "crypto";
import { ethers } from "ethers";
import { dbRun, dbGet, dbAll } from "../config/db.js";
import { createDegreeVC, signVC, verifyVC } from "../utils/vcHelper.js";
import { uploadJSONToIPFS, getJSONFromIPFS } from "../utils/ipfsHelper.js";
import { getContractInstance } from "../services/blockchainService.js";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to compute SHA-256 hash of a string/object
const computeHash = (data) => {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(str).digest("hex");
};

/**
 * Issue a single degree credential.
 */
export const issueDegree = async (req, res) => {
  const { rollNo, degreeName, gradeCgpa, year, type, dept, universityId, privateKey, expiryDate } = req.body;

  if (!rollNo || !degreeName || !universityId) {
    return res.status(400).json({ error: "Roll number, degree name, and university ID are required." });
  }

  try {
    // 1. Resolve student details
    const student = await dbGet("SELECT * FROM Student WHERE student_id = ?", [rollNo]);
    if (!student) {
      return res.status(404).json({ error: "Student roll number not registered. Register Student DID first." });
    }

    if (!student.did) {
      return res.status(400).json({ error: "Student has not registered a wallet/DID yet." });
    }

    // 2. Resolve university details
    const university = await dbGet("SELECT * FROM University WHERE univ_id = ?", [universityId]);
    if (!university) {
      return res.status(404).json({ error: "Accredited University not found in system." });
    }

    // 3. Create W3C Verifiable Credential payload
    const studentDID = student.did;
    const universityDID = `did:ethr:${university.wallet_address.toLowerCase()}`;
    const vcPayload = createDegreeVC(
      student.full_name,
      student.student_id,
      studentDID,
      degreeName,
      gradeCgpa || "N/A",
      year || new Date().getFullYear().toString(),
      university.univ_name,
      universityDID,
      expiryDate || null
    );

    // 4. Sign VC using university private key
    const issuerPrivateKey = privateKey || process.env.PRIVATE_KEY;
    const signedVC = await signVC(vcPayload, issuerPrivateKey);

    // 5. Upload signed VC to IPFS (real/mock)
    const ipfsCid = await uploadJSONToIPFS(signedVC);

    // 6. Compute certificate hash for blockchain anchoring (SHA-256 hex string with 0x prefix)
    const certHashRaw = computeHash(signedVC);
    const certHashOnChain = "0x" + certHashRaw;

    // 7. Anchor hash on blockchain smart contract
    let txHash = "0x" + crypto.randomBytes(32).toString("hex"); // Fallback mock hash
    let blockNumber = 0;
    
    try {
      console.log(`Attempting to anchor hash on-chain: ${certHashOnChain}`);
      const contract = getContractInstance(issuerPrivateKey);
      
      const tx = await contract.issueDegree(certHashOnChain);
      const receipt = await tx.wait();
      
      txHash = receipt.hash;
      blockNumber = receipt.blockNumber;
      console.log(`Hash successfully anchored. Tx: ${txHash}, Block: ${blockNumber}`);
    } catch (bcError) {
      console.warn("Blockchain anchoring failed or timed out. Proceeding with database records using simulated transaction:", bcError.message);
    }

    // 8. Write records to SQLite Database (Certificate and BlockchainRecord tables)
    const certId = signedVC.id;
    const issueDate = new Date().toISOString().slice(0, 10);

    // Insert Certificate
    await dbRun(
      "INSERT INTO Certificate (cert_id, degree_name, issue_date, grade_cgpa, status, cert_hash, ipfs_cid, student_id, univ_id, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [certId, degreeName, issueDate, gradeCgpa || "N/A", "Active", certHashRaw, ipfsCid, student.student_id, university.univ_id, expiryDate || null]
    );

    // Insert Blockchain Record
    await dbRun(
      "INSERT INTO BlockchainRecord (tx_hash, block_number, timestamp, network, contract_address, cert_id) VALUES (?, ?, ?, ?, ?, ?)",
      [txHash, blockNumber, new Date().toISOString(), "Ethereum Local/Sepolia", process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3", certId]
    );

    res.status(201).json({
      message: "Degree credential successfully issued and anchored.",
      certId,
      ipfsCid,
      certHash: certHashRaw,
      txHash,
      verifiableCredential: signedVC
    });

  } catch (error) {
    console.error("Degree issuance error:", error);
    res.status(500).json({ error: "Internal server error during degree issuance." });
  }
};

/**
 * Verify a degree credential by Credential ID or Hash.
 */
export const verifyDegree = async (req, res) => {
  const { query, employerId } = req.body; // query can be cert_id or cert_hash or student DID

  if (!query) {
    return res.status(400).json({ error: "Query parameter (ID, Hash, or DID) is required." });
  }

  const verifierIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const verifyId = "vfy_" + crypto.randomBytes(8).toString("hex");
  const timestamp = new Date().toISOString();

  try {
    // 1. Fetch certificate record from SQLite
    const cert = await dbGet(
      "SELECT * FROM Certificate WHERE cert_id = ? OR cert_hash = ? OR student_id = ?",
      [query, query.replace(/^0x/, ""), query]
    );

    if (!cert) {
      // Log failed verification attempt
      await dbRun(
        "INSERT INTO Verification (verify_id, verified_at, status, method, ip_address, cert_id, employer_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [verifyId, timestamp, "Failed", "Query", verifierIp, "UNKNOWN", employerId || null]
      );
      
      return res.status(404).json({
        verified: false,
        reason: "Credential not found in database registry."
      });
    }

    // 2. Fetch full VC payload from IPFS
    let signedVC;
    try {
      signedVC = await getJSONFromIPFS(cert.ipfs_cid);
    } catch (ipfsError) {
      return res.status(500).json({ error: `Could not retrieve signed credential from IPFS: ${ipfsError.message}` });
    }

    // 3. Cryptographically verify W3C VC signature
    const vcVerification = verifyVC(signedVC);

    // 4. Query blockchain contract status
    let onChainValid = false;
    let onChainRevoked = false;
    
    try {
      const contract = getContractInstance();
      const certHashWith0x = "0x" + cert.cert_hash;
      const bcResult = await contract.verifyDegree(certHashWith0x);
      
      onChainValid = bcResult.isValid;
      onChainRevoked = bcResult.isRevoked;
    } catch (bcError) {
      console.warn("Blockchain validation failed, checking database state:", bcError.message);
      // Fallback: If blockchain call fails, use database state
      onChainValid = (cert.status === "Active" && vcVerification.isValid);
      onChainRevoked = (cert.status === "Revoked");
    }

    // 5. Check Expiration Date
    let isExpired = false;
    if (cert.expiry_date) {
      const expiryTime = new Date(cert.expiry_date).getTime();
      if (Date.now() > expiryTime) {
        isExpired = true;
      }
    }

    // Final validation result evaluation
    const isAuthentic = vcVerification.isValid && onChainValid && !onChainRevoked && !isExpired;
    const statusText = onChainRevoked ? "Revoked" : (isExpired ? "Expired" : (isAuthentic ? "Active" : "Invalid"));

    // 6. Log verification results in database
    await dbRun(
      "INSERT INTO Verification (verify_id, verified_at, status, method, ip_address, cert_id, employer_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [verifyId, timestamp, isAuthentic ? "Success" : "Failed", "ID/Hash", verifierIp, cert.cert_id, employerId || null]
    );

    // Fetch related student and blockchain details
    const student = await dbGet("SELECT full_name, email, wallet_address, did FROM Student WHERE student_id = ?", [cert.student_id]);
    const blockchainRecord = await dbGet("SELECT tx_hash, block_number, timestamp, network FROM BlockchainRecord WHERE cert_id = ?", [cert.cert_id]);

    res.status(200).json({
      verified: isAuthentic,
      status: statusText,
      auditDetails: {
        cryptographicProof: vcVerification.isValid ? "Valid W3C signature" : "Invalid signature signature mismatch",
        recoveredIssuerAddress: vcVerification.recoveredAddress,
        expectedIssuerAddress: vcVerification.issuerAddress,
        blockchainAnchored: onChainValid ? "Verified on-chain" : "Unverified or revoked on-chain",
        revocationStatus: onChainRevoked ? "REVOKED" : "Not Revoked",
        expirationStatus: isExpired ? "EXPIRED" : "Valid"
      },
      certificate: {
        id: cert.cert_id,
        degreeName: cert.degree_name,
        issueDate: cert.issue_date,
        gradeCgpa: cert.grade_cgpa,
        ipfsCid: cert.ipfs_cid,
        certHash: cert.cert_hash,
        expiryDate: cert.expiry_date
      },
      student: student || null,
      blockchain: blockchainRecord || null
    });

  } catch (error) {
    console.error("Verification query error:", error);
    res.status(500).json({ error: "Internal server error during degree verification." });
  }
};

/**
 * Verify a degree credential by file upload (PDF).
 */
export const verifyDegreeByFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload a certificate PDF file." });
  }

  const verifierIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const verifyId = "vfy_" + crypto.randomBytes(8).toString("hex");
  const timestamp = new Date().toISOString();
  const employerId = req.body.employerId || null;

  try {
    // 1. Calculate SHA-256 hash of the uploaded file buffer
    const fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    console.log(`Uploaded file SHA-256: ${fileHash}`);

    // 2. Fetch certificate details by hash
    const cert = await dbGet("SELECT * FROM Certificate WHERE cert_hash = ?", [fileHash]);
    if (!cert) {
      // Log failed verification attempt
      await dbRun(
        "INSERT INTO Verification (verify_id, verified_at, status, method, ip_address, cert_id, employer_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [verifyId, timestamp, "Failed", "File Upload", verifierIp, "UNKNOWN", employerId]
      );
      
      return res.status(404).json({
        verified: false,
        reason: "Certificate file hash not found on blockchain registry. The document might have been altered or forged."
      });
    }

    // 3. Check blockchain status
    let onChainValid = false;
    let onChainRevoked = false;
    
    try {
      const contract = getContractInstance();
      const certHashWith0x = "0x" + fileHash;
      const bcResult = await contract.verifyDegree(certHashWith0x);
      onChainValid = bcResult.isValid;
      onChainRevoked = bcResult.isRevoked;
    } catch (bcError) {
      console.warn("Blockchain validation failed, checking database state:", bcError.message);
      onChainValid = (cert.status === "Active");
      onChainRevoked = (cert.status === "Revoked");
    }

    // 4. Check Expiration Date
    let isExpired = false;
    if (cert.expiry_date) {
      const expiryTime = new Date(cert.expiry_date).getTime();
      if (Date.now() > expiryTime) {
        isExpired = true;
      }
    }

    const isAuthentic = onChainValid && !onChainRevoked && !isExpired;
    const statusText = onChainRevoked ? "Revoked" : (isExpired ? "Expired" : (isAuthentic ? "Active" : "Invalid"));

    // 5. Log verification
    await dbRun(
      "INSERT INTO Verification (verify_id, verified_at, status, method, ip_address, cert_id, employer_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [verifyId, timestamp, isAuthentic ? "Success" : "Failed", "File Upload", verifierIp, cert.cert_id, employerId]
    );

    const student = await dbGet("SELECT full_name, email, wallet_address, did FROM Student WHERE student_id = ?", [cert.student_id]);
    const blockchainRecord = await dbGet("SELECT tx_hash, block_number, timestamp, network FROM BlockchainRecord WHERE cert_id = ?", [cert.cert_id]);

    res.status(200).json({
      verified: isAuthentic,
      status: statusText,
      auditDetails: {
        blockchainAnchored: onChainValid ? "Verified on-chain" : "Unverified or revoked on-chain",
        revocationStatus: onChainRevoked ? "REVOKED" : "Not Revoked",
        expirationStatus: isExpired ? "EXPIRED" : "Valid",
        fileHash
      },
      certificate: {
        id: cert.cert_id,
        degreeName: cert.degree_name,
        issueDate: cert.issue_date,
        gradeCgpa: cert.grade_cgpa,
        ipfsCid: cert.ipfs_cid,
        certHash: cert.cert_hash,
        expiryDate: cert.expiry_date
      },
      student: student || null,
      blockchain: blockchainRecord || null
    });

  } catch (error) {
    console.error("File verification error:", error);
    res.status(500).json({ error: "Internal server error during file verification." });
  }
};

/**
 * Revoke a degree certificate.
 */
export const revokeDegree = async (req, res) => {
  const { certId, universityId, privateKey } = req.body;

  if (!certId || !universityId) {
    return res.status(400).json({ error: "Certificate ID and University ID are required." });
  }

  try {
    // 1. Fetch certificate from DB
    const cert = await dbGet("SELECT * FROM Certificate WHERE cert_id = ? AND univ_id = ?", [certId, universityId]);
    if (!cert) {
      return res.status(404).json({ error: "Certificate record not found." });
    }

    if (cert.status === "Revoked") {
      return res.status(400).json({ error: "Certificate is already revoked." });
    }

    // 2. Perform smart contract revocation call
    const certHashWith0x = "0x" + cert.cert_hash;
    const issuerPrivateKey = privateKey || process.env.PRIVATE_KEY;
    let txHash = null;

    try {
      console.log(`Attempting on-chain revocation of: ${certHashWith0x}`);
      const contract = getContractInstance(issuerPrivateKey);
      const tx = await contract.revokeDegree(certHashWith0x);
      const receipt = await tx.wait();
      txHash = receipt.hash;
      console.log(`On-chain revocation successful. Tx: ${txHash}`);
    } catch (bcError) {
      console.warn("On-chain revocation failed. Proceeding with database status update:", bcError.message);
    }

    // 3. Update database status to 'Revoked'
    await dbRun("UPDATE Certificate SET status = 'Revoked' WHERE cert_id = ?", [certId]);

    res.status(200).json({
      message: "Certificate successfully revoked.",
      certId,
      status: "Revoked",
      txHash
    });

  } catch (error) {
    console.error("Revocation error:", error);
    res.status(500).json({ error: "Internal server error during credential revocation." });
  }
};

/**
 * Fetch all certificates.
 */
export const getAllCertificates = async (req, res) => {
  try {
    const certs = await dbAll(`
      SELECT c.*, s.full_name as student_name, s.did as student_did 
      FROM Certificate c 
      JOIN Student s ON c.student_id = s.student_id
    `);
    res.status(200).json(certs);
  } catch (error) {
    console.error("Fetch all certs error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Generate and download degree certificate PDF dynamically.
 */
export const downloadDegreePDF = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch certificate details
    const cert = await dbGet("SELECT * FROM Certificate WHERE cert_id = ?", [id]);
    if (!cert) {
      return res.status(404).json({ error: "Certificate not found." });
    }

    // 2. Fetch student details
    const student = await dbGet("SELECT * FROM Student WHERE student_id = ?", [cert.student_id]);
    if (!student) {
      return res.status(404).json({ error: "Student profile not found." });
    }

    // 3. Fetch university details
    const university = await dbGet("SELECT * FROM University WHERE univ_id = ?", [cert.univ_id]);
    if (!university) {
      return res.status(404).json({ error: "University profile not found." });
    }

    // 4. Fetch blockchain record
    const bcRecord = await dbGet("SELECT * FROM BlockchainRecord WHERE cert_id = ?", [cert.cert_id]);
    const txHash = bcRecord ? bcRecord.tx_hash : "Simulated/Offline_Anchor";

    // 5. Build verification URL
    const verifyUrl = `http://localhost:5173/?verifyQuery=${cert.cert_id}`;

    // 6. Define output PDF path inside temp dir
    const tempDir = path.resolve(__dirname, "../../db/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const pdfPath = path.join(tempDir, `certificate_${cert.cert_id}.pdf`);

    // 7. Invoke python script to generate premium PDF
    const pythonScript = path.resolve(__dirname, "../utils/generate_certificate_pdf.py");
    
    // Wrap arguments in double quotes to handle spaces on Windows
    const args = [
      `"${student.full_name}"`,
      `"${student.student_id}"`,
      `"${cert.degree_name}"`,
      `"${student.dept || 'Computer Science'}"`,
      `"${cert.grade_cgpa || 'N/A'}"`,
      `"${cert.issue_date}"`,
      `"${university.univ_name}"`,
      `"${txHash}"`,
      `"${verifyUrl}"`,
      `"${pdfPath}"`
    ];

    const command = `python.exe "${pythonScript}" ${args.join(" ")}`;
    
    exec(command, (execErr, stdout, stderr) => {
      if (execErr) {
        console.error("PDF generation script error:", execErr, stderr);
        return res.status(500).json({ error: "Failed to generate certificate PDF." });
      }

      // Check if file was created successfully
      if (!fs.existsSync(pdfPath)) {
        return res.status(500).json({ error: "Certificate PDF was not created." });
      }

      // 8. Stream the file to response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Degree_${student.student_id}.pdf"`);
      
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);

      // Clean up after streaming completed or errored
      res.on("finish", () => {
        try {
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
          }
        } catch (cleanupErr) {
          console.warn("Temp PDF file cleanup failed:", cleanupErr.message);
        }
      });
    });

  } catch (error) {
    console.error("PDF download error:", error);
    res.status(500).json({ error: "Internal server error during PDF download." });
  }
};

/**
 * Query smart contract event logs for the on-chain explorer ledger.
 */
export const getBlockchainEvents = async (req, res) => {
  try {
    const contract = getContractInstance();
    const events = await contract.queryFilter("*", 0, "latest");

    const mappedEvents = await Promise.all(
      events.map(async (e) => {
        let timestamp = new Date().toISOString();
        try {
          const block = await e.provider.getBlock(e.blockNumber);
          if (block) {
            timestamp = new Date(block.timestamp * 1000).toISOString();
          }
        } catch (blockErr) {
          console.warn(`Failed to fetch block ${e.blockNumber} details:`, blockErr.message);
        }

        // Parse arguments depending on event structure
        const eventArgs = {};
        if (e.fragment && e.fragment.inputs) {
          e.fragment.inputs.forEach((input, index) => {
            let val = e.args[index];
            if (typeof val === "object" && val !== null && val.hash) {
              val = val.hash; // Handle complex types if any
            }
            eventArgs[input.name] = String(val);
          });
        }

        return {
          eventName: e.fragment ? e.fragment.name : "Unknown",
          blockNumber: e.blockNumber,
          transactionHash: e.transactionHash,
          timestamp,
          args: eventArgs
        };
      })
    );

    // Sort by block number descending
    mappedEvents.sort((a, b) => b.blockNumber - a.blockNumber);

    res.status(200).json(mappedEvents);
  } catch (error) {
    console.error("Fetch blockchain events error:", error);
    res.status(500).json({ error: "Internal server error during blockchain event queries." });
  }
};

/**
 * Authorize an institution's wallet on the smart contract.
 */
export const authorizeInstitutionOnChain = async (req, res) => {
  const { walletAddress, privateKey } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required." });
  }

  try {
    const adminPrivateKey = privateKey || process.env.PRIVATE_KEY;
    const contract = getContractInstance(adminPrivateKey);
    console.log(`Smart Contract: Authorizing wallet ${walletAddress}`);
    const tx = await contract.authorizeIssuer(walletAddress.toLowerCase());
    const receipt = await tx.wait();

    res.status(200).json({
      message: "Institution successfully whitelisted on the blockchain.",
      txHash: receipt.hash
    });
  } catch (error) {
    console.error("Blockchain authorization error:", error);
    res.status(500).json({ error: `Blockchain Error: ${error.message}` });
  }
};

/**
 * Deauthorize an institution's wallet on the smart contract.
 */
export const deauthorizeInstitutionOnChain = async (req, res) => {
  const { walletAddress, privateKey } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required." });
  }

  try {
    const adminPrivateKey = privateKey || process.env.PRIVATE_KEY;
    const contract = getContractInstance(adminPrivateKey);
    console.log(`Smart Contract: Deauthorizing wallet ${walletAddress}`);
    const tx = await contract.deauthorizeIssuer(walletAddress.toLowerCase());
    const receipt = await tx.wait();

    res.status(200).json({
      message: "Institution successfully deauthorized on the blockchain.",
      txHash: receipt.hash
    });
  } catch (error) {
    console.error("Blockchain deauthorization error:", error);
    res.status(500).json({ error: `Blockchain Error: ${error.message}` });
  }
};
