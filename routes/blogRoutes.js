const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Blog');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Set up Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_images', // The folder in Cloudinary where you want to store images
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'], // Allowed image formats
    transformation: [{ width: 1000, crop: 'limit' }] // Resize all images to max width 1000px
  }
});

// Initialize the upload middleware with Cloudinary storage
const upload = multer({ storage: storage });

// Blog post route
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Raw Body:', req.body);
    console.log('Uploaded File:', req.file);
    
    // With Cloudinary, req.file now contains Cloudinary-specific info
    // including the secure URL and public_id
    
    // Constructing the post data
    const postData = {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      excerpt: req.body.excerpt,
      status: req.body.status || 'published',
      author: req.body.author || "hijahappy",
      // Store Cloudinary image details
      coverImage: req.file ? {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public ID
        width: req.file.width,
        height: req.file.height
      } : null
    };
    
    console.log('Post Data:', postData);
    const newPost = new Post(postData);
    await newPost.save();
    
    res.status(201).json({ 
      message: "Blog post created successfully", 
      post: newPost 
    });
    
  } catch (err) {
    console.error('Error during blog creation:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Post.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET single blog by ID
router.get('/:id', async (req, res) => {
  try {
    const blog = await Post.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    console.error("Error fetching blog by ID:", err);
    res.status(500).json({ message: err.message });
  }
});

// Update blog post
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Post.findById(blogId);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Update fields
    blog.title = req.body.title || blog.title;
    blog.content = req.body.content || blog.content;
    blog.category = req.body.category || blog.category;
    blog.tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : blog.tags;
    blog.excerpt = req.body.excerpt || blog.excerpt;
    blog.status = req.body.status || blog.status;
    blog.author = req.body.author || blog.author;
    
    // If a new image was uploaded, update the image data
    if (req.file) {
      // If there's an existing image, you might want to delete it from Cloudinary
      if (blog.coverImage && blog.coverImage.publicId) {
        try {
          await cloudinary.uploader.destroy(blog.coverImage.publicId);
        } catch (deleteErr) {
          console.error("Error deleting old image:", deleteErr);
          // Continue even if deletion fails
        }
      }
      
      // Update with new image
      blog.coverImage = {
        url: req.file.path,
        publicId: req.file.filename,
        width: req.file.width,
        height: req.file.height
      };
    }
    
    const updatedBlog = await blog.save();
    res.json({
      message: "Blog post updated successfully",
      post: updatedBlog
    });
    
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete blog post
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Post.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Delete image from Cloudinary if exists
    if (blog.coverImage && blog.coverImage.publicId) {
      try {
        await cloudinary.uploader.destroy(blog.coverImage.publicId);
      } catch (deleteErr) {
        console.error("Error deleting image:", deleteErr);
        // Continue even if deletion fails
      }
    }
    
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully' });
    
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
