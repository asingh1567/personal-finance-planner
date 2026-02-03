// routes/ai.js
const express = require('express');
const router = express.Router();
const AIFinanceAdvisor = require('../services/AIAdvisor');

// AI Category Suggestion API
router.post('/suggest-category', (req, res) => {
    try {
        const { description, amount = 0 } = req.body;
        const aiAdvisor = new AIFinanceAdvisor();
        
        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'Description is required'
            });
        }

        const suggestedCategory = aiAdvisor.categorizeTransaction(description, amount);
        
        res.json({
            success: true,
            description: description,
            suggestedCategory: suggestedCategory,
            message: `AI categorized as: ${suggestedCategory}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// AI Budget Recommendations API
router.get('/budget-suggestions/:income', (req, res) => {
    try {
        const income = parseInt(req.params.income);
        const aiAdvisor = new AIFinanceAdvisor();
        
        if (!income || income <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid income amount is required'
            });
        }

        const suggestions = aiAdvisor.suggestBudget(income);
        
        res.json({
            success: true,
            monthlyIncome: income,
            budgetSuggestions: suggestions,
            message: 'AI budget recommendations generated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// AI Spending Analysis API
router.post('/analyze-spending', (req, res) => {
    try {
        const { transactions } = req.body;
        const aiAdvisor = new AIFinanceAdvisor();
        
        if (!transactions || !Array.isArray(transactions)) {
            return res.status(400).json({
                success: false,
                error: 'Transactions array is required'
            });
        }

        const analysis = aiAdvisor.analyzeSpending(transactions);
        
        res.json({
            success: true,
            analysis: analysis,
            message: 'Spending analysis completed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// AI Goal Planning API
router.post('/goal-plan', (req, res) => {
    try {
        const { targetAmount, currentSavings, timelineMonths, monthlyIncome } = req.body;
        const aiAdvisor = new AIFinanceAdvisor();
        
        const plan = aiAdvisor.calculateGoalPlan(
            parseInt(targetAmount),
            parseInt(currentSavings),
            parseInt(timelineMonths),
            parseInt(monthlyIncome)
        );
        
        res.json({
            success: true,
            goalPlan: plan,
            message: 'AI goal plan generated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;