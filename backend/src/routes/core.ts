import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { auth, role } from '../middleware/auth';
import { db } from '../db';

const r = Router();

/* =========================================================
   DASHBOARD
========================================================= */

r.get('/dashboard/stats', auth, async (req, res, next) => {
  try {
    const [a, b, c, d] = await Promise.all([
      db('employees').count('id as n').first(),

      db('employees')
        .where({ status: 'ACTIVE' })
        .count('id as n')
        .first(),

      db('leave_requests')
        .where({ status: 'PENDING' })
        .count('id as n')
        .first(),

      db('attendance')
        .where('attendance_date', db.raw('CURRENT_DATE'))
        .count('id as n')
        .first(),
    ]);

    res.json({
      employees: Number(a?.n || 0),
      activeEmployees: Number(b?.n || 0),
      pendingLeaves: Number(c?.n || 0),
      todayAttendance: Number(d?.n || 0),
    });
  } catch (e) {
    next(e);
  }
});


/* =========================================================
   EMPLOYEES
========================================================= */

r.get(
  '/employees',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const employees = await db('employees')
        .join('users', 'users.id', 'employees.user_id')
        .leftJoin(
          'departments',
          'departments.id',
          'employees.department_id'
        )
        .select(
          'employees.*',
          'users.first_name',
          'users.last_name',
          'users.email',
          'departments.name as department'
        )
        .orderBy('employees.id', 'desc');

      res.json(employees);
    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   ANNOUNCEMENTS
========================================================= */

r.get('/announcements', auth, async (req, res, next) => {
  try {
    const announcements = await db('announcements')
      .orderBy('created_at', 'desc')
      .limit(20);

    res.json(announcements);
  } catch (e) {
    next(e);
  }
});


/* =========================================================
   NOTIFICATIONS
========================================================= */

r.get('/notifications', auth, async (req, res, next) => {
  try {
    const notifications = await db('notifications')
      .where({ user_id: req.user!.id })
      .orderBy('created_at', 'desc')
      .limit(30);

    res.json(notifications);
  } catch (e) {
    next(e);
  }
});


/* =========================================================
   LEAVE TYPES
========================================================= */

r.get('/leave/types', auth, async (req, res, next) => {
  try {
    const leaveTypes = await db('leave_types')
      .orderBy('name');

    res.json(leaveTypes);
  } catch (e) {
    next(e);
  }
});


/* =========================================================
   MY LEAVE REQUESTS
========================================================= */

r.get('/leave/me', auth, async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      return res.status(404).json({
        message: 'Employee profile not found',
      });
    }

    const requests = await db('leave_requests')
      .join(
        'leave_types',
        'leave_types.id',
        'leave_requests.leave_type_id'
      )
      .select(
        'leave_requests.*',
        'leave_types.name as leave_type'
      )
      .where('leave_requests.employee_id', employeeId)
      .orderBy('leave_requests.created_at', 'desc');

    res.json(requests);
  } catch (e) {
    next(e);
  }
});


/* =========================================================
   APPLY FOR LEAVE
========================================================= */

r.post('/leave', auth, async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      return res.status(404).json({
        message: 'Employee profile not found',
      });
    }

    const {
      leaveTypeId,
      startDate,
      endDate,
      days,
      reason,
    } = req.body;

    if (
      !leaveTypeId ||
      !startDate ||
      !endDate ||
      !days
    ) {
      return res.status(400).json({
        message:
          'leaveTypeId, startDate, endDate and days are required',
      });
    }

    const [leaveRequest] = await db('leave_requests')
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        days,
        reason: reason || null,
        status: 'PENDING',
      })
      .returning('*');

    res.status(201).json(leaveRequest);
  } catch (e) {
    next(e);
  }
});


/* =========================================================
   LEAVE STATUS
========================================================= */

r.patch(
  '/leave/:id/status',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const { status } = req.body;

      if (
        !['APPROVED', 'REJECTED', 'CANCELLED'].includes(
          status
        )
      ) {
        return res.status(400).json({
          message: 'Invalid status',
        });
      }

      const [leaveRequest] = await db('leave_requests')
        .where({ id: req.params.id })
        .update({
          status,
          approved_by: req.user!.id,
          updated_at: db.fn.now(),
        })
        .returning('*');

      if (!leaveRequest) {
        return res.status(404).json({
          message: 'Leave request not found',
        });
      }

      res.json(leaveRequest);
    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   PAYROLL - MY SALARY STRUCTURE
========================================================= */

r.get(
  '/payroll/salary-structure/me',
  auth,
  async (req, res, next) => {
    try {
      const employeeId = req.user?.employeeId;

      if (!employeeId) {
        return res.status(404).json({
          message: 'Employee profile not found',
        });
      }

      const salary = await db('salary_structures')
        .where('employee_id', employeeId)
        .orderBy('effective_from', 'desc')
        .first();

      if (!salary) {
        return res.status(404).json({
          message: 'Salary structure not found',
        });
      }

      res.json(salary);
    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   PAYROLL - MY PAYROLL HISTORY
========================================================= */

r.get('/payroll/me', auth, async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      return res.status(404).json({
        message: 'Employee profile not found',
      });
    }

    const payroll = await db('payroll')
      .where('employee_id', employeeId)
      .orderBy([
        {
          column: 'pay_year',
          order: 'desc',
        },
        {
          column: 'pay_month',
          order: 'desc',
        },
      ]);

    res.json(payroll);
  } catch (e) {
    next(e);
  }
});


/* =========================================================
   PAYROLL - HR / PAYROLL ADMIN
========================================================= */

r.get(
  '/payroll',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL'),
  async (req, res, next) => {
    try {
      const payroll = await db('payroll')
        .join(
          'employees',
          'employees.id',
          'payroll.employee_id'
        )
        .join(
          'users',
          'users.id',
          'employees.user_id'
        )
        .select(
          'payroll.*',
          'employees.employee_code',
          'users.first_name',
          'users.last_name'
        )
        .orderBy('payroll.created_at', 'desc');

      res.json(payroll);
    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   CREATE EMPLOYEE
========================================================= */

r.post(
  '/employees',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN'),
  async (req, res, next) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        role: userRole = 'EMPLOYEE',
        employeeCode,
        designation,
        departmentId,
      } = req.body;

      if (
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !employeeCode
      ) {
        return res.status(400).json({
          message:
            'firstName,lastName,email,password,employeeCode required',
        });
      }

      const normalizedEmail = email.toLowerCase();

      const existingUser = await db('users')
        .where({ email: normalizedEmail })
        .first();

      if (existingUser) {
        return res.status(409).json({
          message: 'Email already exists',
        });
      }

      const passwordHash = await bcrypt.hash(
        password,
        12
      );

      const [user] = await db('users')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: normalizedEmail,
          password_hash: passwordHash,
          role: userRole,
        })
        .returning('*');

      const [employee] = await db('employees')
        .insert({
          user_id: user.id,
          employee_code: employeeCode,
          designation: designation || null,
          department_id: departmentId || null,
        })
        .returning('*');

      await db('audit_logs').insert({
        user_id: req.user!.id,
        action: 'CREATE_EMPLOYEE',
        entity_type: 'EMPLOYEE',
        entity_id: employee.id,
        details: JSON.stringify({
          email: user.email,
        }),
      });

      res.status(201).json(employee);
    } catch (e) {
      next(e);
    }
  }
);


export default r;