import React, { useState } from 'react';
import { Wallet, Fingerprint, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ pan: '', mobile: '' });
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate API discovery delay
    setTimeout(() => {
      onLogin(credentials);
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="glass p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <Wallet className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Portfolio Discovery</h1>
          <p className="text-slate-400">Discover your mutual fund investments using your details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">PAN Number</label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-white uppercase"
                placeholder="ABCDE1234F"
                value={credentials.pan}
                onChange={(e) => setCredentials({ ...credentials, pan: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Mobile (Linked to Folios)</label>
            <input
              type="tel"
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-white"
              placeholder="+91 98765 43210"
              value={credentials.mobile}
              onChange={(e) => setCredentials({ ...credentials, mobile: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              <>
                <span>Search Investments</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500">
          Your data is used only for fetching information. We do not store your PAN or Mobile details on our servers.
        </p>
      </div>
    </div>
  );
};

export default Login;
