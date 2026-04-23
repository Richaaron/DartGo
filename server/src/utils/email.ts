import nodemailer from 'nodemailer'
import { supabase } from '../config/supabase'
import { getEnvConfig } from './envConfig'

const config = getEnvConfig()

const transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
  studentId?: string
  type?: 'student_registration' | 'result_published' | 'attendance_warning' | 'low_grades' | 'teacher_assigned' | 'fee_reminder' | 'teacher_credentials'
  metadata?: Record<string, any>
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const { to, subject, text, html, type, studentId, metadata } = options
    
    const info = await transporter.sendMail({
      from: `"Folusho Victory Schools" <${config.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html: html || text,
    })

    // Log notification to database
    if (type) {
      try {
        await supabase.from('notifications').insert({
          recipient_email: to,
          recipient_name: to.split('@')[0],
          type,
          title: subject,
          message: html || text,
          status: 'SENT',
          student_id: studentId,
          metadata: metadata || {},
        })
      } catch (err) {
        console.error('Failed to log notification:', err)
      }
    }

    console.log('Message sent: %s', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    // Log failed notification
    if (options.type) {
      try {
        await supabase.from('notifications').insert({
          recipient_email: options.to,
          recipient_name: options.to.split('@')[0],
          type: options.type,
          title: options.subject,
          message: options.html || options.text,
          status: 'FAILED',
          student_id: options.studentId,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          metadata: options.metadata || {},
        })
      } catch (err) {
        console.error('Failed to log notification:', err)
      }
    }
    throw error
  }
}

export const sendStudentRegistrationEmail = async (studentEmail: string, studentName: string, registrationNumber: string, username: string, password: string, studentId?: string) => {
  const subject = 'Welcome to Folusho Victory Schools - Student Registration'
  const text = `Hello ${studentName}, your registration was successful. Your registration number is ${registrationNumber}. Your parent portal username is ${username} and password is ${password}.`
  const html = `
    <h1>Welcome to Folusho Victory Schools</h1>
    <p>Hello <strong>${studentName}</strong>,</p>
    <p>Your registration was successful. Below are your details:</p>
    <ul>
      <li><strong>Registration Number:</strong> ${registrationNumber}</li>
      <li><strong>Parent Portal Username:</strong> ${username}</li>
      <li><strong>Parent Portal Password:</strong> ${password}</li>
    </ul>
    <p>You can now log in to the parent portal using your credentials.</p>
    <p><a href="${config.FRONTEND_URL}">Access Parent Portal</a></p>
    <p>Best regards,<br/>Folusho Victory Schools Administration</p>
  `
  return sendEmail({
    to: studentEmail,
    subject,
    text,
    html,
    type: 'student_registration',
    studentId,
    metadata: { registrationNumber }
  })
}

export const sendTeacherCredentialsEmail = async (teacherEmail: string, teacherName: string, username: string, password: string) => {
  const subject = 'Your Faculty Account Credentials - Folusho Victory Schools'
  const text = `Hello ${teacherName}, your faculty account has been created. Username: ${username}, Password: ${password}.`
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h1 style="color: #7c3aed;">Welcome to the Faculty!</h1>
      <p>Hello <strong>${teacherName}</strong>,</p>
      <p>Your faculty profile has been successfully created in the <strong>Folusho Victory Schools Result Management System</strong>.</p>
      <p>Below are your secure login credentials:</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Username:</strong> <code style="color: #4f46e5;">${username}</code></p>
        <p style="margin: 5px 0;"><strong>Password:</strong> <code style="color: #4f46e5;">${password}</code></p>
      </div>
      <p>For security reasons, we recommend that you change your password immediately after your first login.</p>
      <p style="margin-top: 30px;">
        <a href="${config.FRONTEND_URL}/login?type=teacher" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Dashboard</a>
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply to this email.</p>
    </div>
  `
  return sendEmail({
    to: teacherEmail,
    subject,
    text,
    html,
    type: 'teacher_credentials',
    metadata: { username }
  })
}

export const sendResultPublishedEmail = async (parentEmail: string, studentName: string, term: string, academicYear: string, studentId?: string) => {
  const subject = `Exam Results Published: ${studentName} - ${term} ${academicYear}`
  const text = `Hello, the results for ${studentName} for ${term} ${academicYear} have been published. Please log in to the portal to view them.`
  const html = `
    <h1>Exam Results Published</h1>
    <p>Hello,</p>
    <p>The results for <strong>${studentName}</strong> for <strong>${term} ${academicYear}</strong> have been published.</p>
    <p>Please log in to the parent portal to view the detailed report sheet and performance analysis.</p>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?type=parent">View Results</a></p>
    <p>Best regards,<br/>Folusho Victory Schools Administration</p>
  `
  return sendEmail({
    to: parentEmail,
    subject,
    text,
    html,
    type: 'result_published',
    studentId,
    metadata: { term, academicYear }
  })
}

export const sendAttendanceWarningEmail = async (parentEmail: string, studentName: string, attendancePercentage: number, studentId?: string) => {
  const subject = `Attendance Alert: ${studentName} - Attendance Below Threshold`
  const text = `Hello, ${studentName}'s attendance is currently at ${attendancePercentage}%. Please ensure regular attendance.`
  const html = `
    <h1>Attendance Alert</h1>
    <p>Hello,</p>
    <p><strong>${studentName}</strong>'s attendance is currently at <strong>${attendancePercentage}%</strong>, which is below the required threshold.</p>
    <p>Regular attendance is crucial for academic success. Please encourage your child to attend school regularly.</p>
    <p>For more details, log in to the parent portal.</p>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?type=parent">Check Attendance</a></p>
    <p>Best regards,<br/>Folusho Victory Schools Administration</p>
  `
  return sendEmail({
    to: parentEmail,
    subject,
    text,
    html,
    type: 'attendance_warning',
    studentId,
    metadata: { attendancePercentage }
  })
}

export const sendLowGradesEmail = async (parentEmail: string, studentName: string, lowGradeSubjects: string[], studentId?: string) => {
  const subject = `Academic Performance Alert: ${studentName} - Low Grades Notice`
  const subjectList = lowGradeSubjects.join(', ')
  const text = `Hello, ${studentName} has low grades in the following subjects: ${subjectList}. Please consider additional support.`
  const html = `
    <h1>Academic Performance Alert</h1>
    <p>Hello,</p>
    <p><strong>${studentName}</strong> has low grades in the following subjects:</p>
    <ul>
      ${lowGradeSubjects.map(subject => `<li>${subject}</li>`).join('')}
    </ul>
    <p>We recommend organizing additional tutoring or support sessions. Please contact the school to discuss available resources.</p>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?type=parent">View Full Report</a></p>
    <p>Best regards,<br/>Folusho Victory Schools Administration</p>
  `
  return sendEmail({
    to: parentEmail,
    subject,
    text,
    html,
    type: 'low_grades',
    studentId,
    metadata: { lowGradeSubjects }
  })
}

export const sendFeeReminderEmail = async (parentEmail: string, studentName: string, amountDue: number, dueDate: string, studentId?: string) => {
  const subject = `Fee Payment Reminder: ${studentName}`
  const text = `Hello, this is a reminder that fees of ${amountDue} for ${studentName} are due on ${dueDate}.`
  const html = `
    <h1>Fee Payment Reminder</h1>
    <p>Hello,</p>
    <p>This is a friendly reminder that fees for <strong>${studentName}</strong> are due.</p>
    <ul>
      <li><strong>Amount Due:</strong> ${amountDue}</li>
      <li><strong>Due Date:</strong> ${dueDate}</li>
    </ul>
    <p>Please arrange payment to avoid any disruption to your child's academic activities.</p>
    <p>Contact the school office if you have any questions or need payment arrangements.</p>
    <p>Best regards,<br/>Folusho Victory Schools Administration</p>
  `
  return sendEmail({
    to: parentEmail,
    subject,
    text,
    html,
    type: 'fee_reminder',
    studentId,
    metadata: { amountDue, dueDate }
  })
}
