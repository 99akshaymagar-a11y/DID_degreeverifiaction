import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Deploying DegreeVerifier contract...");
  const DegreeVerifier = await hre.ethers.getContractFactory("DegreeVerifier");
  const contract = await DegreeVerifier.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("DegreeVerifier deployed to:", address);

  // Ensure db directory exists
  const dbDir = path.resolve(__dirname, "../db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Write address to file
  const addressPath = path.join(dbDir, "contract_address.json");
  fs.writeFileSync(addressPath, JSON.stringify({ address }, null, 2), "utf8");
  console.log("Saved contract address to:", addressPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
