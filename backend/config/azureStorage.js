const { BlobServiceClient } = require('@azure/storage-blob');

// Azure Storage configuration
const azureStorageConfig = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'resumes'
};

let blobServiceClient = null;

async function getBlobServiceClient() {
  if (!blobServiceClient && azureStorageConfig.connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConfig.connectionString);
  }
  return blobServiceClient;
}

async function uploadFileToBlob(fileName, fileBuffer, mimeType) {
  try {
    const blobServiceClient = await getBlobServiceClient();
    if (!blobServiceClient) {
      throw new Error('Azure Storage not configured');
    }

    const containerClient = blobServiceClient.getContainerClient(azureStorageConfig.containerName);
    
    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
      access: 'blob' // public access to blobs only
    });

    // Generate unique blob name
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobName = `${timestamp}-${sanitizedFileName}`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: mimeType
      }
    });

    return {
      url: blockBlobClient.url,
      blobName: blobName,
      containerName: azureStorageConfig.containerName
    };
  } catch (error) {
    console.error('Error uploading to Azure Blob Storage:', error);
    throw error;
  }
}

async function deleteFileFromBlob(blobName) {
  try {
    const blobServiceClient = await getBlobServiceClient();
    if (!blobServiceClient) {
      throw new Error('Azure Storage not configured');
    }

    const containerClient = blobServiceClient.getContainerClient(azureStorageConfig.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.deleteIfExists();
    
    return true;
  } catch (error) {
    console.error('Error deleting from Azure Blob Storage:', error);
    throw error;
  }
}

async function getBlobUrl(blobName) {
  try {
    const blobServiceClient = await getBlobServiceClient();
    if (!blobServiceClient) {
      throw new Error('Azure Storage not configured');
    }

    const containerClient = blobServiceClient.getContainerClient(azureStorageConfig.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error getting blob URL:', error);
    throw error;
  }
}

module.exports = {
  uploadFileToBlob,
  deleteFileFromBlob,
  getBlobUrl,
  azureStorageConfig
};
