/**
 * Script seed dữ liệu payroll cho test
 *
 * Usage:
 * node scripts/seed-payrolls.js
 *
 * Chạy từ thư mục Backend: cd Backend && node scripts/seed-payrolls.js
 */

import dotenv from 'dotenv';
import { connectDatabase, closeDatabase, getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';

dotenv.config();

const MONTHS_TO_CREATE = 6; // Tạo payroll cho 6 tháng gần nhất

async function seedPayrolls() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDatabase();
    const db = getDatabase();

    // Lấy danh sách employees
    const employees = await db.collection('employees').find({}).toArray();
    if (employees.length === 0) {
      console.log('❌ No employees found. Please create employees first.');
      return;
    }
    console.log(`✅ Found ${employees.length} employees`);

    // Lấy tenantId từ employee đầu tiên
    const tenantId = employees[0].tenantId;
    console.log(`🏢 Tenant ID: ${tenantId}`);

    // Xóa payrolls cũ để seed lại sạch
    await db.collection('payrolls').deleteMany({ tenantId });
    console.log('🗑️  Cleared existing payrolls');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const insertedIds = [];

    for (const employee of employees) {
      // Tạo payroll cho N tháng gần nhất
      for (let i = 0; i < MONTHS_TO_CREATE; i++) {
        const month = currentMonth - i;
        const year = month > 0 ? currentYear : currentYear - 1;
        const adjustedMonth = month > 0 ? month : month + 12;

        // Lương cơ bản ngẫu nhiên: 8tr - 20tr
        const baseSalary = Math.floor(8000000 + Math.random() * 12000000);

        // Phụ cấp ngẫu nhiên
        const allowances = [];
        if (Math.random() > 0.3) {
          allowances.push({ name: 'Xăng xe', amount: Math.floor(500000 + Math.random() * 500000) });
        }
        if (Math.random() > 0.5) {
          allowances.push({ name: 'Điện thoại', amount: Math.floor(200000 + Math.random() * 300000) });
        }
        if (Math.random() > 0.6) {
          allowances.push({ name: 'Trách nhiệm', amount: Math.floor(1000000 + Math.random() * 1000000) });
        }

        // Khấu trừ ngẫu nhiên
        const deductions = [];
        const insuranceAmount = Math.floor(baseSalary * 0.105);
        deductions.push({ name: 'Bảo hiểm xã hội (8%)', amount: Math.floor(baseSalary * 0.08) });
        deductions.push({ name: 'Bảo hiểm y tế (1.5%)', amount: Math.floor(baseSalary * 0.015) });
        deductions.push({ name: 'Bảo hiểm thất nghiệp (1%)', amount: Math.floor(baseSalary * 0.01) });

        const allowancesTotal = allowances.reduce((sum, a) => sum + a.amount, 0);
        const deductionsTotal = deductions.reduce((sum, d) => sum + d.amount, 0);
        const netSalary = baseSalary + allowancesTotal - deductionsTotal;

        const period = { month: adjustedMonth, year };

        // Kiểm tra đã tồn tại chưa
        const existing = await db.collection('payrolls').findOne({
          tenantId,
          employeeId: employee._id,
          'period.month': adjustedMonth,
          'period.year': year,
        });

        if (existing) {
          console.log(`  ⏭️  Skip: ${employee.personalInfo?.firstName} ${adjustedMonth}/${year} (already exists)`);
          continue;
        }

        const doc = {
          tenantId,
          employeeId: employee._id,
          period,
          baseSalary,
          allowances,
          deductions,
          allowancesTotal,
          deductionsTotal,
          netSalary,
          status: 'APPROVED',
          approvedAt: new Date(year, adjustedMonth - 1, 25),
          createdAt: new Date(year, adjustedMonth - 1, 20),
          createdBy: tenantId,
        };

        const result = await db.collection('payrolls').insertOne(doc);
        insertedIds.push(result.insertedId.toString());

        const fullName = `${employee.personalInfo?.lastName || ''} ${employee.personalInfo?.firstName || ''}`.trim();
        console.log(`  ✅ ${fullName} — ${adjustedMonth}/${year}: base=${baseSalary.toLocaleString('vi-VN')} → net=${netSalary.toLocaleString('vi-VN')}`);
      }
    }

    console.log(`\n🎉 Done! Inserted ${insertedIds.length} payroll records.`);
    console.log(`📊 Total employees: ${employees.length}`);
    console.log(`📅 Months per employee: ${MONTHS_TO_CREATE}`);

  } catch (error) {
    console.error('❌ Error seeding payrolls:', error);
  } finally {
    await closeDatabase();
  }
}

seedPayrolls();
