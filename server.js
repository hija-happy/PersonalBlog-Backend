const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const blogRoutes = require("./routes/blogRoutes");
const cors = require("cors");
const mongoose = require('mongoose');
const path = require('path'); 
const Post = require('./models/Blog');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { MongoClient } = require('mongodb');
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected from server.js'))
  .catch(err => console.error(err));

// Configure Cloudinary


app.post('/api/auth/register', async (req, res) => {
  try {
    // Extract user data from request body
    const { fullName, username, email, password } = req.body;

    // Validate required fields
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      await client.close();
      return res.status(409).json({ 
        message: existingUser.email === email 
          ? 'Email already in use' 
          : 'Username already taken' 
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user document
    const newUser = {
      fullName,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);
    
    // Close the connection
    await client.close();

    // Return success without sending password back
    const { password: _, ...userWithoutPassword } = newUser;
    
    return res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



app.use('/api/blogs', blogRoutes);

app.get('/', (req, res) => {
  res.send('I can run!');
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});