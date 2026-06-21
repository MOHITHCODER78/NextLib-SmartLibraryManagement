import { Search, Bell, HelpCircle } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="fixed top-0 right-0 main-content-margin left-0 bg-white border-b border-slate-200 h-16 z-30 flex items-center justify-between px-8 transition-all">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search books, authors, or categories..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-all">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900 leading-none mb-1">University Portal</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider leading-none">System Online</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
