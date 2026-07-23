const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

test('creates a request payload with role_other_text when Other role is selected', async () => {
  let request;

  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, text: async () => '' };
  };

  await submitToSupabase(
    { supabaseUrl: 'https://abc123.supabase.co', supabaseAnonKey: 'anon-key-123' },
    {
      full_name: 'Custom Role Candidate',
      email: 'custom@alphaorbit.io',
      phone_number: '+15550002222',
      linkedin_url: 'https://linkedin.com/in/customrole',
      role_applied_for: 'Other',
      role_other_text: 'Digital Marketing Strategist',
      years_experience: '5+ years',
      primary_skills: 'SEO, Content Strategy, PPC',
      project_description: 'Grew organic traffic by 300%',
      portfolio_url: null, // Optional portfolio URL
    },
    fetchImpl,
  );

  const body = JSON.parse(request.options.body);
  assert.equal(body.role_applied_for, 'Other');
  assert.equal(body.role_other_text, 'Digital Marketing Strategist');
  assert.equal(body.portfolio_url, null);
  assert.equal(body.years_of_sales_experience, undefined);
});

test('allows submission with empty/null portfolio_url for non-sales roles', async () => {
  let request;

  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, text: async () => '' };
  };

  await submitToSupabase(
    { supabaseUrl: 'https://abc123.supabase.co', supabaseAnonKey: 'anon-key-123' },
    {
      full_name: 'Developer Without Portfolio',
      email: 'dev@alphaorbit.io',
      phone_number: '+15550003333',
      linkedin_url: 'https://linkedin.com/in/devnoportfolio',
      role_applied_for: 'Full Stack',
      role_other_text: null,
      years_experience: '2 years',
      primary_skills: 'Python, PostgreSQL',
      project_description: 'Backend microservice architecture',
      portfolio_url: null,
    },
    fetchImpl,
  );

  const body = JSON.parse(request.options.body);
  assert.equal(body.role_applied_for, 'Full Stack');
  assert.equal(body.portfolio_url, null);
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

test('verifies DOM role field mutual exclusion in index.html templates', () => {
  const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
  
  // Assert template structure exists for isolated dynamic mounting
  assert.ok(htmlContent.includes('<template id="tpl-sales-fields">'));
  assert.ok(htmlContent.includes('<template id="tpl-other-fields">'));
  assert.ok(htmlContent.includes('<div id="role-fields-container"></div>'));

  // Verify sales fields template contains sales inputs ONLY
  const salesTplMatch = htmlContent.match(/<template id="tpl-sales-fields">([\s\S]*?)<\/template>/);
  assert.ok(salesTplMatch);
  assert.ok(salesTplMatch[1].includes('yearsOfSalesExperience'));
  assert.ok(!salesTplMatch[1].includes('primarySkills'));
  assert.ok(!salesTplMatch[1].includes('portfolioUrl'));

  // Verify other fields template contains general inputs ONLY
  const otherTplMatch = htmlContent.match(/<template id="tpl-other-fields">([\s\S]*?)<\/template>/);
  assert.ok(otherTplMatch);
  assert.ok(otherTplMatch[1].includes('primarySkills'));
  assert.ok(otherTplMatch[1].includes('portfolioUrl'));
  assert.ok(!otherTplMatch[1].includes('yearsOfSalesExperience'));
});
