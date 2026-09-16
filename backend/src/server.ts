
import express from 'express';
import cors from 'cors';

import { env } from './config/env';

import auth from './routes/auth';
import attendance from './routes/attendance';
import core from './routes/core';
import recruitment from './routes/recruitment';
import performance from './routes/performance';
import employeeManagement from './routes/employeeManagement';
import settings from './routes/settings';

import { notFound, error } from './middleware/error';

const app = express();

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(
  cors({
    origin: env.clientUrl,
  })
);

app.use(express.json());

// ==================================================
// HEALTH CHECK
// ==================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hrms-backend',
  });
});

// ==================================================
// API ROUTES
// ==================================================

app.use('/api/auth', auth);

app.use('/api/attendance', attendance);

app.use('/api', core);

app.use('/api/recruitment', recruitment);

app.use('/api/performance', performance);

// ==================================================
// EMPLOYEE MANAGEMENT
// Edit Employee
// Employee Status Management
// Department Management
// Designation Management
// ==================================================

app.use(
  '/api/employee-management',
  employeeManagement
);
app.use('/api/settings', settings);

// ==================================================
// ERROR HANDLING
// ==================================================

app.use(notFound);

app.use(error);

// ==================================================
// START SERVER
// ==================================================

app.listen(env.port, () => {
  console.log(
    `HRMS API running at http://localhost:${env.port}`
  );
});

