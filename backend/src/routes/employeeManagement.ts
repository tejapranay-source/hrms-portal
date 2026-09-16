import { Router, Request, Response, NextFunction } from 'express';
import type { Knex } from 'knex';
import { db } from '../db';
import { auth, role } from '../middleware/auth';

const router = Router();

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'] as const;
const MANAGEMENT_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'] as const;

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

type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

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

function isValidStatus(value: unknown): value is EmployeeStatus {
  return (
    typeof value === 'string' &&
    EMPLOYEE_STATUSES.includes(value as EmployeeStatus)
  );
}

function isValidPhone(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }

  return /^\+?[0-9\s()-]{7,20}$/.test(value);
}

function toNullableNumber(value: unknown): number | null {
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
        ).orWhereILike(
          'employees.designation',
          '%manager%'
        ).orWhereILike(
          'employees.designation',
          '%team lead%'
        );
      })
      .orderBy('users.first_name', 'asc');

    res.json({
      departments,
      designations,
      managers,
      statuses: EMPLOYEE_STATUSES,
      employmentTypes: EMPLOYMENT_TYPES,
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

    if (phone && !isValidPhone(phone)) {
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
        message: `Invalid employee status. Allowed values: ${EMPLOYEE_STATUSES.join(', ')}`,
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
        message: `Invalid employment type. Allowed values: ${EMPLOYMENT_TYPES.join(', ')}`,
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
      const department = await db('departments')
        .where('id', newDepartmentId)
        .first();

      if (!department) {
        res.status(400).json({
          message: 'Department not found',
        });
        return;
      }
    }

    let designationName: string | null =
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
        .where('employees.id', newManagerId)
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
              is_active: shouldBeActive,
              updated_at: trx.fn.now(),
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

    res.json({
      message: 'Employee updated successfully',
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
    const employeeId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(employeeId)) {
      res.status(400).json({
        message: 'Invalid employee ID',
      });
      return;
    }

    if (!isValidStatus(status)) {
      res.status(400).json({
        message: `Invalid status. Allowed values: ${EMPLOYEE_STATUSES.join(', ')}`,
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
            updated_at: trx.fn.now(),
          });

        await trx('users')
          .where('id', employee.user_id)
          .update({
            is_active: isActive,
            updated_at: trx.fn.now(),
          });
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
      !Number.isInteger(departmentId)
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
        .where('id', departmentId)
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
        .where('id', departmentId)
        .update({
          name: name.trim(),
          description:
            description?.trim() ||
            null,
          updated_at: db.fn.now(),
        })
        .returning('*');

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
      !Number.isInteger(departmentId)
    ) {
      res.status(400).json({
        message:
          'Invalid department ID',
      });
      return;
    }

    const department =
      await db('departments')
        .where('id', departmentId)
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
          .where('id', departmentId)
          .delete();
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
        .select('id');

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

export default router;