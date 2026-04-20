import { Router, Response, Request } from 'express';
import {
  sendStudentRegistrationEmail,
  sendResultPublishedEmail,
  sendAttendanceWarningEmail,
  sendLowGradesEmail,
  sendFeeReminderEmail,
} from '../utils/notificationHelpers';

const router = Router();

/**
 * Example: Send student registration email
 * POST /api/notifications/student-registration
 */
router.post('/student-registration', async (req: Request, res: Response) => {
  try {
    const { parentEmail, studentName, registrationNumber, parentName } = req.body;

    if (!parentEmail || !studentName || !registrationNumber || !parentName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: parentEmail, studentName, registrationNumber, parentName',
      });
    }

    const success = await sendStudentRegistrationEmail(
      parentEmail,
      studentName,
      registrationNumber,
      parentName
    );

    return res.json({
      success,
      message: success ? 'Registration email sent successfully' : 'Failed to send email',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Example: Send result published email
 * POST /api/notifications/result-published
 */
router.post('/result-published', async (req: Request, res: Response) => {
  try {
    const { parentEmail, studentName, term, academicYear } = req.body;

    if (!parentEmail || !studentName || !term || !academicYear) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: parentEmail, studentName, term, academicYear',
      });
    }

    const success = await sendResultPublishedEmail(
      parentEmail,
      studentName,
      term,
      academicYear
    );

    return res.json({
      success,
      message: success ? 'Result notification sent successfully' : 'Failed to send email',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Example: Send attendance warning email
 * POST /api/notifications/attendance-warning
 */
router.post('/attendance-warning', async (req: Request, res: Response) => {
  try {
    const { parentEmail, studentName, attendancePercentage, threshold = 75 } = req.body;

    if (!parentEmail || !studentName || attendancePercentage === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: parentEmail, studentName, attendancePercentage',
      });
    }

    const success = await sendAttendanceWarningEmail(
      parentEmail,
      studentName,
      attendancePercentage,
      threshold
    );

    return res.json({
      success,
      message: success ? 'Attendance warning sent successfully' : 'Failed to send email',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Example: Send low grades alert email
 * POST /api/notifications/low-grades
 */
router.post('/low-grades', async (req: Request, res: Response) => {
  try {
    const { parentEmail, studentName, subjects, recommendations } = req.body;

    if (!parentEmail || !studentName || !subjects || !Array.isArray(subjects)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: parentEmail, studentName, subjects (array)',
      });
    }

    const success = await sendLowGradesEmail(
      parentEmail,
      studentName,
      subjects,
      recommendations
    );

    return res.json({
      success,
      message: success ? 'Low grades alert sent successfully' : 'Failed to send email',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Example: Send fee reminder email
 * POST /api/notifications/fee-reminder
 */
router.post('/fee-reminder', async (req: Request, res: Response) => {
  try {
    const { parentEmail, studentName, amount, dueDate } = req.body;

    if (!parentEmail || !studentName || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: parentEmail, studentName, amount, dueDate',
      });
    }

    const success = await sendFeeReminderEmail(
      parentEmail,
      studentName,
      amount,
      dueDate
    );

    return res.json({
      success,
      message: success ? 'Fee reminder sent successfully' : 'Failed to send email',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
