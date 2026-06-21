const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const { cloudinary, storage } = require('../config/cloudinary');

// File filter - only allow PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({ storage, fileFilter });

// @desc    Upload PDF to Cloudinary
// @route   POST /api/upload/pdf
router.post('/pdf', protect, authorize('admin'), upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    // Cloudinary returns the full public URL directly in req.file.path
    res.status(200).json({
        success: true,
        url: req.file.path   // this is the full https://res.cloudinary.com/... URL
    });
});

// @desc    Delete a PDF from Cloudinary (optional cleanup)
// @route   DELETE /api/upload/pdf
router.delete('/pdf', protect, authorize('admin'), async (req, res) => {
    try {
        const { publicId } = req.body;
        if (!publicId) return res.status(400).json({ message: 'Public ID required' });
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        res.status(200).json({ success: true, message: 'File deleted from Cloudinary' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Proxy PDF request to bypass CORS and Content-Disposition attachment
// @route   GET /api/upload/pdf-proxy
router.get('/pdf-proxy', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ message: 'URL query parameter is required' });
        }

        // Validate URL is from allowed source (local path starting with /uploads/ or Cloudinary)
        const isCloudinary = url.startsWith('https://res.cloudinary.com/') || url.startsWith('http://res.cloudinary.com/');
        const isLocal = url.startsWith('/uploads/');

        if (!isCloudinary && !isLocal) {
            return res.status(403).json({ message: 'Access denied: Invalid target URL' });
        }

        if (isLocal) {
            // Serve the local file directly from filesystem
            const localPath = path.join(__dirname, '..', url);
            if (!fs.existsSync(localPath)) {
                return res.status(404).json({ message: 'File not found' });
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            return fs.createReadStream(localPath).pipe(res);
        } else {
            // Fetch from Cloudinary
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream'
            });

            // Set headers to display PDF inline
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');

            response.data.pipe(res);
        }
    } catch (err) {
        console.error('PDF Proxy error:', err.message);
        res.status(500).json({ message: 'Failed to proxy PDF file' });
    }
});

module.exports = router;
