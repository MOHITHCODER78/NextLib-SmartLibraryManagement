import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  ArrowRight,
  Book,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Sparkles,
} from 'lucide-react';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getDueState = (transaction) => {
  if (!transaction?.dueDate) {
    return { label: 'Awaiting issue', tone: 'slate', days: null, progress: 0 };
  }

  const dueTime = new Date(transaction.dueDate).getTime();
  const issueTime = transaction.issueDate ? new Date(transaction.issueDate).getTime() : Date.now();
  const now = Date.now();
  const daysLeft = Math.ceil((dueTime - now) / MS_PER_DAY);
  const totalWindow = Math.max(dueTime - issueTime, 1);
  const elapsed = Math.max(now - issueTime, 0);
  const progress = Math.min(Math.round((elapsed / totalWindow) * 100), 100);

  if (daysLeft < 0) {
    return {
      label: `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}`,
      tone: 'rose',
      days: daysLeft,
      progress: 100,
    };
  }

  if (daysLeft === 0) {
    return { label: 'Due today', tone: 'amber', days: 0, progress };
  }

  return {
    label: `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    tone: daysLeft <= 2 ? 'amber' : 'emerald',
    days: daysLeft,
    progress,
  };
};

const toneClasses = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-100',
};

const StudentDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  async function fetchDashboardData() {
    try {
      const [transactionRes, booksRes] = await Promise.all([
        api.get('/transactions/my'),
        api.get('/books'),
      ]);
      setTransactions(transactionRes.data.data);
      setBooks(booksRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, []);

  const activeLoans = transactions.filter((item) => item.status === 'issued');
  const pendingRequests = transactions.filter((item) => item.status === 'pending');
  const returnedBooks = transactions.filter((item) => item.status === 'returned');
  const fineTransactions = transactions.filter((item) => item.fine > 0);
  const totalFine = fineTransactions.reduce((sum, item) => sum + (item.fine || 0), 0);

  const dueSoon = useMemo(() => {
    return [...activeLoans].sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))[0];
  }, [activeLoans]);

  const favoriteCategory = useMemo(() => {
    const counts = {};
    transactions.forEach((transaction) => {
      const category = transaction.book?.category;
      if (category) counts[category] = (counts[category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [transactions]);

  const recommendations = useMemo(() => {
    const borrowedBookIds = new Set(transactions.map((item) => item.book?._id).filter(Boolean));
    const availableBooks = books.filter((book) => book.availableCopies > 0 && !borrowedBookIds.has(book._id));
    const categoryMatches = favoriteCategory
      ? availableBooks.filter((book) => book.category === favoriteCategory)
      : [];
    return [...categoryMatches, ...availableBooks.filter((book) => book.category !== favoriteCategory)].slice(0, 4);
  }, [books, favoriteCategory, transactions]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="font-medium text-slate-500">Building your library home...</p>
      </div>
    );
  }

  const dueState = dueSoon ? getDueState(dueSoon) : null;

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.65fr] lg:p-8">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                Student Library Home
              </div>
              <h2 className="text-4xl font-black tracking-tight text-slate-950">
                Welcome back, {user?.name?.split(' ')[0] || 'Student'}.
              </h2>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
                Keep track of your borrowed books, upcoming due dates, pending approvals, and recommended reads from the university catalog.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/books" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark">
                Explore Collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/my-shelf" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                View My Shelf
              </Link>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${dueSoon ? toneClasses[dueState.tone] : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Priority</span>
            </div>
            {dueSoon ? (
              <>
                <p className="text-sm font-black">{dueState.label}</p>
                <h3 className="mt-2 line-clamp-2 text-2xl font-black text-slate-950">{dueSoon.book?.title || 'Borrowed book'}</h3>
                <p className="mt-1 text-sm font-medium opacity-80">{dueSoon.book?.author || 'Unknown author'}</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80">
                  <div className={`h-full ${dueState.tone === 'rose' ? 'bg-rose-500' : dueState.tone === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${dueState.progress}%` }} />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-black">No active due dates</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">Your shelf is clear</h3>
                <p className="mt-1 text-sm font-medium opacity-80">Request a book to start tracking reading progress here.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Active Loans', value: activeLoans.length, icon: Book, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending Requests', value: pendingRequests.length, icon: Clock, color: 'bg-amber-50 text-amber-600' },
          { label: 'Returned Books', value: returnedBooks.length, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Outstanding Fines', value: `INR ${totalFine}`, icon: CreditCard, color: totalFine > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h3 className="font-black text-slate-950">Currently Reading</h3>
              <p className="text-sm font-medium text-slate-500">Books issued to your account.</p>
            </div>
            <Link to="/my-shelf" className="text-sm font-bold text-primary hover:underline">Full shelf</Link>
          </div>

          {activeLoans.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Book className="h-8 w-8" />
              </div>
              <h4 className="font-black text-slate-950">No active loans yet</h4>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">Borrowed books will appear here with due-date progress and fine status.</p>
              <Link to="/books" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">
                Find a Book
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {activeLoans.slice(0, 4).map((transaction) => {
                const state = getDueState(transaction);
                return (
                  <article key={transaction._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex gap-4">
                      <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {transaction.book?.thumbnail ? (
                          <img src={transaction.book.thumbnail} alt={transaction.book.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Book className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 font-black leading-tight text-slate-950">{transaction.book?.title || 'Unknown Book'}</h4>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500">{transaction.book?.author || 'Unknown author'}</p>
                        <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${toneClasses[state.tone]}`}>
                          {state.label}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h3 className="font-black text-slate-950">Pending Requests</h3>
              <p className="text-sm font-medium text-slate-500">Waiting for librarian approval.</p>
            </div>
            <div className="space-y-3 p-5">
              {pendingRequests.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm font-medium text-slate-500">No pending requests right now.</div>
              ) : (
                pendingRequests.slice(0, 3).map((request) => (
                  <div key={request._id} className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-amber-950">{request.book?.title || 'Unknown Book'}</p>
                      <p className="mt-1 text-xs font-bold text-amber-700">Requested for {request.requestedDays || 3} days</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {totalFine > 0 && (
            <Link to="/fines" className="block rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-sm transition-all hover:-translate-y-0.5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-rose-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <p className="text-sm font-black text-rose-900">Fine payment needed</p>
              <p className="mt-1 text-2xl font-black text-rose-700">INR {totalFine}</p>
              <p className="mt-2 text-xs font-bold text-rose-600">Open fines and payments</p>
            </Link>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center">
          <div>
            <h3 className="font-black text-slate-950">Recommended for You</h3>
            <p className="text-sm font-medium text-slate-500">
              {favoriteCategory ? `Based on your interest in ${favoriteCategory}.` : 'Available books to start your reading history.'}
            </p>
          </div>
          <Link to="/books" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            Browse all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm font-medium text-slate-500">Recommendations will appear when books are available in the catalog.</div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((book) => (
              <Link key={book._id} to="/books" className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md">
                <div className="mb-4 aspect-[3/4] overflow-hidden rounded-xl bg-white">
                  {book.thumbnail ? (
                    <img src={book.thumbnail} alt={book.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <BookOpen className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{book.category}</span>
                <h4 className="mt-3 line-clamp-2 font-black leading-tight text-slate-950 group-hover:text-primary">{book.title}</h4>
                <p className="mt-1 truncate text-xs font-medium text-slate-500">{book.author}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
