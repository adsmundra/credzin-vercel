const mongoose = require('mongoose')
const { Schema } = mongoose;

const userCardSchema = new Schema({
    cardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'credit_cards',
        required: false,
    },
    card_name: {
        type: String,
    },
    dateTime: {
        type: Date,
        required: true,
    },
    amount: {
        value: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
    },
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: false,
    },
    merchant_name: {
        type: String,

    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    user_email: {
        type: String,

    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
    },
    category_name: {
        type: String,

    },
    metadata: {
        messageId: {
            type: String,
            required: true,
        },
        categorySource: {
            type: String,
            //   required: true,
            enum: ['gmail', 'sms', 'manual', 'api'],
        },
    },
    actualReward: {
        value: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            required: true,
            default: "points"
        },
    },
    calculatedRewards: [
        {
            actualRewardCalculatorId: {
                type: String,
                required: true,
            },
            reward: {
                value: {
                    type: Number,
                    required: true,
                },
                unit: {
                    type: String,
                    required: true,
                    default:'points',
                },
            },
        },
        {
            potentialRewardCalculatorId: {
                type: String,
                required: true,
            },
            reward: {
                value: {
                    type: Number,
                    required: true,
                },
                unit: {
                    type: String,
                    required: true,
                    default:'points',
                },
            },
        },

    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model('user_card', userCardSchema);
