
import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axioInstance";
import DashboardLayout from "../../components/DashboardLayout";
import { FaFileAlt } from "react-icons/fa";
import UserCard from "../../components/UserCard";
import toast from "react-hot-toast";

const ManageUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAllUsers = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/user/get-users");

      setAllUsers(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error(
        "Error fetching users:",
        error.response?.status,
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message || "Unable to load team members"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await axiosInstance.get(
        "/report/export/users",
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "user_details.xlsx");

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Report download failed:", error);
      toast.error("Unable to download user report");
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  return (
    <DashboardLayout activeMenu="Team Members">
      <div className="mt-5 mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">
            Team Members
          </h2>

          <button
            type="button"
            className="flex items-center gap-1 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-gray-800 rounded-lg transition-colors duration-200 font-medium shadow-sm hover:shadow-md cursor-pointer text-lg"
            onClick={handleDownloadReport}
          >
            <FaFileAlt className="text-lg" />
            Download Report
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading team members...
          </div>
        ) : allUsers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No team members found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {allUsers.map((user) => (
              <UserCard
                key={user._id}
                userInfo={user}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
