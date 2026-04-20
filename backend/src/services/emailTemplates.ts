/**
 * Email Templates for Folusho Reporting System
 */

export const emailTemplates = {
  /**
   * Student Registration Email
   */
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
              <p>We are delighted to inform you that <strong>${studentName}</strong> has been successfully registered at Folusho Victory Schools.</p>
              <p><strong>Registration Number:</strong> <span style="color: #667eea; font-weight: bold;">${registrationNumber}</span></p>
              <p>Please keep this registration number safe as it will be used for all school transactions and inquiries.</p>
              <p>If you have any questions or need further assistance, please do not hesitate to contact our office.</p>
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

  /**
   * Result Published Email
   */
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
              <p>We are pleased to inform you that the results for <strong>${studentName}</strong> have been published.</p>
              <div class="alert">
                <p><strong>📋 Result Details:</strong></p>
                <p>Term: ${term}<br>Academic Year: ${academicYear}</p>
              </div>
              <p>You can now view the detailed results through your student portal. Please log in with your credentials to access the complete report card.</p>
              <p>If you have any concerns regarding the results, please contact the school office.</p>
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

  /**
   * Attendance Warning Email
   */
  attendanceWarning: (studentName: string, attendancePercentage: number, threshold: number = 75): string => {
    const isLow = attendancePercentage < threshold;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
            .stats { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .stat-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .stat-item:last-child { border-bottom: none; }
            .percentage { font-size: 24px; font-weight: bold; color: ${isLow ? '#f5576c' : '#28a745'}; }
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
              <p>We are writing to inform you about the attendance record of <strong>${studentName}</strong>.</p>
              <div class="warning">
                <p><strong>⚠️  Attendance Below Acceptable Level</strong></p>
                <p>Your child's attendance is currently lower than our school threshold. Regular attendance is crucial for academic success.</p>
              </div>
              <div class="stats">
                <div class="stat-item">
                  <span>Current Attendance:</span>
                  <span class="percentage">${attendancePercentage}%</span>
                </div>
                <div class="stat-item">
                  <span>Minimum Required:</span>
                  <span>${threshold}%</span>
                </div>
              </div>
              <p>Please ensure that your child maintains regular attendance. If there are any extenuating circumstances, please contact the school office immediately.</p>
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

  /**
   * Low Grades Alert Email
   */
  lowGradesAlert: (studentName: string, subjects: string[], recommendations: string[]): string => {
    const subjectsList = subjects.map(s => `<li>${s}</li>`).join('');
    const recommendationsList = recommendations.map(r => `<li>${r}</li>`).join('');

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
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; color: #667eea; margin: 10px 0; }
            ul { padding-left: 20px; }
            li { margin: 5px 0; }
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
              <p>We hope this email finds you well. We are writing to inform you about the academic performance of <strong>${studentName}</strong>.</p>
              <div class="alert">
                <p><strong>Academic Concerns Identified</strong></p>
                <p>Your child has received low grades in the following subject(s):</p>
                <ul>${subjectsList}</ul>
              </div>
              <div class="section">
                <p class="section-title">📝 Recommendations:</p>
                <ul>${recommendationsList}</ul>
              </div>
              <p>We believe that with your support and the student's dedication, there can be significant improvement. Please contact the school office to discuss how we can work together to support your child's academic journey.</p>
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

  /**
   * Fee Reminder Email
   */
  feeReminder: (studentName: string, amount: number, dueDate: string): string => {
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);

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
            .amount { font-size: 28px; font-weight: bold; color: #667eea; margin: 10px 0; }
            .due-date { color: #f5576c; font-weight: bold; margin: 10px 0; }
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
              <p>This is a friendly reminder that the school fees for <strong>${studentName}</strong> are due.</p>
              <div class="payment-box">
                <p><strong>Amount Due:</strong></p>
                <p class="amount">${formattedAmount}</p>
                <p><strong>Due Date:</strong></p>
                <p class="due-date">${new Date(dueDate).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</p>
              </div>
              <p>Please make payment at your earliest convenience. If you have already made the payment, please disregard this reminder. If you have any questions or need to arrange a payment plan, please contact the school office.</p>
              <p>Thank you for your cooperation.</p>
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

  /**
   * Custom Template
   */
  custom: (title: string, content: string): string => {
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
              <h1>${title}</h1>
            </div>
            <div class="content">
              ${content}
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
