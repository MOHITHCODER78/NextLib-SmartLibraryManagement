const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');

// @desc    Request a book (Student)
// @route   POST /api/transactions/request
exports.requestBook = async (req, res) => {
    try {
        const { bookId, requestedDays } = req.body;
        const days = requestedDays ? Math.min(Math.max(parseInt(requestedDays), 1), 7) : 3;

        // Check if book exists and is available
        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        if (book.availableCopies <= 0) return res.status(400).json({ message: 'Book out of stock' });

        // Check if user already has a pending or issued request for this book
        const existing = await Transaction.findOne({
            user: req.user.id,
            book: bookId,
            status: { $in: ['pending', 'issued'] }
        });
        if (existing) return res.status(400).json({ message: 'You already have a request or this book is already issued to you' });

        const transaction = await Transaction.create({
            book: bookId,
            user: req.user.id,
            requestedDays: days
        });

        res.status(201).json({ success: true, data: transaction });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Issue a book (Admin)
// @route   PUT /api/transactions/issue/:id
exports.issueBook = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        if (transaction.status !== 'pending') return res.status(400).json({ message: 'Can only issue pending requests' });

        const book = await Book.findById(transaction.book);
        if (book.availableCopies <= 0) return res.status(400).json({ message: 'Book no longer available' });

        // Update transaction
        transaction.status = 'issued';
        transaction.issueDate = Date.now();
        
        // TEST MODE: Calculate due date using MINUTES instead of DAYS (e.g. 3 minutes instead of 3 days)
        const daysToAllow = transaction.requestedDays || 3;
        transaction.dueDate = new Date(Date.now() + daysToAllow * 60 * 1000); 
        await transaction.save();

        // Update book stock
        book.availableCopies -= 1;
        await book.save();

        res.status(200).json({ success: true, data: transaction });
    } catch (err) {
        console.error('ISSUE_ERROR:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Reject a book request (Admin)
// @route   PUT /api/transactions/:id/reject
exports.rejectBook = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        
        transaction.status = 'rejected';
        await transaction.save();

        res.status(200).json({ success: true, data: transaction });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Return a book (Admin)
// @route   PUT /api/transactions/return/:id
exports.returnBook = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        if (transaction.status !== 'issued') return res.status(400).json({ message: 'Book is not in issued state' });

        // Calculate fine if overdue
        const now = new Date();
        let fine = 0;
        if (now > transaction.dueDate) {
            const diffTime = Math.abs(now - transaction.dueDate);
            // TEST MODE: Fine is calculated per MINUTE late (10 units per minute)
            const diffMinutes = Math.ceil(diffTime / (1000 * 60));
            fine = diffMinutes * 10;
        }

        // Update transaction
        transaction.status = 'returned';
        transaction.returnDate = now;
        transaction.fine = fine;
        await transaction.save();

        // Update book stock
        const book = await Book.findById(transaction.book);
        book.availableCopies += 1;
        await book.save();

        res.status(200).json({ success: true, data: transaction, fine });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get user transactions
// @route   GET /api/transactions/my
exports.getMyTransactions = async (req, res) => {
    try {
        let transactions = await Transaction.find({ user: req.user.id })
            .populate('book')
            .sort('-createdAt');
            
        // Dynamically calculate current fines for issued books
        const now = new Date();
        const transactionsWithDynamicFines = transactions.map(t => {
            const transObj = t.toObject();
            if (t.status === 'issued' && now > t.dueDate) {
                const diffTime = Math.abs(now - t.dueDate);
                // TEST MODE: 10 units per minute late
                const diffMinutes = Math.ceil(diffTime / (1000 * 60));
                transObj.fine = diffMinutes * 10;
            }
            return transObj;
        });

        res.status(200).json({ success: true, data: transactionsWithDynamicFines });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all transactions (Admin)
// @route   GET /api/transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('book')
            .populate('user', 'name email')
            .sort('-createdAt');
        res.status(200).json({ success: true, data: transactions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get Analytics for Dashboard (Admin)
// @route   GET /api/transactions/analytics
exports.getAnalytics = async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const activeLoans = await Transaction.countDocuments({ status: 'issued' });
        const totalStudents = await User.countDocuments({ role: 'student' });
        
        // Calculate total unpaid fines
        const fineData = await Transaction.aggregate([
            { $match: { status: 'issued' } },
            { $group: { _id: null, total: { $sum: '$fine' } } }
        ]);
        const totalFines = fineData.length > 0 ? fineData[0].total : 0;
        
        // Get category-wise distribution
        const categoryDistribution = await Book.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Get daily borrowing trends for the last 7 days
        const dailyTrends = await Transaction.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 7 }
        ]);

        // Get most borrowed books (top 5)
        const mostBorrowedBooks = await Transaction.aggregate([
            {
                $group: {
                    _id: '$book',
                    borrowCount: { $sum: 1 }
                }
            },
            { $sort: { borrowCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'books',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'bookDetails'
                }
            },
            { $unwind: '$bookDetails' }
        ]);

        const mostBorrowedFormatted = mostBorrowedBooks.map(b => ({
            title: b.bookDetails.title,
            borrows: b.borrowCount
        }));

        // Get overdue count
        const now = new Date();
        const overdueLoans = await Transaction.countDocuments({
            status: 'issued',
            dueDate: { $lt: now }
        });

        // Get fine collection trends (last 7 days)
        const fineCollectionTrends = await Transaction.aggregate([
            {
                $match: {
                    status: 'returned',
                    fine: { $gt: 0 },
                    updatedAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    totalFineCollected: { $sum: '$fine' }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalBooks,
                activeLoans,
                totalStudents,
                totalFines,
                overdueLoans,
                categoryDistribution,
                dailyTrends,
                mostBorrowedBooks: mostBorrowedFormatted,
                fineCollectionTrends
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
