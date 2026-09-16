import type { Knex } from 'knex';

export async function up(k: Knex) {
  // 1. Performance Goals
  await k.schema.createTable('performance_goals', (t) => {
    t.bigIncrements('id').primary();

    t.bigInteger('employee_id')
      .notNullable()
      .references('id')
      .inTable('employees')
      .onDelete('CASCADE');

    t.string('title', 200).notNullable();
    t.text('description');

    t.integer('progress').notNullable().defaultTo(0);

    t.string('status', 30)
      .notNullable()
      .defaultTo('NOT_STARTED');

    t.date('start_date').notNullable();
    t.date('due_date');

    t.timestamps(true, true);
  });

  // 2. Performance Reviews
  await k.schema.createTable('performance_reviews', (t) => {
    t.bigIncrements('id').primary();

    t.bigInteger('employee_id')
      .notNullable()
      .references('id')
      .inTable('employees')
      .onDelete('CASCADE');

    t.bigInteger('reviewer_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    t.string('review_period', 100).notNullable();

    t.decimal('rating', 3, 1);

    t.text('strengths');
    t.text('areas_for_improvement');
    t.text('comments');

    t.string('status', 30)
      .notNullable()
      .defaultTo('DRAFT');

    t.date('review_date');

    t.timestamps(true, true);
  });

  // 3. Performance review history
  await k.schema.createTable('performance_review_goals', (t) => {
    t.bigIncrements('id').primary();

    t.bigInteger('review_id')
      .notNullable()
      .references('id')
      .inTable('performance_reviews')
      .onDelete('CASCADE');

    t.bigInteger('goal_id')
      .notNullable()
      .references('id')
      .inTable('performance_goals')
      .onDelete('CASCADE');

    t.integer('achievement_percentage')
      .notNullable()
      .defaultTo(0);

    t.text('comments');

    t.timestamps(true, true);

    t.unique(['review_id', 'goal_id']);
  });
}

export async function down(k: Knex) {
  await k.schema.dropTableIfExists('performance_review_goals');
  await k.schema.dropTableIfExists('performance_reviews');
  await k.schema.dropTableIfExists('performance_goals');
}