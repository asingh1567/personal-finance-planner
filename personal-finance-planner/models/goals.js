// models/Goal.js
const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 1
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    deadline: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: ['emergency', 'vacation', 'vehicle', 'home', 'education', 'investment', 'wedding', 'gadgets', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

// Calculate progress before saving
// goalSchema.pre('save', function(next) {
//     this.progress = this.targetAmount > 0 ? 
//         Math.min(Math.round((this.currentAmount / this.targetAmount) * 100), 100) : 0;
    
//     // Auto-complete if progress is 100% or more
//     if (this.progress >= 100 && this.status === 'active') {
//         this.status = 'completed';
//     }
//     next();
// });

module.exports = mongoose.model('Goal', goalSchema);