const mongoose = require('mongoose');
const Book = require('../models/Book');

async function analyze() {
    await mongoose.connect('mongodb+srv://MohithNaidu:MohithNaidu7806@cluster0.ycxrolh.mongodb.net/lms?retryWrites=true&w=majority&appName=Cluster0');

    // Get totals by category
    const stats = await Book.aggregate([
        {
            $group: {
                _id: '$category',
                total: { $sum: 1 },
                withPdf: {
                    $sum: {
                        $cond: [
                            { $and: [{ $ifNull: ['$pdfUrl', false] }, { $gt: [{ $strLenCP: { $ifNull: ['$pdfUrl', ''] } }, 0] }] },
                            1, 0
                        ]
                    }
                }
            }
        },
        { $sort: { total: -1 } }
    ]);

    console.log('\n=== Books by Category ===');
    let grandTotal = 0, grandWithPdf = 0;
    for (const s of stats) {
        const missing = s.total - s.withPdf;
        console.log(`${s._id.padEnd(25)} Total: ${s.total}  With PDF: ${s.withPdf}  Missing: ${missing}`);
        grandTotal += s.total;
        grandWithPdf += s.withPdf;
    }
    console.log('─'.repeat(70));
    console.log(`${'TOTAL'.padEnd(25)} Total: ${grandTotal}  With PDF: ${grandWithPdf}  Missing: ${grandTotal - grandWithPdf}`);

    // Sample some ISBNs without PDFs
    console.log('\n=== Sample books without PDFs ===');
    const samples = await Book.find({
        $or: [{ pdfUrl: { $exists: false } }, { pdfUrl: '' }, { pdfUrl: null }]
    }).select('title author isbn category').limit(10);
    for (const b of samples) {
        console.log(`[${b.category}] "${b.title}" — ISBN: ${b.isbn}`);
    }

    process.exit();
}

analyze();
