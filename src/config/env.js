// src/config/env.js

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '7d',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  xendit: {
    apiKey: process.env.XENDIT_API_KEY || '',
    webhookToken: process.env.XENDIT_WEBHOOK_VERIFY_TOKEN || '',
  },
};

module.exports = { config, validateEnv };
