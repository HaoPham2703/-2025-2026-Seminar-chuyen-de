/**
 * Script để tạo indexes cho MongoDB collections
 * 
 * Usage: node scripts/create-indexes.js
 * 
 * Hoặc chạy trực tiếp trong MongoDB Shell:
 * mongosh < scripts/create-indexes.js
 */

const indexes = `
// Kết nối database
use DACN;

// ============================================
// TENANTS INDEXES
// ============================================
print("Creating Tenants indexes...");
db.tenants.createIndex({ subdomain: 1 }, { unique: true, sparse: true });
db.tenants.createIndex({ organizationType: 1 });
db.tenants.createIndex({ status: 1 });
print("✓ Tenants indexes created");

// ============================================
// USERS INDEXES
// ============================================
print("Creating Users indexes...");
db.users.createIndex({ tenantId: 1, email: 1 }, { unique: true });
db.users.createIndex({ tenantId: 1, role: 1 });
db.users.createIndex({ tenantId: 1, "profile.employeeId": 1 }, { sparse: true });
print("✓ Users indexes created");

// ============================================
// EMPLOYEES INDEXES
// ============================================
print("Creating Employees indexes...");
db.employees.createIndex({ tenantId: 1, employeeId: 1 }, { unique: true });
db.employees.createIndex({ tenantId: 1, userId: 1 }, { unique: true });
db.employees.createIndex({ "qrCode.code": 1 }, { unique: true });
db.employees.createIndex({ tenantId: 1, "employment.status": 1 });
print("✓ Employees indexes created");

// ============================================
// ATTENDANCE INDEXES
// ============================================
print("Creating Attendance indexes...");
db.attendance.createIndex({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });
db.attendance.createIndex({ tenantId: 1, date: 1 });
db.attendance.createIndex({ tenantId: 1, employeeId: 1, date: -1 });
db.attendance.createIndex({ "clockIn.qrCode": 1 });
print("✓ Attendance indexes created");

// ============================================
// SCHEDULES INDEXES
// ============================================
print("Creating Schedules indexes...");
db.schedules.createIndex({ tenantId: 1, employeeId: 1 });
db.schedules.createIndex({ tenantId: 1, "recurrence.startDate": 1, "recurrence.endDate": 1 });
print("✓ Schedules indexes created");

// ============================================
// LEAVE REQUESTS INDEXES
// ============================================
print("Creating LeaveRequests indexes...");
db.leaveRequests.createIndex({ tenantId: 1, employeeId: 1, startDate: -1 });
db.leaveRequests.createIndex({ tenantId: 1, status: 1 });
print("✓ LeaveRequests indexes created");

// ============================================
// REPORTS INDEXES
// ============================================
print("Creating Reports indexes...");
db.reports.createIndex({ tenantId: 1, type: 1, startDate: -1 });
db.reports.createIndex({ tenantId: 1, createdBy: 1 });
print("✓ Reports indexes created");

// ============================================
// NOTIFICATIONS INDEXES
// ============================================
print("Creating Notifications indexes...");
db.notifications.createIndex({ tenantId: 1, sentAt: -1 });
db.notifications.createIndex({ tenantId: 1, senderId: 1, sentAt: -1 });
db.notifications.createIndex({ tenantId: 1, "recipients.employeeId": 1, sentAt: -1 });
db.notifications.createIndex({ tenantId: 1, "recipients.userId": 1, "recipients.read": 1 });
db.notifications.createIndex({ tenantId: 1, type: 1, sentAt: -1 });
print("✓ Notifications indexes created");

print("\\n✅ All indexes created successfully!");
`;

// Lưu vào file
const fs = require('fs');
const path = require('path');
const outputPath = path.join(__dirname, '..', 'database-seed', 'create-indexes.js');

// Tạo thư mục nếu chưa có
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, indexes, 'utf8');
console.log(`✅ Index script created at: ${outputPath}`);
console.log('\nTo run in MongoDB Shell:');
console.log(`  mongosh < ${outputPath}`);
console.log('\nOr copy and paste the content into MongoDB Shell');
