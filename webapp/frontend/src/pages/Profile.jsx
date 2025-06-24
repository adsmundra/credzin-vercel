import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, CreditCard, Home, List, Upload } from 'lucide-react';
import BottomNavBar from "../component/BottomNavBar";

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a2abb3'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.35 18.5C8.66 17.56 10.27 17 12 17s3.34.56 4.65 1.5c-1.31.94-2.91 1.5-4.65 1.5s-3.34-.56-4.65-1.5zm10.79-1.38C16.45 15.8 14.32 15 12 15s-4.45.8-6.14 2.12A7.96 7.96 0 0 1 4 12c0-4.42 3.58-8 8-8s8 3.58 8 8c0 1.85-.63 3.54-1.86 4.12zM12 6c-1.93 0-3.5 1.57-3.5 3.5S10.07 13 12 13s3.5-1.57 3.5-3.5S13.93 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z'/%3E%3C/svg%3E";

const UserProfile = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const cards = useSelector((state) => state.cart.cart);
  const [editMode, setEditMode] = useState(false);
  const [editUser, setEditUser] = useState({});
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);

  // 👇 IMPORTANT: Set avatarPreview based on user data
  useEffect(() => {
    if (user?.profilePic) {
      setAvatarPreview(`http://localhost:5000${user.profilePic}`);
    } else {
      setAvatarPreview(DEFAULT_AVATAR);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed");
        return;
      }
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleEdit = () => {
    setEditUser(user);
    setEditMode(true);
  };

  const handleChange = (e) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      formData.append('userData', JSON.stringify(editUser));

      const response = await fetch('http://localhost:5000/api/profile/profileEdit', {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("❌ Server Error:", data);
        throw new Error(data.message || `Server error: ${response.status}`);
      }
      console.log("✅ Profile updated successfully:", data);
      setEditMode(false);
      setAvatarFile(null);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      if (error.message.includes('fetch')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert(`Failed to update profile: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditUser(user);
    setAvatarPreview(user.profilePic ? `http://localhost:5000${user.profilePic}` : DEFAULT_AVATAR);
    setAvatarFile(null);
  };

  if (!user) return <div className="text-white">Loading...</div>;

  return (
    <div className="relative flex min-h-screen flex-col bg-[#121416] text-white font-['Manrope']">
      <div className="flex items-center bg-[#121416] p-14 pb-6 justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-white flex size-12 shrink-0 items-center"
        >
          <svg
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
          </svg>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Profile
        </h2>
        {!editMode ? (
          <button
            onClick={handleEdit}
            className="text-white bg-[#2c3135] px-4 py-2 rounded-lg hover:bg-[#3c4145] transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-white bg-[#2c3135] px-4 py-2 rounded-lg hover:bg-[#3c4145] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="text-[#a2abb3] bg-[#2c3135] px-4 py-2 rounded-lg hover:bg-[#3c4145] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex p-4 @container">
        <div className="flex w-full flex-col gap-4 items-center">
          <div className="flex gap-4 flex-col items-center">
            <div className="relative">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32 ring-2 ring-[#2c3135] ring-offset-2 ring-offset-[#121416]"
                style={{
                  backgroundImage: `url(${avatarPreview})`,
                  backgroundColor: '#2c3135'
                }}
              />
              {editMode && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-[#2c3135] rounded-full p-2 cursor-pointer hover:bg-[#3c4145] transition-colors"
                >
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Upload size={20} className="text-white" />
                </label>
              )}
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">
                {editUser.firstName}
              </p>
              <p className="text-[#a2abb3] text-base font-normal leading-normal text-center">
                {editUser.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
        Account
      </h3>
      <div className="divide-y divide-[#2c3135]">
        <div className="flex items-center gap-4 bg-[#121416] px-4 min-h-[72px] py-2">
          <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
            <User size={24} />
          </div>
          <div className="flex flex-col justify-center flex-1">
            <p className="text-base font-medium line-clamp-1">Name</p>
            {editMode ? (
              <div className="flex gap-2">
                <input
                  name="firstName"
                  value={editUser.firstName || ""}
                  onChange={handleChange}
                  className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1"
                  placeholder="First name"
                />
                <input
                  name="lastName"
                  value={editUser.lastName || ""}
                  onChange={handleChange}
                  className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1"
                  placeholder="Last name"
                />
              </div>
            ) : (
              <p className="text-[#a2abb3] text-sm font-normal line-clamp-2">
                {user.firstName} {user.lastName}
              </p>
            )}
            <p className="text-[#a2abb3] text-xs mt-1">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#121416] px-4 min-h-[72px] py-2">
          <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
            <Phone size={24} />
          </div>
          <div className="flex flex-col justify-center flex-1">
            <p className="text-base font-medium line-clamp-1">Contact</p>
            {editMode ? (
              <input
                name="contact"
                value={editUser.contact || ""}
                onChange={handleChange}
                className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1"
                placeholder="Enter contact number"
              />
            ) : (
              <p className="text-[#a2abb3] text-sm font-normal line-clamp-2">
                {user.contact || "Add contact information"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#121416] px-4 min-h-[72px] py-2">
          <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
            <MapPin size={24} />
          </div>
          <div className="flex flex-col justify-center flex-1">
            <p className="text-base font-medium line-clamp-1">Address</p>
            {editMode ? (
              <input
                name="address"
                value={editUser.address || ""}
                onChange={handleChange}
                className="bg-[#2c3135] rounded px-2 py-1 w-full text-white mt-1"
                placeholder="Enter address"
              />
            ) : (
              <p className="text-[#a2abb3] text-sm font-normal line-clamp-2">
                {user.address || "Add address"}
              </p>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
        Cards
      </h3>
      <div className="flex items-center gap-4 bg-[#121416] px-4 min-h-[72px] py-2">
        <div className="text-white flex items-center justify-center rounded-lg bg-[#2c3135] shrink-0 size-12">
          <CreditCard size={24} />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-base font-medium line-clamp-1">Credit Cards</p>
          <p className="text-[#a2abb3] text-sm font-normal line-clamp-2">
            {cards.length > 0 ? `${cards.length} cards added` : "No cards added"}
          </p>
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

const NavItem = ({ icon, text, href, active = false }) => (
  <a
    href={href}
    className={`flex flex-1 flex-col items-center justify-end gap-1 ${active ? 'text-white' : 'text-[#a2abb3]'}`}
  >
    <div className={`flex h-8 items-center justify-center ${active ? 'text-white' : 'text-[#a2abb3]'}`}>
      {icon}
    </div>
    <p className={`text-xs font-medium leading-normal tracking-[0.015em] ${active ? 'text-white' : 'text-[#a2abb3]'}`} >
      {text}
    </p>
  </a>
);

export default UserProfile;
