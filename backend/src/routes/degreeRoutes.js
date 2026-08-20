import express from "express";
import multer from "multer";
import os from "os";
import { register, login, verifyInstitution, getAllInstitutions } from "../controllers/authController.js";
import { registerDID, getDIDByRollNo, getAllDIDs, getVerificationHistory, getAllStudents } from "../controllers/studentController.js";
import { issueDegree, verifyDegree, verifyDegreeByFile, revokeDegree, getAllCertificates, downloadDegreePDF, getBlockchainEvents, authorizeInstitutionOnChain, deauthorizeInstitutionOnChain } from "../controllers/degreeController.js";
import { bulkUploadCSV, getDashboardStats, checkFraudDirectly } from "../controllers/bulkUploadController.js";
import { 
  resolveAndAuditIPFS, 
  generateConsentTicket, 
  verifyConsentTicket, 
  getCredits, 
  transferCredits, 
  getMultiSigProposals, 
  approveMultiSigProposal 
} from "../controllers/advancedController.js";

import { requireAuth, requireApiKey, rateLimiter } from "../middleware/authMiddleware.js";
import { getCourses, manageCourse, enrollCourse, submitQuiz, approveCourseCert, getEnrollments } from "../controllers/courseController.js";

const router = express.Router();

// Multer configurations
const uploadMemory = multer({ storage: multer.memoryStorage() });
const uploadDisk = multer({ dest: os.tmpdir() });

// Auth routes
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/verify-institution", verifyInstitution);
router.get("/auth/institutions", getAllInstitutions);

// DID routes
router.post("/students/register-did", registerDID);
router.get("/students/did/:rollNo", getDIDByRollNo);
router.get("/students/dids", getAllDIDs);
router.get("/students/all", getAllStudents);
router.get("/students/verification-history/:studentId", getVerificationHistory);

// Degree routes
router.post("/credentials/issue", requireAuth(["University", "Admin"]), issueDegree);
router.post("/credentials/verify", verifyDegree);
router.post("/credentials/verify-file", uploadMemory.single("file"), verifyDegreeByFile);
router.post("/credentials/revoke", requireAuth(["University", "Admin"]), revokeDegree);
router.get("/credentials/all", getAllCertificates);
router.get("/credentials/download-pdf/:id", downloadDegreePDF);
router.get("/blockchain/events", getBlockchainEvents);
router.post("/blockchain/authorize-issuer", requireAuth(["University", "Admin"]), authorizeInstitutionOnChain);
router.post("/blockchain/deauthorize-issuer", requireAuth(["University", "Admin"]), deauthorizeInstitutionOnChain);

// Bulk and dashboard stats routes
router.post("/credentials/bulk-issue", requireAuth(["University", "Admin"]), uploadDisk.single("file"), bulkUploadCSV);
router.get("/dashboard/stats", getDashboardStats);
router.post("/ai/check-fraud", requireAuth(["University", "Admin"]), checkFraudDirectly);

// Advanced features endpoints
router.get("/credentials/ipfs-resolve/:cid", resolveAndAuditIPFS);
router.post("/consent/generate", generateConsentTicket);
router.post("/consent/verify", verifyConsentTicket);
router.get("/credits/abc/:abcId", getCredits);
router.post("/credits/transfer", transferCredits);
router.get("/multisig/proposals", getMultiSigProposals);
router.post("/multisig/approve", requireAuth(["University", "Admin"]), approveMultiSigProposal);
router.post("/multisig/sign", requireAuth(["University", "Admin"]), approveMultiSigProposal);

// Courses & quiz routes
router.get("/courses", getCourses);
router.post("/courses", requireAuth(["University", "Admin"]), manageCourse);
router.post("/courses/enroll", requireAuth("Student"), enrollCourse);
router.post("/courses/submit", requireAuth("Student"), submitQuiz);
router.post("/courses/approve", requireAuth(["University", "Admin"]), approveCourseCert);
router.get("/courses/enrollments", requireAuth(["Student", "University", "Admin"]), getEnrollments);

// Programmatic External Verification API
router.post("/external/verify", requireApiKey, rateLimiter, verifyDegree);

export default router;
