import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication check
    const savedUser = localStorage.getItem('mf_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (credentials) => {
    // Mock login/discovery process
    const mockUser = {
      pan: credentials.pan,
      name: "Investor",
      investments: [
        { scheme_code: "125497", units: 50.0 }, // SBI Magnum Midcap
        { scheme_code: "101181", units: 100.0 } // HDFC Top 100
      ]
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-4 py-8 md:px-8">
      <main className="max-w-7xl mx-auto">
        {user ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}

export default App;
