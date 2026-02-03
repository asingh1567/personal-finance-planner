// controllers/transactionsController.js
const Transaction = require('../models/transactions');
const BudgetService = require('../services/budgetsService');

// Get all transactions for user
exports.getAllTransactions = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { page = 1, limit = 10, category, type, startDate, endDate } = req.query;

        const filter = { userId: userId };
        
        // Add filters if provided
        if (category && category !== 'all') filter.category = category;
        if (type && type !== 'all') filter.type = type;
        
        // Date filter
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const transactions = await Transaction.find(filter)
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean(); // For better performance

        const total = await Transaction.countDocuments(filter);

        res.json({
            success: true,
            transactions: transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalTransactions: total
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Transactions fetch करने में error आया'
        });
    }
};

// Add new transaction
exports.addTransaction = async (req, res) => {
    try {
        const { amount, category, description, type, date, paymentMethod } = req.body;
        const userId = req.session.userId;

        // Validation
        if (!amount || !category || !type) {
            return res.status(400).json({
                success: false,
                message: 'Amount, category और type required हैं'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount 0 से अधिक होना चाहिए'
            });
        }

        const transactionData = {
            userId: userId,
            amount: parseFloat(amount),
            category: category.toLowerCase(),
            description: description || '',
            type: type.toLowerCase(),
            date: date ? new Date(date) : new Date(),
            paymentMethod: paymentMethod || 'cash'
        };

        const transaction = new Transaction(transactionData);
        await transaction.save();

        // Update budget only for expense transactions
        if (type.toLowerCase() === 'expense') {
            await BudgetService.updateBudgetOnTransaction(userId, transaction);
        }

        res.json({
            success: true,
            message: "Transaction successfully added",
            transaction: transaction
        });

    } catch (error) {
        console.error('Add transaction error:', error);
        res.status(500).json({
            success: false,
            message: "Transaction add करने में error आया"
        });
    }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, category, description, type, date, paymentMethod } = req.body;
        const userId = req.session.userId;

        const transaction = await Transaction.findOne({ 
            _id: id, 
            userId: userId 
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Store old values for budget update
        const oldAmount = transaction.amount;
        const oldCategory = transaction.category;
        const oldType = transaction.type;

        // Update transaction
        transaction.amount = amount || transaction.amount;
        transaction.category = category ? category.toLowerCase() : transaction.category;
        transaction.description = description || transaction.description;
        transaction.type = type ? type.toLowerCase() : transaction.type;
        transaction.date = date ? new Date(date) : transaction.date;
        transaction.paymentMethod = paymentMethod || transaction.paymentMethod;

        await transaction.save();

        // Update budget if it's an expense transaction
        if (oldType === 'expense' || transaction.type === 'expense') {
            // Remove old transaction from budget
            if (oldType === 'expense') {
                const reverseTransaction = {
                    ...transaction.toObject(),
                    amount: -oldAmount, // Negative amount to reverse
                    category: oldCategory
                };
                await BudgetService.updateBudgetOnTransaction(userId, reverseTransaction);
            }

            // Add new transaction to budget
            if (transaction.type === 'expense') {
                await BudgetService.updateBudgetOnTransaction(userId, transaction);
            }
        }

        res.json({
            success: true,
            message: "Transaction updated successfully",
            transaction: transaction
        });

    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            success: false,
            message: "Transaction update करने में error आया"
        });
    }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        const transaction = await Transaction.findOne({ 
            _id: id, 
            userId: userId 
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Remove from budget if it was an expense
        if (transaction.type === 'expense') {
            const reverseTransaction = {
                ...transaction.toObject(),
                amount: -transaction.amount // Negative amount to reverse
            };
            await BudgetService.updateBudgetOnTransaction(userId, reverseTransaction);
        }

        await Transaction.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Transaction deleted successfully"
        });

    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({
            success: false,
            message: "Transaction delete करने में error आया"
        });
    }
};

// Get transaction statistics
exports.getTransactionStats = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { month, year } = req.query;

        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        // Get monthly totals
        const monthlyStats = await Transaction.aggregate([
            {
                $match: {
                    userId: userId,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get category-wise expenses
        const categoryStats = await Transaction.aggregate([
            {
                $match: {
                    userId: userId,
                    type: 'expense',
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        const income = monthlyStats.find(stat => stat._id === 'income')?.total || 0;
        const expense = monthlyStats.find(stat => stat._id === 'expense')?.total || 0;
        const savings = income - expense;

        res.json({
            success: true,
            stats: {
                income: income,
                expense: expense,
                savings: savings,
                savingsRate: income > 0 ? (savings / income) * 100 : 0,
                categoryBreakdown: categoryStats,
                totalTransactions: (monthlyStats.find(stat => stat._id === 'income')?.count || 0) + 
                                 (monthlyStats.find(stat => stat._id === 'expense')?.count || 0)
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Statistics fetch करने में error आया'
        });
    }
};

// Get recent transactions
exports.getRecentTransactions = async (req, res) => {
    try {
        const userId = req.session.userId;
        const limit = parseInt(req.query.limit) || 5;

        const transactions = await Transaction.find({ userId: userId })
            .sort({ date: -1, createdAt: -1 })
            .limit(limit)
            .lean();

        res.json({
            success: true,
            transactions: transactions
        });
    } catch (error) {
        console.error('Get recent transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Recent transactions fetch करने में error आया'
        });
    }
};

// Get transactions by category
exports.getTransactionsByCategory = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { category } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const transactions = await Transaction.find({ 
            userId: userId, 
            category: category 
        })
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

        const total = await Transaction.countDocuments({ 
            userId: userId, 
            category: category 
        });

        res.json({
            success: true,
            transactions: transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalTransactions: total
        });
    } catch (error) {
        console.error('Get transactions by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Category transactions fetch करने में error आया'
        });
    }
};

// Get monthly summary
exports.getMonthlySummary = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { months = 6 } = req.query;

        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    userId: userId,
                    date: { 
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth() - parseInt(months), 1)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    income: {
                        $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
                    },
                    expense: {
                        $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.json({
            success: true,
            monthlySummary: monthlyData
        });
    } catch (error) {
        console.error('Get monthly summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Monthly summary fetch करने में error आया'
        });
    }
};