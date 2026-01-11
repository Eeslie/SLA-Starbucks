/**
 * Email Notification Service
 * Sends automated emails when tickets are resolved/closed
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Gmail SMTP
 */
export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  try {
    // Don't pass credentials from client - API route will use server-side env vars
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate elegant ticket resolution email
 */
export function generateResolutionEmail(params: {
  customerName: string;
  ticketId: string;
  ticketTitle: string;
  issueDescription: string;
  resolutionNotes?: string;
  resolvedAt: string;
}): { subject: string; html: string } {
  const { customerName, ticketId, ticketTitle, issueDescription, resolutionNotes, resolvedAt } = params;
  
  const subject = `Your Starbucks Support Ticket #${ticketId.slice(0, 8)} Has Been Resolved`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Resolved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #00704a 0%, #1e3932 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Issue Resolved ✓
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear ${customerName || 'Valued Customer'},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                We're pleased to inform you that your support ticket has been successfully resolved.
              </p>
              
              <!-- Ticket Details -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #00704a; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                  Ticket Details
                </p>
                <p style="margin: 0 0 8px; color: #333333; font-size: 16px; font-weight: 600;">
                  ${ticketTitle}
                </p>
                <p style="margin: 0 0 8px; color: #666666; font-size: 14px;">
                  <strong>Ticket ID:</strong> ${ticketId}
                </p>
                <p style="margin: 0; color: #666666; font-size: 14px;">
                  <strong>Issue:</strong> ${issueDescription}
                </p>
              </div>
              
              ${resolutionNotes ? `
              <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #2e7d32; font-size: 14px; font-weight: 600;">
                  Resolution Summary
                </p>
                <p style="margin: 0; color: #1b5e20; font-size: 14px; line-height: 1.6;">
                  ${resolutionNotes}
                </p>
              </div>
              ` : ''}
              
              <p style="margin: 30px 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Your ticket was resolved on <strong>${new Date(resolvedAt).toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</strong>.
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                If you have any further questions or concerns, please don't hesitate to reach out to us. We're here to help!
              </p>
              
              <p style="margin: 30px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for choosing Starbucks. We appreciate your patience and look forward to serving you again soon.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #00704a;">Starbucks Customer Support Team</strong>
              </p>
              <p style="margin: 20px 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                This is an automated message. Please do not reply to this email.<br>
                For support, visit our <a href="#" style="color: #00704a; text-decoration: none;">Support Center</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  return { subject, html };
}
