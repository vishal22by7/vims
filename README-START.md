# Starting All Services

You now have **3 ways** to start all services at once:

## Option 1: Single Terminal (Recommended) ⭐

Run all services in one terminal with color-coded output:

```bash
npm run dev
```

This uses `concurrently` to run all 6 services:
- 🔵 **BLOCKCHAIN** - Hardhat local blockchain
- 🟡 **BACKEND** - Express API server
- 🟢 **FRONTEND** - React development server
- 🟣 **ML-ANALYZER** - Python FastAPI service
- 🔷 **FABRIC** - Hyperledger Fabric simulator
- 🔴 **ORACLE** - Oracle automation service

**To stop all services:** Press `Ctrl+C` in the terminal

---

## Option 2: Separate Windows (PowerShell)

Opens each service in its own window:

```powershell
.\start-all.ps1
```

**To stop:** Close each window individually

---

## Option 3: Separate Windows (Batch)

Opens each service in its own window:

```cmd
start-all.bat
```

**To stop:** Close each window individually

---

## Individual Service Commands

If you need to start services individually:

```bash
npm run dev:blockchain  # Hardhat node
npm run dev:backend     # Backend API
npm run dev:frontend    # React frontend
npm run dev:ml          # ML Analyzer
npm run dev:fabric      # Fabric simulator
npm run dev:oracle      # Oracle service
```

---

## Prerequisites

Make sure you have:
- ✅ Node.js installed
- ✅ Python installed (for ML Analyzer)
- ✅ MongoDB running (for Backend)
- ✅ All dependencies installed: `npm run install-all`

---

## Service Ports

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **ML Analyzer**: http://localhost:8000
- **Fabric Simulator**: http://localhost:3001
- **Oracle Service**: http://localhost:3002
- **Hardhat Blockchain**: http://localhost:8545

---

## Troubleshooting

**If services don't start:**
1. Check if ports are already in use
2. Ensure MongoDB is running
3. Verify all `.env` files are configured
4. Check individual service logs for errors

**If ML Analyzer fails:**
- Ensure Python virtual environment is set up: `cd ml-analyzer && python -m venv venv`
- Install dependencies: `venv\Scripts\pip install -r requirements.txt`