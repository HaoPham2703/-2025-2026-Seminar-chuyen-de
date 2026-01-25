import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Đăng nhập
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const db = getDatabase();
    
    // Tìm user theo email và tenantId (nếu có)
    const query = { email, isActive: true };
    if (tenantId) {
      query.tenantId = new ObjectId(tenantId);
    }

    const user = await db.collection('users').findOne(query);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    // Kiểm tra nếu user có password (có thể là seed data cũ không có password)
    if (user.password) {
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
    } else {
      // Nếu user không có password (seed data cũ), cho phép login với bất kỳ password nào
      // Hoặc có thể yêu cầu user đổi password lần đầu
      console.warn('User has no password set:', user.email);
    }

    // Lấy tenant info
    const tenant = await db.collection('tenants').findOne({ 
      _id: user.tenantId 
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tenant not found or inactive'
      });
    }

    // Lấy employee info nếu là employee
    let employee = null;
    if (user.role === 'EMPLOYEE') {
      employee = await db.collection('employees').findOne({
        userId: user._id,
        tenantId: user.tenantId
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      role: user.role
    });

    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          profile: user.profile,
          tenant: {
            id: tenant._id.toString(),
            name: tenant.name,
            features: tenant.features
          },
          employee: employee ? {
            id: employee._id.toString(),
            employeeId: employee.employeeId,
            qrCode: employee.qrCode
          } : null
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/signup
 * Đăng ký tài khoản mới
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, tenantId } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const db = getDatabase();

    // Kiểm tra email đã tồn tại chưa
    const emailQuery = { email };
    if (tenantId) {
      emailQuery.tenantId = new ObjectId(tenantId);
    }

    const existingUser = await db.collection('users').findOne(emailQuery);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Lấy tenant (mặc định hoặc từ request)
    let tenant;
    if (tenantId) {
      tenant = await db.collection('tenants').findOne({ 
        _id: new ObjectId(tenantId),
        status: 'ACTIVE'
      });
    } else {
      // Nếu không có tenantId, lấy tenant đầu tiên (hoặc có thể tạo tenant mới)
      tenant = await db.collection('tenants').findOne({ status: 'ACTIVE' });
    }

    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'No active tenant found. Please contact administrator.'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Tạo user mới
    const now = new Date();
    const userData = {
      tenantId: tenant._id,
      email,
      password: hashedPassword,
      role: 'EMPLOYEE', // Mặc định là employee
      profile: {
        firstName,
        lastName,
        phone: phone || null,
        avatar: null
      },
      isActive: true,
      lastLogin: null,
      createdAt: now,
      updatedAt: now
    };

    const userResult = await db.collection('users').insertOne(userData);
    const newUser = userResult.insertedId;

    // Tạo employee record
    // Generate employee ID
    const employeeCount = await db.collection('employees').countDocuments({
      tenantId: tenant._id
    });
    const employeeId = `EMP-${String(employeeCount + 1).padStart(3, '0')}`;

    // Generate QR code
    const qrCode = `QR-${tenant.subdomain || 'TENANT'}-${employeeId}-${new Date().getFullYear()}`;

    const employeeData = {
      tenantId: tenant._id,
      userId: newUser,
      employeeId,
      personalInfo: {
        firstName,
        lastName,
        phone: phone || null,
        email,
        address: {
          street: null,
          city: null,
          province: null
        },
        emergencyContact: null
      },
      employment: {
        position: 'Employee',
        department: 'General',
        employmentType: 'FULL_TIME',
        hireDate: now,
        terminationDate: null,
        status: 'ACTIVE',
        baseSalary: null,
        currency: 'VND'
      },
      qrCode: {
        code: qrCode,
        qrImageUrl: null,
        generatedAt: now,
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true
      },
      statistics: {
        totalWorkingDays: 0,
        totalHours: 0,
        lateCount: 0,
        absentCount: 0,
        overtimeHours: 0,
        onTimeRate: 0
      },
      createdAt: now,
      updatedAt: now
    };

    await db.collection('employees').insertOne(employeeData);

    // Update user profile với employeeId
    await db.collection('users').updateOne(
      { _id: newUser },
      { $set: { 'profile.employeeId': employeeId } }
    );

    // Generate JWT token
    const token = generateToken({
      userId: newUser.toString(),
      tenantId: tenant._id.toString(),
      email,
      role: 'EMPLOYEE'
    });

    // Lấy user đã tạo với employee info
    const createdUser = await db.collection('users').findOne({ _id: newUser });
    const createdEmployee = await db.collection('employees').findOne({
      userId: newUser,
      tenantId: tenant._id
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: createdUser._id.toString(),
          email: createdUser.email,
          role: createdUser.role,
          profile: createdUser.profile,
          tenant: {
            id: tenant._id.toString(),
            name: tenant.name,
            features: tenant.features
          },
          employee: {
            id: createdEmployee._id.toString(),
            employeeId: createdEmployee.employeeId,
            qrCode: createdEmployee.qrCode
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = new ObjectId(req.user.userId);

    const user = await db.collection('users').findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Lấy employee info nếu là employee
    let employee = null;
    if (user.role === 'EMPLOYEE') {
      employee = await db.collection('employees').findOne({
        userId: user._id,
        tenantId: user.tenantId
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          profile: user.profile,
          tenant: {
            id: req.tenant._id.toString(),
            name: req.tenant.name,
            features: req.tenant.features
          },
          employee: employee ? {
            id: employee._id.toString(),
            employeeId: employee.employeeId,
            qrCode: employee.qrCode
          } : null
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
