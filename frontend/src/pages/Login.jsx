import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Library, Mail, Lock, Loader2, ArrowRight, ShieldCheck, GraduationCap, Sparkles, AlertCircle } from 'lucide-react';

const Login = ({ portal = 'student' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, logout } = useAuth();
    const navigate = useNavigate();
    const isAdmin = portal === 'admin';

    const content = isAdmin
        ? {
            icon: ShieldCheck,
            title: 'Admin Console',
            subtitle: 'Secure access for authorized library staff.',
            eyebrow: 'Operations access',
            button: 'Sign In to Admin Console',
            helper: 'Student account?',
            helperLink: '/student-login',
            helperText: 'Open Student Portal',
            accent: 'slate',
        }
        : {
            icon: GraduationCap,
            title: 'Student Portal',
            subtitle: 'Access your library shelf, e-books, fines, and recommendations.',
            eyebrow: 'University library access',
            button: 'Sign In to Student Portal',
            helper: "Don't have an account?",
            helperLink: '/register',
            helperText: 'Request Access',
            accent: 'blue',
        };

    const Icon = content.icon;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await login(email, password);
            if (isAdmin && data.user.role !== 'admin') {
                logout();
                setError('This console is only for admin accounts. Use the student portal instead.');
                return;
            }
            if (!isAdmin && data.user.role === 'admin') {
                navigate('/admin-dashboard');
                return;
            }
            navigate(data.user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen ${isAdmin ? 'bg-slate-950' : 'bg-slate-50'} flex items-center justify-center p-6 font-inter`}>
            <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 md:grid-cols-[0.95fr_1.05fr]">
                <div className={`${isAdmin ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'} hidden p-10 md:flex md:flex-col md:justify-between`}>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                                <Library className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-lg font-black">NexLib</p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">Campus LMS</p>
                            </div>
                        </div>
                        <div className="mt-16">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                                <Sparkles className="h-3.5 w-3.5" />
                                {content.eyebrow}
                            </div>
                            <h1 className="text-4xl font-black leading-tight tracking-tight">{content.title}</h1>
                            <p className="mt-4 text-sm font-medium leading-7 text-white/70">{content.subtitle}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs font-bold text-white/80">
                        <div className="rounded-xl bg-white/10 p-3">AI Search</div>
                        <div className="rounded-xl bg-white/10 p-3">E-Books</div>
                        <div className="rounded-xl bg-white/10 p-3">Payments</div>
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    <Link to="/portal" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary">
                        <Library className="h-4 w-4" />
                        Choose another portal
                    </Link>
                    <div className="mb-8">
                        <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${isAdmin ? 'bg-slate-100 text-slate-800' : 'bg-blue-50 text-blue-600'}`}>
                            <Icon className="h-7 w-7" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-950">{content.title}</h1>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{content.subtitle}</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex gap-2 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                    placeholder="name@university.edu"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-slate-700">Password</label>
                                <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot password?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${isAdmin ? 'bg-slate-950 hover:bg-slate-800 shadow-slate-200' : 'bg-primary hover:bg-primary-dark shadow-primary/25'} text-white py-4 rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {content.button}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500 font-medium">
                            {content.helper}{' '}
                            <Link to={content.helperLink} className="text-primary font-bold hover:underline">{content.helperText}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
