
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Route,
  Routes,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivateRoute from "./component/PrivateRoutes";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUser } from "./app/slices/authSlice";
import { setCart } from "./app/slices/cartSlice";
import "./index.css";
import { apiEndpoint } from "./api";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import ManageCards from "./pages/ManageCards"; // Import the new page
import { setBankList } from "./app/slices/bankSlice";
import AdditionalDetails from "./pages/AdditionalDetails";
import Profile from "./pages/Profile";
import { setRecommendedList } from "./app/slices/recommendedSlice";
import BottomNavBar from "./component/BottomNavBar";
import CardPool from "./pages/Card_pool";
import Articles from "./pages/Articles";
import Website from "./pages/Website";
import GroupDetails from "./pages/GroupDetails";
import Transactions from "./pages/Transactions";
import NotificationSettings from "./pages/NotificationSettings";
import GoogleLoginAdditionalDetails from "./pages/GoogleLoginAdditionalDetails";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CardBenifits from "./pages/CardBenifits";
import Cookies from "js-cookie";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BillPay from "./pages/BillPay";
import flagsmith from "flagsmith";
import CardDetails from "./pages/CardDetails";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const initialDataLoaded = useRef(false);

  const checkAuth = useCallback(() => {
    return !!Cookies.get("user_Auth");
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());
  const [isBillFeatureEnabled, setIsBillFeatureEnabled] = useState(false);

  // State to control header visibility
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Function to toggle header visibility
  const showHeader = (visible) => {
    setIsHeaderVisible(visible);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  useEffect(() => {
    flagsmith.init({
      environmentID: "cpYZqHctFvRMwFAXoN4eHd", // Paste your key here
      onChange: () => {
        const flagValue = flagsmith.hasFeature("bill_pay");
        setIsBillFeatureEnabled(flagValue);
        localStorage.setItem("billFeatureEnabled", JSON.stringify(flagValue));
      },
    });
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromURL = queryParams.get("token");

    if (
      tokenFromURL &&
      tokenFromURL !== "null" &&
      tokenFromURL !== "undefined"
    ) {
      localStorage.setItem("token", tokenFromURL);
      Cookies.set("user_Auth", tokenFromURL, {
        expires: 10,
        sameSite: "Lax",
      });
      setIsAuthenticated(true); // Set auth state on token from URL
      navigate(location.pathname, { replace: true });
    }

    if (!isAuthenticated && location.pathname !== "/login" && location.pathname !== "/signup" && location.pathname !== "/forgot-password") {
      navigate("/login");
    } else if (isAuthenticated && (location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/")) {
      navigate("/home");
    }
  }, [location, navigate, isAuthenticated]);

  const get_all_bank = useCallback(async () => {
    const cachedBanks = sessionStorage.getItem("banks");
    if (cachedBanks) {
      dispatch(setBankList(JSON.parse(cachedBanks)));
      return;
    }
    try {
      const response = await axios.get(`${apiEndpoint}/api/v1/card/all_bank`);
      const banks = response.data?.banks || [];
      dispatch(setBankList(banks));
      sessionStorage.setItem("banks", JSON.stringify(banks));
    } catch (err) {
      console.error("Error fetching banks:", err.response?.data || err);
    }
  }, [dispatch]);

  const getUserFullDetails = useCallback(async () => {
    const cachedUserDetails = sessionStorage.getItem("userDetails");
    if (cachedUserDetails) {
      const userData = JSON.parse(cachedUserDetails);
      const { CardAdded, ...userInfo } = userData;
      dispatch(setUser(userInfo));
      if (Array.isArray(CardAdded)) dispatch(setCart(CardAdded));
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await axios.get(
        `${apiEndpoint}/api/v1/auth/userdetail`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        const userData = response.data.data;
        const { CardAdded, ...userInfo } = userData;
        dispatch(setUser(userInfo));
        if (Array.isArray(CardAdded)) dispatch(setCart(CardAdded));
        sessionStorage.setItem("userDetails", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error fetching user data:", error.response?.data || error.message);
    }
  }, [dispatch]);

  const getRecommendedCard = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const cachedRecommended = sessionStorage.getItem("recommendedCards");
    if (cachedRecommended) {
      dispatch(setRecommendedList(JSON.parse(cachedRecommended)));
      return;
    }
    try {
      const response = await axios.get(
        `${apiEndpoint}/api/v1/card/recommendedcard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        const recommendedCards = response.data.cards;
        dispatch(setRecommendedList(recommendedCards));
        sessionStorage.setItem("recommendedCards", JSON.stringify(recommendedCards));
      }
    } catch (error) {
      console.error("Error fetching recommended cards:", error.response?.data || error.message);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && !initialDataLoaded.current) {
      getUserFullDetails();
      get_all_bank();
      getRecommendedCard();
      initialDataLoaded.current = true;
    }
  }, [isAuthenticated, getUserFullDetails, get_all_bank, getRecommendedCard]);

  const handleLogout = () => {
    Cookies.remove("user_Auth");
    sessionStorage.clear();
    localStorage.clear();
    setIsAuthenticated(false);
    initialDataLoaded.current = false;
    navigate("/login");
  };

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route
          path="/home"
          element={<Home showHeader={isHeaderVisible} />}
        />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/manage-cards" element={<ManageCards />} />
        <Route path="/additional-details" element={<AdditionalDetails />} />
        <Route path="/profile" element={<Profile onLogout={handleLogout} />} />
        <Route
          path="/googleAdditionaldetails"
          element={<GoogleLoginAdditionalDetails />}
        />
        <Route
          path="/card-pool"
          element={
            <PrivateRoute>
              <CardPool />
            </PrivateRoute>
          }
        />
        <Route path="/group/:groupId" element={<GroupDetails />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/website" element={<Website />} />
        <Route path="/Transactions" element={<Transactions />} />
        <Route
          path="/notification-settings"
          element={<NotificationSettings />}
        />
        <Route path="#" element={<PrivacyPolicy />} />
        <Route path="/home/card-benifits" element={<CardBenifits />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {isBillFeatureEnabled && (
          <Route path="/bill-pay" element={<BillPay />} />
        )}
        <Route path="/carddetails/:id" element={<CardDetails />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
