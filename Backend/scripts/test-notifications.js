/**
 * Script test notifications API
 * 
 * Usage:
 * 1. Đảm bảo Backend server đang chạy (npm run dev)
 * 2. Chạy: node scripts/test-notifications.js
 * 
 * Lưu ý: 
 * - Cần Node.js 18+ (có fetch built-in)
 * - Hoặc cài node-fetch: npm install node-fetch@2
 * - Cần có JWT token từ admin account để test
 */

// Sử dụng fetch native (Node.js 18+) hoặc node-fetch
let fetch;
try {
  // Thử dùng fetch native trước
  fetch = globalThis.fetch || (await import('node-fetch')).default;
} catch {
  // Fallback: yêu cầu cài node-fetch
  console.error('❌ fetch is not available. Please install node-fetch:');
  console.error('   npm install node-fetch@2');
  process.exit(1);
}

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Thay đổi các giá trị này theo data thực tế của bạn
const ADMIN_EMAIL = 'admin@example.com'; // Email của admin account
const ADMIN_PASSWORD = 'password123'; // Password của admin
const TENANT_ID = null; // null hoặc tenantId nếu cần

/**
 * Step 1: Login để lấy JWT token
 */
async function login() {
  console.log('\n🔐 Step 1: Login as Admin...');
  
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      tenantId: TENANT_ID,
    }),
  });

  const data = await response.json();
  
  if (!data.success || !data.token) {
    console.error('❌ Login failed:', data.message);
    throw new Error('Login failed');
  }

  console.log('✅ Login successful');
  console.log('   User:', data.user.email);
  console.log('   Role:', data.user.role);
  console.log('   Token:', data.token.substring(0, 20) + '...');
  
  return data.token;
}

/**
 * Step 2: Gửi notification
 */
async function sendNotification(token) {
  console.log('\n📤 Step 2: Sending notification...');
  
  const notificationData = {
    title: 'Thông báo test từ script',
    message: 'Đây là thông báo test được gửi từ test script. Nếu bạn nhận được notification này, hệ thống đang hoạt động tốt!',
    type: 'ANNOUNCEMENT',
    priority: 'MEDIUM',
    targetAudience: 'ALL', // 'ALL', 'DEPARTMENT', hoặc 'SPECIFIC'
    // targetDepartment: 'IT', // Nếu targetAudience = 'DEPARTMENT'
    // targetEmployeeIds: ['employeeId1', 'employeeId2'], // Nếu targetAudience = 'SPECIFIC'
  };

  const response = await fetch(`${API_BASE_URL}/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(notificationData),
  });

  const data = await response.json();
  
  if (!data.success) {
    console.error('❌ Failed to send notification:', data.message);
    throw new Error('Failed to send notification');
  }

  console.log('✅ Notification sent successfully');
  console.log('   Notification ID:', data.data.notificationId);
  console.log('   Recipients:', data.data.recipientsCount);
  
  return data.data;
}

/**
 * Step 3: Xem notifications đã gửi (admin)
 */
async function getSentNotifications(token) {
  console.log('\n📋 Step 3: Getting sent notifications...');
  
  const response = await fetch(`${API_BASE_URL}/notifications/sent?page=1&limit=10`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!data.success) {
    console.error('❌ Failed to get sent notifications:', data.message);
    return;
  }

  console.log('✅ Sent notifications retrieved');
  console.log('   Total:', data.data.pagination.total);
  console.log('   Notifications:');
  data.data.notifications.forEach((notif, index) => {
    console.log(`   ${index + 1}. ${notif.title} (${notif.recipientsCount} recipients) - ${new Date(notif.sentAt).toLocaleString('vi-VN')}`);
  });
}

/**
 * Step 4: Test với employee account (lấy notifications)
 */
async function getEmployeeNotifications(employeeToken) {
  console.log('\n👤 Step 4: Getting employee notifications...');
  
  if (!employeeToken) {
    console.log('⚠️  Skipping - no employee token provided');
    return;
  }
  
  const response = await fetch(`${API_BASE_URL}/notifications?page=1&limit=10`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${employeeToken}`,
    },
  });

  const data = await response.json();
  
  if (!data.success) {
    console.error('❌ Failed to get notifications:', data.message);
    return;
  }

  console.log('✅ Employee notifications retrieved');
  console.log('   Total:', data.data.pagination.total);
  console.log('   Unread:', data.data.unreadCount);
  console.log('   Notifications:');
  data.data.notifications.forEach((notif, index) => {
    const readStatus = notif.read ? '✓ Read' : '✗ Unread';
    console.log(`   ${index + 1}. [${readStatus}] ${notif.title} - ${new Date(notif.sentAt).toLocaleString('vi-VN')}`);
  });
}

/**
 * Main test function
 */
async function runTests() {
  try {
    console.log('🚀 Starting Notification System Tests\n');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Admin Email:', ADMIN_EMAIL);
    console.log('='.repeat(50));

    // Step 1: Login as admin
    const adminToken = await login();

    // Step 2: Send notification
    await sendNotification(adminToken);

    // Step 3: Get sent notifications
    await getSentNotifications(adminToken);

    // Step 4: Test with employee (optional)
    // Uncomment và thay đổi credentials nếu muốn test
    // const employeeToken = await loginAsEmployee();
    // await getEmployeeNotifications(employeeToken);

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Mở app trên mobile/emulator');
    console.log('   2. Login với employee account');
    console.log('   3. Kiểm tra notification badge và NotificationCenter');
    console.log('   4. Notification sẽ xuất hiện real-time qua Socket.IO');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
