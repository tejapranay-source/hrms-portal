import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { db } from '../db';
import { auth, role } from '../middleware/auth';

const r = Router();

/* =========================================================
   DASHBOARD
========================================================= */

r.get(
  '/dashboard/stats',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'PAYROLL',
    'EMPLOYEE'
  ),
  async (req, res, next) => {
    try {
      const [
        employeeCountResult,
        activeEmployeeResult,
        departmentCountResult,
        leaveResult,
      ] = await Promise.all([
        db('employees').count('* as count').first(),

        db('employees')
          .where('status', 'ACTIVE')
          .count('* as count')
          .first(),

        db('departments').count('* as count').first(),

        db('leave_requests')
          .whereIn('status', ['PENDING'])
          .count('* as count')
          .first(),
      ]);

      res.json({
        employees: Number(employeeCountResult?.count ?? 0),
        activeEmployees: Number(activeEmployeeResult?.count ?? 0),
        departments: Number(departmentCountResult?.count ?? 0),
        pendingLeaves: Number(leaveResult?.count ?? 0),
      });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   DEPARTMENTS
========================================================= */

r.get(
  '/departments',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER'
  ),
  async (req, res, next) => {
    try {
      const departments = await db('departments')
        .select(
          'id',
          'name',
          'description'
        )
        .orderBy('name', 'asc');

      res.json(departments);
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   EMPLOYEE DIRECTORY
========================================================= */

r.get(
  '/employees',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER'
  ),
  async (req, res, next) => {
    try {
      const {
        search,
        departmentId,
        designation,
        employmentType,
        status,
        workLocation,
        managerId,
        sortBy = 'created_at',
        sortOrder = 'desc',
        page = '1',
        limit = '10',
      } = req.query;

      const pageNumber = Math.max(
        Number(page) || 1,
        1
      );

      const limitNumber = Math.min(
        Math.max(Number(limit) || 10, 1),
        100
      );

      const offset =
        (pageNumber - 1) * limitNumber;

      const allowedSortFields: Record<
        string,
        string
      > = {
        id: 'employees.id',
        employeeCode:
          'employees.employee_code',
        firstName: 'users.first_name',
        lastName: 'users.last_name',
        email: 'users.email',
        designation: 'employees.designation',
        joiningDate:
          'employees.joining_date',
        status: 'employees.status',
        createdAt:
          'employees.created_at',
      };

      const requestedSort =
        String(sortBy);

      const sortColumn =
        allowedSortFields[requestedSort] ??
        'employees.created_at';

      const direction =
        String(sortOrder).toLowerCase() ===
        'asc'
          ? 'asc'
          : 'desc';

      const query = db('employees')
        .leftJoin(
          'users',
          'employees.user_id',
          'users.id'
        )
        .leftJoin(
          'departments',
          'employees.department_id',
          'departments.id'
        )
        .leftJoin(
          'employees as managers',
          'employees.manager_id',
          'managers.id'
        )
        .leftJoin(
          'users as manager_users',
          'managers.user_id',
          'manager_users.id'
        )
        .select(
          'employees.id',
          'employees.user_id',
          'employees.employee_code',
          'employees.department_id',
          'employees.designation',
          'employees.manager_id',
          'employees.joining_date',
          'employees.employment_type',
          'employees.work_location',
          'employees.phone',
          'employees.address',
          'employees.status',
          'employees.created_at',
          'employees.updated_at',

          'users.first_name',
          'users.last_name',
          'users.email',
          'users.role',
          'users.is_active',

          'departments.name as department_name',

          db.raw(`
            CASE
              WHEN manager_users.id IS NOT NULL
              THEN CONCAT(
                manager_users.first_name,
                ' ',
                manager_users.last_name
              )
              ELSE NULL
            END AS manager_name
          `)
        );

      if (search) {
        const searchValue =
          `%${String(search).trim()}%`;

        query.where(function () {
          this.whereILike(
            'users.first_name',
            searchValue
          )
            .orWhereILike(
              'users.last_name',
              searchValue
            )
            .orWhereILike(
              'users.email',
              searchValue
            )
            .orWhereILike(
              'employees.employee_code',
              searchValue
            )
            .orWhereILike(
              'employees.designation',
              searchValue
            );
        });
      }

      if (departmentId) {
        query.where(
          'employees.department_id',
          Number(departmentId)
        );
      }

      if (designation) {
        query.where(
          'employees.designation',
          String(designation)
        );
      }

      if (employmentType) {
        query.where(
          'employees.employment_type',
          String(employmentType)
        );
      }

      if (status) {
        query.where(
          'employees.status',
          String(status)
        );
      }

      if (workLocation) {
        query.where(
          'employees.work_location',
          String(workLocation)
        );
      }

      if (managerId) {
        query.where(
          'employees.manager_id',
          Number(managerId)
        );
      }

      const countQuery = query
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct({
          count: 'employees.id',
        })
        .first();

      const countResult =
        await countQuery;

      const total = Number(
        countResult?.count ?? 0
      );

      const employees = await query
        .orderBy(
          sortColumn,
          direction
        )
        .limit(limitNumber)
        .offset(offset);

      const totalPages =
        Math.ceil(
          total / limitNumber
        );

      const statisticsResult =
        await db('employees')
          .select(
            db.raw(
              `COUNT(*)::int AS total`
            ),
            db.raw(`
              COUNT(
                CASE
                  WHEN status = 'ACTIVE'
                  THEN 1
                END
              )::int AS active
            `),
            db.raw(`
              COUNT(
                CASE
                  WHEN status = 'INACTIVE'
                  THEN 1
                END
              )::int AS inactive
            `),
            db.raw(`
              COUNT(
                CASE
                  WHEN status = 'ON_LEAVE'
                  THEN 1
                END
              )::int AS "onLeave"
            `),
            db.raw(`
              COUNT(
                CASE
                  WHEN status = 'SUSPENDED'
                  THEN 1
                END
              )::int AS suspended
            `),
            db.raw(`
              COUNT(
                CASE
                  WHEN status = 'TERMINATED'
                  THEN 1
                END
              )::int AS terminated
            `)
          )
          .first();

      res.json({
        data: employees,

        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages,
          hasNextPage:
            pageNumber < totalPages,
          hasPreviousPage:
            pageNumber > 1,
        },

        statistics: {
          total:
            Number(
              statisticsResult?.total ?? 0
            ),

          active:
            Number(
              statisticsResult?.active ?? 0
            ),

          inactive:
            Number(
              statisticsResult?.inactive ?? 0
            ),

          onLeave:
            Number(
              statisticsResult?.onLeave ?? 0
            ),

          suspended:
            Number(
              statisticsResult?.suspended ?? 0
            ),

          terminated:
            Number(
              statisticsResult?.terminated ?? 0
            ),
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   EMPLOYEE PROFILE
========================================================= */

r.get(
  '/employees/:id/profile',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER'
  ),
  async (req, res, next) => {
    try {
      const employeeId = Number(
        req.params.id
      );

      if (
        !Number.isInteger(employeeId) ||
        employeeId <= 0
      ) {
        return res.status(400).json({
          message: 'Invalid employee ID',
        });
      }

      /* =====================================================
         EMPLOYEE + USER + DEPARTMENT + MANAGER
      ===================================================== */

      const employee =
        await db('employees')
          .leftJoin(
            'users',
            'employees.user_id',
            'users.id'
          )
          .leftJoin(
            'departments',
            'employees.department_id',
            'departments.id'
          )
          .leftJoin(
            'employees as managers',
            'employees.manager_id',
            'managers.id'
          )
          .leftJoin(
            'users as manager_users',
            'managers.user_id',
            'manager_users.id'
          )
          .select(
            'employees.id',
            'employees.user_id',
            'employees.employee_code',
            'employees.department_id',
            'employees.designation',
            'employees.manager_id',
            'employees.joining_date',
            'employees.employment_type',
            'employees.work_location',
            'employees.phone',
            'employees.address',
            'employees.status',
            'employees.created_at',
            'employees.updated_at',

            'users.first_name',
            'users.last_name',
            'users.email',
            'users.role',
            'users.is_active',

            'departments.name as department_name',
            'departments.description as department_description',

            'manager_users.id as manager_user_id',
            'manager_users.first_name as manager_first_name',
            'manager_users.last_name as manager_last_name',
            'manager_users.email as manager_email',
            'manager_users.role as manager_role',

            'managers.employee_code as manager_employee_code',
            'managers.designation as manager_designation'
          )
          .where(
            'employees.id',
            employeeId
          )
          .first();

      if (!employee) {
        return res.status(404).json({
          message: 'Employee not found',
        });
      }

      /* =====================================================
         ATTENDANCE
      ===================================================== */

      const attendance =
        await db('attendance')
          .where(
            'employee_id',
            employeeId
          )
          .select(
            'id',
            'attendance_date',
            'check_in',
            'check_out',
            'break_minutes',
            'worked_minutes',
            'status',
            'notes'
          )
          .orderBy(
            'attendance_date',
            'desc'
          );

      const attendanceSummaryResult =
        await db('attendance')
          .where(
            'employee_id',
            employeeId
          )
          .select(
            db.raw(
              `COUNT(*)::int AS total_records`
            ),
            db.raw(`
              COUNT(
                CASE
                  WHEN UPPER(status) = 'PRESENT'
                  THEN 1
                END
              )::int AS present
            `),
            db.raw(`
              COUNT(
                CASE
                  WHEN UPPER(status) = 'ABSENT'
                  THEN 1
                END
              )::int AS absent
            `),
            db.raw(`
              COUNT(
                CASE
                  WHEN UPPER(status) = 'EXCUSED'
                  THEN 1
                END
              )::int AS excused
            `),
            db.raw(`
              COALESCE(
                SUM(worked_minutes),
                0
              )::int AS total_worked_minutes
            `)
          )
          .first();

      const totalAttendance =
        Number(
          attendanceSummaryResult?.total_records ??
            0
        );

      const presentAttendance =
        Number(
          attendanceSummaryResult?.present ??
            0
        );

      const attendancePercentage =
        totalAttendance > 0
          ? Number(
              (
                (presentAttendance /
                  totalAttendance) *
                100
              ).toFixed(2)
            )
          : 0;

      /* =====================================================
         LEAVE SUMMARY + HISTORY
      ===================================================== */

      const leaveRequests =
        await db('leave_requests')
          .leftJoin(
            'leave_types',
            'leave_requests.leave_type_id',
            'leave_types.id'
          )
          .select(
            'leave_requests.id',
            'leave_requests.leave_type_id',
            'leave_requests.start_date',
            'leave_requests.end_date',
            'leave_requests.days',
            'leave_requests.reason',
            'leave_requests.status',
            'leave_requests.approved_by',
            'leave_requests.created_at',
            'leave_requests.updated_at',
            'leave_types.name as leave_type_name'
          )
          .where(
            'leave_requests.employee_id',
            employeeId
          )
          .orderBy(
            'leave_requests.created_at',
            'desc'
          );

      const leaveSummaryResult =
        await db('leave_requests')
          .where(
            'employee_id',
            employeeId
          )
          .select(
            db.raw(
              `COUNT(*)::int AS total_requests`
            ),
            db.raw(`
              COUNT(
                CASE
                  WHEN status = 'APPROVED'
                  THEN 1
                END
              )::int AS approved
            `),
            db.raw(`
              COUNT(
                CASE
                  WHEN status = 'PENDING'
                  THEN 1
                END
              )::int AS pending
            `),
            db.raw(`
              COUNT(
                CASE
                  WHEN status = 'REJECTED'
                  THEN 1
                END
              )::int AS rejected
            `),
            db.raw(`
              COUNT(
                CASE
                  WHEN status = 'CANCELLED'
                  THEN 1
                END
              )::int AS cancelled
            `),
            db.raw(`
              COALESCE(
                SUM(
                  CASE
                    WHEN status = 'APPROVED'
                    THEN days
                    ELSE 0
                  END
                ),
                0
              )::int AS approved_days
            `)
          )
          .first();

      /* =====================================================
         SALARY STRUCTURE
      ===================================================== */

      const salaryStructure =
        await db('salary_structures')
          .where(
            'employee_id',
            employeeId
          )
          .orderBy(
            'effective_from',
            'desc'
          )
          .first();

      /* =====================================================
         PAYROLL

         IMPORTANT:
         payroll table does NOT have pay_period_start.
         It uses pay_year and pay_month.
      ===================================================== */

      const payroll =
        await db('payroll')
          .where(
            'employee_id',
            employeeId
          )
          .orderBy(
            'pay_year',
            'desc'
          )
          .orderBy(
            'pay_month',
            'desc'
          );

      const latestPayroll =
        payroll.length > 0
          ? payroll[0]
          : null;

      /* =====================================================
         PERFORMANCE GOALS
      ===================================================== */

      const performanceGoals =
        await db('performance_goals')
          .where(
            'employee_id',
            employeeId
          )
          .select(
            'id',
            'title',
            'description',
            'progress',
            'status',
            'start_date',
            'due_date',
            'created_at',
            'updated_at'
          )
          .orderBy(
            'created_at',
            'desc'
          );

      /* =====================================================
         PERFORMANCE REVIEWS
      ===================================================== */

      const performanceReviews =
        await db('performance_reviews')
          .leftJoin(
            'users as reviewers',
            'performance_reviews.reviewer_id',
            'reviewers.id'
          )
          .select(
            'performance_reviews.id',
            'performance_reviews.reviewer_id',
            'performance_reviews.review_period',
            'performance_reviews.rating',
            'performance_reviews.strengths',
            'performance_reviews.areas_for_improvement',
            'performance_reviews.comments',
            'performance_reviews.status',
            'performance_reviews.review_date',
            'performance_reviews.created_at',
            'performance_reviews.updated_at',

            'reviewers.first_name as reviewer_first_name',
            'reviewers.last_name as reviewer_last_name',
            'reviewers.email as reviewer_email'
          )
          .where(
            'performance_reviews.employee_id',
            employeeId
          )
          .orderBy(
            'performance_reviews.review_date',
            'desc'
          )
          .orderBy(
            'performance_reviews.created_at',
            'desc'
          );

      /* =====================================================
         PERFORMANCE REVIEW GOALS
      ===================================================== */

      const reviewIds =
        performanceReviews.map(
          (review) => review.id
        );

      let performanceReviewGoals: any[] =
        [];

      if (reviewIds.length > 0) {
        performanceReviewGoals =
          await db(
            'performance_review_goals'
          )
            .leftJoin(
              'performance_goals',
              'performance_review_goals.goal_id',
              'performance_goals.id'
            )
            .select(
              'performance_review_goals.id',
              'performance_review_goals.review_id',
              'performance_review_goals.goal_id',
              'performance_review_goals.achievement_percentage',
              'performance_review_goals.comments',

              'performance_goals.title as goal_title',
              'performance_goals.description as goal_description'
            )
            .whereIn(
              'performance_review_goals.review_id',
              reviewIds
            )
            .orderBy(
              'performance_review_goals.created_at',
              'desc'
            );
      }

      /* =====================================================
         ACTIVITY HISTORY
      ===================================================== */

      const activityHistory =
        await db('audit_logs')
          .where(
            'user_id',
            employee.user_id
          )
          .select(
            'id',
            'action',
            'entity_type',
            'entity_id',
            'details',
            'ip_address',
            'created_at'
          )
          .orderBy(
            'created_at',
            'desc'
          )
          .limit(100);

      /* =====================================================
         DOCUMENTS

         No documents table currently exists.
      ===================================================== */

      const documents: any[] = [];

      /* =====================================================
         PERFORMANCE SUMMARY
      ===================================================== */

      const ratings =
        performanceReviews
          .map((review) =>
            review.rating !== null &&
            review.rating !== undefined
              ? Number(review.rating)
              : null
          )
          .filter(
            (rating): rating is number =>
              rating !== null &&
              !Number.isNaN(rating)
          );

      const averageRating =
        ratings.length > 0
          ? Number(
              (
                ratings.reduce(
                  (sum, rating) =>
                    sum + rating,
                  0
                ) / ratings.length
              ).toFixed(2)
            )
          : null;

      /* =====================================================
         RESPONSE
      ===================================================== */

      res.json({
        employee: {
          id: employee.id,
          userId: employee.user_id,
          employeeCode:
            employee.employee_code,

          personalInformation: {
            firstName:
              employee.first_name,
            lastName:
              employee.last_name,
            fullName:
              `${employee.first_name} ${employee.last_name}`,
            email:
              employee.email,
            phone:
              employee.phone,
            address:
              employee.address,
          },

          employmentInformation: {
            employeeCode:
              employee.employee_code,
            departmentId:
              employee.department_id,
            departmentName:
              employee.department_name,
            departmentDescription:
              employee.department_description,
            designation:
              employee.designation,
            joiningDate:
              employee.joining_date,
            employmentType:
              employee.employment_type,
            workLocation:
              employee.work_location,
            status:
              employee.status,
          },

          accountInformation: {
            role:
              employee.role,
            isActive:
              employee.is_active,
          },

          managerReporting: {
            managerId:
              employee.manager_id,

            managerEmployeeCode:
              employee.manager_employee_code ??
              null,

            managerUserId:
              employee.manager_user_id ??
              null,

            managerName:
              employee.manager_first_name &&
              employee.manager_last_name
                ? `${employee.manager_first_name} ${employee.manager_last_name}`
                : null,

            managerEmail:
              employee.manager_email ??
              null,

            managerRole:
              employee.manager_role ??
              null,

            managerDesignation:
              employee.manager_designation ??
              null,
          },

          createdAt:
            employee.created_at,

          updatedAt:
            employee.updated_at,
        },

        attendanceSummary: {
          totalRecords:
            totalAttendance,

          present:
            Number(
              attendanceSummaryResult?.present ??
                0
            ),

          absent:
            Number(
              attendanceSummaryResult?.absent ??
                0
            ),

          excused:
            Number(
              attendanceSummaryResult?.excused ??
                0
            ),

          totalWorkedMinutes:
            Number(
              attendanceSummaryResult?.total_worked_minutes ??
                0
            ),

          attendancePercentage,
        },

        attendance,

        leaveSummary: {
          totalRequests:
            Number(
              leaveSummaryResult?.total_requests ??
                0
            ),

          approved:
            Number(
              leaveSummaryResult?.approved ??
                0
            ),

          pending:
            Number(
              leaveSummaryResult?.pending ??
                0
            ),

          rejected:
            Number(
              leaveSummaryResult?.rejected ??
                0
            ),

          cancelled:
            Number(
              leaveSummaryResult?.cancelled ??
                0
            ),

          approvedDays:
            Number(
              leaveSummaryResult?.approved_days ??
                0
            ),
        },

        leaveRequests,

        payrollSummary: {
          salaryStructure:
            salaryStructure ?? null,

          latestPayroll,

          payrollHistory:
            payroll,
        },

        performance: {
          summary: {
            totalGoals:
              performanceGoals.length,

            totalReviews:
              performanceReviews.length,

            averageRating,
          },

          goals:
            performanceGoals,

          reviews:
            performanceReviews.map(
              (review) => ({
                ...review,

                goals:
                  performanceReviewGoals.filter(
                    (item) =>
                      Number(
                        item.review_id
                      ) ===
                      Number(review.id)
                  ),
              })
            ),
        },

        documents,

        activityHistory,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   ANNOUNCEMENTS
========================================================= */

r.get(
  '/announcements',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'PAYROLL',
    'EMPLOYEE'
  ),
  async (req, res, next) => {
    try {
      const announcements =
        await db('announcements')
          .select('*')
          .orderBy(
            'created_at',
            'desc'
          );

      res.json(announcements);
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   NOTIFICATIONS
========================================================= */

r.get(
  '/notifications',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'PAYROLL',
    'EMPLOYEE'
  ),
  async (req, res, next) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({
            message:
              'Authentication required',
          });
      }

      const notifications =
        await db('notifications')
          .where(
            'user_id',
            userId
          )
          .orderBy(
            'created_at',
            'desc'
          );

      res.json(notifications);
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   LEAVE TYPES
========================================================= */

r.get(
  '/leave/types',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'PAYROLL',
    'EMPLOYEE'
  ),
  async (req, res, next) => {
    try {
      const leaveTypes =
        await db('leave_types')
          .select('*')
          .orderBy(
            'name',
            'asc'
          );

      res.json(leaveTypes);
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   MY LEAVE
========================================================= */

r.get(
  '/leave/me',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'PAYROLL',
    'EMPLOYEE'
  ),
  async (req, res, next) => {
    try {
      const employee =
        await db('employees')
          .where(
            'user_id',
            req.user?.id
          )
          .first();

      if (!employee) {
        return res
          .status(404)
          .json({
            message:
              'Employee profile not found',
          });
      }

      const leaves =
        await db('leave_requests')
          .where(
            'employee_id',
            employee.id
          )
          .orderBy(
            'created_at',
            'desc'
          );

      res.json(leaves);
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   APPLY LEAVE
========================================================= */

r.post(
  '/leave',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'PAYROLL',
    'EMPLOYEE'
  ),
  async (req, res, next) => {
    try {
      const employee =
        await db('employees')
          .where(
            'user_id',
            req.user?.id
          )
          .first();

      if (!employee) {
        return res
          .status(404)
          .json({
            message:
              'Employee profile not found',
          });
      }

      const {
        leaveTypeId,
        startDate,
        endDate,
        reason,
      } = req.body;

      if (
        !leaveTypeId ||
        !startDate ||
        !endDate
      ) {
        return res
          .status(400)
          .json({
            message:
              'leaveTypeId, startDate and endDate are required',
          });
      }

      const [leave] =
        await db(
          'leave_requests'
        )
          .insert({
            employee_id:
              employee.id,

            leave_type_id:
              leaveTypeId,

            start_date:
              startDate,

            end_date:
              endDate,

            reason:
              reason || null,

            status:
              'PENDING',
          })
          .returning('*');

      res.status(201).json(
        leave
      );
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   LEAVE STATUS
========================================================= */

r.patch(
  '/leave/:id/status',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER'
  ),
  async (req, res, next) => {
    try {
      const {
        status,
        remarks,
      } = req.body;

      const allowedStatuses = [
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              'Invalid leave status',
          });
      }

      const updateData: Record<
        string,
        any
      > = {
        status,
        updated_at:
          new Date(),
      };

      /*
        leave_requests currently does not
        contain a remarks column.

        Therefore remarks is intentionally
        not written to the database.
      */

      if (
        remarks !== undefined
      ) {
        // Intentionally ignored.
      }

      const [updatedLeave] =
        await db(
          'leave_requests'
        )
          .where(
            'id',
            Number(req.params.id)
          )
          .update(updateData)
          .returning('*');

      if (!updatedLeave) {
        return res
          .status(404)
          .json({
            message:
              'Leave request not found',
          });
      }

      res.json(
        updatedLeave
      );
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
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'PAYROLL',
    'EMPLOYEE'
  ),
  async (req, res, next) => {
    try {
      const employee =
        await db('employees')
          .where(
            'user_id',
            req.user?.id
          )
          .first();

      if (!employee) {
        return res
          .status(404)
          .json({
            message:
              'Employee profile not found',
          });
      }

      const salary =
        await db(
          'salary_structures'
        )
          .where(
            'employee_id',
            employee.id
          )
          .first();

      if (!salary) {
        return res
          .status(404)
          .json({
            message:
              'Salary structure not found',
          });
      }

      res.json(salary);
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   MY PAYROLL
========================================================= */

r.get(
  '/payroll/me',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'PAYROLL',
    'EMPLOYEE'
  ),
  async (req, res, next) => {
    try {
      const employee =
        await db('employees')
          .where(
            'user_id',
            req.user?.id
          )
          .first();

      if (!employee) {
        return res
          .status(404)
          .json({
            message:
              'Employee profile not found',
          });
      }

      const payroll =
        await db('payroll')
          .where(
            'employee_id',
            employee.id
          )
          .orderBy(
            'pay_year',
            'desc'
          )
          .orderBy(
            'pay_month',
            'desc'
          );

      res.json(payroll);
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   PAYROLL DIRECTORY
========================================================= */

r.get(
  '/payroll',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'PAYROLL'
  ),
  async (req, res, next) => {
    try {
      const payroll =
        await db('payroll')
          .leftJoin(
            'employees',
            'payroll.employee_id',
            'employees.id'
          )
          .leftJoin(
            'users',
            'employees.user_id',
            'users.id'
          )
          .select(
            'payroll.*',
            'employees.employee_code',
            'users.first_name',
            'users.last_name',
            'users.email'
          )
          .orderBy(
            'payroll.created_at',
            'desc'
          );

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
  role(
    'SUPER_ADMIN',
    'HR_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        employeeCode,
        role: userRole,
        designation,
        departmentId,
        managerId,
        joiningDate,
        employmentType,
        workLocation,
        phone,
        address,
        status,
        isActive,
      } = req.body;

      if (
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !employeeCode
      ) {
        return res
          .status(400)
          .json({
            message:
              'firstName, lastName, email, password and employeeCode are required',
          });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const normalizedEmployeeCode =
        String(employeeCode)
          .trim()
          .toUpperCase();

      const allowedRoles = [
        'SUPER_ADMIN',
        'HR_ADMIN',
        'MANAGER',
        'PAYROLL',
        'EMPLOYEE',
      ];

      const finalRole =
        userRole || 'EMPLOYEE';

      if (
        !allowedRoles.includes(
          finalRole
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              'Invalid user role',
          });
      }

      const allowedStatuses = [
        'ACTIVE',
        'INACTIVE',
        'ON_LEAVE',
        'SUSPENDED',
        'TERMINATED',
      ];

      const finalStatus =
        status || 'ACTIVE';

      if (
        !allowedStatuses.includes(
          finalStatus
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              'Invalid employee status',
          });
      }

      const existingUser =
        await db('users')
          .where(
            'email',
            normalizedEmail
          )
          .first();

      if (existingUser) {
        return res
          .status(409)
          .json({
            message:
              'A user with this email already exists',
          });
      }

      const existingEmployee =
        await db('employees')
          .where(
            'employee_code',
            normalizedEmployeeCode
          )
          .first();

      if (existingEmployee) {
        return res
          .status(409)
          .json({
            message:
              'An employee with this employee code already exists',
          });
      }

      if (departmentId) {
        const department =
          await db(
            'departments'
          )
            .where(
              'id',
              Number(departmentId)
            )
            .first();

        if (!department) {
          return res
            .status(400)
            .json({
              message:
                'Selected department does not exist',
            });
        }
      }

      if (managerId) {
        const manager =
          await db('employees')
            .where(
              'id',
              Number(managerId)
            )
            .first();

        if (!manager) {
          return res
            .status(400)
            .json({
              message:
                'Selected manager does not exist',
            });
        }
      }

      const passwordHash =
        await bcrypt.hash(
          String(password),
          12
        );

      const result =
        await db.transaction(
          async (trx) => {
            const [user] =
              await trx('users')
                .insert({
                  first_name:
                    String(
                      firstName
                    ).trim(),

                  last_name:
                    String(
                      lastName
                    ).trim(),

                  email:
                    normalizedEmail,

                  password_hash:
                    passwordHash,

                  role:
                    finalRole,

                  is_active:
                    isActive !==
                    false,

                  created_at:
                    new Date(),

                  updated_at:
                    new Date(),
                })
                .returning([
                  'id',
                  'first_name',
                  'last_name',
                  'email',
                  'role',
                  'is_active',
                  'created_at',
                  'updated_at',
                ]);

            const [employee] =
              await trx(
                'employees'
              )
                .insert({
                  user_id:
                    user.id,

                  employee_code:
                    normalizedEmployeeCode,

                  department_id:
                    departmentId
                      ? Number(
                          departmentId
                        )
                      : null,

                  designation:
                    designation
                      ? String(
                          designation
                        ).trim()
                      : null,

                  manager_id:
                    managerId
                      ? Number(
                          managerId
                        )
                      : null,

                  joining_date:
                    joiningDate ||
                    null,

                  employment_type:
                    employmentType
                      ? String(
                          employmentType
                        ).trim()
                      : null,

                  work_location:
                    workLocation
                      ? String(
                          workLocation
                        ).trim()
                      : null,

                  phone:
                    phone
                      ? String(
                          phone
                        ).trim()
                      : null,

                  address:
                    address
                      ? String(
                          address
                        ).trim()
                      : null,

                  status:
                    finalStatus,

                  created_at:
                    new Date(),

                  updated_at:
                    new Date(),
                })
                .returning('*');

            try {
              await trx(
                'audit_logs'
              ).insert({
                user_id:
                  req.user?.id ??
                  null,

                action:
                  'CREATE_EMPLOYEE',

                entity_type:
                  'employees',

                entity_id:
                  employee.id,

                details:
                  JSON.stringify({
                    employeeCode:
                      employee.employee_code,

                    email:
                      user.email,

                    role:
                      user.role,
                  }),

                created_at:
                  new Date(),
              });
            } catch {
              /*
                Audit logging should not prevent
                employee creation.
              */
            }

            return {
              user,
              employee,
            };
          }
        );

      res.status(201).json({
        message:
          'Employee created successfully',

        employee:
          result.employee,

        user:
          result.user,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default r;