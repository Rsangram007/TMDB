const express = require('express');
const axios = require('axios');
const Movie = require('../models/Movie');
const router = express.Router();

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

// Validate config at startup
if (!TMDB_API_KEY) {
  console.error('ERROR: TMDB_API_KEY is not set in .env file');
}
if (!process.env.TMDB_BASE_URL) {
  console.warn('WARNING: TMDB_BASE_URL not set in .env, using default:', TMDB_BASE_URL);
}

// Fallback Bearer token for TMDB API access
const FALLBACK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjMjFhNmIzYWQ1MmJjOTNhZmY1ZmY3ODEyOWI5ZjViNiIsIm5iZiI6MTc1NDEyNTg1Ny44NzksInN1YiI6IjY4OGRkNjIxOWIwMTVjMDk1OWRlNjRlNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.5KZmXJL8e5Znn-t2udettH4bS95MHWgPWYW67They5g';
const TMDB_TOKEN = TMDB_API_KEY || FALLBACK_TOKEN;

// Helper function to make TMDB API requests
const tmdbRequest = async (endpoint, params = {}) => {
  if (!TMDB_TOKEN) {
    const err = new Error('TMDB_API_KEY is not configured. Please add it to your .env file.');
    err.isConfigError = true;
    throw err;
  }

  try {
    const url = `${TMDB_BASE_URL}${endpoint}`;
    console.log('TMDB Request:', url);

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${TMDB_TOKEN}`,
        'accept': 'application/json'
      },
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('TMDB API error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Message:', error.message);
    throw error;
  }
};

// Get popular movies
router.get('/movies/popular', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbRequest('/movie/popular', { page });
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Popular movies error:', error.message);
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch popular movies',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Get movie details
router.get('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdbRequest(`/movie/${id}`, {
      append_to_response: 'credits,videos,similar'
    });
    
    // Save movie to our database if not exists
    await Movie.findOneAndUpdate(
      { tmdbId: data.id },
      {
        tmdbId: data.id,
        title: data.title,
        overview: data.overview,
        posterPath: data.poster_path,
        backdropPath: data.backdrop_path,
        releaseDate: data.release_date ? new Date(data.release_date) : null,
        genres: data.genres?.map(genre => genre.name) || [],
        voteAverage: data.vote_average,
        voteCount: data.vote_count,
        popularity: data.popularity,
        adult: data.adult,
        originalLanguage: data.original_language
      },
      { upsert: true, new: true }
    );
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch movie details',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Search movies
router.get('/search/movies', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const data = await tmdbRequest('/search/movie', { query, page });
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to search movies',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Get trending movies
router.get('/trending/movies', async (req, res) => {
  try {
    const { time_window = 'day' } = req.query;
    const data = await tmdbRequest(`/trending/movie/${time_window}`);
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch trending movies',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Get movie genres
router.get('/genres/movie', async (req, res) => {
  try {
    const data = await tmdbRequest('/genre/movie/list', { language: 'en' });

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch movie genres',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Get movies by genre
router.get('/movies/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;
    
    const data = await tmdbRequest('/discover/movie', {
      with_genres: genreId,
      page
    });
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch movies by genre',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
}); 
 
// Get popular people
router.get('/people/popular', async (req, res) => {
  try {
    const { page = 1, language = 'en-US' } = req.query;
    const data = await tmdbRequest('/person/popular', { page, language });

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch popular people',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

module.exports = router;
