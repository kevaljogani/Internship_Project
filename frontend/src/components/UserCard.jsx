
import React from "react";

const UserCard = ({ userInfo, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`View tasks assigned to ${userInfo?.name}`}
      className="w-full text-left p-3 bg-white rounded-xl shadow-sm border border-gray-200/70
        transition-all duration-200 ease-in-out
        hover:shadow-lg hover:border-blue-200 hover:-translate-y-1
        focus:outline-none focus:ring-2 focus:ring-blue-400
        disabled:cursor-default"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={userInfo?.profileImageUrl}
            alt={userInfo?.name || "Team member"}
            className="h-12 w-12 rounded-full object-cover border-2 border-gray-100 shrink-0"
          />

          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-800 truncate">
              {userInfo?.name}
            </p>

            <p className="text-sm text-gray-500 truncate">
              {userInfo?.email}
            </p>
          </div>
        </div>

        <span className="text-gray-400 text-lg transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <StatCard
          label="Pending"
          count={userInfo?.pendingTasks || 0}
          status="pending"
        />

        <StatCard
          label="In Progress"
          count={userInfo?.inProgressTasks || 0}
          status="in-progress"
        />

        <StatCard
          label="Completed"
          count={userInfo?.completedTasks || 0}
          status="completed"
        />
      </div>

      <p className="text-xs text-blue-600 font-medium mt-3">
        View assigned tasks →
      </p>
    </button>
  );
};

export default UserCard;

const StatCard = ({ label, count, status }) => {
  const getStatusTagColor = () => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";

      case "in-progress":
        return "bg-blue-100 text-blue-800";

      case "completed":
        return "bg-green-100 text-green-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row justify-center text-center sm:text-left text-[10px] font-medium ${getStatusTagColor()} px-2 py-2 rounded-lg gap-1`}
    >
      <span className="text-xs font-semibold">{count}</span>
      <span>{label}</span>
    </div>
  );
};
