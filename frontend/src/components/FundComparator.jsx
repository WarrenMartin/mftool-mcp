import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  Search, X, Plus, TrendingUp, TrendingDown, Activity,
  Info, BarChart2, AlertCircle, Loader2,
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const FUND_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
];

const TIMELINES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '3Y', days: 1095 },
  { label: '5Y', days: 1825 },
  { label: 'Max', days: Infinity },
];

// Parse DD-MM-YYYY → Date object
function parseNavDate(str) {
  const [d, m, y] = str.split('-');
  return new Date(+y, +m - 1, +d);
}

function filterByTimeline(navHistory, days) {
  if (days === Infinity) return navHistory;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return navHistory.filter((entry) => parseNavDate(entry.date) >= cutoff);
}

// Build unified chart data: normalize each fund to base 100
function buildChartData(funds, activePeriodDays) {
  if (!funds.length) return [];

  // Collect all dates across all funds within the timeline
  const dateSet = new Set();
  const fundSlices = funds.map((f) => {
    const slice = filterByTimeline([...(f.navHistory || [])].reverse(), activePeriodDays);
    slice.forEach((e) => dateSet.add(e.date));
    return { ...f, slice };
  });

  if (!dateSet.size) return [];

  // Sort dates ascending (they're DD-MM-YYYY from mftool, sorted desc originally)
  const sortedDates = Array.from(dateSet).sort(
    (a, b) => parseNavDate(a) - parseNavDate(b),
  );

  // For each fund build a date→nav map
  const fundMaps = fundSlices.map((f) => {
    const map = {};
    f.slice.forEach((e) => { map[e.date] = parseFloat(e.nav); });
    return map;
  });

  // Find base NAV (first date each fund has data) for normalization
  const bases = fundSlices.map((f, i) => {
    const firstDate = sortedDates.find((d) => fundMaps[i][d] !== undefined);
    return firstDate ? fundMaps[i][firstDate] : null;
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

function computeMetrics(navHistory, days) {
  const slice = filterByTimeline([...(navHistory || [])].reverse(), days);
  if (!slice.length) return null;

  const navs = slice.map((e) => parseFloat(e.nav));
  const startNav = navs[0];
  const endNav = navs[navs.length - 1];
  const minNav = Math.min(...navs);
  const maxNav = Math.max(...navs);
  const returnPct = ((endNav - startNav) / startNav) * 100;

  // CAGR for >1Y periods
  const daysActual = (parseNavDate(slice[slice.length - 1].date) - parseNavDate(slice[0].date)) / 86400000;
  const years = daysActual / 365;
  const cagr = years >= 1 ? (Math.pow(endNav / startNav, 1 / years) - 1) * 100 : null;

  return { startNav, endNav, minNav, maxNav, returnPct, cagr, daysActual };
}

/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs shadow-xl min-w-[180px]">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300 max-w-[120px] truncate">{p.name}</span>
          </span>
          <span className="font-bold text-white">{p.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Fund Search Input ── */
function FundSearchInput({ onAdd, existingCodes, disabled }) {
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
      const entries = data.results ? Object.entries(data.results).slice(0, 10) : [];
      setResults(entries);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const handleSelect = (code, name) => {
    onAdd(code, name);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (!wrapperRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
        {searching
          ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
          : <Search className="w-4 h-4 text-slate-400 shrink-0" />}
        <input
          className="bg-transparent outline-none text-sm text-white placeholder-slate-500 w-64"
          placeholder="Search by fund name…"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length && setOpen(true)}
          disabled={disabled}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-[400px] glass rounded-xl overflow-hidden shadow-2xl z-50 border border-white/10">
          {results.map(([code, name]) => {
            const already = existingCodes.includes(code);
            return (
              <button
                key={code}
                onClick={() => !already && handleSelect(code, name)}
                disabled={already}
                className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors border-b border-white/5 last:border-b-0 ${already ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}`}
              >
                <span className="text-slate-200 leading-snug pr-4">{name}</span>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 bg-slate-700/60 rounded px-1.5 py-0.5">{code}</span>
              </button>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && !searching && results.length === 0 && (
        <div className="absolute top-full mt-2 w-[400px] glass rounded-xl px-4 py-4 shadow-2xl z-50 text-center">
          <AlertCircle className="w-5 h-5 text-slate-500 mx-auto mb-1" />
          <p className="text-sm text-slate-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function FundComparator() {
  const [funds, setFunds] = useState([]);
  const [timeline, setTimeline] = useState('1Y');

  const addFund = useCallback(async (code, name) => {
    if (funds.length >= 6) return;
    if (funds.some((f) => f.code === code)) return;

    const color = FUND_COLORS[funds.length % FUND_COLORS.length];
    const placeholder = { code, name, color, loading: true, error: null, navHistory: [], currentNav: null };
    setFunds((prev) => [...prev, placeholder]);

    try {
      const res = await fetch(`${API_BASE}/historical/${code}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const navHistory = Array.isArray(data.data) ? data.data : [];
      const currentNav = navHistory.length ? parseFloat(navHistory[0].nav) : null;
      const fundName = data.scheme_name || name;

      setFunds((prev) =>
        prev.map((f) =>
          f.code === code ? { ...f, name: fundName, navHistory, currentNav, loading: false } : f
        )
      );
    } catch (err) {
      setFunds((prev) =>
        prev.map((f) =>
          f.code === code ? { ...f, loading: false, error: err.message || 'Failed to fetch data' } : f
        )
      );
    }
  }, [funds]);

  const removeFund = useCallback((code) => {
    setFunds((prev) => {
      const remaining = prev.filter((f) => f.code !== code);
      // Re-assign colors by position
      return remaining.map((f, i) => ({ ...f, color: FUND_COLORS[i % FUND_COLORS.length] }));
    });
  }, []);

  const activeDays = TIMELINES.find((t) => t.label === timeline)?.days ?? 365;
  const chartData = buildChartData(
    funds.filter((f) => !f.loading && !f.error && f.navHistory.length),
    activeDays,
  );

  const readyFunds = funds.filter((f) => !f.loading && !f.error && f.navHistory.length);

  /* ── X-axis tick formatter: show only a few ticks ── */
  const tickFormatter = (dateStr) => {
    const d = parseNavDate(dateStr);
    return `${d.toLocaleString('en-IN', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-blue-500/15 rounded-xl border border-blue-500/25">
            <BarChart2 className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Fund Comparator</h1>
        </div>
        <p className="text-slate-400 text-sm ml-14">Compare mutual funds side-by-side on a common timeline</p>
      </header>

      {/* Fund Pills + Search */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Fund Pills */}
          {funds.map((fund) => (
            <div
              key={fund.code}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all"
              style={{
                background: `${fund.color}18`,
                borderColor: `${fund.color}50`,
                color: fund.color,
              }}
            >
              {fund.loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : fund.error ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ background: fund.color }}
                />
              )}
              <span className="max-w-[200px] truncate text-slate-200">{fund.name}</span>
              <span className="font-mono text-[10px] text-slate-500">{fund.code}</span>
              <button
                onClick={() => removeFund(fund.code)}
                className="ml-1 text-slate-500 hover:text-rose-400 transition-colors"
                aria-label={`Remove ${fund.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Search */}
          {funds.length < 6 && (
            <FundSearchInput
              onAdd={addFund}
              existingCodes={funds.map((f) => f.code)}
              disabled={false}
            />
          )}

          {funds.length >= 6 && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Up to 6 funds can be compared
            </p>
          )}
        </div>

        {/* Error banners */}
        {funds.filter((f) => f.error).map((f) => (
          <div key={f.code} className="mt-3 flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span><strong>{f.code}</strong>: {f.error}. Check that api_proxy.py is running.</span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {funds.length === 0 && (
        <div className="glass rounded-2xl py-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="p-4 bg-slate-800/60 rounded-2xl">
            <BarChart2 className="w-10 h-10 text-slate-600" />
          </div>
          <div>
            <p className="text-slate-300 font-semibold mb-1">No funds added yet</p>
            <p className="text-slate-500 text-sm">Search for a fund above to start comparing</p>
            <p className="text-slate-600 text-xs mt-3">Try: "Aditya Birla Transportation", "Axis Mid Cap", "SBI Bluechip"</p>
          </div>
        </div>
      )}

      {/* Chart + Timeline */}
      {readyFunds.length > 0 && (
        <div className="glass rounded-2xl p-6 space-y-5">
          {/* Timeline selector */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-100">Normalized Performance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Base = ₹100 at start of period</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-white/5">
              {TIMELINES.map(({ label }) => (
                <button
                  key={label}
                  onClick={() => setTimeline(label)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeline === label
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[340px] w-full -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={tickFormatter}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                  width={48}
                />
                <ReferenceLine y={100} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" label={{ value: '100', fill: '#475569', fontSize: 10, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
                  formatter={(value) => {
                    const fund = readyFunds.find((f) => f.code === value);
                    return <span style={{ color: '#94a3b8' }}>{fund ? fund.name.split(' ').slice(0, 4).join(' ') : value}</span>;
                  }}
                />
                {readyFunds.map((fund) => (
                  <Line
                    key={fund.code}
                    type="monotone"
                    dataKey={fund.code}
                    stroke={fund.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Metrics Table */}
      {readyFunds.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-base font-bold text-slate-100">Comparison Metrics</h2>
            <p className="text-xs text-slate-500 mt-0.5">For selected period: {timeline}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Fund</th>
                  <th className="px-6 py-3 font-semibold text-right">Start NAV</th>
                  <th className="px-6 py-3 font-semibold text-right">Current NAV</th>
                  <th className="px-6 py-3 font-semibold text-right">Return ({timeline})</th>
                  <th className="px-6 py-3 font-semibold text-right">CAGR</th>
                  <th className="px-6 py-3 font-semibold text-right">Min NAV</th>
                  <th className="px-6 py-3 font-semibold text-right">Max NAV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {readyFunds.map((fund) => {
                  const m = computeMetrics(fund.navHistory, activeDays);
                  if (!m) return null;
                  const isPositive = m.returnPct >= 0;
                  return (
                    <tr key={fund.code} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="inline-block w-3 h-3 rounded-full shrink-0"
                            style={{ background: fund.color }}
                          />
                          <div>
                            <p className="font-semibold text-slate-100 leading-snug">{fund.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{fund.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-300">
                        ₹{m.startNav.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-100">
                        ₹{m.endNav.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-xs ${
                            isPositive
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{m.returnPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {m.cagr !== null ? (
                          <span
                            className={`font-semibold text-xs ${m.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                          >
                            {m.cagr >= 0 ? '+' : ''}{m.cagr.toFixed(2)}% p.a.
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 font-medium">
                        ₹{m.minNav.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 font-medium">
                        ₹{m.maxNav.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading skeletons for funds being fetched */}
      {funds.filter((f) => f.loading).length > 0 && (
        <div className="flex items-center gap-3 text-sm text-slate-500 px-1">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Fetching historical NAV data…</span>
        </div>
      )}
    </div>
  );
}
