import express from 'express';
import { ObjectId } from 'mongodb';
import { ATTENDANCE_STATUS } from '../config/constants.js';
import { getDatabase } from '../config/database.js';
import { authenticateToken, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateToken);
router.use(tenantIsolation);

/**
 * Ensure numeric durations are never negative in responses.
 */
function sanitizeAttendanceRecord(record) {
  if (!record) return record;
  const sanitized = { ...record };
  if (typeof sanitized.workDuration === 'number' && sanitized.workDuration < 0) {
    sanitized.workDuration = 0;
  }
  if (typeof sanitized.overtimeDuration === 'number' && sanitized.overtimeDuration < 0) {
    sanitized.overtimeDuration = 0;
  }
  if (typeof sanitized.breakDuration === 'number' && sanitized.breakDuration < 0) {
    sanitized.breakDuration = 0;
  }
  return sanitized;
}

/**
 * @swagger
 * /attendance/clock-in:
 *   post:
 *     summary: Chấm công vào ca
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *               location:
 *                 type: string
 *               qrCode:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [MOBILE_APP, ADMIN_DASHBOARD, QR_SCAN]
 *     responses:
 *       200:
 *         description: Chấm công thành công
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/clock-in', async (req, res, next) => {
  try {
    const { employeeId, location, qrCode, method = 'MOBILE_APP' } = req.body;
    const { tenantId, userId } = req.user;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const db = getDatabase();
    const employeeObjectId = new ObjectId(employeeId);
    const tenantObjectId = new ObjectId(tenantId);

    // Kiểm tra employee có tồn tại và thuộc tenant không
    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantObjectId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Kiểm tra QR code nếu có
    if (qrCode && employee.qrCode.code !== qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code'
      });
    }

    // Lấy ngày hiện tại (chỉ lấy phần date, không có time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Lấy bản ghi chấm công mới nhất trong ngày hôm nay
    const existingAttendance = await db.collection('attendance').findOne(
      {
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        date: today
      },
      {
        sort: { createdAt: -1 }
      }
    );

    // Nếu bản ghi mới nhất đã clock-in nhưng chưa clock-out thì không cho chấm lần nữa
    if (existingAttendance && existingAttendance.clockIn && !existingAttendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in and not yet clocked out'
      });
    }

    // Lấy schedule hoặc tenant settings để tính expected time
    const schedule = await db.collection('schedules').findOne({
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      'recurrence.isActive': true
    });

    const tenant = await db.collection('tenants').findOne({
      _id: tenantObjectId
    });

    const expectedStartTime = schedule 
      ? new Date(`${today.toISOString().split('T')[0]}T${schedule.startTime}:00`)
      : new Date(`${today.toISOString().split('T')[0]}T${tenant.attendanceSettings.workStartTime}:00`);

    const clockInTime = new Date();
    const lateThreshold = tenant.attendanceSettings.lateThreshold || 15;
    const isLate = clockInTime > new Date(expectedStartTime.getTime() + lateThreshold * 60000);
    const lateMinutes = isLate 
      ? Math.floor((clockInTime - expectedStartTime) / 60000)
      : 0;

    // Tạo attendance record mới cho mỗi lần clock-in
    const attendanceData = {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      userId: new ObjectId(userId),
      date: today,
      clockIn: {
        time: clockInTime,
        location: location || null,
        method,
        qrCode: qrCode || null,
        isLate,
        lateMinutes: isLate ? lateMinutes : 0
      },
      clockOut: null,
      workDuration: 0,
      breakDuration: tenant.attendanceSettings.breakDuration || 60,
      overtimeDuration: 0,
      status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
      expectedStartTime,
      expectedEndTime: schedule
        ? new Date(`${today.toISOString().split('T')[0]}T${schedule.endTime}:00`)
        : new Date(`${today.toISOString().split('T')[0]}T${tenant.attendanceSettings.workEndTime}:00`),
      notes: null,
      createdAt: clockInTime,
      updatedAt: clockInTime
    };
    // Luôn insert bản ghi mới (hỗ trợ nhiều ca trong một ngày)
    await db.collection('attendance').insertOne(attendanceData);

    res.json({
      success: true,
      message: isLate ? 'Clocked in (late)' : 'Clocked in successfully',
      data: {
        clockInTime: clockInTime,
        isLate,
        lateMinutes: isLate ? lateMinutes : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/attendance/clock-out
 * Chấm công ra ca
 */
router.post('/clock-out', async (req, res, next) => {
  try {
    const { employeeId, location } = req.body;
    const { tenantId, userId } = req.user;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const db = getDatabase();
    const employeeObjectId = new ObjectId(employeeId);
    const tenantObjectId = new ObjectId(tenantId);

    // Lấy ngày hiện tại
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tìm attendance record hôm nay
    const attendance = await db.collection('attendance').findOne(
      {
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        date: today
      },
      {
        sort: { createdAt: -1 }
      }
    );

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Please clock in first'
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out today'
      });
    }

    const clockOutTime = new Date();
    const clockInTime = attendance.clockIn.time;

    // Tính work duration (minutes)
    const workDurationMinutes = Math.floor((clockOutTime - clockInTime) / 60000);
    const breakDuration = attendance.breakDuration || 60;
    // Nếu clock-out sớm (chưa đủ thời gian nghỉ) thì không để tổng giờ âm
    const netWorkMinutes = Math.max(0, workDurationMinutes - breakDuration);

    // Lấy tenant settings để tính overtime
    const tenant = await db.collection('tenants').findOne({
      _id: tenantObjectId
    });

    const overtimeThreshold = (tenant.attendanceSettings.overtimeThreshold || 8) * 60; // Convert to minutes
    const overtimeDuration = netWorkMinutes > overtimeThreshold 
      ? netWorkMinutes - overtimeThreshold 
      : 0;

    // Update attendance record
    await db.collection('attendance').updateOne(
      { _id: attendance._id },
      {
        $set: {
          clockOut: {
            time: clockOutTime,
            location: location || null,
            method: 'MOBILE_APP',
            qrCode: attendance.clockIn.qrCode
          },
          workDuration: netWorkMinutes,
          overtimeDuration,
          updatedAt: clockOutTime
        }
      }
    );

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: {
        clockOutTime,
        workDuration: netWorkMinutes,
        overtimeDuration
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /attendance/current:
 *   get:
 *     summary: Lấy thông tin chấm công hôm nay
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin chấm công hôm nay
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/current', async (req, res, next) => {
  try {
    const { employeeId } = req.query;
    const { tenantId } = req.user;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const db = getDatabase();
    const employeeObjectId = new ObjectId(employeeId);
    const tenantObjectId = new ObjectId(tenantId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await db.collection('attendance').findOne(
      {
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        date: today
      },
      {
        sort: { createdAt: -1 }
      }
    );
    const safeAttendance = sanitizeAttendanceRecord(attendance || null);

    res.json({
      success: true,
      data: {
        attendance: safeAttendance,
        isClockedIn: safeAttendance && safeAttendance.clockIn ? true : false,
        isClockedOut: safeAttendance && safeAttendance.clockOut ? true : false
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /attendance/history:
 *   get:
 *     summary: Lấy lịch sử chấm công
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lịch sử chấm công
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/history', async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate, limit = 30 } = req.query;
    const { tenantId } = req.user;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const db = getDatabase();
    const employeeObjectId = new ObjectId(employeeId);
    const tenantObjectId = new ObjectId(tenantId);

    const query = {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const attendanceRecords = await db.collection('attendance')
      .find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .toArray();

    const sanitizedRecords = attendanceRecords.map(sanitizeAttendanceRecord);

    res.json({
      success: true,
      data: {
        records: sanitizedRecords,
        total: sanitizedRecords.length
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
