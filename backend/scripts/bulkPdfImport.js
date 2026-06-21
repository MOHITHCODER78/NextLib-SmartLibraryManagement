#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csvParse = require('csv-parse/sync'); // sync parser for simplicity
const axios = require('axios');
const Book = require('../models/Book');
const isValidIsbn = require('../utils/validateIsbn');

(async () => {
  // Connect to MongoDB – MONGO_URI should be defined in .env or environment
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('⛔️ CSV file path required as first argument');
    process.exit(1);
  }
  const batchId = Number(process.argv[3] || Date.now()); // numeric batch identifier

  // Load and parse CSV (expects header row)
  const raw = fs.readFileSync(csvPath, 'utf8');
  const records = csvParse.parse(raw, { columns: true, trim: true, skip_empty_lines: true });

  let success = 0, fail = 0;
  for (const row of records) {
    const { isbn, title, author, category, pdf_url } = row;
    if (!isbn || !title || !author || !category || !pdf_url) {
      console.warn(`⚠️ Skipping incomplete row: ${JSON.stringify(row)}`);
      fail++;
      continue;
    }
    if (!isValidIsbn(isbn)) {
      console.warn(`⚠️ Invalid ISBN '${isbn}' – skipping`);
      fail++;
      continue;
    }
    try {
      // Find or create the book entry
      let book = await Book.findOne({ isbn });
      if (!book) {
        book = await Book.create({ isbn, title, author, category });
      }

      // Overwrite policy – respect OVERWRITE_PDF env flag
      if (book.pdfUrl && !process.env.OVERWRITE_PDF) {
        console.log(`⏭️ Skipping ${isbn} – PDF already set (set OVERWRITE_PDF=1 to replace)`);
        continue;
      }

      // Download PDF (stream) and save locally
      const response = await axios.get(pdf_url, { responseType: 'stream', timeout: 15000 });
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('pdf')) {
        throw new Error('URL did not return a PDF (content-type: ' + contentType + ')');
      }
      const safeIsbn = isbn.replace(/[^0-9X]/gi, '');
      const fileName = `${safeIsbn}.pdf`;
      const destDir = path.join(__dirname, '..', 'uploads', 'pdfs');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const destPath = path.join(destDir, fileName);
      const writer = fs.createWriteStream(destPath);
      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Update book document
      book.pdfUrl = `/uploads/pdfs/${fileName}`;
      book.pdfBatch = batchId;
      book.sourceUrl = pdf_url;
      await book.save();
      console.log(`✅ Imported ${isbn} → ${fileName}`);
      success++;
    } catch (e) {
      console.error(`❌ Failed ${isbn}: ${e.message}`);
      fail++;
    }
  }

  console.log('\n=== IMPORT SUMMARY ===');
  console.log(`Batch ID : ${batchId}`);
  console.log(`Success  : ${success}`);
  console.log(`Failed   : ${fail}`);
  process.exit();
})();
