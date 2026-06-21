import { Link, Navigate } from 'react-router-dom';
import { GraduationCap, Library, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PortalHome = () => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">NexLib</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">AI Campus Library</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            System Online
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm font-bold text-blue-200">
              <Sparkles className="h-4 w-4" />
              AI-powered university library platform
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-6xl">
              One portal for discovery, borrowing, payments, and library operations.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-300">
              NexLib connects students with physical and digital books while giving library teams a focused command center for requests, loans, inventory, fines, and AI-assisted discovery.
            </p>
          </section>

          <section className="grid gap-4">
            <Link to="/student-login" className="group rounded-2xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl shadow-blue-950/30 transition-all hover:-translate-y-1">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
              </div>
              <h2 className="text-2xl font-black">Student Portal</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Explore books, manage your shelf, read e-books, track due dates, and pay fines.</p>
            </Link>

            <Link to="/admin-login" className="group rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl transition-all hover:-translate-y-1 hover:border-blue-400/40">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-blue-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1" />
              </div>
              <h2 className="text-2xl font-black">Admin Console</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-400">Approve requests, manage inventory, process returns, and monitor analytics.</p>
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PortalHome;
