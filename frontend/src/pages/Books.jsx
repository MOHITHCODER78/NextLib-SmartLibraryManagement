import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { Search, Book as BookIcon, Loader2, User, X, Library, Sparkles, ArrowRight, Filter, ChevronDown } from 'lucide-react';
import PDFViewer from '../components/PDFViewer';

const Books = () => {
  const location = useLocation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(location.pathname === '/ebooks' ? 'E-Books' : 'All');
  const [sortBy, setSortBy] = useState('title');
  const [showFilters, setShowFilters] = useState(false);

  // advanced filters / pagination
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [pdfOnlyFilter, setPdfOnlyFilter] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [page, setPage] = useState(1);
  const pageSizeOptions = [12, 20, 30];
  const [pageSize, setPageSize] = useState(12);

  // details drawer
  const [selectedBook, setSelectedBook] = useState(null);
  const [detailTab, setDetailTab] = useState('details');
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [requestedDays, setRequestedDays] = useState(3);
  const [bookTransactions, setBookTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [serverPage, setServerPage] = useState(1);
  const [serverHasMore, setServerHasMore] = useState(true);

  // PDF viewer
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [currentPDFUrl, setCurrentPDFUrl] = useState(null);
  const [currentPDFTitle, setCurrentPDFTitle] = useState('');

  const categories = useMemo(() => ['All', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Technology', 'Biography', 'Business', 'Philosophy'], []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books');
        setBooks(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const categoryCounts = useMemo(() => {
    return books.reduce((acc, b) => {
      const k = b.category || 'Uncategorized';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return books
      .filter((b) => {
        if (q) {
          const matches = (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q);
          if (!matches) return false;
        }
        if (selectedGenres.length > 0) {
          if (!selectedGenres.includes(b.category)) return false;
        } else if (category === 'E-Books') {
          if (!b.pdfUrl) return false;
        } else if (category !== 'All' && b.category !== category) return false;

        if (pdfOnlyFilter && !b.pdfUrl) return false;
        if (availabilityFilter === 'available' && (b.availableCopies || 0) <= 0) return false;
        if (availabilityFilter === 'out' && (b.availableCopies || 0) > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'availability') return (b.availableCopies || 0) - (a.availableCopies || 0);
        if (sortBy === 'popularity') return (b.borrowCount || 0) - (a.borrowCount || 0);
        if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
        return (a.title || '').localeCompare(b.title || '');
      });
  }, [books, searchTerm, category, selectedGenres, pdfOnlyFilter, availabilityFilter, sortBy]);

  // AI Recommendations: available books
  const recommendations = useMemo(() => {
    const availableBooks = books.filter(b => (b.availableCopies || 0) > 0);
    return availableBooks.slice(0, 6).sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0));
  }, [books]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const pagedBooks = filteredBooks.slice((page - 1) * pageSize, page * pageSize);
  const selectedGenresKey = selectedGenres.join(',');

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(t);
  }, [searchTerm, category, availabilityFilter, pdfOnlyFilter, selectedGenresKey, pageSize]);

  const handleReserve = async (bookId) => {
    setIsReserving(true);
    try {
      await api.post('/transactions/request', { bookId, requestedDays });
    } catch (error) {
      console.error(error);
    } finally {
      setIsReserving(false);
    }
  };

  const handleSummarize = async (bookId) => {
    setIsSummarizing(true);
    try {
      const res = await api.post(`/ai/summarize/${bookId}`);
      setAiSummary(res.data.summary || '');
      setDetailTab('ai');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const fetchBookTransactions = async (bookId) => {
    if (!bookId) return;
    setTxLoading(true);
    try {
      let res;
      try {
        res = await api.get(`/transactions/book/${bookId}`);
      } catch {
        res = await api.get('/transactions', { params: { bookId } });
      }
      setBookTransactions(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
      setBookTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (selectedBook && detailTab === 'transactions') fetchBookTransactions(selectedBook._id);
    }, 0);
    return () => clearTimeout(t);
  }, [selectedBook, detailTab]);

  const loadMoreBooks = async () => {
    try {
      const next = serverPage + 1;
      const res = await api.get('/books', { params: { page: next, pageSize } });
      const incoming = res.data.data || res.data || [];
      if (!incoming || incoming.length === 0) {
        setServerHasMore(false);
        return;
      }
      setBooks((prev) => {
        const map = new Map(prev.map(b => [b._id, b]));
        incoming.forEach(b => { if (!map.has(b._id)) map.set(b._id, b); });
        return Array.from(map.values());
      });
      setServerPage(next);
      if (incoming.length < pageSize) setServerHasMore(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Loading NexLib AI catalog...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Library className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-black text-slate-900">NexLib AI</h1>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campus Catalog</span>
        </div>
        <p className="text-sm text-slate-600">{location.pathname === '/ebooks' ? `Digital resources available: ${books.filter(b => b.pdfUrl).length}` : `Discover from ${books.length} titles • ${books.filter(b => b.availableCopies > 0).length} ready to borrow`}</p>
      </div>

      {/* Search + Sort Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, author, ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium">
            <option value="title">Sort: Title</option>
            <option value="availability">Sort: Availability</option>
            <option value="popularity">Sort: Popular</option>
            <option value="category">Sort: Category</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Compact Filter Bar */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Availability</label>
              <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                <option value="all">All Copies</option>
                <option value="available">Available Now</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Genres</label>
              <select multiple value={selectedGenres} onChange={(e) => setSelectedGenres(Array.from(e.target.selectedOptions, o => o.value))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                {categories.filter(c => c !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer flex-1">
                <input type="checkbox" checked={pdfOnlyFilter} onChange={() => setPdfOnlyFilter(v => !v)} />
                <span className="font-medium">PDF Only</span>
              </label>
              <button onClick={() => { setSelectedGenres([]); setAvailabilityFilter('all'); setPdfOnlyFilter(false); setCategory('All'); setSearchTerm(''); }} className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-bold hover:bg-slate-200">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Categories:</span>
        {['All', ...Object.keys(categoryCounts).sort()].map(n => (
          <button
            key={n}
            onClick={() => setCategory(n)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              category === n ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {n} {categoryCounts[n] && <span className="text-[10px] opacity-75">({categoryCounts[n]})</span>}
          </button>
        ))}
      </div>

      {/* AI Recommendations Section */}
      {recommendations.length > 0 && filteredBooks.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-purple-50 border border-primary/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black text-slate-900">Available Now</h3>
            <span className="text-xs font-bold text-slate-500 ml-auto">Top recommendations</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recommendations.slice(0, 6).map(book => (
              <button
                key={book._id}
                onClick={() => { setSelectedBook(book); setDetailTab('details'); setAiSummary(''); }}
                className="group text-left"
              >
                <div className="aspect-[3/4] bg-slate-200 rounded-lg overflow-hidden mb-2 relative group-hover:shadow-lg transition-all">
                  {book.thumbnail ? (
                    <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100"><BookIcon className="w-8 h-8 text-slate-300" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-[10px] font-bold text-white">View</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-primary">{book.title}</p>
                <p className="text-[10px] text-slate-500">{book.author}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-slate-600">
            {filteredBooks.length === 0 ? 'No results' : `${filteredBooks.length} result${filteredBooks.length !== 1 ? 's' : ''} • Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredBooks.length)}`}
          </div>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs">
            {pageSizeOptions.map(s => <option key={s} value={s}>{s} per page</option>)}
          </select>
        </div>

        {/* Book Grid */}
        {filteredBooks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <BookIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No books found</h3>
            <p className="text-sm text-slate-500 mb-4">Try adjusting your filters or search terms</p>
            <button onClick={() => { setSearchTerm(''); setSelectedGenres([]); setAvailabilityFilter('all'); setPdfOnlyFilter(false); setCategory('All'); }} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark">Reset filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {pagedBooks.map(book => (
              <article
                key={book._id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-slate-300 cursor-pointer transition-all group flex flex-col"
                onClick={() => { setSelectedBook(book); setDetailTab('details'); setAiSummary(''); }}
              >
                <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                  {book.thumbnail ? (
                    <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><BookIcon className="w-12 h-12" /></div>
                  )}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                    <span className="bg-slate-900/80 text-white px-2 py-1 rounded-md text-[10px] font-bold">{book.category}</span>
                    {(book.availableCopies || 0) > 0 ? (
                      <span className="bg-emerald-500/90 text-white px-2 py-1 rounded-md text-[10px] font-bold">In Stock</span>
                    ) : (
                      <span className="bg-rose-500/90 text-white px-2 py-1 rounded-md text-[10px] font-bold">Out</span>
                    )}
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="line-clamp-1">{book.author}</span>
                  </p>

                  {/* Stock bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-600">Stock</span>
                      <span className="text-[10px] font-bold text-slate-500">{book.availableCopies}/{book.totalCopies}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${(book.availableCopies || 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, ((book.availableCopies || 0) / (book.totalCopies || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    {book.pdfUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentPDFUrl(book.pdfUrl); setCurrentPDFTitle(book.title); setShowPDFViewer(true); }}
                        className="flex-1 px-2 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        Read PDF
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReserve(book._id); }}
                      disabled={(book.availableCopies || 0) === 0 || isReserving}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        (book.availableCopies || 0) > 0
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {(book.availableCopies || 0) > 0 ? 'Request' : 'Not Avbl'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredBooks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-3 py-2 rounded-lg font-bold text-sm transition-colors ${page <= 1 ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white hover:bg-primary-dark'}`}
            >
              ← Prev
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => { const v = Number(e.target.value) || 1; setPage(Math.min(Math.max(1, v), totalPages)); }}
                className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-bold"
              />
              <span className="text-xs text-slate-600">of {totalPages}</span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-2 rounded-lg font-bold text-sm transition-colors ${page >= totalPages ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white hover:bg-primary-dark'}`}
            >
              Next →
            </button>
          </div>

          <div className="flex items-center gap-2">
            {serverHasMore && (
              <button
                onClick={loadMoreBooks}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <ChevronDown className="w-4 h-4" />
                Load more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Details Drawer/Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSelectedBook(null)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Left: Book Image */}
            <div className="w-full md:w-2/5 bg-gradient-to-br from-slate-100 to-slate-50 p-6 flex flex-col items-center justify-center">
              <div className="aspect-[3/4] w-full max-w-xs mb-6 rounded-xl overflow-hidden shadow-lg">
                {selectedBook.thumbnail ? (
                  <img src={selectedBook.thumbnail} alt={selectedBook.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200"><BookIcon className="w-24 h-24 text-slate-400" /></div>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-900 text-center mb-1">{selectedBook.title}</h2>
              <p className="text-sm text-slate-600 text-center mb-4">{selectedBook.author}</p>

              {/* Quick Stats */}
              <div className="w-full grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ISBN</p>
                  <p className="text-sm font-bold text-slate-900">{selectedBook.isbn || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Stock</p>
                  <p className="text-sm font-bold text-slate-900">{selectedBook.availableCopies}/{selectedBook.totalCopies}</p>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="w-full md:w-3/5 p-6 overflow-y-auto">
              {/* Tabs */}
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                <button
                  onClick={() => setDetailTab('details')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${detailTab === 'details' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Details
                </button>
                <button
                  onClick={() => setDetailTab('transactions')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${detailTab === 'transactions' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => { setDetailTab('ai'); handleSummarize(selectedBook._id); }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${detailTab === 'ai' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Summary
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {detailTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Description</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{selectedBook.description || 'No description available.'}</p>
                    </div>
                  </div>
                )}

                {detailTab === 'transactions' && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Recent Activity</h4>
                    {txLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : bookTransactions.length === 0 ? (
                      <p className="text-sm text-slate-500">No transaction history for this book.</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {bookTransactions.map(tx => (
                          <div key={tx._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 bg-slate-50">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{tx.user?.name || tx.userName || 'Student'}</p>
                              <p className="text-xs text-slate-500">{tx.status} • {tx.requestedDays || 3} days</p>
                            </div>
                            <p className="text-xs font-bold text-slate-400">
                              {tx.issueDate ? new Date(tx.issueDate).toLocaleDateString() : tx.requestDate ? new Date(tx.requestDate).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'ai' && (
                  <div className="bg-gradient-to-br from-primary/5 to-purple-50 rounded-lg p-4 border border-primary/10">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI-Generated Summary
                    </h4>
                    {isSummarizing ? (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Generating summary...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-700 leading-relaxed">{aiSummary || 'No summary generated yet. Click "Generate" to create one.'}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                <select
                  value={requestedDays}
                  onChange={(e) => setRequestedDays(Number(e.target.value))}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium"
                >
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                </select>
                <button
                  onClick={() => { handleReserve(selectedBook._id); }}
                  disabled={(selectedBook.availableCopies || 0) === 0 || isReserving}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                    (selectedBook.availableCopies || 0) > 0
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isReserving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {(selectedBook.availableCopies || 0) > 0 ? 'Request Book' : 'Not Available'}
                </button>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <PDFViewer 
        isOpen={showPDFViewer}
        pdfUrl={currentPDFUrl}
        bookTitle={currentPDFTitle}
        onClose={() => setShowPDFViewer(false)}
      />
    </div>
  );
};

export default Books;
