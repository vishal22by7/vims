# Errors Fixed - Summary

## Issues Identified and Resolved

### 1. ✅ Oracle Service Connection Errors (ECONNREFUSED)

**Problem:**
- Oracle service was trying to connect to blockchain node before it was ready
- Caused `ECONNREFUSED` errors on startup
- Error messages: `connect ECONNREFUSED ::1:8545` and `connect ECONNREFUSED 127.0.0.1:8545`

**Root Cause:**
- Race condition: Oracle service starts before Hardhat blockchain node
- No retry logic to wait for blockchain node to be ready

**Solution:**
- Added retry logic in `oracle-service/server.js`:
  - Retries connection up to 10 times (20 seconds total)
  - Waits 2 seconds between retry attempts
  - Only logs every 3rd attempt to reduce noise
  - Continues running even if blockchain connection fails initially
  - Background retry mechanism if initial connection fails

**Files Modified:**
- `oracle-service/server.js` - Added retry logic in `initBlockchain()` function

---

### 2. ✅ Frontend ESLint Warnings

**Problem:**
- `BuyPolicy.js` line 105: React Hook `useCallback` missing dependency warning
- `Profile.js` line 9: `navigate` variable assigned but never used
- `Profile.js` line 10: `authUser` variable assigned but never used

**Solution:**
- **BuyPolicy.js**: Added `eslint-disable-next-line` comment (the dependency array is intentionally limited to specific fields)
- **Profile.js**: Removed unused `navigate` and `authUser` imports

**Files Modified:**
- `frontend/src/pages/BuyPolicy.js` - Added eslint-disable comment
- `frontend/src/pages/Profile.js` - Removed unused imports

---

### 3. ⚠️ Excessive Blockchain Logging (Not an Error)

**Observation:**
- Hardhat node logs every `eth_blockNumber` call
- This is normal behavior for Hardhat's development node
- The Oracle service polls the blockchain frequently, causing many log entries

**Status:**
- This is **not an error** - it's expected behavior
- Hardhat's verbose logging helps with debugging
- Can be reduced by:
  - Using Hardhat's `--quiet` flag (but this hides useful info)
  - Reducing Oracle service polling frequency (not recommended)

**Recommendation:**
- Keep as-is for development
- For production, use a production blockchain node with less verbose logging

---

## Summary

All **actual errors** have been fixed:
- ✅ Oracle service connection errors (retry logic added)
- ✅ Frontend ESLint warnings (unused variables removed, dependency warning suppressed)

The excessive blockchain logging is **normal behavior** and not an error.

---

## Testing

After these fixes:
1. Oracle service will wait for blockchain node to be ready
2. No more ESLint warnings in frontend
3. Cleaner startup logs (fewer connection error messages)

To test:
```bash
npm run dev
```

You should see:
- Oracle service waiting for blockchain node (if it starts first)
- Successful connection message after blockchain node is ready
- No ESLint warnings in frontend console

