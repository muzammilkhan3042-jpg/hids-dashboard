import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const API_BASE = "http://localhost:8000";

const FAMILY_COLORS = {
  benign: "#33D6A6",
  virus: "#F5B942",
  worm: "#F5B942",
  trojan: "#FF6B6B",
  ransomware: "#FF6B6B",
  spyware: "#FF6B6B",
  rootkit: "#FF6B6B",
  adware: "#F5B942",
};

function RadarSweep({ live }) {
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#232A35" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#232A35" strokeWidth="1" />
        <circle cx="50" cy="50" r="14" fill="none" stroke="#232A35" strokeWidth="1" />
        <line x1="4" y1="50" x2="96" y2="50" stroke="#232A35" strokeWidth="1" />
        <line x1="50" y1="4" x2="50" y2="96" stroke="#232A35" strokeWidth="1" />
        {live && (
          <g style={{ transformOrigin: "50px 50px", animation: "spin 3s linear infinite" }}>
            <defs>
              <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#33D6A6" stopOpacity="0" />
                <stop offset="100%" stopColor="#33D6A6" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <path d="M 50 50 L 50 4 A 46 46 0 0 1 88 27 Z" fill="url(#sweepGrad)" />
          </g>
        )}
        <circle cx="50" cy="50" r="3" fill={live ? "#33D6A6" : "#475569"} />
      </svg>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div
      className="bg-console-panel border border-console-border rounded-lg flex-1 min-w-[180px]"
      style={{ borderLeft: `4px solid ${color}`, padding: "24px 28px" }}
    >
      <div className="text-xs font-mono text-slate-500 uppercase tracking-wider" style={{ marginBottom: "10px" }}>
        {label}
      </div>
      <div className="text-4xl font-sans font-semibold text-slate-100 tracking-tight">
        {value}
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
    Critical: "text-signal-threat border-signal-threat/40 bg-signal-threat/10",
  };
  return (
    <span className={`px-2.5 py-1 rounded text-xs font-mono border ${styles[level] || styles.Safe}`}>
      {level}
    </span>
  );
}

function ThreatBreakdown({ familyData }) {
  const sorted = [...familyData].sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...sorted.map((f) => f.value));
  return (
    <div className="bg-console-panel border border-console-border rounded-lg p-6">
      <h2 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-5">
        Threat Breakdown
      </h2>
      {sorted.length === 0 && (
        <p className="text-sm font-mono text-slate-600 py-6 text-center">
          No threats detected yet.
        </p>
      )}
      <div className="space-y-4">
        {sorted.map((f) => {
          const color = FAMILY_COLORS[f.name] || "#94A3B8";
          const pct = Math.round((f.value / max) * 100);
          return (
            <div key={f.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                  <span className="text-sm font-sans font-medium text-slate-200 capitalize">{f.name}</span>
                </div>
                <span className="text-sm font-mono text-slate-400">{f.value}</span>
              </div>
              <div className="h-2 rounded-full bg-console-bg overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
  const prevQuarantineCount = useRef(null);

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
      const newStats = await statsRes.json();
      const newQuarantine = (await quarantineRes.json()).quarantine || [];

      setStats(newStats);
      setScans((await scansRes.json()).scans || []);
      setQuarantine(newQuarantine);
      setApiOnline(true);

      const newCount = newQuarantine.length;
      if (prevQuarantineCount.current !== null && newCount > prevQuarantineCount.current) {
        const latest = newQuarantine[0];
        if ("Notification" in window && Notification.permission === "granted" && latest) {
          new Notification("Threat Quarantined", {
            body: (latest.predicted_family || "Unknown") + " detected in " + (latest.original_filename || "a file") + ".",
            icon: undefined,
          });
        }
      }
      prevQuarantineCount.current = newCount;
    } catch (e) {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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
        { name: "Safe", value: stats.safe_count, color: "#33D6A6" },
        { name: "Threats", value: stats.threat_count, color: "#FF6B6B" },
      ]
    : [];

  const familyData = stats
    ? Object.entries(stats.family_breakdown || {}).map(([name, value]) => ({ name, value }))
    : [];

  const scanResultText = scanResult
    ? (scanResult.error || (scanResult.predicted_family + " (" + (scanResult.confidence * 100).toFixed(1) + "%)"))
    : "";

  return (
    <div className="min-h-screen bg-console-bg font-sans">
      <header className="border-b border-console-border px-8 py-7 flex items-center flex-wrap" style={{ columnGap: "56px", rowGap: "20px" }}>
        <div className="flex items-center gap-5">
          <RadarSweep live={apiOnline} />
          <div>
            <h1 className="text-2xl font-sans font-semibold tracking-tight text-slate-100">
              Cyber Defense <span className="text-signal-safe">Dashboard</span>
            </h1>
            <p className="text-sm text-slate-500 font-mono mt-1">
              AI-Based Malware Detection System
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            onClick={handleScanClick}
            disabled={scanning}
            className="rounded-lg bg-console-panel border-2 border-signal-safe/40 text-signal-safe font-sans font-semibold hover:bg-signal-safe/10 transition-colors"
            style={{ padding: "14px 36px", fontSize: "16px" }}
          >
            {scanning ? "Scanning…" : "Scan File"}
          </button>

          {scanResult && (
            <span
              className="text-sm font-mono"
              style={{ color: scanResult.is_malicious ? "#FF6B6B" : "#33D6A6", marginLeft: "20px" }}
            >
              {scanResultText}
            </span>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "28px", paddingLeft: "28px", borderLeft: "2px solid #232A35" }}>
            <span className="relative flex h-2.5 w-2.5">
              {apiOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-safe opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${apiOnline ? "bg-signal-safe" : "bg-slate-600"}`}></span>
            </span>
            <span className="text-sm font-mono text-slate-500">
              {apiOnline ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </header>

      <main className="p-8 space-y-8 max-w-7xl mx-auto">
        {!apiOnline && (
          <div className="bg-signal-threat/10 border border-signal-threat/30 rounded-lg px-5 py-4 text-signal-threat text-sm font-mono">
            API unreachable. Make sure app.py is running (python -m uvicorn app:app --reload).
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          <StatCard label="Total Scanned" value={stats?.total_scanned ?? "—"} color="#64748B" />
          <StatCard label="Safe Files" value={stats?.safe_count ?? "—"} color="#33D6A6" />
          <StatCard label="Threats Detected" value={stats?.threat_count ?? "—"} color="#FF6B6B" />
          <StatCard label="Quarantined" value={stats?.quarantined_count ?? "—"} color="#F5B942" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-console-panel border border-console-border rounded-lg p-6">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">
              Safe vs Threats
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#161B22", border: "1px solid #232A35", fontSize: 13, fontFamily: "IBM Plex Mono, monospace" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ThreatBreakdown familyData={familyData} />
        </div>

        <div className="flex border-b border-console-border" style={{ gap: "12px" }}>
          {["scans", "quarantine"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-sans transition-colors ${
                tab === t
                  ? "border-signal-safe text-signal-safe"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
              style={{ padding: "16px 32px", fontSize: "20px", fontWeight: 600, borderBottomWidth: "3px" }}
            >
              {t === "scans" ? "Scan History" : `Quarantine (${quarantine.length})`}
            </button>
          ))}
        </div>

        {tab === "scans" && (
          <div className="bg-console-panel border border-console-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-console-border">
              <input
                type="text"
                placeholder="Search by file path or family…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-console-bg border border-console-border rounded-lg px-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-signal-safe/50"
              />
            </div>
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="text-xs font-mono text-slate-500 uppercase sticky top-0 bg-console-panel">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Time</th>
                    <th className="text-left px-5 py-3 font-medium">File</th>
                    <th className="text-left px-5 py-3 font-medium">Family</th>
                    <th className="text-left px-5 py-3 font-medium">Confidence</th>
                    <th className="text-left px-5 py-3 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-600 font-mono py-10 text-sm">
                        No scans yet. Drop a file into your watched folder, or click Scan File above.
                      </td>
                    </tr>
                  )}
                  {filteredScans.map((s, i) => (
                    <tr key={i} className="border-t border-console-border hover:bg-white/[0.03]">
                      <td className="px-5 py-3 font-mono text-slate-500 text-xs whitespace-nowrap">
                        {s.timestamp ? new Date(s.timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-300 truncate max-w-[300px]">
                        {s.file_path}
                      </td>
                      <td className="px-5 py-3 font-mono" style={{ color: FAMILY_COLORS[s.predicted_family] || "#94A3B8" }}>
                        {s.predicted_family}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">
                        {s.confidence ? (s.confidence * 100).toFixed(1) + "%" : "—"}
                      </td>
                      <td className="px-5 py-3">
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
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="text-xs font-mono text-slate-500 uppercase sticky top-0 bg-console-panel">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">ID</th>
                    <th className="text-left px-5 py-3 font-medium">Original File</th>
                    <th className="text-left px-5 py-3 font-medium">Family</th>
                    <th className="text-left px-5 py-3 font-medium">Quarantined At</th>
                    <th className="text-left px-5 py-3 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {quarantine.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-600 font-mono py-10 text-sm">
                        Quarantine is empty. No threats isolated yet.
                      </td>
                    </tr>
                  )}
                  {quarantine.map((q) => (
                    <tr key={q.quarantine_id} className="border-t border-console-border hover:bg-white/[0.03]">
                      <td className="px-5 py-3 font-mono text-slate-500 text-xs">{q.quarantine_id}</td>
                      <td className="px-5 py-3 font-mono text-slate-300 truncate max-w-[280px]">
                        {q.original_filename}
                      </td>
                      <td className="px-5 py-3 font-mono text-signal-threat">{q.predicted_family}</td>
                      <td className="px-5 py-3 font-mono text-slate-500 text-xs">
                        {q.quarantine_timestamp ? new Date(q.quarantine_timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">
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
