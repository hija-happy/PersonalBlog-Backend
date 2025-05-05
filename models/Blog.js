const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  category: {
    type: [String],
    required: [true, 'Category is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  coverImage: {
    url: String,      // Cloudinary secure URL
  },
  tags: [String],
  excerpt: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  },
  author: {
    type: String,
    ref: 'User',
    required: true,
    default: 'unknown'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);