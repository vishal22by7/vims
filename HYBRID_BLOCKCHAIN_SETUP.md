# VIMS Hybrid Blockchain Architecture - Complete Setup Guide

This guide covers the complete setup of the enhanced VIMS system with hybrid blockchain architecture, ML analysis, IPFS storage, and Oracle automation.

## 🏗️ Architecture Overview

```
┌─────────────┐
│   React     │  Frontend (Port 3000)
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Node.js   │  Main Backend (Port 5000)
│   Backend   │  - MongoDB (System of Record)
│             │  - JWT Auth
└──────┬──────┘
       │
       ├──► IPFS ──────────┐
       │                   │
       ├──► ML Analyzer ───┤
       │   (Port 8000)     │
       │                   │
       └──► Blockchain ────┼──► Oracle Service (Port 5001)
           (Ethereum)      │    - Listens to events
                           │    - Auto-decisions
                           │    - Updates backend
                           │
                           └──► Fabric Simulator (Port 4000)
                                - Private verification
```

## 📦 Components

1. **Main Backend** (Node.js/Express) - Port 5000
2. **React Frontend** - Port 3000
3. **ML Analyzer** (FastAPI) - Port 8000
4. **Fabric Simulator** (Node.js) - Port 4000
5. **Oracle Service** (Node.js) - Port 5001
6. **Ethereum Blockchain** (Hardhat) - Port 8545
7. **IPFS** (Optional) - Port 5001 (API), 8080 (Gateway)

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
# Root level
npm install

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..

# Smart Contracts
cd smart-contracts
npm install
cd ..

# ML Analyzer (requires Python 3.8+)
cd ml-analyzer
python -m venv venv
# Windows PowerShell:
.\venv\Scripts\Activate.ps1  ( & c:/Users/D1IN/vims-project/.venv/Scripts/Activate.ps1)
# Linux/Mac:
# source venv/bin/activate
pip install -r requirements.txt
cd ..

# Fabric Simulator
cd fabric-simulator
npm install
cd ..

# Oracle Service
cd oracle-service
npm install
cd ..
```

### Step 2: Environment Configuration

#### Backend (.env)
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/vims
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vims

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Blockchain
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=your-private-key-from-hardhat-account
SMART_CONTRACT_ADDRESS=0x... # After deployment

# ML Analyzer
ML_ANALYZER_URL=http://localhost:8000

# IPFS (Optional)
IPFS_API_URL=http://localhost:5001/api/v0
IPFS_GATEWAY_URL=http://localhost:8080/ipfs

# Frontend
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

#### Oracle Service (.env)
```env
PORT=5001
BACKEND_URL=http://localhost:5000
ML_ANALYZER_URL=http://localhost:8000
FABRIC_SIM_URL=http://localhost:4000
BLOCKCHAIN_RPC_URL=http://localhost:8545
SMART_CONTRACT_ADDRESS=0x... # Same as backend
BLOCKCHAIN_PRIVATE_KEY=your-private-key-from-hardhat-account
BACKEND_ADMIN_TOKEN=optional-admin-token-for-backend-api
```

#### ML Analyzer (.env)
```env
IPFS_GATEWAY_URL=http://localhost:8080/ipfs
IPFS_API_URL=http://localhost:5001/api/v0
```

### Step 3: Start Hardhat Blockchain

```bash
cd smart-contracts
npx hardhat node
# Keep this terminal open
# Note the private keys and addresses
```

### Step 4: Deploy Smart Contract

In a new terminal:
```bash
cd smart-contracts
npx hardhat run scripts/deploy-vehicle-insurance.js --network localhost
```

Copy the contract address and add to your `.env` files.

### Step 5: Start All Services

You'll need **6 terminals**:

#### Terminal 1: Hardhat Blockchain
```bash
cd smart-contracts
npx hardhat node
```

#### Terminal 2: Main Backend
```bash
cd backend
npm run dev
```

#### Terminal 3: React Frontend
```bash
cd frontend
npm start
```

#### Terminal 4: ML Analyzer
```bash
cd ml-analyzer
# Activate virtual environment first
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# source venv/bin/activate  # Linux/Mac
python app.py
# Or: uvicorn app:app --host 0.0.0.0 --port 8000
```

#### Terminal 5: Fabric Simulator
```bash
cd fabric-simulator
npm start
```

#### Terminal 6: Oracle Service
```bash
cd oracle-service
npm start
```

### Step 6: Create Admin Account

```bash
cd backend
npm run create-admin
```

### Step 7: Seed Policy Types

```bash
npm run seed:policies
```

## 🔄 Workflow

### User Submits Claim

1. **User uploads photos** → Backend receives files
2. **Backend uploads to IPFS** → Gets CIDs
3. **Backend calls ML Analyzer** → Gets severity, damage parts, ML report CID
4. **Backend saves claim** → MongoDB with ML data
5. **Backend submits to blockchain** → VehicleInsurance.sol with evidence CIDs, ML report CID, severity
6. **Blockchain emits event** → `ClaimSubmitted`
7. **Oracle listens** → Detects new claim
8. **Oracle decision logic**:
   - If severity ≥ 60 → Auto-approve
   - If severity < 60 → Request Fabric verification
9. **Oracle evaluates on blockchain** → `evaluateClaim()`
10. **Oracle updates backend** → PATCH `/api/claims/:id/updateFromOracle`
11. **Frontend polls/updates** → Shows final status, payout

## 🧪 Testing

### Test ML Analyzer
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"ipfsCid": "QmYourCIDHere"}'
```

### Test Fabric Simulator
```bash
curl -X POST http://localhost:4000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "test123",
    "policyId": "policy123",
    "userId": "user123",
    "severity": 45,
    "mlReportCID": "QmTestCID"
  }'
```

### Test Oracle Service
```bash
curl http://localhost:5001/health
```

### Manual Oracle Trigger
```bash
curl -X POST http://localhost:5001/process/CLAIM_ID
```

## 📊 Monitoring

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **ML Analyzer**: http://localhost:8000/docs (FastAPI docs)
- **Fabric Simulator**: http://localhost:4000
- **Oracle Service**: http://localhost:5001
- **Hardhat Node**: http://localhost:8545

## 🔧 Troubleshooting

### ML Analyzer not responding
- Check Python version (3.8+)
- Install PyTorch: `pip install torch torchvision`
- Check IPFS gateway is accessible

### Blockchain connection failed
- Ensure Hardhat node is running
- Check `BLOCKCHAIN_PRIVATE_KEY` matches Hardhat account
- Verify contract is deployed and address is correct

### Oracle not processing claims
- Check Oracle is listening: `curl http://localhost:5001/health`
- Verify contract address in Oracle `.env`
- Check Oracle logs for errors
- Ensure backend is accessible from Oracle

### IPFS not working
- IPFS is optional - system works without it
- Photos will be saved locally if IPFS unavailable
- To enable IPFS: Install IPFS daemon or use Pinata/Infura

## 🎯 Key Features

✅ **IPFS Storage**: Decentralized evidence storage
✅ **ML Analysis**: ResNet-based damage severity detection
✅ **Ethereum Blockchain**: Public immutable audit trail
✅ **Fabric Simulation**: Private verification for low-severity claims
✅ **Oracle Automation**: Fully automated claim processing
✅ **Hybrid Architecture**: Best of public and private blockchains

## 📝 Notes

- All services can run locally (100% free)
- ML model uses pre-trained ResNet (can be fine-tuned for production)
- Fabric simulator uses LevelDB (can be replaced with real Fabric)
- Oracle makes decisions automatically based on severity thresholds
- System gracefully handles service failures (non-blocking)

## 🚀 Production Considerations

1. **ML Model**: Fine-tune ResNet on vehicle damage dataset
2. **IPFS**: Use Pinata, Infura, or self-hosted IPFS cluster
3. **Blockchain**: Deploy to testnet/mainnet (Sepolia, Mumbai, etc.)
4. **Oracle**: Run on reliable server with monitoring
5. **Fabric**: Replace simulator with actual Hyperledger Fabric network
6. **Security**: Add rate limiting, API keys, proper authentication
7. **Scaling**: Use load balancers, database clusters, caching

---

**🎉 Your hybrid blockchain VIMS system is ready!**

