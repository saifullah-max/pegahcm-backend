import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private static defaultFrom = process.env.SENDGRID_FROM_EMAIL || 'your-verified-sender@example.com';

  /**
   * Send an email using SendGrid
   * @param options Email options including to, subject, and content
   * @returns Promise that resolves when email is sent
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const msg = {
        to: options.to,
        from: options.from || this.defaultFrom,
        subject: options.subject,
        text: options.text || '',
        html: options.html || options.text || ''
      };

      await sgMail.send(msg);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send a welcome email to a new user
   * @param email User's email address
   * @param name User's name
   */
  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to PegaHCM';
    const text = `Welcome ${name} to PegaHCM! We're excited to have you on board.`;
    const html = `
      <h1>Welcome to PegaHCM!</h1>
      <p>Dear ${name},</p>
      <p>We're excited to have you join our team. Your account has been successfully created.</p>
      <p>Best regards,<br>The PegaHCM Team</p>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Send a password reset email
   * @param email User's email address
   * @param resetToken Password reset token
   */
  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const subject = 'Password Reset Request';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const text = `Please click the following link to reset your password: ${resetUrl}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>You have requested to reset your password.</p>
      <p>Please click the following link to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Send an employee onboarding email
   * @param email Employee's email address
   * @param name Employee's name
   * @param department Employee's department
   */
  static async sendOnboardingEmail(email: string, name: string, department: string): Promise<void> {
    const subject = 'Welcome to the Team - Onboarding Information';
    const text = `Welcome ${name} to the ${department} department! We're excited to have you join our team.`;
    const html = `
      <h1>Welcome to the Team!</h1>
      <p>Dear ${name},</p>
      <p>Welcome to the ${department} department! We're excited to have you join our team.</p>
      <p>Here are some important next steps:</p>
      <ul>
        <li>Complete your profile information</li>
        <li>Review company policies</li>
        <li>Set up your work schedule</li>
      </ul>
      <p>If you have any questions, please don't hesitate to reach out to your manager.</p>
      <p>Best regards,<br>The PegaHCM Team</p>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }
}

export default EmailService; 