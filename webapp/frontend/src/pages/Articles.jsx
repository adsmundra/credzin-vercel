import React from "react";
import BottomNavBarBar from "../component/BottomNavBar";

// import "../styles/Articles.css"; // Assuming you have a CSS file for styles

// const featured = {
//   title: "The Future of AI in Healthcare",
//   desc: "Exploring how artificial intelligence is revolutionizing medical diagnostics and patient care.",
//   author: "Alex Turner",
//   time: "2d ago",
//   img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-5VGnlfupT2uwWg1AaYjshPMVw4Q0ewj4qtTy01TLulvhFxtb56DVrCG0OsmajDJjifvP_80BD2mur0uz7K19rzCOeRi8O7sEQ1g1zU9IQ4XQJhglde424TyHpypvFJZ6KBcDw5eFhiYdkzxAFqk_JfJgDlsHmLiLHt1i2D7spaQsA0Rq788gxGf2I0VI4o31j6mpYgPBfaYwXQSkzBKH6NeAxsceu9au5DAFeoJOAiy8AZayFwIGHUYg-L76vSBwW1Hi4mY051c"
// };

// const latest = [
//   {
//     title: "Sustainable Tech Innovations",
//     desc: "By Sarah Chen · 1d ago",
//     img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCewyB3tqNQtfn9liGZH4lTUQRswSGRKyJk4q8z94RUhNtEqALMQdjjRBInyWzisVY9TJVA__EenGG-cZMY3Ck1LH82ntND2pgMT1P-dG-9pGk3aSh6o379rJVnLSrFw1sz1gzeo_Gf7fiuDfoM5MHqm7FJ1N5elbrXEt5K19u0DM3apIULwO8sxiXk90wgs2JtmAyH_07ghBtzMcyxoIsVceSmBCGXDHlVS4ZvjnM04Y1sPEIjqwMNYFjZjW8c8UIzshEPVGRF3gA"
//   },
//   {
//     title: "The Rise of Quantum Computing",
//     desc: "By David Lee · 3d ago",
//     img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3M4_ORKCZK-6yFA9DTNMoGTRvEDG3JbgUDZo1Ky6QyRQSfN3qQQnb4uHzpkOpD45fM2yMPfi2DYG9dMoo8HZI9kX7RThV_88fIojmh4KdBaZ9sverdO-4WHhjKgmXUTKI5Q_eLjL2NTagkLORJvl-e9i7pciNDhdKOKx0L-nthUkz1H8KtJj4W8OrMhceMjsl7zcKyx3dIj8OvqMRU_wV4UM26KEavNw6ijnppzD5uqNeEP3abJYhxjig6O0KE5CcMvo11p-jtXM"
//   },
//   {
//     title: "Cybersecurity in the Digital Age",
//     desc: "By Emily Wong · 4d ago",
//     img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMCS5n9d-jm6eKx9OY0iiglSKxMrSv-jOhcILKY6V3bto5cPfd8PebW_3HYdJk476hXRmYFBBeRbXZz2vjDEXb-E9DiNU28TcN2h2BqwG7yauaD6vdez3w3zJs5QI96Dg_fmlRd9BhQpu9MNi3CpSRhqJblrQTuWIOPmSRpVnlltfBYYEsWaOhheOaHykgWie_GIQkNwLO5qjY9ARU4Z0NDY5ruXI3m0W5sLMolfyNAnTiPmLCBvqURiG89qaJ54aTbehddgxXOmI"
//   },
//   {
//     title: "The Impact of 5G Technology",
//     desc: "By Michael Brown · 5d ago",
//     img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgdBl00DijWfja6HAZI-HHOvv_1y-ai6-F7ROVC7MDoRZpLEUrsaR4gsqPxS7yBKYM4zp-sry_C7FTBhVtiKoaTZXxb_MYKNvP_UHU2k-jdgDwnpfJ0WgBTigQc6aou2U1C5jNl5wsW-SNaxSs5fbsToboY0bedlK2tyaWvriiWdBnx3vW3mJpUWk5mWZVEBWW1hilxw3Tmn4kHNv-CUGiLFm33FNq4_XT5HUM0ni_9X8sQGm-OegX-uOpbgf2EaJhF7hjDZxYRiM"
//   }
// ];

// const Articles = () => (
//   <div
//     className="relative flex min-h-screen flex-col bg-gray-50 justify-between overflow-x-hidden"
//     style={{ fontFamily: 'Newsreader, "Noto Sans", sans-serif' }}
//   >
//     {/* Header */}
//     <div>
//       <div className="flex items-center bg-gray-50 p-4 pb-2 justify-between">
//         <div className="text-[#101518] flex size-12 shrink-0 items-center">
//           {/* Hamburger Icon */}
//           <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
//             <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path>
//           </svg>
//         </div>
//         <h2 className="text-[#101518] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
//           Tech News
//         </h2>
//       </div>
//       {/* Search Bar */}
//       <div className="px-4 py-3">
//         <label className="flex flex-col min-w-40 h-12 w-full">
//           <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
//             <div className="text-[#5c748a] flex border-none bg-[#eaedf1] items-center justify-center pl-4 rounded-l-xl border-r-0">
//               <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
//                 <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
//               </svg>
//             </div>
//             <input
//               placeholder="Search articles"
//               className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#101518] focus:outline-0 focus:ring-0 border-none bg-[#eaedf1] focus:border-none h-full placeholder:text-[#5c748a] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
//             />
//           </div>
//         </label>
//       </div>
//       {/* Featured */}
//       <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
//         Featured
//       </h2>
//       <div className="p-4">
//         <div className="flex flex-col items-stretch justify-start rounded-xl xl:flex-row xl:items-start">
//           <div
//             className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
//             style={{ backgroundImage: `url('${featured.img}')` }}
//           ></div>
//           <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-1 py-4 xl:px-4">
//             <p className="text-[#101518] text-lg font-bold leading-tight tracking-[-0.015em]">
//               {featured.title}
//             </p>
//             <div className="flex items-end gap-3 justify-between">
//               <div className="flex flex-col gap-1">
//                 <p className="text-[#5c748a] text-base font-normal leading-normal">
//                   {featured.desc}
//                 </p>
//                 <p className="text-[#5c748a] text-base font-normal leading-normal">
//                   By {featured.author} · {featured.time}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       {/* Latest Articles */}
//       <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
//         Latest Articles
//       </h2>
//       {latest.map((art, i) => (
//         <div key={i} className="flex items-center gap-4 bg-gray-50 px-4 py-3">
//           <div
//             className="bg-center bg-no-repeat aspect-video bg-cover rounded-lg h-14 w-fit"
//             style={{ backgroundImage: `url('${art.img}')` }}
//           ></div>
//           <div className="flex flex-col justify-center">
//             <p className="text-[#101518] text-base font-medium leading-normal line-clamp-1">
//               {art.title}
//             </p>
//             <p className="text-[#5c748a] text-sm font-normal leading-normal line-clamp-2">
//               {art.desc}
//             </p>
//           </div>
//         </div>
//       ))}
//     </div>
//     <div>
//       <div className="h-5 bg-gray-50"></div>
//     </div>
//     <BottomNavBarBar/>
//   </div>
// );

// export default Articles;

const Articles = () => (
  <div className="w-full h-screen mt-16">
    <iframe
      src="http://13.50.5.78/wordpress/"
      title="Credzin WordPress"
      className="w-full h-screen border-0"
      style={{ minHeight: "100vh" }}
    />
    <BottomNavBarBar />
  </div>
);

export default Articles;