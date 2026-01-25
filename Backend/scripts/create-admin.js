/**
 * Script tạo tài khoản admin
 * 
 * Usage:
 * node scripts/create-admin.js
 * 
 * Hoặc với custom values:
 * ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=password123 node scripts/create-admin.js
 */

import dotenv from 'dotenv';
import { connectDatabase, closeDatabase, getDatabase } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { ROLES } from '../config/constants.js';
import { ObjectId } from 'mongodb';

dotenv.config();

// Lấy thông tin từ environment variables hoặc dùng giá trị mặc định
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Admin';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'User';
const ADMIN_ROLE = process.env.ADMIN_ROLE || ROLES.TENANT_ADMIN; // TENANT_ADMIN hoặc SUPER_ADMIN
const TENANT_NAME = process.env.TENANT_NAME || 'Default Tenant';
const TENANT_SUBDOMAIN = process.env.TENANT_SUBDOMAIN || 'default';

/**
 * Tạo tenant mặc định nếu chưa có
 */
async function createDefaultTenant(db) {
  console.log('\n🏢 Checking for default tenant...');
  
  // Kiểm tra tenant đã tồn tại chưa
  let tenant = await db.collection('tenants').findOne({
    subdomain: TENANT_SUBDOMAIN
  });

  if (tenant) {
    console.log('✅ Tenant already exists:', tenant.name);
    return tenant;
  }

  // Tạo tenant mới
  const now = new Date();
  const tenantData = {
    name: TENANT_NAME,
    subdomain: TENANT_SUBDOMAIN,
    organizationType: 'COMPANY',
    status: 'ACTIVE',
    features: {
      attendance: true,
      schedule: true,
      leaveManagement: true,
      overtime: true,
      reports: true,
      payroll: false,
    },
    settings: {
      timezone: 'Asia/Ho_Chi_Minh',
      currency: 'VND',
      dateFormat: 'DD/MM/YYYY',
    },
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('tenants').insertOne(tenantData);
  tenant = await db.collection('tenants').findOne({ _id: result.insertedId });
  
  console.log('✅ Created new tenant:', tenant.name);
  console.log('   Tenant ID:', tenant._id.toString());
  
  return tenant;
}

/**
 * Tạo admin user
 */
async function createAdminUser(db, tenant) {
  console.log('\n👤 Creating admin user...');
  
  // Kiểm tra email đã tồn tại chưa
  const existingUser = await db.collection('users').findOne({
    email: ADMIN_EMAIL,
    tenantId: tenant._id
  });

    if (existingUser) {
      console.log('⚠️  User already exists with email:', ADMIN_EMAIL);
      
      // Update password và role nếu cần
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);
      await db.collection('users').updateOne(
        { _id: existingUser._id },
        {
          $set: {
            password: hashedPassword,
            role: ADMIN_ROLE,
            isActive: true,
            updatedAt: new Date(),
          }
        }
      );
      
      console.log('✅ Updated existing user with new password and role');
      
      // Đảm bảo admin có employee record
      await createEmployeeForAdmin(db, tenant, existingUser);
      
      return existingUser;
    }

  // Hash password
  const hashedPassword = await hashPassword(ADMIN_PASSWORD);
  
  // Tạo user mới
  const now = new Date();
  const userData = {
    tenantId: tenant._id,
    email: ADMIN_EMAIL,
    password: hashedPassword,
    role: ADMIN_ROLE,
    profile: {
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      phone: null,
      avatar: null,
    },
    isActive: true,
    lastLogin: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('users').insertOne(userData);
  const user = await db.collection('users').findOne({ _id: result.insertedId });
  
  console.log('✅ Created new admin user');
  console.log('   User ID:', user._id.toString());
  console.log('   Email:', user.email);
  console.log('   Role:', user.role);
  
  // Tạo employee record cho admin
  await createEmployeeForAdmin(db, tenant, user);
  
  return user;
}

/**
 * Tạo employee record cho admin user
 */
async function createEmployeeForAdmin(db, tenant, user) {
  // Kiểm tra đã có employee record chưa
  const existingEmployee = await db.collection('employees').findOne({
    tenantId: tenant._id,
    userId: user._id
  });
  
  if (existingEmployee) {
    console.log('   ℹ️  Admin already has employee record');
    return existingEmployee;
  }
  
  console.log('   👤 Creating employee record for admin...');
  
  // Đếm employees để tạo employeeId
  const employeeCount = await db.collection('employees').countDocuments({
    tenantId: tenant._id
  });
  const employeeId = `EMP-${String(employeeCount + 1).padStart(3, '0')}`;
  
  const now = new Date();
  const qrCode = `QR-${tenant.subdomain || 'TENANT'}-${employeeId}-${now.getFullYear()}`;
  
  const employeeData = {
    tenantId: tenant._id,
    userId: user._id,
    employeeId,
    personalInfo: {
      firstName: user.profile?.firstName || 'Admin',
      lastName: user.profile?.lastName || 'User',
      phone: user.profile?.phone || null,
      email: user.email,
      address: {
        street: null,
        city: null,
        province: null
      },
      emergencyContact: null
    },
    employment: {
      position: 'Administrator',
      department: 'Management',
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
  console.log('   ✅ Created employee record for admin');
  console.log('      Employee ID:', employeeId);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Creating Admin Account\n');
    console.log('='.repeat(50));
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Role:', ADMIN_ROLE);
    console.log('Tenant:', TENANT_NAME);
    console.log('='.repeat(50));

    // Connect to database
    await connectDatabase();
    const db = getDatabase();

    // Tạo tenant nếu chưa có
    const tenant = await createDefaultTenant(db);

    // Tạo admin user
    const user = await createAdminUser(db, tenant);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Admin account created successfully!');
    console.log('\n📋 Login Information:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   Role:', ADMIN_ROLE);
    console.log('   Tenant:', tenant.name);
    console.log('\n💡 You can now login with these credentials in Postman or the app.');
    console.log('\n📝 Example Postman request:');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('   Body: {');
    console.log('     "email": "' + ADMIN_EMAIL + '",');
    console.log('     "password": "' + ADMIN_PASSWORD + '"');
    console.log('   }');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run script
main();
