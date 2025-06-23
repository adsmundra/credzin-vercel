import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-3 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-sm md:text-base text-center md:text-left gap-2 md:gap-4">
        
        {/* Left Side: Copyright */}
        <p>
          © {new Date().getFullYear()} <span className="font-semibold">Credzin</span>. All rights reserved.
        </p>

        {/* Divider for small screens */}
        <div className="md:hidden border-t border-gray-700 w-full my-2"></div>

        {/* Right Side: Links */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <a href="/" className="hover:text-gray-400 transition">Privacy Policy</a>
          <span className="hidden md:inline">|</span>
          <a href="/" className="hover:text-gray-400 transition">Terms of Service</a>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;
