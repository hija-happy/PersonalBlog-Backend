const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const blogRoutes = require("./routes/blogRoutes");
const cors = require("cors");
const mongoose = require('mongoose');
const path = require('path'); 
const Post = require('./models/Blog');
dotenv.config();
connectDB();

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/blogs', blogRoutes);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});