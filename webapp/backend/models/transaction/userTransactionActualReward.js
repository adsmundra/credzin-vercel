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

const userTransactionActualRewardSchema = new mongoose.Schema({
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserTransaction',
        required: true,
        index: true,
    },
    reward: {
        type: rewardPointSchema,
        required: true,
    }
}, {
    timestamps: true,
});

userTransactionActualRewardSchema.index({ transactionId: 1 });

module.exports = mongoose.model("UserTransactionActualReward", userTransactionActualRewardSchema); 