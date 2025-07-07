const mongoose = require('mongoose');

const gmailMessageSchema = new mongoose.Schema({
    user_email: {
        type: String,
        required: true,
        index: true
    },
    message_id: {
        type: String,
        required: true,
        unique: true
    },
    thread_id: {
        type: String,
        required: true
    },
    subject: String,
    from: String,
    to: String,
    snippet: String,
    body: String,
    received_at: Date,
    labels: [String],
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GmailMessage', gmailMessageSchema); 