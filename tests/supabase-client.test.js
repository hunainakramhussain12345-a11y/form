const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSupabaseConfig, createSupabaseRequestOptions, submitToSupabase } = require('../supabase-client.js');

test('normalizes the Supabase config into separate URL and anon key values', () => {
  const config = normalizeSupabaseConfig({
    supabaseUrl: 'https://abc123.supabase.co/',
    supabaseAnonKey: 'anon-key-123',
  });

  assert.equal(config.supabaseUrl, 'https://abc123.supabase.co');
  assert.equal(config.supabaseAnonKey, 'anon-key-123');
  assert.equal(config.tableName, 'sales_applications');
});

test('creates a request that targets the sales_applications table without mixing credentials', async () => {
  let request;

  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, text: async () => '' };
  };

  await submitToSupabase(
    { supabaseUrl: 'https://abc123.supabase.co', supabaseAnonKey: 'anon-key-123' },
    { full_name: 'Test User' },
    fetchImpl,
  );

  assert.equal(request.url, 'https://abc123.supabase.co/rest/v1/sales_applications');
  assert.equal(request.options.headers.apikey, 'anon-key-123');
  assert.equal(request.options.headers.Authorization, 'Bearer anon-key-123');
  assert.notEqual(request.options.headers.apikey, request.options.headers.Authorization);
  assert.equal(request.options.method, 'POST');
});

test('rejects placeholder Supabase values before sending', async () => {
  await assert.rejects(
    () => submitToSupabase({ supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co', supabaseAnonKey: 'YOUR_ANON_PUBLIC_KEY' }, { full_name: 'Test User' }),
    /Replace the placeholder Supabase values/i,
  );
});

test('builds the SQL table request payload for the browser form', () => {
  const request = createSupabaseRequestOptions(
    { supabaseUrl: 'https://abc123.supabase.co', supabaseAnonKey: 'anon-key-123' },
    { full_name: 'Ada Lovelace', email: 'ada@example.com' },
  );

  assert.equal(request.url, 'https://abc123.supabase.co/rest/v1/sales_applications');
  assert.equal(request.headers.apikey, 'anon-key-123');
  assert.equal(request.body, '{"full_name":"Ada Lovelace","email":"ada@example.com"}');
});
