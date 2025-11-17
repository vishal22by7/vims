# Final Setup & Collaboration Guide

This document is the single source of truth for teammates who clone the VIMS repository, make changes, and run the entire stack (frontend, backend, MongoDB Atlas, blockchain, IPFS). Follow the steps in order.

---

## 1. Prerequisites

Install **before cloning**:

1. **Git**
2. **Node.js v18+** (npm included)
3. **MongoDB Atlas account** (free tier)
4. Optional tools:
   - VS Code or similar editor
   - MongoDB Compass (GUI for MongoDB)
   - IPFS CLI (only if you want to run an IPFS daemon)

---

## 2. Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/vims.git
cd vims
npm run install-all
```

This installs dependencies for the root project, backend, frontend, and smart-contracts.

---

## 3. Configure MongoDB Atlas

1. Sign in to [cloud.mongodb.com](https://cloud.mongodb.com) → create a **free cluster**.
2. **Create a database user** (e.g. `vimsadmin`) with a strong password.
3. **Whitelist your IP** (Network Access → “Add IP Address”). For dev you can use `0.0.0.0/0`.
4. **Get the connection string**:
   - Cluster → “Connect” → “Drivers” → copy the URI.
   - Example: `mongodb+srv://vimsadmin:<PASSWORD>@cluster0.abc123.mongodb.net`
5. **Create database** named `vims` (Atlas or Compass).
6. In `backend/`, copy `.env.example` (if missing, create) to `.env` and fill:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://vimsadmin:<PASSWORD>@cluster0.abc123.mongodb.net/vims?retryWrites=true&w=majority
   JWT_SECRET=change-this-secret
   JWT_EXPIRE=7d
   BLOCKCHAIN_RPC_URL=http://localhost:8545
   BLOCKCHAIN_PRIVATE_KEY=0xyour-private-key-here
   SMART_CONTRACT_ADDRESS=your-contract-address-here
   IPFS_API_URL=http://localhost:5001
   IPFS_GATEWAY_URL=http://localhost:8080/ipfs
   FRONTEND_URL=http://localhost:3000
   ```

   > Replace username/password/cluster host with your own values. If you are not using blockchain or IPFS, leave placeholders; backend will disable those features gracefully.

---

## 4. Seed Required Data

### 4.1 Create Admin Account

Run from project root:

```bash
npm run create-admin
```

Result:
- Admin email: `admin@vims.com`
- Admin password: `admin123456`
- Role: `admin`

### 4.2 Seed Policy Types
Run from project root:

```bash
npm run seed:policies
```

This populates six IRDAI-style motor insurance policy templates in MongoDB (`policytypes` collection) so the Buy Policy form has valid options.

---

## 5. Optional: Blockchain Setup (Hardhat)

If you want blockchain logging:

1. **Start Hardhat node** (new terminal):
   ```bash
   cd smart-contracts
   npm run node
   ```
   Keep this terminal running. It prints local accounts with private keys.

2. **Deploy contract** (another terminal):
   ```bash
   cd smart-contracts
   npm run deploy
   ```
   Copy the contract address printed, e.g. `0x5FbD...`.

3. **Update backend `.env`**:
   ```env
   BLOCKCHAIN_PRIVATE_KEY=<one of the private keys shown when node started>
   SMART_CONTRACT_ADDRESS=<address from deployment>
   ```

If you skip these steps, blockchain features remain disabled but the app still works.

---

## 6. Optional: IPFS

If you want IPFS for claim photos:

1. Install IPFS CLI from https://ipfs.tech.
2. Run in a new terminal:
   ```bash
   ipfs daemon
   ```
3. Ensure `IPFS_API_URL` and `IPFS_GATEWAY_URL` in `.env` point to your daemon (defaults already set).

If you don’t run IPFS, uploads are still recorded locally; backend logs a warning but continues.

---

## 7. Start Servers

**Backend**
```bash
cd backend
npm run dev
```
You should see “✅ Connected to MongoDB” and the server listening on port 5000.

**Frontend**
```bash
cd frontend
npm start
```
Opens http://localhost:3000 in your browser.

Keep both terminals running.

---

## 8. Using the Application

1. Visit http://localhost:3000.
2. Register as a normal user OR log in using the admin credentials seeded earlier.
3. **Admin view** (after logging in as admin):
   - Navbar shows: Dashboard, Policy Types, Users, View Policies, View Claims.
   - You can manage policy types, users, policies, claims.
4. **User view**:
   - Dashboard, Calculator, Buy Policy, My Policies, Submit Claim, My Claims.
   - Buy policies using the seeded policy types.
5. **Submit claims** with photos (IPFS optional). Admin can review and change claim statuses.

---

## 9. Collaboration Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/some-change
   ```
2. **Make changes**, run lint/tests as needed.
3. **Commit**:
   ```bash
   git add .
   git commit -m "Describe your change"
   ```
4. **Push**:
   ```bash
   git push origin feature/some-change
   ```
5. **Open Pull Request** on GitHub, review, merge into `main`.

---

## 10. MongoDB Data Explorer (Atlas)

To view data:
1. Go to your cluster → **Browse Collections** (or **Data Explorer**).
2. Choose database `vims`.
3. Collections:
   - `users` — admin & customer accounts (`passwordHash` stored)
   - `policytypes` — seeded policy types
   - `policies`, `claims`, `claimphotos`, `blockchainrecords`, etc.
4. Use filter box to query, e.g. `{ "email": "admin@vims.com" }`.

Optional: connect via MongoDB Compass using the same connection string for a desktop GUI.

---

## 11. Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend `ERR_CONNECTION_REFUSED` | Make sure `npm run dev` is running and `.env` is correct. |
| MongoDB connection error | Check `MONGODB_URI`, user credentials, IP whitelist. |
| Policy dropdown empty | Run `npm run seed:policies` or create policy types via admin UI. |
| Admin menu missing | You’re logged in as user; log in with admin credentials. |
| Blockchain “invalid BytesLike” error | Update `.env` with a real private key or leave blank to disable blockchain. |
| IPFS error | Install `ipfs-http-client` or run IPFS daemon; otherwise ignore warning. |

---

## 12. GitHub Best Practices

1. Keep secrets out of git (`.env` already ignored).
2. Document new scripts or environment variables in `FINAL_SETUP.md`.
3. Run `npm run create-admin` and `npm run seed:policies` after cloning (or whenever DB is empty).
4. Submit PRs with clear descriptions and link to issue/task if applicable.

---

## 13. Quick Command Reference

| Task | Command |
|------|---------|
| Install everything | `npm run install-all` |
| Create admin user | `npm run create-admin` |
| Seed policy types | `npm run seed:policies` |
| Start backend | `cd backend && npm run dev` |
| Start frontend | `cd frontend && npm start` |
| Start Hardhat node | `cd smart-contracts && npm run node` |
| Deploy contract | `cd smart-contracts && npm run deploy` |
| Start IPFS (optional) | `ipfs daemon` |

---

Following this guide guarantees everyone on the team can clone, configure, run, and extend the project without guesswork. Keep this document updated as the project evolves. Happy collaborating! 🚗✨

