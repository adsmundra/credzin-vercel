import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiEndpoint } from '../api';
import { toast } from 'react-toastify';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingOverlay from '../component/LoadingOverlay';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    contact: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${apiEndpoint}/api/v1/auth/signup`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        contact: formData.contact,
      });

      if (response.status === 200) {
        toast.success('Signup successful! Please log in.', {
          autoClose: 1000,
          position: 'top-center',
        });
        navigate('/login');
      } else {
        toast.error(response.data.message || 'Signup failed.', {
          autoClose: 1000,
          position: 'top-center',
        });
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#1a1a1a] justify-center items-center overflow-x-hidden"
      style={{ fontFamily: 'Manrope, Noto Sans, sans-serif' }}
    >
      {loading && (<LoadingOverlay />)}
      <div className="w-full max-w-md">
        <h1 className="text-white text-[22px] font-bold px-4 pt-14 pb-3 text-center">Create your account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="flex w-full flex-wrap gap-4 px-4 py-3">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              className="form-input w-full rounded-xl text-white bg-[#363636] h-14 placeholder:text-[#adadad] p-4"
              required
            />
          </div>
          <div className="flex w-full flex-wrap gap-4 px-4 py-3">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className="form-input w-full rounded-xl text-white bg-[#363636] h-14 placeholder:text-[#adadad] p-4"
              required
            />
          </div>
          <div className="flex w-full flex-wrap gap-4 px-4 py-3">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className="form-input w-full rounded-xl text-white bg-[#363636] h-14 placeholder:text-[#adadad] p-4"
              required
            />
          </div>
          <div className="flex w-full flex-wrap gap-4 px-4 py-3">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="form-input w-full rounded-xl text-white bg-[#363636] h-14 placeholder:text-[#adadad] p-4"
              required
            />
          </div>
          <div className="flex w-full flex-wrap gap-4 px-4 py-3">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Retype Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input w-full rounded-xl text-white bg-[#363636] h-14 placeholder:text-[#adadad] p-4"
              required
            />
          </div>
          <div className="flex w-full flex-wrap gap-4 px-4 py-3">
            <input
              type="text"
              name="contact"
              placeholder="Contact"
              value={formData.contact}
              onChange={handleChange}
              className="form-input w-full rounded-xl text-white bg-[#363636] h-14 placeholder:text-[#adadad] p-4"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center px-4">{error}</p>}

          <div className="flex w-full px-4 py-3 justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`w-60 h-12 rounded-full text-white font-bold tracking-[0.015em] transition-colors ${loading ? 'bg-[#363636]/70 cursor-not-allowed' : 'bg-[#363636]'
                }`}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign up'
              )}
            </button>
          </div>
        </form>

        <div>
          <p className="text-[#adadad] text-sm text-center pb-1 px-4">Already have an account?</p>
          <p className="text-[#adadad] text-sm text-center underline pb-3 px-4">
            <a href="/login">Log in</a>
          </p>
          <div className="h-5 bg-[#1a1a1a]" />
        </div>
      </div>
    </div>
  );
};

export default Signup;
