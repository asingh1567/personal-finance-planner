// services/budgetsService.js
const Budget = require('../models/budgets'); // ✅ models/budget.js refer कर रहा है

class BudgetService {
    // Create smart budget based on income
    static async createSmartBudget(userId, monthlyIncome, month, year) {
        try {
            // 50/30/20 Rule Implementation
            const needs = monthlyIncome * 0.50;
            const wants = monthlyIncome * 0.30;
            const savings = monthlyIncome * 0.20;

            const budgetData = {
                userId: userId,
                month: month,
                year: year,
                monthlyIncome: monthlyIncome,
                categories: {
                    food: { 
                        planned: Math.round(needs * 0.30),
                        spent: 0,
                        color: "#FF6B6B",
                        icon: "🍕"
                    },
                    transport: { 
                        planned: Math.round(needs * 0.20),
                        spent: 0,
                        color: "#4ECDC4",
                        icon: "🚗"
                    },
                    bills: { 
                        planned: Math.round(needs * 0.30),
                        spent: 0,
                        color: "#C44569",
                        icon: "📄"
                    },
                    healthcare: { 
                        planned: Math.round(needs * 0.20),
                        spent: 0,
                        color: "#A78BFA",
                        icon: "🏥"
                    },
                    entertainment: { 
                        planned: Math.round(wants * 0.40),
                        spent: 0,
                        color: "#FFD93D",
                        icon: "🎬"
                    },
                    shopping: { 
                        planned: Math.round(wants * 0.40),
                        spent: 0,
                        color: "#6BCF7F",
                        icon: "🛍️"
                    },
                    education: { 
                        planned: Math.round(wants * 0.20),
                        spent: 0,
                        color: "#45B7D1",
                        icon: "📚"
                    },
                    savings: { 
                        planned: Math.round(savings),
                        spent: 0,
                        color: "#98D8AA",
                        icon: "💰"
                    }
                }
            };

            const budget = new Budget(budgetData);
            await budget.save();
            return budget;

        } catch (error) {
            throw new Error(`Budget creation failed: ${error.message}`);
        }
    }

    // Update budget when transaction is added
    static async updateBudgetOnTransaction(userId, transaction) {
        try {
            const currentDate = new Date();
            const budget = await Budget.findOne({
                userId: userId,
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear()
            });

            if (!budget) {
                console.log('No budget found for user:', userId);
                return null;
            }

            const category = transaction.category.toLowerCase();
            if (budget.categories[category]) {
                budget.categories[category].spent += transaction.amount;
                await budget.save();
                
                // Check for alerts
                await this.checkBudgetAlerts(userId, budget, category);
                
                console.log(`Budget updated: ${category} - Spent: ${budget.categories[category].spent}`);
            } else {
                console.log(`Category ${category} not found in budget`);
            }

            return budget;
        } catch (error) {
            console.error('Budget update error:', error);
            return null;
        }
    }

    // Check and send budget alerts
    static async checkBudgetAlerts(userId, budget, category) {
        const categoryData = budget.categories[category];
        
        // Avoid division by zero
        if (categoryData.planned === 0) return;
        
        const utilization = (categoryData.spent / categoryData.planned) * 100;

        if (utilization >= 100) {
            await this.sendAlert(userId, 
                `🚨 बजट exceeded! ${category} में आपने ₹${categoryData.spent} खर्च किया, बजट था ₹${categoryData.planned}`
            );
        } else if (utilization >= 80) {
            await this.sendAlert(userId,
                `⚠️ बजट warning! ${category} का ${Math.round(utilization)}% उपयोग हो चुका है`
            );
        }
    }

    static async sendAlert(userId, message) {
        console.log(`📢 Alert for User ${userId}: ${message}`);
        // Future: Save to database, send email, push notification
    }

    // Get budget progress
    static async getBudgetProgress(userId, month, year) {
        try {
            const budget = await Budget.findOne({ userId, month, year });
            if (!budget) {
                console.log('No budget found for progress check');
                return null;
            }

            const progress = {};
            Object.keys(budget.categories).forEach(category => {
                const cat = budget.categories[category];
                const utilization = cat.planned > 0 ? (cat.spent / cat.planned) * 100 : 0;
                
                progress[category] = {
                    planned: cat.planned,
                    spent: cat.spent,
                    remaining: cat.planned - cat.spent,
                    utilization: Math.round(utilization),
                    status: utilization >= 100 ? 'exceeded' : 
                           utilization >= 80 ? 'warning' : 'normal',
                    color: cat.color,
                    icon: cat.icon
                };
            });

            return {
                progress,
                summary: {
                    totalPlanned: budget.totalPlanned,
                    totalSpent: budget.totalSpent,
                    totalRemaining: budget.totalPlanned - budget.totalSpent,
                    monthlyIncome: budget.monthlyIncome,
                    savings: budget.monthlyIncome - budget.totalSpent
                }
            };
        } catch (error) {
            console.error('Budget progress error:', error);
            return null;
        }
    }

    // Get current month budget
    static async getCurrentBudget(userId) {
        try {
            const currentDate = new Date();
            return await Budget.findOne({
                userId: userId,
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear()
            });
        } catch (error) {
            console.error('Get current budget error:', error);
            return null;
        }
    }
}

module.exports = BudgetService;