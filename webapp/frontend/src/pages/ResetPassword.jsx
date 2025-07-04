//ResetPassword.jsx


import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { apiEndpoint } from "../api";
import { useNavigate } from "react-router";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState("");
    const [tokenFromURL, setTokenFromURL] = useState(null);
    const [idFromURL, setIdFromURL] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        const id = searchParams.get("id");

        if (token && id) {
            localStorage.setItem("reset_token", token);
            localStorage.setItem("reset_id", id);
            setTokenFromURL(token);
            setIdFromURL(id);
        } else {
            const storedToken = localStorage.getItem("reset_token");
            const storedId = localStorage.getItem("reset_id");

            if (storedToken && storedId) {
                setTokenFromURL(storedToken);
                setIdFromURL(storedId);
            } else {
                toast.error("Invalid or missing reset token.");
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post(`${apiEndpoint}/api/v1/auth/reset-password`, {
                token: tokenFromURL,
                id: idFromURL,
                password,
            });
            toast.success("Password reset successfully!");
            console.log("Navigating to login page after reset");
            localStorage.removeItem("token");
            Cookies.remove("user_Auth");
            navigate("/login");

        } catch (error) {
            toast.error(error.response?.data?.message || "Reset failed");
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: "rgb(17, 20, 24)" }}
        >
            <form onSubmit={handleSubmit} className="p-6 max-w-md w-full bg-gray-800 rounded shadow">
                <h2 className="text-2xl font-bold mb-6 text-white text-center">Reset Password</h2>
                <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full p-2 mb-3 border rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-full">
                    Reset Password
                </button>
            </form>
        </div>
    );
};

export default ResetPassword;
