// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
const uploadImage = async (file) => {
  try {
    // For security, validate file before uploading
    if (!file.mimetype.startsWith('image')) {
      throw new Error('Please upload an image file');
    }

    // Create a new promise to handle the file upload
    return new Promise((resolve, reject) => {
      // Create a readable stream from the buffer
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'uploads',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          return resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      );
      
      // Pass file buffer to stream
      stream.write(file.buffer);
      stream.end();
    });
  } catch (error) {
    throw new Error(`Error uploading image: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    if (!publicId) return null;
    
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Error deleting image: ${error.message}`);
  }
};

module.exports = {
  uploadImage,
  deleteImage
};
