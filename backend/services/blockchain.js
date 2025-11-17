const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// Try to load contract artifact, but handle if it doesn't exist yet
let InsuranceLedger = null;
const contractPath = path.join(__dirname, '../../smart-contracts/artifacts/contracts/InsuranceLedger.sol/InsuranceLedger.json');
if (fs.existsSync(contractPath)) {
  InsuranceLedger = require(contractPath);
}

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = process.env.SMART_CONTRACT_ADDRESS;
    this.init();
  }

  async init() {
    try {
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

      // Check if private key is set and valid (not a placeholder)
      if (!privateKey || 
          privateKey === 'your-private-key-here' || 
          privateKey === '0xyour-private-key-here' ||
          privateKey.length < 64) {
        console.warn('⚠️  Blockchain private key not set or invalid, blockchain features disabled');
        console.warn('   To enable blockchain: Set BLOCKCHAIN_PRIVATE_KEY in .env with a valid private key');
        return;
      }

      // Validate private key format
      try {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
      } catch (walletError) {
        console.warn('⚠️  Invalid blockchain private key format, blockchain features disabled');
        console.warn('   Error:', walletError.message);
        return;
      }

      if (this.contractAddress && InsuranceLedger && InsuranceLedger.abi) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          InsuranceLedger.abi,
          this.wallet
        );
        console.log('✅ Blockchain service initialized');
      } else {
        console.warn('⚠️  Smart contract not deployed yet or artifact not found');
      }
    } catch (error) {
      console.error('Blockchain initialization error:', error);
    }
  }

  async issuePolicy(policyId, userId, premium, startDate, endDate) {
    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }

      const tx = await this.contract.issuePolicy(
        policyId,
        userId,
        ethers.parseEther(premium.toString()),
        Math.floor(new Date(startDate).getTime() / 1000),
        Math.floor(new Date(endDate).getTime() / 1000)
      );

      const receipt = await tx.wait();
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Blockchain issuePolicy error:', error);
      throw error;
    }
  }

  async submitClaim(claimId, policyId, userId, description, ipfsCids) {
    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }

      const tx = await this.contract.submitClaim(
        claimId,
        policyId,
        userId,
        description,
        ipfsCids
      );

      const receipt = await tx.wait();
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Blockchain submitClaim error:', error);
      throw error;
    }
  }

  async updateClaimStatus(claimId, newStatus) {
    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }

      const statusMap = {
        'Submitted': 0,
        'In Review': 1,
        'Approved': 2,
        'Rejected': 3
      };

      const statusCode = statusMap[newStatus];
      if (statusCode === undefined) {
        throw new Error('Invalid status');
      }

      const tx = await this.contract.updateClaimStatus(claimId, statusCode);
      const receipt = await tx.wait();
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Blockchain updateClaimStatus error:', error);
      throw error;
    }
  }

  isAvailable() {
    return this.contract !== null;
  }
}

module.exports = new BlockchainService();

