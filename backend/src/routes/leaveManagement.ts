import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { auth, role } from '../middleware/auth';
import * as XLSX from 'xlsx';

const router = Router();

const HR_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'] as const;

const LEAVE_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;

type LeaveStatus = (typeof LEAVE_STATUSES)[number];

function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : null;
}

function toInteger(value: unknown): number | null {
  const result = toNumber(value);

  return result !== null && Number.isInteger(result) ? result : null;
}

function isValidStatus(value: unknown): value is LeaveStatus {
  return (
    typeof value === 'string' &&
    LEAVE_STATUSES.includes(value as LeaveStatus)
  );
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return value;
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  const difference = end.getTime() - start.getTime();

  if (difference < 0) {
    return 0;
  }

  return Math.floor(difference / 86400000) + 1;
}

/* =========================================================
   HR LEAVE DASHBOARD
   GET /api/leave-management/dashboard
========================================================= */

router.get(
  '/dashboard',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);

    const [
      employeesResult,
      statusRows,
      onLeaveResult,
      upcomingResult,
      approvedDaysResult,
    ] = await Promise.all([
      db('employees')
        .whereNot('status', 'TERMINATED')
        .count('* as count')
        .first(),

      db('leave_requests')
        .select('status')
        .count('* as count')
        .groupBy('status'),

      db('leave_requests')
        .where('status', 'APPROVED')
        .where('start_date', '<=', today)
        .where('end_date', '>=', today)
        .countDistinct('employee_id as count')
        .first(),

      db('leave_requests')
        .where('status', 'APPROVED')
        .where('start_date', '>', today)
        .count('* as count')
        .first(),

      db('leave_requests')
        .where('status', 'APPROVED')
        .sum({ total: 'days' })
        .first(),
    ]);

    const getStatusCount = (status: LeaveStatus) =>
      Number(
        (statusRows as Array<{ status: string; count: string | number }>)
          .find((row) => row.status === status)?.count ?? 0
      );

    const monthlyRows = await db('leave_requests')
      .select(
        db.raw(`TO_CHAR(start_date, 'YYYY-MM') AS month`),
        db.raw(`COUNT(*)::int AS requests`),
        db.raw(`
          COALESCE(
            SUM(
              CASE WHEN status = 'APPROVED' THEN days ELSE 0 END
            ),
            0
          )::numeric AS approved_days
        `)
      )
      .where('start_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '11 months'`))
      .groupByRaw(`TO_CHAR(start_date, 'YYYY-MM')`)
      .orderBy('month', 'asc');

    const departmentRows = await db('leave_requests as lr')
      .join('employees as e', 'e.id', 'lr.employee_id')
      .leftJoin('departments as d', 'd.id', 'e.department_id')
      .select(
        db.raw(`COALESCE(d.name, 'Unassigned') AS department`),
        db.raw(`COUNT(lr.id)::int AS requests`),
        db.raw(`
          COALESCE(
            SUM(
              CASE WHEN lr.status = 'APPROVED' THEN lr.days ELSE 0 END
            ),
            0
          )::numeric AS approved_days
        `)
      )
      .groupBy('d.name')
      .orderBy('approved_days', 'desc');

    res.json({
      totalEmployees: Number(employeesResult?.count ?? 0),
      totalRequests: (statusRows as Array<{ count: string | number }>).reduce(
        (sum, row) => sum + Number(row.count),
        0
      ),
      pending: getStatusCount('PENDING'),
      approved: getStatusCount('APPROVED'),
      rejected: getStatusCount('REJECTED'),
      cancelled: getStatusCount('CANCELLED'),
      onLeaveToday: Number(onLeaveResult?.count ?? 0),
      upcomingLeaves: Number(upcomingResult?.count ?? 0),
      approvedDays: Number(approvedDaysResult?.total ?? 0),
      monthlyTrends: monthlyRows,
      departmentUsage: departmentRows,
    });
  })
);

/* =========================================================
   HR REQUESTS
   GET /api/leave-management/requests
========================================================= */

router.get(
  '/requests',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const {
      search,
      status,
      employeeId,
      leaveTypeId,
      fromDate,
      toDate,
      page = '1',
      limit = '25',
    } = req.query;

    const pageNumber = Math.max(toInteger(page) ?? 1, 1);
    const limitNumber = Math.min(Math.max(toInteger(limit) ?? 25, 1), 100);
    const offset = (pageNumber - 1) * limitNumber;

    const query = db('leave_requests as lr')
      .join('employees as e', 'e.id', 'lr.employee_id')
      .join('users as u', 'u.id', 'e.user_id')
      .join('leave_types as lt', 'lt.id', 'lr.leave_type_id')
      .leftJoin('users as approver', 'approver.id', 'lr.approved_by')
      .leftJoin('departments as d', 'd.id', 'e.department_id')
      .select(
        'lr.id',
        'lr.employee_id',
        'lr.leave_type_id',
        'lr.start_date',
        'lr.end_date',
        'lr.days',
        'lr.reason',
        'lr.status',
        'lr.approved_by',
        'lr.created_at',
        'lr.updated_at',
        'lr.approval_comments',
        'lr.rejection_reason',
        'lr.cancellation_reason',
        'lr.cancelled_at',
        'lr.current_approval_level',
        'lr.is_half_day',
        'lr.half_day_period',
        'lr.document_url',
        'e.employee_code',
        'e.designation',
        'u.first_name',
        'u.last_name',
        'u.email',
        'd.name as department_name',
        'lt.name as leave_type_name',
        db.raw(`
          CASE
            WHEN approver.id IS NOT NULL
            THEN CONCAT(approver.first_name, ' ', approver.last_name)
            ELSE NULL
          END AS approver_name
        `)
      );

    if (search) {
      const value = `%${String(search).trim()}%`;

      query.where(function () {
        this.whereILike('u.first_name', value)
          .orWhereILike('u.last_name', value)
          .orWhereILike('u.email', value)
          .orWhereILike('e.employee_code', value)
          .orWhereILike('lt.name', value);
      });
    }

    if (status) {
      if (!isValidStatus(String(status))) {
        res.status(400).json({ message: 'Invalid leave status' });
        return;
      }

      query.where('lr.status', String(status));
    }

    const employeeIdNumber = toInteger(employeeId);
    if (employeeId !== undefined && employeeIdNumber === null) {
      res.status(400).json({ message: 'Invalid employeeId' });
      return;
    }

    if (employeeIdNumber !== null) {
      query.where('lr.employee_id', employeeIdNumber);
    }

    const leaveTypeIdNumber = toInteger(leaveTypeId);
    if (leaveTypeId !== undefined && leaveTypeIdNumber === null) {
      res.status(400).json({ message: 'Invalid leaveTypeId' });
      return;
    }

    if (leaveTypeIdNumber !== null) {
      query.where('lr.leave_type_id', leaveTypeIdNumber);
    }

    const normalizedFrom = fromDate ? normalizeDate(fromDate) : null;
    const normalizedTo = toDate ? normalizeDate(toDate) : null;

    if (fromDate && !normalizedFrom) {
      res.status(400).json({ message: 'Invalid fromDate' });
      return;
    }

    if (toDate && !normalizedTo) {
      res.status(400).json({ message: 'Invalid toDate' });
      return;
    }

    if (normalizedFrom) {
      query.where('lr.end_date', '>=', normalizedFrom);
    }

    if (normalizedTo) {
      query.where('lr.start_date', '<=', normalizedTo);
    }

    const countResult = await query
      .clone()
      .clearSelect()
      .clearOrder()
      .countDistinct({ count: 'lr.id' })
      .first();

    const total = Number(countResult?.count ?? 0);

    const requests = await query
      .orderBy('lr.created_at', 'desc')
      .limit(limitNumber)
      .offset(offset);

    res.json({
      requests,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  })
);

/* =========================================================
   REQUEST HISTORY
   GET /api/leave-management/requests/:id/history
========================================================= */

router.get(
  '/requests/:id/history',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const requestId = toInteger(req.params.id);

    if (requestId === null) {
      res.status(400).json({ message: 'Invalid request ID' });
      return;
    }

    const request = await db('leave_requests')
      .where('id', requestId)
      .first();

    if (!request) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    const history = await db('leave_approval_history as h')
      .leftJoin('users as u', 'u.id', 'h.acted_by')
      .select(
        'h.id',
        'h.previous_status',
        'h.new_status',
        'h.comments',
        'h.rejection_reason',
        'h.acted_at',
        'h.acted_by',
        db.raw(`
          CASE
            WHEN u.id IS NOT NULL
            THEN CONCAT(u.first_name, ' ', u.last_name)
            ELSE NULL
          END AS actor_name
        `)
      )
      .where('h.leave_request_id', requestId)
      .orderBy('h.acted_at', 'asc');

    const approvalSteps = await db('leave_approval_steps')
      .leftJoin('users as u', 'u.id', 'leave_approval_steps.approver_user_id')
      .select(
        'leave_approval_steps.id',
        'leave_approval_steps.level',
        'leave_approval_steps.approver_type',
        'leave_approval_steps.approver_user_id',
        'leave_approval_steps.status',
        'leave_approval_steps.comments',
        'leave_approval_steps.acted_at',
        'leave_approval_steps.created_at',
        db.raw(`
          CASE
            WHEN u.id IS NOT NULL
            THEN CONCAT(u.first_name, ' ', u.last_name)
            ELSE NULL
          END AS approver_name
        `)
      )
      .where('leave_approval_steps.leave_request_id', requestId)
      .orderBy('leave_approval_steps.level', 'asc');

    res.json({
      request,
      history,
      approvalSteps,
    });
  })
);

/* =========================================================
   APPROVE / REJECT
   PATCH /api/leave-management/requests/:id/status
========================================================= */

router.patch(
  '/requests/:id/status',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const requestId = toInteger(req.params.id);

    if (requestId === null) {
      res.status(400).json({ message: 'Invalid request ID' });
      return;
    }

    const requestedStatus = String(req.body?.status ?? '').toUpperCase();

    if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(requestedStatus)) {
      res.status(400).json({
        message: 'Status must be APPROVED, REJECTED or CANCELLED',
      });
      return;
    }

    const comments =
      typeof req.body?.comments === 'string'
        ? req.body.comments.trim()
        : null;

    const rejectionReason =
      typeof req.body?.rejectionReason === 'string'
        ? req.body.rejectionReason.trim()
        : null;

    if (requestedStatus === 'REJECTED' && !rejectionReason && !comments) {
      res.status(400).json({
        message: 'Rejection reason or comments are required',
      });
      return;
    }

    const updated = await db.transaction(async (trx) => {
      const request = await trx('leave_requests')
        .where('id', requestId)
        .forUpdate()
        .first();

      if (!request) {
        throw Object.assign(new Error('Leave request not found'), {
          statusCode: 404,
        });
      }

      if (request.status !== 'PENDING') {
        throw Object.assign(
          new Error(`Only PENDING requests can be updated. Current status: ${request.status}`),
          { statusCode: 409 }
        );
      }

      const employee = await trx('employees')
        .select('id', 'user_id')
        .where('id', request.employee_id)
        .first();

      if (!employee) {
        throw Object.assign(new Error('Employee not found'), {
          statusCode: 404,
        });
      }

      const now = trx.fn.now();

      await trx('leave_requests')
        .where('id', requestId)
        .update({
          status: requestedStatus,
          approved_by:
            requestedStatus === 'APPROVED'
              ? req.user!.id
              : request.approved_by,
          approval_comments:
            requestedStatus === 'APPROVED' ? comments : request.approval_comments,
          rejection_reason:
            requestedStatus === 'REJECTED' ? rejectionReason || comments : null,
          cancellation_reason:
            requestedStatus === 'CANCELLED' ? comments : null,
          cancelled_at:
            requestedStatus === 'CANCELLED' ? now : null,
          updated_at: now,
        });

      await trx('leave_approval_history').insert({
        leave_request_id: requestId,
        previous_status: request.status,
        new_status: requestedStatus,
        acted_by: req.user!.id,
        comments,
        rejection_reason:
          requestedStatus === 'REJECTED'
            ? rejectionReason || comments
            : null,
        acted_at: now,
      });

      const existingStep = await trx('leave_approval_steps')
        .where('leave_request_id', requestId)
        .where('level', request.current_approval_level ?? 1)
        .first();

      if (existingStep) {
        await trx('leave_approval_steps')
          .where('id', existingStep.id)
          .update({
            approver_user_id: req.user!.id,
            status: requestedStatus,
            comments,
            acted_at: now,
          });
      } else {
        await trx('leave_approval_steps').insert({
          leave_request_id: requestId,
          level: request.current_approval_level ?? 1,
          approver_type: 'HR',
          approver_user_id: req.user!.id,
          status: requestedStatus,
          comments,
          acted_at: now,
        });
      }

      const title =
        requestedStatus === 'APPROVED'
          ? 'Leave request approved'
          : requestedStatus === 'REJECTED'
            ? 'Leave request rejected'
            : 'Leave request cancelled';

      const message =
        requestedStatus === 'APPROVED'
          ? `Your leave request from ${request.start_date} to ${request.end_date} was approved.`
          : requestedStatus === 'REJECTED'
            ? `Your leave request from ${request.start_date} to ${request.end_date} was rejected.`
            : `Your leave request from ${request.start_date} to ${request.end_date} was cancelled.`;

      await trx('leave_notifications').insert({
        user_id: employee.user_id,
        leave_request_id: requestId,
        type: requestedStatus,
        title,
        message,
        is_read: false,
        created_at: now,
      });

      return trx('leave_requests').where('id', requestId).first();
    });

    res.json({
      message: `Leave request ${requestedStatus.toLowerCase()}`,
      request: updated,
    });
  })
);

/* =========================================================
   LEAVE TYPES
========================================================= */

router.get(
  '/types',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (_req, res) => {
    const types = await db('leave_types')
      .select('*')
      .orderBy('name', 'asc');

    res.json(types);
  })
);

router.post(
  '/types',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const {
      name,
      annualDays,
      isPaid = true,
      carryForward = false,
      maxCarryForward = null,
      encashmentAllowed = false,
      halfDayAllowed = false,
      documentationRequired = false,
      minDays = 1,
      maxDays = null,
      applicableEmployeeGroups = [],
      isActive = true,
    } = req.body ?? {};

    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Leave type name is required' });
      return;
    }

    const annualDaysNumber = toNumber(annualDays);

    if (annualDaysNumber === null || annualDaysNumber < 0) {
      res.status(400).json({ message: 'annualDays must be a non-negative number' });
      return;
    }

    const existing = await db('leave_types')
      .whereILike('name', name.trim())
      .first();

    if (existing) {
      res.status(409).json({ message: 'Leave type already exists' });
      return;
    }

    const [created] = await db('leave_types')
      .insert({
        name: name.trim(),
        annual_days: annualDaysNumber,
        is_paid: Boolean(isPaid),
        carry_forward: Boolean(carryForward),
        max_carry_forward:
          toNumber(maxCarryForward) !== null
            ? toNumber(maxCarryForward)
            : null,
        encashment_allowed: Boolean(encashmentAllowed),
        half_day_allowed: Boolean(halfDayAllowed),
        documentation_required: Boolean(documentationRequired),
        min_days: toNumber(minDays) ?? 1,
        max_days: toNumber(maxDays),
        applicable_employee_groups: Array.isArray(applicableEmployeeGroups)
          ? JSON.stringify(applicableEmployeeGroups)
          : JSON.stringify([]),
        is_active: Boolean(isActive),
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');

    await db('leave_policies').insert({
      leave_type_id: created.id,
      policy_name: `${created.name} Policy`,
      allocation: annualDaysNumber,
      maximum_days: toNumber(maxDays),
      minimum_days: toNumber(minDays) ?? 1,
      carry_forward: Boolean(carryForward),
      is_active: Boolean(isActive),
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    res.status(201).json(created);
  })
);

router.patch(
  '/types/:id',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const id = toInteger(req.params.id);

    if (id === null) {
      res.status(400).json({ message: 'Invalid leave type ID' });
      return;
    }

    const existing = await db('leave_types').where('id', id).first();

    if (!existing) {
      res.status(404).json({ message: 'Leave type not found' });
      return;
    }

    const body = req.body ?? {};
    const update: Record<string, unknown> = {
      updated_at: db.fn.now(),
    };

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        res.status(400).json({ message: 'Invalid leave type name' });
        return;
      }

      update.name = body.name.trim();
    }

    if (body.annualDays !== undefined) {
      const value = toNumber(body.annualDays);

      if (value === null || value < 0) {
        res.status(400).json({ message: 'Invalid annualDays' });
        return;
      }

      update.annual_days = value;
    }

    const booleanFields: Record<string, string> = {
      isPaid: 'is_paid',
      carryForward: 'carry_forward',
      encashmentAllowed: 'encashment_allowed',
      halfDayAllowed: 'half_day_allowed',
      documentationRequired: 'documentation_required',
      isActive: 'is_active',
    };

    for (const [input, column] of Object.entries(booleanFields)) {
      if (body[input] !== undefined) {
        update[column] = Boolean(body[input]);
      }
    }

    const numericFields: Record<string, string> = {
      maxCarryForward: 'max_carry_forward',
      minDays: 'min_days',
      maxDays: 'max_days',
    };

    for (const [input, column] of Object.entries(numericFields)) {
      if (body[input] !== undefined) {
        update[column] = toNumber(body[input]);
      }
    }

    if (body.applicableEmployeeGroups !== undefined) {
      update.applicable_employee_groups = Array.isArray(
        body.applicableEmployeeGroups
      )
        ? JSON.stringify(body.applicableEmployeeGroups)
        : JSON.stringify([]);
    }

    const [updated] = await db('leave_types')
      .where('id', id)
      .update(update)
      .returning('*');

    const policyUpdate: Record<string, unknown> = {
      updated_at: db.fn.now(),
    };

    if (body.name !== undefined) {
      policyUpdate.policy_name = `${updated.name} Policy`;
    }

    if (body.annualDays !== undefined) {
      policyUpdate.allocation = updated.annual_days;
    }

    if (body.minDays !== undefined) {
      policyUpdate.minimum_days = updated.min_days;
    }

    if (body.maxDays !== undefined) {
      policyUpdate.maximum_days = updated.max_days;
    }

    if (body.carryForward !== undefined) {
      policyUpdate.carry_forward = Boolean(body.carryForward);
    }

    if (body.isActive !== undefined) {
      policyUpdate.is_active = Boolean(body.isActive);
    }

    await db('leave_policies')
      .where('leave_type_id', id)
      .update(policyUpdate);

    res.json(updated);
  })
);

router.delete(
  '/types/:id',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const id = toInteger(req.params.id);

    if (id === null) {
      res.status(400).json({ message: 'Invalid leave type ID' });
      return;
    }

    const existing = await db('leave_types').where('id', id).first();

    if (!existing) {
      res.status(404).json({ message: 'Leave type not found' });
      return;
    }

    const used = await db('leave_requests')
      .where('leave_type_id', id)
      .count('* as count')
      .first();

    if (Number(used?.count ?? 0) > 0) {
      await db('leave_types')
        .where('id', id)
        .update({
          is_active: false,
          updated_at: db.fn.now(),
        });

      res.json({
        message: 'Leave type has existing requests, so it was deactivated instead of deleted',
      });
      return;
    }

    await db('leave_types').where('id', id).del();

    res.json({ message: 'Leave type deleted' });
  })
);

/* =========================================================
   POLICIES
========================================================= */

router.get(
  '/policies',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (_req, res) => {
    const policies = await db('leave_policies as p')
      .join('leave_types as lt', 'lt.id', 'p.leave_type_id')
      .select(
        'p.*',
        'lt.name as leave_type_name',
        'lt.is_paid'
      )
      .orderBy('lt.name', 'asc');

    res.json(policies);
  })
);

router.post(
  '/policies',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const leaveTypeId = toInteger(req.body?.leaveTypeId);

    if (leaveTypeId === null) {
      res.status(400).json({ message: 'leaveTypeId is required' });
      return;
    }

    const leaveType = await db('leave_types')
      .where('id', leaveTypeId)
      .first();

    if (!leaveType) {
      res.status(404).json({ message: 'Leave type not found' });
      return;
    }

    const existing = await db('leave_policies')
      .where('leave_type_id', leaveTypeId)
      .first();

    const payload = {
      leave_type_id: leaveTypeId,
      policy_name:
        typeof req.body?.policyName === 'string' &&
        req.body.policyName.trim()
          ? req.body.policyName.trim()
          : `${leaveType.name} Policy`,
      accrual_frequency: req.body?.accrualFrequency ?? 'YEARLY',
      allocation:
        toNumber(req.body?.allocation) ?? Number(leaveType.annual_days ?? 0),
      probation_eligible: Boolean(req.body?.probationEligible ?? true),
      minimum_days: toNumber(req.body?.minimumDays) ?? 1,
      maximum_days: toNumber(req.body?.maximumDays),
      max_consecutive_days: toInteger(req.body?.maxConsecutiveDays),
      advance_notice_days: toInteger(req.body?.advanceNoticeDays) ?? 0,
      allow_negative_balance: Boolean(req.body?.allowNegativeBalance ?? false),
      include_weekends: Boolean(req.body?.includeWeekends ?? false),
      include_holidays: Boolean(req.body?.includeHolidays ?? false),
      sandwich_rule: Boolean(req.body?.sandwichRule ?? false),
      carry_forward: Boolean(req.body?.carryForward ?? false),
      carry_forward_expiry_months: toInteger(
        req.body?.carryForwardExpiryMonths
      ),
      approval_required: Boolean(req.body?.approvalRequired ?? true),
      approval_levels: Math.max(toInteger(req.body?.approvalLevels) ?? 1, 1),
      is_active: Boolean(req.body?.isActive ?? true),
      updated_at: db.fn.now(),
    };

    let saved;

    if (existing) {
      [saved] = await db('leave_policies')
        .where('id', existing.id)
        .update(payload)
        .returning('*');
    } else {
      [saved] = await db('leave_policies')
        .insert({
          ...payload,
          created_at: db.fn.now(),
        })
        .returning('*');
    }

    res.status(existing ? 200 : 201).json(saved);
  })
);

/* =========================================================
   BALANCES
   GET /api/leave-management/balances
========================================================= */

router.get(
  '/balances',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId
      ? toInteger(req.query.employeeId)
      : null;

    if (req.query.employeeId !== undefined && employeeId === null) {
      res.status(400).json({ message: 'Invalid employeeId' });
      return;
    }

    const employeesQuery = db('employees as e')
      .join('users as u', 'u.id', 'e.user_id')
      .select(
        'e.id as employee_id',
        'e.employee_code',
        'e.department_id',
        'u.first_name',
        'u.last_name'
      )
      .whereNot('e.status', 'TERMINATED')
      .orderBy('u.first_name', 'asc');

    if (employeeId !== null) {
      employeesQuery.where('e.id', employeeId);
    }

    const employees = await employeesQuery;

    const leaveTypes = await db('leave_types')
      .where('is_active', true)
      .orderBy('name', 'asc');

    const result = [];

    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        const approvedResult = await db('leave_requests')
          .where('employee_id', employee.employee_id)
          .where('leave_type_id', leaveType.id)
          .where('status', 'APPROVED')
          .sum({ total: 'days' })
          .first();

        const pendingResult = await db('leave_requests')
          .where('employee_id', employee.employee_id)
          .where('leave_type_id', leaveType.id)
          .where('status', 'PENDING')
          .sum({ total: 'days' })
          .first();

        const adjustmentResult = await db('leave_adjustments')
          .where('employee_id', employee.employee_id)
          .where('leave_type_id', leaveType.id)
          .sum({ total: 'amount' })
          .first();

        const allocated = Number(leaveType.annual_days ?? 0);
        const used = Number(approvedResult?.total ?? 0);
        const pending = Number(pendingResult?.total ?? 0);
        const adjustments = Number(adjustmentResult?.total ?? 0);
        const available = allocated + adjustments - used - pending;

        result.push({
          employeeId: employee.employee_id,
          employeeCode: employee.employee_code,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          departmentId: employee.department_id,
          leaveTypeId: leaveType.id,
          leaveTypeName: leaveType.name,
          allocated,
          accrued: allocated,
          used,
          pending,
          adjustments,
          carryForward: 0,
          available,
        });
      }
    }

    res.json(result);
  })
);

/* =========================================================
   ADJUSTMENTS
========================================================= */

router.get(
  '/adjustments',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId
      ? toInteger(req.query.employeeId)
      : null;

    const query = db('leave_adjustments as a')
      .join('employees as e', 'e.id', 'a.employee_id')
      .join('users as u', 'u.id', 'e.user_id')
      .join('leave_types as lt', 'lt.id', 'a.leave_type_id')
      .leftJoin('users as creator', 'creator.id', 'a.created_by')
      .select(
        'a.*',
        'e.employee_code',
        'lt.name as leave_type_name',
        db.raw(`CONCAT(u.first_name, ' ', u.last_name) AS employee_name`),
        db.raw(`
          CASE
            WHEN creator.id IS NOT NULL
            THEN CONCAT(creator.first_name, ' ', creator.last_name)
            ELSE NULL
          END AS created_by_name
        `)
      )
      .orderBy('a.created_at', 'desc');

    if (req.query.employeeId !== undefined && employeeId === null) {
      res.status(400).json({ message: 'Invalid employeeId' });
      return;
    }

    if (employeeId !== null) {
      query.where('a.employee_id', employeeId);
    }

    res.json(await query);
  })
);

router.post(
  '/adjustments',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = toInteger(req.body?.employeeId);
    const leaveTypeId = toInteger(req.body?.leaveTypeId);
    const amount = toNumber(req.body?.amount);
    const adjustmentType =
      typeof req.body?.adjustmentType === 'string'
        ? req.body.adjustmentType.trim().toUpperCase()
        : '';
    const reason =
      typeof req.body?.reason === 'string'
        ? req.body.reason.trim()
        : '';

    if (employeeId === null || leaveTypeId === null) {
      res.status(400).json({
        message: 'employeeId and leaveTypeId are required',
      });
      return;
    }

    if (amount === null || amount === 0) {
      res.status(400).json({
        message: 'amount must be a non-zero number',
      });
      return;
    }

    if (!reason) {
      res.status(400).json({ message: 'reason is required' });
      return;
    }

    if (!adjustmentType) {
      res.status(400).json({ message: 'adjustmentType is required' });
      return;
    }

    const [employee, leaveType] = await Promise.all([
      db('employees').where('id', employeeId).first(),
      db('leave_types').where('id', leaveTypeId).first(),
    ]);

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    if (!leaveType) {
      res.status(404).json({ message: 'Leave type not found' });
      return;
    }

    const [created] = await db('leave_adjustments')
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        amount,
        adjustment_type: adjustmentType,
        reason,
        created_by: req.user!.id,
        created_at: db.fn.now(),
      })
      .returning('*');

    res.status(201).json(created);
  })
);

/* =========================================================
   HOLIDAYS
========================================================= */

router.get(
  '/holidays',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const fromDate = req.query.fromDate
      ? normalizeDate(req.query.fromDate)
      : null;
    const toDate = req.query.toDate
      ? normalizeDate(req.query.toDate)
      : null;

    if (req.query.fromDate && !fromDate) {
      res.status(400).json({ message: 'Invalid fromDate' });
      return;
    }

    if (req.query.toDate && !toDate) {
      res.status(400).json({ message: 'Invalid toDate' });
      return;
    }

    const query = db('leave_holidays')
      .select('*')
      .orderBy('holiday_date', 'asc');

    if (fromDate) {
      query.where('holiday_date', '>=', fromDate);
    }

    if (toDate) {
      query.where('holiday_date', '<=', toDate);
    }

    res.json(await query);
  })
);

router.post(
  '/holidays',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const name =
      typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const holidayDate = normalizeDate(req.body?.holidayDate);
    const holidayType =
      typeof req.body?.holidayType === 'string'
        ? req.body.holidayType.trim().toUpperCase()
        : 'COMPANY';

    if (!name || !holidayDate) {
      res.status(400).json({
        message: 'name and a valid holidayDate are required',
      });
      return;
    }

    const [created] = await db('leave_holidays')
      .insert({
        name,
        holiday_date: holidayDate,
        holiday_type: holidayType,
        location:
          typeof req.body?.location === 'string'
            ? req.body.location.trim() || null
            : null,
        is_optional: Boolean(req.body?.isOptional ?? false),
        is_active: Boolean(req.body?.isActive ?? true),
        description:
          typeof req.body?.description === 'string'
            ? req.body.description.trim() || null
            : null,
        created_by: req.user!.id,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');

    res.status(201).json(created);
  })
);

router.get(
  '/holidays/export',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (_req, res) => {
    const holidays = await db('leave_holidays')
      .select(
        'name',
        'holiday_date',
        'holiday_type',
        'location',
        'is_optional',
        'description',
        'is_active'
      )
      .orderBy('holiday_date', 'asc');

    const rows = holidays.map((holiday: any) => ({
      'Holiday Name': holiday.name,
      'Date': holiday.holiday_date,
      'Holiday Type': holiday.holiday_type,
      'Location / Region': holiday.location ?? '',
      'Optional Holiday': holiday.is_optional ? 'Yes' : 'No',
      'Description': holiday.description ?? '',
      'Active': holiday.is_active ? 'Yes' : 'No',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [
      {
        'Holiday Name': '',
        'Date': '',
        'Holiday Type': 'COMPANY',
        'Location / Region': '',
        'Optional Holiday': 'No',
        'Description': '',
        'Active': 'Yes',
      },
    ]);

    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 28 },
      { wch: 20 },
      { wch: 40 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Company Holidays');

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="company-holidays.xlsx"'
    );
    res.send(buffer);
  })
);

router.post(
  '/holidays/import',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const encoded = req.body?.fileBase64;

    if (typeof encoded !== 'string' || !encoded.trim()) {
      res.status(400).json({ message: 'Excel file data is required.' });
      return;
    }

    let workbook: XLSX.WorkBook;

    try {
      const buffer = Buffer.from(encoded, 'base64');
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    } catch {
      res.status(400).json({ message: 'Unable to read the Excel file.' });
      return;
    }

    const firstSheet = workbook.SheetNames[0];

    if (!firstSheet) {
      res.status(400).json({ message: 'The Excel file has no worksheet.' });
      return;
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[firstSheet],
      { defval: '' }
    );

    if (!rows.length) {
      res.status(400).json({ message: 'The Excel worksheet contains no holiday rows.' });
      return;
    }

    const value = (row: Record<string, unknown>, ...keys: string[]) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
          return row[key];
        }
      }
      return '';
    };

    const parseExcelDate = (raw: unknown): string | null => {
      if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
        return raw.toISOString().slice(0, 10);
      }

      if (typeof raw === 'number' && Number.isFinite(raw)) {
        const parsed = XLSX.SSF.parse_date_code(raw);
        if (parsed?.y && parsed?.m && parsed?.d) {
          return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
        }
      }

      return normalizeDate(String(raw ?? '').trim());
    };

    const imported: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    await db.transaction(async (trx) => {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = index + 2;
        const name = String(value(row, 'Holiday Name', 'Name')).trim();
        const holidayDate = parseExcelDate(value(row, 'Date', 'Holiday Date'));
        const holidayType = String(
          value(row, 'Holiday Type', 'Type') || 'COMPANY'
        )
          .trim()
          .toUpperCase();
        const location = String(
          value(row, 'Location / Region', 'Location', 'Region')
        ).trim();
        const optionalRaw = String(
          value(row, 'Optional Holiday', 'Optional', 'Is Optional')
        ).trim().toLowerCase();
        const activeRaw = String(
          value(row, 'Active', 'Is Active') || 'Yes'
        ).trim().toLowerCase();
        const description = String(value(row, 'Description', 'Details')).trim();

        if (!name || !holidayDate) {
          errors.push(`Row ${rowNumber}: Holiday Name and a valid Date are required.`);
          continue;
        }

        const allowedTypes = ['COMPANY', 'PUBLIC', 'REGIONAL', 'OPTIONAL'];
        if (!allowedTypes.includes(holidayType)) {
          errors.push(
            `Row ${rowNumber}: Holiday Type must be COMPANY, PUBLIC, REGIONAL or OPTIONAL.`
          );
          continue;
        }

        const existing = await trx('leave_holidays')
          .where('holiday_date', holidayDate)
          .whereRaw('LOWER(name) = LOWER(?)', [name])
          .first();

        if (existing) {
          skipped.push(`${name} (${holidayDate})`);
          continue;
        }

        await trx('leave_holidays').insert({
          name,
          holiday_date: holidayDate,
          holiday_type: holidayType,
          location: location || null,
          is_optional: ['yes', 'true', '1', 'y'].includes(optionalRaw),
          is_active: !['no', 'false', '0', 'n'].includes(activeRaw),
          description: description || null,
          created_by: req.user!.id,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        });

        imported.push(`${name} (${holidayDate})`);
      }

      if (errors.length && !imported.length && !skipped.length) {
        throw new Error(errors.join(' '));
      }
    }).catch((error) => {
      if (error instanceof Error && error.message) {
        res.status(400).json({ message: error.message });
        return;
      }
      throw error;
    });

    if (res.headersSent) return;

    res.status(201).json({
      message: `${imported.length} holiday${imported.length === 1 ? '' : 's'} imported successfully.`,
      importedCount: imported.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
      imported,
      skipped,
      errors,
    });
  })
);

router.patch(
  '/holidays/:id',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const id = toInteger(req.params.id);

    if (id === null) {
      res.status(400).json({ message: 'Invalid holiday ID' });
      return;
    }

    const existing = await db('leave_holidays').where('id', id).first();

    if (!existing) {
      res.status(404).json({ message: 'Holiday not found' });
      return;
    }

    const update: Record<string, unknown> = {
      updated_at: db.fn.now(),
    };

    if (req.body?.name !== undefined) {
      update.name = String(req.body.name).trim();
    }

    if (req.body?.holidayDate !== undefined) {
      const date = normalizeDate(req.body.holidayDate);

      if (!date) {
        res.status(400).json({ message: 'Invalid holidayDate' });
        return;
      }

      update.holiday_date = date;
    }

    if (req.body?.holidayType !== undefined) {
      update.holiday_type = String(req.body.holidayType)
        .trim()
        .toUpperCase();
    }

    if (req.body?.location !== undefined) {
      update.location = String(req.body.location).trim() || null;
    }

    if (req.body?.isOptional !== undefined) {
      update.is_optional = Boolean(req.body.isOptional);
    }

    if (req.body?.isActive !== undefined) {
      update.is_active = Boolean(req.body.isActive);
    }

    if (req.body?.description !== undefined) {
      update.description = String(req.body.description).trim() || null;
    }

    const nextName = String(update.name ?? existing.name).trim();
    const nextDate = String(update.holiday_date ?? existing.holiday_date).slice(0, 10);

    const duplicate = await db('leave_holidays')
      .whereRaw('LOWER(name) = LOWER(?)', [nextName])
      .where('holiday_date', nextDate)
      .whereNot('id', id)
      .first();

    if (duplicate) {
      res.status(409).json({
        message: 'A holiday with the same name and date already exists.',
      });
      return;
    }

    const [updated] = await db('leave_holidays')
      .where('id', id)
      .update(update)
      .returning('*');

    res.json(updated);
  })
);

router.delete(
  '/holidays/:id',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const id = toInteger(req.params.id);

    if (id === null) {
      res.status(400).json({ message: 'Invalid holiday ID' });
      return;
    }

    const existing = await db('leave_holidays')
      .where('id', id)
      .first();

    if (!existing) {
      res.status(404).json({ message: 'Holiday not found' });
      return;
    }

    await db('leave_holidays').where('id', id).del();

    res.json({
      message: 'Holiday deleted successfully.',
      id,
    });
  })
);

/* =========================================================
   CALENDAR
========================================================= */

router.get(
  '/calendar',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const fromDate =
      normalizeDate(req.query.fromDate) ??
      new Date().toISOString().slice(0, 10);

    const toDate =
      normalizeDate(req.query.toDate) ??
      new Date(Date.now() + 31 * 86400000)
        .toISOString()
        .slice(0, 10);

    const employeeId = req.query.employeeId
      ? toInteger(req.query.employeeId)
      : null;

    const departmentId = req.query.departmentId
      ? toInteger(req.query.departmentId)
      : null;

    if (employeeId === null && req.query.employeeId !== undefined) {
      res.status(400).json({ message: 'Invalid employeeId' });
      return;
    }

    if (departmentId === null && req.query.departmentId !== undefined) {
      res.status(400).json({ message: 'Invalid departmentId' });
      return;
    }

    const leaveQuery = db('leave_requests as lr')
      .join('employees as e', 'e.id', 'lr.employee_id')
      .join('users as u', 'u.id', 'e.user_id')
      .join('leave_types as lt', 'lt.id', 'lr.leave_type_id')
      .leftJoin('departments as d', 'd.id', 'e.department_id')
      .select(
        'lr.id',
        'lr.employee_id',
        'lr.start_date',
        'lr.end_date',
        'lr.days',
        'lr.status',
        'lr.reason',
        'lt.name as leave_type_name',
        'e.employee_code',
        db.raw(`CONCAT(u.first_name, ' ', u.last_name) AS employee_name`),
        'd.name as department_name'
      )
      .whereIn('lr.status', ['APPROVED', 'PENDING'])
      .where('lr.start_date', '<=', toDate)
      .where('lr.end_date', '>=', fromDate)
      .orderBy('lr.start_date', 'asc');

    if (employeeId !== null) {
      leaveQuery.where('lr.employee_id', employeeId);
    }

    if (departmentId !== null) {
      leaveQuery.where('e.department_id', departmentId);
    }

    const holidays = await db('leave_holidays')
      .select('*')
      .where('is_active', true)
      .whereBetween('holiday_date', [fromDate, toDate])
      .orderBy('holiday_date', 'asc');

    res.json({
      fromDate,
      toDate,
      leaves: await leaveQuery,
      holidays,
    });
  })
);

/* =========================================================
   REPORTS
========================================================= */

router.get(
  '/reports',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const fromDate =
      normalizeDate(req.query.fromDate) ??
      new Date(new Date().getFullYear(), 0, 1)
        .toISOString()
        .slice(0, 10);

    const toDate =
      normalizeDate(req.query.toDate) ??
      new Date().toISOString().slice(0, 10);

    const byType = await db('leave_requests as lr')
      .join('leave_types as lt', 'lt.id', 'lr.leave_type_id')
      .select(
        'lt.id as leave_type_id',
        'lt.name as leave_type_name',
        db.raw(`COUNT(lr.id)::int AS requests`),
        db.raw(`
          COALESCE(
            SUM(CASE WHEN lr.status = 'APPROVED' THEN lr.days ELSE 0 END),
            0
          )::numeric AS approved_days
        `),
        db.raw(`
          COUNT(
            CASE WHEN lr.status = 'PENDING' THEN 1 END
          )::int AS pending
        `),
        db.raw(`
          COUNT(
            CASE WHEN lr.status = 'REJECTED' THEN 1 END
          )::int AS rejected
        `)
      )
      .where('lr.start_date', '<=', toDate)
      .where('lr.end_date', '>=', fromDate)
      .groupBy('lt.id', 'lt.name')
      .orderBy('approved_days', 'desc');

    const byDepartment = await db('leave_requests as lr')
      .join('employees as e', 'e.id', 'lr.employee_id')
      .leftJoin('departments as d', 'd.id', 'e.department_id')
      .select(
        db.raw(`COALESCE(d.name, 'Unassigned') AS department`),
        db.raw(`COUNT(lr.id)::int AS requests`),
        db.raw(`
          COALESCE(
            SUM(CASE WHEN lr.status = 'APPROVED' THEN lr.days ELSE 0 END),
            0
          )::numeric AS approved_days
        `)
      )
      .where('lr.start_date', '<=', toDate)
      .where('lr.end_date', '>=', fromDate)
      .groupBy('d.name')
      .orderBy('approved_days', 'desc');

    const monthly = await db('leave_requests')
      .select(
        db.raw(`TO_CHAR(start_date, 'YYYY-MM') AS month`),
        db.raw(`COUNT(*)::int AS requests`),
        db.raw(`
          COALESCE(
            SUM(CASE WHEN status = 'APPROVED' THEN days ELSE 0 END),
            0
          )::numeric AS approved_days
        `)
      )
      .where('start_date', '<=', toDate)
      .where('end_date', '>=', fromDate)
      .groupByRaw(`TO_CHAR(start_date, 'YYYY-MM')`)
      .orderBy('month', 'asc');

    res.json({
      range: { fromDate, toDate },
      byType,
      byDepartment,
      monthly,
    });
  })
);

/* =========================================================
   NOTIFICATIONS
========================================================= */

router.get(
  '/notifications',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const unreadOnly = String(req.query.unreadOnly ?? 'false') === 'true';

    const query = db('leave_notifications')
      .select('*')
      .where('user_id', req.user!.id)
      .orderBy('created_at', 'desc')
      .limit(100);

    if (unreadOnly) {
      query.where('is_read', false);
    }

    res.json(await query);
  })
);

router.patch(
  '/notifications/:id/read',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const id = toInteger(req.params.id);

    if (id === null) {
      res.status(400).json({ message: 'Invalid notification ID' });
      return;
    }

    const [updated] = await db('leave_notifications')
      .where('id', id)
      .where('user_id', req.user!.id)
      .update({ is_read: true })
      .returning('*');

    if (!updated) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.json(updated);
  })
);

/* =========================================================
   COMP-OFF
========================================================= */

router.get(
  '/comp-off',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId
      ? toInteger(req.query.employeeId)
      : null;

    if (req.query.employeeId !== undefined && employeeId === null) {
      res.status(400).json({ message: 'Invalid employeeId' });
      return;
    }

    const query = db('leave_comp_offs as c')
      .join('employees as e', 'e.id', 'c.employee_id')
      .join('users as u', 'u.id', 'e.user_id')
      .select(
        'c.*',
        'e.employee_code',
        db.raw(`CONCAT(u.first_name, ' ', u.last_name) AS employee_name`)
      )
      .orderBy('c.created_at', 'desc');

    if (employeeId !== null) {
      query.where('c.employee_id', employeeId);
    }

    res.json(await query);
  })
);

router.post(
  '/comp-off',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = toInteger(req.body?.employeeId);
    const earnedDate = normalizeDate(req.body?.earnedDate);
    const days = toNumber(req.body?.days);
    const expiryDate = req.body?.expiryDate
      ? normalizeDate(req.body.expiryDate)
      : null;

    if (employeeId === null || !earnedDate || days === null || days <= 0) {
      res.status(400).json({
        message: 'employeeId, earnedDate and positive days are required',
      });
      return;
    }

    const employee = await db('employees').where('id', employeeId).first();

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const [created] = await db('leave_comp_offs')
      .insert({
        employee_id: employeeId,
        earned_date: earnedDate,
        days,
        expiry_date: expiryDate,
        used_days: 0,
        status: 'APPROVED',
        reason:
          typeof req.body?.reason === 'string'
            ? req.body.reason.trim() || null
            : null,
        requested_by: req.user!.id,
        approved_by: req.user!.id,
        approved_at: db.fn.now(),
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');

    res.status(201).json(created);
  })
);

/* =========================================================
   ENCASHMENT
========================================================= */

router.get(
  '/encashment',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId
      ? toInteger(req.query.employeeId)
      : null;

    if (req.query.employeeId !== undefined && employeeId === null) {
      res.status(400).json({ message: 'Invalid employeeId' });
      return;
    }

    const query = db('leave_encashments as le')
      .join('employees as e', 'e.id', 'le.employee_id')
      .join('users as u', 'u.id', 'e.user_id')
      .join('leave_types as lt', 'lt.id', 'le.leave_type_id')
      .select(
        'le.*',
        'e.employee_code',
        'lt.name as leave_type_name',
        db.raw(`CONCAT(u.first_name, ' ', u.last_name) AS employee_name`)
      )
      .orderBy('le.created_at', 'desc');

    if (employeeId !== null) {
      query.where('le.employee_id', employeeId);
    }

    res.json(await query);
  })
);

router.post(
  '/encashment',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = toInteger(req.body?.employeeId);
    const leaveTypeId = toInteger(req.body?.leaveTypeId);
    const requestedDays = toNumber(req.body?.requestedDays);
    const balanceBefore = toNumber(req.body?.balanceBefore);

    if (
      employeeId === null ||
      leaveTypeId === null ||
      requestedDays === null ||
      requestedDays <= 0 ||
      balanceBefore === null
    ) {
      res.status(400).json({
        message:
          'employeeId, leaveTypeId, positive requestedDays and balanceBefore are required',
      });
      return;
    }

    const [employee, leaveType] = await Promise.all([
      db('employees').where('id', employeeId).first(),
      db('leave_types').where('id', leaveTypeId).first(),
    ]);

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    if (!leaveType) {
      res.status(404).json({ message: 'Leave type not found' });
      return;
    }

    if (!leaveType.encashment_allowed) {
      res.status(400).json({
        message: 'Encashment is not enabled for this leave type',
      });
      return;
    }

    if (requestedDays > balanceBefore) {
      res.status(400).json({
        message: 'Requested days cannot exceed the available balance',
      });
      return;
    }

    const [created] = await db('leave_encashments')
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        requested_days: requestedDays,
        balance_before: balanceBefore,
        amount: toNumber(req.body?.amount),
        status: 'PENDING',
        reason:
          typeof req.body?.reason === 'string'
            ? req.body.reason.trim() || null
            : null,
        requested_by: req.user!.id,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');

    res.status(201).json(created);
  })
);

/* =========================================================
   AUDIT VIEW
========================================================= */

router.get(
  '/audit',
  auth,
  role(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const requestId = req.query.requestId
      ? toInteger(req.query.requestId)
      : null;

    if (req.query.requestId !== undefined && requestId === null) {
      res.status(400).json({ message: 'Invalid requestId' });
      return;
    }

    const query = db('leave_approval_history as h')
      .leftJoin('users as u', 'u.id', 'h.acted_by')
      .leftJoin('leave_requests as lr', 'lr.id', 'h.leave_request_id')
      .leftJoin('leave_types as lt', 'lt.id', 'lr.leave_type_id')
      .leftJoin('employees as e', 'e.id', 'lr.employee_id')
      .leftJoin('users as eu', 'eu.id', 'e.user_id')
      .select(
        'h.id',
        'h.leave_request_id',
        'h.previous_status',
        'h.new_status',
        'h.comments',
        'h.rejection_reason',
        'h.acted_at',
        'h.acted_by',
        'lt.name as leave_type_name',
        'e.employee_code',
        db.raw(`
          CASE
            WHEN eu.id IS NOT NULL
            THEN CONCAT(eu.first_name, ' ', eu.last_name)
            ELSE NULL
          END AS employee_name
        `),
        db.raw(`
          CASE
            WHEN u.id IS NOT NULL
            THEN CONCAT(u.first_name, ' ', u.last_name)
            ELSE NULL
          END AS actor_name
        `)
      )
      .orderBy('h.acted_at', 'desc')
      .limit(200);

    if (requestId !== null) {
      query.where('h.leave_request_id', requestId);
    }

    res.json(await query);
  })
);

export default router;
