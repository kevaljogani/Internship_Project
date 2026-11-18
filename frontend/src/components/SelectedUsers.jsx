import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axioInstance";
import { FaUsers } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import Modal from "./Modal";
import toast from "react-hot-toast";

const SelectedUsers = ({ selectedUser = [], setSelectedUser }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedUser, setTempSelectedUser] = useState([]);
  const [loading, setLoading] = useState(false);

  const MAX_VISIBLE = 5;

  const getAllUsers = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/user/get-users");

      setAllUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        "Error fetching users:",
        error.response?.status,
        error.response?.data || error.message,
      );

      toast.error(error.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setTempSelectedUser([...selectedUser]);
    setIsModalOpen(true);
  };

  const toggleUserSelection = (userId) => {
    setTempSelectedUser((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleAssign = () => {
    setSelectedUser(tempSelectedUser);
    setIsModalOpen(false);
  };

  const selectedUsers = allUsers.filter((user) =>
    selectedUser.includes(user._id),
  );

  const visibleUsers = selectedUsers.slice(0, MAX_VISIBLE);
  const remainingCount = Math.max(selectedUsers.length - MAX_VISIBLE, 0);

  useEffect(() => {
    getAllUsers();
  }, []);

  return (
    <div className="space-y-3 mt-2">
      {/* Assigned members */}
      <div className="flex flex-wrap items-center gap-3">
        {selectedUsers.length > 0 && (
          <div className="flex items-center">
            {visibleUsers.map((user, index) => (
              <div
                key={user._id}
                title={user.name || user.email || "Developer"}
                className={`relative ${index !== 0 ? "-ml-3" : ""}`}
                style={{ zIndex: visibleUsers.length - index }}
              >
                <img
                  src={user.profileImageUrl || "/default-avatar.png"}
                  alt={user.name || "Developer"}
                  className="w-10 h-10 rounded-full object-cover border-[3px] border-white shadow-sm hover:scale-110 hover:z-50 transition-transform duration-200"
                />
              </div>
            ))}

            {remainingCount > 0 && (
              <div
                title={`${remainingCount} more assigned developer(s)`}
                className="w-10 h-10 -ml-3 rounded-full bg-gray-200 border-[3px] border-white flex items-center justify-center text-xs font-semibold text-gray-700 shadow-sm"
                style={{ zIndex: 0 }}
              >
                +{remainingCount}
              </div>
            )}
          </div>
        )}

        {/* Always visible, even when members are assigned */}
        <button
          onClick={openModal}
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-200"
        >
          {selectedUsers.length > 0 ? (
            <>
              <FiPlus className="text-base" />
              Manage Members
            </>
          ) : (
            <>
              <FaUsers className="text-base" />
              Add Members
            </>
          )}
        </button>
      </div>

      {selectedUsers.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedUsers.length} developer
          {selectedUsers.length !== 1 ? "s" : ""} assigned
        </p>
      )}

      {/* Member selection modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Manage Team Members"
      >
        <div className="space-y-4 h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading users...</p>
          ) : allUsers.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No users available. Please check your team members.
            </p>
          ) : (
            allUsers.map((user) => {
              const isSelected = tempSelectedUser.includes(user._id);

              return (
                <label
                  key={user._id}
                  className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                    isSelected
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <img
                    src={user.profileImageUrl || "/default-avatar.png"}
                    alt={user.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {user.name}
                    </p>

                    <p className="text-[13px] text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleUserSelection(user._id)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </label>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors duration-200"
            onClick={() => setIsModalOpen(false)}
          >
            CANCEL
          </button>

          <button
            type="button"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
            onClick={handleAssign}
          >
            SAVE MEMBERS
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SelectedUsers;
