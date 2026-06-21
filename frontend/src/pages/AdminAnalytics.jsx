import { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingUp, AlertTriangle, BookOpen, Zap, Loader2, BarChart3, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/transactions/analytics');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchAnalytics(), 0);
    return () => clearTimeout(t);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="p-8 text-center text-red-600">
      Failed to load analytics data
    </div>
  );

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

  // Format fine collection for area chart
  const fineCollectionData = (data.fineCollectionTrends || []).map(t => ({
    date: new Date(t._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fineAmount: Math.round(t.totalFineCollected)
  }));

  // Format daily trends for line chart
  const dailyTrendsData = (data.dailyTrends || []).map(t => ({
    date: new Date(t._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    requests: t.count
  }));

  // Most borrowed books data
  const mostBorrowedData = (data.mostBorrowedBooks || []).map(b => ({
    title: b.title.length > 20 ? b.title.substring(0, 20) + '...' : b.title,
    borrows: b.borrows
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900">Analytics Hub</h1>
        </div>
        <p className="text-slate-600 ml-13">Deeper insights into library operations</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-600">Total Books</p>
            <BookOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.totalBooks}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-600">Active Loans</p>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.activeLoans}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-600">Registered Students</p>
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.totalStudents}</p>
        </div>

        <div className={`rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-shadow ${
          data.overdueLoans > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-600">Overdue Loans</p>
            <AlertTriangle className={`w-5 h-5 ${data.overdueLoans > 0 ? 'text-rose-500' : 'text-green-500'}`} />
          </div>
          <p className={`text-3xl font-bold ${data.overdueLoans > 0 ? 'text-rose-900' : 'text-slate-900'}`}>
            {data.overdueLoans}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-600">Total Unpaid Fines</p>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">₹{Math.round(data.totalFines)}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Most Borrowed Books */}
        {mostBorrowedData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Most Borrowed Books</h3>
              <p className="text-sm text-slate-500">Top 5 most requested titles</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mostBorrowedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="title" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => [`${value} borrows`, 'Requests']}
                />
                <Bar dataKey="borrows" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Daily Borrowing Trends */}
        {dailyTrendsData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Borrowing Trends</h3>
              <p className="text-sm text-slate-500">7-day activity overview</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => [`${value} requests`, 'Daily']}
                />
                <Line type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Fine Collection & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fine Collection Trends */}
        {fineCollectionData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Fine Collection Trends</h3>
              <p className="text-sm text-slate-500">Revenue from late returns</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={fineCollectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => [`₹${value}`, 'Fines']}
                />
                <Area type="monotone" dataKey="fineAmount" fill="#fecdd3" stroke="#ec4899" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Distribution */}
        {data.categoryDistribution && data.categoryDistribution.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Category Distribution</h3>
              <p className="text-sm text-slate-500">Books by category</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryDistribution.map(c => ({ name: c._id, value: c.count }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} books`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Category Table */}
      {data.categoryDistribution && data.categoryDistribution.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Category Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Book Count</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryDistribution.map((cat) => (
                  <tr key={cat._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-800 font-medium capitalize">{cat._id}</td>
                    <td className="text-right py-3 px-4 text-slate-700">{cat.count}</td>
                    <td className="text-right py-3 px-4 text-slate-700">
                      {Math.round((cat.count / data.totalBooks) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
