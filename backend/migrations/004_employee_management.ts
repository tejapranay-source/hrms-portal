import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  /*
   * =========================================================
   * DESIGNATIONS
   * =========================================================
   */

  const hasDesignations =
    await knex.schema.hasTable('designations');

  if (!hasDesignations) {
    await knex.schema.createTable(
      'designations',
      (table) => {
        table.bigIncrements('id').primary();

        table
          .string('name', 150)
          .notNullable()
          .unique();

        table
          .text('description')
          .nullable();

        table
          .boolean('is_active')
          .notNullable()
          .defaultTo(true);

        table
          .timestamp('created_at', {
            useTz: true,
          })
          .notNullable()
          .defaultTo(knex.fn.now());

        table
          .timestamp('updated_at', {
            useTz: true,
          })
          .notNullable()
          .defaultTo(knex.fn.now());
      }
    );
  }

  /*
   * =========================================================
   * EMPLOYEE MANAGEMENT FIELDS
   * =========================================================
   */

  const hasDesignationId =
    await knex.schema.hasColumn(
      'employees',
      'designation_id'
    );

  if (!hasDesignationId) {
    await knex.schema.alterTable(
      'employees',
      (table) => {
        table
          .bigInteger('designation_id')
          .nullable()
          .references('id')
          .inTable('designations')
          .onDelete('SET NULL');

        table
          .jsonb('metadata')
          .notNullable()
          .defaultTo('{}');
      }
    );
  } else {
    const hasMetadata =
      await knex.schema.hasColumn(
        'employees',
        'metadata'
      );

    if (!hasMetadata) {
      await knex.schema.alterTable(
        'employees',
        (table) => {
          table
            .jsonb('metadata')
            .notNullable()
            .defaultTo('{}');
        }
      );
    }
  }

  /*
   * =========================================================
   * DEFAULT DESIGNATIONS
   * =========================================================
   */

  const defaultDesignations = [
    'Software Engineer',
    'Senior Software Engineer',
    'HR Executive',
    'HR Manager',
    'Accountant',
    'Team Lead',
    'Project Manager',
  ];

  for (const name of defaultDesignations) {
    await knex('designations')
      .insert({
        name,
        is_active: true,
      })
      .onConflict('name')
      .ignore();
  }

  /*
   * =========================================================
   * MIGRATE EXISTING EMPLOYEE DESIGNATIONS
   * =========================================================
   */

  await knex.raw(`
    UPDATE employees e
    SET designation_id = d.id
    FROM designations d
    WHERE e.designation_id IS NULL
      AND e.designation IS NOT NULL
      AND LOWER(TRIM(e.designation)) =
          LOWER(TRIM(d.name))
  `);
}

export async function down(knex: Knex): Promise<void> {
  /*
   * =========================================================
   * REMOVE DESIGNATION ID
   * =========================================================
   */

  const hasDesignationId =
    await knex.schema.hasColumn(
      'employees',
      'designation_id'
    );

  if (hasDesignationId) {
    await knex.schema.alterTable(
      'employees',
      (table) => {
        table.dropColumn('designation_id');
      }
    );
  }

  /*
   * =========================================================
   * REMOVE METADATA
   * =========================================================
   */

  const hasMetadata =
    await knex.schema.hasColumn(
      'employees',
      'metadata'
    );

  if (hasMetadata) {
    await knex.schema.alterTable(
      'employees',
      (table) => {
        table.dropColumn('metadata');
      }
    );
  }

  /*
   * =========================================================
   * REMOVE DESIGNATIONS TABLE
   * =========================================================
   */

  const hasDesignations =
    await knex.schema.hasTable('designations');

  if (hasDesignations) {
    await knex.schema.dropTable(
      'designations'
    );
  }
}