# Blockchain Status Flow - Automatic Updates

This document explains how the blockchain status changes automatically in the VIMS system.

## 🔄 Complete Status Flow

### Step 1: User Submits Claim
```
User clicks "Submit Claim" → Backend receives claim
```
**Status:** `blockchainTxHash: null` → Frontend shows: **"Pending"** (yellow badge)

---

### Step 2: Backend Processes & Writes to Blockchain
```
Backend → blockchainService.submitClaimWithML()
  ↓
Transaction sent to Ethereum
  ↓
Receipt received (txHash, blockNumber)
  ↓
Backend updates claim: blockchainTxHash = "0x..."
```
**Status:** `blockchainTxHash: "0x..."` → Frontend shows: **"✓ On Chain"** (blue badge)

**Time:** ~2-5 seconds after submission

---

### Step 3: Oracle Service Detects Event
```
Ethereum emits ClaimSubmitted event
  ↓
Oracle service listens (contract.on() + polling)
  ↓
Oracle detects new claim
  ↓
Oracle fetches claim from backend (/api/claims/:id/oracle)
```

**Status:** Still **"✓ On Chain"** (Oracle is processing)

---

### Step 4: Oracle Evaluates Claim
```
Oracle decision logic:
  - If severity ≥ 60 → Auto-approve
  - If severity < 60 → Request Fabric verification
  ↓
Oracle calls contract.evaluateClaim() on blockchain
  ↓
Oracle updates backend: /api/claims/:id/updateFromOracle
  {
    status: "Approved" or "Rejected",
    verified: true/false,
    payoutAmount: calculated amount,
    blockchainEvaluated: true
  }
```
**Status:** `blockchainEvaluated: true` → Frontend shows: **"✓ On Chain"** + **"Evaluated"** (small text below)

**Time:** ~10-30 seconds after blockchain confirmation

---

## 📊 Status Badge States

| Backend Field | Frontend Display | Badge Color |
|--------------|------------------|-------------|
| `blockchainTxHash: null` | "Pending" | Yellow (warning) |
| `blockchainTxHash: "0x..."` | "✓ On Chain" | Blue (info) |
| `blockchainEvaluated: true` | "✓ On Chain" + "Evaluated" | Blue + small text |

---

## 🔄 Auto-Refresh Mechanism

The frontend now **automatically refreshes every 5 seconds** to show status updates:

```javascript
// In Claims.js
useEffect(() => {
  fetchClaims(); // Initial load
  
  // Auto-refresh every 5 seconds
  const interval = setInterval(() => {
    fetchClaims();
  }, 5000);
  
  return () => clearInterval(interval);
}, []);
```

**This means:**
- User submits claim → Sees "Pending"
- After ~5 seconds → Refreshes → Sees "✓ On Chain" (if blockchain tx confirmed)
- After ~30 seconds → Refreshes → Sees "Evaluated" (if oracle processed)

---

## 🎯 Timeline Example

```
00:00 - User submits claim
       Status: "Pending" (yellow)

00:03 - Backend confirms blockchain transaction
       Status: "✓ On Chain" (blue) ← Auto-refresh shows this

00:15 - Oracle detects event and starts processing
       Status: Still "✓ On Chain"

00:25 - Oracle completes evaluation
       Status: "✓ On Chain" + "Evaluated" ← Auto-refresh shows this
```

---

## 🔍 How to Verify It's Working

1. **Check Backend Logs:**
   ```
   🔗 Claim (ML) blockchain tx confirmed | txHash=0x...
   ```

2. **Check Oracle Logs:**
   ```
   🔔 New claim submitted: <claimId>
   🔄 Processing claim <claimId>...
   ✅ Claim evaluated on blockchain: 0x...
   ```

3. **Check Frontend:**
   - Open browser console → Network tab
   - See `/api/claims` requests every 5 seconds
   - Watch status badge change automatically

---

## 🛠️ Troubleshooting

**Status stuck on "Pending"?**
- Check if blockchain service is initialized
- Check backend logs for blockchain errors
- Verify `SMART_CONTRACT_ADDRESS` in `.env`

**Status stuck on "✓ On Chain" (no "Evaluated")?**
- Check if oracle service is running
- Check oracle logs for processing errors
- Verify oracle can reach backend API

**Status not updating automatically?**
- Check browser console for errors
- Verify auto-refresh interval is running (check Network tab)
- Try manual page refresh

---

## 📝 Summary

The status changes **automatically** through:
1. ✅ Backend writes to blockchain → Updates `blockchainTxHash`
2. ✅ Oracle processes claim → Updates `blockchainEvaluated`
3. ✅ Frontend auto-refreshes every 5 seconds → Shows updated status

**No manual refresh needed!** The system handles everything automatically.

