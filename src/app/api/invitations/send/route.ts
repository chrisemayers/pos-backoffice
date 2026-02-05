import { NextRequest, NextResponse } from 'next/server';
import { sendInvitationEmail, isEmailConfigured } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, inviterName, role, invitationId, expiresAt } = body;

    // Validate required fields
    if (!email || !inviterName || !role || !invitationId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, inviterName, role, invitationId' },
        { status: 400 }
      );
    }

    // Build the invitation link
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
    const invitationLink = `${baseUrl}/invite/${invitationId}`;

    // Send the email
    const result = await sendInvitationEmail({
      to: email,
      inviterName,
      role,
      invitationLink,
      expiresAt: new Date(expiresAt),
    });

    if (!result.emailConfigured) {
      // Email service not configured - return specific status
      return NextResponse.json(
        {
          success: false,
          emailSent: false,
          emailConfigured: false,
          message: 'Email service not configured. Invitation created but email not sent.',
          invitationLink,
        },
        { status: 200 } // Still 200 since the invitation was created
      );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          emailSent: false,
          emailConfigured: true,
          error: result.error,
          invitationLink,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      emailConfigured: true,
      messageId: result.messageId,
      invitationLink,
    });
  } catch (error) {
    console.error('[API] Error in send invitation endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check email configuration status
export async function GET() {
  return NextResponse.json({
    emailConfigured: isEmailConfigured(),
  });
}
