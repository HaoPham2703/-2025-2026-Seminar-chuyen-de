import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken, tenantIsolation } from '../middleware/auth.js';
import { ATTENDANCE_STATUS } from '../config/constants.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateToken);
router.use(tenantIsolation);

/**
 * POST /api/attendance/clock-in
 * Chấm công vào ca
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

    // Kiểm tra đã chấm công chưa
    const existingAttendance = await db.collection('attendance').findOne({
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      date: today
    });

    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today'
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

    // Tạo hoặc cập nhật attendance record
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

    if (existingAttendance) {
      // Update existing record
      await db.collection('attendance').updateOne(
        { _id: existingAttendance._id },
        { $set: attendanceData }
      );
    } else {
      // Insert new record
      await db.collection('attendance').insertOne(attendanceData);
    }

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
    const attendance = await db.collection('attendance').findOne({
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      date: today
    });

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
    const netWorkMinutes = workDurationMinutes - breakDuration;

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
 * GET /api/attendance/current
 * Lấy thông tin chấm công hôm nay
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

    const attendance = await db.collection('attendance').findOne({
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      date: today
    });

    res.json({
      success: true,
      data: {
        attendance: attendance || null,
        isClockedIn: attendance && attendance.clockIn ? true : false,
        isClockedOut: attendance && attendance.clockOut ? true : false
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/attendance/history
 * Lấy lịch sử chấm công
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

    res.json({
      success: true,
      data: {
        records: attendanceRecords,
        total: attendanceRecords.length
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
