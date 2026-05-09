import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn()
  }
}));

jest.unstable_mockModule('../config/postgres.js', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Import modules dynamically AFTER mocking
const jwt = (await import('jsonwebtoken')).default;
const { pool } = await import('../config/postgres.js');
const { default: authUser, isSuspended } = await import('./auth.js');
const { default: adminAuth } = await import('./adminAuth.js');
const { default: sellerAuth } = await import('./sellerAuth.js');

describe('Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authUser', () => {
    it('should return error if no token is provided', async () => {
      await authUser(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not  Authorized Login Again' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next and set req.userId if token is valid', async () => {
      req.headers.authorization = 'valid_token';
      jwt.verify.mockReturnValue({ id: 'user123' });

      await authUser(req, res, next);
      
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
      expect(req.userId).toBe('user123');
      expect(next).toHaveBeenCalled();
    });

    it('should return error if token is invalid', async () => {
      req.headers.authorization = 'invalid_token';
      jwt.verify.mockImplementation(() => { throw new Error('jwt malformed'); });

      await authUser(req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'jwt malformed' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isSuspended', () => {
    it('should call next if user is not suspended', async () => {
      req.userId = 'user123';
      pool.query.mockResolvedValue({ rows: [{ suspended: false }] });

      await isSuspended(req, res, next);

      expect(pool.query).toHaveBeenCalledWith("SELECT suspended FROM users WHERE id=$1 LIMIT 1 ", ['user123']);
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user is suspended', async () => {
      req.userId = 'user123';
      pool.query.mockResolvedValue({ rows: [{ suspended: true }] });

      await isSuspended(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "your account has been suspended" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('adminAuth', () => {
    it('should call next if user is an admin', async () => {
      req.headers.authorization = 'valid_token';
      jwt.verify.mockReturnValue({ id: 'admin123' });
      pool.query.mockResolvedValue({ rows: [{ role: 'admin' }] });

      await adminAuth(req, res, next);

      expect(req.userId).toBe('admin123');
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user is not an admin', async () => {
      req.headers.authorization = 'valid_token';
      jwt.verify.mockReturnValue({ id: 'client123' });
      pool.query.mockResolvedValue({ rows: [{ role: 'client' }] });

      await adminAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "not Authorized login again" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('sellerAuth', () => {
    it('should call next if user is a seller', async () => {
      req.headers.authorization = 'valid_token';
      jwt.verify.mockReturnValue({ id: 'seller123' });
      pool.query.mockResolvedValue({ rows: [{ role: 'seller' }] });

      await sellerAuth(req, res, next);

      expect(req.userId).toBe('seller123');
      expect(next).toHaveBeenCalled();
    });

    it('should call next if user is an admin', async () => {
      req.headers.authorization = 'valid_token';
      jwt.verify.mockReturnValue({ id: 'admin123' });
      pool.query.mockResolvedValue({ rows: [{ role: 'admin' }] });

      await sellerAuth(req, res, next);

      expect(req.userId).toBe('admin123');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if user is neither seller nor admin', async () => {
      req.headers.authorization = 'valid_token';
      jwt.verify.mockReturnValue({ id: 'client123' });
      pool.query.mockResolvedValue({ rows: [{ role: 'client' }] });

      await sellerAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
