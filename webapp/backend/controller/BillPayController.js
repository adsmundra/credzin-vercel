const { default: axios } = require('axios');
const BANKS = require('../data/banks');

exports.validateCards = async (req, res) => {
  const bin = req.query.bin;
  console.log('Bin', bin);

  if (!bin || bin.length < 6) {
    return res.status(400).json({ error: 'Invalid BIN provided' });
  }

  try {
    const response = await axios.get(`https://data.handyapi.com/bin/${bin}`, {
      headers: { 'x-api-key': 'PUB-0YZskYqn4Pc52N7X9S8037GLxy4' }, // 🔒 Keep this secure
    });
    res.json(response.data);
  } catch (error) {
    console.error('BIN validation error:', error.message);
    res.status(500).json({ error: 'Card validation failed' });
  }
};

exports.generateUPI = async (req, res) => {
  const { mobileNumber, cardNumber, bankId, amount } = req.body;

  if (!mobileNumber || !cardNumber || !bankId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cleanCardNumber = cardNumber.replace(/\D/g, '');
  const last4 = cleanCardNumber.slice(-4);

  const bank = BANKS.find((b) => b.id === bankId);
  if (!bank) {
    return res.status(400).json({ error: 'Invalid bank ID' });
  }

  const upiId = bank.upiFormat
    .replace('[mobile]', mobileNumber)
    .replace('[card]', cleanCardNumber)
    .replace('[last4]', last4);

  return res.status(200).json({ upiId });
};

exports.getSupportedBanks = (req, res) => {
  try {
    const banks = [
      {
        id: 'axis',
        name: 'Axis Bank',
        officialName: 'Axis Bank Limited',
        upiFormat: 'CC.91[mobile][last4]@axisbank',
        issuerPattern: /AXIS|AXIS BANK LIMITED/i,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Axis_Bank_logo.svg/512px-Axis_Bank_logo.svg.png',
        cardTypes: ['VISA', 'MASTERCARD', 'RUPAY'],
      },
      {
        id: 'icici',
        name: 'ICICI Bank',
        officialName: 'ICICI Bank Limited',
        upiFormat: 'ccpay.[mobile][last4]@icici',
        issuerPattern: /ICICI|ICICI BANK LIMITED/i,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/512px-ICICI_Bank_Logo.svg.png',
        cardTypes: ['VISA', 'MASTERCARD', 'RUPAY'],
      },
      {
        id: 'sbi',
        name: 'State Bank of India',
        officialName: 'SBI Cards & Payment Services Limited',
        upiFormat: 'Sbicard.[card]@SBI',
        issuerPattern: /STATE BANK|SBI CARDS|SBI PAYMENT/i,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/SBI_Card_logo.svg/330px-SBI_Card_logo.svg.png',
        cardTypes: ['VISA', 'MASTERCARD', 'RUPAY'],
      },
      //   // {
      //   //   id: "hdfc",
      //   //   name: "HDFC Bank",
      //   //   officialName: "HDFC Bank Limited",
      //   //   upiFormat: "[mobile]@hdfcbank",
      //   //   issuerPattern: /HDFC|HDFC BANK/i,
      //   //   logo: "https://static.cdnlogo.com/logos/h/91/hdfc-bank.svg",
      //   //   cardTypes: ["VISA", "MASTERCARD", "RUPAY"],
      //   // },
      //   // {
      //   //   id: "pnb",
      //   //   name: "PNB Bank",
      //   //   officialName: "Punjab National Bank",
      //   //   upiFormat: "[mobile]@pnb",
      //   //   issuerPattern: /PUNJAB NATIONAL BANK|PNB/i,
      //   //   logo: "https://static.cdnlogo.com/logos/p/79/punjab-national-bank.svg",
      //   //   cardTypes: ["VISA", "MASTERCARD", "RUPAY"],
      //   // },
      {
        id: 'idfc',
        name: 'IDFC Bank',
        officialName: 'IDFC FIRST Bank Limited',
        upiFormat: '[card].cc@idfcbank',
        issuerPattern: /IDFC|IDFC FIRST/i,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/IDFC_First_Bank_logo.jpg',
        cardTypes: ['VISA', 'MASTERCARD', 'RUPAY'],
      },
      {
        id: 'aubank',
        name: 'AU Bank',
        officialName: 'AU Small Finance Bank Limited',
        upiFormat: 'AUCC.[mobile][last4]@AUBANK',
        issuerPattern: /AU SMALL|AU BANK|AU FINANCE/i,
        logo: 'https://www.odishaage.com/wp-content/uploads/2021/08/AU-SFB-Logo.png',
        cardTypes: ['VISA', 'MASTERCARD', 'RUPAY'],
      },
      {
        id: 'amex',
        name: 'American Express',
        officialName: 'American Express Banking Corp.',
        upiFormat: 'AEBC[card]@SC',
        issuerPattern: /AMERICAN EXPRESS|AMEX|AEBC/i,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/512px-American_Express_logo_%282018%29.svg.png',
        cardTypes: ['AMEX'],
      },
    ];

    res.status(200).json({ success: true, banks });
  } catch (error) {
    console.error('Failed to fetch banks', error);
    res.status(500).json({ success: false, message: 'Failed to fetch banks' });
  }
};
