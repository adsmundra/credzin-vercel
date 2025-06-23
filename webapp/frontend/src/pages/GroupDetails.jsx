// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useParams, useNavigate } from "react-router-dom";
// import { apiEndpoint } from "../api";
// import { motion, AnimatePresence } from "framer-motion";
// import BottomNavBar from "../component/BottomNavBar";
// import { jwtDecode } from "jwt-decode";
// import { FaTrash } from "react-icons/fa";

// const GroupDetails = () => {
//   const { groupId } = useParams();
//   const navigate = useNavigate();

//   const [group, setGroup] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showAddMemberModal, setShowAddMemberModal] = useState(false);
//   const [searchContact, setSearchContact] = useState("");
//   const [searching, setSearching] = useState(false);
//   const [userFound, setUserFound] = useState(false);
//   const [searchResult, setSearchResult] = useState(null);
//   const [adding, setAdding] = useState(false);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState(null);

//   const token = localStorage.getItem("token");

//   const fetchGroup = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get(
//         `${apiEndpoint}/api/v1/card/getGroupWithMembersAndCards/${groupId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setGroup(res.data);

//       if (token) {
//         try {
//           const decodedToken = jwtDecode(token);
//           const userId = decodedToken.userId;
//           setCurrentUserId(userId);
//           setIsAdmin(res.data.adminId === userId);
//         } catch (decodeError) {
//           console.error("Error decoding token:", decodeError);
//           setIsAdmin(false);
//         }
//       }
//     } catch (err) {
//       setGroup(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchGroup();
//   }, [groupId, token]);

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     setSearching(true);
//     setUserFound(false);
//     setSearchResult(null);

//     try {
//       const response = await axios.post(
//         `${apiEndpoint}/api/v1/auth/findbycontact`,
//         { searchContact },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const { status, user } = response.data;
//       if (status && user) {
//         setUserFound(true);
//         setSearchResult(user);
//       } else {
//         alert("Contact not found or inactive.");
//       }
//     } catch (error) {
//       alert("Error during search.");
//     }
//     setSearching(false);
//   };

//   const handleAddToGroup = async () => {
//     setAdding(true);
//     try {
//       await axios.post(
//         `${apiEndpoint}/api/v1/card/addUserToPool`,
//         { searchContact, groupId },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       alert("User added to group!");
//       setShowAddMemberModal(false);
//       setSearchContact("");
//       setSearchResult(null);
//       setUserFound(false);
//       await fetchGroup();
//     } catch (error) {
//       alert("Error adding user to group.");
//     }
//     setAdding(false);
//   };

//   const handleRemoveMember = async (memberId) => {
//     if (memberId === currentUserId) {
//       alert("Admins cannot remove themselves. Use 'Leave Group' instead.");
//       return;
//     }
//     if (window.confirm("Are you sure you want to remove this member?")) {
//       try {
//         await axios.post(
//           `${apiEndpoint}/api/v1/card/removeUserFromPool`,
//           { groupId, memberId: memberId },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         alert("Member removed from group!");
//         await fetchGroup();
//       } catch (error) {
//         alert("Error removing member from group.");
//       }
//     }
//   };

//   const handleLeaveGroup = async () => {
//     if (window.confirm("Are you sure you want to leave this group?")) {
//       try {
//         await axios.post(
//           `${apiEndpoint}/api/v1/card/removeUserFromPool`,
//           { groupId },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         alert("You have left the group!");
//         navigate("/groups");
//       } catch (error) {
//         alert("Error leaving the group.");
//       }
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#111518] text-white px-4 py-6 pt-20">
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(-1)}
//           className="text-blue-400 hover:underline"
//         >
//           ← Back
//         </button>
//         {isAdmin && (
//           <button
//             onClick={() => setShowAddMemberModal(true)}
//             className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-all duration-200"
//           >
//             Add Member
//           </button>
//         )}
//       </div>

//       {/* Modal */}
//       <AnimatePresence>
//         {showAddMemberModal && (
//           <motion.div
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <motion.div
//               className="bg-[#23272f] rounded-lg p-6 w-full max-w-md mx-auto relative"
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//             >
//               <button
//                 className="absolute top-2 right-3 text-white text-2xl"
//                 onClick={() => {
//                   setShowAddMemberModal(false);
//                   setSearchContact("");
//                   setSearchResult(null);
//                   setUserFound(false);
//                 }}
//               >
//                 ×
//               </button>
//               <h3 className="text-lg font-semibold mb-4 text-blue-300">
//                 Add Member by Contact Number
//               </h3>
//               <form onSubmit={handleSearch}>
//                 <input
//                   type="text"
//                   placeholder="Enter contact number"
//                   value={searchContact}
//                   onChange={(e) => setSearchContact(e.target.value)}
//                   className="w-full px-3 py-2 rounded bg-[#181c22] text-white mb-4 border border-[#3a3f45]"
//                   disabled={userFound}
//                 />
//                 <button
//                   type="submit"
//                   className={`w-full py-2 px-4 rounded font-semibold transition ${
//                     userFound
//                       ? "bg-green-600 hover:bg-green-700"
//                       : "bg-blue-600 hover:bg-blue-700"
//                   }`}
//                   onClick={userFound ? handleAddToGroup : handleSearch}
//                   disabled={searching || adding}
//                 >
//                   {searching || adding
//                     ? "Processing..."
//                     : userFound
//                     ? "Add to Group"
//                     : "Search"}
//                 </button>
//               </form>
//               {searchResult && (
//                 <div className="mt-6 bg-[#1b2127] p-4 rounded-lg text-white">
//                   <div className="font-medium text-lg">
//                     {searchResult.user_name || searchResult.name}
//                   </div>
//                   <div className="text-sm text-[#6c7a89]">
//                     {searchResult.contact}
//                   </div>
//                 </div>
//               )}
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Group Content */}
//       {loading ? (
//         <div className="text-center py-20 text-lg animate-pulse">
//           Loading group details...
//         </div>
//       ) : !group?.groupMembers?.length ? (
//         <div className="text-center py-10 text-[#9cabba]">
//           No members or cards found in this group.
//         </div>
//       ) : (
//         <div className="space-y-10">
//           {group.groupMembers.map((member) => (
//             <div key={member._id}>
//               <div className="flex items-center justify-between">
//                 <h3 className="text-2xl font-bold mb-4 text-blue-400">
//                   {member.user_id?.firstName || "Unnamed"}
//                 </h3>
//                 {isAdmin && member.user_id._id !== currentUserId && (
//                   <button
//                     onClick={() => handleRemoveMember(member.user_id._id)}
//                     className="text-red-500 hover:text-red-600 transition-colors"
//                     title="Remove member"
//                   >
//                     <FaTrash className="w-5 h-5" />
//                   </button>
//                 )}
//               </div>

//               {member.user_id?.CardAdded?.length === 0 ? (
//                 <p className="text-sm text-[#9cabba]">
//                   No cards added by this user.
//                 </p>
//               ) : (
//                 <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//                   {member.user_id.CardAdded.map((card) => (
//                     <motion.div
//                       key={card._id}
//                       className="bg-[#1e242b] p-4 rounded-xl shadow-md hover:shadow-lg transition hover:scale-105"
//                       whileHover={{ scale: 1.05 }}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <div className="w-full aspect-[16/9] bg-[#2a2f36] flex items-center justify-center rounded-md overflow-hidden mb-3">
//                         <img
//                           src={
//                             card.image_url ||
//                             card.card_image ||
//                             "https://via.placeholder.com/120x80"
//                           }
//                           alt={card.card_name}
//                           className="object-contain w-full h-full"
//                         />
//                       </div>
//                       <h4 className="text-lg font-semibold mb-1">
//                         {card.card_name}
//                       </h4>
//                       <p className="text-sm text-[#9cabba]">
//                         Bank: {card.bank_name || "N/A"}
//                       </p>
//                     </motion.div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Leave Group Button */}
//       <div className="mt-8 flex justify-center">
//         <button
//           onClick={handleLeaveGroup}
//           className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-all duration-200"
//         >
//           Leave Group
//         </button>
//       </div>

//       <BottomNavBar />
//     </div>
//   );
// };

// export default GroupDetails;


import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { apiEndpoint } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import BottomNavBar from "../component/BottomNavBar";
import { jwtDecode } from "jwt-decode";
import { FaTrash } from "react-icons/fa";

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [searching, setSearching] = useState(false);
  const [userFound, setUserFound] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [adding, setAdding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${apiEndpoint}/api/v1/card/getGroupWithMembersAndCards/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroup(res.data);

      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const userId = decodedToken.id;
          // console.log("decoode toekn",decodedToken)
          setCurrentUserId(userId);
          // setIsAdmin(res.data.adminId === userId);
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
          setIsAdmin(true);
        }
      }
    } catch (err) {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [groupId, token]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setUserFound(false);
    setSearchResult(null);

    try {
      const response = await axios.post(
        `${apiEndpoint}/api/v1/auth/findbycontact`,
        { searchContact },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { status, user } = response.data;
      if (status && user) {
        setUserFound(true);
        setSearchResult(user);
      } else {
        alert("Contact not found or inactive.");
      }
    } catch (error) {
      alert("Error during search.");
    }
    setSearching(false);
  };

  const handleAddToGroup = async () => {
    setAdding(true);
    try {
      await axios.post(
        `${apiEndpoint}/api/v1/card/addUserToPool`,
        { searchContact, groupId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("User added to group!");
      setShowAddMemberModal(false);
      setSearchContact("");
      setSearchResult(null);
      setUserFound(false);
      await fetchGroup();
    } catch (error) {
      alert("Error adding user to group.");
    }
    setAdding(false);
  };

  const handleRemoveMember = async (userId) => {
    if (userId === currentUserId) {
      alert("Admins cannot remove themselves. Use 'Leave Group' instead.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await axios.post(
          `${apiEndpoint}/api/v1/card/removeUserFromPool`,
          { groupId, userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Member removed from group!");
        await fetchGroup();
      } catch (error) {
        alert(
          error.response?.data?.message ||
            "Error removing member from group."
        );
      }
    }
  };
// added all the feature
  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      try {
        await axios.post(
          `${apiEndpoint}/api/v1/card/leaveGroup`,
          { groupId},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert("You have left the group!"); 
        navigate("/card-pool");
      } catch (error) {
        alert(
          error.response?.data?.message ||
            "Error leaving the group."
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#111518] text-white px-4 py-6 pt-20">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-400 hover:underline"
        >
          ← Back
        </button>
        {isAdmin && (
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-all duration-200"
          >
            Add Member
          </button>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#23272f] rounded-lg p-6 w-full max-w-md mx-auto relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                className="absolute top-2 right-3 text-white text-2xl"
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSearchContact("");
                  setSearchResult(null);
                  setUserFound(false);
                }}
              >
                ×
              </button>
              <h3 className="text-lg font-semibold mb-4 text-blue-300">
                Add Member by Contact Number
              </h3>
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Enter contact number"
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#181c22] text-white mb-4 border border-[#3a3f45]"
                  disabled={userFound}
                />
                <button
                  type="submit"
                  className={`w-full py-2 px-4 rounded font-semibold transition ${
                    userFound
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  onClick={userFound ? handleAddToGroup : handleSearch}
                  disabled={searching || adding}
                >
                  {searching || adding
                    ? "Processing..."
                    : userFound
                    ? "Add to Group"
                    : "Search"}
                </button>
              </form>
              {searchResult && (
                <div className="mt-6 bg-[#1b2127] p-4 rounded-lg text-white">
                  <div className="font-medium text-lg">
                    {searchResult.user_name || searchResult.name}
                  </div>
                  <div className="text-sm text-[#6c7a89]">
                    {searchResult.contact}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Content */}
      {loading ? (
        <div className="text-center py-20 text-lg animate-pulse">
          Loading group details...
        </div>
      ) : !group?.groupMembers?.length ? (
        <div className="text-center py-10 text-[#9cabba]">
          No members or cards found in this group.
        </div>
      ) : (
        <div className="space-y-10">
          {group.groupMembers.map((member) => (
            <div key={member._id}>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold mb-4 text-blue-400">
                  {member.user_id?.firstName || "Unnamed"}
                </h3>
                { member.user_id._id !== currentUserId && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id._id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                    title="Remove member"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                )}
              </div>

              {member.user_id?.CardAdded?.length === 0 ? (
                <p className="text-sm text-[#9cabba]">
                  No cards added by this user.
                </p>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {member.user_id.CardAdded.map((card) => (
                    <motion.div
                      key={card._id}
                      className="bg-[#1e242b] p-4 rounded-xl shadow-md hover:shadow-lg transition hover:scale-105"
                      whileHover={{ scale: 1.05 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-full aspect-[16/9] bg-[#2a2f36] flex items-center justify-center rounded-md overflow-hidden mb-3">
                        <img
                          src={
                            card.image_url ||
                            card.card_image ||
                            "https://via.placeholder.com/120x80"
                          }
                          alt={card.card_name}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <h4 className="text-lg font-semibold mb-1">
                        {card.card_name}
                      </h4>
                      <p className="text-sm text-[#9cabba]">
                        Bank: {card.bank_name || "N/A"}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Leave Group Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleLeaveGroup}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-all duration-200"
        >
          Leave Group
        </button>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default GroupDetails;
