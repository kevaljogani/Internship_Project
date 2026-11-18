
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { MdDelete } from "react-icons/md";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import SelectedUsers from "../../components/SelectedUsers";
import TodoListInput from "../../components/TodoListInput";
import AddAttachmentsInput from "../../components/AddAttachmentsInput";
import axiosInstance from "../../utils/axioInstance";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import DeleteAlert from "../../components/DeleteAlert";

const getInitialTaskData = () => ({
  title: "",
  description: "",
  priority: "Low",
  dueDate: null,
  assignedTo: [],
  todoChecklist: [],
  attachments: [],
});

const CreateTask = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const taskId = location.state?.taskId;

  const [taskData, setTaskData] = useState(getInitialTaskData);
  const [currentTask, setCurrentTask] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingTask, setFetchingTask] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

  const handleValueChange = (key, value) => {
    setTaskData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Fetch existing task when editing
  const getTaskDetailsById = async () => {
    try {
      setFetchingTask(true);

      const response = await axiosInstance.get(`/tasks/${taskId}`);

      const task = response.data;

      setCurrentTask(task);

      setTaskData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "Low",
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        assignedTo: (task.assignedTo || []).map((user) =>
          typeof user === "string" ? user : user._id
        ),
        todoChecklist: (task.todoChecklist || []).map(
          (item) => item.text
        ),
        attachments: task.attachments || [],
      });
    } catch (error) {
      console.error("Error fetching task:", error);

      toast.error(
        error.response?.data?.message || "Unable to load task"
      );

      navigate("/admin/tasks");
    } finally {
      setFetchingTask(false);
    }
  };

  // Create or update task
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!taskData.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!taskData.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (
      !taskData.dueDate ||
      Number.isNaN(new Date(taskData.dueDate).getTime())
    ) {
      setError("A valid due date is required.");
      return;
    }

    if (taskData.assignedTo.length === 0) {
      setError("Assign the task to at least one team member.");
      return;
    }

    if (taskData.todoChecklist.length === 0) {
      setError("Add at least one checklist item.");
      return;
    }

    // Ask for confirmation before updating an existing task
    if (taskId) {
      const confirmed = window.confirm(
        "Are you sure you want to update this task?"
      );

      if (!confirmed) {
        return;
      }
    }

    const todoChecklist = taskData.todoChecklist.map((item) => {
      const previousItem = currentTask?.todoChecklist?.find(
        (todo) => todo.text === item
      );

      return {
        text: item,
        completed: previousItem?.completed || false,
      };
    });

    const payload = {
      title: taskData.title.trim(),
      description: taskData.description.trim(),
      priority: taskData.priority,
      dueDate: new Date(taskData.dueDate).toISOString(),
      assignedTo: taskData.assignedTo,
      todoChecklist,
      attachments: taskData.attachments,
    };

    try {
      setLoading(true);

      if (taskId) {
        await axiosInstance.put(`/tasks/${taskId}`, payload);

        toast.success("Task updated successfully!");
      } else {
        await axiosInstance.post("/tasks/create", payload);

        toast.success("Task created successfully!");
      }

      navigate("/admin/tasks");
    } catch (error) {
      console.error("Task submission failed:", error);

      const message =
        error.response?.data?.message ||
        "Unable to save task. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const deleteTask = async () => {
    try {
      await axiosInstance.delete(`/tasks/${taskId}`);

      setOpenDeleteAlert(false);

      toast.success("Task deleted successfully!");

      navigate("/admin/tasks");
    } catch (error) {
      console.error("Error deleting task:", error);

      toast.error(
        error.response?.data?.message || "Unable to delete task"
      );
    }
  };

  useEffect(() => {
    if (taskId) {
      getTaskDetailsById();
    }
  }, [taskId]);

  if (fetchingTask) {
    return (
      <DashboardLayout activeMenu="Create Task">
        <div className="p-6 text-center text-gray-500">
          Loading task details...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {taskId ? "Update Task" : "Create New Task"}
            </h2>

            {taskId && (
              <button
                type="button"
                disabled={loading}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                onClick={() => setOpenDeleteAlert(true)}
              >
                <MdDelete className="text-lg" />
                Delete Task
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">

              {/* Task title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter task title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={taskData.title}
                  onChange={(e) =>
                    handleValueChange("title", e.target.value)
                  }
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  placeholder="Enter task description"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={taskData.description}
                  onChange={(e) =>
                    handleValueChange("description", e.target.value)
                  }
                />
              </div>

              {/* Priority and due date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>

                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={taskData.priority}
                    onChange={(e) =>
                      handleValueChange("priority", e.target.value)
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>

                  <DatePicker
                    selected={taskData.dueDate}
                    onChange={(date) =>
                      handleValueChange("dueDate", date)
                    }
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select due date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Assign users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>

                <SelectedUsers
                  selectedUser={taskData.assignedTo}
                  setSelectedUser={(value) =>
                    handleValueChange("assignedTo", value)
                  }
                />
              </div>

              {/* Checklist */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TODO Checklist
                </label>

                <TodoListInput
                  todoList={taskData.todoChecklist}
                  setTodoList={(value) =>
                    handleValueChange("todoChecklist", value)
                  }
                />
              </div>

              {/* Attachments */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Attachments
                </label>

                <AddAttachmentsInput
                  attachments={taskData.attachments}
                  setAttachments={(value) =>
                    handleValueChange("attachments", value)
                  }
                />
              </div>

              {/* Submit and Cancel */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-7">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => navigate("/admin/tasks")}
                  className="px-5 py-3 bg-gray-200 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-300 cursor-pointer w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 bg-green-500 border border-green-300 rounded-md text-white hover:bg-green-700 cursor-pointer w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "PLEASE WAIT..."
                    : taskId
                      ? "UPDATE TASK"
                      : "CREATE TASK"}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>

      {/* Delete confirmation */}
      <Modal
        isOpen={openDeleteAlert}
        onClose={() => setOpenDeleteAlert(false)}
        title="Delete Task"
      >
        <DeleteAlert
          content="Are you sure you want to delete this task?"
          onDelete={deleteTask}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default CreateTask;
