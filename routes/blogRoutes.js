const express = require('express');
const router = express.Router();
const Post = require('../models/Blog');
const { upload, cloudinary } = require('../config/cloudinary');

// Custom error class for API errors
class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'APIError';
  }
}

// ✅ Create Blog Post
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new APIError('No image file uploaded', 400);
    }

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
      excerpt: req.body.excerpt || '',
      status: req.body.status || 'published',
      author: req.body.author || 'unknown',
      coverImage: {
        url,
        publicId,
      },
    };

    const newPost = new Post(postData);
    await newPost.save();

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: newPost,
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Get All Blogs
router.get('/', async (req, res, next) => {
  try {
    const { status, category, tag, limit = 10, page = 1 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalPosts = await Post.countDocuments(query);

    res.json({
      success: true,
      count: blogs.length,
      totalPages: Math.ceil(totalPosts / parseInt(limit)),
      data: blogs
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Get Single Blog by ID
router.get('/:id', async (req, res, next) => {
  try {
    const blog = await Post.findById(req.params.id);
    if (!blog) {
      throw new APIError('Blog not found', 404);
    }
    res.json({
      success: true,
      data: blog
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Update Blog Post
router.put('/:id', upload.single('file'), async (req, res, next) => {
  try {
    const blog = await Post.findById(req.params.id);
    if (!blog) {
      throw new APIError('Blog not found', 404);
    }

    const updateData = {
      title: req.body.title,
      content: req.body.content,
      category: Array.isArray(req.body.category)
        ? req.body.category
        : req.body.category.split(',').map(c => c.trim()),
      tags: req.body.tags
        ? req.body.tags.split(',').map(tag => tag.trim())
        : [],
      excerpt: req.body.excerpt,
      status: req.body.status,
      author: req.body.author,
    };

    // Handle image update if new file is uploaded
    if (req.file) {
      // Delete old image if exists
      if (blog.coverImage?.publicId) {
        await cloudinary.uploader.destroy(blog.coverImage.publicId);
      }
      
      // Add new image data
      updateData.coverImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const updatedBlog = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedBlog,
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Delete Blog Post
router.delete('/:id', async (req, res, next) => {
  try {
    const blog = await Post.findById(req.params.id);
    if (!blog) {
      throw new APIError('Blog not found', 404);
    }

    if (blog.coverImage?.publicId) {
      await cloudinary.uploader.destroy(blog.coverImage.publicId);
    }

    await blog.deleteOne();
    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
