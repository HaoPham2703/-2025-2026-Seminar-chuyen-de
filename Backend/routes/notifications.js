import express from 'express';
import { ObjectId } from 'mongodb';
import { ROLES } from '../config/constants.js';
import { getDatabase } from '../config/database.js';
import { getSocketIO } from '../config/socket.js';
import { authenticateToken, requireRole, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateToken);
router.use(tenantIsolation);

/**
 * POST /api/notifications/send
 * Admin gửi notification cho nhân viên
 * Required role: TENANT_ADMIN, SUPER_ADMIN
 */
router.post('/send', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { userId, tenantId, role } = req.user;
    // Mặc định: gửi cho tất cả employees khi targetAudience là 'ALL', chỉ ACTIVE cho các trường hợp khác
    const { title, message, type, priority, targetAudience, targetDepartment, targetEmployeeIds, includeInactive, broadcastAllTenants } = req.body;
    const shouldIncludeInactive = includeInactive !== undefined ? includeInactive : (targetAudience === 'ALL');

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    if (!type || !['ANNOUNCEMENT', 'ATTENDANCE', 'LEAVE', 'SYSTEM', 'URGENT'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }

    if (!priority || !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority'
      });
    }

    if (!targetAudience || !['ALL', 'DEPARTMENT', 'SPECIFIC'].includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target audience'
      });
    }

    const db = getDatabase();
    const now = new Date();

    const isBroadcast = !!broadcastAllTenants;
    if (isBroadcast && role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to broadcast to all tenants'
      });
    }

    const tenantIdObjectId = new ObjectId(tenantId);
    const senderIdObjectId = new ObjectId(userId);

    // Debug: Kiểm tra tổng số employees trong tenant
    const totalEmployeesInTenant = await db.collection('employees').countDocuments({
      ...(isBroadcast ? {} : { tenantId: tenantIdObjectId })
    });
    console.log(`[Notification] Total employees${isBroadcast ? ' (all tenants)' : ' in tenant ' + tenantId}: ${totalEmployeesInTenant}`);

    const activeEmployeesInTenant = await db.collection('employees').countDocuments({
      ...(isBroadcast ? {} : { tenantId: tenantIdObjectId }),
      'employment.status': 'ACTIVE'
    });
    console.log(`[Notification] Active employees${isBroadcast ? ' (all tenants)' : ' in tenant ' + tenantId}: ${activeEmployeesInTenant}`);
    console.log(`[Notification] Include inactive employees: ${shouldIncludeInactive}`);

    // Tìm employees để gửi notification
    let employees = [];
    let query = isBroadcast ? {} : { tenantId: tenantIdObjectId };
    
    // Nếu shouldIncludeInactive = false, chỉ lấy ACTIVE employees
    if (!shouldIncludeInactive) {
      query['employment.status'] = 'ACTIVE';
    }
    
    if (targetAudience === 'ALL') {
      // Gửi cho tất cả employees trong tenant (mặc định bao gồm cả inactive)
      employees = await db.collection('employees').find(query).toArray();
      console.log(`[Notification] Found ${employees.length} employees for ALL audience (includeInactive: ${shouldIncludeInactive})`);
      
      // Log chi tiết về employees tìm được
      if (employees.length > 0) {
        console.log(`[Notification] Employees details:`);
        employees.forEach((emp, idx) => {
          console.log(`  ${idx + 1}. ${emp.employeeId || 'N/A'} - ${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`);
          console.log(`     Status: ${emp.employment?.status || 'N/A'}`);
          console.log(`     Has userId: ${emp.userId ? 'Yes (' + emp.userId.toString() + ')' : 'No ❌'}`);
          console.log(`     TenantId: ${emp.tenantId?.toString() || 'N/A'}`);
        });
      }
    } else if (targetAudience === 'DEPARTMENT') {
      if (!targetDepartment) {
        return res.status(400).json({
          success: false,
          message: 'targetDepartment is required when targetAudience is DEPARTMENT'
        });
      }
      query['employment.department'] = targetDepartment;
      employees = await db.collection('employees').find(query).toArray();
      console.log(`[Notification] Found ${employees.length} employees in department ${targetDepartment} (includeInactive: ${shouldIncludeInactive})`);
    } else if (targetAudience === 'SPECIFIC') {
      if (!targetEmployeeIds || !Array.isArray(targetEmployeeIds) || targetEmployeeIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'targetEmployeeIds is required when targetAudience is SPECIFIC'
        });
      }
      const employeeObjectIds = targetEmployeeIds.map(id => new ObjectId(id));
      query._id = { $in: employeeObjectIds };
      employees = await db.collection('employees').find(query).toArray();
      console.log(`[Notification] Found ${employees.length} employees from ${targetEmployeeIds.length} specified IDs (includeInactive: ${shouldIncludeInactive})`);
    }

    if (employees.length === 0) {
      // Thông báo lỗi chi tiết hơn
      let errorMessage = 'No employees found to send notification';
      if (totalEmployeesInTenant === 0) {
        errorMessage = 'No employees found in this tenant. Please create employees first.';
      } else if (!shouldIncludeInactive && activeEmployeesInTenant === 0) {
        errorMessage = `Found ${totalEmployeesInTenant} employee(s) in tenant, but none have ACTIVE status. Set includeInactive: true to send to all employees.`;
      } else if (targetAudience === 'DEPARTMENT') {
        errorMessage = `No employees found in department "${targetDepartment}". Please check department name${shouldIncludeInactive ? '' : ' or set includeInactive: true'}.`;
      } else if (targetAudience === 'SPECIFIC') {
        errorMessage = `None of the specified employee IDs found${shouldIncludeInactive ? '' : ' with ACTIVE status. Set includeInactive: true to include all'}.`;
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        debug: {
          tenantId: tenantId,
          targetAudience,
          includeInactive: shouldIncludeInactive,
          totalEmployeesInTenant,
          activeEmployeesInTenant,
          targetDepartment: targetAudience === 'DEPARTMENT' ? targetDepartment : undefined,
          targetEmployeeIds: targetAudience === 'SPECIFIC' ? targetEmployeeIds : undefined
        }
      });
    }

    // Tạo recipients array - chỉ lấy employees có userId hợp lệ
    const recipients = [];
    const employeesWithoutUserId = [];
    
    employees.forEach(emp => {
      if (!emp.userId) {
        employeesWithoutUserId.push({
          employeeId: emp._id.toString(),
          employeeIdCode: emp.employeeId || 'N/A',
          name: `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim() || 'N/A'
        });
        console.log(`[Notification] ⚠️  Employee ${emp.employeeId || emp._id.toString()} has no userId, skipping...`);
      } else {
        recipients.push({
          employeeId: emp._id,
          userId: emp.userId,
          read: false,
          readAt: null
        });
      }
    });
    
    if (employeesWithoutUserId.length > 0) {
      console.log(`[Notification] ⚠️  Found ${employeesWithoutUserId.length} employee(s) without userId:`, employeesWithoutUserId);
    }
    
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid employees found to send notification. All employees are missing userId.',
        debug: {
          totalEmployeesFound: employees.length,
          employeesWithoutUserId: employeesWithoutUserId.length,
          employeesWithoutUserIdList: employeesWithoutUserId
        }
      });
    }

    // Tạo notification document
    const notificationData = {
      tenantId: tenantIdObjectId,
      senderId: senderIdObjectId,
      senderRole: req.user.role,
      recipients,
      type,
      title,
      message,
      priority,
      targetAudience,
      targetDepartment: targetDepartment || null,
      targetEmployeeIds: targetAudience === 'SPECIFIC' 
        ? targetEmployeeIds.map(id => new ObjectId(id)) 
        : null,
      metadata: {
        actionUrl: null,
        actionLabel: null,
        imageUrl: null
      },
      sentAt: now,
      expiresAt: null,
      createdAt: now,
      updatedAt: now
    };

    // Lưu vào database
    const result = await db.collection('notifications').insertOne(notificationData);
    const notification = await db.collection('notifications').findOne({ _id: result.insertedId });

    // Gửi real-time notification qua Socket.IO cho từng employee
    const io = getSocketIO();
    recipients.forEach(recipient => {
      io.to(`user:${recipient.userId.toString()}`).emit('new_notification', {
        notificationId: result.insertedId.toString(),
        title,
        message,
        type,
        priority,
        sentAt: now,
        unreadCount: 1 // Sẽ tính lại sau
      });
    });

    res.status(201).json({
      success: true,
      message: `Notification sent to ${recipients.length} employee(s)`,
      data: {
        notificationId: result.insertedId.toString(),
        recipientsCount: recipients.length
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    next(error);
  }
});

/**
 * GET /api/notifications
 * Employee lấy danh sách notifications của mình
 */
router.get('/', async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const { page = 1, limit = 20 } = req.query;
    const unreadOnly = req.query.unreadOnly === 'true' ? 'true' : 'false';
    
    const db = getDatabase();
    const tenantIdObjectId = new ObjectId(tenantId);
    const userIdObjectId = new ObjectId(userId);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Tìm employee của user
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

    // Build query - Lấy notifications cho employee này
    // Hỗ trợ filter theo read status: unreadOnly=true (chưa đọc), unreadOnly=false (tất cả)
    
    const query = {
      tenantId: tenantIdObjectId,
      'recipients.employeeId': employee._id
    };
    
    // Nếu chỉ lấy chưa đọc, thêm điều kiện read: false
    if (unreadOnly === 'true') {
      query.recipients = { $elemMatch: { employeeId: employee._id, read: false } };
    }
    
    console.log('🔍 Query for notifications:', {
      employeeId: employee._id.toString(),
      unreadOnly,
      query: JSON.stringify(query)
    });

    // Lấy notifications (chỉ những cái chưa đọc)
    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    console.log('🔍 Raw notifications from query:', {
      count: notifications.length,
      notifications: notifications.map(n => {
        const recipient = n.recipients.find(r => 
          r.employeeId.toString() === employee._id.toString()
        );
        return {
          id: n._id.toString(),
          title: n.title,
          recipient: recipient ? {
            employeeId: recipient.employeeId.toString(),
            read: recipient.read,
            readAt: recipient.readAt
          } : 'no recipient',
          allRecipients: n.recipients.map(r => ({
            employeeId: r.employeeId.toString(),
            read: r.read
          }))
        };
      })
    });

    // Format response với thông tin read status của employee này
    // Trả về tất cả notifications (nếu unreadOnly=false) hoặc chỉ chưa đọc (nếu unreadOnly=true)
    const formattedNotifications = notifications
      .map(notif => {
        const recipient = notif.recipients.find(r => 
          r.employeeId.toString() === employee._id.toString()
        );
        // Chỉ trả về notification nếu employee này là recipient
        if (!recipient) {
          return null;
        }
        // Nếu unreadOnly=true, chỉ trả về notifications chưa đọc
        if (unreadOnly === 'true' && recipient.read === true) {
          return null;
        }
        return {
          id: notif._id.toString(),
          senderId: notif.senderId.toString(),
          senderRole: notif.senderRole,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          priority: notif.priority,
          read: recipient.read || false,
          readAt: recipient.readAt || null,
          sentAt: notif.sentAt,
          metadata: notif.metadata
        };
      })
      .filter(notif => notif !== null);

    // Đếm tổng số notifications
    const total = await db.collection('notifications').countDocuments(query);
    
    // Tính unreadCount từ database (tất cả notifications, không chỉ trong response)
    // Chỉ đếm notifications có recipients[].read: false cho employee hiện tại
    const unreadCount = await db.collection('notifications').countDocuments({
      tenantId: tenantIdObjectId,
      recipients: { $elemMatch: { employeeId: employee._id, read: false } }
    });
    
    // Debug: Log để kiểm tra
    console.log('📊 Notification response:', {
      employeeId: employee._id.toString(),
      queryResult: notifications.length,
      formattedCount: formattedNotifications.length,
      unreadCount,
      returnedNotifications: formattedNotifications.map(n => ({
        id: n.id,
        title: n.title,
        read: n.read
      }))
    });

    res.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    next(error);
  }
});

/**
 * GET /api/notifications/unread-count
 * Lấy số notifications chưa đọc
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const db = getDatabase();
    const tenantIdObjectId = new ObjectId(tenantId);
    const userIdObjectId = new ObjectId(userId);

    // Tìm employee
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

    // Đếm unread notifications
    const unreadCount = await db.collection('notifications').countDocuments({
      tenantId: tenantIdObjectId,
      recipients: { $elemMatch: { employeeId: employee._id, read: false } }
    });

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    next(error);
  }
});

/**
 * PUT /api/notifications/:id/read
 * Đánh dấu notification là đã đọc
 * Xóa recipient của employee hiện tại khỏi array recipients (không xóa notification)
 */
router.put('/:id/read', async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const { id } = req.params;
    
    const db = getDatabase();
    const tenantIdObjectId = new ObjectId(tenantId);
    const userIdObjectId = new ObjectId(userId);
    const notificationIdObjectId = new ObjectId(id);

    // Tìm employee
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

    // Cập nhật read: true và readAt (KHÔNG xóa recipient, chỉ cập nhật)
    const now = new Date();
    const result = await db.collection('notifications').updateOne(
      {
        _id: notificationIdObjectId,
        tenantId: tenantIdObjectId,
        'recipients.employeeId': employee._id
      },
      {
        $set: {
          'recipients.$.read': true,
          'recipients.$.readAt': now,
          updatedAt: now
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(error);
  }
});

/**
 * PUT /api/notifications/read-all
 * Đánh dấu tất cả notifications là đã đọc
 * Xóa tất cả recipients của employee hiện tại khỏi tất cả notifications (không xóa notifications)
 */
router.put('/read-all', async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const db = getDatabase();
    const tenantIdObjectId = new ObjectId(tenantId);
    const userIdObjectId = new ObjectId(userId);

    // Tìm employee
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

    // Cập nhật tất cả unread notifications thành read: true (KHÔNG xóa recipient)
    const now = new Date();
    const result = await db.collection('notifications').updateMany(
      {
        tenantId: tenantIdObjectId,
        'recipients.employeeId': employee._id,
        'recipients.read': false
      },
      {
        $set: {
          'recipients.$[elem].read': true,
          'recipients.$[elem].readAt': now,
          updatedAt: now
        }
      },
      {
        arrayFilters: [{ 'elem.employeeId': employee._id, 'elem.read': false }]
      }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notification(s) as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    next(error);
  }
});

/**
 * DELETE /api/notifications/:id
 * Employee xóa notification của mình
 * Xóa recipient của employee hiện tại khỏi array recipients (không xóa notification)
 * Notification vẫn tồn tại cho các recipients khác
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const { id } = req.params;
    
    const db = getDatabase();
    const tenantIdObjectId = new ObjectId(tenantId);
    const userIdObjectId = new ObjectId(userId);
    const notificationIdObjectId = new ObjectId(id);

    // Tìm employee
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

    // Xóa recipient khỏi notification (không xóa notification, chỉ xóa recipient)
    const result = await db.collection('notifications').updateOne(
      {
        _id: notificationIdObjectId,
        tenantId: tenantIdObjectId
      },
      {
        $pull: {
          recipients: { employeeId: employee._id }
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    next(error);
  }
});

/**
 * GET /api/notifications/sent
 * Admin xem notifications đã gửi
 */
router.get('/sent', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const { page = 1, limit = 20 } = req.query;
    
    const db = getDatabase();
    const tenantIdObjectId = new ObjectId(tenantId);
    const senderIdObjectId = new ObjectId(userId);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await db.collection('notifications')
      .find({
        tenantId: tenantIdObjectId,
        senderId: senderIdObjectId
      })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection('notifications').countDocuments({
      tenantId: tenantIdObjectId,
      senderId: senderIdObjectId
    });

    const formattedNotifications = notifications.map(notif => ({
      id: notif._id.toString(),
      type: notif.type,
      title: notif.title,
      message: notif.message,
      priority: notif.priority,
      targetAudience: notif.targetAudience,
      recipientsCount: notif.recipients.length,
      sentAt: notif.sentAt
    }));

    res.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting sent notifications:', error);
    next(error);
  }
});

export default router;
