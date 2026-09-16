import { Router } from 'express';
import { auth } from '../middleware/auth';
import { db } from '../db';

const r = Router();

/*
 * Get current employee attendance history
 */
r.get('/me', auth, async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        message: 'Employee profile not found',
      });
    }

    const records = await db('attendance')
      .where('employee_id', employeeId)
      .orderBy('attendance_date', 'desc')
      .limit(60);

    return res.json(records);
  } catch (error) {
    next(error);
  }
});

/*
 * Check in
 */
r.post('/check-in', auth, async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        message: 'Employee profile not found',
      });
    }

    const attendance = await db('attendance')
      .where({
        employee_id: employeeId,
        attendance_date: db.raw('CURRENT_DATE'),
      })
      .first();

    if (attendance?.check_in) {
      return res.status(409).json({
        message: 'Already checked in today',
      });
    }

    const now = new Date();

    if (attendance) {
      await db('attendance')
        .where({ id: attendance.id })
        .update({
          check_in: now,
          status: 'PRESENT',
          updated_at: now,
        });
    } else {
      await db('attendance').insert({
        employee_id: employeeId,
        attendance_date: db.raw('CURRENT_DATE'),
        check_in: now,
        status: 'PRESENT',
      });
    }

    return res.json({
      message: 'Check-in successful',
      checkIn: now,
    });
  } catch (error) {
    next(error);
  }
});

/*
 * Check out
 */
r.post('/check-out', auth, async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        message: 'Employee profile not found',
      });
    }

    const attendance = await db('attendance')
      .where({
        employee_id: employeeId,
        attendance_date: db.raw('CURRENT_DATE'),
      })
      .first();

    if (!attendance?.check_in) {
      return res.status(400).json({
        message: 'Check in first',
      });
    }

    if (attendance.check_out) {
      return res.status(409).json({
        message: 'Already checked out today',
      });
    }

    const now = new Date();

    const workedMinutes = Math.max(
      0,
      Math.floor(
        (now.getTime() -
          new Date(attendance.check_in).getTime()) /
          60000
      ) - Number(attendance.break_minutes || 0)
    );

    await db('attendance')
      .where({ id: attendance.id })
      .update({
        check_out: now,
        worked_minutes: workedMinutes,
        updated_at: now,
      });

    return res.json({
      message: 'Check-out successful',
      workedMinutes,
    });
  } catch (error) {
    next(error);
  }
});

export default r;