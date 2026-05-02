const request = require('supertest');
const express = require('express');

describe('API Health Check', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date() });
    });
  });

  test('GET /health should return 200 with status ok', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('ok');
  });

  test('should have timestamp in response', async () => {
    const response = await request(app).get('/health');
    
    expect(response.body).toHaveProperty('timestamp');
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });
});
