import { sendEmail, sendBulkEmails } from '../services/emailService';
import { emailTemplates } from '../services/emailTemplates';

/**
 * Send student registration notification
 */
export const sendStudentRegistrationEmail = async (
  parentEmail: string,
  studentName: string,
  registrationNumber: string,
  parentName: string
): Promise<boolean> => {
  try {
    const html = emailTemplates.studentRegistration(studentName, registrationNumber, parentName);
    return await sendEmail(parentEmail, `Welcome to Folusho Victory Schools - ${studentName}`, html);
  } catch (error) {
    console.error('Error sending registration email:', error);
    return false;
  }
};

/**
 * Send result published notification
 */
export const sendResultPublishedEmail = async (
  parentEmail: string,
  studentName: string,
  term: string,
  academicYear: string
): Promise<boolean> => {
  try {
    const html = emailTemplates.resultPublished(studentName, term, academicYear);
    return await sendEmail(
      parentEmail,
      `Results Published for ${studentName} - ${term} ${academicYear}`,
      html
    );
  } catch (error) {
    console.error('Error sending result notification email:', error);
    return false;
  }
};

/**
 * Send attendance warning email
 */
export const sendAttendanceWarningEmail = async (
  parentEmail: string,
  studentName: string,
  attendancePercentage: number,
  threshold: number = 75
): Promise<boolean> => {
  try {
    const html = emailTemplates.attendanceWarning(studentName, attendancePercentage, threshold);
    return await sendEmail(
      parentEmail,
      `⚠️  Attendance Alert for ${studentName}`,
      html
    );
  } catch (error) {
    console.error('Error sending attendance warning email:', error);
    return false;
  }
};

/**
 * Send low grades alert email
 */
export const sendLowGradesEmail = async (
  parentEmail: string,
  studentName: string,
  subjects: string[],
  recommendations: string[] = [
    'Increase study time and focus on weak areas',
    'Attend after-school tuition sessions',
    'Discuss concerns with the subject teacher',
    'Create a study schedule and stick to it',
  ]
): Promise<boolean> => {
  try {
    const html = emailTemplates.lowGradesAlert(studentName, subjects, recommendations);
    return await sendEmail(
      parentEmail,
      `Academic Performance Alert for ${studentName}`,
      html
    );
  } catch (error) {
    console.error('Error sending low grades email:', error);
    return false;
  }
};

/**
 * Send fee reminder email
 */
export const sendFeeReminderEmail = async (
  parentEmail: string,
  studentName: string,
  amount: number,
  dueDate: string
): Promise<boolean> => {
  try {
    const html = emailTemplates.feeReminder(studentName, amount, dueDate);
    return await sendEmail(
      parentEmail,
      `School Fee Reminder for ${studentName}`,
      html
    );
  } catch (error) {
    console.error('Error sending fee reminder email:', error);
    return false;
  }
};

/**
 * Send bulk notification to parents
 */
export const sendBulkParentNotification = async (
  parentEmails: string[],
  subject: string,
  html: string
): Promise<number> => {
  try {
    return await sendBulkEmails(parentEmails, subject, html);
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    return 0;
  }
};

/**
 * Send custom email
 */
export const sendCustomEmail = async (
  email: string,
  subject: string,
  title: string,
  content: string
): Promise<boolean> => {
  try {
    const html = emailTemplates.custom(title, content);
    return await sendEmail(email, subject, html);
  } catch (error) {
    console.error('Error sending custom email:', error);
    return false;
  }
};

export default {
  sendStudentRegistrationEmail,
  sendResultPublishedEmail,
  sendAttendanceWarningEmail,
  sendLowGradesEmail,
  sendFeeReminderEmail,
  sendBulkParentNotification,
  sendCustomEmail,
};
