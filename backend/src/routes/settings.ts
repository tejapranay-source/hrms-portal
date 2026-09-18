import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { db } from '../db';
import { auth } from '../middleware/auth';

const router = Router();

/*
 * ============================================================
 * GET MY SETTINGS / PROFILE
 * ============================================================
 */

router.get('/me', auth, async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Authentication required' });
    }

    const user = await db('users')
      .where('users.id', req.user.id)
      .leftJoin(
        'employees',
        'employees.user_id',
        'users.id'
      )
      .leftJoin(
        'departments',
        'employees.department_id',
        'departments.id'
      )
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.role',
        'users.is_active',
        'employees.employee_code',
        'employees.designation',
        'employees.joining_date',
        'employees.work_location',
        'employees.employment_type',
        'employees.status as employee_status',
        'departments.name as department_name'
      )
      .first();

    if (!user) {
      return res
        .status(404)
        .json({ message: 'User profile not found' });
    }

    return res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      employeeCode: user.employee_code ?? null,
      designation: user.designation ?? null,
      joiningDate: user.joining_date ?? null,
      workLocation: user.work_location ?? null,
      employmentType: user.employment_type ?? null,
      employeeStatus: user.employee_status ?? null,
      department: user.department_name ?? null,
    });
  } catch (error) {
    next(error);
  }
});

/*
 * ============================================================
 * UPDATE MY PROFILE
 * ============================================================
 *
 * Only personal name information is editable here.
 * Company-controlled information such as:
 * employee ID, department, designation and joining date
 * remains read-only.
 */

router.put('/profile', auth, async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Authentication required' });
    }

    const data = z
      .object({
        firstName: z
          .string()
          .trim()
          .min(1, 'First name is required')
          .max(80),
        lastName: z
          .string()
          .trim()
          .min(1, 'Last name is required')
          .max(80),
      })
      .parse(req.body);

    await db('users')
      .where({ id: req.user.id })
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
      });

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
  } catch (error) {
    next(error);
  }
});

/*
 * ============================================================
 * CHANGE PASSWORD
 * ============================================================
 */

router.put('/password', auth, async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Authentication required' });
    }

    const data = z
      .object({
        currentPassword: z
          .string()
          .min(1, 'Current password is required'),
        newPassword: z
          .string()
          .min(
            8,
            'New password must contain at least 8 characters'
          ),
        confirmPassword: z
          .string()
          .min(1, 'Please confirm your new password'),
      })
      .parse(req.body);

    if (data.newPassword !== data.confirmPassword) {
      return res.status(400).json({
        message: 'New password and confirmation do not match.',
      });
    }

    if (data.currentPassword === data.newPassword) {
      return res.status(400).json({
        message:
          'New password must be different from the current password.',
      });
    }

    const user = await db('users')
      .where({ id: req.user.id })
      .select('id', 'password_hash')
      .first();

    if (!user) {
      return res
        .status(404)
        .json({ message: 'User account not found.' });
    }

    const validPassword = await bcrypt.compare(
      data.currentPassword,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({
        message: 'Current password is incorrect.',
      });
    }

    const passwordHash = await bcrypt.hash(
      data.newPassword,
      12
    );

    await db('users')
      .where({ id: req.user.id })
      .update({
        password_hash: passwordHash,
      });

    /*
     * Add an audit record if the audit table exists.
     * This does not affect password change if audit logging
     * encounters a problem.
     */
    try {
      await db('audit_logs').insert({
        user_id: req.user.id,
        action: 'PASSWORD_CHANGED',
        entity_type: 'USER',
        entity_id: req.user.id,
        ip_address: req.ip,
      });
    } catch {
      // Password change has already succeeded.
    }

    return res.json({
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/*
 * ============================================================
 * LOGIN ACTIVITY
 * ============================================================
 */

router.get('/activity', auth, async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Authentication required' });
    }

    const activity = await db('audit_logs')
      .where({ user_id: req.user.id })
      .select(
        'id',
        'action',
        'entity_type',
        'created_at',
        'ip_address'
      )
      .orderBy('created_at', 'desc')
      .limit(15);

    return res.json(activity);
  } catch (error) {
    next(error);
  }
});

export default router;