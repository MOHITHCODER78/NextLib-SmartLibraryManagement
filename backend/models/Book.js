const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a book title'],
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Please add an author']
    },
    isbn: {
        type: String,
        required: [true, 'Please add an ISBN'],
        unique: true
    },
    category: {
        type: String,
        required: [true, 'Please add a category']
    },
    description: String,
    thumbnail: String,
    totalCopies: {
        type: Number,
        required: true,
        default: 1
    },
    availableCopies: {
        type: Number,
        required: true,
        default: 1
    },
    googleBookId: String,
    pdfUrl: String,
    pdfBatch: { type: Number },   // numeric batch identifier (optional)
    sourceUrl: { type: String }, // original remote PDF URL (for audit)
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Book', bookSchema);
