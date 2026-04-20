/**
 * Email Templates for Folusho Reporting System
 */

export const emailTemplates = {
  studentRegistration: (studentName: string, registrationNumber: string, parentName: string): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Folusho Victory Schools</h1>
            </div>
            <div class="content">
              <p>Dear ${parentName},</p>
              <p>We are delighted to inform you that <strong>${studentName}</strong> has been successfully registered.</p>
              <p><strong>Registration Number:</strong> <span style="color: #667eea; font-weight: bold;">${registrationNumber}</span></p>
              <p>Best regards,<br><strong>Folusho Victory Schools</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Folusho Victory Schools. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  resultPublished: (studentName: string, term: string, academicYear: string): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .alert { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Results Published</h1>
            </div>
            <div class="content">
              <p>Dear Parent/Guardian,</p>
              <p>Results for <strong>${studentName}</strong> have been published.</p>
              <div class="alert">
                <p>Term: ${term}<br>Academic Year: ${academicYear}</p>
              </div>
              <p>Log in to your portal to view complete details.</p>
              <p>Best regards,<br><strong>Folusho Victory Schools</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Folusho Victory Schools. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  attendanceWarning: (studentName: string, attendancePercentage: number, threshold: number = 75): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️  Attendance Alert</h1>
            </div>
            <div class="content">
              <p>Dear Parent/Guardian,</p>
              <p>Attendance for <strong>${studentName}</strong> is below the required threshold.</p>
              <div class="warning">
                <p>Current Attendance: <strong>${attendancePercentage}%</strong><br>Minimum Required: <strong>${threshold}%</strong></p>
              </div>
              <p>Please ensure regular attendance.</p>
              <p>Best regards,<br><strong>Folusho Victory Schools</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Folusho Victory Schools. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  lowGradesAlert: (studentName: string, subjects: string[]): string => {
    const subjectsList = subjects.map(s => `<li>${s}</li>`).join('');
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Academic Performance Notice</h1>
            </div>
            <div class="content">
              <p>Dear Parent/Guardian,</p>
              <p><strong>${studentName}</strong> has received low grades in:</p>
              <div class="alert">
                <ul>${subjectsList}</ul>
              </div>
              <p>Please contact school to discuss improvement strategies.</p>
              <p>Best regards,<br><strong>Folusho Victory Schools</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Folusho Victory Schools. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  feeReminder: (studentName: string, amount: number, dueDate: string): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .payment-box { background: white; border: 2px solid #667eea; padding: 20px; border-radius: 5px; margin: 15px 0; text-align: center; }
            .amount { font-size: 24px; font-weight: bold; color: #667eea; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 School Fee Reminder</h1>
            </div>
            <div class="content">
              <p>Dear Parent/Guardian,</p>
              <p>School fees for <strong>${studentName}</strong> are due.</p>
              <div class="payment-box">
                <p>Amount Due: <span class="amount">₦${amount.toLocaleString()}</span></p>
                <p>Due Date: <strong>${dueDate}</strong></p>
              </div>
              <p>Please make payment at your earliest convenience.</p>
              <p>Best regards,<br><strong>Folusho Victory Schools</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Folusho Victory Schools. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },
};

export default emailTemplates;
