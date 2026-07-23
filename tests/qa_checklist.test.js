const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { submitToSupabase, uploadResumeToSupabase } = require('../supabase-client.js');

// Load index.html, styles.css, and app.js into a DOM environment for empirical QA testing
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf-8');
const configJsContent = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf-8');

function setupDOM() {
  const dom = new JSDOM(htmlContent, {
    url: 'https://alpha-orbit-form.vercel.app',
    runScripts: 'dangerously',
  });
  const { window } = dom;
  const { document } = window;

  // Polyfill scrollIntoView
  window.Element.prototype.scrollIntoView = () => {};

  // Inject config and helper scripts
  const scriptConfig = document.createElement('script');
  scriptConfig.textContent = configJsContent;
  document.head.appendChild(scriptConfig);

  const scriptHelpers = document.createElement('script');
  scriptHelpers.textContent = `
    window.submitToSupabaseHelper = function(config, payload) {
      return window.mockSubmit ? window.mockSubmit(config, payload) : Promise.resolve({ ok: true });
    };
    window.uploadResumeHelper = function(config, file) {
      return window.mockUpload ? window.mockUpload(config, file) : Promise.resolve('https://storage/pdf');
    };
  `;
  document.head.appendChild(scriptHelpers);

  const scriptApp = document.createElement('script');
  scriptApp.textContent = appJsContent;
  document.body.appendChild(scriptApp);

  return dom;
}

// ----------------------------------------------------
// SECTION 1: EMPTY / BAD INPUT
// ----------------------------------------------------
test('QA 1.1: Block "Next Step" when Step 1 is completely blank', () => {
  const dom = setupDOM();
  const { document } = dom.window;

  const nextBtn = document.getElementById('next-step-btn');
  const banner = document.getElementById('status-banner');
  const step1Group = document.getElementById('step-1-group');
  const step2Group = document.getElementById('step-2-group');

  nextBtn.click();

  assert.ok(banner.classList.contains('visible'));
  assert.ok(banner.classList.contains('error'));
  assert.equal(banner.textContent, 'Please enter your full name.');
  assert.ok(!step1Group.classList.contains('hidden'));
  assert.ok(step2Group.classList.contains('hidden'));
});

test('QA 1.2: Reject garbage email in Step 1 (no @ symbol)', () => {
  const dom = setupDOM();
  const { document } = dom.window;

  document.getElementById('fullName').value = 'Jane Candidate';
  document.getElementById('email').value = 'invalidemailformat.com';
  document.getElementById('phone').value = '+15551234567';
  document.getElementById('linkedinUrl').value = 'https://linkedin.com/in/janecandidate';
  document.getElementById('roleApplied').value = 'Web Development';

  const nextBtn = document.getElementById('next-step-btn');
  const banner = document.getElementById('status-banner');

  nextBtn.click();

  assert.ok(banner.classList.contains('visible'));
  assert.equal(banner.textContent, 'Please enter a valid email address.');
});

// ----------------------------------------------------
// SECTION 2: ROLE SWITCH BUG (BIDIRECTIONAL)
// ----------------------------------------------------
test('QA 2.1: Direction A - Sales -> ONLY sales fields render in Step 2', () => {
  const dom = setupDOM();
  const { document } = dom.window;

  document.getElementById('fullName').value = 'Sales Rep';
  document.getElementById('email').value = 'sales@alphaorbit.io';
  document.getElementById('phone').value = '+15551112222';
  document.getElementById('linkedinUrl').value = 'https://linkedin.com/in/salesrep';
  document.getElementById('roleApplied').value = 'Sales & Business Development';

  document.getElementById('next-step-btn').click();

  const container = document.getElementById('role-fields-container');
  assert.ok(container.querySelector('#yearsOfSalesExperience'), 'Sales experience field must exist');
  assert.ok(container.querySelector('#relevantExperience'), 'Relevant experience field must exist');
  assert.ok(container.querySelector('#whyFit'), 'Why fit field must exist');
  assert.ok(container.querySelector('#compensation'), 'Compensation field must exist');
  assert.ok(!container.querySelector('#primarySkills'), 'General primarySkills MUST NOT exist in DOM');
  assert.ok(!container.querySelector('#portfolioUrl'), 'General portfolioUrl MUST NOT exist in DOM');
});

test('QA 2.2: Direction B - Go Back -> Switch to "Web Development" -> ONLY general fields render, sales fields gone', () => {
  const dom = setupDOM();
  const { document } = dom.window;

  // Step 1: Select Sales first
  document.getElementById('fullName').value = 'Swapping Dev';
  document.getElementById('email').value = 'dev@alphaorbit.io';
  document.getElementById('phone').value = '+15551113333';
  document.getElementById('linkedinUrl').value = 'https://linkedin.com/in/swappingdev';
  document.getElementById('roleApplied').value = 'Sales & Business Development';

  document.getElementById('next-step-btn').click();
  
  // Go Back to Step 1
  document.getElementById('prev-step-btn').click();
  
  // Switch role to "Web Development"
  const roleSelect = document.getElementById('roleApplied');
  roleSelect.value = 'Web Development';
  roleSelect.dispatchEvent(new dom.window.Event('change'));

  // Next Step to Step 2 again
  document.getElementById('next-step-btn').click();

  const container = document.getElementById('role-fields-container');
  assert.ok(container.querySelector('#yearsExperience'), 'General yearsExperience field must exist');
  assert.ok(container.querySelector('#primarySkills'), 'General primarySkills field must exist');
  assert.ok(container.querySelector('#projectDescription'), 'General projectDescription field must exist');
  assert.ok(container.querySelector('#portfolioUrl'), 'General portfolioUrl field must exist');
  
  // Explicitly assert ALL sales fields are completely unmounted from DOM
  assert.ok(!container.querySelector('#yearsOfSalesExperience'), 'Sales experience MUST NOT exist in DOM');
  assert.ok(!container.querySelector('#relevantExperience'), 'Sales relevantExperience MUST NOT exist in DOM');
  assert.ok(!container.querySelector('#whyFit'), 'Sales whyFit MUST NOT exist in DOM');
  assert.ok(!container.querySelector('#compensation'), 'Sales compensation MUST NOT exist in DOM');
});

// ----------------------------------------------------
// SECTION 3: PRIVACY CHECKBOX
// ----------------------------------------------------
test('QA 3.1: Leave privacy checkbox unchecked -> Submit button remains disabled', () => {
  const dom = setupDOM();
  const { document } = dom.window;

  document.getElementById('fullName').value = 'Test User';
  document.getElementById('email').value = 'user@alphaorbit.io';
  document.getElementById('phone').value = '+15550001111';
  document.getElementById('linkedinUrl').value = 'https://linkedin.com/in/testuser';
  document.getElementById('roleApplied').value = 'Web Development';

  document.getElementById('next-step-btn').click();

  const submitBtn = document.getElementById('submit-btn');
  const privacyCheckbox = document.getElementById('privacyAccepted');

  assert.equal(privacyCheckbox.checked, false);
  assert.equal(submitBtn.disabled, true);
  assert.ok(submitBtn.hasAttribute('disabled'));
});

test('QA 3.2: Check privacy checkbox -> Submit button unlocks', () => {
  const dom = setupDOM();
  const { document } = dom.window;

  document.getElementById('fullName').value = 'Test User';
  document.getElementById('email').value = 'user@alphaorbit.io';
  document.getElementById('phone').value = '+15550001111';
  document.getElementById('linkedinUrl').value = 'https://linkedin.com/in/testuser';
  document.getElementById('roleApplied').value = 'Web Development';

  document.getElementById('next-step-btn').click();

  const submitBtn = document.getElementById('submit-btn');
  const privacyCheckbox = document.getElementById('privacyAccepted');

  privacyCheckbox.checked = true;
  privacyCheckbox.dispatchEvent(new dom.window.Event('change'));

  assert.equal(submitBtn.disabled, false);
  assert.ok(!submitBtn.hasAttribute('disabled'));
});

// ----------------------------------------------------
// SECTION 4: FILE UPLOAD (5MB & NON-PDF CHECK)
// ----------------------------------------------------
test('QA 4.1: Reject file upload over 5MB with clear message', async () => {
  const overizedFile = {
    name: 'large_resume.pdf',
    type: 'application/pdf',
    size: 6 * 1024 * 1024, // 6MB
  };

  await assert.rejects(
    () => uploadResumeToSupabase({ supabaseUrl: 'https://qitgpnugxjameulzhyoq.supabase.co', supabaseAnonKey: 'key' }, overizedFile),
    /Resume file size must not exceed 5MB/i,
  );
});

test('QA 4.2: Reject non-PDF file upload (e.g. .docx or .jpg)', async () => {
  const docxFile = {
    name: 'resume.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1 * 1024 * 1024, // 1MB
  };

  await assert.rejects(
    () => uploadResumeToSupabase({ supabaseUrl: 'https://qitgpnugxjameulzhyoq.supabase.co', supabaseAnonKey: 'key' }, docxFile),
    /Resume upload must be a PDF file/i,
  );
});

// ----------------------------------------------------
// SECTION 5: HONEYPOT SPAM PROTECTION
// ----------------------------------------------------
test('QA 5.1: Manually fill honeypot input -> Submits silently with no error and presents success state to bot', async () => {
  const dom = setupDOM();
  const { document } = dom.window;

  document.getElementById('fullName').value = 'Spam Bot';
  document.getElementById('email').value = 'bot@spam.com';
  document.getElementById('phone').value = '+15559990000';
  document.getElementById('linkedinUrl').value = 'https://linkedin.com/in/spambot';
  document.getElementById('roleApplied').value = 'Web Development';

  document.getElementById('next-step-btn').click();

  // Simulate bot typing into hidden website_hp field
  const honeypot = document.getElementById('website_hp');
  honeypot.value = 'http://spam-link.com';

  document.getElementById('privacyAccepted').checked = true;
  document.getElementById('privacyAccepted').dispatchEvent(new dom.window.Event('change'));

  let backendCalled = false;
  dom.window.mockSubmit = () => {
    backendCalled = true;
    return Promise.resolve({ ok: true });
  };

  const form = document.getElementById('application-form');
  const successState = document.getElementById('success-state');

  form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));

  assert.equal(backendCalled, false, 'Backend MUST NOT be called for bot submission');
  assert.ok(form.classList.contains('hidden'));
  assert.ok(!successState.classList.contains('hidden'), 'Success state shown silently to bot');
});

// ----------------------------------------------------
// SECTION 6: RATE LIMITING
// ----------------------------------------------------
test('QA 6.1: Submit once successfully -> Second submit within 60s is blocked', async () => {
  const dom = setupDOM();
  const { document, localStorage } = dom.window;

  // Set last submission time to now
  localStorage.setItem('alpha_orbit_last_submission_time', String(Date.now()));

  document.getElementById('fullName').value = 'Rate Limit Tester';
  document.getElementById('email').value = 'ratelimit@alphaorbit.io';
  document.getElementById('phone').value = '+15558887777';
  document.getElementById('linkedinUrl').value = 'https://linkedin.com/in/ratelimit';
  document.getElementById('roleApplied').value = 'Web Development';

  document.getElementById('next-step-btn').click();

  document.getElementById('yearsExperience').value = '3 years';
  document.getElementById('primarySkills').value = 'Node.js';
  document.getElementById('projectDescription').value = 'API Service';

  document.getElementById('privacyAccepted').checked = true;
  document.getElementById('privacyAccepted').dispatchEvent(new dom.window.Event('change'));

  const banner = document.getElementById('status-banner');
  const form = document.getElementById('application-form');

  form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));

  assert.ok(banner.classList.contains('visible'));
  assert.equal(banner.textContent, 'Please wait a minute before submitting another application.');
});

// ----------------------------------------------------
// SECTION 7: DATA CHECK (LIVE SUPABASE DB INSERTION & VERIFICATION)
// ----------------------------------------------------
test('QA 7.1: Live Supabase DB Insertion & Field Verification', async () => {
  const testPayload = {
    full_name: 'QA Checklist Tester',
    email: 'qa.checklist@alphaorbit.io',
    phone_number: '+15557776666',
    linkedin_url: 'https://linkedin.com/in/qachecklist',
    role_applied_for: 'Full Stack',
    role_other_text: null,
    years_of_sales_experience: '3+ years',
    primary_skills: 'React, Node.js, PostgreSQL',
    project_description: 'Built enterprise web portal',
    portfolio_url: 'https://github.com/qachecklist',
    privacy_accepted: true,
  };

  const config = {
    supabaseUrl: 'https://qitgpnugxjameulzhyoq.supabase.co',
    supabaseAnonKey: 'sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM',
  };

  // Perform real submission
  const response = await submitToSupabase(config, testPayload);
  assert.ok(response.ok, 'Supabase REST API submission must return HTTP 200/201 OK');

  // Verify inserted row by querying Supabase REST API
  const fetchUrl = `${config.supabaseUrl}/rest/v1/sales_applications?email=eq.${encodeURIComponent(testPayload.email)}&select=*`;
  const fetchRes = await fetch(fetchUrl, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
  });

  const records = await fetchRes.json();
  assert.ok(Array.isArray(records) && records.length > 0, 'Record must exist in Supabase sales_applications table');
  
  const record = records[0];
  assert.equal(record.full_name, testPayload.full_name);
  assert.equal(record.email, testPayload.email);
  assert.equal(record.phone_number, testPayload.phone_number);
  assert.equal(record.linkedin_url, testPayload.linkedin_url);
  assert.equal(record.role_applied_for, testPayload.role_applied_for);
  assert.equal(record.years_of_sales_experience, testPayload.years_of_sales_experience);
  assert.equal(record.primary_skills, testPayload.primary_skills);
  assert.equal(record.project_description, testPayload.project_description);
  assert.equal(record.portfolio_url, testPayload.portfolio_url);
  assert.equal(record.privacy_accepted, true);
});
