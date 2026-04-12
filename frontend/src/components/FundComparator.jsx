import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  Search, X, TrendingUp, TrendingDown, BarChart2,
  AlertCircle, Loader2, Calendar, Layers, Tag,
  ChevronDown, ChevronRight, Building2, Info,
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

/* ─── Preset fund registry ─── */
const PRESET_FUNDS = [
  { code: '152158', name: 'ABSL Transportation & Logistics Fund – Direct Growth', short: 'ABSL Transport', category: 'Sectoral', sector: 'Transportation & Logistics', amc: 'Aditya Birla Sun Life', capType: 'Multi Cap' },
  { code: '147844', name: 'ABSL PSU Equity Fund – Direct Growth', short: 'ABSL PSU', category: 'Thematic', sector: 'PSU / Govt Enterprises', amc: 'Aditya Birla Sun Life', capType: 'Multi Cap' },
  { code: '131670', name: 'ABSL Balanced Advantage Fund – Direct Growth', short: 'ABSL BAF', category: 'Hybrid', sector: 'Dynamic Asset Allocation', amc: 'Aditya Birla Sun Life', capType: 'Hybrid' },
  { code: '120505', name: 'Axis Mid Cap Fund – Direct Growth', short: 'Axis Midcap', category: 'Mid Cap', sector: 'Diversified Equity', amc: 'Axis', capType: 'Mid Cap' },
  { code: '145897', name: 'ICICI Prudential India Opportunities Fund – Direct Growth', short: 'ICICI Opp', category: 'Thematic', sector: 'Value / Contra', amc: 'ICICI Prudential', capType: 'Multi Cap' },
  { code: '145075', name: 'ICICI Prudential Manufacturing Fund – Direct Growth', short: 'ICICI Mfg', category: 'Sectoral', sector: 'Manufacturing', amc: 'ICICI Prudential', capType: 'Multi Cap' },
  { code: '119775', name: 'Kotak Mid Cap Fund – Direct Growth', short: 'Kotak Midcap', category: 'Mid Cap', sector: 'Diversified Equity', amc: 'Kotak', capType: 'Mid Cap' },
  { code: '119766', name: 'Kotak Liquid Fund – Direct Growth', short: 'Kotak Liquid', category: 'Liquid', sector: 'Money Market / Debt', amc: 'Kotak', capType: 'Debt' },
  { code: '152237', name: 'Motilal Oswal Small Cap Fund – Direct Growth', short: 'Motilal SC', category: 'Small Cap', sector: 'Diversified Equity', amc: 'Motilal Oswal', capType: 'Small Cap' },
  { code: '152033', name: 'Nippon India Innovation Fund – Direct Growth', short: 'Nippon Innovation', category: 'Thematic', sector: 'Technology & Innovation', amc: 'Nippon India', capType: 'Multi Cap' },
  { code: '118632', name: 'Nippon India Large Cap Fund – Direct Growth', short: 'Nippon LC', category: 'Large Cap', sector: 'Diversified Equity', amc: 'Nippon India', capType: 'Large Cap' },
  { code: '118763', name: 'Nippon India Power & Infra Fund – Direct Growth', short: 'Nippon Power', category: 'Sectoral', sector: 'Infrastructure & Power', amc: 'Nippon India', capType: 'Multi Cap' },
  { code: '118668', name: 'Nippon India Growth Mid Cap Fund – Direct Growth', short: 'Nippon Growth', category: 'Mid Cap', sector: 'Diversified Equity', amc: 'Nippon India', capType: 'Mid Cap' },
  { code: '118778', name: 'Nippon India Small Cap Fund – Direct Growth', short: 'Nippon SC', category: 'Small Cap', sector: 'Diversified Equity', amc: 'Nippon India', capType: 'Small Cap' },
  { code: '122639', name: 'Parag Parikh Flexi Cap Fund – Direct Growth', short: 'PPFAS Flexi', category: 'Flexi Cap', sector: 'Diversified Equity', amc: 'PPFAS', capType: 'Multi Cap' },
  { code: '152314', name: 'Sundaram Multi Asset Allocation Fund – Direct Growth', short: 'Sundaram Multi', category: 'Multi Asset', sector: 'Equity + Debt + Commodities', amc: 'Sundaram', capType: 'Hybrid' },
  { code: '144835', name: 'Sundaram Services Fund – Direct Growth', short: 'Sundaram Svc', category: 'Sectoral', sector: 'Services Industry', amc: 'Sundaram', capType: 'Multi Cap' },
  { code: '149483', name: 'Sundaram Nifty 100 Equal Weight Fund – Direct Growth', short: 'Sundaram N100', category: 'Index', sector: 'Nifty 100 Equal Weight', amc: 'Sundaram', capType: 'Large Cap' },
  { code: '119589', name: 'Sundaram Small Cap Fund – Direct Growth', short: 'Sundaram SC', category: 'Small Cap', sector: 'Diversified Equity', amc: 'Sundaram', capType: 'Small Cap' },
];

const CATEGORY_META = {
  'Large Cap':  { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  'Mid Cap':    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  'Small Cap':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  'Flexi Cap':  { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  'Sectoral':   { color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  'Thematic':   { color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  'Liquid':     { color: '#14b8a6', bg: 'rgba(20,184,166,0.15)' },
  'Hybrid':     { color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  'Multi Asset':{ color: '#84cc16', bg: 'rgba(132,204,22,0.15)' },
  'Index':      { color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)' },
};

const FUND_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#8b5cf6',
  '#ec4899','#f43f5e','#0ea5e9','#84cc16',
];

/* Overlap scoring between two funds (0-100) */
function computeOverlap(a, b) {
  if (a.code === b.code) return 100;
  let score = 0;
  if (a.capType === b.capType) score += 45;
  if (a.category === b.category) score += 35;
  if (a.sector === b.sector) score += 15;
  if (a.amc === b.amc) score += 5;
  // Liquid vs equity → no overlap
  if (a.capType === 'Debt' || b.capType === 'Debt') score = Math.min(score, 5);
  return Math.min(score, 99);
}

function overlapColor(score) {
  if (score >= 70) return { bg: 'rgba(244,63,94,0.25)', text: '#f43f5e' };
  if (score >= 40) return { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b' };
  if (score >= 20) return { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc' };
  return { bg: 'rgba(16,185,129,0.12)', text: '#34d399' };
}

/* ─── Date helpers ─── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function parseNavDate(str) {
  const [d, m, y] = str.split('-');
  return new Date(+y, +m - 1, +d);
}
function filterByDateRange(navHistory, fromStr, toStr) {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  to.setHours(23, 59, 59);
  return [...(navHistory || [])].reverse().filter((e) => {
    const d = parseNavDate(e.date);
    return d >= from && d <= to;
  });
}
function buildChartData(funds, fromDate, toDate) {
  if (!funds.length) return [];
  const dateSet = new Set();
  const fundSlices = funds.map((f) => {
    const slice = filterByDateRange(f.navHistory, fromDate, toDate);
    slice.forEach((e) => dateSet.add(e.date));
    return { ...f, slice };
  });
  if (!dateSet.size) return [];
  const sortedDates = Array.from(dateSet).sort((a, b) => parseNavDate(a) - parseNavDate(b));
  const fundMaps = fundSlices.map((f) => {
    const map = {};
    f.slice.forEach((e) => { map[e.date] = parseFloat(e.nav); });
    return map;
  });
  const bases = fundSlices.map((f, i) => {
    const first = sortedDates.find((d) => fundMaps[i][d] !== undefined);
    return first ? fundMaps[i][first] : null;
  });
  return sortedDates.map((date) => {
    const point = { date };
    fundSlices.forEach((f, i) => {
      const nav = fundMaps[i][date];
      if (nav !== undefined && bases[i]) {
        point[f.code] = parseFloat(((nav / bases[i]) * 100).toFixed(2));
      }
    });
    return point;
  });
}
function computeMetrics(navHistory, fromDate, toDate) {
  const slice = filterByDateRange(navHistory, fromDate, toDate);
  if (!slice.length) return null;
  const navs = slice.map((e) => parseFloat(e.nav));
  const startNav = navs[0]; const endNav = navs[navs.length - 1];
  const returnPct = ((endNav - startNav) / startNav) * 100;
  const daysActual = (parseNavDate(slice[slice.length - 1].date) - parseNavDate(slice[0].date)) / 86400000;
  const years = daysActual / 365;
  const cagr = years >= 1 ? (Math.pow(endNav / startNav, 1 / years) - 1) * 100 : null;
  const maxDrawdown = (() => {
    let peak = navs[0]; let maxDD = 0;
    navs.forEach((n) => { if (n > peak) peak = n; const dd = (peak - n) / peak * 100; if (dd > maxDD) maxDD = dd; });
    return maxDD;
  })();
  return { startNav, endNav, returnPct, cagr, maxDrawdown, daysActual };
}

/* ─── Sub-components ─── */

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}>
      {category}
    </span>
  );
}

function CustomTooltip({ active, payload, label, funds }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs shadow-2xl min-w-[200px] border border-white/10">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => {
        const fund = funds?.find((f) => f.code === p.dataKey);
        return (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
              <span className="text-slate-300 max-w-[120px] truncate">{fund?.short || p.name}</span>
            </span>
            <span className="font-bold text-white">{p.value?.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

function FundSearchInput({ onAdd, existingCodes }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const entries = data.results ? Object.entries(data.results).slice(0, 8) : [];
      setResults(entries); setOpen(true);
    } catch { setResults([]); } finally { setSearching(false); }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value; setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  useEffect(() => {
    const h = (e) => { if (!wrapperRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
        {searching ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
          : <Search className="w-4 h-4 text-slate-400 shrink-0" />}
        <input
          className="bg-transparent outline-none text-sm text-white placeholder-slate-500 w-56"
          placeholder="Search any fund…"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-[420px] glass rounded-xl overflow-hidden shadow-2xl z-50 border border-white/10">
          {results.map(([code, name]) => {
            const already = existingCodes.includes(code);
            return (
              <button key={code} onClick={() => { if (!already) { onAdd(code, name); setQuery(''); setResults([]); setOpen(false); } }}
                disabled={already}
                className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm border-b border-white/5 last:border-b-0 transition-colors ${already ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}`}>
                <span className="text-slate-200 leading-snug pr-3 truncate">{name}</span>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 bg-slate-700/60 rounded px-1.5 py-0.5">{code}</span>
              </button>
            );
          })}
        </div>
      )}
      {open && query.length >= 2 && !searching && results.length === 0 && (
        <div className="absolute top-full mt-2 w-[420px] glass rounded-xl px-4 py-4 shadow-2xl z-50 text-center border border-white/10">
          <p className="text-sm text-slate-500">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}

/* ─── Preset fund picker panel ─── */
const AMC_ORDER = ['Aditya Birla Sun Life', 'Axis', 'ICICI Prudential', 'Kotak', 'Motilal Oswal', 'Nippon India', 'PPFAS', 'Sundaram'];

function PresetPanel({ existingCodes, onAdd }) {
  const [expanded, setExpanded] = useState(true);
  const grouped = useMemo(() => {
    const g = {};
    AMC_ORDER.forEach((amc) => { g[amc] = PRESET_FUNDS.filter((f) => f.amc === amc); });
    return g;
  }, []);

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200 text-sm">Your Fund List</span>
          <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">{PRESET_FUNDS.length} funds</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
          {AMC_ORDER.map((amc) => (
            <div key={amc}>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">{amc}</p>
              <div className="flex flex-wrap gap-2">
                {grouped[amc].map((fund) => {
                  const added = existingCodes.includes(fund.code);
                  const meta = CATEGORY_META[fund.category] || {};
                  return (
                    <button
                      key={fund.code}
                      onClick={() => !added && onAdd(fund.code, fund.name, fund)}
                      disabled={added}
                      title={fund.name}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                        added
                          ? 'opacity-40 cursor-not-allowed bg-slate-800/40 border-white/10 text-slate-500'
                          : 'cursor-pointer hover:opacity-80'
                      }`}
                      style={!added ? { background: meta.bg, borderColor: `${meta.color}40`, color: meta.color } : {}}>
                      {added && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      {fund.short}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5">
            <Info className="w-3 h-3" /> Click any fund to add it to the chart (max 8)
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Category Insights Tab ─── */
function CategoryInsights({ funds }) {
  const catCounts = useMemo(() => {
    const map = {};
    funds.forEach((f) => {
      const preset = PRESET_FUNDS.find((p) => p.code === f.code);
      const cat = preset?.category || 'Unknown';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [funds]);

  const amcCounts = useMemo(() => {
    const map = {};
    funds.forEach((f) => {
      const preset = PRESET_FUNDS.find((p) => p.code === f.code);
      const amc = preset?.amc || 'Other';
      map[amc] = (map[amc] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [funds]);

  return (
    <div className="space-y-6">
      {/* Fund cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {funds.map((fund) => {
          const preset = PRESET_FUNDS.find((p) => p.code === fund.code);
          const meta = CATEGORY_META[preset?.category] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
          return (
            <div key={fund.code} className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-3 h-3 rounded-full shrink-0" style={{ background: fund.color }} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 text-sm leading-snug">{fund.short || fund.name.split(' ').slice(0, 4).join(' ')}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{fund.code}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <CategoryBadge category={preset?.category || 'Unknown'} />
                    {preset?.sector && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-white/10 text-slate-400 bg-slate-800/60">
                        {preset.sector}
                      </span>
                    )}
                  </div>
                  {preset && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 grid grid-cols-2 gap-1.5 text-[11px]">
                      <div><span className="text-slate-600">AMC</span><br /><span className="text-slate-300">{preset.amc}</span></div>
                      <div><span className="text-slate-600">Cap Type</span><br /><span className="text-slate-300">{preset.capType}</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category distribution bar */}
      {catCounts.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-bold text-slate-200 mb-4">Category Distribution</h3>
          <div className="space-y-3">
            {catCounts.map(([cat, count]) => {
              const meta = CATEGORY_META[cat] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
              const pct = (count / funds.length) * 100;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-24 shrink-0">{cat}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.color }} />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AMC distribution */}
      {amcCounts.length > 1 && (
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-bold text-slate-200 mb-4">AMC Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {amcCounts.map(([amc, count]) => (
              <div key={amc} className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-xl border border-white/5">
                <span className="text-sm font-semibold text-slate-200">{count}</span>
                <span className="text-xs text-slate-500">{amc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Overlap Matrix Tab ─── */
function OverlapMatrix({ funds }) {
  if (funds.length < 2) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Add at least 2 funds to see overlap analysis.
      </div>
    );
  }

  const labels = funds.map((f) => {
    const preset = PRESET_FUNDS.find((p) => p.code === f.code);
    return { ...f, short: preset?.short || f.code, preset };
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 text-xs text-slate-500 bg-slate-800/40 rounded-xl px-4 py-3 border border-white/5">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-600" />
        <p>Overlap is estimated from fund category, market cap type and sector — not from actual portfolio holdings. Higher score = more likely to hold similar stocks.</p>
      </div>
      <div className="glass rounded-2xl overflow-x-auto border border-white/5">
        <table className="text-xs min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-slate-500 font-medium bg-slate-800/40 sticky left-0 z-10">Fund</th>
              {labels.map((f) => (
                <th key={f.code} className="px-3 py-3 text-center font-medium min-w-[80px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />
                    <span className="text-slate-400 text-[10px] leading-tight max-w-[72px]">{f.short}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {labels.map((row) => (
              <tr key={row.code} className="hover:bg-white/[0.01]">
                <td className="px-4 py-3 sticky left-0 z-10 bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                    <span className="text-slate-300 font-medium">{row.short}</span>
                  </div>
                </td>
                {labels.map((col) => {
                  const score = computeOverlap(
                    row.preset || { code: row.code, category: 'Unknown', capType: 'Unknown', sector: '', amc: '' },
                    col.preset || { code: col.code, category: 'Unknown', capType: 'Unknown', sector: '', amc: '' },
                  );
                  const { bg, text } = overlapColor(score);
                  const isSelf = row.code === col.code;
                  return (
                    <td key={col.code} className="px-3 py-3 text-center">
                      {isSelf ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded-lg font-semibold"
                          style={{ background: bg, color: text }}>
                          {score}%
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(244,63,94,0.25)' }} /> <span className="text-rose-400">≥70%</span> High overlap</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(245,158,11,0.2)' }} /> <span className="text-amber-400">40–69%</span> Moderate</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(99,102,241,0.15)' }} /> <span className="text-indigo-300">20–39%</span> Low</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.12)' }} /> <span className="text-emerald-400">&lt;20%</span> Very low</div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
const QUICK_RANGES = [
  { label: '1M', days: 30 }, { label: '3M', days: 90 }, { label: '6M', days: 180 },
  { label: '1Y', days: 365 }, { label: '3Y', days: 1095 }, { label: '5Y', days: 1825 },
];

export default function FundComparator() {
  const [funds, setFunds] = useState([]);
  const [fromDate, setFromDate] = useState(daysAgoStr(365));
  const [toDate, setToDate] = useState(todayStr());
  const [pendingFrom, setPendingFrom] = useState(daysAgoStr(365));
  const [pendingTo, setPendingTo] = useState(todayStr());
  const [activeTab, setActiveTab] = useState('chart');

  const applyDates = () => { setFromDate(pendingFrom); setToDate(pendingTo); };

  const setQuickRange = (days) => {
    const from = daysAgoStr(days);
    const to = todayStr();
    setPendingFrom(from); setPendingTo(to);
    setFromDate(from); setToDate(to);
  };

  const addFund = useCallback(async (code, name, presetMeta) => {
    if (funds.length >= 8) return;
    if (funds.some((f) => f.code === code)) return;
    const color = FUND_COLORS[funds.length % FUND_COLORS.length];
    const preset = presetMeta || PRESET_FUNDS.find((p) => p.code === code);
    const placeholder = { code, name, short: preset?.short || name.split(' ').slice(0, 3).join(' '), color, loading: true, error: null, navHistory: [] };
    setFunds((prev) => [...prev, placeholder]);
    try {
      const res = await fetch(`${API_BASE}/historical/${code}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const navHistory = Array.isArray(data.data) ? data.data : [];
      const fundName = data.scheme_name || name;
      setFunds((prev) => prev.map((f) => f.code === code
        ? { ...f, name: fundName, short: preset?.short || fundName.split(' ').slice(0, 4).join(' '), navHistory, loading: false }
        : f));
    } catch (err) {
      setFunds((prev) => prev.map((f) => f.code === code
        ? { ...f, loading: false, error: err.message || 'Failed to fetch' } : f));
    }
  }, [funds]);

  const removeFund = useCallback((code) => {
    setFunds((prev) => prev.filter((f) => f.code !== code)
      .map((f, i) => ({ ...f, color: FUND_COLORS[i % FUND_COLORS.length] })));
  }, []);

  const readyFunds = useMemo(() => funds.filter((f) => !f.loading && !f.error && f.navHistory.length), [funds]);

  const chartData = useMemo(() => buildChartData(readyFunds, fromDate, toDate), [readyFunds, fromDate, toDate]);

  const tickFormatter = useCallback((dateStr) => {
    const d = parseNavDate(dateStr);
    return `${d.toLocaleString('en-IN', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
  }, []);

  const TABS = [
    { id: 'chart', label: 'Performance Chart', icon: BarChart2 },
    { id: 'category', label: 'Category Insights', icon: Tag },
    { id: 'overlap', label: 'Fund Overlap', icon: Layers },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/15 rounded-xl border border-blue-500/25">
          <BarChart2 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Fund Comparator</h1>
          <p className="text-slate-500 text-xs mt-0.5">Compare up to 8 mutual funds on a custom date range</p>
        </div>
      </header>

      {/* Preset fund picker */}
      <PresetPanel existingCodes={funds.map((f) => f.code)} onAdd={addFund} />

      {/* Active fund pills + search */}
      <div className="glass rounded-2xl p-5 space-y-4 border border-white/5">
        <div className="flex flex-wrap items-center gap-2.5">
          {funds.map((fund) => (
            <div key={fund.code} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
              style={{ background: `${fund.color}18`, borderColor: `${fund.color}40`, color: fund.color }}>
              {fund.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : fund.error ? <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                : <span className="w-2 h-2 rounded-full shrink-0" style={{ background: fund.color }} />}
              <span className="max-w-[160px] truncate text-slate-200 text-xs">{fund.short}</span>
              <button onClick={() => removeFund(fund.code)} className="ml-0.5 text-slate-500 hover:text-rose-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {funds.length === 0 && <p className="text-xs text-slate-600">Add funds from the panel above or search below</p>}
          {funds.length < 8 && (
            <FundSearchInput onAdd={addFund} existingCodes={funds.map((f) => f.code)} />
          )}
        </div>
        {funds.filter((f) => f.error).map((f) => (
          <div key={f.code} className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span><strong>{f.code}</strong>: {f.error}</span>
          </div>
        ))}
      </div>

      {/* Date range picker */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-semibold text-slate-300">Date Range</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={pendingFrom} max={pendingTo}
              onChange={(e) => setPendingFrom(e.target.value)}
              className="bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" />
            <span className="text-slate-600 text-sm">to</span>
            <input type="date" value={pendingTo} min={pendingFrom} max={todayStr()}
              onChange={(e) => setPendingTo(e.target.value)}
              className="bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" />
            <button onClick={applyDates}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
              Apply
            </button>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-white/5">
            {QUICK_RANGES.map(({ label, days }) => (
              <button key={label} onClick={() => setQuickRange(days)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  fromDate === daysAgoStr(days) && toDate === todayStr()
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      {readyFunds.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-4 border-b border-white/5 pb-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
                  activeTab === id
                    ? 'text-blue-400 border-blue-500 bg-blue-500/5'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Performance Chart */}
            {activeTab === 'chart' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-slate-100">Normalized Performance</p>
                  <p className="text-xs text-slate-500 mt-0.5">Base = ₹100 at start of selected period</p>
                </div>
                {chartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                    No NAV data available for the selected date range
                  </div>
                ) : (
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={tickFormatter}
                          tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                          tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => `${v}`} width={48} />
                        <ReferenceLine y={100} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4"
                          label={{ value: '100', fill: '#475569', fontSize: 10, position: 'insideLeft' }} />
                        <Tooltip content={<CustomTooltip funds={readyFunds} />} />
                        <Legend wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
                          formatter={(value) => {
                            const f = readyFunds.find((x) => x.code === value);
                            return <span style={{ color: '#94a3b8' }}>{f?.short || value}</span>;
                          }} />
                        {readyFunds.map((fund) => (
                          <Line key={fund.code} type="monotone" dataKey={fund.code}
                            stroke={fund.color} strokeWidth={2} dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Category Insights */}
            {activeTab === 'category' && <CategoryInsights funds={readyFunds} />}

            {/* Overlap Matrix */}
            {activeTab === 'overlap' && <OverlapMatrix funds={readyFunds} />}
          </div>
        </div>
      )}

      {/* Empty state */}
      {funds.length === 0 && (
        <div className="glass rounded-2xl py-16 flex flex-col items-center justify-center gap-4 text-center border border-white/5">
          <div className="p-4 bg-slate-800/60 rounded-2xl">
            <BarChart2 className="w-10 h-10 text-slate-600" />
          </div>
          <div>
            <p className="text-slate-300 font-semibold mb-1">No funds selected</p>
            <p className="text-slate-500 text-sm">Click any fund from "Your Fund List" above to start comparing</p>
          </div>
        </div>
      )}

      {/* Metrics Table */}
      {readyFunds.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Metrics</h2>
              <p className="text-xs text-slate-500 mt-0.5">{fromDate} → {toDate}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Fund</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold text-right">Start NAV</th>
                  <th className="px-5 py-3 font-semibold text-right">Current NAV</th>
                  <th className="px-5 py-3 font-semibold text-right">Return</th>
                  <th className="px-5 py-3 font-semibold text-right">CAGR</th>
                  <th className="px-5 py-3 font-semibold text-right">Max Drawdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {readyFunds.map((fund) => {
                  const m = computeMetrics(fund.navHistory, fromDate, toDate);
                  if (!m) return null;
                  const preset = PRESET_FUNDS.find((p) => p.code === fund.code);
                  const isPos = m.returnPct >= 0;
                  return (
                    <tr key={fund.code} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: fund.color }} />
                          <div>
                            <p className="font-semibold text-slate-100 leading-snug text-xs">{fund.short}</p>
                            <p className="text-[10px] text-slate-600 font-mono mt-0.5">{fund.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {preset ? <CategoryBadge category={preset.category} /> : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-400 text-xs">₹{m.startNav.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-100 text-xs">₹{m.endNav.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-xs ${isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPos ? '+' : ''}{m.returnPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-xs">
                        {m.cagr !== null
                          ? <span className={`font-semibold ${m.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{m.cagr >= 0 ? '+' : ''}{m.cagr.toFixed(2)}% p.a.</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right text-xs">
                        <span className="text-amber-400 font-semibold">-{m.maxDrawdown.toFixed(2)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {funds.filter((f) => f.loading).length > 0 && (
        <div className="flex items-center gap-3 text-sm text-slate-500 px-1">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          Fetching NAV data…
        </div>
      )}
    </div>
  );
}
