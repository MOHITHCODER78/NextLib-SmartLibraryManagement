const mongoose = require('mongoose');
const Book = require('../models/Book');

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb+srv://MohithNaidu:MohithNaidu7806@cluster0.ycxrolh.mongodb.net/lms?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(uri);
  const total = await Book.countDocuments();
  console.log('📚 Total books in the library:', total);
  process.exit();
})();
