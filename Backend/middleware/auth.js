import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { ROLES } from '../config/constants.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

/**
 * Middleware xác thực JWT token
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token decoded successfully:', { userId: decoded.userId, email: decoded.email });
    } catch (jwtError) {
      if (jwtError.name === 'JsonWebTokenError') {
        console.error('JWT Error:', jwtError.message);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }
      if (jwtError.name === 'TokenExpiredError') {
        console.error('Token expired:', jwtError.message);
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired' 
        });
      }
      throw jwtError;
    }
    
    // Lấy thông tin user từ database
    const db = getDatabase();
    let user;
    try {
      // Validate userId is a valid ObjectId string
      if (!decoded.userId || typeof decoded.userId !== 'string') {
        console.error('Invalid userId in token:', decoded.userId);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token payload' 
        });
      }

      // Check if userId is a valid ObjectId format (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
        console.error('Invalid ObjectId format:', decoded.userId);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token format' 
        });
      }

      const userIdObjectId = new ObjectId(decoded.userId);
      console.log('Looking for user with ID:', decoded.userId);
      
      user = await db.collection('users').findOne({ 
        _id: userIdObjectId,
        isActive: true 
      });
      
      if (!user) {
        console.error('User not found or inactive:', decoded.userId);
        return res.status(401).json({ 
          success: false, 
          message: 'User not found or inactive' 
        });
      }
      console.log('User found:', user.email, 'TenantId:', user.tenantId?.toString());
    } catch (dbError) {
      console.error('Database error when finding user:', dbError);
      console.error('Error details:', {
        message: dbError.message,
        name: dbError.name,
        stack: dbError.stack
      });
      throw dbError;
    }

    // Lấy tenant info
    let tenant;
    try {
      if (!user.tenantId) {
        console.error('User has no tenantId');
        return res.status(403).json({ 
          success: false, 
          message: 'User has no tenant assigned' 
        });
      }

      // Ensure tenantId is ObjectId
      let tenantIdObjectId;
      if (user.tenantId instanceof ObjectId) {
        tenantIdObjectId = user.tenantId;
      } else {
        const tenantIdString = user.tenantId.toString();
        // Validate ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(tenantIdString)) {
          console.error('Invalid tenantId format:', tenantIdString);
          return res.status(403).json({ 
            success: false, 
            message: 'Invalid tenant ID format' 
          });
        }
        tenantIdObjectId = new ObjectId(tenantIdString);
      }
      
      console.log('Looking for tenant with ID:', tenantIdObjectId.toString());
      tenant = await db.collection('tenants').findOne({ 
        _id: tenantIdObjectId 
      });
      
      if (!tenant) {
        console.error('Tenant not found:', tenantIdObjectId.toString());
        return res.status(403).json({ 
          success: false, 
          message: 'Tenant not found' 
        });
      }
      
      if (tenant.status !== 'ACTIVE') {
        console.error('Tenant not active:', tenant.status);
        return res.status(403).json({ 
          success: false, 
          message: 'Tenant not active' 
        });
      }
      console.log('Tenant found:', tenant.name);
    } catch (tenantError) {
      console.error('Database error when finding tenant:', tenantError);
      console.error('Error details:', {
        message: tenantError.message,
        name: tenantError.name,
        stack: tenantError.stack
      });
      throw tenantError;
    }

    // Attach user và tenant info vào request
    req.user = {
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      role: user.role,
      profile: user.profile
    };
    req.tenant = tenant;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Middleware kiểm tra quyền (role-based)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
}

/**
 * Middleware tự động inject tenantId vào query (tenant isolation)
 */
export function tenantIsolation(req, res, next) {
  if (req.user && req.user.tenantId) {
    // Tự động thêm tenantId vào query params nếu chưa có
    if (req.query && !req.query.tenantId) {
      req.query.tenantId = req.user.tenantId;
    }
    // Tự động thêm tenantId vào body nếu chưa có
    if (req.body && !req.body.tenantId) {
      req.body.tenantId = req.user.tenantId;
    }
  }
  next();
}
