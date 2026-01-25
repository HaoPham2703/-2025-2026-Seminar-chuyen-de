/**
 * Script kiểm tra và tạo employees mẫu
 * 
 * Usage:
 * node scripts/check-employees.js
 */

import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import { closeDatabase, connectDatabase, getDatabase } from '../config/database.js';

dotenv.config();

/**
 * Kiểm tra và hiển thị thông tin employees
 */
async function checkEmployees(db, tenantId) {
  console.log('\n📊 Checking employees...');
  
  const tenantIdObjectId = new ObjectId(tenantId);
  
  // Đếm tổng số employees
  const totalEmployees = await db.collection('employees').countDocuments({
    tenantId: tenantIdObjectId
  });
  
  console.log(`   Total employees in tenant: ${totalEmployees}`);
  
  // Đếm active employees
  const activeEmployees = await db.collection('employees').countDocuments({
    tenantId: tenantIdObjectId,
    'employment.status': 'ACTIVE'
  });
  
  console.log(`   Active employees: ${activeEmployees}`);
  
  // Lấy danh sách employees
  const employees = await db.collection('employees').find({
    tenantId: tenantIdObjectId
  }).toArray();
  
  if (employees.length > 0) {
    console.log('\n📋 Employee List:');
    employees.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.employeeId} - ${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`);
      console.log(`      Status: ${emp.employment?.status || 'N/A'}`);
      console.log(`      Department: ${emp.employment?.department || 'N/A'}`);
      console.log(`      User ID: ${emp.userId?.toString() || 'N/A'}`);
    });
  } else {
    console.log('   ⚠️  No employees found!');
  }
  
  return { totalEmployees, activeEmployees, employees };
}

/**
 * Tạo employee record cho admin user nếu chưa có
 */
async function createEmployeeForAdmin(db, tenantId, userId) {
  console.log('\n👤 Checking admin employee record...');
  
  const tenantIdObjectId = new ObjectId(tenantId);
  const userIdObjectId = new ObjectId(userId);
  
  // Kiểm tra đã có employee record chưa
  const existingEmployee = await db.collection('employees').findOne({
    tenantId: tenantIdObjectId,
    userId: userIdObjectId
  });
  
  if (existingEmployee) {
    console.log('   ✅ Admin already has employee record');
    console.log(`      Employee ID: ${existingEmployee.employeeId}`);
    console.log(`      Status: ${existingEmployee.employment?.status || 'N/A'}`);
    return existingEmployee;
  }
  
  // Lấy user info
  const user = await db.collection('users').findOne({
    _id: userIdObjectId,
    tenantId: tenantIdObjectId
  });
  
  if (!user) {
    console.log('   ❌ User not found');
    return null;
  }
  
  console.log('   ⚠️  Admin user does not have employee record');
  console.log('   Creating employee record for admin...');
  
  // Đếm employees để tạo employeeId
  const employeeCount = await db.collection('employees').countDocuments({
    tenantId: tenantIdObjectId
  });
  const employeeId = `EMP-${String(employeeCount + 1).padStart(3, '0')}`;
  
  // Lấy tenant để tạo QR code
  const tenant = await db.collection('tenants').findOne({
    _id: tenantIdObjectId
  });
  
  const now = new Date();
  const qrCode = `QR-${tenant?.subdomain || 'TENANT'}-${employeeId}-${now.getFullYear()}`;
  
  const employeeData = {
    tenantId: tenantIdObjectId,
    userId: userIdObjectId,
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
  
  const result = await db.collection('employees').insertOne(employeeData);
  const newEmployee = await db.collection('employees').findOne({ _id: result.insertedId });
  
  console.log('   ✅ Created employee record for admin');
  console.log(`      Employee ID: ${newEmployee.employeeId}`);
  console.log(`      Status: ${newEmployee.employment.status}`);
  
  return newEmployee;
}

/**
 * Tạo employees mẫu để test
 */
async function createSampleEmployees(db, tenantId) {
  console.log('\n👥 Creating sample employees...');
  
  const tenantIdObjectId = new ObjectId(tenantId);
  
  // Kiểm tra đã có employees chưa
  const existingCount = await db.collection('employees').countDocuments({
    tenantId: tenantIdObjectId
  });
  
  // Tạo employees mẫu nếu có ít hơn 3 employees (chỉ có admin)
  const MIN_EMPLOYEES = 3;
  if (existingCount >= MIN_EMPLOYEES) {
    console.log(`   ℹ️  Already have ${existingCount} employee(s). Skipping sample creation.`);
    return;
  }
  
  console.log(`   ℹ️  Only ${existingCount} employee(s) found. Creating sample employees...`);
  
  const now = new Date();
  const tenant = await db.collection('tenants').findOne({
    _id: tenantIdObjectId
  });
  
  const sampleEmployees = [
    {
      firstName: 'Nguyễn',
      lastName: 'Văn A',
      email: 'employee1@example.com',
      department: 'IT',
      position: 'Developer'
    },
    {
      firstName: 'Trần',
      lastName: 'Thị B',
      email: 'employee2@example.com',
      department: 'HR',
      position: 'HR Manager'
    },
    {
      firstName: 'Lê',
      lastName: 'Văn C',
      email: 'employee3@example.com',
      department: 'Sales',
      position: 'Sales Executive'
    }
  ];
  
  // Lấy số lượng employees hiện có để tạo employeeId không trùng
  const currentEmployeeCount = await db.collection('employees').countDocuments({
    tenantId: tenantIdObjectId
  });
  
  // Tạo users và employees
  for (let i = 0; i < sampleEmployees.length; i++) {
    const sample = sampleEmployees[i];
    // Tạo employeeId bắt đầu từ số lượng hiện có + 1
    const employeeId = `EMP-${String(currentEmployeeCount + i + 1).padStart(3, '0')}`;
    const qrCode = `QR-${tenant?.subdomain || 'TENANT'}-${employeeId}-${now.getFullYear()}`;
    
    // Tạo user (chỉ tạo nếu email chưa tồn tại)
    let user = await db.collection('users').findOne({
      email: sample.email,
      tenantId: tenantIdObjectId
    });
    
    if (!user) {
      // Note: Trong thực tế, cần hash password. Ở đây chỉ tạo để test
      const userData = {
        tenantId: tenantIdObjectId,
        email: sample.email,
        password: 'hashed_password_here', // Không thể login được, chỉ để test
        role: 'EMPLOYEE',
        profile: {
          firstName: sample.firstName,
          lastName: sample.lastName,
          phone: null,
          avatar: null
        },
        isActive: true,
        lastLogin: null,
        createdAt: now,
        updatedAt: now
      };
      
      const userResult = await db.collection('users').insertOne(userData);
      user = await db.collection('users').findOne({ _id: userResult.insertedId });
    }
    
    // Tạo employee
    const employeeData = {
      tenantId: tenantIdObjectId,
      userId: user._id,
      employeeId,
      personalInfo: {
        firstName: sample.firstName,
        lastName: sample.lastName,
        phone: null,
        email: sample.email,
        address: {
          street: null,
          city: null,
          province: null
        },
        emergencyContact: null
      },
      employment: {
        position: sample.position,
        department: sample.department,
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
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
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
    console.log(`   ✅ Created: ${sample.firstName} ${sample.lastName} (${employeeId})`);
  }
  
  console.log(`   ✅ Created ${sampleEmployees.length} sample employees`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🔍 Employee Checker\n');
    console.log('='.repeat(50));
    
    // Connect to database
    await connectDatabase();
    const db = getDatabase();
    
    // Lấy tenant mặc định
    const tenant = await db.collection('tenants').findOne({
      subdomain: 'default'
    });
    
    if (!tenant) {
      console.log('❌ Default tenant not found. Please run create-admin.js first.');
      process.exit(1);
    }
    
    console.log(`Tenant: ${tenant.name} (${tenant._id.toString()})`);
    
    // Kiểm tra employees
    const { totalEmployees, activeEmployees } = await checkEmployees(db, tenant._id.toString());
    
    // Tìm admin user
    const adminUser = await db.collection('users').findOne({
      tenantId: tenant._id,
      role: { $in: ['TENANT_ADMIN', 'SUPER_ADMIN'] }
    });
    
    if (adminUser) {
      console.log(`\n👤 Admin User: ${adminUser.email}`);
      await createEmployeeForAdmin(db, tenant._id.toString(), adminUser._id.toString());
    }
    
    // Tạo employees mẫu nếu có ít hơn 3 employees (chỉ có admin hoặc không có)
    const MIN_EMPLOYEES = 3;
    if (totalEmployees < MIN_EMPLOYEES) {
      console.log(`\n⚠️  Only ${totalEmployees} employee(s) found. Creating sample employees...`);
      await createSampleEmployees(db, tenant._id.toString());
      
      // Kiểm tra lại
      await checkEmployees(db, tenant._id.toString());
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Check completed!');
    console.log('\n💡 You can now send notifications from Postman.');
    
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
