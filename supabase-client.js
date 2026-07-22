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
    submitToSupabase,
  };
});
