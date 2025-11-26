import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile, createUserProfile } from './services/firebase';
import { UserProfile, UserRole } from './types';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CustomerHome from './pages/customer/CustomerHome';
import NewRequest from './pages/customer/NewRequest';
import MyRequests from './pages/customer/MyRequests';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setDbError(false);
        try {
          // Attempt to fetch profile from Firestore
          let profile = await getUserProfile(firebaseUser.uid);
          
          if (profile) {
            setUser(profile);
          } else {
            // Profile missing in DB (or new user).
            // Try to recover role from LocalStorage (set during Login/Signup)
            const storedRole = localStorage.getItem('mech_user_role') as UserRole;
            const fallbackRole: UserRole = storedRole || 'customer';

            console.log("User profile missing. Attempting to create default with role:", fallbackRole);
            
            const defaultProfile: any = {
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              phone: '',
              role: fallbackRole
            };

            // Attempt to write to DB
            try {
              await createUserProfile(firebaseUser.uid, defaultProfile);
              profile = { ...defaultProfile, uid: firebaseUser.uid, createdAt: Date.now() };
              setUser(profile);
            } catch (createErr) {
              console.error("DB Create Failed:", createErr);
              // Fallback to Memory Profile if Write Fails
              profile = { ...defaultProfile, uid: firebaseUser.uid, createdAt: Date.now() };
              setUser(profile);
              setDbError(true);
            }
          }
        } catch (err) {
          console.error("Fatal DB/Network error:", err);
          // ULTIMATE FALLBACK: If DB is unreachable or times out
          // Construct a valid user object so the user can at least see the app
          const storedRole = localStorage.getItem('mech_user_role') as UserRole;
          
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Guest User',
            email: firebaseUser.email || '',
            phone: '',
            role: storedRole || 'customer', // Default to customer if unknown
            createdAt: Date.now()
          });
          setDbError(true);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-amber-500">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} offlineMode={dbError}>
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to={user.role === 'customer' ? '/customer/home' : '/provider/dashboard'} replace />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to={user.role === 'customer' ? '/customer/home' : '/provider/dashboard'} replace />} />
          
          {/* Customer Routes */}
          <Route 
            path="/customer/home" 
            element={user && user.role === 'customer' ? <CustomerHome user={user} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/customer/new-request" 
            element={user && user.role === 'customer' ? <NewRequest user={user} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/customer/requests" 
            element={user && user.role === 'customer' ? <MyRequests user={user} /> : <Navigate to="/" replace />} 
          />

          {/* Provider Routes */}
          <Route 
            path="/provider/dashboard" 
            element={user && user.role === 'provider' ? <ProviderDashboard user={user} /> : <Navigate to="/" replace />} 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;