const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const blogRoutes = require("./routes/blogRoutes");
const cors = require("cors");
const path = require("path");

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/blogs', blogRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send('I can run!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
