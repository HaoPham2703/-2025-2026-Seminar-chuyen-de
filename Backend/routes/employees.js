import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateToken);
router.use(tenantIsolation);

/**
 * GET /api/employees/profile
 * Lấy thông tin profile của employee hiện tại
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
 * GET /api/employees/:employeeId
 * Lấy thông tin chi tiết của một employee (admin only)
 */
router.get('/:employeeId', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId } = req.user;
    const db = getDatabase();
    const employeeObjectId = new ObjectId(employeeId);
    const tenantIdObjectId = new ObjectId(tenantId);

    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantIdObjectId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
