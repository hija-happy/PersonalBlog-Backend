// pages/api/posts/[id].js - Handle GET, PUT, DELETE for single post
import dbConnect from '../../../utils/dbConnect';
import Post from '../../../models/Post';
import { uploadMiddleware } from '../../../middleware/uploadMiddleware';
import { uploadImage, deleteImage } from '../../../utils/cloudinary';

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser for file uploads
  },
};

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const post = await Post.findById(id).populate('author', 'name avatar');
        
        if (!post) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, data: post });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'PUT':
      try {
        // Process file upload if present
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          await uploadMiddleware('coverImage')(req, res);
        }

        // Get existing post
        const existingPost = await Post.findById(id);
        if (!existingPost) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Parse the updated post data
        const postData = JSON.parse(req.body.postData || '{}');
        
        // Process tags from string to array
        if (postData.tags && typeof postData.tags === 'string') {
          postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }

        // Handle cover image updates
        if (req.file) {
          // Upload new image
          const imageData = await uploadImage(req.file);
          postData.coverImage = imageData;
          
          // Delete old image if exists
          if (existingPost.coverImage && existingPost.coverImage.publicId) {
            await deleteImage(existingPost.coverImage.publicId);
          }
        } else if (postData.coverImage === null) {
          // If coverImage is explicitly set to null, delete the old image
          if (existingPost.coverImage && existingPost.coverImage.publicId) {
            await deleteImage(existingPost.coverImage.publicId);
          }
          postData.coverImage = null;
        } else {
          // If no new image is uploaded and not explicitly deleted, keep the existing one
          postData.coverImage = existingPost.coverImage;
        }

        // Update the post
        postData.updatedAt = Date.now();
        const updatedPost = await Post.findByIdAndUpdate(id, postData, {
          new: true,
          runValidators: true,
        }).populate('author', 'name avatar');

        if (!updatedPost) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, data: updatedPost });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'DELETE':
      try {
        const post = await Post.findById(id);
        
        if (!post) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Delete image from Cloudinary if exists
        if (post.coverImage && post.coverImage.publicId) {
          await deleteImage(post.coverImage.publicId);
        }

        // Delete post from database
        await Post.findByIdAndDelete(id);

        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, message: 'Invalid method' });
      break;
  }
}