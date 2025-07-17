import { MailService } from '@sendgrid/mail';
import { nanoid } from 'nanoid';

const mailService = new MailService();
// Use the new SendGrid API key directly since environment variable is cached
const sendgridApiKey = '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';

mailService.setApiKey(sendgridApiKey);
console.log("SendGrid API key configured successfully");

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private readonly fromEmail = 'ed.duval@duvalsolutions.net'; // Using your verified sender email

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    console.log(`Sending verification email to ${email}`);
    
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify?token=${token}`;
    
    try {
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - AI Sentinel</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .content { background: #f8fafc; padding: 30px; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AI Sentinel</div>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hello,</p>
            <p>Thank you for accessing AI Sentinel. To complete your login, please click the button below to verify your email address:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this verification, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>AI Sentinel - Enterprise AI Governance Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      AI Sentinel - Verify Your Email Address
      
      Hello,
      
      Thank you for accessing AI Sentinel. To complete your login, please click the link below to verify your email address:
      
      ${verificationUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this verification, you can safely ignore this email.
      
      AI Sentinel - Enterprise AI Governance Platform
    `;

      await mailService.send({
        to: email,
        from: this.fromEmail,
        subject: 'Verify Your Email - AI Sentinel',
        text,
        html,
      });
      console.log(`✓ Verification email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      if (error.response) {
        console.error('SendGrid response:', error.response.body);
      }
      return false;
    }
  }

  generateToken(): string {
    return nanoid(32);
  }
}

export const emailService = new EmailService();