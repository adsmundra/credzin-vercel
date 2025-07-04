const mongoose = require("mongoose");

const rewardPointSchema = new mongoose.Schema({
    value: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        required: true,
        trim: true,
        // e.g., 'points', 'miles', 'cashback'
    }
}, { _id: false });

const userTransactionCalculatedRewardSchema = new mongoose.Schema({
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserTransaction',
        required: true,
        index: true,
    },
    rewardCalculatorId: {
        type: String, // Identifier for the calculation logic used
        required: true,
    },
    reward: {
        type: rewardPointSchema,
        required: true,
    }
}, {
    timestamps: true,
});

userTransactionCalculatedRewardSchema.index({ transactionId: 1, rewardCalculatorId: 1 });

module.exports = mongoose.model("UserTransactionCalculatedReward", userTransactionCalculatedRewardSchema); 