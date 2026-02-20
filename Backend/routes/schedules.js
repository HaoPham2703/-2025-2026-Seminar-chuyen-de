import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// All routes require auth + tenant isolation
router.use(authenticateToken);
router.use(tenantIsolation);

/**
 * GET /api/schedules
 * Query: employeeId? (string)
 * Trả về danh sách schedule theo tenant, có thể filter theo employee
 */
router.get('/', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { employeeId } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const query = { tenantId: tenantObjectId };
    if (employeeId) {
      query.employeeId = new ObjectId(String(employeeId));
    }

    const schedules = await db
      .collection('schedules')
      .find(query)
      .sort({ 'meta.updatedAt': -1 })
      .toArray();

    res.json({
      success: true,
      data: {
        schedules: schedules.map((s) => ({
          id: s._id.toString(),
          employeeId: s.employeeId?.toString() || null,
          startTime: s.startTime,
          endTime: s.endTime,
          recurrence: s.recurrence || null,
          meta: s.meta || null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper: insert schedule change log
 */
async function insertScheduleLog(db, { tenantId, employeeId, changedBy, before, after, reason }) {
  const now = new Date();
  await db.collection('scheduleChangeLogs').insertOne({
    tenantId,
    employeeId,
    changedBy,
    before,
    after,
    reason: reason || null,
    changedAt: now,
  });
}

/**
 * POST /api/schedules
 * Tạo schedule mới cho 1 employee
 * Body: { employeeId, startTime, endTime, recurrence?, reason? }
 */
router.post('/', async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { employeeId, startTime, endTime, recurrence, reason } = req.body;
    const db = getDatabase();

    if (!employeeId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, startTime and endTime are required',
      });
    }

    const tenantObjectId = new ObjectId(tenantId);
    const employeeObjectId = new ObjectId(employeeId);

    // Basic validation for HH:MM format
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'startTime and endTime must be in HH:MM format',
      });
    }

    const now = new Date();
    const doc = {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      startTime,
      endTime,
      recurrence: recurrence || {
        isActive: true,
        daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      },
      meta: {
        createdBy: new ObjectId(userId),
        createdAt: now,
        updatedBy: new ObjectId(userId),
        updatedAt: now,
      },
    };

    const result = await db.collection('schedules').insertOne(doc);

    await insertScheduleLog(db, {
      tenantId: tenantObjectId,
      employeeId: employeeObjectId,
      changedBy: new ObjectId(userId),
      before: null,
      after: {
        startTime,
        endTime,
        recurrence: doc.recurrence,
      },
      reason,
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
 * PUT /api/schedules/:id
 * Cập nhật schedule (giờ làm) của 1 record
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const { startTime, endTime, recurrence, reason } = req.body;
    const db = getDatabase();

    const tenantObjectId = new ObjectId(tenantId);
    const scheduleId = new ObjectId(id);

    const existing = await db.collection('schedules').findOne({
      _id: scheduleId,
      tenantId: tenantObjectId,
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    const update = {};
    if (startTime !== undefined) update.startTime = startTime;
    if (endTime !== undefined) update.endTime = endTime;
    if (recurrence !== undefined) update.recurrence = recurrence;

    const now = new Date();

    await db.collection('schedules').updateOne(
      { _id: scheduleId, tenantId: tenantObjectId },
      {
        $set: {
          ...update,
          'meta.updatedBy': new ObjectId(userId),
          'meta.updatedAt': now,
        },
      }
    );

    const updated = await db.collection('schedules').findOne({
      _id: scheduleId,
      tenantId: tenantObjectId,
    });

    await insertScheduleLog(db, {
      tenantId: tenantObjectId,
      employeeId: updated.employeeId,
      changedBy: new ObjectId(userId),
      before: {
        startTime: existing.startTime,
        endTime: existing.endTime,
        recurrence: existing.recurrence,
      },
      after: {
        startTime: updated.startTime,
        endTime: updated.endTime,
        recurrence: updated.recurrence,
      },
      reason,
    });

    res.json({
      success: true,
      data: {
        id: updated._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/schedules/logs
 * Query: employeeId? (string)
 * Lấy lịch sử thay đổi giờ làm
 */
router.get('/logs', async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { employeeId, limit = 50 } = req.query;
    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);

    const query = { tenantId: tenantObjectId };
    if (employeeId) {
      query.employeeId = new ObjectId(String(employeeId));
    }

    const logs = await db
      .collection('scheduleChangeLogs')
      .find(query)
      .sort({ changedAt: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          id: log._id.toString(),
          employeeId: log.employeeId?.toString() || null,
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

export default router;

