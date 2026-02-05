import { Resend } from 'resend';

// Initialize Resend client only if API key is configured
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'POS System <noreply@example.com>';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'POS Back Office';

export interface SendInvitationEmailParams {
  to: string;
  inviterName: string;
  role: string;
  invitationLink: string;
  expiresAt: Date;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  emailConfigured: boolean;
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return resend !== null;
}

/**
 * Send an invitation email to a new team member
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<EmailResult> {
  const { to, inviterName, role, invitationLink, expiresAt } = params;

  // If Resend is not configured, return a clear message
  if (!resend) {
    console.warn('[Email] Resend API key not configured. Email not sent.');
    return {
      success: false,
      error: 'Email service not configured. Please set RESEND_API_KEY environment variable.',
      emailConfigured: false,
    };
  }

  const expiresFormatted = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `You've been invited to join ${APP_NAME}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${inviterName}</strong> has invited you to join ${APP_NAME} as a <strong>${roleCapitalized}</strong>.
    </p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      Click the button below to accept the invitation and create your account:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationLink}"
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                display: inline-block;">
        Accept Invitation
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all;">
      ${invitationLink}
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 13px; color: #9ca3af; margin: 0;">
      This invitation expires on <strong>${expiresFormatted}</strong>.
    </p>
    <p style="font-size: 13px; color: #9ca3af; margin-top: 10px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
      `,
      text: `
You're Invited to ${APP_NAME}!

Hi there,

${inviterName} has invited you to join ${APP_NAME} as a ${roleCapitalized}.

Click the link below to accept the invitation and create your account:
${invitationLink}

This invitation expires on ${expiresFormatted}.

If you didn't expect this invitation, you can safely ignore this email.
      `.trim(),
    });

    if (error) {
      console.error('[Email] Failed to send invitation email:', error);
      return {
        success: false,
        error: error.message,
        emailConfigured: true,
      };
    }

    console.log('[Email] Invitation email sent successfully:', data?.id);
    return {
      success: true,
      messageId: data?.id,
      emailConfigured: true,
    };
  } catch (error) {
    console.error('[Email] Exception sending invitation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      emailConfigured: true,
    };
  }
}
