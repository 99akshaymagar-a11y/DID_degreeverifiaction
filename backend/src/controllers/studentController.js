import { dbRun, dbGet, dbAll } from "../config/db.js";

/**
 * Register student wallet and DID.
 */
export const registerDID = async (req, res) => {
  const { rollNo, walletAddress } = req.body;

  if (!rollNo || !walletAddress) {
    return res.status(400).json({ error: "Roll number and wallet address are required." });
  }

  try {
    // Check if student exists (by roll number / student_id or email)
    const student = await dbGet("SELECT * FROM Student WHERE student_id = ? OR email LIKE ?", [rollNo, `%${rollNo}%`]);
    if (!student) {
      return res.status(404).json({ error: "Student record not found. Please contact administration." });
    }

    const did = `did:ethr:${walletAddress.toLowerCase()}:${student.student_id.toLowerCase()}`;

    // Update wallet address and DID in the student profile
    await dbRun(
      "UPDATE Student SET wallet_address = ?, did = ? WHERE student_id = ?",
      [walletAddress.toLowerCase(), did, student.student_id]
    );

    res.status(200).json({
      message: "DID registered successfully.",
      did,
      student: {
        id: student.student_id,
        name: student.full_name,
        email: student.email,
        walletAddress,
        did
      }
    });
  } catch (error) {
    console.error("DID registration error:", error);
    res.status(500).json({ error: "Internal server error during DID registration." });
  }
};

/**
 * Fetch DID details of a student by Roll Number.
 */
export const getDIDByRollNo = async (req, res) => {
  const { rollNo } = req.params;

  try {
    const student = await dbGet("SELECT * FROM Student WHERE student_id = ?", [rollNo]);
    if (!student || !student.did) {
      return res.status(404).json({ error: "DID not found or not registered for this student." });
    }

    res.status(200).json({
      did: student.did,
      name: student.full_name,
      rollNo: student.student_id,
      walletAddress: student.wallet_address
    });
  } catch (error) {
    console.error("Fetch DID error:", error);
    res.status(500).json({ error: "Internal server error fetching DID." });
  }
};

/**
 * Get all registered DIDs (for admin view).
 */
export const getAllDIDs = async (req, res) => {
  try {
    const students = await dbAll("SELECT student_id, full_name, email, wallet_address, did FROM Student WHERE did IS NOT NULL");
    res.status(200).json(students);
  } catch (error) {
    console.error("Fetch all DIDs error:", error);
    res.status(500).json({ error: "Internal server error fetching DIDs." });
  }
};

/**
 * Fetch verification logs for a student's certificates.
 */
export const getVerificationHistory = async (req, res) => {
  const { studentId } = req.params;
  try {
    const logs = await dbAll(`
      SELECT v.verify_id, v.verified_at, v.status, v.method, v.ip_address, c.degree_name
      FROM Verification v
      JOIN Certificate c ON v.cert_id = c.cert_id
      WHERE c.student_id = ?
      ORDER BY v.verified_at DESC
    `, [studentId]);
    res.status(200).json(logs);
  } catch (error) {
    console.error("Fetch verification history error:", error);
    res.status(500).json({ error: "Internal server error fetching verification history." });
  }
};

/**
 * Fetch all registered student profiles with their certificate counts.
 */
export const getAllStudents = async (req, res) => {
  try {
    const students = await dbAll(`
      SELECT s.*, 
             (SELECT COUNT(*) FROM Certificate c WHERE c.student_id = s.student_id) as cert_count
      FROM Student s
    `);
    res.status(200).json(students);
  } catch (error) {
    console.error("Fetch all students error:", error);
    res.status(500).json({ error: "Internal server error fetching students." });
  }
};
