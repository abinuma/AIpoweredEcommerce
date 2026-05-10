import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn()
  }
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn()
  }
}));

jest.unstable_mockModule('../config/postgres.js', () => ({
  pool: {
    query: jest.fn()
  },
  default: jest.fn()
}));

jest.unstable_mockModule('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn()
    }
  }
}));

jest.unstable_mockModule('stripe', () => {
  return {
    default: jest.fn(() => ({
      charges: { create: jest.fn() },
      paymentIntents: { create: jest.fn() }
    }))
  };
});

jest.unstable_mockModule('razorpay', () => {
  return {
    default: jest.fn(() => ({
      orders: { create: jest.fn() }
    }))
  };
});

jest.unstable_mockModule('../services/aiService.js', () => ({
  generateAIResponse: jest.fn(),
  summarizeReviews: jest.fn().mockResolvedValue({ summary: 'Mocked summary', pros: [], cons: [] }),
  rankProductByRelevance: jest.fn(),
  generateProductDescription: jest.fn().mockResolvedValue({ description: 'Mocked description', highlights: [] }),
  regenerateProductDescription: jest.fn().mockResolvedValue({ description: 'Mocked description', highlights: [] }),
  chatWithContext: jest.fn().mockResolvedValue({ reply: 'Mocked reply', suggestedProducts: [] }),
  getSearchIntent: jest.fn().mockReturnValue({
    original: 'Test',
    terms: ['test'],
    maxPrice: null,
    minPrice: null,
    categories: [],
    subCategories: []
  }),
  scoreProductForIntent: jest.fn().mockReturnValue(1)
}));

jest.unstable_mockModule('../middleware/multer.js', () => ({
  default: {
    fields: () => (req, res, next) => {
      req.files = { image1: [{ path: 'test_path' }] };
      next();
    }
  }
}));

// Import modules dynamically AFTER mocking
const jwt = (await import('jsonwebtoken')).default;
const bcrypt = (await import('bcrypt')).default;
const { pool } = await import('../config/postgres.js');

const { default: userRouter } = await import('./userRoute.js');
const { default: adminRouter } = await import('./adminRoute.js');
const { default: productRouter } = await import('./productRoute.js');
const { default: cartRouter } = await import('./cartRoute.js');
const { default: orderRouter } = await import('./orderRoute.js');
const { default: requestRoute } = await import('./requestRoute.js');
const { default: locationRoute } = await import('./locationRoute.js');
const { default: reviewRouter } = await import('./reviewRoute.js');
const { default: searchRouter } = await import('./searchRoute.js');
const { default: descriptionRouter } = await import('./descriptionRoute.js');
const { default: chatbotRouter } = await import('./chatbotRoute.js');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/request', requestRoute);
app.use('/api/location', locationRoute);
app.use('/api/review', reviewRouter);
app.use('/api/search', searchRouter);
app.use('/api/description', descriptionRouter);
app.use('/api/chatbot', chatbotRouter);

describe('Route Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockReset();
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('User Routes', () => {
    it('POST /api/user/login - should login user', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'user1', password: 'hashedpassword' }] });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mocked_token');

      const response = await request(app)
        .post('/api/user/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, token: 'mocked_token' });
    });

    it('POST /api/user/register - should register user', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // User does not exist
        .mockResolvedValueOnce({ rows: [{ id: 'new_user_id' }] });
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedpassword');
      jwt.sign.mockReturnValue('new_token');

      const response = await request(app)
        .post('/api/user/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, token: 'new_token' });
    });
  });

  describe('Admin Routes', () => {
    beforeEach(() => {
      jwt.verify.mockReturnValue({ id: 'admin1' }); // Mock auth middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'admin1', role: 'admin' }] }); // mock db user check
    });

    it('GET /api/admin/users - should get users', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'user1', count: 1 }] });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'valid_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/admin/products - should get products', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'prod1', count: 1 }] });

      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', 'valid_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/admin/analytics - should get analytics', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: 1, sum: 100 }] });

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', 'valid_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Product Routes', () => {
    it('GET /api/product/list - should list products', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'p1', name: 'Product 1' }] });

      const response = await request(app).get('/api/product/list').send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('POST /api/product/single - should get single product', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'p1', name: 'Product 1' }] });

      const response = await request(app)
        .post('/api/product/single')
        .send({ productId: 'p1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Cart Routes', () => {
    beforeEach(() => {
      jwt.verify.mockReturnValue({ id: 'user1' });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'user1', suspended: false }] }); // Auth Check
    });

    it('POST /api/cart/add - should add to cart', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // cart item check
        .mockResolvedValueOnce({ rows: [{ id: 'cart_item_1' }] }); // insert

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', 'valid_token')
        .send({ itemId: 'prod1', size: 'M' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/cart/get - should get cart items', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ product_id: 'prod1', quantity: 1, size: 'M' }] });

      const response = await request(app)
        .get('/api/cart/get')
        .set('Authorization', 'valid_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Order Routes', () => {
    beforeEach(() => {
      jwt.verify.mockReturnValue({ id: 'user1' });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'user1', suspended: false }] }); // Auth check
    });

    it('POST /api/order/place - should place COD order', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'prod1', seller_id: 'seller1', price: 100 }] }) // Product owner lookup
        .mockResolvedValueOnce({ rows: [{ id: 'order1' }] }) // Insert seller order
        .mockResolvedValueOnce({ rows: [] }); // Clear cart

      const response = await request(app)
        .post('/api/order/place')
        .set('Authorization', 'valid_token')
        .send({ items: [{ productId: 'prod1', size: 'M', quantity: 1, price: 100 }], amount: 100, address: { city: 'City' } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/order/userorders - should get user orders', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'order1' }] }) // Get orders
        .mockResolvedValueOnce({ rows: [{ product_id: 'prod1' }] }); // Get order items

      const response = await request(app)
        .get('/api/order/userorders')
        .set('Authorization', 'valid_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Request Routes', () => {
    beforeEach(() => {
      jwt.verify.mockReturnValue({ id: 'user1' });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'user1', suspended: false }] });
    });

    it('POST /api/request/seller-request - should create a request', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing
        .mockResolvedValueOnce({ rows: [{ id: 'req1' }] }); // Insert

      const response = await request(app)
        .post('/api/request/seller-request')
        .set('Authorization', 'valid_token')
        .send({ shopName: 'My Shop', businessRegistrationNumber: '123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Location Routes', () => {
    it('GET /api/location/nearby-shops - should return nearby shops', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'shop1', distance: 5 }] });

      const response = await request(app)
        .get('/api/location/nearby-shops')
        .query({ lat: 10, lng: 10, radius: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Review Routes', () => {
    it('GET /api/review/:productId - should get reviews', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'rev1', rating: 5 }] })
        .mockResolvedValueOnce({ rows: [{ total_reviews: 1, average_rating: 5, five_star: 1 }] });

      const response = await request(app).get('/api/review/prod1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/review/:productId/summary - should get review summary', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ summary_text: 'Good product' }] });

      const response = await request(app).get('/api/review/prod1/summary');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Search Routes', () => {
    it('GET /api/search/search - should return search results', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'prod1', name: 'Test', count: 1 }] });

      const response = await request(app)
        .get('/api/search/search')
        .query({ q: 'Test' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Description Routes', () => {
    beforeEach(() => {
      jwt.verify.mockReturnValue({ id: 'seller1' });
      pool.query.mockResolvedValue({ rows: [{ id: 'seller1', role: 'seller' }] });
    });

    it('POST /api/description/generate - should generate description', async () => {
      const response = await request(app)
        .post('/api/description/generate')
        .set('Authorization', 'valid_token')
        .send({ name: 'Prod1', category: 'Cat1', features: ['f1'] });

      if (response.status !== 200) console.log('Description Route Error:', response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Chatbot Routes', () => {
    it('POST /api/chatbot/session - should start a session', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'sess1', session_id: 'sess1' }] });

      const response = await request(app).post('/api/chatbot/session').send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});
