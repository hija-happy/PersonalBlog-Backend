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
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Configure Cloudinary




app.use('/api/blogs', blogRoutes);

app.get('/', (req, res) => {
  res.send('I can run!');
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});