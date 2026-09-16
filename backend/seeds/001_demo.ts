import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(k: Knex) {
  // ==================================================
  // CLEAR EXISTING DATA
  // ==================================================

  // Dependency-safe order
  for (const table of [
    'performance_review_goals',
    'performance_reviews',
    'performance_goals',
    'job_applications',
    'candidates',
    'job_openings',
    'audit_logs',
    'notifications',
    'announcements',
    'payroll',
    'salary_structures',
    'leave_requests',
    'attendance',
    'employees',
    'leave_types',
    'departments',
    'users',
  ]) {
    await k(table).del();
  }

  // ==================================================
  // PASSWORD
  // ==================================================

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // ==================================================
  // USERS
  // ==================================================

  const users = await k('users')
    .insert([
      {
        first_name: 'Super',
        last_name: 'Admin',
        email: 'superadmin@hrms.local',
        password_hash: passwordHash,
        role: 'SUPER_ADMIN',
      },
      {
        first_name: 'HR',
        last_name: 'Admin',
        email: 'hr@hrms.local',
        password_hash: passwordHash,
        role: 'HR_ADMIN',
      },
      {
        first_name: 'Team',
        last_name: 'Manager',
        email: 'manager@hrms.local',
        password_hash: passwordHash,
        role: 'MANAGER',
      },
      {
        first_name: 'Payroll',
        last_name: 'Admin',
        email: 'payroll@hrms.local',
        password_hash: passwordHash,
        role: 'PAYROLL',
      },
      {
        first_name: 'Demo',
        last_name: 'Employee',
        email: 'employee@hrms.local',
        password_hash: passwordHash,
        role: 'EMPLOYEE',
      },
    ])
    .returning('*');

  // ==================================================
  // DEPARTMENT
  // ==================================================

  const [department] = await k('departments')
    .insert({
      name: 'Information Technology',
      description: 'Technology and software development department',
    })
    .returning('*');

  // ==================================================
  // FIND USERS
  // ==================================================

  const managerUser = users.find(
    (user) => user.email === 'manager@hrms.local'
  )!;

  const employeeUser = users.find(
    (user) => user.email === 'employee@hrms.local'
  )!;

  // ==================================================
  // MANAGER EMPLOYEE
  // ==================================================

  const [managerEmployee] = await k('employees')
    .insert({
      user_id: managerUser.id,
      employee_code: 'EMP-MGR-001',
      department_id: department.id,
      designation: 'Engineering Manager',
      joining_date: '2025-01-06',
      employment_type: 'FULL_TIME',
      work_location: 'Hyderabad',
      status: 'ACTIVE',
    })
    .returning('*');

  // ==================================================
  // DEMO EMPLOYEE
  // ==================================================

  const [employee] = await k('employees')
    .insert({
      user_id: employeeUser.id,
      employee_code: 'EMP-001',
      department_id: department.id,
      designation: 'Software Engineer',
      manager_id: managerEmployee.id,
      joining_date: '2026-01-05',
      employment_type: 'FULL_TIME',
      work_location: 'Hyderabad',
      status: 'ACTIVE',
    })
    .returning('*');

  // ==================================================
  // LEAVE TYPES
  // ==================================================

  await k('leave_types').insert([
    {
      name: 'Casual Leave',
      annual_days: 12,
      is_paid: true,
    },
    {
      name: 'Sick Leave',
      annual_days: 10,
      is_paid: true,
    },
    {
      name: 'Earned Leave',
      annual_days: 15,
      is_paid: true,
    },
    {
      name: 'Work From Home',
      annual_days: 24,
      is_paid: true,
    },
  ]);

  // ==================================================
  // SALARY STRUCTURE
  // ==================================================

  await k('salary_structures').insert({
    employee_id: employee.id,
    basic: 35000,
    hra: 14000,
    allowances: 8000,
    deductions: 3000,
    effective_from: '2026-01-01',
  });

  // ==================================================
  // PAYROLL
  // ==================================================

  await k('payroll').insert({
    employee_id: employee.id,
    pay_month: 8,
    pay_year: 2026,
    gross_salary: 57000,
    total_deductions: 3000,
    net_salary: 54000,
    status: 'PROCESSED',
  });

  // ==================================================
  // ANNOUNCEMENT
  // ==================================================

  await k('announcements').insert({
    title: 'Welcome to HRMS',
    content:
      'Use this portal for attendance, leave, payroll and employee services.',
    created_by: users[0].id,
  });

  // ==================================================
  // RECRUITMENT - JOB OPENING 1
  // ==================================================

  const [softwareJob] = await k('job_openings')
    .insert({
      title: 'Software Engineer',
      department_id: department.id,
      location: 'Hyderabad',
      employment_type: 'FULL_TIME',
      description:
        'We are looking for a Software Engineer to build and maintain web applications and backend services.',
      requirements:
        'JavaScript, TypeScript, Node.js, React, SQL and basic Git knowledge.',
      openings: 3,
      status: 'OPEN',
      posted_date: '2026-09-01',
      closing_date: '2026-10-15',
      created_by: users[1].id,
    })
    .returning('*');

  // ==================================================
  // RECRUITMENT - JOB OPENING 2
  // ==================================================

  const [dataJob] = await k('job_openings')
    .insert({
      title: 'Junior Data Analyst',
      department_id: department.id,
      location: 'Hyderabad',
      employment_type: 'FULL_TIME',
      description:
        'Analyze business data, create reports and dashboards, and provide useful insights to teams.',
      requirements:
        'SQL, Excel, Power BI or Tableau, basic Python and data visualization.',
      openings: 2,
      status: 'OPEN',
      posted_date: '2026-09-05',
      closing_date: '2026-10-20',
      created_by: users[1].id,
    })
    .returning('*');

  // ==================================================
  // CANDIDATE 1
  // ==================================================

  const [candidate1] = await k('candidates')
    .insert({
      first_name: 'Rahul',
      last_name: 'Sharma',
      email: 'rahul.candidate@example.com',
      phone: '9876543210',
      resume_url: 'https://example.com/resumes/rahul-sharma.pdf',
      skills: 'JavaScript, React, Node.js, SQL',
    })
    .returning('*');

  // ==================================================
  // CANDIDATE 2
  // ==================================================

  const [candidate2] = await k('candidates')
    .insert({
      first_name: 'Ananya',
      last_name: 'Reddy',
      email: 'ananya.candidate@example.com',
      phone: '9876501234',
      resume_url: 'https://example.com/resumes/ananya-reddy.pdf',
      skills: 'SQL, Excel, Power BI, Python',
    })
    .returning('*');

  // ==================================================
  // JOB APPLICATIONS
  // ==================================================

  await k('job_applications').insert([
    {
      job_id: softwareJob.id,
      candidate_id: candidate1.id,
      status: 'INTERVIEW',
      applied_at: '2026-09-08',
      notes: 'Technical interview scheduled.',
    },
    {
      job_id: dataJob.id,
      candidate_id: candidate2.id,
      status: 'SCREENING',
      applied_at: '2026-09-10',
      notes: 'Resume shortlisted for initial screening.',
    },
  ]);

  // ==================================================
  // PERFORMANCE - GOAL 1
  // ==================================================

  const [performanceGoal1] = await k('performance_goals')
    .insert({
      employee_id: employee.id,
      title: 'Improve API Development Skills',
      description:
        'Improve backend API development skills by building secure and scalable REST APIs.',
      progress: 70,
      status: 'IN_PROGRESS',
      start_date: '2026-01-01',
      due_date: '2026-12-31',
    })
    .returning('*');

  // ==================================================
  // PERFORMANCE - GOAL 2
  // ==================================================

  const [performanceGoal2] = await k('performance_goals')
    .insert({
      employee_id: employee.id,
      title: 'Improve Team Communication',
      description:
        'Improve communication and collaboration with team members during projects and meetings.',
      progress: 50,
      status: 'IN_PROGRESS',
      start_date: '2026-03-01',
      due_date: '2026-11-30',
    })
    .returning('*');

  // ==================================================
  // PERFORMANCE - GOAL 3
  // ==================================================

  const [performanceGoal3] = await k('performance_goals')
    .insert({
      employee_id: employee.id,
      title: 'Complete Advanced TypeScript Training',
      description:
        'Complete advanced TypeScript learning and apply the concepts in production projects.',
      progress: 100,
      status: 'COMPLETED',
      start_date: '2026-01-15',
      due_date: '2026-06-30',
    })
    .returning('*');

  // ==================================================
  // PERFORMANCE REVIEW
  // ==================================================

  const [performanceReview] = await k('performance_reviews')
    .insert({
      employee_id: employee.id,
      reviewer_id: managerUser.id,
      review_period: '2026 Annual Review',
      rating: 4.2,
      strengths:
        'Good problem-solving skills, teamwork, and willingness to learn.',
      areas_for_improvement:
        'Improve communication and advanced backend architecture skills.',
      comments:
        'Overall performance is strong and consistent. Continue developing technical and communication skills.',
      status: 'COMPLETED',
      review_date: '2026-09-01',
    })
    .returning('*');

  // ==================================================
  // PERFORMANCE REVIEW GOALS
  // ==================================================

  await k('performance_review_goals').insert([
    {
      review_id: performanceReview.id,
      goal_id: performanceGoal1.id,
      achievement_percentage: 70,
      comments:
        'Good progress has been made toward the API development goal.',
    },
    {
      review_id: performanceReview.id,
      goal_id: performanceGoal2.id,
      achievement_percentage: 50,
      comments:
        'Communication has improved, but further development is recommended.',
    },
    {
      review_id: performanceReview.id,
      goal_id: performanceGoal3.id,
      achievement_percentage: 100,
      comments:
        'Training completed successfully and concepts were applied to project work.',
    },
  ]);

  // ==================================================
  // FINAL MESSAGE
  // ==================================================

  console.log('HRMS seed data inserted successfully.');
  console.log('Recruitment seed data inserted successfully.');
  console.log('Performance seed data inserted successfully.');
}