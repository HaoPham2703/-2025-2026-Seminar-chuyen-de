import express from 'express';
import { ObjectId } from 'mongodb';
import { ROLES } from '../config/constants.js';
import { getDatabase } from '../config/database.js';
import { authenticateToken, requireRole, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(tenantIsolation);

/**
 * GET /api/employee-benefits
 * Lấy danh sách tất cả gán phúc lợi cho nhân viên
 * Query: employeeId (optional)
 */
router.get('/', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { employeeId } = req.query;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const query = { tenantId: tenantObjectId };
    if (employeeId) {
      query.employeeId = new ObjectId(employeeId);
    }

    const employeeBenefits = await db
      .collection('employeeBenefits')
      .find(query)
      .sort({ startDate: -1 })
      .toArray();

    // Populate employee and benefit info
    const employeeIds = [...new Set(employeeBenefits.map((eb) => eb.employeeId))];
    const benefitIds = [...new Set(employeeBenefits.map((eb) => eb.benefitId))];

    const employees = await db
      .collection('employees')
      .find({ _id: { $in: employeeIds } })
      .project({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1, employeeId: 1 })
      .toArray();

    const benefits = await db
      .collection('benefits')
      .find({ _id: { $in: benefitIds } })
      .project({ name: 1, type: 1, value: 1 })
      .toArray();

    const empMap = Object.fromEntries(employees.map((e) => [e._id.toString(), e]));
    const benMap = Object.fromEntries(benefits.map((b) => [b._id.toString(), b]));

    const result = employeeBenefits.map((eb) => {
      const emp = empMap[eb.employeeId.toString()];
      const ben = benMap[eb.benefitId.toString()];

      return {
        id: eb._id.toString(),
        employeeName: emp
          ? `${emp.personalInfo?.lastName || ''} ${emp.personalInfo?.firstName || ''}`.trim()
          : 'Unknown',
        employeeCode: emp?.employeeId || '',
        benefitName: ben?.name || 'Unknown',
        type: ben?.type || '',
        amount: ben?.value || 0,
        startDate: eb.startDate,
        endDate: eb.endDate || null,
      };
    });

    res.json({ success: true, data: { employeeBenefits: result } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/employee-benefits
 * Gán phúc lợi cho nhân viên
 */
router.post('/', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { employeeId, benefitId, startDate } = req.body;

    if (!employeeId || !benefitId || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, benefitId, startDate are required',
      });
    }

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);
    const benefitObjectId = new ObjectId(benefitId);

    // Verify employee exists
    const employee = await db.collection('employees').findOne({
      _id: employeeObjectId,
      tenantId: tenantObjectId,
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Verify benefit exists
    const benefit = await db.collection('benefits').findOne({
      _id: benefitObjectId,
      tenantId: tenantObjectId,
    });

    if (!benefit) {
      return res.status(404).json({ success: false, message: 'Benefit not found' });
    }

    const employeeBenefit = {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      benefitId: benefitObjectId,
      startDate: new Date(startDate),
      endDate: null,
      createdAt: new Date(),
      createdBy: new ObjectId(userId),
      updatedAt: new Date(),
      updatedBy: new ObjectId(userId),
    };

    const result = await db.collection('employeeBenefits').insertOne(employeeBenefit);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        employeeId,
        benefitId,
        startDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/employee-benefits/:id
 * Sửa gán phúc lợi cho nhân viên
 */
router.put('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const { benefitId, startDate, endDate } = req.body;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const ebObjectId = new ObjectId(id);

    const employeeBenefit = await db.collection('employeeBenefits').findOne({
      _id: ebObjectId,
      tenantId: tenantObjectId,
    });

    if (!employeeBenefit) {
      return res.status(404).json({ success: false, message: 'Employee benefit not found' });
    }

    // Verify new benefit if provided
    if (benefitId) {
      const benefit = await db.collection('benefits').findOne({
        _id: new ObjectId(benefitId),
        tenantId: tenantObjectId,
      });

      if (!benefit) {
        return res.status(404).json({ success: false, message: 'Benefit not found' });
      }
    }

    const updateData = {
      updatedAt: new Date(),
      updatedBy: new ObjectId(userId),
    };

    if (benefitId) updateData.benefitId = new ObjectId(benefitId);
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    await db.collection('employeeBenefits').updateOne(
      { _id: ebObjectId, tenantId: tenantObjectId },
      { $set: updateData }
    );

    res.json({ success: true, message: 'Employee benefit updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/employee-benefits/:id
 * Xóa gán phúc lợi cho nhân viên
 */
router.delete('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const ebObjectId = new ObjectId(id);

    const result = await db.collection('employeeBenefits').deleteOne({
      _id: ebObjectId,
      tenantId: tenantObjectId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Employee benefit not found' });
    }

    res.json({ success: true, message: 'Employee benefit deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employee-benefits/by-employee/:employeeId
 * Lấy tất cả phúc lợi của một nhân viên (dùng trong auto-calculate payroll)
 */
router.get('/by-employee/:employeeId', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { employeeId } = req.params;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);

    // Lấy các phúc lợi còn hiệu lực (không có endDate hoặc endDate > now)
    const now = new Date();
    const employeeBenefits = await db
      .collection('employeeBenefits')
      .find({
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        startDate: { $lte: now },
        $or: [
          { endDate: { $gt: now } },
          { endDate: null },
          { endDate: { $exists: false } },
        ],
      })
      .toArray();

    // Populate benefit info
    const benefitIds = employeeBenefits.map((eb) => eb.benefitId);
    const benefits = await db
      .collection('benefits')
      .find({ _id: { $in: benefitIds } })
      .project({ name: 1, type: 1, value: 1 })
      .toArray();

    const benMap = Object.fromEntries(benefits.map((b) => [b._id.toString(), b]));

    const result = employeeBenefits.map((eb) => {
      const ben = benMap[eb.benefitId.toString()];
      return {
        name: ben?.name || 'Unknown',
        type: ben?.type || 'fixed',
        value: ben?.value || 0,
      };
    });

    res.json({ success: true, data: { benefits: result } });
  } catch (error) {
    next(error);
  }
});

export default router;
