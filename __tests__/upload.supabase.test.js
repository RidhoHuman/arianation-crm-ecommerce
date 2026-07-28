jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: (bucket) => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: jest
          .fn()
          .mockResolvedValue({ data: { signedUrl: 'https://signed.example' }, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  })),
}));

// Temporarily set env vars so USE_SUPABASE becomes true during module load
const OLD_SUPABASE_URL = process.env.SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OLD_SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key';
process.env.SUPABASE_STORAGE_BUCKET = 'uploads';

const { uploadBufferToSupabase } = require('../src/middleware/upload');

afterAll(() => {
  process.env.SUPABASE_URL = OLD_SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = OLD_SUPABASE_KEY;
  process.env.SUPABASE_STORAGE_BUCKET = OLD_SUPABASE_BUCKET;
});

describe('Supabase upload helper', () => {
  test('uploads buffer without throwing', async () => {
    const buf = Buffer.from('hello world');
    await expect(
      uploadBufferToSupabase('products/test-file.txt', buf, 'text/plain')
    ).resolves.toBeUndefined();
  });
});
