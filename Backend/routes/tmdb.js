const express = require('express');
const axios = require('axios');
const Movie = require('../models/Movie');
const { getCachedResponse, cacheResponse, generateCacheKey } = require('../utils/cache');
const router = express.Router();

// TMDB API configuration - support both old and assignment-spec variable names
const TMDB_API_KEY = process.env.TMDB_BEARER || process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE || process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
 
// Validate config at startup
if (!TMDB_API_KEY) {
  console.error('ERROR: TMDB_BEARER (or TMDB_API_KEY) is not set in .env file');
}
if (!process.env.TMDB_BASE && !process.env.TMDB_BASE_URL) {
  console.warn('WARNING: TMDB_BASE not set in .env, using default:', TMDB_BASE_URL);
}

// Fallback Bearer token for TMDB API access
const FALLBACK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjMjFhNmIzYWQ1MmJjOTNhZmY1ZmY3ODEyOWI5ZjViNiIsIm5iZiI6MTc1NDEyNTg1Ny44NzksInN1YiI6IjY4OGRkNjIxOWIwMTVjMDk1OWRlNjRlNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.5KZmXJL8e5Znn-t2udettH4bS95MHWgPWYW67They5g';
const TMDB_TOKEN = TMDB_API_KEY || FALLBACK_TOKEN;

// Image URL helpers
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const getImageUrl = (path, size = 'w500') => {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
};

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

// Cached TMDB request wrapper
const cachedTmdbRequest = async (endpoint, params = {}, cachePrefix, ttl = 300) => {
  const cacheKey = generateCacheKey(cachePrefix, params);
  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    console.log('Cache hit:', cacheKey);
    return cached;
  }
  const data = await tmdbRequest(endpoint, params);
  await cacheResponse(cacheKey, data, ttl);
  return data;
};

// Get popular movies
router.get('/movies/popular', async (req, res) => {
  try {
    const { page = 1, language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest('/movie/popular', { page, language }, 'popular', 300);
    
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
    const { language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest(`/movie/${id}`, {
      append_to_response: 'credits,videos,similar',
      language
    }, `movie:${id}`, 600);
    
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

// Get movie credits
router.get('/movies/:id/credits', async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest(`/movie/${id}/credits`, { language }, `movie:${id}:credits`, 600);
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch movie credits',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Get movie videos (trailers & clips)
router.get('/movies/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest(`/movie/${id}/videos`, { language }, `movie:${id}:videos`, 600);
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch movie videos',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Get movie recommendations
router.get('/movies/:id/recommendations', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest(`/movie/${id}/recommendations`, { page, language }, `movie:${id}:recommendations`, 300);
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch movie recommendations',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Search movies
router.get('/search/movies', async (req, res) => {
  try {
    const { query, page = 1, language = 'en-US' } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const data = await cachedTmdbRequest('/search/movie', { query, page, language }, 'search', 60);
    
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
    const { time_window = 'day', page = 1, language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest(`/trending/movie/${time_window}`, { page, language }, `trending:${time_window}`, 180);
    
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
    const { language = 'en' } = req.query;
    const data = await cachedTmdbRequest('/genre/movie/list', { language }, 'genres', 86400);

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
    const { page = 1, language = 'en-US', sort_by = 'popularity.desc' } = req.query;
    
    const data = await cachedTmdbRequest('/discover/movie', {
      with_genres: genreId,
      page,
      language,
      sort_by
    }, `genre:${genreId}`, 300);
    
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

// Get top rated movies
router.get('/movies/top_rated', async (req, res) => {
  try {
    const { page = 1, language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest('/movie/top_rated', { page, language }, 'top_rated', 300);
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch top rated movies',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Get upcoming movies
router.get('/movies/upcoming', async (req, res) => {
  try {
    const { page = 1, language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest('/movie/upcoming', { page, language }, 'upcoming', 300);
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch upcoming movies',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
});

// Get now playing movies
router.get('/movies/now_playing', async (req, res) => {
  try {
    const { page = 1, language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest('/movie/now_playing', { page, language }, 'now_playing', 300);
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    const status = error.isConfigError ? 503 : (error.response?.status || 500);
    res.status(status).json({
      success: false,
      message: error.isConfigError ? 'Server configuration error' : 'Failed to fetch now playing movies',
      error: error.message || 'Unknown error',
      details: error.response?.data || null
    });
  }
}); 
 
// Get popular people
router.get('/people/popular', async (req, res) => {
  try {
    const { page = 1, language = 'en-US' } = req.query;
    const data = await cachedTmdbRequest('/person/popular', { page, language }, 'people', 300);

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
