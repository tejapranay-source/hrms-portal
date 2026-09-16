import { Router } from 'express';
import { auth, role } from '../middleware/auth';
import { db } from '../db';

const r = Router();

// ==================================================
// GET ALL GOALS
// ==================================================

r.get(
  '/goals',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'),
  async (req, res, next) => {
    try {
      const user = req.user!;

      let query = db('performance_goals')
        .join(
          'employees',
          'employees.id',
          'performance_goals.employee_id'
        )
        .join(
          'users',
          'users.id',
          'employees.user_id'
        )
        .select(
          'performance_goals.*',
          'employees.employee_code',
          'users.first_name',
          'users.last_name',
          'users.email'
        )
        .orderBy('performance_goals.created_at', 'desc');

      // Employee can see only their own goals
      if (user.role === 'EMPLOYEE') {
        if (!user.employeeId) {
          return res.status(404).json({
            message: 'Employee profile not found',
          });
        }

        query = query.where(
          'performance_goals.employee_id',
          user.employeeId
        );
      }

      const goals = await query;

      res.json(goals);
    } catch (e) {
      next(e);
    }
  }
);

// ==================================================
// CREATE GOAL
// ==================================================

r.post(
  '/goals',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'),
  async (req, res, next) => {
    try {
      const user = req.user!;

      const {
        employeeId,
        title,
        description,
        progress,
        status,
        startDate,
        dueDate,
      } = req.body;

      if (!title || !startDate) {
        return res.status(400).json({
          message: 'title and startDate are required',
        });
      }

      let targetEmployeeId = employeeId;

      // Employee can create only their own goal
      if (user.role === 'EMPLOYEE') {
        if (!user.employeeId) {
          return res.status(404).json({
            message: 'Employee profile not found',
          });
        }

        targetEmployeeId = user.employeeId;
      }

      if (!targetEmployeeId) {
        return res.status(400).json({
          message: 'employeeId is required',
        });
      }

      const employee = await db('employees')
        .where('id', targetEmployeeId)
        .first();

      if (!employee) {
        return res.status(404).json({
          message: 'Employee not found',
        });
      }

      const goalProgress =
        progress === undefined ? 0 : Number(progress);

      if (
        Number.isNaN(goalProgress) ||
        goalProgress < 0 ||
        goalProgress > 100
      ) {
        return res.status(400).json({
          message: 'progress must be between 0 and 100',
        });
      }

      const [goal] = await db('performance_goals')
        .insert({
          employee_id: targetEmployeeId,
          title,
          description: description || null,
          progress: goalProgress,
          status: status || 'NOT_STARTED',
          start_date: startDate,
          due_date: dueDate || null,
        })
        .returning('*');

      res.status(201).json({
        message: 'Performance goal created successfully',
        goal,
      });
    } catch (e) {
      next(e);
    }
  }
);

// ==================================================
// UPDATE GOAL
// ==================================================

r.put(
  '/goals/:id',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'),
  async (req, res, next) => {
    try {
      const user = req.user!;

      const goal = await db('performance_goals')
        .where('id', req.params.id)
        .first();

      if (!goal) {
        return res.status(404).json({
          message: 'Performance goal not found',
        });
      }

      // Employee can update only their own goal
      if (
        user.role === 'EMPLOYEE' &&
        goal.employee_id !== user.employeeId
      ) {
        return res.status(403).json({
          message: 'You can update only your own goals',
        });
      }

      const {
        title,
        description,
        progress,
        status,
        startDate,
        dueDate,
      } = req.body;

      const updateData: Record<string, unknown> = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) {
        updateData.description = description || null;
      }

      if (progress !== undefined) {
        const goalProgress = Number(progress);

        if (
          Number.isNaN(goalProgress) ||
          goalProgress < 0 ||
          goalProgress > 100
        ) {
          return res.status(400).json({
            message: 'progress must be between 0 and 100',
          });
        }

        updateData.progress = goalProgress;
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      if (startDate !== undefined) {
        updateData.start_date = startDate;
      }

      if (dueDate !== undefined) {
        updateData.due_date = dueDate || null;
      }

      updateData.updated_at = db.fn.now();

      const [updatedGoal] = await db('performance_goals')
        .where('id', req.params.id)
        .update(updateData)
        .returning('*');

      res.json({
        message: 'Performance goal updated successfully',
        goal: updatedGoal,
      });
    } catch (e) {
      next(e);
    }
  }
);

// ==================================================
// DELETE GOAL
// ==================================================

r.delete(
  '/goals/:id',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN'),
  async (req, res, next) => {
    try {
      const deleted = await db('performance_goals')
        .where('id', req.params.id)
        .delete();

      if (!deleted) {
        return res.status(404).json({
          message: 'Performance goal not found',
        });
      }

      res.json({
        message: 'Performance goal deleted successfully',
      });
    } catch (e) {
      next(e);
    }
  }
);

// ==================================================
// GET PERFORMANCE REVIEWS
// ==================================================

r.get(
  '/reviews',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'),
  async (req, res, next) => {
    try {
      const user = req.user!;

      let query = db('performance_reviews')
        .join(
          'employees',
          'employees.id',
          'performance_reviews.employee_id'
        )
        .join(
          'users as employee_users',
          'employee_users.id',
          'employees.user_id'
        )
        .join(
          'users as reviewer_users',
          'reviewer_users.id',
          'performance_reviews.reviewer_id'
        )
        .select(
          'performance_reviews.*',
          'employees.employee_code',
          'employee_users.first_name as employee_first_name',
          'employee_users.last_name as employee_last_name',
          'reviewer_users.first_name as reviewer_first_name',
          'reviewer_users.last_name as reviewer_last_name'
        )
        .orderBy('performance_reviews.created_at', 'desc');

      // Employee sees only their own reviews
      if (user.role === 'EMPLOYEE') {
        if (!user.employeeId) {
          return res.status(404).json({
            message: 'Employee profile not found',
          });
        }

        query = query.where(
          'performance_reviews.employee_id',
          user.employeeId
        );
      }

      const reviews = await query;

      res.json(reviews);
    } catch (e) {
      next(e);
    }
  }
);

// ==================================================
// CREATE PERFORMANCE REVIEW
// ==================================================

r.post(
  '/reviews',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const {
        employeeId,
        reviewPeriod,
        rating,
        strengths,
        areasForImprovement,
        comments,
        status,
        reviewDate,
      } = req.body;

      if (!employeeId || !reviewPeriod) {
        return res.status(400).json({
          message: 'employeeId and reviewPeriod are required',
        });
      }

      const employee = await db('employees')
        .where('id', employeeId)
        .first();

      if (!employee) {
        return res.status(404).json({
          message: 'Employee not found',
        });
      }

      if (rating !== undefined && rating !== null) {
        const numericRating = Number(rating);

        if (
          Number.isNaN(numericRating) ||
          numericRating < 0 ||
          numericRating > 5
        ) {
          return res.status(400).json({
            message: 'rating must be between 0 and 5',
          });
        }
      }

      const [review] = await db('performance_reviews')
        .insert({
          employee_id: employeeId,
          reviewer_id: req.user!.id,
          review_period: reviewPeriod,
          rating:
            rating === undefined || rating === null
              ? null
              : Number(rating),
          strengths: strengths || null,
          areas_for_improvement: areasForImprovement || null,
          comments: comments || null,
          status: status || 'DRAFT',
          review_date: reviewDate || null,
        })
        .returning('*');

      res.status(201).json({
        message: 'Performance review created successfully',
        review,
      });
    } catch (e) {
      next(e);
    }
  }
);

// ==================================================
// UPDATE PERFORMANCE REVIEW
// ==================================================

r.put(
  '/reviews/:id',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const review = await db('performance_reviews')
        .where('id', req.params.id)
        .first();

      if (!review) {
        return res.status(404).json({
          message: 'Performance review not found',
        });
      }

      const {
        reviewPeriod,
        rating,
        strengths,
        areasForImprovement,
        comments,
        status,
        reviewDate,
      } = req.body;

      const updateData: Record<string, unknown> = {};

      if (reviewPeriod !== undefined) {
        updateData.review_period = reviewPeriod;
      }

      if (rating !== undefined && rating !== null) {
        const numericRating = Number(rating);

        if (
          Number.isNaN(numericRating) ||
          numericRating < 0 ||
          numericRating > 5
        ) {
          return res.status(400).json({
            message: 'rating must be between 0 and 5',
          });
        }

        updateData.rating = numericRating;
      }

      if (strengths !== undefined) {
        updateData.strengths = strengths || null;
      }

      if (areasForImprovement !== undefined) {
        updateData.areas_for_improvement =
          areasForImprovement || null;
      }

      if (comments !== undefined) {
        updateData.comments = comments || null;
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      if (reviewDate !== undefined) {
        updateData.review_date = reviewDate || null;
      }

      updateData.updated_at = db.fn.now();

      const [updatedReview] = await db('performance_reviews')
        .where('id', req.params.id)
        .update(updateData)
        .returning('*');

      res.json({
        message: 'Performance review updated successfully',
        review: updatedReview,
      });
    } catch (e) {
      next(e);
    }
  }
);

// ==================================================
// DELETE PERFORMANCE REVIEW
// ==================================================

r.delete(
  '/reviews/:id',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN'),
  async (req, res, next) => {
    try {
      const deleted = await db('performance_reviews')
        .where('id', req.params.id)
        .delete();

      if (!deleted) {
        return res.status(404).json({
          message: 'Performance review not found',
        });
      }

      res.json({
        message: 'Performance review deleted successfully',
      });
    } catch (e) {
      next(e);
    }
  }
);

// ==================================================
// GET GOALS ATTACHED TO A REVIEW
// ==================================================

r.get(
  '/reviews/:id/goals',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'),
  async (req, res, next) => {
    try {
      const review = await db('performance_reviews')
        .where('id', req.params.id)
        .first();

      if (!review) {
        return res.status(404).json({
          message: 'Performance review not found',
        });
      }

      const user = req.user!;

      if (
        user.role === 'EMPLOYEE' &&
        review.employee_id !== user.employeeId
      ) {
        return res.status(403).json({
          message: 'You can access only your own review goals',
        });
      }

      const goals = await db('performance_review_goals')
        .join(
          'performance_goals',
          'performance_goals.id',
          'performance_review_goals.goal_id'
        )
        .select(
          'performance_review_goals.*',
          'performance_goals.title',
          'performance_goals.description',
          'performance_goals.progress',
          'performance_goals.status'
        )
        .where(
          'performance_review_goals.review_id',
          req.params.id
        )
        .orderBy('performance_review_goals.created_at', 'asc');

      res.json(goals);
    } catch (e) {
      next(e);
    }
  }
);

// ==================================================
// ATTACH GOAL TO REVIEW
// ==================================================

r.post(
  '/reviews/:id/goals',
  auth,
  role('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const { goalId, achievementPercentage, comments } =
        req.body;

      if (!goalId) {
        return res.status(400).json({
          message: 'goalId is required',
        });
      }

      const review = await db('performance_reviews')
        .where('id', req.params.id)
        .first();

      if (!review) {
        return res.status(404).json({
          message: 'Performance review not found',
        });
      }

      const goal = await db('performance_goals')
        .where('id', goalId)
        .first();

      if (!goal) {
        return res.status(404).json({
          message: 'Performance goal not found',
        });
      }

      if (goal.employee_id !== review.employee_id) {
        return res.status(400).json({
          message:
            'Goal and review must belong to the same employee',
        });
      }

      const existing = await db('performance_review_goals')
        .where({
          review_id: req.params.id,
          goal_id: goalId,
        })
        .first();

      if (existing) {
        return res.status(409).json({
          message: 'Goal is already attached to this review',
        });
      }

      const achievement =
        achievementPercentage === undefined
          ? goal.progress
          : Number(achievementPercentage);

      if (
        Number.isNaN(achievement) ||
        achievement < 0 ||
        achievement > 100
      ) {
        return res.status(400).json({
          message:
            'achievementPercentage must be between 0 and 100',
        });
      }

      const [reviewGoal] = await db('performance_review_goals')
        .insert({
          review_id: req.params.id,
          goal_id: goalId,
          achievement_percentage: achievement,
          comments: comments || null,
        })
        .returning('*');

      res.status(201).json({
        message: 'Goal attached to review successfully',
        reviewGoal,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default r;