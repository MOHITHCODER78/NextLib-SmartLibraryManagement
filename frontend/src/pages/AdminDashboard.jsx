import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  BookOpen, TrendingUp, Loader2, Library,
  FileText, AlertTriangle, CheckCircle, Zap
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const [analyticsRes, transactionsRes] = await Promise.all([
        api.get('/transactions/analytics'),
        api.get('/transactions')
      ]);
      setData(analyticsRes.data.data);
      setTransactions(transactionsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(t);
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Loading command center...</p>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-4">
        <Library className="w-8 h-8" />
      </div>
      <h3 className="font-bold text-slate-900">Analytics Unavailable</h3>
      <p className="text-slate-500 text-sm mt-1 max-w-xs">Unable to load library analytics. Check your database connection.</p>
    </div>
  );

  const pendingRequests = transactions.filter(t => t.status === 'pending') || [];
  const activeLoans = transactions.filter(t => t.status === 'issued') || [];
  const overdueLoans = activeLoans.filter(t => t.dueDate && new Date(t.dueDate) < new Date()) || [];
  const totalFines = transactions.reduce((sum, t) => sum + (t.fine || 0), 0);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const stats = [
    {
      label: 'Pending Requests',
      value: pendingRequests.length,
      icon: Zap,
      color: 'bg-amber-50 text-amber-600',
      bgColor: 'bg-amber-500',
      trend: 'Require approval',
      alert: pendingRequests.length > 5,
    },
    {
      label: 'Overdue Loans',
      value: overdueLoans.length,
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600',
      bgColor: 'bg-rose-500',
      trend: 'Books past due',
      alert: overdueLoans.length > 0,
    },
    {
      label: 'Active Loans',
      value: activeLoans.length,
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
      bgColor: 'bg-blue-500',
      trend: 'Currently issued',
      alert: false,
    },
    {
      label: 'Fine Collection',
      value: `INR ${totalFines}`,
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600',
      bgColor: 'bg-indigo-500',
      trend: `${transactions.filter(t => t.fine > 0).length} students with fines`,
      alert: totalFines > 1000,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Command Center Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-white">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Command Center</h1>
            <p className="text-sm text-slate-600">Real-time library operations & analytics</p>
          </div>
        </div>
      </div>

      {/* Alert Banner (if issues) */}
      {(pendingRequests.length > 3 || overdueLoans.length > 0) && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-900">
              ⚠️ {pendingRequests.length} pending requests • {overdueLoans.length} overdue loans
            </p>
            <p className="text-xs text-rose-700 mt-1">Immediate action required</p>
          </div>
          <Link to="/admin/transactions" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 whitespace-nowrap">
            Review Now
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white border rounded-xl p-4 transition-all ${stat.alert ? 'border-rose-200 bg-gradient-to-br from-white to-rose-50/50' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.alert && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                  <AlertTriangle className="w-3 h-3" /> Alert
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-2">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Queue + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests Queue */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-50/0 border-b border-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Pending Queue</h3>
            <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">{pendingRequests.length}</span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-medium">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {pendingRequests.slice(0, 8).map(tx => (
                <div key={tx._id} className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{tx.book?.title || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{tx.user?.name || 'Student'}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 shrink-0 ml-2">{tx.requestedDays}d</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100">Approve</button>
                    <button className="flex-1 px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {pendingRequests.length > 8 && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <Link to="/admin/transactions" className="text-xs font-bold text-primary hover:underline">
                View all {pendingRequests.length} requests →
              </Link>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-sm">Collection</h4>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {(data.categoryDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Borrowing Trends */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-sm">Trends</h4>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Loans Alert */}
      {overdueLoans.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-gradient-to-r from-rose-50 to-rose-50/0 border-b border-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-sm">Overdue Books Alert</h3>
            <span className="ml-auto px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">{overdueLoans.length} loans</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-64">
            {overdueLoans.slice(0, 5).map(tx => {
              const daysOverdue = Math.ceil((new Date() - new Date(tx.dueDate)) / (1000 * 60 * 60 * 24));
              return (
                <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{tx.book?.title || 'Unknown'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{tx.user?.name || 'Student'}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" /> {daysOverdue}d overdue
                      </span>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark">Return</button>
                </div>
              );
            })}
          </div>

          {overdueLoans.length > 5 && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <Link to="/admin/transactions" className="text-xs font-bold text-primary hover:underline">
                View all {overdueLoans.length} overdue →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Manage Books', link: '/admin-books', icon: '📚' },
          { label: 'Process Requests', link: '/admin-transactions', icon: '⚡' },
          { label: 'Analytics', link: '/admin-analytics', icon: '📊' },
          { label: 'Fines & Payments', link: '/admin-transactions', icon: '💳' },
        ].map((action, i) => (
          <Link key={i} to={action.link} className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:shadow-md hover:border-primary transition-all">
            <div className="text-2xl mb-2">{action.icon}</div>
            <p className="text-xs font-bold text-slate-900">{action.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
