const form = document.getElementById('application-form');
const successState = document.getElementById('success-state');
const statusBanner = document.getElementById('status-banner');
const whyFitInput = document.getElementById('whyFit');
const whyFitCounter = document.getElementById('whyFitCounter');
const resetButton = document.getElementById('reset-button');

function getSupabaseConfig() {
  return window.ALPHA_ORBIT_CONFIG || {};
}

function showBanner(message, type = 'success') {
  statusBanner.textContent = message;
  statusBanner.className = `status-banner visible ${type}`;
}

function clearBanner() {
  statusBanner.textContent = '';
  statusBanner.className = 'status-banner';
}

function updateCounter() {
  whyFitCounter.textContent = `${whyFitInput.value.length} / 500`;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateLinkedIn(value) {
  try {
    const parsed = new URL(value);
    return parsed.hostname.includes('linkedin.com');
  } catch {
    return false;
  }
}

function collectFormData() {
  const formData = new FormData(form);
  const resumeFile = document.getElementById('resume').files[0];

  return {
    full_name: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone_number: String(formData.get('phone') || '').trim(),
    linkedin_url: String(formData.get('linkedinUrl') || '').trim(),
    current_role_company: String(formData.get('currentRole') || '').trim(),
    years_of_sales_experience: String(formData.get('yearsOfExperience') || '').trim(),
    relevant_experience: String(formData.get('relevantExperience') || '').trim(),
    why_fit: String(formData.get('whyFit') || '').trim(),
    expected_compensation: String(formData.get('compensation') || '').trim(),
    availability: String(formData.get('availability') || '').trim(),
    resume_file_name: resumeFile ? resumeFile.name : null,
  };
}

function validateForm(payload) {
  if (!payload.full_name) return 'Please enter your full name.';
  if (!payload.email || !validateEmail(payload.email)) return 'Please enter a valid email address.';
  if (!payload.phone_number) return 'Please enter your phone number.';
  if (!payload.linkedin_url || !validateLinkedIn(payload.linkedin_url)) return 'Please enter a valid LinkedIn profile URL.';
  if (!payload.current_role_company) return 'Please provide your current or last role and company.';
  if (!payload.years_of_sales_experience) return 'Please select your sales experience range.';
  if (!payload.relevant_experience) return 'Please choose your relevant experience.';
  if (!payload.why_fit) return 'Please share why you are a strong fit for Alpha Orbit.';
  if (payload.why_fit.length > 500) return 'Your fit statement must be 500 characters or fewer.';
  if (!payload.availability) return 'Please select your availability.';
  if (document.getElementById('resume').files[0] && document.getElementById('resume').files[0].type !== 'application/pdf') {
    return 'Resume upload must be a PDF file.';
  }
  return null;
}

async function submitToSupabase(payload) {
  const config = getSupabaseConfig();
  return window.submitToSupabaseHelper(config, payload);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearBanner();

  const payload = collectFormData();
  const validationError = validateForm(payload);

  if (validationError) {
    showBanner(validationError, 'error');
    return;
  }

  try {
    await submitToSupabase(payload);
    form.classList.add('hidden');
    form.style.display = 'none';
    successState.classList.remove('hidden');
    showBanner('Application submitted successfully.', 'success');
  } catch (error) {
    showBanner(error.message || 'Something went wrong. Please try again.', 'error');
  }
});

whyFitInput.addEventListener('input', updateCounter);
resetButton.addEventListener('click', () => {
  form.reset();
  form.classList.remove('hidden');
  form.style.display = 'grid';
  successState.classList.add('hidden');
  clearBanner();
  updateCounter();
});

updateCounter();
