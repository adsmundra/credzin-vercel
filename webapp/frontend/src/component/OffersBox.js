import React from "react";

const OffersBox = () => (
  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5 shadow-lg h-full flex flex-col">
    <h3 className="text-lg font-bold text-yellow-800 mb-2">Offers</h3>
    <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
      <li>Up to 20% off on partner brands</li>
      <li>Festive season special discounts</li>
      <li>EMI options with zero processing fee</li>
      <li>Refer & earn bonus points</li>
    </ul>
  </div>
);

export default OffersBox;
