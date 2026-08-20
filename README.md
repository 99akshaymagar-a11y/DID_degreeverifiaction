# MGMU SoET — Decentralized Identity & Degree Verification System

This is a blockchain-based academic degree verification and credential authentication system. The application uses **W3C Decentralized Identifiers (DIDs)**, **W3C Verifiable Credentials (VCs)**, **IPFS decentralized storage**, **Ethereum blockchain anchoring** (via Solidity smart contracts), and **AI Fraud Detection** (for CGPA anomaly check and unaccredited domain detection).

---

## Technical Stack & Architecture

-   **Frontend**: React (Vite) + Ethers.js (v6) + MetaMask
-   **Backend**: Node.js + Express.js + SQLite3
-   **Blockchain**: Solidity Smart Contract + Hardhat Ethereum Sandbox
-   **AI Fraud Engine**: Python 3 (CGPA statistical Z-score anomaly detector + domain lookup checks)
-   **IPFS**: Pinata IPFS Gateway integration (with a file-based mock fallback for offline out-of-the-box usage)

---

## Project Structure

```text
BlockChainDIDProject/
├── backend/
│   ├── contracts/
│   │   └── DegreeVerifier.sol        # Solidity Smart Contract
│   ├── scripts/
│   │   └── deploy.js                 # Contract deployment script
│   ├── src/
│   │   ├── ai/
│   │   │   └── fraud_detector.py     # Python AI anomaly detection service
│   │   ├── config/
│   │   │   ├── db.js                 # SQLite database setup & auto-seeding
│   │   │   └── blockchain.js         # Ethers.js blockchain connection helper
│   │   ├── controllers/
│   │   │   ├── authController.js     # User registration, JWT & profiles
│   │   │   ├── studentController.js  # Student DID mapping & resolved dids
│   │   │   ├── degreeController.js   # VC signing, IPFS uploading, and verification
│   │   │   └── bulkUploadController.js # CSV parsing, AI child-process call, bulk issue
│   │   ├── routes/
│   │   │   └── degreeRoutes.js       # Express routing
│   │   ├── app.js                    # Middleware configuration
│   │   └── index.js                  # Server entry point
│   ├── test/
│   │   └── DegreeVerifier.js         # Contract mocha/chai tests
│   ├── hardhat.config.js             # Hardhat network config
│   ├── package.json                  # Backend dependencies
│   └── .env                          # Configuration variables
├── App.jsx                           # React frontend main entry (updated)
├── package.json                      # Frontend package.json
└── README.md                         # This setup guide
```

---

## Step-by-Step Execution Guide

Follow these steps in order to start and test the complete system:

### Step 1: Open a terminal and run the Local Blockchain
Navigate to the `backend` folder and start the Hardhat local Ethereum node:
```bash
cd C:\BlockChainDIDProject\backend
npm run blockchain
```
*Note: Keep this terminal window open. It runs a local Ethereum node listening on `http://127.0.0.1:8545` and prints 20 pre-funded test accounts with their private keys.*

---

### Step 2: Open a second terminal and Deploy the Smart Contract
Deploy the Solidity contract to your running local blockchain:
```bash
cd C:\BlockChainDIDProject\backend
npm run deploy
```
*This compiles the contract, deploys it to the local node, and saves the contract address automatically in `backend/db/contract_address.json` so that the server can find it.*

---

### Step 3: Start the Backend API Server
In the same second terminal, start the Express API gateway:
```bash
npm start
```
*This initializes the SQLite database tables, seeds a default university profile and student credentials, and starts the server on `http://localhost:5000`.*

---

### Step 4: Run and open the Frontend App
Open a third terminal, navigate to the root folder, install dependencies, and start the Vite frontend server:
```bash
cd C:\BlockChainDIDProject
npm install
npm run dev
```
*Open `http://localhost:5173` (or the URL printed in the terminal) in your browser.*

---

## Testing Scenarios

1.  **MetaMask Connect**: Click **Connect Wallet** in the top-right corner. If MetaMask is installed, it connects to your wallet. If not, it falls back to a sandbox account for testing.
2.  **Student DID Registration**: Navigate to the **Student Portal** tab, enter details (e.g. name, roll number, email), and register. It registers your identity on the SQLite database and generates your DID: `did:ethr:0x...`.
3.  **Degree Issuance**: In **Issuer Portal**, enter a student's roll number and name to issue their degree on-chain. It signs a W3C Verifiable Credential, uploads it to IPFS, and anchors the document hash on the smart contract.
4.  **Bulk CSV Upload**:
    -   Go to **Issuer Portal -> Bulk Upload CSV**.
    -   Upload a CSV file (there is a demo CSV format shown on screen).
    -   The system parses the CSV, triggers the **Python AI Fraud Detector** to check for CGPA outliers or fake domains, and bulk issues degrees to all valid graduates on-chain in one click.
5.  **Verifier Page**: Search for a roll number (e.g., `CSE21001`) or credential ID. The system queries the Ethereum blockchain, verifies the signature, and prints a complete verification report.
