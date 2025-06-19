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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [userFound, setUserFound] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(null);

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
        setShowSearchModal(true);
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
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setUserFound(false);
    setSearchResult(null);

    try {
      const response = await axios.post(
        `${apiEndpoint}/api/v1/auth/findbycontact`,
        { searchContact },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { status, user } = response.data;
      if (status && user) {
        setUserFound(true);
        setSearchResult(user);
      } else {
        alert("Contact not found or inactive.");
      }
    } catch (error) {
      alert("An error occurred while searching.");
    }
    setSearching(false);
  };

  const handleAddToPool = async () => {
    try {
      const response = await axios.post(
        `${apiEndpoint}/api/v1/card/addUserToPool`,
        { searchContact },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        setShowSearchModal(false);
        setSearchContact("");
        setSearchResult(null);
        setUserFound(false);
      } else {
        alert("Failed to add user to pool.");
      }
    } catch (error) {
      alert("An error occurred while adding to pool.");
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
    // Implement navigation to group detail if needed
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
          Create Pool
        </button>
      </div>

      {/* List of Groups */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-3">All Groups</h3>
        {loading ? (
          <div className="text-[#9cabba]">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-[#9cabba]">No groups found.</div>
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
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#181c22] text-white mb-4 border border-[#3a3f45] focus:outline-none"
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition w-full"
              onClick={handleCreatePool}
              disabled={!groupName}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Search Contact Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#23272f] rounded-lg p-6 w-full max-w-md mx-auto relative">
            <button
              className="absolute top-2 right-3 text-white text-2xl font-bold"
              onClick={() => {
                setShowSearchModal(false);
                setSearchContact("");
                setSearchResult(null);
                setUserFound(false);
              }}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">
              Search by Contact Number
            </h3>
            <input
              type="text"
              placeholder="Enter contact number"
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#181c22] text-white mb-4 border border-[#3a3f45] focus:outline-none"
              disabled={userFound}
            />
            {userFound ? (
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition w-full"
                onClick={handleAddToPool}
              >
                Add to Pool
              </button>
            ) : (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition w-full"
                onClick={handleSearch}
                disabled={searching || !searchContact}
              >
                {searching ? "Searching..." : "Search"}
              </button>
            )}
            {searchResult && (
              <div className="mt-6 bg-[#1b2127] p-4 rounded-lg">
                <div className="font-medium text-lg">
                  {searchResult.user_name}
                </div>
                <div className="text-sm text-[#6c7a89] mb-2">
                  {searchResult.contact}
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchResult.cards?.map((card, idx) => (
                    <img
                      key={idx}
                      src={card.image_url || "https://via.placeholder.com/60x40"}
                      alt={card.card_name}
                      className="object-contain rounded w-16 h-10"
                      title={card.card_name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
};

export default CardPool;