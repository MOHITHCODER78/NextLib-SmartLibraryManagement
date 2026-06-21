import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  CheckCircle2, RotateCcw, Loader2, Calendar, Zap, 
  FileText, User, Book, CreditCard, Search, Check, X
} from 'lucide-react';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('requests'); // requests | loans | payments
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function fetchTransactions() {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchTransactions(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/transactions/${id}/${action}`);
      fetchTransactions();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || 'Error'));
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Loading ledger...</p>
    </div>
  );

  const pendingRequests = transactions.filter(t => t.status === 'pending');
  const activeLoans = transactions.filter(t => t.status === 'issued');
  const paidFines = transactions.filter(t => t.fine && t.fine > 0);

  const filteredRequests = pendingRequests.filter(t =>
    (t.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.book?.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredLoans = activeLoans.filter(t =>
    (t.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.book?.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredPayments = paidFines.filter(t =>
    (t.user?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-black text-slate-900">Transaction Ledger</h1>
            <p className="text-sm text-slate-600">Manage requests, active loans, and fine payments</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 -mx-6 px-6">
        {[
          { id: 'requests', label: 'Pending Requests', count: pendingRequests.length, icon: Zap, color: 'amber' },
          { id: 'loans', label: 'Active Loans', count: activeLoans.length, icon: Book, color: 'blue' },
          { id: 'payments', label: 'Payment History', count: paidFines.length, icon: CreditCard, color: 'indigo' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
            {t.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                tab === t.id ? `bg-${t.color}-100 text-${t.color}-700` : `bg-slate-100 text-slate-600`
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={tab === 'requests' ? 'Search student or book...' : tab === 'loans' ? 'Search borrower or book...' : 'Search student or payment...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-primary focus:outline-none"
        />
      </div>

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              {pendingRequests.length === 0 ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">All caught up!</h3>
                  <p className="text-slate-500 text-sm">No pending requests.</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No results found.</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Requested</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map(t => (
                    <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {(t.user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{t.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{t.user?.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {t.book?.thumbnail && (
                            <img src={t.book.thumbnail} alt="" className="w-6 h-8 rounded object-cover" />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{t.book?.title || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{t.book?.author || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                          {t.requestedDays || 3} days
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right flex gap-2 justify-end">
                        <button
                          onClick={() => handleAction(t._id, 'issue')}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                        >
                          <Check className="w-3 h-3 inline mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(t._id, 'reject')}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3 inline mr-1" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Active Loans Tab */}
      {tab === 'loans' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {filteredLoans.length === 0 ? (
            <div className="p-12 text-center">
              {activeLoans.length === 0 ? (
                <>
                  <Book className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">No active loans</h3>
                  <p className="text-slate-500 text-sm">All books are back in stock.</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No results found.</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Borrower</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Issued</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Due</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Fine</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.map(t => {
                    const isOverdue = new Date(t.dueDate) < new Date();
                    const daysLeft = Math.ceil((new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={t._id} className={`hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="font-bold text-slate-900">{t.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{t.user?.id || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{t.book?.title || 'Unknown'}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {new Date(t.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                            <span className={`text-xs font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                              {isOverdue ? `Overdue by ${Math.abs(daysLeft)}d` : `${daysLeft}d left`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {t.fine > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                              INR {t.fine}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleAction(t._id, 'return')}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-primary transition-colors"
                          >
                            <RotateCcw className="w-3 h-3 inline mr-1" /> Return
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {tab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              {paidFines.length === 0 ? (
                <>
                  <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">No pending fines</h3>
                  <p className="text-slate-500 text-sm">All students are in good standing.</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No results found.</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Fine Amount</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Book</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map(t => (
                    <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900">{t.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{t.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                          INR {t.fine}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        Overdue library fine
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600">{t.book?.title || 'N/A'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
