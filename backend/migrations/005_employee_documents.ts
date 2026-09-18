import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable(
    'employee_documents'
  );

  if (exists) {
    return;
  }

  await knex.schema.createTable(
    'employee_documents',
    (table) => {
      table.bigIncrements('id').primary();

      table
        .bigInteger('employee_id')
        .notNullable()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE');

      table
        .string('document_name', 255)
        .notNullable();

      table
        .string('document_type', 100)
        .notNullable();

      table
        .timestamp('upload_date', {
          useTz: true,
        })
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .bigInteger('uploaded_by')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');

      table
        .text('file_url')
        .nullable();

      table
        .string('status', 30)
        .notNullable()
        .defaultTo('PENDING');

      table
        .text('description')
        .nullable();

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

      table.index(['employee_id']);

      table.index(['document_type']);

      table.index(['status']);
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable(
    'employee_documents'
  );

  if (exists) {
    await knex.schema.dropTable(
      'employee_documents'
    );
  }
}