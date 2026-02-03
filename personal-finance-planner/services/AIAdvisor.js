// services/AIAdvisor.js
class AIFinanceAdvisor {
    constructor() {
        this.rules = {
            budgetAllocation: {
                essentials: 0.5,    // 50%
                goals: 0.2,         // 20%
                lifestyle: 0.3      // 30%
            },
            emergencyFund: {
                targetMonths: 6
            }
        };
    }

    // AI Method 1: Smart Transaction Categorization
    categorizeTransaction(description, amount) {
        const categories = {
            food: ['pizza', 'domino', 'restaurant', 'food', 'grocery', 'swiggy', 'zomato', 'mcdonald', 'burger', 'cafe'],
            transport: ['uber', 'ola', 'petrol', 'metro', 'bus', 'train', 'auto', 'taxi', 'fuel', 'parking'],
            education: ['course', 'book', 'education', 'school', 'college', 'tuition', 'university', 'learning'],
            entertainment: ['movie', 'netflix', 'game', 'party', 'concert', 'cinema', 'amazon prime', 'hotstar'],
            shopping: ['mall', 'shopping', 'amazon', 'flipkart', 'myntra', 'ajio', 'clothes', 'electronics'],
            healthcare: ['hospital', 'medicine', 'doctor', 'medical', 'pharmacy', 'apollo', 'checkup'],
            bills: ['electricity', 'water', 'internet', 'mobile', 'broadband', 'utility'],
            travel: ['flight', 'hotel', 'travel', 'vacation', 'trip', 'booking'],
            investment: ['mutual fund', 'stock', 'investment', 'sip', 'equity'],
            salary: ['salary', 'payroll', 'income', 'payment received']
        };

        const desc = description.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => desc.includes(keyword))) {
                return category;
            }
        }
        return 'other';
    }

    // AI Method 2: Intelligent Budget Recommendations
    suggestBudget(monthlyIncome) {
        return {
            food: Math.round(monthlyIncome * 0.15),           // 15%
            transport: Math.round(monthlyIncome * 0.10),      // 10%
            entertainment: Math.round(monthlyIncome * 0.08),  // 8%
            education: Math.round(monthlyIncome * 0.12),      // 12%
            healthcare: Math.round(monthlyIncome * 0.05),     // 5%
            shopping: Math.round(monthlyIncome * 0.10),       // 10%
            bills: Math.round(monthlyIncome * 0.10),          // 10%
            savings: Math.round(monthlyIncome * 0.20),        // 20%
            other: Math.round(monthlyIncome * 0.10)           // 10%
        };
    }

    // AI Method 3: Spending Pattern Analysis
    analyzeSpending(transactions) {
        const analysis = {
            totalSpent: 0,
            totalIncome: 0,
            categoryBreakdown: {},
            highestSpending: { category: '', amount: 0 },
            monthlyTrend: this.calculateMonthlyTrend(transactions),
            insights: []
        };

        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                analysis.totalSpent += transaction.amount;
                
                // Category analysis
                if (!analysis.categoryBreakdown[transaction.category]) {
                    analysis.categoryBreakdown[transaction.category] = 0;
                }
                analysis.categoryBreakdown[transaction.category] += transaction.amount;
                
                // Find highest spending category
                if (analysis.categoryBreakdown[transaction.category] > analysis.highestSpending.amount) {
                    analysis.highestSpending = {
                        category: transaction.category,
                        amount: analysis.categoryBreakdown[transaction.category]
                    };
                }
            } else if (transaction.type === 'income') {
                analysis.totalIncome += transaction.amount;
            }
        });

        // Generate AI Insights
        analysis.insights = this.generateInsights(analysis);
        
        return analysis;
    }

    // AI Method 4: Generate Smart Insights
    generateInsights(analysis) {
        const insights = [];
        const savingsRate = ((analysis.totalIncome - analysis.totalSpent) / analysis.totalIncome * 100);

        // Insight 1: Savings Rate
        if (savingsRate >= 20) {
            insights.push({
                type: 'positive',
                message: `Excellent savings rate of ${savingsRate.toFixed(1)}%!`,
                suggestion: 'Consider investing your surplus savings'
            });
        } else if (savingsRate >= 10) {
            insights.push({
                type: 'warning', 
                message: `Savings rate is ${savingsRate.toFixed(1)}% - can be improved`,
                suggestion: 'Try to reduce discretionary spending by 5%'
            });
        } else {
            insights.push({
                type: 'critical',
                message: `Low savings rate of ${savingsRate.toFixed(1)}%`,
                suggestion: 'Review essential expenses and create strict budget'
            });
        }

        // Insight 2: Highest Spending
        if (analysis.highestSpending.amount > analysis.totalIncome * 0.3) {
            insights.push({
                type: 'warning',
                message: `High spending on ${analysis.highestSpending.category} (${(analysis.highestSpending.amount/analysis.totalIncome*100).toFixed(1)}% of income)`,
                suggestion: `Set specific budget for ${analysis.highestSpending.category}`
            });
        }

        // Insight 3: Emergency Fund Check
        const monthlyExpenses = analysis.totalSpent;
        const emergencyFundTarget = monthlyExpenses * 6;
        insights.push({
            type: 'info',
            message: `Emergency fund target: ₹${emergencyFundTarget.toLocaleString()}`,
            suggestion: `Save ₹${Math.round(emergencyFundTarget/12)} monthly for 1 year`
        });

        return insights;
    }

    // AI Method 5: Goal Planning
    calculateGoalPlan(targetAmount, currentSavings, timelineMonths, monthlyIncome) {
        const monthlySavingsNeeded = (targetAmount - currentSavings) / timelineMonths;
        const feasibility = this.assessFeasibility(monthlySavingsNeeded, monthlyIncome);
        
        return {
            monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
            timeline: timelineMonths,
            feasibility: feasibility,
            suggestions: this.generateGoalSuggestions(monthlySavingsNeeded, monthlyIncome),
            achievementProbability: this.calculateProbability(monthlySavingsNeeded, monthlyIncome)
        };
    }

    assessFeasibility(monthlySavings, monthlyIncome) {
        const savingsRatio = monthlySavings / monthlyIncome;
        
        if (savingsRatio <= 0.2) return 'high';
        if (savingsRatio <= 0.4) return 'medium';
        return 'low';
    }

    generateGoalSuggestions(monthlySavings, monthlyIncome) {
        const suggestions = [];
        const savingsRatio = monthlySavings / monthlyIncome;
        
        if (savingsRatio > 0.4) {
            suggestions.push("Consider increasing income sources");
            suggestions.push("Review and reduce discretionary spending by 20%");
            suggestions.push("Extend timeline to make it more achievable");
        } else if (savingsRatio > 0.25) {
            suggestions.push("Optimize recurring expenses and subscriptions");
            suggestions.push("Look for better deals on regular purchases");
        } else {
            suggestions.push("You're on track! Maintain financial discipline");
            suggestions.push("Consider automating your savings");
        }
        
        return suggestions;
    }

    calculateProbability(monthlySavings, monthlyIncome) {
        const ratio = monthlySavings / monthlyIncome;
        if (ratio <= 0.2) return 90;
        if (ratio <= 0.3) return 75;
        if (ratio <= 0.4) return 50;
        return 25;
    }

    calculateMonthlyTrend(transactions) {
        // Simple trend calculation
        // In future, implement proper time-series analysis
        return {
            trend: 'stable',
            confidence: 0.8
        };
    }
}

module.exports = AIFinanceAdvisor;