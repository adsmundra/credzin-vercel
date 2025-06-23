// import React, { useState,useEffect  } from "react";
// import Dropdown from "../component/Drpdown";
// import axios from "axios";
// import { useSelector, useDispatch } from "react-redux";
// import { addToCart, removeFromCart } from "../app/slices/cartSlice";
// import { apiEndpoint } from "../api";
// import { setBankList } from "../app/slices/bankSlice";


// const ManageCards = () => {
//   const [selectedBank, setSelectedBank] = useState("Select Bank");
//   const [bankCards, setBankCards] = useState([]);
//   const [selectedCards, setSelectedCards] = useState({});
//   const token = localStorage.getItem("token");
//   const dispatch = useDispatch();
//   const cart = useSelector((state) => state.cart.cart);
//   const bankList = useSelector((state) => state.bank.bankList); 

//   const bankOptions = [
//     { label: "Select Bank", value: "Bank" },
//     ...bankList.map((bank) => ({
//       label: `${bank} Bank`,
//       value: bank,
//     })),
//   ];

//   useEffect(() => {
//     const fetchBanks = async () => {
//       try {
//         const response = await axios.get(`${apiEndpoint}/api/v1/card/all_bank`);
//         const banks = response.data?.banks || [];
//         dispatch(setBankList(banks));
//       } catch (err) {
//         console.error("Error fetching bank list:", err.response?.data || err);
//       }
//     };

//     fetchBanks();
//   }, [dispatch]);

//   const fetchBankCards = async (bank) => {
//     try {
      
//       const { data } = await axios.post(`${apiEndpoint}/api/v1/card/your_recomendation`, {
//         bank_name: bank,
//       });
//       setBankCards(data?.cards || []);
//     } catch (err) {
//       console.error("Error fetching cards:", err.response?.data || err);
//       setBankCards([]);
//     }
//   };

//   const handleBankChange = (e) => {
//     const bank = e.target.value;
//     // console.log(bank);
//     setSelectedBank(bank);
//     if (bank !== "Bank") fetchBankCards(bank);
//   };

//   const toggleCardSelection = (card) => {
//     setSelectedCards((prev) => {
//       const updated = { ...prev };
//       if (updated[card._id]) delete updated[card._id];
//       else updated[card._id] = card;
//       return updated;
//     });
//   };

//   const handleAddToCart = async () => {
//     const cards = Object.values(selectedCards);
//     const cardIds = cards.map((card) => card._id);
//     console.log("this is cart ", cards);

//     try {
//       const response =  await axios.post(
//         `${apiEndpoint}/api/v1/auth/addcard`,
//         { productIds: cardIds },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log("This is the response:",response)
//       if(response.status==200){
//         dispatch(addToCart(cards));
//       }
//       // setSelectedCards({});
//     } catch (error) {
//       console.log("Error adding to cart:", error);
//     }
//   };

//   const handleRemoveCard = async (cardId) => {
//     try {
//       await axios.post(
//         `${apiEndpoint}/api/v1/auth/removeCardFromCart`,
//         { cardId },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       dispatch(removeFromCart(cardId));
//     } catch (error) {
//       console.error("Error removing card:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center p-4 bg-gray-50">

//       {/* CART SECTION */}
//       <div className="w-full max-w-5xl bg-white rounded-lg shadow-lg p-2 max-h-[400px] mb-6 overflow-y-auto">
//         <h2 className="text-2xl font-bold text-center text-gray-900 mb-1">Cards in you wallet</h2>
//         {cart.length === 0 ? (
//           <p className="text-center text-gray-600 text-lg">No cards in your wallet</p>
//         ) : (
//           <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 max-h-[340px]">
//             {cart.map((card) => (
//               <div
//                 key={card._id}
//                 className="bg-white rounded-lg shadow p-4 flex flex-col items-center"
//               >
//                 {/* Responsive fixed-size image container */}
//                 <div className="w-full h-40 sm:h-48 md:h-40 lg:h-48 flex justify-center items-center overflow-hidden">
//                   <img
//                     src={card.image_url || "https://via.placeholder.com/150"}
//                     alt={card.card_name}
//                     className="h-full object-contain"
//                   />
//                 </div>
//                 <h3 className="mt-2 text-center font-semibold">{card.card_name}</h3>
//                 <button
//                   onClick={() => handleRemoveCard(card._id)}
//                   className="mt-3 bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition"
//                 >
//                   Remove
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* DROPDOWN + BANK CARDS SECTION */}
//       <div className="w-full max-w-5xl flex flex-col gap-6 bg-white rounded-lg shadow-lg p-6">
//         <div className="flex flex-col md:flex-row gap-6">

//           {/* LEFT: Dropdown */}
//           <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg p-4 flex flex-col items-center">
//             <Dropdown
//               label="Select issuer bank"
//               options={bankOptions}
//               value={selectedBank}
//               onChange={handleBankChange}
//               className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
//             />
//             <p className="mt-2 text-sm text-center text-gray-600">
//               You have selected: <span className="font-semibold text-blue-600">{selectedBank}</span>
//             </p>
//           </div>

//           {/* RIGHT: Cards from bank */}
//           <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg p-4 overflow-y-auto max-h-[400px]">
//             {bankCards.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 {bankCards.map((card) => (
//                   <label
//                     key={card._id}
//                     className="flex items-center p-2 hover:bg-gray-200 rounded transition"
//                   >
//                     <input
//                       type="checkbox"
//                       checked={!!selectedCards[card._id]}
//                       onChange={() => toggleCardSelection(card)}
//                       className="mr-3"
//                     />
//                     <span>{card.card_name}</span>
//                   </label>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-center text-gray-500">No cards available.</p>
//             )}
//           </div>
//         </div>

//         {/* Add to Cart Button */}
//         <div className="flex justify-center mt-4">
//           <button
//             onClick={handleAddToCart}
//             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//           >
//             Add to my card wallet
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ManageCards;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { addToCart, removeFromCart } from "../app/slices/cartSlice";
import { apiEndpoint } from "../api";
import { setBankList } from "../app/slices/bankSlice";
import BottomNavBar from "../component/BottomNavBar";

const ManageCards = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [selectedBank, setSelectedBank] = useState("Select Bank");
  const [bankCards, setBankCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem("token");
  const cart = useSelector((state) => state.cart.cart);
  const bankList = useSelector((state) => state.bank.bankList);

  const bankOptions = [
    { label: "Select Bank", value: "Select Bank" },
    ...bankList.map((bank) => ({
      label: bank,
      value: bank,
    })),
  ];

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${apiEndpoint}/api/v1/card/all_bank`);
        const banks = response.data?.banks || [];
        dispatch(setBankList(banks));
      } catch (err) {
        setError("Failed to fetch banks");
        console.error("Error fetching bank list:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanks();
  }, [dispatch]);

  const fetchBankCards = async (bank) => {
    try {
      setIsLoading(true);
      const {data}  = await axios.post(
        `${apiEndpoint}/api/v1/card/your_recomendation`,
        { bank_name: bank }
      );
      setBankCards(data?.cards || []);
    } catch (err) {
      setError("Failed to fetch cards");
      console.error("Error fetching cards:", err);
      setBankCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCard = async (cardId) => {
    try {
      setIsLoading(true);
      await axios.post(
        `${apiEndpoint}/api/v1/auth/removeCardFromCart`,
        { cardId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(removeFromCart(cardId));
    } catch (error) {
      setError("Failed to remove card");
      console.error("Error removing card:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCards = async () => {
    const selectedCardIds = Object.keys(selectedCards);
    if (selectedCardIds.length === 0) {
      setError("Please select at least one card");
      return;
    }

    try {
    
      const response = await axios.post(
        `${apiEndpoint}/api/v1/auth/addcard`,
        { productIds: selectedCardIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        dispatch(addToCart(Object.values(selectedCards)));
        setSelectedCards({});
        setIsAddingCard(false);
      }
    } catch (error) {
      setError("Failed to add cards");
      console.error("Error adding cards:", error);
    } finally {
     
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#121416] text-white font-['Manrope']">
      {/* Header */}
      <div className="flex items-center bg-[#121416] p-14 pb-2 justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="text-white flex size-12 shrink-0 items-center"
        >
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
          </svg>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Manage Cards
        </h2>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500 text-white px-4 py-2">
          {error}
        </div>
      )}

      {/* Card List */}
      <div className="flex-1">
        <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Your Cards</h2>
        {cart.length === 0 ? (
          <p className="text-[#a2abb3] px-4">No cards in your wallet</p>
        ) : (
          <div className="divide-y divide-[#2c3135]">
            {cart.map((card) => (
              <div
                key={card._id}
                className="flex items-center gap-4 bg-[#121416] px-4 min-h-[72px] py-2 justify-between"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="bg-center bg-no-repeat aspect-video bg-contain h-6 w-10 shrink-0"
                    style={{ backgroundImage: `url(${card.image_url})` }}
                  />
                  <div className="flex flex-col justify-center">
                    <p className="text-base font-medium line-clamp-1">
                      {card.card_name}
                    </p>
                    {/* <p className="text-[#a2abb3] text-sm line-clamp-2">
                      Expires {card.expiry || "MM/YYYY"}
                    </p> */}
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveCard(card._id)}
                  className="text-white flex size-7 items-center justify-center"
                  disabled={isLoading}
                >
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="sticky bottom-0 bg-[#121416] border-t border-[#2c3135]">
        <div className="flex px-4 py-3">
          <button
            onClick={() => setIsAddingCard(true)}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 flex-1 bg-[#2c3135] text-white text-sm font-bold leading-normal tracking-[0.015em]"
            disabled={isLoading}
          >
            <span className="truncate">
              {isLoading ? "Processing..." : "Add New Card"}
            </span>
          </button>
        </div>
        <div className="h-5 bg-[#121416]" />
      </div>

      {/* Add Card Modal */}
      {isAddingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#121416] rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Add New Card</h3>
            
            <select
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.target.value);
                if (e.target.value !== "Select Bank") {
                  fetchBankCards(e.target.value);
                }
              }}
              className="w-full bg-[#2c3135] text-white rounded-lg p-2 mb-4"
              disabled={isLoading}
            >
              {bankOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {bankCards.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                {bankCards.map((card) => (
                  <label
                    key={card._id}
                    className="flex items-center p-2 hover:bg-[#2c3135] rounded"
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedCards[card._id]}
                      onChange={() => {
                        setSelectedCards(prev => ({
                          ...prev,
                          [card._id]: prev[card._id] ? undefined : card
                        }));
                      }}
                      className="mr-3"
                      disabled={isLoading}
                    />
                    <span>{card.card_name}</span>
                  </label>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsAddingCard(false)}
                className="flex-1 py-2 bg-[#2c3135] rounded-full"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCards}
                className="flex-1 py-2 bg-blue-600 rounded-full"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Cards"}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNavBar/>
    </div>
  );
};

export default ManageCards;