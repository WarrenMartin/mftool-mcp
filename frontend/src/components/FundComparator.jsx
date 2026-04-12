import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  Search, X, TrendingUp, TrendingDown, BarChart2,
  AlertCircle, Loader2, Calendar, Layers, Tag,
  ChevronDown, ChevronRight, Building2, Info,
  Trophy, Award, Percent, DollarSign, Plus,
  Target, Calculator, BookOpen, ExternalLink,
  ShieldCheck, Activity,
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

/* ─── Fund registries ─── */
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

/* Benchmark index funds — shown as dashed reference lines in chart */
const BENCHMARK_FUNDS = [
  { code: '120716', name: 'UTI Nifty 50 Index Fund – Direct Growth', short: 'Nifty 50', isBenchmark: true, benchmarkColor: '#94a3b8' },
  { code: '148807', name: 'ABSL Nifty Midcap 150 Index Fund – Direct Growth', short: 'Nifty Midcap 150', isBenchmark: true, benchmarkColor: '#7c3aed' },
  { code: '149466', name: 'Axis Nifty Next 50 Index Fund – Direct Growth', short: 'Nifty Next 50', isBenchmark: true, benchmarkColor: '#0e7490' },
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

/* Overlap scoring */
function computeOverlap(a, b) {
  if (a.code === b.code) return 100;
  let score = 0;
  if (a.capType === b.capType) score += 45;
  if (a.category === b.category) score += 35;
  if (a.sector === b.sector) score += 15;
  if (a.amc === b.amc) score += 5;
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
function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysAgoStr(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
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

/* Build chart data — viewMode: 'pct' | 'nav' */
function buildChartData(funds, fromDate, toDate, viewMode = 'pct') {
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
        if (viewMode === 'nav') {
          point[f.code] = parseFloat(nav.toFixed(4));
        } else {
          point[f.code] = parseFloat((((nav / bases[i]) - 1) * 100).toFixed(2));
        }
        point[`${f.code}_nav`] = parseFloat(nav.toFixed(4));
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
  return { startNav, endNav, returnPct, cagr, maxDrawdown, daysActual, years };
}

/* Sharpe ratio & annualised volatility (risk-free = 6.5% p.a.) */
function computeRiskMetrics(navHistory, fromDate, toDate) {
  const slice = filterByDateRange(navHistory, fromDate, toDate);
  if (slice.length < 20) return null;
  const navs = slice.map((e) => parseFloat(e.nav));
  const dailyReturns = navs.slice(1).map((n, i) => (n - navs[i]) / navs[i]);
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyReturns.length;
  const annualVol = Math.sqrt(variance * 252) * 100; // %
  const annualReturn = mean * 252 * 100; // %
  const RISK_FREE = 6.5; // %
  const sharpe = annualVol > 0 ? (annualReturn - RISK_FREE) / annualVol : null;
  // Sortino: downside deviation only
  const downReturns = dailyReturns.filter((r) => r < 0);
  const downVariance = downReturns.length
    ? downReturns.reduce((a, b) => a + b * b, 0) / downReturns.length : 0;
  const downsideDev = Math.sqrt(downVariance * 252) * 100;
  const sortino = downsideDev > 0 ? (annualReturn - RISK_FREE) / downsideDev : null;
  return { annualVol, sharpe, sortino };
}

/* SIP calculator — monthly SIP returns */
function computeSIP(navHistory, fromDate, toDate, monthlyAmount) {
  const slice = filterByDateRange(navHistory, fromDate, toDate);
  if (slice.length < 20) return null;
  // Get one NAV per month (first available)
  const monthMap = {};
  slice.forEach((e) => {
    const [, m, y] = e.date.split('-');
    const key = `${y}-${m}`;
    if (!monthMap[key]) monthMap[key] = parseFloat(e.nav);
  });
  const months = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, nav]) => nav);
  if (months.length < 2) return null;
  let totalUnits = 0;
  let totalInvested = 0;
  months.forEach((nav) => {
    totalUnits += monthlyAmount / nav;
    totalInvested += monthlyAmount;
  });
  const currentNav = parseFloat(slice[slice.length - 1].nav);
  const currentValue = totalUnits * currentNav;
  const absoluteReturn = ((currentValue - totalInvested) / totalInvested) * 100;
  const sipYears = months.length / 12;
  const xirr = sipYears >= 1 ? (Math.pow(currentValue / totalInvested, 1 / sipYears) - 1) * 100 : null;
  return { totalInvested, currentValue, absoluteReturn, xirr, monthCount: months.length };
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

function CustomTooltip({ active, payload, label, funds, viewMode }) {
  if (!active || !payload?.length) return null;
  const filteredPayload = payload.filter((p) => !String(p.dataKey).endsWith('_nav'));
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs shadow-2xl min-w-[230px] border border-white/10">
      <p className="text-slate-400 mb-2.5 font-medium border-b border-white/5 pb-2">{label}</p>
      {filteredPayload.map((p) => {
        const fund = funds?.find((f) => f.code === p.dataKey);
        if (!fund) return null;
        const actualNav = p.payload?.[`${p.dataKey}_nav`];
        return (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-2 last:mb-0">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
              <span className="text-slate-300 truncate max-w-[120px]">{fund?.short || p.name}</span>
              {fund?.isBenchmark && <span className="text-[9px] bg-slate-700 px-1 rounded text-slate-500">idx</span>}
            </span>
            <div className="text-right shrink-0">
              <div className="font-bold" style={{ color: p.color }}>
                {viewMode === 'nav'
                  ? `₹${p.value?.toFixed(2)}`
                  : <span className={p.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {p.value >= 0 ? '+' : ''}{p.value?.toFixed(2)}%
                    </span>
                }
              </div>
              {viewMode === 'pct' && actualNav != null && (
                <div className="text-[10px] text-slate-500 mt-0.5">NAV ₹{actualNav.toFixed(2)}</div>
              )}
            </div>
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
              <button key={code}
                onClick={() => { if (!already) { onAdd(code, name); setQuery(''); setResults([]); setOpen(false); } }}
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
      <button onClick={() => setExpanded((v) => !v)}
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
                    <button key={fund.code} onClick={() => !added && onAdd(fund.code, fund.name, fund)}
                      disabled={added} title={fund.name}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${added ? 'opacity-40 cursor-not-allowed bg-slate-800/40 border-white/10 text-slate-500' : 'cursor-pointer hover:opacity-80'}`}
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

/* Benchmark panel — Nifty 50, Midcap 150, Next 50 */
function BenchmarkPanel({ existingCodes, onAdd }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5">
      <button onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-slate-200 text-sm">Index Benchmarks</span>
          <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5 font-semibold">Compare vs Index</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-4 pt-3 space-y-2">
          <p className="text-[11px] text-slate-600 mb-3">Add an index as a benchmark — shown as a dashed reference line in the chart.</p>
          {BENCHMARK_FUNDS.map((b) => {
            const added = existingCodes.includes(b.code);
            return (
              <div key={b.code} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.benchmarkColor }} />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{b.short}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{b.code}</p>
                  </div>
                </div>
                <button onClick={() => !added && onAdd(b.code, b.name, b)}
                  disabled={added}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${added
                    ? 'bg-slate-700/60 text-slate-500 border border-white/5 cursor-not-allowed'
                    : 'bg-violet-500/15 text-violet-400 border border-violet-500/25 hover:bg-violet-500/25 cursor-pointer'}`}>
                  {added ? '✓ Added' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Category Insights Tab ─── */
const RESEARCH_LINKS = (fundName, code) => [
  { label: 'Value Research', url: `https://www.valueresearchonline.com/funds/selector/`, icon: '📊' },
  { label: 'Moneycontrol', url: `https://www.moneycontrol.com/mutual-funds/find-fund/?searchType=scheme`, icon: '📰' },
  { label: 'AMFI Portfolio', url: 'https://www.amfiindia.com/research-information/other-data/portfolio', icon: '🏛️' },
  { label: 'Screener', url: `https://www.screener.in/`, icon: '🔍' },
];

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
        {funds.filter((f) => !f.isBenchmark).map((fund) => {
          const preset = PRESET_FUNDS.find((p) => p.code === fund.code);
          return (
            <div key={fund.code} className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-3 h-3 rounded-full shrink-0" style={{ background: fund.color }} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-100 text-sm leading-snug">{fund.short || fund.name.split(' ').slice(0, 4).join(' ')}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{fund.code}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <CategoryBadge category={preset?.category || 'Unknown'} />
                    {preset?.sector && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-white/10 text-slate-400 bg-slate-800/60">{preset.sector}</span>
                    )}
                  </div>
                  {preset && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 grid grid-cols-2 gap-1.5 text-[11px]">
                      <div><span className="text-slate-600">AMC</span><br /><span className="text-slate-300">{preset.amc}</span></div>
                      <div><span className="text-slate-600">Cap Type</span><br /><span className="text-slate-300">{preset.capType}</span></div>
                    </div>
                  )}
                  {/* Research links */}
                  <div className="mt-2.5 pt-2.5 border-t border-white/5">
                    <p className="text-[10px] text-slate-600 mb-1.5">View Holdings →</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'VRO', url: `https://www.valueresearchonline.com/funds/selector/` },
                        { label: 'AMFI', url: 'https://www.amfiindia.com/research-information/other-data/portfolio' },
                        { label: 'Screener', url: 'https://www.screener.in/' },
                      ].map((link) => (
                        <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors border border-white/5">
                          {link.label} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Holdings note */}
      <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-200 mb-1">About Stock Holdings Data</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              SEBI mandates all mutual funds to disclose their full portfolio (every stock held) <strong className="text-slate-300">monthly</strong>, by the 10th of the following month.
              This data is published on individual AMC websites and consolidated by AMFI.
              Visit <strong className="text-slate-300">Value Research Online</strong>, <strong className="text-slate-300">Morningstar India</strong>,
              or <strong className="text-slate-300">Screener.in</strong> for each fund's latest holdings — they parse the AMFI disclosures automatically.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { label: 'Value Research Online', url: 'https://www.valueresearchonline.com/funds/selector/' },
                { label: 'Morningstar India', url: 'https://www.morningstar.in/funds/' },
                { label: 'Screener.in (ETFs)', url: 'https://www.screener.in/' },
                { label: 'AMFI Portfolio', url: 'https://www.amfiindia.com/research-information/other-data/portfolio' },
              ].map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
                  {link.label} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {catCounts.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-bold text-slate-200 mb-4">Category Distribution</h3>
          <div className="space-y-3">
            {catCounts.map(([cat, count]) => {
              const meta = CATEGORY_META[cat] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
              const pct = (count / funds.filter((f) => !f.isBenchmark).length) * 100;
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
  const activeFunds = funds.filter((f) => !f.isBenchmark);
  if (activeFunds.length < 2) {
    return <div className="text-center py-12 text-slate-500 text-sm">Add at least 2 non-benchmark funds to see overlap analysis.</div>;
  }
  const labels = activeFunds.map((f) => {
    const preset = PRESET_FUNDS.find((p) => p.code === f.code);
    return { ...f, short: preset?.short || f.code, preset };
  });
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 text-xs text-slate-500 bg-slate-800/40 rounded-xl px-4 py-3 border border-white/5">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-600" />
        <p>Overlap estimated from category, market cap type & sector. For actual stock-level overlap, check each fund's monthly holdings on <a href="https://www.valueresearchonline.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Value Research Online</a>.</p>
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
                      {isSelf ? <span className="text-slate-600">—</span> : (
                        <span className="inline-block px-2 py-1 rounded-lg font-semibold" style={{ background: bg, color: text }}>
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
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(244,63,94,0.25)' }} /> <span className="text-rose-400">≥70%</span> High overlap</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(245,158,11,0.2)' }} /> <span className="text-amber-400">40–69%</span> Moderate</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(99,102,241,0.15)' }} /> <span className="text-indigo-300">20–39%</span> Low</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.12)' }} /> <span className="text-emerald-400">&lt;20%</span> Very low</div>
      </div>
    </div>
  );
}

/* ─── Top Performers Tab ─── */
const PERF_TERMS = [
  { label: '1Y', days: 365 },
  { label: '3Y', days: 1095 },
  { label: '5Y', days: 1825 },
];
const CAP_FILTERS = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'Multi Cap', 'Hybrid', 'Debt'];

function TopPerformers({ existingCodes, onAddFund }) {
  const [navCache, setNavCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ done: 0, total: 0 });
  const [selectedTerm, setSelectedTerm] = useState('1Y');
  const [capFilter, setCapFilter] = useState('All');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const fetchAll = async () => {
      setLoading(true);
      setLoadProgress({ done: 0, total: PRESET_FUNDS.length });
      const newCache = {};
      const chunkSize = 5;
      for (let i = 0; i < PRESET_FUNDS.length; i += chunkSize) {
        const chunk = PRESET_FUNDS.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (fund) => {
          try {
            const res = await fetch(`${API_BASE}/historical/${fund.code}`);
            const data = await res.json();
            if (!data.error && Array.isArray(data.data)) newCache[fund.code] = data.data;
          } catch { /* skip */ }
          setLoadProgress((p) => ({ ...p, done: p.done + 1 }));
        }));
      }
      setNavCache({ ...newCache });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const termDays = PERF_TERMS.find((t) => t.label === selectedTerm)?.days || 365;
  const fromDate = daysAgoStr(termDays);
  const toDate = todayStr();

  const rankings = useMemo(() => {
    return PRESET_FUNDS
      .filter((f) => capFilter === 'All' || f.capType === capFilter)
      .map((fund) => {
        const navHistory = navCache[fund.code];
        if (!navHistory?.length) return null;
        const metrics = computeMetrics(navHistory, fromDate, toDate);
        const risk = computeRiskMetrics(navHistory, fromDate, toDate);
        if (!metrics) return null;
        return { ...fund, metrics, risk };
      })
      .filter(Boolean)
      .sort((a, b) => b.metrics.returnPct - a.metrics.returnPct);
  }, [navCache, fromDate, toDate, capFilter]);

  if (loading) {
    const pct = loadProgress.total > 0 ? Math.round((loadProgress.done / loadProgress.total) * 100) : 0;
    return (
      <div className="py-12 flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="#3b82f6" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
              className="transition-all duration-300" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-400">{pct}%</span>
        </div>
        <p className="text-sm text-slate-400">Fetching NAV data… {loadProgress.done}/{loadProgress.total} funds</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-white/5">
          {PERF_TERMS.map(({ label }) => (
            <button key={label} onClick={() => setSelectedTerm(label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTerm === label ? 'bg-amber-500/90 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
              {label} Return
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CAP_FILTERS.map((cap) => (
            <button key={cap} onClick={() => setCapFilter(cap)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${capFilter === cap ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'border-white/10 text-slate-500 hover:text-slate-300 bg-slate-800/40'}`}>{cap}</button>
          ))}
        </div>
      </div>
      {!rankings.length ? (
        <div className="text-center py-10 text-slate-500 text-sm">No data or no funds match this filter.</div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-800/40">
                  <th className="px-4 py-3 w-10 text-center">Rank</th>
                  <th className="px-4 py-3">Fund</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">NAV</th>
                  <th className="px-4 py-3 text-right">{selectedTerm} Return</th>
                  {selectedTerm !== '1Y' && <th className="px-4 py-3 text-right">CAGR</th>}
                  <th className="px-4 py-3 text-right">Vol.</th>
                  <th className="px-4 py-3 text-right">Sharpe</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rankings.map((fund, idx) => {
                  const isPos = fund.metrics.returnPct >= 0;
                  const alreadyAdded = existingCodes.includes(fund.code);
                  const medalColors = ['#fbbf24', '#94a3b8', '#cd7c2e'];
                  return (
                    <tr key={fund.code} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5 text-center">
                        {idx < 3 ? <Award className="w-4 h-4 mx-auto" style={{ color: medalColors[idx] }} />
                          : <span className="text-slate-600 font-mono">#{idx + 1}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-100">{fund.short}</p>
                        <p className="text-[10px] text-slate-600 font-mono mt-0.5">{fund.code} · {fund.amc}</p>
                      </td>
                      <td className="px-4 py-3.5"><CategoryBadge category={fund.category} /></td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-bold text-slate-100">₹{fund.metrics.endNav.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">was ₹{fund.metrics.startNav.toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded-lg ${isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPos ? '+' : ''}{fund.metrics.returnPct.toFixed(2)}%
                        </span>
                      </td>
                      {selectedTerm !== '1Y' && (
                        <td className="px-4 py-3.5 text-right">
                          {fund.metrics.cagr != null
                            ? <span className={`font-semibold ${fund.metrics.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fund.metrics.cagr >= 0 ? '+' : ''}{fund.metrics.cagr.toFixed(2)}% p.a.</span>
                            : '—'}
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-right text-slate-400">
                        {fund.risk ? `${fund.risk.annualVol.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {fund.risk?.sharpe != null ? (
                          <span className={`font-semibold ${fund.risk.sharpe > 1 ? 'text-emerald-400' : fund.risk.sharpe > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {fund.risk.sharpe.toFixed(2)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {alreadyAdded ? (
                          <span className="text-[11px] text-slate-600 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-white/5">In Chart</span>
                        ) : (
                          <button onClick={() => onAddFund(fund.code, fund.name, fund)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors">
                            <Plus className="w-3 h-3" /> Benchmark
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-600 px-1">
        Sharpe &gt;1 = excellent · 0–1 = acceptable · &lt;0 = underperforming risk-free rate (6.5%)
      </p>
    </div>
  );
}

/* ─── SIP Calculator Tab ─── */
function SIPCalculator({ funds, fromDate, toDate }) {
  const [sipAmount, setSipAmount] = useState(5000);
  const activeFunds = funds.filter((f) => !f.isBenchmark);

  const results = useMemo(() => {
    return activeFunds.map((fund) => {
      const sip = computeSIP(fund.navHistory, fromDate, toDate, sipAmount);
      return { ...fund, sip };
    }).filter((f) => f.sip);
  }, [activeFunds, fromDate, toDate, sipAmount]);

  if (!activeFunds.length) {
    return <div className="text-center py-12 text-slate-500 text-sm">Add funds to the chart first.</div>;
  }

  const best = results.reduce((acc, f) => (!acc || (f.sip?.absoluteReturn > acc.sip?.absoluteReturn) ? f : acc), null);

  return (
    <div className="space-y-5">
      {/* SIP amount input */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-300">Monthly SIP</label>
          <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 focus-within:border-blue-500/50 transition-colors">
            <span className="text-slate-400 text-sm font-bold">₹</span>
            <input
              type="number" min={500} max={1000000} step={500}
              value={sipAmount}
              onChange={(e) => setSipAmount(Math.max(500, parseInt(e.target.value) || 500))}
              className="bg-transparent outline-none text-sm text-white w-24 font-bold"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[1000, 5000, 10000, 25000, 50000].map((amt) => (
            <button key={amt} onClick={() => setSipAmount(amt)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${sipAmount === amt ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'border-white/10 text-slate-500 hover:text-slate-300 bg-slate-800/40'}`}>
              ₹{(amt / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 text-xs text-slate-500 bg-slate-800/40 rounded-xl px-4 py-3 border border-white/5">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-600" />
        <p>Simulates a ₹{sipAmount.toLocaleString('en-IN')} SIP invested on the 1st of each month within the selected date range.</p>
      </div>

      {!results.length ? (
        <div className="text-center py-8 text-slate-500 text-sm">Not enough NAV data for the selected range.</div>
      ) : (
        <>
          {/* Results table */}
          <div className="glass rounded-2xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-800/40">
                    <th className="px-5 py-3">Fund</th>
                    <th className="px-5 py-3 text-right">SIP Months</th>
                    <th className="px-5 py-3 text-right">Total Invested</th>
                    <th className="px-5 py-3 text-right">Current Value</th>
                    <th className="px-5 py-3 text-right">Gain / Loss</th>
                    <th className="px-5 py-3 text-right">Approx. XIRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.sort((a, b) => (b.sip?.absoluteReturn ?? -Infinity) - (a.sip?.absoluteReturn ?? -Infinity)).map((fund) => {
                    const s = fund.sip;
                    const isPos = s.absoluteReturn >= 0;
                    const isBest = fund.code === best?.code;
                    return (
                      <tr key={fund.code} className={`hover:bg-white/[0.02] transition-colors ${isBest ? 'bg-emerald-500/5' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: fund.color }} />
                            <div>
                              <p className="font-semibold text-slate-100 leading-snug">{fund.short}</p>
                              {isBest && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 rounded-full">Best SIP Return</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-slate-400">{s.monthCount}m</td>
                        <td className="px-5 py-4 text-right font-medium text-slate-300">₹{s.totalInvested.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4 text-right font-bold text-slate-100 text-sm">₹{Math.round(s.currentValue).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4 text-right">
                          <div>
                            <span className={`font-bold text-sm ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPos ? '+' : ''}₹{Math.round(s.currentValue - s.totalInvested).toLocaleString('en-IN')}
                            </span>
                            <div className={`text-[11px] mt-0.5 ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isPos ? '+' : ''}{s.absoluteReturn.toFixed(2)}%
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {s.xirr != null ? (
                            <span className={`font-bold ${s.xirr >= 12 ? 'text-emerald-400' : s.xirr >= 8 ? 'text-amber-400' : s.xirr >= 0 ? 'text-slate-300' : 'text-rose-400'}`}>
                              {s.xirr >= 0 ? '+' : ''}{s.xirr.toFixed(2)}% p.a.
                            </span>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 px-1">XIRR is approximated as annualized CAGR on total invested vs current value. Actual XIRR considers monthly cashflow timing.</p>
        </>
      )}
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
  const [viewMode, setViewMode] = useState('pct');

  const applyDates = () => { setFromDate(pendingFrom); setToDate(pendingTo); };
  const setQuickRange = (days) => {
    const from = daysAgoStr(days); const to = todayStr();
    setPendingFrom(from); setPendingTo(to);
    setFromDate(from); setToDate(to);
  };

  const addFund = useCallback(async (code, name, presetMeta) => {
    if (funds.length >= 8) return;
    if (funds.some((f) => f.code === code)) return;
    const bm = BENCHMARK_FUNDS.find((b) => b.code === code);
    const color = bm ? bm.benchmarkColor : FUND_COLORS[funds.filter((f) => !f.isBenchmark).length % FUND_COLORS.length];
    const preset = presetMeta || PRESET_FUNDS.find((p) => p.code === code);
    const isBenchmark = bm?.isBenchmark || false;
    const placeholder = {
      code, name,
      short: bm?.short || preset?.short || name.split(' ').slice(0, 3).join(' '),
      color, loading: true, error: null, navHistory: [], isBenchmark,
    };
    setFunds((prev) => [...prev, placeholder]);
    try {
      const res = await fetch(`${API_BASE}/historical/${code}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const navHistory = Array.isArray(data.data) ? data.data : [];
      const fundName = data.scheme_name || name;
      setFunds((prev) => prev.map((f) => f.code === code
        ? { ...f, name: fundName, short: bm?.short || preset?.short || fundName.split(' ').slice(0, 4).join(' '), navHistory, loading: false }
        : f));
    } catch (err) {
      setFunds((prev) => prev.map((f) => f.code === code
        ? { ...f, loading: false, error: err.message || 'Failed to fetch' } : f));
    }
  }, [funds]);

  const removeFund = useCallback((code) => {
    setFunds((prev) => {
      const filtered = prev.filter((f) => f.code !== code);
      let colorIdx = 0;
      return filtered.map((f) => {
        if (f.isBenchmark) return f;
        const c = { ...f, color: FUND_COLORS[colorIdx % FUND_COLORS.length] };
        colorIdx++;
        return c;
      });
    });
  }, []);

  const readyFunds = useMemo(() => funds.filter((f) => !f.loading && !f.error && f.navHistory.length), [funds]);
  const chartData = useMemo(() => buildChartData(readyFunds, fromDate, toDate, viewMode), [readyFunds, fromDate, toDate, viewMode]);

  const tickFormatter = useCallback((dateStr) => {
    const d = parseNavDate(dateStr);
    return `${d.toLocaleString('en-IN', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
  }, []);

  const yAxisFormatter = useCallback((v) => {
    if (viewMode === 'nav') return `₹${v.toFixed(0)}`;
    return `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`;
  }, [viewMode]);

  const TABS = [
    { id: 'chart', label: 'Performance Chart', icon: BarChart2 },
    { id: 'sip', label: 'SIP Calculator', icon: Calculator },
    { id: 'category', label: 'Fund Insights', icon: Tag },
    { id: 'overlap', label: 'Fund Overlap', icon: Layers },
    { id: 'top', label: 'Top Performers', icon: Trophy },
  ];

  const showContent = readyFunds.length > 0 || activeTab === 'top';

  return (
    <div className="space-y-5 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/15 rounded-xl border border-blue-500/25">
          <BarChart2 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Fund Comparator</h1>
          <p className="text-slate-500 text-xs mt-0.5">Real NAV · % change · SIP calculator · Risk metrics · Index benchmarks · Top performers</p>
        </div>
      </header>

      {/* Fund list + Benchmarks */}
      <PresetPanel existingCodes={funds.map((f) => f.code)} onAdd={addFund} />
      <BenchmarkPanel existingCodes={funds.map((f) => f.code)} onAdd={addFund} />

      {/* Active fund pills + search */}
      <div className="glass rounded-2xl p-5 space-y-4 border border-white/5">
        <div className="flex flex-wrap items-center gap-2.5">
          {funds.map((fund) => (
            <div key={fund.code}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${fund.isBenchmark ? 'border-dashed' : ''}`}
              style={{ background: `${fund.color}18`, borderColor: `${fund.color}40`, color: fund.color }}>
              {fund.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : fund.error ? <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                : <span className={`w-2 h-2 rounded-full shrink-0 ${fund.isBenchmark ? 'opacity-60' : ''}`} style={{ background: fund.color }} />}
              <span className="max-w-[160px] truncate text-slate-200 text-xs">{fund.short}</span>
              {fund.isBenchmark && <span className="text-[9px] bg-slate-700/60 px-1 rounded text-slate-500">idx</span>}
              <button onClick={() => removeFund(fund.code)} className="ml-0.5 text-slate-500 hover:text-rose-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {funds.length === 0 && <p className="text-xs text-slate-600">Add funds from the panel above or search below</p>}
          {funds.length < 8 && <FundSearchInput onAdd={addFund} existingCodes={funds.map((f) => f.code)} />}
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
            <input type="date" value={pendingFrom} max={pendingTo} onChange={(e) => setPendingFrom(e.target.value)}
              className="bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" />
            <span className="text-slate-600 text-sm">to</span>
            <input type="date" value={pendingTo} min={pendingFrom} max={todayStr()} onChange={(e) => setPendingTo(e.target.value)}
              className="bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" />
            <button onClick={applyDates}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
              Apply
            </button>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-white/5">
            {QUICK_RANGES.map(({ label, days }) => (
              <button key={label} onClick={() => setQuickRange(days)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${fromDate === daysAgoStr(days) && toDate === todayStr() ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content area */}
      {showContent && (
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="flex items-center gap-0.5 px-4 pt-4 border-b border-white/5 pb-0 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 ${
                  activeTab === id
                    ? id === 'top' ? 'text-amber-400 border-amber-500 bg-amber-500/5'
                      : id === 'sip' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5'
                      : 'text-blue-400 border-blue-500 bg-blue-500/5'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                {id === 'top' && <span className="hidden sm:inline ml-1 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">NEW</span>}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Performance Chart ── */}
            {activeTab === 'chart' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-slate-100">
                      {viewMode === 'pct' ? '% Change from Period Start' : 'Real NAV (₹)'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {viewMode === 'pct' ? 'All funds start at 0% — equal comparison baseline' : 'Actual NAV values — absolute price tracking'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-white/5 shrink-0">
                    <button onClick={() => setViewMode('pct')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'pct' ? 'bg-emerald-600/80 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                      <Percent className="w-3 h-3" /> % Change
                    </button>
                    <button onClick={() => setViewMode('nav')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'nav' ? 'bg-blue-600/80 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                      <DollarSign className="w-3 h-3" /> Real NAV
                    </button>
                  </div>
                </div>
                {chartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No NAV data for selected range</div>
                ) : (
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 16, left: 4, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={tickFormatter}
                          tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                          tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                          tickFormatter={yAxisFormatter} width={58} />
                        {viewMode === 'pct' && (
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"
                            label={{ value: '0%', fill: '#475569', fontSize: 10, position: 'insideTopLeft' }} />
                        )}
                        <Tooltip content={<CustomTooltip funds={readyFunds} viewMode={viewMode} />} />
                        <Legend wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
                          formatter={(value) => {
                            const f = readyFunds.find((x) => x.code === value);
                            return <span style={{ color: f?.isBenchmark ? '#94a3b8' : '#94a3b8' }}>{f?.short || value}{f?.isBenchmark ? ' (idx)' : ''}</span>;
                          }} />
                        {readyFunds.map((fund) => (
                          <Line key={fund.code} type="monotone" dataKey={fund.code}
                            stroke={fund.color} strokeWidth={fund.isBenchmark ? 1.5 : 2}
                            strokeDasharray={fund.isBenchmark ? '6 3' : undefined}
                            dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {readyFunds.some((f) => f.isBenchmark) && (
                  <p className="text-[11px] text-slate-600 flex items-center gap-1.5 px-1">
                    <span className="inline-block w-4 border-t border-dashed border-slate-600" />
                    Dashed lines = index benchmarks (Nifty 50 / Midcap 150 / Next 50)
                  </p>
                )}
              </div>
            )}

            {activeTab === 'sip' && <SIPCalculator funds={readyFunds} fromDate={fromDate} toDate={toDate} />}
            {activeTab === 'category' && <CategoryInsights funds={readyFunds} />}
            {activeTab === 'overlap' && <OverlapMatrix funds={readyFunds} />}
            {activeTab === 'top' && (
              <TopPerformers
                existingCodes={funds.map((f) => f.code)}
                onAddFund={(code, name, preset) => { addFund(code, name, preset); setActiveTab('chart'); }}
              />
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {funds.length === 0 && activeTab !== 'top' && (
        <div className="glass rounded-2xl py-12 flex flex-col items-center justify-center gap-4 text-center border border-white/5">
          <div className="p-4 bg-slate-800/60 rounded-2xl">
            <BarChart2 className="w-10 h-10 text-slate-600" />
          </div>
          <div>
            <p className="text-slate-300 font-semibold mb-1">No funds selected</p>
            <p className="text-slate-500 text-sm mb-3">Click any fund above or explore top performers</p>
            <button onClick={() => setActiveTab('top')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-xl text-sm font-semibold hover:bg-amber-500/25 transition-colors">
              <Trophy className="w-4 h-4" /> View Top Performers
            </button>
          </div>
        </div>
      )}

      {/* Metrics table with risk columns */}
      {readyFunds.filter((f) => !f.isBenchmark).length > 0 && (
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
            <Activity className="w-4 h-4 text-slate-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">Metrics — Real NAV + Risk</h2>
              <p className="text-xs text-slate-500 mt-0.5">{fromDate} → {toDate} · Risk-free rate 6.5% p.a.</p>
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
                  <th className="px-5 py-3 font-semibold text-right">% Return</th>
                  <th className="px-5 py-3 font-semibold text-right">CAGR</th>
                  <th className="px-5 py-3 font-semibold text-right">Volatility</th>
                  <th className="px-5 py-3 font-semibold text-right">Sharpe</th>
                  <th className="px-5 py-3 font-semibold text-right">Max DD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {readyFunds.filter((f) => !f.isBenchmark).map((fund) => {
                  const m = computeMetrics(fund.navHistory, fromDate, toDate);
                  const r = computeRiskMetrics(fund.navHistory, fromDate, toDate);
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
                      <td className="px-5 py-4 text-right text-slate-400 text-xs">₹{m.startNav.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-100 text-sm">₹{m.endNav.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-xs ${isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPos ? '+' : ''}{m.returnPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-xs">
                        {m.cagr != null
                          ? <span className={`font-semibold ${m.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{m.cagr >= 0 ? '+' : ''}{m.cagr.toFixed(2)}% p.a.</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right text-xs">
                        {r ? <span className="text-slate-300 font-medium">{r.annualVol.toFixed(1)}%</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right text-xs">
                        {r?.sharpe != null ? (
                          <span className={`font-bold ${r.sharpe > 1 ? 'text-emerald-400' : r.sharpe > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {r.sharpe.toFixed(2)}
                          </span>
                        ) : <span className="text-slate-600">—</span>}
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
          <div className="px-5 py-3 border-t border-white/5 flex items-center gap-6 text-[11px] text-slate-600">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Sharpe &gt;1 = excellent risk-adjusted returns</span>
            <span>Volatility = annualized std dev of daily returns</span>
            <span>Max DD = max peak-to-trough drawdown</span>
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
