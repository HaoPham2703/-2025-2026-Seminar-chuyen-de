# HR/Payroll App — Chi Tiết Thay Đổi
**Ngày:** 2026-04-17 | **Phạm vi:** Backend + React Admin + React Native Mobile

---

## Tổng Quan Kiến Trúc

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| Backend | Node.js/Express, MongoDB (raw driver), flat route files | Không có controller/service separation |
| Frontend | React Admin (Vite + Tailwind) | `adminSide/src/` |
| Mobile | React Native Expo | `app/` |
| Auth | JWT + Socket.IO | |

**Key files cần chú ý:**
- `Backend/routes/admin.js` (~2575 lines) — employees, positions, rewards, disciplines, dashboard
- `Backend/routes/payrolls.js` — payroll CRUD, auto-calculate
- `Backend/routes/attendance.js` — clock-in/out với QR validation
- `Backend/routes/notifications.js` — gửi/thông báo
- `Backend/utils/qr.js` — TOTP-based QR (10-second windows, ±1 window tolerance)
- `adminSide/src/components/Header.tsx` — bell icon (static), schedule nav, create request btn
- `adminSide/src/pages/Payroll.tsx` — allowances/deductions rows, batch creation
- `adminSide/src/pages/Notifications.tsx` — SPECIFIC audience → checkbox list (chưa có search)
- `adminSide/src/pages/Rewards.tsx` — MATERIAL/MONEY type selection
- `adminSide/src/pages/Schedule.tsx` — week calendar Mon-Sun
- `adminSide/src/pages/Employees.tsx` — employmentType select (5 loại), baseSalary từ position
- `adminSide/src/pages/LeaveRequests.tsx` — 7 leave types
- `app/(tabs)/index.tsx` — mobile home (clock-in/out)

---

## NHÓM 1: Header Cleanup — Rủi ro THẤP

### 1. [HIGH] Bỏ cái chuông (Remove Bell Icon)
**File:** `adminSide/src/components/Header.tsx`

**Thay đổi:** Xóa block button Bell + red dot badge (lines 94–100):
```tsx
// XÓA:
<button type="button"
  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer relative">
  <Bell size={20} />
  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
</button>
```
Cũng xóa import `Bell` nếu không còn dùng ở chỗ khác.

---

### 4. [HIGH] Bỏ tạo yêu cầu (Remove "Create Request" Button)
**File:** `adminSide/src/components/Header.tsx`

**Thay đổi:**
1. Xóa `handleCreateRequest` function (lines 25–29)
2. Xóa `<button onClick={handleCreateRequest}...>` block (lines 109–116)
3. Xóa import `Plus` nếu không dùng chỗ khác

---

## NHÓM 2: TasksCard & AddTaskModal — Rủi ro THẤP

### 2. [MEDIUM] Sửa todo — Thêm localStorage persistence
**File:** `adminSide/src/components/dashboard/TasksCard.tsx`

**Thay đổi:** Thay vì hardcoded array + in-memory state, đọc từ localStorage:
```tsx
const STORAGE_KEY = 'dashboard_tasks'

const [taskList, setTaskList] = useState<Task[]>(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : tasks
  } catch { return tasks }
})

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(taskList))
}, [taskList])
```

---

### 3. [MEDIUM] Sửa nhãn tùy chọn — Đổi select thành pill toggle
**File:** `adminSide/src/components/dashboard/AddTaskModal.tsx` (tag select)

**Thay đổi:** Thay `<select>` + option "Optional" bằng button pills:
```tsx
<div className="flex gap-2 flex-wrap">
  <button type="button" onClick={() => setTag('')}
    className={`px-3 py-1 rounded-full text-xs border cursor-pointer transition-colors ${
      !tag ? 'bg-gray-100 text-gray-400 border-gray-200' : 'opacity-50'
    }`}>Không có</button>
  <button type="button" onClick={() => setTag(tag === 'recruitment' ? '' : 'recruitment')}
    className={`px-3 py-1 rounded-full text-xs border cursor-pointer transition-colors ${
      tag === 'recruitment' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-500 border-gray-200'
    }`}>{t('dashboard.recruitment')}</button>
  <button type="button" onClick={() => setTag(tag === 'important' ? '' : 'important')}
    className={`px-3 py-1 rounded-full text-xs border cursor-pointer transition-colors ${
      tag === 'important' ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-50 text-gray-500 border-gray-200'
    }`}>{t('dashboard.important')}</button>
</div>
```
Xóa `<select>` và logic "Optional" cũ.

---

## NHÓM 3: Payroll — Thay Đổi Lớn — Rủi ro TRUNG BÌNH

### 5. [HIGH] Đồng bộ lương theo chức vụ khi tạo phiếu lương
**Files:** `Backend/routes/payrolls.js` + `adminSide/src/services/payrollService.ts` + `adminSide/src/pages/Payroll.tsx`

**Backend** — `GET /api/payrolls/employees`, thêm `positionSalary` vào projection và mapping (sau line 155):
```js
// Trong projection:
'employment.baseSalary': 1,

// Trong list mapping:
positionSalary: e.employment?.baseSalary || 0,
```

**Frontend service** — `payrollService.ts`, thêm vào `EmployeeOption`:
```ts
export interface EmployeeOption {
  id: string; name: string; code: string; position: string
  positionSalary: number;  // ← THÊM
  email: string;
}
```

**Frontend** — `Payroll.tsx`, thêm `useEffect` để auto-fill baseSalary:
```tsx
useEffect(() => {
  if (!showModal || modalMode !== 'create' || !formEmployee) return
  const emp = employees.find(e => e.id === formEmployee)
  if (emp?.positionSalary) {
    setFormBaseSalary(String(emp.positionSalary))
  }
}, [formEmployee, modalMode, showModal])
```

---

### 7. [HIGH] Tạo phiếu lương hàng loạt — Fix "failed to fetch"
**Files:** `Backend/routes/payrolls.js` + `adminSide/src/services/payrollService.ts` + `adminSide/src/pages/Payroll.tsx`

**Root cause:** Không có batch endpoint. `handleBulkCreate` gọi `Promise.all(createPayroll())` — khi 1 employee đã có payroll (409), `.catch` throw → break Promise.all.

**Backend** — Thêm endpoint mới vào `payrolls.js` (trước `export default`):
```js
router.post('/bulk', requireRole(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { employeeIds = [], period, baseSalary, allowances = [], deductions = [], status = 'DRAFT' } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0)
      return res.status(400).json({ success: false, message: 'employeeIds must be non-empty array' });
    if (!period?.month || !period?.year)
      return res.status(400).json({ success: false, message: 'period.month/year required' });

    const db = getDatabase();
    const tenantObjectId = new ObjectId(tenantId);
    const periodMonth = parseInt(period.month, 10);
    const periodYear = parseInt(period.year, 10);
    const now = new Date();
    const base = normalizeMoney(baseSalary);
    const allowancesTotal = sumAmount(allowances);
    const deductionsTotal = sumAmount(deductions);
    const results = { created: [], failed: [] };

    for (const employeeIdStr of employeeIds) {
      try {
        const employeeObjectId = new ObjectId(employeeIdStr);
        const existing = await db.collection('payrolls').findOne({
          tenantId: tenantObjectId, employeeId: employeeObjectId,
          'period.month': periodMonth, 'period.year': periodYear, isSuperseded: { $ne: true },
        });
        if (existing) {
          results.failed.push({ employeeId: employeeIdStr, reason: 'Đã có phiếu lương tháng này' });
          continue;
        }
        const doc = {
          tenantId: tenantObjectId, employeeId: employeeObjectId,
          period: { month: periodMonth, year: periodYear },
          baseSalary: base, allowances, deductions,
          allowancesTotal, deductionsTotal,
          netSalary: base + allowancesTotal - deductionsTotal,
          status, approvedAt: now, createdAt: now, createdBy: new ObjectId(userId),
          revisionOf: null, revisedFrom: null, revisedAt: null, revisedBy: null,
          reviseReason: null, isSuperseded: false, supersededBy: null,
          updatedAt: now, updatedBy: new ObjectId(userId),
        };
        const r = await db.collection('payrolls').insertOne(doc);
        await db.collection('payroll_audits').insertOne({
          tenantId: tenantObjectId, payrollId: r.insertedId, action: 'CREATE',
          performedBy: new ObjectId(userId), performedAt: now, reason: null,
          previousValues: null,
          nextValues: { employeeId: employeeObjectId, period: doc.period, baseSalary: doc.baseSalary,
            allowances: doc.allowances, deductions: doc.deductions, status: doc.status },
        });
        results.created.push({ employeeId: employeeIdStr, id: r.insertedId.toString() });
      } catch (err) {
        results.failed.push({ employeeId: employeeIdStr, reason: err.message || 'Unknown' });
      }
    }
    res.status(results.failed.length === employeeIds.length ? 400 : 200).json({
      success: results.created.length > 0, data: results,
      message: `Tạo thành công ${results.created.length}/${employeeIds.length} phiếu lương`,
    });
  } catch (error) { next(error); }
});
```

**Frontend service** — Thêm vào `payrollService.ts`:
```ts
export async function createBulkPayroll(data: {
  employeeIds: string[]; period: PayrollPeriod; baseSalary: number;
  allowances?: PayrollItem[]; deductions?: PayrollItem[];
  status?: 'DRAFT' | 'PENDING' | 'APPROVED'
}): Promise<{ created: number; failed: number; details: { employeeId: string; reason: string }[] }> {
  const response = await api.post('/payrolls/bulk', data);
  if (!response.success && response.data?.created === 0)
    throw new Error(response.message || 'Bulk creation failed');
  return {
    created: response.data?.created ?? 0,
    failed: response.data?.failed ?? 0,
    details: response.data?.details ?? [],
  };
}
```

**Frontend** — Thay thế `handleBulkCreate` trong `Payroll.tsx`:
```tsx
const handleBulkCreate = async () => {
  const targetEmployeeIds = selectedIds.length > 0 ? selectedIds
    : departmentEmployees.map((emp) => emp.id);
  if (targetEmployeeIds.length === 0) { alert('Vui lòng chọn nhân viên'); return }
  if (!formBaseSalary) { alert('Vui lòng nhập lương cơ bản mẫu'); return }
  if (!window.confirm(`Tạo phiếu lương cho ${targetEmployeeIds.length} nhân viên?`)) return

  try {
    setBulkCreating(true)
    const allowances = formAllowances.filter(a => a.name && a.amount)
      .map(a => ({ name: a.name, amount: parseFloat(a.amount) }))
    const deductions = formDeductions.filter(d => d.name && d.amount)
      .map(d => ({ name: d.name, amount: parseFloat(d.amount) }))

    const result = await createBulkPayroll({
      employeeIds: targetEmployeeIds,
      period: { month: formMonth, year: formYear },
      baseSalary: parseFloat(formBaseSalary),
      allowances, deductions, status: formStatus,
    })

    setShowModal(false); resetForm(); setSelectedIds([]); setDepartmentEmployees([]);
    await loadData()

    if (result.failed > 0) {
      const reasons = result.details.map(d => `${d.employeeId}: ${d.reason}`).join('\n')
      alert(`Đã tạo ${result.created}/${targetEmployeeIds.length}.\n\nKhông thể tạo:\n${reasons}`)
    } else {
      alert(`Đã tạo thành công ${result.created} phiếu lương!`)
    }
  } catch (err: any) { alert(err.message || 'Lỗi tạo hàng loạt') }
  finally { setBulkCreating(false) }
}
```

---

### 8. [HIGH] Bỏ phụ cấp khấu trừ — Chỉ hiển thị, không cho sửa
**File:** `adminSide/src/pages/Payroll.tsx`

**Thay đổi:** Thay thế phần allowances/deductions manual rows (dynamic add/remove) bằng **read-only display** từ auto-calculate:
- Xóa `handleAddAllowance`, `handleRemoveAllowance`, `handleAllowanceChange` (4 functions)
- Xóa `handleAddDeduction`, `handleRemoveDeduction`, `handleDeductionChange` (4 functions)
- Xóa "+ Thêm" buttons cho allowances và deductions
- Thay thế phần render allowances/deductions bằng:
```tsx
{autoCalcSummary ? (
  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
    {formAllowances.filter(a => a.name && a.amount).length > 0 && (
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Phụ cấp (tự động)</p>
        {formAllowances.filter(a => a.name && a.amount).map((a, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-700">{a.name}</span>
            <span className="text-green-600 font-medium">+{formatCurrency(parseFloat(a.amount), language)}</span>
          </div>
        ))}
      </div>
    )}
    {formDeductions.filter(d => d.name && d.amount).length > 0 && (
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Khấu trừ (tự động)</p>
        {formDeductions.filter(d => d.name && d.amount).map((d, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-700">{d.name}</span>
            <span className="text-red-500 font-medium">-{formatCurrency(parseFloat(d.amount), language)}</span>
          </div>
        ))}
      </div>
    )}
  </div>
) : (
  <p className="text-sm text-gray-400 italic py-4 text-center">
    Nhấn "Tính tự động" sau khi chọn nhân viên để xem phụ cấp/khấu trừ
  </p>
)}
```

---

### 9. [HIGH] Không cho chỉnh sửa khấu trừ
**File:** `adminSide/src/pages/Payroll.tsx`

**Thay đổi:** Đã bao gồm trong Change #8 (chỉ hiển thị read-only). Không cần thay đổi riêng.

---

### 10. [MEDIUM] Note: Mỗi nhân viên chỉ có 1 phiếu lương/tháng
**Files:** `adminSide/src/pages/Payroll.tsx` + `adminSide/src/pages/Reports.tsx`

**Thay đổi:**

**Payroll.tsx** — Thêm banner sau modal header:
```tsx
<div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2 mb-4">
  <span className="text-amber-500 mt-0.5">ℹ️</span>
  <span>
    <strong>Lưu ý:</strong> Mỗi nhân viên chỉ có thể có <strong>1 phiếu lương mỗi tháng</strong>.
    Nếu cần điều chỉnh phiếu đã duyệt, dùng nút <strong>"Điều chỉnh"</strong> để tạo phiên bản mới + audit log.
  </span>
</div>
```

**Reports.tsx** — Thêm subtitle:
```tsx
<p className="text-gray-400 text-xs mt-1">
  ⚠️ Mỗi nhân viên chỉ có một phiếu lương mỗi tháng.
</p>
```

---

### 6. [MEDIUM] Bỏ đã duyệt option
**File:** `adminSide/src/pages/Payroll.tsx`

**Thay đổi:** Xóa "Đã duyệt" option khỏi status filter dropdown (DRAFT, PENDING, APPROVED → chỉ giữ DRAFT, PENDING).

---

## NHÓM 4: Notifications — Rủi ro TRUNG BÌNH

### 11. [HIGH] Employee search thay vì checklist
**File:** `adminSide/src/pages/Notifications.tsx` (SPECIFIC audience, lines 405–441)

**Thêm state:**
```tsx
const [employeeSearch, setEmployeeSearch] = useState('')
const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)

const filteredEmployees = employees.filter((emp) => {
  const q = employeeSearch.trim().toLowerCase()
  if (!q) return true
  return emp.name?.toLowerCase().includes(q) || emp.email?.toLowerCase().includes(q)
    || emp.employeeId?.toLowerCase().includes(q) || emp.department?.toLowerCase().includes(q)
})
```

**Thay thế block SPECIFIC bằng:**
```tsx
{targetAudience === 'SPECIFIC' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Tìm kiếm nhân viên ({targetEmployeeIds.length} đã chọn)
    </label>

    {/* Search input */}
    <div className="relative mb-3">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input type="text" value={employeeSearch}
        onChange={(e) => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true) }}
        onFocus={() => setShowEmployeeDropdown(true)}
        placeholder="Tìm theo tên, email, mã nhân viên..."
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    {/* Selected chips */}
    {targetEmployeeIds.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-3">
        {targetEmployeeIds.slice(0, 5).map((id) => {
          const emp = employees.find(e => e._id === id)
          return emp ? (
            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              {emp.name}
              <button type="button" onClick={() => toggleEmployee(id)}
                className="hover:text-blue-900 font-bold">×</button>
            </span>
          ) : null
        })}
        {targetEmployeeIds.length > 5 && (
          <span className="text-xs text-gray-500 py-1">+{targetEmployeeIds.length - 5} khác</span>
        )}
      </div>
    )}

    {/* Dropdown */}
    {showEmployeeDropdown && (
      <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto divide-y divide-gray-100">
        {filteredEmployees.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">Không tìm thấy nhân viên</p>
        ) : filteredEmployees.map((emp) => {
          const selected = targetEmployeeIds.includes(emp._id)
          return (
            <label key={emp._id}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-blue-50 ${selected ? 'bg-blue-50' : ''}`}>
              <input type="checkbox" checked={selected} onChange={() => toggleEmployee(emp._id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                <p className="text-xs text-gray-400 truncate">{emp.email || emp.department || ''}</p>
              </div>
            </label>
          )
        })}
      </div>
    )}

    {targetEmployeeIds.length > 0 && (
      <button type="button" onClick={() => setTargetEmployeeIds([])}
        className="text-xs text-red-500 hover:text-red-700 mt-2 cursor-pointer">
        Xóa tất cả đã chọn
      </button>
    )}
  </div>
)}
```
Thêm import `Search` từ lucide-react.

---

## NHÓM 5: Rewards — Rủi ro THẤP

### 12 & 14. [MEDIUM] Verify: MATERIAL → amount hidden — ✅ Đã đúng
Kiểm tra `Rewards.tsx` lines 749–756: điều kiện `{rType === 'MATERIAL' && ...}` đã ẩn amount field. Không cần thay đổi.

### 13. [LOW] Sửa placeholder hiện vật
**File:** `adminSide/src/pages/Rewards.tsx` (line ~745)
```tsx
// ĐỔI:
placeholder="VD: Bã mía, Voucher 200k..."
// THÀNH:
placeholder="VD: Phiếu quà tặng, Voucher ăn trưa..."
```

### 15. [MEDIUM] Bỏ mô tả hiện vật (MATERIAL)
**File:** `adminSide/src/pages/Rewards.tsx` (description field, lines 757–762)
```tsx
// BỌC trong điều kiện MONEY:
{rType === 'MONEY' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.description')}</label>
    <textarea value={rDesc} onChange={e => setRDesc(e.target.value)} rows={2}
      placeholder="Mô tả thêm (tùy chọn)..."
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
)}
```

### 16. [MEDIUM] Rewards/Disciplines không cập nhật tình trạng phiếu lương
**File:** `adminSide/src/pages/Rewards.tsx`

**Thêm note dưới bảng rewards:**
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-700 mb-4">
  💡 Khen thưởng/kỷ luật đã duyệt sẽ tự động áp dụng vào tính lương kỳ tiếp theo
  (chọn nhân viên + tháng để tạo phiếu lương). Không ảnh hưởng phiếu đã tạo.
</div>
```

---

## NHÓM 6: Employees — Rủi ro THẤP

### 17. [MEDIUM] Xem thông tin chi tiết nhân viên
**File:** `adminSide/src/pages/Employees.tsx` (detail modal, lines 456–521)

**Thay đổi:** Mở rộng detail modal với đầy đủ thông tin:
```tsx
<div className="p-6 space-y-6">
  {/* Personal Info */}
  <div>
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Thông tin cá nhân</h3>
    <div className="grid grid-cols-2 gap-3">
      {[{label:'Mã NV', value:detailEmployee.employeeId},
         {label:'Email', value:detailEmployee.email},
         {label:'Điện thoại', value:detailEmployee.phone||'—'},
         {label:'Ngày sinh', value:detailEmployee.dateOfBirth||'—'},
         {label:'Giới tính', value:detailEmployee.gender||'—'},
         {label:'Địa chỉ', value:[detailEmployee.street,detailEmployee.city,detailEmployee.province].filter(Boolean).join(', ')||'—'},
      ].map(row => (
        <div key={row.label}>
          <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
          <p className="text-sm font-medium text-gray-900">{row.value}</p>
        </div>
      ))}
    </div>
  </div>

  {/* Employment Info */}
  <div>
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Công việc</h3>
    <div className="grid grid-cols-2 gap-3">
      {[{label:'Chức vụ', value:detailEmployee.position||'—'},
         {label:'Phòng ban', value:detailEmployee.department||'Chưa phân phòng'},
         {label:'Lương cơ bản', value:detailEmployee.baseSalary?formatVND(detailEmployee.baseSalary):'—'},
         {label:'Trạng thái', value:detailEmployee.status||'ACTIVE'},
         {label:'Ngày vào', value:detailEmployee.hireDate||'—'},
      ].map(row => (
        <div key={row.label}>
          <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
          <p className="text-sm font-medium text-gray-900">{row.value}</p>
        </div>
      ))}
    </div>
  </div>

  {/* Statistics */}
  <div>
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Thống kê</h3>
    <div className="grid grid-cols-3 gap-3">
      {[{label:'Ngày công', value:detailEmployee.totalWorkingDays||0},
         {label:'Số lần đi muộn', value:detailEmployee.lateCount||0},
         {label:'Tỷ lệ đúng giờ', value:`${((detailEmployee.onTimeRate||0)*100).toFixed(0)}%`},
      ].map(row => (
        <div key={row.label}>
          <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
          <p className="text-sm font-medium text-gray-900">{row.value}</p>
        </div>
      ))}
    </div>
  </div>
</div>
```
Cập nhật `Employee` interface trong `adminService.ts` để bao gồm đầy đủ fields.

---

### 19. [MEDIUM] Lương cơ bản theo chức vụ — Verify ✅
Đã verify: khi chọn position → baseSalary tự động điền (Employees.tsx lines 158–171). Không cần thay đổi.

---

### 21. [HIGH] Bỏ loại hợp đồng (employmentType)
**File:** `adminSide/src/pages/Employees.tsx`

**Thay đổi:**
1. Xóa `employmentType: string` khỏi `CreateFormData` (line ~44)
2. Xóa khỏi `emptyForm()` (line ~68)
3. Xóa khỏi `openEdit` reset (line ~205)
4. Xóa `<select>` field cho `employmentType` (lines ~690–699)
5. Xóa `employmentType` khỏi `adminService.createEmployee()` call (line ~298)
6. Xóa `EMPLOYMENT_TYPES` constant (lines ~6–12)
7. Xóa `employmentType` khỏi `updateEmployee` call

---

## NHÓM 7: Positions — Rủi ro THẤP

### 18. [LOW] Nền mờ đen cho popup chức vụ (backdrop blur)
**File:** `adminSide/src/pages/Positions.tsx` (3 modal overlays: form modal, emp modal, delete confirm)

**Thay đổi:** Thay `bg-black bg-opacity-50` ở cả 3 overlay:
```tsx
className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
```

---

## NHÓM 8: Leave Requests — Rủi ro TRUNG BÌNH

### 30. [HIGH] Bỏ loại nghỉ (remove leave type)
**Files:** `adminSide/src/pages/LeaveRequests.tsx` + `Backend/routes/employees.js` (leave request creation)

**Frontend:**
1. Xóa `<th>Loại nghỉ</th>` trong bảng (line ~163)
2. Xóa `<td>` hiển thị `getTypeLabel(r.type)` (lines ~190–192)
3. Xóa `— {getTypeLabel(modalRequest.type)}` khỏi review modal subtitle (line ~256)
4. Xóa `getTypeLabel` function và `LEAVE_TYPES` constant nếu không dùng chỗ khác
5. Xóa `type` field khỏi create form (nếu có)
6. Xóa stats by type (nếu có)

**Backend:** `Backend/routes/employees.js` — khi tạo leave request, `type` vẫn được lưu nhưng không bắt buộc. Frontend không hiển thị nữa → tương thích ngược.

---

## NHÓM 9: Schedule — Rủi ro TRUNG BÌNH

### 28. [MEDIUM] Fix "Invalid token value" lịch tuần
**File:** `adminSide/src/pages/Schedule.tsx`

**Root cause:** `toISOString()` trả về UTC → ngày bị lệch. GetDay() có bug ở Sunday boundary.

**Fix `selectedWeek` initialization:**
```tsx
const getMonday = (d: Date) => {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}
const [selectedWeek, setSelectedWeek] = useState<Date>(() => getMonday(new Date()))
```

**Fix `weekStart` ISO string:**
```tsx
const weekStart = (() => {
  const d = new Date(selectedWeek)
  d.setHours(0, 0, 0, 0)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().split('T')[0]
})()
```

**Fix `getWeekDates`:**
```tsx
const getWeekDates = (date: Date) => {
  const week = []
  const startOfWeek = new Date(date)
  startOfWeek.setHours(0, 0, 0, 0)
  const day = startOfWeek.getDay()
  const diff = day === 0 ? -6 : 1 - day
  startOfWeek.setDate(startOfWeek.getDate() + diff)
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek)
    currentDate.setDate(startOfWeek.getDate() + i)
    week.push(currentDate)
  }
  return week
}
```

**Fix "Today" button:**
```tsx
onClick={() => setSelectedWeek(getMonday(new Date()))}
```

---

### 29. [MEDIUM] Điều chỉnh lịch chưa hoạt động
**Files:** `adminSide/src/pages/Schedule.tsx` + `adminSide/src/services/scheduleService.ts`

**Root cause:** Có thể `selectedCell.employeeId` bị undefined (truyền `_id` nhầm), hoặc date bị UTC shift.

**Fix `handleSaveSchedule` trong Schedule.tsx:**
```tsx
const handleSaveSchedule = async (payload: {...}) => {
  if (!selectedCell?.employeeId) {
    alert('Không tìm thấy thông tin nhân viên. Vui lòng thử lại.')
    return
  }
  const localDate = (() => {
    const d = new Date(selectedCell.date)
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    return local.toISOString().split('T')[0]
  })()

  await upsertDailySchedule({
    employeeId: selectedCell.employeeId,
    date: localDate,
    shiftType: payload.shiftType,
    startTime: payload.startTime,
    endTime: payload.endTime,
  })
  await loadSchedules() // Reload sau khi lưu
}
```

---

## NHÓM 10: Backend Validation — Rủi ro TRUNG BÌNH

### 20. [MEDIUM] Ràng buộc validation
**Files:** `Backend/routes/payrolls.js` + `Backend/routes/admin.js`

**Thêm vào đầu POST payroll handlers:**
```js
if (normalizeMoney(baseSalary) < 0)
  return res.status(400).json({ success: false, message: 'baseSalary không được âm' })
```

**Position salary cascade** — kiểm tra `admin.js` PUT position handler: đã tự động update `employees.baseSalary` và `employees.employment.baseSalary` khi `baseSalary` thay đổi. ✅ Verify hoạt động đúng.

---

## NHÓM 11: Reports — Rủi ro THẤP

### 22. [LOW] Lịch báo cáo ngược thời gian được
**File:** `adminSide/src/pages/Reports.tsx`

**Verify:** Date range filter (`start`/`end` inputs) đã mặc định last 30 days. Kiểm tra input type="date" có `max` attribute không — nếu có thì xóa `max` để cho phép chọn ngày trong quá khứ.

---

## NHÓM 12: Mobile — Attendance QR — Rủi ro TRUNG BÌNH

### 23. [HIGH] Bấm clock in → hiện mã QR
**File:** `app/(tabs)/index.tsx`

**Thay đổi:** Thay template mặc định bằng:
```tsx
import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { api } from '../services/api'

export default function HomeScreen() {
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [isClockedOut, setIsClockedOut] = useState(false)
  const [loading, setLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [qrToken, setQrToken] = useState('')

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const userRes = await api.get('/auth/me')
        if (userRes.success) {
          setEmployeeId(userRes.data.employeeId)
          const attRes = await api.get(`/attendance/current?employeeId=${userRes.data.employeeId}`)
          if (attRes.success) {
            setIsClockedIn(attRes.data.isClockedIn)
            setIsClockedOut(attRes.data.isClockedOut)
          }
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    loadStatus()
  }, [])

  const handleShowQR = async () => {
    try {
      const res = await api.get('/employees/profile')
      if (res.success) {
        setQrToken(res.data.qrToken || '')
        setShowQR(true)
      }
    } catch (e: any) { Alert.alert('❌', e.message) }
  }

  const handleClockIn = async () => {
    try {
      const res = await api.post('/attendance/clock-in', { employeeId, method: 'MOBILE_APP' })
      if (res.success) { setIsClockedIn(true); Alert.alert('✅', 'Đã chấm công vào!') }
      else Alert.alert('❌ Lỗi', res.message)
    } catch (e: any) { Alert.alert('❌ Lỗi', e.message) }
  }

  const handleClockOut = async () => {
    try {
      const res = await api.post('/attendance/clock-out', { employeeId, method: 'MOBILE_APP' })
      if (res.success) { setIsClockedOut(true); Alert.alert('✅', 'Đã chấm công ra!') }
      else Alert.alert('❌ Lỗi', res.message)
    } catch (e: any) { Alert.alert('❌ Lỗi', e.message) }
  }

  if (loading) return <View style={styles.container}><Text>Đang tải...</Text></View>

  if (showQR) {
    return (
      <View style={styles.container}>
        <Text style={styles.qrTitle}>📱 Mã QR của bạn</Text>
        {qrToken ? (
          <View style={styles.qrBox}>
            <Text style={styles.qrToken}>{qrToken}</Text>
            <Text style={styles.qrHint}>Quét mã này tại thiết bị chấm công</Text>
          </View>
        ) : (
          <Text style={styles.qrError}>Không thể tạo mã QR</Text>
        )}
        <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowQR(false)}>
          <Text style={styles.btnText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕐 Chấm công</Text>
      <TouchableOpacity style={styles.btnQR} onPress={handleShowQR}>
        <Text style={styles.btnQRText}>📱 Hiện mã QR</Text>
      </TouchableOpacity>
      {!isClockedIn && (
        <TouchableOpacity style={styles.btnPrimary} onPress={handleClockIn}>
          <Text style={styles.btnText}>🕐 Chấm công vào</Text>
        </TouchableOpacity>
      )}
      {isClockedIn && !isClockedOut && (
        <TouchableOpacity style={styles.btnDanger} onPress={handleClockOut}>
          <Text style={styles.btnText}>🏁 Chấm công ra</Text>
        </TouchableOpacity>
      )}
      {isClockedIn && isClockedOut && (
        <View style={styles.doneBox}>
          <Text style={styles.doneText}>✅ Đã hoàn thành chấm công hôm nay</Text>
        </View>
      )}
    </View>
  )
}
```

---

### 25. [HIGH] QR expiring + countdown
**Files:** `Backend/utils/qr.js` + Mobile

**Backend** — Tăng tolerance lên ±2 windows (~30s):
```js
// ĐỔI:
const QR_MAX_SKEW_WINDOWS = parseInt(process.env.QR_MAX_SKEW_WINDOWS || '2', 10); // was '1'
```

**Mobile** — Thêm countdown display:
```tsx
const [qrCountdown, setQrCountdown] = useState(10)

useEffect(() => {
  if (!showQR) return
  const interval = setInterval(() => {
    setQrCountdown(prev => {
      if (prev <= 1) { setShowQR(false); return 10 }
      return prev - 1
    })
  }, 1000)
  return () => clearInterval(interval)
}, [showQR])
```

---

### 24 & 26. [HIGH] Quét xong chấm luôn, không cần bấm xác nhận
**Mobile** — Dùng `expo-camera` để scan QR:
```tsx
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useState, useEffect, useRef } from 'react'

// Trong component:
const [scanned, setScanned] = useState(false)
const [permission, requestPermission] = useCameraPermissions()

const handleBarCodeScanned = async ({ data }: { data: string }) => {
  if (scanned) return
  setScanned(true)
  try {
    const res = await api.post('/attendance/clock-in', {
      employeeId, qrCode: data, method: 'QR_SCAN'
    })
    if (res.success) {
      setIsClockedIn(true)
      Alert.alert('✅', 'Đã chấm công vào!')
    } else {
      Alert.alert('❌', res.message)
    }
  } catch (e: any) { Alert.alert('❌', e.message) }
  // Auto-reset sau 3s để scan lại
  setTimeout(() => setScanned(false), 3000)
}

// KHÔNG có confirm button — auto-submit on scan
{permission?.granted ? (
  <CameraView
    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
    style={StyleSheet.absoluteFillObject}
  />
) : (
  <TouchableOpacity onPress={requestPermission}>
    <Text>Cho phép camera để quét QR</Text>
  </TouchableOpacity>
)}
```

---

### 27. [HIGH] Bỏ QR cho quản lý (không bắt QR validation cho admin)
**File:** `Backend/routes/attendance.js` (clock-in và clock-out handlers)

**Thay đổi** — thêm role check:
```js
// Sau authenticateToken middleware, đầu handler clock-in:
const userRole = req.user?.role || (await getDatabase().collection('users')
  .findOne({ _id: new ObjectId(req.user.userId) }, { projection: { role: 1 } }))?.role
const isManager = ['TENANT_ADMIN', 'SUPER_ADMIN'].includes(userRole)
const requiresQr = method === 'QR_SCAN' && !isManager

// Thay đổi điều kiện validation QR:
if (requiresQr) {
  const secret = process.env.QR_SECRET || employee.qrCode?.code
  const valid = validateQrToken({ token: qrCode, employeeId: employee._id.toString(), secret })
  if (!valid) return res.status(400).json({ success: false, message: 'Mã QR không hợp lệ hoặc đã hết hạn' })
}
// KHÔNG validate QR nếu là manager/admin
```

---

## Thứ Tự Thực Hiện Đề Xuất

### Giai đoạn 1 — Rủi ro THẤP (thực hiện trước)
| # | Task | File |
|---|---|---|
| 1 | Bỏ chuông | `Header.tsx` |
| 4 | Bỏ Create Request | `Header.tsx` |
| 18 | Backdrop blur popup | `Positions.tsx` |
| 21 | Bỏ loại hợp đồng | `Employees.tsx` |
| 3 | Fix tag pill toggle | `AddTaskModal.tsx` |
| 2 | TasksCard localStorage | `TasksCard.tsx` |
| 13 | Fix item name placeholder | `Rewards.tsx` |
| 15 | Bỏ mô tả MATERIAL | `Rewards.tsx` |
| 22 | Calendar past dates verify | `Reports.tsx` |

### Giai đoạn 2 — Rủi ro TRUNG BÌNH
| # | Task | File |
|---|---|---|
| 7 | Batch payroll endpoint + fix fetch | `payrolls.js` + `payrollService.ts` + `Payroll.tsx` |
| 11 | Employee search | `Notifications.tsx` |
| 5 | Sync salary from position | `payrolls.js` + `payrollService.ts` + `Payroll.tsx` |
| 8 | Bỏ allowances/deductions manual | `Payroll.tsx` |
| 17 | Employee detail modal | `Employees.tsx` |
| 25 | QR expiration fix | `utils/qr.js` + mobile |
| 27 | Bỏ QR cho manager | `attendance.js` |
| 30 | Bỏ leave type | `LeaveRequests.tsx` |
| 28 | Fix schedule invalid token | `Schedule.tsx` |
| 29 | Fix schedule save | `Schedule.tsx` |
| 10 | Note one payroll/month | `Payroll.tsx` + `Reports.tsx` |
| 16 | Rewards note | `Rewards.tsx` |
| 6 | Bỏ đã duyệt option | `Payroll.tsx` |
| 20 | Backend validation | `payrolls.js` |

### Giai đoạn 3 — Mobile + phần còn lại
| # | Task | File |
|---|---|---|
| 23 | Mobile clock-in + QR display | `app/(tabs)/index.tsx` |
| 24/26 | Auto-submit after scan | Mobile |
| 9 | Không cho sửa khấu trừ | `Payroll.tsx` |

### Trạng thái đã kiểm tra / hoàn thành
| # | Task | Trạng thái |
|---|---|---|
| 12 & 14 | Verify MATERIAL → amount hidden | ✅ Đã kiểm tra, không cần đổi |
| 19 | Lương cơ bản theo chức vụ | ✅ Đã verify |
| 22 | Lịch báo cáo ngược thời gian được | ✅ Đã verify |


---

## Verification

Sau khi implement, cần test:
1. **Payroll batch**: Tạo phiếu lương cho 5+ nhân viên cùng lúc → verify không còn "failed to fetch"
2. **QR flow**: Employee tạo QR → quét → auto clock-in không cần bấm nút
3. **Notifications**: Search "Nguyễn" → chọn employee → gửi notification → verify nhận được
4. **Schedule**: Click cell → chọn shift → save → reload → verify hiển thị đúng
5. **Leave requests**: Tạo request không có type → verify bảng không hiển thị type column
6. **Employees**: Thêm nhân viên mới → chọn position → verify baseSalary tự động điền
7. **Mobile**: Clock-in → hiện QR → countdown → QR hết hạn → tạo QR mới
