import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, RefreshCcw, LogOut, 
  Plus, Search, LayoutGrid, Info
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];

const Dashboard = ({ user, onLogout }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [summary, setSummary] = useState({ total_valuation: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchValuation();
  }, []);

  const fetchValuation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/portfolio/valuation`, user.investments);
      setPortfolio(response.data.portfolio_details);
      setSummary(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the Investment API. Please ensure api_proxy.py is running.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = portfolio.map(item => ({
    name: item.scheme_name.split(' ').slice(0, 2).join(' '),
    value: item.current_value
  }));

  if (loading && !portfolio.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCcw className="animate-spin text-primary w-12 h-12" />
        <p className="text-slate-400">Syncing with live AMFI data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Portfolio Summary</h1>
          <p className="text-slate-400">Welcome back, {user.name} • PAN {user.pan}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchValuation}
            className="p-3 glass rounded-xl glass-hover text-slate-300 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-3 glass rounded-xl glass-hover text-rose-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-400">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <LayoutGrid className="w-20 h-20 text-primary" />
          </div>
          <p className="text-slate-400 font-medium mb-1">Total Valuation</p>
          <h2 className="text-4xl font-bold tracking-tight">₹{summary.total_valuation.toLocaleString('en-IN')}</h2>
          <div className="mt-4 flex items-center gap-1 text-secondary text-sm font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>+2.4% (Today)</span>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl md:col-span-2">
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <p className="text-slate-400 text-sm">Asset Allocation</p>
              <p className="font-semibold text-slate-200">Equity Focused Portfolio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fund List */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold">Your Investments</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm font-semibold hover:bg-primary/30 transition-colors">
            <Plus className="w-4 h-4" />
            Add Fund
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-sm border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Scheme Name</th>
                <th className="px-6 py-4 font-semibold">Units</th>
                <th className="px-6 py-4 font-semibold">Current NAV</th>
                <th className="px-6 py-4 font-semibold text-right">Market Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {portfolio.map((item, idx) => (
                <tr key={idx} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-100 group-hover:text-primary transition-colors">
                      {item.scheme_name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Code: {item.scheme_code}</div>
                  </td>
                  <td className="px-6 py-5 font-medium text-slate-300">
                    {item.units.toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-semibold text-slate-200">₹{item.nav}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{item.date}</div>
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-slate-100">
                    ₹{item.current_value.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
