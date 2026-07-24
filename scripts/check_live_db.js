global.window = {};
require('../config.js');
const supabaseClient = require('../supabase-client.js');

async function testDatabase() {
  const anonConfig = global.window.ALPHA_ORBIT_CONFIG;

  console.log('Testing Supabase REST payload submission with new dropdown values...');

  const testPayload = {
    full_name: 'Test Candidate Dropdown Check',
    email: 'test.dropdown@alphaorbit.site',
    phone_number: '+15551234567',
    linkedin_url: 'https://linkedin.com/in/test-dropdown',
    role_applied_for: 'Sales & Business Development',
    role_other_text: null,
    privacy_accepted: true,
    years_of_sales_experience: 'Professional', // Dropdown option: Beginner, Professional, Expert
    availability: 'Full Time',                 // Dropdown option: Part Time, Full Time
    relevant_experience: 'Agency',
    why_fit: 'Testing new dropdown options in database.',
    expected_compensation: 'Base + Commission',
    resume_file_name: null
  };

  try {
    const res = await supabaseClient.submitToSupabase(anonConfig, testPayload);
    console.log('Submission successful! HTTP Status:', res.status);
  } catch (err) {
    console.error('Submission failed with error:', err.message);
  }
}

testDatabase();
