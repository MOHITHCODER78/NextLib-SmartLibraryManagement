const mongoose = require('mongoose');
const Book = require('../models/Book');

async function test() {
    await mongoose.connect('mongodb+srv://MohithNaidu:MohithNaidu7806@cluster0.ycxrolh.mongodb.net/lms?retryWrites=true&w=majority&appName=Cluster0');
    const book = await Book.findOne({ pdfUrl: { $exists: true, $ne: '' } });
    if (book) {
        console.log('TEST_BOOK_ID:', book._id);
        console.log('TITLE:', book.title);
        console.log('PDF_URL:', book.pdfUrl);
    } else {
        console.log('NO_BOOK_WITH_PDF');
    }
    process.exit();
}

test();
