import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiEndpoint } from "../api";
import { toast } from "react-toastify";

const bgHero =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDo33nlRTTSTVp-UbxEFJZuhaSH-DUwGfiAnsMlfWvB5lfpnP8tZAdhjyMRpwuEK3gGqRbpaOCpyHTz1xwdouQbld6N9RHg7_jXkAM6gDw0qqxy2r5wsq-QcYk0fn4sICC_pt1aQgBa98A2xfxT2FZ_qPV6ryd4zKptDLRfu3iKR5O8_wDgsv4sCVHUUIqZp2wR-BLTZKzgSfk9Whu41EMuc8zMhFRfoJqEu8PrWoqANSSxj5xE5dx2pDdMG1llkwmR3hJsxpjMdnw";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${apiEndpoint}/api/v1/auth/login`,
        formData,
        { withCredentials: true }
      );
      if (response.status !== 200) throw new Error("Login failed");
      toast.success("Login successful!", { position: "top-center", autoClose: 1000 });
      localStorage.setItem("token", response.data.token);
      if (response.data.user.isfirstLogin === true) {
        navigate("/additional-details");
      } else if (response.data.user.CardAdded.length === 0) {
        navigate("/manage-cards");
      } else {
        navigate("/home");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleGoogleLogin = () => {
    window.open(`${apiEndpoint}/api/v1/auth/oauth/get_auth_url`, "_self");
  };

  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#111418] items-center justify-between overflow-x-hidden"
      style={{
        fontFamily: `Manrope, "Noto Sans", sans-serif`
      }}
    >
      {/* Hero Image */}
      {/* <div className="w-full max-w-[480px] px-4 py-3 mx-auto">
        <div
          className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-[#111418] rounded-xl min-h-80"
          style={{ backgroundImage: `url(${bgHero})` }}
        ></div>
      </div> */}

      {/* Login Form */}
      <h2 className="text-white tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-2 pt-14">
        Log in
      </h2>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[480px] mx-auto flex flex-col gap-2"
        autoComplete="off"
      >
        {/* Email */}
        <div className="flex flex-col min-w-40 flex-1 px-4 py-3">
          <label className="text-white text-base font-medium leading-normal pb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Enter your email"
            className="form-input w-full rounded-xl text-white border-none bg-[#283039] h-14 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal focus:outline-0 focus:ring-0 focus:border-none"
            value={formData.email}
            onChange={handleChange}
            autoComplete="username"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col min-w-40 flex-1 px-4 py-3">
          <label className="text-white text-base font-medium leading-normal pb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Enter your password"
            className="form-input w-full rounded-xl text-white border-none bg-[#283039] h-14 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal focus:outline-0 focus:ring-0 focus:border-none"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>

        {/* Remember Me Switch */}
        <div className="flex items-center gap-4 bg-[#111418] px-4 min-h-14 justify-between">
          <p className="text-white text-base font-normal leading-normal flex-1 truncate">
            Remember me
          </p>
          <label
            className={`relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none p-0.5 transition-colors ${remember
                ? "justify-end bg-[#0c7ff2]"
                : "justify-start bg-[#283039]"
              }`}
          >
            <div
              className="h-full w-[27px] rounded-full bg-white transition-all"
              style={{
                boxShadow:
                  "rgba(0, 0, 0, 0.15) 0px 3px 8px, rgba(0, 0, 0, 0.06) 0px 3px 1px"
              }}
            ></div>
            <input
              type="checkbox"
              checked={remember}
              onChange={() => setRemember((v) => !v)}
              className="invisible absolute"
              tabIndex={-1}
              aria-hidden="true"
            />
          </label>
        </div>

        {/* Log in Button */}
        <div className="flex px-4 py-3">
          <button
            type="submit"
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 flex-1 bg-[#0c7ff2] text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#0066cc]"
          >
            <span className="truncate">Log in</span>
          </button>
        </div>

        {/* Google Sign In Button */}
        <div className="flex px-4 pb-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 flex-1 bg-white text-[#111418] text-base font-bold leading-normal tracking-[0.015em] border border-[#283039] transition-colors hover:bg-gray-100"
          >
            <img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
              alt="Google logo"
              className="h-5 w-5 mr-2"
            />
            <span className="truncate">Sign in with Google</span>
          </button>
        </div>

        {/* Sign Up Button */}
        <div className="flex px-4 pb-3">
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 flex-1 bg-[#283039] text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#3c4145]"
          >
            <span className="truncate">Create an account</span>
          </button>
        </div>
      </form>

      {/* Forgot Password Link */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-[#9cabba] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center underline cursor-pointer">
          Forgot password?
        </p>
        <p className="text-[#9cabba] text-sm font-normal leading-normal px-4 text-center">
          {/* Don't have an account yet?{' '} */}
          {/* <span 
            onClick={() => navigate('/signup')}
            className="text-[#0c7ff2] cursor-pointer hover:underline"
          >
            Sign up
          </span> */}
        </p>
      </div>

      {/* Bottom Illustration */}
      <div>
        <div
          className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-none hidden dark:block"
          style={{
            backgroundImage: 'url("/dark.svg")',
            aspectRatio: "390/320"
          }}
        ></div>
        <div
          className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-none block dark:hidden"
          style={{
            backgroundImage: 'url("/light.svg")',
            aspectRatio: "390/320"
          }}
        ></div>
      </div>
    </div>
  );
}

export default Login;
