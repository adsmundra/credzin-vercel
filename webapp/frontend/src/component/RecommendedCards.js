import React from "react";
import { useSelector } from "react-redux";

const RecommendedCards = () => {
  const recommendedList = useSelector((state) => state.recommend.recommendedList || []);

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-6 shadow-lg h-full flex flex-col">
      <h3 className="text-xl font-bold mb-4 text-indigo-700">Your Recommended Card</h3>
      {!recommendedList || recommendedList.length === 0 ? (
        <p className="text-gray-500 text-sm flex-grow">No recommendations available.</p>
      ) : (
        <div className="flex-grow" role="region" aria-label="Recommended Card">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5 shadow hover:shadow-md transition h-full">
            <h4 className="font-semibold text-lg text-indigo-800">{recommendedList[0].card_name}</h4>
            <p className="text-gray-700 text-sm mt-2">{recommendedList[0].suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendedCards;