import { useEffect, useState } from 'react';
import api from '../services/api';
import { AlertCircle, CheckCircle2, CreditCard, FileText, Loader2, Receipt } from 'lucide-react';

const Fines = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchTransactions() {
    try {
      const res = await api.get('/transactions/my');
      setTransactions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, []);

  const handlePayment = async (transactionId, amount) => {
    try {
      const orderRes = await api.post(`/payments/order/${transactionId}`, { amount });
      const options = {
        key: 'rzp_test_Shj8RyjZg1NsJ6',
        amount: orderRes.data.order.amount,
        currency: 'INR',
        name: 'NexLib University',
        description: 'Library Fine Payment',
        order_id: orderRes.data.order.id,
        handler: async function (response) {
          await api.post('/payments/verify', { ...response, transactionId });
          fetchTransactions();
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating payment order');
    }
  };

  const fineTransactions = transactions.filter((transaction) => transaction.fine > 0);
  const paidOrClear = transactions.filter((transaction) => transaction.status === 'returned' && !transaction.fine);
  const totalFine = fineTransactions.reduce((sum, transaction) => sum + (transaction.fine || 0), 0);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="font-medium text-slate-500">Loading fine ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Fines & Payments</h2>
        <p className="mt-1 font-medium text-slate-500">Review outstanding fines and completed library returns.</p>
      </div>

      <div className={`rounded-2xl border p-6 shadow-sm ${totalFine > 0 ? 'border-rose-100 bg-rose-50' : 'border-emerald-100 bg-emerald-50'}`}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${totalFine > 0 ? 'bg-white text-rose-600' : 'bg-white text-emerald-600'}`}>
              <CreditCard className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Outstanding Balance</p>
              <h3 className={`text-3xl font-black ${totalFine > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>INR {totalFine}</h3>
            </div>
          </div>
          <div className="text-sm font-bold text-slate-600">
            {totalFine > 0 ? `${fineTransactions.length} item${fineTransactions.length === 1 ? '' : 's'} require payment` : 'Your account is clear'}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <Receipt className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-slate-900">Fine Breakdown</h3>
        </div>
        {fineTransactions.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
            <p className="font-bold text-slate-900">No outstanding fines</p>
            <p className="mt-1 text-sm font-medium text-slate-500">Returned books without fines will appear in your clear history.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Book</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Fine</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fineTransactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{transaction.book?.title || 'Unknown Book'}</p>
                      <p className="text-xs font-medium text-slate-500">{transaction.book?.author || 'Unknown author'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">
                        <AlertCircle className="h-3 w-3" />
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-rose-600">INR {transaction.fine}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handlePayment(transaction._id, transaction.fine)} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark">
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paidOrClear.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">Clear Return History</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {paidOrClear.slice(0, 6).map((transaction) => (
              <div key={transaction._id} className="rounded-xl bg-slate-50 p-4">
                <p className="truncate text-sm font-bold text-slate-900">{transaction.book?.title || 'Unknown Book'}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Returned {transaction.returnDate ? new Date(transaction.returnDate).toLocaleDateString() : 'successfully'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Fines;
