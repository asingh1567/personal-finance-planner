// routes/budgets.js
const express = require('express');
const router = express.Router();
const Budget = require('../models/budgets');
const Transaction = require('../models/transactions'); // ✅ ADD THIS
const mongoose = require('mongoose'); // ✅ ADD THIS

// ✅ UPDATE SPENT AMOUNTS FROM TRANSACTIONS
router.get('/update-spent', async (req, res) => {
    try {
        const userId = req.session.userId;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        console.log('🔄 Updating spent amounts for user:', userId);

        // ✅ Get current budget
        const budget = await Budget.findOne({
            userId: userId,
            month: currentMonth,
            year: currentYear
        });

        if (!budget) {
            return res.json({
                success: false,
                message: 'No budget found for current month'
            });
        }

        // ✅ Get expenses for current month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const expenses = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    type: 'expense',
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalSpent: { $sum: '$amount' }
                }
            }
        ]);

        console.log('📊 Found expenses:', expenses);

        // ✅ Reset all spent amounts to 0 first
        Object.keys(budget.categories).forEach(category => {
            budget.categories[category].spent = 0;
        });

        // ✅ Update spent amounts from transactions
        let totalSpent = 0;
        expenses.forEach(expense => {
            if (budget.categories[expense._id]) {
                budget.categories[expense._id].spent = expense.totalSpent;
                totalSpent += expense.totalSpent;
                console.log(`✅ Updated ${expense._id}: ₹${expense.totalSpent}`);
            }
        });

        // ✅ Update total spent
        budget.totalSpent = totalSpent;
        await budget.save();

        console.log('✅ Spent amounts updated successfully. Total spent:', totalSpent);

        res.json({
            success: true,
            message: 'Spent amounts updated successfully!',
            updatedBudget: budget,
            expensesFound: expenses
        });

    } catch (error) {
        console.error('❌ Error updating spent amounts:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ✅ CREATE BUDGET ROUTE - PROPER ASYNC FUNCTION
router.post('/create', async (req, res) => {
    try {
        const { monthlyIncome, month, year, categories } = req.body;
        const userId = req.session.userId;

        console.log('✅ Received budget creation request:', { userId, month, year, categories });

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const currentDate = new Date();
        const budgetMonth = month || currentDate.getMonth() + 1;
        const budgetYear = year || currentDate.getFullYear();

        // ✅ Check existing budget
        const existingBudget = await Budget.findOne({
            userId: userId,
            month: budgetMonth,
            year: budgetYear
        });

        if (existingBudget) {
            return res.status(400).json({
                success: false,
                message: `Budget for ${budgetMonth}/${budgetYear} already exists`
            });
        }

        // ✅ Create budget with converted categories
        const budgetData = {
            userId: userId,
            month: budgetMonth,
            year: budgetYear,
            monthlyIncome: monthlyIncome || 0,
            categories: categories
        };

        const budget = await Budget.create(budgetData);

        console.log('✅ Budget created successfully:', budget._id);

        res.json({
            success: true,
            message: '✅ Budget successfully created!',
            budget: budget
        });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ✅ GET CURRENT BUDGET WITH AUTO SPENT UPDATE
router.get('/current', async (req, res) => {
    try {
        const userId = req.session.userId;
        const currentDate = new Date();
        
        const budget = await Budget.findOne({
            userId: userId,
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
        });

        if (!budget) {
            return res.json({
                success: true,
                message: 'No budget found',
                budget: null
            });
        }

        // ✅ AUTO UPDATE SPENT AMOUNTS
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const expenses = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    type: 'expense',
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalSpent: { $sum: '$amount' }
                }
            }
        ]);

        // Update spent amounts
        let totalSpent = 0;
        expenses.forEach(expense => {
            if (budget.categories[expense._id]) {
                budget.categories[expense._id].spent = expense.totalSpent;
                totalSpent += expense.totalSpent;
            }
        });

        budget.totalSpent = totalSpent;
        await budget.save();

        res.json({
            success: true,
            budget: budget
        });
    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching budget'
        });
    }
});

// ✅ GET BUDGET BY MONTH AND YEAR
router.get('/:month/:year', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { month, year } = req.params;

        const budget = await Budget.findOne({
            userId: userId,
            month: parseInt(month),
            year: parseInt(year)
        });

        if (!budget) {
            return res.json({
                success: true,
                message: 'No budget found',
                budget: null
            });
        }

        res.json({
            success: true,
            budget: budget
        });
    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching budget'
        });
    }
});

// ✅ UPDATE BUDGET
router.put('/update', async (req, res) => {
    try {
        const { month, year, categories } = req.body;
        const userId = req.session.userId;

        const budget = await Budget.findOne({
            userId: userId,
            month: month,
            year: year
        });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }

        // Update categories
        budget.categories = categories;
        await budget.save();

        res.json({
            success: true,
            message: 'Budget updated successfully',
            budget: budget
        });
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ✅ TEST ROUTE
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Budgets API is working!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;