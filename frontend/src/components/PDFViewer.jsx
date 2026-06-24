import { X, Download, ExternalLink } from 'lucide-react';

const PDFViewer = ({ isOpen, pdfUrl, bookTitle, onClose }) => {
  if (!isOpen || !pdfUrl) return null;

  // Convert PDF URL to proxied viewable format
  const getViewableUrl = (url, download = false) => {
    if (!url) return '';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = `${apiUrl}/upload/pdf-proxy?url=${encodeURIComponent(url)}`;
    return download ? `${baseUrl}&download=true` : baseUrl;
  };

  const viewableUrl = getViewableUrl(pdfUrl);
  const downloadUrl = getViewableUrl(pdfUrl, true);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">📄 Reading: {bookTitle}</h2>
            <p className="text-sm text-slate-500 mt-1">PDF Viewer</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download className="w-5 h-5 text-slate-600" />
            </a>
            <a
              href={viewableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5 text-slate-600" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close viewer"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          <iframe
            src={`${viewableUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            title={`PDF: ${bookTitle}`}
            className="w-full h-full border-0"
            onError={() => {
              console.error('Failed to load PDF viewer');
            }}
          />
        </div>

        {/* Footer with info */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          <p>💡 Tip: Use the toolbar above to navigate, zoom, and search through the PDF. You can also download or open in a new tab.</p>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
