// pages/api/posts/index.js - Handle GET all posts and POST new post
import dbConnect from '../../../utils/dbConnect';
import Post from '../../../models/Post';
import { uploadMiddleware } from '../../../middleware/uploadMiddleware';
import { uploadImage } from '../../../utils/cloudinary';

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser for file uploads
  },
};

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        // Get posts with optional filtering
        const { status, category, tag, limit = 10, page = 1 } = req.query;
        const query = {};

        if (status) query.status = status;
        if (category) query.category = category;
        if (tag) query.tags = { $in: [tag] };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const posts = await Post.find(query)
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .skip(skip)
          .select('-__v')
          .populate('author', 'name avatar');

        const totalPosts = await Post.countDocuments(query);

        res.status(200).json({
          success: true,
          count: posts.length,
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          data: posts
        });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'POST':
      try {
        // Process file upload if present
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          await uploadMiddleware('coverImage')(req, res);
        }

        // Create new post with data from body
        const postData = JSON.parse(req.body.postData || '{}');
        
        // Process tags from string to array
        if (postData.tags && typeof postData.tags === 'string') {
          postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }

        // Upload image to Cloudinary if file exists
        if (req.file) {
          const imageData = await uploadImage(req.file);
          postData.coverImage = imageData;
        }

        // Set author (this would come from authenticated user in a real app)
        // For now we'll use a placeholder user ID
        postData.author = '65aa123456789abcdef12345'; // Replace with actual user ID or auth logic

        const post = await Post.create(postData);
        
        res.status(201).json({ success: true, data: post });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, message: 'Invalid method' });
      break;
  }
}

