import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockIpfsDir = path.resolve(__dirname, "../../db/ipfs_mock");

// Ensure mock IPFS directory exists
if (!fs.existsSync(mockIpfsDir)) {
  fs.mkdirSync(mockIpfsDir, { recursive: true });
}

/**
 * Generates a mock IPFS CID (Qm...) from content.
 */
const generateMockCID = (content) => {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  let hash = 0;
  const str = typeof content === "string" ? content : JSON.stringify(content);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  let cid = "Qm";
  let val = Math.abs(hash);
  for (let i = 0; i < 44; i++) {
    cid += chars[(val + i * 17) % chars.length];
  }
  return cid;
};

/**
 * Upload JSON metadata to IPFS (via Pinata if credentials are in .env, otherwise mock)
 */
export const uploadJSONToIPFS = async (jsonData) => {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  if (pinataApiKey && pinataSecretKey) {
    try {
      console.log("Pinata API keys found. Uploading to real IPFS...");
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "pinata_api_key": pinataApiKey,
          "pinata_secret_api_key": pinataSecretKey
        },
        body: JSON.stringify({
          pinataContent: jsonData,
          pinataMetadata: {
            name: jsonData.id || "degree_credential"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Pinata error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.IpfsHash; // Real CID
    } catch (error) {
      console.error("Pinata upload failed, falling back to local IPFS mock:", error.message);
    }
  }

  // Fallback to local file-based mock IPFS storage
  const cid = generateMockCID(jsonData);
  const filePath = path.join(mockIpfsDir, `${cid}.json`);
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");
  console.log(`Stored mock IPFS file locally at: ${filePath} (CID: ${cid})`);
  return cid;
};

/**
 * Retrieve JSON metadata from IPFS (from Pinata gateway or mock local storage)
 */
export const getJSONFromIPFS = async (cid) => {
  const localPath = path.join(mockIpfsDir, `${cid}.json`);

  // 1. If it exists in local mock storage, return it directly
  if (fs.existsSync(localPath)) {
    const data = fs.readFileSync(localPath, "utf8");
    return JSON.parse(data);
  }

  // 2. Otherwise, fetch from public IPFS gateways
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`
  ];

  for (const url of gateways) {
    try {
      console.log(`Fetching from IPFS gateway: ${url}`);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`Gateway fetch failed for ${url}:`, err.message);
    }
  }

  throw new Error(`Could not retrieve metadata for IPFS CID: ${cid}`);
};
