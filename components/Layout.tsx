import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { UserProfile } from '../types';
import { LogOut, User as UserIcon, Settings, ShieldCheck, WifiOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  offlineMode?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, user, offlineMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/' || location.pathname === '/auth';

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (isLanding) {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate(user?.role === 'provider' ? '/provider/dashboard' : '/customer/home')}
          >
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Mech On Wheels</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                <UserIcon size={14} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700 capitalize">{user.role}</span>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        
        {/* Offline Mode Warning */}
        {offlineMode && (
          <div className="bg-red-50 text-red-700 text-xs py-1 px-4 text-center border-b border-red-100 flex items-center justify-center gap-2">
            <WifiOff size={12} />
            <span><strong>Database Error:</strong> Running in offline mode. Changes will not be saved. Check Firestore settings.</span>
          </div>
        )}
      </header>
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;