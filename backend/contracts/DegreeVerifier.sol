// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DegreeVerifier
 * @dev A smart contract to register and verify degree hashes on the blockchain.
 * Supports decentralized identity anchoring and revocation.
 */
contract DegreeVerifier {
    address public admin;

    // Mapping to track authorized universities/issuers
    mapping(address => bool) public authorizedIssuers;

    struct Degree {
        bytes32 docHash;
        address issuer;
        uint256 blockTimestamp;
        bool isRevoked;
    }

    // Mapping from document hash to Degree details
    mapping(bytes32 => Degree) public degrees;

    event IssuerAuthorized(address indexed issuer);
    event IssuerDeauthorized(address indexed issuer);
    event DegreeIssued(bytes32 indexed docHash, address indexed issuer);
    event DegreeRevoked(bytes32 indexed docHash, address indexed issuer);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == admin || authorizedIssuers[msg.sender], "Not authorized to issue credentials");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    /**
     * @dev Authorize a university wallet to issue degrees.
     */
    function authorizeIssuer(address issuer) external onlyAdmin {
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    /**
     * @dev Deauthorize a university wallet from issuing degrees.
     */
    function deauthorizeIssuer(address issuer) external onlyAdmin {
        authorizedIssuers[issuer] = false;
        emit IssuerDeauthorized(issuer);
    }

    /**
     * @dev Issue and anchor a degree hash on-chain.
     */
    function issueDegree(bytes32 docHash) external onlyAuthorized {
        require(degrees[docHash].docHash == bytes32(0), "Degree hash already registered");
        
        degrees[docHash] = Degree({
            docHash: docHash,
            issuer: msg.sender,
            blockTimestamp: block.timestamp,
            isRevoked: false
        });

        emit DegreeIssued(docHash, msg.sender);
    }

    /**
     * @dev Revoke an issued degree hash (restricted to admin or original issuer).
     */
    function revokeDegree(bytes32 docHash) external onlyAuthorized {
        require(degrees[docHash].docHash != bytes32(0), "Degree hash not found");
        require(!degrees[docHash].isRevoked, "Degree already revoked");
        require(msg.sender == admin || degrees[docHash].issuer == msg.sender, "Only issuer or admin can revoke");

        degrees[docHash].isRevoked = true;
        emit DegreeRevoked(docHash, msg.sender);
    }

    /**
     * @dev Check if a degree hash is valid and returns details.
     */
    function verifyDegree(bytes32 docHash) external view returns (
        bool isValid,
        address issuer,
        uint256 blockTimestamp,
        bool isRevoked
    ) {
        Degree memory deg = degrees[docHash];
        if (deg.docHash == bytes32(0)) {
            return (false, address(0), 0, false);
        }
        return (!deg.isRevoked, deg.issuer, deg.blockTimestamp, deg.isRevoked);
    }
}
