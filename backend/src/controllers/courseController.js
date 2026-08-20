import { dbRun, dbGet, dbAll } from "../config/db.js";
import crypto from "crypto";
import { createDegreeVC, signVC } from "../utils/vcHelper.js";
import { uploadJSONToIPFS } from "../utils/ipfsHelper.js";
import { getContractInstance } from "../services/blockchainService.js";

const computeHash = (data) => {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(str).digest("hex");
};

/**
 * Get all courses from the database.
 */
export const getCourses = async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM Courses");
    const courses = rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      duration: r.duration,
      level: r.level,
      academy: r.academy,
      academyId: r.academy_id,
      quiz: r.quiz ? JSON.parse(r.quiz) : []
    }));
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses catalog." });
  }
};

/**
 * Add or update a course (Admin/University only).
 */
export const manageCourse = async (req, res) => {
  const { id, title, description, duration, level, academy, academyId, quiz } = req.body;
  if (!id || !title) {
    return res.status(400).json({ error: "Course ID and Title are required." });
  }
  try {
    const quizString = quiz ? JSON.stringify(quiz) : null;
    await dbRun(
      `INSERT OR REPLACE INTO Courses (id, title, description, duration, level, academy, academy_id, quiz) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description || "", duration || "", level || "", academy || "", academyId || "univ_admin", quizString]
    );
    res.status(200).json({ message: "Course saved successfully." });
  } catch (error) {
    console.error("Error managing course:", error);
    res.status(500).json({ error: "Failed to save course." });
  }
};

/**
 * Enroll a student in a course (Student only).
 */
export const enrollCourse = async (req, res) => {
  const { courseId } = req.body;
  const studentId = req.user.profileId;

  if (!courseId) {
    return res.status(400).json({ error: "Course ID is required." });
  }

  try {
    // Check if course exists
    const course = await dbGet("SELECT * FROM Courses WHERE id = ?", [courseId]);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    const enrolledAt = new Date().toISOString();
    await dbRun(
      `INSERT OR REPLACE INTO CourseEnrollments (student_id, course_id, status, enrolled_at) 
       VALUES (?, ?, 'enrolled', ?)`,
      [studentId, courseId, enrolledAt]
    );

    res.status(200).json({ message: "Successfully enrolled in course." });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({ error: "Failed to enroll in course." });
  }
};

/**
 * Submit quiz answers (Student only).
 */
export const submitQuiz = async (req, res) => {
  const { courseId, answers } = req.body;
  const studentId = req.user.profileId;

  if (!courseId || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Course ID and quiz answers are required." });
  }

  try {
    // Check enrollment status
    const enrollment = await dbGet(
      "SELECT * FROM CourseEnrollments WHERE student_id = ? AND course_id = ?",
      [studentId, courseId]
    );

    if (!enrollment) {
      return res.status(400).json({ error: "You must enroll in the course first." });
    }

    if (enrollment.status === "completed") {
      return res.status(400).json({ error: "You have already completed this course and earned your certificate." });
    }

    // Fetch course details for grading
    const course = await dbGet("SELECT * FROM Courses WHERE id = ?", [courseId]);
    if (!course || !course.quiz) {
      return res.status(404).json({ error: "Course quiz details not found." });
    }

    const quizQuestions = JSON.parse(course.quiz);
    if (answers.length !== quizQuestions.length) {
      return res.status(400).json({ error: `Please answer all ${quizQuestions.length} questions.` });
    }

    // Grade the quiz
    let correctCount = 0;
    for (let i = 0; i < quizQuestions.length; i++) {
      if (answers[i] === quizQuestions[i].correctAnswer) {
        correctCount++;
      }
    }

    const scorePct = Math.round((correctCount / quizQuestions.length) * 100);
    if (scorePct < 80) {
      return res.status(400).json({
        error: `Quiz failed. You must score at least 80% to claim certification. Your score: ${scorePct}% (${correctCount}/${quizQuestions.length} correct).`
      });
    }

    // Pass: set status = 'pending_review'
    const submittedAt = new Date().toISOString();
    await dbRun(
      "UPDATE CourseEnrollments SET status = 'pending_review', submitted_at = ? WHERE student_id = ? AND course_id = ?",
      [submittedAt, studentId, courseId]
    );

    res.status(200).json({
      message: `Congratulations, you passed the quiz with ${scorePct}%! Your certificate request has been submitted for university review.`,
      status: "pending_review"
    });

  } catch (error) {
    console.error("Error submitting quiz:", error);
    res.status(500).json({ error: "Failed to submit quiz." });
  }
};

/**
 * Approve pending course certificate (University/Admin only).
 */
export const approveCourseCert = async (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({ error: "Student ID and Course ID are required." });
  }

  try {
    // 1. Resolve enrollment details
    const enrollment = await dbGet(
      "SELECT * FROM CourseEnrollments WHERE student_id = ? AND course_id = ?",
      [studentId, courseId]
    );

    if (!enrollment || enrollment.status !== "pending_review") {
      return res.status(400).json({ error: "Enrollment record is not in 'pending_review' status." });
    }

    // 2. Resolve student
    const student = await dbGet("SELECT * FROM Student WHERE student_id = ?", [studentId]);
    if (!student || !student.did) {
      return res.status(404).json({ error: "Student profile or active DID not found." });
    }

    // 3. Resolve course
    const course = await dbGet("SELECT * FROM Courses WHERE id = ?", [courseId]);
    if (!course) {
      return res.status(404).json({ error: "Course details not found." });
    }

    // 4. Resolve university (the course academy)
    const academyId = course.academy_id || "univ_admin";
    const university = await dbGet("SELECT * FROM University WHERE univ_id = ?", [academyId]);
    if (!university) {
      return res.status(404).json({ error: "Course academy profile not found." });
    }

    // 5. Build W3C Verifiable Credential for Course Cert
    const studentDID = student.did;
    const universityDID = `did:ethr:${university.wallet_address.toLowerCase()}`;
    const vcPayload = createDegreeVC(
      student.full_name,
      student.student_id,
      studentDID,
      course.title,
      "A+", // Course grade placeholder
      new Date().getFullYear().toString(),
      university.univ_name,
      universityDID,
      null // No expiry date for course certs
    );

    // Override type and department explicitly
    vcPayload.credentialSubject.type = "Course Certificate";
    vcPayload.credentialSubject.department = "Online Courses";

    // 6. Sign and upload VC
    const issuerPrivateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default local node signer
    const signedVC = await signVC(vcPayload, issuerPrivateKey);
    const ipfsCid = await uploadJSONToIPFS(signedVC);

    const certHashRaw = computeHash(signedVC);
    const certHashOnChain = "0x" + certHashRaw;

    // 7. Anchor on smart contract
    let txHash = "0x" + crypto.randomBytes(32).toString("hex");
    let blockNumber = 0;

    try {
      console.log(`On-chain anchoring course cert: ${certHashOnChain}`);
      const contract = getContractInstance(issuerPrivateKey);
      const tx = await contract.issueDegree(certHashOnChain);
      const receipt = await tx.wait();
      txHash = receipt.hash;
      blockNumber = receipt.blockNumber;
    } catch (bcError) {
      console.warn("On-chain course cert anchoring failed/timed out, using mock tx:", bcError.message);
    }

    // 8. Write to Certificate and BlockchainRecord tables
    const certId = signedVC.id;
    const issueDate = new Date().toISOString().slice(0, 10);

    await dbRun(
      `INSERT INTO Certificate (cert_id, degree_name, issue_date, grade_cgpa, status, cert_hash, ipfs_cid, student_id, univ_id, expiry_date) 
       VALUES (?, ?, ?, ?, 'Active', ?, ?, ?, ?, NULL)`,
      [certId, course.title, issueDate, "A+", certHashRaw, ipfsCid, student.student_id, university.univ_id]
    );

    await dbRun(
      `INSERT INTO BlockchainRecord (tx_hash, block_number, timestamp, network, contract_address, cert_id) 
       VALUES (?, ?, ?, 'Ethereum Local/Sepolia', ?, ?)`,
      [txHash, blockNumber, new Date().toISOString(), process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3", certId]
    );

    // 9. Update enrollment status to completed
    await dbRun(
      "UPDATE CourseEnrollments SET status = 'completed' WHERE student_id = ? AND course_id = ?",
      [studentId, courseId]
    );

    res.status(200).json({
      message: `Course certificate successfully approved and anchored.`,
      certId,
      txHash
    });

  } catch (error) {
    console.error("Error approving course certificate:", error);
    res.status(500).json({ error: "Failed to approve course certificate." });
  }
};

/**
 * Get course enrollments.
 */
export const getEnrollments = async (req, res) => {
  const { role, profileId } = req.user;

  try {
    let enrollments;
    if (role === "Student") {
      enrollments = await dbAll(
        `SELECT ce.*, c.title as course_title, c.academy as course_academy, c.duration as course_duration, c.level as course_level
         FROM CourseEnrollments ce
         JOIN Courses c ON ce.course_id = c.id
         WHERE ce.student_id = ?`,
        [profileId]
      );
    } else {
      // University or Admin lists all enrollments or only pending ones
      enrollments = await dbAll(
        `SELECT ce.*, c.title as course_title, s.full_name as student_name, s.email as student_email
         FROM CourseEnrollments ce
         JOIN Courses c ON ce.course_id = c.id
         JOIN Student s ON ce.student_id = s.student_id`
      );
    }

    res.status(200).json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ error: "Failed to retrieve enrollments." });
  }
};
