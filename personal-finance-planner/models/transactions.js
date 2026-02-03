// // models/Transaction.js
// const mongoose = require('mongoose');

// const transactionSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     amount: {
//         type: Number,
//         required: true,
//         min: 0
//     },
//     description: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     type: {
//         type: String,
//         required: true,
//         enum: ['income', 'expense']
//     },
//     category: {
//         type: String,
//         required: true,
//         enum: ['food', 'transport', 'entertainment', 'education', 'shopping', 'bills', 'healthcare', 'savings', 'other'],
//         default: 'other'
//     },
//     date: {
//         type: Date,
//         default: Date.now
//     },
//     notes: {
//         type: String,
//         trim: true
//     }
// }, {
//     timestamps: true
// });

// // Index for better query performance
// transactionSchema.index({ userId: 1, date: -1 });
// transactionSchema.index({ userId: 1, category: 1 });
// transactionSchema.index({ userId: 1, type: 1 });

// module.exports = mongoose.model('Transaction', transactionSchema);

// models/transactions.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['food', 'transport', 'entertainment', 'education', 'shopping', 'bills', 'healthcare', 'savings', 'other', 'income']
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200
    },
    type: {
        type: String,
        required: true,
        enum: ['income', 'expense']
    },
    date: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'bank transfer'],
        default: 'cash'
    }
}, {
    timestamps: true
});

// Index for better performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1 });

// Virtual for formatted date
transactionSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('en-IN');
});

// Instance method to check if transaction is recent
transactionSchema.methods.isRecent = function() {
    const oneDay = 24 * 60 * 60 * 1000;
    return (new Date() - this.date) < oneDay;
};

module.exports = mongoose.model('Transaction', transactionSchema);