import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn()
  }
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn()
  }
}));

jest.unstable_mockModule('validator', () => ({
  default: {
    isEmail: jest.fn()
  }
}));

jest.unstable_mockModule('../config/postgres.js', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Import modules dynamically AFTER mocking
const jwt = (await import('jsonwebtoken')).default;
const bcrypt = (await import('bcrypt')).default;
const validator = (await import('validator')).default;
const { pool } = await import('../config/postgres.js');
const { loginUser, registerUser } = await import('./userController.js');

describe('User Controller Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('loginUser', () => {
    it('should return error if user does not exist', async () => {
      req.body = { email: 'test@test.com', password: 'password123' };
      pool.query.mockResolvedValue({ rows: [] });

      await loginUser(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        "SELECT id, password FROM users WHERE email = $1 LIMIT 1",
        ['test@test.com']
      );
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "User doesn't exist" });
    });

    it('should return error if password does not match', async () => {
      req.body = { email: 'test@test.com', password: 'wrongpassword' };
      pool.query.mockResolvedValue({ rows: [{ id: 'user1', password: 'hashedpassword' }] });
      bcrypt.compare.mockResolvedValue(false);

      await loginUser(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid credentials" });
    });

    it('should return token if login is successful', async () => {
      req.body = { email: 'test@test.com', password: 'correctpassword' };
      pool.query.mockResolvedValue({ rows: [{ id: 'user1', password: 'hashedpassword' }] });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mocked_token');

      await loginUser(req, res);

      expect(jwt.sign).toHaveBeenCalledWith({ id: 'user1' }, 'test_secret');
      expect(res.json).toHaveBeenCalledWith({ success: true, token: 'mocked_token' });
    });
  });

  describe('registerUser', () => {
    it('should return error if user already exists', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: 'password123' };
      pool.query.mockResolvedValue({ rows: [{ id: 'user1' }] }); // existing user found

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: false, message: "User already exists" });
    });

    it('should return error if email is invalid', async () => {
      req.body = { name: 'Test', email: 'invalid_email', password: 'password123' };
      pool.query.mockResolvedValue({ rows: [] });
      validator.isEmail.mockReturnValue(false);

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Please enter a valid email" });
    });

    it('should return error if password is too short', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: '123' };
      pool.query.mockResolvedValue({ rows: [] });
      validator.isEmail.mockReturnValue(true);

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Please enter a strong password" });
    });

    it('should register user and return token on success', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: 'password123' };
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // first query: check existing user
        .mockResolvedValueOnce({ rows: [{ id: 'new_user_id' }] }); // second query: insert user
      
      validator.isEmail.mockReturnValue(true);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedpassword');
      jwt.sign.mockReturnValue('new_token');

      await registerUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({ success: true, token: 'new_token' });
    });
  });
});
