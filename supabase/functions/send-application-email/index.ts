interface ApplicationRecord {
  id?: string;
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
  type?: 'INSERT' | 'UPDATE' | 'DELETE' | 'STATUS_EMAIL';
  action?: 'STATUS_EMAIL';
  table?: string;
  record?: ApplicationRecord;
  status?: 'selected' | 'rejected' | 'interview';
  custom_message?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY secret environment variable is missing.');
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY secret is not set in Edge Function environment.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailFrom = Deno.env.get('EMAIL_FROM') || 'Alpha Orbit Careers <careers@mail.thealphaorbit.com>';
    const adminNotificationEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'muhammadtahasattararain@gmail.com';
    const companySiteUrl = Deno.env.get('COMPANY_URL') || 'https://thealphaorbit.com';

    const rawBody = await req.json();
    const payload: WebhookPayload = rawBody;

    // ─────────────────────────────────────────────────────────────
    // CASE A: ADMIN STATUS EMAIL (Selection / Rejection / Interview)
    // ─────────────────────────────────────────────────────────────
    if (payload.action === 'STATUS_EMAIL' || payload.type === 'STATUS_EMAIL') {
      const record: ApplicationRecord = payload.record || rawBody;
      const candidateEmail = record.email;
      const candidateName = record.full_name || 'Candidate';
      const role = record.role_applied_for || 'Position';
      const statusType = payload.status || 'interview';
      const customMessage = payload.custom_message || '';

      if (!candidateEmail) {
        return new Response(
          JSON.stringify({ error: 'Candidate email is required for status email.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let subject = '';
      let htmlContent = '';

      if (statusType === 'selected') {
        subject = `Application Update: Welcome to Alpha Orbit - Offer / Next Steps`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0284c7; margin-top: 0;">Congratulations ${candidateName}!</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #1e293b;">
              We are excited to inform you that you have been selected for the <strong>${role}</strong> role at <strong>Alpha Orbit</strong>!
            </p>
            ${customMessage ? `<div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0; font-size: 14px; line-height: 1.6;">${customMessage}</div>` : ''}
            <p style="font-size: 15px; line-height: 1.6; color: #1e293b;">
              Our HR & Onboarding team will be following up shortly with your onboarding details and official documentation.
            </p>
            <br />
            <p style="font-size: 14px; color: #64748b;">
              Welcome aboard,<br />
              <strong>Team Alpha Orbit</strong><br />
              <a href="${companySiteUrl}" style="color: #0284c7;">${companySiteUrl}</a>
            </p>
          </div>
        `;
      } else if (statusType === 'rejected') {
        subject = `Update regarding your application at Alpha Orbit`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #334155; margin-top: 0;">Thank you for your interest, ${candidateName}</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #1e293b;">
              Thank you for taking the time to apply for the <strong>${role}</strong> position at <strong>Alpha Orbit</strong>.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #1e293b;">
              After careful evaluation of all applications, we have decided to move forward with other candidates whose experience more closely matches our immediate requirements at this time.
            </p>
            ${customMessage ? `<div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0; font-size: 14px; line-height: 1.6;">${customMessage}</div>` : ''}
            <p style="font-size: 15px; line-height: 1.6; color: #1e293b;">
              We will retain your profile in our talent pool for future opportunities that match your background. We wish you every success in your career journey.
            </p>
            <br />
            <p style="font-size: 14px; color: #64748b;">
              Sincerely,<br />
              <strong>Team Alpha Orbit</strong><br />
              <a href="${companySiteUrl}" style="color: #0284c7;">${companySiteUrl}</a>
            </p>
          </div>
        `;
      } else {
        // Interview invitation
        subject = `Invitation to Interview - ${role} at Alpha Orbit`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0284c7; margin-top: 0;">Interview Invitation: ${candidateName}</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #1e293b;">
              Thank you for applying for the <strong>${role}</strong> role. We were impressed with your application and would like to invite you for an interview.
            </p>
            ${customMessage ? `<div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0; font-size: 14px; line-height: 1.6;">${customMessage}</div>` : ''}
            <br />
            <p style="font-size: 14px; color: #64748b;">
              Best regards,<br />
              <strong>Team Alpha Orbit</strong><br />
              <a href="${companySiteUrl}" style="color: #0284c7;">${companySiteUrl}</a>
            </p>
          </div>
        `;
      }

      const statusRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [candidateEmail],
          subject: subject,
          html: htmlContent,
        }),
      });

      const statusResult = await statusRes.json();
      return new Response(
        JSON.stringify({ success: true, action: 'STATUS_EMAIL', status: statusType, result: statusResult }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // CASE B: CANDIDATE APPLICATION SUBMITTED (INSERT trigger / call)
    // ─────────────────────────────────────────────────────────────
    const record: ApplicationRecord = payload.record || rawBody;

    // Verify webhook event type if present (only process INSERT)
    if (payload.type && payload.type !== 'INSERT') {
      return new Response(
        JSON.stringify({ message: `Ignored ${payload.type} event. Only INSERT triggers application emails.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullName = record.full_name || 'Candidate';
    const email = record.email;
    const phone = record.phone_number || 'N/A';
    const linkedinUrl = record.linkedin_url || 'N/A';
    const roleApplied = record.role_applied_for || 'N/A';
    const roleOtherText = record.role_other_text || 'N/A';
    const resumeUrl = record.resume_url || 'N/A';
    const displayRole = roleApplied === 'Other' ? `Other (${roleOtherText})` : roleApplied;

    // 1. Team Notification Email to Internal Inbox
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
          Submitted via Alpha Orbit Careers Portal. Review and update status in your Admin Panel.
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
        from: emailFrom,
        to: [adminNotificationEmail],
        subject: `New Application: ${fullName} - ${displayRole}`,
        html: teamEmailHtml,
      }),
    });

    const teamResult = await teamResponse.json();

    // 2. Automated Confirmation Email to Candidate
    const candidateEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0284c7; margin-top: 0;">Thank you for applying to Alpha Orbit!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #1e293b;">Hi ${fullName},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #1e293b;">We have received your application for the <strong>${displayRole}</strong> position at Alpha Orbit.</p>
        <p style="font-size: 15px; line-height: 1.6; color: #1e293b;">Our team will review your qualifications and details. If your background matches what we are looking for, we will reach out to schedule an interview.</p>
        <br />
        <p style="font-size: 14px; line-height: 1.6; color: #64748b;">Best regards,<br /><strong style="color: #1e293b;">Team Alpha Orbit</strong><br /><a href="${companySiteUrl}" style="color: #0284c7;">thealphaorbit.com</a></p>
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
          from: emailFrom,
          to: [email],
          subject: `Application Received - Alpha Orbit Careers`,
          html: candidateEmailHtml,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application notification and candidate confirmation emails dispatched successfully',
        team_resend_id: teamResult.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
