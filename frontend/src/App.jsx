import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Books from './pages/Books';
import StudentDashboard from './pages/StudentDashboard';
import PortalHome from './pages/PortalHome';
import MyShelf from './pages/MyShelf';
import Fines from './pages/Fines';
import AdminBooks from './pages/AdminBooks';
import AdminTransactions from './pages/AdminTransactions';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import { Loader2, AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Portal Connection Reset</h1>
            <p className="text-slate-500 mt-2">The library portal encountered a temporary synchronization error. Please refresh the page to restore the session.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
            >
              Refresh Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Layout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar />
    <div className="flex-1 main-content-margin flex flex-col">
      <Navbar />
      <main className="p-8 pt-24 min-h-screen">
        {children}
      </main>
    </div>
  </div>
);

// Home redirect component
const Home = () => {
    const { user } = useAuth();
    if (user?.role === 'admin') return <Navigate to="/admin-dashboard" />;
    return <Navigate to="/student-dashboard" />;
};

const AuthenticatedChatBot = () => {
    const { user } = useAuth();
    return user ? <ChatBot /> : null;
};

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Authenticating university credentials...</p>
        </div>
    );
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) {
        return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} />;
    }
    return <Layout>{children}</Layout>;
};

function App() {
    return (
        <AuthProvider>
            <ErrorBoundary>
                <Router>
                    <Routes>
                        <Route path="/portal" element={<PortalHome />} />
                        <Route path="/login" element={<Navigate to="/student-login" />} />
                        <Route path="/student-login" element={<Login portal="student" />} />
                        <Route path="/admin-login" element={<Login portal="admin" />} />
                        <Route path="/register" element={<Register />} />
                        
                        <Route 
                            path="/" 
                            element={<PortalHome />} 
                        />
                        <Route 
                            path="/home" 
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/books" 
                            element={
                                <ProtectedRoute roles={['student', 'admin']}>
                                    <Books />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/student-dashboard" 
                            element={
                                <ProtectedRoute roles={['student']}>
                                    <StudentDashboard />
                                </ProtectedRoute>
                            } 
                        />
                        <Route
                            path="/my-shelf"
                            element={
                                <ProtectedRoute roles={['student']}>
                                    <MyShelf />
                                </ProtectedRoute>
                            }
                        />
                        <Route 
                        path="/fines" 
                        element={
                            <ProtectedRoute roles={['student']}>
                                <Fines />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/ebooks" 
                        element={
                            <ProtectedRoute roles={['student']}>
                                <Books />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin-books" 
                            element={
                                <ProtectedRoute roles={['admin']}>
                                    <AdminBooks />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/admin-transactions" 
                            element={
                                <ProtectedRoute roles={['admin']}>
                                    <AdminTransactions />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/admin-dashboard" 
                            element={
                                <ProtectedRoute roles={['admin']}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/admin-analytics" 
                            element={
                                <ProtectedRoute roles={['admin']}>
                                    <AdminAnalytics />
                                </ProtectedRoute>
                            } 
                        />
                    </Routes>
                    <AuthenticatedChatBot />
                </Router>
            </ErrorBoundary>
        </AuthProvider>
    );
}

export default App;
