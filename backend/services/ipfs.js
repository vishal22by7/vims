const fs = require('fs');
const path = require('path');

// IPFS client is optional - handle import gracefully
// ipfs-http-client v60+ is ESM-only, so we make it completely optional
let ipfsClient = null;
let ipfsAvailable = false;

try {
  // Try to load IPFS client - if it fails, that's OK
  ipfsClient = require('ipfs-http-client');
  ipfsAvailable = true;
} catch (error) {
  // IPFS client not available - this is OK, we'll disable IPFS features
  ipfsAvailable = false;
  // Don't log error here - we'll log it in the service initialization
}

class IPFSService {
  constructor() {
    this.ipfs = null;
    this.apiUrl = process.env.IPFS_API_URL || 'http://localhost:5001';
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'http://localhost:8080/ipfs';
    this.ipfsAvailable = ipfsAvailable && ipfsClient !== null;
    
    if (!this.ipfsAvailable) {
      console.warn('⚠️  IPFS client not available, IPFS features disabled');
      console.warn('   This is OK for development. Photos will be saved locally.');
      console.warn('   To enable IPFS: Use a compatible version or start IPFS daemon');
    } else {
      this.init();
    }
  }

  async init() {
    if (!this.ipfsAvailable || !ipfsClient) {
      return;
    }
    
    try {
      // Handle different IPFS client versions
      let createFn = null;
      if (typeof ipfsClient === 'function') {
        createFn = ipfsClient;
      } else if (ipfsClient.create) {
        createFn = ipfsClient.create;
      } else if (ipfsClient.default && ipfsClient.default.create) {
        createFn = ipfsClient.default.create;
      }
      
      if (createFn) {
        this.ipfs = await createFn({ url: this.apiUrl });
        console.log('✅ IPFS service initialized');
      } else {
        throw new Error('IPFS create function not found');
      }
    } catch (error) {
      console.warn('⚠️  IPFS initialization failed:', error.message);
      console.warn('   IPFS features disabled. Photos will be saved locally.');
      this.ipfsAvailable = false;
    }
  }

  async uploadFile(filePath, fileName) {
    if (!this.ipfsAvailable) {
      throw new Error('IPFS service is not available. Please install ipfs-http-client or start IPFS daemon.');
    }
    
    try {
      if (!this.ipfs) {
        await this.init();
        if (!this.ipfs) {
          throw new Error('IPFS initialization failed');
        }
      }

      const fileBuffer = fs.readFileSync(filePath);
      const result = await this.ipfs.add({
        path: fileName,
        content: fileBuffer
      });

      const cid = result.cid.toString();
      const url = `${this.gatewayUrl}/${cid}`;

      return { cid, url };
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  async uploadBuffer(buffer, fileName) {
    if (!this.ipfsAvailable) {
      throw new Error('IPFS service is not available. Please install ipfs-http-client or start IPFS daemon.');
    }
    
    try {
      if (!this.ipfs) {
        await this.init();
        if (!this.ipfs) {
          throw new Error('IPFS initialization failed');
        }
      }

      const result = await this.ipfs.add({
        path: fileName,
        content: buffer
      });

      const cid = result.cid.toString();
      const url = `${this.gatewayUrl}/${cid}`;

      return { cid, url };
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }
  
  isAvailable() {
    return this.ipfsAvailable && this.ipfs !== null;
  }

  getGatewayUrl(cid) {
    return `${this.gatewayUrl}/${cid}`;
  }
}

module.exports = new IPFSService();

