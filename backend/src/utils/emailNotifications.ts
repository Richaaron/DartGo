import { sendEmail, sendBulkEmails } from '../utils/emailService';
import { emailTemplates } from '../utils/emailTemplates';

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
      `Results Published for ${studentName}`,
      html
    );
  } catch (error) {
    console.error('Error sending result email:', error);
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
      `Attendance Alert for ${studentName}`,
      html
    );
  } catch (error) {
    console.error('Error sending attendance email:', error);
    return false;
  }
};

/**
 * Send low grades alert email
 */
export const sendLowGradesEmail = async (
  parentEmail: string,
  studentName: string,
  subjects: string[]
): Promise<boolean> => {
  try {
    const html = emailTemplates.lowGradesAlert(studentName, subjects);
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
    console.error('Error sending fee reminder:', error);
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

export default {
  sendStudentRegistrationEmail,
  sendResultPublishedEmail,
  sendAttendanceWarningEmail,
  sendLowGradesEmail,
  sendFeeReminderEmail,
  sendBulkParentNotification,
};
