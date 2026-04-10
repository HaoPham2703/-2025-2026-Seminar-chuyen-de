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

function roundMoney(value) {
  return Math.round(normalizeMoney(value));
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
      .project({ userId: 1, 'personalInfo.firstName': 1, 'personalInfo.lastName': 1, employeeId: 1, 'employment.position': 1 })
      .toArray();

    // Lấy email từ users collection
    const userIds = employees.map((e) => e.userId).filter(Boolean);
    const users = await db
      .collection('users')
      .find({ _id: { $in: userIds } })
      .project({ _id: 1, email: 1 })
      .toArray();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u.email]));

    const list = employees.map((e) => ({
      id: e._id.toString(),
      name: `${e.personalInfo?.lastName || ''} ${e.personalInfo?.firstName || ''}`.trim(),
      code: e.employeeId || '',
      position: e.employment?.position || '',
      email: e.userId ? (userMap[e.userId.toString()] || '') : '',
    }));

    res.json({ success: true, data: { employees: list } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payrolls/auto-calculate
 * Tính tự động gợi ý payroll từ attendance theo tháng
 */
router.post('/auto-calculate', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const {
      employeeId,
      month,
      year,
      baseSalary,
      overtimeMultiplier,
      latePenaltyPerLate,
      bhxhRate,
      pitRate,
      standardWorkingDays,
    } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, month, year are required',
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
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const formulaSettings = (await db.collection('tenants').findOne(
      { _id: tenantObjectId },
      { projection: { payrollFormulaSettings: 1 } }
    ))?.payrollFormulaSettings || {};

    const effectiveFormula = {
      overtimeMultiplier: Number(
        overtimeMultiplier ?? formulaSettings.overtimeMultiplier ?? 1.5
      ),
      latePenaltyPerLate: Number(
        latePenaltyPerLate ?? formulaSettings.latePenaltyPerLate ?? 50000
      ),
      bhxhRate: Number(bhxhRate ?? formulaSettings.bhxhRate ?? 0.08),
      pitRate: Number(pitRate ?? formulaSettings.pitRate ?? 0),
      standardWorkingDays: Number(
        standardWorkingDays ?? formulaSettings.standardWorkingDays ?? 22
      ),
    };

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    // Vietnam timezone: "2026-04-01T00:00:00.000+07:00" = April 1 Vietnam midnight
    const start = new Date(`${yearNum}-${String(monthNum).padStart(2,'0')}-01T00:00:00.000+07:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setMilliseconds(-1); // last ms of previous month = last ms of target month

    // Fetch attendance + disciplines + rewards in parallel
    const [attendanceRows, disciplineRows, rewardRows] = await Promise.all([
      db.collection('attendance').find({
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        date: { $gte: start, $lte: end },
      }).toArray(),
      db.collection('disciplines').find({
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        month: monthNum,
        year: yearNum,
        status: { $in: ['RECORDED', 'APPROVED'] },
      }).toArray(),
      db.collection('rewards').find({
        tenantId: tenantObjectId,
        employeeId: employeeObjectId,
        month: monthNum,
        year: yearNum,
        status: 'APPROVED',
      }).toArray(),
    ]);

    const totalWorkMinutes = attendanceRows.reduce((sum, row) => sum + (Number(row.workDuration) || 0), 0);
    const totalOvertimeMinutes = attendanceRows.reduce((sum, row) => sum + (Number(row.overtimeDuration) || 0), 0);

    // Per-incident breakdown from attendance
    const lateIncidents = attendanceRows
      .filter((row) => row.status === 'LATE')
      .map((row) => ({
        date: row.date,
        lateMinutes: row.clockIn?.lateMinutes || 0,
        status: 'LATE',
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const absentIncidents = attendanceRows
      .filter((row) => row.status === 'ABSENT')
      .map((row) => ({ date: row.date, status: 'ABSENT' }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const lateCount = lateIncidents.length;
    const absentCount = absentIncidents.length;
    const attendanceDays = attendanceRows.filter((row) => Number(row.workDuration || 0) > 0).length;

    const monthlyBaseSalary = roundMoney(baseSalary ?? employee.employment?.baseSalary ?? 0);
    const standardHours = effectiveFormula.standardWorkingDays * 8;
    const hourlyRate = standardHours > 0 ? monthlyBaseSalary / standardHours : 0;
    const shiftSalary = effectiveFormula.standardWorkingDays > 0
      ? monthlyBaseSalary / effectiveFormula.standardWorkingDays
      : 0;

    const overtimePay = roundMoney(
      (totalOvertimeMinutes / 60) * hourlyRate * effectiveFormula.overtimeMultiplier
    );

    // Penalty from disciplines collection (APPROVED only → applied to payroll)
    const disciplineAmount = roundMoney(
      disciplineRows
        .filter(d => d.status === 'APPROVED' && d.amount != null)
        .reduce((sum, d) => sum + Number(d.amount), 0)
    );
    const disciplineBreakdown = disciplineRows
      .filter(d => d.status === 'APPROVED')
      .map(d => ({
        type: d.type,
        description: d.description,
        amount: Number(d.amount) || 0,
      }));

    // Reward from rewards collection (APPROVED only)
    const rewardAmount = roundMoney(
      rewardRows
        .filter(r => r.amount != null)
        .reduce((sum, r) => sum + Number(r.amount), 0)
    );

    const bhxh = roundMoney(monthlyBaseSalary * effectiveFormula.bhxhRate);
    const pit = roundMoney(monthlyBaseSalary * effectiveFormula.pitRate);

    const allowances = [
      ...(overtimePay > 0 ? [{ name: 'Tăng ca', amount: overtimePay }] : []),
      ...(rewardAmount > 0 ? [{ name: 'Thưởng', amount: rewardAmount }] : []),
    ];

    const deductions = [
      ...(lateCount > 0 ? [{ name: `Đi muộn (${lateCount} lần)`, amount: roundMoney(lateCount * effectiveFormula.latePenaltyPerLate) }] : []),
      ...(absentCount > 0 ? [{ name: `Vắng không phép (${absentCount} ngày)`, amount: roundMoney(absentCount * shiftSalary) }] : []),
      ...(disciplineAmount > 0 ? [{ name: `Phạt kỷ luật (${disciplineBreakdown.length} lỗi)`, amount: disciplineAmount }] : []),
      ...(bhxh > 0 ? [{ name: `BHXH (${effectiveFormula.bhxhRate * 100}%)`, amount: bhxh }] : []),
      ...(pit > 0 ? [{ name: `Thuế TNCN (${effectiveFormula.pitRate * 100}%)`, amount: pit }] : []),
    ];

    const allowancesTotal = sumAmount(allowances);
    const deductionsTotal = sumAmount(deductions);
    const netSalary = roundMoney(monthlyBaseSalary + allowancesTotal - deductionsTotal);

    res.json({
      success: true,
      data: {
        baseSalary: monthlyBaseSalary,
        attendanceSummary: {
          totalWorkMinutes,
          totalOvertimeMinutes,
          lateCount,
          absentCount,
          attendanceDays,
          standardWorkingDays: effectiveFormula.standardWorkingDays,
        },
        lateIncidents,
        absentIncidents,
        disciplineBreakdown,
        suggestion: {
          allowances,
          deductions,
          allowancesTotal,
          deductionsTotal,
          netSalary,
          components: {
            overtimePay,
            lateCount,
            absentCount,
            latePenaltyPerLate: effectiveFormula.latePenaltyPerLate,
            absentPenaltyPerDay: shiftSalary,
            disciplineAmount,
            rewardAmount,
            bhxh,
            pit,
          },
        },
      },
    });
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
      revisionOf: null,
      revisedFrom: null,
      revisedAt: null,
      revisedBy: null,
      reviseReason: null,
      isSuperseded: false,
      supersededBy: null,
      updatedAt: now,
      updatedBy: new ObjectId(userId),
    };

    const result = await db.collection('payrolls').insertOne(doc);

    await db.collection('payroll_audits').insertOne({
      tenantId: tenantObjectId,
      payrollId: result.insertedId,
      action: 'CREATE',
      performedBy: new ObjectId(userId),
      performedAt: now,
      reason: null,
      previousValues: null,
      nextValues: {
        employeeId: employeeObjectId,
        period: doc.period,
        baseSalary: doc.baseSalary,
        allowances: doc.allowances,
        deductions: doc.deductions,
        status: doc.status,
      },
    });

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
 * PUT /api/payrolls/:id
 * Chỉ cho phép sửa trực tiếp khi status hiện tại là DRAFT/PENDING
 */
router.put('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const {
      period,
      baseSalary,
      allowances = [],
      deductions = [],
      status,
      approvedAt,
      reason,
    } = req.body;

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const payrollObjectId = new ObjectId(id);

    const payroll = await db.collection('payrolls').findOne({
      _id: payrollObjectId,
      tenantId: tenantObjectId,
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    if (!['DRAFT', 'PENDING'].includes(payroll.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT/PENDING payroll can be edited directly',
      });
    }

    const nextPeriod = {
      month: parseInt(period?.month ?? payroll.period?.month, 10),
      year: parseInt(period?.year ?? payroll.period?.year, 10),
    };

    const nextBase = baseSalary !== undefined ? normalizeMoney(baseSalary) : normalizeMoney(payroll.baseSalary);
    const nextAllowances = Array.isArray(allowances) ? allowances : (payroll.allowances || []);
    const nextDeductions = Array.isArray(deductions) ? deductions : (payroll.deductions || []);
    const nextStatus = status || payroll.status;

    const allowancesTotal = sumAmount(nextAllowances);
    const deductionsTotal = sumAmount(nextDeductions);
    const netSalary = nextBase + allowancesTotal - deductionsTotal;

    const now = new Date();

    await db.collection('payrolls').updateOne(
      { _id: payrollObjectId, tenantId: tenantObjectId },
      {
        $set: {
          period: nextPeriod,
          baseSalary: nextBase,
          allowances: nextAllowances,
          deductions: nextDeductions,
          allowancesTotal,
          deductionsTotal,
          netSalary,
          status: nextStatus,
          approvedAt: approvedAt ? new Date(approvedAt) : payroll.approvedAt || now,
          updatedAt: now,
          updatedBy: new ObjectId(userId),
        },
      }
    );

    await db.collection('payroll_audits').insertOne({
      tenantId: tenantObjectId,
      payrollId: payrollObjectId,
      action: 'UPDATE',
      performedBy: new ObjectId(userId),
      performedAt: now,
      reason: reason || null,
      previousValues: {
        period: payroll.period,
        baseSalary: payroll.baseSalary,
        allowances: payroll.allowances || [],
        deductions: payroll.deductions || [],
        status: payroll.status,
      },
      nextValues: {
        period: nextPeriod,
        baseSalary: nextBase,
        allowances: nextAllowances,
        deductions: nextDeductions,
        status: nextStatus,
      },
    });

    res.json({ success: true, message: 'Payroll updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payrolls/:id/revise
 * Dùng cho phiếu APPROVED: tạo phiếu mới (revision), không sửa trực tiếp phiếu cũ
 */
router.post('/:id/revise', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const {
      period,
      baseSalary,
      allowances = [],
      deductions = [],
      status = 'PENDING',
      approvedAt,
      reason,
    } = req.body;

    if (!reason || String(reason).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Revision reason is required',
      });
    }

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const payrollObjectId = new ObjectId(id);

    const payroll = await db.collection('payrolls').findOne({
      _id: payrollObjectId,
      tenantId: tenantObjectId,
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    if (payroll.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Only APPROVED payroll can be revised by this endpoint',
      });
    }

    const nextPeriod = {
      month: parseInt(period?.month ?? payroll.period?.month, 10),
      year: parseInt(period?.year ?? payroll.period?.year, 10),
    };

    const nextBase = baseSalary !== undefined ? normalizeMoney(baseSalary) : normalizeMoney(payroll.baseSalary);
    const nextAllowances = Array.isArray(allowances) ? allowances : (payroll.allowances || []);
    const nextDeductions = Array.isArray(deductions) ? deductions : (payroll.deductions || []);

    const allowancesTotal = sumAmount(nextAllowances);
    const deductionsTotal = sumAmount(nextDeductions);
    const netSalary = nextBase + allowancesTotal - deductionsTotal;

    const now = new Date();

    const newDoc = {
      tenantId: tenantObjectId,
      employeeId: payroll.employeeId,
      period: nextPeriod,
      baseSalary: nextBase,
      allowances: nextAllowances,
      deductions: nextDeductions,
      allowancesTotal,
      deductionsTotal,
      netSalary,
      status,
      approvedAt: approvedAt ? new Date(approvedAt) : now,
      createdAt: now,
      createdBy: new ObjectId(userId),
      revisionOf: payroll.revisionOf || payroll._id,
      revisedFrom: payroll._id,
      revisedAt: now,
      revisedBy: new ObjectId(userId),
      reviseReason: String(reason).trim(),
      isSuperseded: false,
      supersededBy: null,
      updatedAt: now,
      updatedBy: new ObjectId(userId),
    };

    const insertResult = await db.collection('payrolls').insertOne(newDoc);

    await db.collection('payrolls').updateOne(
      { _id: payroll._id, tenantId: tenantObjectId },
      {
        $set: {
          isSuperseded: true,
          supersededBy: insertResult.insertedId,
          updatedAt: now,
          updatedBy: new ObjectId(userId),
        },
      }
    );

    await db.collection('payroll_audits').insertOne({
      tenantId: tenantObjectId,
      payrollId: payroll._id,
      action: 'REVISE_SOURCE',
      performedBy: new ObjectId(userId),
      performedAt: now,
      reason: String(reason).trim(),
      previousValues: {
        period: payroll.period,
        baseSalary: payroll.baseSalary,
        allowances: payroll.allowances || [],
        deductions: payroll.deductions || [],
        status: payroll.status,
      },
      nextValues: {
        supersededBy: insertResult.insertedId,
      },
    });

    await db.collection('payroll_audits').insertOne({
      tenantId: tenantObjectId,
      payrollId: insertResult.insertedId,
      action: 'REVISE_CREATE',
      performedBy: new ObjectId(userId),
      performedAt: now,
      reason: String(reason).trim(),
      previousValues: {
        revisedFrom: payroll._id,
      },
      nextValues: {
        period: nextPeriod,
        baseSalary: nextBase,
        allowances: nextAllowances,
        deductions: nextDeductions,
        status,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: insertResult.insertedId.toString(),
      },
      message: 'Payroll revised successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
