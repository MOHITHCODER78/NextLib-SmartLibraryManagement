const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Book = require('../models/Book');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { PDFParse } = require('pdf-parse');
const axios = require('axios');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: Gemini Chat (Direct REST API)
const chatWithGemini = async (message, context) => {
    try {
        let availabilityNote = '';
        if (context.isAvailabilityQuery) {
            availabilityNote = '\n\nIMPORTANT: The user is asking for AVAILABLE books ONLY. All "Relevant Books Found" are books that are currently in stock (availableCopies > 0). Prioritize these in your recommendations and mention their availability status.';
        }

        const prompt = `You are NxtBot, an advanced AI library assistant for NexLib.
        
        CONTEXT DATA:
        - Current User: ${context.currentUser.name} (Role: ${context.currentUser.role})
        - Books Issued to User: ${context.myIssuedBooks.length > 0 ? context.myIssuedBooks.join(', ') : 'None'}
        - Relevant Books Found: ${context.foundBooks.length > 0 ? context.foundBooks.join(', ') : 'None matching query'}
        - Relevant Members Found: ${context.foundUsers.length > 0 ? context.foundUsers.join(', ') : 'None'}
        
        USER MESSAGE: "${message}"
        
        INSTRUCTIONS:
        1. Act as an expert librarian and book curator.
        2. Analyze the "Relevant Books Found" list and give your expert opinion on which ones are the best, explaining why they are considered industry standards or masterpieces.
        3. ALWAYS recommend 1 or 2 incredibly highly-rated books from the OUTSIDE WORLD (your external knowledge) that are relevant to their query, even if they aren't in our library yet. Let the user know these are external recommendations.
        4. Be conversational, engaging, and format your response clearly (use bullet points if needed).
        5. Mention you are powered by Gemini 2.5 Flash.${availabilityNote}`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        return response.data.candidates[0].content.parts[0].text;
    } catch (err) {
        console.error('Gemini REST Error:', err.response?.data || err.message);
        return null;
    }
};

// Helper: Gemini Summarization
const summarizeWithGemini = async (text) => {
    try {
        const prompt = `Summarize this book content into a compelling 3-4 sentence overview. Focus on the core value and key takeaways: \n\n ${text.substring(0, 15000)}`;
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        return response.data.candidates[0].content.parts[0].text;
    } catch (err) {
        console.error('Gemini Summarize REST Error:', err.response?.data || err.message);
        return null;
    }
};


// HuggingFace Fallback Model
const summarizeWithTransformer = async (text, retryCount = 0) => {
    try {
        const modelId = "facebook/bart-large-cnn";
        const response = await axios({
            method: 'post',
            url: `https://api-inference.huggingface.co/models/${modelId}`,
            data: { inputs: "summarize: " + text.substring(0, 1000) },
            headers: { 
                'Authorization': `Bearer ${process.env.HF_API_TOKEN.trim()}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.error && retryCount < 2) {
            console.log('AI Warming up...');
            await new Promise(r => setTimeout(r, 15000));
            return summarizeWithTransformer(text, retryCount + 1);
        }

        return response.data[0]?.summary_text || response.data.summary_text || null;
    } catch (err) {
        console.error('AI Service Error:', err.message);
        return null;
    }
};

// @desc    Summarize a Book
// @route   POST /api/ai/summarize/:bookId
exports.summarizeBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        let textToSummarize = book.description || "";

        if (book.pdfUrl) {
            try {
                let pdfText = '';
                if (book.pdfUrl.startsWith('/uploads/')) {
                    const path = require('path');
                    const fs = require('fs');
                    const localPath = path.join(path.dirname(__dirname), book.pdfUrl);
                    const pdfBuffer = fs.readFileSync(localPath);
                    const parser = new PDFParse({ data: pdfBuffer });
                    const result = await parser.getText();
                    await parser.destroy();
                    pdfText = result.text || '';
                } else {
                    // PDF is stored on Cloudinary — use its URL directly
                    const parser = new PDFParse({ url: book.pdfUrl });
                    const result = await parser.getText();
                    await parser.destroy();
                    pdfText = result.text || '';
                }
                if (pdfText.length > 50) {
                    textToSummarize = pdfText.substring(0, 15000);
                }
            } catch (pdfErr) {
                console.error('PDF Fetch/Extraction Failed:', pdfErr.message);
            }
        }

        if (!textToSummarize || textToSummarize.length < 50) {
            // If we don't have enough text/PDF, we ask Gemini to use its external knowledge based on Title & Author!
            textToSummarize = `Book Title: ${book.title}\nAuthor: ${book.author}\nBrief Info: ${textToSummarize}\nPlease provide a comprehensive 3-4 sentence summary of this book using your general knowledge.`;
        }

        // 1. Try Gemini First
        if (process.env.GEMINI_API_KEY) {
            const geminiSummary = await summarizeWithGemini(textToSummarize);
            if (geminiSummary) return res.status(200).json({ success: true, summary: geminiSummary });
        }

        // 2. Fallback to OpenAI
        if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai')) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: "You are an expert librarian. Summarize this book's content into a compelling 3-4 sentence overview." },
                        { role: "user", content: textToSummarize.substring(0, 5000) }
                    ],
                    max_tokens: 200
                });
                return res.status(200).json({ success: true, summary: completion.choices[0].message.content });
            } catch (aiErr) {
                console.log('OpenAI failed...');
            }
        }

        // 3. Fallback to Transformer
        const transformerSummary = await summarizeWithTransformer(textToSummarize);
        if (transformerSummary) {
            res.status(200).json({ success: true, summary: transformerSummary + " (NxtBot Lite Summary)" });
        } else {
            res.status(200).json({ success: true, summary: `This ${book.category} book by ${book.author} is titled "${book.title}". (AI services currently initializing)` });
        }

    } catch (err) {
        res.status(500).json({ message: "Summarization process failed." });
    }
};

const chatWithTransformer = async (message, context) => {
    try {
        const modelId = "HuggingFaceH4/zephyr-7b-beta";
        const prompt = `<|system|>You are NxtBot, a library assistant. Context: ${JSON.stringify(context)}</s><|user|>${message}</s><|assistant|>`;

        const response = await axios({
            method: 'post',
            url: `https://api-inference.huggingface.co/models/${modelId}`,
            data: { inputs: prompt, parameters: { max_new_tokens: 250, return_full_text: false } },
            headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN.trim()}`, 'Content-Type': 'application/json' }
        });

        const text = response.data[0]?.generated_text || response.data.generated_text || "";
        return text.trim();
    } catch (err) {
        console.error('HF Chat Fallback Error:', err.message);
        return null;
    }
};

// @desc    Process AI Chat Query
// @route   POST /api/ai/chat
exports.processChat = async (req, res) => {
    try {
        const { message } = req.body;
        const user = req.user;

        const searchTerms = message.split(' ').filter(word => word.length > 3);
        const messageLower = message.toLowerCase();
        
        // Smart Librarian AI: Detect availability filters
        const isAvailabilityQuery = messageLower.includes('available') || 
                                    messageLower.includes('in stock') || 
                                    messageLower.includes('available now') ||
                                    messageLower.includes('in stock now');
        
        let relevantBooks = [];
        let relevantUsers = [];
        let availabilityFilter = {};

        if (isAvailabilityQuery) {
            availabilityFilter = { availableCopies: { $gt: 0 } };
        }

        if (searchTerms.length > 0) {
            relevantBooks = await Book.find({
                $and: [
                    {
                        $or: [
                            { title: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { author: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { category: { $regex: searchTerms.join('|'), $options: 'i' } }
                        ]
                    },
                    availabilityFilter
                ]
            }).select('title author category description availableCopies').limit(8);

            if (user.role === 'admin' && (message.toLowerCase().includes('user') || message.toLowerCase().includes('member'))) {
                relevantUsers = await User.find({
                    $or: [
                        { name: { $regex: searchTerms.join('|'), $options: 'i' } },
                        { email: { $regex: searchTerms.join('|'), $options: 'i' } }
                    ]
                }).select('name email role').limit(3);
            }
        }

        const myTransactions = await Transaction.find({ user: user.id, status: 'issued' }).populate('book');
        
        const context = {
            currentUser: { name: user.name, role: user.role },
            myIssuedBooks: myTransactions.map(t => `${t.book.title} (Due: ${new Date(t.dueDate).toLocaleDateString()})`),
            foundBooks: relevantBooks.map(b => `${b.title} by ${b.author} [Category: ${b.category}] - ${b.availableCopies} copies available`),
            foundUsers: relevantUsers.map(u => `${u.name} (${u.email}) - Role: ${u.role}`),
            isAvailabilityQuery: isAvailabilityQuery
        };

        // 1. Try Gemini (Primary)
        if (process.env.GEMINI_API_KEY) {
            const geminiResponse = await chatWithGemini(message, context);
            if (geminiResponse) return res.status(200).json({ success: true, message: geminiResponse });
        }

        // 2. Try OpenAI (Secondary)
        if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai')) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: "You are NxtBot, an advanced AI library assistant." },
                        { role: "user", content: `Context: ${JSON.stringify(context)}. User Message: ${message}` }
                    ],
                    max_tokens: 250
                });
                return res.status(200).json({ success: true, message: completion.choices[0].message.content });
            } catch (err) {
                console.log('OpenAI failed...');
            }
        }

        // 3. Fallback to HF
        const hfResponse = await chatWithTransformer(message, context);
        if (hfResponse) {
            return res.status(200).json({ success: true, message: hfResponse + "\n\n(NxtBot Lite Mode)" });
        }

        res.status(200).json({
            success: true,
            message: `Hello ${user.name}! I am NxtBot. How can I help you today?`
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



