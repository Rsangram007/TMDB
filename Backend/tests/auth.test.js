const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authRoutes = require('../routes/auth');

// Mock User model
jest.mock('../models/User', () => {
  const mockUsers = [];
  let nextId = 1;

  class MockUser {
    constructor(data) {
      Object.assign(this, data);
      this._id = `user_${nextId++}`;
      this.favorites = [];
      this.watchlist = [];
    }
    async save() { mockUsers.push(this); return this; }
    async comparePassword(candidate) {
      return this.password === candidate;
    }
  }

  const findOne = async (query) => {
    if (query.$or) {
      return mockUsers.find(u =>
        query.$or.some(cond =>
          (cond.email && u.email === cond.email) ||
          (cond.username && u.username === cond.username)
        )
      ) || null;
    }
    return mockUsers.find(u => u.email === query.email) || null;
  };

  const findById = async (id) => mockUsers.find(u => u._id === id) || null;

  MockUser.create = async (data) => {
    const user = new MockUser(data);
    await user.save();
    return user;
  };
  MockUser.findOne = findOne;
  MockUser.findById = findById;

  return MockUser;
});

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe('testuser');
      expect(res.body.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123'
        });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
      token = registerRes.body.token;
    });

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
