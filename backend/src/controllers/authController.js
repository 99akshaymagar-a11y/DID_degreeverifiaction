import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { dbRun, dbGet, dbAll } from "../config/db.js";
import { getContractInstance } from "../services/blockchainService.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_project_key_123";

export const register = async (req, res) => {
  console.log("Registering student/user request body:", req.body);
  const { 
    email, 
    password, 
    role, 
    name, 
    phone, 
    address, 
    accreditationNo, 
    walletAddress, 
    studentId, 
    dateOfBirth, 
    enrollmentDate, 
    univId, 
    orgName, 
    industry, 
    contactPerson,
    abcId,
    city,
    state,
    taxId,
    website,
    instType
  } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password, and role are required." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    let profileId = studentId || uuidv4().slice(0, 8);

    // Check if user already exists
    const existingUser = await dbGet("SELECT * FROM Users WHERE email = ? OR (profile_id = ? AND role = ?)", [email, profileId, role]);

    if (role === "University") {
      const wallet = walletAddress || "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const type = instType || "University";
      const verified = 0;
      
      const existingUniv = await dbGet("SELECT * FROM University WHERE email = ?", [email]);
      if (existingUniv) {
        profileId = existingUniv.univ_id;
        await dbRun(
          "UPDATE University SET univ_name = ?, address = ?, phone = ?, accreditation_no = ?, wallet_address = ?, city = ?, state = ?, inst_type = ?, tax_id = ?, website = ? WHERE univ_id = ?",
          [name || "Unnamed University", address || "", phone || "", accreditationNo || "", wallet, city || "", state || "", type, taxId || "", website || "", profileId]
        );
      } else {
        profileId = uuidv4().slice(0, 8);
        await dbRun(
          "INSERT INTO University (univ_id, univ_name, address, email, phone, accreditation_no, wallet_address, city, state, is_verified, inst_type, tax_id, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [profileId, name || "Unnamed University", address || "", email, phone || "", accreditationNo || "", wallet, city || "", state || "", verified, type, taxId || "", website || ""]
        );
      }
    } else if (role === "Student") {
      const wallet = walletAddress || "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const did = `did:ethr:${wallet.toLowerCase()}`;
      
      // Check if student profile already exists (e.g. from bulk upload)
      const existingStudent = await dbGet("SELECT * FROM Student WHERE student_id = ?", [profileId]);
      if (existingStudent) {
        // Update profile with wallet and DID
        await dbRun(
          "UPDATE Student SET wallet_address = ?, did = ?, abc_id = COALESCE(?, abc_id) WHERE student_id = ?",
          [wallet.toLowerCase(), did, abcId || null, profileId]
        );
      } else {
        // Insert new student profile
        await dbRun(
          "INSERT INTO Student (student_id, full_name, email, date_of_birth, enrollment_date, univ_id, wallet_address, did, abc_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [profileId, name || "Unnamed Student", email, dateOfBirth || "", enrollmentDate || "", univId || "univ_admin", wallet.toLowerCase(), did, abcId || null]
        );
      }
    } else if (role === "Employer") {
      profileId = uuidv4().slice(0, 8);
      await dbRun(
        "INSERT INTO Employer (employer_id, org_name, email, industry, contact_person) VALUES (?, ?, ?, ?, ?)",
        [profileId, orgName || "Unnamed Org", email, industry || "", contactPerson || name || ""]
      );
    }

    // Handle user account insert or update
    let userId;
    if (existingUser) {
      userId = existingUser.id;
      await dbRun(
        "UPDATE Users SET password_hash = ?, email = ? WHERE id = ?",
        [passwordHash, email, userId]
      );
    } else {
      userId = uuidv4();
      await dbRun(
        "INSERT INTO Users (id, email, password_hash, role, profile_id) VALUES (?, ?, ?, ?, ?)",
        [userId, email, passwordHash, role, profileId]
      );
    }

    res.status(201).json({
      message: `${role} registered successfully.`,
      user: { id: userId, email, role, profileId }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error during registration." });
  }
};

export const login = async (req, res) => {
  const { email, username, password } = req.body;
  const loginIdentifier = username || email;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: "Username, Email, or ABC ID and password are required." });
  }

  try {
    let user = null;
    if (loginIdentifier.includes("@")) {
      user = await dbGet("SELECT * FROM Users WHERE email = ?", [loginIdentifier]);
    } else {
      // Find student by ABC ID or Roll Number, then resolve user profile
      const student = await dbGet("SELECT * FROM Student WHERE abc_id = ? OR student_id = ?", [loginIdentifier, loginIdentifier]);
      if (student) {
        user = await dbGet("SELECT * FROM Users WHERE profile_id = ? AND role = 'Student'", [student.student_id]);
      }
    }

    if (!user) {
      return res.status(400).json({ error: "Invalid login identifier or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid login identifier or password." });
    }

    // Fetch profile details based on role
    let profile = null;
    if (user.role === "University") {
      profile = await dbGet("SELECT * FROM University WHERE univ_id = ?", [user.profile_id]);
    } else if (user.role === "Student") {
      profile = await dbGet("SELECT * FROM Student WHERE student_id = ?", [user.profile_id]);
    } else if (user.role === "Employer") {
      profile = await dbGet("SELECT * FROM Employer WHERE employer_id = ?", [user.profile_id]);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, profileId: user.profile_id },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileId: user.profile_id,
        profile
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login." });
  }
};

export const verifyInstitution = async (req, res) => {
  const { univId } = req.body;
  if (!univId) {
    return res.status(400).json({ error: "Institution ID is required." });
  }
  try {
    await dbRun("UPDATE University SET is_verified = 1 WHERE univ_id = ?", [univId]);
    res.status(200).json({ message: "Institution successfully verified and approved." });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Internal server error during validation." });
  }
};

/**
 * Fetch all registered universities and course academies in the database.
 */
export const getAllInstitutions = async (req, res) => {
  try {
    const list = await dbAll(`
      SELECT univ_id, univ_name, wallet_address, city, state, is_verified, inst_type, tax_id, website, license_path 
      FROM University
    `);

    let contract = null;
    try {
      contract = getContractInstance();
    } catch (bcError) {
      console.warn("Failed to get contract instance for institutions check:", bcError.message);
    }

    const listWithOnChain = await Promise.all(list.map(async (inst) => {
      let isAuthorizedOnChain = false;
      if (contract && inst.wallet_address) {
        try {
          isAuthorizedOnChain = await contract.authorizedIssuers(inst.wallet_address.toLowerCase());
        } catch (err) {
          console.warn(`Failed to check on-chain status for ${inst.wallet_address}:`, err.message);
        }
      }
      return {
        ...inst,
        is_authorized_onchain: isAuthorizedOnChain ? 1 : 0
      };
    }));

    res.status(200).json(listWithOnChain);
  } catch (error) {
    console.error("Fetch all institutions error:", error);
    res.status(500).json({ error: "Internal server error fetching institutions list." });
  }
};
