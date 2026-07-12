import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  ShieldCheck, ShieldAlert, ScanLine, Lock, Search,
  FolderLock, Activity, Radar as RadarIcon,
} from "lucide-react";

const API_BASE = "http://localhost:8000";

const FAMILY_COLORS = {
  benign: "#5EEAD4",
  virus: "#F0B429",
  worm: "#F0B429",
  trojan: "#E5484D",
  ransomware: "#E5484D",
  spyware: "#E5484D",
  rootkit: "#E5484D",
  adware: "#F0B429",
};

function RadarSweep({ live }) {
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#232B45" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#232B45" strokeWidth="1" />
        <circle cx="50" cy="50" r="14" fill="none" stroke="#232B45" strokeWidth="1" />
        <line x1="4" y1="50" x2="96" y2="50" stroke="#232B45" strokeWidth="1" />
        <line x1="50" y1="4" x2="50" y2="96" stroke="#232B45" strokeWidth="1" />
        {live && (
          <g style={{ transformOrigin: "50px 50px", animation: "spin 3s linear infinite" }}>
            <defs>
              <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0" />
                <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path d="M 50 50 L 50 4 A 46 46 0 0 1 88 27 Z" fill="url(#sweepGrad)" />
          </g>
        )}
        <circle cx="50" cy="50" r="3" fill={live ? "#5EEAD4" : "#475569"} />
      </svg>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatCard({ label, value, Icon, accent, glow }) {
  return (
    <div className={`bg-console-panel border border-console-border rounded-lg p-4 flex-1 min-w-[150px] relative overflow-hidden ${glow ? "shadow-[0_0_20px_-8px_var(--tw-shadow-color)]" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1">
            {label}
          </div>
          <div className={`text-3xl font-mono font-bold ${accent}`}>{value}</div>
        </div>
        <Icon className={`w-5 h-5 mt-0.5 ${accent} opacity-70`} strokeWidth={1.75} />
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const styles = {
    Safe: "text-signal-safe border-signal-safe/40 bg-signal-safe/10",
    Low: "text-signal-warn border-signal-warn/40 bg-signal-warn/10",
    Medium: "text-signal-warn border-signal-warn/40 bg-signal-warn/10",
    High: "text-signal-threat border-signal-threat/40 bg-signal-threat/10",
    Critical: "text-signal-threat border-signal-threat/40 bg-signal-threat/10 animate-pulse",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-mono border tracking-wide ${styles[level] || styles.Safe}`}>
      {level?.toUpperCase()}
    </span>
  );
}

function SectionHeader({ icon: Icon, children }) {
  return (
    <h2 className="text-[11px] font-mono text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      {children}
    </h2>
  );
}

export default function App() {
  const [stats, setStats] = useState(null);
  const [scans, setScans] = useState([]);
  const [quarantine, setQuarantine] = useState([]);
  const [apiOnline, setApiOnline] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("scans");
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAll = async () => {
    try {
      const [statsRes, scansRes, quarantineRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/scans?limit=200`),
        fetch(`${API_BASE}/quarantine`),
      ]);
      setStats(await statsRes.json());
      setScans((await scansRes.json()).scans || []);
      setQuarantine((await quarantineRes.json()).quarantine || []);
      setApiOnline(true);
      setLastUpdate(new Date());
    } catch (e) {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredScans = scans.filter((s) =>
    (s.file_path || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.predicted_family || "").toLowerCase().includes(search.toLowerCase())
  );

  const pieData = stats
    ? [
        { name: "Safe", value: stats.safe_count, color: "#5EEAD4" },
        { name: "Threats", value: stats.threat_count, color: "#E5484D" },
      ]
    : [];

  const familyData = stats
    ? Object.entries(stats.family_breakdown || {}).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="min-h-screen bg-console-bg font-sans bg-[radial-gradient(ellipse_at_top,rgba(94,234,212,0.04),transparent_60%)]">
      {/* Header */}
      <header className="border-b border-console-border px-6 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 bg-console-bg/90 z-10">
        <div className="flex items-center gap-4">
          <RadarSweep live={apiOnline} />
          <div>
            <h1 className="text-xl font-mono font-bold tracking-tight text-slate-100">
              HIDS <span className="text-signal-safe">: THREAT CONSOLE</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              AI-Based Malware Detection System
              {lastUpdate && (
                <span className="text-slate-700">· synced {lastUpdate.toLocaleTimeString()}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {apiOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-safe opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOnline ? "bg-signal-safe" : "bg-slate-600"}`} />
          </span>
          <span className={`text-xs font-mono tracking-wider ${apiOnline ? "text-signal-safe" : "text-slate-500"}`}>
            {apiOnline ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {!apiOnline && (
          <div className="bg-signal-threat/10 border border-signal-threat/40 rounded-lg px-4 py-3 text-signal-threat text-sm font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            API unreachable. Make sure app.py is running (python -m uvicorn app:app --reload).
          </div>
        )}

        {/* Stat cards */}
        <div className="flex flex-wrap gap-4">
          <StatCard label="Total Scanned" value={stats?.total_scanned ?? "—"} Icon={ScanLine} accent="text-slate-200" />
          <StatCard label="Safe Files" value={stats?.safe_count ?? "—"} Icon={ShieldCheck} accent="text-signal-safe" />
          <StatCard label="Threats Detected" value={stats?.threat_count ?? "—"} Icon={ShieldAlert} accent="text-signal-threat" glow />
          <StatCard label="Quarantined" value={stats?.quarantined_count ?? "—"} Icon={FolderLock} accent="text-signal-warn" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-console-panel border border-console-border rounded-lg p-4">
            <SectionHeader icon={ShieldCheck}>Safe vs Threats</SectionHeader>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4} stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#141B2E", border: "1px solid #232B45", fontSize: 12, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-console-panel border border-console-border rounded-lg p-4">
            <SectionHeader icon={RadarIcon}>Threats by Family</SectionHeader>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={familyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2338" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11, fontFamily: "monospace" }} axisLine={{ stroke: "#232B45" }} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11, fontFamily: "monospace" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#141B2E", border: "1px solid #232B45", fontSize: 12, borderRadius: 6 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" fill="#E5484D" radius={[3, 3, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-console-border">
          {[
            { key: "scans", label: "Scan History", Icon: ScanLine },
            { key: "quarantine", label: `Quarantine (${quarantine.length})`, Icon: Lock },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === key
                  ? "border-signal-safe text-signal-safe"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === "scans" && (
          <div className="bg-console-panel border border-console-border rounded-lg overflow-hidden">
            <div className="p-3 border-b border-console-border relative">
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-6 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by file path or family..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-console-bg border border-console-border rounded pl-8 pr-3 py-1.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-signal-safe/50"
              />
            </div>
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="text-[10px] font-mono text-slate-500 uppercase tracking-wider sticky top-0 bg-console-panel">
                  <tr>
                    <th className="text-left px-4 py-2">Time</th>
                    <th className="text-left px-4 py-2">File</th>
                    <th className="text-left px-4 py-2">Family</th>
                    <th className="text-left px-4 py-2">Confidence</th>
                    <th className="text-left px-4 py-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-600 font-mono py-10 text-xs">
                        No scans yet. Drop a file into your watched folder to begin.
                      </td>
                    </tr>
                  )}
                  {filteredScans.map((s, i) => (
                    <tr key={i} className="border-t border-console-border/60 hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-slate-500 text-xs whitespace-nowrap">
                        {s.timestamp ? new Date(s.timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-300 truncate max-w-[300px]">
                        {s.file_path}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-medium" style={{ color: FAMILY_COLORS[s.predicted_family] || "#94A3B8" }}>
                        {s.predicted_family}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">
                        {s.confidence ? `${(s.confidence * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-2.5"><RiskBadge level={s.risk_level} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "quarantine" && (
          <div className="bg-console-panel border border-console-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="text-[10px] font-mono text-slate-500 uppercase tracking-wider sticky top-0 bg-console-panel">
                  <tr>
                    <th className="text-left px-4 py-2">ID</th>
                    <th className="text-left px-4 py-2">Original File</th>
                    <th className="text-left px-4 py-2">Family</th>
                    <th className="text-left px-4 py-2">Quarantined At</th>
                    <th className="text-left px-4 py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {quarantine.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-600 font-mono py-10 text-xs">
                        Quarantine is empty. No threats isolated yet.
                      </td>
                    </tr>
                  )}
                  {quarantine.map((q) => (
                    <tr key={q.quarantine_id} className="border-t border-console-border/60 hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-slate-500 text-xs">{q.quarantine_id}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300 truncate max-w-[280px]">{q.original_filename}</td>
                      <td className="px-4 py-2.5 font-mono text-signal-threat font-medium">{q.predicted_family}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500 text-xs">
                        {q.quarantine_timestamp ? new Date(q.quarantine_timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">
                        {q.confidence ? `${(q.confidence * 100).toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
