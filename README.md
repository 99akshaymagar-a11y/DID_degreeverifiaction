# 🔐 MGMU SoET — Decentralized Identity & Degree Verification System

> **Final Year B.Tech Project** | School of Engineering & Technology | CSE ICBT Department  
> Mahatma Gandhi Mission University (MGMU)

![Built with Ethereum](https://img.shields.io/badge/Blockchain-Ethereum%20Sepolia-blue)
![IPFS](https://img.shields.io/badge/Storage-IPFS%20%2F%20Pinata-65c2cb)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)
![W3C DID](https://img.shields.io/badge/Standard-W3C%20DID%20v1.0-navy)
![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange)

---

## 📌 About

A blockchain-powered academic credential verification platform that allows:
- 🎓 **Students** to register a Decentralized Identifier (DID) and own their degree credentials
- 🏛️ **University admins** (SoET) to issue tamper-proof Verifiable Credentials on Ethereum
- 🔍 **Employers & institutions** to instantly verify any MGMU degree — no middleman, no waiting

Built on the **W3C DID Core v1.0** standard with Ethereum (Sepolia Testnet) and IPFS for decentralized storage.

---

## 🚀 Live Demo

> 🌐 **[https://mgmu-did.pages.dev](https://mgmu-did.pages.dev)** *(update after deploy)*

---

## ✨ Features

| Feature | Description |
|---|---|
| 🪪 DID Registration | Students create blockchain identity (`did:ethr:0x…`) |
| 📄 Verifiable Credentials | Degrees issued as W3C VCs, signed by university |
| 📦 IPFS Storage | Encrypted credentials on IPFS via Pinata |
| ⛓️ On-Chain Anchoring | IPFS hash stored on Ethereum Sepolia |
| 📱 QR Code Sharing | One QR = instant employer verification |
| 📂 Bulk CSV Upload | Issue credentials to all graduates at once |
| 🔍 Instant Verification | Employers verify by name, roll no, or DID |
| 🔒 Revocation | University can revoke credentials on-chain |
| 📱 Responsive | Works on mobile and desktop |
| 🦊 MetaMask | Wallet connect for on-chain transactions |

---

## 🏗️ Tech Stack

```
Frontend      → React 18 + Vite 5
Blockchain    → Ethereum Sepolia Testnet
Smart Contracts → Solidity + Hardhat
Wallet        → MetaMask + ethers.js v6
Storage       → IPFS via Pinata
Standard      → W3C DID Core v1.0 + Verifiable Credentials v1.0
Deployment    → Cloudflare Pages + GitHub Actions
```

---

## 📁 Project Structure

```
mgmu-did-system/
├── public/
│   ├── favicon.svg          # MGMU shield icon
│   └── _redirects           # Cloudflare SPA routing
├── src/
│   ├── App.jsx              # Main app (all pages + components)
│   └── main.jsx             # React entry point
├── .github/
│   └── workflows/
│       └── deploy.yml       # Auto-deploy to Cloudflare Pages
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── wrangler.toml            # Cloudflare Pages config
├── package.json             # Dependencies
├── .gitignore
└── README.md
```

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+ → [nodejs.org](https://nodejs.org)
- Git → [git-scm.com](https://git-scm.com)
- MetaMask browser extension → [metamask.io](https://metamask.io)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/mgmu-did-system.git
cd mgmu-did-system

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# → http://localhost:5173
```

---

## 🚀 Deployment Guide

### GitHub Setup

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit: MGMU DID System"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/mgmu-did-system.git
git branch -M main
git push -u origin main
```

### Cloudflare Pages Deployment

**Option A — Automatic (Recommended)**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click **Create a project** → **Connect to Git**
3. Select your GitHub repo: `mgmu-did-system`
4. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** `18`
5. Click **Save and Deploy**
6. Add your college domain in **Custom Domains** tab

**Option B — GitHub Actions (Auto on every push)**

Add these secrets to your GitHub repo → Settings → Secrets:
```
CLOUDFLARE_API_TOKEN   → Your Cloudflare API token
CLOUDFLARE_ACCOUNT_ID  → Your Cloudflare account ID
```

Every `git push` to `main` will auto-deploy to Cloudflare Pages.

---

## 🔧 Connecting Real Blockchain (Production)

### 1. Get Sepolia Test ETH
Visit [sepoliafaucet.com](https://sepoliafaucet.com) — free test ETH for transactions.

### 2. Alchemy Node (Free)
1. Sign up at [alchemy.com](https://alchemy.com)
2. Create app → Select **Ethereum Sepolia**
3. Copy your RPC URL

### 3. Pinata IPFS (Free)
1. Sign up at [pinata.cloud](https://pinata.cloud)
2. Create API key
3. Use in credential upload

### 4. Environment Variables
Create `.env` file (never commit this):
```env
VITE_ALCHEMY_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET=your_pinata_secret
VITE_DID_REGISTRY_CONTRACT=0x...deployed_contract_address
```

---

## 📖 How It Works

```
Student                University Admin             Employer
   │                         │                         │
   │  1. Register DID         │                         │
   │─────────────────────────▶ Ethereum Sepolia         │
   │                         │                         │
   │  2. Issue Degree VC      │                         │
   │◀────────────────────────│                         │
   │       VC signed +        │                         │
   │       stored on IPFS     │                         │
   │                         │                         │
   │  3. Share QR Code        │                         │
   │─────────────────────────────────────────────────▶ │
   │                         │                         │
   │                         │  4. Verify on-chain     │
   │                         │◀────────────────────────│
   │                         │    ✅ Verified in 2s    │
```

---

## 👥 Team — CSE ICBT 2025

| Member | Role |
|---|---|
| [Member 1] | Frontend Developer |
| [Member 2] | Blockchain / Solidity |
| [Member 3] | Backend & IPFS Integration |
| [Member 4] | Project Lead & Deployment |

**Guide:** [Guide Name] | Department of CSE | SoET MGMU

---

## 📚 References & Standards

- [W3C DID Core v1.0](https://www.w3.org/TR/did-core/) — Sporny et al. (2022)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) — Sporny et al. (2019)
- [did:ethr Method Spec](https://github.com/decentralized-identity/ethr-did) — Reed et al. (2020)
- [IPFS Whitepaper](https://ipfs.tech/whitepaper.pdf) — Benet (2014)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) — Wood (2014)

---

## 📄 License

This project is developed for academic purposes at MGMU SoET CSE ICBT Department.  
© 2025 MGMU — School of Engineering & Technology.

---

<div align="center">
  <strong>🏛️ Mahatma Gandhi Mission University</strong><br/>
  School of Engineering & Technology | CSE ICBT<br/>
  Final Year Project — 2024–2025
</div>
