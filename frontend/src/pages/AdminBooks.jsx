import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Book as BookIcon, 
  X, 
  Upload, 
  CheckCircle,
  Hash,
  User,
  Tags,
  Layers,
  FileText
} from 'lucide-react';

const AdminBooks = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSearchingISBN, setIsSearchingISBN] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState(false);
    const [editingBook, setEditingBook] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        category: 'Fiction',
        totalCopies: 1,
        description: '',
        thumbnail: '',
        pdfUrl: ''
    });

    const emptyForm = {
        title: '',
        author: '',
        isbn: '',
        category: 'Fiction',
        totalCopies: 1,
        availableCopies: 1,
        description: '',
        thumbnail: '',
        pdfUrl: ''
    };

    const fetchBooks = async () => {
        try {
            const res = await api.get('/books');
            setBooks(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchBooks();
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('pdf', file);

        setUploading(true);
        try {
            const res = await api.post('/upload/pdf', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ ...formData, pdfUrl: res.data.url });
            setMessage({ type: 'success', text: 'PDF attached to book record!' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to upload PDF' });
        } finally {
            setUploading(false);
        }
    };

    const handleISBNLookup = async () => {
        if (!formData.isbn) return;
        setIsSearchingISBN(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await api.get(`/books/google-search/${formData.isbn}`);
            setFormData({
                ...formData,
                ...res.data.data,
                totalCopies: 1,
                pdfUrl: formData.pdfUrl
            });
            setMessage({ type: 'success', text: 'Global records found!' });
        } catch {
            setMessage({ type: 'error', text: 'ISBN not found in global database' });
        } finally {
            setIsSearchingISBN(false);
        }
    };

    const openCreateModal = () => {
        setEditingBook(null);
        setFormData(emptyForm);
        setMessage({ type: '', text: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (book) => {
        setEditingBook(book);
        setFormData({
            title: book.title || '',
            author: book.author || '',
            isbn: book.isbn || '',
            category: book.category || 'Fiction',
            totalCopies: book.totalCopies || 1,
            availableCopies: book.availableCopies ?? book.totalCopies ?? 1,
            description: book.description || '',
            thumbnail: book.thumbnail || '',
            pdfUrl: book.pdfUrl || ''
        });
        setMessage({ type: '', text: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBook(null);
        setFormData(emptyForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                totalCopies: Number(formData.totalCopies),
                availableCopies: Number(editingBook ? formData.availableCopies : formData.totalCopies)
            };

            if (editingBook) {
                await api.put(`/books/${editingBook._id}`, payload);
            } else {
                await api.post('/books', payload);
            }

            closeModal();
            fetchBooks();
            setMessage({ type: 'success', text: editingBook ? 'Book record updated' : 'Book added to library catalog' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error saving book' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this book from the university catalog?')) return;
        try {
            await api.delete(`/books/${id}`);
            fetchBooks();
        } catch {
            alert('Error deleting book');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading inventory records...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Collection Management</h2>
                    <p className="text-slate-500 mt-1 font-medium">Manage the university's physical and digital library assets.</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Ingest New Book
                </button>
            </div>

            {message.text && !isModalOpen && (
                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Inventory Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Book Asset</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Identifiers</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Classification</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inventory</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {books.map((book) => (
                                <tr key={book._id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                                                {book.thumbnail ? (
                                                    <img src={book.thumbnail} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <BookIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{book.title}</p>
                                                <p className="text-xs text-slate-500">{book.author}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ISBN</span>
                                            <span className="text-xs font-medium text-slate-600">{book.isbn || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                                            {book.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-slate-700">{book.availableCopies} / {book.totalCopies}</span>
                                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary" 
                                                    style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(book)}
                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                title="Edit book"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(book._id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ingest Book Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900">{editingBook ? 'Edit Resource' : 'Ingest New Resource'}</h3>
                                <p className="text-xs text-slate-500 font-medium">{editingBook ? 'Update metadata, inventory, and digital access.' : 'Add physical or digital assets to the library.'}</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            {message.text && (
                                <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Global ISBN Search</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Enter ISBN-10 or ISBN-13..."
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                value={formData.isbn}
                                                onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                                            />
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={handleISBNLookup}
                                            disabled={isSearchingISBN}
                                            className="px-6 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isSearchingISBN ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                            Lookup
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Book Title</label>
                                    <div className="relative">
                                        <BookIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Author</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                            value={formData.author}
                                            onChange={(e) => setFormData({...formData, author: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                    <div className="relative">
                                        <Tags className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <select 
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm appearance-none"
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        >
                                            <option value="Fiction">Fiction</option>
                                            <option value="Non-Fiction">Non-Fiction</option>
                                            <option value="Science">Science</option>
                                            <option value="Technology">Technology</option>
                                            <option value="History">History</option>
                                            <option value="Biography">Biography</option>
                                            <option value="Business">Business</option>
                                            <option value="Philosophy">Philosophy</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Inventory Count</label>
                                    <div className="relative">
                                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="number" 
                                            min="1"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                            value={formData.totalCopies}
                                            onChange={(e) => setFormData({...formData, totalCopies: parseInt(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                {editingBook && (
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Available Copies</label>
                                        <div className="relative">
                                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                min="0"
                                                max={formData.totalCopies}
                                                required
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                value={formData.availableCopies}
                                                onChange={(e) => setFormData({...formData, availableCopies: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cover Image URL</label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                        value={formData.thumbnail}
                                        onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        rows="4"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Add a short catalog description..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Digital Copy (PDF)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 relative">
                                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="file" 
                                                accept="application/pdf"
                                                onChange={handleFileUpload}
                                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                                            />
                                        </div>
                                        {formData.pdfUrl && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                        {uploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" />
                                {editingBook ? 'Update Book Record' : 'Commit to Database'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBooks;
