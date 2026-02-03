class AIService {
    constructor() {
        console.log('🤖 Smart Rule-Based AI Service Started');
    }

    async categorizeExpense(description) {
        try {
            console.log('🔍 AI Analyzing:', description);
            
            // Smart rule-based categorization
            const category = this.smartCategorize(description);
            
            console.log('🎯 AI Categorized:', description, '->', category);
            return category;
            
        } catch (error) {
            console.error('❌ AI Error:', error.message);
            return 'Other';
        }
    }

    smartCategorize(description) {
        const lowerDesc = description.toLowerCase();
        
        // Comprehensive categorization rules
        const rules = [
            // Food & Dining
            { keywords: ['pizza', 'burger', 'domino', 'mcdonald', 'kfc', 'food', 'restaurant', 'cafe', 'coffee', 'tea', 'meal', 'dinner', 'lunch', 'breakfast', 'groceries', 'vegetable', 'fruit', 'milk', 'bread'], category: 'Food' },
            
            // Transport
            { keywords: ['uber', 'ola', 'ride', 'taxi', 'transport', 'bus', 'train', 'metro', 'fuel', 'petrol', 'diesel', 'auto', 'cab', 'travel'], category: 'Transport' },
            
            // Entertainment
            { keywords: ['netflix', 'prime', 'hotstar', 'movie', 'cinema', 'theater', 'game', 'entertainment', 'music', 'spotify', 'youtube', 'streaming'], category: 'Entertainment' },
            
            // Shopping
            { keywords: ['amazon', 'flipkart', 'shopping', 'mall', 'store', 'market', 'buy', 'purchase', 'clothes', 'electronics', 'fashion'], category: 'Shopping' },
            
            // Healthcare
            { keywords: ['medicine', 'medical', 'hospital', 'doctor', 'pharmacy', 'health', 'healthcare', 'clinic', 'treatment', 'checkup'], category: 'Healthcare' },
            
            // Bills & Utilities
            { keywords: ['bill', 'electricity', 'water', 'gas', 'mobile', 'recharge', 'internet', 'wifi', 'broadband', 'utility'], category: 'Bills' },
            
            // Education
            { keywords: ['book', 'course', 'education', 'school', 'college', 'tuition', 'training', 'learning', 'study'], category: 'Education' },
            
            // Travel
            { keywords: ['flight', 'ticket', 'hotel', 'travel', 'vacation', 'trip', 'holiday', 'resort', 'booking'], category: 'Travel' }
        ];

        // Check each rule
        for (const rule of rules) {
            for (const keyword of rule.keywords) {
                if (lowerDesc.includes(keyword)) {
                    return rule.category;
                }
            }
        }

        // If no rule matches, use "Other"
        return 'Other';
    }

    async getSpendingInsights(transactions) {
        try {
            if (!transactions || transactions.length === 0) {
                return 'Add some transactions to get AI insights!';
            }

            const summary = transactions.reduce((acc, t) => {
                if (t.type === 'expense') {
                    acc.totalExpense += t.amount;
                    acc.categories[t.category] = (acc.categories[t.category] || 0) + t.amount;
                } else {
                    acc.totalIncome += t.amount;
                }
                return acc;
            }, { totalIncome: 0, totalExpense: 0, categories: {} });

            // Generate smart insights based on data
            let insights = this.generateInsights(summary);
            
            console.log('💡 AI Insights Generated:', insights);
            return insights;
            
        } catch (error) {
            console.error('AI Insights error:', error);
            return 'Add more transactions for better insights.';
        }
    }

    generateInsights(summary) {
        const { totalIncome, totalExpense, categories } = summary;
        const balance = totalIncome - totalExpense;
        
        let insights = [];
        
        // Balance insights
        if (balance < 0) {
            insights.push(`⚠️ You're spending ₹${Math.abs(balance).toLocaleString()} more than your income. Consider reducing expenses.`);
        } else if (balance > 0) {
            insights.push(`✅ Great! You're saving ₹${balance.toLocaleString()} this month.`);
        }
        
        // Category insights
        const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
        if (topCategory) {
            insights.push(`💰 Your highest spending is on ${topCategory[0]} (₹${topCategory[1].toLocaleString()}).`);
        }
        
        // Savings advice
        if (totalIncome > 0) {
            const savingsRate = (balance / totalIncome * 100).toFixed(1);
            if (savingsRate < 10) {
                insights.push(`💡 Try to save at least 10% of your income. Current savings rate: ${savingsRate}%`);
            }
        }
        
        return insights.length > 0 ? insights.join(' ') : 'Keep tracking your expenses for better insights!';
    }
}

module.exports = new AIService();