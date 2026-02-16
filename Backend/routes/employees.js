import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateToken);
router.use(tenantIsolation);

/**
 * @swagger
 * /employees/profile:
 *   get:
 *     summary: Lấy thông tin profile của employee hiện tại
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 */
router.get('/profile', async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const db = getDatabase();
    const userIdObjectId = new ObjectId(userId);
    const tenantIdObjectId = new ObjectId(tenantId);

    // Lấy user info
    const user = await db.collection('users').findOne({
      _id: userIdObjectId,
      tenantId: tenantIdObjectId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Lấy employee info
    const employee = await db.collection('employees').findOne({
      userId: userIdObjectId,
      tenantId: tenantIdObjectId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Tính toán thống kê từ attendance
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const attendanceStats = await db.collection('attendance').aggregate([
      {
        $match: {
          tenantId: tenantIdObjectId,
          employeeId: employee._id,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalWorkingDays: { $sum: 1 },
          totalHours: { $sum: { $divide: ['$workDuration', 60] } },
          lateCount: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          overtimeHours: { $sum: { $divide: ['$overtimeDuration', 60] } }
        }
      }
    ]).toArray();

    const stats = attendanceStats[0] || {
      totalWorkingDays: 0,
      totalHours: 0,
      lateCount: 0,
      absentCount: 0,
      overtimeHours: 0
    };

    const onTimeRate = stats.totalWorkingDays > 0
      ? Math.round(((stats.totalWorkingDays - stats.lateCount - stats.absentCount) / stats.totalWorkingDays) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id.toString(),
          employeeId: employee.employeeId,
          personalInfo: employee.personalInfo,
          employment: employee.employment,
          qrCode: employee.qrCode,
          statistics: {
            ...stats,
            onTimeRate
          }
        },
        user: {
          email: user.email,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/employees/profile
 * Cập nhật thông tin profile của employee hiện tại
 */
router.put('/profile', async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const db = getDatabase();
    const userIdObjectId = new ObjectId(userId);
    const tenantIdObjectId = new ObjectId(tenantId);

    // Lấy employee hiện tại
    const employee = await db.collection('employees').findOne({
      userId: userIdObjectId,
      tenantId: tenantIdObjectId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Cập nhật thông tin
    const updateData = {};
    
    if (req.body.firstName !== undefined) {
      updateData['personalInfo.firstName'] = req.body.firstName;
    }
    if (req.body.lastName !== undefined) {
      updateData['personalInfo.lastName'] = req.body.lastName;
    }
    if (req.body.phone !== undefined) {
      updateData['personalInfo.phone'] = req.body.phone;
    }
    if (req.body.dateOfBirth !== undefined) {
      updateData['personalInfo.dateOfBirth'] = req.body.dateOfBirth;
    }
    if (req.body.gender !== undefined) {
      updateData['personalInfo.gender'] = req.body.gender;
    }
    if (req.body.address !== undefined) {
      if (req.body.address.street !== undefined) {
        updateData['personalInfo.address.street'] = req.body.address.street;
      }
      if (req.body.address.city !== undefined) {
        updateData['personalInfo.address.city'] = req.body.address.city;
      }
      if (req.body.address.province !== undefined) {
        updateData['personalInfo.address.province'] = req.body.address.province;
      }
    }
    if (req.body.emergencyContact !== undefined) {
      updateData['personalInfo.emergencyContact'] = req.body.emergencyContact;
    }

    // Cập nhật trong database
    await db.collection('employees').updateOne(
      { _id: employee._id, tenantId: tenantIdObjectId },
      { $set: updateData }
    );

    // Lấy lại thông tin đã cập nhật
    const updatedEmployee = await db.collection('employees').findOne({
      _id: employee._id,
      tenantId: tenantIdObjectId
    });

    // Tính toán lại statistics
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const attendanceStats = await db.collection('attendance').aggregate([
      {
        $match: {
          tenantId: tenantIdObjectId,
          employeeId: updatedEmployee._id,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalWorkingDays: { $sum: 1 },
          totalHours: { $sum: { $divide: ['$workDuration', 60] } },
          lateCount: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          overtimeHours: { $sum: { $divide: ['$overtimeDuration', 60] } }
        }
      }
    ]).toArray();

    const stats = attendanceStats[0] || {
      totalWorkingDays: 0,
      totalHours: 0,
      lateCount: 0,
      absentCount: 0,
      overtimeHours: 0
    };

    const onTimeRate = stats.totalWorkingDays > 0
      ? Math.round(((stats.totalWorkingDays - stats.lateCount - stats.absentCount) / stats.totalWorkingDays) * 100)
      : 0;

    // Lấy user info
    const user = await db.collection('users').findOne({
      _id: userIdObjectId,
      tenantId: tenantIdObjectId
    });

    res.json({
      success: true,
      data: {
        employee: {
          id: updatedEmployee._id.toString(),
          employeeId: updatedEmployee.employeeId,
          personalInfo: updatedEmployee.personalInfo,
          employment: updatedEmployee.employment,
          qrCode: updatedEmployee.qrCode,
          statistics: {
            ...stats,
            onTimeRate
          }
        },
        user: {
          email: user.email,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/employees/:employeeId/leave-requests
 * Tạo yêu cầu nghỉ phép cho employee (self-service)
 */
router.post('/:employeeId/leave-requests', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId, userId } = req.user;
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'type, startDate, endDate và reason là bắt buộc'
      });
    }

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);
    const userObjectId = new ObjectId(userId);

    // Đảm bảo employee thuộc tenant hiện tại và gắn với user hiện tại
    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantObjectId,
      userId: userObjectId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not owned by current user'
      });
    }

    const now = new Date();
    const doc = {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      userId: userObjectId,
      type, // ví dụ: ANNUAL, SICK, UNPAID, OTHER
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'PENDING', // PENDING | APPROVED | REJECTED
      createdAt: now,
      updatedAt: now,
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null
    };

    const result = await db.collection('leaveRequests').insertOne(doc);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:employeeId/leave-requests
 * Danh sách yêu cầu nghỉ phép của employee
 */
router.get('/:employeeId/leave-requests', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId, userId } = req.user;
    const db = getDatabase();

    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);
    const userObjectId = new ObjectId(userId);

    const requests = await db
      .collection('leaveRequests')
      .find({
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        userId: userObjectId
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/employees/:employeeId/attendance-adjustments
 * Tạo yêu cầu điều chỉnh chấm công cho 1 ngày cụ thể
 */
router.post('/:employeeId/attendance-adjustments', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId, userId } = req.user;
    const { date, proposedClockIn, proposedClockOut, reason } = req.body;

    if (!date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'date và reason là bắt buộc'
      });
    }

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);
    const userObjectId = new ObjectId(userId);

    // Đảm bảo employee thuộc tenant hiện tại và gắn với user hiện tại
    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantObjectId,
      userId: userObjectId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not owned by current user'
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Tìm attendance record của ngày đó (nếu có) để tham chiếu
    const attendance = await db.collection('attendance').findOne(
      {
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        date: targetDate
      },
      { sort: { createdAt: -1 } }
    );

    const now = new Date();
    const doc = {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      userId: userObjectId,
      attendanceId: attendance ? attendance._id : null,
      date: targetDate,
      proposedClockIn: proposedClockIn ? new Date(proposedClockIn) : null,
      proposedClockOut: proposedClockOut ? new Date(proposedClockOut) : null,
      reason,
      status: 'PENDING', // PENDING | APPROVED | REJECTED
      createdAt: now,
      updatedAt: now,
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null
    };

    const result = await db.collection('attendanceAdjustments').insertOne(doc);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:employeeId/attendance-adjustments
 * Danh sách yêu cầu điều chỉnh chấm công của employee
 */
router.get('/:employeeId/attendance-adjustments', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId, userId } = req.user;
    const db = getDatabase();

    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);
    const userObjectId = new ObjectId(userId);

    const adjustments = await db
      .collection('attendanceAdjustments')
      .find({
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        userId: userObjectId
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: {
        adjustments
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:employeeId/qr-code
 * Lấy thông tin QR code của một employee
 */
router.get('/:employeeId/qr-code', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId } = req.user;
    const db = getDatabase();

    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);

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

    res.json({
      success: true,
      data: {
        qrCode: employee.qrCode || null
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
