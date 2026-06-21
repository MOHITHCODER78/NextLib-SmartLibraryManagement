const axios = require('axios');

// Test ISBNs from different categories
const testBooks = [
    { title: 'Clean Code',               isbn: '9780132350884', category: 'Technology' },
    { title: 'A Brief History of Time',  isbn: '9780553380163', category: 'Science' },
    { title: 'Sapiens',                  isbn: '9780062316097', category: 'History' },
    { title: 'Thinking Fast and Slow',   isbn: '9780374533557', category: 'Psychology' },
];

async function findPdf(isbn, title) {
    // Step 1: Check Open Library for Internet Archive ID (ocaid)
    try {
        const olRes = await axios.get(
            `https://openlibrary.org/isbn/${isbn}.json`,
            { timeout: 8000 }
        );
        const ocaid = olRes.data.ocaid;
        if (ocaid) {
            // Step 2: Get Internet Archive metadata to find PDF file
            const iaRes = await axios.get(
                `https://archive.org/metadata/${ocaid}`,
                { timeout: 8000 }
            );
            const files = iaRes.data.files || [];
            const pdfFile = files.find(f =>
                f.name.endsWith('.pdf') &&
                !f.name.includes('_orig') &&
                (f.format === 'Text PDF' || f.format === 'Additional Text PDF' || f.name.endsWith('.pdf'))
            );
            if (pdfFile) {
                return {
                    found: true,
                    source: 'internet_archive',
                    ocaid,
                    pdfUrl: `https://archive.org/download/${ocaid}/${pdfFile.name}`,
                    size: pdfFile.size
                };
            }
            return { found: false, reason: `IA item exists (${ocaid}) but no PDF file found` };
        }
        return { found: false, reason: 'No ocaid in Open Library record' };
    } catch (err) {
        if (err.response?.status === 404) {
            return { found: false, reason: 'ISBN not in Open Library' };
        }
        return { found: false, reason: err.message };
    }
}

async function run() {
    console.log('=== Testing PDF discovery via Open Library + Internet Archive ===\n');
    for (const book of testBooks) {
        process.stdout.write(`[${book.category}] "${book.title}" (${book.isbn}) → `);
        const result = await findPdf(book.isbn, book.title);
        if (result.found) {
            const sizeMB = result.size ? (parseInt(result.size) / 1024 / 1024).toFixed(1) + ' MB' : 'unknown size';
            console.log(`✅ FOUND — ${sizeMB}`);
            console.log(`   URL: ${result.pdfUrl}`);
        } else {
            console.log(`❌ NOT FOUND — ${result.reason}`);
        }
    }
}

run();
