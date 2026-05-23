const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Skip test if required env vars missing
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_STORAGE_BUCKET) {
  // eslint-disable-next-line jest/no-done-callback
  test('Supabase real upload test skipped (missing env vars)', () => {
    expect(true).toBe(true);
  });
} else {
  describe('Supabase real upload (E2E)', () => {
    global.WebSocket = WebSocket;

    // require supabase only when env vars present to avoid loading optional deps
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    test('uploads buffer and creates signed URL', async () => {
      const key = `tests/e2e_test_${Date.now()}.txt`;
      const buffer = Buffer.from('e2e-test-' + Date.now());

      // Upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(key, buffer, { contentType: 'text/plain' });

      expect(uploadError).toBeNull();
      expect(uploadData).toBeTruthy();

      // Create signed URL
      const { data: signedData, error: signedErr } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(key, 60);

      expect(signedErr).toBeNull();
      expect(signedData).toHaveProperty('signedUrl');
      expect(typeof signedData.signedUrl).toBe('string');

      // Cleanup
      const { data: removeData, error: removeErr } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .remove([key]);

      expect(removeErr).toBeNull();
    }, 20000);
  });
}
