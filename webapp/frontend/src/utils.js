export const BANKS = [
  {
    id: 'axis',
    name: 'Axis Bank',
    officialName: 'Axis Bank Limited',
    upiFormat: 'CC.91[mobile][last4]@axisbank',
    issuerPattern: /AXIS|AXIS BANK LIMITED/i,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Axis_Bank_logo.svg/512px-Axis_Bank_logo.svg.png',
    cardTypes: ['VISA', 'MASTERCARD', 'RUPAY']
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    officialName: 'ICICI Bank Limited',
    upiFormat: 'ccpay.[card]@icici',
    issuerPattern: /ICICI|ICICI BANK LIMITED/i,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/512px-ICICI_Bank_Logo.svg.png',
    cardTypes: ['VISA', 'MASTERCARD', 'RUPAY']
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    officialName: 'SBI Cards & Payment Services Limited',
    upiFormat: 'Sbicard.[card]@SBI',
    issuerPattern: /STATE BANK|SBI CARDS|SBI PAYMENT/i,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/SBI_Card_logo.svg/330px-SBI_Card_logo.svg.png',
    cardTypes: ['VISA', 'MASTERCARD', 'RUPAY']
  },
  {
    id: 'idfc',
    name: 'IDFC Bank',
    officialName: 'IDFC FIRST Bank Limited',
    upiFormat: '[card].cc@idfcbank',
    issuerPattern: /IDFC|IDFC FIRST/i,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/IDFC_First_Bank_logo.jpg',
    cardTypes: ['VISA', 'MASTERCARD', 'RUPAY']
  },
  {
    id: 'aubank',
    name: 'AU Bank',
    officialName: 'AU Small Finance Bank Limited',
    upiFormat: 'AUCC[mobile][last4]@AUBANK',
    issuerPattern: /AU SMALL|AU BANK|AU FINANCE/i,
    logo: 'https://www.odishaage.com/wp-content/uploads/2021/08/AU-SFB-Logo.png',
    cardTypes: ['VISA', 'MASTERCARD', 'RUPAY']
  },
  {
    id: 'amex',
    name: 'American Express',
    officialName: 'American Express Banking Corp.',
    upiFormat: 'AEBC[card]@SC',
    issuerPattern: /AMERICAN EXPRESS|AMEX|AEBC/i,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/512px-American_Express_logo_%282018%29.svg.png',
    cardTypes: ['AMEX']
  }
];

export const validateForm = (data) => {
  const errors = {};

  if (!/^\d{10}$/.test(data.mobileNumber)) {
    errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
  }

  const cleanCard = data.cardNumber.replace(/\D/g, '');
  if (!/^\d{15,16}$/.test(cleanCard)) {
    errors.cardNumber = 'Please enter a valid 16-digit card number';
  }

  if (!data.bank) {
    errors.bank = 'Please select a bank';
  }

  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.amount = 'Please enter a valid amount';
  }

  return errors;
};

export const generateUpiId = (data, bank) => {
  const cleanCardNumber = data.cardNumber.replace(/\D/g, '');
  const last4 = cleanCardNumber.slice(-4);

  return bank.upiFormat
    .replace('[mobile]', data.mobileNumber)
    .replace('[card]', cleanCardNumber)
    .replace('[last4]', last4);
};

export const formatCardNumber = (value) => {
  const v = value.replace(/\D/g, '').slice(0, 16);
  if (v.length <= 4) return v;
  if (v.length <= 8) return `${v.slice(0, 4)} ${v.slice(4)}`;
  if (v.length <= 12) return `${v.slice(0, 4)} ${v.slice(4, 8)} ${v.slice(8)}`;
  return `${v.slice(0, 4)} ${v.slice(4, 8)} ${v.slice(8, 12)} ${v.slice(12)}`;
};

export const validateCard = async (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const bin = cleanNumber.slice(0, 6);

  const response = await fetch(`https://data.handyapi.com/bin/${bin}`, {
    headers: { 'x-api-key': 'PUB-0YZskYqn4Pc52N7X9S8037GLxy4' }
  });

  if (!response.ok) {
    throw new Error('Failed to validate card');
  }

  return response.json();
};

export const findBankByIssuer = (issuer) => {
  return BANKS.find((bank) => bank.issuerPattern.test(issuer));
};

export const getCardSchemeIcon = (scheme) => {
  const icons = {
    VISA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/512px-Visa_Inc._logo.svg.png',
    MASTERCARD: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/512px-Mastercard-logo.svg.png',
    AMEX: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/512px-American_Express_logo_%282018%29.svg.png',
    RUPAY: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/RuPay.svg/2560px-RuPay.svg.png'
  };

  return icons[scheme] || '';
};
