import React, { useState } from 'react';
import axios from 'axios';
import { apiEndpoint } from '../api';  
import { useNavigate } from 'react-router-dom';
import BottomNavBar from '../component/BottomNavBar';
const AdditionalDetails = () => {
  const [ageRange, setAgeRange] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [expenseRange, setExpenseRange] = useState('');
  const [profession, setProfession] = useState('');       // New profession state
  const [location, setLocation] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async () => {
    const userData = { ageRange, salaryRange, expenseRange, profession, location };
    console.log('Submitted:', userData);
    try {
      const token = localStorage.getItem("token"); 

      const response = await axios.post(
        `${apiEndpoint}/api/v1/auth/additionalDetails`, 
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status !== 200) {
        throw new Error('Submission failed');  
      }
      if (response.status === 200) {
        console.log("Submission successful"); 
        // localStorage.setItem("token", response.data.token); // Store the new token if provided
        // Redirect to the next page or show a success message  
        navigate('/manage-cards'); // Adjust the route as needed
      }
        console.log("Server response:", response.data);
    } catch (error) {
      console.error("Submission failed:", error.response?.data || error.message);
    }
  };

  const handleOnSkip = () => {
    console.log('User skipped the form');
    // Add redirect or close modal logic here
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      {/* Navbar */}

      {/* Form Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4 text-center">
            Tell us a bit about yourself
          </h2>
          <p className="text-sm sm:text-base text-blue-600 mb-8 text-center">
            This helps us personalize your experience. You can skip this step.
          </p>

          {/* Age Range */}
          <div className="mb-6">
            <label className="block text-sm sm:text-base font-medium text-gray-800 mb-2">
              Age Range
            </label>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 placeholder-gray-700"
            >
              <option value="">Select Age Range</option>
              <option value="18-24">18 - 24</option>
              <option value="25-34">25 - 34</option>
              <option value="35-44">35 - 44</option>
              <option value="45-54">45 - 54</option>
              <option value="55+">55+</option>
            </select>
          </div>

          {/* Salary Range */}
          <div className="mb-6">
            <label className="block text-sm sm:text-base font-medium text-gray-800 mb-2">
              Monthly Salary Range
            </label>
            <select
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 placeholder-gray-700"
            >
              <option value="">Select Salary Range</option>
              <option value="0-10000">Below ₹10,000</option>
              <option value="10000-25000">₹10,000 - ₹25,000</option>
              <option value="25000-50000">₹25,000 - ₹50,000</option>
              <option value="50000-100000">₹50,000 - ₹1,00,000</option>
              <option value="100000+">Above ₹1,00,000</option>
            </select>
          </div>

          {/* Expense Range */}
          <div className="mb-6">
            <label className="block text-sm sm:text-base font-medium text-gray-800 mb-2">
              Monthly Expense Range
            </label>
            <select
              value={expenseRange}
              onChange={(e) => setExpenseRange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 placeholder-gray-700"
            >
              <option value="">Select Expense Range</option>
              <option value="0-5000">Below ₹5,000</option>
              <option value="5000-15000">₹5,000 - ₹15,000</option>
              <option value="15000-30000">₹15,000 - ₹30,000</option>
              <option value="30000+">Above ₹30,000</option>
            </select>
          </div>

          {/* Profession (NEW) */}
          <div className="mb-6">
            <label className="block text-sm sm:text-base font-medium text-gray-800 mb-2">
              Profession
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Enter your profession"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 placeholder-gray-700"
            />
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm sm:text-base font-medium text-gray-800 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your location"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 placeholder-gray-700"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={handleOnSkip}
              className="w-full sm:w-auto text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
      <BottomNavBar/>
      {/* Footer */}
    </div>
  );
};

export default AdditionalDetails;
