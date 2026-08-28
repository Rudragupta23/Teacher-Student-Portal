const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const deleteFileFromS3 = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    let key;

    // Handle standard S3 URLs (For backwards compatibility with old uploads)
    if (fileUrl.includes('amazonaws.com/')) {
      key = fileUrl.split('amazonaws.com/')[1];
    } 
    // Handle new CloudFront URLs
    else if (process.env.AWS_CLOUDFRONT_URL && fileUrl.includes(process.env.AWS_CLOUDFRONT_URL)) {
      key = fileUrl.replace(`${process.env.AWS_CLOUDFRONT_URL}/`, '');
    } 
    // Fallback URL parser just in case
    else {
      const urlObj = new URL(fileUrl);
      key = urlObj.pathname.substring(1); 
    }

    if (!key) return;

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: decodeURIComponent(key), 
    };

    // Tell AWS to delete the file
    await s3.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted from S3: ${key}`);
  } catch (error) {
    console.error(`Error deleting from S3: ${error.message}`);
  }
};

module.exports = { deleteFileFromS3 };