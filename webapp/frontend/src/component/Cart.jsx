import React, { useState } from 'react';
import { useSelector } from 'react-redux';

const Cart = () => {
  const cart = useSelector((state) => state.cart.cart);
  const [selectedCard, setSelectedCard] = useState(null);

  const handleShowMoreInfo = (card) => {
    console.log('Selected Card:', card); // Log to identify null fields
    setSelectedCard(card);
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  return (
    <div className="h-auto w-full bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 p-0 lg:p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-0">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">
            Cards in your Wallet
          </h2>
        </div>

        {cart.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">
            No items in the cart
          </p>
        ) : (
          <div className="h-[50vh] overflow-y-auto">
            {/* Updated Background for Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 from-blue-50 via-gray-100 p-4 rounded-lg">
              {cart.map((card) => (
                <div
                  key={card._id}
                  className="p-2 sm:p-0 flex flex-col transform transition-all duration-500 w-full"
                >
                  {/* Card Flip Effect */}
                  <div className="relative w-full h-40 sm:h-50 rounded-md overflow-hidden group perspective">
                    <div className="w-full h-full transition-transform duration-500 preserve-3d group-hover:rotate-y-180 relative">
                      {/* Front Side */}
                      <div className="absolute inset-0 backface-hidden flex items-center justify-center">
                        <img
                          src={card.image_url || "https://via.placeholder.com/150"}
                          alt={card.card_name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Back Side */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-black bg-opacity-70 text-white flex flex-col justify-center items-center px-2 text-center space-y-3">
                        <h3 className="text-base font-bold">{card.card_name}</h3>
                        <button
                          onClick={() => handleShowMoreInfo(card)}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 transition-all duration-300 text-sm font-semibold"
                        >
                          Show More Info
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedCard && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
          >
            <div className="bg-white rounded-xl shadow-2xl w-[90%] sm:w-[70%] md:w-[50%] h-[50%] overflow-y-auto p-6 relative transform transition-all duration-300">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 text-center">
                {selectedCard.card_name}
              </h2>
              <div className="space-y-3">
                <img
                  src={selectedCard.image_url || "https://via.placeholder.com/150"}
                  alt={selectedCard.card_name}
                  className="w-32 h-32 object-contain mx-auto rounded-md"
                />
                {Object.entries(selectedCard).map(([key, value]) => {
                  if (key === '__v' || key === 'image_url' || key === 'card_name') return null;
                  return (
                    <div key={key} className="flex justify-between text-gray-700">
                      <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                      <span>
                        {value === null || value === undefined
                          ? 'N/A'
                          : Array.isArray(value)
                          ? value.join(', ')
                          : value.toString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;