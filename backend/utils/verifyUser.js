
import jwt from "jsonwebtoken";
import { errorHandler } from "./error.js";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      return next(errorHandler(401, "Authentication required. Please log in."));
    }

    if (!process.env.JWT_SECRET) {
      return next(errorHandler(500, "JWT_SECRET is not configured"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !decoded.role) {
      return next(errorHandler(401, "Invalid authentication token"));
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return next(errorHandler(401, "Session expired or invalid. Please log in again."));
    }

    next(error);
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(errorHandler(401, "Authentication required"));
  }

  if (req.user.role !== "admin") {
    return next(errorHandler(403, "Access denied. Admin only."));
  }

  next();
};
