jest.mock('@sentry/node', () => {
  const mockScope = {
    setUser: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
    addBreadcrumb: jest.fn(),
  };
  return {
    withScope: jest.fn((cb) => cb(mockScope)),
    captureException: jest.fn(),
    // expose mockScope for assertions via require cache
    __mockScope: mockScope,
  };
});

const Sentry = require('@sentry/node');

// Ensure Sentry is considered enabled during this test
const OLD_SENTRY_DSN = process.env.SENTRY_DSN;
process.env.SENTRY_DSN = 'test_dsn';

const { sentryCapture } = require('../src/middleware/upload');

afterAll(() => {
  process.env.SENTRY_DSN = OLD_SENTRY_DSN;
});

describe('sentryCapture helper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sets user, tags, extras and captures exception', () => {
    const err = new Error('boom');
    const req = {
      user: { id: 'u123', email: 'u@example.com', role: 'CUSTOMER' },
      file: {
        filename: 'design_1.png',
        originalname: 'orig.png',
        mimetype: 'image/png',
        size: 12345,
        buffer: Buffer.alloc(10),
      },
      originalUrl: '/api/design-requests/req123/upload-file',
      method: 'POST',
      params: { id: 'req123' },
      headers: { 'user-agent': 'jest-agent', referer: 'http://example.com', host: 'localhost' },
    };

    sentryCapture(err, req, { extra1: 'value1' });

    // withScope called once
    expect(Sentry.withScope).toHaveBeenCalledTimes(1);

    const mockScope = Sentry.__mockScope;

    // user set
    expect(mockScope.setUser).toHaveBeenCalledWith({ id: 'u123', email: 'u@example.com' });
    expect(mockScope.setTag).toHaveBeenCalledWith('user_role', 'CUSTOMER');

    // file tags/extras
    expect(mockScope.setTag).toHaveBeenCalledWith('filename', 'design_1.png');
    expect(mockScope.setTag).toHaveBeenCalledWith('file_mimetype', 'image/png');
    expect(mockScope.setExtra).toHaveBeenCalledWith('originalName', 'orig.png');
    expect(mockScope.setExtra).toHaveBeenCalledWith('fileSize', 12345);

    // route/method
    expect(mockScope.setTag).toHaveBeenCalledWith(
      'route',
      '/api/design-requests/req123/upload-file'
    );
    expect(mockScope.setExtra).toHaveBeenCalledWith('method', 'POST');

    // id tagged as designRequestId
    expect(mockScope.setTag).toHaveBeenCalledWith('designRequestId', 'req123');

    // breadcrumb added
    expect(mockScope.addBreadcrumb).toHaveBeenCalled();

    // extra passed
    expect(mockScope.setExtra).toHaveBeenCalledWith('extra1', 'value1');

    // captureException called with err
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });
});
