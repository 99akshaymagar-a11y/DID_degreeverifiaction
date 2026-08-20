import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "../../db/database.sqlite");

// Ensure db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database at:", dbPath);
  }
});

// Promisify database methods for easy async/await usage
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

/**
 * Initialize database tables according to the project's ER diagram.
 */
export const initDatabase = async () => {
  console.log("Initializing database tables...");

  // Users table (for auth)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('Admin', 'University', 'Student', 'Employer')) NOT NULL,
      profile_id TEXT
    )
  `);

  // University table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS University (
      univ_id TEXT PRIMARY KEY,
      univ_name TEXT NOT NULL,
      address TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      accreditation_no TEXT,
      wallet_address TEXT NOT NULL,
      city TEXT,
      state TEXT,
      is_verified INTEGER DEFAULT 0,
      inst_type TEXT DEFAULT 'University',
      tax_id TEXT,
      website TEXT,
      license_path TEXT
    )
  `);

  // Student table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Student (
      student_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      date_of_birth TEXT,
      enrollment_date TEXT,
      univ_id TEXT,
      wallet_address TEXT,
      did TEXT UNIQUE,
      abc_id TEXT UNIQUE,
      FOREIGN KEY (univ_id) REFERENCES University(univ_id)
    )
  `);

  // Certificate table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Certificate (
      cert_id TEXT PRIMARY KEY,
      degree_name TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      grade_cgpa TEXT,
      status TEXT CHECK(status IN ('Active', 'Revoked')) NOT NULL DEFAULT 'Active',
      cert_hash TEXT UNIQUE NOT NULL,
      ipfs_cid TEXT,
      student_id TEXT NOT NULL,
      univ_id TEXT NOT NULL,
      expiry_date TEXT,
      FOREIGN KEY (student_id) REFERENCES Student(student_id),
      FOREIGN KEY (univ_id) REFERENCES University(univ_id)
    )
  `);

  // Run dynamic schema migration to add column if it doesn't exist
  try {
    await dbRun("ALTER TABLE Certificate ADD COLUMN expiry_date TEXT");
  } catch (err) {
    // Ignore error if column already exists
  }

  // BlockchainRecord table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS BlockchainRecord (
      tx_hash TEXT PRIMARY KEY,
      block_number INTEGER,
      timestamp TEXT NOT NULL,
      network TEXT NOT NULL,
      contract_address TEXT NOT NULL,
      cert_id TEXT UNIQUE NOT NULL,
      FOREIGN KEY (cert_id) REFERENCES Certificate(cert_id)
    )
  `);

  // Employer table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Employer (
      employer_id TEXT PRIMARY KEY,
      org_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      industry TEXT,
      contact_person TEXT
    )
  `);

  // Verification table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Verification (
      verify_id TEXT PRIMARY KEY,
      verified_at TEXT NOT NULL,
      status TEXT CHECK(status IN ('Success', 'Failed')) NOT NULL,
      method TEXT NOT NULL,
      ip_address TEXT,
      cert_id TEXT NOT NULL,
      employer_id TEXT,
      FOREIGN KEY (cert_id) REFERENCES Certificate(cert_id),
      FOREIGN KEY (employer_id) REFERENCES Employer(employer_id)
    )
  `);

  // CreditRecord table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS CreditRecord (
      credit_id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      abc_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      credits INTEGER NOT NULL,
      institution TEXT NOT NULL,
      status TEXT CHECK(status IN ('Earned', 'Transferred')) NOT NULL DEFAULT 'Earned',
      FOREIGN KEY (student_id) REFERENCES Student(student_id)
    )
  `);

  // AuthProposal table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS AuthProposal (
      proposal_id TEXT PRIMARY KEY,
      action_type TEXT CHECK(action_type IN ('AuthorizeUniversity', 'RevokeDegree')) NOT NULL,
      details TEXT NOT NULL,
      created_by TEXT NOT NULL,
      co_signed_by TEXT,
      status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL
    )
  `);

  // Migrate: add abc_id column to existing table if not present
  try {
    await dbRun("ALTER TABLE Student ADD COLUMN abc_id TEXT UNIQUE");
    console.log("Migration: Added abc_id column to Student table successfully.");
  } catch (err) {
    // Column already exists, ignore
  }

  // Migrate: add city and state columns to University if not present
  try {
    await dbRun("ALTER TABLE University ADD COLUMN city TEXT");
    console.log("Migration: Added city column to University table successfully.");
  } catch (err) {
    // Column already exists, ignore
  }
  try {
    await dbRun("ALTER TABLE University ADD COLUMN state TEXT");
    console.log("Migration: Added state column to University table successfully.");
  } catch (err) {
    // Column already exists, ignore
  }

  // Verification migrations
  try {
    await dbRun("ALTER TABLE University ADD COLUMN is_verified INTEGER DEFAULT 0");
    console.log("Migration: Added is_verified column to University successfully.");
  } catch (err) {}
  try {
    await dbRun("ALTER TABLE University ADD COLUMN inst_type TEXT DEFAULT 'University'");
    console.log("Migration: Added inst_type column to University successfully.");
  } catch (err) {}
  try {
    await dbRun("ALTER TABLE University ADD COLUMN tax_id TEXT");
    console.log("Migration: Added tax_id column to University successfully.");
  } catch (err) {}
  try {
    await dbRun("ALTER TABLE University ADD COLUMN website TEXT");
    console.log("Migration: Added website column to University successfully.");
  } catch (err) {}
  try {
    await dbRun("ALTER TABLE University ADD COLUMN license_path TEXT");
    console.log("Migration: Added license_path column to University successfully.");
  } catch (err) {}
 
  // Seed University admin and students if not exists
  const defaultEmail = "admin@soet.mgmu.ac.in";
  const existingUniv = await dbGet("SELECT * FROM University WHERE univ_id = 'univ_admin'");
  if (!existingUniv) {
    console.log("Seeding default database records for local testing...");
    
    // Insert University profile
    await dbRun(`
      INSERT INTO University (univ_id, univ_name, address, email, phone, accreditation_no, wallet_address, city, state, is_verified, inst_type, tax_id, website)
      VALUES ('univ_admin', 'Mahatma Gandhi Mission University (MGMU)', 'MGMU Campus, Aurangabad', ?, '0240-2481234', 'MGMU-SOET-2025', '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'Aurangabad', 'Maharashtra', 1, 'University', 'TAX-MGMU-1234', 'https://mgmu.ac.in')
    `, [defaultEmail]);

    // Seed a mock pending proposal for multi-sig testing
    await dbRun(`
      INSERT OR IGNORE INTO AuthProposal (proposal_id, action_type, details, created_by, co_signed_by, status, created_at)
      VALUES ('prop_1', 'AuthorizeUniversity', '{"univName":"Savitribai Phule Pune University (SPPU)","city":"Pune","state":"Maharashtra","accreditationNo":"SPPU-2025","wallet":"0x70997970C51812dc3A010C7d01b50e0d17dc79c8"}', 'univ_admin', NULL, 'Pending', '2026-07-15T10:00:00Z')
    `);

    // Insert user credentials for logging in
    const passwordHash = await bcrypt.hash("password123", 10);
    await dbRun(`
      INSERT OR IGNORE INTO Users (id, email, password_hash, role, profile_id)
      VALUES ('usr_admin_123', ?, ?, 'University', 'univ_admin')
    `, [defaultEmail, passwordHash]);
    
    console.log("Database seeded successfully.");
  }

  // Courses and Course Enrollments tables
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      duration TEXT,
      level TEXT,
      academy TEXT,
      academy_id TEXT,
      quiz TEXT
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS CourseEnrollments (
      student_id TEXT,
      course_id TEXT,
      status TEXT CHECK(status IN ('enrolled', 'pending_review', 'completed')) NOT NULL DEFAULT 'enrolled',
      enrolled_at TEXT NOT NULL,
      submitted_at TEXT,
      PRIMARY KEY (student_id, course_id),
      FOREIGN KEY (student_id) REFERENCES Student(student_id),
      FOREIGN KEY (course_id) REFERENCES Courses(id)
    )
  `);

  // Seed default courses if Courses table is empty
  const courseCount = await dbGet("SELECT COUNT(*) as count FROM Courses");
  if (courseCount.count === 0) {
    console.log("Seeding default online courses and quizzes...");
    const defaultCourses = [
      {
        id: "c1",
        title: "Introduction to Smart Contracts (Solidity)",
        duration: "4 Weeks",
        level: "Beginner",
        academy: "MGMU Coding Academy",
        academy_id: "univ_admin",
        description: "Learn solidity basics, variables, functions, modifiers, and deployment on local blockchain networks.",
        quiz: JSON.stringify([
          { id: "q1", question: "What is Solidity?", options: ["Object-oriented programming language for smart contracts", "A database client", "A front-end framework", "An operating system"], correctAnswer: 0 },
          { id: "q2", question: "Which keyword specifies that a function cannot read or modify the state?", options: ["view", "pure", "public", "payable"], correctAnswer: 1 },
          { id: "q3", question: "What is 'gas' in Ethereum?", options: ["The execution fee for running transactions", "Memory storage space", "A token name", "A web browser"], correctAnswer: 0 },
          { id: "q4", question: "What is a contract constructor?", options: ["A function executed only once during deployment", "A tool to build websites", "A debugging tool", "An external compiler"], correctAnswer: 0 },
          { id: "q5", question: "Which data structure is mapping most similar to?", options: ["Hash Table", "Linked List", "Binary Tree", "Array"], correctAnswer: 0 }
        ])
      },
      {
        id: "c2",
        title: "Advanced Web3 & DApp Development",
        duration: "8 Weeks",
        level: "Advanced",
        academy: "MGMU Coding Academy",
        academy_id: "univ_admin",
        description: "Learn front-end wallet integration, Ethers.js, event handling, and verifiable credentials integration.",
        quiz: JSON.stringify([
          { id: "q1", question: "What does Ethers.js do?", options: ["Connects frontend to Ethereum network", "Compiles Solidity", "Formats CSS files", "Stores database rows"], correctAnswer: 0 },
          { id: "q2", question: "What is a Web3 Provider?", options: ["Connection wrapper to blockchain node", "An internet service provider", "A CSS preprocessor", "A backend server"], correctAnswer: 0 },
          { id: "q3", question: "Which event listener syntax is correct in Ethers.js?", options: ["contract.on('Event', callback)", "contract.listen('Event')", "contract.addEvent()", "contract.emit()"], correctAnswer: 0 },
          { id: "q4", question: "How do you sign a transaction on the frontend?", options: ["Via a Signer like MetaMask", "With document.write", "With local storage", "With a CSS file"], correctAnswer: 0 },
          { id: "q5", question: "What does IPFS stand for?", options: ["InterPlanetary File System", "Internal Protocol File Storage", "Internet Public File Server", "Indexed Packet File Stream"], correctAnswer: 0 }
        ])
      },
      {
        id: "c3",
        title: "AI and Machine Learning with Python",
        duration: "6 Weeks",
        level: "Intermediate",
        academy: "MGMU AI Lab",
        academy_id: "univ_admin",
        description: "Learn neural networks, regression algorithms, model validation, and Z-score outlier detection models.",
        quiz: JSON.stringify([
          { id: "q1", question: "What does Z-score help identify?", options: ["Outliers in a dataset", "Database speed", "Blockchain hash speed", "CSS grid margins"], correctAnswer: 0 },
          { id: "q2", question: "Which library is widely used for data manipulation in Python?", options: ["Pandas", "Ethers", "Hardhat", "React"], correctAnswer: 0 },
          { id: "q3", question: "What is overfitting in machine learning?", options: ["Model performs well on training data but poorly on unseen data", "Model is too small", "Running the model too fast", "Compiling errors"], correctAnswer: 0 },
          { id: "q4", question: "What is regression used for?", options: ["Predicting continuous numeric values", "Classifying categories", "Generating images", "Hashing files"], correctAnswer: 0 },
          { id: "q5", question: "What is the standard deviation?", options: ["Measure of variation/dispersion in data", "Average of all data points", "Highest value in data", "A type of neural network"], correctAnswer: 0 }
        ])
      },
      {
        id: "c4",
        title: "Cloud Systems & DevOps Foundations",
        duration: "5 Weeks",
        level: "Beginner",
        academy: "MGMU Extension Academy",
        academy_id: "univ_admin",
        description: "Introduction to Docker containerization, mock IPFS servers, and production-ready server deployments.",
        quiz: JSON.stringify([
          { id: "q1", question: "What is Docker?", options: ["Platform to containerize applications", "A text editor", "A smart contract", "A database table"], correctAnswer: 0 },
          { id: "q2", question: "What does CI/CD stand for?", options: ["Continuous Integration / Continuous Deployment", "Code Inspector / Code Debugger", "Cloud Integration / Cloud Database", "Connection Identifier"], correctAnswer: 0 },
          { id: "q3", question: "What is the primary benefit of containerization?", options: ["Consistent environment across developer and production", "Faster internet speed", "Higher Z-score", "Automated code generation"], correctAnswer: 0 },
          { id: "q4", question: "What is Kubernetes?", options: ["An orchestrator for containers", "A programming language", "A mock server", "A blockchain wallet"], correctAnswer: 0 },
          { id: "q5", question: "What is mock IPFS used for in development?", options: ["Local file storage simulation without public network", "Mining blocks", "Rendering UI templates", "Encrypting passwords"], correctAnswer: 0 }
        ])
      }
    ];

    for (const c of defaultCourses) {
      await dbRun(
        "INSERT INTO Courses (id, title, description, duration, level, academy, academy_id, quiz) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [c.id, c.title, c.description, c.duration, c.level, c.academy, c.academy_id, c.quiz]
      );
    }
    console.log("Online courses and quizzes seeded successfully.");
  }

  console.log("Database tables initialized successfully.");
};

export default db;
