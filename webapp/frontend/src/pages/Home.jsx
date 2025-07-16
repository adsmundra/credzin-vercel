
import React, { useEffect, useRef, useState } from "react";
import { Plane, Utensils, Tag } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BottomNavBar from "../component/BottomNavBar";
import Slider from "react-slick";
import { addToCart, setSelectedCard } from "../app/slices/cartSlice";

// Dummy card recommendations
const recommended = [
  {
    title: "Travel Rewards Card",
    desc: "Earn points on every purchase",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA_v4zL_HRiYkMTyDTKATG6rNhcqshxEieRXmNlCPgkChqHQh9r46tOVuK0HC9_Ms3pv14aK4-AcrN7uQsTDNGy-qOrUxs3HVh6eifiWV-LsNxABcTmG_yv4H_AsS-mWceNMjPCvIqUpZRssQ0QXYeu42RRZsxasIKIJP--C1nky9QLLkmpjSRVzkrUQIyISK64kqXGogVjUkSSB97j2dhrK0MATv6fZ0j3_ulX1FqSDCaBOQrKFAvhsIouKDaYKnZqrmS20q0vzg"
  },
  {
    title: "Cash Back Card",
    desc: "Get cash back on everyday spending",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAloUYDZlRh3fhnbyd1xl_Uc4T000V_dfaAWckk6h02wGd-iPxdVKV0jIaPAorPHV1i9KDJCiBxIRE70QeduXG_mr2r5maced5Ek1L8jCSAyNTJybcx2IXexXI4dVt4xq7L9hNSTCc12g9Nyc_ZRBKoZrh4omgRZvW9N2qRraG-mHgRK5uaeVbVNFw0wIVwoj6QMynn5Bp6fv2_o8GcTGbnqpCmZmSCpKbo7MdIOC_VMnVb_navI05lSoR0IV2n0mOGnQZEZdUg2g"
  }
];

// Benefits and Offers
const benefits = [
  { icon: <Plane size={24} />, title: "Travel Benefits", desc: "Enjoy exclusive travel perks and discounts." },
  { icon: <Utensils size={24} />, title: "Dining Rewards", desc: "Earn rewards on dining and entertainment." }
];

const offers = [
  { icon: <Tag size={24} />, title: "Shopping Discount", desc: "Get 10% off on your next purchase." }
];

// Carousel config
const sliderSettings = {
  centerMode: false,
  centerPadding: "40px",
  slidesToShow: 4,
  speed: 50,
  cssEase: "cubic-bezier(0.77, 0, 0.175, 1)",
  infinite: false,
  arrows: false,
  dots: false,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 1.5, centerPadding: "50px" } },
    { breakpoint: 768, settings: { slidesToShow: 1.2, centerPadding: "20px" } }
  ]
};

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cards = useSelector((state) => state.cart.cart);
  const sliderRef = useRef(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Sync Redux cart with sessionStorage (on mount or cart change)
  useEffect(() => {
    const cachedCart = sessionStorage.getItem("userCart");

    if (cachedCart) {
      const parsedCart = JSON.parse(cachedCart);
      console.log("this card details of the user",cards)

      const reduxCartIds = cards.map(c => c._id).sort();
      const cachedCartIds = parsedCart.map(c => c._id).sort();

      const isSame = JSON.stringify(reduxCartIds) === JSON.stringify(cachedCartIds);
      if (!isSame) {
        dispatch(addToCart(parsedCart));
      }
    }
  }, [dispatch, cards]);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#111518] font-sans text-white">
      {/* Header */}
      <div className="flex items-center bg-[#111518] p-4 pb-2 justify-between">
        <div className="text-white flex size-12 items-center">
          <svg width="24" height="24" fill="currentColor">
            <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z" />
          </svg>
        </div>
      </div>

      {/* Your Cards Section */}
      <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Your Cards</h2>
      <div className="relative px-2 sm:px-4">
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
          onClick={() => sliderRef.current?.slickPrev()}
          style={{ left: '40px' }}
        >
          <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2"><path d="M13 17l-5-5 5-5" /></svg>
        </button>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
          onClick={() => sliderRef.current?.slickNext()}
          style={{ right: '40px' }}
        >
          <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2"><path d="M7 7l5 5-5 5" /></svg>
        </button>

        <Slider ref={sliderRef} {...sliderSettings}>
          {cards.map((card, i) => (
            <div key={i} className="flex flex-col items-center gap-0 rounded-xl bg-none mx-2 p-2 w-24 sm:w-28 md:w-32 hover:scale-105 transition-all duration-300">
              <div
                className="rounded-xl overflow-hidden bg-[#2b3139] w-200 aspect-[16/10] border border-[#3a3f45] shadow-sm"
                style={{ minHeight: 120, maxHeight: 180 }}
              >
                <img
                  src={card.generic_card.image_url || "https://via.placeholder.com/128x80"}
                  alt={card.generic_card.card_name}
                  className="object-contain w-full h-full transition-transform duration-200 hover:scale-105 cursor-pointer"

                  draggable={false}
                  onClick={() => {
                    dispatch(setSelectedCard(card));
                    navigate('/home/card-benifits');
                  }}
                />
              </div>
              <div className="text-center mt-1">
                <p className="text-sm font-semibold text-white leading-snug">{card.generic_card.card_name}</p>
                <p className="text-xs text-[#9cabba] tracking-wide">{card.last4}</p>

              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Recommended Cards */}
      <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Recommended Cards</h2>
      <div className="flex overflow-x-auto px-4 gap-3">
        {recommended.map((card, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-lg min-w-60 bg-[#1b2127]">
            <div
              className="w-full aspect-video bg-center bg-no-repeat bg-cover rounded-xl"
              style={{ backgroundImage: `url('${card.img}')` }}
            ></div>
            <div>
              <p className="text-base font-medium">{card.title}</p>
              <p className="text-[#9cabba] text-sm">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits Section */}
      <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Benefits</h2>
      <div className="flex flex-col gap-2 px-4">
        {benefits.map((b, i) => (
          <div key={i} className="flex items-center gap-4 bg-[#111518] px-4 min-h-[72px] py-2 rounded-lg">
            <div className="flex items-center justify-center rounded-lg bg-[#283139] size-12">{b.icon}</div>
            <div className="flex flex-col justify-center">
              <p className="text-base font-medium">{b.title}</p>
              <p className="text-[#9cabba] text-sm">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Offers Section */}
      <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Offers</h2>
      <div className="flex flex-col gap-2 px-4 pb-24">
        {offers.map((o, i) => (
          <div key={i} className="flex items-center gap-4 bg-[#111518] px-4 min-h-[72px] py-2 rounded-lg">
            <div className="flex items-center justify-center rounded-lg bg-[#283139] size-12">{o.icon}</div>
            <div className="flex flex-col justify-center">
              <p className="text-base font-medium">{o.title}</p>
              <p className="text-[#9cabba] text-sm">{o.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chatbot Button & Modal */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-16 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center w-16 h-16"
        title="Chatbot"
      >
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#2563eb" />
          <path d="M8 10h8M8 14h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="17" cy="14" r="1" fill="#fff" />
        </svg>
      </button>

      {isChatbotOpen && (
        <div className="fixed mt-14 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 lg:items-start lg:justify-end">
          <div className="relative bg-[#23272f] rounded-xl shadow-lg w-full max-w-2xl h-[60vh] flex flex-col mt-12 lg:mt-0 lg:rounded-l-xl lg:rounded-r-none lg:h-full lg:max-w-md lg:w-full">
            <button
              className="absolute top-2 right-4 text-white text-3xl z-50 bg-black/40 rounded-full w-10 h-10 flex items-center justify-center"
              onClick={() => setIsChatbotOpen(false)}
              aria-label="Close"
              style={{ pointerEvents: "auto" }}
            >
              ×
            </button>
            <iframe
              src="http://192.168.1.120:7860/"
              title="Chatbot"
              className="w-full h-full rounded-xl border-0"
              style={{ background: "#23272f" }}
            />
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
};

export default Home;






















// import React, { useRef, useState } from "react";
// import { Plane, Utensils, Tag } from 'lucide-react';
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import BottomNavBar from "../component/BottomNavBar";
// import Slider from "react-slick";

// // Sample recommended, benefits, and offers data
// const recommended = [
//   {
//     title: "Travel Rewards Card",
//     desc: "Earn points on every purchase",
//     img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA_v4zL_HRiYkMTyDTKATG6rNhcqshxEieRXmNlCPgkChqHQh9r46tOVuK0HC9_Ms3pv14aK4-AcrN7uQsTDNGy-qOrUxs3HVh6eifiWV-LsNxABcTmG_yv4H_AsS-mWceNMjPCvIqUpZRssQ0QXYeu42RRZsxasIKIJP--C1nky9QLLkmpjSRVzkrUQIyISK64kqXGogVjUkSSB97j2dhrK0MATv6fZ0j3_ulX1FqSDCaBOQrKFAvhsIouKDaYKnZqrmS20q0vzg"
//   },
//   {
//     title: "Cash Back Card",
//     desc: "Get cash back on everyday spending",
//     img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAloUYDZlRh3fhnbyd1xl_Uc4T000V_dfaAWckk6h02wGd-iPxdVKV0jIaPAorPHV1i9KDJCiBxIRE70QeduXG_mr2r5maced5Ek1L8jCSAyNTJybcx2IXexXI4dVt4xq7L9hNSTCc12g9Nyc_ZRBKoZrh4omgRZvW9N2qRraG-mHgRK5uaeVbVNFw0wIVwoj6QMynn5Bp6fv2_o8GcTGbnqpCmZmSCpKbo7MdIOC_VMnVb_navI05lSoR0IV2n0mOGnQZEZdUg2g"
//   }
// ];

// const benefits = [
//   { icon: <Plane size={24} />, title: "Travel Benefits", desc: "Enjoy exclusive travel perks and discounts." },
//   { icon: <Utensils size={24} />, title: "Dining Rewards", desc: "Earn rewards on dining and entertainment." }
// ];

// const offers = [
//   { icon: <Tag size={24} />, title: "Shopping Discount", desc: "Get 10% off on your next purchase." }
// ];

// const sliderSettings = {
//   centerMode: false,
//   centerPadding: "40px",
//   slidesToShow: 4,
//   speed: 50,
//   cssEase: "cubic-bezier(0.77, 0, 0.175, 1)",
//   infinite: false,
//   arrows: false,
//   dots: false,
//   responsive: [
//     {
//       breakpoint: 1024,
//       settings: { slidesToShow: 1.5, centerPadding: "50px" }
//     },
//     {
//       breakpoint: 768,
//       settings: { slidesToShow: 1.2, centerPadding: "20px" }
//     }
//   ]
// };

// const Home = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const cards = useSelector((state) => state.cart.cart);
//   const sliderRef = useRef(null);
//   const [isChatbotOpen, setIsChatbotOpen] = useState(false);

//   return (
//     <div className="relative min-h-screen flex flex-col bg-[#111518] font-sans text-white">
//       {/* Header */}
//       <div className="flex items-center bg-[#111518] p-4 pb-2 justify-between">
//         <div className="text-white flex size-12 items-center">
//           <svg width="24" height="24" fill="currentColor">
//             <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/>
//           </svg>
//         </div>
//       </div>

//       {/* Your Cards */}
//       <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Your Cards</h2>
//       <div className="relative px-2 sm:px-4">
//         {/* Custom Arrows */}
//         <button
//           className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
//           onClick={() => sliderRef.current?.slickPrev()}
//           style={{ left: '40px' }}
//         >
//           <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2"><path d="M13 17l-5-5 5-5"/></svg>
//         </button>
//         <button
//           className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-blue-700 text-white rounded-full p-2 shadow-md hidden sm:block"
//           onClick={() => sliderRef.current?.slickNext()}
//           style={{ right: '40px' }}
//         >
//           <svg width="20" height="20" fill="none" stroke="black" strokeWidth="2"><path d="M7 7l5 5-5 5"/></svg>
//         </button>

//         <Slider ref={sliderRef} {...sliderSettings}>
//           {cards.map((card, i) => (
//             <div
//               key={i}
//               className="min-w-[186px] max-w-[186px] h-[205px] rounded-2xl overflow-hidden mx-2 shadow-md transform transition-transform duration-300 hover:scale-[1.03]"
//             >
//               <img
//                 src={card.image_url || "https://via.placeholder.com/186x205"}
//                 alt={card.card_name}
//                 className="object-cover w-full h-full"
//                 draggable={false}
//               />
//             </div>
//           ))}
//         </Slider>
//       </div>

//       {/* Recommended Cards */}
//       <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Recommended Cards</h2>
//       <div className="flex overflow-x-auto px-4 gap-3">
//         {recommended.map((card, i) => (
//           <div key={i} className="flex flex-col gap-4 rounded-lg min-w-60 bg-[#1b2127]">
//             <div
//               className="w-full aspect-video bg-center bg-no-repeat bg-cover rounded-xl"
//               style={{ backgroundImage: `url('${card.img}')` }}
//             ></div>
//             <div>
//               <p className="text-base font-medium">{card.title}</p>
//               <p className="text-[#9cabba] text-sm">{card.desc}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Benefits */}
//       <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Benefits</h2>
//       <div className="flex flex-col gap-2 px-4">
//         {benefits.map((b, i) => (
//           <div key={i} className="flex items-center gap-4 bg-[#111518] px-4 min-h-[72px] py-2 rounded-lg">
//             <div className="flex items-center justify-center rounded-lg bg-[#283139] size-12">{b.icon}</div>
//             <div className="flex flex-col justify-center">
//               <p className="text-base font-medium">{b.title}</p>
//               <p className="text-[#9cabba] text-sm">{b.desc}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Offers */}
//       <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Offers</h2>
//       <div className="flex flex-col gap-2 px-4 pb-24">
//         {offers.map((o, i) => (
//           <div key={i} className="flex items-center gap-4 bg-[#111518] px-4 min-h-[72px] py-2 rounded-lg">
//             <div className="flex items-center justify-center rounded-lg bg-[#283139] size-12">{o.icon}</div>
//             <div className="flex flex-col justify-center">
//               <p className="text-base font-medium">{o.title}</p>
//               <p className="text-[#9cabba] text-sm">{o.desc}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Chatbot Button */}
//       <button
//         onClick={() => setIsChatbotOpen(true)}
//         className="fixed bottom-16 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center w-16 h-16 transition-all duration-200"
//         title="Chatbot"
//       >
//         <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
//           <circle cx="12" cy="12" r="10" fill="#2563eb"/>
//           <path d="M8 10h8M8 14h5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
//           <circle cx="17" cy="14" r="1" fill="#fff"/>
//         </svg>
//       </button>

//       {/* Chatbot Modal */}
//       {isChatbotOpen && (
//         <div className="fixed mt-14 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 lg:items-start lg:justify-end">
//           <div className="relative bg-[#23272f] rounded-xl shadow-lg w-full max-w-2xl h-[60vh] flex flex-col mt-12
//             lg:mt-0 lg:rounded-l-xl lg:rounded-r-none lg:h-full lg:max-w-md lg:w-full">
//             <button
//               className="absolute top-2 right-4 text-white text-3xl z-50 bg-black/40 rounded-full w-10 h-10 flex items-center justify-center"
//               onClick={() => setIsChatbotOpen(false)}
//               aria-label="Close"
//               style={{ pointerEvents: "auto" }}
//             >
//               ×
//             </button>
//             <iframe
//               src="http://192.168.1.120:7860/"
//               title="Chatbot"
//               className="w-full h-full rounded-xl border-0 lg:rounded-l-xl lg:rounded-r-none"
//               style={{ background: "#23272f" }}
//             />
//           </div>
//         </div>
//       )}

//       <BottomNavBar />
//     </div>
//   );
// };

// export default Home;
