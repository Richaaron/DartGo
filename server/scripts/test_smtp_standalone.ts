import nodemailer from 'nodemailer'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

async function testSMTP() {
  console.log('--- Starting Standalone SMTP Connection Test ---')
  console.log(`Testing with user: ${process.env.SMTP_USER}`)
  console.log(`Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`)
  
  try {
    const info = await transporter.sendMail({
      from: `"Folusho Victory Schools" <${process.env.SMTP_FROM}>`,
      to: 'folushovictoryschool@gmail.com',
      subject: '🚀 SMTP Standalone Test - Folusho Victory Schools',
      text: 'This is a test email to confirm that the SMTP configuration is working correctly for production.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #7c3aed; border-radius: 8px;">
          <h1 style="color: #7c3aed;">SMTP Handshake Successful!</h1>
          <p>This email confirms that your Gmail App Password is correctly configured.</p>
          <p><strong>School:</strong> Folusho Victory Schools</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #64748b;">Folusho Result Management System</p>
        </div>
      `
    })
    
    console.log('✅ Test email sent successfully!')
    console.log('Message ID:', info.messageId)
  } catch (error) {
    console.error('❌ SMTP Test Failed:', error)
  }
}

testSMTP()
