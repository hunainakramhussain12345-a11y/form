global.window = {};
require('../config.js');
const supabaseClient = require('../supabase-client.js');

async function testEmptyPortfolioSubmission() {
  const anonConfig = global.window.ALPHA_ORBIT_CONFIG;

  console.log('Testing Supabase REST payload submission with EMPTY portfolio_url...');

  const testPayload = {
    full_name: 'Test Candidate Optional Portfolio',
    email: 'optional.portfolio.test@alphaorbit.site',
    phone_number: '+15551234567',
    linkedin_url: 'https://linkedin.com/in/test-optional-portfolio',
    role_applied_for: 'Web Development',
    role_other_text: null,
    privacy_accepted: true,
    years_of_sales_experience: 'Professional',
    primary_skills: 'React, Node.js, CSS',
    project_description: 'Built a responsive web application.',
    portfolio_url: null, // Left empty / null!
    availability: 'Full Time',
    resume_file_name: null
  };

  try {
    const res = await supabaseClient.submitToSupabase(anonConfig, testPayload);
    console.log('Submission SUCCESSFUL with empty portfolio_url! HTTP Status:', res.status);
    return true;
  } catch (err) {
    console.error('Submission FAILED with error:', err.message);
    return false;
  }
}

testEmptyPortfolioSubmission();
