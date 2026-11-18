import mongoose from "mongoose";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";

const validStatuses = ["Pending", "In Progress", "Completed"];
const validPriorities = ["Low", "Medium", "High"];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isAssignedToUser = (task, userId) =>
  task.assignedTo.some(
    (assignedId) => assignedId.toString() === userId.toString(),
  );

const calculateProgress = (checklist) => {
  if (!checklist.length) return 0;

  const completed = checklist.filter((item) => item.completed).length;

  return Math.round((completed / checklist.length) * 100);
};

// Validate assigned users
const validateAssignedUsers = async (assignedTo) => {
  if (!Array.isArray(assignedTo)) {
    throw errorHandler(400, "assignedTo must be an array");
  }

  if (!assignedTo.every(isValidId)) {
    throw errorHandler(400, "Invalid assigned user ID");
  }

  const uniqueIds = [...new Set(assignedTo.map(String))];

  if (uniqueIds.length !== assignedTo.length) {
    throw errorHandler(400, "Duplicate assigned users are not allowed");
  }

  const users = await User.find({
    _id: { $in: assignedTo },
    role: "user",
  }).select("_id");

  if (users.length !== assignedTo.length) {
    throw errorHandler(
      400,
      "One or more assigned users do not exist or are not normal users",
    );
  }
};

// CREATE TASK - ADMIN ONLY
export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
    } = req.body;

    if (!title || !title.trim()) {
      return next(errorHandler(400, "Task title is required"));
    }

    if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
      return next(errorHandler(400, "A valid due date is required"));
    }

    if (priority && !validPriorities.includes(priority)) {
      return next(errorHandler(400, "Invalid task priority"));
    }

    await validateAssignedUsers(assignedTo);

    if (todoChecklist !== undefined && !Array.isArray(todoChecklist)) {
      return next(errorHandler(400, "todoChecklist must be an array"));
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      priority,
      dueDate,
      assignedTo,
      attachments: attachments || [],
      todoChecklist: todoChecklist || [],
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};

// GET TASKS

export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, userId, sort = "newest" } = req.query;

    // Validate status
    if (status && !validStatuses.includes(status)) {
      return next(errorHandler(400, "Invalid task status"));
    }

    // Validate priority
    if (priority && !validPriorities.includes(priority)) {
      return next(errorHandler(400, "Invalid task priority"));
    }

    // Validate sorting
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };

    if (!["newest", "oldest", "priority"].includes(sort)) {
      return next(errorHandler(400, "Invalid sort option"));
    }

    // Only admins can filter tasks by developer
    if (userId && req.user.role !== "admin") {
      return next(
        errorHandler(403, "Only admins can filter tasks by developer"),
      );
    }

    const baseFilter = {};

    if (req.user.role !== "admin") {
      baseFilter.assignedTo = req.user.id;
    } else if (userId) {
      if (!isValidId(userId)) {
        return next(errorHandler(400, "Invalid developer ID"));
      }

      const developer = await User.findOne({
        _id: userId,
        role: "user",
      }).select("_id");

      if (!developer) {
        return next(errorHandler(404, "Developer not found"));
      }

      baseFilter.assignedTo = userId;
    }

    // Apply priority filter
    if (priority) {
      baseFilter.priority = priority;
    }

    // Apply status filter
    const filter = { ...baseFilter };

    if (status) {
      filter.status = status;
    }

    // Fetch tasks
    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email profileImageUrl")
      .sort(sort === "priority" ? { createdAt: -1 } : sortOptions[sort]);

    // Custom priority sorting: High > Medium > Low
    if (sort === "priority") {
      const priorityRank = {
        High: 3,
        Medium: 2,
        Low: 1,
      };

      tasks.sort((a, b) => {
        const priorityDifference =
          priorityRank[b.priority] - priorityRank[a.priority];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        // Newest first when priorities are equal
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }

    // Format tasks
    const formattedTasks = tasks.map((task) => {
      const taskObject = task.toObject();

      taskObject.completedCount = task.todoChecklist.filter(
        (item) => item.completed,
      ).length;

      return taskObject;
    });

    // Counts reflect the selected developer and priority filter
    const [allTasks, pendingTasks, inProgressTasks, completedTasks] =
      await Promise.all([
        Task.countDocuments(baseFilter),
        Task.countDocuments({
          ...baseFilter,
          status: "Pending",
        }),
        Task.countDocuments({
          ...baseFilter,
          status: "In Progress",
        }),
        Task.countDocuments({
          ...baseFilter,
          status: "Completed",
        }),
      ]);

    return res.status(200).json({
      tasks: formattedTasks,
      statusSummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET TASK BY ID

export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl",
    );

    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }

    const currentUserId = String(req.user.id || req.user._id);

    const isAssigned = task.assignedTo.some((user) => {
      const assignedUserId = String(user?._id || user);
      return assignedUserId === currentUserId;
    });

    if (req.user.role !== "admin" && !isAssigned) {
      return next(
        errorHandler(403, "You are not authorized to view this task"),
      );
    }

    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

// UPDATE TASK - ADMIN ONLY
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return next(errorHandler(400, "Invalid task ID"));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }

    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
    } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return next(errorHandler(400, "Invalid task title"));
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (priority !== undefined) {
      if (!validPriorities.includes(priority)) {
        return next(errorHandler(400, "Invalid task priority"));
      }
      task.priority = priority;
    }

    if (dueDate !== undefined) {
      if (Number.isNaN(Date.parse(dueDate))) {
        return next(errorHandler(400, "Invalid due date"));
      }
      task.dueDate = dueDate;
    }

    if (assignedTo !== undefined) {
      await validateAssignedUsers(assignedTo);
      task.assignedTo = assignedTo;
    }

    if (attachments !== undefined) {
      if (!Array.isArray(attachments)) {
        return next(errorHandler(400, "Attachments must be an array"));
      }
      task.attachments = attachments;
    }

    if (todoChecklist !== undefined) {
      if (
        !Array.isArray(todoChecklist) ||
        todoChecklist.some(
          (item) => !item || typeof item.text !== "string" || !item.text.trim(),
        )
      ) {
        return next(errorHandler(400, "Invalid checklist"));
      }

      task.todoChecklist = todoChecklist;
      task.progress = calculateProgress(task.todoChecklist);

      task.status =
        task.progress === 100
          ? "Completed"
          : task.progress > 0
            ? "In Progress"
            : "Pending";
    }

    const updatedTask = await task.save();

    res.status(200).json({
      updatedTask,
      message: "Task updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE TASK - ADMIN ONLY
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return next(errorHandler(400, "Invalid task ID"));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }

    await task.deleteOne();

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE TASK STATUS
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return next(errorHandler(400, "Invalid task ID"));
    }

    if (!validStatuses.includes(status)) {
      return next(errorHandler(400, "Invalid task status"));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }

    if (req.user.role !== "admin" && !isAssignedToUser(task, req.user.id)) {
      return next(
        errorHandler(403, "You are not authorized to update this task"),
      );
    }

    task.status = status;

    if (status === "Completed") {
      task.todoChecklist.forEach((item) => {
        item.completed = true;
      });
    } else if (status === "Pending") {
      task.todoChecklist.forEach((item) => {
        item.completed = false;
      });
    }

    task.progress = calculateProgress(task.todoChecklist);

    await task.save();

    res.status(200).json({
      message: "Task status updated",
      task,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE TASK CHECKLIST

export const updateTaskChecklist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { todoChecklist } = req.body;

    if (!isValidId(id)) {
      return next(errorHandler(400, "Invalid task ID"));
    }

    if (!Array.isArray(todoChecklist)) {
      return next(errorHandler(400, "todoChecklist must be an array"));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }

    // Verify that the current user is assigned to this task.
    const currentUserId = String(req.user.id || req.user._id);

    const isAssigned = task.assignedTo.some(
      (user) => String(user?._id || user) === currentUserId,
    );

    if (req.user.role !== "admin" && !isAssigned) {
      return next(
        errorHandler(403, "You are not authorized to update this checklist"),
      );
    }

    if (todoChecklist.length !== task.todoChecklist.length) {
      return next(
        errorHandler(
          400,
          "Checklist items cannot be added or removed through this endpoint",
        ),
      );
    }

    // Users can change completion only, not checklist descriptions.
    for (let i = 0; i < todoChecklist.length; i++) {
      if (typeof todoChecklist[i]?.completed !== "boolean") {
        return next(errorHandler(400, "Invalid checklist completion value"));
      }
    }

    task.todoChecklist.forEach((item, index) => {
      item.completed = todoChecklist[index].completed;
    });

    task.progress = calculateProgress(task.todoChecklist);

    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }

    await task.save();

    const updatedTask = await Task.findById(id).populate(
      "assignedTo",
      "name email profileImageUrl",
    );

    return res.status(200).json({
      message: "Task checklist updated",
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN DASHBOARD DATA
export const getDashboardData = async (req, res, next) => {
  try {
    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      taskDistributionRaw,
      taskPriorityLevelRaw,
      recentTasks,
    ] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: "Pending" }),
      Task.countDocuments({ status: "Completed" }),
      Task.countDocuments({
        status: { $ne: "Completed" },
        dueDate: { $lt: new Date() },
      }),
      Task.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]),
      Task.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate createdAt"),
    ]);

    const taskDistribution = {
      Pending: 0,
      InProgress: 0,
      Completed: 0,
      All: totalTasks,
    };

    taskDistributionRaw.forEach((item) => {
      const key = item._id.replace(/\s+/g, "");
      taskDistribution[key] = item.count;
    });

    const taskPriorityLevel = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    taskPriorityLevelRaw.forEach((item) => {
      if (item._id in taskPriorityLevel) {
        taskPriorityLevel[item._id] = item.count;
      }
    });

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevel,
      },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

// USER DASHBOARD DATA
export const userDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!isValidId(userId)) {
      return next(errorHandler(400, "Invalid user ID"));
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const userFilter = {
      assignedTo: userObjectId,
    };

    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      taskDistributionRaw,
      taskPriorityLevelRaw,
      recentTasks,
    ] = await Promise.all([
      Task.countDocuments(userFilter),
      Task.countDocuments({
        ...userFilter,
        status: "Pending",
      }),
      Task.countDocuments({
        ...userFilter,
        status: "Completed",
      }),
      Task.countDocuments({
        ...userFilter,
        status: { $ne: "Completed" },
        dueDate: { $lt: new Date() },
      }),
      Task.aggregate([
        { $match: userFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        { $match: userFilter },
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]),
      Task.find(userFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate createdAt"),
    ]);

    const taskDistribution = {
      Pending: 0,
      InProgress: 0,
      Completed: 0,
      All: totalTasks,
    };

    taskDistributionRaw.forEach((item) => {
      const key = item._id.replace(/\s+/g, "");
      taskDistribution[key] = item.count;
    });

    const taskPriorityLevel = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    taskPriorityLevelRaw.forEach((item) => {
      if (item._id in taskPriorityLevel) {
        taskPriorityLevel[item._id] = item.count;
      }
    });

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevel,
      },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};
