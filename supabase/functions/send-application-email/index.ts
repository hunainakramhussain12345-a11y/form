import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ApplicationRecord {
  full_name: string;
  email: string;
  phone_number?: string;
  phone?: string;
  linkedin_url: string;
  current_role_company?: string;
  years_of_sales_experience?: string;
  relevant_experience?: string;
  why_fit?: string;
  expected_compensation?: string;
  availability?: string;
  resume_file_name?: string;
  resume_url?: string;
}

interface WebhookPayload {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  record?: ApplicationRecord;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const rawBody = await req.json();
    const payload: WebhookPayload = rawBody;
    const record: ApplicationRecord = payload.record || rawBody;

    const fullName = record.full_name || 'N/A';
    const email = record.email || 'N/A';
    const phone = record.phone_number || record.phone || 'N/A';
    const linkedinUrl = record.linkedin_url || 'N/A';
    const currentRole = record.current_role_company || 'N/A';
    const whyFit = record.why_fit || 'N/A';
    const resumeUrl = record.resume_url || 'N/A';

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY secret environment variable is missing.');
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY secret is not set in Edge Function environment.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">🚀 New Applicant Submission - Alpha Orbit</h2>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />

        <p style="font-size: 15px;"><strong>Full Name:</strong> ${fullName}</p>
        <p style="font-size: 15px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p style="font-size: 15px;"><strong>Phone:</strong> ${phone}</p>
        <p style="font-size: 15px;"><strong>LinkedIn URL:</strong> <a href="${linkedinUrl}" target="_blank">${linkedinUrl}</a></p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
        <p style="font-size: 15px;"><strong>Current / Last Role & Company:</strong> ${currentRole}</p>
        <p style="font-size: 15px;"><strong>Why Fit:</strong> ${whyFit}</p>

        ${resumeUrl !== 'N/A' ? `<p style="font-size: 15px; margin-top: 15px;">📄 <strong>Resume PDF:</strong> <a href="${resumeUrl}" target="_blank">View Uploaded Resume</a></p>` : ''}

        <footer style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
          Submitted via Alpha Orbit Careers Application Form.
        </footer>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Alpha Orbit Careers <onboarding@resend.dev>',
        to: ['hello@alphaorbit.site'],
        subject: `New Application: ${fullName}`,
        html: emailHtml,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API Error:', resendResult);
      return new Response(JSON.stringify({ error: resendResult }), {
        status: resendResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification email sent successfully to hello@alphaorbit.site',
        resend_id: resendResult.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
