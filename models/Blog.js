const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  category: {
    type: [String],
    required: [true, 'Category is required'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  coverImage: {
    url: {
      type: String,
      required: false,
    },
    publicId: {
      type: String,
      required: false,
    },
  },
  tags: {
    type: [String],
    default: [],
  },
  excerpt: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published',
  },
  author: {
    type: String,
    default: 'unknown',
    trim: true,
  },
}, {
  timestamps: true // auto-manages createdAt & updatedAt
});

// Optional: Update updatedAt on manual updates if timestamps not used
// PostSchema.pre('save', function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
