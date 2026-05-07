const request = require('supertest');
const express = require('express');
const axios = require('axios');
const tmdbRoutes = require('../routes/tmdb');

jest.mock('axios');

const app = express();
app.use(express.json());
app.use('/api/tmdb', tmdbRoutes);

describe('TMDB Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockTMDBResponse = (data) => {
    axios.get.mockResolvedValueOnce({ data });
  };

  describe('GET /api/tmdb/movies/popular', () => {
    it('should return popular movies', async () => {
      mockTMDBResponse({
        page: 1,
        results: [
          { id: 1, title: 'Test Movie', poster_path: '/test.jpg' }
        ]
      });

      const res = await request(app).get('/api/tmdb/movies/popular');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toHaveLength(1);
    });

    it('should handle TMDB API errors', async () => {
      axios.get.mockRejectedValueOnce({
        response: { status: 500, data: { message: 'TMDB Error' } }
      });

      const res = await request(app).get('/api/tmdb/movies/popular');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/tmdb/movies/:id', () => {
    it('should return movie details', async () => {
      mockTMDBResponse({
        id: 550,
        title: 'Fight Club',
        overview: 'A ticking-time-bomb insomniac...',
        poster_path: '/test.jpg',
        genres: [{ id: 1, name: 'Drama' }]
      });

      const res = await request(app).get('/api/tmdb/movies/550');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Fight Club');
    });
  });

  describe('GET /api/tmdb/search/movies', () => {
    it('should search movies', async () => {
      mockTMDBResponse({
        page: 1,
        results: [{ id: 1, title: 'Avengers' }]
      });

      const res = await request(app)
        .get('/api/tmdb/search/movies?query=avengers');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require query parameter', async () => {
      const res = await request(app)
        .get('/api/tmdb/search/movies');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('query is required');
    });
  });

  describe('GET /api/tmdb/movies/:id/credits', () => {
    it('should return movie credits', async () => {
      mockTMDBResponse({
        id: 550,
        cast: [{ id: 1, name: 'Brad Pitt' }],
        crew: [{ id: 2, name: 'David Fincher', job: 'Director' }]
      });

      const res = await request(app).get('/api/tmdb/movies/550/credits');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cast).toBeDefined();
    });
  });

  describe('GET /api/tmdb/movies/:id/videos', () => {
    it('should return movie videos', async () => {
      mockTMDBResponse({
        id: 550,
        results: [{ id: 'abc123', key: 'test-key', type: 'Trailer' }]
      });

      const res = await request(app).get('/api/tmdb/movies/550/videos');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/tmdb/movies/:id/recommendations', () => {
    it('should return movie recommendations', async () => {
      mockTMDBResponse({
        page: 1,
        results: [{ id: 2, title: 'Recommended Movie' }]
      });

      const res = await request(app).get('/api/tmdb/movies/550/recommendations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/tmdb/trending/movies', () => {
    it('should return trending movies', async () => {
      mockTMDBResponse({
        page: 1,
        results: [{ id: 1, title: 'Trending Movie' }]
      });

      const res = await request(app).get('/api/tmdb/trending/movies?time_window=week');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/tmdb/genres/movie', () => {
    it('should return movie genres', async () => {
      mockTMDBResponse({
        genres: [{ id: 28, name: 'Action' }, { id: 35, name: 'Comedy' }]
      });

      const res = await request(app).get('/api/tmdb/genres/movie');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.genres).toHaveLength(2);
    });
  });

  describe('GET /api/tmdb/movies/top_rated', () => {
    it('should return top rated movies', async () => {
      mockTMDBResponse({
        page: 1,
        results: [{ id: 1, title: 'Top Rated', vote_average: 9.5 }]
      });

      const res = await request(app).get('/api/tmdb/movies/top_rated');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/tmdb/movies/upcoming', () => {
    it('should return upcoming movies', async () => {
      mockTMDBResponse({
        page: 1,
        results: [{ id: 1, title: 'Upcoming Movie' }]
      });

      const res = await request(app).get('/api/tmdb/movies/upcoming');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
