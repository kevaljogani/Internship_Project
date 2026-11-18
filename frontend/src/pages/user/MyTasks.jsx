
import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axioInstance";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import TaskCard from "../../components/TaskCard";
import toast from "react-hot-toast";

const MyTask = () => {
  const [allTasks, setAllTasks] = useState([]);

  const [tabs, setTabs] = useState([
    { label: "All", count: 0 },
    { label: "Pending", count: 0 },
    { label: "In Progress", count: 0 },
    { label: "Completed", count: 0 },
  ]);

  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const getAllTasks = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/tasks", {
        params: {
          status: filterStatus === "All" ? "" : filterStatus,
        },
      });

      const tasks = response.data?.tasks || [];
      const statusSummary = response.data?.statusSummary || {};

      setAllTasks(tasks);

      setTabs([
        { label: "All", count: statusSummary.all || 0 },
        { label: "Pending", count: statusSummary.pendingTasks || 0 },
        {
          label: "In Progress",
          count: statusSummary.inProgressTasks || 0,
        },
        {
          label: "Completed",
          count: statusSummary.completedTasks || 0,
        },
      ]);
    } catch (error) {
      console.error("Error fetching tasks:", error);

      toast.error(
        error.response?.data?.message || "Unable to load your tasks."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (taskId) => {
    navigate(`/user/task-details/${taskId}`);
  };

  useEffect(() => {
    getAllTasks();
  }, [filterStatus]);

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className="my-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            My Tasks
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <TaskStatusTabs
              tabs={tabs}
              activeTab={filterStatus}
              setActiveTab={setFilterStatus}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading your tasks...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {allTasks.length > 0 ? (
              allTasks.map((item) => {
                const checklist = item.todoChecklist || [];

                const completedTodoCount = checklist.filter(
                  (todo) => todo.completed
                ).length;

                return (
                  <TaskCard
                    key={item._id}
                    title={item.title}
                    description={item.description}
                    priority={item.priority}
                    status={item.status}
                    progress={item.progress}
                    createdAt={item.createdAt}
                    dueDate={item.dueDate}
                    assignedTo={
                      item.assignedTo
                        ?.map((user) => user.profileImageUrl)
                        .filter(Boolean) || []
                    }
                    attachmentCount={item.attachments?.length || 0}
                    completedTodoCount={completedTodoCount}
                    todoChecklist={checklist}
                    onClick={() => handleClick(item._id)}
                  />
                );
              })
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">
                  No tasks found.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyTask;
