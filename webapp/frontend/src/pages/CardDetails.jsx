
// import React, { useEffect, useState } from 'react';
// import { FaRegCreditCard, FaUser } from 'react-icons/fa';
// import axios from 'axios';
// import { apiEndpoint } from '../api';
// import { useParams } from 'react-router-dom';
// import { Calendar } from 'lucide-react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// const fetchCardDetails = async ({ queryKey }) => {
//     const [, id, token] = queryKey;
//     const { data } = await axios.get(`${apiEndpoint}/api/v1/card/getcardDetails/${id}`, {
//         headers: {
//             Authorization: `Bearer ${token}`,
//         },
//     });
//     if (!data.success) {
//         throw new Error(data.message || 'Card not found');
//     }
//     return data.data;
// };

// const saveCardDetails = async ({ id, cardHolderName, cardNumber, expiry, token }) => {
//     const res = await axios.post(
//         `${apiEndpoint}/api/v1/card/cardDetails`,
//         {
//             user_card_id: id,
//             name_on_card: cardHolderName,
//             card_number: cardNumber.replace(/\s/g, ''),
//             card_expiry_date: expiry,
//         },
//         {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         }
//     );
//     return res.data;
// };


// const CardDetails = () => {
//     const [token, setToken] = useState(null);
//     useEffect(() => {
//         const storedToken = localStorage.getItem('token');
//         if (storedToken) setToken(storedToken);
//     }, []);

//     const { id } = useParams();
//     const queryClient = useQueryClient();

//     // Local state for form inputs when creating a new card
//     const [name, setName] = useState('');
//     const [number, setNumber] = useState('');
//     const [expiry, setExpiry] = useState('');

//     const { data: cardDetails, isLoading, isSuccess, isError, error } = useQuery({
//         queryKey: ['cardDetails', id, token],
//         queryFn: fetchCardDetails,
//         enabled: !!id && !!token,
//         retry: (failureCount, error) => {
//             if (error?.response?.status === 404) return false;
//             return failureCount < 2;
//         },
//     });

//     const mutation = useMutation({
//         mutationFn: saveCardDetails,
//         onSuccess: () => {
//             alert('Card details saved!');
//             queryClient.invalidateQueries({ queryKey: ['cardDetails', id, token] });
//         },
//         onError: (error) => {
//             console.error(error);
//             alert('Error saving card details');
//         },
//     });

//     const handleSave = (e) => {
//         e.preventDefault();
//         if (!name || !number || !expiry) {
//             alert('All fields required');
//             return;
//         }
//         mutation.mutate({ id, cardHolderName: name, cardNumber: number, expiry, token });
//     };

//     // If the query fails for a reason other than "not found", show an error.
//     if (isError && error?.response?.status !== 404) {
//         return <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white">Error fetching card details.</div>;
//     }

//     // Determine the values to display in the form
//     const displayName = isSuccess ? cardDetails?.name_on_card || '' : name;
//     const displayNumber = isSuccess ? (cardDetails?.card_number?.replace(/(.{4})/g, '$1 ').trim() || '') : number;
//     const displayExpiry = isSuccess ? cardDetails?.card_expiry_date || '' : expiry;

//     return (
//         <div className="min-h-screen bg-black flex items-center justify-center p-4">
//             <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/10">
//                 <h1 className='text-white text-center mb-6'>Card Detail</h1>
//                 <form className="space-y-4">
//                     {/* Card Holder Name */}
//                     <div>
//                         <label className="block text-white text-sm mb-1">Card Holder Name</label>
//                         <div className="flex items-center bg-white/20 rounded-md">
//                             <div className="pl-3 text-white"><FaUser /></div>
//                             <input
//                                 type="text"
//                                 placeholder="Card Holder Name"
//                                 value={displayName}
//                                 onChange={(e) => setName(e.target.value)}
//                                 className="w-full p-3 pl-2 bg-transparent text-white placeholder-gray-300 focus:outline-none disabled:opacity-50"
//                                 readOnly={isSuccess}
//                                 disabled={isLoading}
//                                 required
//                             />
//                         </div>
//                     </div>

//                     {/* Card Number */}
//                     <div>
//                         <label className="block text-white text-sm mb-1">Card Number</label>
//                         <div className="flex items-center bg-white/20 rounded-md">
//                             <div className="pl-3 text-white"><FaRegCreditCard /></div>
//                             <input
//                                 type="text"
//                                 placeholder="1234 5678 9012 3456"
//                                 value={displayNumber}
//                                 onChange={(e) => setNumber(e.target.value)}
//                                 maxLength={19}
//                                 className="w-full p-3 pl-2 bg-transparent text-white placeholder-gray-300 focus:outline-none disabled:opacity-50"
//                                 readOnly={isSuccess}
//                                 disabled={isLoading}
//                                 required
//                             />
//                         </div>
//                     </div>

//                     {/* Expiry Date */}
//                     <div>
//                         <label className="block text-white text-sm mb-1">Expiry Date</label>
//                         <div className="flex items-center bg-white/20 rounded-md">
//                             <div className="pl-3 text-white"><Calendar /></div>
//                             <input
//                                 type="text"
//                                 placeholder="MM/YY"
//                                 value={displayExpiry}
//                                 onChange={(e) => setExpiry(e.target.value)}
//                                 maxLength={5}
//                                 className="w-full p-3 pl-2 bg-transparent text-white placeholder-gray-300 focus:outline-none disabled:opacity-50"
//                                 readOnly={isSuccess}
//                                 disabled={isLoading}
//                                 required
//                             />
//                         </div>
//                     </div>

//                     {/* Show Save button only if we are NOT in read-only mode */}
//                     {!isSuccess && (
//                         <button
//                             type="submit"
//                             className="w-full py-3 rounded-md bg-[#1d4ed8] hover:bg-blue-800 text-white font-semibold transition duration-300 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
//                             onClick={handleSave}
//                             disabled={isLoading || mutation.isPending}
//                         >
//                             {mutation.isPending ? 'Saving...' : (isLoading ? 'Loading...' : 'Save')}
//                         </button>
//                     )}
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default CardDetails;







import React, { useEffect, useState } from 'react';
import { FaRegCreditCard, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { apiEndpoint } from '../api';
import { useParams } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Utility functions
const formatCardNumber = (value) =>
  value.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatName = (value) => value.toUpperCase();

const formatExpiry = (value) => {
  const cleaned = value.replace(/\D/g, '').substring(0, 4);
  if (cleaned.length < 3) return cleaned;
  return cleaned.replace(/(\d{2})(\d{1,2})/, '$1/$2');
};

// API call to fetch card details
const fetchCardDetails = async ({ queryKey }) => {
  const [, id, token] = queryKey;
  const { data } = await axios.get(`${apiEndpoint}/api/v1/card/getcardDetails/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("Card details fetched:", data);
  if (!data.success) throw new Error(data.message || 'Card not found');
  return data.data;
};

// API call to save card details
const saveCardDetails = async ({ id, cardHolderName, cardNumber, expiry, token }) => {
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
  return res.data;
};

const CardDetails = () => {
  const [token, setToken] = useState(null);
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) setToken(storedToken);
  }, []);

  const { id } = useParams();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');

  const { data: cardDetails, isLoading, isSuccess, isError, error } = useQuery({
    queryKey: ['cardDetails', id, token],
    queryFn: fetchCardDetails,
    enabled: !!id && !!token,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const isCardAlreadySaved = isSuccess && !!cardDetails?.name_on_card;

  const mutation = useMutation({
    mutationFn: saveCardDetails,
    onSuccess: () => {
      alert('Card details saved!');
      queryClient.invalidateQueries({ queryKey: ['cardDetails', id, token] });
    },
    onError: (error) => {
      console.error(error);
      alert('Error saving card details');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!name || !number || !expiry) {
      alert('All fields required');
      return;
    }
    mutation.mutate({ id, cardHolderName: name, cardNumber: number, expiry, token });
  };

  if (isError && error?.response?.status !== 404) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white">
        Error fetching card details.
      </div>
    );
  }

  // Fallback values if saved
  const displayName = cardDetails?.name_on_card || '';
  const displayNumber = formatCardNumber(cardDetails?.card_number || '');
  const displayExpiry = cardDetails?.card_expiry_date || '';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/10">
        <h1 className="text-white text-center mb-6">Card Detail</h1>
        <form className="space-y-4" onSubmit={handleSave}>
          {/* Card Holder Name */}
          <div>
            <label className="block text-white text-sm mb-1">Card Holder Name</label>
            <div className="flex items-center bg-white/20 rounded-md">
              <div className="pl-3 text-white"><FaUser /></div>
              <input
                type="text"
                placeholder="CARD HOLDER NAME"
                value={isCardAlreadySaved ? displayName : name}
                onChange={(e) => !isCardAlreadySaved && setName(formatName(e.target.value))}
                className="w-full p-3 pl-2 bg-transparent text-white placeholder-gray-300 focus:outline-none disabled:opacity-50"
                readOnly={isCardAlreadySaved}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-white text-sm mb-1">Card Number</label>
            <div className="flex items-center bg-white/20 rounded-md">
              <div className="pl-3 text-white"><FaRegCreditCard /></div>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={isCardAlreadySaved ? displayNumber : number}
                onChange={(e) => !isCardAlreadySaved && setNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className="w-full p-3 pl-2 bg-transparent text-white placeholder-gray-300 focus:outline-none disabled:opacity-50"
                readOnly={isCardAlreadySaved}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-white text-sm mb-1">Expiry Date</label>
            <div className="flex items-center bg-white/20 rounded-md">
              <div className="pl-3 text-white"><Calendar /></div>
              <input
                type="text"
                placeholder="MM/YY"
                value={isCardAlreadySaved ? displayExpiry : expiry}
                onChange={(e) => !isCardAlreadySaved && setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                className="w-full p-3 pl-2 bg-transparent text-white placeholder-gray-300 focus:outline-none disabled:opacity-50"
                readOnly={isCardAlreadySaved}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Save Button */}
          {!isCardAlreadySaved && (
            <button
              type="submit"
              className="w-full py-3 rounded-md bg-[#1d4ed8] hover:bg-blue-800 text-white font-semibold transition duration-300 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={isLoading || mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default CardDetails;
