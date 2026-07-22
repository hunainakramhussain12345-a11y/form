(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.SUPABASE_CLIENT = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function normalizeSupabaseConfig(config = {}) {
    const supabaseUrl = String(config.supabaseUrl || '').trim().replace(/\/$/, '');
    const supabaseAnonKey = String(config.supabaseAnonKey || '').trim();

    return {
      supabaseUrl,
      supabaseAnonKey,
      tableName: 'sales_applications',
      bucketName: 'resumes',
    };
  }

  function createSupabaseRequestOptions(config, payload) {
    const { supabaseUrl, supabaseAnonKey, tableName } = normalizeSupabaseConfig(config);

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_PROJECT_REF') || supabaseAnonKey.includes('YOUR_')) {
      throw new Error('Replace the placeholder Supabase values in config.js before submitting.');
    }

    return {
      url: `${supabaseUrl}/rest/v1/${tableName}`,
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Prefer: 'return=minimal',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    };
  }

  async function uploadResumeToSupabase(config, file, fetchImpl = fetch) {
    if (!file) return null;

    // Frontend & Client-side enforcement: 3MB limit & PDF check
    const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB limit

    if (typeof file !== 'string' && file.size && file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('Resume file size must not exceed 3MB.');
    }

    const fileName = typeof file === 'string' ? 'resume.pdf' : (file.name || 'resume.pdf');
    const isPdf = (typeof file !== 'string' && file.type === 'application/pdf') || fileName.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new Error('Resume upload must be a PDF file.');
    }

    const { supabaseUrl, supabaseAnonKey, bucketName } = normalizeSupabaseConfig(config);

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_PROJECT_REF') || supabaseAnonKey.includes('YOUR_')) {
      throw new Error('Replace the placeholder Supabase values in config.js before uploading.');
    }

    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `${timestamp}_${sanitizedName}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${storagePath}`;

    const headers = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'x-upsert': 'true',
      'Content-Type': 'application/pdf',
    };

    const response = await fetchImpl(uploadUrl, {
      method: 'POST',
      headers,
      body: file,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let friendlyMessage = errorText || 'Failed to upload resume to storage bucket.';

      try {
        const parsed = JSON.parse(errorText);
        if (parsed?.message) {
          friendlyMessage = parsed.message;
        }
      } catch {
        // Keep original error text if not JSON
      }

      throw new Error(`Resume Storage Upload Error: ${friendlyMessage}`);
    }

    // Public download/view URL from Supabase Storage
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${storagePath}`;
  }

  async function submitToSupabase(config, payload, fetchImpl = fetch) {
    const request = createSupabaseRequestOptions(config, payload);
    const response = await fetchImpl(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let friendlyMessage = errorText || 'Submission failed. Please try again.';

      try {
        const parsedError = JSON.parse(errorText);
        if (parsedError?.message && parsedError.message.includes('Could not find the table')) {
          friendlyMessage = 'Supabase table not found. Create the public.sales_applications table in your project first.';
        } else if (parsedError?.message) {
          friendlyMessage = parsedError.message;
        }
      } catch {
        // Keep the original response text if it is not JSON.
      }

      throw new Error(friendlyMessage);
    }

    return response;
  }

  return {
    normalizeSupabaseConfig,
    createSupabaseRequestOptions,
    uploadResumeToSupabase,
    submitToSupabase,
  };
});
