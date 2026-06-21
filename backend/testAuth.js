const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

// Create interactive prompt
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const prompt = (question) => new Promise(resolve => rl.question(question, resolve));

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = await prompt('Enter email to test: ');
        const password = await prompt('Enter password to test: ');

        if (!email || !password) {
            console.error('❌ Email and password required');
            process.exit(1);
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('❌ TEST: User not found');
        } else {
            const isMatch = await user.matchPassword(password);
            if (isMatch) {
                console.log('✅ TEST: Password matches!');
                console.log(`📧 User: ${user.name} (${user.email})`);
                console.log(`🔐 Role: ${user.role}`);
            } else {
                console.log('❌ TEST: Password does not match');
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ TEST_ERROR:', err.message);
        process.exit(1);
    }
};

testLogin();
