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

const createTempAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const name = await prompt('Enter admin name: ');
        const email = await prompt('Enter admin email: ');
        const password = await prompt('Enter admin password (min 6 chars): ');

        if (!email || !password || password.length < 6) {
            console.error('❌ Invalid input. Email and password required (min 6 chars).');
            process.exit(1);
        }

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            const overwrite = await prompt(`User ${email} already exists. Overwrite? (y/n): `);
            if (overwrite.toLowerCase() === 'y') {
                await User.deleteOne({ email });
            } else {
                console.log('Cancelled.');
                process.exit(0);
            }
        }

        const user = await User.create({
            name: name || 'System Admin',
            email,
            password,
            role: 'admin'
        });

        console.log('✅ Admin created successfully!');
        console.log(`📧 Email: ${email}`);
        console.log(`⚠️  SECURITY: Do not share this password. Store in secure password manager.`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

createTempAdmin();
