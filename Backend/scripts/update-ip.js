/**
 * Script tự động detect IP address và cập nhật file .env
 * Chạy script này mỗi khi đổi mạng để tự động cập nhật IP
 * 
 * Usage:
 *   node scripts/update-ip.js
 *   hoặc
 *   npm run update-ip
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');

/**
 * Lấy IP address từ network interfaces
 * Ưu tiên IPv4, loại bỏ loopback và internal addresses
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Chỉ lấy IPv4, không phải internal (127.0.0.1) và không phải loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address,
          // Ưu tiên WiFi/Ethernet hơn các adapter khác
          priority: name.toLowerCase().includes('wifi') || name.toLowerCase().includes('ethernet') ? 1 : 2
        });
      }
    }
  }

  if (addresses.length === 0) {
    return null;
  }

  // Sắp xếp theo priority và trả về IP đầu tiên
  addresses.sort((a, b) => a.priority - b.priority);
  return addresses[0].address;
}

/**
 * Cập nhật file .env với IP mới (tự tạo file nếu chưa tồn tại)
 */
function updateEnvFileAtPath(envPath, ipAddress, { createIfMissing }) {
  if (!fs.existsSync(envPath)) {
    if (!createIfMissing) {
      console.warn(`⚠️  Bỏ qua vì không tìm thấy file: ${envPath}`);
      return;
    }
    fs.writeFileSync(envPath, '', 'utf8');
    console.log(`🆕 Đã tạo file .env mới: ${envPath}`);
  }

  // Đọc file .env
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Tìm và thay thế EXPO_PUBLIC_API_URL
  const apiUrlPattern = /^EXPO_PUBLIC_API_URL=.*$/m;
  const newApiUrl = `EXPO_PUBLIC_API_URL=http://${ipAddress}:3000/api`;
  
  if (apiUrlPattern.test(envContent)) {
    // Thay thế dòng cũ
    envContent = envContent.replace(apiUrlPattern, newApiUrl);
    console.log(`✅ Đã cập nhật EXPO_PUBLIC_API_URL với IP: ${ipAddress}`);
  } else {
    // Thêm dòng mới nếu chưa có
    envContent += `\n${newApiUrl}\n`;
    console.log(`✅ Đã thêm EXPO_PUBLIC_API_URL với IP: ${ipAddress}`);
  }
  
  // Ghi lại file
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`📝 File .env đã được cập nhật: ${envPath}`);
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Đang tìm IP address...\n');
  
  const ipAddress = getLocalIP();
  
  if (!ipAddress) {
    console.error('❌ Không tìm thấy IP address phù hợp!');
    console.log('💡 Đảm bảo bạn đã kết nối mạng (WiFi hoặc Ethernet).');
    process.exit(1);
  }
  
  console.log(`✅ Tìm thấy IP: ${ipAddress}`);
  console.log(`📡 API URL sẽ là: http://${ipAddress}:3000/api\n`);
  
  // Frontend env (Expo) - đây mới là nơi EXPO_PUBLIC_API_URL có tác dụng
  const frontendEnvPath = path.join(projectRoot, 'Frontend', '.env');
  updateEnvFileAtPath(frontendEnvPath, ipAddress, { createIfMissing: true });

  // Backend env - có thể không cần EXPO_PUBLIC_API_URL, nhưng giữ để tương thích cũ (không tạo mới nếu thiếu)
  const backendEnvPath = path.join(projectRoot, 'Backend', '.env');
  updateEnvFileAtPath(backendEnvPath, ipAddress, { createIfMissing: false });
  
  console.log('\n✨ Hoàn tất! Bạn có thể chạy server với IP mới.');
  console.log('💡 Tip: Sau khi cập nhật Frontend/.env, hãy restart Expo dev server để nhận env mới.');
}

// Chạy script
main();
