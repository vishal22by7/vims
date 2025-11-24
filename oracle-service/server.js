/**
 * Oracle Automation Service
 * Connects all components: Ethereum, ML Analyzer, Fabric-sim, and Main Backend
 */
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Service URLs
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const ML_ANALYZER_URL = process.env.ML_ANALYZER_URL || 'http://localhost:8000';
const FABRIC_SIM_URL = process.env.FABRIC_SIM_URL || 'http://localhost:4000';
const BLOCKCHAIN_RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
const CONTRACT_ADDRESS = process.env.SMART_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain setup
let provider = null;
let wallet = null;
let contract = null;

// Load contract ABI (from VehicleInsurance.sol)
const contractABI = [
  "event ClaimSubmitted(string indexed claimId, string indexed policyId, string indexed userId, string description, string[] evidenceCids, string mlReportCID, uint256 severity, uint256 timestamp)",
  "event ClaimEvaluated(string indexed claimId, uint8 status, bool verified, uint256 payoutAmount, uint256 timestamp)",
  "function evaluateClaim(string memory claimId, bool approved, bool verified, uint256 payoutAmount) public",
  "function getClaim(string memory claimId) public view returns (tuple(string claimId, string policyId, string userId, string description, string[] evidenceCids, string mlReportCID, uint256 severity, uint8 status, bool verified, uint256 payoutAmount, uint256 submittedAt, uint256 updatedAt))"
];

async function initBlockchain() {
  try {
    if (!PRIVATE_KEY || PRIVATE_KEY === 'your-private-key-here') {
      console.warn('⚠️  Blockchain private key not set, Oracle blockchain features disabled');
      return;
    }

    provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    if (CONTRACT_ADDRESS) {
      contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
      console.log('✅ Oracle blockchain initialized');
      
      // Start listening to events
      startEventListening();
    } else {
      console.warn('⚠️  Smart contract address not set');
    }
  } catch (error) {
    console.error('❌ Blockchain initialization error:', error);
  }
}

// Track processed claims to avoid duplicates
const processedClaims = new Set();

// Listen to ClaimSubmitted events
function startEventListening() {
  if (!contract) return;

  console.log('👂 Listening for ClaimSubmitted events...');

  try {
    // Use contract.on() directly - this is the correct way in ethers v6
    contract.on('ClaimSubmitted', async (...args) => {
      try {
        // Extract values - last arg is the event object
        const event = args[args.length - 1];
        const claimId = args[0];
        const policyId = args[1];
        const userId = args[2];
        const severity = args[6];

        const claimIdStr = String(claimId || '').trim();
        if (!claimIdStr || claimIdStr === '[object Object]') {
          console.warn('Invalid claimId from event:', claimId);
          return;
        }
        
        // Skip if already processed
        if (processedClaims.has(claimIdStr)) {
          return;
        }
        processedClaims.add(claimIdStr);

        console.log(`\n🔔 New claim submitted: ${claimIdStr}`);
        console.log(`   Policy: ${String(policyId || '')}, User: ${String(userId || '')}`);
        console.log(`   Severity: ${String(severity || '0')}`);
        
        await processClaim(
          claimIdStr,
          String(policyId || ''),
          String(userId || ''),
          String(severity || '0')
        );
      } catch (error) {
        console.error(`❌ Error processing claim event:`, error.message || error);
      }
    });

    // Also set up polling fallback for reliability
    startPollingFallback();
  } catch (error) {
    console.error('❌ Error setting up event listener:', error.message);
    console.log('⚠️  Event listener setup failed. Using polling fallback.');
    startPollingFallback();
  }
}

// Polling fallback - checks for new claims every 10 seconds
let lastBlockChecked = 0;
async function startPollingFallback() {
  if (!contract || !provider) return;

  console.log('📡 Starting polling fallback (checks every 10 seconds)...');

  setInterval(async () => {
    try {
      const currentBlock = await provider.getBlockNumber();
      if (lastBlockChecked === 0) {
        lastBlockChecked = currentBlock - 1; // Start from previous block
      }

      if (currentBlock > lastBlockChecked) {
        const filter = contract.filters.ClaimSubmitted();
        const logs = await contract.queryFilter(filter, lastBlockChecked + 1, currentBlock);
        
        for (const log of logs) {
          try {
            // Parse the log - args is an array in ethers v6
            const parsed = contract.interface.parseLog(log);
            if (!parsed || !parsed.args) {
              console.warn('Could not parse log:', log);
              continue;
            }

            // Extract values - args can be an array or object
            const args = parsed.args;
            const claimId = args.claimId || args[0];
            const policyId = args.policyId || args[1];
            const userId = args.userId || args[2];
            const severity = args.severity || args[6];

            const claimIdStr = String(claimId || '').trim();
            if (!claimIdStr || claimIdStr === '[object Object]') {
              console.warn('Invalid claimId from log:', claimId);
              continue;
            }

            if (!processedClaims.has(claimIdStr)) {
              processedClaims.add(claimIdStr);
              console.log(`\n🔔 [Polling] New claim found: ${claimIdStr}`);
              await processClaim(
                claimIdStr,
                String(policyId || ''),
                String(userId || ''),
                String(severity || '0')
              );
            }
          } catch (parseError) {
            console.error('Error parsing log:', parseError.message || parseError);
          }
        }

        lastBlockChecked = currentBlock;
      }
    } catch (pollError) {
      // Silently handle polling errors to avoid spam
      if (pollError.message && !pollError.message.includes('rate limit')) {
        console.error('Polling error:', pollError.message);
      }
    }
  }, 10000); // Poll every 10 seconds
}

/**
 * Main claim processing logic
 */
async function processClaim(claimId, policyId, userId, severity) {
  try {
    console.log(`\n🔄 Processing claim ${claimId}...`);
    
    // Step 1: Get claim details from backend
    const claimData = await getClaimFromBackend(claimId);
    if (!claimData) {
      console.error(`❌ Claim ${claimId} not found in backend`);
      return;
    }

    const severityNum = parseInt(severity) || parseInt(claimData.severity) || 0;
    
    // Step 2: Decision logic
    let approved = false;
    let verified = false;
    let payoutAmount = 0;

    if (severityNum >= 60) {
      // High severity - auto-approve
      console.log(`✅ High severity (${severityNum}), auto-approving...`);
      approved = true;
      verified = true;
      payoutAmount = calculatePayout(claimData, severityNum);
    } else {
      // Low severity - need private verification
      console.log(`⚠️  Low severity (${severityNum}), requesting private verification...`);
      
      const fabricResult = await requestFabricVerification(claimId, policyId, userId, severityNum, claimData.mlReportCID);
      
      if (fabricResult && fabricResult.verified) {
        approved = true;
        verified = true;
        payoutAmount = calculatePayout(claimData, severityNum);
        console.log(`✅ Private verification passed`);
      } else {
        approved = false;
        verified = false;
        console.log(`❌ Private verification failed: ${fabricResult?.reason || 'Unknown'}`);
      }
    }

    // Step 3: Evaluate on blockchain
    if (contract && wallet) {
      try {
        const tx = await contract.evaluateClaim(
          claimId,
          approved,
          verified,
          ethers.parseEther(payoutAmount.toString())
        );
        const receipt = await tx.wait();
        console.log(`✅ Claim evaluated on blockchain: ${receipt.hash}`);
      } catch (blockchainError) {
        console.error('❌ Blockchain evaluation error:', blockchainError);
      }
    }

    // Step 4: Update backend
    await updateBackendClaim(claimId, {
      status: approved ? 'Approved' : 'Rejected',
      verified,
      payoutAmount,
      blockchainEvaluated: true
    });

    console.log(`✅ Claim ${claimId} processed: ${approved ? 'APPROVED' : 'REJECTED'}`);
  } catch (error) {
    console.error(`❌ Error processing claim ${claimId}:`, error);
  }
}

/**
 * Get claim from backend API (using oracle endpoint - no auth required)
 */
async function getClaimFromBackend(claimId) {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/claims/${claimId}/oracle`);
    if (response.data.success) {
      return response.data.claim;
    }
    return null;
  } catch (error) {
    console.error('Error fetching claim from backend:', error.response?.status, error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Request private verification from Fabric-sim
 */
async function requestFabricVerification(claimId, policyId, userId, severity, mlReportCID) {
  try {
    const response = await axios.post(`${FABRIC_SIM_URL}/verify`, {
      claimId,
      policyId,
      userId,
      severity,
      mlReportCID
    });
    return response.data;
  } catch (error) {
    console.error('Error requesting Fabric verification:', error.message);
    return { verified: false, reason: 'Fabric service unavailable' };
  }
}

/**
 * Calculate payout amount based on claim and severity
 */
function calculatePayout(claimData, severity) {
  // Simple calculation: severity percentage of policy premium
  // In production, use actual policy premium
  const baseAmount = 50000; // ₹50,000 base
  const severityMultiplier = severity / 100;
  return Math.floor(baseAmount * severityMultiplier);
}

/**
 * Update claim in backend
 */
async function updateBackendClaim(claimId, updates) {
  try {
    await axios.patch(`${BACKEND_URL}/api/claims/${claimId}/updateFromOracle`, updates, {
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_ADMIN_TOKEN || ''}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Backend updated for claim ${claimId}`);
  } catch (error) {
    console.error('Error updating backend:', error.message);
  }
}

// Manual trigger endpoint (for testing)
app.post('/process/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;
    await processClaim(claimId, null, null, null);
    res.json({ success: true, message: `Claim ${claimId} processing initiated` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    blockchain: contract !== null,
    services: {
      backend: BACKEND_URL,
      mlAnalyzer: ML_ANALYZER_URL,
      fabricSim: FABRIC_SIM_URL
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'VIMS Oracle Service',
    status: 'running',
    description: 'Automation layer connecting blockchain, ML, and verification services'
  });
});

// Initialize and start
initBlockchain().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Oracle Service running on http://localhost:${PORT}`);
    console.log(`📡 Listening for blockchain events...`);
  });
});

