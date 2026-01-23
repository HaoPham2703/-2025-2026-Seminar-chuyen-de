/**
 * Script để tách file database-seed-data.json thành các file riêng cho từng collection
 * 
 * Usage: node scripts/split-seed-data.js
 */

const fs = require('fs');
const path = require('path');

// Đọc file JSON gốc
const seedDataPath = path.join(__dirname, '..', 'database-seed-data.json');
const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

// Thư mục output
const outputDir = path.join(__dirname, '..', 'database-seed');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Tách và lưu từng collection
const collections = ['tenants', 'users', 'employees', 'attendance', 'schedules', 'leaveRequests', 'reports'];

collections.forEach(collectionName => {
  if (seedData[collectionName] && seedData[collectionName].length > 0) {
    const filePath = path.join(outputDir, `${collectionName}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(seedData[collectionName], null, 2),
      'utf8'
    );
    console.log(`✓ Created ${filePath} (${seedData[collectionName].length} documents)`);
  } else {
    console.log(`⚠ Skipped ${collectionName} (no data)`);
  }
});

console.log('\n✅ All collection files created successfully!');
console.log(`📁 Output directory: ${outputDir}`);
console.log('\nYou can now import each file separately using:');
console.log('  mongoimport --uri "mongodb://localhost:27017/DACN" --collection <collection> --file database-seed/<collection>.json --jsonArray');
