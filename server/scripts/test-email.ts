import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

async function testConnection() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST
  const port = process.env.EMAIL_PORT || process.env.SMTP_PORT
  const user = process.env.EMAIL_USER || process.env.SMTP_USER
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM
  
  console.log('--- Email Connection Test ---')
  console.log(`Host: ${host}`)
  console.log(`Port: ${port}`)
  console.log(`User: ${user}`)
  
  const transporter = nodemailer.createTransport({
    host: host,
    port: parseInt(port || '587'),
    secure: port === '465', // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass,
    },
  })

  try {
    // Verify connection configuration
    await transporter.verify()
    console.log('✅ Success: Email connection verified!')
    
    // Optionally send a test email
    if (user && from) {
      console.log('Sending test email...')
      await transporter.sendMail({
        from: from,
        to: user, // Send to self
        subject: 'Email Connection Test - Folusho Result System',
        text: 'If you are reading this, your Email connection is working perfectly!',
      })
      console.log(`✅ Success: Test email sent to ${user}`)
    }
  } catch (error) {
    console.error('❌ Error: SMTP connection failed')
    console.error(error)
  }
}

testConnection()
