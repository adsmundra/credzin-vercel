import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import BottomNavBar from "../component/BottomNavBar";
import { apiEndpoint } from "../api";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa";
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';

const CardPool = () => {
  const [groups, setGroups] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [groupInfo, setGroupInfo] = useState([]);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Helper function to find group info by group ID
  const getGroupInfoById = (groupId) => {
    return groupInfo.find(info => info.groupId === groupId);
  };

  // Fetch all data (no sessionStorage, always fresh)
  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [groupsRes, invitationsRes, groupInfoRes] = await Promise.all([
        axios.get(`${apiEndpoint}/api/v1/card/getDistinctGroupsForUser`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiEndpoint}/api/v1/group/invitation/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiEndpoint}/api/v1/card/getAllUserCard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setGroups(groupsRes.data.data || []);
      setPendingInvitations(invitationsRes.data.data || []);
      setGroupInfo(groupInfoRes.data.data || []);
    } catch (err) {
      setGroups([]);
      setPendingInvitations([]);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData(true); // show loading on first load
  }, [fetchData]);

  // Polling for real-time updates (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false); // don't show loading on polling
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCreatePool = useCallback(async (e) => {
    e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
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
        await fetchData();
      } else {
        alert("Failed to create pool.");
      }
    } catch (error) {
      alert("An error occurred while creating the pool.");
    } finally {
      setIsCreating(false);
    }
  }, [groupName, isCreating, token, fetchData]);

  // Remove group from state
  const handleDeleteGroup = useCallback(async (groupId) => {
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
        await fetchData();
      } else {
        alert("Failed to delete group.");
      }
    } catch (error) {
      alert("An error occurred while deleting the group.");
    } finally {
      setDeletingGroup(null);
    }
  }, [token, fetchData]);

  const handleGroupClick = useCallback((groupId) => {
    navigate(`/group/${groupId}`);
    console.log('groupinfo', groupInfo);
    console.log("Groups", groups);
  }, [navigate, groupInfo, groups]);

  return (
    <div className="min-h-screen bg-[#111518] text-white font-sans px-4 py-6 pt-20">
      <h2 className="text-2xl font-bold mb-6 text-center">Card Pools</h2>

      {pendingInvitations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">Pending Invitations</h3>
          <div className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <div key={invitation._id} className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                <div className="text-sm">
                  <span className="font-medium text-yellow-300">
                    {invitation.invitedBy?.firstName} {invitation.invitedBy?.lastName}
                  </span>
                  <span className="text-gray-300"> invited you to join </span>
                  <span className="font-medium text-yellow-300">{invitation.groupId?.name}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Check your notifications to accept or reject
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        {firstLoad && loading ? (
          <div className="text-[#9cabba]">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-[#9cabba]">No Pools Found.</div>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => {
              // Find the specific group info for this group
              const currentGroupInfo = getGroupInfoById(group._id);
              return (
                <li
                  key={group._id}
                  className="bg-[#23272f] rounded-lg p-4 hover:bg-[#2b3139] transition relative group"
                >
                  <div className="cursor-pointer" onClick={() => handleGroupClick(group._id)}>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-lg">{group.name}</div>
                      <AvatarGroup
                        max={4}
                        sx={{
                          '& .MuiAvatar-root': {
                            width: '24px',
                            height: '24px',
                            fontSize: '0.75rem',
                          },
                        }}
                      >
                        {currentGroupInfo?.members?.map((member) => (
                          <Avatar
                            key={`${member.group_id}-${member.user_id?._id || member.user_id}`}
                            alt={member.name || member.user_id?.firstName || 'User'}
                            src={
                              member.user_id?.profilePic
                                ? `http://localhost:5000/${member.user_id.profilePic}`
                                : undefined
                            }
                          >
                            {!member.user_id?.profilePic &&
                              (member.user_id?.firstName?.[0] || member.name?.[0] || 'U')
                            }
                          </Avatar>
                        )) || []}
                      </AvatarGroup>
                    </div>
                    <div className="text-xs text-[#6c7a89]">
                      Members: {currentGroupInfo?.members?.length || 0}
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
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal */}
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
              disabled={!groupName || isCreating}
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








