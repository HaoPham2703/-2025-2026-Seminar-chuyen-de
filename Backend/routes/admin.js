import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

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
              department: employee.department || 'N/A',
              status: 'Sick'
            });
          } else {
            absentEmployees.push({
              _id: employee._id.toString(),
              name: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim(),
              department: employee.department || 'N/A',
              status: 'Absent'
            });
          }
        } else {
          absentEmployees.push({
            _id: employee._id.toString(),
            name: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim(),
            department: employee.department || 'N/A',
            status: 'Absent'
          });
        }
      } else {
        const clockInTime = new Date(attendance.clockIn.time);
        const timeStr = `${String(clockInTime.getHours()).padStart(2, '0')}.${String(clockInTime.getMinutes()).padStart(2, '0')}`;
        
        presentEmployees.push({
          _id: employee._id.toString(),
          name: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim(),
          department: employee.department || 'N/A',
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
      department: emp.department || 'N/A',
      position: emp.position || 'N/A',
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
 * GET /api/admin/attendance/today
 * Lấy tất cả attendance records hôm nay
 */
router.get('/attendance/today', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await db.collection('attendance').find({
      tenantId: tenantObjectId,
      date: today
    }).toArray();

    res.json({
      success: true,
      data: {
        records: attendance,
        total: attendance.length
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

export default router;
