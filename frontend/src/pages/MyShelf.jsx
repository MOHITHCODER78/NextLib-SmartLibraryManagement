import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Book, Calendar, Clock, Loader2, Search } from 'lucide-react';

const statusStyles = {
  issued: 'bg-blue-50 text-blue-700 border-blue-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  returned: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

const getDaysText = (transaction) => {
  if (!transaction.dueDate || transaction.status !== 'issued') return 'No active due date';
  const diff = new Date(transaction.dueDate).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  return `Due in ${days} day${days === 1 ? '' : 's'}`;
};

const MyShelf = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('issued');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transactions/my');
        setTransactions(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const tabs = [
    { id: 'issued', label: 'Active Loans' },
    { id: 'pending', label: 'Pending Requests' },
    { id: 'returned', label: 'History' },
  ];

  const visibleTransactions = transactions.filter((item) => {
    if (tab === 'returned') return item.status === 'returned' || item.status === 'rejected';
    return item.status === tab;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="font-medium text-slate-500">Loading your shelf...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">My Shelf</h2>
          <p className="mt-1 font-medium text-slate-500">Track borrowed books, pending requests, and reading history.</p>
        </div>
        <Link to="/books" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark">
          <Search className="h-4 w-4" />
          Explore Books
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${tab === item.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visibleTransactions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
            <Book className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-slate-900">No books in this section</h3>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">Your shelf will update automatically when you request, borrow, or return books.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleTransactions.map((transaction) => (
            <article key={transaction._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex gap-4">
                <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {transaction.book?.thumbnail ? (
                    <img src={transaction.book.thumbnail} alt={transaction.book.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <Book className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyles[transaction.status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {transaction.status}
                    </span>
                    {transaction.fine > 0 && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">Fine INR {transaction.fine}</span>}
                  </div>
                  <h3 className="truncate text-lg font-black text-slate-900">{transaction.book?.title || 'Unknown Book'}</h3>
                  <p className="text-sm font-medium text-slate-500">{transaction.book?.author || 'Unknown author'}</p>
                  <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      {getDaysText(transaction)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      Requested {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyShelf;
