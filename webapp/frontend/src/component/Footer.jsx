// import React from 'react';

// const Footer = () => {
//   return (
//     <footer className="bg-black text-white py-3 shadow-lg">
//       <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-sm md:text-base text-center md:text-left gap-2 md:gap-4">
        
//         {/* Left Side: Copyright */}
//         <p>
//           © {new Date().getFullYear()} <span className="font-semibold">Credzin</span>. All rights reserved.
//         </p>

//         {/* Divider for small screens */}
//         <div className="md:hidden border-t border-gray-700 w-full my-2"></div>

//         {/* Right Side: Links */}
//         <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
//           <a href="/privacy-policy" className="hover:text-gray-400 transition">Privacy Policy</a>
//           <span className="hidden md:inline">|</span>
//           <a href="/home" className="hover:text-gray-400 transition">Terms of Service</a>
//         </div>
        
//       </div>
//     </footer>
//   );
// };

// export default Footer;








import React from 'react';

const Footer = () => {

const handleBlogClick = () => {
    window.open("http://www.credzin.com/articles/", "_blank");
  };
  const handleWebsiteClick = () => {
    window.open("http://www.credzin.com/", "_blank");
  };


  return (
    <footer className="bg-black text-white py-3 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-sm md:text-base text-center md:text-left gap-2 md:gap-4">
        
        {/* Left Side: Links + Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <a href="/website" className="hover:text-gray-400 transition" onClick={handleBlogClick}>Website</a> |
            <a href="/articles" className="hover:text-gray-400 transition" onClick={handleWebsiteClick}>Articles</a>
          </div>
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} <span className="font-semibold">Credzin</span>. All rights reserved.
          </p>
        </div>

        {/* Divider for small screens */}
        <div className="md:hidden border-t border-gray-700 w-full my-2"></div>

        {/* Right Side: Terms */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <a href="/terms" className="hover:text-gray-400 transition">Terms of Service</a> |
            <a href="/privacy-policy" className="hover:text-gray-400 transition">Privacy Policy</a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
