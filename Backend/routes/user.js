const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Movie = require('../models/Movie');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Add movie to favorites
router.post('/favorites', verifyToken, async (req, res) => {
  try {
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID is required'
      });
    }

    // Check if movie exists in our database
    const movie = await Movie.findOne({ tmdbId: movieId });
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Check if already in favorites
    if (req.user.favorites.includes(movie._id)) {
      return res.status(400).json({
        success: false,
        message: 'Movie already in favorites'
      });
    }

    // Add to favorites
    req.user.favorites.push(movie._id);
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Movie added to favorites',
      favorites: req.user.favorites
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add movie to favorites',
      error: error.message
    });
  }
});

// Remove movie from favorites
router.delete('/favorites/:movieId', verifyToken, async (req, res) => {
  try {
    const { movieId } = req.params;

    // Find movie by TMDB ID
    const movie = await Movie.findOne({ tmdbId: movieId });
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Remove from favorites
    req.user.favorites = req.user.favorites.filter(
      favoriteId => !favoriteId.equals(movie._id)
    );
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Movie removed from favorites',
      favorites: req.user.favorites
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove movie from favorites',
      error: error.message
    });
  }
});

// Add movie to watchlist
router.post('/watchlist', verifyToken, async (req, res) => {
  try {
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID is required'
      });
    }

    // Check if movie exists in our database
    const movie = await Movie.findOne({ tmdbId: movieId });
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Check if already in watchlist
    if (req.user.watchlist.includes(movie._id)) {
      return res.status(400).json({
        success: false,
        message: 'Movie already in watchlist'
      });
    }

    // Add to watchlist
    req.user.watchlist.push(movie._id);
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Movie added to watchlist',
      watchlist: req.user.watchlist
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add movie to watchlist',
      error: error.message
    });
  }
});

// Remove movie from watchlist
router.delete('/watchlist/:movieId', verifyToken, async (req, res) => {
  try {
    const { movieId } = req.params;

    // Find movie by TMDB ID
    const movie = await Movie.findOne({ tmdbId: movieId });
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Remove from watchlist
    req.user.watchlist = req.user.watchlist.filter(
      watchlistId => !watchlistId.equals(movie._id)
    );
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Movie removed from watchlist',
      watchlist: req.user.watchlist
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove movie from watchlist',
      error: error.message
    });
  }
});

// Get user's favorites
router.get('/favorites', verifyToken, async (req, res) => {
  try {
    const favorites = await Movie.find({ _id: { $in: req.user.favorites } });
    
    res.status(200).json({
      success: true,
      data: favorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
      error: error.message
    });
  }
});

// Get user's watchlist
router.get('/watchlist', verifyToken, async (req, res) => {
  try {
    const watchlist = await Movie.find({ _id: { $in: req.user.watchlist } });
    
    res.status(200).json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch watchlist',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { username, avatar } = req.body;
    
    // Update user fields
    if (username) req.user.username = username;
    if (avatar) req.user.avatar = avatar;
    
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

module.exports = router;
