# VIMS Project Setup Script
Write-Host "Setting up VIMS project files..." -ForegroundColor Green

$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"

# Create .env file if it doesn't exist
$envFile = Join-Path $backendPath ".env"
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $backendPath ".env.example") $envFile -ErrorAction SilentlyContinue
    if (-not (Test-Path $envFile)) {
        @"
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
"@ | Out-File $envFile -Encoding UTF8
        Write-Host "Created .env file" -ForegroundColor Yellow
    }
}

Write-Host "Setup complete! Remember to:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with your configuration" -ForegroundColor Yellow
Write-Host "2. Start MongoDB" -ForegroundColor Yellow
Write-Host "3. Deploy smart contract and update .env" -ForegroundColor Yellow

