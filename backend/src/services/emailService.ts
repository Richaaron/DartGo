import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter: Transporter | null = null;

/**
 * Initialize email transporter
 */
export const initializeEmailService = async (): Promise<void> => {
  try {
    const host = process.env['EMAIL_HOST'];
    const port = parseInt(process.env['EMAIL_PORT'] || '587');
    const user = process.env['EMAIL_USER'];
    const pass = process.env['EMAIL_PASS'];

    if (!host || !user || !pass) {
      console.warn('⚠️  Email service not configured. Skipping initialization.');
      return;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports like 587
      auth: {
        user,
        pass,
      },
    });

    // Test the connection
    await transporter.verify();
    console.log('✅ Email service initialized successfully');
  } catch (error) {
    console.error('❌ Email service initialization failed:', error);
    transporter = null;
  }
};

/**
 * Send email
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  try {
    if (!transporter) {
      console.warn('Email service not initialized. Cannot send email.');
      return false;
    }

    const mailOptions = {
      from: process.env['EMAIL_FROM'] || process.env['EMAIL_USER'],
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return false;
  }
};

/**
 * Send bulk emails
 */
export const sendBulkEmails = async (
  recipients: string[],
  subject: string,
  html: string,
  text?: string
): Promise<number> => {
  let successCount = 0;
  for (const recipient of recipients) {
    const success = await sendEmail(recipient, subject, html, text);
    if (success) successCount++;
  }
  return successCount;
};

export default {
  initializeEmailService,
  sendEmail,
  sendBulkEmails,
};
