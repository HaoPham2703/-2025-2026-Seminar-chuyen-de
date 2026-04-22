import { randomUUID } from 'crypto';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

function nowIsoDate() {
  return new Date().toISOString().split('T')[0];
}

function getCurrentMonthYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function getMondayIso() {
  const d = new Date();
  const day = d.getDay(); // 0..6, Sunday = 0
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

async function request(method, path, { token, body, expectedStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const ok = expectedStatus ? res.status === expectedStatus : res.ok;
  return { ok, status: res.status, payload };
}

async function tryAdminLogin() {
  const candidates = [
    { email: 'admin@example.com', password: 'admin123' },
    { email: 'admin@example.com', password: 'password123' },
  ];

  for (const cred of candidates) {
    const r = await request('POST', '/auth/login', { body: cred });
    if (r.ok && r.payload?.data?.token) {
      return { token: r.payload.data.token, credentials: cred };
    }
  }
  return null;
}

async function run() {
  const results = [];
  const push = (name, pass, detail = '') => results.push({ name, pass, detail });

  const unique = Date.now().toString();
  const monthYear = getCurrentMonthYear();

  let adminToken = '';
  let employeeToken = '';
  let departmentId = '';
  let positionId = '';
  let employeeId = '';
  let payrollId = '';
  let scheduleId = '';
  let rewardId = '';
  let disciplineId = '';
  let notificationId = '';
  let createdEmployeeEmail = `qa.employee.${unique}@example.com`;
  const employeePassword = 'Welcome@2026';

  try {
    const health = await fetch(`${BASE_URL}/health`);
    push('Health Check', health.ok, `status=${health.status}`);
  } catch (err) {
    push('Health Check', false, String(err?.message || err));
  }

  const adminLogin = await tryAdminLogin();
  if (!adminLogin) {
    push('Admin Login', false, 'Không đăng nhập được admin@example.com (admin123/password123)');
    printResults(results);
    process.exit(1);
  }
  adminToken = adminLogin.token;
  push('Admin Login', true, `${adminLogin.credentials.email}`);

  {
    const me = await request('GET', '/auth/me', { token: adminToken });
    push('Auth Me', me.ok, `status=${me.status}`);
  }

  {
    const dashboard = await request('GET', '/admin/dashboard', { token: adminToken });
    push('Dashboard API', dashboard.ok, `status=${dashboard.status}`);
  }

  {
    const createDept = await request('POST', '/admin/departments', {
      token: adminToken,
      body: { name: `QA Dept ${unique}`, description: 'Checklist department' },
      expectedStatus: 201,
    });
    if (createDept.ok && createDept.payload?.data?.id) {
      departmentId = createDept.payload.data.id;
    }
    push('Create Department', createDept.ok, `status=${createDept.status}`);
  }

  if (departmentId) {
    const updateDept = await request('PUT', `/admin/departments/${departmentId}`, {
      token: adminToken,
      body: { description: 'Checklist department updated' },
    });
    push('Update Department', updateDept.ok, `status=${updateDept.status}`);
  } else {
    push('Update Department', false, 'skip vì chưa tạo được department');
  }

  {
    const createPos = await request('POST', '/admin/positions', {
      token: adminToken,
      body: { name: `QA Position ${unique}`, departmentId, baseSalary: 15000000 },
      expectedStatus: 201,
    });
    if (createPos.ok && createPos.payload?.data?.id) {
      positionId = createPos.payload.data.id;
    }
    push('Create Position', createPos.ok, `status=${createPos.status}`);
  }

  if (positionId) {
    const updatePos = await request('PUT', `/admin/positions/${positionId}`, {
      token: adminToken,
      body: { baseSalary: 16000000 },
    });
    push('Update Position', updatePos.ok, `status=${updatePos.status}`);
  } else {
    push('Update Position', false, 'skip vì chưa tạo được position');
  }

  {
    const listEmployees = await request('GET', '/admin/employees', { token: adminToken });
    const hasExtendedFields = Boolean(
      listEmployees.payload?.data?.employees?.[0] &&
      Object.prototype.hasOwnProperty.call(listEmployees.payload.data.employees[0], 'baseSalary') &&
      Object.prototype.hasOwnProperty.call(listEmployees.payload.data.employees[0], 'status')
    );
    push('List Employees', listEmployees.ok, `status=${listEmployees.status}`);
    push('Employees Extended Fields', hasExtendedFields, hasExtendedFields ? 'ok' : 'thiếu field mở rộng');
  }

  {
    const createEmployee = await request('POST', '/admin/employees', {
      token: adminToken,
      body: {
        firstName: 'Checklist',
        lastName: `User${unique}`,
        email: createdEmployeeEmail,
        phone: '0900000000',
        department: `QA Dept ${unique}`,
        position: `QA Position ${unique}`,
        hireDate: nowIsoDate(),
      },
      expectedStatus: 201,
    });

    if (createEmployee.ok && createEmployee.payload?.data?.id) {
      employeeId = createEmployee.payload.data.id;
      if (createEmployee.payload?.data?.accountInfo?.email) {
        createdEmployeeEmail = createEmployee.payload.data.accountInfo.email;
      }
    }
    push('Create Employee', createEmployee.ok, `status=${createEmployee.status}`);
  }

  if (employeeId) {
    const updateEmployee = await request('PUT', `/admin/employees/${employeeId}`, {
      token: adminToken,
      body: {
        departmentId,
        positionId,
        baseSalary: 17000000,
        phone: '0911111111',
      },
    });
    push('Update Employee (departmentId/positionId/baseSalary)', updateEmployee.ok, `status=${updateEmployee.status}`);
  } else {
    push('Update Employee (departmentId/positionId/baseSalary)', false, 'skip vì chưa tạo được employee');
  }

  {
    const attendanceToday = await request('GET', '/admin/attendance/today', { token: adminToken });
    push('Attendance Today (Admin)', attendanceToday.ok, `status=${attendanceToday.status}`);
  }

  if (employeeId) {
    const clockIn = await request('POST', '/attendance/clock-in', {
      token: adminToken,
      body: {
        employeeId,
        method: 'ADMIN_DASHBOARD',
      },
    });
    push('Clock In', clockIn.ok, `status=${clockIn.status}`);

    const clockOut = await request('POST', '/attendance/clock-out', {
      token: adminToken,
      body: {
        employeeId,
        method: 'ADMIN_DASHBOARD',
      },
    });
    push('Clock Out', clockOut.ok, `status=${clockOut.status}`);

    const current = await request('GET', `/attendance/current?employeeId=${employeeId}`, { token: adminToken });
    push('Attendance Current', current.ok, `status=${current.status}`);
  }

  const monday = getMondayIso();
  if (employeeId) {
    const upsertSchedule = await request('POST', '/admin/schedules/daily', {
      token: adminToken,
      body: {
        employeeId,
        date: monday,
        shiftType: 'MORNING',
        startTime: '08:00',
        endTime: '12:00',
        reason: 'Checklist run',
      },
      expectedStatus: 201,
    });
    if (upsertSchedule.ok) {
      scheduleId = upsertSchedule.payload?.data?.id || '';
    }
    push('Upsert Schedule', upsertSchedule.ok, `status=${upsertSchedule.status}`);

    const weekSchedule = await request('GET', `/admin/schedules/daily?weekStart=${monday}`, { token: adminToken });
    push('Get Week Schedule', weekSchedule.ok, `status=${weekSchedule.status}`);

    const scheduleLogs = await request('GET', `/admin/schedules/logs?employeeId=${employeeId}&limit=10`, { token: adminToken });
    push('Get Schedule Logs', scheduleLogs.ok, `status=${scheduleLogs.status}`);
  }

  {
    const formula = await request('GET', '/admin/payroll-formula-settings', { token: adminToken });
    push('Get Payroll Formula Settings', formula.ok, `status=${formula.status}`);
  }

  {
    const setRule = await request('PUT', '/admin/reward-rules', {
      token: adminToken,
      body: {
        type: 'ATTENDANCE_FULL',
        requiredDays: 1,
        rewardType: 'MONEY',
        rewardAmount: 50000,
        isActive: true,
      },
    });
    push('Save Reward Rule', setRule.ok, `status=${setRule.status}`);

    const preview = await request('GET', `/admin/rewards/auto-calculate/employees?month=${monthYear.month}&year=${monthYear.year}`, {
      token: adminToken,
    });
    push('Reward Auto Preview', preview.ok, `status=${preview.status}`);
  }

  if (employeeId) {
    const createReward = await request('POST', '/admin/rewards', {
      token: adminToken,
      body: {
        employeeId,
        type: 'MONEY',
        title: 'Checklist Reward',
        amount: 100000,
        month: monthYear.month,
        year: monthYear.year,
      },
      expectedStatus: 201,
    });
    rewardId = createReward.payload?.data?.id || '';
    push('Create Reward', createReward.ok, `status=${createReward.status}`);

    if (rewardId) {
      const approveReward = await request('PATCH', `/admin/rewards/${rewardId}`, {
        token: adminToken,
        body: { status: 'APPROVED' },
      });
      push('Approve Reward', approveReward.ok, `status=${approveReward.status}`);
    } else {
      push('Approve Reward', false, 'skip vì chưa tạo được reward');
    }

    const createDiscipline = await request('POST', '/admin/disciplines', {
      token: adminToken,
      body: {
        employeeId,
        type: 'LATE',
        description: 'Checklist discipline',
        amount: 50000,
        month: monthYear.month,
        year: monthYear.year,
      },
      expectedStatus: 201,
    });
    disciplineId = createDiscipline.payload?.data?.id || '';
    push('Create Discipline', createDiscipline.ok, `status=${createDiscipline.status}`);

    if (disciplineId) {
      const approveDiscipline = await request('PATCH', `/admin/disciplines/${disciplineId}`, {
        token: adminToken,
        body: { status: 'APPROVED' },
      });
      push('Approve Discipline', approveDiscipline.ok, `status=${approveDiscipline.status}`);
    } else {
      push('Approve Discipline', false, 'skip vì chưa tạo được discipline');
    }
  }

  {
    const payrollEmployees = await request('GET', '/payrolls/employees', { token: adminToken });
    const option = payrollEmployees.payload?.data?.employees?.find((e) => e.id === employeeId);
    const hasPositionSalary = option ? Number.isFinite(Number(option.positionSalary)) : false;
    push('Payroll Employee Options', payrollEmployees.ok, `status=${payrollEmployees.status}`);
    push('Payroll Option Position Salary', hasPositionSalary, hasPositionSalary ? `positionSalary=${option.positionSalary}` : 'không tìm thấy employee option');
  }

  if (employeeId) {
    const createPayroll = await request('POST', '/payrolls', {
      token: adminToken,
      body: {
        employeeId,
        period: { month: monthYear.month, year: monthYear.year },
        allowances: [],
        deductions: [],
        status: 'DRAFT',
      },
      expectedStatus: 201,
    });
    payrollId = createPayroll.payload?.data?.id || '';
    push('Create Payroll (without baseSalary)', createPayroll.ok, `status=${createPayroll.status}`);

    const listPayrolls = await request('GET', `/payrolls?employeeId=${employeeId}&month=${monthYear.month}&year=${monthYear.year}`, {
      token: adminToken,
    });
    const foundPayroll = listPayrolls.payload?.data?.payrolls?.find((p) => p._id === payrollId);
    const hasResolvedSalary = foundPayroll ? Number(foundPayroll.baseSalary) > 0 : false;
    push('List Payrolls', listPayrolls.ok, `status=${listPayrolls.status}`);
    push('Payroll Base Salary Resolved', hasResolvedSalary, foundPayroll ? `baseSalary=${foundPayroll.baseSalary}` : 'không tìm thấy payroll vừa tạo');

    const bulkCreate = await request('POST', '/payrolls/bulk', {
      token: adminToken,
      body: {
        employeeIds: [employeeId],
        period: { month: monthYear.month, year: monthYear.year },
        allowances: [],
        deductions: [],
      },
    });
    const duplicateRejected = Array.isArray(bulkCreate.payload?.data?.failed) && bulkCreate.payload.data.failed.length > 0;
    push('Bulk Payroll Duplicate Check', bulkCreate.ok || duplicateRejected, `status=${bulkCreate.status}`);
  }

  if (employeeId) {
    const sendNotification = await request('POST', '/notifications/send', {
      token: adminToken,
      body: {
        title: `Checklist Notification ${randomUUID().slice(0, 8)}`,
        message: 'Checklist notification message',
        type: 'ANNOUNCEMENT',
        priority: 'MEDIUM',
        targetAudience: 'SPECIFIC',
        targetEmployeeIds: [employeeId],
      },
      expectedStatus: 201,
    });
    notificationId = sendNotification.payload?.data?.notificationId || '';
    push('Send Notification', sendNotification.ok, `status=${sendNotification.status}`);

    const sent = await request('GET', '/notifications/sent?page=1&limit=20', { token: adminToken });
    push('Get Sent Notifications', sent.ok, `status=${sent.status}`);
  }

  {
    const employeeLogin = await request('POST', '/auth/login', {
      body: { email: createdEmployeeEmail, password: employeePassword },
    });
    if (employeeLogin.ok && employeeLogin.payload?.data?.token) {
      employeeToken = employeeLogin.payload.data.token;
      push('Employee Login', true, createdEmployeeEmail);
    } else {
      push('Employee Login', false, `status=${employeeLogin.status}`);
    }
  }

  if (employeeToken) {
    const profile = await request('GET', '/employees/profile', { token: employeeToken });
    push('Employee Profile', profile.ok, `status=${profile.status}`);

    if (employeeId) {
      const byId = await request('GET', `/employees/${employeeId}`, { token: employeeToken });
      push('Employee By Id', byId.ok, `status=${byId.status}`);
    }

    const inbox = await request('GET', '/notifications?unreadOnly=true', { token: employeeToken });
    const firstNotifId = inbox.payload?.data?.notifications?.[0]?.id || notificationId;
    push('Employee Notifications Inbox', inbox.ok, `status=${inbox.status}`);

    if (firstNotifId) {
      const markRead = await request('PUT', `/notifications/${firstNotifId}/read`, { token: employeeToken });
      push('Mark Notification Read', markRead.ok, `status=${markRead.status}`);
    } else {
      push('Mark Notification Read', false, 'không có notification để mark read');
    }

    const markAll = await request('PUT', '/notifications/read-all', { token: employeeToken });
    push('Mark All Notifications Read', markAll.ok, `status=${markAll.status}`);
  }

  if (scheduleId) {
    const deleteSchedule = await request('DELETE', `/admin/schedules/daily/${scheduleId}`, { token: adminToken });
    push('Delete Schedule', deleteSchedule.ok, `status=${deleteSchedule.status}`);
  }

  printResults(results);

  const failed = results.filter((r) => !r.pass);
  process.exit(failed.length > 0 ? 2 : 0);
}

function printResults(results) {
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log('\n=== ADMIN SIDE CHECKLIST RESULTS ===');
  for (const r of results) {
    const mark = r.pass ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${r.name}${r.detail ? ` -> ${r.detail}` : ''}`);
  }
  console.log(`\nSummary: ${passed}/${results.length} passed, ${failed} failed`);
}

run().catch((err) => {
  console.error('Checklist script crashed:', err);
  process.exit(1);
});

