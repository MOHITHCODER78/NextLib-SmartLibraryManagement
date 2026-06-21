const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// SECURITY: Only students can register. Admin accounts are created ONLY via makeAdmin.js script
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // SECURITY: Detect and log admin registration attempts
        if (role && role.toLowerCase() === 'admin') {
            console.warn('⚠️  SECURITY ALERT: Admin registration attempt detected');
            console.warn('   Email:', email);
            console.warn('   Role requested:', role);
            console.warn('   Timestamp:', new Date().toISOString());
        }

        // Create user with hardcoded student role (ignore any role from client)
        const user = await User.create({
            name,
            email,
            password,
            role: 'student'  // ALWAYS student - cannot be overridden by client
        });

        console.log('✅ Student registered:', email);
        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        console.log('LOGIN_ATTEMPT:', email, 'FOUND:', !!user);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        console.log('PASSWORD_MATCH:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
};
