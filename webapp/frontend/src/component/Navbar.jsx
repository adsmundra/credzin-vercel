import React, { useState, useEffect, useRef } from "react";
import { Menu, X, Search } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../app/slices/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import Cookies from 'js-cookie';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const profileRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  console.log("Redux Auth USER:-==", user);
  

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleProfile = () => setProfileOpen(!profileOpen);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    Cookies.remove('user_Auth');
    navigate("/login");
  };

  // Profile click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Mobile Search click outside
  useEffect(() => {
    if (!showMobileSearch) return;

    const handleClick = (e) => {
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target)
      ) {
        setShowMobileSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMobileSearch]);

  // Mobile Menu click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm("");
    setShowMobileSearch(false);
  };
  const handleBlogClick = () => {
    window.open("http://www.credzin.com/articles/", "_blank");
  };
  const handleWebsiteClick = () => {
    window.open("http://www.credzin.com/", "_blank");
  };

  return (
    <nav className="bg-[#1b2127] p-1 shadow-md w-full fixed top-0 z-50">
      <div className="flex justify-between items-center text-white font-medium max-w-7xl mx-auto px-4 relative">
        {/* Logo */}
        <div className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide">
          <button
            onClick={() => navigate("/home")}
            className="hover:text-gray-400 transition-colors duration-200"
          >
            CREDZIN
          </button>
        </div>

        {/* Desktop Search Box */}
        {!isAuthPage && (
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:block flex-1 mx-14"
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white text-black focus:outline-none"
            />
          </form>
        )}

        {/* Mobile menu & search icons */}
        <div className="flex items-center md:hidden gap-6">
          {!isAuthPage && (
            <button
              onClick={() => setShowMobileSearch((prev) => !prev)}
              className="text-white focus:outline-none p-0 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              <Search size={24} />
            </button>
          )}
          {!isAuthPage && (
            <div className="text-white">
              <NotificationBell />
            </div>
          )}
          <button
            onClick={toggleMenu}
            className="text-white focus:outline-none p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        {!isAuthPage && (
          <ul className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <li>
              <button
                onClick={() => navigate("/home")}
                className="px-3 py-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={handleWebsiteClick}
                className="px-3 py-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center"
              >
                Website
              </button>
            </li>
            <li>
              <button
                onClick={handleBlogClick}
                className="px-3 py-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center"
              >
                Articles
              </button>
            </li>
            <li>
              <NotificationBell />
            </li>
            <li className="relative" ref={profileRef}>
              <button
                onClick={toggleProfile}
                className="px-3 py-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center"
              >
                Profile
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white text-black rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b">
                    <p className="font-semibold truncate">
                      {user?.name?.split(" ")[0] || "User"}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {user?.email || "Email"}
                    </p>
                  </div>
                  <ul className="py-2">
                    <li>
                      <button
                        onClick={() => {
                          navigate("/manage-cards");
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                      >
                        Manage Cards
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                      >
                        View Profile
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          navigate("/notification-settings");
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                      >
                        Notification Settings
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          handleLogout();
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 text-red-600"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          </ul>
        )}
      </div>

      {/* Mobile Search Box */}
      {showMobileSearch && !isAuthPage && (
        <div
          ref={mobileSearchRef}
          className="md:hidden fixed top-[60px] left-0 right-0 bg-[#1b2127] border-t border-gray-600/30 z-50 px-4 py-3"
        >
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white text-black focus:outline-none"
              autoFocus
            />
          </form>
        </div>
      )}

      {/* Mobile Navigation - Updated with blended background */}
      {isOpen && !isAuthPage && user && (
        <div
          ref={mobileMenuRef}
          className="md:hidden fixed top-[60px] left-0 right-0 bg-[#1b2127]/95 backdrop-blur-sm border-t border-gray-600/30 z-40 shadow-xl"
        >
          <ul className="flex flex-col p-4 space-y-2">
            <li>
              <button
                onClick={() => {
                  navigate("/home");
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#2a3139] text-white transition-colors duration-200 border border-transparent hover:border-gray-600/20"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  handleWebsiteClick();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#2a3139] text-white transition-colors duration-200 border border-transparent hover:border-gray-600/20"
              >
                Website
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  handleBlogClick();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#2a3139] text-white transition-colors duration-200 border border-transparent hover:border-gray-600/20"
              >
                Articles
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#2a3139] text-white transition-colors duration-200 border border-transparent hover:border-gray-600/20"
              >
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  navigate("/notification-settings");
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#2a3139] text-white transition-colors duration-200 flex items-center justify-between border border-transparent hover:border-gray-600/20"
              >
                <span>Notification Settings</span>
                <div className="relative">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v4.5l2.25 2.25a.75.75 0 0 1-.75 1.25H3a.75.75 0 0 1-.75-.75L4.5 14.25V9.75a6 6 0 0 1 6-6Z"
                    />
                  </svg>
                </div>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition-colors duration-200 border border-red-400/30"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
