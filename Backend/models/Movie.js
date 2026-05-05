const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  overview: {
    type: String,
    required: true
  },
  posterPath: {
    type: String,
    default: null
  },
  backdropPath: {
    type: String,
    default: null
  },
  releaseDate: {
    type: Date,
    default: null
  },
  genres: [{
    type: String
  }],
  voteAverage: {
    type: Number,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  popularity: {
    type: Number,
    default: 0
  },
  adult: {
    type: Boolean,
    default: false
  },
  originalLanguage: {
    type: String,
    default: 'en'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
movieSchema.index({ tmdbId: 1 });
movieSchema.index({ title: 'text', overview: 'text' });

module.exports = mongoose.model('Movie', movieSchema);
