import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken, tenantIsolation, requireRole } from '../middleware/auth.js';
import { ROLES, REWARD_TYPE, REWARD_STATUS, DISCIPLINE_TYPE, DISCIPLINE_STATUS } from '../config/constants.js';

const router = express.Router();

// ─── Vietnam timezone helpers ───────────────────────────────────────────────────
// Dùng chuỗi 'YYYY-MM-DD' từ frontend để query đúng ngày Vietnam
function toVietnamMidnight(dateStr) {
  // "2026-04-10" → 2026-04-10T00:00:00+07:00 = 2026-04-09T17:00:00Z (UTC)
  return new Date(`${dateStr}T00:00:00.000+07:00`);
}

function toVietnamEndOfDay(dateStr) {
  // "2026-04-10" → 2026-04-10T23:59:59.999+07:00 = 2026-04-10T16:59:59.999Z (UTC)
  return new Date(`${dateStr}T23:59:59.999+07:00`);
}

function getVietnamMonthRange(year, month) {
  // month: 1-12
  const start = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00.000+07:00`);
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const end = new Date(`${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00.000+07:00`);
  end.setMilliseconds(-1);
  return { start, end };
}

// Debug: Log khi module được load
console.log('✅ Admin routes module loaded');

// Debug route để test (không cần auth) - phải đặt TRƯỚC authenticateToken
router.get('/test', (req, res) => {
  console.log('✅ GET /api/admin/test - Route working!');
  res.json({ success: true, message: 'Admin routes are working!', timestamp: new Date().toISOString() });
});

// Middleware để log tất cả requests đến admin routes
router.use((req, res, next) => {
  console.log(`🔐 Admin route accessed: ${req.method} ${req.path}`);
  next();
});

// Tất cả routes đều cần authentication và tenant isolation
router.use(authenticateToken);
router.use(tenantIsolation);

function getVietnamDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * GET /api/admin/dashboard
 * Lấy dữ liệu tổng hợp cho dashboard admin
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    console.log('📊 GET /api/admin/dashboard - Request received');
    const { tenantId } = req.user;
    console.log('Tenant ID:', tenantId);
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Lấy tất cả employees trong tenant
    const employees = await db.collection('employees').find({
      tenantId: tenantObjectId
    }).toArray();

    // Lấy attendance hôm nay
    const todayAttendance = await db.collection('attendance').find({
      tenantId: tenantObjectId,
      date: today
    }).toArray();

    // Lấy leave requests (pending và approved gần đây)
    const leaveRequests = await db.collection('leaveRequests').find({
      tenantId: tenantObjectId
    }).sort({ createdAt: -1 }).limit(10).toArray();

    // Phân loại attendance: absent, present, sick, wfh
    const employeeIds = employees.map(e => e._id);
    const attendanceMap = new Map();
    todayAttendance.forEach(att => {
      attendanceMap.set(att.employeeId.toString(), att);
    });

    const absentEmployees = [];
    const presentEmployees = [];
    const sickEmployees = [];
    const wfhEmployees = [];

    for (const employee of employees) {
      const attendance = attendanceMap.get(employee._id.toString());
      
      if (!attendance || !attendance.clockIn) {
        // Kiểm tra nếu có leave request hôm nay
        const hasLeaveToday = leaveRequests.some(lr => {
          const startDate = new Date(lr.startDate);
          const endDate = new Date(lr.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return lr.employeeId.toString() === employee._id.toString() &&
                 today >= startDate && today <= endDate &&
                 lr.status === 'APPROVED';
        });

        if (hasLeaveToday) {
          const leave = leaveRequests.find(lr => {
            const startDate = new Date(lr.startDate);
            const endDate = new Date(lr.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            return lr.employeeId.toString() === employee._id.toString() &&
                   today >= startDate && today <= endDate &&
                   lr.status === 'APPROVED';
          });
          
          if (leave?.type === 'SICK') {
            sickEmployees.push({
              _id: employee._id.toString(),
              name: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim(),
              department: employee.department || employee.employment?.department || 'N/A',
              status: 'Sick'
            });
          } else {
            absentEmployees.push({
              _id: employee._id.toString(),
              name: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim(),
              department: employee.department || employee.employment?.department || 'N/A',
              status: 'Absent'
            });
          }
        } else {
          absentEmployees.push({
            _id: employee._id.toString(),
            name: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim(),
            department: employee.department || employee.employment?.department || 'N/A',
            status: 'Absent'
          });
        }
      } else {
        const clockInTime = new Date(attendance.clockIn.time);
        const timeStr = `${String(clockInTime.getHours()).padStart(2, '0')}.${String(clockInTime.getMinutes()).padStart(2, '0')}`;
        
        presentEmployees.push({
          _id: employee._id.toString(),
          name: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim(),
          department: employee.department || employee.employment?.department || 'N/A',
          status: 'Present',
          time: timeStr
        });
      }
    }

    // Format leave requests
    const formattedLeaveRequests = await Promise.all(
      leaveRequests.slice(0, 6).map(async (lr) => {
        const employee = await db.collection('employees').findOne({
          _id: lr.employeeId,
          tenantId: tenantObjectId
        });
        
        return {
          _id: lr._id.toString(),
          name: employee ? `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim() : 'Unknown',
          role: employee?.position || employee?.department || 'N/A',
          type: lr.type,
          dateRange: `${new Date(lr.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(lr.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          status: lr.status
        };
      })
    );

    res.json({
      success: true,
      data: {
        attendance: {
          absent: absentEmployees.slice(0, 3),
          present: presentEmployees.slice(0, 3),
          sick: sickEmployees.slice(0, 3),
          wfh: wfhEmployees.slice(0, 3)
        },
        leaveRequests: formattedLeaveRequests,
        statistics: {
          totalEmployees: employees.length,
          presentCount: presentEmployees.length,
          absentCount: absentEmployees.length,
          pendingLeaveRequests: leaveRequests.filter(lr => lr.status === 'PENDING').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/employees
 * Lấy danh sách tất cả employees trong tenant
 */
router.get('/employees', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const employees = await db.collection('employees').find({
      tenantId: tenantObjectId
    }).toArray();

    const formattedEmployees = employees.map(emp => ({
      _id: emp._id.toString(),
      employeeId: emp.employeeId,
      name: `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim(),
      email: emp.personalInfo?.email || '',
      department: emp.department || emp.employment?.department || 'N/A',
      position: emp.position || emp.employment?.position || 'N/A',
      phone: emp.personalInfo?.phone || ''
    }));

    res.json({
      success: true,
      data: {
        employees: formattedEmployees,
        total: formattedEmployees.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/attendance
 * Lấy attendance records theo ngày (YYYY-MM-DD, timezone Asia/Ho_Chi_Minh)
 */
router.get('/attendance', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { date } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const requestedDate = typeof date === 'string' && date.trim().length > 0
      ? date.trim()
      : getVietnamDateString();

    const attendance = await db.collection('attendance').find({
      tenantId: tenantObjectId,
      $expr: {
        $eq: [
          {
            $dateToString: {
              date: '$date',
              format: '%Y-%m-%d',
              timezone: 'Asia/Ho_Chi_Minh',
            },
          },
          requestedDate,
        ],
      },
    }).toArray();

    res.json({
      success: true,
      data: {
        records: attendance,
        total: attendance.length,
        date: requestedDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/attendance/today
 * Lấy tất cả attendance records hôm nay
 */
router.get('/attendance/today', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const todayDate = getVietnamDateString();
    const attendance = await db.collection('attendance').find({
      tenantId: tenantObjectId,
      $expr: {
        $eq: [
          {
            $dateToString: {
              date: '$date',
              format: '%Y-%m-%d',
              timezone: 'Asia/Ho_Chi_Minh',
            },
          },
          todayDate,
        ],
      },
    }).toArray();

    res.json({
      success: true,
      data: {
        records: attendance,
        total: attendance.length,
        date: todayDate,
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/leave-requests
 * Lấy tất cả leave requests trong tenant
 */
router.get('/leave-requests', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { status, limit = 50 } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const query = { tenantId: tenantObjectId };
    if (status) {
      query.status = status;
    }

    const leaveRequests = await db.collection('leaveRequests')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .toArray();

    // Populate employee info
    const formattedRequests = await Promise.all(
      leaveRequests.map(async (lr) => {
        const employee = await db.collection('employees').findOne({
          _id: lr.employeeId,
          tenantId: tenantObjectId
        });

        return {
          _id: lr._id.toString(),
          employeeId: lr.employeeId.toString(),
          employeeName: employee ? `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim() : 'Unknown',
          employeeRole: employee?.position || employee?.department || 'N/A',
          type: lr.type,
          startDate: lr.startDate,
          endDate: lr.endDate,
          reason: lr.reason,
          status: lr.status,
          createdAt: lr.createdAt,
          reviewedBy: lr.reviewedBy,
          reviewedAt: lr.reviewedAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        requests: formattedRequests,
        total: formattedRequests.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/leave-requests/:id
 * Duyệt hoặc từ chối yêu cầu nghỉ phép
 * Body: { status: 'APPROVED' | 'REJECTED', reviewComment?: string }
 */
router.patch('/leave-requests/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewComment } = req.body;
    const { tenantId, userId } = req.user;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be APPROVED or REJECTED',
      });
    }

    const db = getDatabase();
    const requestId = new ObjectId(id);

    const request = await db.collection('leaveRequests').findOne({
      _id: requestId,
      tenantId: new ObjectId(tenantId),
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be reviewed',
      });
    }

    await db.collection('leaveRequests').updateOne(
      { _id: requestId },
      {
        $set: {
          status,
          reviewComment: reviewComment || null,
          reviewedBy: new ObjectId(userId),
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    res.json({ success: true, message: `Leave request ${status.toLowerCase()}` });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/attendance-settings
 * Lấy attendanceSettings của tenant (giờ làm việc công ty)
 */
router.get('/attendance-settings', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const tenant = await db.collection('tenants').findOne({ _id: tenantObjectId });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const settings = tenant.attendanceSettings || {};

    res.json({
      success: true,
      data: {
        workStartTime: settings.workStartTime || '09:00',
        workEndTime: settings.workEndTime || '18:00',
        breakDuration: settings.breakDuration || 60,
        lateThreshold: settings.lateThreshold || 15,
        overtimeThreshold: settings.overtimeThreshold || 8,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/attendance-settings
 * Cập nhật attendanceSettings của tenant và lưu log thay đổi
 * Body: { workStartTime?, workEndTime?, breakDuration?, lateThreshold?, overtimeThreshold?, reason? }
 */
router.put('/attendance-settings', async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { workStartTime, workEndTime, breakDuration, lateThreshold, overtimeThreshold, reason } =
      req.body;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const tenant = await db.collection('tenants').findOne({ _id: tenantObjectId });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const before = tenant.attendanceSettings || {};

    const update = {};
    if (workStartTime !== undefined) update['attendanceSettings.workStartTime'] = workStartTime;
    if (workEndTime !== undefined) update['attendanceSettings.workEndTime'] = workEndTime;
    if (breakDuration !== undefined) update['attendanceSettings.breakDuration'] = breakDuration;
    if (lateThreshold !== undefined) update['attendanceSettings.lateThreshold'] = lateThreshold;
    if (overtimeThreshold !== undefined)
      update['attendanceSettings.overtimeThreshold'] = overtimeThreshold;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    await db.collection('tenants').updateOne(
      { _id: tenantObjectId },
      {
        $set: update,
      }
    );

    const updatedTenant = await db.collection('tenants').findOne({ _id: tenantObjectId });
    const after = updatedTenant.attendanceSettings || {};

    // Lưu log thay đổi vào attendanceSettingsLogs
    await db.collection('attendanceSettingsLogs').insertOne({
      tenantId: tenantObjectId,
      changedBy: new ObjectId(userId),
      before,
      after,
      reason: reason || null,
      changedAt: new Date(),
    });

    res.json({
      success: true,
      data: after,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/attendance-settings/logs
 * Lấy lịch sử thay đổi attendanceSettings của tenant
 */
router.get('/attendance-settings/logs', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { limit = 50 } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const logs = await db
      .collection('attendanceSettingsLogs')
      .find({ tenantId: tenantObjectId })
      .sort({ changedAt: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          id: log._id.toString(),
          changedBy: log.changedBy?.toString() || null,
          before: log.before || null,
          after: log.after || null,
          reason: log.reason || null,
          changedAt: log.changedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// SCHEDULE MANAGEMENT (Employee Daily Schedules)
// ─────────────────────────────────────────────

/**
 * Helper: insert schedule change log
 */
async function insertScheduleLog(db, { tenantId, employeeId, changedBy, before, after, reason }) {
  await db.collection('scheduleChangeLogs').insertOne({
    tenantId,
    employeeId,
    changedBy,
    before,
    after,
    reason: reason || null,
    changedAt: new Date(),
  });
}

/**
 * GET /api/admin/schedules/daily
 * Lấy lịch ngày cho 1 tuần
 * Query: weekStart (YYYY-MM-DD)
 * Trả về map { [employeeId]: { [date]: dailySchedule } }
 */
router.get('/schedules/daily', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { weekStart } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    if (!weekStart) {
      return res.status(400).json({ success: false, message: 'weekStart is required (YYYY-MM-DD)' });
    }

    // Tính ngày cuối tuần (Chủ Nhật) — dùng Vietnam timezone
    const weekStartStr = String(weekStart);
    const monday = toVietnamMidnight(weekStartStr);
    // Cộng 6 ngày → Chủ Nhật
    const sundayDate = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
    const sundayStr = sundayDate.toISOString().split('T')[0]; // "2026-04-12" (UTC date = Vietnam date)

    const schedules = await db.collection('employeeDailySchedules').find({
      tenantId: tenantObjectId,
      date: { $gte: weekStartStr, $lte: sundayStr },
    }).toArray();

    // Build map
    const scheduleMap = {};
    for (const s of schedules) {
      const empId = s.employeeId.toString();
      if (!scheduleMap[empId]) scheduleMap[empId] = {};
      scheduleMap[empId][s.date] = {
        _id: s._id.toString(),
        employeeId: empId,
        date: s.date,
        shiftType: s.shiftType,
        startTime: s.startTime,
        endTime: s.endTime,
        isOverridden: s.isOverridden,
      };
    }

    res.json({ success: true, data: scheduleMap });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/schedules/daily
 * Tạo hoặc cập nhật lịch ngày cho 1 nhân viên
 * Body: { employeeId, date, shiftType, startTime?, endTime?, reason? }
 */
router.post('/schedules/daily', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { employeeId, date, shiftType, startTime, endTime, reason } = req.body;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    if (!employeeId || !date || !shiftType) {
      return res.status(400).json({ success: false, message: 'employeeId, date and shiftType are required' });
    }

    const VALID_SHIFTS = ['MORNING', 'AFTERNOON', 'NIGHT', 'FULL_DAY', 'OFF', 'CUSTOM'];
    if (!VALID_SHIFTS.includes(shiftType)) {
      return res.status(400).json({ success: false, message: 'Invalid shiftType' });
    }

    // Check existing
    const existing = await db.collection('employeeDailySchedules').findOne({
      tenantId: tenantObjectId,
      employeeId: new ObjectId(employeeId),
      date,
    });

    const now = new Date();
    const doc = {
      tenantId: tenantObjectId,
      employeeId: new ObjectId(employeeId),
      date,
      shiftType,
      startTime: startTime || '',
      endTime: endTime || '',
      isOverridden: true,
      meta: {
        createdBy: new ObjectId(userId),
        createdAt: now,
        updatedBy: new ObjectId(userId),
        updatedAt: now,
      },
    };

    let result;
    if (existing) {
      // Update
      doc.meta.createdBy = existing.meta?.createdBy || new ObjectId(userId);
      doc.meta.createdAt = existing.meta?.createdAt || now;

      await db.collection('employeeDailySchedules').updateOne(
        { _id: existing._id },
        { $set: { shiftType, startTime: doc.startTime, endTime: doc.endTime, isOverridden: true, 'meta.updatedBy': new ObjectId(userId), 'meta.updatedAt': now } }
      );
      result = { _id: existing._id };

      await insertScheduleLog(db, {
        tenantId: tenantObjectId,
        employeeId: new ObjectId(employeeId),
        changedBy: new ObjectId(userId),
        before: { shiftType: existing.shiftType, startTime: existing.startTime, endTime: existing.endTime },
        after: { shiftType, startTime: doc.startTime, endTime: doc.endTime },
        reason,
      });
    } else {
      // Insert
      const insertResult = await db.collection('employeeDailySchedules').insertOne(doc);
      result = { _id: insertResult.insertedId };

      await insertScheduleLog(db, {
        tenantId: tenantObjectId,
        employeeId: new ObjectId(employeeId),
        changedBy: new ObjectId(userId),
        before: null,
        after: { shiftType, startTime: doc.startTime, endTime: doc.endTime },
        reason,
      });
    }

    res.status(201).json({ success: true, data: { id: result._id.toString() } });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/schedules/daily/:id
 * Xóa lịch ngày → nhân viên quay về lịch mặc định
 */
router.delete('/schedules/daily/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const schedule = await db.collection('employeeDailySchedules').findOne({
      _id: new ObjectId(id),
      tenantId: tenantObjectId,
    });

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    await db.collection('employeeDailySchedules').deleteOne({ _id: new ObjectId(id) });

    await insertScheduleLog(db, {
      tenantId: tenantObjectId,
      employeeId: schedule.employeeId,
      changedBy: new ObjectId(userId),
      before: { shiftType: schedule.shiftType, startTime: schedule.startTime, endTime: schedule.endTime },
      after: null,
      reason: 'Removed custom schedule — returned to default',
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/schedules/logs
 * Lấy lịch sử thay đổi lịch làm việc
 * Query: employeeId?, limit?
 */
router.get('/schedules/logs', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { employeeId, limit = 50 } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const query = { tenantId: tenantObjectId };
    if (employeeId) {
      query.employeeId = new ObjectId(String(employeeId));
    }

    const logs = await db.collection('scheduleChangeLogs')
      .find(query)
      .sort({ changedAt: -1 })
      .limit(parseInt(limit))
      .toArray();

    // Populate employee names
    const formattedLogs = await Promise.all(logs.map(async (log) => {
      let employeeName = null;
      let changedByName = null;

      if (log.employeeId) {
        const emp = await db.collection('employees').findOne({ _id: log.employeeId, tenantId: tenantObjectId });
        if (emp) employeeName = `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim();
      }

      if (log.changedBy) {
        const user = await db.collection('users').findOne({ _id: log.changedBy });
        if (user) changedByName = user.email;
      }

      return {
        _id: log._id.toString(),
        employeeId: log.employeeId?.toString() || null,
        employeeName,
        changedBy: log.changedBy?.toString() || null,
        changedByName,
        before: log.before || null,
        after: log.after || null,
        reason: log.reason || null,
        changedAt: log.changedAt,
      };
    }));

    res.json({ success: true, data: { logs: formattedLogs } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/payroll-formula-settings
 * Lấy cấu hình công thức tính lương mặc định theo tenant
 */
router.get('/payroll-formula-settings', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const tenant = await db.collection('tenants').findOne({ _id: tenantObjectId });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const settings = tenant.payrollFormulaSettings || {};

    res.json({
      success: true,
      data: {
        overtimeMultiplier: settings.overtimeMultiplier ?? 1.5,
        latePenaltyPerLate: settings.latePenaltyPerLate ?? 50000,
        bhxhRate: settings.bhxhRate ?? 0.08,
        pitRate: settings.pitRate ?? 0,
        standardWorkingDays: settings.standardWorkingDays ?? 22,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/payroll-formula-settings
 * Cập nhật cấu hình công thức tính lương mặc định theo tenant và lưu log
 */
router.put('/payroll-formula-settings', async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      overtimeMultiplier,
      latePenaltyPerLate,
      bhxhRate,
      pitRate,
      standardWorkingDays,
      reason,
    } = req.body;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const tenant = await db.collection('tenants').findOne({ _id: tenantObjectId });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const before = tenant.payrollFormulaSettings || {};

    const update = {};
    if (overtimeMultiplier !== undefined)
      update['payrollFormulaSettings.overtimeMultiplier'] = Number(overtimeMultiplier);
    if (latePenaltyPerLate !== undefined)
      update['payrollFormulaSettings.latePenaltyPerLate'] = Number(latePenaltyPerLate);
    if (bhxhRate !== undefined) update['payrollFormulaSettings.bhxhRate'] = Number(bhxhRate);
    if (pitRate !== undefined) update['payrollFormulaSettings.pitRate'] = Number(pitRate);
    if (standardWorkingDays !== undefined)
      update['payrollFormulaSettings.standardWorkingDays'] = Number(standardWorkingDays);

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    await db.collection('tenants').updateOne({ _id: tenantObjectId }, { $set: update });

    const updatedTenant = await db.collection('tenants').findOne({ _id: tenantObjectId });
    const after = updatedTenant.payrollFormulaSettings || {};

    await db.collection('payrollFormulaSettingsLogs').insertOne({
      tenantId: tenantObjectId,
      changedBy: new ObjectId(userId),
      before,
      after,
      reason: reason || null,
      changedAt: new Date(),
    });

    res.json({ success: true, data: after });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// REWARD RULES
// ─────────────────────────────────────────────

/**
 * GET /api/admin/reward-rules
 * Lấy reward rule hiện tại của tenant
 */
router.get('/reward-rules', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const rule = await db.collection('rewardRules').findOne({ tenantId: tenantObjectId });

    res.json({
      success: true,
      data: rule ? {
        _id: rule._id.toString(),
        type: rule.type,
        requiredDays: rule.requiredDays,
        rewardType: rule.rewardType,
        rewardAmount: rule.rewardAmount || null,
        rewardItem: rule.rewardItem || null,
        isActive: rule.isActive,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/reward-rules
 * Tạo hoặc cập nhật reward rule
 */
router.put('/reward-rules', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { type, requiredDays, rewardType, rewardAmount, rewardItem, isActive } = req.body;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    if (!type || !requiredDays || !rewardType) {
      return res.status(400).json({ success: false, message: 'type, requiredDays, rewardType are required' });
    }

    const existing = await db.collection('rewardRules').findOne({ tenantId: tenantObjectId });
    const now = new Date();

    if (existing) {
      await db.collection('rewardRules').updateOne(
        { _id: existing._id },
        { $set: { type, requiredDays, rewardType, rewardAmount: rewardAmount || null, rewardItem: rewardItem || null, isActive: !!isActive } }
      );
      res.json({ success: true, data: { id: existing._id.toString() } });
    } else {
      const result = await db.collection('rewardRules').insertOne({
        tenantId: tenantObjectId,
        type,
        requiredDays,
        rewardType,
        rewardAmount: rewardAmount || null,
        rewardItem: rewardItem || null,
        isActive: !!isActive,
        createdBy: new ObjectId(userId),
        createdAt: now,
      });
      res.status(201).json({ success: true, data: { id: result.insertedId.toString() } });
    }
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// REWARDS
// ─────────────────────────────────────────────

/**
 * GET /api/admin/rewards
 * Danh sách thưởng, filter theo month, year, employeeId, status, type
 */
router.get('/rewards', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { month, year, employeeId, status, type } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const query = { tenantId: tenantObjectId };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (employeeId) query.employeeId = new ObjectId(String(employeeId));
    if (status) query.status = status;
    if (type) query.type = type;

    const rewards = await db.collection('rewards').find(query).sort({ createdAt: -1 }).toArray();

    const formatted = await Promise.all(rewards.map(async (r) => {
      const emp = await db.collection('employees').findOne({ _id: r.employeeId, tenantId: tenantObjectId });
      return {
        _id: r._id.toString(),
        employeeId: r.employeeId.toString(),
        employeeName: emp ? `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim() : 'Unknown',
        type: r.type,
        title: r.title,
        description: r.description,
        amount: r.amount || null,
        itemName: r.itemName || null,
        status: r.status,
        month: r.month,
        year: r.year,
        createdAt: r.createdAt,
      };
    }));

    res.json({ success: true, data: { rewards: formatted, total: formatted.length } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/rewards
 * Tạo thưởng mới
 */
router.post('/rewards', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { employeeId, type, title, description, amount, itemName, month, year } = req.body;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    if (!employeeId || !type || !title || month === undefined || !year) {
      return res.status(400).json({ success: false, message: 'employeeId, type, title, month, year are required' });
    }

    if (![REWARD_TYPE.MATERIAL, REWARD_TYPE.MONEY].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid reward type' });
    }

    const now = new Date();
    const result = await db.collection('rewards').insertOne({
      tenantId: tenantObjectId,
      employeeId: new ObjectId(employeeId),
      type,
      title,
      description: description || '',
      amount: type === REWARD_TYPE.MONEY ? (amount || 0) : null,
      itemName: type === REWARD_TYPE.MATERIAL ? (itemName || title) : null,
      status: REWARD_STATUS.PENDING,
      month: parseInt(month),
      year: parseInt(year),
      createdBy: new ObjectId(userId),
      createdAt: now,
    });

    res.status(201).json({ success: true, data: { id: result.insertedId.toString() } });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/rewards/:id
 * Duyệt hoặc hủy thưởng
 */
router.patch('/rewards/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const { status } = req.body;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    if (!status || ![REWARD_STATUS.APPROVED, REWARD_STATUS.CANCELLED].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be APPROVED or CANCELLED' });
    }

    const reward = await db.collection('rewards').findOne({ _id: new ObjectId(id), tenantId: tenantObjectId });
    if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });

    await db.collection('rewards').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, approvedBy: new ObjectId(userId), approvedAt: new Date() } }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// DISCIPLINES
// ─────────────────────────────────────────────

/**
 * GET /api/admin/disciplines
 * Danh sách lỗi vi phạm, filter theo month, year, employeeId, type, status
 */
router.get('/disciplines', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { month, year, employeeId, type, status } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const query = { tenantId: tenantObjectId };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (employeeId) query.employeeId = new ObjectId(String(employeeId));
    if (type) query.type = type;
    if (status) query.status = status;

    const disciplines = await db.collection('disciplines').find(query).sort({ createdAt: -1 }).toArray();

    const formatted = await Promise.all(disciplines.map(async (d) => {
      const emp = await db.collection('employees').findOne({ _id: d.employeeId, tenantId: tenantObjectId });
      return {
        _id: d._id.toString(),
        employeeId: d.employeeId.toString(),
        employeeName: emp ? `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim() : 'Unknown',
        type: d.type,
        description: d.description,
        amount: d.amount || null,
        status: d.status,
        month: d.month,
        year: d.year,
        createdAt: d.createdAt,
      };
    }));

    res.json({ success: true, data: { disciplines: formatted, total: formatted.length } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/disciplines
 * Ghi nhận lỗi vi phạm mới
 */
router.post('/disciplines', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { employeeId, type, description, amount, month, year } = req.body;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    if (!employeeId || !type || !description || month === undefined || !year) {
      return res.status(400).json({ success: false, message: 'employeeId, type, description, month, year are required' });
    }

    const VALID_TYPES = Object.values(DISCIPLINE_TYPE);
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid discipline type' });
    }

    const now = new Date();
    const result = await db.collection('disciplines').insertOne({
      tenantId: tenantObjectId,
      employeeId: new ObjectId(employeeId),
      type,
      description,
      amount: amount || null,
      status: DISCIPLINE_STATUS.RECORDED,
      month: parseInt(month),
      year: parseInt(year),
      createdBy: new ObjectId(userId),
      createdAt: now,
    });

    res.status(201).json({ success: true, data: { id: result.insertedId.toString() } });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/disciplines/:id
 * Duyệt / bỏ qua phạt
 */
router.patch('/disciplines/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const { status } = req.body;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    if (!status || ![DISCIPLINE_STATUS.APPROVED, DISCIPLINE_STATUS.WAIVED].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be APPROVED or WAIVED' });
    }

    const discipline = await db.collection('disciplines').findOne({ _id: new ObjectId(id), tenantId: tenantObjectId });
    if (!discipline) return res.status(404).json({ success: false, message: 'Discipline not found' });

    await db.collection('disciplines').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, approvedBy: new ObjectId(userId), approvedAt: new Date() } }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// AUTO CALCULATE REWARDS (Monthly)
// ─────────────────────────────────────────────

/**
 * POST /api/admin/rewards/auto-calculate
 * Tự động tạo reward record cho nhân viên đủ ngày đúng giờ
 * Query: month, year (defaults: current month/year)
 */
router.post('/rewards/auto-calculate', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { month, year } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // Lấy rule thưởng
    const rule = await db.collection('rewardRules').findOne({ tenantId: tenantObjectId, isActive: true });
    if (!rule) {
      return res.status(400).json({ success: false, message: 'No active reward rule found. Please set up a reward rule first.' });
    }

    // Lấy tất cả nhân viên
    const employees = await db.collection('employees').find({ tenantId: tenantObjectId }).toArray();

    // Lấy attendance records của tháng — dùng Vietnam timezone
    const monthStart = new Date(`${targetYear}-${String(targetMonth).padStart(2,'0')}-01T00:00:00.000+07:00`);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setMilliseconds(-1);

    const attendanceRecords = await db.collection('attendance').find({
      tenantId: tenantObjectId,
      date: { $gte: monthStart, $lte: monthEnd },
    }).toArray();

    // Đếm ngày đi đúng giờ cho mỗi nhân viên
    const onTimeCounts = {};
    for (const rec of attendanceRecords) {
      const empId = rec.employeeId.toString();
      // PRESENT = đúng giờ (không phải LATE)
      if (rec.status !== 'LATE') {
        onTimeCounts[empId] = (onTimeCounts[empId] || 0) + 1;
      }
    }

    // Tạo reward records
    const createdRecords = [];
    for (const emp of employees) {
      const empId = emp._id.toString();
      const earnedDays = onTimeCounts[empId] || 0;

      if (earnedDays >= rule.requiredDays) {
        const existing = await db.collection('employeeRewardRecords').findOne({
          tenantId: tenantObjectId,
          employeeId: emp._id,
          month: targetMonth,
          year: targetYear,
        });

        if (!existing) {
          const result = await db.collection('employeeRewardRecords').insertOne({
            tenantId: tenantObjectId,
            employeeId: emp._id,
            ruleId: rule._id,
            rewardType: rule.rewardType,
            rewardAmount: rule.rewardAmount || null,
            rewardItem: rule.rewardItem || null,
            month: targetMonth,
            year: targetYear,
            earnedDays,
            requiredDays: rule.requiredDays,
            createdAt: now,
          });

          const empName = `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim();
          createdRecords.push({ id: result.insertedId.toString(), employeeId: empId, employeeName: empName, earnedDays });
        }
      }
    }

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        rule: { requiredDays: rule.requiredDays, rewardType: rule.rewardType, rewardAmount: rule.rewardAmount, rewardItem: rule.rewardItem },
        totalQualified: createdRecords.length,
        records: createdRecords,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/rewards/auto-calculate/employees
 * Lấy danh sách nhân viên đủ điều kiện thưởng (preview)
 * Query: month, year
 */
router.get('/rewards/auto-calculate/employees', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { month, year } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const rule = await db.collection('rewardRules').findOne({ tenantId: tenantObjectId, isActive: true });
    if (!rule) {
      return res.json({ success: true, data: { rule: null, employees: [] } });
    }

    const employees = await db.collection('employees').find({ tenantId: tenantObjectId }).toArray();
    const monthStart = new Date(`${targetYear}-${String(targetMonth).padStart(2,'0')}-01T00:00:00.000+07:00`);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setMilliseconds(-1);

    const attendanceRecords = await db.collection('attendance').find({
      tenantId: tenantObjectId,
      date: { $gte: monthStart, $lte: monthEnd },
    }).toArray();

    const onTimeCounts = {};
    for (const rec of attendanceRecords) {
      const empId = rec.employeeId.toString();
      if (rec.status !== 'LATE') {
        onTimeCounts[empId] = (onTimeCounts[empId] || 0) + 1;
      }
    }

    const qualified = employees
      .filter(emp => (onTimeCounts[emp._id.toString()] || 0) >= rule.requiredDays)
      .map(emp => ({
        _id: emp._id.toString(),
        name: `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim(),
        onTimeDays: onTimeCounts[emp._id.toString()] || 0,
        requiredDays: rule.requiredDays,
        rewardType: rule.rewardType,
        rewardAmount: rule.rewardAmount || null,
        rewardItem: rule.rewardItem || null,
      }));

    res.json({
      success: true,
      data: {
        rule: { requiredDays: rule.requiredDays, rewardType: rule.rewardType, rewardAmount: rule.rewardAmount, rewardItem: rule.rewardItem },
        employees: qualified,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/reward-records
 * Lấy danh sách employeeRewardRecords (log thưởng auto)
 */
router.get('/reward-records', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { month, year } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const query = { tenantId: tenantObjectId };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const records = await db.collection('employeeRewardRecords')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = await Promise.all(records.map(async (r) => {
      const emp = await db.collection('employees').findOne({ _id: r.employeeId, tenantId: tenantObjectId });
      return {
        _id: r._id.toString(),
        employeeId: r.employeeId.toString(),
        employeeName: emp ? `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim() : 'Unknown',
        ruleId: r.ruleId?.toString() || null,
        rewardType: r.rewardType,
        rewardAmount: r.rewardAmount || null,
        rewardItem: r.rewardItem || null,
        month: r.month,
        year: r.year,
        earnedDays: r.earnedDays,
        requiredDays: r.requiredDays,
        createdAt: r.createdAt,
      };
    }));

    res.json({ success: true, data: { records: formatted, total: formatted.length } });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// DEPARTMENTS (CRUD)
// ─────────────────────────────────────────────

/**
 * GET /api/admin/departments
 * Lấy danh sách phòng ban của tenant
 */
router.get('/departments', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const departments = await db.collection('departments')
      .find({ tenantId: tenantObjectId })
      .sort({ name: 1 })
      .toArray();

    const formatted = departments.map(d => ({
      _id: d._id.toString(),
      name: d.name,
      description: d.description || '',
      employeeCount: 0, // sẽ populate từ employees collection
    }));

    res.json({ success: true, data: { departments: formatted, total: formatted.length } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/departments
 * Tạo phòng ban mới
 */
router.post('/departments', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { name, description } = req.body;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    // Check duplicate name
    const existing = await db.collection('departments').findOne({
      tenantId: tenantObjectId,
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Department name already exists' });
    }

    const now = new Date();
    const result = await db.collection('departments').insertOne({
      tenantId: tenantObjectId,
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: new ObjectId(userId),
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({ success: true, data: { id: result.insertedId.toString() } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/departments/:id
 * Cập nhật phòng ban
 */
router.put('/departments/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { name, description } = req.body;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    // Check duplicate (exclude self)
    const existingDup = await db.collection('departments').findOne({
      tenantId: tenantObjectId,
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      _id: { $ne: new ObjectId(id) },
    });

    if (existingDup) {
      return res.status(400).json({ success: false, message: 'Department name already exists' });
    }

    const dept = await db.collection('departments').findOne({
      _id: new ObjectId(id),
      tenantId: tenantObjectId,
    });

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    await db.collection('departments').updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: name.trim(), description: description?.trim() || '', updatedAt: new Date() } }
    );

    // Update all employees in old department to new department name
    await db.collection('employees').updateMany(
      {
        tenantId: tenantObjectId,
        $or: [
          { department: dept.name },
          { 'employment.department': dept.name },
        ],
      },
      { $set: { department: name.trim(), 'employment.department': name.trim() } }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/departments/:id
 * Xóa phòng ban — chỉ xóa được nếu không có nhân viên
 */
router.delete('/departments/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const dept = await db.collection('departments').findOne({
      _id: new ObjectId(id),
      tenantId: tenantObjectId,
    });

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check if department has employees
    const employeeCount = await db.collection('employees').countDocuments({
      tenantId: tenantObjectId,
      $or: [
        { department: dept.name },
        { 'employment.department': dept.name },
      ],
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${employeeCount} employee(s). Please move or remove employees first.`,
      });
    }

    await db.collection('departments').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/departments/:id/employees
 * Lấy danh sách nhân viên trong 1 phòng ban
 */
router.get('/departments/:id/employees', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const dept = await db.collection('departments').findOne({
      _id: new ObjectId(id),
      tenantId: tenantObjectId,
    });

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const employees = await db.collection('employees').find({
      tenantId: tenantObjectId,
      $or: [
        { department: dept.name },
        { 'employment.department': dept.name },
      ],
    }).toArray();

    const formatted = employees.map(emp => ({
      _id: emp._id.toString(),
      employeeId: emp.employeeId || '',
      name: `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim(),
      email: emp.personalInfo?.email || '',
      department: emp.department || emp.employment?.department || dept.name,
      position: emp.position || emp.employment?.position || 'N/A',
      phone: emp.personalInfo?.phone || '',
      employmentStatus: emp.employment?.status || 'ACTIVE',
    }));

    res.json({ success: true, data: { employees: formatted, total: formatted.length, department: dept.name } });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/departments/:id/employees
 * Gán/bỏ gán nhân viên vào phòng ban
 * Body: { employeeIds: string[], action: 'assign' | 'remove' }
 */
router.patch('/departments/:id/employees', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { employeeIds, action, newDepartmentName } = req.body;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const dept = await db.collection('departments').findOne({
      _id: new ObjectId(id),
      tenantId: tenantObjectId,
    });

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ success: false, message: 'employeeIds is required' });
    }

    if (action === 'assign') {
      const objectIds = employeeIds.map(eid => new ObjectId(eid));
      await db.collection('employees').updateMany(
        { _id: { $in: objectIds }, tenantId: tenantObjectId },
        { $set: { department: dept.name, 'employment.department': dept.name } }
      );
    } else if (action === 'remove') {
      const objectIds = employeeIds.map(eid => new ObjectId(eid));
      // Remove from this department — set to empty or 'Unassigned'
      const newDept = newDepartmentName || '';
      await db.collection('employees').updateMany(
        { _id: { $in: objectIds }, tenantId: tenantObjectId },
        { $set: { department: newDept, 'employment.department': newDept } }
      );
    } else {
      return res.status(400).json({ success: false, message: 'action must be assign or remove' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
