import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Smartphone,
  CircleAlert,
} from "lucide-react";
import visa from '../Images/visa.png';
import mastercard from '../Images/mastercard.png';
import amex from '../Images/amex.png';
import diners from '../Images/diners.png';
import rupay from '../Images/rupay.png';
import BottomNavBar from "../component/BottomNavBar";
import {
  validateForm,
  validateCard,
  findBankByIssuer,
} from "../utils";
import axios from "axios";
import { apiEndpoint } from "../api";
import { useSelector } from "react-redux";

const BillPay = () => {
  // const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  // const [phoneError, setPhoneError] = useState(false);
  const [cardError, setCardError] = useState(false);
  const [cardType, setCardType] = useState(null);
  const [amount, setAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState('');
  const [generatedUPIIds, setGeneratedUPIIds] = useState([]);
  const [tableVisible, setTableVisible] = useState(false);
  const [bankList, setBankList] = useState([]);


  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rawCardDigits, setRawCardDigits] = useState("");


  const token = localStorage.getItem("token")

  const user = useSelector((state) => state.auth.user)
  console.log("user in billpay", user);


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

  // const validatePhoneNumber = (value) => {
  //   setPhoneError(value.length < 10);
  //   setPhoneNumber(value.slice(0, 10));
  //   console.log("BanksList", bankList);

  // };

  const validateCardNumber = async (input) => {
    let value = input.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    setRawCardDigits(value);
    let formattedValue = "";
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formattedValue += " ";
      formattedValue += value[i];
    }
    setCardNumber(formattedValue);

    const network = getCardNetwork(value);
    setCardType(network || null);
    let isLengthValid = network === "amex" ? value.length === 15 : value.length === 16;
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

  const isAllInputValid = useCallback(() => {
    // const isPhoneValid = phoneNumber.length === 10;
    const isAmountValid = parseFloat(amount) > 0;
    const isBankSelected = selectedBankId !== '';
    const isCardValid = !cardError && rawCardDigits.length >= 15;
    return isAmountValid && isBankSelected && isCardValid;
  }, [amount, selectedBankId, cardError, rawCardDigits]);


  const generateUPIIds = useCallback(async () => {
    const formData = {
      mobileNumber: user?.contact,
      cardNumber: cardNumber,
      bank: selectedBankId,
      amount: amount
    };
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      // setPhoneError(!!errors.mobileNumber);
      setCardError(!!errors.cardNumber);
      return alert("Please fix validation errors.");
    }

    const selectedBank = bankList.find(b => b.id === selectedBankId);
    if (!selectedBank) return alert("Please select a valid bank");


    let upi;
    try {
      const response = await axios.post(`${apiEndpoint}/api/v1/billpay/generate-upi`, {
        mobileNumber: user?.contact,
        cardNumber: cardNumber,
        bankId: selectedBankId,
        amount: amount,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = response.data;
      upi = data.upiId;
      console.log("UPI ID:-", upi);
    } catch (error) {
      console.error("Error generating UPI ID:", error);
      alert("Failed to generate UPI ID.");
      return;
    }


    // }


    const upiList = [{ bank: selectedBank.name, upiId: upi, strikethrough: false, disabled: false }];
    setGeneratedUPIIds(upiList);
    setTableVisible(true);
  }, [ cardNumber, selectedBankId, amount, token, bankList,user?.contact]);

  useEffect(() => {
    if (isAllInputValid() && !tableVisible) {
      generateUPIIds();
    }
  }, [isAllInputValid, generateUPIIds, tableVisible]);

  useEffect(() => {
    if (isAllInputValid()) {
      generateUPIIds();
    }
  }, [selectedBankId, isAllInputValid, generateUPIIds]);


  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await axios.get(`${apiEndpoint}/api/v1/billpay/banks`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }); // Your backend endpoint
        if (response.data.success) {
          console.log("Bank list fetched successfully:", response.data.banks);
          
          setBankList(response.data.banks);
        }
      } catch (error) {
        console.error("Error fetching bank list:", error);
      }
    };

    fetchBanks();
  }, [token]);



  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };


  return (
    <>
      <main className="min-h-screen flex items-center justify-center py-10 bg-[rgb(17,21,24)] px-4">
        <div className="w-full max-w-2xl bg-[#1e2530] p-6 sm:p-8 rounded-md text-white shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Pay Your Credit Card Bill via UPI ID</h2>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center bg-white rounded-md px-3 py-2 w-full relative">
              <Smartphone className="text-gray-600 w-5 h-5 mr-2" />
              <input
                type="number"
                maxLength={10}
                value={user?.contact||""}
                placeholder="Enter Phone Number"
                // onChange={(e) => validatePhoneNumber(e.target.value)}
                className="w-full text-black outline-none"
                readOnly
              />
              {/* {phoneError && (
                <CircleAlert className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
              )} */}
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



            <div className="relative w-full mb-4">
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-white cursor-pointer rounded-md px-3 py-2 flex justify-between items-center"
              >
                <span className="text-black">
                  {selectedBankId
                    ? bankList.find((b) => b.id === selectedBankId)?.name
                    : 'Select Bank'}
                </span>
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {dropdownOpen && (
                <div className="absolute mt-1 z-50 bg-white border rounded-md w-full max-h-60 overflow-y-auto shadow-md">
                  {bankList.map((bank) => (
                    <div
                      key={bank.id}
                      onClick={() => {
                        if (bank.name.toLowerCase() === 'axis bank' || bank.name.toLowerCase() === 'icici bank' || bank.name.toLowerCase() === 'idfc bank') {
                          setSelectedBankId(bank.id);
                          setDropdownOpen(false);
                        } else {
                          alert('This bank is temporarily disabled.');
                        }
                      }}
                      // className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer" 
                      className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 ${
                        bank.name.toLowerCase() === 'axis bank' || bank.name.toLowerCase() === 'icici bank' || bank.name.toLowerCase() === 'idfc bank'
                          ? 'cursor-pointer'
                          : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      <img src={bank.logo} alt={bank.name} className="w-6 h-6 object-contain" />
                      <span className="text-black">{bank.name}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>





          </div>


          {isAllInputValid() && generatedUPIIds.length > 0 && (
            <button
              onClick={() => {






                const { upiId, bank } = generatedUPIIds[0];
                console.log("UPI id and bank =", upiId, "and", bank);

                const upiString = `upi://pay?pa=${upiId}&pn=${bank}&am=${amount}&cu=INR`;

                if (isIOS()) {
                  // Try opening PhonePe (iOS) or fallback
                  const phonePeURL = `phonepe://pay?pa=${upiId}&pn=${bank}&am=${amount}&cu=INR`;
                  const gpayURL = `tez://upi/pay?pa=${upiId}&pn=${bank}&am=${amount}&cu=INR`;
                  const fallbackURL = `https://pay.google.com/gp/p/ui/pay?pa=${upiId}&pn=${bank}&am=${amount}&cu=INR`;

                  // Start with PhonePe
                  window.location.href = phonePeURL;

                  // Step 2: After 2s, try GPay
                  setTimeout(() => {
                    window.location.href = gpayURL;

                    // Step 3: After another 2s, open fallback
                    setTimeout(() => {
                      window.location.href = fallbackURL;
                    }, 2000);

                  }, 2000);


                  // You can also prompt QR code display as fallback (your QR overlay logic)
                  // or use `setTimeout` to fallback to a webpage after delay
                } else {
                  // Android devices - direct UPI URI should work
                  window.location.href = upiString;
                }

              }}
              className="pay-btn w-full mt-6 rounded-lg p-3 bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 cursor-pointer"
            >
              Pay Bill
            </button>
          )}



        </div>
        <BottomNavBar />
      </main>
    </>
  );
};

export default BillPay;

















