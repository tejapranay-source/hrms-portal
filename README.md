# HRMS Portal

Full-stack HRMS starter/MVP: Next.js + TypeScript frontend, Express + TypeScript backend, PostgreSQL + Knex, JWT + bcrypt, RBAC, employees, attendance check-in/out, leave, payroll, announcements, notifications, dashboard and audit logs.

## Requirements
Node.js 20+ and PostgreSQL 15+.

## Setup
1. Create PostgreSQL database `hrms_portal`.
2. `cd backend && copy .env.example .env && npm install && npm run migrate && npm run seed && npm run dev`
3. In another terminal: `cd frontend && copy .env.example .env.local && npm install && npm run dev`
4. Open http://localhost:3000

Demo password: `Password@123`
- superadmin@hrms.local
- hr@hrms.local
- manager@hrms.local
- payroll@hrms.local
- employee@hrms.local

This is an implementation-ready MVP foundation. Company production deployment still needs security review, HTTPS, backups, monitoring, real mail/SMS integrations, statutory payroll configuration, privacy/retention policy and UAT.
