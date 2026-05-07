const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectRedis } = require('./utils/cache');

// Load environment variables
dotenv.config(); 
 
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'development'
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174']
    : process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {

})
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Redis connection (optional - app works without it)
connectRedis().catch(() => {
  console.log('Redis not available - caching disabled');
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'TMDB Platform API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const tmdbRoutes = require('./routes/tmdb');
const userRoutes = require('./routes/user');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/user', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
