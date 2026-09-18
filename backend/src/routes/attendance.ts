import { Router } from 'express';
import { auth, role, type Role } from '../middleware/auth';
import { db } from '../db';

const r = Router();

const MANAGEMENT_ROLES: Role[] = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'MANAGER',
];

let TZ =
  process.env.ATTENDANCE_TIMEZONE ||
  'Asia/Kolkata';

const STATUSES = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'HALF_DAY',
  'ON_LEAVE',
  'HOLIDAY',
  'WEEK_OFF',
  'EXCUSED',
];

function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }
  ).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ||
    '00';

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
}

function minutesOfDay(value: Date | string) {
  const date =
    typeof value === 'string'
      ? new Date(value)
      : value;

  const parts = localParts(date);

  return (
    parts.hour * 60 +
    parts.minute
  );
}

function parseDate(
  value: unknown,
  fallback = localParts().date
) {
  const date = String(value ?? fallback);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(
      'Invalid date. Use YYYY-MM-DD.'
    );
  }

  return date;
}

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number
) {
  const n = Number(value);

  if (!Number.isInteger(n)) {
    return fallback;
  }

  return Math.min(
    max,
    Math.max(min, n)
  );
}

function hmsToMinutes(value: string) {
  const match =
    /^(\d{1,2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

function csvCell(value: unknown) {
  const text =
    value == null ? '' : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function canManage(user: any) {
  return (
    user &&
    MANAGEMENT_ROLES.includes(user.role)
  );
}

/*
 * ---------------------------------------------------------
 * EMPLOYEE ACCESS
 * ---------------------------------------------------------
 */

async function ensureEmployeeAccess(
  user: any,
  employeeId: number
) {
  if (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'HR_ADMIN'
  ) {
    return true;
  }

  if (user.role === 'EMPLOYEE') {
    const employee =
      await db('employees')
        .select('id')
        .where({
          id: employeeId,
          user_id: user.id,
        })
        .first();

    return !!employee;
  }

  if (user.role === 'MANAGER') {
    const employee =
      await db('employees')
        .select('id')
        .where({
          id: employeeId,
          manager_id: user.employeeId,
        })
        .first();

    return !!employee;
  }

  return false;
}

/*
 * ---------------------------------------------------------
 * SHIFT
 * ---------------------------------------------------------
 */

async function getShift(
  employeeId: number,
  date: string
) {
  return db('employee_shift_assignments as es')
    .join(
      'attendance_shifts as s',
      's.id',
      'es.shift_id'
    )
    .select('s.*')
    .where(
      'es.employee_id',
      employeeId
    )
    .andWhere(
      'es.effective_from',
      '<=',
      date
    )
    .andWhere(function () {
      this.whereNull(
        'es.effective_to'
      ).orWhere(
        'es.effective_to',
        '>=',
        date
      );
    })
    .andWhere(
      'es.is_active',
      true
    )
    .andWhere(
      's.is_active',
      true
    )
    .orderBy(
      'es.effective_from',
      'desc'
    )
    .first();
}

function shiftDayIndex(date: string) {
  return new Date(
    `${date}T12:00:00Z`
  ).getUTCDay();
}

/*
 * ---------------------------------------------------------
 * BREAK CALCULATION
 * ---------------------------------------------------------
 */

async function getBreakMinutes(
  attendanceId: number
) {
  const row =
    await db('attendance_breaks')
      .where({
        attendance_id: attendanceId,
        status: 'COMPLETED',
      })
      .sum({
        minutes: 'duration_minutes',
      })
      .first();

  return Number(
    row?.minutes || 0
  );
}

async function recalculateAttendance(
  attendanceId: number
) {
  const attendance =
    await db('attendance')
      .where({ id: attendanceId })
      .first();

  if (!attendance) {
    return null;
  }

  const breakMinutes =
    await getBreakMinutes(
      attendanceId
    );

  let workedMinutes = Number(
    attendance.worked_minutes || 0
  );

  if (
    attendance.check_in &&
    attendance.check_out
  ) {
    const totalMinutes = Math.floor(
      (
        new Date(
          attendance.check_out
        ).getTime() -
        new Date(
          attendance.check_in
        ).getTime()
      ) / 60000
    );

    workedMinutes = Math.max(
      0,
      totalMinutes - breakMinutes
    );
  }

  await db('attendance')
    .where({ id: attendanceId })
    .update({
      break_minutes: breakMinutes,
      worked_minutes: workedMinutes,
      updated_at: new Date(),
    });

  return db('attendance')
    .where({ id: attendanceId })
    .first();
}

/*
 * ---------------------------------------------------------
 * STATUS CALCULATION
 * ---------------------------------------------------------
 */

async function calculateStatus(
  employeeId: number,
  date: string,
  checkIn: Date | null,
  checkOut: Date | null,
  workedMinutes: number | null
) {
  const leave =
    await db('leave_requests')
      .where(
        'employee_id',
        employeeId
      )
      .where(
        'status',
        'APPROVED'
      )
      .andWhere(
        'start_date',
        '<=',
        date
      )
      .andWhere(
        'end_date',
        '>=',
        date
      )
      .first()
      .catch(() => null);

  if (
    leave &&
    !checkIn
  ) {
    return 'ON_LEAVE';
  }

  const holiday =
    await db('attendance_holidays')
      .where({
        holiday_date: date,
        is_active: true,
      })
      .first();

  if (
    holiday &&
    !checkIn
  ) {
    return 'HOLIDAY';
  }

  const shift =
    await getShift(
      employeeId,
      date
    );

  if (
    !shift &&
    !checkIn
  ) {
    return 'ABSENT';
  }

  if (
    shift &&
    !checkIn
  ) {
    const day =
      shiftDayIndex(date);

    const weeklyOffDay =
      day === 0
        ? await db('attendance_settings')
            .where({
              setting_key: 'weekly_off_sunday',
            })
            .first()
            .then((row) =>
              String(row?.setting_value || 'true') === 'true'
            )
        : day === 6
          ? await db('attendance_settings')
              .where({
                setting_key: 'weekly_off_saturday',
              })
              .first()
              .then((row) =>
                String(row?.setting_value || 'true') === 'true'
              )
          : false;

    if (weeklyOffDay) {
      return 'WEEK_OFF';
    }

    return 'ABSENT';
  }

  if (!checkIn) {
    return 'PRESENT';
  }

  /*
   * If there is no shift, attendance
   * is simply PRESENT.
   */
  if (!shift) {
    return 'PRESENT';
  }

  const graceMinutes =
    Number(
      shift.grace_minutes || 0
    );

  const startMinutes =
    hmsToMinutes(
      String(shift.start_time)
    );

  const endMinutes =
    hmsToMinutes(
      String(shift.end_time)
    );

  const checkInMinutes =
    minutesOfDay(checkIn);

  const isLate =
    startMinutes !== null &&
    checkInMinutes >
      startMinutes + graceMinutes;

  /*
   * Only classify HALF_DAY after checkout
   * because before checkout worked_minutes
   * is normally zero.
   */
  const halfDayThreshold =
    Number(
      Math.floor(
        Number(
          shift.expected_work_minutes || 480
        ) / 2
      )
    );

  const isHalfDay =
    checkOut !== null &&
    workedMinutes !== null &&
    workedMinutes <
      halfDayThreshold;

  if (isHalfDay) {
    return 'HALF_DAY';
  }

  if (isLate) {
    return 'LATE';
  }

  /*
   * Existing schema does not have a dedicated
   * EARLY_CHECKOUT status, so EXCUSED is retained
   * for early checkout.
   */
  if (
    checkOut &&
    endMinutes !== null &&
    minutesOfDay(checkOut) <
      endMinutes
  ) {
    return 'EXCUSED';
  }

  return 'PRESENT';
}

async function updateAttendanceStatus(
  attendanceId: number
) {
  const attendance =
    await db('attendance')
      .where({ id: attendanceId })
      .first();

  if (!attendance) {
    return;
  }

  const status =
    await calculateStatus(
      Number(
        attendance.employee_id
      ),
      String(
        attendance.attendance_date
      ).slice(0, 10),
      attendance.check_in
        ? new Date(
            attendance.check_in
          )
        : null,
      attendance.check_out
        ? new Date(
            attendance.check_out
          )
        : null,
      attendance.worked_minutes ==
        null
        ? null
        : Number(
            attendance.worked_minutes
          )
    );

  await db('attendance')
    .where({ id: attendanceId })
    .update({
      status,
      updated_at: new Date(),
    });
}

/*
 * ---------------------------------------------------------
 * AUDIT LOG
 * ---------------------------------------------------------
 */

async function audit(
  userId: number,
  action: string,
  entityId: number | null,
  details: any
) {
  try {
    await db('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: 'attendance',
      entity_id: entityId,
      details: JSON.stringify(
        details
      ),
    });
  } catch {
    /*
     * Audit failure must never
     * break attendance operations.
     */
  }
}

/*
 * =========================================================
 * EMPLOYEE SELF SERVICE
 * =========================================================
 */

/*
 * GET /api/attendance/me
 */
r.get(
  '/me',
  auth,
  async (req, res, next) => {
    try {
      const employeeId =
        req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({
          message:
            'Employee profile not found',
        });
      }

      const defaultFrom =
        (() => {
          const date =
            new Date();

          date.setDate(
            date.getDate() - 59
          );

          return localParts(date)
            .date;
        })();

      const from = parseDate(
        req.query.from,
        defaultFrom
      );

      const to = parseDate(
        req.query.to
      );

      const records =
        await db('attendance')
          .where(
            'employee_id',
            employeeId
          )
          .whereBetween(
            'attendance_date',
            [from, to]
          )
          .orderBy(
            'attendance_date',
            'desc'
          );

      return res.json(records);
    } catch (error) {
      next(error);
    }
  }
);

/*
 * GET /api/attendance/today
 */
r.get(
  '/today',
  auth,
  async (req, res, next) => {
    try {
      const employeeId =
        req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({
          message:
            'Employee profile not found',
        });
      }

      const date = parseDate(
        req.query.date
      );

      let attendance =
        await db('attendance')
          .where({
            employee_id:
              employeeId,
            attendance_date:
              date,
          })
          .first();

      if (attendance) {
        await recalculateAttendance(
          attendance.id
        );

        await updateAttendanceStatus(
          attendance.id
        );

        attendance =
          await db('attendance')
            .where({
              id: attendance.id,
            })
            .first();
      }

      const shift =
        await getShift(
          employeeId,
          date
        );

      const holiday =
        await db(
          'attendance_holidays'
        )
          .where({
            holiday_date: date,
            is_active: true,
          })
          .first();

      return res.json({
        date,
        attendance:
          attendance || null,
        shift: shift || null,
        holiday:
          holiday || null,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * CHECK IN
 * =========================================================
 */

r.post(
  '/check-in',
  auth,
  async (req, res, next) => {
    try {
      const employeeId =
        req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({
          message:
            'Employee profile not found',
        });
      }

      const date =
        localParts().date;

      const now =
        new Date();

      let attendance =
        await db('attendance')
          .where({
            employee_id:
              employeeId,
            attendance_date:
              date,
          })
          .first();

      if (attendance?.check_in) {
        return res.status(409).json({
          message:
            'Already checked in today',
          attendance,
        });
      }

      if (attendance) {
        await db('attendance')
          .where({
            id: attendance.id,
          })
          .update({
            check_in: now,
            status: 'PRESENT',
            updated_at: now,
          });
      } else {
        const inserted =
          await db('attendance')
            .insert({
              employee_id:
                employeeId,
              attendance_date:
                date,
              check_in: now,
              status: 'PRESENT',
              break_minutes: 0,
              worked_minutes: 0,
            })
            .returning('id');

        const id = Number(
          inserted[0].id ??
            inserted[0]
        );

        attendance =
          await db('attendance')
            .where({ id })
            .first();
      }

      await updateAttendanceStatus(
        Number(attendance!.id)
      );

      attendance =
        await db('attendance')
          .where({
            id: attendance!.id,
          })
          .first();

      await audit(
        req.user!.id,
        'CHECK_IN',
        Number(attendance!.id),
        {
          employeeId,
          date,
        }
      );

      return res.json({
        message:
          'Check-in successful',
        checkIn:
          attendance?.check_in,
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * CHECK OUT
 * =========================================================
 */

r.post(
  '/check-out',
  auth,
  async (req, res, next) => {
    try {
      const employeeId =
        req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({
          message:
            'Employee profile not found',
        });
      }

      const date =
        localParts().date;

      const attendance =
        await db('attendance')
          .where({
            employee_id:
              employeeId,
            attendance_date:
              date,
          })
          .first();

      if (!attendance?.check_in) {
        return res.status(400).json({
          message:
            'Check in first',
        });
      }

      if (attendance.check_out) {
        return res.status(409).json({
          message:
            'Already checked out today',
          attendance,
        });
      }

      /*
       * Prevent checkout while a break
       * is still open.
       */
      const openBreak =
        await db(
          'attendance_breaks'
        )
          .where({
            attendance_id:
              attendance.id,
            status: 'OPEN',
          })
          .first();

      if (openBreak) {
        return res.status(400).json({
          message:
            'Please end your active break before checking out.',
        });
      }

      const now =
        new Date();

      await db('attendance')
        .where({
          id: attendance.id,
        })
        .update({
          check_out: now,
          updated_at: now,
        });

      await recalculateAttendance(
        attendance.id
      );

      await updateAttendanceStatus(
        attendance.id
      );

      const result =
        await db('attendance')
          .where({
            id: attendance.id,
          })
          .first();

      await audit(
        req.user!.id,
        'CHECK_OUT',
        attendance.id,
        {
          employeeId,
          date,
          workedMinutes:
            result?.worked_minutes,
        }
      );

      return res.json({
        message:
          'Check-out successful',
        workedMinutes:
          result?.worked_minutes || 0,
        attendance: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * BREAK MANAGEMENT
 * =========================================================
 */

/*
 * POST /api/attendance/break/start
 */
r.post(
  '/break/start',
  auth,
  async (req, res, next) => {
    try {
      const employeeId =
        req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({
          message:
            'Employee profile not found',
        });
      }

      const date =
        localParts().date;

      const attendance =
        await db('attendance')
          .where({
            employee_id:
              employeeId,
            attendance_date:
              date,
          })
          .first();

      if (
        !attendance?.check_in ||
        attendance.check_out
      ) {
        return res.status(400).json({
          message:
            'You must be checked in and not checked out.',
        });
      }

      const openBreak =
        await db(
          'attendance_breaks'
        )
          .where({
            attendance_id:
              attendance.id,
            status: 'OPEN',
          })
          .first();

      if (openBreak) {
        return res.status(409).json({
          message:
            'A break is already running',
          break: openBreak,
        });
      }

      const inserted =
        await db(
          'attendance_breaks'
        )
          .insert({
            attendance_id:
              attendance.id,
            started_at:
              new Date(),
            status: 'OPEN',
            duration_minutes: 0,
          })
          .returning('*');

      await audit(
        req.user!.id,
        'BREAK_START',
        attendance.id,
        {
          employeeId,
          date,
        }
      );

      return res.json({
        message:
          'Break started',
        break: inserted[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * POST /api/attendance/break/end
 */
r.post(
  '/break/end',
  auth,
  async (req, res, next) => {
    try {
      const employeeId =
        req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({
          message:
            'Employee profile not found',
        });
      }

      const date =
        localParts().date;

      const attendance =
        await db('attendance')
          .where({
            employee_id:
              employeeId,
            attendance_date:
              date,
          })
          .first();

      if (!attendance) {
        return res.status(400).json({
          message:
            'No attendance record for today',
        });
      }

      const activeBreak =
        await db(
          'attendance_breaks'
        )
          .where({
            attendance_id:
              attendance.id,
            status: 'OPEN',
          })
          .orderBy(
            'started_at',
            'desc'
          )
          .first();

      if (!activeBreak) {
        return res.status(400).json({
          message:
            'No active break',
        });
      }

      const endedAt =
        new Date();

      const durationMinutes =
        Math.max(
          0,
          Math.floor(
            (
              endedAt.getTime() -
              new Date(
                activeBreak.started_at
              ).getTime()
            ) / 60000
          )
        );

      await db(
        'attendance_breaks'
      )
        .where({
          id: activeBreak.id,
        })
        .update({
          ended_at: endedAt,
          duration_minutes:
            durationMinutes,
          status: 'COMPLETED',
          updated_at: endedAt,
        });

      await recalculateAttendance(
        attendance.id
      );

      if (attendance.check_out) {
        await updateAttendanceStatus(
          attendance.id
        );
      }

      await audit(
        req.user!.id,
        'BREAK_END',
        attendance.id,
        {
          employeeId,
          date,
          durationMinutes,
        }
      );

      return res.json({
        message:
          'Break ended',
        durationMinutes,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * ATTENDANCE HISTORY
 * =========================================================
 */

/*
 * GET /api/attendance/history
 */
r.get(
  '/history',
  auth,
  async (req, res, next) => {
    try {
      const user =
        req.user!;

      const requestedEmployee =
        req.query.employeeId
          ? Number(
              req.query.employeeId
            )
          : null;

      const employeeId =
        user.role === 'EMPLOYEE'
          ? Number(
              user.employeeId
            )
          : requestedEmployee;

      if (
        user.role === 'EMPLOYEE' &&
        !employeeId
      ) {
        return res.status(400).json({
          message:
            'Employee profile not found',
        });
      }

      if (
        user.role === 'MANAGER' &&
        requestedEmployee &&
        !(await ensureEmployeeAccess(
          user,
          requestedEmployee
        ))
      ) {
        return res.status(403).json({
          message:
            'You can only access your team attendance',
        });
      }

      const defaultFrom =
        (() => {
          const date =
            new Date();

          date.setDate(
            date.getDate() - 30
          );

          return localParts(date)
            .date;
        })();

      const from = parseDate(
        req.query.from,
        defaultFrom
      );

      const to = parseDate(
        req.query.to
      );

      const status =
        req.query.status
          ? String(
              req.query.status
            )
          : null;

      if (
        status &&
        !STATUSES.includes(status)
      ) {
        return res.status(400).json({
          message:
            'Invalid attendance status',
        });
      }

      const departmentId =
        req.query.departmentId
          ? Number(
              req.query.departmentId
            )
          : null;

      const search =
        String(
          req.query.search || ''
        ).trim();

      const page =
        clampInt(
          req.query.page,
          1,
          100000,
          1
        );

      const limit =
        clampInt(
          req.query.limit,
          1,
          200,
          50
        );

      let query =
        db('attendance as a')
          .join(
            'employees as e',
            'e.id',
            'a.employee_id'
          )
          .join(
            'users as u',
            'u.id',
            'e.user_id'
          )
          .leftJoin(
            'departments as d',
            'd.id',
            'e.department_id'
          )
          .select(
            'a.*',
            'e.employee_code',
            'e.department_id',
            'd.name as department_name',
            'u.first_name',
            'u.last_name',
            'u.email'
          )
          .whereBetween(
            'a.attendance_date',
            [from, to]
          );

      if (employeeId) {
        query =
          query.andWhere(
            'a.employee_id',
            employeeId
          );
      }

      if (departmentId) {
        query =
          query.andWhere(
            'e.department_id',
            departmentId
          );
      }

      if (status) {
        query =
          query.andWhere(
            'a.status',
            status
          );
      }

      if (search) {
        query =
          query.andWhere(
            function () {
              this.whereILike(
                'u.first_name',
                `%${search}%`
              )
                .orWhereILike(
                  'u.last_name',
                  `%${search}%`
                )
                .orWhereILike(
                  'e.employee_code',
                  `%${search}%`
                )
                .orWhereILike(
                  'u.email',
                  `%${search}%`
                );
            }
          );
      }

      if (
        user.role === 'MANAGER'
      ) {
        query =
          query.andWhere(
            'e.manager_id',
            user.employeeId
          );
      }

      const countResult =
        await query
          .clone()
          .clearSelect()
          .clearOrder()
          .count({
            count: 'a.id',
          })
          .first();

      const total =
        Number(
          countResult?.count || 0
        );

      const data =
        await query
          .orderBy(
            'a.attendance_date',
            'desc'
          )
          .orderBy(
            'u.first_name',
            'asc'
          )
          .limit(limit)
          .offset(
            (page - 1) * limit
          );

      return res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages:
            Math.ceil(
              total / limit
            ),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * DAILY ATTENDANCE
 * =========================================================
 */

/*
 * GET /api/attendance/daily
 */
r.get(
  '/daily',
  auth,
  role(...MANAGEMENT_ROLES),
  async (req, res, next) => {
    try {
      const date =
        parseDate(
          req.query.date
        );

      const employees =
        await db('employees as e')
          .join(
            'users as u',
            'u.id',
            'e.user_id'
          )
          .leftJoin(
            'departments as d',
            'd.id',
            'e.department_id'
          )
          .select(
            'e.id as employee_id',
            'e.employee_code',
            'e.department_id',
            'd.name as department_name',
            'u.first_name',
            'u.last_name',
            'u.email'
          )
          .where(
            'e.status',
            'ACTIVE'
          )
          .modify((query) => {
            if (
              req.user!.role ===
              'MANAGER'
            ) {
              query.where(
                'e.manager_id',
                req.user!.employeeId
              );
            }
          });

      const records =
        await db('attendance')
          .where(
            'attendance_date',
            date
          );

      const result =
        await Promise.all(
          employees.map(
             async (employee: any) => {
              const attendance =
                records.find(
                  (record) =>
                    Number(
                      record.employee_id
                    ) ===
                    Number(
                      employee.employee_id
                    )
                );

              const status =
                attendance?.status ||
                await calculateStatus(
                  Number(
                    employee.employee_id
                  ),
                  date,
                  null,
                  null,
                  null
                );

              return {
                ...employee,
                attendance:
                  attendance ||
                  null,
                status,
              };
            }
          )
        );

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * ATTENDANCE SUMMARY / DASHBOARD
 * =========================================================
 */

/*
 * GET /api/attendance/summary
 */
r.get(
  '/summary',
  auth,
  async (req, res, next) => {
    try {
      const date =
        parseDate(
          req.query.date
        );

      let employeeQuery =
        db('employees as e')
          .where(
            'e.status',
            'ACTIVE'
          );

      if (
        req.user!.role ===
        'EMPLOYEE'
      ) {
        employeeQuery =
          employeeQuery.where(
            'e.id',
            req.user!.employeeId
          );
      } else if (
        req.user!.role ===
        'MANAGER'
      ) {
        employeeQuery =
          employeeQuery.where(
            'e.manager_id',
            req.user!.employeeId
          );
      }

      const employees =
        await employeeQuery.select(
          'e.id'
        );

      const ids =
        employees.map(
          (employee) =>
            Number(employee.id)
        );

      const records =
        ids.length
          ? await db('attendance')
              .whereIn(
                'employee_id',
                ids
              )
              .where(
                'attendance_date',
                date
              )
          : [];

      const counts: Record<
        string,
        number
      > = {};

      for (
        const employee of employees
      ) {
        const attendance =
          records.find(
            (record) =>
              Number(
                record.employee_id
              ) ===
              Number(employee.id)
          );

        const status =
          attendance?.status ||
          await calculateStatus(
            Number(employee.id),
            date,
            null,
            null,
            null
          );

        counts[status] =
          (counts[status] || 0) + 1;
      }

      const total =
        ids.length;

      const workedMinutes =
        records.reduce(
          (totalMinutes, record) =>
            totalMinutes +
            Number(
              record.worked_minutes ||
                0
            ),
          0
        );

      return res.json({
        date,
        total,

        present:
          counts.PRESENT || 0,

        absent:
          counts.ABSENT || 0,

        late:
          counts.LATE || 0,

        halfDay:
          counts.HALF_DAY || 0,

        onLeave:
          counts.ON_LEAVE || 0,

        holiday:
          counts.HOLIDAY || 0,

        weekOff:
          counts.WEEK_OFF || 0,

        averageWorkedMinutes:
          total
            ? Math.round(
                workedMinutes /
                  total
              )
            : 0,

        counts,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * ATTENDANCE CORRECTIONS
 * =========================================================
 */

/*
 * POST /api/attendance/corrections
 */
r.post(
  '/corrections',
  auth,
  async (req, res, next) => {
    try {
      const employeeId =
        req.user!.role ===
        'EMPLOYEE'
          ? req.user!.employeeId
          : Number(
              req.body.employeeId
            );

      if (
        !employeeId ||
        !(await ensureEmployeeAccess(
          req.user,
          employeeId
        ))
      ) {
        return res.status(403).json({
          message:
            'You cannot request a correction for this employee',
        });
      }

      const attendanceDate =
        parseDate(
          req.body.attendanceDate
        );

      const reason =
        String(
          req.body.reason || ''
        ).trim();

      if (!reason) {
        return res.status(400).json({
          message:
            'Reason is required',
        });
      }

      const existing =
        await db(
          'attendance_corrections'
        )
          .where({
            employee_id:
              employeeId,
            attendance_date:
              attendanceDate,
            status: 'PENDING',
          })
          .first();

      if (existing) {
        return res.status(409).json({
          message:
            'A correction request is already pending for this date',
        });
      }

      const breakMinutes =
        req.body.breakMinutes ==
        null
          ? null
          : Number(
              req.body.breakMinutes
            );

      if (
        breakMinutes !== null &&
        (
          !Number.isInteger(
            breakMinutes
          ) ||
          breakMinutes < 0
        )
      ) {
        return res.status(400).json({
          message:
            'breakMinutes must be a non-negative integer',
        });
      }

      const row =
        await db(
          'attendance_corrections'
        )
          .insert({
            employee_id:
              employeeId,
            attendance_date:
              attendanceDate,
            requested_check_in:
              req.body.checkIn ||
              null,
            requested_check_out:
              req.body.checkOut ||
              null,
            requested_break_minutes:
              breakMinutes,
            reason,
            status: 'PENDING',
            requested_by:
              req.user!.id,
          })
          .returning('*');

      await audit(
        req.user!.id,
        'CORRECTION_REQUESTED',
        Number(row[0].id),
        {
          employeeId,
          attendanceDate,
        }
      );

      return res.status(201).json(
        row[0]
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * GET /api/attendance/corrections
 */
r.get(
  '/corrections',
  auth,
  async (req, res, next) => {
    try {
      let query =
        db(
          'attendance_corrections as c'
        )
          .join(
            'employees as e',
            'e.id',
            'c.employee_id'
          )
          .join(
            'users as u',
            'u.id',
            'e.user_id'
          )
          .leftJoin(
            'users as ru',
            'ru.id',
            'c.requested_by'
          )
          .leftJoin(
            'users as au',
            'au.id',
            'c.reviewed_by'
          )
          .select(
            'c.*',
            'e.employee_code',
            'u.first_name',
            'u.last_name',
            'ru.email as requester_email',
            'au.email as reviewer_email'
          )
          .orderBy(
            'c.created_at',
            'desc'
          );

      if (
        req.user!.role ===
        'EMPLOYEE'
      ) {
        query =
          query.where(
            'c.employee_id',
            req.user!.employeeId
          );
      }

      if (
        req.user!.role ===
        'MANAGER'
      ) {
        query =
          query.where(
            'e.manager_id',
            req.user!.employeeId
          );
      }

      if (req.query.status) {
        query =
          query.where(
            'c.status',
            String(
              req.query.status
            )
          );
      }

      return res.json(
        await query.limit(200)
      );
    } catch (error) {
      next(error);
    }
  }
);

async function reviewCorrection(
  req: any,
  res: any,
  next: any,
  approved: boolean
) {
  try {
    if (
      !canManage(req.user) ||
      (
        req.user.role ===
          'MANAGER' &&
        !req.user.employeeId
      )
    ) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    const id =
      Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message:
          'Invalid correction ID',
      });
    }

    const correction =
      await db(
        'attendance_corrections'
      )
        .where({ id })
        .first();

    if (!correction) {
      return res.status(404).json({
        message:
          'Correction request not found',
      });
    }

    if (
      req.user.role ===
        'MANAGER' &&
      !(await ensureEmployeeAccess(
        req.user,
        Number(
          correction.employee_id
        )
      ))
    ) {
      return res.status(403).json({
        message:
          'Not your team member',
      });
    }

    if (
      correction.status !==
      'PENDING'
    ) {
      return res.status(409).json({
        message:
          'Correction has already been reviewed',
      });
    }

    await db.transaction(
      async (trx) => {
        await trx(
          'attendance_corrections'
        )
          .where({ id })
          .update({
            status: approved
              ? 'APPROVED'
              : 'REJECTED',

            reviewed_by:
              req.user.id,

            reviewed_at:
              new Date(),

            review_note:
              req.body?.reviewNote ||
              null,

            updated_at:
              new Date(),
          });

        if (!approved) {
          return;
        }

        let attendance =
          await trx(
            'attendance'
          )
            .where({
              employee_id:
                correction.employee_id,

              attendance_date:
                correction.attendance_date,
            })
            .first();

        const patch: any = {
          updated_at:
            new Date(),
        };

        if (
          correction.requested_check_in !==
          null
        ) {
          patch.check_in =
            correction.requested_check_in;
        }

        if (
          correction.requested_check_out !==
          null
        ) {
          patch.check_out =
            correction.requested_check_out;
        }

        if (
          correction.requested_break_minutes !==
          null
        ) {
          patch.break_minutes =
            Number(
              correction.requested_break_minutes
            );
        }

        if (attendance) {
          await trx(
            'attendance'
          )
            .where({
              id: attendance.id,
            })
            .update(patch);
        } else {
          const inserted =
            await trx(
              'attendance'
            )
              .insert({
                employee_id:
                  correction.employee_id,

                attendance_date:
                  correction.attendance_date,

                check_in:
                  correction.requested_check_in,

                check_out:
                  correction.requested_check_out,

                break_minutes:
                  Number(
                    correction.requested_break_minutes ||
                      0
                  ),

                worked_minutes: 0,

                status:
                  'PRESENT',
              })
              .returning('id');

          const newId =
            Number(
              inserted[0].id ??
                inserted[0]
            );

          attendance =
            await trx(
              'attendance'
            )
              .where({
                id: newId,
              })
              .first();
        }

        if (
          attendance?.check_in &&
          attendance?.check_out
        ) {
          const workedMinutes =
            Math.max(
              0,
              Math.floor(
                (
                  new Date(
                    attendance.check_out
                  ).getTime() -
                  new Date(
                    attendance.check_in
                  ).getTime()
                ) / 60000
              ) -
                Number(
                  attendance.break_minutes ||
                    0
                )
            );

          await trx(
            'attendance'
          )
            .where({
              id: attendance.id,
            })
            .update({
              worked_minutes:
                workedMinutes,
            });
        }
      }
    );

    const updated =
      await db(
        'attendance_corrections'
      )
        .where({ id })
        .first();

    if (
      approved &&
      updated
    ) {
      const attendance =
        await db('attendance')
          .where({
            employee_id:
              updated.employee_id,

            attendance_date:
              updated.attendance_date,
          })
          .first();

      if (attendance) {
        await updateAttendanceStatus(
          Number(
            attendance.id
          )
        );
      }
    }

    await audit(
      req.user.id,
      approved
        ? 'CORRECTION_APPROVED'
        : 'CORRECTION_REJECTED',
      id,
      {
        attendanceCorrectionId:
          id,
      }
    );

    return res.json(
      updated
    );
  } catch (error) {
    next(error);
  }
}

r.patch(
  '/corrections/:id/approve',
  auth,
  role(...MANAGEMENT_ROLES),
  (
    req,
    res,
    next
  ) =>
    reviewCorrection(
      req,
      res,
      next,
      true
    )
);

r.patch(
  '/corrections/:id/reject',
  auth,
  role(...MANAGEMENT_ROLES),
  (
    req,
    res,
    next
  ) =>
    reviewCorrection(
      req,
      res,
      next,
      false
    )
);

/*
 * =========================================================
 * SHIFTS
 * =========================================================
 */

/*
 * GET /api/attendance/shifts
 */
r.get(
  '/shifts',
  auth,
  role(...MANAGEMENT_ROLES),
  async (req, res, next) => {
    try {
      const shifts =
        await db('shifts')
          .where(
            'is_active',
            true
          )
          .orderBy(
            'name'
          );

      return res.json(shifts);
    } catch (error) {
      next(error);
    }
  }
);

/*
 * POST /api/attendance/shifts
 */
r.post(
  '/shifts',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const name =
        String(
          req.body.name || ''
        ).trim();

      const startTime =
        String(
          req.body.startTime || ''
        );

      const endTime =
        String(
          req.body.endTime || ''
        );

      const startMinutes =
        hmsToMinutes(
          startTime
        );

      const endMinutes =
        hmsToMinutes(
          endTime
        );

      if (
        !name ||
        startMinutes ===
          null ||
        endMinutes ===
          null
      ) {
        return res.status(400).json({
          message:
            'name, startTime and endTime are required (HH:MM)',
        });
      }

      const workMinutes =
        Number(
          req.body.workMinutes ??
            (
              (
                endMinutes -
                startMinutes +
                1440
              ) % 1440 ||
              1440
            )
        );

      const graceMinutes =
        Number(
          req.body.graceMinutes ??
            0
        );

      const halfDayMinutes =
        Number(
          req.body.halfDayMinutes ??
            Math.floor(
              workMinutes / 2
            )
        );

      const weeklyOffDays =
        Array.isArray(
          req.body.weeklyOffDays
        )
          ? req.body.weeklyOffDays
          : [0, 6];

      if (
        !Number.isInteger(
          workMinutes
        ) ||
        workMinutes <= 0
      ) {
        return res.status(400).json({
          message:
            'workMinutes must be a positive integer',
        });
      }

      if (
        !Number.isInteger(
          graceMinutes
        ) ||
        graceMinutes < 0
      ) {
        return res.status(400).json({
          message:
            'graceMinutes must be a non-negative integer',
        });
      }

      if (
        !Number.isInteger(
          halfDayMinutes
        ) ||
        halfDayMinutes < 0
      ) {
        return res.status(400).json({
          message:
            'halfDayMinutes must be a non-negative integer',
        });
      }

      const row =
        await db('shifts')
          .insert({
            name,
            start_time:
              startTime,
            end_time:
              endTime,
            work_minutes:
              workMinutes,
            grace_minutes:
              graceMinutes,
            half_day_minutes:
              halfDayMinutes,
            weekly_off_days:
              weeklyOffDays,
            is_active: true,
          })
          .returning('*');

      return res.status(201).json(
        row[0]
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * PATCH /api/attendance/shifts/:id
 */
r.patch(
  '/shifts/:id',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const id =
        Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message:
            'Invalid shift ID',
        });
      }

      const patch: any = {};

      if (
        req.body.name != null
      ) {
        patch.name =
          String(
            req.body.name
          ).trim();
      }

      if (
        req.body.startTime !=
        null
      ) {
        if (
          hmsToMinutes(
            String(
              req.body.startTime
            )
          ) === null
        ) {
          return res.status(400).json({
            message:
              'Invalid startTime',
          });
        }

        patch.start_time =
          String(
            req.body.startTime
          );
      }

      if (
        req.body.endTime !=
        null
      ) {
        if (
          hmsToMinutes(
            String(
              req.body.endTime
            )
          ) === null
        ) {
          return res.status(400).json({
            message:
              'Invalid endTime',
          });
        }

        patch.end_time =
          String(
            req.body.endTime
          );
      }

      if (
        req.body.graceMinutes !=
        null
      ) {
        patch.grace_minutes =
          Number(
            req.body.graceMinutes
          );
      }

      if (
        req.body.halfDayMinutes !=
        null
      ) {
        patch.half_day_minutes =
          Number(
            req.body.halfDayMinutes
          );
      }

      if (
        req.body.workMinutes !=
        null
      ) {
        patch.work_minutes =
          Number(
            req.body.workMinutes
          );
      }

      if (
        req.body.weeklyOffDays !=
        null
      ) {
        patch.weekly_off_days =
          req.body.weeklyOffDays;
      }

      if (
        !Object.keys(patch)
          .length
      ) {
        return res.status(400).json({
          message:
            'Nothing to update',
        });
      }

      patch.updated_at =
        new Date();

      await db('shifts')
        .where({ id })
        .update(patch);

      const shift =
        await db('shifts')
          .where({ id })
          .first();

      if (!shift) {
        return res.status(404).json({
          message:
            'Shift not found',
        });
      }

      return res.json(shift);
    } catch (error) {
      next(error);
    }
  }
);

/*
 * DELETE /api/attendance/shifts/:id
 *
 * Soft delete / deactivate.
 */
r.delete(
  '/shifts/:id',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const id =
        Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message:
            'Invalid shift ID',
        });
      }

      const affected =
        await db('shifts')
          .where({ id })
          .update({
            is_active: false,
            updated_at:
              new Date(),
          });

      if (!affected) {
        return res.status(404).json({
          message:
            'Shift not found',
        });
      }

      return res.json({
        message:
          'Shift deactivated',
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * POST /api/attendance/shifts/:id/assign
 */
r.post(
  '/shifts/:id/assign',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const shiftId =
        Number(req.params.id);

      const employeeId =
        Number(
          req.body.employeeId
        );

      const effectiveFrom =
        parseDate(
          req.body.effectiveFrom
        );

      const effectiveTo =
        req.body.effectiveTo
          ? parseDate(
              req.body.effectiveTo
            )
          : null;

      if (
        !Number.isInteger(
          shiftId
        ) ||
        !Number.isInteger(
          employeeId
        )
      ) {
        return res.status(400).json({
          message:
            'employeeId and shiftId are required',
        });
      }

      const shift =
        await db('shifts')
          .where({
            id: shiftId,
            is_active: true,
          })
          .first();

      if (!shift) {
        return res.status(404).json({
          message:
            'Active shift not found',
        });
      }

      const employee =
        await db('employees')
          .where({
            id: employeeId,
          })
          .first();

      if (!employee) {
        return res.status(404).json({
          message:
            'Employee not found',
        });
      }

      if (
        effectiveTo &&
        effectiveTo <
          effectiveFrom
      ) {
        return res.status(400).json({
          message:
            'effectiveTo cannot be before effectiveFrom',
        });
      }

      const sameStart =
        await db(
          'employee_shifts'
        )
          .where({
            employee_id:
              employeeId,
            effective_from:
              effectiveFrom,
          })
          .first();

      if (sameStart) {
        await db(
          'employee_shifts'
        )
          .where({
            id: sameStart.id,
          })
          .update({
            shift_id:
              shiftId,
            effective_to:
              effectiveTo,
            updated_at:
              new Date(),
          });

        return res.json(
          await db(
            'employee_shifts'
          )
            .where({
              id: sameStart.id,
            })
            .first()
        );
      }

      /*
       * Close overlapping previous assignment.
       */
      await db(
        'employee_shifts'
      )
        .where({
          employee_id:
            employeeId,
        })
        .where(function () {
          this.whereNull(
            'effective_to'
          ).orWhere(
            'effective_to',
            '>=',
            effectiveFrom
          );
        })
        .andWhere(
          'effective_from',
          '<=',
          effectiveTo ||
            '9999-12-31'
        )
        .update({
          effective_to:
            effectiveFrom,
          updated_at:
            new Date(),
        });

      const row =
        await db(
          'employee_shifts'
        )
          .insert({
            employee_id:
              employeeId,
            shift_id:
              shiftId,
            effective_from:
              effectiveFrom,
            effective_to:
              effectiveTo,
          })
          .returning('*');

      return res.status(201).json(
        row[0]
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * GET /api/attendance/shifts/employee/:employeeId
 */
r.get(
  '/shifts/employee/:employeeId',
  auth,
  async (req, res, next) => {
    try {
      const employeeId =
        Number(
          req.params.employeeId
        );

      if (
        !Number.isInteger(
          employeeId
        )
      ) {
        return res.status(400).json({
          message:
            'Invalid employee ID',
        });
      }

      if (
        !(await ensureEmployeeAccess(
          req.user,
          employeeId
        ))
      ) {
        return res.status(403).json({
          message:
            'Forbidden',
        });
      }

      const assignments =
        await db(
          'employee_shifts as es'
        )
          .join(
            'shifts as s',
            's.id',
            'es.shift_id'
          )
          .select(
            'es.*',
            's.name as shift_name',
            's.start_time',
            's.end_time',
            's.work_minutes',
            's.grace_minutes',
            's.half_day_minutes',
            's.weekly_off_days'
          )
          .where(
            'es.employee_id',
            employeeId
          )
          .orderBy(
            'es.effective_from',
            'desc'
          );

      return res.json(
        assignments
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * HOLIDAYS
 * =========================================================
 */

/*
 * GET /api/attendance/holidays
 */
r.get(
  '/holidays',
  auth,
  async (req, res, next) => {
    try {
      const from =
        parseDate(
          req.query.from
        );

      const to =
        parseDate(
          req.query.to,
          from
        );

      const holidays =
        await db(
          'attendance_holidays'
        )
          .whereBetween(
            'holiday_date',
            [from, to]
          )
          .andWhere(
            'is_active',
            true
          )
          .orderBy(
            'holiday_date'
          );

      return res.json(
        holidays
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * POST /api/attendance/holidays
 */
r.post(
  '/holidays',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const date =
        parseDate(
          req.body.date
        );

      const name =
        String(
          req.body.name || ''
        ).trim();

      if (!name) {
        return res.status(400).json({
          message:
            'Holiday name is required',
        });
      }

      const row =
        await db(
          'attendance_holidays'
        )
          .insert({
            holiday_date:
              date,
            name,
            description:
              req.body
                .description ||
              null,
            is_active: true,
            created_by:
              req.user!.id,
          })
          .onConflict(
            'holiday_date'
          )
          .merge()
          .returning('*');

      return res.status(201).json(
        row[0]
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * PATCH /api/attendance/holidays/:id
 */
r.patch(
  '/holidays/:id',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const id =
        Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message:
            'Invalid holiday ID',
        });
      }

      const patch: any = {};

      if (
        req.body.date != null
      ) {
        patch.holiday_date =
          parseDate(
            req.body.date
          );
      }

      if (
        req.body.name != null
      ) {
        patch.name =
          String(
            req.body.name
          ).trim();
      }

      if (
        req.body.description !==
        undefined
      ) {
        patch.description =
          req.body.description ||
          null;
      }

      if (
        req.body.isActive !==
        undefined
      ) {
        patch.is_active =
          Boolean(
            req.body.isActive
          );
      }

      patch.updated_at =
        new Date();

      const affected =
        await db(
          'attendance_holidays'
        )
          .where({ id })
          .update(patch);

      if (!affected) {
        return res.status(404).json({
          message:
            'Holiday not found',
        });
      }

      return res.json(
        await db(
          'attendance_holidays'
        )
          .where({ id })
          .first()
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * DELETE /api/attendance/holidays/:id
 */
r.delete(
  '/holidays/:id',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const id =
        Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message:
            'Invalid holiday ID',
        });
      }

      const affected =
        await db(
          'attendance_holidays'
        )
          .where({ id })
          .update({
            is_active: false,
            updated_at:
              new Date(),
          });

      if (!affected) {
        return res.status(404).json({
          message:
            'Holiday not found',
        });
      }

      return res.json({
        message:
          'Holiday removed',
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * OVERTIME
 * =========================================================
 */

/*
 * GET /api/attendance/overtime
 */
r.get(
  '/overtime',
  auth,
  async (req, res, next) => {
    try {
      const defaultFrom =
        (() => {
          const date =
            new Date();

          date.setDate(
            date.getDate() - 30
          );

          return localParts(date)
            .date;
        })();

      const from =
        parseDate(
          req.query.from,
          defaultFrom
        );

      const to =
        parseDate(
          req.query.to
        );

      let query =
        db(
          'attendance_overtime as o'
        )
          .join(
            'employees as e',
            'e.id',
            'o.employee_id'
          )
          .join(
            'users as u',
            'u.id',
            'e.user_id'
          )
          .select(
            'o.*',
            'e.employee_code',
            'u.first_name',
            'u.last_name'
          )
          .whereBetween(
            'o.attendance_date',
            [from, to]
          );

      if (
        req.user!.role ===
        'EMPLOYEE'
      ) {
        query =
          query.where(
            'o.employee_id',
            req.user!.employeeId
          );
      }

      if (
        req.user!.role ===
        'MANAGER'
      ) {
        query =
          query.where(
            'e.manager_id',
            req.user!.employeeId
          );
      }

      if (req.query.status) {
        query =
          query.where(
            'o.status',
            String(
              req.query.status
            )
          );
      }

      return res.json(
        await query.orderBy(
          'o.attendance_date',
          'desc'
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * POST /api/attendance/overtime
 */
r.post(
  '/overtime',
  auth,
  async (req, res, next) => {
    try {
      const employeeId =
        req.user!.role ===
        'EMPLOYEE'
          ? req.user!.employeeId
          : Number(
              req.body.employeeId
            );

      if (!employeeId) {
        return res.status(400).json({
          message:
            'employeeId is required',
        });
      }

      if (
        !(
          await ensureEmployeeAccess(
            req.user,
            employeeId
          )
        ) &&
        !canManage(req.user)
      ) {
        return res.status(403).json({
          message:
            'Forbidden',
        });
      }

      const date =
        parseDate(
          req.body.date
        );

      const minutes =
        Number(
          req.body.minutes
        );

      if (
        !Number.isInteger(
          minutes
        ) ||
        minutes < 1 ||
        minutes > 1440
      ) {
        return res.status(400).json({
          message:
            'minutes must be between 1 and 1440',
        });
      }

      const approved =
        canManage(req.user);

      const row =
        await db(
          'attendance_overtime'
        )
          .insert({
            employee_id:
              employeeId,
            attendance_date:
              date,
            minutes,
            reason:
              req.body.reason ||
              null,
            status:
              approved
                ? 'APPROVED'
                : 'PENDING',
            requested_by:
              req.user!.id,
            reviewed_by:
              approved
                ? req.user!.id
                : null,
            reviewed_at:
              approved
                ? new Date()
                : null,
          })
          .returning('*');

      await audit(
        req.user!.id,
        'OVERTIME_REQUESTED',
        Number(row[0].id),
        {
          employeeId,
          date,
          minutes,
        }
      );

      return res.status(201).json(
        row[0]
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * PATCH /api/attendance/overtime/:id/approve
 */
r.patch(
  '/overtime/:id/approve',
  auth,
  role(...MANAGEMENT_ROLES),
  async (req, res, next) => {
    try {
      const id =
        Number(req.params.id);

      const overtime =
        await db(
          'attendance_overtime'
        )
          .where({ id })
          .first();

      if (!overtime) {
        return res.status(404).json({
          message:
            'Overtime not found',
        });
      }

      if (
        req.user!.role ===
          'MANAGER' &&
        !(
          await ensureEmployeeAccess(
            req.user,
            Number(
              overtime.employee_id
            )
          )
        )
      ) {
        return res.status(403).json({
          message:
            'Forbidden',
        });
      }

      await db(
        'attendance_overtime'
      )
        .where({ id })
        .update({
          status: 'APPROVED',
          reviewed_by:
            req.user!.id,
          reviewed_at:
            new Date(),
          updated_at:
            new Date(),
        });

      await audit(
        req.user!.id,
        'OVERTIME_APPROVED',
        id,
        {
          overtimeId: id,
        }
      );

      return res.json(
        await db(
          'attendance_overtime'
        )
          .where({ id })
          .first()
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * PATCH /api/attendance/overtime/:id/reject
 */
r.patch(
  '/overtime/:id/reject',
  auth,
  role(...MANAGEMENT_ROLES),
  async (req, res, next) => {
    try {
      const id =
        Number(req.params.id);

      const overtime =
        await db(
          'attendance_overtime'
        )
          .where({ id })
          .first();

      if (!overtime) {
        return res.status(404).json({
          message:
            'Overtime not found',
        });
      }

      if (
        req.user!.role ===
          'MANAGER' &&
        !(
          await ensureEmployeeAccess(
            req.user,
            Number(
              overtime.employee_id
            )
          )
        )
      ) {
        return res.status(403).json({
          message:
            'Forbidden',
        });
      }

      await db(
        'attendance_overtime'
      )
        .where({ id })
        .update({
          status: 'REJECTED',
          reviewed_by:
            req.user!.id,
          reviewed_at:
            new Date(),
          updated_at:
            new Date(),
        });

      await audit(
        req.user!.id,
        'OVERTIME_REJECTED',
        id,
        {
          overtimeId: id,
        }
      );

      return res.json(
        await db(
          'attendance_overtime'
        )
          .where({ id })
          .first()
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * REPORTS
 * =========================================================
 */

/*
 * GET /api/attendance/reports
 */
r.get(
  '/reports',
  auth,
  async (req, res, next) => {
    try {
      const from =
        parseDate(
          req.query.from
        );

      const to =
        parseDate(
          req.query.to,
          from
        );

      const employeeId =
        req.user!.role ===
        'EMPLOYEE'
          ? req.user!.employeeId
          : req.query.employeeId
            ? Number(
                req.query.employeeId
              )
            : null;

      if (
        employeeId &&
        !(
          await ensureEmployeeAccess(
            req.user,
            employeeId
          )
        )
      ) {
        return res.status(403).json({
          message:
            'Forbidden',
        });
      }

      let query =
        db('attendance as a')
          .join(
            'employees as e',
            'e.id',
            'a.employee_id'
          )
          .join(
            'users as u',
            'u.id',
            'e.user_id'
          )
          .leftJoin(
            'departments as d',
            'd.id',
            'e.department_id'
          )
          .select(
            'a.attendance_date',
            'a.employee_id',
            'e.employee_code',
            'u.first_name',
            'u.last_name',
            'd.name as department_name',
            'a.check_in',
            'a.check_out',
            'a.break_minutes',
            'a.worked_minutes',
            'a.status'
          )
          .whereBetween(
            'a.attendance_date',
            [from, to]
          )
          .orderBy(
            'a.attendance_date',
            'asc'
          );

      if (employeeId) {
        query =
          query.where(
            'a.employee_id',
            employeeId
          );
      }

      if (
        req.user!.role ===
        'MANAGER'
      ) {
        query =
          query.where(
            'e.manager_id',
            req.user!.employeeId
          );
      }

      if (
        req.query.departmentId
      ) {
        query =
          query.where(
            'e.department_id',
            Number(
              req.query.departmentId
            )
          );
      }

      const rows =
        await query;

      const totals =
        rows.reduce(
          (
            result: any,
            attendance: any
          ) => {
            result.workedMinutes +=
              Number(
                attendance.worked_minutes ||
                  0
              );

            if (
              attendance.status ===
              'PRESENT'
            ) {
              result.present++;
            }

            if (
              attendance.status ===
              'LATE'
            ) {
              result.late++;
            }

            if (
              attendance.status ===
              'ABSENT'
            ) {
              result.absent++;
            }

            if (
              attendance.status ===
              'HALF_DAY'
            ) {
              result.halfDay++;
            }

            if (
              attendance.status ===
              'ON_LEAVE'
            ) {
              result.onLeave++;
            }

            return result;
          },
          {
            workedMinutes: 0,
            present: 0,
            late: 0,
            absent: 0,
            halfDay: 0,
            onLeave: 0,
          }
        );

      return res.json({
        from,
        to,
        rows,
        totals,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * CSV EXPORT
 * =========================================================
 */

/*
 * GET /api/attendance/export.csv
 */
r.get(
  '/export.csv',
  auth,
  async (req, res, next) => {
    try {
      const from =
        parseDate(
          req.query.from
        );

      const to =
        parseDate(
          req.query.to,
          from
        );

      const employeeId =
        req.user!.role ===
        'EMPLOYEE'
          ? req.user!.employeeId
          : req.query.employeeId
            ? Number(
                req.query.employeeId
              )
            : null;

      if (
        employeeId &&
        !(
          await ensureEmployeeAccess(
            req.user,
            employeeId
          )
        )
      ) {
        return res.status(403).json({
          message:
            'Forbidden',
        });
      }

      let query =
        db('attendance as a')
          .join(
            'employees as e',
            'e.id',
            'a.employee_id'
          )
          .join(
            'users as u',
            'u.id',
            'e.user_id'
          )
          .leftJoin(
            'departments as d',
            'd.id',
            'e.department_id'
          )
          .select(
            'a.attendance_date',
            'e.employee_code',
            'u.first_name',
            'u.last_name',
            'd.name as department_name',
            'a.check_in',
            'a.check_out',
            'a.break_minutes',
            'a.worked_minutes',
            'a.status'
          )
          .whereBetween(
            'a.attendance_date',
            [from, to]
          )
          .orderBy(
            'a.attendance_date',
            'asc'
          );

      if (employeeId) {
        query =
          query.where(
            'a.employee_id',
            employeeId
          );
      }

      if (
        req.user!.role ===
        'MANAGER'
      ) {
        query =
          query.where(
            'e.manager_id',
            req.user!.employeeId
          );
      }

      const rows =
        await query;

      const header = [
        'Date',
        'Employee Code',
        'First Name',
        'Last Name',
        'Department',
        'Check In',
        'Check Out',
        'Break Minutes',
        'Worked Minutes',
        'Status',
      ];

      const lines = [
        header,
        ...rows.map(
          (row: any) => [
            row.attendance_date,
            row.employee_code,
            row.first_name,
            row.last_name,
            row.department_name,
            row.check_in,
            row.check_out,
            row.break_minutes,
            row.worked_minutes,
            row.status,
          ]
        ),
      ].map((row) =>
        row
          .map(csvCell)
          .join(',')
      );

      res.setHeader(
        'Content-Type',
        'text/csv; charset=utf-8'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="attendance-${from}-to-${to}.csv"`
      );

      return res.send(
        '\ufeff' +
          lines.join('\r\n')
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * =========================================================
 * ATTENDANCE SETTINGS
 * =========================================================
 */

/*
 * GET /api/attendance/settings
 */
r.get(
  '/settings',
  auth,
  role(...MANAGEMENT_ROLES),
  async (req, res, next) => {
    try {
      const rows =
        await db(
          'attendance_settings'
        )
          .orderBy('key');

      return res.json(
        Object.fromEntries(
          rows.map(
            (row: any) => [
              row.key,
              row.value,
            ]
          )
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * PUT /api/attendance/settings
 */
r.put(
  '/settings',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const allowedKeys = [
        'timezone',
        'default_start_time',
        'default_end_time',
        'grace_minutes',
        'half_day_minutes',
        'overtime_threshold_minutes',
      ];

      for (
        const key of allowedKeys
      ) {
        if (
          req.body[key] ===
          undefined
        ) {
          continue;
        }

        const value =
          String(
            req.body[key]
          );

        await db(
          'attendance_settings'
        )
          .insert({
            key,
            value,
            updated_by:
              req.user!.id,
          })
          .onConflict('key')
          .merge({
            value,
            updated_by:
              req.user!.id,
            updated_at:
              new Date(),
          });

        if (
          key === 'timezone'
        ) {
          TZ = value;
        }
      }

      const rows =
        await db(
          'attendance_settings'
        )
          .orderBy('key');

      return res.json(
        Object.fromEntries(
          rows.map(
            (row: any) => [
              row.key,
              row.value,
            ]
          )
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

export default r;