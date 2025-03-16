import { NextFunction, Request, Response } from "express";
import { Role } from "shared/types/enums";
// Custom Request type that includes the `user` property

export const authorizeRoles = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role ${req.user?.role} is not authorized to access this resource`,
      });
      return;
    }
    next();
  };
};
