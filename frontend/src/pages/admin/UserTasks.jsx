import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaFilter } from "react-icons/fa";
import DashboardLayout from "../../components/DashboardLayout";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import TaskCard from "../../components/TaskCard";
import axiosInstance from "../../utils/axioInstance";
import toast from "react-hot-toast";

const UserTasks = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState(location.state || null);
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);

  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/user/get-users");

      const users = Array.isArray(response.data) ? response.data : [];

      const selectedUser = users.find((user) => user._id === userId);

      if (!selectedUser) {
        toast.error("Developer not found");
        navigate("/admin/users");
        return;
      }

      setUserInfo(selectedUser);
    } catch (error) {
      console.error("Error fetching developer:", error);
      toast.error("Unable to load developer details");
    }
  };

  const getUserTasks = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/tasks", {
        params: {
          userId,
          status: filterStatus === "All" ? "" : filterStatus,
          priority: filterPriority === "All" ? "" : filterPriority,
          sort: sortBy,
        },
      });

      const tasks = Array.isArray(response.data?.tasks)
        ? response.data.tasks
        : [];

      setAllTasks(tasks);

      const summary = response.data?.statusSummary || {};

      setTabs([
        { label: "All", count: summary.all || 0 },
        { label: "Pending", count: summary.pendingTasks || 0 },
        { label: "In Progress", count: summary.inProgressTasks || 0 },
        { label: "Completed", count: summary.completedTasks || 0 },
      ]);
    } catch (error) {
      console.error("Error fetching developer tasks:", error);

      toast.error(
        error.response?.data?.message || "Unable to load developer tasks",
      );

      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    navigate("/admin/create-task", {
      state: { taskId: task._id },
    });
  };

  useEffect(() => {
    if (!location.state?.userName && !location.state?.name) {
      getUserInfo();
    }
  }, [userId]);

  useEffect(() => {
    getUserTasks();
  }, [userId, filterStatus, filterPriority, sortBy]);

  return (
    <DashboardLayout activeMenu="Team Members">
      <div className="my-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              aria-label="Back to team members"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              {userInfo?.profileImageUrl && (
                <img
                  src={userInfo.profileImageUrl}
                  alt={userInfo.userName || userInfo.name || "Developer"}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
              )}

              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
                  {userInfo?.userName || userInfo?.name || "Developer Tasks"}
                </h2>

                {userInfo?.userEmail || userInfo?.email ? (
                  <p className="text-sm text-gray-500 truncate">
                    {userInfo.userEmail || userInfo.email}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Assigned tasks</p>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {tabs[0]?.count || 0} total tasks
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-gray-500" />
            <h3 className="font-semibold text-gray-700">
              Filter and Sort Tasks
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Priority
              </label>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Sort By
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="overflow-x-auto mb-4">
          <TaskStatusTabs
            tabs={tabs}
            activeTab={filterStatus}
            setActiveTab={setFilterStatus}
          />
        </div>

        {/* Tasks */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading developer tasks...
          </div>
        ) : allTasks.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl text-center py-14 px-4">
            <h3 className="text-lg font-semibold text-gray-700">
              No tasks found
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              This developer has no tasks matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {allTasks.map((item) => (
              <TaskCard
                key={item._id}
                title={item.title}
                description={item.description}
                priority={item.priority}
                status={item.status}
                progress={item.progress}
                createdAt={item.createdAt}
                updatedAt={item.updatedAt}
                dueDate={item.dueDate}
                assignedTo={item.assignedTo || []}
                attachmentCount={item.attachments?.length || 0}
                completedTodoCount={
                  item.completedCount ??
                  item.todoChecklist?.filter((todo) => todo.completed).length ??
                  0
                }
                todoChecklist={item.todoChecklist || []}
                onClick={() => handleTaskClick(item)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserTasks;
