import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Thiếu thông tin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Email hoặc password không đúng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               tenantId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token mới
 *       401:
 *         description: Token không hợp lệ
 */
router.post('/refresh-token', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = new ObjectId(req.user.userId);
    const user = await db.collection('users').findOne({ _id: userId });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      role: user.role
    });

    res.json({ success: true, data: { token } });
  } catch (error) {
    next(error);
  }
});

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
