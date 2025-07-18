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
  const [success, setSuccess] = useState(null);
  const [userExistingCards, setUserExistingCards] = useState([]);
  const token = localStorage.getItem("token");
  const cart = useSelector((state) => state.cart.cart);
  const bankList = useSelector((state) => state.bank.bankList);

  // Load cached cart on first load
  useEffect(() => {
    const cachedCart = sessionStorage.getItem("userCart");

    // Always sync Redux with sessionStorage on load
    if (cachedCart) {
      const parsedCart = JSON.parse(cachedCart);

      // Optional: prevent unnecessary updates if already same
      const reduxCartIds = cart.map((c) => c._id).sort();
      const cachedCartIds = parsedCart.map((c) => c._id).sort();

      const isSame = JSON.stringify(reduxCartIds) === JSON.stringify(cachedCartIds);
      if (!isSame) {
        dispatch(addToCart(parsedCart));
      }
    }
  }, [dispatch, cart]);

  const bankOptions = [
    { label: "Select Bank", value: "Select Bank" },
    ...bankList.map((bank) => ({
      label: bank,
      value: bank,
    })),
  ];

  const fetchUserCards = async () => {
    try {
      const response = await axios.get(
        `${apiEndpoint}/api/v1/auth/addedcards`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        const userCards = response.data.cards || [];
        // Extract generic card IDs from user cards
        const existingGenericCardIds = userCards.map(card => card.generic_card_id);
        setUserExistingCards(existingGenericCardIds);
      }
    } catch (err) {
      console.error("Error fetching user cards:", err);
    }
  };
  useEffect(() => {
    const fetchBanks = async () => {
      const cachedBanks = sessionStorage.getItem("bankList");
      if (cachedBanks) {
        dispatch(setBankList(JSON.parse(cachedBanks)));
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`${apiEndpoint}/api/v1/card/all_bank`);
        const banks = response.data?.banks || [];
        dispatch(setBankList(banks));
        sessionStorage.setItem("bankList", JSON.stringify(banks));
      } catch (err) {
        setError("Failed to fetch banks");
        console.error("Error fetching bank list:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanks();
    fetchUserCards();
  }, [dispatch]);

  // Fetch cards from selected bank (with caching)
  const fetchBankCards = async (bank) => {
    const cacheKey = `cards_${bank}`;
    const cachedCards = sessionStorage.getItem(cacheKey);

    if (cachedCards) {
      setBankCards(JSON.parse(cachedCards));
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await axios.post(
        `${apiEndpoint}/api/v1/card/your_recomendation`,
        { bank_name: bank }
      );
      const cards = data?.cards || [];
      setBankCards(cards);
      sessionStorage.setItem(cacheKey, JSON.stringify(cards));
    } catch (err) {
      setError("Failed to fetch cards");
      console.error("Error fetching cards:", err);
      setBankCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove card from cart (update Redux + sessionStorage)
  const handleRemoveCard = async (cardId) => {
    try {
      setIsLoading(true);
      await axios.post(
        `${apiEndpoint}/api/v1/auth/removeCardFromCart`,
        { cardId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      dispatch(removeFromCart(cardId));

      // Refresh user cards since the card is now marked as inactive
      fetchUserCards();
    } catch (error) {
      setError("Failed to remove card");
      console.error("Error removing card:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add cards to cart (update Redux + sessionStorage)
  const handleAddCards = async () => {
    const selectedCardIds = Object.keys(selectedCards);
    if (selectedCardIds.length === 0) {
      setError("Please select at least one card");
      return;
    }

    try {
      // Add cards to backend
      const response = await axios.post(
        `${apiEndpoint}/api/v1/auth/addcard`,
        { generic_card_ids: selectedCardIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setSelectedCards({});
        setError(null); // Clear any previous errors
        // Show success message based on response
        const { stats, message } = response.data;
        if (stats && stats.reactivated > 0) {
          setSuccess(`${stats.new} new cards added, ${stats.reactivated} cards reactivated successfully!`);
        } else {
          setSuccess('Cards added successfully!');
        }
        setTimeout(() => setSuccess(null), 3000);
        // Re-fetch the cart from backend to ensure correct shape
        const cartRes = await axios.get(`${apiEndpoint}/api/v1/auth/addedcards`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (cartRes.status === 200) {
          dispatch(addToCart(cartRes.data.cards));
        }
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.duplicateCards) {
        const duplicateCardNames = error.response.data.duplicateCards.join(', ');
        setError(`Cannot add cards: ${duplicateCardNames} - already in your collection`);
      } else {
        setError("Failed to add cards");
      }
      console.error("Error adding cards:", error);
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
        <div className="bg-red-500 text-white px-4 py-2 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-white hover:text-gray-200"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
            </svg>
          </button>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-500 text-white px-4 py-2 flex justify-between items-center">
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-white hover:text-gray-200"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
            </svg>
          </button>
        </div>
      )}
      {/* Card List */}
      <div className="flex-1">
        <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Your Cards</h2>
        {cart.length === 0 ? (
          <p className="text-[#a2abb3] px-4">No cards in your wallet</p>
        ) : (
          <div className="divide-y divide-[#2c3135] " >
            {cart.map((card) => (
              <div
                key={card._id}
                className="flex items-center gap-4 bg-[#121416] px-4 min-h-[72px] py-2 justify-between"
              >
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/carddetails/${card._id}`)}>
                  <div
                    className="bg-center bg-no-repeat aspect-video bg-contain h-6 w-10 shrink-0"
                    style={{ backgroundImage: `url(${card.generic_card?.image_url || "https://via.placeholder.com/150"})` }}
                  />
                  <div className="flex flex-col justify-center">
                    <p className="text-base font-medium line-clamp-1">
                      {card.generic_card?.card_name || "Unknown Card"}
                    </p>
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

      {/* Bottom Add Card Button */}
      <div className="sticky bottom-0 bg-[#121416] border-t border-[#2c3135]">
        <div className="flex px-4 py-3">
          <button
            onClick={() => setIsAddingCard(true)}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 flex-1 bg-[#2c3135] text-white text-sm font-bold"
            disabled={isLoading}
          >
            <span className="truncate">
              {isLoading ? "Processing..." : "Add New Card"}
            </span>
          </button>
        </div>
        <div className="h-5 bg-[#121416]" />
      </div>

      {/* Modal for Adding Cards */}
      {isAddingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#121416] rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Add New Card</h3>

            {/* Bank Dropdown */}
            <select
              value={selectedBank}
              onChange={(e) => {
                const bank = e.target.value;
                setSelectedBank(bank);
                if (bank !== "Select Bank") {
                  fetchBankCards(bank);
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

            {/* Cards from selected bank */}
            {bankCards.length > 0 && (
              <div className="max-h-60 overflow-y-auto">

                {bankCards.map((card) => {
                  const isAlreadyAdded = userExistingCards.includes(card._id);
                  return (
                    <label
                      key={card._id}
                      className={`flex items-center p-2 rounded ${isAlreadyAdded
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'hover:bg-[#2c3135]'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedCards[card._id]}
                        onChange={() => {
                          if (!isAlreadyAdded) {
                            setSelectedCards(prev => ({
                              ...prev,
                              [card._id]: prev[card._id] ? undefined : card
                            }));
                          }
                        }}
                        className="mr-3"
                        disabled={isLoading || isAlreadyAdded}
                      />
                      <div className="flex-1">
                        <span className={isAlreadyAdded ? 'line-through' : ''}>
                          {card.card_name}
                        </span>
                        {isAlreadyAdded && (
                          <span className="text-xs text-green-400 ml-2">
                            (Already added)
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Modal Buttons */}
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

      <BottomNavBar />
    </div>
  );
};

export default ManageCards;
