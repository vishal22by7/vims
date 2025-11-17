# 🚗 Vehicle Insurance Management System (VIMS)

A blockchain-integrated vehicle insurance management system with IPFS file storage, built with React, Node.js, MongoDB, Hardhat, and IPFS.

## 📋 Features

### User Features
- ✅ User registration and authentication
- ✅ Premium calculator
- ✅ Buy insurance policies
- ✅ Submit insurance claims with photo uploads
- ✅ Track claim status
- ✅ View policies and claims

### Admin Features
- ✅ Admin dashboard with statistics
- ✅ Manage policy types
- ✅ View all users, policies, and claims
- ✅ Review and approve/reject claims
- ✅ Update claim workflow status

### Blockchain Integration
- ✅ Immutable policy issuance records
- ✅ Immutable claim submission records
- ✅ Claim status update tracking
- ✅ IPFS CID storage on blockchain

## 🏗️ Architecture

- **Frontend**: React (localhost:3000)
- **Backend**: Node.js + Express (localhost:5000)
- **Database**: MongoDB (localhost:27017)
- **Blockchain**: Hardhat Local Node (localhost:8545)
- **IPFS**: Local IPFS Node (localhost:5001)

## 📦 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or Atlas)
- IPFS (optional - can use public gateway)
- Git

## 🚀 Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install all dependencies (root, backend, frontend, smart-contracts)
npm run install-all
```

### 2. MongoDB Setup

**Option A: Local MongoDB**
- Install MongoDB Community Server
- Start MongoDB service: `mongod` or `Start-Service MongoDB` (Windows)
- MongoDB will run on `mongodb://localhost:27017`

**Option B: MongoDB Atlas**
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get connection string
- Update `backend/.env` with your connection string

### 3. Backend Configuration

Create `backend/.env` file:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vims
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=your-private-key-here
SMART_CONTRACT_ADDRESS=your-contract-address-here
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8080/ipfs
FRONTEND_URL=http://localhost:3000
```

### 4. Smart Contract Setup

```bash
# Navigate to smart-contracts directory
cd smart-contracts

# Install dependencies (if not done already)
npm install

# Start Hardhat local node (in a separate terminal)
npm run node

# In another terminal, deploy the contract
npm run deploy

# Copy the deployed contract address to backend/.env
# SMART_CONTRACT_ADDRESS=<deployed-address>
```

**Note**: When Hardhat node starts, it will provide test accounts with private keys. Use one of these private keys in `backend/.env` as `BLOCKCHAIN_PRIVATE_KEY`.

### 5. IPFS Setup (Optional)

**Option A: Local IPFS Node**
```bash
# Install IPFS
# Windows: Download from https://dist.ipfs.io/#go-ipfs
# Or use: ipfs daemon

# Start IPFS daemon
ipfs daemon
```

**Option B: Use Public IPFS Gateway**
- Update `backend/.env`:
  ```
  IPFS_GATEWAY_URL=https://ipfs.io/ipfs
  ```
- Note: You'll still need an IPFS API for uploads, or modify the code to use a public service.

### 6. Run the Application

**Terminal 1: Backend**
```bash
cd backend
npm run dev
```

**Terminal 2: Frontend**
```bash
cd frontend
npm start
```

**Terminal 3: Hardhat Node** (if not already running)
```bash
cd smart-contracts
npm run node
```

**Terminal 4: IPFS** (if using local node)
```bash
ipfs daemon
```

## 🎯 Usage

### First Time Setup

1. **Register a User Account**
   - Go to http://localhost:3000/register
   - Create a user account

2. **Create Admin Account** (Optional)
   - Register a user
   - In MongoDB, update the user's role to 'admin':
     ```javascript
     db.users.updateOne({email: "admin@example.com"}, {$set: {role: "admin"}})
     ```

3. **Create Policy Types** (Admin only)
   - Login as admin
   - Go to Admin Dashboard → Policy Types
   - Create policy types with base rates and factors

4. **Use the System**
   - Calculate premium
   - Buy policies
   - Submit claims with photos
   - Track claim status

## 📁 Project Structure

```
vims-project/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Blockchain & IPFS services
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── context/     # React context
│   └── public/
├── smart-contracts/
│   ├── contracts/       # Solidity contracts
│   ├── scripts/         # Deployment scripts
│   └── hardhat.config.js
└── README.md
```

## 🔐 Security Notes

- **JWT_SECRET**: Use a strong, random secret in production
- **BLOCKCHAIN_PRIVATE_KEY**: Keep this secure! Never commit to git
- **MongoDB**: Use authentication in production
- **CORS**: Update `FRONTEND_URL` for production deployment

## 🧪 Testing

### Test Smart Contract
```bash
cd smart-contracts
npm test
```

### Test Backend API
```bash
cd backend
# Use Postman or curl to test endpoints
curl http://localhost:5000/api/health
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify MongoDB is accessible on port 27017

### Blockchain Connection Error
- Ensure Hardhat node is running
- Check `BLOCKCHAIN_RPC_URL` in `.env`
- Verify contract is deployed and address is correct

### IPFS Upload Fails
- Check if IPFS daemon is running
- Verify `IPFS_API_URL` in `.env`
- Try using public IPFS gateway as fallback

### Frontend Can't Connect to Backend
- Verify backend is running on port 5000
- Check CORS settings in `backend/server.js`
- Verify `FRONTEND_URL` in backend `.env`

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Policies
- `GET /api/policies` - Get user's policies
- `GET /api/policies/:id` - Get policy by ID
- `POST /api/policies/buy` - Buy policy

### Claims
- `GET /api/claims` - Get user's claims
- `GET /api/claims/:id` - Get claim by ID
- `POST /api/claims/submit` - Submit claim (multipart/form-data)

### Calculator
- `POST /api/calculator/premium` - Calculate premium

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/policy-types` - Get policy types
- `POST /api/admin/policy-types` - Create policy type
- `PUT /api/admin/policy-types/:id` - Update policy type
- `DELETE /api/admin/policy-types/:id` - Delete policy type
- `GET /api/admin/users` - Get all users
- `GET /api/admin/policies` - Get all policies
- `GET /api/admin/claims` - Get all claims
- `PUT /api/admin/claims/:id/status` - Update claim status

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Use a production MongoDB instance
3. Deploy smart contract to a testnet/mainnet
4. Use a production IPFS service (Pinata, Infura, etc.)
5. Update CORS settings
6. Use environment variables for all secrets
7. Build frontend: `cd frontend && npm run build`

## 📄 License

MIT

## 👥 Contributors

Built as a complete blockchain-integrated insurance management system.

---

**Note**: This is a development version. Ensure all security measures are in place before production deployment.

