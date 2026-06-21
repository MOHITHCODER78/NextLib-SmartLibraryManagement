#!/usr/bin/env node
const mongoose = require('mongoose');
const Book = require('../models/Book');

// Simple static data for generating dummy books
const categories = ['Technology','Science','History','Philosophy','Fiction','Biography','Business','Psychology','Fantasy','Non-Fiction'];
const sampleWords = ['Ancient','Future','Mystery','Journey','Secret','Legend','Dream','World','Mind','Heart','Spirit','Shadow','Light','Storm','Echo'];
const firstNames = ['Alex','Jordan','Taylor','Morgan','Casey','Riley','Sam','Charlie','Jamie','Avery'];
const lastNames = ['Smith','Johnson','Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas'];

function randomCategory() {
  return categories[Math.floor(Math.random() * categories.length)];
}

function randomISBN() {
  let isbn = '';
  for (let i = 0; i < 13; i++) isbn += Math.floor(Math.random() * 10);
  return isbn;
}

function randomTitle() {
  const wordCount = Math.floor(Math.random() * 4) + 2; // 2-5 words
  let title = '';
  for (let i = 0; i < wordCount; i++) {
    title += sampleWords[Math.floor(Math.random() * sampleWords.length)] + (i < wordCount - 1 ? ' ' : '');
  }
  return title;
}

function randomAuthor() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb+srv://MohithNaidu:MohithNaidu7806@cluster0.ycxrolh.mongodb.net/lms?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(uri);

  const current = await Book.countDocuments();
  const target = 300;
  if (current >= target) {
    console.log(`✅ Already have ${current} books (>= ${target}). No action needed.`);
    process.exit();
  }

  const toCreate = target - current;
  console.log(`📚 Adding ${toCreate} books to reach ${target} total.`);

  const bulkOps = [];
  for (let i = 0; i < toCreate; i++) {
    const title = randomTitle();
    const author = randomAuthor();
    const isbn = randomISBN();
    const category = randomCategory();
    bulkOps.push({ insertOne: { document: { title, author, isbn, category, totalCopies: 5, availableCopies: 5 } } });
  }

  await Book.bulkWrite(bulkOps);
  const finalCount = await Book.countDocuments();
  console.log(`✅ Done. Library now contains ${finalCount} books.`);
  process.exit();
})();
