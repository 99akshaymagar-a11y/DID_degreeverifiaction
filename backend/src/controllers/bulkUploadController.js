import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import csvParser from "csv-parser";
import crypto from "crypto";
import { dbRun, dbGet, dbAll } from "../config/db.js";
import { createDegreeVC, signVC } from "../utils/vcHelper.js";
import { uploadJSONToIPFS } from "../utils/ipfsHelper.js";
import { getContractInstance } from "../services/blockchainService.js";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to compute SHA-256 hash of an object
const computeHash = (data) => {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(str).digest("hex");
};

/**
 * Spawns the Python AI Fraud Detection process.
 */
const runAIFraudDetector = (records, histMean = 7.8, histStd = 0.75) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.resolve(__dirname, "../ai/fraud_detector.py");
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    const pyProcess = spawn(pythonCmd, [pythonScript]);

    const inputData = JSON.stringify({
      records,
      historical_mean: histMean,
      historical_std: histStd
    });

    let outputData = "";
    let errorData = "";

    pyProcess.stdout.on("data", (data) => {
      outputData += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    pyProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(errorData || `Python script exited with code ${code}`));
      } else {
        try {
          resolve(JSON.parse(outputData));
        } catch (e) {
          reject(new Error("Failed to parse Python script output: " + e.message));
        }
      }
    });

    // Write input data to standard input and close it
    pyProcess.stdin.write(inputData);
    pyProcess.stdin.end();
  });
};

/**
 * Endpoint for running AI fraud checks directly.
 */
export const checkFraudDirectly = async (req, res) => {
  const { records, historicalMean, historicalStd } = req.body;

  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: "Records array is required." });
  }

  try {
    const aiResult = await runAIFraudDetector(records, historicalMean, historicalStd);
    res.status(200).json(aiResult);
  } catch (error) {
    console.error("Direct AI check error:", error);
    res.status(500).json({ error: `AI Fraud Service error: ${error.message}` });
  }
};

/**
 * Parses CSV and bulk issues credentials after AI validation.
 */
export const bulkUploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload a CSV file." });
  }

  const universityId = req.body.universityId;
  const privateKey = req.body.privateKey || process.env.PRIVATE_KEY;

  if (!universityId) {
    return res.status(400).json({ error: "University ID is required for bulk issuance." });
  }

  const tempFilePath = req.file.path;
  const parsedRecords = [];

  // 1. Read and parse CSV
  fs.createReadStream(tempFilePath)
    .pipe(csvParser())
    .on("data", (row) => {
      // Normalize keys (handle case-insensitive and spacing)
      const name = row.Name || row.name || row.fullName || "";
      const rollNo = row.RollNo || row.rollNo || row.rollnumber || row.studentId || "";
      const dept = row.Dept || row.dept || row.department || "CSE ICBT";
      const cgpa = row.CGPA || row.cgpa || row.grade || "N/A";
      const year = row.Year || row.year || new Date().getFullYear().toString();
      const email = row.Email || row.email || `${rollNo.toLowerCase()}@soet.mgmu.ac.in`;
      const abcId = row.abcId || row.abc_id || row["ABC ID"] || row["abcId"] || null;

      if (name && rollNo) {
        parsedRecords.push({ name, rollNo, dept, cgpa, year, email, abcId });
      }
    })
    .on("end", async () => {
      // Delete temporary uploaded CSV file
      fs.unlinkSync(tempFilePath);

      if (parsedRecords.length === 0) {
        return res.status(400).json({ error: "No valid records found in CSV." });
      }

      try {
        // 2. Resolve University details
        const university = await dbGet("SELECT * FROM University WHERE univ_id = ?", [universityId]);
        if (!university) {
          return res.status(404).json({ error: "University profile not found." });
        }

        // 3. Run AI Anomaly & Fraud Detection on the batch
        console.log(`Running AI Fraud checks on ${parsedRecords.length} records...`);
        const aiResult = await runAIFraudDetector(parsedRecords);

        // Map flagged records for fast lookup
        const flaggedRolls = new Set([
          ...aiResult.cgpa_anomalies.filter(a => a.severity === "High").map(a => a.rollNo),
          ...aiResult.email_anomalies.filter(a => a.severity === "High").map(a => a.rollNo)
        ]);

        const successfulIssuances = [];
        const failedIssuances = [];

        // 4. Issue credentials for all unflagged records
        for (const record of parsedRecords) {
          if (flaggedRolls.has(record.rollNo)) {
            failedIssuances.push({
              record,
              reason: "Flagged as high-risk anomaly by AI engine."
            });
            continue;
          }

          try {
            // Check if student exists; if not, auto-create student record with mock wallet
            let student = await dbGet("SELECT * FROM Student WHERE student_id = ?", [record.rollNo]);
            if (!student) {
              const mockWallet = "0x" + crypto.randomBytes(20).toString("hex");
              const did = `did:ethr:${mockWallet}`;
              
              await dbRun(
                "INSERT INTO Student (student_id, full_name, email, univ_id, wallet_address, did, abc_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [record.rollNo, record.name, record.email, university.univ_id, mockWallet, did, record.abcId]
              );

              // Also auto-create student user login account with default password
              const passwordHash = await bcrypt.hash("password123", 10);
              const userId = "usr_" + crypto.randomBytes(8).toString("hex");
              await dbRun(
                "INSERT INTO Users (id, email, password_hash, role, profile_id) VALUES (?, ?, ?, ?, ?)",
                [userId, record.email, passwordHash, "Student", record.rollNo]
              );
              
              student = { student_id: record.rollNo, full_name: record.name, email: record.email, univ_id: university.univ_id, wallet_address: mockWallet, did };
            }

            // Create W3C VC payload
            const universityDID = `did:ethr:${university.wallet_address.toLowerCase()}`;
            const vcPayload = createDegreeVC(
              student.full_name,
              student.student_id,
              student.did,
              "Bachelor of Technology", // Default degree title
              record.cgpa,
              record.year,
              university.univ_name,
              universityDID
            );

            // Sign VC
            const signedVC = await signVC(vcPayload, privateKey);

            // Upload to IPFS
            const ipfsCid = await uploadJSONToIPFS(signedVC);

            // Compute hash & anchor on-chain
            const certHashRaw = computeHash(signedVC);
            const certHashOnChain = "0x" + certHashRaw;

            let txHash = "0x" + crypto.randomBytes(32).toString("hex");
            let blockNumber = 0;

            try {
              const contract = getContractInstance(privateKey);
              const tx = await contract.issueDegree(certHashOnChain);
              const receipt = await tx.wait();
              txHash = receipt.hash;
              blockNumber = receipt.blockNumber;
            } catch (bcErr) {
              console.warn(`Blockchain anchoring bypassed or failed for ${record.rollNo}:`, bcErr.message);
            }

            // Insert Certificate
            const certId = signedVC.id;
            const issueDate = new Date().toISOString().slice(0, 10);
            await dbRun(
              "INSERT INTO Certificate (cert_id, degree_name, issue_date, grade_cgpa, status, cert_hash, ipfs_cid, student_id, univ_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [certId, "Bachelor of Technology", issueDate, record.cgpa, "Active", certHashRaw, ipfsCid, student.student_id, university.univ_id]
            );

            // Insert Blockchain Record
            await dbRun(
              "INSERT INTO BlockchainRecord (tx_hash, block_number, timestamp, network, contract_address, cert_id) VALUES (?, ?, ?, ?, ?, ?)",
              [txHash, blockNumber, new Date().toISOString(), "Ethereum Local/Sepolia", process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3", certId]
            );

            successfulIssuances.push({ rollNo: record.rollNo, name: record.name, certId, certHash: certHashRaw, txHash });

          } catch (issueErr) {
            console.error(`Failed to issue degree for student ${record.rollNo}:`, issueErr);
            failedIssuances.push({ record, reason: issueErr.message });
          }
        }

        res.status(200).json({
          message: "Bulk upload processing completed.",
          aiAuditReport: aiResult,
          summary: {
            totalProcessed: parsedRecords.length,
            successCount: successfulIssuances.length,
            failureCount: failedIssuances.length
          },
          issued: successfulIssuances,
          failed: failedIssuances
        });

      } catch (innerError) {
        console.error("Bulk upload compilation error:", innerError);
        res.status(500).json({ error: "Internal server error processing bulk CSV." });
      }
    })
    .on("error", (csvErr) => {
      console.error("CSV parsing error:", csvErr);
      res.status(500).json({ error: "Failed to parse CSV file." });
    });
};

/**
 * Retrieve system dashboard statistics.
 */
export const getDashboardStats = async (req, res) => {
  try {
    const didCount = await dbGet("SELECT COUNT(*) as count FROM Student WHERE did IS NOT NULL");
    const certCount = await dbGet("SELECT COUNT(*) as count FROM Certificate");
    const blockCount = await dbGet("SELECT COUNT(*) as count FROM BlockchainRecord");
    const verifiedCount = await dbGet("SELECT COUNT(*) as count FROM Verification WHERE status = 'Success'");

    // Fetch recent verifications
    const recentVerifications = await dbAll(`
      SELECT v.verify_id, v.verified_at, v.status, v.method, c.degree_name, s.full_name as student_name, s.student_id as roll_no
      FROM Verification v
      LEFT JOIN Certificate c ON v.cert_id = c.cert_id
      LEFT JOIN Student s ON c.student_id = s.student_id
      ORDER BY v.verified_at DESC
      LIMIT 10
    `);

    res.status(200).json({
      didsRegistered: didCount.count,
      credentialsIssued: certCount.count,
      blocksOnChain: blockCount.count,
      verifiedToday: verifiedCount.count,
      recentVerifications
    });
  } catch (error) {
    console.error("Fetch dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error fetching dashboard stats." });
  }
};
