import express from 'express';
import { ObjectId } from 'mongodb';
import { ROLES } from '../config/constants.js';
import { getDatabase } from '../config/database.js';
import { authenticateToken, requireRole, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(tenantIsolation);

/**
 * GET /api/benefits
 * Lấy danh sách tất cả phúc lợi trong tenant
 */
router.get('/', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const db = getDatabase();

    const benefits = await db
      .collection('benefits')
      .find({ tenantId: new ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Lấy số nhân viên cho mỗi phúc lợi
    const enrichedBenefits = await Promise.all(
      benefits.map(async (benefit) => {
        const employeeCount = await db
          .collection('employeeBenefits')
          .countDocuments({
            tenantId: new ObjectId(tenantId),
            benefitId: benefit._id,
            $or: [
              { endDate: { $gt: new Date() } },
              { endDate: null },
              { endDate: { $exists: false } },
            ],
          });

        return {
          id: benefit._id.toString(),
          name: benefit.name,
          type: benefit.type,
          value: benefit.value,
          employeeCount,
          createdAt: benefit.createdAt,
        };
      })
    );

    res.json({ success: true, data: { benefits: enrichedBenefits } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/benefits
 * Thêm phúc lợi mới
 */
router.post('/', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { name, type, value } = req.body;

    if (!name || !type || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name, type, value are required',
      });
    }

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const benefit = {
      tenantId: tenantObjectId,
      name,
      type, // 'fixed' | 'percent' | 'custom'
      value: Number(value),
      createdAt: new Date(),
      createdBy: new ObjectId(userId),
      updatedAt: new Date(),
      updatedBy: new ObjectId(userId),
    };

    const result = await db.collection('benefits').insertOne(benefit);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        name,
        type,
        value: Number(value),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/benefits/:id
 * Sửa phúc lợi
 */
router.put('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const { name, type, value } = req.body;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const benefitObjectId = new ObjectId(id);

    const benefit = await db.collection('benefits').findOne({
      _id: benefitObjectId,
      tenantId: tenantObjectId,
    });

    if (!benefit) {
      return res.status(404).json({ success: false, message: 'Benefit not found' });
    }

    const updateData = {
      updatedAt: new Date(),
      updatedBy: new ObjectId(userId),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = Number(value);

    await db.collection('benefits').updateOne(
      { _id: benefitObjectId, tenantId: tenantObjectId },
      { $set: updateData }
    );

    res.json({ success: true, message: 'Benefit updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/benefits/:id
 * Xóa phúc lợi (chỉ khi không có nhân viên)
 */
router.delete('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const benefitObjectId = new ObjectId(id);

    // Check xem có nhân viên nào có phúc lợi này không
    const employeeCount = await db.collection('employeeBenefits').countDocuments({
      tenantId: tenantObjectId,
      benefitId: benefitObjectId,
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa phúc lợi này vì đang có ${employeeCount} nhân viên sử dụng`,
        employeeCount,
      });
    }

    const result = await db.collection('benefits').deleteOne({
      _id: benefitObjectId,
      tenantId: tenantObjectId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Benefit not found' });
    }

    res.json({ success: true, message: 'Benefit deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/benefits/:id/employees
 * Lấy danh sách nhân viên có phúc lợi này
 */
router.get('/:id/employees', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const benefitObjectId = new ObjectId(id);

    const employeeBenefits = await db
      .collection('employeeBenefits')
      .find({
        tenantId: tenantObjectId,
        benefitId: benefitObjectId,
      })
      .sort({ startDate: -1 })
      .toArray();

    // Populate employee info
    const employeeIds = employeeBenefits.map((eb) => eb.employeeId);
    const employees = await db
      .collection('employees')
      .find({ _id: { $in: employeeIds } })
      .project({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1, employeeId: 1 })
      .toArray();
    const empMap = Object.fromEntries(employees.map((e) => [e._id.toString(), e]));

    const result = employeeBenefits.map((eb) => {
      const emp = empMap[eb.employeeId.toString()];
      return {
        id: eb._id.toString(),
        employeeName: emp
          ? `${emp.personalInfo?.lastName || ''} ${emp.personalInfo?.firstName || ''}`.trim()
          : 'Unknown',
        employeeCode: emp?.employeeId || '',
        startDate: eb.startDate,
        endDate: eb.endDate || null,
      };
    });

    res.json({ success: true, data: { employees: result } });
  } catch (error) {
    next(error);
  }
});

export default router;
