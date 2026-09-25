import { useState, useEffect, useRef } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

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

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-console-panel border border-console-border rounded-lg p-4 flex-1 min-w-[140px]">
      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-3xl font-mono font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function RiskBadge({ level }) {
  const styles = {
    Safe: "text-signal-safe border-signal-safe/40 bg-signal-safe/10",
    Low: "text-signal-warn border-signal-warn/40 bg-signal-warn/10",
    Medium: "text-signal-warn border-signal-warn/40 bg-signal-warn/10",
    High: "text-signal-threat border-signal-threat/40 bg-signal-threat/10",
    Critical: "text-signal-threat border-signal-threat/40 bg-signal-threat/10",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${styles[level] || styles.Safe}`}>
      {level}
    </span>
  );
}

export default function App() {
  const [stats, setStats] = useState(null);
  const [scans, setScans] = useState([]);
  const [quarantine, setQuarantine] = useState([]);
  const [apiOnline, setApiOnline] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("scans");

  const fileInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScanClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(API_BASE + "/scan-file", { method: "POST", body: formData });
      const data = await res.json();
      setScanResult(data);
      fetchAll();
    } catch (err) {
      setScanResult({ error: "Scan failed — is the API running?" });
    }
    setScanning(false);
    e.target.value = "";
  };

  const fetchAll = async () => {
    try {
      const [statsRes, scansRes, quarantineRes] = await Promise.all([
        fetch(API_BASE + "/stats"),
        fetch(API_BASE + "/scans?limit=200"),
        fetch(API_BASE + "/quarantine"),
      ]);
      setStats(await statsRes.json());
      setScans((await scansRes.json()).scans || []);
      setQuarantine((await quarantineRes.json()).quarantine || []);
      setApiOnline(true);
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
    ? Object.entries(stats.family_breakdown || {}).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const scanResultText = scanResult
    ? (scanResult.error || (scanResult.predicted_family + " (" + (scanResult.confidence * 100).toFixed(1) + "%)"))
    : "";

  return (
    <div className="min-h-screen bg-console-bg font-sans">
      <header className="border-b border-console-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <RadarSweep live={apiOnline} />
          <div>
            <h1 className="text-lg font-mono font-bold tracking-tight text-slate-100">
              HIDS<span className="text-signal-safe">:THREAT CONSOLE</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              AI-Based Malware Detection System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            onClick={handleScanClick}
            disabled={scanning}
            className="px-3 py-1.5 rounded bg-signal-safe/10 border border-signal-safe/40 text-signal-safe text-xs font-mono hover:bg-signal-safe/20"
          >
            {scanning ? "Scanning..." : "Scan File"}
          </button>

          {scanResult && (
            <span
              className="text-xs font-mono"
              style={{ color: scanResult.is_malicious ? "#E5484D" : "#5EEAD4" }}
            >
              {scanResultText}
            </span>
          )}

          <span className="relative flex h-2.5 w-2.5">
            {apiOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-safe opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${apiOnline ? "bg-signal-safe" : "bg-slate-600"}`}></span>
          </span>
          <span className="text-xs font-mono text-slate-400">
            {apiOnline ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {!apiOnline && (
          <div className="bg-signal-threat/10 border border-signal-threat/40 rounded-lg px-4 py-3 text-signal-threat text-sm font-mono">
            API unreachable. Make sure app.py is running (python -m uvicorn app:app --reload).
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <StatCard label="Total Scanned" value={stats?.total_scanned ?? "—"} accent="text-slate-100" />
          <StatCard label="Safe Files" value={stats?.safe_count ?? "—"} accent="text-signal-safe" />
          <StatCard label="Threats Detected" value={stats?.threat_count ?? "—"} accent="text-signal-threat" />
          <StatCard label="Quarantined" value={stats?.quarantined_count ?? "—"} accent="text-signal-warn" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-console-panel border border-console-border rounded-lg p-4">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
              Safe vs Threats
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#141B2E", border: "1px solid #232B45", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-console-panel border border-console-border rounded-lg p-4">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
              Threats by Family
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={familyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232B45" />
                <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#141B2E", border: "1px solid #232B45", fontSize: 12 }} />
                <Bar dataKey="value" fill="#E5484D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex gap-2 border-b border-console-border">
          {["scans", "quarantine"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-mono uppercase tracking-wide border-b-2 transition-colors ${
                tab === t
                  ? "border-signal-safe text-signal-safe"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "scans" ? "Scan History" : `Quarantine (${quarantine.length})`}
            </button>
          ))}
        </div>

        {tab === "scans" && (
          <div className="bg-console-panel border border-console-border rounded-lg overflow-hidden">
            <div className="p-3 border-b border-console-border">
              <input
                type="text"
                placeholder="Search by file path or family..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-console-bg border border-console-border rounded px-3 py-1.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-signal-safe/50"
              />
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="text-xs font-mono text-slate-500 uppercase sticky top-0 bg-console-panel">
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
                      <td colSpan={5} className="text-center text-slate-600 font-mono py-8">
                        No scans yet. Drop a file into your watched folder, or click Scan File above.
                      </td>
                    </tr>
                  )}
                  {filteredScans.map((s, i) => (
                    <tr key={i} className="border-t border-console-border hover:bg-white/5">
                      <td className="px-4 py-2 font-mono text-slate-500 text-xs whitespace-nowrap">
                        {s.timestamp ? new Date(s.timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-300 truncate max-w-[300px]">
                        {s.file_path}
                      </td>
                      <td className="px-4 py-2 font-mono" style={{ color: FAMILY_COLORS[s.predicted_family] || "#94A3B8" }}>
                        {s.predicted_family}
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-400">
                        {s.confidence ? (s.confidence * 100).toFixed(1) + "%" : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <RiskBadge level={s.risk_level} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "quarantine" && (
          <div className="bg-console-panel border border-console-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="text-xs font-mono text-slate-500 uppercase sticky top-0 bg-console-panel">
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
                      <td colSpan={5} className="text-center text-slate-600 font-mono py-8">
                        Quarantine is empty. No threats isolated yet.
                      </td>
                    </tr>
                  )}
                  {quarantine.map((q) => (
                    <tr key={q.quarantine_id} className="border-t border-console-border hover:bg-white/5">
                      <td className="px-4 py-2 font-mono text-slate-500 text-xs">{q.quarantine_id}</td>
                      <td className="px-4 py-2 font-mono text-slate-300 truncate max-w-[280px]">
                        {q.original_filename}
                      </td>
                      <td className="px-4 py-2 font-mono text-signal-threat">{q.predicted_family}</td>
                      <td className="px-4 py-2 font-mono text-slate-500 text-xs">
                        {q.quarantine_timestamp ? new Date(q.quarantine_timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-400">
                        {q.confidence ? (q.confidence * 100).toFixed(1) + "%" : "—"}
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
