import React, { useEffect, useState } from "react";
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

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");

  // State to control header visibility
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Function to toggle header visibility
  const showHeader = (visible) => {
    setIsHeaderVisible(visible);
  };

  useEffect(() => {
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    if (token) {
      // Store token securely (e.g., in localStorage or state)
      localStorage.setItem("token", token);
      console.log("Token saved:", token);

      // Remove token from URL
      // navigate('/googleAdditionaldetails', { replace: true });
    }
  }, [location, navigate]);

  // Step 2: Fetch user info
  const getUser = async () => {
    if (localStorage.getItem("token")) {
      try {
        const response = await axios.get(
          `${apiEndpoint}/api/v1/auth/userdata`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("User data:", response.data.user);
        if (response.status === 200) {
          dispatch(setUser(response.data.user));
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
  };

  // Step 3: Fetch card info
  const getCardDetails = async () => {
    if (localStorage.getItem("token")) {
      try {
        const response = await axios.get(
          `${apiEndpoint}/api/v1/auth/addedcards`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Card details:", response.data.cards);
        if (response.status === 200) {
          dispatch(setCart(response.data.cards));
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
      }
    }
  };
  const get_all_bank = async () => {
    try {
      const response = await axios.get(`${apiEndpoint}/api/v1/card/all_bank`);
      const banks = response.data?.banks || [];
      dispatch(setBankList(banks));
    } catch (err) {
      console.error("Error fetching banks:", err.response?.data || err);
    }
  };

  const getUserFullDetails = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No token found");
      return;
    }

    try {
      const response = await axios.get(
        `${apiEndpoint}/api/v1/auth/userdetail`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        console.log("User full details:", response.data.data);
        const userData = response.data.data;

        const { CardAdded, ...userInfo } = userData;

        // Store user info (excluding CardAdded)
        dispatch(setUser(userInfo));

        // Store CardAdded in the cart slice
        if (Array.isArray(CardAdded)) {
          dispatch(setCart(CardAdded));
        }

        console.log("User and cards set in Redux.");
      }
    } catch (error) {
      console.error(
        "Error fetching user data:",
        error.response?.data || error.message
      );
    }
  };

  const getRecommendedCard = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found");
      return;
    }
    try {
      const response = await axios.get(
        `${apiEndpoint}/api/v1/card/recommendedcard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Recommended cards:", response.data);

      if (response.status === 200) {
        console.log("Recommended cards:", response.data.cards);
        const recommendedCards = response.data.cards;
        dispatch(setRecommendedList(recommendedCards));

        // dispatch(setCart(recommendedCards));
      }
    } catch (error) {
      console.error(
        "Error fetching recommended cards:",
        error.response?.data || error.message
      );
    }
  };
  // Step 4: Run once on mount
  useEffect(() => {
    getUserFullDetails();
    getUser();
    getCardDetails();
    get_all_bank();
    getRecommendedCard();
  }, [token]);

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route
          path="/home"
          element={
            // <PrivateRoute>
              <Home showHeader={isHeaderVisible} />
            // </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/manage-cards" element={<ManageCards />} />{" "}
        {/* New Route */}
        <Route path="/additional-details" element={<AdditionalDetails />} />
        <Route path="/profile" element={<Profile />} />
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
        <Route path="/privacy-policy" element={PrivacyPolicy}></Route>
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
