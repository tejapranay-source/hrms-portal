import type { Knex } from 'knex';

/**
 * Attendance Module Extensions
 *
 * This migration is intentionally additive.
 *
 * Migration 006 remains the baseline and is NOT modified.
 *
 * This migration adds only the fields/tables required to complete
 * the Attendance module:
 *
 * - Attendance work location
 * - Shift half-day threshold
 * - Correction request metadata
 * - Overtime request metadata
 * - Holiday creator metadata
 * - Attendance settings updater metadata
 * - Attendance audit log
 * - Additional company attendance settings
 *
 * Nothing from Employees, Payroll, Leave, Recruitment,
 * Performance, Auth, or other modules is changed.
 */

export async function up(knex: Knex): Promise<void> {
  /*
   * ============================================================
   * ATTENDANCE
   * ============================================================
   *
   * Migration 006 already provides:
   * - late_minutes
   * - early_checkout_minutes
   * - overtime_minutes
   * - location
   * - notes
   * - shift_id
   * - break_minutes
   *
   * We retain all of those columns.
   *
   * work_location is added separately so the Attendance module
   * can explicitly store OFFICE / REMOTE / FIELD style values
   * without changing the existing location column.
   */

  if (await knex.schema.hasTable('attendance')) {
    const hasWorkLocation = await knex.schema.hasColumn(
      'attendance',
      'work_location'
    );

    if (!hasWorkLocation) {
      await knex.schema.alterTable('attendance', (table) => {
        table
          .string('work_location', 120)
          .nullable();
      });
    }
  }

  /*
   * ============================================================
   * SHIFTS
   * ============================================================
   *
   * Migration 006 already provides:
   * - name
   * - start_time
   * - end_time
   * - expected_work_minutes
   * - grace_minutes
   * - break_minutes
   * - is_overnight
   * - is_active
   *
   * Add the configurable half-day threshold requested by the
   * Attendance business rules.
   *
   * Stored as hours with two decimal places.
   *
   * Example:
   * 4.00 = 4 hours
   * 4.50 = 4 hours 30 minutes
   */

  if (await knex.schema.hasTable('attendance_shifts')) {
    const hasHalfDayThresholdHours =
      await knex.schema.hasColumn(
        'attendance_shifts',
        'half_day_threshold_hours'
      );

    if (!hasHalfDayThresholdHours) {
      await knex.schema.alterTable(
        'attendance_shifts',
        (table) => {
          table
            .decimal('half_day_threshold_hours', 5, 2)
            .notNullable()
            .defaultTo(4);
        }
      );
    }
  }

  /*
   * ============================================================
   * ATTENDANCE CORRECTIONS
   * ============================================================
   *
   * Migration 006 already provides:
   * - attendance_id
   * - employee_id
   * - attendance_date
   * - requested_check_in
   * - requested_check_out
   * - reason
   * - status
   * - reviewed_by
   * - reviewed_at
   * - review_comment
   *
   * Add:
   * - requested_by
   * - requested_break_minutes
   */

  if (await knex.schema.hasTable('attendance_corrections')) {
    const hasRequestedBy = await knex.schema.hasColumn(
      'attendance_corrections',
      'requested_by'
    );

    const hasRequestedBreakMinutes =
      await knex.schema.hasColumn(
        'attendance_corrections',
        'requested_break_minutes'
      );

    await knex.schema.alterTable(
      'attendance_corrections',
      (table) => {
        if (!hasRequestedBy) {
          table
            .bigInteger('requested_by')
            .nullable();
        }

        if (!hasRequestedBreakMinutes) {
          table
            .integer('requested_break_minutes')
            .nullable();
        }
      }
    );

    /*
     * Index requested_by only when the column was newly added.
     * PostgreSQL permits this safely because migration 007 runs
     * only once.
     */

    if (!hasRequestedBy) {
      await knex.schema.alterTable(
        'attendance_corrections',
        (table) => {
          table.index(
            ['requested_by'],
            'attendance_corrections_requested_by_idx'
          );
        }
      );
    }
  }

  /*
   * ============================================================
   * OVERTIME
   * ============================================================
   *
   * Migration 006 already provides:
   * - employee_id
   * - attendance_id
   * - overtime_date
   * - minutes
   * - reason
   * - status
   * - approved_by
   * - approved_at
   * - review_comment
   *
   * Add requested_by for auditability and employee self-service.
   */

  if (await knex.schema.hasTable('attendance_overtime')) {
    const hasRequestedBy = await knex.schema.hasColumn(
      'attendance_overtime',
      'requested_by'
    );

    if (!hasRequestedBy) {
      await knex.schema.alterTable(
        'attendance_overtime',
        (table) => {
          table
            .bigInteger('requested_by')
            .nullable();

          table.index(
            ['requested_by'],
            'attendance_overtime_requested_by_idx'
          );
        }
      );
    }
  }

  /*
   * ============================================================
   * HOLIDAYS
   * ============================================================
   *
   * Migration 006 already provides the holiday definition.
   *
   * Add created_by so HR/Admin actions can be audited.
   */

  if (await knex.schema.hasTable('attendance_holidays')) {
    const hasCreatedBy = await knex.schema.hasColumn(
      'attendance_holidays',
      'created_by'
    );

    if (!hasCreatedBy) {
      await knex.schema.alterTable(
        'attendance_holidays',
        (table) => {
          table
            .bigInteger('created_by')
            .nullable();

          table.index(
            ['created_by'],
            'attendance_holidays_created_by_idx'
          );
        }
      );
    }
  }

  /*
   * ============================================================
   * ATTENDANCE SETTINGS
   * ============================================================
   *
   * Migration 006 uses:
   *
   *   setting_key
   *   setting_value
   *
   * We keep that design.
   *
   * Add updated_by for HR/Admin traceability.
   */

  if (await knex.schema.hasTable('attendance_settings')) {
    const hasUpdatedBy = await knex.schema.hasColumn(
      'attendance_settings',
      'updated_by'
    );

    if (!hasUpdatedBy) {
      await knex.schema.alterTable(
        'attendance_settings',
        (table) => {
          table
            .bigInteger('updated_by')
            .nullable();

          table.index(
            ['updated_by'],
            'attendance_settings_updated_by_idx'
          );
        }
      );
    }

    /*
     * Add the settings required by the advanced Attendance
     * configuration engine.
     *
     * Existing settings are preserved.
     */

    const settings = [
      {
        setting_key: 'max_overtime_per_day',
        setting_value: '240',
        description:
          'Maximum overtime allowed per employee per day in minutes',
      },
      {
        setting_key: 'auto_mark_absent_time',
        setting_value: '10:00',
        description:
          'Local time after which an employee without attendance may be automatically marked absent',
      },
      {
        setting_key: 'allowed_breaks',
        setting_value: '2',
        description:
          'Maximum number of breaks allowed per attendance day',
      },
    ];

    for (const setting of settings) {
      const existing = await knex('attendance_settings')
        .where(
          'setting_key',
          setting.setting_key
        )
        .first('id');

      if (!existing) {
        await knex('attendance_settings').insert(
          setting
        );
      }
    }
  }

  /*
   * ============================================================
   * AUDIT LOG
   * ============================================================
   *
   * The existing application refers to audit_logs, but the
   * Attendance migration must not assume that the table exists.
   *
   * Therefore:
   *
   * - If audit_logs already exists, leave it untouched.
   * - If it does not exist, create the Attendance-compatible
   *   audit log table.
   *
   * The table is intentionally generic so Attendance actions can
   * coexist with future audit records without requiring another
   * Attendance-specific audit table.
   */

  if (!(await knex.schema.hasTable('audit_logs'))) {
    await knex.schema.createTable(
      'audit_logs',
      (table) => {
        table.bigIncrements('id').primary();

        table
          .string('action', 120)
          .notNullable();

        table
          .bigInteger('performed_by')
          .nullable();

        table
          .bigInteger('target_record_id')
          .nullable();

        table
          .timestamp('timestamp', {
            useTz: true,
          })
          .notNullable()
          .defaultTo(knex.fn.now());

        table
          .jsonb('details')
          .nullable();

        table.index(
          ['action'],
          'audit_logs_action_idx'
        );

        table.index(
          ['performed_by'],
          'audit_logs_performed_by_idx'
        );

        table.index(
          ['target_record_id'],
          'audit_logs_target_record_id_idx'
        );

        table.index(
          ['timestamp'],
          'audit_logs_timestamp_idx'
        );
      }
    );
  } else {
    /*
     * If audit_logs already exists, make sure the fields required
     * by Attendance are present without dropping or renaming
     * anything already used by another module.
     */

    const hasAction = await knex.schema.hasColumn(
      'audit_logs',
      'action'
    );

    const hasPerformedBy =
      await knex.schema.hasColumn(
        'audit_logs',
        'performed_by'
      );

    const hasTargetRecordId =
      await knex.schema.hasColumn(
        'audit_logs',
        'target_record_id'
      );

    const hasTimestamp =
      await knex.schema.hasColumn(
        'audit_logs',
        'timestamp'
      );

    const hasDetails =
      await knex.schema.hasColumn(
        'audit_logs',
        'details'
      );

    await knex.schema.alterTable(
      'audit_logs',
      (table) => {
        if (!hasAction) {
          table
            .string('action', 120)
            .nullable();
        }

        if (!hasPerformedBy) {
          table
            .bigInteger('performed_by')
            .nullable();
        }

        if (!hasTargetRecordId) {
          table
            .bigInteger('target_record_id')
            .nullable();
        }

        if (!hasTimestamp) {
          table
            .timestamp('timestamp', {
              useTz: true,
            })
            .nullable()
            .defaultTo(knex.fn.now());
        }

        if (!hasDetails) {
          table
            .jsonb('details')
            .nullable();
        }
      }
    );

    /*
     * Only create indexes that don't already exist.
     *
     * PostgreSQL's IF NOT EXISTS is used through raw SQL here
     * because an existing audit_logs table may already have
     * indexes created by another module.
     */

    await knex.raw(`
      CREATE INDEX IF NOT EXISTS audit_logs_action_idx
      ON audit_logs (action)
    `);

    await knex.raw(`
      CREATE INDEX IF NOT EXISTS audit_logs_performed_by_idx
      ON audit_logs (performed_by)
    `);

    await knex.raw(`
      CREATE INDEX IF NOT EXISTS audit_logs_target_record_id_idx
      ON audit_logs (target_record_id)
    `);

    await knex.raw(`
      CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx
      ON audit_logs (timestamp)
    `);
  }
}

/**
 * Rollback only changes introduced by migration 007.
 *
 * Migration 006 remains untouched.
 */
export async function down(knex: Knex): Promise<void> {
  /*
   * ============================================================
   * AUDIT LOG
   * ============================================================
   *
   * Do not drop audit_logs during rollback if it existed before
   * migration 007.
   *
   * Because Knex migrations do not automatically store whether
   * a table existed before execution, we intentionally leave an
   * existing audit_logs table untouched.
   */

  /*
   * ============================================================
   * ATTENDANCE SETTINGS
   * ============================================================
   */

  if (await knex.schema.hasTable('attendance_settings')) {
    await knex('attendance_settings')
      .whereIn('setting_key', [
        'max_overtime_per_day',
        'auto_mark_absent_time',
        'allowed_breaks',
      ])
      .del();

    if (
      await knex.schema.hasColumn(
        'attendance_settings',
        'updated_by'
      )
    ) {
      await knex.schema.alterTable(
        'attendance_settings',
        (table) => {
          table.dropColumn('updated_by');
        }
      );
    }
  }

  /*
   * ============================================================
   * HOLIDAYS
   * ============================================================
   */

  if (await knex.schema.hasTable('attendance_holidays')) {
    if (
      await knex.schema.hasColumn(
        'attendance_holidays',
        'created_by'
      )
    ) {
      await knex.schema.alterTable(
        'attendance_holidays',
        (table) => {
          table.dropColumn('created_by');
        }
      );
    }
  }

  /*
   * ============================================================
   * OVERTIME
   * ============================================================
   */

  if (await knex.schema.hasTable('attendance_overtime')) {
    if (
      await knex.schema.hasColumn(
        'attendance_overtime',
        'requested_by'
      )
    ) {
      await knex.schema.alterTable(
        'attendance_overtime',
        (table) => {
          table.dropColumn('requested_by');
        }
      );
    }
  }

  /*
   * ============================================================
   * CORRECTIONS
   * ============================================================
   */

  if (
    await knex.schema.hasTable(
      'attendance_corrections'
    )
  ) {
    const columns: string[] = [];

    if (
      await knex.schema.hasColumn(
        'attendance_corrections',
        'requested_by'
      )
    ) {
      columns.push('requested_by');
    }

    if (
      await knex.schema.hasColumn(
        'attendance_corrections',
        'requested_break_minutes'
      )
    ) {
      columns.push(
        'requested_break_minutes'
      );
    }

    if (columns.length > 0) {
      await knex.schema.alterTable(
        'attendance_corrections',
        (table) => {
          for (const column of columns) {
            table.dropColumn(column);
          }
        }
      );
    }
  }

  /*
   * ============================================================
   * SHIFTS
   * ============================================================
   */

  if (
    await knex.schema.hasTable(
      'attendance_shifts'
    )
  ) {
    if (
      await knex.schema.hasColumn(
        'attendance_shifts',
        'half_day_threshold_hours'
      )
    ) {
      await knex.schema.alterTable(
        'attendance_shifts',
        (table) => {
          table.dropColumn(
            'half_day_threshold_hours'
          );
        }
      );
    }
  }

  /*
   * ============================================================
   * ATTENDANCE
   * ============================================================
   */

  if (await knex.schema.hasTable('attendance')) {
    if (
      await knex.schema.hasColumn(
        'attendance',
        'work_location'
      )
    ) {
      await knex.schema.alterTable(
        'attendance',
        (table) => {
          table.dropColumn('work_location');
        }
      );
    }
  }
}