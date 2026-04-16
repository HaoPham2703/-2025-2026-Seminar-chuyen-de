import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken, tenantIsolation } from '../middleware/auth.js';
import { generateQrToken, getQrWindowSeconds, validateQrToken } from '../utils/qr.js';

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

    const user = await db.collection('users').findOne({
      _id: userIdObjectId,
      tenantId: tenantIdObjectId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const employee = await db.collection('employees').findOne({
      userId: userIdObjectId,
      tenantId: tenantIdObjectId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const attendanceStats = await db
      .collection('attendance')
      .aggregate([
        {
          $match: {
            tenantId: tenantIdObjectId,
            employeeId: employee._id,
            date: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalWorkingDays: { $sum: 1 },
            totalHours: { $sum: { $divide: ['$workDuration', 60] } },
            lateCount: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
            absentCount: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
            overtimeHours: { $sum: { $divide: ['$overtimeDuration', 60] } },
          },
        },
      ])
      .toArray();

    const stats = attendanceStats[0] || {
      totalWorkingDays: 0,
      totalHours: 0,
      lateCount: 0,
      absentCount: 0,
      overtimeHours: 0,
    };

    const onTimeRate =
      stats.totalWorkingDays > 0
        ? Math.round(
            ((stats.totalWorkingDays - stats.lateCount - stats.absentCount) /
              stats.totalWorkingDays) *
              100
          )
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
          qrToken: (() => {
            const qrSecret = process.env.QR_SECRET || employee.qrCode?.code;
            if (!qrSecret) return null;
            return generateQrToken({
              employeeId: employee._id.toString(),
              secret: qrSecret,
            });
          })(),
          qrTokenExpiresIn: getQrWindowSeconds(),
          statistics: {
            ...stats,
            onTimeRate,
          },
        },
        user: {
          email: user.email,
          profile: user.profile,
        },
      },
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

    const employee = await db.collection('employees').findOne({
      userId: userIdObjectId,
      tenantId: tenantIdObjectId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

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

    await db
      .collection('employees')
      .updateOne({ _id: employee._id, tenantId: tenantIdObjectId }, { $set: updateData });

    const updatedEmployee = await db.collection('employees').findOne({
      _id: employee._id,
      tenantId: tenantIdObjectId,
    });

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const attendanceStats = await db
      .collection('attendance')
      .aggregate([
        {
          $match: {
            tenantId: tenantIdObjectId,
            employeeId: updatedEmployee._id,
            date: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalWorkingDays: { $sum: 1 },
            totalHours: { $sum: { $divide: ['$workDuration', 60] } },
            lateCount: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
            absentCount: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
            overtimeHours: { $sum: { $divide: ['$overtimeDuration', 60] } },
          },
        },
      ])
      .toArray();

    const stats = attendanceStats[0] || {
      totalWorkingDays: 0,
      totalHours: 0,
      lateCount: 0,
      absentCount: 0,
      overtimeHours: 0,
    };

    const onTimeRate =
      stats.totalWorkingDays > 0
        ? Math.round(
            ((stats.totalWorkingDays - stats.lateCount - stats.absentCount) /
              stats.totalWorkingDays) *
              100
          )
        : 0;

    const user = await db.collection('users').findOne({
      _id: userIdObjectId,
      tenantId: tenantIdObjectId,
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
            onTimeRate,
          },
        },
        user: {
          email: user.email,
          profile: user.profile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/schedules/my
 * Lấy lịch làm việc tuần của employee hiện tại
 * Query: weekStart (YYYY-MM-DD) — ngày thứ Hai
 */
router.get('/schedules/my', async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const { weekStart } = req.query;
    const db = getDatabase();
    const userIdObjectId = new ObjectId(userId);
    const tenantObjectId = new ObjectId(tenantId);

    // Lấy employee ID của user hiện tại
    const employee = await db.collection('employees').findOne({
      userId: userIdObjectId,
      tenantId: tenantObjectId,
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const employeeObjectId = employee._id;

    if (!weekStart) {
      return res.status(400).json({ success: false, message: 'weekStart is required (YYYY-MM-DD)' });
    }

    // Tính Chủ Nhật cuối tuần từ weekStart (thứ Hai)
    const monday = new Date(`${weekStart}T00:00:00.000+07:00`);
    const sundayDate = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
    const sundayStr = sundayDate.toISOString().split('T')[0];

    // Lấy lịch override từ employeeDailySchedules
    const schedules = await db.collection('employeeDailySchedules').find({
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      date: { $gte: weekStart, $lte: sundayStr },
    }).toArray();

    // Lấy lịch mặc định từ schedules collection
    const defaultSchedule = await db.collection('schedules').findOne({
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
    });

    // Build map { [date]: schedule }
    const scheduleMap = {};
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().split('T')[0]);
    }

    for (const date of dates) {
      // Ưu tiên override
      const override = schedules.find(s => s.date === date);
      if (override) {
        scheduleMap[date] = {
          date,
          shiftType: override.shiftType,
          startTime: override.startTime || null,
          endTime: override.endTime || null,
          isOverridden: true,
        };
      } else if (defaultSchedule) {
        // Lịch mặc định
        const dayOfWeek = new Date(`${date}T00:00:00.000+07:00`).getDay(); // 0=Sun, 1=Mon...
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (!isWeekend) {
          scheduleMap[date] = {
            date,
            shiftType: 'FULL_DAY',
            startTime: defaultSchedule.startTime || '08:00',
            endTime: defaultSchedule.endTime || '17:00',
            isOverridden: false,
          };
        } else {
          scheduleMap[date] = {
            date,
            shiftType: 'OFF',
            startTime: null,
            endTime: null,
            isOverridden: false,
          };
        }
      }
    }

    res.json({
      success: true,
      data: {
        employeeId: employeeObjectId.toString(),
        weekStart,
        weekEnd: sundayStr,
        schedule: scheduleMap,
      },
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
        message: 'type, startDate, endDate và reason là bắt buộc',
      });
    }

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);
    const userObjectId = new ObjectId(userId);

    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantObjectId,
      userId: userObjectId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not owned by current user',
      });
    }

    const now = new Date();
    const doc = {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      userId: userObjectId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null,
    };

    const result = await db.collection('leaveRequests').insertOne(doc);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
      },
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
        userId: userObjectId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: {
        requests,
      },
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
        message: 'date và reason là bắt buộc',
      });
    }

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);
    const userObjectId = new ObjectId(userId);

    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantObjectId,
      userId: userObjectId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not owned by current user',
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await db.collection('attendance').findOne(
      {
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        date: targetDate,
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
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null,
    };

    const result = await db.collection('attendanceAdjustments').insertOne(doc);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
      },
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
        userId: userObjectId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: {
        adjustments,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:employeeId/payslips
 * Danh sách phiếu lương đã được duyệt của employee
 */
router.get('/:employeeId/payslips', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId, userId } = req.user;
    const { year, month } = req.query;
    const db = getDatabase();

    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);
    const userObjectId = new ObjectId(userId);

    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantObjectId,
      userId: userObjectId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not owned by current user',
      });
    }

    const query = {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      status: 'APPROVED',
    };

    if (year) {
      query.year = Number(year);
    }

    if (month) {
      query.month = Number(month);
    }

    const payslips = await db
      .collection('payslips')
      .find(query)
      .sort({ year: -1, month: -1 })
      .toArray();

    res.json({
      success: true,
      data: {
        payslips: payslips.map((payslip) => ({
          id: payslip._id.toString(),
          employeeId: payslip.employeeId?.toString() || null,
          year: payslip.year,
          month: payslip.month,
          currency: payslip.currency || 'VND',
          status: payslip.status,
          totals: payslip.totals || null,
          earnings: payslip.earnings || [],
          deductions: payslip.deductions || [],
          issuedAt: payslip.issuedAt || null,
          approvedAt: payslip.approvedAt || null,
          notes: payslip.notes || null,
        })),
      },
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
      tenantId: tenantObjectId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const qrSecret = process.env.QR_SECRET || employee.qrCode?.code;
    const qrToken = qrSecret
      ? generateQrToken({
          employeeId: employee._id.toString(),
          secret: qrSecret,
        })
      : null;

    res.json({
      success: true,
      data: {
        qrCode: employee.qrCode || null,
        qrToken,
        expiresIn: getQrWindowSeconds(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/employees/verify-qr
 * Quét QR token để lấy thông tin nhân viên (admin/manager quét QR của nhân viên)
 * Body: { qrToken: string }
 */
router.post('/verify-qr', async (req, res, next) => {
  try {
    const { qrToken } = req.body;
    const { tenantId } = req.user;

    if (!qrToken || typeof qrToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'qrToken is required',
      });
    }

    const parts = qrToken.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR token format',
      });
    }

    const [tokenEmployeeId] = parts;

    // Validate tokenEmployeeId là ObjectId hợp lệ
    if (!/^[0-9a-fA-F]{24}$/.test(tokenEmployeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR token',
      });
    }

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(tokenEmployeeId);

    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantObjectId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Validate QR signature
    const qrSecret = process.env.QR_SECRET || employee.qrCode?.code;
    if (!qrSecret) {
      return res.status(400).json({
        success: false,
        message: 'QR secret not configured for this employee',
      });
    }

    const isValid = validateQrToken({
      token: qrToken,
      employeeId: employee._id.toString(),
      secret: qrSecret,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired QR code',
      });
    }

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id.toString(),
          employeeId: employee.employeeId,
          personalInfo: employee.personalInfo,
          employment: employee.employment,
          qrCode: employee.qrCode,
          statistics: employee.statistics || {},
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:id
 * Lấy thông tin chi tiết của employee
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;
    const db = getDatabase();

    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(id);

    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantObjectId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id.toString(),
          employeeId: employee.employeeId,
          personalInfo: employee.personalInfo,
          employment: employee.employment,
          qrCode: employee.qrCode,
          statistics: employee.statistics || {},
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
