const authSecurity = [{ bearerAuth: [] }];

const successResponse = (description = 'Success') => ({
  '200': {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Success' },
      },
    },
  },
});

const createdResponse = (description = 'Created') => ({
  '201': {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Success' },
      },
    },
  },
});

const badRequestResponse = {
  '400': {
    description: 'Bad request',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
};

const unauthorizedResponse = {
  '401': {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
};

const forbiddenResponse = {
  '403': {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
};

const notFoundResponse = {
  '404': {
    description: 'Not found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
};

const idPathParam = {
  in: 'path',
  name: 'id',
  required: true,
  schema: { type: 'string' },
};

const employeeIdPathParam = {
  in: 'path',
  name: 'employeeId',
  required: true,
  schema: { type: 'string' },
};

const deptIdPathParam = {
  in: 'path',
  name: 'deptId',
  required: true,
  schema: { type: 'string' },
};

export const groupedSwaggerTags = [
  { name: 'Auth', description: 'Authentication endpoints' },
  { name: 'Attendance', description: 'Employee attendance endpoints' },
  { name: 'Employees', description: 'Employee self-service endpoints' },
  { name: 'Notifications', description: 'Notification center endpoints' },
  { name: 'Schedules', description: 'Shared schedule endpoints' },
  { name: 'Payrolls', description: 'Payroll endpoints' },
  { name: 'Admin', description: 'Admin management endpoints' },
];

export const groupedSwaggerPaths = {
  '/attendance/clock-out': {
    post: {
      tags: ['Attendance'],
      summary: 'Clock out',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeId'],
              properties: {
                employeeId: { type: 'string' },
                location: { type: 'object', additionalProperties: true },
                qrCode: { type: 'string' },
                method: {
                  type: 'string',
                  enum: ['MOBILE_APP', 'ADMIN_DASHBOARD', 'QR_SCAN'],
                },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Clock-out successful'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
  },

  '/employees/profile': {
    put: {
      tags: ['Employees'],
      summary: 'Update current employee profile',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                phone: { type: 'string' },
                dateOfBirth: { type: 'string', format: 'date' },
                gender: { type: 'string' },
                address: { type: 'object', additionalProperties: true },
                emergencyContact: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Profile updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
  },

  '/employees/schedules/my': {
    get: {
      tags: ['Employees'],
      summary: 'Get current employee schedules',
      security: authSecurity,
      responses: {
        ...successResponse('Schedules list'),
        ...unauthorizedResponse,
      },
    },
  },

  '/employees/{employeeId}/leave-requests': {
    get: {
      tags: ['Employees'],
      summary: 'Get leave requests of an employee',
      security: authSecurity,
      parameters: [employeeIdPathParam],
      responses: {
        ...successResponse('Leave requests list'),
        ...unauthorizedResponse,
        ...notFoundResponse,
      },
    },
    post: {
      tags: ['Employees'],
      summary: 'Create leave request',
      security: authSecurity,
      parameters: [employeeIdPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'startDate', 'endDate', 'reason'],
              properties: {
                type: { type: 'string' },
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        ...createdResponse('Leave request created'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
  },

  '/employees/{employeeId}/attendance-adjustments': {
    get: {
      tags: ['Employees'],
      summary: 'Get attendance adjustment requests of an employee',
      security: authSecurity,
      parameters: [employeeIdPathParam],
      responses: {
        ...successResponse('Attendance adjustments list'),
        ...unauthorizedResponse,
      },
    },
    post: {
      tags: ['Employees'],
      summary: 'Create attendance adjustment request',
      security: authSecurity,
      parameters: [employeeIdPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['date', 'reason'],
              properties: {
                date: { type: 'string', format: 'date' },
                requestedClockIn: { type: 'string' },
                requestedClockOut: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        ...createdResponse('Adjustment request created'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
  },

  '/employees/{employeeId}/payslips': {
    get: {
      tags: ['Employees'],
      summary: 'Get employee payslips',
      security: authSecurity,
      parameters: [
        employeeIdPathParam,
        { in: 'query', name: 'year', schema: { type: 'integer' } },
        { in: 'query', name: 'month', schema: { type: 'integer' } },
      ],
      responses: {
        ...successResponse('Payslip list'),
        ...unauthorizedResponse,
      },
    },
  },

  '/employees/{employeeId}/qr-code': {
    get: {
      tags: ['Employees'],
      summary: 'Get dynamic QR token for employee',
      security: authSecurity,
      parameters: [employeeIdPathParam],
      responses: {
        ...successResponse('QR token generated'),
        ...unauthorizedResponse,
        ...notFoundResponse,
      },
    },
  },

  '/employees/verify-qr': {
    post: {
      tags: ['Employees'],
      summary: 'Verify scanned QR token',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['qrToken'],
              properties: {
                qrToken: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('QR token valid'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
  },

  '/employees/{id}': {
    get: {
      tags: ['Employees'],
      summary: 'Get employee details by id',
      security: authSecurity,
      parameters: [idPathParam],
      responses: {
        ...successResponse('Employee details'),
        ...unauthorizedResponse,
        ...notFoundResponse,
      },
    },
  },

  '/notifications/send': {
    post: {
      tags: ['Notifications'],
      summary: 'Send notification (admin)',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'message', 'type', 'priority', 'targetAudience'],
              properties: {
                title: { type: 'string' },
                message: { type: 'string' },
                type: { type: 'string', enum: ['ANNOUNCEMENT', 'ATTENDANCE', 'LEAVE', 'SYSTEM', 'URGENT'] },
                priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                targetAudience: { type: 'string', enum: ['ALL', 'DEPARTMENT', 'SPECIFIC'] },
                targetDepartment: { type: 'string' },
                targetEmployeeIds: { type: 'array', items: { type: 'string' } },
                includeInactive: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        ...createdResponse('Notification sent'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'Get my notifications',
      security: authSecurity,
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        { in: 'query', name: 'unreadOnly', schema: { type: 'boolean' } },
      ],
      responses: {
        ...successResponse('Notifications list'),
        ...unauthorizedResponse,
      },
    },
  },

  '/notifications/unread-count': {
    get: {
      tags: ['Notifications'],
      summary: 'Get unread notification count',
      security: authSecurity,
      responses: {
        ...successResponse('Unread count'),
        ...unauthorizedResponse,
      },
    },
  },

  '/notifications/{id}/read': {
    put: {
      tags: ['Notifications'],
      summary: 'Mark a notification as read',
      security: authSecurity,
      parameters: [idPathParam],
      responses: {
        ...successResponse('Notification marked as read'),
        ...unauthorizedResponse,
        ...notFoundResponse,
      },
    },
  },

  '/notifications/read-all': {
    put: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      security: authSecurity,
      responses: {
        ...successResponse('All notifications marked as read'),
        ...unauthorizedResponse,
      },
    },
  },

  '/notifications/{id}': {
    delete: {
      tags: ['Notifications'],
      summary: 'Delete one notification for current user',
      security: authSecurity,
      parameters: [idPathParam],
      responses: {
        ...successResponse('Notification deleted'),
        ...unauthorizedResponse,
        ...notFoundResponse,
      },
    },
  },

  '/notifications/sent': {
    get: {
      tags: ['Notifications'],
      summary: 'Get sent notifications (admin)',
      security: authSecurity,
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        ...successResponse('Sent notifications'),
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/schedules': {
    get: {
      tags: ['Schedules'],
      summary: 'Get schedules',
      security: authSecurity,
      parameters: [{ in: 'query', name: 'employeeId', schema: { type: 'string' } }],
      responses: {
        ...successResponse('Schedules list'),
        ...unauthorizedResponse,
      },
    },
    post: {
      tags: ['Schedules'],
      summary: 'Create schedule',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeId', 'startTime', 'endTime'],
              properties: {
                employeeId: { type: 'string' },
                startTime: { type: 'string', example: '09:00' },
                endTime: { type: 'string', example: '18:00' },
                recurrence: { type: 'object', additionalProperties: true },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        ...createdResponse('Schedule created'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
  },

  '/schedules/{id}': {
    put: {
      tags: ['Schedules'],
      summary: 'Update schedule',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                startTime: { type: 'string' },
                endTime: { type: 'string' },
                recurrence: { type: 'object', additionalProperties: true },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Schedule updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...notFoundResponse,
      },
    },
  },

  '/schedules/logs': {
    get: {
      tags: ['Schedules'],
      summary: 'Get schedule change logs',
      security: authSecurity,
      parameters: [
        { in: 'query', name: 'employeeId', schema: { type: 'string' } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
      ],
      responses: {
        ...successResponse('Schedule logs'),
        ...unauthorizedResponse,
      },
    },
  },

  '/payrolls/my': {
    get: {
      tags: ['Payrolls'],
      summary: 'Get my payrolls',
      security: authSecurity,
      parameters: [
        { in: 'query', name: 'month', schema: { type: 'integer' } },
        { in: 'query', name: 'year', schema: { type: 'integer' } },
      ],
      responses: {
        ...successResponse('Payroll list'),
        ...unauthorizedResponse,
      },
    },
  },

  '/payrolls': {
    get: {
      tags: ['Payrolls'],
      summary: 'Get payroll list (admin)',
      security: authSecurity,
      parameters: [
        { in: 'query', name: 'month', schema: { type: 'integer' } },
        { in: 'query', name: 'year', schema: { type: 'integer' } },
        { in: 'query', name: 'employeeId', schema: { type: 'string' } },
        { in: 'query', name: 'status', schema: { type: 'string' } },
      ],
      responses: {
        ...successResponse('Payroll list'),
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
    post: {
      tags: ['Payrolls'],
      summary: 'Create payroll (admin)',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeId', 'period'],
              properties: {
                employeeId: { type: 'string' },
                period: {
                  type: 'object',
                  required: ['month', 'year'],
                  properties: {
                    month: { type: 'integer' },
                    year: { type: 'integer' },
                  },
                },
                baseSalary: { type: 'number' },
                allowances: { type: 'array', items: { type: 'object', additionalProperties: true } },
                deductions: { type: 'array', items: { type: 'object', additionalProperties: true } },
                status: { type: 'string', enum: ['PENDING', 'APPROVED', 'DRAFT'] },
              },
            },
          },
        },
      },
      responses: {
        ...createdResponse('Payroll created'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/payrolls/employees': {
    get: {
      tags: ['Payrolls'],
      summary: 'Get employees for payroll creation (admin)',
      security: authSecurity,
      responses: {
        ...successResponse('Employees list'),
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/payrolls/auto-calculate': {
    post: {
      tags: ['Payrolls'],
      summary: 'Auto-calculate payroll suggestion',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeId', 'month', 'year'],
              properties: {
                employeeId: { type: 'string' },
                month: { type: 'integer' },
                year: { type: 'integer' },
                baseSalary: { type: 'number' },
                overtimeMultiplier: { type: 'number' },
                latePenaltyPerLate: { type: 'number' },
                bhxhRate: { type: 'number' },
                pitRate: { type: 'number' },
                standardWorkingDays: { type: 'number' },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Auto-calculation result'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/payrolls/bulk': {
    post: {
      tags: ['Payrolls'],
      summary: 'Create payrolls in bulk',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeIds', 'period'],
              properties: {
                employeeIds: { type: 'array', items: { type: 'string' } },
                period: {
                  type: 'object',
                  required: ['month', 'year'],
                  properties: {
                    month: { type: 'integer' },
                    year: { type: 'integer' },
                  },
                },
                allowances: { type: 'array', items: { type: 'object', additionalProperties: true } },
                deductions: { type: 'array', items: { type: 'object', additionalProperties: true } },
                status: { type: 'string' },
                autoCalculate: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Bulk payroll processed'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/payrolls/{id}': {
    put: {
      tags: ['Payrolls'],
      summary: 'Update payroll by id',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
      responses: {
        ...successResponse('Payroll updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
        ...notFoundResponse,
      },
    },
  },

  '/payrolls/{id}/revise': {
    post: {
      tags: ['Payrolls'],
      summary: 'Revise an approved payroll',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['reason'],
              properties: {
                reason: { type: 'string' },
                period: { type: 'object', additionalProperties: true },
                baseSalary: { type: 'number' },
                allowances: { type: 'array', items: { type: 'object', additionalProperties: true } },
                deductions: { type: 'array', items: { type: 'object', additionalProperties: true } },
                status: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Payroll revised'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
        ...notFoundResponse,
      },
    },
  },

  '/payrolls/bulk-delete': {
    delete: {
      tags: ['Payrolls'],
      summary: 'Delete payrolls in bulk',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['ids'],
              properties: {
                ids: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Payrolls deleted'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/test': {
    get: {
      tags: ['Admin'],
      summary: 'Admin debug test endpoint',
      responses: {
        ...successResponse('Admin route is working'),
      },
    },
  },

  '/admin/dashboard': {
    get: {
      tags: ['Admin'],
      summary: 'Get admin dashboard summary',
      security: authSecurity,
      responses: {
        ...successResponse('Dashboard data'),
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/employees': {
    get: {
      tags: ['Admin'],
      summary: 'Get all employees in tenant',
      security: authSecurity,
      responses: {
        ...successResponse('Employees list'),
        ...unauthorizedResponse,
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create employee and user account',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['firstName', 'lastName', 'email'],
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                department: { type: 'string' },
                position: { type: 'string' },
                baseSalary: { type: 'number' },
              },
            },
          },
        },
      },
      responses: {
        ...createdResponse('Employee created'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/employees/{id}': {
    put: {
      tags: ['Admin'],
      summary: 'Update employee',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...successResponse('Employee updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
        ...notFoundResponse,
      },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete employee',
      security: authSecurity,
      parameters: [idPathParam],
      responses: {
        ...successResponse('Employee deleted'),
        ...unauthorizedResponse,
        ...forbiddenResponse,
        ...notFoundResponse,
      },
    },
  },

  '/admin/attendance': {
    get: {
      tags: ['Admin'],
      summary: 'Get attendance records by date',
      security: authSecurity,
      parameters: [{ in: 'query', name: 'date', schema: { type: 'string', format: 'date' } }],
      responses: {
        ...successResponse('Attendance records'),
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/attendance/today': {
    get: {
      tags: ['Admin'],
      summary: 'Get today attendance records',
      security: authSecurity,
      responses: {
        ...successResponse('Today attendance records'),
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/leave-requests': {
    get: {
      tags: ['Admin'],
      summary: 'Get leave requests',
      security: authSecurity,
      parameters: [
        { in: 'query', name: 'status', schema: { type: 'string' } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
      ],
      responses: {
        ...successResponse('Leave requests list'),
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/leave-requests/{id}': {
    patch: {
      tags: ['Admin'],
      summary: 'Approve/reject leave request',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['APPROVED', 'REJECTED'] },
                reviewComment: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Leave request updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/attendance-settings': {
    get: {
      tags: ['Admin'],
      summary: 'Get attendance formula settings',
      security: authSecurity,
      responses: {
        ...successResponse('Attendance settings'),
        ...unauthorizedResponse,
      },
    },
    put: {
      tags: ['Admin'],
      summary: 'Update attendance formula settings',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...successResponse('Attendance settings updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/attendance-settings/logs': {
    get: {
      tags: ['Admin'],
      summary: 'Get attendance settings change logs',
      security: authSecurity,
      parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } }],
      responses: {
        ...successResponse('Attendance settings logs'),
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/schedules/daily': {
    get: {
      tags: ['Admin'],
      summary: 'Get daily schedules map by weekStart',
      security: authSecurity,
      parameters: [{ in: 'query', name: 'weekStart', required: true, schema: { type: 'string', format: 'date' } }],
      responses: {
        ...successResponse('Daily schedule map'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create/update one employee daily schedule',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeId', 'date', 'shiftType'],
              properties: {
                employeeId: { type: 'string' },
                date: { type: 'string', format: 'date' },
                shiftType: { type: 'string' },
                startTime: { type: 'string' },
                endTime: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Daily schedule saved'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/schedules/daily/{id}': {
    delete: {
      tags: ['Admin'],
      summary: 'Delete one overridden daily schedule',
      security: authSecurity,
      parameters: [idPathParam],
      responses: {
        ...successResponse('Daily schedule deleted'),
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/schedules/logs': {
    get: {
      tags: ['Admin'],
      summary: 'Get schedule change logs (admin)',
      security: authSecurity,
      parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } }],
      responses: {
        ...successResponse('Schedule change logs'),
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/payroll-formula-settings': {
    get: {
      tags: ['Admin'],
      summary: 'Get payroll formula settings',
      security: authSecurity,
      responses: {
        ...successResponse('Payroll formula settings'),
        ...unauthorizedResponse,
      },
    },
    put: {
      tags: ['Admin'],
      summary: 'Update payroll formula settings',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...successResponse('Payroll formula settings updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/reward-rules': {
    get: {
      tags: ['Admin'],
      summary: 'Get reward and discipline rules',
      security: authSecurity,
      responses: {
        ...successResponse('Reward rules'),
        ...unauthorizedResponse,
      },
    },
    put: {
      tags: ['Admin'],
      summary: 'Update reward and discipline rules',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...successResponse('Reward rules updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/rewards': {
    get: {
      tags: ['Admin'],
      summary: 'Get rewards',
      security: authSecurity,
      parameters: [
        { in: 'query', name: 'employeeId', schema: { type: 'string' } },
        { in: 'query', name: 'month', schema: { type: 'integer' } },
        { in: 'query', name: 'year', schema: { type: 'integer' } },
        { in: 'query', name: 'status', schema: { type: 'string' } },
      ],
      responses: {
        ...successResponse('Rewards list'),
        ...unauthorizedResponse,
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create reward',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...createdResponse('Reward created'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/rewards/{id}': {
    patch: {
      tags: ['Admin'],
      summary: 'Update reward status/details',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...successResponse('Reward updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/disciplines': {
    get: {
      tags: ['Admin'],
      summary: 'Get disciplines',
      security: authSecurity,
      parameters: [
        { in: 'query', name: 'employeeId', schema: { type: 'string' } },
        { in: 'query', name: 'month', schema: { type: 'integer' } },
        { in: 'query', name: 'year', schema: { type: 'integer' } },
        { in: 'query', name: 'status', schema: { type: 'string' } },
      ],
      responses: {
        ...successResponse('Disciplines list'),
        ...unauthorizedResponse,
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create discipline',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...createdResponse('Discipline created'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/disciplines/{id}': {
    patch: {
      tags: ['Admin'],
      summary: 'Update discipline status/details',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...successResponse('Discipline updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/rewards/auto-calculate': {
    post: {
      tags: ['Admin'],
      summary: 'Auto-calculate reward records from attendance',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['month', 'year'],
              properties: {
                month: { type: 'integer' },
                year: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Auto-calculate executed'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/rewards/auto-calculate/employees': {
    get: {
      tags: ['Admin'],
      summary: 'Get employees for reward auto-calculate screen',
      security: authSecurity,
      responses: {
        ...successResponse('Employee list'),
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/reward-records': {
    get: {
      tags: ['Admin'],
      summary: 'Get employee reward records',
      security: authSecurity,
      parameters: [
        { in: 'query', name: 'month', schema: { type: 'integer' } },
        { in: 'query', name: 'year', schema: { type: 'integer' } },
      ],
      responses: {
        ...successResponse('Reward records'),
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/departments': {
    get: {
      tags: ['Admin'],
      summary: 'Get departments',
      security: authSecurity,
      responses: {
        ...successResponse('Departments list'),
        ...unauthorizedResponse,
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create department',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      },
      responses: {
        ...createdResponse('Department created'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/departments/{id}': {
    put: {
      tags: ['Admin'],
      summary: 'Update department',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...successResponse('Department updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete department',
      security: authSecurity,
      parameters: [idPathParam],
      responses: {
        ...successResponse('Department deleted'),
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/departments/{id}/employees': {
    get: {
      tags: ['Admin'],
      summary: 'Get employees in a department',
      security: authSecurity,
      parameters: [idPathParam],
      responses: {
        ...successResponse('Department employees'),
        ...unauthorizedResponse,
      },
    },
    patch: {
      tags: ['Admin'],
      summary: 'Bulk move employees into a department',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeIds'],
              properties: {
                employeeIds: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: {
        ...successResponse('Department employees updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/positions': {
    get: {
      tags: ['Admin'],
      summary: 'Get positions',
      security: authSecurity,
      responses: {
        ...successResponse('Positions list'),
        ...unauthorizedResponse,
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create position',
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...createdResponse('Position created'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/positions/{id}': {
    put: {
      tags: ['Admin'],
      summary: 'Update position',
      security: authSecurity,
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        ...successResponse('Position updated'),
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete position',
      security: authSecurity,
      parameters: [idPathParam],
      responses: {
        ...successResponse('Position deleted'),
        ...unauthorizedResponse,
        ...forbiddenResponse,
      },
    },
  },

  '/admin/positions/{id}/employees': {
    get: {
      tags: ['Admin'],
      summary: 'Get employees in a position',
      security: authSecurity,
      parameters: [idPathParam],
      responses: {
        ...successResponse('Position employees'),
        ...unauthorizedResponse,
      },
    },
  },

  '/admin/departments/{deptId}/positions': {
    get: {
      tags: ['Admin'],
      summary: 'Get positions by department id',
      security: authSecurity,
      parameters: [deptIdPathParam],
      responses: {
        ...successResponse('Department positions'),
        ...unauthorizedResponse,
      },
    },
  },
};

