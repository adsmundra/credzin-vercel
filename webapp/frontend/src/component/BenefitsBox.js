import React from "react";
// this is the Benifit Box....
const BenefitsBox = () => (
  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-lg h-full flex flex-col">
    <h3 className="text-lg font-bold text-green-800 mb-2">Benefits</h3>
    <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
      <li>Exclusive rewards and cashback</li>
      <li>Priority customer support</li>
      <li>Airport lounge access</li>
      <li>Zero annual fee on select cards</li>
    </ul>
  </div>
);

export default BenefitsBox;
