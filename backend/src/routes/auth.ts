
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { db } from '../db';
import { env } from '../config/env';

const r = Router();

r.post(
  '/login',
  async (req, res, next) => {
    try {
      const input = z
        .object({
          email: z.string().email(),
          password: z.string().min(8),
        })
        .parse(req.body);

      const email = input.email
        .trim()
        .toLowerCase();

      const user = await db('users')
        .where({
          email,
        })
        .first();

      if (
        !user ||
        !user.is_active ||
        !(await bcrypt.compare(
          input.password,
          user.password_hash
        ))
      ) {
        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }

      /*
       * Find the employee profile belonging
       * to the authenticated user.
       */
      const employee = await db('employees')
        .where({
          user_id: user.id,
        })
        .first();

      const employeeId = employee
        ? Number(employee.id)
        : undefined;

      /*
       * Create JWT.
       *
       * employeeId is included whenever the
       * logged-in user has an employee profile.
       */
      const tokenPayload: {
        id: number;
        email: string;
        role: string;
        employeeId?: number;
      } = {
        id: Number(user.id),
        email: user.email,
        role: user.role,
      };

      if (employeeId !== undefined) {
        tokenPayload.employeeId = employeeId;
      }

      const token = jwt.sign(
        tokenPayload,
        env.jwtSecret,
        {
          expiresIn: '8h',
        }
      );

      await db('audit_logs').insert({
        user_id: user.id,
        action: 'LOGIN',
        entity_type: 'USER',
        entity_id: user.id,
        ip_address: req.ip,
      });

      return res.json({
        token,
        user: {
          id: Number(user.id),
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          employeeId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default r;

