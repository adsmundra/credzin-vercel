import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, IndianRupee, QrCode, AlertCircle, CheckCircle2, Smartphone as Smartphone2, CreditCard as CreditCardIcon, AlertTriangle, RefreshCw, Building2 } from 'lucide-react';
import QRCode from 'qrcode.react';
import { BANKS, validateForm, generateUpiId, validateCard, findBankByIssuer, getCardSchemeIcon } from '../utils';
import { FormData, ValidationErrors, CardValidationResponse, CardGroup } from '../types';

const PaymentForm: React.FC = () => {
  const initialFormState = {
    mobileNumber: '',
    cardNumber: '',
    bank: '',
    amount: '',
  };

  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [cardInfo, setCardInfo] = useState<CardValidationResponse | null>(null);
  const [cardError, setCardError] = useState<string>('');
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [detectedIssuer, setDetectedIssuer] = useState<string | null>(null);
  const [cardGroups, setCardGroups] = useState<CardGroup[]>([
    { value: '', focused: false }, { value: '', focused: false }, { value: '', focused: false }, { value: '', focused: false }
  ]);
  const [mobileGroups, setMobileGroups] = useState<string[]>(['', '', '', '', '']);

  const mobileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cardInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleMobileNumberChange = (index: number, value: string) => {
    const newValue = value.replace(/\D/g, '').slice(0, 2);
    const newMobileGroups = [...mobileGroups];
    newMobileGroups[index] = newValue;
    setMobileGroups(newMobileGroups);

    const finalMobileNumber = newMobileGroups.join('');
    setFormData(prev => ({ ...prev, mobileNumber: finalMobileNumber }));

    if (newValue.length === 2 && index < 4 && mobileInputRefs.current[index + 1]) {
      mobileInputRefs.current[index + 1]?.focus();
    } else if (newValue.length === 0 && index > 0 && mobileInputRefs.current[index - 1]) {
       mobileInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCardGroupChange = (index: number, value: string) => {
    const newValue = value.replace(/\D/g, '').slice(0, 4);
    const newGroups = [...cardGroups];
    newGroups[index].value = newValue;
    setCardGroups(newGroups);

    const fullCardNumber = newGroups.map(g => g.value).join('');
    setFormData(prev => ({ ...prev, cardNumber: fullCardNumber }));

    if (fullCardNumber.length === 0) {
      setCardInfo(null); setCardError(''); setFormData(prev => ({ ...prev, bank: '' }));
      setDetectedIssuer(null); setShowManualSelection(false);
    } else if (fullCardNumber.length >= 6) {
      validateCardNumber(fullCardNumber);
    }

    if (newValue.length === 4 && index < 3 && cardInputRefs.current[index + 1]) {
      cardInputRefs.current[index + 1]?.focus();
    } else if (newValue.length === 0 && index > 0 && cardInputRefs.current[index - 1]) {
       cardInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCardGroupFocus = (index: number, focused: boolean) => {
    const newGroups = cardGroups.map((g, i) => ({ ...g, focused: i === index && focused }));
    setCardGroups(newGroups);
  };

  const handleMobileGroupFocus = (index: number, focused: boolean) => {
     const input = mobileInputRefs.current[index];
     if (input) {
       if (focused) {
         input.classList.add('border-indigo-500', 'ring-2', 'ring-indigo-200');
       } else {
         input.classList.remove('border-indigo-500', 'ring-2', 'ring-indigo-200');
       }
     }
  };

  const handleBankSelection = (bankId: string) => {
    setFormData(prev => ({ ...prev, bank: bankId }));
    setShowManualSelection(false);
    setErrors(prev => ({ ...prev, cardNumber: undefined })); // Clear potential bank error
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
    setCardInfo(null); setCardError(''); setShowManualSelection(false);
    setDetectedIssuer(null);
    setCardGroups([{ value: '', focused: false }, { value: '', focused: false }, { value: '', focused: false }, { value: '', focused: false }]);
    setMobileGroups(['', '', '', '', '']);
    mobileInputRefs.current[0]?.focus();
  };

  const validateCardNumber = async (cardNumber: string) => {
    try {
      const cardData = await validateCard(cardNumber);
      setCardInfo(cardData);
      setCardError('');
      setDetectedIssuer(cardData.Issuer);
      
      if (cardData.Type !== 'CREDIT') {
        setCardError('Only credit cards are accepted.');
        setShowManualSelection(false); setFormData(prev => ({ ...prev, bank: '' }));
      } else if (cardData.Country.A2 !== 'IN') {
        setCardError('Only Indian credit cards are accepted.');
        setShowManualSelection(false); setFormData(prev => ({ ...prev, bank: '' }));
      } else {
        const matchedBank = findBankByIssuer(cardData.Issuer);
        if (matchedBank) {
          setFormData(prev => ({ ...prev, bank: matchedBank.id }));
          setShowManualSelection(false);
        } else {
          setShowManualSelection(true);
          setFormData(prev => ({ ...prev, bank: '' }));
          setCardError(''); // Clear previous errors if now manual selection is needed
        }
      }
    } catch (error) {
      setCardError('Auto-detection failed. Please select issuer manually.');
      setCardInfo(null); setDetectedIssuer(null); setShowManualSelection(true);
      setFormData(prev => ({ ...prev, bank: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!formData.bank && cardInfo && !cardError) {
      setErrors(prev => ({ ...prev, cardNumber: 'Please select your card issuer.' }));
      setShowManualSelection(true);
      return;
    }

    if (cardError || !cardInfo) {
      setErrors(prev => ({ ...prev, cardNumber: cardError || 'Card validation required.' }));
      return;
    }

    setIsLoading(true);
    
    const selectedBank = BANKS.find(bank => bank.id === formData.bank);
    if (selectedBank && isMobile) {
      const upiId = generateUpiId(formData, selectedBank);
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(selectedBank.name)}&am=${formData.amount}&cu=INR`;
      window.location.href = upiUrl;
    }
    
    // Simulate processing time even if not redirecting
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setIsLoading(false);
    // Maybe show a success message here if not redirecting?
  };

  const selectedBank = BANKS.find(bank => bank.id === formData.bank);
  const upiId = selectedBank ? generateUpiId(formData, selectedBank) : '';
  const isCardComplete = formData.cardNumber.length === 16;
  const isMobileComplete = formData.mobileNumber.length === 10;
  const isAmountEntered = formData.amount && parseFloat(formData.amount) > 0;
  const isFormReadyForQR = isCardComplete && isMobileComplete && !cardError && cardInfo && formData.bank && isAmountEntered;

  const inputBaseClasses = "h-12 w-full text-center text-lg font-medium text-gray-700 rounded-lg border border-gray-300 focus:outline-none transition-all duration-200 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const inputErrorClasses = "border-red-500 ring-2 ring-red-200";
  const inputFocusClasses = "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

  return (
    <div className="min-h-screen pattern-background">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-gray-200/50"
        >
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">Credit Card Payment</h1>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetForm}
              className="text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              title="Reset Form"
            >
              <RefreshCw className="h-5 w-5" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mobile Number */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Smartphone className="mr-2 h-4 w-4 text-gray-500" />
                Mobile Number
              </label>
              <div className="grid grid-cols-5 gap-2">
                {mobileGroups.map((value, i) => (
                  <input
                    key={i}
                    ref={el => mobileInputRefs.current[i] = el}
                    type="tel" // Use tel for better mobile keyboard
                    inputMode="numeric" // Hint for numeric keyboard
                    maxLength={2}
                    value={value}
                    onChange={(e) => handleMobileNumberChange(i, e.target.value)}
                    onFocus={() => handleMobileGroupFocus(i, true)}
                    onBlur={() => handleMobileGroupFocus(i, false)}
                    className={`${inputBaseClasses} ${errors.mobileNumber ? inputErrorClasses : ''} ${inputFocusClasses}`}
                    placeholder="••"
                    aria-label={`Mobile number digits ${i * 2 + 1} and ${i * 2 + 2}`}
                  />
                ))}
              </div>
              <AnimatePresence>
                {errors.mobileNumber && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-1 text-xs text-red-600 flex items-center"
                  >
                     <AlertCircle className="inline-block mr-1 h-3 w-3" /> {errors.mobileNumber}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Card Number */}
            <div className="space-y-3">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                Card Number
              </label>
              <div className="grid grid-cols-4 gap-2 relative">
                 {cardInfo?.Scheme && !cardError && (
                   <motion.img
                     initial={{ opacity: 0, scale: 0.5 }}
                     animate={{ opacity: 1, scale: 1 }}
                     src={getCardSchemeIcon(cardInfo.Scheme)}
                     alt={cardInfo.Scheme}
                     className="h-5 absolute -top-1 right-0 transform translate-y-[-50%] z-10 bg-white p-0.5 rounded-sm shadow"
                     title={cardInfo.Scheme}
                   />
                 )}
                {cardGroups.map((group, index) => (
                  <input
                    key={index}
                    ref={el => cardInputRefs.current[index] = el}
                    type="tel" // Use tel for better mobile keyboard
                    inputMode="numeric" // Hint for numeric keyboard
                    maxLength={4}
                    value={group.value}
                    onChange={(e) => handleCardGroupChange(index, e.target.value)}
                    onFocus={() => handleCardGroupFocus(index, true)}
                    onBlur={() => handleCardGroupFocus(index, false)}
                    className={`${inputBaseClasses} ${
                      group.focused ? 'border-indigo-500 ring-2 ring-indigo-200' :
                      (errors.cardNumber || cardError) ? inputErrorClasses : ''
                    } ${inputFocusClasses}`}
                    placeholder="••••"
                    aria-label={`Card number digits group ${index + 1}`}
                  />
                ))}
              </div>

              {/* Card Info / Error / Manual Select Prompt */}
              <AnimatePresence mode="wait">
                {cardError ? (
                  <motion.div
                    key="card-error"
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="mt-2"
                  >
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="inline-block mr-1 h-3 w-3 flex-shrink-0" />
                      {cardError}
                    </p>
                  </motion.div>
                ) : cardInfo ? (
                  <motion.div
                    key="card-info"
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="space-y-2 mt-2"
                  >
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Card Type</span>
                        <span className="font-medium text-gray-800">{cardInfo.CardTier || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Detected Issuer</span>
                        <span className="font-medium text-gray-800">{detectedIssuer || 'N/A'}</span>
                      </div>
                      {selectedBank && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/80">
                          <span className="text-gray-600">Selected Bank</span>
                          <img src={selectedBank.logo} alt={selectedBank.name} className="h-5" />
                        </div>
                      )}
                    </div>
                    
                    {!showManualSelection && (
                      <button
                        type="button"
                        onClick={() => { setShowManualSelection(true); setFormData(prev => ({ ...prev, bank: '' })); }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                      >
                        Incorrect issuer? Select manually
                      </button>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Manual Bank Selection */}
              <AnimatePresence>
                {showManualSelection && cardInfo && !cardError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '0.75rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-hidden"
                  >
                    <h3 className="font-medium text-gray-900 mb-3 text-sm flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-gray-500"/>
                      Select Your Card Issuer
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {BANKS.map((bank) => (
                        <motion.button
                          key={bank.id}
                          type="button"
                          onClick={() => handleBankSelection(bank.id)}
                          className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center h-12 ${
                            formData.bank === bank.id
                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-100'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <img 
                            src={bank.logo} 
                            alt={bank.name}
                            className="max-h-6 object-contain"
                          />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
               <AnimatePresence>
                {errors.cardNumber && !cardError && ( // Show general card error only if no specific cardError exists
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-1 text-xs text-red-600 flex items-center"
                  >
                     <AlertCircle className="inline-block mr-1 h-3 w-3" /> {errors.cardNumber}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Amount */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <IndianRupee className="mr-2 h-4 w-4 text-gray-500" />
                Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  name="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className={`h-12 w-full pl-8 pr-4 text-lg font-medium text-gray-700 rounded-lg border ${errors.amount ? inputErrorClasses : 'border-gray-300'} ${inputFocusClasses} [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  aria-label="Payment amount in INR"
                />
              </div>
               <AnimatePresence>
                {errors.amount && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-1 text-xs text-red-600 flex items-center"
                  >
                     <AlertCircle className="inline-block mr-1 h-3 w-3" /> {errors.amount}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* QR Code Section */}
            <AnimatePresence>
              {isFormReadyForQR && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 sm:p-6 space-y-4 border border-indigo-100 overflow-hidden"
                >
                  <div className="flex items-center justify-center mb-3 text-center">
                    <QrCode className="h-5 w-5 text-indigo-700 mr-2" />
                    <h3 className="text-base sm:text-lg font-medium text-indigo-900">Scan QR Code to Pay</h3>
                  </div>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex justify-center bg-white p-3 rounded-lg shadow-md max-w-[220px] mx-auto" // Adjusted padding and max-width
                  >
                    <QRCode
                      value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(selectedBank?.name || 'Merchant')}&am=${formData.amount}&cu=INR`}
                      size={180} // Slightly smaller size
                      level="H"
                      includeMargin={true}
                      className="rounded-md" // Slightly less rounded
                      fgColor="#1e1b4b" // Dark indigo color for QR
                    />
                  </motion.div>
                  {formData.amount && (
                    <div className="flex items-center justify-center space-x-1.5 text-xl font-semibold text-indigo-900">
                      <IndianRupee className="h-5 w-5" />
                      <span>{parseFloat(formData.amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="text-center text-xs text-indigo-700/80">
                    <p>Scan with any UPI-enabled app</p>
                    <div className="flex justify-center items-center space-x-3 mt-2 opacity-80">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-5" />
                      {/* Add other app logos if desired */}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Pay Button */}
            {isFormReadyForQR && isMobile && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.2 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white h-12 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all duration-300"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <Smartphone2 className="h-5 w-5" />
                    <span>Pay via UPI App</span>
                  </>
                )}
              </motion.button>
            )}
          </form>
        </motion.div>
        <footer className="mt-8 text-center text-sm text-gray-600">
          <p>Crafted with <span className="text-red-500">💜</span> by Supratim</p>
        </footer>
      </div>
    </div>
  );
};

export default PaymentForm;
