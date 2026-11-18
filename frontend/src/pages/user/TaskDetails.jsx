
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../utils/axioInstance";
import DashboardLayout from "../../components/DashboardLayout";
import moment from "moment";
import AvatarGroup from "../../components/AvatarGroup";
import { FaExternalLinkAlt } from "react-icons/fa";
import toast from "react-hot-toast";

const TaskDetails = () => {
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingIndex, setUpdatingIndex] = useState(null);

  const getStatusTagColor = (status) => {
    switch (status) {
      case "In Progress":
        return "text-cyan-600 bg-cyan-50 border border-cyan-200";

      case "Completed":
        return "text-green-600 bg-green-50 border border-green-200";

      default:
        return "text-violet-600 bg-violet-50 border border-violet-200";
    }
  };

  // Fetch task details
  const getTaskDetailsById = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(`/tasks/${id}`);

      setTask(response.data);
    } catch (error) {
      console.error("Error fetching task details:", error);

      const message =
        error.response?.data?.message ||
        "Unable to load task details.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Update checklist
  const updateTodoChecklist = async (index) => {
    if (!task || updatingIndex !== null) return;

    const previousTask = task;

    const updatedChecklist = task.todoChecklist.map((item, itemIndex) =>
      itemIndex === index
        ? { ...item, completed: !item.completed }
        : item
    );

    // Update UI immediately
    setTask({
      ...task,
      todoChecklist: updatedChecklist,
    });

    try {
      setUpdatingIndex(index);

      const response = await axiosInstance.put(`/tasks/${id}/todo`, {
        todoChecklist: updatedChecklist,
      });

      if (response.data?.task) {
        setTask(response.data.task);
      } else {
        await getTaskDetailsById();
      }
    } catch (error) {
      console.error("Error updating checklist:", error);

      // Revert UI if backend update fails
      setTask(previousTask);

      toast.error(
        error.response?.data?.message ||
          "Unable to update checklist. Please try again."
      );
    } finally {
      setUpdatingIndex(null);
    }
  };

  // Open attachment link safely
  const handleLinkClick = (link) => {
    if (!link || typeof link !== "string") return;

    const normalizedLink = /^https?:\/\//i.test(link)
      ? link
      : `https://${link}`;

    try {
      const url = new URL(normalizedLink);

      if (!["http:", "https:"].includes(url.protocol)) {
        toast.error("Invalid attachment link.");
        return;
      }

      window.open(url.href, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Invalid attachment link.");
    }
  };

  useEffect(() => {
    if (id) {
      getTaskDetailsById();
    }
  }, [id]);

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className="mt-5 px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">
            Loading task details...
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-xl p-6">
            <p className="text-red-600">{error}</p>

            <button
              type="button"
              onClick={getTaskDetailsById}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && !task && (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">
            Task not found.
          </div>
        )}

        {!loading && task && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
            <div className="md:col-span-3 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">

                {/* Task title and status */}
                <div className="flex flex-col space-y-3">
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                    {task.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusTagColor(
                        task.status
                      )}`}
                    >
                      {task.status}

                      <span className="ml-1.5 w-2 h-2 rounded-full bg-current opacity-80"></span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4">
                  <InfoBox
                    label="Description"
                    value={task.description || "No description provided."}
                  />
                </div>

                {/* Task information */}
                <div className="grid grid-cols-12 gap-4 mt-4">
                  <div className="col-span-6 md:col-span-4">
                    <InfoBox
                      label="Priority"
                      value={task.priority}
                    />
                  </div>

                  <div className="col-span-6 md:col-span-4">
                    <InfoBox
                      label="Due Date"
                      value={
                        task.dueDate
                          ? moment(task.dueDate).format("Do MMM YYYY")
                          : "N/A"
                      }
                    />
                  </div>

                  <div className="col-span-6 md:col-span-4">
                    <label className="text-xs font-medium text-slate-500">
                      Assigned To
                    </label>

                    <AvatarGroup
                      avatars={
                        task.assignedTo?.map(
                          (item) => item?.profileImageUrl
                        ).filter(Boolean) || []
                      }
                      maxVisible={5}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-500">
                      Todo Checklist
                    </label>

                    <span className="text-xs text-gray-500">
                      {task.todoChecklist?.filter(
                        (item) => item.completed
                      ).length || 0}
                      {" / "}
                      {task.todoChecklist?.length || 0} completed
                    </span>
                  </div>

                  {task.todoChecklist?.length > 0 ? (
                    task.todoChecklist.map((item, index) => (
                      <TodoCheckList
                        key={item._id || `todo_${index}`}
                        text={item.text}
                        isChecked={item.completed}
                        disabled={updatingIndex !== null}
                        onChange={() => updateTodoChecklist(index)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-3">
                      No checklist items available.
                    </p>
                  )}
                </div>

                {/* Attachments */}
                {task.attachments?.length > 0 && (
                  <div className="mt-4">
                    <label className="text-xs font-medium text-slate-500">
                      Attachments
                    </label>

                    {task.attachments.map((link, index) => (
                      <Attachment
                        key={`link_${index}`}
                        link={link}
                        index={index}
                        onClick={() => handleLinkClick(link)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TaskDetails;

// Reusable information display
const InfoBox = ({ label, value }) => {
  return (
    <>
      <label className="text-xs font-medium text-slate-500">
        {label}
      </label>

      <p className="text-[13px] md:text-sm font-medium text-gray-700 mt-0.5">
        {value}
      </p>
    </>
  );
};

// Checklist item
const TodoCheckList = ({
  text,
  isChecked,
  onChange,
  disabled,
}) => {
  return (
    <div className="flex items-center gap-3 p-3">
      <input
        type="checkbox"
        checked={Boolean(isChecked)}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 text-primary bg-gray-100 border border-gray-300 rounded outline-none cursor-pointer disabled:cursor-not-allowed"
      />

      <p
        className={`text-sm ${
          isChecked
            ? "text-gray-400 line-through"
            : "text-gray-800"
        }`}
      >
        {text}
      </p>
    </div>
  );
};

// Attachment item
const Attachment = ({ link, index, onClick }) => {
  return (
    <div
      className="flex justify-between items-center bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-3 mt-2 cursor-pointer hover:bg-gray-100"
      onClick={onClick}
    >
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <span className="text-xs text-gray-400 font-semibold mr-2">
          {index < 9 ? `0${index + 1}` : index + 1}
        </span>

        <p className="text-xs text-black truncate">
          {link}
        </p>
      </div>

      <FaExternalLinkAlt className="text-gray-500 ml-3 flex-shrink-0" />
    </div>
  );
};
