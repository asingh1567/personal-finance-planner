// controllers/budgetController.js
const BudgetService = require('../services/budgetsService');

exports.createBudget = async (req, res) => {
    try {
        const { monthlyIncome, month, year } = req.body;
        const userId = req.session.userId;

        const budget = await BudgetService.createSmartBudget(
            userId, monthlyIncome, month, year
        );

        res.json({
            success: true,
            message: 'बजट सफलतापूर्वक बनाया गया',
            budget: budget
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getBudget = async (req, res) => {
    try {
        const { month, year } = req.params;
        const userId = req.session.userId;

        const progress = await BudgetService.getBudgetProgress(
            userId, parseInt(month), parseInt(year)
        );

        if (!progress) {
            return res.json({
                success: true,
                message: 'कोई बजट नहीं मिला',
                budget: null
            });
        }

        res.json({
            success: true,
            progress: progress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateBudgetCategory = async (req, res) => {
    try {
        const { category, amount } = req.body;
        const userId = req.session.userId;
        const currentDate = new Date();

        const budget = await Budget.findOne({
            userId: userId,
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
        });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'बजट नहीं मिला'
            });
        }

        if (budget.categories[category]) {
            budget.categories[category].planned = amount;
            await budget.save();

            res.json({
                success: true,
                message: 'बजट अपडेट हो गया',
                budget: budget
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};