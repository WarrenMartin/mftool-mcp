import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import FundComparator from './components/FundComparator';
import { LayoutGrid, BarChart2, TrendingUp } from 'lucide-react';

const TABS = [
  { id: 'compare', label: 'Compare Funds', icon: BarChart2 },
  { id: 'dashboard', label: 'Portfolio', icon: LayoutGrid },
];

function App() {
  const [activeTab, setActiveTab] = useState('compare');

  return (
    <div className="min-h-screen w-full px-4 py-8 md:px-8">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* App Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/15 rounded-xl border border-blue-500/25">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text">MF Insight</span>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 glass rounded-2xl p-1.5">
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
        </div>

        {/* Page Content */}
        {activeTab === 'compare' && <FundComparator />}
        {activeTab === 'dashboard' && (
          <div className="glass rounded-2xl p-8 text-center space-y-3">
            <LayoutGrid className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold">Portfolio Tracking — Coming Soon</p>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Real portfolio discovery requires CAS (Consolidated Account Statement) integration
              or an Account Aggregator API. Use <strong className="text-slate-300">Compare Funds</strong> to
              research any mutual fund using live AMFI data.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
