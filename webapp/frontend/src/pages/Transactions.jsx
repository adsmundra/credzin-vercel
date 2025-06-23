import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiEndpoint } from "../api";
import BottomNavBar from "../component/BottomNavBar";


const Transitions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${apiEndpoint}/api/v1/transaction/list`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTransactions(res.data.data || []);
      } catch (err) {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#111518] text-white font-sans px-4 py-6 pt-20">
      <h2 className="text-2xl font-bold mb-6 text-center">Transactions</h2>
      {loading ? (
        <div className="text-center py-10">Loading transactions...</div>
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
                <th className="py-2 px-4">Description</th>
                <th className="py-2 px-4">Amount</th>
                <th className="py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, idx) => (
                <tr key={txn._id || idx} className="border-b border-[#23272f]">
                  <td className="py-2 px-4">
                    {txn.date
                      ? new Date(txn.date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-2 px-4">{txn.description || "N/A"}</td>
                  <td className="py-2 px-4">
                    ₹{txn.amount ? txn.amount.toLocaleString() : "0"}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={
                        txn.status === "success"
                          ? "text-green-400"
                          : txn.status === "failed"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }
                    >
                      {txn.status || "pending"}
                    </span>
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

export default Transitions;