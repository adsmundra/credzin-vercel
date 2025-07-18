// import { useState } from "react";
// import {
//   Copy,
//   CreditCard,
//   Smartphone,
//   CircleAlert,
// } from "lucide-react";
// import gpayLogo from "../Images/gpayLogo.svg";
// import UpiFormats from "../component/UpiFormats";
// import QRCode from "react-qr-code";
// import visa from '../Images/visa.png';
// import mastercard from '../Images/mastercard.png';
// import amex from '../Images/amex.png';
// import diners from '../Images/diners.png';
// import rupay from '../Images/rupay.png';
// import BottomNavBar from "../component/BottomNavBar";


// const BillPay = () => {
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [cardNumber, setCardNumber] = useState("");
//   const [phoneError, setPhoneError] = useState(false);
//   const [cardError, setCardError] = useState(false);
//   const [cardType, setCardType] = useState(null);
//   const [generatedUPIIds, setGeneratedUPIIds] = useState([]);
//   const [tableVisible, setTableVisible] = useState(false);
//   const [copiedUPIId, setCopiedUPIId] = useState(null);
//   const [showOverlay, setShowOverlay] = useState(false);
//   const [overlayProps, setOverlayProps] = useState({
//     upiString: "",
//     bank: "",
//     upiId: "",
//   });




//   const openOverlay = (bank, upiId) => {
//     const upiString = `upi://pay?pa=${upiId}&pn=${bank}&cu=INR`;
//     setOverlayProps({ upiString, bank, upiId });
//     setShowOverlay(true);
//   };

//   const closeOverlay = () => {
//     setShowOverlay(false);
//   };

//   const validatePhoneNumber = (phoneNumber: string) => {
//     if (phoneNumber.toString().length < 10) {
//       setPhoneError(true);
//     } else {
//       setPhoneError(false);
//     }
//     setPhoneNumber(phoneNumber.slice(0, 10));
//   };

//   const luhnCheck = (number) => {
//     let sum = 0;
//     let shouldDouble = false;
//     for (let i = number.length - 1; i >= 0; i--) {
//       let digit = parseInt(number[i], 10);
//       if (shouldDouble) {
//         digit *= 2;
//         if (digit > 9) digit -= 9;
//       }
//       sum += digit;
//       shouldDouble = !shouldDouble;
//     }
//     return sum % 10 === 0;
//   };

//   const getCardNetwork = (cardNumber) => {
//     const firstTwo = parseInt(cardNumber.slice(0, 2), 10);
//     const firstSix = parseInt(cardNumber.slice(0, 6), 10);
//     if (cardNumber[0] === "4") return "visa";
//     if ((firstTwo >= 51 && firstTwo <= 55) || (firstSix >= 2221 && firstSix <= 2720)) return "mastercard";
//     if (firstTwo === 34 || firstTwo === 37) return "amex";
//     if (firstTwo === 36) return "diners";
//     if ([60, 65, 81, 82].includes(firstTwo)) return "rupay";
//     return null;
//   };

//   const validateCardNumber = (input) => {
//     let value = input.replace(/\s+/g, "").replace(/[^0-9]/g, "");
//     let formattedValue = "";
//     for (let i = 0; i < value.length; i++) {
//       if (i > 0 && i % 4 === 0) formattedValue += " ";
//       formattedValue += value[i];
//     }
//     setCardNumber(formattedValue);

//     const isLengthValid = value.length === 15 || value.length === 16;
//     const isLuhnValid = isLengthValid ? luhnCheck(value) : false;
//     const network = getCardNetwork(value);
//     if (network) setCardType(network);
//     else {
//       setCardType(null);
//       setCardError(true);
//     }
//     setCardError(!isLuhnValid || !isLengthValid);
//   };

//   const generateUPIIds = () => {
//     const last4Digits = cardNumber.slice(-4);
//     const cleanedCard = cardNumber.replace(/\s+/g, "");
//     const upiIDs = {
//       Axis: `CC.91${phoneNumber}${last4Digits}@axisbank`,
//       ICICI: `ccpay.${cleanedCard}@icici`,
//       "AU Bank": `AUCC${phoneNumber}${last4Digits}@AUBANK`,
//       IDFC: `${cleanedCard}.cc@idfcbank`,
//       AMEX: cleanedCard.length === 15 ? `AEBC${cleanedCard}@SC` : "Not applicable for 16-digit cards",
//       SBI: `Sbicard.${cleanedCard}@SBI`,
//     };

//     const upiList = Object.entries(upiIDs).map(([bank, upiId]) => ({
//       bank,
//       upiId,
//       strikethrough: bank === "SBI",
//       disabled: upiId.includes("Not applicable") || bank === "SBI",
//     }));

//     setGeneratedUPIIds(upiList);
//     setTableVisible(true);
//   };

//   const copyToClipboard = (upiId) => {
//     if (navigator.clipboard && window.isSecureContext) {
//       navigator.clipboard.writeText(upiId).then(() => setCopiedUPIId(upiId));
//     }
//   };

//   return (
//     <main className="min-h-screen flex items-center justify-center py-10 bg-[rgb(17,21,24)] px-4">
//       <div className="w-full max-w-2xl bg-[#1e2530] p-6 sm:p-8 rounded-md text-white shadow-md">
//         <h2 className="text-2xl font-bold mb-6 text-center">Pay Your Credit Card Bill via UPI ID</h2>


//         <div className="flex flex-col sm:flex-row gap-4 mb-6">
//           <div className="flex items-center bg-white rounded-md px-3 py-2 w-full relative">
//             <Smartphone className="text-gray-600 w-5 h-5 mr-2" />
//             <input
//               type="number"
//               maxLength={10}
//               value={phoneNumber}
//               placeholder="Enter Phone Number"
//               onChange={(e) => validatePhoneNumber(e.target.value)}
//               className="w-full text-black outline-none"
//             />
//             {phoneError && (
//               <CircleAlert className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
//             )}
//           </div>

//           <div className="flex items-center bg-white rounded-md px-3 py-2 w-full relative">
//             <CreditCard className="text-gray-600 w-5 h-5 mr-2" />
//             <input
//               type="text"
//               maxLength={19}
//               value={cardNumber}
//               placeholder="Enter Credit Card Number"
//               onChange={(e) => validateCardNumber(e.target.value)}
//               className="w-full text-black outline-none"
//             />
//             {cardError ? (
//               <CircleAlert className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
//             ) : (
//               cardType && (
//                 <img
//                   src={
//                     cardType === 'visa'
//                       ? visa
//                       : cardType === 'mastercard'
//                         ? mastercard
//                         : cardType === 'amex'
//                           ? amex
//                           : cardType === 'diners'
//                             ? diners
//                             : cardType === 'rupay'
//                               ? rupay
//                               : ''
//                   }
//                   alt={`${cardType} logo`}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8"
//                 />
//               )
//             )}
//           </div>
//         </div>

//         <button
//           onClick={generateUPIIds}
//           className="generate-btn w-full mb-6 rounded-lg p-3 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 cursor-pointer"
//         >
//           Generate UPI IDs
//         </button>


//         {/* Expand-down table container */}
//         <div
//           className={`transition-all duration-500 ease-in-out overflow-hidden ${tableVisible ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
//             }`}
//         >
//           <div className="mt-6 overflow-x-auto bg-[#1e2530] rounded-md text-white">
//             <table className="min-w-full text-sm sm:text-base border border-gray-600">
//               <thead>
//                 <tr>
//                   <th className="border border-gray-600 p-4 text-left">Bank</th>
//                   <th className="border border-gray-600 p-4 text-left">UPI ID</th>
//                   <th className="border border-gray-600 p-4 text-left">QR</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {generatedUPIIds.map(({ bank, upiId, strikethrough, disabled }) => {
//                   const upiString = `upi://pay?pa=${upiId}&pn=${bank}&cu=INR`;
//                   return (
//                     <tr key={bank} className="border-t border-gray-600">
//                       <td className="border border-gray-600 p-4">{bank}</td>
//                       <td className="border border-gray-600 p-4">
//                         <div className="flex flex-col sm:flex-row sm:justify-between">
//                           <span className={strikethrough ? "line-through" : ""}>{upiId}</span>
//                           <div className="flex gap-2 mt-2 sm:mt-0">
//                             <button
//                               onClick={() => copyToClipboard(upiId)}
//                               className="px-2 py-1 border rounded text-sm text-white border-gray-500 bg-transparent flex items-center cursor-pointer"
//                               disabled={disabled}
//                             >
//                               <Copy className="inline w-4 h-4 mr-1" />
//                               {copiedUPIId === upiId ? "Copied" : "Copy"}
//                             </button>


//                             <a
//                               href={upiString}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="flex items-center px-2 py-1 border border-gray-500 rounded text-white text-sm hover:bg-gray-700 transition-colors"
//                             >
//                               <img src={gpayLogo} alt="GPay" className="w-9 h-5 mr-1" />
//                               {/* Pay */}
//                             </a>

//                           </div>
//                         </div>
//                       </td>
//                       <td className="border border-gray-600 p-4">
//                         <button onClick={() => openOverlay(bank, upiId)}>
//                           <QRCode value={upiString} size={50} bgColor="#1e2530" fgColor="#ffffff" />
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {showOverlay && (
//           <div id="overlay" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
//             <div className="flex flex-col items-center justify-center space-y-4">
//               <p className="text-center font-semibold">{`${overlayProps.bank} / ${overlayProps.upiId}`}</p>

//               <div className="flex justify-center">
//                 <QRCode value={overlayProps.upiString} size={300} />
//               </div>

//               <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={closeOverlay}>
//                 Close
//               </button>
//             </div>
//           </div>
//         )}

//         <UpiFormats />
//       </div>
//       <BottomNavBar />
//     </main>
//   );
// }
// export default BillPay;






























// BillPay.jsx (updated with logic from PaymentForm.tsx, styles untouched)
import { useState } from "react";
import {
  Copy,
  CreditCard,
  Smartphone,
  CircleAlert,
} from "lucide-react";
import gpayLogo from "../Images/gpayLogo.svg";
import UpiFormats from "../component/UpiFormats";
import QRCode from "react-qr-code";
import visa from '../Images/visa.png';
import mastercard from '../Images/mastercard.png';
import amex from '../Images/amex.png';
import diners from '../Images/diners.png';
import rupay from '../Images/rupay.png';
import BottomNavBar from "../component/BottomNavBar";
import {
  validateForm,
  generateUpiId,
  validateCard,
  findBankByIssuer,
  BANKS
} from "../utils";

const BillPay = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [cardError, setCardError] = useState(false);
  const [cardType, setCardType] = useState(null);
  const [amount, setAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState('');
  const [generatedUPIIds, setGeneratedUPIIds] = useState([]);
  const [tableVisible, setTableVisible] = useState(false);
  const [copiedUPIId, setCopiedUPIId] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayProps, setOverlayProps] = useState({
    upiString: "",
    bank: "",
    upiId: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rawCardDigits, setRawCardDigits] = useState("");


  const openOverlay = (bank, upiId) => {
    const upiString = `upi://pay?pa=${upiId}&pn=${bank}&am=${amount}&cu=INR`;
    setOverlayProps({ upiString, bank, upiId });
    setShowOverlay(true);
  };

  const closeOverlay = () => setShowOverlay(false);

  const luhnCheck = (number) => {
    let sum = 0, shouldDouble = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const getCardNetwork = (cardNumber) => {
    const firstTwo = parseInt(cardNumber.slice(0, 2), 10);
    const firstSix = parseInt(cardNumber.slice(0, 6), 10);
    if (cardNumber[0] === "4") return "visa";
    if ((firstTwo >= 51 && firstTwo <= 55) || (firstSix >= 2221 && firstSix <= 2720)) return "mastercard";
    if (firstTwo === 34 || firstTwo === 37) return "amex";
    if (firstTwo === 36) return "diners";
    if ([60, 65, 81, 82].includes(firstTwo)) return "rupay";
    return null;
  };

  const validatePhoneNumber = (value) => {
    setPhoneError(value.length < 10);
    setPhoneNumber(value.slice(0, 10));
  };

  const validateCardNumber = async (input) => {
    let value = input.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    setRawCardDigits(value);
    let formattedValue = "";
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formattedValue += " ";
      formattedValue += value[i];
    }
    setCardNumber(formattedValue);

    // const isLengthValid = value.length === 15 || value.length === 16;
    // const isLuhnValid = isLengthValid ? luhnCheck(value) : false;
    // const network = getCardNetwork(value);
    // setCardType(network || null);
    // setCardError(!isLuhnValid || !isLengthValid);


    const network = getCardNetwork(value);
    setCardType(network || null);
    let isLengthValid = false;
    if (network === "amex") {
      isLengthValid = value.length === 15;
    } else {
      isLengthValid = value.length === 16;
    }
    const isLuhnValid = isLengthValid ? luhnCheck(value) : false;
    setCardError(!isLuhnValid || !isLengthValid);



    try {
      const response = await validateCard(value);
      const bank = findBankByIssuer(response.Issuer);
      if (bank) {
        setSelectedBankId(bank.id);
      }
    } catch (err) {
      console.warn('Card validation failed');
    }
  };

  // console.log(selectedBank);


  const generateUPIIds = () => {
    const formData = {
      mobileNumber: phoneNumber,
      cardNumber: cardNumber,
      bank: selectedBankId,
      amount: amount
    };
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setPhoneError(!!errors.mobileNumber);
      setCardError(!!errors.cardNumber);
      return alert("Please fix validation errors.");
    }

    const selectedBank = BANKS.find(b => b.id === selectedBankId);
    if (!selectedBank) return alert("Please select a valid bank");

    console.log("Selected Bank ID:", selectedBankId);
console.log("Selected Bank Object:", selectedBank);




    // ❌ Block unsupported banks
    if (["aubank", "idfcbank"].includes(selectedBank.id)) {
      return alert(`${selectedBank.name} is currently not supported for UPI payments.`);
    }



    let upi;
    if (selectedBank.id === "icici") {
      upi = `${phoneNumber}@icici`;
    }
    else if (selectedBank.id === "sbi") {
      upi = `${phoneNumber}@sbi`;
    }
    else if (selectedBank.id === "amex") {
      const rawCard = cardNumber.replace(/\s+/g, '');
      console.log("selectedBank", selectedBank);

      upi = `AEBC${rawCard}@sc`;
    }
    else {
      upi = generateUpiId(formData, selectedBank);
    }

    // const upi = generateUpiId(formData, selectedBank);
    const upiList = [{ bank: selectedBank.name, upiId: upi, strikethrough: false, disabled: false }];
    setGeneratedUPIIds(upiList);
    setTableVisible(true);
  };

  const copyToClipboard = (upiId) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(upiId).then(() => setCopiedUPIId(upiId));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-10 bg-[rgb(17,21,24)] px-4">
      <div className="w-full max-w-2xl bg-[#1e2530] p-6 sm:p-8 rounded-md text-white shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Pay Your Credit Card Bill via UPI ID</h2>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center bg-white rounded-md px-3 py-2 w-full relative">
            <Smartphone className="text-gray-600 w-5 h-5 mr-2" />
            <input
              type="number"
              maxLength={10}
              value={phoneNumber}
              placeholder="Enter Phone Number"
              onChange={(e) => validatePhoneNumber(e.target.value)}
              className="w-full text-black outline-none"
            />
            {phoneError && (
              <CircleAlert className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
            )}
          </div>

          <div className="flex items-center bg-white rounded-md px-3 py-2 w-full relative">
            <CreditCard className="text-gray-600 w-5 h-5 mr-2" />
            <input
              type="text"
              // maxLength={19}
              value={cardNumber}
              placeholder="Enter Credit Card Number"
              onChange={(e) => validateCardNumber(e.target.value)}
              className="w-full text-black outline-none"
              maxLength={
                rawCardDigits.startsWith("34") || rawCardDigits.startsWith("37")
                  ? 17 // 15 digits + 2 spaces
                  : 19 // 16 digits + 3 spaces
              }
            />
            {cardError ? (
              <CircleAlert className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
            ) : (
              cardType && (
                <img
                  src={cardType === 'visa' ? visa : cardType === 'mastercard' ? mastercard : cardType === 'amex' ? amex : cardType === 'diners' ? diners : cardType === 'rupay' ? rupay : ''}
                  alt={`${cardType} logo`}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8"
                />
              )
            )}
          </div>
        </div>

        <div className="flex items-center bg-white rounded-md px-3 py-2 w-full mb-4 relative">
          <span className="text-gray-600 w-5 h-5 mr-2">₹</span>
          <input
            type="number"
            value={amount}
            placeholder="Enter Amount"
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-black outline-none"
            min={0}
          />
        </div>



        <div className="w-full mb-4">
          {/* <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="w-full p-2 rounded bg-white text-black outline-none cursor-pointer"
          >
            <option value="">Select Bank</option>
            {BANKS.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </select> */}


          <div className="relative w-full mb-4">
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-white cursor-pointer rounded-md px-3 py-2 flex justify-between items-center"
            >
              <span className="text-black">
                {selectedBankId
                  ? BANKS.find((b) => b.id === selectedBankId)?.name
                  : 'Select Bank'}
              </span>
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {dropdownOpen && (
              <div className="absolute mt-1 z-50 bg-white border rounded-md w-full max-h-60 overflow-y-auto shadow-md">
                {/* {BANKS.map((bank) => ( */}
                {BANKS.filter(bank => bank.id !== "idfc" && bank.id !== "aubank").map((bank) => (
                  <div
                    key={bank.id}
                    onClick={() => {
                      setSelectedBankId(bank.id);
                      setDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <img src={bank.logo} alt={bank.name} className="w-6 h-6 object-contain" />
                    <span className="text-black">{bank.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>





        </div>



        <button
          onClick={generateUPIIds}
          className="generate-btn w-full mb-6 rounded-lg p-3 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 cursor-pointer"
        >
          Generate UPI IDs
        </button>

        {tableVisible && (
          <div className="mt-6 overflow-x-auto bg-[#1e2530] rounded-md text-white">
            <table className="min-w-full text-sm sm:text-base border border-gray-600">
              <thead>
                <tr>
                  <th className="border border-gray-600 p-4 text-left">Bank</th>
                  <th className="border border-gray-600 p-4 text-left">UPI ID</th>
                  <th className="border border-gray-600 p-4 text-left">QR</th>
                </tr>
              </thead>
              <tbody>
                {generatedUPIIds.map(({ bank, upiId, strikethrough, disabled }) => {
                  const upiString = `upi://pay?pa=${upiId}&pn=${bank}&am=${amount}&cu=INR`;
                  return (
                    <tr key={bank} className="border-t border-gray-600">
                      <td className="border border-gray-600 p-4">{bank}</td>
                      <td className="border border-gray-600 p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className={strikethrough ? "line-through" : ""}>{upiId}</span>
                          <div className="flex gap-2 mt-2 sm:mt-0">
                            <button
                              onClick={() => copyToClipboard(upiId)}
                              className="px-2 py-1 border rounded text-sm text-white border-gray-500 bg-transparent flex items-center cursor-pointer"
                              disabled={disabled}
                            >
                              <Copy className="inline w-4 h-4 mr-1" />
                              {copiedUPIId === upiId ? "Copied" : "Copy"}
                            </button>
                            <a
                              href={upiString}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center px-2 py-1 border border-gray-500 rounded text-white text-sm hover:bg-gray-700 transition-colors"
                            >
                              <img src={gpayLogo} alt="GPay" className="w-9 h-5 mr-1" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-600 p-4">
                        <button onClick={() => openOverlay(bank, upiId)}>
                          <QRCode value={upiString} size={50} bgColor="#1e2530" fgColor="#ffffff" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showOverlay && (
          <div id="overlay" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-center font-semibold">{`${overlayProps.bank} / ${overlayProps.upiId}`}</p>
              <div className="flex justify-center">
                <QRCode value={overlayProps.upiString} size={300} />
              </div>
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={closeOverlay}>
                Close
              </button>
            </div>
          </div>
        )}

        <UpiFormats />
      </div>
      <BottomNavBar />
    </main>
  );
};

export default BillPay;
