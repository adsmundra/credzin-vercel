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
  const [firstLoad, setFirstLoad] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [searching, setSearching] = useState(false);
  const [userFound, setUserFound] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(""); // Store current user's name

  const token = localStorage.getItem("token");

  // Custom Arrow Components
  const CustomPrevArrow = ({ onClick }) => (
    <button
      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md"
      onClick={onClick}
      style={{ left: "10px" }}
    >
      <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2">
        <path d="M13 17l-5-5 5-5" />
      </svg>
    </button>
  );

  const CustomNextArrow = ({ onClick }) => (
    <button
      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md"
      onClick={onClick}
      style={{ right: "10px" }}
    >
      <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2">
        <path d="M7 7l5 5-5 5" />
      </svg>
    </button>
  );

  const sliderSettings = {
    centerMode: false,
    slidesToShow: 4,
    speed: 300,
    cssEase: "ease-in-out",
    infinite: false,
    arrows: false,
    dots: false,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 3, arrows: false } },
      { breakpoint: 768, settings: { slidesToShow: 2, arrows: false } },
      { breakpoint: 480, settings: { slidesToShow: 1, arrows: false } },
    ],
  };

  const fetchGroup = async () => {
    if (firstLoad) setLoading(true);
    try {
      const res = await axios.get(
        `${apiEndpoint}/api/v1/card/getGroupWithMembersAndCards/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const groupData = res.data;
      setGroup({
        groupMembers: groupData.groupMembers || [],
        groupName: groupData.groupName || "Card Group"
      });
      // Safety check for group members
      if (!groupData.groupMembers || groupData.groupMembers.length === 0) {
        console.warn("No group members found");
        setLoading(false);
        setFirstLoad(false);
        return;
      }
      if (token) {
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;
        setCurrentUserId(userId);
        setCurrentUserName(decodedToken.name || "User");
        // ✅ Set isAdmin only if currentUserId === groupAdminId
        if (groupData.groupMembers[0]?.user_id?._id === userId) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    } catch (err) {
      console.error("Error fetching group:", err);
      setGroup(null);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [groupId, token]);

  // Optional: Polling for real-time updates (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGroup();
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [groupId, token]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setUserFound(false);
    setSearchResult(null);
    setErrorMessage("");

    try {
      const response = await axios.post(
        `${apiEndpoint}/api/v1/auth/findbycontact`,
        { searchContact },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { status, user, message } = response.data;
      if (status && user) {
        setUserFound(true);
        setSearchResult(user);
      } else {
        setUserFound(false);
        setErrorMessage(message || "Contact not found or inactive.");
      }
    } catch (error) {
      setUserFound(false);
      setErrorMessage(error.response?.data?.message || "Error during search.");
    }
    setSearching(false);
  };

  const handleAddToGroup = async () => {
    setAdding(true);
    try {
      const response = await axios.post(
        `${apiEndpoint}/api/v1/group/invitation/send`,
        { searchContact: searchResult.contact, groupId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        alert("Invitation sent successfully! The user will receive a notification to accept or reject the invitation.");
        setShowAddMemberModal(false);
        setSearchContact("");
        setSearchResult(null);
        setUserFound(false);
        setErrorMessage("");
        // Note: We don't need to fetch group again since the user hasn't joined yet
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error sending invitation.";
      alert(errorMessage);
    }
    setAdding(false);
  };

  const handleSendWhatsApp = () => {
    // No phone number validation, use raw input
    const formattedContact = searchContact.replace("+", ""); // Remove + for WhatsApp URL
    const inviteLink = `https://app.credzin.com`;
    const message = encodeURIComponent(
      `Hey! ${currentUserName} invited you to join our group "${group?.groupName || "Card Group"}" on credzin ! Sign up and join: ${inviteLink}`
    );
    const whatsappUrl = `https://wa.me/${formattedContact}?text=${message}`;

    try {
      window.open(whatsappUrl, "_blank");
      setShowAddMemberModal(false);
      setSearchContact("");
      setSearchResult(null);
      setUserFound(false);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Error opening WhatsApp. Please ensure WhatsApp is installed.");
    }
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
        await fetchGroup(true);
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
        await fetchGroup(true);
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
            Invite Member
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
                  setErrorMessage("");
                }}
              >
                ×
              </button>
              <h3 className="text-lg font-semibold mb-4 text-blue-300">
                Send Invitation by Contact Number
              </h3>
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Enter contact number (e.g., +1234567890)"
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#181c22] text-white mb-4 border border-[#3a3f45]"
                  disabled={userFound}
                />
                {errorMessage && (
                  <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
                )}
                <button
                  type="submit"
                  className={`w-full py-2 px-4 rounded font-semibold transition ${userFound
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  onClick={userFound ? handleAddToGroup : handleSearch}
                  disabled={searching || adding}
                >
                  {searching || adding
                    ? "Processing..."
                    : userFound
                      ? "Send Invitation"
                      : "Search"}
                </button>
                {!userFound && errorMessage && (
                  <button
                    type="button"
                    className="w-full py-2 px-4 mt-4 rounded font-semibold transition bg-green-600 hover:bg-green-700"
                    onClick={handleSendWhatsApp}
                    disabled={searching || adding}
                  >
                    Invite via WhatsApp
                  </button>
                )}
              </form>
              {searchResult && (
                <div className="mt-6 bg-[#1b2127] p-4 rounded-lg text-white">
                  <div className="font-medium text-lg">
                    {searchResult.user_name || searchResult.name}
                  </div>
                  <div className="text-sm text-[#6c7a89]">
                    {searchResult.firstName} {searchResult.lastName}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {firstLoad && loading ? (
        <div className="text-[#9cabba]">Loading group...</div>
      ) : !group?.groupMembers?.length ? (
        <div className="text-center py-10 text-[#9cabba]">
          No members or cards found in this group.
        </div>
      ) : (
        <div className="space-y-12">
          {(group.groupMembers || []).map((member) => (
            <div key={member._id} className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-blue-400">
                  {member.user_id?.firstName || "Unnamed"}
                </h3>
                {member.user_id?._id && member.user_id._id !== currentUserId && (
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
                <div className="relative px-2 sm:px-4">
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
                    onClick={() => sliderRef.current?.slickPrev()}
                    style={{ left: "40px" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="black"
                      strokeWidth="2"
                    >
                      <path d="M13 17l-5-5 5-5" />
                    </svg>
                  </button>
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
                    onClick={() => sliderRef.current?.slickNext()}
                    style={{ right: "40px" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="black"
                      strokeWidth="2"
                    >
                      <path d="M7 7l5 5-5 5" />
                    </svg>
                  </button>
                  <Slider ref={sliderRef} {...sliderSettings}>
                    {(member.user_id?.CardAdded || []).map((card) => {
                      if (!card) return null;
                      return (
                        <div key={card?._id || Math.random()} className="px-3">
                          <div className="flex flex-col items-center">
                            <div className="relative group cursor-pointer">
                              <div
                                className="w-64 h-40 rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                                  aspectRatio: "1.6/1",
                                }}
                              >
                                <img
                                  src={
                                    card.generic_card?.image_url ||
                                    card.image_url ||
                                    card.card_image ||
                                    "https://via.placeholder.com/256x160"
                                  }
                                  alt={card.generic_card?.card_name || card.card_name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  draggable={false}
                                />
                              </div>
                            </div>
                            <div className="mt-4 text-center">
                              <p className="text-white font-medium text-base leading-tight">
                                {card.generic_card?.card_name || card.card_name}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

// import React, { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import { apiEndpoint } from "../api";
// import { motion, AnimatePresence } from "framer-motion";
// import BottomNavBar from "../component/BottomNavBar";
// import { jwtDecode } from "jwt-decode";
// import { FaTrash } from "react-icons/fa";
// import Slider from "react-slick";
// import { parsePhoneNumberFromString } from "libphonenumber-js";

// const GroupDetails = () => {
//   const { groupId } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation(); // To handle invitation links
//   const sliderRef = useRef(null);

//   const [group, setGroup] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showAddMemberModal, setShowAddMemberModal] = useState(false);
//   const [showInvitationsModal, setShowInvitationsModal] = useState(false);
//   const [pendingInvitations, setPendingInvitations] = useState([]);
//   const [searchContact, setSearchContact] = useState("");
//   const [searching, setSearching] = useState(false);
//   const [userFound, setUserFound] = useState(false);
//   const [searchResult, setSearchResult] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [adding, setAdding] = useState(false);
//   const [isAdmin, setIsAdmin] = useState(false); // Set to false initially
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [currentUserName, setCurrentUserName] = useState("");

//   const token = localStorage.getItem("token");

//   // Custom Arrow Components
//   const CustomPrevArrow = ({ onClick }) => (
//     <button
//       className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md"
//       onClick={onClick}
//       style={{ left: "10px" }}
//     >
//       <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2">
//         <path d="M13 17l-5-5 5-5" />
//       </svg>
//     </button>
//   );

//   const CustomNextArrow = ({ onClick }) => (
//     <button
//       className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md"
//       onClick={onClick}
//       style={{ right: "10px" }}
//     >
//       <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2">
//         <path d="M7 7l5 5-5 5" />
//       </svg>
//     </button>
//   );

//   const sliderSettings = {
//     centerMode: false,
//     slidesToShow: 4,
//     speed: 300,
//     cssEase: "ease-in-out",
//     infinite: false,
//     arrows: false,
//     dots: false,
//     responsive: [
//       { breakpoint: 1200, settings: { slidesToShow: 3, arrows: false } },
//       { breakpoint: 768, settings: { slidesToShow: 2, arrows: false } },
//       { breakpoint: 480, settings: { slidesToShow: 1, arrows: false } },
//     ],
//   };

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
//           const userId = decodedToken.id;
//           setCurrentUserId(userId);
//           setCurrentUserName(decodedToken.name || "User");
//           // Check if the user is the group admin
//           setIsAdmin(res.data.admin === userId);
//         } catch (decodeError) {
//           console.error("Error decoding token:", decodeError);
//         }
//       }
//     } catch (err) {
//       setGroup(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPendingInvitations = async () => {
//     try {
//       const res = await axios.get(
//         `${apiEndpoint}/api/v1/card/getUserNotifications/${currentUserId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       // Filter for group_invite notifications related to this group
//       const invitations = res.data.notifications.filter(
//         (notification) =>
//           notification.type === "group_invite" &&
//           notification.metadata.groupId === groupId &&
//           notification.status === "pending"
//       );
//       setPendingInvitations(invitations);
//       if (invitations.length > 0) {
//         setShowInvitationsModal(true); // Show modal if there are pending invitations
//       }
//     } catch (error) {
//       console.error("Error fetching pending invitations:", error);
//     }
//   };

//   useEffect(() => {
//     fetchGroup();
//   }, [groupId, token]);

//   useEffect(() => {
//     if (currentUserId) {
//       fetchPendingInvitations();
//     }
//   }, [currentUserId]);

//   // Handle invitation links from URL (e.g., from email or WhatsApp)
//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const invitationId = params.get("invitationId");
//     if (invitationId) {
//       setShowInvitationsModal(true);
//     }
//   }, [location]);

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     setSearching(true);
//     setUserFound(false);
//     setSearchResult(null);
//     setErrorMessage("");

//     const phoneNumber = parsePhoneNumberFromString(searchContact);
//     if (!phoneNumber || !phoneNumber.isValid()) {
//       setErrorMessage("Please enter a valid phone number (e.g., +1234567890)");
//       setSearching(false);
//       return;
//     }

//     try {
//       const response = await axios.post(
//         `${apiEndpoint}/api/v1/auth/findbycontact`,
//         { searchContact: phoneNumber.formatInternational() },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const { status, user, message } = response.data;
//       if (status && user) {
//         setUserFound(true);
//         setSearchResult(user);
//       } else {
//         setUserFound(false);
//         setErrorMessage(message || "Contact not found or inactive.");
//       }
//     } catch (error) {
//       setUserFound(false);
//       setErrorMessage(error.response?.data?.message || "Error during search.");
//     }
//     setSearching(false);
//   };

//   const handleAddToGroup = async () => {
//     setAdding(true);
//     try {
//       await axios.post(
//         `${apiEndpoint}/api/v1/card/addUserToPool`,
//         { searchContact: searchResult.contact, groupId },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       alert("Invitation sent successfully!");
//       setShowAddMemberModal(false);
//       setSearchContact("");
//       setSearchResult(null);
//       setUserFound(false);
//       setErrorMessage("");
//       await fetchGroup();
//     } catch (error) {
//       alert(error.response?.data?.message || "Error sending invitation.");
//     }
//     setAdding(false);
//   };

//   const handleSendWhatsApp = () => {
//     const phoneNumber = parsePhoneNumberFromString(searchContact);
//     if (!phoneNumber || !phoneNumber.isValid()) {
//       setErrorMessage("Please enter a valid phone number (e.g., +1234567890)");
//       return;
//     }

//     const formattedContact = phoneNumber.number.replace("+", "");
//     const inviteLink = `https://app.credzin.com?groupId=${groupId}`;
//     const message = encodeURIComponent(
//       `Hey! ${currentUserName} invited you to join our group "${group?.groupName || "Card Group"}" on CredZin! Sign up and join: ${inviteLink}`
//     );
//     const whatsappUrl = `https://wa.me/${formattedContact}?text=${message}`;

//     try {
//       window.open(whatsappUrl, "_blank");
//       setShowAddMemberModal(false);
//       setSearchContact("");
//       setSearchResult(null);
//       setUserFound(false);
//       setErrorMessage("");
//     } catch (error) {
//       setErrorMessage("Error opening WhatsApp. Please ensure WhatsApp is installed.");
//     }
//   };

//   const handleAcceptInvitation = async (invitationId) => {
//     try {
//       await axios.post(
//         `${apiEndpoint}/api/v1/card/invitation/accept/${invitationId}`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       alert("Invitation accepted! You are now a member of the group.");
//       setShowInvitationsModal(false);
//       setPendingInvitations([]);
//       await fetchGroup();
//       await fetchPendingInvitations();
//     } catch (error) {
//       alert(error.response?.data?.message || "Error accepting invitation.");
//     }
//   };

//   const handleRejectInvitation = async (invitationId) => {
//     try {
//       await axios.post(
//         `${apiEndpoint}/api/v1/card/invitation/reject/${invitationId}`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       alert("Invitation rejected.");
//       setShowInvitationsModal(false);
//       setPendingInvitations([]);
//       await fetchPendingInvitations();
//       navigate("/card-pool"); // Redirect to card pool page
//     } catch (error) {
//       alert(error.response?.data?.message || "Error rejecting invitation.");
//     }
//   };

//   const handleRemoveMember = async (userId) => {
//     if (userId === currentUserId) {
//       alert("Admins cannot remove themselves. Use 'Leave Group' instead.");
//       return;
//     }
//     if (window.confirm("Are you sure you want to remove this member?")) {
//       try {
//         await axios.post(
//           `${apiEndpoint}/api/v1/card/removeUserFromPool`,
//           { groupId, userId },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         alert("Member removed from group!");
//         await fetchGroup();
//       } catch (error) {
//         alert(error.response?.data?.message || "Error removing member from group.");
//       }
//     }
//   };

//   const handleLeaveGroup = async () => {
//     if (window.confirm("Are you sure you want to leave this group?")) {
//       try {
//         await axios.post(
//           `${apiEndpoint}/api/v1/card/leaveGroup`,
//           { groupId },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         alert("You have left the group!");
//         navigate("/card-pool");
//       } catch (error) {
//         alert(error.response?.data?.message || "Error leaving the group.");
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
//         <div className="flex gap-4">
//           {isAdmin && (
//             <button
//               onClick={() => setShowAddMemberModal(true)}
//               className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
//             >
//               Add Member
//             </button>
//           )}
//           {pendingInvitations.length > 0 && (
//             <button
//               onClick={() => setShowInvitationsModal(true)}
//               className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
//             >
//               View Invitations ({pendingInvitations.length})
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Add Member Modal */}
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
//                   setErrorMessage("");
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
//                   placeholder="Enter contact number (e.g., +1234567890)"
//                   value={searchContact}
//                   onChange={(e) => setSearchContact(e.target.value)}
//                   className="w-full px-3 py-2 rounded bg-[#181c22] text-white mb-4 border border-[#3a3f45]"
//                   disabled={userFound}
//                 />
//                 {errorMessage && (
//                   <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
//                 )}
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
//                       ? "Send Invitation"
//                       : "Search"}
//                 </button>
//                 {!userFound && errorMessage && (
//                   <button
//                     type="button"
//                     className="w-full py-2 px-4 mt-4 rounded font-semibold transition bg-green-600 hover:bg-green-700"
//                     onClick={handleSendWhatsApp}
//                     disabled={searching || adding}
//                   >
//                     Invite via WhatsApp
//                   </button>
//                 )}
//               </form>
//               {searchResult && (
//                 <div className="mt-6 bg-[#1b2127] p-4 rounded-lg text-white">
//                   <div className="font-medium text-lg">
//                     {searchResult.user_name || searchResult.name}
//                   </div>
//                   <div className="text-sm text-[#6c7a89]">
//                     {searchResult.firstName} {searchResult.lastName}
//                   </div>
//                 </div>
//               )}
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Pending Invitations Modal */}
//       <AnimatePresence>
//         {showInvitationsModal && (
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
//                 onClick={() => setShowInvitationsModal(false)}
//               >
//                 ×
//               </button>
//               <h3 className="text-lg font-semibold mb-4 text-blue-300">
//                 Pending Group Invitations
//               </h3>
//               {pendingInvitations.length === 0 ? (
//                 <p className="text-[#9cabba]">No pending invitations.</p>
//               ) : (
//                 <div className="space-y-4">
//                   {pendingInvitations.map((invitation) => (
//                     <div
//                       key={invitation._id}
//                       className="bg-[#1b2127] p-4 rounded-lg"
//                     >
//                       <p className="text-white">{invitation.message}</p>
//                       <div className="flex gap-4 mt-4">
//                         <button
//                           onClick={() =>
//                             handleAcceptInvitation(invitation.metadata.invitationId || invitation._id)
//                           }
//                           className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
//                         >
//                           Accept
//                         </button>
//                         <button
//                           onClick={() =>
//                             handleRejectInvitation(invitation.metadata.invitationId || invitation._id)
//                           }
//                           className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
//                         >
//                           Reject
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {loading ? (
//         <div className="text-center py-20 text-lg animate-pulse">
//           Loading group details...
//         </div>
//       ) : !group?.groupMembers?.length ? (
//         <div className="text-center py-10 text-[#9cabba]">
//           No members or cards found in this group.
//         </div>
//       ) : (
//         <div className="space-y-12">
//           {group.groupMembers
//             .filter((member) => member.status === "accepted") // Only show accepted members
//             .map((member) => (
//               <div key={member._id} className="mb-8">
//                 <div className="flex items-center justify-between mb-6">
//                   <h3 className="text-2xl font-bold text-blue-400">
//                     {member.user_id?.firstName || "Unnamed"}
//                   </h3>
//                   {isAdmin && member.user_id._id !== currentUserId && (
//                     <button
//                       onClick={() => handleRemoveMember(member.user_id._id)}
//                       className="text-red-500 hover:text-red-600 transition-colors"
//                       title="Remove member"
//                     >
//                       <FaTrash className="w-5 h-5" />
//                     </button>
//                   )}
//                 </div>

//                 {member.user_id?.CardAdded?.length === 0 ? (
//                   <p className="text-sm text-[#9cabba]">
//                     No cards added by this user.
//                   </p>
//                 ) : (
//                   <div className="relative px-2 sm:px-4">
//                     <button
//                       className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
//                       onClick={() => sliderRef.current?.slickPrev()}
//                       style={{ left: "40px" }}
//                     >
//                       <svg
//                         width="20"
//                         height="20"
//                         fill="none"
//                         stroke="black"
//                         strokeWidth="2"
//                       >
//                         <path d="M13 17l-5-5 5-5" />
//                       </svg>
//                     </button>
//                     <button
//                       className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
//                       onClick={() => sliderRef.current?.slickNext()}
//                       style={{ right: "40px" }}
//                     >
//                       <svg
//                         width="20"
//                         height="20"
//                         fill="none"
//                         stroke="black"
//                         strokeWidth="2"
//                       >
//                         <path d="M7 7l5 5-5 5" />
//                       </svg>
//                     </button>
//                     <Slider ref={sliderRef} {...sliderSettings}>
//                       {member.user_id.CardAdded.map((card) => (
//                         <div key={card._id} className="px-3">
//                           <div className="flex flex-col items-center">
//                             <div className="relative group cursor-pointer">
//                               <div
//                                 className="w-64 h-40 rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
//                                 style={{
//                                   background:
//                                     "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
//                                   aspectRatio: "1.6/1",
//                                 }}
//                               >
//                                 <img
//                                   src={
//                                     card.image_url ||
//                                     card.card_image ||
//                                     "https://via.placeholder.com/256x160"
//                                   }
//                                   alt={card.card_name}
//                                   className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
//                                   draggable={false}
//                                 />
//                               </div>
//                             </div>
//                             <div className="mt-4 text-center">
//                               <p className="text-white font-medium text-base leading-tight">
//                                 {card.card_name}
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </Slider>
//                   </div>
//                 )}
//               </div>
//             ))}
//         </div>
//       )}

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
