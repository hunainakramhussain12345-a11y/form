import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ApplicationRecord {
  full_name: string;
  email: string;
  phone_number?: string;
  linkedin_url: string;
  role_applied_for?: string;
  role_other_text?: string;
  years_experience?: string;
  primary_skills?: string;
  project_description?: string;
  portfolio_url?: string;
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

    // Verify webhook event type if present (only process INSERT)
    if (payload.type && payload.type !== 'INSERT') {
      return new Response(
        JSON.stringify({ message: `Ignored ${payload.type} event. Only INSERT triggers emails.` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fullName = record.full_name || 'Candidate';
    const email = record.email;
    const phone = record.phone_number || 'N/A';
    const linkedinUrl = record.linkedin_url || 'N/A';
    const roleApplied = record.role_applied_for || 'N/A';
    const roleOtherText = record.role_other_text || 'N/A';
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

    // 1. Send Notification Email to Internal Team Inbox
    const displayRole = roleApplied === 'Other' ? `Other (${roleOtherText})` : roleApplied;

    const teamEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #0b1120; color: #f8fafc;">
        <h2 style="color: #00d2ff; margin-top: 0;">🚀 New Job Application - ${displayRole}</h2>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 15px 0;" />

        <p style="font-size: 15px;"><strong>Full Name:</strong> ${fullName}</p>
        <p style="font-size: 15px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #38bdf8;">${email}</a></p>
        <p style="font-size: 15px;"><strong>Phone:</strong> ${phone}</p>
        <p style="font-size: 15px;"><strong>LinkedIn:</strong> <a href="${linkedinUrl}" target="_blank" style="color: #38bdf8;">${linkedinUrl}</a></p>
        <p style="font-size: 15px;"><strong>Role Applied For:</strong> ${displayRole}</p>
        
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 15px 0;" />
        ${roleApplied === 'Sales & Business Development' ? `
          <p style="font-size: 15px;"><strong>Years of Sales Experience:</strong> ${record.years_of_sales_experience || 'N/A'}</p>
          <p style="font-size: 15px;"><strong>Experience Type:</strong> ${record.relevant_experience || 'N/A'}</p>
          <p style="font-size: 15px;"><strong>Why Fit:</strong> ${record.why_fit || 'N/A'}</p>
          <p style="font-size: 15px;"><strong>Expected Compensation:</strong> ${record.expected_compensation || 'N/A'}</p>
          <p style="font-size: 15px;"><strong>Availability:</strong> ${record.availability || 'N/A'}</p>
        ` : `
          <p style="font-size: 15px;"><strong>Years of Experience:</strong> ${record.years_experience || 'N/A'}</p>
          <p style="font-size: 15px;"><strong>Primary Skills:</strong> ${record.primary_skills || 'N/A'}</p>
          <p style="font-size: 15px;"><strong>Project Proud Of:</strong> ${record.project_description || 'N/A'}</p>
          <p style="font-size: 15px;"><strong>Portfolio URL:</strong> ${record.portfolio_url ? `<a href="${record.portfolio_url}" target="_blank" style="color: #38bdf8;">${record.portfolio_url}</a>` : 'N/A'}</p>
        `}

        ${resumeUrl !== 'N/A' ? `<p style="font-size: 15px; margin-top: 15px;">📄 <strong>Resume PDF:</strong> <a href="${resumeUrl}" target="_blank" style="color: #38bdf8;">View Uploaded Resume</a></p>` : ''}

        <footer style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #1e293b; font-size: 12px; color: #94a3b8;">
          Submitted via Alpha Orbit Careers Application Form.
        </footer>
      </div>
    `;

    const teamResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Alpha Orbit Careers <onboarding@resend.dev>',
        to: ['hello@alphaorbit.site'],
        subject: `New Application: ${fullName} - ${displayRole}`,
        html: teamEmailHtml,
      }),
    });

    const teamResult = await teamResponse.json();

    // 2. Send Automated Confirmation Email to Candidate
    const candidateEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0284c7;">Thank you for applying to Alpha Orbit!</h2>
        <p style="font-size: 15px; line-height: 1.6;">Hi ${fullName},</p>
        <p style="font-size: 15px; line-height: 1.6;">We have received your application for the <strong>${displayRole}</strong> position at Alpha Orbit.</p>
        <p style="font-size: 15px; line-height: 1.6;">Our team will review your application and details. If your background matches what we are looking for, we will reach out to schedule an interview.</p>
        <br />
        <p style="font-size: 15px; line-height: 1.6;">Best regards,<br /><strong>Team Alpha Orbit</strong><br /><a href="https://alphaorbit.site">alphaorbit.site</a></p>
      </div>
    `;

    if (email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Alpha Orbit Careers <onboarding@resend.dev>',
          to: [email],
          subject: `Application Received - Alpha Orbit`,
          html: candidateEmailHtml,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification and candidate confirmation emails dispatched successfully',
        team_resend_id: teamResult.id,
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
