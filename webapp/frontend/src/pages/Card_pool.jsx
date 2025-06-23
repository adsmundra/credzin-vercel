import React, { useEffect, useState } from "react";
import axios from "axios";
import BottomNavBar from "../component/BottomNavBar";
import { apiEndpoint } from "../api";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa";

const CardPool = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [isCreating, setIsCreating] = useState(false); // New state to track creation in progress

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch all groups (pools)
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apiEndpoint}/api/v1/card/getDistinctGroupsForUser`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setGroups(res.data.data || []);
      } catch (err) {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [token]);

  const handleCreatePool = async (e) => {
    e.preventDefault();
    if (isCreating) return; // Prevent multiple submissions
    setIsCreating(true); // Disable button
    try {
      const response = await axios.post(
        `${apiEndpoint}/api/v1/card/createPool`,
        { groupName },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        setShowCreatePoolModal(false);
        setGroupName("");
        // Refresh group list
        const res = await axios.get(`${apiEndpoint}/api/v1/card/getDistinctGroupsForUser`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(res.data.data || []);
      } else {
        alert("Failed to create pool.");
      }
    } catch (error) {
      alert("An error occurred while creating the pool.");
    } finally {
      setIsCreating(false); // Re-enable button
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    
    setDeletingGroup(groupId);
    try {
      const response = await axios.delete(
        `${apiEndpoint}/api/v1/card/deletePool/${groupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        // Remove the group from local state
        setGroups(groups.filter(group => group._id !== groupId));
      } else {
        alert("Failed to delete group.");
      }
    } catch (error) {
      alert("An error occurred while deleting the group.");
    } finally {
      setDeletingGroup(null);
    }
  };

  // When a group is clicked, go to group detail page
  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-[#111518] text-white font-sans px-4 py-6 pt-20">
      <h2 className="text-2xl font-bold mb-6 text-center">Card Pools</h2>
      <div className="flex justify-center mb-6">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          onClick={() => setShowCreatePoolModal(true)}
        >
          Create a New Pool
        </button>
      </div>

      {/* List of Groups */}
      <div className="mb-10">
        {/* <h3 className="text-xl font-semibold mb-3">All Groups</h3> */}
        {loading ? (
          <div className="text-[#9cabba]">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-[#9cabba]">No Pools Found.</div>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li
                key={group._id}
                className="bg-[#23272f] rounded-lg p-4 hover:bg-[#2b3139] transition relative group"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => handleGroupClick(group._id)}
                >
                  <div className="font-semibold text-lg">{group.name}</div>
                  <div className="text-xs text-[#6c7a89]">
                    {/* Members: {group.members?.length || 0} */}
                  </div>
                </div>
                <button
                  className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteGroup(group._id)}
                  disabled={deletingGroup === group._id}
                >
                  {deletingGroup === group._id ? (
                    "Deleting..."
                  ) : (
                    <FaTrashAlt className="text-red-500 hover:text-red-600" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Pool Modal */}
      {showCreatePoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#23272f] rounded-lg p-6 w-full max-w-md mx-auto relative">
            <button
              className="absolute top-2 right-3 text-white text-2xl font-bold"
              onClick={() => {
                setShowCreatePoolModal(false);
                setGroupName("");
              }}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">
              Create New Pool
            </h3>
            <input
              type="text"
              placeholder="Enter your Pool Name e.g. travel_pool"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#181c22] text-white mb-4 border border-[#3a3f45] focus:outline-none"
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition w-full"
              onClick={handleCreatePool}
              disabled={!groupName || isCreating} // Disable when creating
            >
              {isCreating ? "Creating..." : "Create a Pool"} 
            </button>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
};

export default CardPool;
