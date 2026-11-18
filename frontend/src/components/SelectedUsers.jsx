
import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axioInstance";
import { FaUsers } from "react-icons/fa";
import Modal from "./Modal";
import AvatarGroup from "./AvatarGroup";
import toast from "react-hot-toast";

const SelectedUsers = ({ selectedUser = [], setSelectedUser }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedUser, setTempSelectedUser] = useState([]);
  const [loading, setLoading] = useState(false);

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
        error.response?.data?.message || "Unable to load users"
      );
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
        : [...prev, userId]
    );
  };

  const handleAssign = () => {
    setSelectedUser(tempSelectedUser);
    setIsModalOpen(false);
  };

  const selectedUserAvatars = allUsers
    .filter((user) => selectedUser.includes(user._id))
    .map((user) => user.profileImageUrl);

  useEffect(() => {
    getAllUsers();
  }, []);

  return (
    <div className="space-y-4 mt-2">
      {selectedUserAvatars.length === 0 ? (
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 shadow-md"
          type="button"
        >
          <FaUsers className="text-lg" />
          Add Members
        </button>
      ) : (
        <div className="cursor-pointer" onClick={openModal}>
          <AvatarGroup
            avatars={selectedUserAvatars}
            maxVisible={3}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Users"
      >
        <div className="space-y-4 h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="text-center py-8 text-gray-500">
              Loading users...
            </p>
          ) : allUsers.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No users available. Please check your team members.
            </p>
          ) : (
            allUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-4 p-3 border-b border-gray-300"
              >
                <img
                  src={user.profileImageUrl || "/default-avatar.png"}
                  alt={user.name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {user.name}
                  </p>

                  <p className="text-[13px] text-gray-500">
                    {user.email}
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={tempSelectedUser.includes(user._id)}
                  onChange={() => toggleUserSelection(user._id)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none"
                />
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-md transition-colors duration-200"
            onClick={() => setIsModalOpen(false)}
          >
            CANCEL
          </button>

          <button
            type="button"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 disabled:opacity-50"
            onClick={handleAssign}
          >
            DONE
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SelectedUsers;
