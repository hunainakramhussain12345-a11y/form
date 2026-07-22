const form = document.getElementById('application-form');
const successState = document.getElementById('success-state');
const statusBanner = document.getElementById('status-banner');
const whyFitInput = document.getElementById('whyFit');
const whyFitCounter = document.getElementById('whyFitCounter');
const resetButton = document.getElementById('reset-button');

// Stepper elements
const stepNode1 = document.getElementById('step-node-1');
const stepNode2 = document.getElementById('step-node-2');
const stepLineFill = document.getElementById('step-line-fill');
const step1Group = document.getElementById('step-1-group');
const step2Group = document.getElementById('step-2-group');
const nextStepBtn = document.getElementById('next-step-btn');
const prevStepBtn = document.getElementById('prev-step-btn');

// Role elements
const roleAppliedSelect = document.getElementById('roleApplied');
const rolePillTitle = document.getElementById('role-pill-title');
const rolePillIcon = document.getElementById('role-pill-icon');
const salesRoleFields = document.getElementById('sales-role-fields');
const otherRoleFields = document.getElementById('other-role-fields');

// Resume elements
const resumeInput = document.getElementById('resume');
const fileLabelText = document.getElementById('file-label-text');

let currentStep = 1;

function getSupabaseConfig() {
  return window.ALPHA_ORBIT_CONFIG || {};
}

function showBanner(message, type = 'success') {
  statusBanner.textContent = message;
  statusBanner.className = `status-banner visible ${type}`;
  statusBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearBanner() {
  statusBanner.textContent = '';
  statusBanner.className = 'status-banner';
}

function updateCounter() {
  if (whyFitInput && whyFitCounter) {
    whyFitCounter.textContent = `${whyFitInput.value.length} / 500`;
  }
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateLinkedIn(value) {
  try {
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
    return parsed.hostname.includes('linkedin.com');
  } catch {
    return false;
  }
}

function validateUrl(value) {
  try {
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

// Role Icon Resolver
function getRoleIcon(role) {
  switch (role) {
    case 'Sales & Business Development':
      return '💼';
    case 'SEO':
    case 'Marketing':
      return '📈';
    case 'Graphic Design':
    case 'Video Editing':
      return '🎨';
    case 'WordPress':
      return '🌐';
    case 'Full Stack':
    case 'Web Development':
    default:
      return '</>';
  }
}

// Update Role View based on selected role
function syncRoleView() {
  const selectedRole = roleAppliedSelect.value || 'Web Development';
  rolePillTitle.textContent = selectedRole;
  rolePillIcon.textContent = getRoleIcon(selectedRole);

  if (selectedRole === 'Sales & Business Development') {
    salesRoleFields.classList.remove('hidden');
    otherRoleFields.classList.add('hidden');
  } else {
    salesRoleFields.classList.add('hidden');
    otherRoleFields.classList.remove('hidden');
  }
}

// STEP 1 VALIDATION
function validateStep1() {
  const fullName = String(document.getElementById('fullName').value || '').trim();
  const email = String(document.getElementById('email').value || '').trim();
  const phone = String(document.getElementById('phone').value || '').trim();
  const linkedinUrl = String(document.getElementById('linkedinUrl').value || '').trim();
  const roleApplied = String(roleAppliedSelect.value || '').trim();

  if (!fullName) return 'Please enter your full name.';
  if (!email || !validateEmail(email)) return 'Please enter a valid email address.';
  if (!phone) return 'Please enter your phone number.';
  if (!linkedinUrl || !validateLinkedIn(linkedinUrl)) return 'Please enter a valid LinkedIn profile URL.';
  if (!roleApplied) return 'Please select the role you are applying for.';

  return null;
}

// STEP NAVIGATION CONTROLLER
function goToStep(step) {
  clearBanner();
  if (step === 2) {
    const error = validateStep1();
    if (error) {
      showBanner(error, 'error');
      return;
    }
    currentStep = 2;
    step1Group.classList.add('hidden');
    step2Group.classList.remove('hidden');
    stepNode1.classList.add('active');
    stepNode2.classList.add('active');
    stepLineFill.classList.add('step-2-active');
    syncRoleView();
  } else {
    currentStep = 1;
    step2Group.classList.add('hidden');
    step1Group.classList.remove('hidden');
    stepNode2.classList.remove('active');
    stepLineFill.classList.remove('step-2-active');
  }
}

// COLLECT FORM PAYLOAD
function collectFormData() {
  const formData = new FormData(form);
  const selectedRole = String(formData.get('roleApplied') || '').trim();
  const resumeFile = resumeInput.files[0];

  const basePayload = {
    full_name: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone_number: String(formData.get('phone') || '').trim(),
    linkedin_url: String(formData.get('linkedinUrl') || '').trim(),
    role_applied_for: selectedRole,
    resume_file_name: resumeFile ? resumeFile.name : null,
  };

  if (selectedRole === 'Sales & Business Development') {
    return {
      ...basePayload,
      years_of_sales_experience: String(formData.get('yearsOfSalesExperience') || '').trim(),
      relevant_experience: String(formData.get('relevantExperience') || '').trim(),
      why_fit: String(formData.get('whyFit') || '').trim(),
      expected_compensation: String(formData.get('compensation') || '').trim(),
      availability: String(formData.get('availability') || '').trim(),
    };
  } else {
    return {
      ...basePayload,
      years_experience: String(formData.get('yearsExperience') || '').trim(),
      primary_skills: String(formData.get('primarySkills') || '').trim(),
      project_description: String(formData.get('projectDescription') || '').trim(),
      portfolio_url: String(formData.get('portfolioUrl') || '').trim(),
    };
  }
}

// FORM VALIDATION FOR STEP 2 SUBMISSION
function validateFullForm(payload) {
  const step1Error = validateStep1();
  if (step1Error) return step1Error;

  const selectedRole = payload.role_applied_for;

  if (selectedRole === 'Sales & Business Development') {
    if (!payload.years_of_sales_experience) return 'Please select your sales experience range.';
    if (!payload.relevant_experience) return 'Please select your experience type.';
    if (!payload.why_fit) return 'Please share why you are a strong fit for Alpha Orbit.';
    if (payload.why_fit.length > 500) return 'Your fit statement must be 500 characters or fewer.';
    if (!payload.availability) return 'Please select your availability.';
  } else {
    if (!payload.years_experience) return 'Please provide your years of experience.';
    if (!payload.primary_skills) return 'Please enter your primary skills.';
    if (!payload.project_description) return 'Please tell us about a project you are proud of.';
    if (!payload.portfolio_url || !validateUrl(payload.portfolio_url)) {
      return 'Please enter a valid Portfolio URL.';
    }
  }

  // RESUME CV FRONTEND VALIDATION (PDF only, max 3MB)
  const resumeFile = resumeInput.files[0];
  if (resumeFile) {
    const maxSizeBytes = 3 * 1024 * 1024; // 3MB limit
    if (resumeFile.size > maxSizeBytes) {
      return 'Resume file size must not exceed 3MB.';
    }

    const isPdfType = resumeFile.type === 'application/pdf' || resumeFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdfType) {
      return 'Resume upload must be a PDF file.';
    }
  }

  return null;
}

// SUBMIT HELPERS
async function submitToSupabase(payload) {
  const config = getSupabaseConfig();
  return window.submitToSupabaseHelper(config, payload);
}

// EVENT LISTENERS
nextStepBtn.addEventListener('click', () => goToStep(2));
prevStepBtn.addEventListener('click', () => goToStep(1));
roleAppliedSelect.addEventListener('change', syncRoleView);

if (whyFitInput) {
  whyFitInput.addEventListener('input', updateCounter);
}

// FILE SELECTION LABEL UPDATE & VALIDATION
resumeInput.addEventListener('change', () => {
  const file = resumeInput.files[0];
  if (file) {
    if (file.size > 3 * 1024 * 1024) {
      showBanner('Resume file size must not exceed 3MB.', 'error');
      fileLabelText.textContent = `${file.name} (Too large - Max 3MB)`;
      fileLabelText.style.color = '#FCA5A5';
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      showBanner('Resume upload must be a PDF file.', 'error');
      fileLabelText.textContent = `${file.name} (Invalid - PDF required)`;
      fileLabelText.style.color = '#FCA5A5';
      return;
    }
    clearBanner();
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    fileLabelText.textContent = `Attached: ${file.name} (${sizeMb} MB)`;
    fileLabelText.style.color = '#7DD3FC';
  } else {
    fileLabelText.textContent = 'Choose PDF file or drag here';
    fileLabelText.style.color = '';
  }
});

// SUBMIT FORM EVENT
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearBanner();

  // SPAM PROTECTION 1: Honeypot Check (invisible field filled by bots)
  const honeypotField = document.getElementById('website_hp');
  if (honeypotField && honeypotField.value) {
    // Silently reject submission, pretend success to bot
    console.warn('Bot submission detected via honeypot.');
    form.classList.add('hidden');
    form.style.display = 'none';
    successState.classList.remove('hidden');
    return;
  }

  // SPAM PROTECTION 2: Client Rate Limiting (60-second window)
  const lastSubKey = 'alpha_orbit_last_submission_time';
  const lastSubTime = localStorage.getItem(lastSubKey);
  const now = Date.now();
  if (lastSubTime && now - parseInt(lastSubTime, 10) < 60000) {
    showBanner('Please wait a minute before submitting another application.', 'error');
    return;
  }

  const payload = collectFormData();
  const validationError = validateFullForm(payload);

  if (validationError) {
    showBanner(validationError, 'error');
    return;
  }

  const resumeFile = resumeInput.files[0];

  try {
    if (resumeFile) {
      showBanner('Uploading resume PDF...', 'info');
      const config = getSupabaseConfig();
      const resumeUrl = await window.uploadResumeHelper(config, resumeFile);
      payload.resume_url = resumeUrl;
    }

    showBanner('Submitting application...', 'info');
    await submitToSupabase(payload);

    // Track submission rate limit timestamp
    localStorage.setItem(lastSubKey, String(now));

    // =========================================================================
    // TODO: SUPABASE DATABASE WEBHOOK + RESEND INTEGRATION
    // =========================================================================
    // Once the Resend API key is provided:
    // 1. Create a Supabase Edge Function (e.g. supabase/functions/resend-email/index.ts)
    //    or an HTTP webhook triggered on INSERT to public.sales_applications.
    // 2. Import Resend SDK and initialize with process.env.RESEND_API_KEY.
    // 3. Send automated confirmation email to candidate (payload.email) and notify team.
    // Do not attempt to configure Resend or webhooks in this pass.
    // =========================================================================

    form.classList.add('hidden');
    form.style.display = 'none';
    successState.classList.remove('hidden');
    showBanner('Application submitted successfully.', 'success');
  } catch (error) {
    showBanner(error.message || 'Something went wrong. Please try again.', 'error');
  }
});

// RESET FORM / BACK TO HOME BUTTON
resetButton.addEventListener('click', () => {
  form.reset();
  goToStep(1);
  fileLabelText.textContent = 'Choose PDF file or drag here';
  fileLabelText.style.color = '';
  form.classList.remove('hidden');
  form.style.display = 'block';
  successState.classList.add('hidden');
  clearBanner();
  updateCounter();
});

updateCounter();
