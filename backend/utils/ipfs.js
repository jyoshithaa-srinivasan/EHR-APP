const fs = require('fs');
const path = require('path');

// Load mime module dynamically
let mime;
(async () => {
  mime = (await import('mime')).default;
})();

let clientPromise = null;

async function initClient() {
  const { create } = await import('@web3-storage/w3up-client');
  const client = await create();

  // ⛔️ DON'T call client.login again — your agent is already authenticated via CLI

  // ✅ Use the space you already created via CLI
  await client.setCurrentSpace('did:key:z6Mkem2hb9zEws4VfQBDb2MNFphYXUSQWhHtrrjiNbNbQ9P9');
  console.log('✅ Using existing space');

  return client;
}

const uploadFileToStoracha = async (filePath) => {
  if (!clientPromise) {
    clientPromise = initClient();
  }

  const client = await clientPromise;

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const fileType = mime.getType(filePath) || 'application/octet-stream';

  const file = new File([fileBuffer], fileName, { type: fileType });

  const cid = await client.uploadFile(file);
  console.log(`📦 Uploaded file with CID: ${cid}`);
  return cid.toString();
};

module.exports = uploadFileToStoracha;
