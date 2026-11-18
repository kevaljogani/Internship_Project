
import express from "express";
import { adminOnly, verifyToken } from "../utils/verifyUser.js";

import {
  createTask,
  deleteTask,
  getDashboardData,
  getTaskById,
  getTasks,
  updateTask,
  updateTaskChecklist,
  updateTaskStatus,
  userDashboardData,
} from "../controller/task.controller.js";

const router = express.Router();

// Admin: Create a task
router.post("/create", verifyToken, adminOnly, createTask);

// Admin and Users: Fetch tasks
router.get("/", verifyToken, getTasks);

// Admin: Dashboard statistics
router.get("/dashboard-data", verifyToken, adminOnly, getDashboardData);

// Users: Dashboard statistics
router.get("/user-dashboard-data", verifyToken, userDashboardData);

// Admin and assigned users: Get task details
router.get("/:id", verifyToken, getTaskById);

// Admin only: Update task details and assignments
router.put("/:id", verifyToken, adminOnly, updateTask);

// Admin only: Delete task
router.delete("/:id", verifyToken, adminOnly, deleteTask);

// Admin and assigned users: Update task status
router.put("/:id/status", verifyToken, updateTaskStatus);

// Admin and assigned users: Update task checklist
router.put("/:id/todo", verifyToken, updateTaskChecklist);

export default router;
