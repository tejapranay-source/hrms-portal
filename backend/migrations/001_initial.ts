import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasEmployees = await knex.schema.hasTable('employees');

  if (hasEmployees) {
    return;
  }

  await knex.schema.createTable('employees', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().unique();
    table.string('employee_code', 50).notNullable().unique();
    table.bigInteger('department_id').nullable();
    table.string('designation', 120).nullable();
    table.bigInteger('manager_id').nullable();
    table.date('joining_date').nullable();
    table.string('employment_type', 40).defaultTo('FULL_TIME');
    table.string('work_location', 120).nullable();
    table.string('phone', 30).nullable();
    table.text('address').nullable();
    table.string('status', 30).notNullable().defaultTo('ACTIVE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('department_id').references('id').inTable('departments').onDelete('SET NULL');
    table.foreign('manager_id').references('id').inTable('employees').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('employees');
}
