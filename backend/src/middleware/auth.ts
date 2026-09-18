
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type Role =
  | 'SUPER_ADMIN'
  | 'HR_ADMIN'
  | 'MANAGER'
  | 'PAYROLL'
  | 'EMPLOYEE';

export interface UserToken {
  id: number;
  email: string;
  role: Role;
  employeeId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserToken;
    }
  }
}

export function auth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Invalid authorization format',
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: 'Authentication token missing',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      env.jwtSecret
    ) as UserToken;

    if (
      !decoded ||
      !decoded.id ||
      !decoded.email ||
      !decoded.role
    ) {
      return res.status(401).json({
        message: 'Invalid authentication token',
      });
    }

    req.user = {
      id: Number(decoded.id),
      email: decoded.email,
      role: decoded.role,
      employeeId:
        decoded.employeeId !== undefined &&
        decoded.employeeId !== null
          ? Number(decoded.employeeId)
          : undefined,
    };

    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
}

export function role(...roles: Role[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (
      req.user &&
      roles.includes(req.user.role)
    ) {
      return next();
    }

    return res.status(403).json({
      message: 'Forbidden',
    });
  };
}

