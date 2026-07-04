module.exports = {
  testEnvironment: 'node',
  globalSetup: '<rootDir>/__tests__/globalSetup.js',
  setupFilesAfterEnv: ['<rootDir>/__tests__/jest.setup.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
  ],
  verbose: true,
};
