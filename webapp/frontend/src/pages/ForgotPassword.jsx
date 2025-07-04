//ForgotPassword.jsx

import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { apiEndpoint } from "../api";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${apiEndpoint}/api/v1/auth/forgot-password`, { email });
            console.log("Response from forgot password:", res.data);

            toast.success("Password reset link sent to your email!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: "rgb(17, 20, 24)" }}
        >
            <form onSubmit={handleSubmit} className="p-6 max-w-md w-full bg-gray-800 rounded shadow">
                <h2 className="text-2xl font-bold mb-6 text-white text-center">Forgot Password</h2>
                <input
                    type="email"
                    placeholder="Enter your registered email"
                    className="p-2 border rounded w-full mb-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-full"
                >
                    Send Reset Link
                </button>
            </form>
        </div>
    );
};

export default ForgotPassword;
