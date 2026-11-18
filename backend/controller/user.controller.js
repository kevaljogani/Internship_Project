
import mongoose from "mongoose";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";

// GET ALL NORMAL USERS - ADMIN ONLY
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    if (users.length === 0) {
      return res.status(200).json([]);
    }

    const userWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const [pendingTasks, inProgressTasks, completedTasks] =
          await Promise.all([
            Task.countDocuments({
              assignedTo: user._id,
              status: "Pending",
            }),
            Task.countDocuments({
              assignedTo: user._id,
              status: "In Progress",
            }),
            Task.countDocuments({
              assignedTo: user._id,
              status: "Completed",
            }),
          ]);

        return {
          ...user,
          pendingTasks,
          inProgressTasks,
          completedTasks,
        };
      })
    );

    return res.status(200).json(userWithTaskCounts);
  } catch (error) {
    next(error);
  }
};

// GET USER BY ID
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(errorHandler(400, "Invalid user ID"));
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    // Admin can view any user.
    // Normal users can only view their own profile.
    if (
      req.user.role !== "admin" &&
      req.user.id.toString() !== user._id.toString()
    ) {
      return next(errorHandler(403, "You are not authorized to view this user"));
    }

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
