import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  /*
   * =========================================================
   * 1. EXTEND EXISTING LEAVE TYPES
   * =========================================================
   */

  const leaveTypeColumns = [
    {
      name: 'carry_forward',
      add: (table: Knex.CreateTableBuilder) =>
        table.boolean('carry_forward').notNullable().defaultTo(false),
    },
    {
      name: 'max_carry_forward',
      add: (table: Knex.CreateTableBuilder) =>
        table.decimal('max_carry_forward', 8, 2).nullable(),
    },
    {
      name: 'encashment_allowed',
      add: (table: Knex.CreateTableBuilder) =>
        table.boolean('encashment_allowed').notNullable().defaultTo(false),
    },
    {
      name: 'half_day_allowed',
      add: (table: Knex.CreateTableBuilder) =>
        table.boolean('half_day_allowed').notNullable().defaultTo(false),
    },
    {
      name: 'documentation_required',
      add: (table: Knex.CreateTableBuilder) =>
        table.boolean('documentation_required').notNullable().defaultTo(false),
    },
    {
      name: 'min_days',
      add: (table: Knex.CreateTableBuilder) =>
        table.decimal('min_days', 8, 2).notNullable().defaultTo(1),
    },
    {
      name: 'max_days',
      add: (table: Knex.CreateTableBuilder) =>
        table.decimal('max_days', 8, 2).nullable(),
    },
    {
      name: 'applicable_employee_groups',
      add: (table: Knex.CreateTableBuilder) =>
        table.jsonb('applicable_employee_groups').notNullable().defaultTo('[]'),
    },
    {
      name: 'is_active',
      add: (table: Knex.CreateTableBuilder) =>
        table.boolean('is_active').notNullable().defaultTo(true),
    },
  ];

  for (const column of leaveTypeColumns) {
    const exists = await knex.schema.hasColumn(
      'leave_types',
      column.name
    );

    if (!exists) {
      await knex.schema.alterTable('leave_types', (table) => {
        column.add(table);
      });
    }
  }

  /*
   * =========================================================
   * 2. LEAVE POLICIES
   * =========================================================
   */

  if (!(await knex.schema.hasTable('leave_policies'))) {
    await knex.schema.createTable('leave_policies', (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('leave_type_id')
        .notNullable()
        .references('id')
        .inTable('leave_types')
        .onDelete('CASCADE');

      table.string('policy_name', 150).notNullable();

      table
        .string('accrual_frequency', 30)
        .notNullable()
        .defaultTo('YEARLY');

      table
        .decimal('allocation', 8, 2)
        .notNullable()
        .defaultTo(0);

      table
        .boolean('probation_eligible')
        .notNullable()
        .defaultTo(true);

      table
        .decimal('minimum_days', 8, 2)
        .notNullable()
        .defaultTo(1);

      table
        .decimal('maximum_days', 8, 2)
        .nullable();

      table
        .integer('max_consecutive_days')
        .nullable();

      table
        .integer('advance_notice_days')
        .notNullable()
        .defaultTo(0);

      table
        .boolean('allow_negative_balance')
        .notNullable()
        .defaultTo(false);

      table
        .boolean('include_weekends')
        .notNullable()
        .defaultTo(false);

      table
        .boolean('include_holidays')
        .notNullable()
        .defaultTo(false);

      table
        .boolean('sandwich_rule')
        .notNullable()
        .defaultTo(false);

      table
        .boolean('carry_forward')
        .notNullable()
        .defaultTo(false);

      table
        .integer('carry_forward_expiry_months')
        .nullable();

      table
        .boolean('approval_required')
        .notNullable()
        .defaultTo(true);

      table
        .integer('approval_levels')
        .notNullable()
        .defaultTo(1);

      table
        .boolean('is_active')
        .notNullable()
        .defaultTo(true);

      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('updated_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table.index(['leave_type_id']);
      table.index(['is_active']);
    });
  }

  /*
   * =========================================================
   * 3. HOLIDAY CALENDAR
   * =========================================================
   */

  if (!(await knex.schema.hasTable('leave_holidays'))) {
    await knex.schema.createTable('leave_holidays', (table) => {
      table.bigIncrements('id').primary();

      table.string('name', 150).notNullable();

      table.date('holiday_date').notNullable();

      table
        .string('holiday_type', 30)
        .notNullable()
        .defaultTo('COMPANY');

      table.string('location', 150).nullable();

      table
        .boolean('is_optional')
        .notNullable()
        .defaultTo(false);

      table
        .boolean('is_active')
        .notNullable()
        .defaultTo(true);

      table.text('description').nullable();

      table
        .bigInteger('created_by')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');

      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('updated_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table.index(['holiday_date']);
      table.index(['holiday_type']);
      table.index(['location']);
    });
  }

  /*
   * =========================================================
   * 4. LEAVE ADJUSTMENTS
   * =========================================================
   */

  if (!(await knex.schema.hasTable('leave_adjustments'))) {
    await knex.schema.createTable('leave_adjustments', (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('employee_id')
        .notNullable()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE');

      table
        .bigInteger('leave_type_id')
        .notNullable()
        .references('id')
        .inTable('leave_types')
        .onDelete('CASCADE');

      table
        .decimal('amount', 8, 2)
        .notNullable();

      table
        .string('adjustment_type', 40)
        .notNullable();

      table.text('reason').notNullable();

      table
        .bigInteger('created_by')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT');

      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table.index(['employee_id']);
      table.index(['leave_type_id']);
      table.index(['created_at']);
    });
  }

  /*
   * =========================================================
   * 5. APPROVAL WORKFLOW
   * =========================================================
   */

  if (!(await knex.schema.hasTable('leave_approval_steps'))) {
    await knex.schema.createTable('leave_approval_steps', (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('leave_request_id')
        .notNullable()
        .references('id')
        .inTable('leave_requests')
        .onDelete('CASCADE');

      table
        .integer('level')
        .notNullable();

      table
        .string('approver_type', 30)
        .notNullable();

      table
        .bigInteger('approver_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');

      table
        .string('status', 30)
        .notNullable()
        .defaultTo('PENDING');

      table.text('comments').nullable();

      table
        .timestamp('acted_at', { useTz: true })
        .nullable();

      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table.index(['leave_request_id']);
      table.index(['approver_user_id']);
      table.index(['status']);
    });
  }

  /*
   * =========================================================
   * 6. APPROVAL HISTORY
   * =========================================================
   */

  if (!(await knex.schema.hasTable('leave_approval_history'))) {
    await knex.schema.createTable('leave_approval_history', (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('leave_request_id')
        .notNullable()
        .references('id')
        .inTable('leave_requests')
        .onDelete('CASCADE');

      table
        .string('previous_status', 30)
        .nullable();

      table
        .string('new_status', 30)
        .notNullable();

      table
        .bigInteger('acted_by')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');

      table.text('comments').nullable();

      table.text('rejection_reason').nullable();

      table
        .timestamp('acted_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table.index(['leave_request_id']);
      table.index(['acted_by']);
      table.index(['acted_at']);
    });
  }

  /*
   * =========================================================
   * 7. LEAVE NOTIFICATIONS
   * =========================================================
   */

  if (!(await knex.schema.hasTable('leave_notifications'))) {
    await knex.schema.createTable('leave_notifications', (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table
        .bigInteger('leave_request_id')
        .nullable()
        .references('id')
        .inTable('leave_requests')
        .onDelete('CASCADE');

      table
        .string('type', 50)
        .notNullable();

      table
        .string('title', 200)
        .notNullable();

      table.text('message').notNullable();

      table
        .boolean('is_read')
        .notNullable()
        .defaultTo(false);

      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table.index(['user_id']);
      table.index(['is_read']);
      table.index(['created_at']);
    });
  }

  /*
   * =========================================================
   * 8. COMP-OFF MANAGEMENT
   * =========================================================
   */

  if (!(await knex.schema.hasTable('leave_comp_offs'))) {
    await knex.schema.createTable('leave_comp_offs', (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('employee_id')
        .notNullable()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE');

      table
        .date('earned_date')
        .notNullable();

      table
        .decimal('days', 8, 2)
        .notNullable()
        .defaultTo(1);

      table
        .date('expiry_date')
        .nullable();

      table
        .decimal('used_days', 8, 2)
        .notNullable()
        .defaultTo(0);

      table
        .string('status', 30)
        .notNullable()
        .defaultTo('PENDING');

      table.text('reason').nullable();

      table
        .bigInteger('requested_by')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');

      table
        .bigInteger('approved_by')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');

      table
        .timestamp('approved_at', { useTz: true })
        .nullable();

      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('updated_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table.index(['employee_id']);
      table.index(['earned_date']);
      table.index(['expiry_date']);
      table.index(['status']);
    });
  }

  /*
   * =========================================================
   * 9. LEAVE ENCASHMENT
   * =========================================================
   */

  if (!(await knex.schema.hasTable('leave_encashments'))) {
    await knex.schema.createTable('leave_encashments', (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('employee_id')
        .notNullable()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE');

      table
        .bigInteger('leave_type_id')
        .notNullable()
        .references('id')
        .inTable('leave_types')
        .onDelete('CASCADE');

      table
        .decimal('requested_days', 8, 2)
        .notNullable();

      table
        .decimal('balance_before', 8, 2)
        .notNullable();

      table
        .decimal('amount', 12, 2)
        .nullable();

      table
        .string('status', 30)
        .notNullable()
        .defaultTo('PENDING');

      table.text('reason').nullable();

      table
        .bigInteger('requested_by')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');

      table
        .bigInteger('approved_by')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');

      table
        .timestamp('approved_at', { useTz: true })
        .nullable();

      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('updated_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table.index(['employee_id']);
      table.index(['leave_type_id']);
      table.index(['status']);
    });
  }

  /*
   * =========================================================
   * 10. EXTEND LEAVE REQUESTS
   * =========================================================
   */

  const requestColumns = [
    {
      name: 'approval_comments',
      add: (table: Knex.CreateTableBuilder) =>
        table.text('approval_comments').nullable(),
    },
    {
      name: 'rejection_reason',
      add: (table: Knex.CreateTableBuilder) =>
        table.text('rejection_reason').nullable(),
    },
    {
      name: 'cancellation_reason',
      add: (table: Knex.CreateTableBuilder) =>
        table.text('cancellation_reason').nullable(),
    },
    {
      name: 'cancelled_at',
      add: (table: Knex.CreateTableBuilder) =>
        table.timestamp('cancelled_at', { useTz: true }).nullable(),
    },
    {
      name: 'current_approval_level',
      add: (table: Knex.CreateTableBuilder) =>
        table.integer('current_approval_level').notNullable().defaultTo(1),
    },
    {
      name: 'is_half_day',
      add: (table: Knex.CreateTableBuilder) =>
        table.boolean('is_half_day').notNullable().defaultTo(false),
    },
    {
      name: 'half_day_period',
      add: (table: Knex.CreateTableBuilder) =>
        table.string('half_day_period', 20).nullable(),
    },
    {
      name: 'document_url',
      add: (table: Knex.CreateTableBuilder) =>
        table.text('document_url').nullable(),
    },
  ];

  for (const column of requestColumns) {
    const exists = await knex.schema.hasColumn(
      'leave_requests',
      column.name
    );

    if (!exists) {
      await knex.schema.alterTable('leave_requests', (table) => {
        column.add(table);
      });
    }
  }

  /*
   * =========================================================
   * 11. INDEXES FOR EXISTING LEAVE REQUESTS
   * =========================================================
   */

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_leave_requests_status
    ON leave_requests(status)
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
    ON leave_requests(start_date, end_date)
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_leave_requests_employee
    ON leave_requests(employee_id)
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type
    ON leave_requests(leave_type_id)
  `);

  /*
   * =========================================================
   * 12. DEFAULT POLICIES
   * =========================================================
   */

  const leaveTypes = await knex('leave_types')
    .select('id', 'name', 'annual_days');

  for (const leaveType of leaveTypes) {
    const existingPolicy = await knex('leave_policies')
      .where('leave_type_id', leaveType.id)
      .first();

    if (!existingPolicy) {
      await knex('leave_policies').insert({
        leave_type_id: leaveType.id,
        policy_name: `${leaveType.name} Policy`,
        accrual_frequency: 'YEARLY',
        allocation: leaveType.annual_days,
        probation_eligible: true,
        minimum_days: 1,
        maximum_days: leaveType.annual_days,
        max_consecutive_days: null,
        advance_notice_days: 0,
        allow_negative_balance: false,
        include_weekends: false,
        include_holidays: false,
        sandwich_rule: false,
        carry_forward: false,
        carry_forward_expiry_months: null,
        approval_required: true,
        approval_levels: 1,
        is_active: true,
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  /*
   * Drop only objects created by this migration.
   */

  if (await knex.schema.hasTable('leave_encashments')) {
    await knex.schema.dropTableIfExists('leave_encashments');
  }

  if (await knex.schema.hasTable('leave_comp_offs')) {
    await knex.schema.dropTableIfExists('leave_comp_offs');
  }

  if (await knex.schema.hasTable('leave_notifications')) {
    await knex.schema.dropTableIfExists('leave_notifications');
  }

  if (await knex.schema.hasTable('leave_approval_history')) {
    await knex.schema.dropTableIfExists('leave_approval_history');
  }

  if (await knex.schema.hasTable('leave_approval_steps')) {
    await knex.schema.dropTableIfExists('leave_approval_steps');
  }

  if (await knex.schema.hasTable('leave_adjustments')) {
    await knex.schema.dropTableIfExists('leave_adjustments');
  }

  if (await knex.schema.hasTable('leave_holidays')) {
    await knex.schema.dropTableIfExists('leave_holidays');
  }

  if (await knex.schema.hasTable('leave_policies')) {
    await knex.schema.dropTableIfExists('leave_policies');
  }

  /*
   * Remove only the columns added by this migration.
   */

  const requestColumns = [
    'approval_comments',
    'rejection_reason',
    'cancellation_reason',
    'cancelled_at',
    'current_approval_level',
    'is_half_day',
    'half_day_period',
    'document_url',
  ];

  for (const column of requestColumns) {
    if (await knex.schema.hasColumn('leave_requests', column)) {
      await knex.schema.alterTable('leave_requests', (table) => {
        table.dropColumn(column);
      });
    }
  }

  const leaveTypeColumns = [
    'carry_forward',
    'max_carry_forward',
    'encashment_allowed',
    'half_day_allowed',
    'documentation_required',
    'min_days',
    'max_days',
    'applicable_employee_groups',
    'is_active',
  ];

  for (const column of leaveTypeColumns) {
    if (await knex.schema.hasColumn('leave_types', column)) {
      await knex.schema.alterTable('leave_types', (table) => {
        table.dropColumn(column);
      });
    }
  }
}