import { Router, Request, Response, NextFunction } from 'express';
import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { auth, role } from '../middleware/auth';

const router = Router();

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'] as const;

const MANAGEMENT_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'MANAGER',
] as const;

const EMPLOYEE_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED',
] as const;

const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
  'TEMPORARY',
] as const;

const DOCUMENT_TYPES = [
  'RESUME',
  'ID_PROOF',
  'ADDRESS_PROOF',
  'OFFER_LETTER',
  'JOINING_DOCUMENTS',
  'EMPLOYMENT_AGREEMENT',
  'CERTIFICATE',
  'OTHER_HR_DOCUMENT',
] as const;

const DOCUMENT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'ACTIVE',
] as const;

type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];
type DocumentType = (typeof DOCUMENT_TYPES)[number];
type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    handler(req, res, next).catch(next);
  };
}

function isValidStatus(
  value: unknown
): value is EmployeeStatus {
  return (
    typeof value === 'string' &&
    EMPLOYEE_STATUSES.includes(value as EmployeeStatus)
  );
}

function isValidDocumentType(
  value: unknown
): value is DocumentType {
  return (
    typeof value === 'string' &&
    DOCUMENT_TYPES.includes(value as DocumentType)
  );
}

function isValidDocumentStatus(
  value: unknown
): value is DocumentStatus {
  return (
    typeof value === 'string' &&
    DOCUMENT_STATUSES.includes(value as DocumentStatus)
  );
}

function isValidPhone(
  value: string | null | undefined
): boolean {
  if (!value) {
    return true;
  }

  return /^\+?[0-9\s()-]{7,20}$/.test(value);
}

function toNullableNumber(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

/* =========================================================
   AUDIT HELPER
   ========================================================= */

async function createAuditLog(
  userId: number,
  action: string,
  entityType: string,
  entityId: number | null,
  details: Record<string, unknown>
) {
  try {
    await db('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: JSON.stringify(details),
    });
  } catch {
    // Audit logging must never break the main operation.
  }
}

/* =========================================================
   OPTIONS
   ========================================================= */

router.get(
  '/options',
  auth,
  role(...MANAGEMENT_ROLES),
  asyncHandler(async (_req, res) => {
    const departments = await db('departments')
      .select(
        'id',
        'name',
        'description'
      )
      .orderBy('name', 'asc');

    const designations = await db('designations')
      .select(
        'id',
        'name',
        'description',
        'is_active'
      )
      .where('is_active', true)
      .orderBy('name', 'asc');

    const managers = await db('employees')
      .leftJoin(
        'users',
        'users.id',
        'employees.user_id'
      )
      .select(
        'employees.id',
        'employees.employee_code',
        'employees.designation',
        'employees.status',
        db.raw(
          `CONCAT(users.first_name, ' ', users.last_name) AS name`
        )
      )
      .whereIn('employees.status', [
        'ACTIVE',
        'ON_LEAVE',
      ])
      .where(function () {
        this.where(
          'users.role',
          'MANAGER'
        )
          .orWhereILike(
            'employees.designation',
            '%manager%'
          )
          .orWhereILike(
            'employees.designation',
            '%team lead%'
          );
      })
      .orderBy(
        'users.first_name',
        'asc'
      );

    res.json({
      departments,
      designations,
      managers,
      statuses: EMPLOYEE_STATUSES,
      employmentTypes: EMPLOYMENT_TYPES,
      documentTypes: DOCUMENT_TYPES,
      documentStatuses: DOCUMENT_STATUSES,
    });
  })
);

/* =========================================================
   EMPLOYEE UPDATE
   ========================================================= */

router.put(
  '/employees/:id',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId)) {
      res.status(400).json({
        message: 'Invalid employee ID',
      });
      return;
    }

    const existing = await db('employees')
      .where('id', employeeId)
      .first();

    if (!existing) {
      res.status(404).json({
        message: 'Employee not found',
      });
      return;
    }

    const {
      firstName,
      lastName,
      phone,
      address,
      departmentId,
      designationId,
      managerId,
      employmentType,
      workLocation,
      joiningDate,
      status,
      metadata,
    } = req.body;

    if (
      phone &&
      !isValidPhone(phone)
    ) {
      res.status(400).json({
        message: 'Invalid phone number',
      });
      return;
    }

    if (
      status !== undefined &&
      !isValidStatus(status)
    ) {
      res.status(400).json({
        message: `Invalid employee status. Allowed values: ${EMPLOYEE_STATUSES.join(
          ', '
        )}`,
      });
      return;
    }

    if (
      employmentType !== undefined &&
      employmentType !== null &&
      employmentType !== '' &&
      !EMPLOYMENT_TYPES.includes(
        employmentType
      )
    ) {
      res.status(400).json({
        message: `Invalid employment type. Allowed values: ${EMPLOYMENT_TYPES.join(
          ', '
        )}`,
      });
      return;
    }

    const newDepartmentId =
      toNullableNumber(departmentId);

    const newDesignationId =
      toNullableNumber(designationId);

    const newManagerId =
      toNullableNumber(managerId);

    if (newDepartmentId !== null) {
      const department = await db(
        'departments'
      )
        .where('id', newDepartmentId)
        .first();

      if (!department) {
        res.status(400).json({
          message: 'Department not found',
        });
        return;
      }
    }

    let designationName:
      | string
      | null =
      existing.designation ?? null;

    if (newDesignationId !== null) {
      const designation = await db(
        'designations'
      )
        .where('id', newDesignationId)
        .where('is_active', true)
        .first();

      if (!designation) {
        res.status(400).json({
          message:
            'Designation not found or inactive',
        });
        return;
      }

      designationName = designation.name;
    }

    if (newManagerId !== null) {
      if (newManagerId === employeeId) {
        res.status(400).json({
          message:
            'Employee cannot report to themselves',
        });
        return;
      }

      const manager = await db('employees')
        .where(
          'employees.id',
          newManagerId
        )
        .first();

      if (!manager) {
        res.status(400).json({
          message: 'Manager not found',
        });
        return;
      }
    }

    await db.transaction(
      async (trx: Knex.Transaction) => {
        const employeeUpdate: Record<
          string,
          unknown
        > = {
          phone:
            phone !== undefined
              ? phone || null
              : existing.phone,

          address:
            address !== undefined
              ? address || null
              : existing.address,

          department_id:
            departmentId !== undefined
              ? newDepartmentId
              : existing.department_id,

          designation:
            newDesignationId !== null
              ? designationName
              : existing.designation,

          designation_id:
            designationId !== undefined
              ? newDesignationId
              : existing.designation_id,

          manager_id:
            managerId !== undefined
              ? newManagerId
              : existing.manager_id,

          employment_type:
            employmentType !== undefined
              ? employmentType || null
              : existing.employment_type,

          work_location:
            workLocation !== undefined
              ? workLocation || null
              : existing.work_location,

          joining_date:
            joiningDate !== undefined
              ? joiningDate || null
              : existing.joining_date,

          status:
            status !== undefined
              ? status
              : existing.status,

          updated_at: trx.fn.now(),
        };

        if (metadata !== undefined) {
          employeeUpdate.metadata =
            metadata ?? {};
        }

        await trx('employees')
          .where('id', employeeId)
          .update(employeeUpdate);

        if (
          firstName !== undefined ||
          lastName !== undefined
        ) {
          const userUpdate: Record<
            string,
            unknown
          > = {
            updated_at: trx.fn.now(),
          };

          if (firstName !== undefined) {
            userUpdate.first_name =
              firstName;
          }

          if (lastName !== undefined) {
            userUpdate.last_name =
              lastName;
          }

          await trx('users')
            .where(
              'id',
              existing.user_id
            )
            .update(userUpdate);
        }

        if (status !== undefined) {
          const shouldBeActive =
            status !== 'INACTIVE' &&
            status !== 'TERMINATED';

          await trx('users')
            .where(
              'id',
              existing.user_id
            )
            .update({
              is_active:
                shouldBeActive,
              updated_at:
                trx.fn.now(),
            });
        }
      }
    );

    const updated = await db('employees')
      .leftJoin(
        'users',
        'users.id',
        'employees.user_id'
      )
      .leftJoin(
        'departments',
        'departments.id',
        'employees.department_id'
      )
      .leftJoin(
        'designations',
        'designations.id',
        'employees.designation_id'
      )
      .select(
        'employees.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.role',
        'users.is_active',
        'departments.name as department',
        'designations.name as designation_name'
      )
      .where(
        'employees.id',
        employeeId
      )
      .first();

    await createAuditLog(
      req.user!.id,
      'UPDATE_EMPLOYEE',
      'employees',
      employeeId,
      {
        employeeId,
        employeeCode:
          existing.employee_code,
        changes: {
          firstName,
          lastName,
          phone,
          address,
          departmentId,
          designationId,
          managerId,
          employmentType,
          workLocation,
          joiningDate,
          status,
          metadata,
        },
      }
    );

    res.json({
      message:
        'Employee updated successfully',
      employee: updated,
    });
  })
);

/* =========================================================
   EMPLOYEE STATUS
   ========================================================= */

router.patch(
  '/employees/:id/status',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = Number(
      req.params.id
    );

    const { status } = req.body;

    if (!Number.isInteger(employeeId)) {
      res.status(400).json({
        message: 'Invalid employee ID',
      });
      return;
    }

    if (!isValidStatus(status)) {
      res.status(400).json({
        message: `Invalid status. Allowed values: ${EMPLOYEE_STATUSES.join(
          ', '
        )}`,
      });
      return;
    }

    const employee = await db('employees')
      .where('id', employeeId)
      .first();

    if (!employee) {
      res.status(404).json({
        message: 'Employee not found',
      });
      return;
    }

    const isActive =
      status !== 'INACTIVE' &&
      status !== 'TERMINATED';

    await db.transaction(
      async (trx: Knex.Transaction) => {
        await trx('employees')
          .where('id', employeeId)
          .update({
            status,
            updated_at:
              trx.fn.now(),
          });

        await trx('users')
          .where(
            'id',
            employee.user_id
          )
          .update({
            is_active: isActive,
            updated_at:
              trx.fn.now(),
          });
      }
    );

    await createAuditLog(
      req.user!.id,
      'UPDATE_EMPLOYEE_STATUS',
      'employees',
      employeeId,
      {
        employeeId,
        previousStatus:
          employee.status,
        newStatus: status,
        isActive,
      }
    );

    res.json({
      message:
        'Employee status updated successfully',
      employeeId,
      status,
      isActive,
    });
  })
);

/* =========================================================
   EMPLOYEE ACCOUNT CONTROLS
   ========================================================= */

const USER_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'MANAGER',
  'PAYROLL',
  'EMPLOYEE',
] as const;

type UserRole = (typeof USER_ROLES)[number];

function isValidUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    USER_ROLES.includes(value as UserRole)
  );
}

router.patch(
  '/employees/:id/account-role',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = Number(req.params.id);
    const newRole = req.body?.role;

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({ message: 'Invalid employee ID' });
      return;
    }

    if (!isValidUserRole(newRole)) {
      res.status(400).json({
        message: `Invalid role. Allowed values: ${USER_ROLES.join(', ')}`,
      });
      return;
    }

    const employee = await db('employees')
      .leftJoin('users', 'users.id', 'employees.user_id')
      .select(
        'employees.id',
        'employees.employee_code',
        'employees.user_id',
        'users.role'
      )
      .where('employees.id', employeeId)
      .first();

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    if (Number(employee.user_id) === Number(req.user!.id)) {
      res.status(400).json({
        message: 'You cannot change your own account role',
      });
      return;
    }

    if (
      newRole === 'SUPER_ADMIN' &&
      req.user!.role !== 'SUPER_ADMIN'
    ) {
      res.status(403).json({
        message: 'Only SUPER_ADMIN can assign the SUPER_ADMIN role',
      });
      return;
    }

    if (
      employee.role === 'SUPER_ADMIN' &&
      req.user!.role !== 'SUPER_ADMIN'
    ) {
      res.status(403).json({
        message: 'Only SUPER_ADMIN can change a SUPER_ADMIN account',
      });
      return;
    }

    await db('users')
      .where('id', employee.user_id)
      .update({
        role: newRole,
        updated_at: db.fn.now(),
      });

    await createAuditLog(
      req.user!.id,
      'UPDATE_EMPLOYEE_ROLE',
      'users',
      Number(employee.user_id),
      {
        employeeId,
        employeeCode: employee.employee_code,
        previousRole: employee.role,
        newRole,
      }
    );

    res.json({
      message: 'Employee account role updated successfully',
      employeeId,
      previousRole: employee.role,
      role: newRole,
    });
  })
);

router.post(
  '/employees/:id/reset-password',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId = Number(req.params.id);
    const password = String(req.body?.password || '');

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({ message: 'Invalid employee ID' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    const employee = await db('employees')
      .leftJoin('users', 'users.id', 'employees.user_id')
      .select(
        'employees.id',
        'employees.employee_code',
        'employees.user_id',
        'users.email',
        'users.role'
      )
      .where('employees.id', employeeId)
      .first();

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    if (Number(employee.user_id) === Number(req.user!.id)) {
      res.status(400).json({
        message: 'Use your own account security flow to change your password',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db('users')
      .where('id', employee.user_id)
      .update({
        password_hash: passwordHash,
        updated_at: db.fn.now(),
      });

    await createAuditLog(
      req.user!.id,
      'RESET_EMPLOYEE_PASSWORD',
      'users',
      Number(employee.user_id),
      {
        employeeId,
        employeeCode: employee.employee_code,
        email: employee.email,
      }
    );

    res.json({
      message: 'Employee password reset successfully',
      employeeId,
    });
  })
);

/* =========================================================
   DEPARTMENTS - LIST
   ========================================================= */

router.get(
  '/departments',
  auth,
  role(...MANAGEMENT_ROLES),
  asyncHandler(async (_req, res) => {
    const departments =
      await db('departments')
        .leftJoin(
          'employees',
          'employees.department_id',
          'departments.id'
        )
        .select(
          'departments.id',
          'departments.name',
          'departments.description',
          'departments.created_at',
          'departments.updated_at'
        )
        .count(
          'employees.id as employee_count'
        )
        .groupBy(
          'departments.id'
        )
        .orderBy(
          'departments.name',
          'asc'
        );

    res.json({
      departments,
    });
  })
);

/* =========================================================
   DEPARTMENT - CREATE
   ========================================================= */

router.post(
  '/departments',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
    } = req.body;

    if (
      !name ||
      typeof name !== 'string' ||
      !name.trim()
    ) {
      res.status(400).json({
        message:
          'Department name is required',
      });
      return;
    }

    const trimmedName =
      name.trim();

    const existing =
      await db('departments')
        .whereRaw(
          'LOWER(name) = LOWER(?)',
          [trimmedName]
        )
        .first();

    if (existing) {
      res.status(409).json({
        message:
          'Department already exists',
      });
      return;
    }

    const [department] =
      await db('departments')
        .insert({
          name: trimmedName,
          description:
            description?.trim() ||
            null,
        })
        .returning('*');

    await createAuditLog(
      req.user!.id,
      'CREATE_DEPARTMENT',
      'departments',
      department.id,
      {
        departmentId:
          department.id,
        name: department.name,
      }
    );

    res.status(201).json({
      message:
        'Department created successfully',
      department,
    });
  })
);

/* =========================================================
   DEPARTMENT - UPDATE
   ========================================================= */

router.put(
  '/departments/:id',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const departmentId =
      Number(req.params.id);

    const {
      name,
      description,
    } = req.body;

    if (
      !Number.isInteger(
        departmentId
      )
    ) {
      res.status(400).json({
        message:
          'Invalid department ID',
      });
      return;
    }

    if (
      !name ||
      typeof name !== 'string' ||
      !name.trim()
    ) {
      res.status(400).json({
        message:
          'Department name is required',
      });
      return;
    }

    const department =
      await db('departments')
        .where(
          'id',
          departmentId
        )
        .first();

    if (!department) {
      res.status(404).json({
        message:
          'Department not found',
      });
      return;
    }

    const duplicate =
      await db('departments')
        .whereRaw(
          'LOWER(name) = LOWER(?)',
          [name.trim()]
        )
        .whereNot(
          'id',
          departmentId
        )
        .first();

    if (duplicate) {
      res.status(409).json({
        message:
          'Another department with this name already exists',
      });
      return;
    }

    const [updated] =
      await db('departments')
        .where(
          'id',
          departmentId
        )
        .update({
          name: name.trim(),
          description:
            description?.trim() ||
            null,
          updated_at:
            db.fn.now(),
        })
        .returning('*');

    await createAuditLog(
      req.user!.id,
      'UPDATE_DEPARTMENT',
      'departments',
      departmentId,
      {
        departmentId,
        previousName:
          department.name,
        newName:
          updated.name,
      }
    );

    res.json({
      message:
        'Department updated successfully',
      department: updated,
    });
  })
);

/* =========================================================
   DEPARTMENT - DELETE
   ========================================================= */

router.delete(
  '/departments/:id',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const departmentId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        departmentId
      )
    ) {
      res.status(400).json({
        message:
          'Invalid department ID',
      });
      return;
    }

    const department =
      await db('departments')
        .where(
          'id',
          departmentId
        )
        .first();

    if (!department) {
      res.status(404).json({
        message:
          'Department not found',
      });
      return;
    }

    const activeEmployees =
      await db('employees')
        .where(
          'department_id',
          departmentId
        )
        .whereIn('status', [
          'ACTIVE',
          'ON_LEAVE',
          'SUSPENDED',
        ])
        .count('id as count')
        .first();

    const count = Number(
      activeEmployees?.count || 0
    );

    if (count > 0) {
      res.status(409).json({
        message:
          `Cannot delete department because ${count} employee(s) are currently assigned to it`,
      });
      return;
    }

    await db.transaction(
      async (trx: Knex.Transaction) => {
        await trx('employees')
          .where(
            'department_id',
            departmentId
          )
          .update({
            department_id: null,
            updated_at:
              trx.fn.now(),
          });

        await trx('departments')
          .where(
            'id',
            departmentId
          )
          .delete();
      }
    );

    await createAuditLog(
      req.user!.id,
      'DELETE_DEPARTMENT',
      'departments',
      departmentId,
      {
        departmentId,
        name: department.name,
      }
    );

    res.json({
      message:
        'Department deleted successfully',
    });
  })
);

/* =========================================================
   DESIGNATIONS - LIST
   ========================================================= */

router.get(
  '/designations',
  auth,
  role(...MANAGEMENT_ROLES),
  asyncHandler(async (_req, res) => {
    const designations =
      await db('designations')
        .leftJoin(
          'employees',
          'employees.designation_id',
          'designations.id'
        )
        .select(
          'designations.id',
          'designations.name',
          'designations.description',
          'designations.is_active',
          'designations.created_at',
          'designations.updated_at'
        )
        .count(
          'employees.id as employee_count'
        )
        .groupBy(
          'designations.id'
        )
        .orderBy(
          'designations.name',
          'asc'
        );

    res.json({
      designations,
    });
  })
);

/* =========================================================
   DESIGNATION - CREATE
   ========================================================= */

router.post(
  '/designations',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      isActive,
    } = req.body;

    if (
      !name ||
      typeof name !== 'string' ||
      !name.trim()
    ) {
      res.status(400).json({
        message:
          'Designation name is required',
      });
      return;
    }

    const trimmedName =
      name.trim();

    const existing =
      await db('designations')
        .whereRaw(
          'LOWER(name) = LOWER(?)',
          [trimmedName]
        )
        .first();

    if (existing) {
      res.status(409).json({
        message:
          'Designation already exists',
      });
      return;
    }

    const [designation] =
      await db('designations')
        .insert({
          name: trimmedName,
          description:
            description?.trim() ||
            null,
          is_active:
            isActive !== undefined
              ? Boolean(isActive)
              : true,
        })
        .returning('*');

    await createAuditLog(
      req.user!.id,
      'CREATE_DESIGNATION',
      'designations',
      designation.id,
      {
        designationId:
          designation.id,
        name: designation.name,
      }
    );

    res.status(201).json({
      message:
        'Designation created successfully',
      designation,
    });
  })
);

/* =========================================================
   DESIGNATION - UPDATE
   ========================================================= */

router.put(
  '/designations/:id',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const designationId =
      Number(req.params.id);

    const {
      name,
      description,
      isActive,
    } = req.body;

    if (
      !Number.isInteger(
        designationId
      )
    ) {
      res.status(400).json({
        message:
          'Invalid designation ID',
      });
      return;
    }

    if (
      !name ||
      typeof name !== 'string' ||
      !name.trim()
    ) {
      res.status(400).json({
        message:
          'Designation name is required',
      });
      return;
    }

    const designation =
      await db('designations')
        .where(
          'id',
          designationId
        )
        .first();

    if (!designation) {
      res.status(404).json({
        message:
          'Designation not found',
      });
      return;
    }

    const duplicate =
      await db('designations')
        .whereRaw(
          'LOWER(name) = LOWER(?)',
          [name.trim()]
        )
        .whereNot(
          'id',
          designationId
        )
        .first();

    if (duplicate) {
      res.status(409).json({
        message:
          'Another designation with this name already exists',
      });
      return;
    }

    const [updated] =
      await db('designations')
        .where(
          'id',
          designationId
        )
        .update({
          name: name.trim(),
          description:
            description?.trim() ||
            null,
          is_active:
            isActive !== undefined
              ? Boolean(isActive)
              : designation.is_active,
          updated_at:
            db.fn.now(),
        })
        .returning('*');

    await createAuditLog(
      req.user!.id,
      'UPDATE_DESIGNATION',
      'designations',
      designationId,
      {
        designationId,
        previousName:
          designation.name,
        newName:
          updated.name,
      }
    );

    res.json({
      message:
        'Designation updated successfully',
      designation: updated,
    });
  })
);

/* =========================================================
   DESIGNATION - DELETE
   ========================================================= */

router.delete(
  '/designations/:id',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const designationId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        designationId
      )
    ) {
      res.status(400).json({
        message:
          'Invalid designation ID',
      });
      return;
    }

    const designation =
      await db('designations')
        .where(
          'id',
          designationId
        )
        .first();

    if (!designation) {
      res.status(404).json({
        message:
          'Designation not found',
      });
      return;
    }

    const assigned =
      await db('employees')
        .where(
          'designation_id',
          designationId
        )
        .count('id as count')
        .first();

    const count = Number(
      assigned?.count || 0
    );

    if (count > 0) {
      res.status(409).json({
        message:
          `Cannot delete designation because ${count} employee(s) are assigned to it`,
      });
      return;
    }

    await db('designations')
      .where(
        'id',
        designationId
      )
      .delete();

    await createAuditLog(
      req.user!.id,
      'DELETE_DESIGNATION',
      'designations',
      designationId,
      {
        designationId,
        name: designation.name,
      }
    );

    res.json({
      message:
        'Designation deleted successfully',
    });
  })
);

/* =========================================================
   ASSIGN DEPARTMENT TO EMPLOYEE
   ========================================================= */

router.patch(
  '/employees/:id/department',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId =
      Number(req.params.id);

    const departmentId =
      toNullableNumber(
        req.body.departmentId
      );

    if (
      !Number.isInteger(employeeId)
    ) {
      res.status(400).json({
        message:
          'Invalid employee ID',
      });
      return;
    }

    const employee =
      await db('employees')
        .where(
          'id',
          employeeId
        )
        .first();

    if (!employee) {
      res.status(404).json({
        message:
          'Employee not found',
      });
      return;
    }

    if (departmentId !== null) {
      const department =
        await db('departments')
          .where(
            'id',
            departmentId
          )
          .first();

      if (!department) {
        res.status(400).json({
          message:
            'Department not found',
        });
        return;
      }
    }

    await db('employees')
      .where(
        'id',
        employeeId
      )
      .update({
        department_id:
          departmentId,
        updated_at:
          db.fn.now(),
      });

    await createAuditLog(
      req.user!.id,
      'ASSIGN_EMPLOYEE_DEPARTMENT',
      'employees',
      employeeId,
      {
        employeeId,
        previousDepartmentId:
          employee.department_id,
        newDepartmentId:
          departmentId,
      }
    );

    res.json({
      message:
        'Employee department updated successfully',
      employeeId,
      departmentId,
    });
  })
);

/* =========================================================
   ASSIGN DESIGNATION TO EMPLOYEE
   ========================================================= */

router.patch(
  '/employees/:id/designation',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const employeeId =
      Number(req.params.id);

    const designationId =
      toNullableNumber(
        req.body.designationId
      );

    if (
      !Number.isInteger(employeeId)
    ) {
      res.status(400).json({
        message:
          'Invalid employee ID',
      });
      return;
    }

    if (designationId === null) {
      res.status(400).json({
        message:
          'Designation ID is required',
      });
      return;
    }

    const employee =
      await db('employees')
        .where(
          'id',
          employeeId
        )
        .first();

    if (!employee) {
      res.status(404).json({
        message:
          'Employee not found',
      });
      return;
    }

    const designation =
      await db('designations')
        .where(
          'id',
          designationId
        )
        .where(
          'is_active',
          true
        )
        .first();

    if (!designation) {
      res.status(400).json({
        message:
          'Designation not found or inactive',
      });
      return;
    }

    await db('employees')
      .where(
        'id',
        employeeId
      )
      .update({
        designation_id:
          designationId,
        designation:
          designation.name,
        updated_at:
          db.fn.now(),
      });

    await createAuditLog(
      req.user!.id,
      'ASSIGN_EMPLOYEE_DESIGNATION',
      'employees',
      employeeId,
      {
        employeeId,
        previousDesignationId:
          employee.designation_id,
        newDesignationId:
          designationId,
        designation:
          designation.name,
      }
    );

    res.json({
      message:
        'Employee designation updated successfully',
      employeeId,
      designationId,
      designation:
        designation.name,
    });
  })
);

/* =========================================================
   BULK DEPARTMENT ASSIGNMENT
   ========================================================= */

router.patch(
  '/employees/bulk-department',
  auth,
  role(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const {
      employeeIds,
      departmentId,
    } = req.body;

    if (
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      res.status(400).json({
        message:
          'employeeIds must be a non-empty array',
      });
      return;
    }

    const normalizedIds =
      employeeIds
        .map(Number)
        .filter(
          (id: number) =>
            Number.isInteger(id)
        );

    if (
      normalizedIds.length !==
      employeeIds.length
    ) {
      res.status(400).json({
        message:
          'All employee IDs must be valid numbers',
      });
      return;
    }

    const newDepartmentId =
      toNullableNumber(
        departmentId
      );

    if (newDepartmentId !== null) {
      const department =
        await db('departments')
          .where(
            'id',
            newDepartmentId
          )
          .first();

      if (!department) {
        res.status(400).json({
          message:
            'Department not found',
        });
        return;
      }
    }

    const employees =
      await db('employees')
        .whereIn(
          'id',
          normalizedIds
        )
        .select(
          'id',
          'department_id'
        );

    if (
      employees.length !==
      normalizedIds.length
    ) {
      res.status(400).json({
        message:
          'One or more employee IDs were not found',
      });
      return;
    }

    await db('employees')
      .whereIn(
        'id',
        normalizedIds
      )
      .update({
        department_id:
          newDepartmentId,
        updated_at:
          db.fn.now(),
      });

    await createAuditLog(
      req.user!.id,
      'BULK_ASSIGN_EMPLOYEE_DEPARTMENT',
      'employees',
      null,
      {
        employeeIds:
          normalizedIds,
        departmentId:
          newDepartmentId,
        previousAssignments:
          employees,
      }
    );

    res.json({
      message:
        'Department assigned to employees successfully',
      employeeIds:
        normalizedIds,
      departmentId:
        newDepartmentId,
    });
  })
);

/* =========================================================
   EMPLOYEE DOCUMENTS - LIST
   ========================================================= */

router.get(
  '/employees/:id/documents',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  asyncHandler(async (req, res) => {
    const employeeId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        employeeId
      )
    ) {
      res.status(400).json({
        message:
          'Invalid employee ID',
      });
      return;
    }

    const employee =
      await db('employees')
        .where(
          'id',
          employeeId
        )
        .first();

    if (!employee) {
      res.status(404).json({
        message:
          'Employee not found',
      });
      return;
    }

    const currentUser =
      req.user!;

    if (
      currentUser.role ===
      'EMPLOYEE'
    ) {
      if (
        currentUser.employeeId !==
        employeeId
      ) {
        res.status(403).json({
          message:
            'You can only view your own documents',
        });
        return;
      }
    }

    if (
      currentUser.role ===
      'MANAGER'
    ) {
      if (
        employee.manager_id !==
        currentUser.employeeId
      ) {
        res.status(403).json({
          message:
            'You can only view documents for your team',
        });
        return;
      }
    }

    const documents =
      await db('employee_documents')
        .leftJoin(
          'users as uploader',
          'uploader.id',
          'employee_documents.uploaded_by'
        )
        .select(
          'employee_documents.*',
          db.raw(
            `CONCAT(uploader.first_name, ' ', uploader.last_name) AS uploaded_by_name`
          )
        )
        .where(
          'employee_documents.employee_id',
          employeeId
        )
        .orderBy(
          'employee_documents.upload_date',
          'desc'
        );

    res.json({
      employeeId,
      documents,
    });
  })
);

/* =========================================================
   EMPLOYEE DOCUMENT - CREATE
   ========================================================= */

router.post(
  '/employees/:id/documents',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  asyncHandler(async (req, res) => {
    const employeeId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        employeeId
      )
    ) {
      res.status(400).json({
        message:
          'Invalid employee ID',
      });
      return;
    }

    const employee =
      await db('employees')
        .where(
          'id',
          employeeId
        )
        .first();

    if (!employee) {
      res.status(404).json({
        message:
          'Employee not found',
      });
      return;
    }

    const currentUser =
      req.user!;

    if (
      currentUser.role ===
      'EMPLOYEE'
    ) {
      if (
        currentUser.employeeId !==
        employeeId
      ) {
        res.status(403).json({
          message:
            'You can only add documents to your own profile',
        });
        return;
      }
    }

    if (
      currentUser.role ===
      'MANAGER'
    ) {
      if (
        employee.manager_id !==
        currentUser.employeeId
      ) {
        res.status(403).json({
          message:
            'You can only add documents for your team',
        });
        return;
      }
    }

    const {
      documentName,
      documentType,
      fileUrl,
      status,
      description,
    } = req.body;

    if (
      !documentName ||
      typeof documentName !==
        'string' ||
      !documentName.trim()
    ) {
      res.status(400).json({
        message:
          'Document name is required',
      });
      return;
    }

    if (
      !isValidDocumentType(
        documentType
      )
    ) {
      res.status(400).json({
        message:
          `Invalid document type. Allowed values: ${DOCUMENT_TYPES.join(
            ', '
          )}`,
      });
      return;
    }

    if (
      fileUrl !== undefined &&
      fileUrl !== null &&
      fileUrl !== '' &&
      typeof fileUrl !==
        'string'
    ) {
      res.status(400).json({
        message:
          'fileUrl must be a string',
      });
      return;
    }

    if (
      status !== undefined &&
      !isValidDocumentStatus(
        status
      )
    ) {
      res.status(400).json({
        message:
          `Invalid document status. Allowed values: ${DOCUMENT_STATUSES.join(
            ', '
          )}`,
      });
      return;
    }

    const [document] =
      await db('employee_documents')
        .insert({
          employee_id:
            employeeId,
          document_name:
            documentName.trim(),
          document_type:
            documentType,
          uploaded_by:
            currentUser.id,
          file_url:
            fileUrl || null,
          status:
            status || 'PENDING',
          description:
            description?.trim() ||
            null,
        })
        .returning('*');

    await createAuditLog(
      currentUser.id,
      'CREATE_EMPLOYEE_DOCUMENT',
      'employee_documents',
      document.id,
      {
        employeeId,
        documentName:
          document.document_name,
        documentType:
          document.document_type,
      }
    );

    res.status(201).json({
      message:
        'Employee document added successfully',
      document,
    });
  })
);

/* =========================================================
   EMPLOYEE DOCUMENT - UPDATE
   ========================================================= */

router.put(
  '/employees/:employeeId/documents/:documentId',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  asyncHandler(async (req, res) => {
    const employeeId =
      Number(req.params.employeeId);

    const documentId =
      Number(req.params.documentId);

    if (
      !Number.isInteger(
        employeeId
      ) ||
      !Number.isInteger(
        documentId
      )
    ) {
      res.status(400).json({
        message:
          'Invalid employee or document ID',
      });
      return;
    }

    const document =
      await db('employee_documents')
        .where(
          'id',
          documentId
        )
        .where(
          'employee_id',
          employeeId
        )
        .first();

    if (!document) {
      res.status(404).json({
        message:
          'Employee document not found',
      });
      return;
    }

    const employee =
      await db('employees')
        .where(
          'id',
          employeeId
        )
        .first();

    if (!employee) {
      res.status(404).json({
        message:
          'Employee not found',
      });
      return;
    }

    const currentUser =
      req.user!;

    if (
      currentUser.role ===
      'EMPLOYEE'
    ) {
      if (
        currentUser.employeeId !==
        employeeId
      ) {
        res.status(403).json({
          message:
            'You can only update your own documents',
        });
        return;
      }
    }

    if (
      currentUser.role ===
      'MANAGER'
    ) {
      if (
        employee.manager_id !==
        currentUser.employeeId
      ) {
        res.status(403).json({
          message:
            'You can only update documents for your team',
        });
        return;
      }
    }

    const {
      documentName,
      documentType,
      fileUrl,
      status,
      description,
    } = req.body;

    if (
      documentName !== undefined &&
      (
        typeof documentName !==
          'string' ||
        !documentName.trim()
      )
    ) {
      res.status(400).json({
        message:
          'Document name must be a non-empty string',
      });
      return;
    }

    if (
      documentType !== undefined &&
      !isValidDocumentType(
        documentType
      )
    ) {
      res.status(400).json({
        message:
          `Invalid document type. Allowed values: ${DOCUMENT_TYPES.join(
            ', '
          )}`,
      });
      return;
    }

    if (
      status !== undefined &&
      !isValidDocumentStatus(
        status
      )
    ) {
      res.status(400).json({
        message:
          `Invalid document status. Allowed values: ${DOCUMENT_STATUSES.join(
            ', '
          )}`,
      });
      return;
    }

    const updateData: Record<
      string,
      unknown
    > = {
      updated_at:
        db.fn.now(),
    };

    if (
      documentName !== undefined
    ) {
      updateData.document_name =
        documentName.trim();
    }

    if (
      documentType !== undefined
    ) {
      updateData.document_type =
        documentType;
    }

    if (
      fileUrl !== undefined
    ) {
      updateData.file_url =
        fileUrl || null;
    }

    if (
      status !== undefined
    ) {
      updateData.status =
        status;
    }

    if (
      description !== undefined
    ) {
      updateData.description =
        description?.trim() ||
        null;
    }

    const [updated] =
      await db(
        'employee_documents'
      )
        .where(
          'id',
          documentId
        )
        .update(updateData)
        .returning('*');

    await createAuditLog(
      currentUser.id,
      'UPDATE_EMPLOYEE_DOCUMENT',
      'employee_documents',
      documentId,
      {
        employeeId,
        documentId,
      }
    );

    res.json({
      message:
        'Employee document updated successfully',
      document: updated,
    });
  })
);

/* =========================================================
   EMPLOYEE DOCUMENT - DELETE
   ========================================================= */

router.delete(
  '/employees/:employeeId/documents/:documentId',
  auth,
  role(
    'SUPER_ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  asyncHandler(async (req, res) => {
    const employeeId =
      Number(req.params.employeeId);

    const documentId =
      Number(req.params.documentId);

    if (
      !Number.isInteger(
        employeeId
      ) ||
      !Number.isInteger(
        documentId
      )
    ) {
      res.status(400).json({
        message:
          'Invalid employee or document ID',
      });
      return;
    }

    const document =
      await db('employee_documents')
        .where(
          'id',
          documentId
        )
        .where(
          'employee_id',
          employeeId
        )
        .first();

    if (!document) {
      res.status(404).json({
        message:
          'Employee document not found',
      });
      return;
    }

    const employee =
      await db('employees')
        .where(
          'id',
          employeeId
        )
        .first();

    if (!employee) {
      res.status(404).json({
        message:
          'Employee not found',
      });
      return;
    }

    const currentUser =
      req.user!;

    if (
      currentUser.role ===
      'EMPLOYEE'
    ) {
      if (
        currentUser.employeeId !==
        employeeId
      ) {
        res.status(403).json({
          message:
            'You can only delete your own documents',
        });
        return;
      }
    }

    if (
      currentUser.role ===
      'MANAGER'
    ) {
      if (
        employee.manager_id !==
        currentUser.employeeId
      ) {
        res.status(403).json({
          message:
            'You can only delete documents for your team',
        });
        return;
      }
    }

    await db(
      'employee_documents'
    )
      .where(
        'id',
        documentId
      )
      .delete();

    await createAuditLog(
      currentUser.id,
      'DELETE_EMPLOYEE_DOCUMENT',
      'employee_documents',
      documentId,
      {
        employeeId,
        documentName:
          document.document_name,
        documentType:
          document.document_type,
      }
    );

    res.json({
      message:
        'Employee document deleted successfully',
      employeeId,
      documentId,
    });
  })
);

export default router;