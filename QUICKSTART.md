# 🚀 Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (v16+)
- ✅ MongoDB running (local or Atlas)
- ✅ Git installed

## Step-by-Step Setup

### 1. Install All Dependencies

```bash
npm run install-all
```

This installs dependencies for:
- Root project
- Backend
- Frontend  
- Smart contracts

### 2. Start MongoDB

**Windows:**
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# If not running, start it
Start-Service MongoDB
```

**Linux/Mac:**
```bash
mongod
```

**Or use MongoDB Atlas** (cloud - no installation needed)

### 3. Configure Backend

Create `backend/.env` file:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vims
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRE=7d
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=your-private-key-here
SMART_CONTRACT_ADDRESS=your-contract-address-here
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8080/ipfs
FRONTEND_URL=http://localhost:3000
```

### 4. Start Hardhat Blockchain Node

**Terminal 1:**
```bash
cd smart-contracts
npm install
npm run node
```

**Wait for the node to start**, then copy one of the private keys from the output and use it in `backend/.env` as `BLOCKCHAIN_PRIVATE_KEY`.

### 5. Deploy Smart Contract

**Terminal 2:**
```bash
cd smart-contracts
npm run deploy
```

**Copy the deployed contract address** and add it to `backend/.env` as `SMART_CONTRACT_ADDRESS`.

### 6. Start Backend Server

**Terminal 3:**
```bash
cd backend
npm run dev
```

Backend should start on http://localhost:5000

### 7. Start Frontend

**Terminal 4:**
```bash
cd frontend
npm start
```

Frontend should start on http://localhost:3000

### 8. (Optional) Start IPFS

**Terminal 5:**
```bash
ipfs daemon
```

Or skip this and use public IPFS gateway (update `IPFS_GATEWAY_URL` in `.env`).

## First Time Usage

1. **Open** http://localhost:3000
2. **Register** a new user account
3. **Create Admin Account** (in MongoDB):
   ```javascript
   use vims
   db.users.updateOne({email: "your-email@example.com"}, {$set: {role: "admin"}})
   ```
4. **Login as Admin** and create policy types
5. **Login as User** and start using the system!

## Troubleshooting

### Backend won't start
- Check MongoDB is running
- Verify `.env` file exists and has correct values
- Check port 5000 is not in use

### Frontend won't start
- Check Node.js version (v16+)
- Delete `node_modules` and `package-lock.json`, then `npm install`
- Check port 3000 is not in use

### Blockchain errors
- Ensure Hardhat node is running
- Verify contract is deployed
- Check `BLOCKCHAIN_PRIVATE_KEY` matches a Hardhat account

### IPFS errors
- Start IPFS daemon OR
- Use public gateway: `IPFS_GATEWAY_URL=https://ipfs.io/ipfs`

## All Set! 🎉

Your VIMS system should now be running!

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

