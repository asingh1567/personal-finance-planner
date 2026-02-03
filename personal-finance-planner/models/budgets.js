// models/budgets.js - PERMANENT FIX
const mongoose = require('mongoose');

// ✅ CORRECT: Define each category as a nested schema
const categorySchema = new mongoose.Schema({
    planned: {
        type: Number,
        default: 0,
        min: 0
    },
    spent: {
        type: Number,
        default: 0,
        min: 0
    },
    color: {
        type: String,
        default: "#666666"
    },
    icon: {
        type: String,
        default: "💰"
    }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    // ✅ CORRECT: Each category uses the categorySchema
    categories: {
        food: { type: categorySchema, default: () => ({ 
            planned: 0, spent: 0, color: "#FF6B6B", icon: "🍕" 
        })},
        transport: { type: categorySchema, default: () => ({ 
            planned: 0, spent: 0, color: "#4ECDC4", icon: "🚗" 
        })},
        entertainment: { type: categorySchema, default: () => ({ 
            planned: 0, spent: 0, color: "#FFD93D", icon: "🎬" 
        })},
        education: { type: categorySchema, default: () => ({ 
            planned: 0, spent: 0, color: "#45B7D1", icon: "📚" 
        })},
        shopping: { type: categorySchema, default: () => ({ 
            planned: 0, spent: 0, color: "#6BCF7F", icon: "🛍️" 
        })},
        bills: { type: categorySchema, default: () => ({ 
            planned: 0, spent: 0, color: "#C44569", icon: "📄" 
        })},
        healthcare: { type: categorySchema, default: () => ({ 
            planned: 0, spent: 0, color: "#A78BFA", icon: "🏥" 
        })},
        savings: { type: categorySchema, default: () => ({ 
            planned: 0, spent: 0, color: "#98D8AA", icon: "💰" 
        })}
    },
    totalBudget: {
        type: Number,
        default: 0
    },
    totalPlanned: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    monthlyIncome: {
        type: Number,
        default: 0
    },
    budgetName: {
        type: String,
        default: "Monthly Budget"
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Pre-save hook for calculations
budgetSchema.pre('save', function(next) {
    this.totalPlanned = Object.values(this.categories).reduce(
        (total, category) => total + (category.planned || 0), 0
    );
    
    this.totalSpent = Object.values(this.categories).reduce(
        (total, category) => total + (category.spent || 0), 0
    );
    
    this.totalBudget = this.totalPlanned;
    next();
});

module.exports = mongoose.model('Budget', budgetSchema);