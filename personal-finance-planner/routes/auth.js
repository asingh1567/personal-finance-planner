// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Register routes
router.get('/register', (req, res) => {
    res.render('register', { 
        title: 'Register',
        error: null,
        formData: {}
    });
});

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        
        if (existingUser) {
            return res.render('register', {
                title: 'Register',
                error: 'User already exists with this email or username',
                formData: req.body
            });
        }
        
        // Create new user
        const user = new User({
            username,
            email,
            password
        });
        
        await user.save();
        
        // ✅ Set session with userId
        req.session.userId = user._id; // ✅ IMPORTANT: Yeh line add karo
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };
        
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', {
            title: 'Register',
            error: 'Registration failed. Please try again.',
            formData: req.body
        });
    }
});

// Login routes
router.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login',
        error: null,
        formData: {}
    });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', {
                title: 'Login',
                error: 'Invalid email or password',
                formData: req.body
            });
        }
        
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.render('login', {
                title: 'Login',
                error: 'Invalid email or password',
                formData: req.body
            });
        }
        
        // ✅ Set session with userId
        req.session.userId = user._id; // ✅ IMPORTANT: Yeh line add karo
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };
        
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', {
            title: 'Login',
            error: 'Login failed. Please try again.',
            formData: req.body
        });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;