jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: (bucket) => ({
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.example/url' }, error: null }),
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

const { createSignedUrl } = require('../src/middleware/upload');

afterAll(() => {
  process.env.SUPABASE_URL = OLD_SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = OLD_SUPABASE_KEY;
  process.env.SUPABASE_STORAGE_BUCKET = OLD_SUPABASE_BUCKET;
});

describe('Supabase signed URL helper', () => {
  test('returns signed URL', async () => {
    const url = await createSignedUrl('products/test.png', 120);
    expect(url).toBe('https://signed.example/url');
  });
});
