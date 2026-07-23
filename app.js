const form = document.getElementById('application-form');
const successState = document.getElementById('success-state');
const statusBanner = document.getElementById('status-banner');
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
const otherRoleInputGroup = document.getElementById('other-role-input-group');
const roleOtherInput = document.getElementById('role_other');
const rolePillTitle = document.getElementById('role-pill-title');
const rolePillIcon = document.getElementById('role-pill-icon');
const roleFieldsContainer = document.getElementById('role-fields-container');

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
  const whyFitInput = document.getElementById('whyFit');
  const whyFitCounter = document.getElementById('whyFitCounter');
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
  if (!value) return true; // Optional URL
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
    case 'Other':
      return '✨';
    case 'Full Stack':
    case 'Web Development':
    default:
      return '</>';
  }
}

// Toggle "Other" role text input in Step 1
function handleRoleSelectChange() {
  const selectedRole = roleAppliedSelect.value;
  if (selectedRole === 'Other') {
    otherRoleInputGroup.classList.remove('hidden');
    roleOtherInput.setAttribute('required', 'required');
  } else {
    otherRoleInputGroup.classList.add('hidden');
    roleOtherInput.removeAttribute('required');
    roleOtherInput.value = '';
  }
  syncRoleView();
}

// DYNAMIC DOM MOUNT / UNMOUNT: Ensures ONLY the selected role's fields exist in DOM
function syncRoleView() {
  const selectedRole = roleAppliedSelect.value || 'Web Development';
  const roleOtherVal = roleOtherInput.value.trim();

  if (selectedRole === 'Other' && roleOtherVal) {
    rolePillTitle.textContent = `Other (${roleOtherVal})`;
  } else {
    rolePillTitle.textContent = selectedRole;
  }
  rolePillIcon.textContent = getRoleIcon(selectedRole);

  // Clear container completely to unmount any previous role fields
  roleFieldsContainer.innerHTML = '';

  if (selectedRole === 'Sales & Business Development') {
    const tpl = document.getElementById('tpl-sales-fields');
    if (tpl) {
      const clone = tpl.content.cloneNode(true);
      roleFieldsContainer.appendChild(clone);
      const whyFitInput = document.getElementById('whyFit');
      if (whyFitInput) {
        whyFitInput.addEventListener('input', updateCounter);
        updateCounter();
      }
    }
  } else {
    // All other roles including "Other" render general fields template ONLY
    const tpl = document.getElementById('tpl-other-fields');
    if (tpl) {
      const clone = tpl.content.cloneNode(true);
      roleFieldsContainer.appendChild(clone);
    }
  }
}

// STEP 1 VALIDATION
function validateStep1() {
  const fullName = String(document.getElementById('fullName').value || '').trim();
  const email = String(document.getElementById('email').value || '').trim();
  const phone = String(document.getElementById('phone').value || '').trim();
  const linkedinUrl = String(document.getElementById('linkedinUrl').value || '').trim();
  const roleApplied = String(roleAppliedSelect.value || '').trim();
  const roleOtherText = String(roleOtherInput.value || '').trim();

  if (!fullName) return 'Please enter your full name.';
  if (!email || !validateEmail(email)) return 'Please enter a valid email address.';
  if (!phone) return 'Please enter your phone number.';
  if (!linkedinUrl || !validateLinkedIn(linkedinUrl)) return 'Please enter a valid LinkedIn profile URL.';
  if (!roleApplied) return 'Please select the role you are applying for.';
  if (roleApplied === 'Other' && !roleOtherText) return 'Please specify your role name.';

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
  const roleOtherText = selectedRole === 'Other' ? String(formData.get('role_other') || '').trim() : null;
  const resumeFile = resumeInput.files[0];

  const basePayload = {
    full_name: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone_number: String(formData.get('phone') || '').trim(),
    linkedin_url: String(formData.get('linkedinUrl') || '').trim(),
    role_applied_for: selectedRole,
    role_other_text: roleOtherText,
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
      years_experience: null,
      primary_skills: null,
      project_description: null,
      portfolio_url: null,
    };
  } else {
    return {
      ...basePayload,
      years_experience: String(formData.get('yearsExperience') || '').trim(),
      primary_skills: String(formData.get('primarySkills') || '').trim(),
      project_description: String(formData.get('projectDescription') || '').trim(),
      portfolio_url: String(formData.get('portfolioUrl') || '').trim() || null,
      years_of_sales_experience: null,
      relevant_experience: null,
      why_fit: null,
      expected_compensation: null,
      availability: null,
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
    if (payload.portfolio_url && !validateUrl(payload.portfolio_url)) {
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
roleAppliedSelect.addEventListener('change', handleRoleSelectChange);
roleOtherInput.addEventListener('input', () => {
  if (roleAppliedSelect.value === 'Other') {
    syncRoleView();
  }
});

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
  handleRoleSelectChange();
  goToStep(1);
  fileLabelText.textContent = 'Choose PDF file or drag here';
  fileLabelText.style.color = '';
  form.classList.remove('hidden');
  form.style.display = 'block';
  successState.classList.add('hidden');
  clearBanner();
});

// Initial setup
handleRoleSelectChange();
