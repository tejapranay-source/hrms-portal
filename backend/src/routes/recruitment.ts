import { Router } from 'express';
import { auth, role } from '../middleware/auth';
import { db } from '../db';

const r = Router();

/*
|--------------------------------------------------------------------------
| JOB OPENINGS
|--------------------------------------------------------------------------
*/

/* Get all job openings */
r.get(
  '/jobs',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const jobs = await db('job_openings')
        .leftJoin(
          'departments',
          'departments.id',
          'job_openings.department_id'
        )
        .select(
          'job_openings.*',
          'departments.name as department'
        )
        .orderBy('job_openings.created_at', 'desc');

      res.json(jobs);
    } catch (e) {
      next(e);
    }
  }
);

/* Create a job opening */
r.post(
  '/jobs',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN'),
  async (req, res, next) => {
    try {
      const {
        title,
        departmentId,
        location,
        employmentType,
        description,
        requirements,
        openings,
        postedDate,
        closingDate,
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          message: 'title and description are required',
        });
      }

      const [job] = await db('job_openings')
        .insert({
          title,
          department_id: departmentId || null,
          location: location || null,
          employment_type: employmentType || 'FULL_TIME',
          description,
          requirements: requirements || null,
          openings: openings || 1,
          status: 'OPEN',
          posted_date: postedDate || new Date(),
          closing_date: closingDate || null,
          created_by: req.user!.id,
        })
        .returning('*');

      res.status(201).json(job);
    } catch (e) {
      next(e);
    }
  }
);

/* Get one job */
r.get(
  '/jobs/:id',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const job = await db('job_openings')
        .leftJoin(
          'departments',
          'departments.id',
          'job_openings.department_id'
        )
        .select(
          'job_openings.*',
          'departments.name as department'
        )
        .where('job_openings.id', req.params.id)
        .first();

      if (!job) {
        return res.status(404).json({
          message: 'Job opening not found',
        });
      }

      res.json(job);
    } catch (e) {
      next(e);
    }
  }
);

/* Update job */
r.put(
  '/jobs/:id',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN'),
  async (req, res, next) => {
    try {
      const {
        title,
        departmentId,
        location,
        employmentType,
        description,
        requirements,
        openings,
        status,
        postedDate,
        closingDate,
      } = req.body;

      const [job] = await db('job_openings')
        .where('id', req.params.id)
        .update({
          title,
          department_id: departmentId || null,
          location: location || null,
          employment_type: employmentType || 'FULL_TIME',
          description,
          requirements: requirements || null,
          openings: openings || 1,
          status: status || 'OPEN',
          posted_date: postedDate || null,
          closing_date: closingDate || null,
          updated_at: db.fn.now(),
        })
        .returning('*');

      if (!job) {
        return res.status(404).json({
          message: 'Job opening not found',
        });
      }

      res.json(job);
    } catch (e) {
      next(e);
    }
  }
);

/* Delete job */
r.delete(
  '/jobs/:id',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN'),
  async (req, res, next) => {
    try {
      const deleted = await db('job_openings')
        .where('id', req.params.id)
        .delete();

      if (!deleted) {
        return res.status(404).json({
          message: 'Job opening not found',
        });
      }

      res.json({
        message: 'Job opening deleted successfully',
      });
    } catch (e) {
      next(e);
    }
  }
);

/*
|--------------------------------------------------------------------------
| CANDIDATES
|--------------------------------------------------------------------------
*/

/* Get all candidates */
r.get(
  '/candidates',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const candidates = await db('candidates')
        .orderBy('created_at', 'desc');

      res.json(candidates);
    } catch (e) {
      next(e);
    }
  }
);

/* Add candidate */
r.post(
  '/candidates',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN'),
  async (req, res, next) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        resumeUrl,
        skills,
      } = req.body;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({
          message: 'firstName, lastName and email are required',
        });
      }

      const existing = await db('candidates')
        .where({ email: email.toLowerCase() })
        .first();

      if (existing) {
        return res.status(409).json({
          message: 'Candidate with this email already exists',
        });
      }

      const [candidate] = await db('candidates')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: phone || null,
          resume_url: resumeUrl || null,
          skills: skills || null,
        })
        .returning('*');

      res.status(201).json(candidate);
    } catch (e) {
      next(e);
    }
  }
);

/* Get one candidate */
r.get(
  '/candidates/:id',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const candidate = await db('candidates')
        .where('id', req.params.id)
        .first();

      if (!candidate) {
        return res.status(404).json({
          message: 'Candidate not found',
        });
      }

      res.json(candidate);
    } catch (e) {
      next(e);
    }
  }
);

/*
|--------------------------------------------------------------------------
| JOB APPLICATIONS
|--------------------------------------------------------------------------
*/

/* Get all applications */
r.get(
  '/applications',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const applications = await db('job_applications')
        .join(
          'job_openings',
          'job_openings.id',
          'job_applications.job_id'
        )
        .join(
          'candidates',
          'candidates.id',
          'job_applications.candidate_id'
        )
        .select(
          'job_applications.*',
          'job_openings.title as job_title',
          'candidates.first_name',
          'candidates.last_name',
          'candidates.email',
          'candidates.phone'
        )
        .orderBy('job_applications.created_at', 'desc');

      res.json(applications);
    } catch (e) {
      next(e);
    }
  }
);

/* Apply candidate to job */
r.post(
  '/applications',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN'),
  async (req, res, next) => {
    try {
      const { jobId, candidateId, notes } = req.body;

      if (!jobId || !candidateId) {
        return res.status(400).json({
          message: 'jobId and candidateId are required',
        });
      }

      const job = await db('job_openings')
        .where({ id: jobId })
        .first();

      if (!job) {
        return res.status(404).json({
          message: 'Job opening not found',
        });
      }

      const candidate = await db('candidates')
        .where({ id: candidateId })
        .first();

      if (!candidate) {
        return res.status(404).json({
          message: 'Candidate not found',
        });
      }

      const existing = await db('job_applications')
        .where({
          job_id: jobId,
          candidate_id: candidateId,
        })
        .first();

      if (existing) {
        return res.status(409).json({
          message: 'Candidate has already applied for this job',
        });
      }

      const [application] = await db('job_applications')
        .insert({
          job_id: jobId,
          candidate_id: candidateId,
          status: 'APPLIED',
          applied_at: new Date(),
          notes: notes || null,
        })
        .returning('*');

      res.status(201).json(application);
    } catch (e) {
      next(e);
    }
  }
);

/* Update application status */
r.patch(
  '/applications/:id/status',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const { status, notes } = req.body;

      const allowedStatuses = [
        'APPLIED',
        'SCREENING',
        'INTERVIEW',
        'SELECTED',
        'REJECTED',
        'ON_HOLD',
        'HIRED',
      ];

      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
        });
      }

      const [application] = await db('job_applications')
        .where('id', req.params.id)
        .update({
          status,
          notes: notes || null,
          updated_at: db.fn.now(),
        })
        .returning('*');

      if (!application) {
        return res.status(404).json({
          message: 'Application not found',
        });
      }

      res.json(application);
    } catch (e) {
      next(e);
    }
  }
);

/* Get applications for one job */
r.get(
  '/jobs/:id/applications',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const applications = await db('job_applications')
        .join(
          'candidates',
          'candidates.id',
          'job_applications.candidate_id'
        )
        .select(
          'job_applications.*',
          'candidates.first_name',
          'candidates.last_name',
          'candidates.email',
          'candidates.phone',
          'candidates.resume_url',
          'candidates.skills'
        )
        .where('job_applications.job_id', req.params.id)
        .orderBy('job_applications.created_at', 'desc');

      res.json(applications);
    } catch (e) {
      next(e);
    }
  }
);

export default r;