const UserTransaction = require('../models/transaction/userTransaction');
const UserTransactionActualReward = require('../models/transaction/userTransactionActualReward');
const UserTransactionCalculatedReward = require('../models/transaction/userTransactionCalculatedReward');
const Category = require('../models/transaction/category');
const User = require('../models/User');
const Card = require('../models/card');
const UserCard = require('../models/user_Card');

// Helper to find or create a category by name
async function getOrCreateCategory(name) {
  if (!name) return null;
  let cat = await Category.findOne({ name });
  if (!cat) cat = await Category.create({ name });
  return cat;
}
// Helper to find or create a merchant by name (if you have a Merchant model)
let Merchant;
try { Merchant = require('../models/merchant'); } catch { Merchant = null; }
async function getOrCreateMerchant(name) {
  if (!name || !Merchant) return null;
  let m = await Merchant.findOne({ name });
  if (!m) m = await Merchant.create({ name });
  return m;
}
// Helper to find an active user card by generic card and user
async function getUserCard(userId, genericCardId) {
  if (!userId || !genericCardId) return null;
  return await UserCard.findOne({ 
    user_id: userId, 
    generic_card_id: genericCardId,
    user_card_status: 'ACTIVE'
  });
}
// Helper to find a user by email
async function getUserByEmail(email) {
  if (!email) return null;
  return await User.findOne({ email });
}

// Save a new user transaction (names/emails allowed)
exports.saveTransaction = async (req, res) => {
  try {
    let { userEmail, cardName, merchantName, categoryName, dateTime, amount, metadata } = req.body;
    let userId = req.id;
    if (userEmail) {
      const user = await getUserByEmail(userEmail);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      userId = user._id;
    }
    let user_card_id = null;
    if (cardName) {
      // Find the generic card first
      const card = await Card.findOne({ card_name: cardName });
      if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
      // Now find the user's card
      const userCard = await getUserCard(userId, card._id);
      if (!userCard) return res.status(404).json({ success: false, message: 'User card not found' });
      user_card_id = userCard._id;
    }
    let merchantId = null;
    if (merchantName && Merchant) {
      const merchant = await getOrCreateMerchant(merchantName);
      merchantId = merchant?._id;
    }
    let categoryId = null;
    if (categoryName) {
      const category = await getOrCreateCategory(categoryName);
      categoryId = category?._id;
    }
    // Create transaction
    const transaction = await UserTransaction.create({
      userId,
      user_card_id,
      dateTime,
      amount,
      merchantId: merchantId || null,
      categoryId: categoryId || null,
      metadata: metadata || {},
    });
    return res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error('Error saving transaction:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Save actual reward for a transaction
exports.saveActualReward = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reward } = req.body;
    if (!reward) return res.status(400).json({ success: false, message: 'Missing reward' });
    const actualRewardDoc = await UserTransactionActualReward.create({
      transactionId,
      reward,
    });
    return res.status(201).json({ success: true, actualReward: actualRewardDoc });
  } catch (error) {
    console.error('Error saving actual reward:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Save calculated reward for a transaction
exports.saveCalculatedReward = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { rewardCalculatorId, reward } = req.body;
    if (!rewardCalculatorId || !reward) return res.status(400).json({ success: false, message: 'Missing rewardCalculatorId or reward' });
    const calculatedRewardDoc = await UserTransactionCalculatedReward.create({
      transactionId,
      rewardCalculatorId,
      reward,
    });
    return res.status(201).json({ success: true, calculatedReward: calculatedRewardDoc });
  } catch (error) {
    console.error('Error saving calculated reward:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch all transactions for the authenticated user
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.id;
    const transactions = await UserTransaction.find({ userId })
      .sort({ dateTime: -1 })
      .populate('categoryId', 'name description')
      .populate('user_card_id')
      .lean();

    // Fetch rewards for each transaction
    const transactionIds = transactions.map(t => t._id);
    const actualRewards = await UserTransactionActualReward.find({ transactionId: { $in: transactionIds } }).lean();
    const calculatedRewards = await UserTransactionCalculatedReward.find({ transactionId: { $in: transactionIds } }).lean();

    // Map rewards to transactions
    const actualRewardMap = {};
    actualRewards.forEach(rw => { actualRewardMap[rw.transactionId] = rw; });
    const calculatedRewardMap = {};
    calculatedRewards.forEach(rw => {
      if (!calculatedRewardMap[rw.transactionId]) calculatedRewardMap[rw.transactionId] = [];
      calculatedRewardMap[rw.transactionId].push(rw);
    });

    // Attach rewards to transactions
    const result = transactions.map(tx => ({
      ...tx,
      actualReward: actualRewardMap[tx._id] || null,
      calculatedRewards: calculatedRewardMap[tx._id] || [],
    }));

    return res.status(200).json({ success: true, transactions: result });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}; 