import type { Knex } from 'knex';

export async function up(k: Knex) {
  await k.schema.createTable('job_openings', (t) => {
    t.bigIncrements('id').primary();

    t.string('title', 150).notNullable();

    t.bigInteger('department_id')
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL');

    t.string('location', 120);
    t.string('employment_type', 40).notNullable().defaultTo('FULL_TIME');

    t.text('description').notNullable();
    t.text('requirements');

    t.integer('openings').notNullable().defaultTo(1);

    t.string('status', 30)
      .notNullable()
      .defaultTo('OPEN');

    t.date('posted_date');
    t.date('closing_date');

    t.bigInteger('created_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');

    t.timestamps(true, true);
  });

  await k.schema.createTable('candidates', (t) => {
    t.bigIncrements('id').primary();

    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();

    t.string('email', 255).notNullable();
    t.string('phone', 30);

    t.text('resume_url');
    t.text('skills');

    t.timestamps(true, true);

    t.unique(['email']);
  });

  await k.schema.createTable('job_applications', (t) => {
    t.bigIncrements('id').primary();

    t.bigInteger('job_id')
      .notNullable()
      .references('id')
      .inTable('job_openings')
      .onDelete('CASCADE');

    t.bigInteger('candidate_id')
      .notNullable()
      .references('id')
      .inTable('candidates')
      .onDelete('CASCADE');

    t.string('status', 40)
      .notNullable()
      .defaultTo('APPLIED');

    t.date('applied_at')
      .notNullable()
      .defaultTo(k.fn.now());

    t.text('notes');

    t.timestamps(true, true);

    t.unique(['job_id', 'candidate_id']);
  });
}

export async function down(k: Knex) {
  await k.schema.dropTableIfExists('job_applications');
  await k.schema.dropTableIfExists('candidates');
  await k.schema.dropTableIfExists('job_openings');
}