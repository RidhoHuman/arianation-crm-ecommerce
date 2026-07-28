const axios = require('axios');

const biteshipApi = axios.create({
  baseURL: 'https://api.biteship.com/v1',
  headers: {
    Authorization: process.env.BITESHIP_API_KEY,
    'Content-Type': 'application/json',
  },
});

// Interceptor for logging in development
if (process.env.NODE_ENV === 'development') {
  biteshipApi.interceptors.request.use((request) => {
    console.log('[Biteship API Request]', request.method.toUpperCase(), request.url);
    return request;
  });

  biteshipApi.interceptors.response.use(
    (response) => {
      console.log('[Biteship API Response]', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error(
        '[Biteship API Error]',
        error.response?.status,
        error.message,
        error.response?.data
      );
      return Promise.reject(error);
    }
  );
}

module.exports = biteshipApi;
