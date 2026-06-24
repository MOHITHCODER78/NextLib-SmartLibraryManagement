const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// File filter - only allow PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

// Memory storage configuration (direct buffer upload to Supabase)
const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter });

// @desc    Upload PDF to Supabase Storage
// @route   POST /api/upload/pdf
router.post('/pdf', protect, authorize('admin'), upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file' });
        }

        if (!supabase) {
            return res.status(500).json({ message: 'Supabase storage is not configured. Please set SUPABASE_URL and SUPABASE_KEY.' });
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${uniqueSuffix}_${cleanName}`;

        // Upload directly from memory buffer
        const { data, error } = await supabase.storage
            .from('pdfs')
            .upload(fileName, req.file.buffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (error) {
            throw error;
        }

        // Get public URL of the uploaded file
        const { data: { publicUrl } } = supabase.storage
            .from('pdfs')
            .getPublicUrl(fileName);

        res.status(200).json({
            success: true,
            url: publicUrl
        });
    } catch (err) {
        console.error('Supabase upload error:', err.message);
        res.status(500).json({ message: `Failed to upload PDF: ${err.message}` });
    }
});

// @desc    Delete a PDF from Supabase Storage
// @route   DELETE /api/upload/pdf
router.delete('/pdf', protect, authorize('admin'), async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ message: 'File URL required' });

        if (!supabase) {
            return res.status(500).json({ message: 'Supabase storage is not configured' });
        }

        // Extract filename from the Supabase public URL
        const filename = path.basename(url);

        const { data, error } = await supabase.storage
            .from('pdfs')
            .remove([filename]);

        if (error) {
            throw error;
        }

        res.status(200).json({ success: true, message: 'File deleted from Supabase storage' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Proxy PDF request to bypass CORS and Content-Disposition attachment
// @route   GET /api/upload/pdf-proxy
router.get('/pdf-proxy', async (req, res) => {
    try {
        const { url, download } = req.query;
        if (!url) {
            return res.status(400).json({ message: 'URL query parameter is required' });
        }

        // Validate URL is from allowed source (local path starting with /uploads/, Cloudinary, or Supabase)
        const isSupabase = url.includes('.supabase.co/storage/');
        const isCloudinary = url.startsWith('https://res.cloudinary.com/') || url.startsWith('http://res.cloudinary.com/');
        const isLocal = url.startsWith('/uploads/') || url.startsWith('uploads/');

        if (!isSupabase && !isCloudinary && !isLocal) {
            return res.status(403).json({ message: 'Access denied: Invalid target URL' });
        }

        const filename = path.basename(url);

        if (isLocal) {
            // Serve the local file directly from filesystem (fallback/legacy support)
            const cleanUrl = url.startsWith('/') ? url : '/' + url;
            const localPath = path.join(__dirname, '..', cleanUrl);
            if (!fs.existsSync(localPath)) {
                return res.status(404).json({ message: 'File not found' });
            }
            res.setHeader('Content-Type', 'application/pdf');
            if (download === 'true') {
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            } else {
                res.setHeader('Content-Disposition', 'inline');
            }
            return fs.createReadStream(localPath).pipe(res);
        } else {
            // Fetch from Cloudinary or Supabase
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream'
            });

            // Set headers to display PDF inline or download
            res.setHeader('Content-Type', 'application/pdf');
            if (download === 'true') {
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            } else {
                res.setHeader('Content-Disposition', 'inline');
            }

            response.data.pipe(res);
        }
    } catch (err) {
        console.error('PDF Proxy error:', err.message);
        res.status(500).json({ message: 'Failed to proxy PDF file' });
    }
});

module.exports = router;
