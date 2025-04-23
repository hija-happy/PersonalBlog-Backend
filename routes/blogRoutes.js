// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Blog');
const { upload, cloudinary } = require('../config/cloudinary');

// ✅ Create Blog Post
router.post('/', upload.single('file'), async (req, res) => {
  try {
    console.log(req.file)
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Extract file info from Cloudinary upload
    const { path: url, filename: publicId } = req.file;

    const postData = {
      title: req.body.title,
      content: req.body.content,
      category: Array.isArray(req.body.category)
        ? req.body.category
        : req.body.category.split(',').map(c => c.trim()),

      tags: req.body.tags
        ? req.body.tags.split(',').map(tag => tag.trim())
        : [],

      excerpt: req.body.excerpt,
      status: req.body.status || 'published',
      author: req.body.author || 'unknown',

      coverImage: {
        url,
        publicId
      }
    };

    const newPost = new Post(postData);
    await newPost.save();

    res.status(201).json({ message: 'Blog post created successfully', post: newPost });
  } catch (err) {
    console.error('Error creating blog post:', err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Get All Blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Post.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get Single Blog by ID
router.get('/:id', async (req, res) => {
  try {
    const blog = await Post.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete Blog Post
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Post.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.coverImage && blog.coverImage.publicId) {
      await cloudinary.uploader.destroy(blog.coverImage.publicId);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
