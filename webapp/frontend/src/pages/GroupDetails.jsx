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


import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { apiEndpoint } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import BottomNavBar from "../component/BottomNavBar";
import { jwtDecode } from "jwt-decode";
import { FaTrash } from "react-icons/fa";
import Slider from "react-slick";

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const sliderRef = useRef(null);

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

  // Custom Arrow Components (using inline SVG like in Home component)
  const CustomPrevArrow = ({ onClick }) => (
    <button
      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md"
      onClick={onClick}
      style={{ left: '10px' }}
    >
      <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2">
        <path d="M13 17l-5-5 5-5"/>
      </svg>
    </button>
  );

  const CustomNextArrow = ({ onClick }) => (
    <button
      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md"
      onClick={onClick}
      style={{ right: '10px' }}
    >
      <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2">
        <path d="M7 7l5 5-5 5"/>
      </svg>
    </button>
  );

  const sliderSettings = {
    centerMode: false,
    slidesToShow: 4,
    speed: 300,
    cssEase: "ease-in-out",
    infinite: false,
    arrows: false, // Disable default arrows since we're using custom ones
    dots: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          arrows: false,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          arrows: false,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          arrows: false,
        },
      },
    ],
  };

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
          setCurrentUserId(userId);
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
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
        alert(error.response?.data?.message || "Error removing member from group.");
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      try {
        await axios.post(
          `${apiEndpoint}/api/v1/card/leaveGroup`,
          { groupId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("You have left the group!");
        navigate("/card-pool");
      } catch (error) {
        alert(error.response?.data?.message || "Error leaving the group.");
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Add Member
          </button>
        )}
      </div>

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
                    ? "Searching for the Member"
                    : userFound
                    ? "Add to Pool"
                    : "Search"}
                </button>
              </form>
              {searchResult && (
                <div className="mt-6 bg-[#1b2127] p-4 rounded-lg text-white">
                  <div className="font-medium text-lg">
                    {searchResult.user_name || searchResult.name}
                  </div>
                  <div className="text-sm text-[#6c7a89]">{searchResult.contact}</div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-20 text-lg animate-pulse">
          Loading group details...
        </div>
      ) : !group?.groupMembers?.length ? (
        <div className="text-center py-10 text-[#9cabba]">
          No members or cards found in this group.
        </div>
      ) : (
        <div className="space-y-12">
          {group.groupMembers.map((member) => (
            <div key={member._id} className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-blue-400">
                  {member.user_id?.firstName || "Unnamed"}
                </h3>
                {member.user_id._id !== currentUserId && (
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
                <p className="text-sm text-[#9cabba]">No cards added by this user.</p>
              ) : (
                <div className="relative px-2 sm:px-4">
                  {/* Custom Arrow Buttons - Same style as Home component */}
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
                    onClick={() => sliderRef.current?.slickPrev()}
                    style={{ left: '40px' }}
                  >
                    <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2">
                      <path d="M13 17l-5-5 5-5"/>
                    </svg>
                  </button>
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
                    onClick={() => sliderRef.current?.slickNext()}
                    style={{ right: '40px' }}
                  >
                    <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2">
                      <path d="M7 7l5 5-5 5"/>
                    </svg>
                  </button>
                  <Slider ref={sliderRef} {...sliderSettings}>
                    {member.user_id.CardAdded.map((card) => (
                      <div key={card._id} className="px-3">
                        <div className="flex flex-col items-center">
                          {/* Credit Card Container */}
                          <div className="relative group cursor-pointer">
                            <div
                              className="w-64 h-40 rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                              style={{
                                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                                aspectRatio: '1.6/1'
                              }}
                            >
                              <img
                                src={card.image_url || card.card_image || "https://via.placeholder.com/256x160"}
                                alt={card.card_name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                draggable={false}
                              />
                            </div>
                          </div>
                          
                          {/* Card Name */}
                          <div className="mt-4 text-center">
                            <p className="text-white font-medium text-base leading-tight">
                              {card.card_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
