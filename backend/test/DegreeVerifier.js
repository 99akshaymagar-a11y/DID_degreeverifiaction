import pkg from "chai";
const { expect } = pkg;
import hre from "hardhat";
const { ethers } = hre;

describe("DegreeVerifier Contract", function () {
  let DegreeVerifier;
  let contract;
  let admin;
  let university;
  let university2;
  let externalUser;

  beforeEach(async function () {
    [admin, university, university2, externalUser] = await ethers.getSigners();
    DegreeVerifier = await ethers.getContractFactory("DegreeVerifier");
    contract = await DegreeVerifier.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await contract.admin()).to.equal(admin.address);
    });

    it("Should authorize the admin by default", async function () {
      expect(await contract.authorizedIssuers(admin.address)).to.equal(true);
    });
  });

  describe("Issuer Management", function () {
    it("Should allow admin to authorize a university", async function () {
      await contract.connect(admin).authorizeIssuer(university.address);
      expect(await contract.authorizedIssuers(university.address)).to.equal(true);
    });

    it("Should allow admin to deauthorize a university", async function () {
      await contract.connect(admin).authorizeIssuer(university.address);
      await contract.connect(admin).deauthorizeIssuer(university.address);
      expect(await contract.authorizedIssuers(university.address)).to.equal(false);
    });

    it("Should prevent non-admin from authorizing/deauthorizing", async function () {
      await expect(
        contract.connect(externalUser).authorizeIssuer(university.address)
      ).to.be.revertedWith("Only admin can call this function");
    });
  });

  describe("Degree Issuance", function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("Test Degree Metadata"));

    it("Should allow authorized issuers to issue degrees", async function () {
      await contract.connect(admin).authorizeIssuer(university.address);
      await expect(contract.connect(university).issueDegree(docHash))
        .to.emit(contract, "DegreeIssued")
        .withArgs(docHash, university.address);

      const [isValid, issuer, , isRevoked] = await contract.verifyDegree(docHash);
      expect(isValid).to.equal(true);
      expect(issuer).to.equal(university.address);
      expect(isRevoked).to.equal(false);
    });

    it("Should prevent unauthorized users from issuing degrees", async function () {
      await expect(
        contract.connect(externalUser).issueDegree(docHash)
      ).to.be.revertedWith("Not authorized to issue credentials");
    });

    it("Should prevent duplicate degree hashes", async function () {
      await contract.connect(admin).issueDegree(docHash);
      await expect(contract.connect(admin).issueDegree(docHash)).to.be.revertedWith(
        "Degree hash already registered"
      );
    });
  });

  describe("Degree Revocation", function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("Revocation Target"));

    beforeEach(async function () {
      await contract.connect(admin).authorizeIssuer(university.address);
      await contract.connect(university).issueDegree(docHash);
    });

    it("Should allow the issuer to revoke the degree", async function () {
      await expect(contract.connect(university).revokeDegree(docHash))
        .to.emit(contract, "DegreeRevoked")
        .withArgs(docHash, university.address);

      const [isValid, , , isRevoked] = await contract.verifyDegree(docHash);
      expect(isValid).to.equal(false);
      expect(isRevoked).to.equal(true);
    });

    it("Should allow the admin to revoke the degree", async function () {
      await expect(contract.connect(admin).revokeDegree(docHash))
        .to.emit(contract, "DegreeRevoked")
        .withArgs(docHash, admin.address);

      const [isValid] = await contract.verifyDegree(docHash);
      expect(isValid).to.equal(false);
    });

    it("Should prevent other authorized issuers from revoking the degree", async function () {
      await contract.connect(admin).authorizeIssuer(university2.address);
      await expect(
        contract.connect(university2).revokeDegree(docHash)
      ).to.be.revertedWith("Only issuer or admin can revoke");
    });

    it("Should prevent completely unauthorized users from calling revoke", async function () {
      await expect(
        contract.connect(externalUser).revokeDegree(docHash)
      ).to.be.revertedWith("Not authorized to issue credentials");
    });
  });
});
