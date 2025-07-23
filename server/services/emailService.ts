import { MailService } from '@sendgrid/mail';
import { nanoid } from 'nanoid';

const mailService = new MailService();

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

mailService.setApiKey(process.env.SENDGRID_API_KEY);
console.log(`SendGrid API key configured successfully (using environment variable)`);

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
    
    // Use localhost for development, production URL for deployed app
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment ? 'http://localhost:5000' : (process.env.APP_URL || 'https://aisentinel.app');
    const verificationUrl = `${baseUrl}/api/auth/verify?token=${token}`;
    
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
      console.log(`✓ Verification URL for manual access: ${verificationUrl}`);
      console.log(`📧 IMPORTANT: If email doesn't arrive, check spam/junk folder or use the verification URL above`);
      return true;
    } catch (error: any) {
      console.error('SendGrid email error:', error);
      if (error?.response) {
        console.error('SendGrid response status:', error.response.status);
        console.error('SendGrid response body:', error.response.body);
      }
      console.log(`🔗 Manual verification available at: ${verificationUrl}`);
      return false;
    }
  }

  generateToken(): string {
    return nanoid(32);
  }

  // Debug method to test SendGrid connectivity and configuration
  async testSendGridConnection(): Promise<{
    isConfigured: boolean;
    fromEmailVerified: boolean;
    canConnect: boolean;
    errors: string[];
  }> {
    const result = {
      isConfigured: !!process.env.SENDGRID_API_KEY,
      fromEmailVerified: false,
      canConnect: false,
      errors: [] as string[]
    };

    if (!result.isConfigured) {
      result.errors.push('SENDGRID_API_KEY environment variable not set');
      return result;
    }

    try {
      // Test basic connectivity with a minimal email send to the from address
      const testEmail = {
        to: this.fromEmail,
        from: this.fromEmail,
        subject: 'SendGrid Connection Test - AI Sentinel',
        text: 'This is a test email to verify SendGrid connectivity.',
        html: '<p>This is a test email to verify SendGrid connectivity.</p>'
      };

      await mailService.send(testEmail);
      result.canConnect = true;
      result.fromEmailVerified = true;
      console.log('✓ SendGrid connection test successful');
    } catch (error: any) {
      result.errors.push(`Connection test failed: ${error.message || error}`);
      
      if (error?.response) {
        const status = error.response.status;
        const body = error.response.body;
        
        if (status === 401) {
          result.errors.push('Authentication failed - Invalid SendGrid API key');
        } else if (status === 403) {
          result.errors.push('Access forbidden - Check SendGrid API key permissions');
        } else if (status === 400) {
          const errorDetails = body?.errors?.[0];
          if (errorDetails?.field === 'from' || errorDetails?.message?.includes('does not have a verified sender identity')) {
            result.errors.push(`From email '${this.fromEmail}' is not verified in SendGrid`);
          } else {
            result.errors.push(`Request error: ${errorDetails?.message || 'Invalid request format'}`);
          }
        } else {
          result.errors.push(`HTTP ${status}: ${JSON.stringify(body)}`);
        }
      }
      
      console.error('SendGrid connection test failed:', error);
    }

    return result;
  }

  // Get environment-specific configuration info
  getConfigInfo(): {
    environment: string;
    apiKeyConfigured: boolean;
    fromEmail: string;
    appUrl: string;
  } {
    return {
      environment: process.env.NODE_ENV || 'development',
      apiKeyConfigured: !!process.env.SENDGRID_API_KEY,
      fromEmail: this.fromEmail,
      appUrl: process.env.APP_URL || 'https://aisentinel.app'
    };
  }
}

export const emailService = new EmailService();