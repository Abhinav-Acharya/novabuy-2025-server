import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utility-class";
import { Controller } from "../types/types";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let message = err.message || "Internal Server Error";
  let statusCode = err.statusCode || 500;

  if (err.name === "CastError") {
    message = "Invalid ID";
    res.status(statusCode).json({
      success: false,
      message,
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const tryCatch =
  (func: Controller) => (req: Request, res: Response, next: NextFunction):void => {
    Promise.resolve(func(req, res, next)).catch(next);
  };
