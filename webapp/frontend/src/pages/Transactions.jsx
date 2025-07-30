import React, { useMemo } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { apiEndpoint } from "../api";
import BottomNavBar from "../component/BottomNavBar";

const fetchTransactions = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${apiEndpoint}/api/v1/transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.transactions || [];
};

const Transactions = () => {
  const {
    data: transactions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    staleTime: 1000 * 60 * 5, // Optional: cache for 5 minutes
  });

  const { totalSpend, spendByCategory } = useMemo(() => {
    let total = 0;
    const byCat = {};
    transactions.forEach((txn) => {
      const amt = txn.amount?.value || 0;
      total += amt;
      const cat = txn.categoryId?.name || "Uncategorized";
      byCat[cat] = (byCat[cat] || 0) + amt;
    });
    return { totalSpend: total, spendByCategory: byCat };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-[#111518] text-white font-sans px-4 py-6 pt-20">
      <h2 className="text-2xl font-bold mb-6 text-center">Transactions</h2>

      {/* Spend Analyzer */}
      <div className="mb-6 max-w-2xl mx-auto">
        <div className="bg-[#23272f] rounded-lg p-4 mb-2">
          <div className="text-lg font-semibold">Total Spend</div>
          <div className="text-2xl text-blue-400 font-bold">
            ₹{totalSpend.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#23272f] rounded-lg p-4">
          <div className="text-lg font-semibold mb-2">Spend by Category</div>
          {Object.keys(spendByCategory).length === 0 ? (
            <div className="text-[#9cabba]">No data</div>
          ) : (
            <ul>
              {Object.entries(spendByCategory).map(([cat, amt]) => (
                <li key={cat} className="flex justify-between py-1">
                  <span>{cat}</span>
                  <span>₹{amt.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      {isLoading ? (
        <div className="text-center py-10">Loading transactions...</div>
      ) : isError ? (
        <div className="text-center py-10 text-red-500">
          Failed to load transactions.
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10 text-[#9cabba]">
          No transaction yet
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#23272f]">
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Card</th>
                <th className="py-2 px-4">Category</th>
                <th className="py-2 px-4">Amount</th>
                <th className="py-2 px-4">Reward</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, idx) => (
                <tr key={txn._id || idx} className="border-b border-[#23272f]">
                  <td className="py-2 px-4">
                    {txn.dateTime
                      ? new Date(txn.dateTime).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-2 px-4">
                    {txn.cardId?.card_name || "N/A"}
                  </td>
                  <td className="py-2 px-4">
                    {txn.categoryId?.name || "Uncategorized"}
                  </td>
                  <td className="py-2 px-4">
                    ₹
                    {txn.amount?.value
                      ? txn.amount.value.toLocaleString()
                      : "0"}
                  </td>
                  <td className="py-2 px-4">
                    {txn.actualReward?.reward?.value
                      ? `${txn.actualReward.reward.value} ${txn.actualReward.reward.unit}`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
};

export default Transactions;
