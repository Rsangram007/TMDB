const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Movie = require('../models/Movie');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// TMDB config (synced with tmdb.js)
const TMDB_API_KEY = process.env.TMDB_BEARER || process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE || process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const FALLBACK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjMjFhNmIzYWQ1MmJjOTNhZmY1ZmY3ODEyOWI5ZjViNiIsIm5iZiI6MTc1NDEyNTg1Ny44NzksInN1YiI6IjY4OGRkNjIxOWIwMTVjMDk1OWRlNjRlNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.5KZmXJL8e5Znn-t2udettH4bS95MHWgPWYW67They5g';
const TMDB_TOKEN = TMDB_API_KEY || FALLBACK_TOKEN;

// Fetch movie from TMDB and save to local DB if missing
const findOrCreateMovie = async (tmdbId) => {
  let movie = await Movie.findOne({ tmdbId });
  if (movie) return movie;

  if (!TMDB_TOKEN) {
    throw new Error('TMDB_API_KEY not configured');
  }

  const { data } = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
    headers: {
      'Authorization': `Bearer ${TMDB_TOKEN}`,
      'accept': 'application/json'
    }
  });

  movie = await Movie.findOneAndUpdate(
    { tmdbId: data.id },
    {
      tmdbId: data.id,
      title: data.title,
      overview: data.overview,
      posterPath: data.poster_path,
      backdropPath: data.backdrop_path,
      releaseDate: data.release_date ? new Date(data.release_date) : null,
      genres: data.genres?.map(g => g.name) || [],
      voteAverage: data.vote_average,
      voteCount: data.vote_count,
      popularity: data.popularity,
      adult: data.adult,
      originalLanguage: data.original_language
    },
    { upsert: true, new: true }
  );

  return movie;
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

    const movie = await findOrCreateMovie(movieId);

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

    // Find movie by TMDB ID (fetch from TMDB if missing so we have its _id)
    const movie = await findOrCreateMovie(movieId);

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

    const movie = await findOrCreateMovie(movieId);

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

    // Find movie by TMDB ID (fetch from TMDB if missing so we have its _id)
    const movie = await findOrCreateMovie(movieId);

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
 