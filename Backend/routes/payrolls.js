import express from 'express';
import { ObjectId } from 'mongodb';
import { ROLES } from '../config/constants.js';
import { getDatabase } from '../config/database.js';
import { authenticateToken, requireRole, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(tenantIsolation);

async function getEmployeeForUser(db, userId, tenantId) {
  return db.collection('employees').findOne({
    userId: new ObjectId(userId),
    tenantId: new ObjectId(tenantId),
  });
}

function normalizeMoney(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function sumAmount(items = []) {
  return items.reduce((total, item) => total + normalizeMoney(item.amount), 0);
}

/**
 * GET /api/payrolls/my
 * Lấy danh sách phiếu lương của nhân viên hiện tại
 * Query: month, year (optional)
 */
router.get('/my', async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const { month, year } = req.query;
    const db = getDatabase();

    const employee = await getEmployeeForUser(db, userId, tenantId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const query = {
      tenantId: new ObjectId(tenantId),
      employeeId: employee._id,
    };

    if (month) {
      query['period.month'] = parseInt(month, 10);
    }

    if (year) {
      query['period.year'] = parseInt(year, 10);
    }

    const payrolls = await db
      .collection('payrolls')
      .find(query)
      .sort({ 'period.year': -1, 'period.month': -1, createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: {
        payrolls: payrolls.map((item) => ({
          id: item._id.toString(),
          period: item.period,
          baseSalary: item.baseSalary || 0,
          allowances: item.allowances || [],
          deductions: item.deductions || [],
          allowancesTotal: item.allowancesTotal || 0,
          deductionsTotal: item.deductionsTotal || 0,
          netSalary: item.netSalary || 0,
          status: item.status || 'APPROVED',
          approvedAt: item.approvedAt || null,
          createdAt: item.createdAt || null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payrolls
 * Lấy danh sách tất cả phiếu lương (admin)
 * Query: month, year, employeeId, status (optional)
 */
router.get('/', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { month, year, employeeId, status } = req.query;
    const db = getDatabase();

    const query = { tenantId: new ObjectId(tenantId) };

    if (month) query['period.month'] = parseInt(month, 10);
    if (year) query['period.year'] = parseInt(year, 10);
    if (employeeId) query.employeeId = new ObjectId(employeeId);
    if (status) query.status = status;

    const payrolls = await db
      .collection('payrolls')
      .find(query)
      .sort({ 'period.year': -1, 'period.month': -1, createdAt: -1 })
      .toArray();

    // Populate employee info
    const employeeIds = [...new Set(payrolls.map((p) => p.employeeId.toString()))];
    const employees = await db
      .collection('employees')
      .find({ _id: { $in: employeeIds.map((id) => new ObjectId(id)) } })
      .toArray();
    const empMap = Object.fromEntries(employees.map((e) => [e._id.toString(), e]));

    const enriched = payrolls.map((p) => {
      const emp = empMap[p.employeeId.toString()];
      const fullName = emp
        ? `${emp.personalInfo?.lastName || ''} ${emp.personalInfo?.firstName || ''}`.trim()
        : 'Unknown';
      return {
        ...p,
        employeeName: fullName,
        employeeCode: emp?.employeeId || '',
      };
    });

    res.json({ success: true, data: { payrolls: enriched } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payrolls/employees
 * Lấy danh sách nhân viên để chọn khi tạo payroll (admin)
 */
router.get('/employees', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const db = getDatabase();

    const employees = await db
      .collection('employees')
      .find({ tenantId: new ObjectId(tenantId) })
      .project({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1, employeeId: 1, 'employment.position': 1 })
      .toArray();

    const list = employees.map((e) => ({
      id: e._id.toString(),
      name: `${e.personalInfo?.lastName || ''} ${e.personalInfo?.firstName || ''}`.trim(),
      code: e.employeeId || '',
      position: e.employment?.position || '',
    }));

    res.json({ success: true, data: { employees: list } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payrolls
 * Tạo phiếu lương (admin)
 */
router.post('/', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      employeeId,
      period,
      baseSalary,
      allowances = [],
      deductions = [],
      status = 'APPROVED',
      approvedAt,
    } = req.body;

    if (!employeeId || !period?.month || !period?.year) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, period.month and period.year are required',
      });
    }

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

    const base = normalizeMoney(baseSalary);
    const allowancesTotal = sumAmount(allowances);
    const deductionsTotal = sumAmount(deductions);
    const netSalary = base + allowancesTotal - deductionsTotal;

    const now = new Date();
    const doc = {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      period: {
        month: parseInt(period.month, 10),
        year: parseInt(period.year, 10),
      },
      baseSalary: base,
      allowances,
      deductions,
      allowancesTotal,
      deductionsTotal,
      netSalary,
      status,
      approvedAt: approvedAt ? new Date(approvedAt) : now,
      createdAt: now,
      createdBy: new ObjectId(userId),
    };

    const result = await db.collection('payrolls').insertOne(doc);

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

export default router;
