
import React, { useState } from 'react'
import { FaRegCreditCard, FaUser } from 'react-icons/fa'
import axios from "axios";
import { apiEndpoint } from '../api';
import { useParams } from 'react-router-dom';

const CardDetails = () => {

    const token = localStorage.getItem("token")
    console.log("Token in CardDetails", token)

    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');
    const { id } = useParams();

    const handleCardHolderNameChange = (e) => {
        let input = e.target.value;

        // Allow only letters and spaces
        input = input.replace(/[^a-zA-Z\s]/g, '');

        // Capitalize the first letter of each word
        input = input.replace(/\b\w/g, (char) => char.toUpperCase());

        setCardHolderName(input);
    };


    const handleCardNumberChange = (e) => {
        const input = e.target.value;

        // Remove all non-digit characters
        const digitsOnly = input.replace(/\D/g, '');

        // Add space after every 4 digits
        const formatted = digitsOnly.replace(/(.{4})/g, '$1 ').trim();

        setCardNumber(formatted);
    }

    const handleExpiryChange = (e) => {
        let input = e.target.value;

        // Remove non-digits and slash
        input = input.replace(/[^\d]/g, '');

        // Format as MM/YY
        if (input.length >= 3) {
            input = input.slice(0, 2) + '/' + input.slice(2, 4);
        }

        setExpiry(input.slice(0, 5)); // Limit to 5 characters
    };


    const handleSave = async (e) => {
    e.preventDefault();

    if (!cardHolderName || !cardNumber || !expiry) {
      alert('All fields required');
      return;
    }

    try {
      const res = await axios.post(
        `${apiEndpoint}/api/v1/card/cardDetails`,
        {
          user_card_id: id,
          name_on_card: cardHolderName,
          card_number: cardNumber.replace(/\s/g, ''),
          card_expiry_date: expiry,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('In handle Save Method...', res);

      if (res.data.success) {
        alert('Card details saved!');
        setCardNumber("");
        setExpiry("");
        setCardHolderName("")
      } else {
        alert('Failed to save.');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving card details');
    }
  };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/10">
                {/* Placeholder Credit Card Image */}
                <div className="flex justify-center mb-6">
                    {/* <img
                        src="https://via.placeholder.com/350x200.png?text=Credit+Card"
                        alt="Credit Card"
                        className="rounded-lg shadow-lg"
                    /> */}
                    <h1 className='text-white'>Card Detail</h1>
                </div>

                <form className="space-y-4">

                    <div>
                        <label className="block text-white text-sm mb-1">Card Holder Name</label>
                        <div className="flex items-center bg-white/20 rounded-md">
                            <div className="pl-3 text-white">
                                <FaUser />
                            </div>
                            <input
                                type="text"
                                placeholder="Card Holder Name"
                                value={cardHolderName}
                                onChange={handleCardHolderNameChange}
                                className="w-full p-3 pl-2 bg-transparent text-white placeholder-gray-300 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Card Number */}
                    <div>
                        <label className="block text-white text-sm mb-1">Card Number</label>
                        <div className="flex items-center bg-white/20 rounded-md">
                            <div className="pl-3 text-white">
                                <FaRegCreditCard />
                            </div>
                            <input
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                maxLength={19}
                                className="w-full p-3 pl-2 bg-transparent text-white placeholder-gray-300 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label className="block text-white text-sm mb-1">Expiry Date</label>
                        <input
                            type="text"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={handleExpiryChange}
                            maxLength={5}
                            className="w-full p-3 rounded-md bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                            required
                        />
                    </div>

                    {/* Amount */}
                    {/* <div>
                        <label className="block text-white text-sm mb-1">Amount</label>
                        <input
                            type="number"
                            placeholder="₹ 1000"
                            className="w-full p-3 rounded-md bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                            required
                        />
                    </div> */}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-3 rounded-md bg-[#1d4ed8] hover:bg-blue-800 text-white font-semibold transition duration-300 shadow-lg"
                        onClick={handleSave}
                    >
                        Save
                    </button>

                </form>
            </div>
        </div>
    )
}

export default CardDetails;
