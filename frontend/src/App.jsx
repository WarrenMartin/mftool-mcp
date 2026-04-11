import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import FundComparator from './components/FundComparator';
import { LayoutGrid, BarChart2 } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'compare', label: 'Compare Funds', icon: BarChart2 },
];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('mf_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (credentials) => {
    const mockUser = {
      pan: credentials.pan,
      name: 'Investor',
      investments: [
        { scheme_code: '125497', units: 50.0 },
        { scheme_code: '101181', units: 100.0 },
      ],
    };
    localStorage.setItem('mf_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('mf_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full px-4 py-8 md:px-8">
        <main className="max-w-7xl mx-auto">
          <Login onLogin={handleLogin} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-4 py-8 md:px-8">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 glass rounded-2xl p-1.5 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Page Content */}
        {activeTab === 'dashboard' && (
          <Dashboard user={user} onLogout={handleLogout} />
        )}
        {activeTab === 'compare' && (
          <FundComparator />
        )}
      </main>
    </div>
  );
}

export default App;
