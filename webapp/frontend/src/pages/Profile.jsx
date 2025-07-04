// import React, { useState, useEffect } from "react";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { User, Phone, MapPin, CreditCard, Upload } from 'lucide-react';
// import BottomNavBar from "../component/BottomNavBar";
// import { useDispatch } from "react-redux";
// import { setUser } from "../app/slices/authSlice"; // adjust path based on your structure

// const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a2abb3'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.35 18.5C8.66 17.56 10.27 17 12 17s3.34.56 4.65 1.5c-1.31.94-2.91 1.5-4.65 1.5s-3.34-.56-4.65-1.5zm10.79-1.38C16.45 15.8 14.32 15 12 15s-4.45.8-6.14 2.12A7.96 7.96 0 0 1 4 12c0-4.42 3.58-8 8-8s8 3.58 8 8c0 1.85-.63 3.54-1.86 4.12zM12 6c-1.93 0-3.5 1.57-3.5 3.5S10.07 13 12 13s3.5-1.57 3.5-3.5S13.93 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z'/%3E%3C/svg%3E";

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// const UserProfile = () => {
//   const navigate = useNavigate();
//   const user = useSelector((state) => state.auth.user);
//   const cards = useSelector((state) => state.cart.cart);
//   const [editMode, setEditMode] = useState(false);
//   const [editUser, setEditUser] = useState({});
//   const [saving, setSaving] = useState(false);
//   const [avatarFile, setAvatarFile] = useState(null);
//   const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);
//   const [errors, setErrors] = useState({});

//   const token = localStorage.getItem("token"); 
//   // console.log('token1',token)


// useEffect(() => {
//   if (user?.profilePic) {
//     // If it's already a full URL, use it directly
//     if (user.profilePic.startsWith('http://') || user.profilePic.startsWith('https://')) {
//       setAvatarPreview(user.profilePic);
//     } 
//     // Otherwise construct the URL properly
//     else {
//       // Remove any leading slashes to prevent double slashes
//       const cleanPath = user.profilePic.replace(/^\/+/, '');
//       setAvatarPreview(`${API_BASE_URL}/${cleanPath}`);
//     }
//   } else {
//     setAvatarPreview(DEFAULT_AVATAR);
//   }
// }, [user]);



//   useEffect(() => {
//     return () => {
//       if (avatarPreview && avatarPreview.startsWith('blob:')) {
//         URL.revokeObjectURL(avatarPreview);
//       }
//     };
//   }, [avatarPreview]);

//   const validateForm = () => {
//     const newErrors = {};
//     if (!editUser.firstName?.trim()) {
//       newErrors.firstName = "First name is required";
//     }
//     if (!editUser.lastName?.trim()) {
//       newErrors.lastName = "Last name is required";
//     }
//     if (editUser.contact && !/^\+?\d{10,15}$/.test(editUser.contact)) {
//       newErrors.contact = "Invalid contact number";
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleAvatarChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) {
//         setErrors({ ...errors, avatar: "File size must be less than 5MB" });
//         return;
//       }
//       const validMimeTypes = ['image/jpeg', 'image/png'];
//       const validExtensions = ['.jpg', '.jpeg', '.png'];
//       const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
//       if (!validMimeTypes.includes(file.type) || !validExtensions.includes(fileExtension)) {
//         setErrors({ ...errors, avatar: "Only JPG, JPEG, and PNG files are allowed" });
//         return;
//       }
//       setErrors({ ...errors, avatar: '' });
//       setAvatarFile(file);
//       const previewUrl = URL.createObjectURL(file);
//       setAvatarPreview(previewUrl);
//     }
//   };

//   const handleEdit = () => {
//     setEditUser({
//       firstName: user?.firstName || "",
//       lastName: user?.lastName || "",
//       contact: user?.contact || "",
//       address: user?.address || "",
//       email: user?.email || ""
//     });
//     setEditMode(true);
//   };

//   const handleChange = (e) => {
//     setEditUser({ ...editUser, [e.target.name]: e.target.value });
//     setErrors({ ...errors, [e.target.name]: '' });
//   };

//   const handleSave = async () => {
//     if (!validateForm()) return;
//     if (!window.confirm("Are you sure you want to save changes?")) return;

//     setSaving(true);
//     try {
//       const formData = new FormData();
//       formData.append("userData", JSON.stringify(editUser));
//       if (avatarFile) {
//         formData.append("profilePic", avatarFile);
//       }
//         const token = localStorage.getItem("token"); 

//       const response = await axios.post(`${API_BASE_URL}/api/profile/profileEdit`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data',
//           'Authorization': `Bearer ${token}`
//         },
//          // Add Authorization header
//       });
//       console.log("profile response", response)
//       const updatedUser = response.data.data;
//       console.log("updated user",updatedUser.profilePic)
//         if (updatedUser.profilePic) {
//           setAvatarPreview(updatedUser.profilePic);
//         }
//         setEditMode(false);
//         setAvatarFile(null);
//         alert('Profile updated successfully!');
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
//       alert(errorMessage);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleCancel = () => {
//     if (window.confirm("Are you sure you want to discard changes?")) {
//       setEditMode(false);
//       setEditUser({});
//       setAvatarFile(null);
//       setAvatarPreview(user?.profilePic ? `${API_BASE_URL}${user.profilePic}` : DEFAULT_AVATAR);
//       setErrors({});
//     }
//   };

//   if (!user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#121416]">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-[#121416] text-white font-['Manrope']">
//       <div className="flex items-center bg-[#121416] p-4 sm:p-6 md:p-8 lg:p-14 pb-6 justify-between sticky top-0 z-10 mt-12 sm:mt-8">
//         <button
//           onClick={() => navigate(-1)}
//           className="text-white flex size-12 items-center"
//           aria-label="Go back"
//         >
//           <svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
//             <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
//           </svg>
//         </button>
//         <h2 className="text-lg md:text-xl font-bold tracking-tight flex-1 text-center">
//           Profile
//         </h2>
//         {!editMode ? (
//           <button
//             onClick={handleEdit}
//             className="bg-[#2c3135] px-4 py-2 rounded-lg hover:bg-[#3c4145] transition-colors text-sm md:text-base"
//             aria-label="Edit profile"
//           >
//             Edit
//           </button>
//         ) : (
//           <div className="flex gap-2">
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="bg-[#2c3135] px-4 py-2 rounded-lg hover:bg-[#3c4145] transition-colors disabled:opacity-50 text-sm md:text-base flex items-center gap-2"
//               aria-label="Save profile"
//             >
//               {saving && (
//                 <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
//               )}
//               {saving ? "Saving..." : "Save"}
//             </button>
//             <button
//               onClick={handleCancel}
//               disabled={saving}
//               className="bg-[#2c3135] px-4 py-2 rounded-lg hover:bg-[#3c4145] transition-colors text-[#a2abb3] text-sm md:text-base"
//               aria-label="Cancel editing"
//             >
//               Cancel
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="flex p-4 sm:p-6 md:p-8">
//         <div className="flex w-full flex-col gap-6 items-center">
//           <div className="flex gap-4 flex-col items-center">
//             <div className="relative">
//               <div
//                 className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-[100px] w-[100px] sm:min-h-[120px] sm:w-[120px] md:min-h-[140px] md:w-[140px] ring-2 ring-[#2c3135] ring-offset-2 ring-offset-[#121416]"
//                 style={{
//                   backgroundImage: `url("${avatarPreview}")`,
//                   backgroundColor: '#2c3135'
//                 }}
//               />
//               {editMode && (
//                 <label
//                   htmlFor="avatar-upload"
//                   className="absolute bottom-0 right-0 bg-[#2c3135] rounded-full p-2 cursor-pointer hover:bg-[#3c4145] transition-colors"
//                   aria-label="Upload new avatar"
//                 >
//                   <input
//                     id="avatar-upload"
//                     type="file"
//                     accept="image/jpeg,image/png"
//                     onChange={handleAvatarChange}
//                     className="hidden"
//                   />
//                   <Upload size={20} className="text-white" />
//                 </label>
//               )}
//               {errors.avatar && (
//                 <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>
//               )}
//             </div>
//             <div className="flex flex-col items-center justify-center">
//               <p className="text-xl sm:text-2xl font-bold tracking-tight text-center">
//                 {editUser.firstName || user?.firstName || "User"}
//               </p>
//               <p className="text-[#a2abb3] text-sm sm:text-base font-normal text-center">
//                 {editUser.email || user?.email || "No email"}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <h3 className="text-lg sm:text-xl font-bold tracking-tight px-4 sm:px-6 md:px-8 pb-2 pt-4">
//         Account
//       </h3>
//       <div className="divide-y divide-[#2c3135]">
//         <div className="flex items-center gap-4 bg-[#121416] px-4 sm:px-6 md:px-8 min-h-[72px] py-2">
//           <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
//             <User size={24} />
//           </div>
//           <div className="flex flex-col justify-center flex-1">
//             <p className="text-base font-medium">Name</p>
//             {editMode ? (
//               <div className="flex flex-col sm:flex-row gap-2">
//                 <div className="flex-1">
//                   <input
//                     name="firstName"
//                     value={editUser.firstName || ""}
//                     onChange={handleChange}
//                     className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1 focus:ring-2 focus:ring-blue-500"
//                     placeholder="First name"
//                     aria-label="First name"
//                     aria-invalid={errors.firstName ? "true" : "false"}
//                     aria-describedby={errors.firstName ? "firstName-error" : undefined}
//                   />
//                   {errors.firstName && (
//                     <p id="firstName-error" className="text-red-500 text-xs mt-1">{errors.firstName}</p>
//                   )}
//                 </div>
//                 <div className="flex-1">
//                   <input
//                     name="lastName"
//                     value={editUser.lastName || ""}
//                     onChange={handleChange}
//                     className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1 focus:ring-2 focus:ring-blue-500"
//                     placeholder="Last name"
//                     aria-label="Last name"
//                     aria-invalid={errors.lastName ? "true" : "false"}
//                     aria-describedby={errors.lastName ? "lastName-error" : undefined}
//                   />
//                   {errors.lastName && (
//                     <p id="lastName-error" className="text-red-500 text-xs mt-1">{errors.lastName}</p>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               <p className="text-[#a2abb3] text-sm font-normal">
//                 {user?.firstName} {user?.lastName}
//               </p>
//             )}
//             <p className="text-[#a2abb3] text-xs mt-1">{user?.email}</p>
//           </div>
//         </div>

//         <div className="flex items-center gap-4 bg-[#121416] px-4 sm:px-6 md:px-8 min-h-[72px] py-2">
//           <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
//             <Phone size={24} />
//           </div>
//           <div className="flex flex-col justify-center flex-1">
//             <p className="text-base font-medium">Contact</p>
//             {editMode ? (
//               <div>
//                 <input
//                   name="contact"
//                   value={editUser.contact || ""}
//                   onChange={handleChange}
//                   className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1 focus:ring-2 focus:ring-blue-500"
//                   placeholder="Enter contact number"
//                   aria-label="Contact number"
//                   aria-invalid={errors.contact ? "true" : "false"}
//                   aria-describedby={errors.contact ? "contact-error" : undefined}
//                 />
//                 {errors.contact && (
//                   <p id="contact-error" className="text-red-500 text-xs mt-1">{errors.contact}</p>
//                 )}
//               </div>
//             ) : (
//               <p className="text-[#a2abb3] text-sm font-normal">
//                 {user?.contact || "Add contact information"}
//               </p>
//             )}
//           </div>
//         </div>

//         <div className="flex items-center gap-4 bg-[#121416] px-4 sm:px-6 md:px-8 min-h-[72px] py-2">
//           <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
//             <MapPin size={24} />
//           </div>
//           <div className="flex flex-col justify-center flex-1">
//             <p className="text-base font-medium">Address</p>
//             {editMode ? (
//               <input
//                 name="address"
//                 value={editUser.address || ""}
//                 onChange={handleChange}
//                 className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1 focus:ring-2 focus:ring-blue-500"
//                 placeholder="Enter address"
//                 aria-label="Address"
//               />
//             ) : (
//               <p className="text-[#a2abb3] text-sm font-normal">
//                 {user?.address || "Add address"}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       <h3 className="text-lg sm:text-xl font-bold tracking-tight px-4 sm:px-6 md:px-8 pb-2 pt-4">
//         Cards
//       </h3>
//       <div className="flex items-center gap-4 bg-[#121416] px-4 sm:px-6 md:px-8 min-h-[72px] py-2">
//         <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
//           <CreditCard size={24} />
//         </div>
//         <div className="flex flex-col justify-center">
//           <p className="text-base font-medium">Credit Cards</p>
//           <p className="text-[#a2abb3] text-sm font-normal">
//             {cards?.length > 0 ? `${cards.length} cards added` : "No cards added"}
//           </p>
//         </div>
//       </div>
//       <BottomNavBar />
//     </div>
//   );
// };

// export default UserProfile;


import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Phone, MapPin, CreditCard, Upload } from 'lucide-react';
import BottomNavBar from "../component/BottomNavBar";
import { setUser } from "../app/slices/authSlice";
import { Buffer } from 'buffer';
window.Buffer = Buffer

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a2abb3'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.35 18.5C8.66 17.56 10.27 17 12 17s3.34.56 4.65 1.5c-1.31.94-2.91 1.5-4.65 1.5s-3.34-.56-4.65-1.5zm10.79-1.38C16.45 15.8 14.32 15 12 15s-4.45.8-6.14 2.12A7.96 7.96 0 0 1 4 12c0-4.42 3.58-8 8-8s8 3.58 8 8c0 1.85-.63 3.54-1.86 4.12zM12 6c-1.93 0-3.5 1.57-3.5 3.5S10.07 13 12 13s3.5-1.57 3.5-3.5S13.93 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z'/%3E%3C/svg%3E";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UserProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const cards = useSelector((state) => state.cart.cart);
  
  const [state, setState] = useState({
    editMode: false,
    editUser: {},
    saving: false,
    avatarFile: null,
    avatarPreview: DEFAULT_AVATAR,
    errors: {},
    submitError: null,
    isLoading: true
  });

  const { editMode, editUser, saving, avatarPreview, errors, submitError, isLoading } = state;

  useEffect(() => {
  if (user) {
    let newAvatarPreview = DEFAULT_AVATAR;
    
    if (user?.profilePic) {
      if (typeof user.profilePic === 'string') {
        // If it's already a URL string
        newAvatarPreview = user.profilePic;
      } else if (user.profilePic.data) {
        // If it's a Base64 string in data field
        if (typeof user.profilePic.data === 'string') {
          newAvatarPreview = `data:${user.profilePic.contentType};base64,${user.profilePic.data}`;
        } 
        // Handle ArrayBuffer or Uint8Array (common alternative to Buffer)
        else if (user.profilePic.data.data && Array.isArray(user.profilePic.data.data)) {
          try {
            // Convert array to Uint8Array
            const uint8Array = new Uint8Array(user.profilePic.data.data);
            // Convert to binary string
            let binaryString = '';
            uint8Array.forEach(byte => {
              binaryString += String.fromCharCode(byte);
            });
            // Convert to base64
            const base64String = btoa(binaryString);
            newAvatarPreview = `data:${user.profilePic.contentType};base64,${base64String}`;
          } catch (error) {
            console.error('Error converting image data:', error);
          }
        }
      }
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      avatarPreview: newAvatarPreview
    }));
  }
}, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const validateForm = () => {
    const newErrors = {};
    if (!editUser.firstName?.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!editUser.lastName?.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (editUser.contact && !/^\+?\d{10,15}$/.test(editUser.contact)) {
      newErrors.contact = "Invalid contact number";
    }
    setState(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear previous errors
    setState(prev => ({ ...prev, errors: { ...prev.errors, avatar: '' } }));

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setState(prev => ({ 
        ...prev, 
        errors: { ...prev.errors, avatar: "File size must be less than 5MB" } 
      }));
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setState(prev => ({ 
        ...prev, 
        errors: { ...prev.errors, avatar: "Only JPG, PNG, and WebP images are allowed" } 
      }));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setState(prev => ({ 
        ...prev, 
        avatarPreview: reader.result,
        avatarFile: file 
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setState(prev => ({
      ...prev,
      editMode: true,
      editUser: {
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        contact: user?.contact || "",
        address: user?.address || "",
        email: user?.email || ""
      },
      submitError: null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      editUser: { ...prev.editUser, [name]: value },
      errors: { ...prev.errors, [name]: '' }
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!window.confirm("Are you sure you want to save changes?")) return;

    setState(prev => ({ ...prev, saving: true, submitError: null }));

    try {
      // Convert file to Base64 if avatarFile exists
      let base64Image = null;
      if (state.avatarFile) {
        base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(state.avatarFile);
        });
      }

      const requestData = {
        ...editUser,
        ...(base64Image && { profilePic: base64Image })
      };

      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_BASE_URL}/api/profile/update`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update local state and avatar
      const updatedUser = response.data.data;
      dispatch(setUser(updatedUser));

      let updatedPreview = DEFAULT_AVATAR;
      if (updatedUser.profilePic) {
        if (typeof updatedUser.profilePic === 'string') {
          updatedPreview = updatedUser.profilePic;
        } else if (updatedUser.profilePic.data) {
          updatedPreview = `data:${updatedUser.profilePic.contentType};base64,${updatedUser.profilePic.data}`;
        }
      }

      setState(prev => ({
        ...prev,
        editMode: false,
        avatarFile: null,
        saving: false,
        avatarPreview: updatedPreview,
        submitError: null
      }));

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      setState(prev => ({ 
        ...prev, 
        saving: false, 
        submitError: errorMessage 
      }));
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to discard changes?")) {
      setState(prev => ({
        ...prev,
        editMode: false,
        editUser: {},
        avatarFile: null,
        errors: {},
        submitError: null,
        avatarPreview: user?.profilePic?.data 
          ? `data:${user.profilePic.contentType};base64,${user.profilePic.data.toString('base64')}`
          : DEFAULT_AVATAR
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121416]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#121416] text-white font-['Manrope']">
      {/* Header */}
      <div className="flex items-center bg-[#121416] p-4 sm:p-6 md:p-8 lg:p-14 pb-6 justify-between sticky top-0 z-10 mt-12 sm:mt-8">
        <button
          onClick={() => navigate(-1)}
          className="text-white flex size-12 items-center"
          aria-label="Go back"
        >
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
          </svg>
        </button>
        <h2 className="text-lg md:text-xl font-bold tracking-tight flex-1 text-center">
          Profile
        </h2>
        {!editMode ? (
          <button
            onClick={handleEdit}
            className="bg-[#2c3135] px-4 py-2 rounded-lg hover:bg-[#3c4145] transition-colors text-sm md:text-base"
            aria-label="Edit profile"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#2c3135] px-4 py-2 rounded-lg hover:bg-[#3c4145] transition-colors disabled:opacity-50 text-sm md:text-base flex items-center gap-2"
              aria-label="Save profile"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              )}
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="bg-[#2c3135] px-4 py-2 rounded-lg hover:bg-[#3c4145] transition-colors text-[#a2abb3] text-sm md:text-base"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="flex p-4 sm:p-6 md:p-8">
        <div className="flex w-full flex-col gap-6 items-center">
          <div className="flex gap-4 flex-col items-center">
            <div className="relative">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-[100px] w-[100px] sm:min-h-[120px] sm:w-[120px] md:min-h-[140px] md:w-[140px] ring-2 ring-[#2c3135] ring-offset-2 ring-offset-[#121416]"
                style={{
                  backgroundImage: `url("${avatarPreview}")`,
                  backgroundColor: '#2c3135'
                }}
                aria-label="User profile picture"
              />
              {editMode && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-[#2c3135] rounded-full p-2 cursor-pointer hover:bg-[#3c4145] transition-colors"
                  aria-label="Upload new avatar"
                >
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Upload size={20} className="text-white" />
                </label>
              )}
              {errors.avatar && (
                <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-center">
                {editUser.firstName || user?.firstName || "User"}
              </h1>
              <p className="text-[#a2abb3] text-sm sm:text-base font-normal text-center">
                {editUser.email || user?.email || "No email"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <h2 className="text-lg sm:text-xl font-bold tracking-tight px-4 sm:px-6 md:px-8 pb-2 pt-4">
        Account
      </h2>
      <div className="divide-y divide-[#2c3135]">
        {/* Name Field */}
        <div className="flex items-center gap-4 bg-[#121416] px-4 sm:px-6 md:px-8 min-h-[72px] py-2">
          <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
            <User size={24} />
          </div>
          <div className="flex flex-col justify-center flex-1">
            <p className="text-base font-medium">Name</p>
            {editMode ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <input
                    id="firstName"
                    name="firstName"
                    value={editUser.firstName || ""}
                    onChange={handleChange}
                    className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1 focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                    aria-label="First name"
                    aria-invalid={errors.firstName ? "true" : "false"}
                    aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    id="lastName"
                    name="lastName"
                    value={editUser.lastName || ""}
                    onChange={handleChange}
                    className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1 focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                    aria-label="Last name"
                    aria-invalid={errors.lastName ? "true" : "false"}
                    aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[#a2abb3] text-sm font-normal">
                {user?.firstName} {user?.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Contact Field */}
        <div className="flex items-center gap-4 bg-[#121416] px-4 sm:px-6 md:px-8 min-h-[72px] py-2">
          <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
            <Phone size={24} />
          </div>
          <div className="flex flex-col justify-center flex-1">
            <p className="text-base font-medium">Contact</p>
            {editMode ? (
              <div>
                <input
                  id="contact"
                  name="contact"
                  value={editUser.contact || ""}
                  onChange={handleChange}
                  className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact number"
                  aria-label="Contact number"
                  aria-invalid={errors.contact ? "true" : "false"}
                  aria-describedby={errors.contact ? "contact-error" : undefined}
                />
                {errors.contact && (
                  <p id="contact-error" className="text-red-500 text-xs mt-1">{errors.contact}</p>
                )}
              </div>
            ) : (
              <p className="text-[#a2abb3] text-sm font-normal">
                {user?.contact || "Add contact information"}
              </p>
            )}
          </div>
        </div>

        {/* Address Field */}
        <div className="flex items-center gap-4 bg-[#121416] px-4 sm:px-6 md:px-8 min-h-[72px] py-2">
          <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
            <MapPin size={24} />
          </div>
          <div className="flex flex-col justify-center flex-1">
            <p className="text-base font-medium">Address</p>
            {editMode ? (
              <input
                id="address"
                name="address"
                value={editUser.address || ""}
                onChange={handleChange}
                className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address"
                aria-label="Address"
              />
            ) : (
              <p className="text-[#a2abb3] text-sm font-normal">
                {user?.address || "Add address"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <h2 className="text-lg sm:text-xl font-bold tracking-tight px-4 sm:px-6 md:px-8 pb-2 pt-4">
        Cards
      </h2>
      <div className="flex items-center gap-4 bg-[#121416] px-4 sm:px-6 md:px-8 min-h-[72px] py-2">
        <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
          <CreditCard size={24} />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-base font-medium">Credit Cards</p>
          <p className="text-[#a2abb3] text-sm font-normal">
            {cards?.length > 0 ? `${cards.length} cards added` : "No cards added"}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {submitError && (
        <div className="px-4 sm:px-6 md:px-8 py-2 text-red-500 text-center">
          {submitError}
        </div>
      )}

      <BottomNavBar />
    </div>
  );
};

export default UserProfile;