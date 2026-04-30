import nodemailer from "nodemailer";
import { supabase } from "../config/supabase";
import { getEnvConfig } from "./envConfig";

const config = getEnvConfig();

const transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

const resolveFrontendUrl = () => {
  const candidates = [
    config.FRONTEND_URL,
    config.CORS_ORIGIN,
    process.env.URL,
    process.env.DEPLOY_URL ? `https://${process.env.DEPLOY_URL}` : undefined,
    "https://folushovictoryschools.netlify.app",
  ];

  const selected = candidates.find((value) => {
    if (!value) return false;
    return !value.includes("localhost");
  });

  return selected || config.FRONTEND_URL || "http://localhost:5173";
};

const frontendUrl = resolveFrontendUrl();

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  studentId?: string;
  type?:
    | "student_registration"
    | "result_published"
    | "attendance_warning"
    | "low_grades"
    | "teacher_assigned"
    | "fee_reminder"
    | "teacher_credentials";
  metadata?: Record<string, any>;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const { to, subject, text, html, type, studentId, metadata } = options;

    const info = await transporter.sendMail({
      from: `"Folusho Victory Schools" <${config.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    // Log notification to database
    if (type) {
      try {
        await supabase.from("notifications").insert({
          recipient_email: to,
          recipient_name: to.split("@")[0],
          type,
          title: subject,
          message: html || text,
          status: "SENT",
          student_id: studentId,
          metadata: metadata || {},
        });
      } catch (err) {
        console.error("Failed to log notification:", err);
      }
    }

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // Log failed notification
    if (options.type) {
      try {
        await supabase.from("notifications").insert({
          recipient_email: options.to,
          recipient_name: options.to.split("@")[0],
          type: options.type,
          title: options.subject,
          message: options.html || options.text,
          status: "FAILED",
          student_id: options.studentId,
          error_message:
            error instanceof Error ? error.message : "Unknown error",
          metadata: options.metadata || {},
        });
      } catch (err) {
        console.error("Failed to log notification:", err);
      }
    }
    throw error;
  }
};

export const sendStudentRegistrationEmail = async (
  studentEmail: string,
  studentName: string,
  registrationNumber: string,
  username: string,
  password: string,
  studentId?: string,
) => {
  const subject = "Welcome to Folusho Victory Schools - Student Registration";
  const text = `Hello ${studentName}, your registration was successful. Your registration number is ${registrationNumber}. Your parent portal username is ${username} and password is ${password}.`;
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
      <p><a href="${frontendUrl}">Access Parent Portal</a></p>
    <p>Best regards,<br/>Folusho Victory Schools Administration</p>
  `;
  return sendEmail({
    to: studentEmail,
    subject,
    text,
    html,
    type: "student_registration",
    studentId,
    metadata: { registrationNumber },
  });
};

export const sendTeacherCredentialsEmail = async (
  teacherEmail: string,
  teacherName: string,
  username: string,
  password: string,
) => {
  const subject = "Your Faculty Account Credentials - Folusho Victory Schools";
  const text = `Hello ${teacherName}, your faculty account has been created. Username: ${username}, Password: ${password}. Access the app at: https://folushovictoryschools.netlify.app`;
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
      <div style="margin-top: 30px; display: flex; gap: 12px;">
        <a href="https://folushovictoryschools.netlify.app" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Visit Application</a>
        <a href="${frontendUrl}/login?type=teacher" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Dashboard</a>
      </div>
      <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
        <strong>Application URL:</strong> <a href="https://folushovictoryschools.netlify.app" style="color: #7c3aed; text-decoration: none;">https://folushovictoryschools.netlify.app</a>
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply to this email.</p>
    </div>
  `;
  return sendEmail({
    to: teacherEmail,
    subject,
    text,
    html,
    type: "teacher_credentials",
    metadata: { username },
  });
};

export const sendResultPublishedEmail = async (
  parentEmail: string,
  studentName: string,
  term: string,
  academicYear: string,
  studentId?: string,
) => {
  const subject = `Exam Results Published: ${studentName} - ${term} ${academicYear}`;
  const text = `Hello, the results for ${studentName} for ${term} ${academicYear} have been published. Please log in to the portal to view them.`;
  const html = `
    <h1>Exam Results Published</h1>
    <p>Hello,</p>
    <p>The results for <strong>${studentName}</strong> for <strong>${term} ${academicYear}</strong> have been published.</p>
    <p>Please log in to the parent portal to view the detailed report sheet and performance analysis.</p>
    <p><a href="${frontendUrl}/login?type=parent">View Results</a></p>
    <p>Best regards,<br/>Folusho Victory Schools Administration</p>
  `;
  return sendEmail({
    to: parentEmail,
    subject,
    text,
    html,
    type: "result_published",
    studentId,
    metadata: { term, academicYear },
  });
};

export const sendAttendanceWarningEmail = async (
  parentEmail: string,
  studentName: string,
  attendancePercentage: number,
  studentId?: string,
) => {
  const subject = `Attendance Alert: ${studentName} - Attendance Below Threshold`;
  const text = `Hello, ${studentName}'s attendance is currently at ${attendancePercentage}%. Please ensure regular attendance.`;
  const html = `
    <h1>Attendance Alert</h1>
    <p>Hello,</p>
    <p><strong>${studentName}</strong>'s attendance is currently at <strong>${attendancePercentage}%</strong>, which is below the required threshold.</p>
    <p>Regular attendance is crucial for academic success. Please encourage your child to attend school regularly.</p>
    <p>For more details, log in to the parent portal.</p>
    <p><a href="${frontendUrl}/login?type=parent">Check Attendance</a></p>
    <p>Best regards,<br/>Folusho Victory Schools Administration</p>
  `;
  return sendEmail({
    to: parentEmail,
    subject,
    text,
    html,
    type: "attendance_warning",
    studentId,
    metadata: { attendancePercentage },
  });
};

export const sendLowGradesEmail = async (
  parentEmail: string,
  studentName: string,
  lowGradeSubjects: string[],
  studentId?: string,
) => {
  const subject = `Academic Performance Alert: ${studentName} - Low Grades Notice`;
  const subjectList = lowGradeSubjects.join(", ");
  const text = `Hello, ${studentName} has low grades in the following subjects: ${subjectList}. Please consider additional support.`;
  const html = `
    <h1>Academic Performance Alert</h1>
    <p>Hello,</p>
    <p><strong>${studentName}</strong> has low grades in the following subjects:</p>
    <ul>
      ${lowGradeSubjects.map((subject) => `<li>${subject}</li>`).join("")}
    </ul>
    <p>We recommend organizing additional tutoring or support sessions. Please contact the school to discuss available resources.</p>
    <p><a href="${frontendUrl}/login?type=parent">View Full Report</a></p>
    <p>Best regards,<br/>Folusho Victory Schools Administration</p>
  `;
  return sendEmail({
    to: parentEmail,
    subject,
    text,
    html,
    type: "low_grades",
    studentId,
    metadata: { lowGradeSubjects },
  });
};

export const sendFeeReminderEmail = async (
  parentEmail: string,
  studentName: string,
  amountDue: number,
  dueDate: string,
  studentId?: string,
) => {
  const subject = `Fee Payment Reminder: ${studentName}`;
  const text = `Hello, this is a reminder that fees of ${amountDue} for ${studentName} are due on ${dueDate}.`;
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
  `;
  return sendEmail({
    to: parentEmail,
    subject,
    text,
    html,
    type: "fee_reminder",
    studentId,
    metadata: { amountDue, dueDate },
  });
};

export const sendStudentResultsEmail = async (
  parentEmail: string,
  studentName: string,
  term: string,
  academicYear: string,
  results: Array<{
    subject: string;
    grade: string;
    percentage: number;
    position: string;
  }>,
  classPosition?: {
    position: number;
    positionText: string;
    totalStudents: number;
  },
  studentId?: string,
) => {
  const subject = `📊 ${studentName}'s Results - ${term} ${academicYear} | Position: ${classPosition?.positionText || "N/A"}`;

  const resultsTable = results
    .map(
      (r) =>
        `<tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; text-align: left;">${r.subject}</td>
          <td style="padding: 12px; text-align: center;"><strong>${r.percentage.toFixed(1)}%</strong></td>
          <td style="padding: 12px; text-align: center;"><span style="background-color: #7c3aed; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${r.grade}</span></td>
          <td style="padding: 12px; text-align: center;">${r.position}</td>
        </tr>`,
    )
    .join("");

  const overallText =
    classPosition && classPosition.position > 0
      ? `Overall Class Position: <strong style="color: #7c3aed; font-size: 18px;">${classPosition.positionText} out of ${classPosition.totalStudents}</strong>`
      : "";

  const text = `Hello, here are ${studentName}'s results for ${term} ${academicYear}. ${classPosition && classPosition.position > 0 ? `Position: ${classPosition.positionText} out of ${classPosition.totalStudents}` : ""}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📊 Academic Results</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Term: <strong>${term} ${academicYear}</strong></p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px;">
        <p style="font-size: 16px; margin: 0 0 20px 0;">
          Dear Parent/Guardian,
        </p>

        <p style="margin: 0 0 20px 0;">
          We are pleased to present the academic results for <strong>${studentName}</strong> for the <strong>${term}</strong> of <strong>${academicYear}</strong>.
        </p>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #7c3aed;">
          <h3 style="color: #7c3aed; margin-top: 0;">Academic Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #7c3aed; color: white;">
                <th style="padding: 12px; text-align: left;">Subject</th>
                <th style="padding: 12px; text-align: center;">Percentage</th>
                <th style="padding: 12px; text-align: center;">Grade</th>
                <th style="padding: 12px; text-align: center;">Position</th>
              </tr>
            </thead>
            <tbody>
              ${resultsTable}
            </tbody>
          </table>
        </div>

        ${
          overallText
            ? `<div style="background-color: #e0e7ff; padding: 15px; border-left: 4px solid #7c3aed; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px;">
            ${overallText}
          </p>
        </div>`
            : ""
        }

        <p style="margin: 20px 0; font-size: 14px; color: #64748b;">
          For a detailed breakdown and performance analysis, please log in to the parent portal.
        </p>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${frontendUrl}/login?type=parent" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Full Report</a>
        </div>
      </div>

      <div style="background-color: #1e293b; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
        <p style="margin: 0;">
          <strong>Folusho Victory Schools</strong><br/>
          Excellence in Education
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: parentEmail,
    subject,
    text,
    html,
    type: "result_published",
    studentId,
    metadata: { term, academicYear, classPosition },
  });
};

/**
 * Humanize a raw HTTP action string like "POST /api/students" into readable text
 */
function humanizeTeacherAction(action: string): string {
  const parts = action.trim().split(" ");
  const method = parts[0];
  const url = parts[1] || "";
  const path = url.replace("/api/", "");
  const segments = path.split("/");
  const resource = segments[0];
  const sub = segments[1];

  const labels: Record<string, string> = {
    students: "student record",
    teachers: "teacher record",
    results: "result",
    attendance: "attendance record",
    "scheme-of-work": "scheme of work",
    subjects: "subject",
    observations: "observation",
    "student-subjects": "subject assignment",
    deadlines: "deadline",
  };

  const label = labels[resource] || resource;

  if (method === "POST") {
    if (sub === "bulk")
      return `Submitted bulk ${labels[resource] || resource}s`;
    if (sub === "upload") return `Uploaded a ${label}`;
    if (sub === "submit") return `Submitted a ${label}`;
    return `Added a new ${label}`;
  }
  if (method === "PUT" || method === "PATCH") {
    if (sub === "submit") return `Submitted a ${label}`;
    return `Updated a ${label}`;
  }
  if (method === "DELETE") return `Deleted a ${label}`;
  return `${method} ${label}`;
}

/**
 * Send a real-time activity alert email to the admin
 * whenever a teacher performs a significant action
 */
export const sendTeacherActivityAlertEmail = async (
  teacherName: string,
  teacherEmail: string,
  action: string,
  details: string,
  timestamp: string,
): Promise<void> => {
  const ADMIN_EMAIL = "folushovictoryschool@gmail.com";
  const humanAction = humanizeTeacherAction(action);

  // Format the detail fields — parse JSON if possible, hide sensitive keys
  const HIDDEN_KEYS = [
    "password",
    "image",
    "token",
    "Authorization",
    "confirmPassword",
  ];
  let detailRows = "";
  try {
    const parsed = JSON.parse(details);
    detailRows = Object.entries(parsed)
      .filter(
        ([k, v]) => v !== undefined && v !== "" && !HIDDEN_KEYS.includes(k),
      )
      .slice(0, 12)
      .map(([k, v]) => {
        const displayVal = String(v).substring(0, 120);
        const label = k
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase());
        return `<tr>
          <td style="padding:8px 12px;font-weight:600;color:#475569;width:140px;white-space:nowrap;border-bottom:1px solid #f1f5f9;">${label}</td>
          <td style="padding:8px 12px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${displayVal}</td>
        </tr>`;
      })
      .join("");
  } catch {
    detailRows = `<tr><td colspan="2" style="padding:8px 12px;color:#64748b;">${details.substring(0, 300)}</td></tr>`;
  }

  const timeStr = (() => {
    try {
      return new Date(timestamp).toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  })();

  const actionColor = action.startsWith("DELETE")
    ? "#dc2626"
    : action.startsWith("POST")
      ? "#16a34a"
      : "#2563eb";

  const subject = `[Activity Alert] ${teacherName} — ${humanAction}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%);padding:24px 28px;">
        <h2 style="margin:0;color:white;font-size:20px;">🔔 Teacher Activity Alert</h2>
        <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Folusho Victory Schools — Real-time Monitor</p>
      </div>

      <!-- Teacher Info -->
      <div style="background:#eff6ff;padding:16px 28px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #dbeafe;">
        <div style="width:44px;height:44px;background:#1d4ed8;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:bold;flex-shrink:0;">
          ${teacherName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style="margin:0;font-weight:700;color:#1e293b;font-size:15px;">${teacherName}</p>
          <p style="margin:2px 0 0;color:#64748b;font-size:12px;">${teacherEmail}</p>
        </div>
        <div style="margin-left:auto;">
          <span style="background-color:${actionColor};color:white;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;display:inline-block;">
            ${humanAction}
          </span>
        </div>
      </div>

      <!-- Details Table -->
      <div style="padding:20px 28px;background:#ffffff;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Action Details</p>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;font-size:13px;">
          ${detailRows || '<tr><td style="padding:12px;color:#94a3b8;">No additional details available.</td></tr>'}
        </table>
      </div>

      <!-- Timestamp -->
      <div style="padding:0 28px 20px;background:#ffffff;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">
          🕐 <strong>Time of action:</strong> ${timeStr}
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#1e293b;padding:14px 28px;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">
          Automated alert from <strong style="color:white;">Folusho Victory Schools</strong> Result Management System.<br/>
          Log in to the admin portal to view the full activity log.
        </p>
      </div>
    </div>
  `;

  const text = `Teacher Activity Alert\n\nTeacher: ${teacherName} (${teacherEmail})\nAction: ${humanAction}\nTime: ${timeStr}\n\nLog in to the admin portal to see full details.`;

  await sendEmail({ to: ADMIN_EMAIL, subject, text, html });
};
