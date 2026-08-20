import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addressPath = path.resolve(__dirname, "../../db/contract_address.json");
const artifactPath = path.resolve(__dirname, "../../artifacts/contracts/DegreeVerifier.sol/DegreeVerifier.json");

// Default local Hardhat network settings
const PROVIDER_URL = process.env.BLOCKCHAIN_PROVIDER_URL || "http://127.0.0.1:8545";

// Default private key (first pre-funded account from local Hardhat node)
const DEFAULT_PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

/**
 * Gets a signer-bound contract instance.
 */
export const getContractInstance = (signerPrivateKey = null) => {
  const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
  
  // Read contract address from config/file
  let contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress && fs.existsSync(addressPath)) {
    const addrData = JSON.parse(fs.readFileSync(addressPath, "utf8"));
    contractAddress = addrData.address;
  }

  // Fallback for contractAddress in testing/mock environments
  if (!contractAddress) {
    // If the contract is not deployed yet, we use a placeholder or raise an error depending on execution
    throw new Error("Smart contract address not found. Please deploy the contract using scripts/deploy.js first.");
  }

  // Read ABI
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Smart contract artifact not found. Please compile the contract first using 'npx hardhat compile'.");
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  // Use custom private key if provided, otherwise default pre-funded account
  const key = signerPrivateKey || DEFAULT_PRIVATE_KEY;
  const wallet = new ethers.Wallet(key, provider);

  return new ethers.Contract(contractAddress, abi, wallet);
};
