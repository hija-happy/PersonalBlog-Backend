// In your backend file (e.g., imageUploadController.js or similar)
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET // Secret key is used here
});

// Create an upload endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    // Upload to Cloudinary using the configured credentials
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'your_app_folder'
    });
    
    // Return the Cloudinary URL to the frontend
    res.json({ 
      success: true, 
      imageUrl: result.secure_url 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed', 
      error: error.message 
    });
  }
});