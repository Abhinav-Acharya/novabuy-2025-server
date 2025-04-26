import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import ErrorHandler from "../utils/utility-class";
import { tryCatch } from "./error.middleware";

export const adminOnly = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;

    if (!id) {
      return next(new ErrorHandler("You must be logged in to access this resource", 401));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new ErrorHandler("User not found. Please log in again.", 401));
    }

    if (user.role !== "admin") {
      return next(new ErrorHandler("Access denied. Admins only.", 403));
    }

    next();
  }
);
