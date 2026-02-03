// app.js

const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const Budget = require('./models/budgets'); // ✅ budgets.js (small case)
const User = require('./models/user');     // ✅ user.js (small case)
const Goal = require('./models/goals'); // ✅ Goal model import
const Transaction = require('./models/transactions');

// ✅ ✅ ✅ IMPORT BUDGETS ROUTES ✅ ✅ ✅
const budgetRoutes = require('./routes/budgets');

const app = express();

// Global variables for views
app.locals.title = 'Finance Planner';
app.locals.brandName = 'Finance Planner';

// ✅ MongoDB Connection
mongoose.connect('mongodb://localhost:27017/finance_tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ✅ AI SERVICE
const AIFinanceAdvisor = require('./services/AIAdvisor');

// ✅ View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Session Middleware
app.use(session({
    secret: 'finance-tracker-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// ✅ ✅ ✅ USE BUDGETS ROUTES ✅ ✅ ✅
app.use('/api/budgets', budgetRoutes);

// ✅ ✅ ✅ AUTHENTICATION MIDDLEWARE ✅ ✅ ✅
app.use((req, res, next) => {
    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/register', '/test-ai', '/test-ai2'];
    
    if (publicRoutes.includes(req.path)) {
        return next();
    }
    
    // Check if user is authenticated
    if (!req.session.userId) {
        console.log('🔒 Redirecting to login - User not authenticated');
        return res.redirect('/login');
    }
    
    console.log('✅ User authenticated:', req.session.userId);
    next();
});

// ✅ AI Middleware (after session)
app.use((req, res, next) => {
    res.locals.ai = new AIFinanceAdvisor();
    next();
});

// ✅ ✅ ✅ IMPORT AUTH ROUTES ✅ ✅ ✅
const authRoutes = require('./routes/auth');

// ✅ ✅ ✅ USE AUTH ROUTES ✅ ✅ ✅
app.use(authRoutes);

// ✅ Root Route - Landing Page
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Finance Planner - Plan Your Financial Future',
        user: null
    });
});

// ✅ Dashboard Route - UPDATED WITH USER-SPECIFIC DATA
app.get('/dashboard', async (req, res) => {
    try {
        // ✅ Fetch transactions for LOGGED-IN USER only
        const transactions = await Transaction.find({ userId: req.session.userId });

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

        // ✅ Get recent transactions for CURRENT USER only
        const recentTransactions = await Transaction.find({ userId: req.session.userId }).sort({ date: -1 }).limit(5);
        const formattedRecentTransactions = recentTransactions.map(transaction => ({
            description: transaction.description,
            category: transaction.category,
            amount: transaction.amount,
            type: transaction.type,
            date: transaction.date
        }));

        const categoryTotals = {};
        transactions.forEach(t => {
            if (t.type === 'expense') {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            }
        });

        const topCategory = Object.keys(categoryTotals).length > 0 
            ? Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b)
            : "No data";

        const aiInsights = {
            totalAnalyzed: totalIncome + totalExpense,
            topCategory: topCategory,
            recommendations: generateRecommendations(transactions, totalIncome, totalExpense)
        };

        // ✅ Use SESSION USER instead of hardcoded user
        res.render('dashboard', {
            title: 'Financial Dashboard',
            user: req.session.user,
            totalIncome, totalExpense, balance, savingsRate,
            aiInsights,
            hasBudget: false,
            hasTransactions: transactions.length > 0,
            recentTransactions: formattedRecentTransactions
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('dashboard', {
            title: 'Financial Dashboard',
            user: req.session.user,
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            savingsRate: 0,
            aiInsights: { totalAnalyzed: 0, topCategory: "No data", recommendations: ["Add transactions to see insights"] },
            hasBudget: false,
            hasTransactions: false,
            recentTransactions: []
        });
    }
});

// ✅ Helper function for AI Recommendations
function generateRecommendations(transactions, totalIncome, totalExpense) {
    const recommendations = [];
    if (transactions.length === 0) return ["Add more transactions to get personalized recommendations"];
    if (totalExpense > totalIncome * 0.8) recommendations.push("Your expenses are high compared to income - consider budgeting");
    if (totalIncome > 0 && totalExpense / totalIncome < 0.5) recommendations.push("Great savings rate! Consider investment options");

    const foodExpenses = transactions.filter(t => t.type === 'expense' && t.category === 'food').reduce((sum, t) => sum + t.amount, 0);
    if (foodExpenses > totalIncome * 0.3) recommendations.push("Food expenses seem high - consider meal planning");

    return recommendations.length > 0 ? recommendations : ["You're doing great! Keep tracking your finances"];
}

// ✅ Forecast Route
app.get('/forecast', (req, res) => {
    try {
        const forecastData = {
            monthlyProjections: [
                { month: 'Nov 2025', income: 10000, expense: 7900, savings: 2100 },
                { month: 'Dec 2025', income: 10000, expense: 8000, savings: 2000 },
                { month: 'Jan 2026', income: 11000, expense: 8500, savings: 2500 },
                { month: 'Feb 2026', income: 11000, expense: 8200, savings: 2800 },
                { month: 'Mar 2026', income: 12000, expense: 9000, savings: 3000 },
                { month: 'Apr 2026', income: 12000, expense: 8800, savings: 3200 }
            ],
            totalSavings: 15600,
            averageMonthlySavings: 2600,
            recommendations: [
                "Maintain current savings rate of 21%",
                "Consider increasing income sources", 
                "Education expenses optimization needed"
            ]
        };

        res.render('forecast', {
            title: '6-Month Financial Forecast',
            user: req.session.user,
            forecast: forecastData
        });
    } catch (error) {
        res.status(500).send('Error loading forecast: ' + error.message);
    }
});

// ✅ Add Income Page
app.get('/add-income', (req, res) => {
    res.render('add-transaction', {
        title: 'Add Income - Finance Planner',
        user: req.session.user,
        type: 'income',
        categories: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other']
    });
});

// ✅ Add Expense Page
app.get('/add-expense', (req, res) => {
    res.render('add-transaction', {
        title: 'Add Expense - Finance Planner', 
        user: req.session.user,
        type: 'expense',
        categories: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other']
    });
});

// ✅ Add Transaction (POST)
app.post('/transactions/add', async (req, res) => {
    try {
        const { type, category, amount, description, date } = req.body;
        if (!type || !category || !amount || !date) {
            return res.status(400).send(`<script>alert('❌ Please fill all fields!'); window.location.href='/add-${type||'income'}';</script>`);
        }

        const descriptionMap = {
            'Salary': 'Monthly Salary', 'Freelance': 'Freelance Work Payment', 'Business': 'Business Income',
            'Investment': 'Investment Returns', 'Gift': 'Gift Received', 'Food': 'Food & Groceries',
            'Transport': 'Transportation Expenses', 'Entertainment': 'Entertainment', 'Shopping': 'Shopping',
            'Bills': 'Utility Bills', 'Healthcare': 'Medical Expenses', 'Education': 'Education Expenses', 'Other': 'Miscellaneous'
        };

        const categoryMap = {
            'Salary': 'income', 'Freelance': 'income', 'Business': 'income', 'Investment': 'income', 'Gift': 'income',
            'Other': 'other', 'Food': 'food', 'Transport': 'transport', 'Entertainment': 'entertainment',
            'Shopping': 'shopping', 'Bills': 'bills', 'Healthcare': 'healthcare', 'Education': 'education'
        };

        const mappedCategory = categoryMap[category] || 'other';
        const transactionDescription = description || descriptionMap[category] || `${category} ${type === 'income' ? 'Income' : 'Expense'}`;

        const newTransaction = new Transaction({
            userId: req.session.userId,
            amount: parseFloat(amount),
            category: mappedCategory,
            description: transactionDescription,
            type: type,
            date: new Date(date),
            paymentMethod: 'cash'
        });

        await newTransaction.save();
        console.log('✅ Transaction saved for user:', req.session.userId);

        res.send(`<script>alert('✅ ${type === 'income' ? 'Income' : 'Expense'} added!'); window.location.href='/transactions';</script>`);

    } catch (error) {
        console.error('❌ Error saving transaction:', error);
        res.status(500).send(`<script>alert('Error: ${error.message}'); window.location.href='/add-${req.body.type||'income'}';</script>`);
    }
});

// ✅ TRANSACTIONS LIST (WITH FILTERS)
app.get('/transactions', async (req, res) => {
    try {
        const { type, category, month } = req.query;
        let filter = { userId: req.session.userId }; // ✅ User-specific filter
        
        if (type && type !== 'all') filter.type = type;

        const categoryReverseMap = {
            'Other Income': 'income', 'Food': 'food', 'Transport': 'transport',
            'Entertainment': 'entertainment', 'Shopping': 'shopping', 'Bills': 'bills',
            'Healthcare': 'healthcare', 'Education': 'education', 'Other': 'other'
        };
        if (category && category !== 'all') filter.category = categoryReverseMap[category] || category.toLowerCase();

        // Date filter
        if (month && month !== 'all') {
            const now = new Date(); let startDate, endDate;
            if (month === 'current') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); endDate = new Date(now.getFullYear(), now.getMonth()+1,0);}
            if (month === 'last') { startDate = new Date(now.getFullYear(), now.getMonth()-1, 1); endDate = new Date(now.getFullYear(), now.getMonth(),0);}
            if (month === 'last3') { startDate = new Date(now.getFullYear(), now.getMonth()-3, 1); endDate = new Date(now.getFullYear(), now.getMonth()+1,0);}
            if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
        }

        const transactions = await Transaction.find(filter).sort({ date: -1 }).limit(50);
        const categoryDisplayMap = {
            'income': 'Other Income', 'food': 'Food', 'transport': 'Transport',
            'entertainment': 'Entertainment', 'shopping': 'Shopping', 'bills': 'Bills',
            'healthcare': 'Healthcare', 'education': 'Education', 'other': 'Other'
        };

        const formattedTransactions = transactions.map(t => ({
            id: t._id,
            date: t.date,
            description: t.description,
            category: categoryDisplayMap[t.category] || t.category,
            amount: t.amount,
            type: t.type
        }));

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s,t)=>s+t.amount,0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount,0);
        const netBalance = totalIncome - totalExpenses;

        // Get available categories for current user
        const allUserTransactions = await Transaction.find({ userId: req.session.userId });
        const availableCategories = [...new Set(allUserTransactions.map(t => {
            return categoryDisplayMap[t.category] || t.category;
        }))];

        res.render('transactions', {
            title: 'Transaction History',
            user: req.session.user,
            transactions: formattedTransactions,
            totalIncome, totalExpenses, netBalance,
            currentFilters: { type: type||'all', category: category||'all', month: month||'all' },
            availableCategories: availableCategories
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.render('transactions', { 
            title: 'Transaction History',
            user: req.session.user,
            transactions: [], 
            totalIncome: 0, 
            totalExpenses: 0, 
            netBalance: 0,
            currentFilters: { type: 'all', category: 'all', month: 'all' },
            availableCategories: []
        });
    }
});

// ✅ EDIT TRANSACTION - GET (Edit Form)
app.get('/transactions/edit/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).send('Transaction not found');

        const categoryReverseMap = {
            'income':'Other Income','food':'Food','transport':'Transport','entertainment':'Entertainment',
            'shopping':'Shopping','bills':'Bills','healthcare':'Healthcare','education':'Education','other':'Other'
        };

        const displayCategory = categoryReverseMap[transaction.category] || transaction.category;

        res.render('edit-transaction', {
            title: 'Edit Transaction',
            user: req.session.user,
            transaction: { ...transaction._doc, displayCategory },
            categories: transaction.type === 'income' 
                ? ['Salary','Freelance','Business','Investment','Gift','Other']
                : ['Food','Transport','Entertainment','Shopping','Bills','Healthcare','Education','Other']
        });
    } catch (error) {
        console.error('Error loading edit form:', error);
        res.status(500).send('Error loading edit form');
    }
});

// ✅ EDIT TRANSACTION - POST (Update)
app.post('/transactions/edit/:id', async (req, res) => {
    try {
        const { type, category, amount, description, date } = req.body;
        if (!type || !category || !amount || !date) return res.status(400).send('All fields required');

        const categoryMap = {
            'Salary':'income','Freelance':'income','Business':'income','Investment':'income','Gift':'income',
            'Other':'other','Food':'food','Transport':'transport','Entertainment':'entertainment',
            'Shopping':'shopping','Bills':'bills','Healthcare':'healthcare','Education':'education'
        };
        const mappedCategory = categoryMap[category] || 'other';

        let transactionDescription = description || {
            'Salary':'Monthly Salary','Freelance':'Freelance Work Payment','Business':'Business Income',
            'Investment':'Investment Returns','Gift':'Gift Received','Food':'Food & Groceries',
            'Transport':'Transportation Expenses','Entertainment':'Entertainment','Shopping':'Shopping',
            'Bills':'Utility Bills','Healthcare':'Medical Expenses','Education':'Education Expenses','Other':'Miscellaneous'
        }[category] || `${category} ${type==='income'?'Income':'Expense'}`;

        const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, {
            type, category: mappedCategory, amount: parseFloat(amount), description: transactionDescription, date: new Date(date)
        }, { new: true });

        console.log('✅ Transaction updated:', updatedTransaction);
        res.send(`<script>alert('✅ Transaction updated successfully!'); window.location.href='/transactions';</script>`);

    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).send(`<script>alert('❌ Error updating: ${error.message}'); window.location.href='/transactions';</script>`);
    }
});

// ✅ DELETE TRANSACTION
app.delete('/transactions/delete/:id', async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!deletedTransaction) return res.status(404).json({ success:false, message:'Transaction not found' });
        console.log('🗑️ Transaction deleted:', deletedTransaction._id);
        res.json({ success:true, message:'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success:false, message:'Error deleting transaction' });
    }
});

// ✅ BUDGETS OVERVIEW PAGE
app.get('/budgets', async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // ✅ Get current budget
        const currentBudget = await Budget.findOne({
            userId: req.session.userId,
            month: currentMonth,
            year: currentYear
        });

        // ✅ Add month name to current budget
        let currentBudgetWithName = null;
        if (currentBudget) {
            currentBudgetWithName = {
                ...currentBudget._doc,
                monthName: getMonthName(currentBudget.month)
            };
        }

        // ✅ Calculate budget statistics
        const totalBudget = currentBudget ? currentBudget.totalPlanned : 0;
        const totalSpent = currentBudget ? currentBudget.totalSpent : 0;
        const remaining = totalBudget - totalSpent;
        const utilization = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;

        // ✅ Prepare category-wise budget data
        const budgets = currentBudget ? Object.entries(currentBudget.categories).map(([key, category]) => ({
            category: formatCategoryName(key),
            budget: category.planned,
            spent: category.spent,
            remaining: category.planned - category.spent,
            status: category.spent <= category.planned ? 'On Track' : 'Over Budget'
        })) : [];

        res.render('budgets', {
            title: 'Budget Management',
            user: req.session.user,
            currentBudget: currentBudgetWithName,
            totalBudget: totalBudget,
            totalSpent: totalSpent,
            remaining: remaining,
            budgets: budgets,
            utilization: utilization.toFixed(1)
        });

    } catch (error) {
        console.error('Error loading budgets page:', error);
        res.render('budgets', {
            title: 'Budget Management',
            user: req.session.user,
            currentBudget: null,
            totalBudget: 0,
            totalSpent: 0,
            remaining: 0,
            budgets: [],
            utilization: 0
        });
    }
});

// ✅ Set Budget Page
app.get('/budgets/set', async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
        const currentYear = currentDate.getFullYear();
        const currentMonthNumber = currentDate.getMonth() + 1;

        // ✅ Get existing budget for current month
        const existingBudget = await Budget.findOne({
            userId: req.session.userId,
            month: currentMonthNumber,
            year: currentYear
        });

        // ✅ Get recent budgets (last 3 months)
        const recentBudgets = await Budget.find({
            userId: req.session.userId
        })
        .sort({ year: -1, month: -1 })
        .limit(3);

        // ✅ Get user's monthly income from transactions for AI recommendations
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const monthlyIncome = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.session.userId),
                    type: 'income',
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$amount' }
                }
            }
        ]);

        const averageIncome = monthlyIncome.length > 0 ? monthlyIncome[0].totalIncome : 10000;

        // ✅ AI Budget Recommendations
        const aiRecommendations = {
            food: Math.round(averageIncome * 0.15),
            transport: Math.round(averageIncome * 0.10),
            entertainment: Math.round(averageIncome * 0.08),
            education: Math.round(averageIncome * 0.12),
            shopping: Math.round(averageIncome * 0.10),
            bills: Math.round(averageIncome * 0.15),
            healthcare: Math.round(averageIncome * 0.05),
            savings: Math.round(averageIncome * 0.25)
        };

        res.render('set-budget', {
            title: 'Set Budget',
            user: req.session.user,
            monthlyIncome: averageIncome,
            existingBudget: existingBudget,
            recentBudgets: recentBudgets,
            aiRecommendations: aiRecommendations,
            currentMonth: currentMonth,
            currentYear: currentYear,
            currentMonthNumber: currentMonthNumber,
            getMonthName: function(monthNumber) {
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
                return months[monthNumber - 1];
            }
        });

    } catch (error) {
        console.error('Error loading budget page:', error);
        res.render('set-budget', {
            title: 'Set Budget',
            user: req.session.user,
            monthlyIncome: 10000,
            existingBudget: null,
            recentBudgets: [],
            aiRecommendations: {},
            currentMonth: new Date().toLocaleString('en-US', { month: 'long' }),
            currentYear: new Date().getFullYear(),
            currentMonthNumber: new Date().getMonth() + 1,
            getMonthName: function(monthNumber) {
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
                return months[monthNumber - 1];
            }
        });
    }
});

// ✅ Handle Budget Form Submission
app.post('/budgets/set', async (req, res) => {
    try {
        const {
            month, year, foodBudget, transportBudget, entertainmentBudget,
            educationBudget, shoppingBudget, billsBudget, healthcareBudget,
            savingsBudget
        } = req.body;

        // ✅ Validate required fields
        if (!month || !year) {
            return res.status(400).send(`
                <script>
                    alert('❌ Please select month and year!');
                    window.location.href = '/budgets/set';
                </script>
            `);
        }

        // ✅ Prepare categories data
        const categories = {
            food: parseFloat(foodBudget) || 0,
            transport: parseFloat(transportBudget) || 0,
            entertainment: parseFloat(entertainmentBudget) || 0,
            education: parseFloat(educationBudget) || 0,
            shopping: parseFloat(shoppingBudget) || 0,
            bills: parseFloat(billsBudget) || 0,
            healthcare: parseFloat(healthcareBudget) || 0,
            savings: parseFloat(savingsBudget) || 0
        };

        // ✅ Calculate total budget
        const totalBudget = Object.values(categories).reduce((sum, amount) => sum + amount, 0);

        // ✅ Check if budget already exists for this month/year
        const existingBudget = await Budget.findOne({
            userId: req.session.userId,
            month: month,
            year: parseInt(year)
        });

        let savedBudget;

        if (existingBudget) {
            // ✅ Update existing budget
            savedBudget = await Budget.findByIdAndUpdate(
                existingBudget._id,
                {
                    categories: categories,
                    totalBudget: totalBudget
                },
                { new: true }
            );
            console.log('✅ Budget updated:', savedBudget._id);
        } else {
            // ✅ Create new budget
            savedBudget = new Budget({
                userId: req.session.userId,
                month: month,
                year: parseInt(year),
                categories: categories,
                totalBudget: totalBudget
            });
            await savedBudget.save();
            console.log('✅ New budget created:', savedBudget._id);
        }

        console.log('📝 Budget saved for user:', {
            userId: req.session.userId,
            month: month,
            year: year,
            totalBudget: totalBudget
        });

        // ✅ Success response - NOW REDIRECTING TO VALID ROUTE
        res.send(`
            <script>
                alert('✅ Budget successfully ${existingBudget ? 'updated' : 'created'}!\\\\n\\\\nMonth: ${month} ${year}\\\\nTotal Budget: ₹${totalBudget.toLocaleString()}');
                window.location.href = '/budgets'; // ✅ NOW THIS ROUTE EXISTS
            </script>
        `);

    } catch (error) {
        console.error('❌ Error saving budget:', error);
        res.status(500).send(`
            <script>
                alert('❌ Error saving budget: ${error.message}');
                window.location.href = '/budgets/set';
            </script>
        `);
    }
});

// ✅ GOALS PAGE - WITH REAL DATA
// ✅ CREATE GOAL - FORM PAGE
app.get('/goals/create', (req, res) => {
    res.render('create-goals', {
        title: 'Create New Goal',
        user: req.session.user
    });
});

// ✅ CREATE GOAL - SUBMISSION (SAVE TO DATABASE)
app.post('/goals/create', async (req, res) => {
    try {
        const { goalName, description, targetAmount, deadline, category } = req.body;

        // ✅ Validation
        if (!goalName || !targetAmount || !deadline) {
            return res.status(400).send(`
                <script>
                    alert('❌ Goal name, target amount, and deadline are required!');
                    window.history.back();
                </script>
            `);
        }

        const target = parseFloat(targetAmount);
        if (isNaN(target) || target <= 0) {
            return res.status(400).send(`
                <script>
                    alert('❌ Target amount must be a valid positive number!');
                    window.history.back();
                </script>
            `);
        }

        // ✅ Date validation
        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            return res.status(400).send(`
                <script>
                    alert('❌ Deadline must be a future date!');
                    window.history.back();
                </script>
            `);
        }

        // ✅ Create new goal in database
        const newGoal = new Goal({
            userId: req.session.userId,
            name: goalName.trim(),
            description: description?.trim(),
            targetAmount: target,
            currentAmount: 0,
            deadline: deadlineDate,
            category: category || 'other',
            status: 'active'
        });

        await newGoal.save();

        console.log('🎯 New Goal Created:', { 
            userId: req.session.userId,
            goalId: newGoal._id,
            name: goalName,
            targetAmount: target
        });

        res.send(`
            <script>
                alert('🎯 Goal "${goalName}" successfully created!\\\\n\\\\nTarget: ₹${target.toLocaleString()}\\\\nDeadline: ${deadlineDate.toLocaleDateString()}');
                window.location.href = '/goals';
            </script>
        `);

    } catch (error) {
        console.error('❌ Error creating goal:', error);
        res.status(500).send(`
            <script>
                alert('❌ Error creating goal: ${error.message}');
                window.history.back();
            </script>
        `);
    }
});

// ✅ GOALS PAGE - WITH REAL DATA FROM DATABASE
// ✅ UPDATED GOALS ROUTE - PROPER DATABASE QUERY
app.get('/goals', async (req, res) => {
    try {
        console.log('🔍 Fetching goals for user:', req.session.userId);
        
        // ✅ Get ALL goals from database for current user
        const goals = await Goal.find({ 
            userId: req.session.userId
        }).sort({ createdAt: -1 });

        console.log('📋 Goals found:', goals.length);
        console.log('🎯 Goals data:', goals.map(g => ({ name: g.name, target: g.targetAmount })));

        // ✅ Calculate totals
        const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
        const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
        const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

        // ✅ Helper functions
        const getCategoryIcon = (category) => {
            const icons = {
                'emergency': '🛡️',
                'vacation': '🏖️', 
                'vehicle': '🚗',
                'home': '🏠',
                'education': '🎓',
                'investment': '📈',
                'wedding': '💍',
                'gadgets': '📱',
                'other': '📦'
            };
            return icons[category] || '🎯';
        };

        const getCategoryName = (category) => {
            const names = {
                'emergency': 'Emergency',
                'vacation': 'Vacation',
                'vehicle': 'Vehicle', 
                'home': 'Home',
                'education': 'Education',
                'investment': 'Investment',
                'wedding': 'Wedding',
                'gadgets': 'Gadgets',
                'other': 'Other'
            };
            return names[category] || 'Goal';
        };

        const getDaysLeft = (deadline) => {
            const today = new Date();
            const deadlineDate = new Date(deadline);
            const diffTime = deadlineDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(0, diffDays);
        };

        const getProgressColor = (progress) => {
            if (progress >= 100) return 'success';
            if (progress >= 70) return 'info';
            if (progress >= 40) return 'warning';
            return 'danger';
        };

        res.render('goals', {
            title: 'Financial Goals',
            user: req.session.user,
            goals: goals,
            totalSaved: totalSaved,
            totalTarget: totalTarget,
            overallProgress: overallProgress,
            getCategoryIcon,
            getCategoryName,
            getDaysLeft,
            getProgressColor
        });

    } catch (error) {
        console.error('❌ Error loading goals:', error);
        res.render('goals', {
            title: 'Financial Goals',
            user: req.session.user,
            goals: [],
            totalSaved: 0,
            totalTarget: 0,
            overallProgress: 0,
            error: 'Unable to load goals data: ' + error.message
        });
    }
});


// ✅ UPDATE GOAL PROGRESS
app.post('/goals/:id/update-progress', async (req, res) => {
    try {
        const { amount } = req.body;
        const goalId = req.params.id;

        const addAmount = parseFloat(amount);
        if (isNaN(addAmount) || addAmount < 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid positive amount' 
            });
        }

        const goal = await Goal.findOne({ 
            _id: goalId, 
            userId: req.session.userId 
        });

        if (!goal) {
            return res.status(404).json({ 
                success: false, 
                message: 'Goal not found' 
            });
        }

        // Update current amount
        goal.currentAmount += addAmount;
        await goal.save();

        res.json({ 
            success: true, 
            message: `Successfully added ₹${addAmount} to your goal!`,
            currentAmount: goal.currentAmount,
            progress: goal.progress
        });

    } catch (error) {
        console.error('Error updating goal progress:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating goal progress' 
        });
    }
});

// ✅ DELETE GOAL
// ✅ ADD DELETE GOAL ROUTE (अगर नहीं है तो)
app.post('/goals/:id/delete', async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = await Goal.findOneAndDelete({ 
            _id: goalId, 
            userId: req.session.userId 
        });

        if (!goal) {
            return res.status(404).send(`
                <script>
                    alert('❌ Goal not found!');
                    window.location.href = '/goals';
                </script>
            `);
        }

        res.send(`
            <script>
                alert('✅ Goal "${goal.name}" successfully deleted!');
                window.location.href = '/goals';
            </script>
        `);

    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).send(`
            <script>
                alert('❌ Error deleting goal: ${error.message}');
                window.location.href = '/goals';
            </script>
        `);
    }
});
// ✅ EXISTING GOALS PAGE (ENHANCED)
app.get('/goals', async (req, res) => {
    try {
        // Calculate current savings from transactions
        const savingsTransactions = await Transaction.find({
            userId: req.session.userId,
            category: 'savings', 
            type: 'expense' // Savings are tracked as expenses to goals
        });

        const currentSavings = savingsTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Sample goals data - later replace with Goals model
        const goalsData = {
            goals: [
                { 
                    id: 1, 
                    name: 'Emergency Fund', 
                    target: 50000, 
                    current: currentSavings,
                    deadline: '2026-04-01',
                    progress: Math.min(Math.round((currentSavings / 50000) * 100), 100),
                    description: '3 months of living expenses'
                },
                { 
                    id: 2, 
                    name: 'Vacation', 
                    target: 30000, 
                    current: 5000, 
                    deadline: '2026-06-01',
                    progress: Math.min(Math.round((5000 / 30000) * 100), 100),
                    description: 'Trip to Goa'
                }
            ],
            totalSaved: currentSavings,
            totalTarget: 80000
        };

        res.render('goals', {
            title: 'Financial Goals',
            user: req.session.user,
            ...goalsData
        });
    } catch (error) {
        console.error('Error loading goals:', error);
        res.render('goals', {
            title: 'Financial Goals',
            user: req.session.user,
            goals: [],
            totalSaved: 0,
            totalTarget: 0,
            error: 'Unable to load goals data'
        });
    }
});
// ✅ AI Test Route - Single
app.get('/test-ai', (req, res) => {
    try {
        const aiAdvisor = new AIFinanceAdvisor();
        const result = aiAdvisor.categorizeTransaction("Domino's Pizza", 400);

        res.json({
            success: true,
            test: "Domino's Pizza",
            category: result,
            message: '🎯 AI Categorization Working!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ✅ AI Test Route - Multiple
app.get('/test-ai2', (req, res) => {
    try {
        const aiAdvisor = new AIFinanceAdvisor();
        const tests = [
            { description: "Domino's Pizza", amount: 400 },
            { description: "Uber ride", amount: 250 },
            { description: "Netflix subscription", amount: 649 },
            { description: "Amazon shopping", amount: 1500 },
            { description: "Medicine", amount: 800 },
            { description: "Flight tickets", amount: 5000 }
        ];

        const results = tests.map(test => ({
            description: test.description,
            amount: test.amount,
            category: aiAdvisor.categorizeTransaction(test.description, test.amount)
        }));

        res.json({
            success: true,
            tests: results,
            message: '🧪 Multiple AI Tests Completed!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ✅ DEBUG: CHECK ALL GOALS IN DATABASE
app.get('/debug-goals', async (req, res) => {
    try {
        console.log('🔍 Debug: Checking goals for user:', req.session.userId);
        
        const goals = await Goal.find({ userId: req.session.userId });
        
        console.log('📋 All goals in database:', goals.length);
        goals.forEach(goal => {
            console.log('🎯 Goal:', {
                id: goal._id,
                name: goal.name,
                target: goal.targetAmount,
                current: goal.currentAmount,
                deadline: goal.deadline,
                category: goal.category
            });
        });

        res.json({
            success: true,
            totalGoals: goals.length,
            goals: goals.map(g => ({
                id: g._id,
                name: g.name,
                targetAmount: g.targetAmount,
                currentAmount: g.currentAmount,
                deadline: g.deadline,
                category: g.category,
                status: g.status,
                createdAt: g.createdAt
            }))
        });
    } catch (error) {
        console.error('❌ Debug error:', error);
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ✅ HELPER FUNCTIONS
function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1];
}

function formatCategoryName(category) {
    const categoryMap = {
        food: 'Food & Dining',
        transport: 'Transportation', 
        entertainment: 'Entertainment',
        education: 'Education',
        shopping: 'Shopping',
        bills: 'Bills & Utilities',
        healthcare: 'Healthcare',
        savings: 'Savings'
    };
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

// ✅ 404 Fallback Route (YEH WALA EXISTING ROUTE KE BAAD)
app.use((req, res) => {
    res.status(404).render('404', { 
        title: 'Page Not Found', 
        user: req.session.user || null 
    });
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
    console.log(`🔐 Login: http://localhost:${PORT}/login`);
    console.log(`📝 Register: http://localhost:${PORT}/register`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`💰 Add Income: http://localhost:${PORT}/add-income`);
    console.log(`💸 Add Expense: http://localhost:${PORT}/add-expense`);
    console.log(`📋 Transactions: http://localhost:${PORT}/transactions`);
    console.log(`📊 Budgets: http://localhost:${PORT}/budgets`);
    console.log(`🎯 Goals: http://localhost:${PORT}/goals`);
    console.log(`✅ Finance Tracker Backend Ready!`);
});