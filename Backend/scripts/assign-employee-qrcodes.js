import { closeDatabase, connectDatabase, getDatabase } from '../config/database.js';

/**
 * Script: Gán mã QR cho toàn bộ nhân viên hiện có
 *
 * Quy ước:
 * - Nếu employee đã có `qrCode.code` thì giữ nguyên, KHÔNG ghi đè.
 * - Nếu chưa có, generate theo format: `EMP-<employeeId || _id>`
 *   - Ưu tiên dùng field `employeeId` nếu có
 *   - Nếu không có, dùng `_id.toString()`
 */

async function assignQrCodes() {
  try {
    await connectDatabase();
    const db = getDatabase();

    const employeesCollection = db.collection('employees');

    // Lấy tất cả employees
    const employees = await employeesCollection
      .find({})
      .project({ _id: 1, employeeId: 1, qrCode: 1 })
      .toArray();

    if (!employees.length) {
      console.log('ℹ️ Không tìm thấy nhân viên nào trong collection employees.');
      return;
    }

    let updatedCount = 0;

    for (const emp of employees) {
      // Nếu đã có qrCode.code thì bỏ qua
      if (emp.qrCode && emp.qrCode.code) {
        continue;
      }

      const baseId = emp.employeeId || emp._id.toString();
      const qrCodeValue = `EMP-${baseId}`;

      await employeesCollection.updateOne(
        { _id: emp._id },
        {
          $set: {
            qrCode: {
              code: qrCodeValue,
              createdAt: new Date(),
              isActive: true,
            },
          },
        }
      );

      updatedCount += 1;
      console.log(`✅ Gán QR cho employee ${emp._id.toString()}: ${qrCodeValue}`);
    }

    console.log(`\n🎉 Hoàn tất. Đã gán QR cho ${updatedCount} nhân viên.`);
  } catch (error) {
    console.error('❌ Lỗi khi gán mã QR cho nhân viên:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

assignQrCodes();

