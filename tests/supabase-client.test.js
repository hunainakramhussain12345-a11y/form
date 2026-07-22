const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSupabaseConfig, createSupabaseRequestOptions, uploadResumeToSupabase, submitToSupabase } = require('../supabase-client.js');

test('normalizes the Supabase config into separate URL and anon key values', () => {
  const config = normalizeSupabaseConfig({
    supabaseUrl: 'https://abc123.supabase.co/',
    supabaseAnonKey: 'anon-key-123',
  });

  assert.equal(config.supabaseUrl, 'https://abc123.supabase.co');
  assert.equal(config.supabaseAnonKey, 'anon-key-123');
  assert.equal(config.tableName, 'sales_applications');
  assert.equal(config.bucketName, 'resumes');
});

test('creates a request that targets the sales_applications table with new role and portfolio fields', async () => {
  let request;

  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, text: async () => '' };
  };

  await submitToSupabase(
    { supabaseUrl: 'https://abc123.supabase.co', supabaseAnonKey: 'anon-key-123' },
    {
      full_name: 'Test Candidate',
      email: 'test@alphaorbit.io',
      phone_number: '+15550001111',
      linkedin_url: 'https://linkedin.com/in/testcandidate',
      role_applied_for: 'Web Development',
      years_experience: '3+ years',
      primary_skills: 'React, Node.js, CSS',
      project_description: 'Built a high performance web application',
      portfolio_url: 'https://testcandidate-portfolio.com',
    },
    fetchImpl,
  );

  assert.equal(request.url, 'https://abc123.supabase.co/rest/v1/sales_applications');
  assert.equal(request.options.headers.apikey, 'anon-key-123');
  assert.equal(request.options.headers.Authorization, 'Bearer anon-key-123');
  assert.equal(request.options.method, 'POST');

  const body = JSON.parse(request.options.body);
  assert.equal(body.role_applied_for, 'Web Development');
  assert.equal(body.portfolio_url, 'https://testcandidate-portfolio.com');
  assert.equal(body.primary_skills, 'React, Node.js, CSS');
});

test('rejects placeholder Supabase values before sending', async () => {
  await assert.rejects(
    () => submitToSupabase({ supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co', supabaseAnonKey: 'YOUR_ANON_PUBLIC_KEY' }, { full_name: 'Test User' }),
    /Replace the placeholder Supabase values/i,
  );
});

test('enforces 3MB max file size limit for resume upload', async () => {
  const overizedFile = {
    name: 'large_cv.pdf',
    type: 'application/pdf',
    size: 4 * 1024 * 1024, // 4MB
  };

  await assert.rejects(
    () => uploadResumeToSupabase({ supabaseUrl: 'https://abc123.supabase.co', supabaseAnonKey: 'anon-key-123' }, overizedFile),
    /Resume file size must not exceed 3MB/i,
  );
});

test('enforces PDF mime/type extension for resume upload', async () => {
  const invalidFile = {
    name: 'resume.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1 * 1024 * 1024, // 1MB
  };

  await assert.rejects(
    () => uploadResumeToSupabase({ supabaseUrl: 'https://abc123.supabase.co', supabaseAnonKey: 'anon-key-123' }, invalidFile),
    /Resume upload must be a PDF file/i,
  );
});

test('successfully uploads valid PDF under 3MB to resumes bucket', async () => {
  let uploadUrlTarget;
  const mockFetch = async (url, options) => {
    uploadUrlTarget = url;
    return { ok: true, text: async () => '' };
  };

  const validFile = {
    name: 'john_doe_resume.pdf',
    type: 'application/pdf',
    size: 1.5 * 1024 * 1024, // 1.5MB
  };

  const publicUrl = await uploadResumeToSupabase(
    { supabaseUrl: 'https://abc123.supabase.co', supabaseAnonKey: 'anon-key-123' },
    validFile,
    mockFetch,
  );

  assert.ok(uploadUrlTarget.includes('/storage/v1/object/resumes/'));
  assert.ok(publicUrl.includes('/storage/v1/object/public/resumes/'));
});
