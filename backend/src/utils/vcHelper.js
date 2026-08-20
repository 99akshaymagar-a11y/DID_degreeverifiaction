import { ethers } from "ethers";

/**
 * Creates a W3C compliant Verifiable Credential structure.
 */
export const createDegreeVC = (studentName, studentRollNo, studentDID, degreeName, gradeCgpa, year, universityName, universityDID, expiryDate) => {
  const vc = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "id": `urn:uuid:${studentRollNo.toLowerCase()}-${Date.now()}`,
    "type": ["VerifiableCredential", "UniversityDegreeCredential"],
    "issuer": universityDID,
    "issuanceDate": new Date().toISOString(),
    "credentialSubject": {
      "id": studentDID,
      "name": studentName,
      "rollNumber": studentRollNo,
      "degree": degreeName,
      "gradeCgpa": gradeCgpa,
      "passingYear": year,
      "institution": universityName
    }
  };
  if (expiryDate) {
    vc.expirationDate = expiryDate;
  }
  return vc;
};

/**
 * Sign a W3C VC payload using the issuer's private key.
 */
export const signVC = async (vcPayload, privateKey) => {
  const wallet = new ethers.Wallet(privateKey);
  
  // Create canonical string representation of payload for signing
  const message = JSON.stringify(vcPayload);
  
  // Sign the message string
  const signature = await wallet.signMessage(message);
  
  // Attach W3C proof block
  return {
    ...vcPayload,
    "proof": {
      "type": "JsonWebSignature2020",
      "created": new Date().toISOString(),
      "proofPurpose": "assertionMethod",
      "verificationMethod": `${vcPayload.issuer}#controller`,
      "jws": signature
    }
  };
};

/**
 * Verifies the cryptographic signature of a W3C VC and returns the recovered issuer address.
 */
export const verifyVC = (signedVC) => {
  try {
    if (!signedVC.proof || !signedVC.proof.jws) {
      return { isValid: false, error: "No signature proof found in VC" };
    }

    const vcWithoutProof = { ...signedVC };
    delete vcWithoutProof.proof;

    const signature = signedVC.proof.jws;
    const message = JSON.stringify(vcWithoutProof);

    // Recover signing address
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // Extract address from issuer's DID (did:ethr:0x...)
    const issuerDID = signedVC.issuer;
    const expectedAddress = issuerDID.split(":").pop();

    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    return {
      isValid,
      recoveredAddress,
      issuerAddress: expectedAddress
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
};
