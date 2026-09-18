import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  /*
   * ============================================================
   * SHIFTS
   * ============================================================
   */

  if (!(await knex.schema.hasTable('attendance_shifts'))) {
    await knex.schema.createTable('attendance_shifts', (table) => {
      table.bigIncrements('id').primary();

      table
        .string('name', 120)
        .notNullable();

      table
        .time('start_time')
        .notNullable();

      table
        .time('end_time')
        .notNullable();

      table
        .integer('expected_work_minutes')
        .notNullable()
        .defaultTo(480);

      table
        .integer('grace_minutes')
        .notNullable()
        .defaultTo(15);

      table
        .integer('break_minutes')
        .notNullable()
        .defaultTo(60);

      table
        .boolean('is_overnight')
        .notNullable()
        .defaultTo(false);

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

      table.index(['is_active']);
    });
  }

  /*
   * ============================================================
   * EMPLOYEE SHIFT ASSIGNMENTS
   * ============================================================
   */

  if (!(await knex.schema.hasTable('employee_shift_assignments'))) {
    await knex.schema.createTable(
      'employee_shift_assignments',
      (table) => {
        table.bigIncrements('id').primary();

        table
          .bigInteger('employee_id')
          .notNullable()
          .references('id')
          .inTable('employees')
          .onDelete('CASCADE');

        table
          .bigInteger('shift_id')
          .notNullable()
          .references('id')
          .inTable('attendance_shifts')
          .onDelete('CASCADE');

        table
          .date('effective_from')
          .notNullable();

        table
          .date('effective_to')
          .nullable();

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

        table.index(['employee_id']);
        table.index(['shift_id']);
        table.index(['effective_from']);
        table.index(['effective_to']);
      }
    );
  }

  /*
   * ============================================================
   * ATTENDANCE BREAKS
   * ============================================================
   */

  if (!(await knex.schema.hasTable('attendance_breaks'))) {
    await knex.schema.createTable('attendance_breaks', (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('attendance_id')
        .notNullable()
        .references('id')
        .inTable('attendance')
        .onDelete('CASCADE');

      table
        .timestamp('break_start', { useTz: true })
        .notNullable();

      table
        .timestamp('break_end', { useTz: true })
        .nullable();

      table
        .integer('duration_minutes')
        .notNullable()
        .defaultTo(0);

      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('updated_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table.index(['attendance_id']);
    });
  }

  /*
   * ============================================================
   * ATTENDANCE CORRECTION REQUESTS
   * ============================================================
   */

  if (!(await knex.schema.hasTable('attendance_corrections'))) {
    await knex.schema.createTable(
      'attendance_corrections',
      (table) => {
        table.bigIncrements('id').primary();

        table
          .bigInteger('attendance_id')
          .nullable()
          .references('id')
          .inTable('attendance')
          .onDelete('SET NULL');

        table
          .bigInteger('employee_id')
          .notNullable()
          .references('id')
          .inTable('employees')
          .onDelete('CASCADE');

        table
          .date('attendance_date')
          .notNullable();

        table
          .timestamp('requested_check_in', { useTz: true })
          .nullable();

        table
          .timestamp('requested_check_out', { useTz: true })
          .nullable();

        table
          .text('reason')
          .notNullable();

        table
          .string('status', 30)
          .notNullable()
          .defaultTo('PENDING');

        table
          .bigInteger('reviewed_by')
          .nullable();

        table
          .timestamp('reviewed_at', { useTz: true })
          .nullable();

        table
          .text('review_comment')
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
        table.index(['attendance_date']);
        table.index(['status']);
      }
    );
  }

  /*
   * ============================================================
   * OVERTIME
   * ============================================================
   */

  if (!(await knex.schema.hasTable('attendance_overtime'))) {
    await knex.schema.createTable('attendance_overtime', (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('employee_id')
        .notNullable()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE');

      table
        .bigInteger('attendance_id')
        .nullable()
        .references('id')
        .inTable('attendance')
        .onDelete('SET NULL');

      table
        .date('overtime_date')
        .notNullable();

      table
        .integer('minutes')
        .notNullable()
        .defaultTo(0);

      table
        .text('reason')
        .nullable();

      table
        .string('status', 30)
        .notNullable()
        .defaultTo('PENDING');

      table
        .bigInteger('approved_by')
        .nullable();

      table
        .timestamp('approved_at', { useTz: true })
        .nullable();

      table
        .text('review_comment')
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
      table.index(['overtime_date']);
      table.index(['status']);
    });
  }

  /*
   * ============================================================
   * COMPANY HOLIDAYS
   * ============================================================
   */

  if (!(await knex.schema.hasTable('attendance_holidays'))) {
    await knex.schema.createTable('attendance_holidays', (table) => {
      table.bigIncrements('id').primary();

      table
        .date('holiday_date')
        .notNullable()
        .unique();

      table
        .string('name', 150)
        .notNullable();

      table
        .text('description')
        .nullable();

      table
        .boolean('is_optional')
        .notNullable()
        .defaultTo(false);

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

      table.index(['holiday_date']);
    });
  }

  /*
   * ============================================================
   * ATTENDANCE SETTINGS
   * ============================================================
   */

  if (!(await knex.schema.hasTable('attendance_settings'))) {
    await knex.schema.createTable('attendance_settings', (table) => {
      table.bigIncrements('id').primary();

      table
        .string('setting_key', 120)
        .notNullable()
        .unique();

      table
        .text('setting_value')
        .notNullable();

      table
        .string('description', 255)
        .nullable();

      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('updated_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
    });

    /*
     * Default Attendance Settings
     */

    await knex('attendance_settings').insert([
      {
        setting_key: 'timezone',
        setting_value: 'Asia/Kolkata',
        description: 'Timezone used for attendance calculations',
      },
      {
        setting_key: 'default_work_minutes',
        setting_value: '480',
        description: 'Default expected working minutes per day',
      },
      {
        setting_key: 'default_grace_minutes',
        setting_value: '15',
        description: 'Default late-arrival grace period',
      },
      {
        setting_key: 'half_day_minutes',
        setting_value: '240',
        description: 'Minimum minutes used for half-day calculation',
      },
      {
        setting_key: 'overtime_after_minutes',
        setting_value: '480',
        description: 'Working minutes after which overtime can be calculated',
      },
      {
        setting_key: 'weekly_off_saturday',
        setting_value: 'true',
        description: 'Whether Saturday is a weekly off',
      },
      {
        setting_key: 'weekly_off_sunday',
        setting_value: 'true',
        description: 'Whether Sunday is a weekly off',
      },
    ]);
  }

  /*
   * ============================================================
   * ADD USEFUL COLUMNS TO EXISTING ATTENDANCE TABLE
   * ============================================================
   */

  if (await knex.schema.hasTable('attendance')) {
    const hasLateMinutes = await knex.schema.hasColumn(
      'attendance',
      'late_minutes'
    );

    const hasEarlyCheckoutMinutes =
      await knex.schema.hasColumn(
        'attendance',
        'early_checkout_minutes'
      );

    const hasOvertimeMinutes =
      await knex.schema.hasColumn(
        'attendance',
        'overtime_minutes'
      );

    const hasLocation = await knex.schema.hasColumn(
      'attendance',
      'location'
    );

    const hasNotes = await knex.schema.hasColumn(
      'attendance',
      'notes'
    );

    const hasShiftId = await knex.schema.hasColumn(
      'attendance',
      'shift_id'
    );

    const hasBreakMinutes = await knex.schema.hasColumn(
      'attendance',
      'break_minutes'
    );

    await knex.schema.alterTable('attendance', (table) => {
      if (!hasLateMinutes) {
        table
          .integer('late_minutes')
          .notNullable()
          .defaultTo(0);
      }

      if (!hasEarlyCheckoutMinutes) {
        table
          .integer('early_checkout_minutes')
          .notNullable()
          .defaultTo(0);
      }

      if (!hasOvertimeMinutes) {
        table
          .integer('overtime_minutes')
          .notNullable()
          .defaultTo(0);
      }

      if (!hasLocation) {
        table
          .string('location', 255)
          .nullable();
      }

      if (!hasNotes) {
        table
          .text('notes')
          .nullable();
      }

      if (!hasShiftId) {
        table
          .bigInteger('shift_id')
          .nullable()
          .references('id')
          .inTable('attendance_shifts')
          .onDelete('SET NULL');
      }

      if (!hasBreakMinutes) {
        table
          .integer('break_minutes')
          .notNullable()
          .defaultTo(0);
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  /*
   * Remove attendance columns first because shift_id
   * references attendance_shifts.
   */

  if (await knex.schema.hasTable('attendance')) {
    const columnsToRemove: string[] = [];

    const possibleColumns = [
      'late_minutes',
      'early_checkout_minutes',
      'overtime_minutes',
      'location',
      'notes',
      'shift_id',
    ];

    for (const column of possibleColumns) {
      if (await knex.schema.hasColumn('attendance', column)) {
        columnsToRemove.push(column);
      }
    }

    if (columnsToRemove.length > 0) {
      await knex.schema.alterTable('attendance', (table) => {
        for (const column of columnsToRemove) {
          table.dropColumn(column);
        }
      });
    }
  }

  await knex.schema.dropTableIfExists('attendance_settings');
  await knex.schema.dropTableIfExists('attendance_holidays');
  await knex.schema.dropTableIfExists('attendance_overtime');
  await knex.schema.dropTableIfExists('attendance_corrections');
  await knex.schema.dropTableIfExists('attendance_breaks');
  await knex.schema.dropTableIfExists('employee_shift_assignments');
  await knex.schema.dropTableIfExists('attendance_shifts');
}